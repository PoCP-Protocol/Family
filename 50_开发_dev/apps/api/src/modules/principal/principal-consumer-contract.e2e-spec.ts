import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// P0 Runtime Trust consumer contract: consumer routes use account→ACTIVE binding→ACTIVE membership→family.
// Default internal profile remains deterministic/zero-external-call; legacy Principal response contract is preserved.

let app: INestApplication; let baseUrl = ''; let pool: pg.Pool; let familyId: string; let childId: string; let token: string;
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

beforeAll(async () => {
  process.env.DATABASE_URL = getTestDatabaseUrl();
  delete process.env.FPAI_PRINCIPAL_PROVIDER; delete process.env.FPAI_RUNTIME_PROFILE;
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => {
  await cleanFamilyCoreTables(pool);
  familyId = (await pool.query(`insert into families(display_name) values ('consumer-contract') returning family_id`)).rows[0].family_id;
  const guardianId = (await pool.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','监护人') returning person_id`, [familyId])).rows[0].person_id;
  childId = (await pool.query(`insert into persons(family_id, person_type, display_name, birth_date) values ($1,'CHILD','孩子','2012-06-01') returning person_id`, [familyId])).rows[0].person_id;
  const accountId = (await pool.query(`insert into accounts(status) values ('ACTIVE') returning account_id`)).rows[0].account_id;
  await pool.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [accountId, guardianId]);
  await pool.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now())`, [familyId, guardianId]);
  token = `fam_${randomUUID()}`;
  await pool.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now() + interval '1 day')`, [sha256(token), accountId]);
});
afterAll(async () => { await app.close(); await pool.end(); });

function bearerHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...extra };
}
async function ask(message: string) {
  const s = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, { method: 'POST', headers: bearerHeaders(), body: JSON.stringify({ subject_ref: childId }) });
  expect(s.status).toBe(201);
  const sid = (await s.json() as { session_id: string }).session_id;
  const m = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}/messages`, { method: 'POST', headers: bearerHeaders(), body: JSON.stringify({ subject_ref: childId, message }) });
  return { status: m.status, body: await m.json() as Record<string, any> };
}

describe('P0 strict consumer auth and legacy response contract', () => {
  it('x-actor-id-only consumer request → 401', async () => {
    const response = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-actor-id': 'forged-person' }, body: JSON.stringify({ subject_ref: childId }),
    });
    expect(response.status).toBe(401);
  });

  it('cookie-auth cross-origin mutation → 403; Bearer mutation remains usable for controlled API clients', async () => {
    process.env.PLATFORM_ALLOWED_ORIGINS = 'https://app.family.example';
    try {
      const cookie = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, {
        method: 'POST', headers: { 'content-type': 'application/json', cookie: `fam_session=${token}`, origin: 'https://evil.example' }, body: JSON.stringify({ subject_ref: childId }),
      });
      expect(cookie.status).toBe(403);
      const bearer = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, { method: 'POST', headers: bearerHeaders({ origin: 'https://evil.example' }), body: JSON.stringify({ subject_ref: childId }) });
      expect(bearer.status).toBe(201);
    } finally { delete process.env.PLATFORM_ALLOWED_ORIGINS; }
  });

  it('NORMAL: response carries the exact legacy fields principal.js renders', async () => {
    const { status, body } = await ask('孩子一回家就玩手机,一说就顶嘴');
    expect(status).toBe(201);
    expect(body.risk_route).toBe('NORMAL');
    expect(body.human_handoff).toBe(false);
    expect(body.action_proposal_id).toBeTruthy();
    for (const field of ['opening', 'what_i_hear', 'possible_pattern', 'one_small_action']) {
      expect(typeof body.response?.[field]).toBe('string');
      expect(body.response[field].length).toBeGreaterThan(0);
    }
  });

  it('HIGH_RISK: safety-card contract plus durable family/subject handoff trace (no response, proposal, or release)', async () => {
    const { body } = await ask('孩子说不想活了');
    expect(body.risk_route).toBe('HIGH_RISK');
    expect(body.human_handoff).toBe(true);
    expect(body.response_id).toBeNull();
    expect(body.action_proposal_id).toBeNull();
    const handoff = await pool.query(
      `select family_id,subject_ref,risk_route,status,response_id,released_at from principal_human_handoffs order by created_at desc limit 1`,
    );
    expect(handoff.rows[0]).toMatchObject({ family_id: familyId, subject_ref: childId, risk_route: 'HIGH_RISK', status: 'OPEN', response_id: null, released_at: null });
    expect(Number((await pool.query('select count(*) n from principal_action_proposals')).rows[0].n)).toBe(0);
  });

  it('confirm without active priority -> non-2xx (honest guidance, not false success)', async () => {
    const { body } = await ask('孩子作业拖拉磨蹭');
    const accept = await fetch(`${baseUrl}/families/${familyId}/principal/proposals/${body.action_proposal_id}/accept`, {
      method: 'POST', headers: bearerHeaders(), body: JSON.stringify({ onboarding_id: '00000000-0000-0000-0000-000000000000', priority_id: '00000000-0000-0000-0000-000000000000', idempotency_key: 'wf1c-contract-1' }),
    });
    expect(accept.ok).toBe(false);
    expect(accept.status).toBeGreaterThanOrEqual(400);
  });
});
