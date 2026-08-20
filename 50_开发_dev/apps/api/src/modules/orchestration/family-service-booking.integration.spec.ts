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
  const familyId = (await p.query(`insert into families(display_name) values ('TEST_ONLY Booking Family') returning family_id`)).rows[0].family_id;
  const tenantId = (await p.query(
    `insert into tenants(tenant_ref, display_name, tenant_type) values ($1,'TEST_ONLY Booking Tenant','INTERNAL_SANDBOX') returning tenant_id`,
    [`tenant-booking-${randomUUID()}`],
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
  const token = `booking_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now()+interval '1 day')`, [sha256(token), accountId]);
  return { tenantId, familyId, guardianId, token };
}

async function seedBookingSupply(tenantId: string, suffix = 'PRIMARY') {
  const p = pool!;
  const provider = await p.query(
    `insert into family_service_providers(
       scope_type, tenant_id, provider_ref, display_name, provider_kind, qualification_ref,
       qualification_status, admission_status, source_ref, fixture_only, status, attributes
     ) values ('TENANT',$1,$2,'法咪莉校长','TEACHER','qualification:test','ACTIVE','ADMITTED','fixture:service-provider',true,'ACTIVE',$3::jsonb)
     returning provider_id`,
    [tenantId, `PROVIDER_${suffix}`, JSON.stringify({ specialty: 'PARENT_CHILD_COMMUNICATION' })],
  );
  const offering = await p.query(
    `insert into family_service_offerings(
       tenant_id, provider_id, service_offering_ref, version_no, title, admission_status,
       source_ref, fixture_only, status, attributes
     ) values ($1,$2,$3,1,'亲子沟通服务','ADMITTED','fixture:service-offering',true,'ACTIVE',$4::jsonb)
     returning service_offering_id`,
    [tenantId, provider.rows[0].provider_id, `SERVICE_PARENT_CHILD_${suffix}`, JSON.stringify({ delivery_mode: 'SANDBOX_NOOP' })],
  );
  await p.query(
    `insert into family_service_availability_slots(
       tenant_id, provider_id, service_offering_id, availability_slot_ref, starts_at, ends_at,
       channel, capacity, fixture_only, attributes
     ) values ($1,$2,$3,$4,now()+interval '2 days',now()+interval '2 days 1 hour','VIDEO',1,true,$5::jsonb)`,
    [tenantId, provider.rows[0].provider_id, offering.rows[0].service_offering_id, `SLOT_${suffix}`, JSON.stringify({ fixture: true })],
  );
  return { offeringRef: `SERVICE_PARENT_CHILD_${suffix}`, slotRef: `SLOT_${suffix}` };
}

async function request(path: string, method: 'GET' | 'POST', token?: string, body?: unknown, extra: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': `booking-${randomUUID()}`,
      ...(token ? { cookie: `fam_session=${token}` } : {}),
      ...extra,
    },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  return { status: response.status, json: () => response.json() as Promise<any> };
}

