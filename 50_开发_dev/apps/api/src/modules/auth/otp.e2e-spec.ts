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
  const pid = (await pool.query(`insert into persons(family_id, person_type, parent_role, display_name, account_id) values ($1,'PARENT','GUARDIAN','家长',$2) returning person_id`, [familyId, `phone:${PHONE}`])).rows[0].person_id;
  await pool.query(`update families set primary_contact_person_id=$1 where family_id=$2`, [pid, familyId]);
  // TENANCY-V2 回填:Account/binding/membership,使 OTP 登录后 /auth/contexts 能解析到该家庭。
  await pool.query(`insert into accounts(external_ref) values ($1) on conflict do nothing`, [`phone:${PHONE}`]);
  await pool.query(`insert into account_person_bindings(account_id, person_id) select a.account_id, $1 from accounts a where a.external_ref=$2`, [pid, `phone:${PHONE}`]);
  await pool.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now())`, [familyId, pid]);
});
afterAll(async () => { await app.close(); await pool.end(); });

const post = (path: string, body: unknown) => fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const requestCode = (phone = PHONE) => post('/auth/otp/request', { phone });

describe('IAM-102 OTP login flow', () => {
  it('request -> verify -> issues ACCOUNT session; /auth/me + /auth/contexts resolve family', async () => {
    const req = await requestCode();
    expect(req.status).toBe(201);
    const { dev_code } = await req.json() as { dev_code: string };
    expect(dev_code).toMatch(/^\d{6}$/);

    const ver = await post('/auth/otp/verify', { phone: PHONE, code: dev_code });
    expect(ver.status).toBe(201);
    const { token, account_id } = await ver.json() as { token: string; account_id: string };
    expect(token).toMatch(/^fam_/);
    expect(account_id).toBeTruthy();

    // TENANCY-V2:OTP 不自动选家庭;身份 = Account,家庭经 /auth/contexts 解析。
    const me = await fetch(`${baseUrl}/auth/me`, { headers: { authorization: `Bearer ${token}` } });
    expect(me.status).toBe(200);
    expect((await me.json() as { account_id: string }).account_id).toBe(account_id);

    const ctx = await fetch(`${baseUrl}/auth/contexts`, { headers: { authorization: `Bearer ${token}` } });
    expect(ctx.status).toBe(200);
    const { contexts } = await ctx.json() as { contexts: Array<{ family_id: string; role: string }> };
    expect(contexts.map((c) => c.family_id)).toContain(familyId);
    expect(contexts.find((c) => c.family_id === familyId)?.role).toBe('OWNER_GUARDIAN');
  });

  it('PLATFORM-SESSION-001: verify 下发 HttpOnly cookie;带 cookie(无 Bearer)可认证 /auth/contexts', async () => {
    const req = await requestCode();
    const { dev_code } = await req.json() as { dev_code: string };
    const ver = await post('/auth/otp/verify', { phone: PHONE, code: dev_code });
    const setCookie = ver.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('fam_session=');
    expect(setCookie.toLowerCase()).toContain('httponly');
    const cookie = setCookie.split(';')[0]; // fam_session=<token>
    // 仅用 cookie(不带 Authorization)访问:
    const ctx = await fetch(`${baseUrl}/auth/contexts`, { headers: { cookie } });
    expect(ctx.status).toBe(200);
    expect((await ctx.json() as { contexts: Array<{ family_id: string }> }).contexts.map((c) => c.family_id)).toContain(familyId);
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

  it('correct code, phone with no family -> ACCOUNT session with zero contexts (注册=CreateFirstFamily)', async () => {
    const unbound = '13900000009';
    const req = await requestCode(unbound);
    const { dev_code } = await req.json() as { dev_code: string };
    const ver = await post('/auth/otp/verify', { phone: unbound, code: dev_code });
    expect(ver.status).toBe(201);   // TENANCY-V2:不再 404;零家庭 Account 合法
    const { token } = await ver.json() as { token: string };
    const ctx = await fetch(`${baseUrl}/auth/contexts`, { headers: { authorization: `Bearer ${token}` } });
    expect((await ctx.json() as { contexts: unknown[] }).contexts).toEqual([]);
  });

  it('CreateFirstFamily: zero-family account bootstraps first family atomically', async () => {
    const phone = '13700000007';
    const req = await requestCode(phone);
    const { dev_code } = await req.json() as { dev_code: string };
    const { token } = await (await post('/auth/otp/verify', { phone, code: dev_code })).json() as { token: string };
    const r = await fetch(`${baseUrl}/auth/families`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ display_name: '新家庭', guardian_name: '妈妈' }) });
    expect(r.status).toBe(201);
    const fam = await r.json() as { family_id: string; role: string };
    expect(fam.role).toBe('OWNER_GUARDIAN');
    const ctx = await fetch(`${baseUrl}/auth/contexts`, { headers: { authorization: `Bearer ${token}` } });
    const { contexts } = await ctx.json() as { contexts: Array<{ family_id: string; role: string }> };
    expect(contexts.map((c) => c.family_id)).toContain(fam.family_id);
    // 二次 CreateFirstFamily 应被拒(已有家庭)
    const r2 = await fetch(`${baseUrl}/auth/families`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ display_name: '再来一个', guardian_name: '爸爸' }) });
    expect(r2.status).toBe(400);
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
