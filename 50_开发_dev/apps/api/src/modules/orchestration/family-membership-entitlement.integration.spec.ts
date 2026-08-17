import { INestApplication } from '@nestjs/common';
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
  const familyId = (await p.query(`insert into families(display_name) values ('TEST_ONLY Membership Family') returning family_id`)).rows[0].family_id;
  const tenantId = (await p.query(
    `insert into tenants(tenant_ref, display_name, tenant_type) values ($1,'TEST_ONLY Membership Tenant','INTERNAL_SANDBOX') returning tenant_id`,
    [`tenant-membership-${randomUUID()}`],
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
  const token = `membership_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now()+interval '1 day')`, [sha256(token), accountId]);
  return { tenantId, familyId, guardianId, token };
}

async function seedPlan(tenantId: string, planRef = 'MEMBERSHIP_ANNUAL_TEST'): Promise<void> {
  const plan = await pool!.query(
    `insert into family_membership_plans(
       scope_type, tenant_id, plan_ref, version_no, title, source_ref, fixture_only, status, attributes
     ) values ('TENANT',$1,$2,1,'年度成长会员','fixture:membership-plan',true,'ACTIVE',$3::jsonb)
     returning plan_id`,
    [tenantId, planRef, JSON.stringify({ fulfillment: 'SANDBOX_NOOP' })],
  );
  await pool!.query(
    `insert into family_membership_benefit_definitions(
       plan_id, tenant_id, benefit_ref, version_no, title, allocation_type, units_per_grant, valid_days, fixture_only, status, attributes
     ) values
       ($1,$2,'BENEFIT_CONSULT',1,'咨询权益','COUNT',2,30,true,'ACTIVE','{}'::jsonb),
       ($1,$2,'BENEFIT_CONTENT',1,'内容权益','ACCESS',1,null,true,'ACTIVE','{}'::jsonb)`,
    [plan.rows[0].plan_id, tenantId],
  );
}

async function request(path: string, method: 'GET' | 'POST', token?: string, body?: unknown, extra: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': `membership-${randomUUID()}`,
      ...(token ? { cookie: `fam_session=${token}` } : {}),
      ...extra,
    },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  return { status: response.status, json: () => response.json() as Promise<any> };
}

