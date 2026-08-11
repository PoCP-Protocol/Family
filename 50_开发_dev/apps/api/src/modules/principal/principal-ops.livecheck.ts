import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl, seedAiConsentSubject } from '../../test/test-database';

// M3-INT-001 B1/B3 LIVE — Attempt 账本 + 跨厂商 failover 计量(真实外呼)。.livecheck → CI 不收集。
// 需 ZHIPUAI_API_KEY;主 anthropic 指死端口 → NETWORK_ERROR → failover 到真实 zhipu。
// 外呼门要求 AI_PERSONALIZATION GRANTED,故用 seedAiConsentSubject 提供真实 subject。

const enabled = !!process.env.ZHIPUAI_API_KEY;
const run = enabled ? it : it.skip;
let app: INestApplication; let baseUrl = ''; let pool: pg.Pool;

beforeAll(async () => {
  if (!enabled) return;
  process.env.FPAI_PRINCIPAL_PROVIDER = 'real';
  process.env.FPAI_MODEL_VENDOR = 'anthropic,zhipu';
  process.env.FPAI_RUNTIME_PROFILE = 'internal_livecheck';
  process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:1';
  process.env.ANTHROPIC_AUTH_TOKEN = 'dead';
  process.env.FPAI_INTERNAL_OPS = 'true';
  process.env.DATABASE_URL = getTestDatabaseUrl();
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => { if (enabled) await cleanFamilyCoreTables(pool); });
afterAll(async () => {
  await app?.close(); await pool?.end();
  for (const k of ['FPAI_MODEL_VENDOR', 'FPAI_PRINCIPAL_PROVIDER', 'FPAI_RUNTIME_PROFILE', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'FPAI_INTERNAL_OPS', 'FPAI_PRINCIPAL_DAILY_CAP']) delete process.env[k];
});

const H = (c = 'corr-ops') => ({ 'content-type': 'application/json', 'x-actor-id': 'architect-1', 'x-correlation-id': c });
async function sessionFor(familyId: string, subjectRef: string): Promise<string> {
  const r = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, { method: 'POST', headers: H(), body: JSON.stringify({ subject_ref: subjectRef }) });
  return (await r.json() as { session_id: string }).session_id;
}
async function attemptsFor(sessionId: string) {
  return (await pool.query(`select provider, failover_sequence, status, failure_kind from principal_model_attempts where session_id=$1 order by failover_sequence`, [sessionId])).rows;
}

describe('M3-INT-001 B1/B3 LIVE: attempt ledger + failover accounting', () => {
  run('failover records TWO attempts (anthropic FAILURE seq0 + zhipu SUCCESS seq1); usage reflects failover', async () => {
    const { familyId, subjectRef } = await seedAiConsentSubject(pool);
    const sid = await sessionFor(familyId, subjectRef);
    const res = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H(), body: JSON.stringify({ subject_ref: subjectRef, message: '孩子写作业拖拉，今晚怎么开口' }),
    });
    expect(res.status).toBe(201);
    const attempts = await attemptsFor(sid);
    expect(attempts.length).toBe(2);
    expect(attempts[0]).toMatchObject({ provider: 'anthropic-cc-switch', failover_sequence: 0, status: 'FAILURE' });
    expect(attempts[1]).toMatchObject({ provider: 'zhipu-glm4v', failover_sequence: 1, status: 'SUCCESS' });
    const usage = await (await fetch(`${baseUrl}/families/${familyId}/principal/usage`, { headers: { 'x-actor-id': 'architect-1' } })).json() as { provider_attempts: number; failovers: number; successful_attempts: number; failed_attempts: number };
    expect(usage.provider_attempts).toBe(2);
    expect(usage.failovers).toBe(1);
    expect(usage.successful_attempts).toBe(1);
    expect(usage.failed_attempts).toBe(1);
    // eslint-disable-next-line no-console
    console.log(`[LIVE-ATTEMPT] attempts=${usage.provider_attempts} failovers=${usage.failovers} (anthropic FAILURE -> zhipu SUCCESS)`);
  }, 60000);

  run('quota counts real ATTEMPTS: cap=2 (one failover call = 2 attempts) blocks the 2nd call', async () => {
    process.env.FPAI_PRINCIPAL_DAILY_CAP = '2';
    try {
      const { familyId, subjectRef } = await seedAiConsentSubject(pool);
      const sid1 = await sessionFor(familyId, subjectRef);
      const r1 = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid1}/messages`, { method: 'POST', headers: H(), body: JSON.stringify({ subject_ref: subjectRef, message: '孩子玩手机太久怎么谈' }) });
      expect((await r1.json() as { response_id: string | null }).response_id).toBeTruthy(); // 首呼:2 attempts

      const sid2 = await sessionFor(familyId, subjectRef);
      const r2 = await fetch(`${baseUrl}/families/${familyId}/principal/sessions/${sid2}/messages`, { method: 'POST', headers: H(), body: JSON.stringify({ subject_ref: subjectRef, message: '另一个普通问题' }) });
      const b2 = await r2.json() as { risk_route: string; human_handoff: boolean; response_id: string | null };
      expect(b2.risk_route).toBe('REVIEW');
      expect(b2.human_handoff).toBe(true);
      expect(b2.response_id).toBeNull();
      // eslint-disable-next-line no-console
      console.log('[LIVE-QUOTA-ATTEMPT] cap=2 attempts reached after 1 failover call -> 2nd call blocked');
    } finally { delete process.env.FPAI_PRINCIPAL_DAILY_CAP; }
  }, 60000);
});
