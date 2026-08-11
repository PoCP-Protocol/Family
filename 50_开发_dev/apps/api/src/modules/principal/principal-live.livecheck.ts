import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// M3-101B LIVE smoke — 真实外部模型调用(cc switch / AnthropicAiGateway)。REAL_MODEL_CALLS>0。
// 故意命名 .livecheck.ts:不匹配 *.spec.ts / *.e2e-spec.ts,任何 CI/常规套件都不会收集 → 离线确定性不受影响。
// 仅在设置 FPAI_MM_BASE_URL 且 cc switch 可达时手动运行(专用 vitest 配置)。

const enabled = !!process.env.FPAI_MM_BASE_URL;
const run = enabled ? it : it.skip;

let app: INestApplication;
let baseUrl = '';
let pool: pg.Pool;

beforeAll(async () => {
  if (!enabled) return;
  // env-gate 打开真实 Provider;NestFactory 构造时由 PrincipalModule factory 读取。
  process.env.FPAI_PRINCIPAL_PROVIDER = 'real';
  process.env.ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL ?? process.env.FPAI_MM_BASE_URL;
  process.env.ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN ?? 'cc-switch-local';
  process.env.DATABASE_URL = getTestDatabaseUrl();
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => { if (enabled) await cleanFamilyCoreTables(pool); });
afterAll(async () => { await app?.close(); await pool?.end(); });

const H = { 'content-type': 'application/json', 'x-actor-id': 'architect-1', 'x-correlation-id': 'corr-live' };

async function session(familyId: string): Promise<string> {
  const r = await fetch(`${baseUrl}/families/${familyId}/principal/sessions`, { method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1' }) });
  return (await r.json() as { session_id: string }).session_id;
}
async function newFamily(): Promise<string> {
  return (await pool.query(`insert into families(display_name) values ('live') returning family_id`)).rows[0].family_id;
}

describe('M3-101B LIVE Principal runtime (real cc switch model)', () => {
  run('NORMAL benign message hits the REAL external model, structured output validated, Growth zero-write', async () => {
    const fid = await newFamily();
    const sid = await session(fid);
    const res = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message: '孩子每天放学回家就玩手机不写作业，我该怎么开口？' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { risk_route: string; response_id: string | null; response: Record<string, string> | null };
    // 真实模型经安全门:NORMAL 或 REVIEW(schema 不过会被降级),但一定有结构化响应
    expect(['NORMAL', 'REVIEW']).toContain(body.risk_route);
    expect(body.response_id).toBeTruthy();
    expect(body.response?.one_small_action).toBeTruthy();

    // model_run 证明真实外部调用:provider=anthropic-compatible,model=cc switch 模型,latency>0
    const mr = (await pool.query(`select model_provider, model_name, schema_validation, latency_ms from principal_model_runs where session_id=$1`, [sid])).rows[0];
    expect(mr.model_provider).toBe('anthropic-compatible');
    expect(mr.model_name).toBeTruthy();
    expect(mr.latency_ms).toBeGreaterThan(0);
    // Growth canonical 零写
    const ga = (await pool.query(`select count(*)::int n from growth_actions`)).rows[0].n;
    expect(ga).toBe(0);
    // eslint-disable-next-line no-console
    console.log(`[LIVE] provider=${mr.model_provider} model=${mr.model_name} route=${body.risk_route} schema=${mr.schema_validation} latency=${mr.latency_ms}ms`);
  }, 60000);

  run('HIGH_RISK message NEVER reaches the external model (precheck short-circuit), routes to human handoff', async () => {
    const fid = await newFamily();
    const sid = await session(fid);
    const res = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message: '孩子说不想活了' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { risk_route: string; human_handoff: boolean; response_id: string | null };
    expect(body.risk_route).toBe('HIGH_RISK');
    expect(body.human_handoff).toBe(true);
    expect(body.response_id).toBeNull();
    // 关键安全证明:危机输入的 model_run 是确定性回退,绝不是真实外部模型
    const mr = (await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid])).rows[0];
    expect(mr.model_provider).toBe('deterministic-fallback');
  }, 30000);
});
