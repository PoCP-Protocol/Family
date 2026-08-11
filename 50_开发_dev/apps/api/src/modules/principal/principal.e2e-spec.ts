import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { createTestPool, getTestDatabaseUrl } from '../../test/test-database';

const ACTOR = { 'x-actor-id': 'advisor-1', 'x-correlation-id': 'c-e2e', 'content-type': 'application/json' };

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

  beforeAll(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    await app.listen(0);
    baseUrl = await app.getUrl();
  });
  beforeEach(async () => {
    await cleanPrincipal(pool);
    const r = await pool.query(`insert into families(display_name) values ('E2E家庭') returning family_id`);
    familyId = r.rows[0].family_id;
  });
  afterAll(async () => { await app.close(); await pool.end(); });

  const post = (path: string, body: unknown) =>
    fetch(`${baseUrl}${path}`, { method: 'POST', headers: ACTOR, body: JSON.stringify(body) });

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

  it('GET session returns aggregate; unknown family -> 404', async () => {
    const sid = await newSession();
    await post(`/families/${familyId}/principal/sessions/${sid}/messages`, { subject_ref: 'child-1', message: '手机玩太久了' });
    const get = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}`, { headers: { 'x-actor-id': 'advisor-1' } });
    expect(get.status).toBe(200);
    const agg = await get.json() as { messages: unknown[] };
    expect(agg.messages.length).toBeGreaterThanOrEqual(1);
    const bad = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/00000000-0000-0000-0000-000000000000`, { headers: { 'x-actor-id': 'advisor-1' } });
    expect(bad.status).toBe(404);
  });
});
