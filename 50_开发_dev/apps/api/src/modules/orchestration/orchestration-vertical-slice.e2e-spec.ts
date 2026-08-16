/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · Golden Product E2E + Security 矩阵(真实 Postgres + HTTP)。
 * 证明:家长从"孩子刚摔门"到得到 AI 帮助、被跟进、第二次记得上次;且严格鉴权/T2 fail-closed 成立。
 * 断言:GrowthPriority=0 / InterventionEpisode=0 / canonical Observation 自动写=0。
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
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) throw new Error('REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set');
  process.env.DATABASE_URL = testDatabaseUrl;
  pool = createTestPool();
  await pool.query('select 1');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => { await cleanFamilyCoreTables(pool!); });
afterAll(async () => { await app?.close(); await pool?.end(); });

interface SeitchedFamily { familyId: string; guardianId: string; childId: string; token: string; }

/** 播种一个可用会话:family + guardian(OWNER_GUARDIAN ACTIVE)+ child + AI consent + account/binding/session。 */
async function seedGuardianSession(opts: { consent?: 'GRANTED' | 'WITHDRAWN' } = {}): Promise<SeitchedFamily> {
  const p = pool!;
  const fam = await p.query(`insert into families(display_name) values ('Slice E2E 家庭') returning family_id`);
  const familyId = fam.rows[0].family_id;
  const g = await p.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','妈妈') returning person_id`, [familyId]);
  const guardianId = g.rows[0].person_id;
  const c = await p.query(`insert into persons(family_id, person_type, display_name, birth_date) values ($1,'CHILD','孩子','2012-06-01') returning person_id`, [familyId]);
  const childId = c.rows[0].person_id;
  await p.query(
    `insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at${opts.consent === 'WITHDRAWN' ? ', withdrawn_at' : ''})
       values ($1,$2,$3,'AI_PERSONALIZATION',$4,'policy-ai-v1', now()${opts.consent === 'WITHDRAWN' ? ', now()' : ''})`,
    [familyId, childId, guardianId, opts.consent ?? 'GRANTED'],
  );
  const acct = await p.query(`insert into accounts(status) values ('ACTIVE') returning account_id`);
  const accountId = acct.rows[0].account_id;
  await p.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [accountId, guardianId]);
  await p.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE', now())`, [familyId, guardianId]);
  const token = `fam_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2, now() + interval '1 day')`, [sha256(token), accountId]);
  return { familyId, guardianId, childId, token };
}

function h(token?: string, extra: Record<string, string> = {}): Record<string, string> {
  return { 'content-type': 'application/json', 'x-correlation-id': `corr-${randomUUID()}`, ...(token ? { cookie: `fam_session=${token}` } : {}), ...extra };
}
interface Res { status: number; json: () => Promise<any>; }
async function post(path: string, token: string | undefined, body: Record<string, unknown>, extra: Record<string, string> = {}): Promise<Res> {
  const r = await fetch(`${baseUrl}${path}`, { method: 'POST', headers: h(token, extra), body: JSON.stringify(body) });
  return { status: r.status, json: () => r.json() as Promise<any> };
}
async function get(path: string, token?: string, extra: Record<string, string> = {}): Promise<Res> {
  const r = await fetch(`${baseUrl}${path}`, { method: 'GET', headers: h(token, extra) });
  return { status: r.status, json: () => r.json() as Promise<any> };
}
async function count(sql: string): Promise<number> {
  const r = await pool!.query(sql);
  return Number((r.rows[0] as { n: string }).n);
}

