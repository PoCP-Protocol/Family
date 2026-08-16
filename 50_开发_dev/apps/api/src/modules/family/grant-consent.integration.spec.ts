import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { seedTrustedFamilyGuardian } from '../../test/family-auth-fixtures';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';

describe('FamilyService GrantConsent integration', () => {
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

  it('grants consent for PARENT_CHILD through a trusted guardian, writes audit/event, and replays idempotency', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('parent-child', 'PARENT_CHILD');
    const first = await grantServiceConsent(seed, 'idem-consent-parent-child');
    const second = await grantServiceConsent(seed, 'idem-consent-parent-child');

    expect(second).toEqual(first);
    expect(first.consent).toMatchObject({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      status: 'GRANTED',
      policy_version: 'family-consent-v1',
    });
    await expectCount('consents', 1);
    await expectCount('audit_logs', 3);
    await expectCount('outbox_events', 3);

    const event = await pool.query('select payload from outbox_events where event_name = $1', ['ConsentGranted']);
    expect(event.rowCount).toBe(1);
    expect(event.rows[0].payload.consent_id).toBe(first.consent.consent_id);
    expect(event.rows[0].payload.purpose).toBe('SERVICE');
    await expectNoGrowthOrLifeStageSideEffects();
  });

  it('grants consent for GUARDIAN_CHILD without broad purpose inheritance', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('guardian-child', 'GUARDIAN_CHILD');
    const response = await service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'ASSESSMENT', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-guardian-child',
    }, seed.meta);

    expect(response.consent.purpose).toBe('ASSESSMENT');
    const otherPurposes = await pool.query('select count(*)::int as count from consents where purpose <> $1', ['ASSESSMENT']);
    expect(otherPurposes.rows[0].count).toBe(0);
  });

  it('denies absent, wrong-direction, cross-family, parent-subject, and child-guardian authorization', async () => {
    const noRel = await seedFamilyWithParentAndChild('no-rel');
    await expect(grantServiceConsent(noRel, 'idem-consent-no-rel')).rejects.toThrow('guardian_not_authorized');

    const wrongDirection = await seedFamilyWithParentAndChild('wrong-direction');
    await service.createRelationship({ family_id: wrongDirection.familyId, person_a_id: wrongDirection.childId, person_b_id: wrongDirection.parentId, relationship_type: 'OTHER', idempotency_key: 'idem-rel-wrong-direction' }, wrongDirection.meta);
    await expect(grantServiceConsent(wrongDirection, 'idem-consent-wrong-direction')).rejects.toThrow('guardian_not_authorized');

    const first = await seedFamilyWithParentAndChild('cross-a');
    const second = await seedFamilyWithParentAndChild('cross-b');
    await expect(service.grantConsent({
      family_id: first.familyId, subject_person_id: second.childId, guardian_person_id: first.parentId,
      purpose: 'SERVICE', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-cross-family',
    }, first.meta)).rejects.toThrow('consent_persons_must_belong_to_family');

    await expect(service.grantConsent({
      family_id: first.familyId, subject_person_id: first.parentId, guardian_person_id: first.parentId,
      purpose: 'SERVICE', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-parent-subject',
    }, first.meta)).rejects.toThrow('consent_subject_must_be_child');

    await expect(service.grantConsent({
      family_id: first.familyId, subject_person_id: first.childId, guardian_person_id: first.childId,
      purpose: 'SERVICE', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-child-guardian',
    }, first.meta)).rejects.toThrow('actor_must_match_guardian_person');

    await expectCount('consents', 0);
  });

  it('requires an ACTIVE trusted guardian context and rejects a revoked binding', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('binding', 'PARENT_CHILD');

    await expect(service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'SERVICE', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-forbidden-manager',
    }, testMeta('other-actor', 'corr-consent-forbidden-manager'))).rejects.toThrow('trusted_family_manage_context_required');

    await pool.query(`update account_person_bindings set status='REVOKED', revoked_at=now() where person_id=$1`, [seed.parentId]);
    await expect(grantServiceConsent(seed, 'idem-consent-revoked-binding')).rejects.toThrow('trusted_family_manage_context_required');
  });

  it('isolates purposes and versions consent without deleting history', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('purpose-version', 'PARENT_CHILD');
    const serviceConsent = await grantServiceConsent(seed, 'idem-consent-service-v1');
    const researchConsent = await service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'RESEARCH', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-research-v1',
    }, seed.meta);

    expect(serviceConsent.consent.purpose).toBe('SERVICE');
    expect(researchConsent.consent.purpose).toBe('RESEARCH');
    await expectCount('consents', 2);
    await expect(service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'SERVICE', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-service-duplicate',
    }, seed.meta)).rejects.toThrow('consent_already_granted');

    const serviceV2 = await service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'SERVICE', policy_version: 'family-consent-v2', idempotency_key: 'idem-consent-service-v2',
    }, seed.meta);

    expect(serviceV2.consent.status).toBe('GRANTED');
    const rows = await pool.query('select purpose, policy_version, status from consents');
    expect(rows.rows).toEqual(expect.arrayContaining([
      { purpose: 'RESEARCH', policy_version: 'family-consent-v1', status: 'GRANTED' },
      { purpose: 'SERVICE', policy_version: 'family-consent-v1', status: 'EXPIRED' },
      { purpose: 'SERVICE', policy_version: 'family-consent-v2', status: 'GRANTED' },
    ]));
  });

  it('rejects idempotency conflicts and rolls back failed attempts without partial writes', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('idem-rollback', 'PARENT_CHILD');
    await grantServiceConsent(seed, 'idem-consent-conflict');

    await expect(service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'RESEARCH', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-conflict',
    }, seed.meta)).rejects.toThrow('Idempotency conflict');

    await expect(service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'SERVICE', policy_version: 'family-consent-v1', idempotency_key: 'idem-consent-duplicate-rollback',
    }, seed.meta)).rejects.toThrow('consent_already_granted');

    await expectCount('consents', 1);
    const failedKey = await pool.query('select count(*)::int as count from idempotency_keys where idempotency_key = $1', ['idem-consent-duplicate-rollback']);
    expect(failedKey.rows[0].count).toBe(0);
  });

  async function seedFamilyWithAuthorizedGuardian(suffix: string, relationshipType: 'PARENT_CHILD' | 'GUARDIAN_CHILD') {
    const seed = await seedFamilyWithParentAndChild(suffix);
    await service.createRelationship({
      family_id: seed.familyId, person_a_id: seed.parentId, person_b_id: seed.childId,
      relationship_type: relationshipType, idempotency_key: `idem-rel-${suffix}`,
    }, seed.meta);
    return seed;
  }

  async function seedFamilyWithParentAndChild(suffix: string) {
    const seed = await seedTrustedFamilyGuardian(pool, `consent-${suffix}`, { displayName: '王家', guardianName: '妈妈', parentRole: 'MOTHER' });
    const child = await service.addChild({ family_id: seed.familyId, display_name: '孩子', idempotency_key: `idem-child-${suffix}` }, seed.meta);
    return { familyId: seed.familyId, parentId: seed.guardianId, childId: child.child.person_id, meta: seed.meta };
  }

  async function grantServiceConsent(seed: { familyId: string; parentId: string; childId: string; meta: ReturnType<typeof testMeta> }, idempotencyKey: string) {
    return service.grantConsent({
      family_id: seed.familyId, subject_person_id: seed.childId, guardian_person_id: seed.parentId,
      purpose: 'SERVICE', policy_version: 'family-consent-v1', idempotency_key: idempotencyKey,
    }, seed.meta);
  }

  async function expectNoGrowthOrLifeStageSideEffects(): Promise<void> {
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
  return { actor, correlationId, source: 'vitest', occurredAt: new Date().toISOString() };
}
