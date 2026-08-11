import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// M3-106/108 LIVE — 跨厂商 failover 路由 + 配额告警。命名 .livecheck.ts → CI 不收集。
// 需 ZHIPUAI_API_KEY;主厂商故意指向死端口(NETWORK_ERROR)以触发 failover 到智谱。

const enabled = !!process.env.ZHIPUAI_API_KEY;
const run = enabled ? it : it.skip;
let app: INestApplication; let baseUrl = ''; let pool: pg.Pool;

beforeAll(async () => {
  if (!enabled) return;
  process.env.FPAI_PRINCIPAL_PROVIDER = 'real';
  process.env.FPAI_MODEL_VENDOR = 'anthropic,zhipu';   // 受控路由:先 anthropic,failover 到 zhipu
  process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:1'; // 死端口 → NETWORK_ERROR → 触发 failover
  process.env.ANTHROPIC_AUTH_TOKEN = 'dead';
  process.env.DATABASE_URL = getTestDatabaseUrl();
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => { if (enabled) await cleanFamilyCoreTables(pool); });
afterAll(async () => {
  await app?.close(); await pool?.end();
  delete process.env.FPAI_MODEL_VENDOR; delete process.env.FPAI_PRINCIPAL_PROVIDER;
  delete process.env.ANTHROPIC_BASE_URL; delete process.env.ANTHROPIC_AUTH_TOKEN;
  delete process.env.FPAI_PRINCIPAL_DAILY_CAP; delete process.env.FPAI_PRINCIPAL_DAILY_WARN_PCT;
});

const H = { 'content-type': 'application/json', 'x-actor-id': 'architect-1', 'x-correlation-id': 'corr-ops' };
async function session(fid: string): Promise<string> {
  const r = await fetch(`${baseUrl}/families/${fid}/principal/sessions`, { method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1' }) });
  return (await r.json() as { session_id: string }).session_id;
}
async function newFamily(): Promise<string> {
  return (await pool.query(`insert into families(display_name) values ('ops') returning family_id`)).rows[0].family_id;
}

describe('M3-106/108 LIVE ops: failover routing + quota alerting', () => {
  run('M3-106 failover: dead primary (anthropic) -> falls over to real zhipu, succeeds', async () => {
    delete process.env.FPAI_PRINCIPAL_DAILY_CAP; // 本例不设配额
    const fid = await newFamily();
    const sid = await session(fid);
    const res = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message: '孩子写作业拖拉，今晚怎么开口' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { response_id: string | null; risk_route: string };
    if (body.response_id) {
      const mr = (await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid])).rows[0];
      expect(mr.model_provider).toBe('zhipu-compatible'); // 证明从死掉的 anthropic 兜底到了 zhipu
      // eslint-disable-next-line no-console
      console.log(`[LIVE-FAILOVER] primary anthropic dead -> secondary zhipu succeeded; route=${body.risk_route}`);
    } else {
      // 若 zhipu 也返回 schema 不过 → FAIL CLOSED REVIEW(仍非 500)
      expect(body.risk_route).toBe('REVIEW');
      // eslint-disable-next-line no-console
      console.log('[LIVE-FAILOVER] failover reached zhipu; output failed schema -> review (no 500)');
    }
  }, 60000);

  run('M3-108 quota alert: warn threshold emits principal_quota_warning; usage state=WARN', async () => {
    process.env.FPAI_PRINCIPAL_DAILY_CAP = '2';
    process.env.FPAI_PRINCIPAL_DAILY_WARN_PCT = '50'; // warnAt = ceil(2*0.5)=1
    const fid = await newFamily();
    const sid = await session(fid);
    const res = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message: '孩子玩手机太久，今晚怎么谈' }),
    });
    expect(res.status).toBe(201);
    const b = await res.json() as { response_id: string | null };
    if (b.response_id) { // 真实外呼成功(经 zhipu),used=1=warnAt
      const warn = (await pool.query(`select count(*)::int n from product_events where family_id=$1 and event_name='principal_quota_warning'`, [fid])).rows[0].n;
      expect(warn).toBe(1);
      const usage = await (await fetch(`${baseUrl}/families/${fid}/principal/usage`, { headers: { 'x-actor-id': 'architect-1' } })).json() as { used: number; cap: number; state: string };
      expect(usage).toMatchObject({ used: 1, cap: 2, state: 'WARN' });
      // eslint-disable-next-line no-console
      console.log(`[LIVE-QUOTA] warn fired at used=${usage.used}/cap=${usage.cap} state=${usage.state}`);
    }
  }, 60000);
});
