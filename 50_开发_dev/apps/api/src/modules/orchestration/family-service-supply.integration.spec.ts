import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';

let app: import('@nestjs/common').INestApplication | undefined;
let baseUrl = '';
let pool: pg.Pool | undefined;
const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

type Seed = { tenantId: string; familyId: string; guardianId: string; token: string };

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

async function seedGuardian(serviceConsent = true): Promise<Seed> {
  const p = pool!;
  const familyId = (await p.query(`insert into families(display_name) values ('TEST_ONLY Supply Family') returning family_id`)).rows[0].family_id;
  const tenantId = (await p.query(
    `insert into tenants(tenant_ref, display_name, tenant_type) values ($1,'TEST_ONLY Supply Tenant','INTERNAL_SANDBOX') returning tenant_id`,
    [`tenant-supply-${randomUUID()}`],
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
  if (serviceConsent) {
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
  const token = `supply_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now()+interval '1 day')`, [sha256(token), accountId]);
  return { tenantId, familyId, guardianId, token };
}

async function seedSupply(tenantId: string, input: { ref: string; providerKind?: 'TEACHER' | 'SALON_HOST'; serviceType: string; ageBand: string; withSlot?: boolean }) {
  const p = pool!;
  const provider = await p.query(
    `insert into family_service_providers(
       scope_type, tenant_id, provider_ref, display_name, provider_kind, qualification_ref,
       qualification_status, admission_status, source_ref, fixture_only, status, attributes
     ) values ('TENANT',$1,$2,$3,$4,'qualification:test','ACTIVE','ADMITTED','fixture:service-provider',true,'ACTIVE',$5::jsonb)
     returning provider_id`,
    [tenantId, `PROVIDER_${input.ref}`, `服务者 ${input.ref}`, input.providerKind ?? 'TEACHER', JSON.stringify({ specialty: input.serviceType })],
  );
  const offering = await p.query(
    `insert into family_service_offerings(
       tenant_id, provider_id, service_offering_ref, version_no, title, admission_status,
       source_ref, fixture_only, status, attributes
     ) values ($1,$2,$3,1,$4,'ADMITTED','fixture:service-offering',true,'ACTIVE',$5::jsonb)
     returning service_offering_id`,
    [tenantId, provider.rows[0].provider_id, `SERVICE_${input.ref}`, `${input.serviceType}服务`, JSON.stringify({ service_type: input.serviceType, age_band: input.ageBand, delivery_mode: 'SANDBOX_NOOP' })],
  );
  if (input.withSlot ?? true) {
    await p.query(
      `insert into family_service_availability_slots(
         tenant_id, provider_id, service_offering_id, availability_slot_ref, starts_at, ends_at,
         channel, capacity, fixture_only, attributes
       ) values ($1,$2,$3,$4,now()+interval '2 days',now()+interval '2 days 1 hour','VIDEO',1,true,'{}'::jsonb)`,
      [tenantId, provider.rows[0].provider_id, offering.rows[0].service_offering_id, `SLOT_${input.ref}`],
    );
  }
}

async function request(path: string, token?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'x-correlation-id': `supply-${randomUUID()}`, ...(token ? { cookie: `fam_session=${token}` } : {}) },
  });
  return { status: response.status, json: () => response.json() as Promise<any> };
}

describe('UI-19 teacher supply projection', () => {
  it('returns only admitted teacher supply for the trusted family tenant with filter and next-slot summary', async () => {
    const seed = await seedGuardian();
    await seedSupply(seed.tenantId, { ref: 'COMMUNICATION', serviceType: '亲子沟通', ageBand: '小学阶段' });
    await seedSupply(seed.tenantId, { ref: 'STUDY', serviceType: '学习习惯', ageBand: '小学阶段', withSlot: false });
    await seedSupply(seed.tenantId, { ref: 'SALON', providerKind: 'SALON_HOST', serviceType: '亲子沟通', ageBand: '小学阶段' });

    const response = await request(`/families/${seed.familyId}/orchestration/test-loop/services/offerings?page_id=UI-19&service_type=${encodeURIComponent('亲子沟通')}&age_band=${encodeURIComponent('小学阶段')}&available_only=true`, seed.token);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      tenant_id: seed.tenantId,
      family_id: seed.familyId,
      source_page_id: 'UI-19',
      visibility: 'FAMILY_SCOPED_ADMITTED_SUPPLY',
      external_effect: false,
      filters: { provider_kind: 'TEACHER', service_type: '亲子沟通', age_band: '小学阶段', available_only: true },
    });
    expect(body.offerings).toMatchObject([{
      service_offering_ref: 'SERVICE_COMMUNICATION',
      provider_kind: 'TEACHER',
      qualification_status: 'ACTIVE',
      admission_status: 'ADMITTED',
      offering_status: 'ACTIVE',
      service_type: '亲子沟通',
      age_band: '小学阶段',
      availability_status: 'AVAILABLE',
      next_available_channel: 'VIDEO',
      fixture_only: true,
    }]);
    expect(body.offerings).toHaveLength(1);
    expect(body.live_session).toMatchObject({
      session_ref: 'EXPERT_LIVE_SESSION_FAMILY_GUIDANCE',
      title: '家庭沟通主题直播',
      status: expect.stringMatching(/SCHEDULED|LIVE|ENDED/),
      fixture_only: true,
      external_effect: false,
    });
    expect(Number((await pool!.query('select count(*) n from family_booking_requests')).rows[0].n)).toBe(0);
    expect(Number((await pool!.query('select count(*) n from family_booking_service_records')).rows[0].n)).toBe(0);
    expect(Number((await pool!.query('select count(*) n from family_product_events')).rows[0].n)).toBe(0);
  });

  it('fails closed without authorization or SERVICE consent and never exposes another tenant supply', async () => {
    const noConsent = await seedGuardian(false);
    await seedSupply(noConsent.tenantId, { ref: 'NO_CONSENT', serviceType: '亲子沟通', ageBand: '小学阶段' });
    const blockedConsent = await request(`/families/${noConsent.familyId}/orchestration/test-loop/services/offerings?page_id=UI-19`, noConsent.token);
    expect(blockedConsent.status).toBe(403);

    const authorized = await seedGuardian();
    const other = await seedGuardian();
    await seedSupply(other.tenantId, { ref: 'OTHER_TENANT', serviceType: '亲子沟通', ageBand: '小学阶段' });
    const isolated = await request(`/families/${authorized.familyId}/orchestration/test-loop/services/offerings?page_id=UI-19`, authorized.token);
    expect(isolated.status).toBe(200);
    const isolatedBody = await isolated.json();
    expect(isolatedBody.offerings).toEqual([]);
    expect(isolatedBody.live_session).toMatchObject({ session_ref: 'EXPERT_LIVE_SESSION_FAMILY_GUIDANCE', external_effect: false });

    const unauthenticated = await request(`/families/${authorized.familyId}/orchestration/test-loop/services/offerings?page_id=UI-19`);
    expect(unauthenticated.status).toBe(401);
    expect(Number((await pool!.query('select count(*) n from family_booking_requests')).rows[0].n)).toBe(0);
  });
});
