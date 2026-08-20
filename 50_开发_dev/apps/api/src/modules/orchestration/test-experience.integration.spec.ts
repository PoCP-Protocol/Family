/**
 * Family / 伐木累正式测试体验工作流：真实 PostgreSQL、固定 fixture、零外部副作用。
 * 本套测试不调用支付、日历、消息、社区、真人服务或模型 provider。
 */
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';
import { TEST_EXPERIENCE_FIXTURE_VERSION } from './test-experience.contract';

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
  const familyId = (await p.query(`insert into families(display_name) values ('TEST_ONLY Experience Family') returning family_id`)).rows[0].family_id;
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
  const token = `test_experience_${randomUUID()}`;
  await p.query(`insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,now()+interval '1 day')`, [sha256(token), accountId]);
  return { tenantId, familyId, guardianId, token };
}

async function request(path: string, method: 'GET' | 'POST', token?: string, body?: unknown, extra: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': `experience-${randomUUID()}`,
      ...(token ? { cookie: `fam_session=${token}` } : {}),
      ...extra,
    },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  return { status: response.status, json: () => response.json() as Promise<any> };
}

const actionCases = [
  { page_id: 'UI-15', action: 'CREATE_INVITE', fixture_ref: 'CAMPAIGN_FAMILY_MOMENTS', kind: 'COMMERCE_INVITE' },
  { page_id: 'UI-16', action: 'CREATE_GROUP', fixture_ref: 'GROUP_PARENT_CHILD_CAMP', kind: 'COMMERCE_GROUP' },
  { page_id: 'UI-21', action: 'CREATE_BOOKING', fixture_ref: 'TEACHER_LI_SLOT_2025_05_21_1000', channel: 'VIDEO', kind: 'SERVICE_BOOKING' },
  { page_id: 'UI-23', action: 'CREATE_EVENT', fixture_ref: 'EVENT_PARENT_CHILD_SALON_2025_05_25', kind: 'EVENT_REGISTRATION' },
  { page_id: 'UI-26', action: 'PUBLISH_TEMPLATE', fixture_ref: 'POST_TEMPLATE_GROWTH_CARD', kind: 'COMMUNITY_TEMPLATE_PUBLICATION' },
] as const;

describe('DEV/TEST formal experience workflows', () => {
  it('persists the five registered test-only business operations with zero external effect and idempotent replay', async () => {
    const seed = await seedGuardian();
    const operationIds: string[] = [];
    for (const [index, input] of actionCases.entries()) {
      const key = `op-${index}-${randomUUID()}`;
      const response = await request(`/families/${seed.familyId}/orchestration/test-loop/experience/operations`, 'POST', seed.token, {
        ...input,
        fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
      }, { 'idempotency-key': key });
      expect(response.status).toBe(201);
      const result = await response.json();
      operationIds.push(result.operation_id);
      expect(result).toMatchObject({
        page_id: input.page_id,
        action: input.action,
        operation_kind: input.kind,
        fixture_ref: input.fixture_ref,
        fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
        status: 'CONFIRMED',
        environment: 'DEV',
        source: 'TEST_FIXTURE',
        external_effect: false,
      });
      expect(result.text_equivalent).toBeTruthy();

      if (index === 0) {
        const replay = await request(`/families/${seed.familyId}/orchestration/test-loop/experience/operations`, 'POST', seed.token, {
          ...input,
          fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
        }, { 'idempotency-key': key });
        expect(replay.status).toBe(201);
        expect((await replay.json()).operation_id).toBe(result.operation_id);
      }
    }
    expect(Number((await pool!.query('select count(*) n from test_experience_operations')).rows[0].n)).toBe(5);
    expect(Number((await pool!.query('select count(*) n from test_experience_operations where external_effect=true')).rows[0].n)).toBe(0);

    const projection = await request(`/families/${seed.familyId}/orchestration/test-loop/experience/customer-projection`, 'GET', seed.token);
    expect(projection.status).toBe(200);
    const body = await projection.json();
    expect(body).toMatchObject({ environment: 'DEV', source: 'TEST_FIXTURE' });
    expect(body.operations.map((operation: any) => operation.operation_id).sort()).toEqual(operationIds.sort());
    expect(body.text_equivalent).toContain('家庭的体验回执');
  });

  it('cancels only an operation belonging to the trusted family and keeps external effect false', async () => {
    const seed = await seedGuardian();
    const create = await request(`/families/${seed.familyId}/orchestration/test-loop/experience/operations`, 'POST', seed.token, {
      page_id: 'UI-21', action: 'CREATE_BOOKING', fixture_ref: 'TEACHER_LI_SLOT_2025_05_21_1000', channel: 'VIDEO', fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
    }, { 'idempotency-key': `booking-${randomUUID()}` });
    const operation = await create.json();
    const cancelled = await request(`/families/${seed.familyId}/orchestration/test-loop/experience/operations/${operation.operation_id}/cancel`, 'POST', seed.token);
    expect(cancelled.status).toBe(201);
    expect(await cancelled.json()).toMatchObject({ operation_id: operation.operation_id, status: 'CANCELLED', external_effect: false });
    const row = (await pool!.query(`select status, external_effect from test_experience_operations where operation_id=$1`, [operation.operation_id])).rows[0];
    expect(row).toEqual({ status: 'CANCELLED', external_effect: false });
  });

  it('fails closed for an invalid fixture/page pair or missing SERVICE consent with zero operation writes', async () => {
    const seed = await seedGuardian();
    const invalidFixture = await request(`/families/${seed.familyId}/orchestration/test-loop/experience/operations`, 'POST', seed.token, {
      page_id: 'UI-15', action: 'CREATE_INVITE', fixture_ref: 'UNTRUSTED_INVITE', fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
    });
    expect(invalidFixture.status).toBe(400);
    const mismatch = await request(`/families/${seed.familyId}/orchestration/test-loop/experience/operations`, 'POST', seed.token, {
      page_id: 'UI-16', action: 'CREATE_INVITE', fixture_ref: 'CAMPAIGN_FAMILY_MOMENTS', fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
    });
    expect(mismatch.status).toBe(400);
    expect(Number((await pool!.query('select count(*) n from test_experience_operations')).rows[0].n)).toBe(0);

    await cleanFamilyCoreTables(pool!);
    const withoutConsent = await seedGuardian({ service: false });
    const response = await request(`/families/${withoutConsent.familyId}/orchestration/test-loop/experience/operations`, 'POST', withoutConsent.token, {
      page_id: 'UI-26', action: 'PUBLISH_TEMPLATE', fixture_ref: 'POST_TEMPLATE_GROWTH_CARD', fixture_version: TEST_EXPERIENCE_FIXTURE_VERSION,
    });
    expect(response.status).toBe(403);
    expect(Number((await pool!.query('select count(*) n from test_experience_operations')).rows[0].n)).toBe(0);
  });
});