describe('Golden Product E2E:首个真实家庭帮助闭环', () => {
  it('孩子摔门 → 需求 → 显式确认 → 推荐 → 决定 → AI帮助 → 回访 → 第二次 Context Reuse(无 GrowthPriority/Intervention/canonical)', async () => {
    const s = await seedGuardianSession();

    // HOME
    const home = await get(`/families/${s.familyId}/home`, s.token);
    expect(home.status).toBe(200);
    expect((await home.json()).prompt).toContain('需要 Family 帮忙');

    // ① 表达需求
    const needRes = await post(`/families/${s.familyId}/orchestration/needs`, s.token, { subject_person_id: s.childId, raw_text: '孩子刚摔门，我今晚不知道怎么重新开口' });
    expect(needRes.status).toBe(201);
    const need = await needRes.json();
    expect(need.supported).toBe(true);
    expect(need.proposed_need_type).toBe('PARENT_CHILD_COMMUNICATION_CONFLICT');

    // ② 显式确认 Intent
    const intentRes = await post(`/families/${s.familyId}/orchestration/intents`, s.token, { subject_person_id: s.childId, signal_id: need.signal_id, goal_text: '今晚怎么重新开口，先别再吵' });
    const intent = await intentRes.json();
    expect(intent.required_capability_keys.sort()).toEqual(['COMMUNICATION_REOPENING', 'DE_ESCALATION']);

    // ③ 推荐(T1 eligibility + 确定性排序)
    const recRes = await post(`/families/${s.familyId}/orchestration/intents/${intent.intent_id}/recommendations`, s.token, { subject_person_id: s.childId });
    const rec = await recRes.json();
    expect(rec.recommended_offer_refs.length).toBeGreaterThan(0);
    expect(rec.uncovered_capability_keys).toEqual([]);

    // ④ 家庭决定(ACCEPT == recommended)→ T2 → ServiceCase + AI_COACH
    const decRes = await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
      subject_person_id: s.childId, intent_id: intent.intent_id, recommendation_id: rec.recommendation_id,
      recommendation_version: rec.version, decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: rec.recommended_offer_refs,
      goal_message: '孩子刚摔门，我今晚不知道怎么重新开口',
    });
    const dec = await decRes.json();
    expect(dec.outcome).toBe('SERVICE_STARTED');
    expect(dec.case_id).toBeTruthy();
    expect(dec.ai_coach.risk_route).toBe('NORMAL');

    // ⑤ 查看 case
    const caseRes = await get(`/families/${s.familyId}/orchestration/cases/${dec.case_id}`, s.token);
    expect((await caseRes.json()).status).toBe('IN_PROGRESS');

    // ⑥ 回访 helpfulness
    const fuRes = await post(`/families/${s.familyId}/orchestration/cases/${dec.case_id}/followups`, s.token, { helpfulness: 'SOMEWHAT_HELPFUL', text: '感觉好一点' });
    expect(fuRes.status).toBe(201);

    // ⑦ 第二次同类 → Context Reuse
    const reuseRes = await get(`/families/${s.familyId}/orchestration/context-reuse?subject_person_id=${s.childId}`, s.token);
    const reuse = await reuseRes.json();
    expect(reuse.prior_case_ref).toBe(dec.case_id);
    expect(reuse.reuse_statements.length).toBeGreaterThan(0);
    // 禁因果断言
    expect(reuse.reuse_statements.join(' ')).not.toContain('已证明');

    // 断言:无 canonical 写
    expect(await count('select count(*) n from growth_priorities')).toBe(0);
    expect(await count('select count(*) n from intervention_episodes')).toBe(0);
    expect(await count('select count(*) n from outcome_observations')).toBe(0);
  });
});

