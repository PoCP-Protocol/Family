import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { seedTrustedFamilyGuardian } from '../../test/family-auth-fixtures';
import { FamilyDataLifecycleService } from './family-data-lifecycle.service';
import { FamilyRepository } from './family.repository';

describe('FamilyDataLifecycleService governance integration', () => {
  let pool: pg.Pool;
  let repository: FamilyRepository;
  let service: FamilyDataLifecycleService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new FamilyRepository();
    service = new FamilyDataLifecycleService(repository);
  });
  beforeEach(async () => cleanFamilyCoreTables(pool));
  afterAll(async () => { await repository?.onModuleDestroy(); await pool?.end(); });

  it('returns metadata-only policy and records a distinct guardian approval for synthetic validation only', async () => {
    const first = await seedTrustedFamilyGuardian(pool, 'governance-first', { displayName: '治理家庭', guardianName: '发起监护人', parentRole: 'GUARDIAN' });
    const second = await addSecondGuardian(first.familyId);

    const policy = await service.policy(first.familyId, first.guardianId);
    expect(policy.execution_boundary).toBe('POLICY_AND_WHITELIST_PREVIEW_ONLY_NO_REAL_EXPORT_NO_RETENTION_EXECUTION_NO_DELETE');
    expect(JSON.stringify(policy)).not.toContain('发起监护人');
    expect(policy.export_field_whitelist.flatMap((row) => row.field_names)).not.toContain('response_text');
    expect(policy.export_field_whitelist.flatMap((row) => row.field_names)).not.toContain('display_name');

    const created = await service.createRequest({
      family_id: first.familyId,
      request_type: 'EXPORT_REQUEST',
      reason_text: '仅请求治理审批，不生成真实数据文件。',
      idempotency_key: 'idem-governance-create',
    }, first.meta);
    const submitted = await service.submitForReview({ family_id: first.familyId, request_id: created.request.family_data_lifecycle_request_id, idempotency_key: 'idem-governance-submit' }, first.meta);
    expect(submitted.status).toBe('PENDING_HUMAN_REVIEW');

    await expect(service.recordHumanDecision({
      family_id: first.familyId,
      request_id: created.request.family_data_lifecycle_request_id,
      decision: 'APPROVED_FOR_SYNTHETIC_VALIDATION',
      reason_code: 'SYNTHETIC_ONLY_POLICY_PASS',
      idempotency_key: 'idem-governance-self-review',
    }, first.meta)).rejects.toThrow('distinct_guardian_review_required');

    const decision = await service.recordHumanDecision({
      family_id: first.familyId,
      request_id: created.request.family_data_lifecycle_request_id,
      decision: 'APPROVED_FOR_SYNTHETIC_VALIDATION',
      reason_code: 'SYNTHETIC_ONLY_POLICY_PASS',
      idempotency_key: 'idem-governance-review',
    }, second.meta);
    expect(decision).toMatchObject({ decision: 'APPROVED_FOR_SYNTHETIC_VALIDATION', policy_version: 'FAMILY_DATA_GOVERNANCE_V1' });

    const requests = await service.listRequests(first.familyId, first.guardianId);
    expect(requests[0].status).toBe('APPROVED_FOR_SYNTHETIC_VALIDATION');
    await expectCount('family_data_lifecycle_request_reviews', 1);
    await expectCount('audit_logs', 3);
    await expectCount('outbox_events', 3);
    await expectCount('families', 1);
    await expectCount('growth_intents', 0);
    await expectCount('service_cases', 0);
  });

  it('fails closed for a foreign actor, a non-requestor submit, and a review before pending', async () => {
    const first = await seedTrustedFamilyGuardian(pool, 'governance-a', { displayName: '第一治理家庭', guardianName: '第一监护人', parentRole: 'GUARDIAN' });
    const second = await seedTrustedFamilyGuardian(pool, 'governance-b', { displayName: '第二治理家庭', guardianName: '第二监护人', parentRole: 'GUARDIAN' });
    const request = await service.createRequest({ family_id: first.familyId, request_type: 'DELETE_REQUEST', idempotency_key: 'idem-governance-request' }, first.meta);

    await expect(service.policy(first.familyId, second.guardianId)).rejects.toThrow('trusted_family_manage_context_required');
    await expect(service.submitForReview({ family_id: first.familyId, request_id: request.request.family_data_lifecycle_request_id, idempotency_key: 'idem-governance-foreign-submit' }, second.meta)).rejects.toThrow('trusted_family_manage_context_required');
    await expect(service.recordHumanDecision({
      family_id: first.familyId,
      request_id: request.request.family_data_lifecycle_request_id,
      decision: 'REJECTED',
      reason_code: 'POLICY_NOT_SATISFIED',
      idempotency_key: 'idem-governance-not-pending',
    }, first.meta)).rejects.toThrow('lifecycle_request_not_pending_human_review');
    await expectCount('family_data_lifecycle_request_reviews', 0);
  });

  async function addSecondGuardian(familyId: string) {
    const account = await pool.query<{ account_id: string }>(`insert into accounts(external_ref) values ('governance-second@family.local') returning account_id`);
    const person = await pool.query<{ person_id: string }>(
      `insert into persons(family_id,person_type,parent_role,display_name,account_id)
       values ($1,'PARENT','GUARDIAN','复核监护人','governance-second@family.local') returning person_id`,
      [familyId],
    );
    await pool.query(`insert into account_person_bindings(account_id,person_id,status) values ($1,$2,'ACTIVE')`, [account.rows[0].account_id, person.rows[0].person_id]);
    await pool.query(`insert into family_memberships(family_id,person_id,role,status,joined_at) values ($1,$2,'GUARDIAN','ACTIVE',now())`, [familyId, person.rows[0].person_id]);
    return { guardianId: person.rows[0].person_id, meta: { actor: person.rows[0].person_id, correlationId: 'governance-second-review', source: 'vitest', occurredAt: new Date().toISOString() } };
  }

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});
