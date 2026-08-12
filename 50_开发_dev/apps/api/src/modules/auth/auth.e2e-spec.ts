import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// IAM-101 身份会话 E2E(真实 PostgreSQL)。令牌机制 + 服务端可信 actor 解析 + 家庭绑定。
// 不触碰现有 x-actor-id 路径(消费路径强制 = IAM-103)。

let app: INestApplication; let baseUrl = ''; let pool: pg.Pool;
let familyId: string; let personId: string; let otherFamilyId: string;

beforeAll(async () => {
  process.env.DATABASE_URL = getTestDatabaseUrl();
  process.env.FPAI_INTERNAL_OPS = 'true'; // 允许内部签发(真实验证器 = IAM-102)
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => {
  await cleanFamilyCoreTables(pool);
  familyId = (await pool.query(`insert into families(display_name) values ('IAM fam') returning family_id`)).rows[0].family_id;
  personId = (await pool.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','家长') returning person_id`, [familyId])).rows[0].person_id;
  otherFamilyId = (await pool.query(`insert into families(display_name) values ('other fam') returning family_id`)).rows[0].family_id;
});
afterAll(async () => { await app.close(); await pool.end(); });

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const get = (path: string, headers: Record<string, string> = {}) => fetch(`${baseUrl}${path}`, { headers });

describe('IAM-101 identity session', () => {
  it('issues a session (internal) and whoami resolves the trusted actor from Bearer', async () => {
    const issue = await post('/auth/session', { person_id: personId, family_id: familyId, account_id: 'phone:13800000000' });
    expect(issue.status).toBe(201);
    const { token, person_id, family_id } = await issue.json() as { token: string; person_id: string; family_id: string };
    expect(token).toMatch(/^fam_/);
    expect(person_id).toBe(personId);
    expect(family_id).toBe(familyId);

    const who = await get('/auth/whoami', { authorization: `Bearer ${token}` });
    expect(who.status).toBe(200);
    expect(await who.json()).toMatchObject({ person_id: personId, family_id: familyId, account_id: 'phone:13800000000' });
  });

  it('rejects issuing a session for a person not in the family (no cross-family binding)', async () => {
    const issue = await post('/auth/session', { person_id: personId, family_id: otherFamilyId });
    expect(issue.status).toBe(400);
  });

  it('whoami with invalid / missing token -> 401', async () => {
    expect((await get('/auth/whoami', { authorization: 'Bearer fam_deadbeef' })).status).toBe(401);
    expect((await get('/auth/whoami')).status).toBe(401);
  });

  it('revoked token -> 401', async () => {
    const { token } = await (await post('/auth/session', { person_id: personId, family_id: familyId })).json() as { token: string };
    expect((await get('/auth/whoami', { authorization: `Bearer ${token}` })).status).toBe(200);
    await post('/auth/session/revoke', {}, { authorization: `Bearer ${token}` });
    expect((await get('/auth/whoami', { authorization: `Bearer ${token}` })).status).toBe(401);
  });

  it('expired token -> 401 (server-side expiry enforced)', async () => {
    const token = 'fam_expiredtoken';
    await pool.query(
      `insert into identity_sessions(token_hash, person_id, family_id, expires_at) values ($1,$2,$3, now() - interval '1 hour')`,
      [createHash('sha256').update(token).digest('hex'), personId, familyId],
    );
    expect((await get('/auth/whoami', { authorization: `Bearer ${token}` })).status).toBe(401);
  });

  it('issuance is disabled without FPAI_INTERNAL_OPS (real verifier = IAM-102) -> 404', async () => {
    const prev = process.env.FPAI_INTERNAL_OPS;
    delete process.env.FPAI_INTERNAL_OPS;
    try {
      expect((await post('/auth/session', { person_id: personId, family_id: familyId })).status).toBe(404);
    } finally { process.env.FPAI_INTERNAL_OPS = prev; }
  });
});
