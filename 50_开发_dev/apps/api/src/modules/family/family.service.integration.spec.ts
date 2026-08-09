import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { FamilyAggregateRepository } from './family-aggregate.repository';
import { FamilyRepository } from './family.repository';
import { FamilyService } from './family.service';

describe('FamilyService CreateFamily integration', () => {
  let pool: pg.Pool;
  let repository: FamilyRepository;
  let aggregateRepository: FamilyAggregateRepository;
  let service: FamilyService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new FamilyRepository();
    aggregateRepository = new FamilyAggregateRepository(repository);
    service = new FamilyService(repository, aggregateRepository);
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
  });

  afterAll(async () => {
    await repository?.onModuleDestroy();
    await pool?.end();
  });

  it('creates one family, writes audit/event, and replays identical idempotency key', async () => {
    const meta = {
      actor: 'architect-1',
      correlationId: 'corr-task-101',
      source: 'vitest',
      occurredAt: new Date().toISOString(),
    };

    const first = await service.createFamily({ display_name: '王家', idempotency_key: 'idem-create-family-1' }, meta);
    const second = await service.createFamily({ display_name: '王家', idempotency_key: 'idem-create-family-1' }, meta);

    expect(second).toEqual(first);
    expect(first.family.family_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.family.status).toBe('ACTIVE');

    const families = await pool.query('select * from families');
    const audits = await pool.query('select * from audit_logs where action_name = $1', ['CreateFamily']);
    const events = await pool.query('select * from outbox_events where event_name = $1', ['FamilyCreated']);
    const profiles = await pool.query('select * from growth_profiles');

    expect(families.rowCount).toBe(1);
    expect(audits.rowCount).toBe(1);
    expect(events.rowCount).toBe(1);
    expect(profiles.rowCount).toBe(0);
  });

  it('rejects idempotency key reuse with a different request hash', async () => {
    const meta = {
      actor: 'architect-1',
      correlationId: 'corr-task-101-conflict',
      source: 'vitest',
      occurredAt: new Date().toISOString(),
    };

    await service.createFamily({ display_name: '王家', idempotency_key: 'idem-conflict' }, meta);

    await expect(service.createFamily({ display_name: '李家', idempotency_key: 'idem-conflict' }, meta)).rejects.toThrow('Idempotency conflict');
  });

  it('starts M2 growth onboarding for a LOW-risk adolescent family and replays idempotently without AI consent', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();

    const first = await service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      safety_screening_result: 'LOW',
      idempotency_key: 'idem-start-onboarding-1',
    }, meta);
    const second = await service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      safety_screening_result: 'LOW',
      idempotency_key: 'idem-start-onboarding-1',
    }, meta);

    expect(second).toEqual(first);
    expect(first.onboarding).toMatchObject({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      target_dimensions: ['P03', 'R03', 'R04', 'R05'],
      status: 'ACTIVE',
      phase: 'ONBOARDING',
      safety_screening_result: 'LOW',
      ai_personalization_enabled: false,
    });

    const journeys = await pool.query('select * from growth_journeys');
    const growthEvents = await pool.query('select * from growth_events where event_type = $1', ['GrowthOnboardingStarted']);
    const outbox = await pool.query('select * from outbox_events where event_name = $1', ['GrowthOnboardingStarted']);
    const audits = await pool.query('select * from audit_logs where action_name = $1', ['StartGrowthOnboarding']);

    expect(journeys.rowCount).toBe(1);
    expect(growthEvents.rowCount).toBe(1);
    expect(outbox.rowCount).toBe(1);
    expect(audits.rowCount).toBe(1);
  });

  it('requires SERVICE, ASSESSMENT, and GROWTH_TRACKING consent before onboarding', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily({ grantGrowthTracking: false });

    await expect(service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      safety_screening_result: 'LOW',
      idempotency_key: 'idem-start-onboarding-missing-consent',
    }, meta)).rejects.toThrow('missing_required_consent:GROWTH_TRACKING');

    const journeys = await pool.query('select * from growth_journeys');
    expect(journeys.rowCount).toBe(0);
  });

  it('blocks non-LOW safety screening without writing normal onboarding state', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();

    await expect(service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      safety_screening_result: 'MEDIUM',
      idempotency_key: 'idem-start-onboarding-medium-risk',
    }, meta)).rejects.toThrow('human_gate_required_for_safety_screening');

    const journeys = await pool.query('select * from growth_journeys');
    const growthEvents = await pool.query('select * from growth_events');
    expect(journeys.rowCount).toBe(0);
    expect(growthEvents.rowCount).toBe(0);
  });

  async function seedM2ReadyFamily(options: { grantGrowthTracking?: boolean } = {}) {
    const meta = {
      actor: 'architect-1',
      correlationId: `corr-m2-101-${crypto.randomUUID()}`,
      source: 'vitest',
      occurredAt: new Date().toISOString(),
    };
    const family = await service.createFamily({ display_name: '青春期沟通家庭', idempotency_key: `idem-family-${crypto.randomUUID()}` }, meta);
    const parent = await service.addParent({
      family_id: family.family.family_id,
      role: 'GUARDIAN',
      display_name: '监护人',
      account_id: meta.actor,
      idempotency_key: `idem-parent-${crypto.randomUUID()}`,
    }, meta);
    const child = await service.addChild({
      family_id: family.family.family_id,
      display_name: '孩子',
      birth_date: '2012-06-01',
      idempotency_key: `idem-child-${crypto.randomUUID()}`,
    }, meta);
    await service.createRelationship({
      family_id: family.family.family_id,
      person_a_id: parent.parent.person_id,
      person_b_id: child.child.person_id,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: `idem-relationship-${crypto.randomUUID()}`,
    }, meta);
    await service.assignLifeStage({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-08-10T00:00:00.000Z',
      idempotency_key: `idem-life-stage-${crypto.randomUUID()}`,
    }, meta);

    for (const purpose of ['SERVICE', 'ASSESSMENT', ...(options.grantGrowthTracking === false ? [] : ['GROWTH_TRACKING'])] as const) {
      await service.grantConsent({
        family_id: family.family.family_id,
        subject_person_id: child.child.person_id,
        guardian_person_id: parent.parent.person_id,
        purpose,
        policy_version: 'm2-101-test',
        idempotency_key: `idem-consent-${purpose}-${crypto.randomUUID()}`,
      }, meta);
    }

    return { family, parent, child, meta };
  }
});