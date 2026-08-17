import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';

let app: INestApplication | undefined;
let baseUrl = '';
let pool: pg.Pool | undefined;
const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set');
  process.env.DATABASE_URL = url;
  process.env.FAMILY_TEST_FULL_LOOP_ENABLED = 'true';
  process.env.NODE_ENV = 'development';
  pool = createTestPool();
  await pool.query('select 1');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});

afterAll(async () => {
  await app?.close();
  await pool?.end();
  delete process.env.FAMILY_TEST_FULL_LOOP_ENABLED;
});

beforeEach(async () => { await cleanFamilyCoreTables(pool!); });

interface Seed { tenantId: string; familyId: string; guardianId: string; token: string; }

async function seedGuardian(opts: { service?: boolean } = {}): Promise<Seed> {
  const p = pool!;
  const familyId = (await p.query(`insert into families(display_name) values ('TEST_ONLY Commerce Family') returning family_id`)).rows[0].family_id;
  const tenantId = (await p.query(
    `insert into tenants(tenant_ref, display_name, tenant_type) values ($1,'TEST_ONLY Commerce Tenant','INTERNAL_SANDBOX') returning tenant_id`,
    [`tenant-commerce-${randomUUID()}`],
  )).rows[0].tenant_id;
  await p.query(`insert into tenant_family_bindings(tenant_id, family_id, status) values ($1,$2,'ACTIVE')`, [tenantId, familyId]);
  const guardianId = (await p.query(
    `insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','TEST_ONLY Guardian') returning person_id`,
    [familyId],
  )).rows[0].person_id;
  const childId = (await p.query(
    `insert into persons(family_id, person_type, display_name, birth_date) values ($1,'CHILD','TEST_ONLY Child','2012-06-01') returning person_id`,
    [familyId],
  )).rows[0].person_id;
  if (opts.service ?? true) {
    await p.query(
      `insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at)
       values ($1,$2,$3,'SERVICE','GRANTED','test-only',now())`,
      [familyId, childId, guardianId],
    );
  }
  const accountId = (await p.query(`insert into accounts(status) values ('ACTIVE') returning account_id`)).rows[0].account_id;
  await p.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [accountId, guardianId]);
  await p.query(`insert into tenant_account_memberships(tenant_id, account_id, role, status) values ($1,$2,'TENANT_OWNER','ACTIVE')`, [tenantId, accountId]);
  await p.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now())`, [familyId, guardianId]);
  const token = `commerce_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now()+interval '1 day')`, [sha256(token), accountId]);
  return { tenantId, familyId, guardianId, token };
}

async function seedProduct(tenantId: string, productRef = 'PRODUCT_PARENT_CHILD_CAMP'): Promise<void> {
  await pool!.query(
    `insert into family_product_offerings(
       scope_type, tenant_id, product_ref, version_no, title, admission_status, source_ref,
       fixture_only, status, attributes
     ) values ('TENANT',$1,$2,1,'亲子成长营','ADMITTED','fixture:commerce-product',true,'ACTIVE',$3::jsonb)`,
    [tenantId, productRef, JSON.stringify({ delivery_mode: 'SANDBOX_NOOP', category: 'PARENT_CHILD' })],
  );
}

async function request(path: string, method: 'GET' | 'POST', token?: string, body?: unknown, extra: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': `commerce-${randomUUID()}`,
      ...(token ? { cookie: `fam_session=${token}` } : {}),
      ...extra,
    },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  return { status: response.status, json: () => response.json() as Promise<any> };
}

describe('Family commerce intent -> entitlement DEV/TEST slice', () => {
  it('creates independent product, order-intent, entitlement and event facts with idempotent replay', async () => {
    const seed = await seedGuardian();
    await seedProduct(seed.tenantId);

    const products = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/products`, 'GET', seed.token);
    expect(products.status).toBe(200);
    expect((await products.json()).products).toMatchObject([{ product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1, fixture_only: true }]);

    const key = `intent-${randomUUID()}`;
    const input = { page_id: 'UI-14', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1, attributes: { entry: 'catalog_detail' } };
    const created = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/order-intents`, 'POST', seed.token, input, { 'idempotency-key': key });
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.intent).toMatchObject({ status: 'SUBMITTED', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', external_effect: false, environment: 'DEV' });
    expect(body.entitlement).toMatchObject({ status: 'AVAILABLE', external_effect: false });
    expect(body.intent.text_equivalent).toContain('不会扣款');

    const replay = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/order-intents`, 'POST', seed.token, input, { 'idempotency-key': key });
    expect(replay.status).toBe(201);
    expect((await replay.json()).intent.order_intent_id).toBe(body.intent.order_intent_id);
    expect(Number((await pool!.query('select count(*) n from family_order_intents')).rows[0].n)).toBe(1);
    expect(Number((await pool!.query('select count(*) n from family_order_intent_lines')).rows[0].n)).toBe(1);
    expect(Number((await pool!.query('select count(*) n from family_entitlements')).rows[0].n)).toBe(1);
    expect(Number((await pool!.query('select count(*) n from family_product_events where event_type=$1', ['order_intent_submitted'])).rows[0].n)).toBe(1);
    expect(Number((await pool!.query('select count(*) n from family_entitlements where external_effect=true')).rows[0].n)).toBe(0);

    const projection = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/customer-projection`, 'GET', seed.token);
    expect(projection.status).toBe(200);
    const customer = await projection.json();
    expect(customer).toMatchObject({ tenant_id: seed.tenantId, family_id: seed.familyId, visibility: 'FAMILY_PRIVATE', projection_version: 1 });
    expect(customer.order_intents.map((row: any) => row.order_intent_id)).toContain(body.intent.order_intent_id);
    expect(customer.entitlements.map((row: any) => row.entitlement_id)).toContain(body.entitlement.entitlement_id);
  });

  it('cancels only the trusted family intent using row_version and revokes its local entitlement receipt', async () => {
    const seed = await seedGuardian();
    await seedProduct(seed.tenantId);
    const created = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/order-intents`, 'POST', seed.token, {
      page_id: 'UI-14', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1,
    }, { 'idempotency-key': `create-${randomUUID()}` });
    const body = await created.json();
    const cancelled = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/order-intents/cancel`, 'POST', seed.token, {
      page_id: 'UI-17', order_intent_id: body.intent.order_intent_id, expected_row_version: body.intent.row_version,
    });
    expect(cancelled.status).toBe(201);
    expect(await cancelled.json()).toMatchObject({ order_intent_id: body.intent.order_intent_id, status: 'CANCELLED', external_effect: false });
    expect((await pool!.query(`select status from family_entitlements where entitlement_id=$1`, [body.entitlement.entitlement_id])).rows[0].status).toBe('REVOKED');
    expect(Number((await pool!.query(`select count(*) n from family_product_events where event_type='order_intent_cancelled'`)).rows[0].n)).toBe(1);

    const stale = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/order-intents/cancel`, 'POST', seed.token, {
      page_id: 'UI-17', order_intent_id: body.intent.order_intent_id, expected_row_version: body.intent.row_version,
    });
    expect(stale.status).toBe(409);
  });

  it('fails closed for missing SERVICE consent, non-admitted product, wrong page and cross-tenant catalog visibility', async () => {
    const noConsent = await seedGuardian({ service: false });
    await seedProduct(noConsent.tenantId);
    const blockedConsent = await request(`/families/${noConsent.familyId}/orchestration/test-loop/commerce/order-intents`, 'POST', noConsent.token, {
      page_id: 'UI-14', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1,
    });
    expect(blockedConsent.status).toBe(403);
    expect(Number((await pool!.query('select count(*) n from family_order_intents')).rows[0].n)).toBe(0);

    await cleanFamilyCoreTables(pool!);
    const seed = await seedGuardian();
    const other = await seedGuardian();
    await seedProduct(other.tenantId, 'PRODUCT_PRIVATE_OTHER_TENANT');
    const blockedTenant = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/order-intents`, 'POST', seed.token, {
      page_id: 'UI-14', product_ref: 'PRODUCT_PRIVATE_OTHER_TENANT', product_version: 1,
    });
    expect(blockedTenant.status).toBe(403);

    const wrongPage = await request(`/families/${seed.familyId}/orchestration/test-loop/commerce/order-intents`, 'POST', seed.token, {
      page_id: 'UI-13', product_ref: 'PRODUCT_PRIVATE_OTHER_TENANT', product_version: 1,
    });
    expect(wrongPage.status).toBe(400);
    expect(Number((await pool!.query('select count(*) n from family_order_intents')).rows[0].n)).toBe(0);
  });
});
