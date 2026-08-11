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
// 生成一张合法的 48x48 PNG(1x1 会被 bedrock 拒:"Could not process image")。
function validPngBase64(): string {
  const zlib = require('node:zlib') as typeof import('node:zlib');
  const W = 48, H = 48;
  const crc32 = (zlib as unknown as { crc32: (b: Buffer) => number }).crc32;
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0);
    return Buffer.concat([len, t, data, c]);
  };
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { for (let x = 0; x < W; x++) { const o = y * (W * 3 + 1) + 1 + x * 3; raw[o] = 210; raw[o + 1] = 70; raw[o + 2] = 150; } }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
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

  run('M3-102 multimodal: image + text reaches the REAL vision model (or fails closed, never 500)', async () => {
    const fid = await newFamily();
    const sid = await session(fid);
    const res = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ subject_ref: 'child-1', message: '附了一张孩子作业的照片，帮我看看今晚怎么开口', images: [{ media_type: 'image/png', data: validPngBase64() }] }),
    });
    expect(res.status).toBe(201); // 关键:即使 provider 出错也绝不 500(FAIL CLOSED)
    const body = await res.json() as { risk_route: string; response_id: string | null };
    const mr = (await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid])).rows;
    if (body.response_id) {
      // 成功路径:真实视觉模型处理了图片
      expect(mr[0].model_provider).toBe('anthropic-compatible');
      // eslint-disable-next-line no-console
      console.log(`[LIVE-MM] image processed by real model; route=${body.risk_route}`);
    } else {
      // FAIL CLOSED 路径:provider 拒绝 → 安全降级到人工复核,不 500、不返原始文本
      expect(body.risk_route).toBe('REVIEW');
      // eslint-disable-next-line no-console
      console.log('[LIVE-MM] provider rejected image -> failed closed to review (no 500)');
    }
  }, 60000);

  run('M3-104 quota: daily cap blocks the 2nd real call (no external call), routes to review', async () => {
    process.env.FPAI_PRINCIPAL_DAILY_CAP = '1';
    try {
      const fid = await newFamily();
      const sid1 = await session(fid);
      const r1 = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid1}/messages`, {
        method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message: '孩子写作业拖拉，今晚怎么开口？' }),
      });
      expect(r1.status).toBe(201); // 1st real call proceeds
      expect((await r1.json() as { response_id: string | null }).response_id).toBeTruthy();

      const sid2 = await session(fid);
      const r2 = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid2}/messages`, {
        method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message: '另一个普通问题，孩子玩手机' }),
      });
      expect(r2.status).toBe(201);
      const b2 = await r2.json() as { risk_route: string; human_handoff: boolean; response_id: string | null };
      expect(b2.risk_route).toBe('REVIEW');
      expect(b2.human_handoff).toBe(true);
      expect(b2.response_id).toBeNull();
      // 只发生 1 次真实外呼(第 2 次被配额拦截,无 anthropic model_run)
      const n = (await pool.query(`select count(*)::int n from principal_model_runs where family_id_ref=$1 and model_provider='anthropic-compatible'`, [fid])).rows[0].n;
      expect(n).toBe(1);
      const q = (await pool.query(`select count(*)::int n from product_events where family_id=$1 and event_name='principal_quota_exceeded'`, [fid])).rows[0].n;
      expect(q).toBe(1);
    } finally {
      delete process.env.FPAI_PRINCIPAL_DAILY_CAP;
    }
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
