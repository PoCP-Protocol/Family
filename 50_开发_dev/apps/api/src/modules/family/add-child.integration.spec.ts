import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';

describe('FamilyService AddChild integration', () => {
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

  it('adds a child, writes audit/event, and stores birth_date as a fact only', async () => {
    const meta = testMeta('creator-1', 'corr-add-child');
    const family = await service.createFamily({ display_name: '王家', idempotency_key: 'idem-family-child' }, meta);

    const first = await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      birth_date: '2012-05-06',
      idempotency_key: 'idem-add-child-1',
    }, meta);
    const second = await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      birth_date: '2012-05-06',
      idempotency_key: 'idem-add-child-1',
    }, meta);

    expect(second).toEqual(first);
    expect(first.child.person_type).toBe('CHILD');
    expect(first.child.parent_role).toBeNull();
    expect(first.child.birth_date).toBe('2012-05-06');

    const events = await pool.query('select * from outbox_events where event_name = $1', ['FamilyMemberAdded']);
    expect(events.rowCount).toBe(1);
    expect(events.rows[0].payload.person_role).toBe('CHILD');
    await expectCount('persons', 1);
    await expectCount('audit_logs', 2);
    await expectCount('idempotency_keys', 2);
    await expectMinorDataNoSideEffects();
  });

  it('accepts missing birth_date without inferring life stage or growth state', async () => {
    const meta = testMeta('creator-1', 'corr-child-no-birth-date');
    const family = await service.createFamily({ display_name: '王家', idempotency_key: 'idem-family-child-no-date' }, meta);

    const response = await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      idempotency_key: 'idem-child-no-date',
    }, meta);

    expect(response.child.birth_date).toBeNull();
    await expectMinorDataNoSideEffects();
  });

  it('rejects unauthorized actor and creates no child row', async () => {
    const family = await service.createFamily({
      display_name: '王家',
      idempotency_key: 'idem-family-child-permission',
    }, testMeta('creator-1', 'corr-child-permission'));

    await expect(service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      idempotency_key: 'idem-child-forbidden',
    }, testMeta('other-actor', 'corr-child-forbidden'))).rejects.toThrow('actor_has_family_manage_permission');

    await expectCount('persons', 0);
  });

  it('rejects idempotency key reuse with a different request hash', async () => {
    const meta = testMeta('creator-1', 'corr-child-conflict');
    const family = await service.createFamily({ display_name: '王家', idempotency_key: 'idem-family-child-conflict' }, meta);

    await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      idempotency_key: 'idem-child-conflict',
    }, meta);

    await expect(service.addChild({
      family_id: family.family.family_id,
      display_name: '另一个孩子',
      idempotency_key: 'idem-child-conflict',
    }, meta)).rejects.toThrow('Idempotency conflict');
  });

  async function expectMinorDataNoSideEffects(): Promise<void> {
    await expectCount('consents', 0);
    await expectCount('life_stage_assignments', 0);
    await expectCount('family_relationships', 0);
    await expectCount('growth_profiles', 0);
    await expectCount('growth_journeys', 0);
    await expectCount('growth_events', 0);
  }

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

function testMeta(actor: string, correlationId: string) {
  return {
    actor,
    correlationId,
    source: 'vitest',
    occurredAt: new Date().toISOString(),
  };
}