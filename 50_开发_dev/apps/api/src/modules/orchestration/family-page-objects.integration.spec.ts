/**
 * Family / 伐木累 Family Page Objects focused slice：真实 PostgreSQL、家庭私有对象、零外部副作用。
 * 不覆盖 Web、多模态、Test Experience、Commerce、Service Booking 或 Membership。
 */
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
interface FamilyObjects { profileId: string; reportId: string; taskId: string; ui31TaskId: string; recordId: string; }

async function seedGuardian(opts: { service?: boolean } = {}): Promise<Seed> {
  const p = pool!;
  const familyId = (await p.query(`insert into families(display_name) values ('TEST_ONLY Page Objects Family') returning family_id`)).rows[0].family_id;
  const tenantId = (await p.query(
    `insert into tenants(tenant_ref, display_name, tenant_type) values ($1,'TEST_ONLY Tenant','INTERNAL_SANDBOX') returning tenant_id`,
    [`tenant-${randomUUID()}`],
  )).rows[0].tenant_id;
  await p.query(`insert into tenant_family_bindings(tenant_id, family_id, status) values ($1,$2,'ACTIVE')`, [tenantId, familyId]);
  const guardianId = (await p.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','TEST_ONLY Guardian') returning person_id`, [familyId])).rows[0].person_id;
  const childId = (await p.query(`insert into persons(family_id, person_type, display_name, birth_date) values ($1,'CHILD','TEST_ONLY Child','2012-06-01') returning person_id`, [familyId])).rows[0].person_id;
  if (opts.service ?? true) {
    await p.query(`insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at)
                   values ($1,$2,$3,'SERVICE','GRANTED','test-only',now())`, [familyId, childId, guardianId]);
  }
  const accountId = (await p.query(`insert into accounts(status) values ('ACTIVE') returning account_id`)).rows[0].account_id;
  await p.query(`insert into account_person_bindings(account_id, person_id, status) values ($1,$2,'ACTIVE')`, [accountId, guardianId]);
  await p.query(`insert into tenant_account_memberships(tenant_id, account_id, role, status) values ($1,$2,'TENANT_OWNER','ACTIVE')`, [tenantId, accountId]);
  await p.query(`insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now())`, [familyId, guardianId]);
  const token = `page_objects_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now()+interval '1 day')`, [sha256(token), accountId]);
  return { tenantId, familyId, guardianId, token };
}

async function seedFamilyObjects(seed: Seed): Promise<FamilyObjects> {
  const p = pool!;
  const profileId = (await p.query(
    `insert into family_profile_snapshots(family_id, source, profile_payload, created_by_person_id)
     values ($1,'TEST_FIXTURE',$2::jsonb,$3) returning profile_snapshot_id`,
    [seed.familyId, JSON.stringify({ members: [{ person_id: seed.guardianId, person_type: 'PARENT', display_name: 'TEST_ONLY Guardian', life_stage: 'PARENT' }], active_intent_refs: [], active_service_record_count: 1 }), seed.guardianId],
  )).rows[0].profile_snapshot_id;
  const reportId = (await p.query(
    `insert into family_support_report_snapshots(family_id, source, evidence_refs, report_payload, created_by_person_id)
     values ($1,'TEST_FIXTURE',$2,$3::jsonb,$4) returning report_snapshot_id`,
    [seed.familyId, ['fixture:e1'], JSON.stringify({ support_summary: [{ key: 'focus', value: '亲子沟通', source: 'FAMILY_EXPRESSION' }] }), seed.guardianId],
  )).rows[0].report_snapshot_id;
  const taskId = (await p.query(
    `insert into family_page_task_items(family_id, source_page_id, source, title, task_payload, created_by_person_id)
     values ($1,'UI-09','TEST_FIXTURE','亲子沟通小练习',$2::jsonb,$3) returning task_id`,
    [seed.familyId, JSON.stringify({ duration_minutes: 15 }), seed.guardianId],
  )).rows[0].task_id;
  const ui31TaskId = (await p.query(
    `insert into family_page_task_items(family_id, source_page_id, source, title, task_payload, created_by_person_id)
     values ($1,'UI-31','TEST_FIXTURE','服务计划回顾',$2::jsonb,$3) returning task_id`,
    [seed.familyId, JSON.stringify({ duration_minutes: 20 }), seed.guardianId],
  )).rows[0].task_id;
  const recordId = (await p.query(
    `insert into family_service_records(family_id, record_kind, source, record_payload, created_by_person_id)
     values ($1,'FAMILY_SUPPORT_NOTE','TEST_FIXTURE',$2::jsonb,$3) returning service_record_id`,
    [seed.familyId, JSON.stringify({ note: 'private fixture record' }), seed.guardianId],
  )).rows[0].service_record_id;
  return { profileId, reportId, taskId, ui31TaskId, recordId };
}

