import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';

describe('FamilyService AssignLifeStage integration', () => {
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

  it('assigns a life stage, writes audit/event, and replays idempotency', async () => {
    const seed = await seedFamilyWithChild('creator-1', 'assign');
    const first = await service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-assign',
    }, seed.meta);
    const second = await service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-assign',
    }, seed.meta);

    expect(second).toEqual(first);
    expect(first.assignment.family_id).toBe(seed.familyId);
    expect(first.assignment.child_id).toBe(seed.childId);
    expect(first.assignment.life_stage_code).toBe('EARLY_ADOLESCENCE_12_15');
    expect(first.assignment.effective_to).toBeNull();
    expect(first.assignment.source).toBe('vitest');
    await expectCount('life_stage_assignments', 1);
    await expectCount('audit_logs', 3);
    await expectCount('outbox_events', 3);

    const event = await pool.query('select payload from outbox_events where event_name = $1', ['LifeStageAssigned']);
    expect(event.rowCount).toBe(1);
    expect(event.rows[0].payload.assignment_id).toBe(first.assignment.assignment_id);
    await expectNoImplicitSideEffects();
  });

  it('rejects assigning the same active life stage without closing or inserting a duplicate', async () => {
    const seed = await seedFamilyWithChild('creator-1', 'duplicate');
    await service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-duplicate-a',
    }, seed.meta);

    await expect(service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-02-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-duplicate-b',
    }, seed.meta)).rejects.toThrow('life_stage_assignment_already_active');

    await expectCount('life_stage_assignments', 1);
    const active = await pool.query('select effective_to from life_stage_assignments where child_id = $1', [seed.childId]);
    expect(active.rows[0].effective_to).toBeNull();
  });

  it('rejects missing child, parent subject, cross-family child, unauthorized actor, and idempotency conflicts', async () => {
    const seed = await seedFamilyWithParentAndChild('creator-1', 'preconditions');
    const second = await seedFamilyWithChild('creator-2', 'preconditions-other');

    await expect(service.assignLifeStage({
      family_id: seed.familyId,
      child_id: '33333333-3333-4333-8333-333333333333',
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-missing-child',
    }, seed.meta)).rejects.toThrow('child_not_found');

    await expect(service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.parentId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-parent-subject',
    }, seed.meta)).rejects.toThrow('life_stage_subject_must_be_child');

    await expect(service.assignLifeStage({
      family_id: seed.familyId,
      child_id: second.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-cross-family',
    }, seed.meta)).rejects.toThrow('child_must_belong_to_family');

    await expect(service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-forbidden',
    }, testMeta('other-actor', 'corr-life-stage-forbidden'))).rejects.toThrow('actor_has_family_manage_permission');

    await service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-conflict',
    }, seed.meta);
    await expect(service.assignLifeStage({
      family_id: seed.familyId,
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-02-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-conflict',
    }, seed.meta)).rejects.toThrow('Idempotency conflict');
  });

  it('does not infer life stage from AddChild birth_date', async () => {
    await seedFamilyWithChild('creator-1', 'birth-date', '2012-05-06');

    await expectCount('life_stage_assignments', 0);
    await expectCount('growth_profiles', 0);
    await expectCount('growth_journeys', 0);
    await expectCount('growth_events', 0);
  });

  async function seedFamilyWithChild(actor: string, suffix: string, birthDate?: string) {
    const meta = testMeta(actor, `corr-${suffix}`);
    const family = await service.createFamily({ display_name: '王家', idempotency_key: `idem-family-${suffix}` }, meta);
    const child = await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      birth_date: birthDate,
      idempotency_key: `idem-child-${suffix}`,
    }, meta);

    return { familyId: family.family.family_id, childId: child.child.person_id, meta };
  }

  async function seedFamilyWithParentAndChild(actor: string, suffix: string) {
    const seed = await seedFamilyWithChild(actor, suffix);
    const parent = await service.addParent({
      family_id: seed.familyId,
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: `idem-parent-${suffix}`,
    }, seed.meta);

    return { familyId: seed.familyId, parentId: parent.parent.person_id, childId: seed.childId, meta: seed.meta };
  }

  async function expectNoImplicitSideEffects(): Promise<void> {
    await expectCount('consents', 0);
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