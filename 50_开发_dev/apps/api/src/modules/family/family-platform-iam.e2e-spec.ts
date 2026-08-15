import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { AuthService } from '../auth/auth.service';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

/**
 * PLATFORM-IAM-104 gate 证明:PLATFORM_AUTH_MODE=required 下,Family controller
 * CONSUMER_X_ACTOR_ID_TRUST=0 —— 仅 x-actor-id 必拒;Bearer→family scope;跨家庭 403。
 */
const BACKFILL = `
  INSERT INTO accounts (external_ref) SELECT DISTINCT p.account_id FROM persons p
    WHERE p.account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.external_ref=p.account_id);
  INSERT INTO account_person_bindings (account_id, person_id)
    SELECT a.account_id, p.person_id FROM persons p JOIN accounts a ON a.external_ref=p.account_id
    WHERE p.account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM account_person_bindings b WHERE b.account_id=a.account_id AND b.person_id=p.person_id);
  INSERT INTO family_memberships (family_id, person_id, role, status, joined_at)
    SELECT p.family_id, p.person_id, 'OWNER_GUARDIAN'::family_role, 'ACTIVE'::family_membership_status, p.created_at
    FROM persons p WHERE NOT EXISTS (SELECT 1 FROM family_memberships m WHERE m.family_id=p.family_id AND m.person_id=p.person_id);`;

describe('PLATFORM-IAM-104 Family controller bearer enforcement (required mode)', () => {
  let app: INestApplication; let baseUrl: string; let pool: pg.Pool; let auth: AuthService;
  const prev = process.env.PLATFORM_AUTH_MODE;

  beforeAll(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    process.env.PLATFORM_AUTH_MODE = 'required';
    pool = createTestPool();
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    auth = app.get(AuthService);
    await app.listen(0); baseUrl = await app.getUrl();
  });
  afterAll(async () => { await app.close(); await pool.end(); process.env.PLATFORM_AUTH_MODE = prev; });

  let famA: string; let famB: string;
  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);   // 完整清理(含 growth/principal/consent + 新表 + primary_contact FK)
    famA = (await pool.query(`insert into families(display_name) values ('甲') returning family_id`)).rows[0].family_id;
    famB = (await pool.query(`insert into families(display_name) values ('乙') returning family_id`)).rows[0].family_id;
    await pool.query(`insert into persons(family_id,person_type,parent_role,display_name,account_id) values ($1,'PARENT','GUARDIAN','妈A','phone:A')`, [famA]);
    await pool.query(`insert into persons(family_id,person_type,parent_role,display_name,account_id) values ($1,'PARENT','GUARDIAN','妈B','phone:B')`, [famB]);
    await pool.query(BACKFILL);
  });

  const get = (path: string, headers: Record<string, string>) => fetch(`${baseUrl}${path}`, { headers });

  it('VALID_BEARER member(OWNER_GUARDIAN)→ GET family 200(成员↔领域权限桥接后)', async () => {
    // 成员角色→领域权限已桥接:ACTIVE OWNER_GUARDIAN 成员经 FamilyScopeGuard + assertFamilyManagePermission 均放行。
    const { token } = await auth.issueAccountSession('phone:A');
    const r = await get(`/families/${famA}`, { authorization: `Bearer ${token}` });
    expect(r.status).toBe(200);
  });
  it('x-actor-id ONLY (no bearer) → 401 (CONSUMER_X_ACTOR_ID_TRUST=0)', async () => {
    const r = await get(`/families/${famA}`, { 'x-actor-id': 'anyone' });
    expect(r.status).toBe(401);
  });
  it('NO auth → 401', async () => {
    expect((await get(`/families/${famA}`, {})).status).toBe(401);
  });
  it('CROSS_FAMILY (account A → family B) → 403', async () => {
    const { token } = await auth.issueAccountSession('phone:A');
    const r = await get(`/families/${famB}`, { authorization: `Bearer ${token}` });
    expect(r.status).toBe(403);
  });
  it('forged familyId → 403/401 (no membership)', async () => {
    const { token } = await auth.issueAccountSession('phone:A');
    const r = await get(`/families/00000000-0000-0000-0000-000000000000`, { authorization: `Bearer ${token}` });
    expect([401, 403]).toContain(r.status);
  });
});
