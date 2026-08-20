import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { AuthService } from '../auth/auth.service';
import { createTestPool, getTestDatabaseUrl } from '../../test/test-database';

/**
 * IAM-103 FULL(M3-MOS-CLOSEOUT-WAVE-2 Lane A):真实 Bearer 认证 + family scope + reviewer 授权强制。
 * FPAI_REQUIRE_BEARER=true 下:x-actor-id-only 消费路径必拒;消费者 Bearer→Account→ACTIVE binding→ACTIVE membership→family scope。
 */
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const JSONH = { 'content-type': 'application/json' };

describe('IAM-103 FULL — Bearer enforcement (real PostgreSQL)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let pool: pg.Pool;
  let auth: AuthService;
  const prevRequireBearer = process.env.FPAI_REQUIRE_BEARER;
  const prevReviewerAuth = process.env.FPAI_REQUIRE_REVIEWER_AUTH;
  const prevReviewerIds = process.env.FPAI_REVIEWER_IDS;

  beforeAll(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    process.env.FPAI_REQUIRE_BEARER = 'true';       // IAM-103 消费强制
    process.env.FPAI_INTERNAL_OPS = 'true';
    pool = createTestPool();
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    auth = app.get(AuthService);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });
  afterAll(async () => {
    await app.close(); await pool.end();
    process.env.FPAI_REQUIRE_BEARER = prevRequireBearer;
    process.env.FPAI_REQUIRE_REVIEWER_AUTH = prevReviewerAuth;
    process.env.FPAI_REVIEWER_IDS = prevReviewerIds;
  });

  let familyId: string;
  let personId: string;
  let consumerToken: string;
  beforeEach(async () => {
    const f = await pool.query(`insert into families(display_name) values ('IAM家庭') returning family_id`);
    familyId = f.rows[0].family_id;
    const p = await pool.query(
      `insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','家长') returning person_id`, [familyId]);
    personId = p.rows[0].person_id;
    const issued = await auth.issueAccountSession(`iam-103-${familyId}`);
    consumerToken = issued.token;
    await pool.query(
      `insert into account_person_bindings(account_id, person_id, status) values ($1, $2, 'ACTIVE')`,
      [issued.account_id, personId],
    );
    await pool.query(
      `insert into family_memberships(family_id, person_id, role, status, joined_at)
       values ($1, $2, 'OWNER_GUARDIAN', 'ACTIVE', now())`,
      [familyId, personId],
    );
    process.env.FPAI_REQUIRE_REVIEWER_AUTH = 'off';
    process.env.FPAI_REVIEWER_IDS = '';
  });

  const bearer = (token: string) => ({ authorization: `Bearer ${token}`, ...JSONH });
  const createSession = (headers: Record<string, string>) =>
    fetch(`${baseUrl}/families/${familyId}/principal/sessions`, { method: 'POST', headers, body: JSON.stringify({ subject_ref: 'child-1' }) });

  it('VALID_BEARER (family member) → createSession 201', async () => {
    const res = await createSession(bearer(consumerToken));
    expect(res.status).toBe(201);
  });

  it('NO_BEARER when FPAI_REQUIRE_BEARER=true → 401', async () => {
    const res = await createSession({ ...JSONH });
    expect(res.status).toBe(401);
  });

  it('x-actor-id ONLY when require=true → DENY (401)', async () => {
    const res = await createSession({ 'x-actor-id': personId, ...JSONH });
    expect(res.status).toBe(401);
  });

  it('EXPIRED_BEARER → 401', async () => {
    const token = 'fam_expired_token_xyz';
    const issued = await auth.issueAccountSession(`iam-103-expired-${familyId}`);
    await pool.query(
      `update identity_sessions
          set token_hash = $1, expires_at = now() - interval '1 day'
        where session_id = (
          select session_id from identity_sessions
           where account_ref = $2
           order by created_at desc
           limit 1
        )`,
      [sha256(token), issued.account_id],
    );
    const res = await createSession(bearer(token));
    expect(res.status).toBe(401);
  });

  it('REVOKED_BEARER → 401', async () => {
    expect(await auth.revoke(consumerToken)).toBe(true);
    const res = await createSession(bearer(consumerToken));
    expect(res.status).toBe(401);
  });

  it('WRONG_FAMILY (valid token, other family) → 403', async () => {
    const other = await pool.query(`insert into families(display_name) values ('别的家庭') returning family_id`);
    const otherFamilyId = other.rows[0].family_id as string;
    const otherPerson = await pool.query(
      `insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','别家长') returning person_id`, [otherFamilyId]);
    const issued = await auth.issueAccountSession(`iam-103-other-${otherFamilyId}`);
    await pool.query(
      `insert into account_person_bindings(account_id, person_id, status) values ($1, $2, 'ACTIVE')`,
      [issued.account_id, otherPerson.rows[0].person_id],
    );
    await pool.query(
      `insert into family_memberships(family_id, person_id, role, status, joined_at)
       values ($1, $2, 'OWNER_GUARDIAN', 'ACTIVE', now())`,
      [otherFamilyId, otherPerson.rows[0].person_id],
    );
    const res = await createSession(bearer(issued.token)); // 用别家 account token 访问本 family 路径
    expect(res.status).toBe(403);
  });

  it('VALID_FAMILY_MEMBER → Principal message 201 + no canonical growth write (Named Action 不被绕过)', async () => {
    const s = await createSession(bearer(consumerToken));
    const sid = (await s.json() as { session_id: string }).session_id;
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}/messages`,
      { method: 'POST', headers: bearer(consumerToken), body: JSON.stringify({ subject_ref: 'child-1', message: '孩子写作业拖拉，我该怎么说？' }) });
    expect(res.status).toBe(201);
    // CANONICAL_WRITE_BYPASS = 0:Principal 消息不得直接写 growth canonical(growth_actions)。
    const gw = await pool.query(`select count(*)::int n from growth_actions where family_id=$1`, [familyId]);
    expect(gw.rows[0].n).toBe(0);
  });

  it('NON_REVIEWER (valid bearer, not in allowlist) → handoffs 403', async () => {
    process.env.FPAI_REQUIRE_REVIEWER_AUTH = 'on';
    process.env.FPAI_REVIEWER_IDS = 'some-other-reviewer';
    const { token } = await auth.issueSession(personId, familyId, null);
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/handoffs`, { headers: { authorization: `Bearer ${token}` } });
    expect(res.status).toBe(403);
  });

  it('VALID_REVIEWER (bearer person in allowlist) → handoffs 200', async () => {
    process.env.FPAI_REQUIRE_REVIEWER_AUTH = 'on';
    process.env.FPAI_REVIEWER_IDS = personId; // 认证身份 + reviewer 授权
    const { token } = await auth.issueSession(personId, familyId, null);
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/handoffs`, { headers: { authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
  });
});
