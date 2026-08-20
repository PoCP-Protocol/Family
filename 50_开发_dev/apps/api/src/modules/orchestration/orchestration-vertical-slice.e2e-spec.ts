/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · Golden Product E2E + Security 矩阵(真实 Postgres + HTTP;3A 修正后语义)。
 * 断言:GrowthPriority=0 / InterventionEpisode=0 / GrowthAction=0 / OutcomeObservation=0;subject 服务端派生;
 * 执行类型=所选类型;Intent 在交付时保持 OPEN,回访后才 SERVICE_DELIVERED;T1/T2 exact-offer fail-closed。
 */
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';

let app: INestApplication | undefined;
let baseUrl = '';
let pool: pg.Pool | undefined;
const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set');
  process.env.DATABASE_URL = url;
  pool = createTestPool();
  await pool.query('select 1');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => { await cleanFamilyCoreTables(pool!); });
afterAll(async () => { await app?.close(); await pool?.end(); });

interface Seed { familyId: string; guardianId: string; childId: string; token: string; }
async function seedGuardianSession(opts: { service?: boolean; ai?: boolean; birthDate?: string } = {}): Promise<Seed> {
  const p = pool!;
  const service = opts.service ?? true;
  const ai = opts.ai ?? true;
  const familyId = (await p.query(`insert into families(display_name) values ('Slice 家庭') returning family_id`)).rows[0].family_id;
  const guardianId = (await p.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','妈妈') returning person_id`, [familyId])).rows[0].person_id;
  const childId = (await p.query(`insert into persons(family_id, person_type, display_name, birth_date) values ($1,'CHILD','孩子',$2) returning person_id`, [familyId, opts.birthDate ?? '2012-06-01'])).rows[0].person_id;
  if (service) await p.query(`insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at) values ($1,$2,$3,'SERVICE','GRANTED','pol', now())`, [familyId, childId, guardianId]);
  if (ai) await p.query(`insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at) values ($1,$2,$3,'AI_PERSONALIZATION','GRANTED','pol', now())`, [familyId, childId, guardianId]);
  const acct = (await p.query(`insert into accounts(status) values ('ACTIVE') returning account_id`)).rows[0].account_id;
  await p.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [acct, guardianId]);
  await p.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE', now())`, [familyId, guardianId]);
  const token = `fam_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2, now() + interval '1 day')`, [sha256(token), acct]);
  return { familyId, guardianId, childId, token };
}
function hdr(token?: string, extra: Record<string, string> = {}): Record<string, string> {
  return { 'content-type': 'application/json', 'x-correlation-id': `c-${randomUUID()}`, ...(token ? { cookie: `fam_session=${token}` } : {}), ...extra };
}
interface Res { status: number; json: () => Promise<any>; }
async function post(path: string, token: string | undefined, body: Record<string, unknown>, extra: Record<string, string> = {}): Promise<Res> {
  const r = await fetch(`${baseUrl}${path}`, { method: 'POST', headers: hdr(token, extra), body: JSON.stringify(body) });
  return { status: r.status, json: () => r.json() as Promise<any> };
}
async function get(path: string, token?: string, extra: Record<string, string> = {}): Promise<Res> {
  const r = await fetch(`${baseUrl}${path}`, { method: 'GET', headers: hdr(token, extra) });
  return { status: r.status, json: () => r.json() as Promise<any> };
}
async function count(sql: string): Promise<number> { return Number((await pool!.query(sql)).rows[0].n); }

async function runToRecommendation(s: Seed): Promise<{ intentId: string; rec: any }> {
  const need = await (await post(`/families/${s.familyId}/orchestration/needs`, s.token, { subject_person_id: s.childId, raw_text: '孩子刚摔门，我今晚不知道怎么重新开口' })).json();
  const intent = await (await post(`/families/${s.familyId}/orchestration/intents`, s.token, { signal_id: need.signal_id, goal_text: '今晚怎么重新开口，先别再吵' })).json();
  const rec = await (await post(`/families/${s.familyId}/orchestration/intents/${intent.intent_id}/recommendations`, s.token, {})).json();
  return { intentId: intent.intent_id, rec };
}

