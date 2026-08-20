import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { createTestPool, getTestDatabaseUrl } from '../../test/test-database';

const ACTOR = { 'x-correlation-id': 'c-e2e', 'content-type': 'application/json' };
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

async function cleanPrincipal(pool: pg.Pool): Promise<void> {
  for (const t of ['principal_action_proposals', 'principal_feedback', 'principal_model_runs',
    'principal_human_handoffs', 'principal_messages', 'principal_responses', 'principal_sessions',
    'product_events']) {
    await pool.query(`delete from ${t}`);
  }
  // 不删 families:其它 e2e 套件遗留的 persons/growth_* 仍以 FK 引用 families,全表删会被外键挡。
  // 每个用例新建独立 family;Principal 只操作 principal_*/product_events,与 canonical 隔离。
}

describe('Principal Runtime E2E (M3-101A-B, Fake provider, real PostgreSQL)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let pool: pg.Pool;
  let familyId: string;
  let token: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    process.env.FPAI_INTERNAL_OPS = 'true'; // M3-INT-001:显式开启内部 Ops 面以测试 usage/console
    pool = createTestPool();
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    await app.listen(0);
    baseUrl = await app.getUrl();
  });
  beforeEach(async () => {
    await cleanPrincipal(pool);
    const r = await pool.query(`insert into families(display_name) values ('E2E家庭') returning family_id`);
    familyId = r.rows[0].family_id;
    const guardianId = (await pool.query(
      `insert into persons(family_id, person_type, parent_role, display_name)
       values ($1, 'PARENT', 'GUARDIAN', 'E2E监护人') returning person_id`,
      [familyId],
    )).rows[0].person_id;
    const accountId = (await pool.query(
      `insert into accounts(status) values ('ACTIVE') returning account_id`,
    )).rows[0].account_id;
    await pool.query(
      `insert into account_person_bindings(account_id, person_id, status) values ($1, $2, 'ACTIVE')`,
      [accountId, guardianId],
    );
    await pool.query(
      `insert into family_memberships(family_id, person_id, role, status, joined_at)
       values ($1, $2, 'OWNER_GUARDIAN', 'ACTIVE', now())`,
      [familyId, guardianId],
    );
    token = `fam_${randomUUID()}`;
    await pool.query(
      `insert into identity_sessions(token_hash, account_ref, expires_at)
       values ($1, $2, now() + interval '1 day')`,
      [sha256(token), accountId],
    );
  });
  afterAll(async () => { await app.close(); await pool.end(); });

  const post = (path: string, body: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { ...ACTOR, authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

  async function newSession() {
    const res = await post(`/families/${familyId}/principal/sessions`, { subject_ref: 'child-1' });
    expect(res.status).toBe(201);
    return (await res.json() as { session_id: string }).session_id;
  }

  it('NORMAL: message -> response + action proposal (LISTEN_BEFORE_RESPOND), no growth writes, no real model call', async () => {
    const sid = await newSession();
    const growthBefore = (await pool.query(`select count(*)::int n from growth_actions`)).rows[0].n;
    const res = await post(`/families/${familyId}/principal/sessions/${sid}/messages`, {
      subject_ref: 'child-1', message: '孩子写作业总是拖拉磨蹭，我该怎么办',
    });
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.risk_route).toBe('NORMAL');
    expect(body.human_handoff).toBe(false);
    expect(body.response_id).toBeTruthy();
    expect(body.action_proposal_id).toBeTruthy();

    // persisted proposal points to existing deterministic intervention, canonical=false
    const p = await pool.query(`select recommended_intervention_id, canonical from principal_action_proposals where proposal_id=$1`, [body.action_proposal_id]);
    expect(p.rows[0].recommended_intervention_id).toBe('LISTEN_BEFORE_RESPOND');
    expect(p.rows[0].canonical).toBe(false);
    // model run recorded, no real external call (deterministic fallback when FPAI_PRINCIPAL_PROVIDER!=real)
    const mr = await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid]);
    expect(mr.rows[0].model_provider).toBe('deterministic-fallback');
    // Growth OS canonical untouched in B: Principal writes nothing to growth_actions
    const growthAfter = (await pool.query(`select count(*)::int n from growth_actions`)).rows[0].n;
    expect(growthAfter).toBe(growthBefore);
    // product events recorded (submitted + received + proposal)
    const pe = await pool.query(`select event_name from product_events where session_id=$1`, [sid]);
    const names = pe.rows.map((x) => x.event_name);
    expect(names).toContain('principal_question_submitted');
    expect(names).toContain('principal_response_received');
  });

  it('HIGH_RISK: crisis message -> human handoff, no coaching response, no proposal', async () => {
    const sid = await newSession();
    const res = await post(`/families/${familyId}/principal/sessions/${sid}/messages`, {
      subject_ref: 'child-1', message: '孩子说不想活了',
    });
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.risk_route).toBe('HIGH_RISK');
    expect(body.human_handoff).toBe(true);
    expect(body.response_id).toBeNull();
    expect(body.action_proposal_id).toBeNull();
    const h = await pool.query(`select count(*)::int n from principal_human_handoffs where session_id=$1`, [sid]);
    expect(h.rows[0].n).toBe(1);
    const pr = await pool.query(`select count(*)::int n from principal_responses where session_id=$1`, [sid]);
    expect(pr.rows[0].n).toBe(0);
  });

  it('M3-103 REVIEW: message routes to human-review queue (no proposal); list + resolve', async () => {
    const sid = await newSession();
    const res = await post(`/families/${familyId}/principal/sessions/${sid}/messages`, {
      subject_ref: 'child-1', message: '孩子最近厌学，我快崩溃了',
    });
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.risk_route).toBe('REVIEW');
    expect(body.response_id).toBeTruthy();
    expect(body.action_proposal_id).toBeNull();
    // W2R-105:REVIEW 响应【扣留】,不展示给家长,human_handoff=true
    expect(body.response).toBeNull();
    expect(body.human_handoff).toBe(true);

    const list = await (await fetch(`${baseUrl}/families/${familyId}/principal/handoffs`, { headers: { 'x-actor-id': 'advisor-1' } })).json() as { handoffs: Array<Record<string, unknown>> };
    expect(list.handoffs.length).toBe(1);
    expect(list.handoffs[0].risk_route).toBe('REVIEW');
    expect(list.handoffs[0].trigger_reason).toBe('review');
    const handoffId = list.handoffs[0].handoff_id as string;

    const resolve = await post(`/families/${familyId}/principal/handoffs/${handoffId}/resolve`, { resolution: 'APPROVED', note: '已复核' });
    expect(resolve.status).toBe(201);
    // W2R-105:人工 APPROVED 后释放此前扣留的候选响应
    const resolveBody = await resolve.json() as Record<string, unknown>;
    expect(resolveBody.released_response).toBeTruthy();
    const after = await (await fetch(`${baseUrl}/families/${familyId}/principal/handoffs`, { headers: { 'x-actor-id': 'advisor-1' } })).json() as { handoffs: unknown[] };
    expect(after.handoffs.length).toBe(0);
    // resolving an unknown/closed handoff -> 404
    const again = await post(`/families/${familyId}/principal/handoffs/${handoffId}/resolve`, { resolution: 'APPROVED' });
    expect(again.status).toBe(404);
  });

  // W2R-104-FINAL-FIX-001 专家护栏贯穿 W2R-105 Human Gate:Expert Rule → Runtime REVIEW → 响应扣留 → handoff。
  it('GOLD-051 (ParentVerbalEscalationReviewGuard): 家长已发生激烈言语 → REVIEW 扣留,no proposal,handoff', async () => {
    const sid = await newSession();
    const res = await post(`/families/${familyId}/principal/sessions/${sid}/messages`, {
      subject_ref: 'child-1', message: '我刚才吼了孩子，现在很后悔，我今晚到底该怎么说？',
    });
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.risk_route).toBe('REVIEW');
    expect(body.action_proposal_id).toBeNull();
    expect(body.response).toBeNull();          // 扣留:不展示给家长
    expect(body.human_handoff).toBe(true);
    const list = await (await fetch(`${baseUrl}/families/${familyId}/principal/handoffs`, { headers: { 'x-actor-id': 'advisor-1' } })).json() as { handoffs: Array<Record<string, unknown>> };
    expect(list.handoffs.some((h) => h.risk_route === 'REVIEW')).toBe(true);
  });

  it('GOLD-053 (ImminentSelfLossOfControlGuard): 家长临界失控 → REVIEW 扣留,no proposal,handoff', async () => {
    const sid = await newSession();
    const res = await post(`/families/${familyId}/principal/sessions/${sid}/messages`, {
      subject_ref: 'child-1', message: '我快控制不住脾气了，我今晚到底该怎么说？',
    });
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.risk_route).toBe('REVIEW');
    expect(body.action_proposal_id).toBeNull();
    expect(body.response).toBeNull();
    expect(body.human_handoff).toBe(true);
  });

  it('M3-102 multimodal: message accepts images[]; image_count recorded; deterministic path stays NORMAL', async () => {
    const sid = await newSession();
    const res = await post(`/families/${familyId}/principal/sessions/${sid}/messages`, {
      subject_ref: 'child-1', message: '这是孩子今天的作业，拖到很晚', images: [{ media_type: 'image/png', data: 'iVBORw0KGgo=' }],
    });
    expect(res.status).toBe(201);
    const body = await res.json() as Record<string, unknown>;
    expect(body.risk_route).toBe('NORMAL');
    const ev = (await pool.query(`select payload from product_events where session_id=$1 and event_name='principal_question_submitted'`, [sid])).rows[0];
    expect(ev.payload.image_count).toBe(1);
    // bad image shape -> 400
    const bad = await post(`/families/${familyId}/principal/sessions/${sid}/messages`, { subject_ref: 'child-1', message: 'x', images: [{ media_type: 'image/png' }] });
    expect(bad.status).toBe(400);
  });

  it('M3-108 usage: GET usage reports UNLIMITED when no cap configured', async () => {
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/usage`, { headers: { 'x-actor-id': 'advisor-1' } });
    expect(res.status).toBe(200);
    const u = await res.json() as { used: number; cap: number; state: string; remaining: number | null };
    expect(u.used).toBe(0);
    expect(u.cap).toBe(0);
    expect(u.state).toBe('UNLIMITED');
    expect(u.remaining).toBeNull();
  });

  it('M3-INT-001: internal ops surface (console/usage) is DEFAULT-OFF -> 404 without FPAI_INTERNAL_OPS', async () => {
    const prev = process.env.FPAI_INTERNAL_OPS;
    delete process.env.FPAI_INTERNAL_OPS;
    try {
      const c = await fetch(`${baseUrl}/families/${familyId}/principal/review-console`);
      expect(c.status).toBe(404);
      const u = await fetch(`${baseUrl}/families/${familyId}/principal/usage`, { headers: { 'x-actor-id': 'advisor-1' } });
      expect(u.status).toBe(404);
    } finally { process.env.FPAI_INTERNAL_OPS = prev; }
  });

  it('M3-107 review console: GET returns self-contained HTML operator page', async () => {
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/review-console`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('人工复核队列');
    expect(html).toContain(familyId);
    expect(html).toContain("fetch('handoffs'");
  });

  it('GET session returns aggregate; unknown family -> 404', async () => {
    const sid = await newSession();
    await post(`/families/${familyId}/principal/sessions/${sid}/messages`, { subject_ref: 'child-1', message: '手机玩太久了' });
    const get = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}`, { headers: { authorization: `Bearer ${token}` } });
    expect(get.status).toBe(200);
    const agg = await get.json() as { messages: unknown[] };
    expect(agg.messages.length).toBeGreaterThanOrEqual(1);
    const bad = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/00000000-0000-0000-0000-000000000000`, { headers: { authorization: `Bearer ${token}` } });
    expect(bad.status).toBe(404);
  });
});
