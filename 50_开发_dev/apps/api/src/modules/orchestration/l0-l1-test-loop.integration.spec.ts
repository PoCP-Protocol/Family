/**
 * ARCH-GO-TEST-FULL-FUNCTION-001
 * 环境状态: DEV_IMPLEMENTING / PROD_HOLD
 *
 * 真实 PostgreSQL 测试库中的合成数据集成测试。测试 family/person/consent 全部临时构造，
 * 不读取真实家庭/儿童数据；本套件的通过不构成 TEST_VALIDATED 或生产/试点授权。
 */
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';
import { SYNTHETIC_FIXTURE_VERSION } from './test-fixtures/synthetic-admitted-candidates';

let app: INestApplication | undefined;
let baseUrl = '';
let pool: pg.Pool | undefined;
const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set');
  process.env.DATABASE_URL = url;
  process.env.FAMILY_TEST_FULL_LOOP_ENABLED = 'true';
  process.env.NODE_ENV = 'development';
  delete process.env.FPAI_RUNTIME_PROFILE;
  delete process.env.MODEL_ASSISTANT_ENABLED;
  pool = createTestPool();
  await pool.query('select 1');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
afterAll(async () => {
  await app?.close();
  await pool?.end();
  delete process.env.FAMILY_TEST_FULL_LOOP_ENABLED;
});
beforeEach(async () => { await cleanFamilyCoreTables(pool!); });

