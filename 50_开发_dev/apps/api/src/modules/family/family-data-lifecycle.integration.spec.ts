import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { seedTrustedFamilyGuardian } from '../../test/family-auth-fixtures';
import { FamilyDataLifecycleService } from './family-data-lifecycle.service';
import { FamilyRepository } from './family.repository';

describe('FamilyDataLifecycleService integration', () => {
  let pool: pg.Pool;
  let repository: FamilyRepository;
  let service: FamilyDataLifecycleService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new FamilyRepository();
    service = new FamilyDataLifecycleService(repository);
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
  });

  afterAll(async () => {
    await repository?.onModuleDestroy();
    await pool?.end();
  });

  it('records all lifecycle request types idempotently, creates audit/event, and exposes a content-free preview', async () => {
    const seed = await seedTrustedFamilyGuardian(pool, 'lifecycle-positive', { displayName: '生命周期家庭', guardianName: '监护人', parentRole: 'GUARDIAN' });

    const exportRequest = await create(seed, 'EXPORT_REQUEST', 'idem-life-export', '请求导出前先确认家庭范围。');
    const replay = await create(seed, 'EXPORT_REQUEST', 'idem-life-export', '请求导出前先确认家庭范围。');
    const retentionRequest = await create(seed, 'RETENTION_REVIEW', 'idem-life-retention');
    const deleteRequest = await create(seed, 'DELETE_REQUEST', 'idem-life-delete', '记录删除请求，但不得自动执行。');

    expect(replay).toEqual(exportRequest);
    expect([exportRequest, retentionRequest, deleteRequest].map((item) => item.request.request_type)).toEqual([
      'EXPORT_REQUEST', 'RETENTION_REVIEW', 'DELETE_REQUEST',
    ]);
    expect([exportRequest, retentionRequest, deleteRequest].every((item) => item.request.status === 'REQUESTED')).toBe(true);

    const requests = await service.listRequests(seed.familyId, seed.guardianId);
    expect(requests).toHaveLength(3);
    const preview = await service.preview(seed.familyId, seed.guardianId);
    expect(preview).toMatchObject({
      family_id: seed.familyId,
      request_scope: 'FAMILY_PRIVATE_DATA',
      execution_boundary: 'PREVIEW_ONLY_NO_EXPORT_NO_RETENTION_EXECUTION_NO_DELETE',
      counts: { persons: 1, consents: 0, growth_intents: 0, service_cases: 0, follow_up_responses: 0, lifecycle_requests: 3 },
    });
    expect(JSON.stringify(preview)).not.toContain('监护人');
    expect(JSON.stringify(preview)).not.toContain('reason_text');

    await expectCount('family_data_lifecycle_requests', 3);
    await expectCount('audit_logs', 3);
    await expectCount('outbox_events', 3);
    await expectCount('persons', 1);
    await expectCount('families', 1);
    const events = await pool.query(`select event_name from outbox_events order by occurred_at`);
    expect(events.rows).toEqual(expect.arrayContaining([
      { event_name: 'FamilyDataLifecycleRequestCreated' },
    ]));
  });

  it('fails closed for a revoked trusted binding, a foreign family actor, and idempotency conflicts', async () => {
    const first = await seedTrustedFamilyGuardian(pool, 'lifecycle-first', { displayName: '第一家庭', guardianName: '第一监护人', parentRole: 'GUARDIAN' });
    const second = await seedTrustedFamilyGuardian(pool, 'lifecycle-second', { displayName: '第二家庭', guardianName: '第二监护人', parentRole: 'GUARDIAN' });

    await expect(service.preview(first.familyId, second.guardianId)).rejects.toThrow('trusted_family_manage_context_required');
    await expect(service.listRequests(first.familyId, second.guardianId)).rejects.toThrow('trusted_family_manage_context_required');

    await create(first, 'DELETE_REQUEST', 'idem-life-conflict');
    await expect(create(first, 'EXPORT_REQUEST', 'idem-life-conflict')).rejects.toThrow('Idempotency conflict');

    await pool.query(`update account_person_bindings set status='REVOKED', revoked_at=now() where person_id=$1`, [first.guardianId]);
    await expect(create(first, 'RETENTION_REVIEW', 'idem-life-revoked')).rejects.toThrow('trusted_family_manage_context_required');

    await expectCount('family_data_lifecycle_requests', 1);
    await expectCount('families', 2);
  });

  async function create(
    seed: { familyId: string; guardianId: string; meta: ReturnType<typeof testMeta> },
    requestType: 'EXPORT_REQUEST' | 'RETENTION_REVIEW' | 'DELETE_REQUEST',
    idempotencyKey: string,
    reasonText?: string,
  ) {
    return service.createRequest({
      family_id: seed.familyId,
      request_type: requestType,
      reason_text: reasonText,
      idempotency_key: idempotencyKey,
    }, seed.meta);
  }

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

function testMeta(actor: string, correlationId: string) {
  return { actor, correlationId, source: 'vitest', occurredAt: new Date().toISOString() };
}