describe('Golden Product E2E(3A 修正语义)', () => {
  it('摔门 → 需求 → 显式确认 → 推荐 → 决定 → AI帮助 → 回访 → 服务交付 → 第二次 Context Reuse', async () => {
    const s = await seedGuardianSession();
    expect((await get(`/families/${s.familyId}/home`, s.token)).status).toBe(200);

    const { intentId, rec } = await runToRecommendation(s);
    expect(rec.recommended_offer_refs).toContain('resource:v1:ai_coach');
    expect(rec.uncovered_capability_keys).toEqual([]);
    expect(await count(`select count(*) n from growth_intents where status='OPEN'`)).toBe(1);

    const dec = await (await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
      intent_id: intentId, recommendation_id: rec.recommendation_id, recommendation_version: rec.version,
      decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: rec.recommended_offer_refs,
    })).json();
    expect(dec.outcome).toBe('SERVICE_STARTED');
    expect(dec.executed_resource_type).toBe('AI_COACH');   // 执行类型=所选类型
    expect(dec.ai_coach.risk_route).toBe('NORMAL');
    // 编排 AI_COACH 显式 deliveryMode:完整 Principal 安全管线复用，但 V3 不写 legacy proposal / 不走 acceptProposal。
    expect(await count('select count(*) n from principal_action_proposals')).toBe(0);
    const subjectChain = await pool!.query(
      `select gi.subject_person_id as intent_subject, fsd.subject_person_id as decision_subject, sc.subject_person_id as case_subject
         from growth_intents gi
         join family_service_decisions fsd on fsd.intent_ref=gi.intent_id
         join service_cases sc on sc.intent_ref=gi.intent_id
        where gi.intent_id=$1`, [intentId],
    );
    expect(subjectChain.rows[0]).toMatchObject({ intent_subject: s.childId, decision_subject: s.childId, case_subject: s.childId });

    // 交付后:Case=WAITING_FAMILY;Intent 仍 OPEN(未 SERVICE_DELIVERED)。
    expect((await (await get(`/families/${s.familyId}/orchestration/cases/${dec.case_id}`, s.token)).json()).status).toBe('WAITING_FAMILY');
    expect(await count(`select count(*) n from growth_intents where intent_id='${intentId}' and status='OPEN'`)).toBe(1);

    // 回访 → 服务环完成:Case COMPLETED,Intent CLOSED/SERVICE_DELIVERED。
    expect((await post(`/families/${s.familyId}/orchestration/cases/${dec.case_id}/followups`, s.token, { helpfulness: 'SOMEWHAT_HELPFUL', text: '感觉好一点' })).status).toBe(201);
    expect((await (await get(`/families/${s.familyId}/orchestration/cases/${dec.case_id}`, s.token)).json()).status).toBe('COMPLETED');
    expect(await count(`select count(*) n from growth_intents where intent_id='${intentId}' and status='CLOSED' and close_reason='SERVICE_DELIVERED'`)).toBe(1);

    const reuse = await (await get(`/families/${s.familyId}/orchestration/context-reuse?subject_person_id=${s.childId}`, s.token)).json();
    expect(reuse.prior_case_ref).toBe(dec.case_id);
    expect(reuse.reuse_statements.join(' ')).not.toContain('已证明');

    // 无 canonical 写
    for (const t of ['growth_priorities', 'intervention_episodes', 'growth_actions', 'outcome_observations']) {
      expect(await count(`select count(*) n from ${t}`)).toBe(0);
    }
  });
});