describe('Family service offering -> booking request -> service record DEV/TEST slice', () => {
  it('reads admitted supply, creates one idempotent booking request and emits a no-op service record', async () => {
    const seed = await seedGuardian();
    const supply = await seedBookingSupply(seed.tenantId);

    const offerings = await request(`/families/${seed.familyId}/orchestration/test-loop/services/offerings?page_id=UI-19`, 'GET', seed.token);
    expect(offerings.status).toBe(200);
    expect((await offerings.json()).offerings).toMatchObject([{ service_offering_ref: supply.offeringRef, qualification_status: 'ACTIVE', fixture_only: true }]);

    const slots = await request(`/families/${seed.familyId}/orchestration/test-loop/services/slots?service_offering_ref=${supply.offeringRef}&service_offering_version=1`, 'GET', seed.token);
    expect(slots.status).toBe(200);
    expect((await slots.json()).slots).toMatchObject([{ availability_slot_ref: supply.slotRef, status: 'AVAILABLE', channel: 'VIDEO' }]);

    const key = `booking-${randomUUID()}`;
    const input = { page_id: 'UI-21', service_offering_ref: supply.offeringRef, service_offering_version: 1, availability_slot_ref: supply.slotRef, attributes: { entry: 'teacher_detail' } };
    const created = await request(`/families/${seed.familyId}/orchestration/test-loop/services/booking-requests`, 'POST', seed.token, input, { 'idempotency-key': key });
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.booking).toMatchObject({ status: 'REQUESTED', service_offering_ref: supply.offeringRef, availability_slot_ref: supply.slotRef, external_effect: false, environment: 'DEV' });
    expect(body.service_record).toMatchObject({ status: 'PENDING', external_effect: false });
    expect(body.booking.text_equivalent).toContain('不会发送通知');

    const replay = await request(`/families/${seed.familyId}/orchestration/test-loop/services/booking-requests`, 'POST', seed.token, input, { 'idempotency-key': key });
    expect(replay.status).toBe(201);
    expect((await replay.json()).booking.booking_request_id).toBe(body.booking.booking_request_id);
    expect(Number((await pool!.query('select count(*) n from family_booking_requests')).rows[0].n)).toBe(1);
    expect(Number((await pool!.query('select count(*) n from family_booking_service_records')).rows[0].n)).toBe(1);
    expect(Number((await pool!.query(`select count(*) n from family_product_events where event_type='booking_request_submitted'`)).rows[0].n)).toBe(1);
    expect(Number((await pool!.query('select count(*) n from family_booking_requests where external_effect=true')).rows[0].n)).toBe(0);

    const projection = await request(`/families/${seed.familyId}/orchestration/test-loop/services/customer-projection`, 'GET', seed.token);
    expect(projection.status).toBe(200);
    const customer = await projection.json();
    expect(customer).toMatchObject({ tenant_id: seed.tenantId, family_id: seed.familyId, visibility: 'FAMILY_PRIVATE', projection_version: 1 });
    expect(customer.bookings.map((row: any) => row.booking_request_id)).toContain(body.booking.booking_request_id);
    expect(customer.service_records.map((row: any) => row.source_booking_request_id)).toContain(body.booking.booking_request_id);
  });

  it('cancels only the trusted family booking with row_version, releases slot capacity and cancels the local service record', async () => {
    const seed = await seedGuardian();
    const supply = await seedBookingSupply(seed.tenantId);
    const created = await request(`/families/${seed.familyId}/orchestration/test-loop/services/booking-requests`, 'POST', seed.token, {
      page_id: 'UI-21', service_offering_ref: supply.offeringRef, service_offering_version: 1, availability_slot_ref: supply.slotRef,
    }, { 'idempotency-key': `create-${randomUUID()}` });
    const body = await created.json();
    const cancelled = await request(`/families/${seed.familyId}/orchestration/test-loop/services/booking-requests/cancel`, 'POST', seed.token, {
      page_id: 'UI-24', booking_request_id: body.booking.booking_request_id, expected_row_version: body.booking.row_version,
    });
    expect(cancelled.status).toBe(201);
    expect(await cancelled.json()).toMatchObject({ booking_request_id: body.booking.booking_request_id, status: 'CANCELLED', external_effect: false });
    expect((await pool!.query(`select status from family_booking_service_records where booking_service_record_id=$1`, [body.service_record.service_record_id])).rows[0].status).toBe('CANCELLED');
    expect((await pool!.query(`select status, reserved_count from family_service_availability_slots where availability_slot_ref=$1`, [supply.slotRef])).rows[0]).toMatchObject({ status: 'AVAILABLE', reserved_count: 0 });
    expect(Number((await pool!.query(`select count(*) n from family_product_events where event_type='booking_request_cancelled'`)).rows[0].n)).toBe(1);

    const stale = await request(`/families/${seed.familyId}/orchestration/test-loop/services/booking-requests/cancel`, 'POST', seed.token, {
      page_id: 'UI-24', booking_request_id: body.booking.booking_request_id, expected_row_version: body.booking.row_version,
    });
    expect(stale.status).toBe(409);
  });

  it('fails closed for missing SERVICE consent, wrong page and cross-tenant service supply', async () => {
    const noConsent = await seedGuardian({ service: false });
    const supply = await seedBookingSupply(noConsent.tenantId);
    const blockedConsent = await request(`/families/${noConsent.familyId}/orchestration/test-loop/services/booking-requests`, 'POST', noConsent.token, {
      page_id: 'UI-21', service_offering_ref: supply.offeringRef, service_offering_version: 1, availability_slot_ref: supply.slotRef,
    });
    expect(blockedConsent.status).toBe(403);
    expect(Number((await pool!.query('select count(*) n from family_booking_requests')).rows[0].n)).toBe(0);

    await cleanFamilyCoreTables(pool!);
    const seed = await seedGuardian();
    const other = await seedGuardian();
    const otherSupply = await seedBookingSupply(other.tenantId, 'OTHER');
    const blockedTenant = await request(`/families/${seed.familyId}/orchestration/test-loop/services/booking-requests`, 'POST', seed.token, {
      page_id: 'UI-21', service_offering_ref: otherSupply.offeringRef, service_offering_version: 1, availability_slot_ref: otherSupply.slotRef,
    });
    expect(blockedTenant.status).toBe(403);

    const wrongPage = await request(`/families/${seed.familyId}/orchestration/test-loop/services/booking-requests`, 'POST', seed.token, {
      page_id: 'UI-18', service_offering_ref: otherSupply.offeringRef, service_offering_version: 1, availability_slot_ref: otherSupply.slotRef,
    });
    expect(wrongPage.status).toBe(400);
    expect(Number((await pool!.query('select count(*) n from family_booking_requests')).rows[0].n)).toBe(0);
  });
});
