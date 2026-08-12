import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

// IAM-102 OTP 验证流程 E2E(真实 PostgreSQL,stub sender)。流程真实:请求→验证→签发会话。
// 短信不真发;dev_code 仅内部环境回读供测试。

let app: INestApplication; let baseUrl = ''; let pool: pg.Pool;
let familyId: string; const PHONE = '13800000001';

beforeAll(async () => {
  process.env.DATABASE_URL = getTestDatabaseUrl();
  process.env.FPAI_INTERNAL_OPS = 'true'; // stub sender 回读 dev_code(仅内部)
  pool = createTestPool();
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});
beforeEach(async () => {
  await cleanFamilyCoreTables(pool);
  familyId = (await pool.query(`insert into families(display_name) values ('OTP fam') returning family_id`)).rows[0].family_id;
  await pool.query(`insert into persons(family_id, person_type, parent_role, display_name, account_id) values ($1,'PARENT','GUARDIAN','家长',$2)`, [familyId, `phone:${PHONE}`]);
});
afterAll(async () => { await app.close(); await pool.end(); });

const post = (path: string, body: unknown) => fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const requestCode = (phone = PHONE) => post('/auth/otp/request', { phone });

describe('IAM-102 OTP login flow', () => {
  it('request -> verify -> issues session; whoami resolves bound person', async () => {
    const req = await requestCode();
    expect(req.status).toBe(201);
    const { dev_code } = await req.json() as { dev_code: string };
    expect(dev_code).toMatch(/^\d{6}$/);

    const ver = await post('/auth/otp/verify', { phone: PHONE, code: dev_code });
    expect(ver.status).toBe(201);
    const { token, family_id } = await ver.json() as { token: string; family_id: string };
    expect(token).toMatch(/^fam_/);
    expect(family_id).toBe(familyId);

    const who = await fetch(`${baseUrl}/auth/whoami`, { headers: { authorization: `Bearer ${token}` } });
    expect(who.status).toBe(200);
    expect((await who.json() as { family_id: string }).family_id).toBe(familyId);
  });

  it('wrong code -> 401 (attempt recorded)', async () => {
    await requestCode();
    const ver = await post('/auth/otp/verify', { phone: PHONE, code: '000000' });
    expect(ver.status).toBe(401);
  });

  it('verify without a prior request -> 401 (no active challenge)', async () => {
    const ver = await post('/auth/otp/verify', { phone: PHONE, code: '123456' });
    expect(ver.status).toBe(401);
  });

  it('correct code but phone not registered -> 404 (login only; no auto-registration)', async () => {
    const unbound = '13900000009';
    const req = await requestCode(unbound);
    const { dev_code } = await req.json() as { dev_code: string };
    const ver = await post('/auth/otp/verify', { phone: unbound, code: dev_code });
    expect(ver.status).toBe(404);
  });

  it('rate limit: 4th request within window -> 409', async () => {
    await requestCode(); await requestCode(); await requestCode();
    expect((await requestCode()).status).toBe(409);
  });

  it('expired challenge -> 401', async () => {
    const { createHash } = await import('node:crypto');
    const destHash = createHash('sha256').update(`phone:${PHONE}`).digest('hex');
    const codeHash = createHash('sha256').update(`phone:${PHONE}|654321`).digest('hex');
    await pool.query(`insert into otp_challenges(destination_hash, code_hash, expires_at) values ($1,$2, now() - interval '1 minute')`, [destHash, codeHash]);
    const ver = await post('/auth/otp/verify', { phone: PHONE, code: '654321' });
    expect(ver.status).toBe(401);
  });
});