describe('Security / correctness 矩阵(3A)', () => {
  it('无会话 → 401;仅 x-actor-id → 401', async () => {
    const s = await seedGuardianSession();
    expect((await post(`/families/${s.familyId}/orchestration/needs`, undefined, { subject_person_id: s.childId, raw_text: '摔门' })).status).toBe(401);
    expect((await post(`/families/${s.familyId}/orchestration/needs`, undefined, { subject_person_id: s.childId, raw_text: '摔门' }, { 'x-actor-id': s.guardianId })).status).toBe(401);
  });
  it('跨家庭 → 403;撤销 membership → 403', async () => {
    const a = await seedGuardianSession(); const b = await seedGuardianSession();
    expect((await get(`/families/${b.familyId}/home`, a.token)).status).toBe(403);
    await pool!.query(`update family_memberships set status='REVOKED', revoked_at=now() where family_id=$1`, [a.familyId]);
    expect((await get(`/families/${a.familyId}/home`, a.token)).status).toBe(403);
  });
  it('缺 SERVICE consent → requestHelp 403,0 input / 0 signal', async () => {
    const s = await seedGuardianSession({ service: false });
    const r = await post(`/families/${s.familyId}/orchestration/needs`, s.token, { subject_person_id: s.childId, raw_text: '孩子摔门' });
    expect(r.status).toBe(403);
    expect(await count(`select count(*) n from growth_need_inputs`)).toBe(0);
    expect(await count(`select count(*) n from growth_need_signals`)).toBe(0);
  });
  it('年龄越界(11 岁)→ requestHelp 403', async () => {
    const s = await seedGuardianSession({ birthDate: '2015-06-01' });
    expect((await post(`/families/${s.familyId}/orchestration/needs`, s.token, { subject_person_id: s.childId, raw_text: '孩子摔门' })).status).toBe(403);
  });
  it('缺 AI_PERSONALIZATION 但有 SERVICE → Need/Intent 可,AI_COACH T1 不 eligible(NO_ACTION 仍在)', async () => {
    const s = await seedGuardianSession({ ai: false });
    const { rec } = await runToRecommendation(s);
    expect(rec.recommended_offer_refs).not.toContain('resource:v1:ai_coach');
  });
  it('T1 AI_COACH eligible 但 T2 撤销 AI consent → RE_RECOMMEND_REQUIRED,0 ServiceCase', async () => {
    const s = await seedGuardianSession();
    const { intentId, rec } = await runToRecommendation(s);
    expect(rec.recommended_offer_refs).toContain('resource:v1:ai_coach');
    await pool!.query(`update consents set status='WITHDRAWN', withdrawn_at=now() where family_id=$1 and subject_person_id=$2 and purpose='AI_PERSONALIZATION'`, [s.familyId, s.childId]);
    const dec = await (await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
      intent_id: intentId, recommendation_id: rec.recommendation_id, recommendation_version: rec.version,
      decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: rec.recommended_offer_refs,
    })).json();
    expect(dec.outcome).toBe('RE_RECOMMEND_REQUIRED');
    expect(dec.case_id).toBeNull();
    expect(await count(`select count(*) n from service_cases`)).toBe(0);
  });
  it('T1 provider ACTIVE 但 T2 SUSPENDED → RE_RECOMMEND_REQUIRED', async () => {
    const s = await seedGuardianSession();
    const { intentId, rec } = await runToRecommendation(s);
    process.env.FAMILY_TEST_PROVIDER_SUSPENDED = '1';
    try {
      const dec = await (await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
        intent_id: intentId, recommendation_id: rec.recommendation_id, recommendation_version: rec.version,
        decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: rec.recommended_offer_refs,
      })).json();
      expect(dec.outcome).toBe('RE_RECOMMEND_REQUIRED');
    } finally { delete process.env.FAMILY_TEST_PROVIDER_SUSPENDED; }
  });
  it('决定完整性:注入非推荐 offer → 400', async () => {
    const s = await seedGuardianSession();
    const { intentId, rec } = await runToRecommendation(s);
    const r = await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
      intent_id: intentId, recommendation_id: rec.recommendation_id, recommendation_version: rec.version,
      decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: ['resource:v1:bogus'],
    });
    expect(r.status).toBe(400);
  });
  it('跨家庭 subject(别家孩子)→ requestHelp 403', async () => {
    const a = await seedGuardianSession(); const b = await seedGuardianSession();
    const r = await post(`/families/${a.familyId}/orchestration/needs`, a.token, { subject_person_id: b.childId, raw_text: '孩子摔门' });
    expect(r.status).toBe(403);
  });

  it('§16 DISABLED account → 401(会话失效)', async () => {
    const s = await seedGuardianSession();
    await pool!.query(`update accounts set status='DISABLED' where account_id = (select account_ref from identity_sessions where token_hash=$1)`, [sha256(s.token)]);
    expect((await get(`/families/${s.familyId}/home`, s.token)).status).toBe(401);
  });

  it('§17 同 account+family 有 >1 ACTIVE person 上下文 → 403 ambiguous', async () => {
    const s = await seedGuardianSession();
    const acctId = (await pool!.query(`select account_ref from identity_sessions where token_hash=$1`, [sha256(s.token)])).rows[0].account_ref;
    const p2 = (await pool!.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','FATHER','爸爸') returning person_id`, [s.familyId])).rows[0].person_id;
    await pool!.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [acctId, p2]);
    await pool!.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'GUARDIAN','ACTIVE', now())`, [s.familyId, p2]);
    expect((await get(`/families/${s.familyId}/home`, s.token)).status).toBe(403);
  });

  it('§18 cookie 变更请求跨源 → 403 CSRF', async () => {
    const s = await seedGuardianSession();
    process.env.PLATFORM_ALLOWED_ORIGINS = 'https://app.family.example';
    try {
      const r = await post(`/families/${s.familyId}/orchestration/needs`, s.token, { subject_person_id: s.childId, raw_text: '孩子摔门' }, { origin: 'https://evil.example' });
      expect(r.status).toBe(403);
    } finally { delete process.env.PLATFORM_ALLOWED_ORIGINS; }
  });

  it('§21 decide 幂等:同 key 重放不产生第二个 ServiceCase', async () => {
    const s = await seedGuardianSession();
    const { intentId, rec } = await runToRecommendation(s);
    const key = `idem-${randomUUID()}`;
    const body = { intent_id: intentId, recommendation_id: rec.recommendation_id, recommendation_version: rec.version, decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: rec.recommended_offer_refs };
    const d1 = await (await post(`/families/${s.familyId}/orchestration/decisions`, s.token, body, { 'idempotency-key': key })).json();
    const d2 = await (await post(`/families/${s.familyId}/orchestration/decisions`, s.token, body, { 'idempotency-key': key })).json();
    expect(d1.case_id).toBe(d2.case_id);
    expect(await count(`select count(*) n from service_cases`)).toBe(1);
    expect(await count(`select count(*) n from family_service_decisions`)).toBe(1);
    // 同 key 异 request → 409
    const conflict = await post(`/families/${s.familyId}/orchestration/decisions`, s.token, { ...body, decision_type: 'DISMISS', selected_offer_refs: [] }, { 'idempotency-key': key });
    expect(conflict.status).toBe(409);
  });

  it('§21 全链路幂等:RequestHelp/ConfirmIntent/Recommend/FollowUp 同键重放零重复、同键异请求 409', async () => {
    const s = await seedGuardianSession();
    const needKey = `need-${randomUUID()}`;
    const needBody = { subject_person_id: s.childId, raw_text: '孩子刚摔门，我今晚不知道怎么重新开口' };
    const need1 = await (await post(`/families/${s.familyId}/orchestration/needs`, s.token, needBody, { 'idempotency-key': needKey })).json();
    const need2 = await (await post(`/families/${s.familyId}/orchestration/needs`, s.token, needBody, { 'idempotency-key': needKey })).json();
    expect(need2.signal_id).toBe(need1.signal_id);
    expect(await count('select count(*) n from growth_need_signals')).toBe(1);
    expect((await post(`/families/${s.familyId}/orchestration/needs`, s.token, { ...needBody, raw_text: '不同请求' }, { 'idempotency-key': needKey })).status).toBe(409);

    const intentKey = `intent-${randomUUID()}`;
    const intentBody = { signal_id: need1.signal_id, goal_text: '今晚怎么重新开口，先别再吵' };
    const intent1 = await (await post(`/families/${s.familyId}/orchestration/intents`, s.token, intentBody, { 'idempotency-key': intentKey })).json();
    const intent2 = await (await post(`/families/${s.familyId}/orchestration/intents`, s.token, intentBody, { 'idempotency-key': intentKey })).json();
    expect(intent2.intent_id).toBe(intent1.intent_id);
    expect(await count('select count(*) n from growth_intents')).toBe(1);
    expect((await post(`/families/${s.familyId}/orchestration/intents`, s.token, { ...intentBody, goal_text: '不同目标' }, { 'idempotency-key': intentKey })).status).toBe(409);

    const recKey = `recommend-${randomUUID()}`;
    const recPath = `/families/${s.familyId}/orchestration/intents/${intent1.intent_id}/recommendations`;
    const rec1 = await (await post(recPath, s.token, {}, { 'idempotency-key': recKey })).json();
    const rec2 = await (await post(recPath, s.token, {}, { 'idempotency-key': recKey })).json();
    expect(rec2.recommendation_id).toBe(rec1.recommendation_id);
    expect(await count('select count(*) n from resource_recommendations')).toBe(1);

    const dec = await (await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
      intent_id: intent1.intent_id, recommendation_id: rec1.recommendation_id, recommendation_version: rec1.version,
      decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: rec1.recommended_offer_refs,
    }, { 'idempotency-key': `decide-${randomUUID()}` })).json();
    const followupKey = `followup-${randomUUID()}`;
    const followupPath = `/families/${s.familyId}/orchestration/cases/${dec.case_id}/followups`;
    const followupBody = { helpfulness: 'SOMEWHAT_HELPFUL', text: '感觉好一点' };
    const followup1 = await (await post(followupPath, s.token, followupBody, { 'idempotency-key': followupKey })).json();
    const followup2 = await (await post(followupPath, s.token, followupBody, { 'idempotency-key': followupKey })).json();
    expect(followup2.followup_id).toBe(followup1.followup_id);
    expect(await count('select count(*) n from service_followup_responses')).toBe(1);
    expect((await post(followupPath, s.token, { ...followupBody, helpfulness: 'NOT_HELPFUL_YET' }, { 'idempotency-key': followupKey })).status).toBe(409);
  });
});
