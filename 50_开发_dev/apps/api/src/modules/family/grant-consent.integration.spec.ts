import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
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

  it('grants consent for PARENT_CHILD, writes audit/event, and replays idempotency', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('creator-1', 'parent-child', 'PARENT_CHILD');
    const first = await service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-parent-child',
    }, seed.meta);
    const second = await service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-parent-child',
    }, seed.meta);

    expect(second).toEqual(first);
    expect(first.consent.family_id).toBe(seed.familyId);
    expect(first.consent.subject_person_id).toBe(seed.childId);
    expect(first.consent.guardian_person_id).toBe(seed.parentId);
    expect(first.consent.purpose).toBe('SERVICE');
    expect(first.consent.status).toBe('GRANTED');
    expect(first.consent.policy_version).toBe('family-consent-v1');
    await expectCount('consents', 1);
    await expectCount('audit_logs', 5);
    await expectCount('outbox_events', 5);

    const event = await pool.query('select payload from outbox_events where event_name = $1', ['ConsentGranted']);
    expect(event.rowCount).toBe(1);
    expect(event.rows[0].payload.consent_id).toBe(first.consent.consent_id);
    expect(event.rows[0].payload.purpose).toBe('SERVICE');
    await expectNoGrowthOrLifeStageSideEffects();
  });

  it('grants consent for GUARDIAN_CHILD without broad purpose inheritance', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('creator-1', 'guardian-child', 'GUARDIAN_CHILD');

    const response = await service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'ASSESSMENT',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-guardian-child',
    }, seed.meta);

    expect(response.consent.purpose).toBe('ASSESSMENT');
    const otherPurposes = await pool.query('select count(*)::int as count from consents where purpose <> $1', ['ASSESSMENT']);
    expect(otherPurposes.rows[0].count).toBe(0);
  });

  it('denies absent, wrong-direction, cross-family, parent-subject, and child-guardian authorization', async () => {
    const noRel = await seedFamilyWithParentAndChild('creator-1', 'no-rel');
    await expect(grantServiceConsent(noRel, 'idem-consent-no-rel')).rejects.toThrow('guardian_not_authorized');

    const wrongDirection = await seedFamilyWithParentAndChild('creator-1', 'wrong-direction');
    await service.createRelationship({
      family_id: wrongDirection.familyId,
      person_a_id: wrongDirection.childId,
      person_b_id: wrongDirection.parentId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-rel-wrong-direction',
    }, wrongDirection.meta);
    await expect(grantServiceConsent(wrongDirection, 'idem-consent-wrong-direction')).rejects.toThrow('guardian_not_authorized');

    const first = await seedFamilyWithParentAndChild('creator-1', 'cross-a');
    const second = await seedFamilyWithParentAndChild('creator-2', 'cross-b');
    await expect(service.grantConsent({
      family_id: first.familyId,
      subject_person_id: second.childId,
      guardian_person_id: first.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-cross-family',
    }, first.meta)).rejects.toThrow('consent_persons_must_belong_to_family');

    await expect(service.grantConsent({
      family_id: first.familyId,
      subject_person_id: first.parentId,
      guardian_person_id: first.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-parent-subject',
    }, first.meta)).rejects.toThrow('consent_subject_must_be_child');

    await expect(service.grantConsent({
      family_id: first.familyId,
      subject_person_id: first.childId,
      guardian_person_id: first.childId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-child-guardian',
    }, first.meta)).rejects.toThrow('actor_must_match_guardian_account');

    await expectCount('consents', 0);
  });

  it('requires actor family permission and actor-to-guardian account binding', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('creator-1', 'binding', 'PARENT_CHILD');

    await expect(service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-forbidden-manager',
    }, testMeta('other-actor', 'corr-consent-forbidden-manager'))).rejects.toThrow('actor_has_family_manage_permission');

    await expect(service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-binding-mismatch',
    }, testMeta('creator-1-other-account', 'corr-consent-binding-mismatch'))).rejects.toThrow('actor_has_family_manage_permission');

    const noAccount = await seedFamilyWithParentAndChild('creator-1', 'no-account', false);
    await service.createRelationship({
      family_id: noAccount.familyId,
      person_a_id: noAccount.parentId,
      person_b_id: noAccount.childId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-rel-no-account',
    }, noAccount.meta);
    await expect(grantServiceConsent(noAccount, 'idem-consent-no-account')).rejects.toThrow('actor_must_match_guardian_account');
  });

  it('isolates purposes and versions consent without deleting history', async () => {
    const seed = await seedFamilyWithAuthorizedGuardian('creator-1', 'purpose-version', 'PARENT_CHILD');
    const serviceConsent = await grantServiceConsent(seed, 'idem-consent-service-v1');
    const researchConsent = await service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'RESEARCH',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-research-v1',
    }, seed.meta);

    expect(serviceConsent.consent.purpose).toBe('SERVICE');
    expect(researchConsent.consent.purpose).toBe('RESEARCH');
    await expectCount('consents', 2);
    await expect(service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-service-duplicate',
    }, seed.meta)).rejects.toThrow('consent_already_granted');

    const serviceV2 = await service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v2',
      idempotency_key: 'idem-consent-service-v2',
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
    const seed = await seedFamilyWithAuthorizedGuardian('creator-1', 'idem-rollback', 'PARENT_CHILD');
    await grantServiceConsent(seed, 'idem-consent-conflict');

    await expect(service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'RESEARCH',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-conflict',
    }, seed.meta)).rejects.toThrow('Idempotency conflict');

    await expect(service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-duplicate-rollback',
    }, seed.meta)).rejects.toThrow('consent_already_granted');

    await expectCount('consents', 1);
    const failedKey = await pool.query('select count(*)::int as count from idempotency_keys where idempotency_key = $1', ['idem-consent-duplicate-rollback']);
    expect(failedKey.rows[0].count).toBe(0);
  });

  async function seedFamilyWithAuthorizedGuardian(actor: string, suffix: string, relationshipType: 'PARENT_CHILD' | 'GUARDIAN_CHILD') {
    const seed = await seedFamilyWithParentAndChild(actor, suffix);
    await service.createRelationship({
      family_id: seed.familyId,
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: relationshipType,
      idempotency_key: `idem-rel-${suffix}`,
    }, seed.meta);

    return seed;
  }

  async function seedFamilyWithParentAndChild(actor: string, suffix: string, bindParentAccount = true) {
    const meta = testMeta(actor, `corr-${suffix}`);
    const family = await service.createFamily({ display_name: '王家', idempotency_key: `idem-family-${suffix}` }, meta);
    const parent = await service.addParent({
      family_id: family.family.family_id,
      role: 'MOTHER',
      display_name: '妈妈',
      account_id: bindParentAccount ? actor : undefined,
      idempotency_key: `idem-parent-${suffix}`,
    }, meta);
    const child = await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      idempotency_key: `idem-child-${suffix}`,
    }, meta);

    return { familyId: family.family.family_id, parentId: parent.parent.person_id, childId: child.child.person_id, meta };
  }

  async function grantServiceConsent(seed: { familyId: string; parentId: string; childId: string; meta: ReturnType<typeof testMeta> }, idempotencyKey: string) {
    return service.grantConsent({
      family_id: seed.familyId,
      subject_person_id: seed.childId,
      guardian_person_id: seed.parentId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: idempotencyKey,
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
  return {
    actor,
    correlationId,
    source: 'vitest',
    occurredAt: new Date().toISOString(),
  };
}