describe('Family page object projections and actions', () => {
  it('reads the unified family object projection and updates only private task/report state', async () => {
    const seed = await seedGuardian();
    const profileId = (await pool!.query(
      `insert into family_profile_snapshots(family_id, source, profile_payload, created_by_person_id)
       values ($1,'TEST_FIXTURE',$2::jsonb,$3) returning profile_snapshot_id`,
      [seed.familyId, JSON.stringify({ members: [{ person_id: seed.guardianId, person_type: 'PARENT', display_name: 'TEST_ONLY Guardian', life_stage: 'PARENT' }], active_intent_refs: [], active_service_record_count: 0 }), seed.guardianId],
    )).rows[0].profile_snapshot_id;
    const reportId = (await pool!.query(
      `insert into family_support_report_snapshots(family_id, source, evidence_refs, report_payload, created_by_person_id)
       values ($1,'TEST_FIXTURE',$2,$3::jsonb,$4) returning report_snapshot_id`,
      [seed.familyId, ['fixture:e1'], JSON.stringify({ support_summary: [{ key: 'focus', value: '亲子沟通', source: 'FAMILY_EXPRESSION' }] }), seed.guardianId],
    )).rows[0].report_snapshot_id;
    const taskId = (await pool!.query(
      `insert into family_page_task_items(family_id, source_page_id, source, title, task_payload, created_by_person_id)
       values ($1,'UI-09','TEST_FIXTURE','亲子沟通小练习',$2::jsonb,$3) returning task_id`,
      [seed.familyId, JSON.stringify({ duration_minutes: 15 }), seed.guardianId],
    )).rows[0].task_id;
    const recordId = (await pool!.query(
      `insert into family_service_records(family_id, record_kind, source, record_payload, created_by_person_id)
       values ($1,'FAMILY_SUPPORT_NOTE','TEST_FIXTURE',$2::jsonb,$3) returning service_record_id`,
      [seed.familyId, JSON.stringify({ note: 'private fixture record' }), seed.guardianId],
    )).rows[0].service_record_id;

    const projection = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects`, 'GET', seed.token);
    expect(projection.status).toBe(200);
    const body = await projection.json();
    expect(body).toMatchObject({ family_id: seed.familyId, source: 'TEST_FIXTURE', allowed_state_upper_bound: 'READ_ONLY_PRIVATE_FAMILY_OBJECTS' });
    expect(body.profile.profile_snapshot_id).toBe(profileId);
    expect(body.reports.map((item: any) => item.report_snapshot_id)).toContain(reportId);
    expect(body.tasks.map((item: any) => item.task_id)).toContain(taskId);
    expect(body.service_records.map((item: any) => item.service_record_id)).toContain(recordId);
    expect(body.text_equivalent).toContain('当前家庭');

    const completed = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, {
      page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: taskId,
    }, { 'idempotency-key': `page-task-${randomUUID()}` });
    expect(completed.status).toBe(201);
    expect(await completed.json()).toMatchObject({ object_id: taskId, action: 'COMPLETE_TASK', status: 'COMPLETED', external_effect: false });
    expect((await pool!.query('select status from family_page_task_items where task_id=$1', [taskId])).rows[0].status).toBe('COMPLETED');

    const withdrawn = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, {
      page_id: 'UI-29', action: 'WITHDRAW_REPORT', object_id: reportId,
    }, { 'idempotency-key': `page-report-${randomUUID()}` });
    expect(withdrawn.status).toBe(201);
    expect(await withdrawn.json()).toMatchObject({ object_id: reportId, action: 'WITHDRAW_REPORT', status: 'WITHDRAWN', external_effect: false });
    expect((await pool!.query('select status from family_support_report_snapshots where report_snapshot_id=$1', [reportId])).rows[0].status).toBe('WITHDRAWN');
  });

  it('fails closed for an object action from another family or an unsupported page/action pair', async () => {
    const seed = await seedGuardian();
    const other = await seedGuardian();
    const taskId = (await pool!.query(
      `insert into family_page_task_items(family_id, source_page_id, source, title) values ($1,'UI-09','TEST_FIXTURE','private task') returning task_id`, [other.familyId],
    )).rows[0].task_id;
    const crossFamily = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, {
      page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: taskId,
    });
    expect(crossFamily.status).toBe(400);
    const unsupported = await request(`/families/${seed.familyId}/orchestration/test-loop/page-objects/actions`, 'POST', seed.token, {
      page_id: 'UI-11', action: 'COMPLETE_TASK', object_id: taskId,
    });
    expect(unsupported.status).toBe(403);
  });
});
