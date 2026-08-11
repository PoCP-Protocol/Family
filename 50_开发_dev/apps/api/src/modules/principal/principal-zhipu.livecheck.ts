import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import zlib from 'node:zlib';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// M3-105 LIVE — 智谱 GLM-4V 独立视觉 Provider(真实外呼)。命名 .livecheck.ts → CI 不收集。
// 仅在 ZHIPUAI_API_KEY 存在时手动运行(专用配置,FPAI_MODEL_VENDOR=zhipu)。

const enabled = !!process.env.ZHIPUAI_API_KEY;
const run = enabled ? it : it.skip;

let app: INestApplication; let baseUrl = ''; let pool: pg.Pool;

beforeAll(async () => {
  if (!enabled) return;
  process.env.FPAI_PRINCIPAL_PROVIDER = 'real';
  process.env.FPAI_MODEL_VENDOR = 'zhipu';
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
});

const H = { 'content-type': 'application/json', 'x-actor-id': 'architect-1', 'x-correlation-id': 'corr-zhipu' };
async function session(fid: string): Promise<string> {
  const r = await fetch(`${baseUrl}/families/${fid}/principal/sessions`, { method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1' }) });
  return (await r.json() as { session_id: string }).session_id;
}
async function newFamily(): Promise<string> {
  return (await pool.query(`insert into families(display_name) values ('zhipu') returning family_id`)).rows[0].family_id;
}
function validPngBase64(): string {
  const W = 48, H2 = 48; const crc32 = (zlib as unknown as { crc32: (b: Buffer) => number }).crc32;
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const t = Buffer.from(type);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0);
    return Buffer.concat([len, t, data, c]);
  };
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H2, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((W * 3 + 1) * H2);
  for (let y = 0; y < H2; y++) for (let x = 0; x < W; x++) { const o = y * (W * 3 + 1) + 1 + x * 3; raw[o] = 90; raw[o + 1] = 160; raw[o + 2] = 220; }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}

describe('M3-105 LIVE Zhipu GLM-4V vision provider', () => {
  run('text + image reaches REAL GLM-4V (zhipu-compatible), or fails closed; never 500; Growth zero-write', async () => {
    const fid = await newFamily();
    const sid = await session(fid);
    const res = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ subject_ref: 'child-1', message: '附了孩子作业照片，今晚怎么开口比较好', images: [{ media_type: 'image/png', data: validPngBase64() }] }),
    });
    expect(res.status).toBe(201); // FAIL CLOSED:即使 provider 出错也不 500
    const body = await res.json() as { risk_route: string; response_id: string | null };
    const mr = (await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid])).rows;
    if (body.response_id) {
      expect(mr[0].model_provider).toBe('zhipu-compatible');
      // eslint-disable-next-line no-console
      console.log(`[LIVE-ZHIPU] GLM-4V processed image; route=${body.risk_route}`);
    } else {
      expect(body.risk_route).toBe('REVIEW');
      // eslint-disable-next-line no-console
      console.log('[LIVE-ZHIPU] provider rejected -> failed closed to review (no 500)');
    }
    expect((await pool.query(`select count(*)::int n from growth_actions`)).rows[0].n).toBe(0);
  }, 60000);

  run('HIGH_RISK never reaches GLM-4V (precheck short-circuit) -> human handoff', async () => {
    const fid = await newFamily();
    const sid = await session(fid);
    const res = await fetch(`${baseUrl}/families/${fid}/principal/sessions/${sid}/messages`, {
      method: 'POST', headers: H, body: JSON.stringify({ subject_ref: 'child-1', message: '孩子说不想活了' }),
    });
    const body = await res.json() as { risk_route: string; human_handoff: boolean };
    expect(body.risk_route).toBe('HIGH_RISK');
    expect(body.human_handoff).toBe(true);
    const mr = (await pool.query(`select model_provider from principal_model_runs where session_id=$1`, [sid])).rows[0];
    expect(mr.model_provider).toBe('deterministic-fallback');
  }, 30000);
});
