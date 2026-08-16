import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { seedTrustedFamilyGuardian } from '../../test/family-auth-fixtures';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';

describe('FamilyService AddParent integration', () => {
  let pool: pg.Pool;
  let repository: FamilyRepository;
  let service: FamilyService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new FamilyRepository();
    service = new FamilyService(repository);
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
  });

  afterAll(async () => {
    await repository?.onModuleDestroy();
    await pool?.end();
  });

  it('adds a parent through a trusted guardian context, writes audit/event, and replays idempotency', async () => {
    const seed = await seedTrustedFamilyGuardian(pool, 'add-parent');
    const first = await service.addParent({
      family_id: seed.familyId,
      role: 'MOTHER',
      display_name: '妈妈',
      account_id: 'acct-mom',
      idempotency_key: 'idem-add-parent-1',
    }, seed.meta);
    const second = await service.addParent({
      family_id: seed.familyId,
      role: 'MOTHER',
      display_name: '妈妈',
      account_id: 'acct-mom',
      idempotency_key: 'idem-add-parent-1',
    }, seed.meta);

    expect(second).toEqual(first);
    expect(first.parent.person_type).toBe('PARENT');
    expect(first.parent.parent_role).toBe('MOTHER');
    expect(first.parent.family_id).toBe(seed.familyId);

    const persons = await pool.query('select * from persons where family_id = $1', [seed.familyId]);
    const audits = await pool.query('select * from audit_logs where action_name = $1', ['AddParent']);
    const events = await pool.query('select * from outbox_events where event_name = $1', ['FamilyMemberAdded']);
    const profiles = await pool.query('select * from growth_profiles');

    expect(persons.rowCount).toBe(2);
    expect(audits.rowCount).toBe(1);
    expect(events.rowCount).toBe(1);
    expect(events.rows[0].payload.person_role).toBe('PARENT');
    expect(profiles.rowCount).toBe(0);
  });

  it('fails for missing family without creating side effects', async () => {
    await expect(service.addParent({
      family_id: '11111111-1111-4111-8111-111111111111',
      role: 'FATHER',
      display_name: '爸爸',
      idempotency_key: 'idem-parent-missing-family',
    }, testMeta('creator-1', 'corr-missing-family'))).rejects.toThrow('family_not_found');

    await expectCount('persons', 0);
    await expectCount('audit_logs', 0);
    await expectCount('outbox_events', 0);
  });

  it('rejects an actor without an ACTIVE binding and family membership', async () => {
    const seed = await seedTrustedFamilyGuardian(pool, 'parent-permission');
    await expect(service.addParent({
      family_id: seed.familyId,
      role: 'GUARDIAN',
      display_name: '监护人',
      idempotency_key: 'idem-parent-forbidden',
    }, testMeta('other-actor', 'corr-parent-forbidden'))).rejects.toThrow('trusted_family_manage_context_required');

    const persons = await pool.query('select * from persons');
    expect(persons.rowCount).toBe(1);
  });

  it('rejects idempotency key reuse with a different request hash', async () => {
    const seed = await seedTrustedFamilyGuardian(pool, 'parent-conflict');
    await service.addParent({
      family_id: seed.familyId,
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: 'idem-parent-conflict',
    }, seed.meta);

    await expect(service.addParent({
      family_id: seed.familyId,
      role: 'FATHER',
      display_name: '爸爸',
      idempotency_key: 'idem-parent-conflict',
    }, seed.meta)).rejects.toThrow('Idempotency conflict');
  });

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

function testMeta(actor: string, correlationId: string) {
  return { actor, correlationId, source: 'vitest', occurredAt: new Date().toISOString() };
}