describe('Family membership -> benefit ledger -> customer asset DEV/TEST slice', () => {
  it('creates separate plan, subscription, grants and ledger facts with idempotent subscription replay', async () => {
    const seed = await seedGuardian();
    await seedPlan(seed.tenantId);

    const plans = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/plans`, 'GET', seed.token);
    expect(plans.status).toBe(200);
    expect((await plans.json()).plans).toMatchObject([{ plan_ref: 'MEMBERSHIP_ANNUAL_TEST', version_no: 1, fixture_only: true }]);

    const key = `membership-subscribe-${randomUUID()}`;
    const input = { page_id: 'UI-30', plan_ref: 'MEMBERSHIP_ANNUAL_TEST', plan_version: 1, attributes: { entry: 'annual_member' } };
    const created = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/subscriptions`, 'POST', seed.token, input, { 'idempotency-key': key });
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.subscription).toMatchObject({ status: 'ACTIVE', plan_ref: 'MEMBERSHIP_ANNUAL_TEST', external_effect: false, environment: 'DEV' });
    expect(body.grants).toHaveLength(2);
    expect(body.grants[0].text_equivalent).toContain('不会扣款');

    const replay = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/subscriptions`, 'POST', seed.token, input, { 'idempotency-key': key });
    expect(replay.status).toBe(201);
    expect((await replay.json()).subscription.membership_subscription_id).toBe(body.subscription.membership_subscription_id);
    expect(Number((await pool!.query('select count(*) n from family_membership_subscriptions')).rows[0].n)).toBe(1);
    expect(Number((await pool!.query('select count(*) n from family_membership_benefit_grants')).rows[0].n)).toBe(2);
    expect(Number((await pool!.query(`select count(*) n from family_membership_benefit_ledger where action='GRANT'`)).rows[0].n)).toBe(2);
    expect(Number((await pool!.query('select count(*) n from family_membership_benefit_grants where external_effect=true')).rows[0].n)).toBe(0);

    const projection = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/customer-projection`, 'GET', seed.token);
    expect(projection.status).toBe(200);
    const customer = await projection.json();
    expect(customer).toMatchObject({ tenant_id: seed.tenantId, family_id: seed.familyId, visibility: 'FAMILY_PRIVATE', projection_version: 1 });
    expect(customer.subscriptions.map((row: any) => row.membership_subscription_id)).toContain(body.subscription.membership_subscription_id);
    expect(customer.benefits.map((row: any) => row.benefit_grant_id)).toContain(body.grants[0].benefit_grant_id);
  });

  it('consumes then revokes only a trusted family grant with row-version and no external side effect', async () => {
    const seed = await seedGuardian();
    await seedPlan(seed.tenantId);
    const created = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/subscriptions`, 'POST', seed.token, {
      page_id: 'UI-30', plan_ref: 'MEMBERSHIP_ANNUAL_TEST', plan_version: 1,
    }, { 'idempotency-key': `membership-create-${randomUUID()}` });
    const body = await created.json();
    const grant = body.grants.find((row: any) => row.benefit_ref === 'BENEFIT_CONSULT');

    const consumeKey = `membership-consume-${randomUUID()}`;
    const consumed = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/benefits/consume`, 'POST', seed.token, {
      page_id: 'UI-31', benefit_grant_id: grant.benefit_grant_id, expected_row_version: grant.row_version, units: 1,
    }, { 'idempotency-key': consumeKey });
    expect(consumed.status).toBe(201);
    const consumedBody = await consumed.json();
    expect(consumedBody).toMatchObject({ action: 'CONSUME', status: 'AVAILABLE', remaining_units: 1, external_effect: false });

    const replay = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/benefits/consume`, 'POST', seed.token, {
      page_id: 'UI-31', benefit_grant_id: grant.benefit_grant_id, expected_row_version: grant.row_version, units: 1,
    }, { 'idempotency-key': consumeKey });
    expect(replay.status).toBe(201);
    expect((await replay.json()).remaining_units).toBe(1);

    const revoked = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/benefits/revoke`, 'POST', seed.token, {
      page_id: 'UI-32', benefit_grant_id: grant.benefit_grant_id, expected_row_version: consumedBody.row_version,
    });
    expect(revoked.status).toBe(201);
    const revokedBody = await revoked.json();
    expect(revokedBody).toMatchObject({ action: 'REVOKE', status: 'REVOKED', remaining_units: 1, external_effect: false });
    expect(Number((await pool!.query(`select count(*) n from family_membership_benefit_ledger where action in ('CONSUME','REVOKE')`)).rows[0].n)).toBe(2);
    // The idempotent consume replay reuses its original correlation id and therefore does not append a duplicate event.
    expect(Number((await pool!.query(`select count(*) n from family_product_events where event_type in ('membership_benefit_consumed','membership_benefit_revoked')`)).rows[0].n)).toBe(2);
    const persistedGrant = await pool!.query(`select status, remaining_units, row_version from family_membership_benefit_grants where benefit_grant_id=$1`, [grant.benefit_grant_id]);
    expect(persistedGrant.rows[0]).toMatchObject({ status: 'REVOKED', remaining_units: 1, row_version: revokedBody.row_version });
    const projectionAfterRevoke = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/customer-projection`, 'GET', seed.token);
    expect(projectionAfterRevoke.status).toBe(200);
    const assetAfterRevoke = await projectionAfterRevoke.json();
    expect(assetAfterRevoke.subscriptions).toHaveLength(1);
    expect(assetAfterRevoke.subscriptions[0]).toMatchObject({ membership_subscription_id: body.subscription.membership_subscription_id, status: 'ACTIVE' });
    expect(assetAfterRevoke.benefits.map((row: any) => row.benefit_grant_id)).not.toContain(grant.benefit_grant_id);

    const stale = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/benefits/revoke`, 'POST', seed.token, {
      page_id: 'UI-32', benefit_grant_id: grant.benefit_grant_id, expected_row_version: consumedBody.row_version,
    });
    expect(stale.status).toBe(409);
    expect(Number((await pool!.query(`select count(*) n from family_membership_benefit_ledger where action in ('CONSUME','REVOKE')`)).rows[0].n)).toBe(2);
  });

  it('fails closed for missing SERVICE consent, wrong page and cross-tenant membership plan', async () => {
    const noConsent = await seedGuardian({ service: false });
    await seedPlan(noConsent.tenantId);
    const blockedConsent = await request(`/families/${noConsent.familyId}/orchestration/test-loop/membership/subscriptions`, 'POST', noConsent.token, {
      page_id: 'UI-30', plan_ref: 'MEMBERSHIP_ANNUAL_TEST', plan_version: 1,
    });
    expect(blockedConsent.status).toBe(403);
    expect(Number((await pool!.query('select count(*) n from family_membership_subscriptions')).rows[0].n)).toBe(0);

    await cleanFamilyCoreTables(pool!);
    const seed = await seedGuardian();
    const other = await seedGuardian();
    await seedPlan(other.tenantId, 'MEMBERSHIP_OTHER_TENANT');
    const blockedTenant = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/subscriptions`, 'POST', seed.token, {
      page_id: 'UI-30', plan_ref: 'MEMBERSHIP_OTHER_TENANT', plan_version: 1,
    });
    expect(blockedTenant.status).toBe(403);

    const wrongPage = await request(`/families/${seed.familyId}/orchestration/test-loop/membership/subscriptions`, 'POST', seed.token, {
      page_id: 'UI-29', plan_ref: 'MEMBERSHIP_OTHER_TENANT', plan_version: 1,
    });
    expect(wrongPage.status).toBe(400);
    expect(Number((await pool!.query('select count(*) n from family_membership_subscriptions')).rows[0].n)).toBe(0);
  });
});