async function request(path: string, method: 'GET' | 'POST', token?: string, body?: unknown, extra: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': `page-objects-${randomUUID()}`,
      ...(token ? { cookie: `fam_session=${token}` } : {}),
      ...extra,
    },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  return { status: response.status, json: () => response.json() as Promise<any> };
}

describe('Family Page Objects private projection and actions', () => {
  it('reads the unified private family object projection and completes a task with idempotent replay and zero external effect', async () => {
    const seed = await seedGuardian();
    const objects = await seedFamilyObjects(seed);

    const projection = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects`, 'GET', seed.token);
    expect(projection.status).toBe(200);
    const projectionBody = await projection.json();
    expect(projectionBody).toMatchObject({
      family_id: seed.familyId,
      source: 'TEST_FIXTURE',
      allowed_state_upper_bound: 'READ_ONLY_PRIVATE_FAMILY_OBJECTS',
    });
    expect(projectionBody.profile.profile_snapshot_id).toBe(objects.profileId);
    expect(projectionBody.reports.map((item: any) => item.report_snapshot_id)).toContain(objects.reportId);
    expect(projectionBody.tasks).toContainEqual(expect.objectContaining({ task_id: objects.taskId, source_page_id: 'UI-09', status: 'OPEN' }));
    expect(projectionBody.tasks).toContainEqual(expect.objectContaining({ task_id: objects.ui31TaskId, source_page_id: 'UI-31', status: 'OPEN' }));
    expect(projectionBody.service_records.map((item: any) => item.service_record_id)).toContain(objects.recordId);
    expect(projectionBody.service_records[0]).toMatchObject({ external_effect: false });

    const idempotencyKey = `page-task-${randomUUID()}`;
    const input = { page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: objects.taskId };
    const completed = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, input, { 'idempotency-key': idempotencyKey });
    expect(completed.status).toBe(201);
    const completedBody = await completed.json();
    expect(completedBody).toMatchObject({ object_id: objects.taskId, action: 'COMPLETE_TASK', status: 'COMPLETED', external_effect: false, allowed_state_upper_bound: 'PRIVATE_FAMILY_OBJECT_STATE' });

    const replay = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, input, { 'idempotency-key': idempotencyKey });
    expect(replay.status).toBe(201);
    expect(await replay.json()).toEqual(completedBody);
    expect((await pool!.query('select status from family_page_task_items where task_id=$1', [objects.taskId])).rows[0].status).toBe('COMPLETED');
    expect((await pool!.query('select status from family_page_task_items where task_id=$1', [objects.ui31TaskId])).rows[0].status).toBe('OPEN');
    expect(Number((await pool!.query('select count(*) n from family_page_task_items where family_id=$1', [seed.familyId])).rows[0].n)).toBe(2);
  });

  it('fails closed for a wrong page, a cross-family and cross-tenant object, or missing SERVICE consent without changing private facts', async () => {
    const seed = await seedGuardian();
    const own = await seedFamilyObjects(seed);
    const other = await seedGuardian();
    const foreign = await seedFamilyObjects(other);

    const wrongPage = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, {
      page_id: 'UI-11', action: 'COMPLETE_TASK', object_id: own.taskId,
    });
    expect(wrongPage.status).toBe(403);

    const wrongSourcePageTask = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, {
      page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: own.ui31TaskId,
    });
    expect(wrongSourcePageTask.status).toBe(400);
    expect((await pool!.query('select status from family_page_task_items where task_id=$1', [own.ui31TaskId])).rows[0].status).toBe('OPEN');

    const crossFamilyAndTenant = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, {
      page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: foreign.taskId,
    });
    expect(crossFamilyAndTenant.status).toBe(400);
    expect((await pool!.query('select status from family_page_task_items where task_id=$1', [foreign.taskId])).rows[0].status).toBe('OPEN');

    await cleanFamilyCoreTables(pool!);
    const withoutConsent = await seedGuardian({ service: false });
    const consentless = await seedFamilyObjects(withoutConsent);
    const missingConsent = await request(`/families/${withoutConsent.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', withoutConsent.token, {
      page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: consentless.taskId,
    });
    expect(missingConsent.status).toBe(403);
    expect((await pool!.query('select status from family_page_task_items where task_id=$1', [consentless.taskId])).rows[0].status).toBe('OPEN');
    expect(Number((await pool!.query('select count(*) n from family_service_records where external_effect=true')).rows[0].n)).toBe(0);
  });
});