interface Seed { familyId: string; guardianId: string; childId: string; token: string; }
async function seedSyntheticGuardian(opts: { service?: boolean } = {}): Promise<Seed> {
  const p = pool!;
  const familyId = (await p.query(`insert into families(display_name) values ('TEST_ONLY_SYNTHETIC Family') returning family_id`)).rows[0].family_id;
  const guardianId = (await p.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','TEST_ONLY 监护人') returning person_id`, [familyId])).rows[0].person_id;
  const childId = (await p.query(`insert into persons(family_id, person_type, display_name, birth_date) values ($1,'CHILD','TEST_ONLY 孩子','2012-06-01') returning person_id`, [familyId])).rows[0].person_id;
  if (opts.service ?? true) await p.query(`insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at) values ($1,$2,$3,'SERVICE','GRANTED','test-only',now())`, [familyId, childId, guardianId]);
  const accountId = (await p.query(`insert into accounts(status) values ('ACTIVE') returning account_id`)).rows[0].account_id;
  await p.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [accountId, guardianId]);
  await p.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now())`, [familyId, guardianId]);
  const token = `test_loop_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now()+interval '1 day')`, [sha256(token), accountId]);
  return { familyId, guardianId, childId, token };
}
function headers(token?: string, correlationId = `l0l1-${randomUUID()}`, extra: Record<string, string> = {}): Record<string, string> {
  return { 'content-type': 'application/json', 'x-correlation-id': correlationId, ...(token ? { cookie: `fam_session=${token}` } : {}), ...extra };
}
async function request(path: string, method: 'GET' | 'POST', token?: string, body?: unknown, correlationId?: string, extra: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, { method, headers: headers(token, correlationId, extra), ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}) });
  return { status: response.status, json: () => response.json() as Promise<any> };
}
async function count(table: string): Promise<number> { return Number((await pool!.query(`select count(*) n from ${table}`)).rows[0].n); }

async function createSyntheticIntent(seed: Seed, correlationId: string): Promise<{ need: any; intent: any }> {
  const needResponse = await request(`/families/${seed.familyId}/orchestration/test-loop/need`, 'POST', seed.token, { need_choice: 'CALM_CONVERSATION' }, correlationId, { 'idempotency-key': `need-${randomUUID()}` });
  expect(needResponse.status).toBe(201);
  const need = await needResponse.json();
  const intentResponse = await request(`/families/${seed.familyId}/orchestration/test-loop/intent`, 'POST', seed.token, { need_ref: need.need_ref, intent_choice: 'READ_AND_DISCUSS' }, correlationId, { 'idempotency-key': `intent-${randomUUID()}` });
  expect(intentResponse.status).toBe(201);
  return { need, intent: await intentResponse.json() };
}

describe('DEV synthetic L0 → L1 full loop', () => {
  it('runs Need → Intent → equal candidates → Decision-only → audit with zero Plan/Case/AI/external execution', async () => {
    const seed = await seedSyntheticGuardian();
    const correlationId = `golden-${randomUUID()}`;
    const capability = await request(`/families/${seed.familyId}/orchestration/test-loop/capability`, 'GET', seed.token, undefined, correlationId);
    expect(capability.status).toBe(200);
    expect(await capability.json()).toMatchObject({ enabled: true, mode: 'DEV_SYNTHETIC_ONLY', environment_status: 'DEV_IMPLEMENTING' });

    const { need, intent } = await createSyntheticIntent(seed, correlationId);
    expect(need).toMatchObject({ next_state: 'INTENT', allowed_state_upper_bound: 'NEED' });
    expect(intent).toMatchObject({ next_state: 'CANDIDATES', allowed_state_upper_bound: 'INTENT' });

    const candidateResponse = await request(`/families/${seed.familyId}/orchestration/test-loop/intents/${intent.intent_id}/candidates`, 'GET', seed.token, undefined, correlationId);
    expect(candidateResponse.status).toBe(200);
    const candidates = await candidateResponse.json();
    expect(candidates).toMatchObject({ fixture_version: SYNTHETIC_FIXTURE_VERSION, safe_stop: null, allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES' });
    expect(candidates.candidates).toHaveLength(2);
    for (const candidate of candidates.candidates) {
      expect(candidate).not.toHaveProperty('rank');
      expect(candidate).not.toHaveProperty('recommended_offer_refs');
      expect(candidate.source_label).toBe('TEST_ONLY_SYNTHETIC_FIXTURE');
      expect(candidate.text_equivalent).toContain('平台不对候选排序');
    }

    const decisionResponse = await request(`/families/${seed.familyId}/orchestration/test-loop/decisions`, 'POST', seed.token, {
      intent_id: intent.intent_id,
      fixture_version: candidates.fixture_version,
      candidate_ref: candidates.candidates[0].offer_ref,
      decision_type: 'SELECT',
    }, correlationId, { 'idempotency-key': `decision-${randomUUID()}` });
    expect(decisionResponse.status).toBe(201);
    expect(await decisionResponse.json()).toMatchObject({
      outcome: 'DECISION_RECORDED', allowed_state_upper_bound: 'DECISION', action_started: false, plan_id: null, case_id: null,
      mock_executor: { executor: 'MOCK_EXECUTOR_ONLY', status: 'MOCK_EXECUTOR_ACKNOWLEDGED', delivery_started: false },
    });
    expect(await count('family_service_decisions')).toBe(1);
    expect(await count('orchestration_plans')).toBe(0);
    expect(await count('service_cases')).toBe(0);
    expect(await count('service_contributions')).toBe(0);

    const audit = await request(`/families/${seed.familyId}/orchestration/test-loop/audit/${correlationId}`, 'GET', seed.token, undefined, correlationId);
    expect(audit.status).toBe(200);
    const entries = (await audit.json()).entries;
    expect(entries.map((entry: any) => entry.input_category)).toEqual(['NEED', 'INTENT', 'CANDIDATES', 'DECISION']);
    expect(entries.every((entry: any) => entry.action_started === false)).toBe(true);
  });

  it('records L1 NO_ACTION with zero Plan/Case/Task/Reminder semantics', async () => {
    const seed = await seedSyntheticGuardian();
    const correlationId = `no-action-${randomUUID()}`;
    const { intent } = await createSyntheticIntent(seed, correlationId);
    const response = await request(`/families/${seed.familyId}/orchestration/test-loop/decisions`, 'POST', seed.token, {
      intent_id: intent.intent_id,
      fixture_version: SYNTHETIC_FIXTURE_VERSION,
      decision_type: 'DISMISS',
    }, correlationId, { 'idempotency-key': `dismiss-${randomUUID()}` });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ outcome: 'NO_ACTION', allowed_state_upper_bound: 'NO_ACTION', action_started: false, plan_id: null, case_id: null, mock_executor: null });
    expect(await count('family_service_decisions')).toBe(1);
    expect(await count('orchestration_plans')).toBe(0);
    expect(await count('service_cases')).toBe(0);
  });

  it('fails closed for missing SERVICE consent with zero Need/Intent/Decision writes', async () => {
    const seed = await seedSyntheticGuardian({ service: false });
    const response = await request(`/families/${seed.familyId}/orchestration/test-loop/need`, 'POST', seed.token, { need_choice: 'CALM_CONVERSATION' }, `consent-${randomUUID()}`);
    expect(response.status).toBe(403);
    expect(await count('growth_need_inputs')).toBe(0);
    expect(await count('growth_intents')).toBe(0);
    expect(await count('family_service_decisions')).toBe(0);
  });

  it('has fixed no-network Gateway/L2-L3/Human stubs and rejects disabled feature gate', async () => {
    const seed = await seedSyntheticGuardian();
    expect(await (await request(`/families/${seed.familyId}/orchestration/test-loop/stubs/gateway`, 'POST', seed.token, {}, `stub-${randomUUID()}`)).json()).toMatchObject({ status: 'NOT_ENABLED', external_model_called: false, training_used: false });
    expect(await (await request(`/families/${seed.familyId}/orchestration/test-loop/stubs/intake`, 'POST', seed.token, { category: 'ADT_OR_BIOMETRIC' }, `stub-${randomUUID()}`)).json()).toMatchObject({ status: 'HOLD', questions_collected: false, score_calculated: false, report_generated: false });
    expect(await (await request(`/families/${seed.familyId}/orchestration/test-loop/stubs/human-gate`, 'POST', seed.token, {}, `stub-${randomUUID()}`)).json()).toMatchObject({ status: 'HUMAN_GATE_REQUIRED', external_contacted: false, appointment_created: false });

    delete process.env.FAMILY_TEST_FULL_LOOP_ENABLED;
    try {
      expect((await request(`/families/${seed.familyId}/orchestration/test-loop/capability`, 'GET', seed.token, undefined, `off-${randomUUID()}`)).status).toBe(403);
    } finally {
      process.env.FAMILY_TEST_FULL_LOOP_ENABLED = 'true';
    }
  });

  it('registers all 34 pages and fails closed without a configured LLM credential while persisting metadata-only audit', async () => {
    const seed = await seedSyntheticGuardian();
    const correlationId = `llm-missing-${randomUUID()}`;
    delete process.env.FAMILY_LLM_ENABLED;
    delete process.env.FAMILY_LLM_API_KEY;
    delete process.env.FAMILY_LLM_API_BASE;
    delete process.env.FAMILY_LLM_MODEL;

    const pageRegistry = await request(`/families/${seed.familyId}/orchestration/test-loop/llm/pages`, 'GET', seed.token, undefined, correlationId);
    expect(pageRegistry.status).toBe(200);
    expect((await pageRegistry.json()).pages).toHaveLength(34);

    const draftResponse = await request(`/families/${seed.familyId}/orchestration/test-loop/llm/draft`, 'POST', seed.token, {
      page_id: 'UI-03', fixture_version: SYNTHETIC_FIXTURE_VERSION,
    }, correlationId);
    expect(draftResponse.status).toBe(201);
    expect(await draftResponse.json()).toMatchObject({
      decision: 'BLOCK_CONFIGURATION', stop_code: 'LLM_DISABLED', draft: null,
    });
    expect(await count('family_llm_gateway_audits')).toBe(1);

    const replay = await request(`/families/${seed.familyId}/orchestration/test-loop/llm/replay/${correlationId}`, 'GET', seed.token, undefined, correlationId);
    expect(replay.status).toBe(200);
    const entries = (await replay.json()).entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ gateway_decision: 'BLOCK_CONFIGURATION', input_block_reason: 'LLM_DISABLED', model: null });
    expect(JSON.stringify(entries)).not.toMatch(/api[_-]?key|authorization|prompt|response/i);
  });
});
