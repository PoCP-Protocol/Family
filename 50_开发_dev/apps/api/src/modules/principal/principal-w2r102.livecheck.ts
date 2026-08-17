import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl, seedAiConsentSubject } from '../../test/test-database';

// W2R-102 LIVE:model_first_internal + cc switch → 真校长内部默认;consent 下对象上下文;危机不外呼。
// .livecheck → CI 不收集。需 cc switch(127.0.0.1:15722)。

const enabled = !!process.env.FPAI_MM_BASE_URL;
const run = enabled ? it : it.skip;
let app: INestApplication; let baseUrl = ''; let pool: pg.Pool;

beforeAll(async () => {
  if (!enabled) return;
  process.env.FPAI_RUNTIME_PROFILE = 'model_first_internal';
  process.env.FPAI_PRINCIPAL_PROVIDER = 'real';
  process.env.FPAI_MODEL_VENDOR = 'anthropic';
  process.env.ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL ?? process.env.FPAI_MM_BASE_URL;
  process.env.ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN ?? 'cc-switch-local';
  process.env.DATABASE_URL = getTestDatabaseUrl();
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0); baseUrl = await app.getUrl();
});
beforeEach(async () => { if (enabled) await cleanFamilyCoreTables(pool); });
afterAll(async () => {
  await app?.close(); await pool?.end();
  for (const k of ['FPAI_RUNTIME_PROFILE', 'FPAI_PRINCIPAL_PROVIDER', 'FPAI_MODEL_VENDOR', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN']) delete process.env[k];
});

const H = { 'content-type': 'application/json', 'x-actor-id': 'architect-1' };
async function session(fid: string, subj: string) {
  const r = await fetch(`${baseUrl}/families/${fid}/principal/sessions`, { method: 'POST', headers: H, body: JSON.stringify({ subject_ref: subj }) });
  return (await r.json() as { session_id: string }).session_id;
}

describe('W2R-102 LIVE model-first internal (cc switch)', () => {
  run('consent subject -> REAL model (anthropic-compatible) default ON; Growth zero-write', async () => {
    const { familyId, subjectRef } = await seedAiConsentSubject(pool);
    const sid = await session(familyId, subjectRef);
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H, body: JSON.stringify({ subject_ref: subjectRef, message: '孩子一回家就玩手机,一说就顶嘴,今晚怎么开口' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { risk_route: string; response_id: string | null };
    const mr = (await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid])).rows[0];
    if (body.response_id) expect(mr.model_provider).toBe('anthropic-compatible');
    else expect(body.risk_route).toBe('REVIEW'); // FAIL CLOSED 亦可接受
    expect((await pool.query(`select count(*)::int n from growth_actions`)).rows[0].n).toBe(0);
    // eslint-disable-next-line no-console
    console.log(`[LIVE-W2R102] provider=${mr?.model_provider} route=${body.risk_route}`);
  }, 60000);

  run('crisis still short-circuits under model_first_internal (no external, handoff)', async () => {
    const { familyId, subjectRef } = await seedAiConsentSubject(pool);
    const sid = await session(familyId, subjectRef);
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H, body: JSON.stringify({ subject_ref: subjectRef, message: '孩子说不想活了' }),
    });
    const body = await res.json() as { risk_route: string; human_handoff: boolean };
    expect(body.risk_route).toBe('HIGH_RISK');
    expect(body.human_handoff).toBe(true);
    const mr = (await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid])).rows[0];
    expect(mr.model_provider).toBe('deterministic-fallback');
  }, 30000);
});