describe('Security E2E 矩阵', () => {
  it('无会话 → 401', async () => {
    const s = await seedGuardianSession();
    const r = await post(`/families/${s.familyId}/orchestration/needs`, undefined, { subject_person_id: s.childId, raw_text: '摔门' });
    expect(r.status).toBe(401);
  });

  it('仅 x-actor-id(无 cookie/bearer)→ 401(CONSUMER_X_ACTOR_ID_TRUST=0)', async () => {
    const s = await seedGuardianSession();
    const r = await post(`/families/${s.familyId}/orchestration/needs`, undefined, { subject_person_id: s.childId, raw_text: '摔门' }, { 'x-actor-id': s.guardianId });
    expect(r.status).toBe(401);
  });

  it('会话有效但访问别的家庭 → 403', async () => {
    const a = await seedGuardianSession();
    const b = await seedGuardianSession();
    const r = await get(`/families/${b.familyId}/home`, a.token);
    expect(r.status).toBe(403);
  });

  it('撤销 membership → 403', async () => {
    const s = await seedGuardianSession();
    await pool!.query(`update family_memberships set status='REVOKED', revoked_at=now() where family_id=$1 and person_id=$2`, [s.familyId, s.guardianId]);
    const r = await get(`/families/${s.familyId}/home`, s.token);
    expect(r.status).toBe(403);
  });

  it('CHILD_SUBJECT 决定服务 → 403', async () => {
    const s = await seedGuardianSession();
    // 给 child 绑定一个 account + CHILD_SUBJECT membership + session
    const acct = await pool!.query(`insert into accounts(status) values ('ACTIVE') returning account_id`);
    const accountId = acct.rows[0].account_id;
    await pool!.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [accountId, s.childId]);
    await pool!.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'CHILD_SUBJECT','ACTIVE', now())`, [s.familyId, s.childId]);
    const childToken = `fam_${randomUUID()}`;
    await pool!.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2, now() + interval '1 day')`, [sha256(childToken), accountId]);
    const r = await post(`/families/${s.familyId}/orchestration/decisions`, childToken, {
      subject_person_id: s.childId, intent_id: randomUUID(), recommendation_id: randomUUID(), recommendation_version: 1, decision_type: 'DISMISS', selected_offer_refs: [],
    });
    expect(r.status).toBe(403);
  });

  it('T1 eligible 但 T2 consent 撤销 → RE_RECOMMEND_REQUIRED(fail-closed,不执行不静默替换)', async () => {
    const s = await seedGuardianSession();
    const need: any = await (await post(`/families/${s.familyId}/orchestration/needs`, s.token, { subject_person_id: s.childId, raw_text: '孩子摔门，怎么重新开口' })).json();
    const intent: any = await (await post(`/families/${s.familyId}/orchestration/intents`, s.token, { subject_person_id: s.childId, signal_id: need.signal_id, goal_text: '先别吵，怎么重新开口' })).json();
    const rec: any = await (await post(`/families/${s.familyId}/orchestration/intents/${intent.intent_id}/recommendations`, s.token, { subject_person_id: s.childId })).json();
    // T1 已 eligible(AI_COACH 在推荐里)。现在撤销 consent。
    await pool!.query(`update consents set status='WITHDRAWN', withdrawn_at=now() where family_id=$1 and subject_person_id=$2 and purpose='AI_PERSONALIZATION'`, [s.familyId, s.childId]);
    const dec = await (await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
      subject_person_id: s.childId, intent_id: intent.intent_id, recommendation_id: rec.recommendation_id,
      recommendation_version: rec.version, decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: rec.recommended_offer_refs,
    })).json();
    expect(dec.outcome).toBe('RE_RECOMMEND_REQUIRED');
    expect(dec.case_id).toBeNull();
    // 未创建执行 case
    expect(await count(`select count(*) n from service_cases`)).toBe(0);
  });

  it('决定完整性:ACCEPT 注入非推荐 offer → 400', async () => {
    const s = await seedGuardianSession();
    const need: any = await (await post(`/families/${s.familyId}/orchestration/needs`, s.token, { subject_person_id: s.childId, raw_text: '孩子摔门，怎么重新开口' })).json();
    const intent: any = await (await post(`/families/${s.familyId}/orchestration/intents`, s.token, { subject_person_id: s.childId, signal_id: need.signal_id, goal_text: '重新开口' })).json();
    const rec: any = await (await post(`/families/${s.familyId}/orchestration/intents/${intent.intent_id}/recommendations`, s.token, { subject_person_id: s.childId })).json();
    const r = await post(`/families/${s.familyId}/orchestration/decisions`, s.token, {
      subject_person_id: s.childId, intent_id: intent.intent_id, recommendation_id: rec.recommendation_id,
      recommendation_version: rec.version, decision_type: 'ACCEPT_RECOMMENDATION', selected_offer_refs: ['offer:bogus:999'],
    });
    expect(r.status).toBe(400);
  });
});
