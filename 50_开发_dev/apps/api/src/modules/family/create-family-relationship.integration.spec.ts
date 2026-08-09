import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';

describe('FamilyService CreateFamilyRelationship integration', () => {
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

  it('creates a parent-child relationship, writes audit/event, and replays idempotency', async () => {
    const seed = await seedFamilyWithParentAndChild('creator-1', 'pc');
    const first = await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-rel-parent-child',
    }, seed.meta);
    const second = await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-rel-parent-child',
    }, seed.meta);

    expect(second).toEqual(first);
    expect(first.relationship.relationship_type).toBe('PARENT_CHILD');
    expect(first.relationship.person_a_id).toBe(seed.parentId);
    expect(first.relationship.person_b_id).toBe(seed.childId);
    await expectCount('family_relationships', 1);
    await expectCount('audit_logs', 4);
    await expectCount('outbox_events', 4);

    const event = await pool.query('select payload from outbox_events where event_name = $1', ['FamilyRelationshipCreated']);
    expect(event.rowCount).toBe(1);
    expect(event.rows[0].payload.relationship_id).toBe(first.relationship.relationship_id);
    await expectNoImplicitSideEffects();
  });

  it('rejects self relationship before insert', async () => {
    const seed = await seedFamilyWithParentAndChild('creator-1', 'self');

    await expect(service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: seed.parentId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-self',
    }, seed.meta)).rejects.toThrow('relationship_self_link_not_allowed');

    await expectCount('family_relationships', 0);
  });

  it('rejects child-to-parent PARENT_CHILD direction without auto reversal', async () => {
    const seed = await seedFamilyWithParentAndChild('creator-1', 'direction');

    await expect(service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.childId,
      person_b_id: seed.parentId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-rel-direction',
    }, seed.meta)).rejects.toThrow('relationship_direction_invalid');

    await expectCount('family_relationships', 0);
  });

  it('creates guardian-child without consent or growth side effects', async () => {
    const seed = await seedFamilyWithParentAndChild('creator-1', 'guardian');

    const response = await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: 'idem-rel-guardian',
    }, seed.meta);

    expect(response.relationship.relationship_type).toBe('GUARDIAN_CHILD');
    await expectNoImplicitSideEffects();
  });

  it('rejects missing family and missing person with controlled errors', async () => {
    await expect(service.createRelationship({
      family_id: '11111111-1111-4111-8111-111111111111',
      person_a_id: '22222222-2222-4222-8222-222222222222',
      person_b_id: '33333333-3333-4333-8333-333333333333',
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-missing-family',
    }, testMeta('creator-1', 'corr-missing-family'))).rejects.toThrow('family_not_found');

    const seed = await seedFamilyWithParentAndChild('creator-1', 'missing-person');
    await expect(service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: '33333333-3333-4333-8333-333333333333',
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-missing-person',
    }, seed.meta)).rejects.toThrow('person_not_found');
  });

  it('rejects cross-family relationships', async () => {
    const first = await seedFamilyWithParentAndChild('creator-1', 'cross-a');
    const second = await seedFamilyWithParentAndChild('creator-2', 'cross-b');

    await expect(service.createRelationship({
      family_id: first.familyId,
      person_a_id: first.parentId,
      person_b_id: second.childId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-cross-family',
    }, first.meta)).rejects.toThrow('relationship_persons_must_belong_to_same_family');

    await expectCount('family_relationships', 0);
  });

  it('rejects unauthorized actor and idempotency conflicts', async () => {
    const seed = await seedFamilyWithParentAndChild('creator-1', 'auth-idem');

    await expect(service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-forbidden',
    }, testMeta('other-actor', 'corr-rel-forbidden'))).rejects.toThrow('actor_has_family_manage_permission');

    await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-conflict',
    }, seed.meta);
    await expect(service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.childId,
      person_b_id: seed.parentId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-conflict',
    }, seed.meta)).rejects.toThrow('Idempotency conflict');
  });

  it('rejects reverse duplicate spouse and sibling relationships', async () => {
    const seed = await seedFamilyWithTwoParentsAndTwoChildren('creator-1', 'symmetric');

    await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentAId,
      person_b_id: seed.parentBId,
      relationship_type: 'SPOUSE',
      idempotency_key: 'idem-rel-spouse',
    }, seed.meta);
    await expect(service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentBId,
      person_b_id: seed.parentAId,
      relationship_type: 'SPOUSE',
      idempotency_key: 'idem-rel-spouse-reverse',
    }, seed.meta)).rejects.toThrow('relationship_already_exists');

    await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.childAId,
      person_b_id: seed.childBId,
      relationship_type: 'SIBLING',
      idempotency_key: 'idem-rel-sibling',
    }, seed.meta);
    await expect(service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.childBId,
      person_b_id: seed.childAId,
      relationship_type: 'SIBLING',
      idempotency_key: 'idem-rel-sibling-reverse',
    }, seed.meta)).rejects.toThrow('relationship_already_exists');

    await expectCount('family_relationships', 2);
  });

  it('creates OTHER for same-family members', async () => {
    const seed = await seedFamilyWithParentAndChild('creator-1', 'other');

    const response = await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.childId,
      person_b_id: seed.parentId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-other',
    }, seed.meta);

    expect(response.relationship.relationship_type).toBe('OTHER');
  });

  async function seedFamilyWithParentAndChild(actor: string, suffix: string) {
    const meta = testMeta(actor, `corr-${suffix}`);
    const family = await service.createFamily({ display_name: '王家', idempotency_key: `idem-family-${suffix}` }, meta);
    const parent = await service.addParent({
      family_id: family.family.family_id,
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: `idem-parent-${suffix}`,
    }, meta);
    const child = await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      idempotency_key: `idem-child-${suffix}`,
    }, meta);

    return { familyId: family.family.family_id, parentId: parent.parent.person_id, childId: child.child.person_id, meta };
  }

  async function seedFamilyWithTwoParentsAndTwoChildren(actor: string, suffix: string) {
    const seed = await seedFamilyWithParentAndChild(actor, suffix);
    const parentB = await service.addParent({
      family_id: seed.familyId,
      role: 'FATHER',
      display_name: '爸爸',
      idempotency_key: `idem-parent-b-${suffix}`,
    }, seed.meta);
    const childB = await service.addChild({
      family_id: seed.familyId,
      display_name: '孩子二',
      idempotency_key: `idem-child-b-${suffix}`,
    }, seed.meta);

    return { familyId: seed.familyId, parentAId: seed.parentId, parentBId: parentB.parent.person_id, childAId: seed.childId, childBId: childB.child.person_id, meta: seed.meta };
  }

  async function expectNoImplicitSideEffects(): Promise<void> {
    await expectCount('consents', 0);
    await expectCount('life_stage_assignments', 0);
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