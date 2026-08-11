import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { FamilyAggregateRepository } from './family-aggregate.repository';
import { FamilyRepository } from './family.repository';
import { EvidenceSynthesisService } from './evidence-synthesis.service';
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
    service = new FamilyService(repository, aggregateRepository, new EvidenceSynthesisService());
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
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-start-onboarding-1',
    }, meta);
    const second = await service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      structured_safety_signals: ['NONE'],
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
      safety_disposition: {
        severity: 'LOW',
        disposition: 'NORMAL',
        policy_version: 'M2_102_DETERMINISTIC_V1',
        signals: ['NONE'],
      },
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
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-start-onboarding-missing-consent',
    }, meta)).rejects.toThrow('missing_required_consent:GROWTH_TRACKING');

    const journeys = await pool.query('select * from growth_journeys');
    expect(journeys.rowCount).toBe(0);
  });

  it('blocks safety-risk signals without writing normal onboarding state', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();

    await expect(service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      structured_safety_signals: ['SELF_HARM'],
      idempotency_key: 'idem-start-onboarding-medium-risk',
    }, meta)).rejects.toThrow('human_gate_required_for_safety_signals');

    const journeys = await pool.query('select * from growth_journeys');
    const growthEvents = await pool.query('select * from growth_events');
    expect(journeys.rowCount).toBe(0);
    expect(growthEvents.rowCount).toBe(0);
  });

  it('records M2-102 parent and child perspectives with linked E1 evidence and idempotency', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const onboarding = await service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-m2-102-onboarding-1',
    }, meta);

    const parentPerspective = await service.recordPerspective({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: child.child.person_id,
      author_person_id: parent.parent.person_id,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      related_dimension_ids: ['P03', 'R03'],
      content: {
        prompt_id: 'parent-friction-v1',
        response_text: '我觉得我们最近一说学习就容易吵起来。',
        selected_signals: ['interrupts', 'argues'],
      },
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-record-parent-perspective-1',
    }, meta);
    const replay = await service.recordPerspective({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: child.child.person_id,
      author_person_id: parent.parent.person_id,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      related_dimension_ids: ['P03', 'R03'],
      content: {
        prompt_id: 'parent-friction-v1',
        response_text: '我觉得我们最近一说学习就容易吵起来。',
        selected_signals: ['interrupts', 'argues'],
      },
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-record-parent-perspective-1',
    }, meta);
    const childPerspective = await service.recordPerspective({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: child.child.person_id,
      author_person_id: child.child.person_id,
      perspective_type: 'CHILD_PERSPECTIVE',
      capture_mode: 'FACILITATED_ENTRY',
      related_dimension_ids: ['R03', 'R04'],
      content: {
        prompt_id: 'child-friction-v1',
        response_text: '我希望妈妈先听我说完再评价。',
        selected_signals: ['wants-to-be-heard'],
      },
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-record-child-perspective-1',
    }, meta);

    expect(replay).toEqual(parentPerspective);
    expect(parentPerspective.perspective).toMatchObject({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: child.child.person_id,
      author_person_id: parent.parent.person_id,
      recorded_by_actor_id: meta.actor,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      fact_boundary: 'PERSPECTIVE_NOT_FACT',
      safety_disposition: {
        severity: 'LOW',
        disposition: 'NORMAL',
        policy_version: 'M2_102_DETERMINISTIC_V1',
        signals: ['NONE'],
      },
    });
    expect(parentPerspective.evidence).toMatchObject({
      family_id: family.family.family_id,
      perspective_id: parentPerspective.perspective.perspective_id,
      evidence_type: 'SELF_REPORT',
      source: 'PARENT',
      evidence_level: 'E1',
    });
    expect(childPerspective.perspective).toMatchObject({
      subject_person_id: child.child.person_id,
      author_person_id: child.child.person_id,
      perspective_type: 'CHILD_PERSPECTIVE',
      capture_mode: 'FACILITATED_ENTRY',
    });

    const summary = await service.getPerspectiveSummary(family.family.family_id, onboarding.onboarding.onboarding_id, meta.actor);
    const perspectives = await pool.query('select * from perspectives');
    const evidence = await pool.query('select * from evidence_records');
    const outbox = await pool.query('select * from outbox_events where event_name = $1', ['PerspectiveRecorded']);
    const audits = await pool.query('select * from audit_logs where action_name = $1', ['RecordPerspective']);
    const profiles = await pool.query('select * from growth_profiles');
    const priorities = await pool.query('select * from growth_priorities');

    expect(summary.perspectives.map((item) => item.perspective_type)).toEqual(['PARENT_PERSPECTIVE', 'CHILD_PERSPECTIVE']);
    expect(summary.evidence).toHaveLength(2);
    expect(perspectives.rowCount).toBe(2);
    expect(evidence.rowCount).toBe(2);
    expect(outbox.rowCount).toBe(2);
    expect(audits.rowCount).toBe(2);
    expect(profiles.rowCount).toBe(0);
    expect(priorities.rowCount).toBe(0);
  });

  it('derives non-LOW safety server-side and blocks normal perspective writes', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const onboarding = await service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-m2-102-onboarding-risk',
    }, meta);

    await expect(service.recordPerspective({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: child.child.person_id,
      author_person_id: parent.parent.person_id,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      related_dimension_ids: ['P03'],
      content: {
        prompt_id: 'parent-risk-v1',
        response_text: '需要安全升级。',
        selected_signals: [],
      },
      structured_safety_signals: ['SELF_HARM'],
      idempotency_key: 'idem-record-risk-perspective',
    }, meta)).rejects.toThrow('human_gate_required_for_safety_signals');

    const perspectives = await pool.query('select * from perspectives');
    const evidence = await pool.query('select * from evidence_records');
    expect(perspectives.rowCount).toBe(0);
    expect(evidence.rowCount).toBe(0);
  });

  it('builds M2-103 profile drafts from E1 perspectives without writing priorities or confirmed profiles', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const onboarding = await seedM2Perspectives(family.family.family_id, parent.parent.person_id, child.child.person_id, meta);

    const response = await service.buildGrowthProfileDrafts({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      idempotency_key: 'idem-m2-103-build-drafts',
    }, meta);
    const replay = await service.buildGrowthProfileDrafts({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      idempotency_key: 'idem-m2-103-build-drafts',
    }, meta);

    expect(replay).toEqual(response);
    expect(response.drafts).toHaveLength(4);
    expect(response.drafts.find((draft) => draft.dimension_id === 'P03')).toMatchObject({
      profile_scope: 'PARENT_GROWTH_PROFILE',
      subject_person_id: parent.parent.person_id,
      subject_relationship_id: null,
      candidate_state: 'UNRESOLVED',
      confidence: 'LOW',
      status: 'REVIEW_REQUIRED',
    });
    expect(response.drafts.find((draft) => draft.dimension_id === 'R03')).toMatchObject({
      profile_scope: 'RELATIONSHIP_GROWTH_PROFILE',
      subject_person_id: null,
      candidate_state: 'DEVELOPING',
      confidence: 'MEDIUM',
      status: 'DRAFT',
    });
    expect(response.drafts.find((draft) => draft.dimension_id === 'R05')).toMatchObject({
      candidate_state: 'UNRESOLVED',
      status: 'REVIEW_REQUIRED',
    });

    const drafts = await pool.query('select * from growth_profile_drafts');
    const profiles = await pool.query('select * from growth_profiles');
    const priorities = await pool.query('select * from growth_priorities');
    const outbox = await pool.query('select * from outbox_events where event_name = $1', ['GrowthProfileDrafted']);
    expect(drafts.rowCount).toBe(4);
    expect(profiles.rowCount).toBe(0);
    expect(priorities.rowCount).toBe(0);
    expect(outbox.rowCount).toBe(1);
  });

  it('confirms a M2-103 draft into a limited working growth profile with versioned evidence snapshot', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const onboarding = await seedM2Perspectives(family.family.family_id, parent.parent.person_id, child.child.person_id, meta);
    const drafts = await service.buildGrowthProfileDrafts({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      idempotency_key: 'idem-m2-103-confirm-build',
    }, meta);
    const draft = drafts.drafts.find((item) => item.dimension_id === 'R03');
    expect(draft).toBeDefined();

    const response = await service.confirmGrowthProfile({
      family_id: family.family.family_id,
      draft_id: draft!.draft_id,
      idempotency_key: 'idem-m2-103-confirm-r03',
    }, meta);
    const replay = await service.confirmGrowthProfile({
      family_id: family.family.family_id,
      draft_id: draft!.draft_id,
      idempotency_key: 'idem-m2-103-confirm-r03',
    }, meta);
    const insight = await service.getGrowthInsight(family.family.family_id, onboarding.onboarding.onboarding_id, meta.actor);

    expect(replay).toEqual(response);
    expect(response.profile).toMatchObject({
      family_id: family.family.family_id,
      profile_scope: 'RELATIONSHIP_GROWTH_PROFILE',
      dimension_id: 'R03',
      state: 'DEVELOPING',
      confidence: 'MEDIUM',
      status: 'WORKING',
      confirmed_by_actor_id: meta.actor,
      policy_version: 'M2_103_DETERMINISTIC_V1',
    });
    expect(response.profile.evidence_snapshot.evidence_ids).toHaveLength(2);
    expect(response.draft.status).toBe('CONFIRMED');
    expect(insight.confirmed_profiles.map((profile) => profile.dimension_id)).toContain('R03');

    const profileDimensions = await pool.query('select * from growth_profile_dimensions where dimension_id = $1', ['R03']);
    const priorities = await pool.query('select * from growth_priorities');
    const outbox = await pool.query('select * from outbox_events where event_name = $1', ['GrowthProfileConfirmed']);
    expect(profileDimensions.rowCount).toBe(1);
    expect(priorities.rowCount).toBe(0);
    expect(outbox.rowCount).toBe(1);
  });

  it('rechecks required consent before confirming a M2-103 draft', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const onboarding = await seedM2Perspectives(family.family.family_id, parent.parent.person_id, child.child.person_id, meta);
    const drafts = await service.buildGrowthProfileDrafts({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      idempotency_key: 'idem-m2-103-consent-recheck-build',
    }, meta);
    const draft = drafts.drafts.find((item) => item.dimension_id === 'R03');
    expect(draft).toBeDefined();

    await pool.query(
      `update consents
       set status = 'WITHDRAWN', withdrawn_at = now()
       where family_id = $1 and subject_person_id = $2 and purpose = 'GROWTH_TRACKING'`,
      [family.family.family_id, child.child.person_id],
    );

    await expect(service.confirmGrowthProfile({
      family_id: family.family.family_id,
      draft_id: draft!.draft_id,
      idempotency_key: 'idem-m2-103-consent-recheck-confirm',
    }, meta)).rejects.toThrow('missing_required_consent:GROWTH_TRACKING');

    const profiles = await pool.query('select * from growth_profiles');
    expect(profiles.rowCount).toBe(0);
  });

  it('versions confirmed profiles for the same M2-103 dimension', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const onboarding = await seedM2Perspectives(family.family.family_id, parent.parent.person_id, child.child.person_id, meta);
    const firstDrafts = await service.buildGrowthProfileDrafts({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      idempotency_key: 'idem-m2-103-version-build-1',
    }, meta);
    const firstDraft = firstDrafts.drafts.find((item) => item.dimension_id === 'R03');
    expect(firstDraft).toBeDefined();
    const first = await service.confirmGrowthProfile({
      family_id: family.family.family_id,
      draft_id: firstDraft!.draft_id,
      idempotency_key: 'idem-m2-103-version-confirm-1',
    }, meta);

    const secondDrafts = await service.buildGrowthProfileDrafts({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      idempotency_key: 'idem-m2-103-version-build-2',
    }, meta);
    const secondDraft = secondDrafts.drafts.find((item) => item.dimension_id === 'R03' && item.status === 'DRAFT');
    expect(secondDraft).toBeDefined();
    const second = await service.confirmGrowthProfile({
      family_id: family.family.family_id,
      draft_id: secondDraft!.draft_id,
      idempotency_key: 'idem-m2-103-version-confirm-2',
    }, meta);

    expect(first.profile).toMatchObject({ version: 1, previous_profile_id: null });
    expect(second.profile).toMatchObject({ version: 2, previous_profile_id: first.profile.profile_id });

    const workingProfiles = await pool.query('select profile_id, status, version, previous_profile_id from growth_profiles where status = $1', ['WORKING']);
    const supersededProfiles = await pool.query('select profile_id, status, version, previous_profile_id from growth_profiles where status = $1', ['SUPERSEDED']);
    expect(workingProfiles.rows).toMatchObject([{ profile_id: second.profile.profile_id, version: 2, previous_profile_id: first.profile.profile_id }]);
    expect(supersededProfiles.rows).toMatchObject([{ profile_id: first.profile.profile_id, version: 1, previous_profile_id: null }]);
  });

  it('does not confirm unresolved M2-103 drafts', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const onboarding = await seedM2Perspectives(family.family.family_id, parent.parent.person_id, child.child.person_id, meta);
    const drafts = await service.buildGrowthProfileDrafts({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      idempotency_key: 'idem-m2-103-unresolved-build',
    }, meta);
    const unresolved = drafts.drafts.find((item) => item.dimension_id === 'R05');
    expect(unresolved).toBeDefined();

    await expect(service.confirmGrowthProfile({
      family_id: family.family.family_id,
      draft_id: unresolved!.draft_id,
      idempotency_key: 'idem-m2-103-unresolved-confirm',
    }, meta)).rejects.toThrow('growth_profile_draft_not_confirmable:REVIEW_REQUIRED');

    const profiles = await pool.query('select * from growth_profiles');
    expect(profiles.rowCount).toBe(0);
  });

  it('rejects a perspective subject that does not match the active onboarding child', async () => {
    const { family, parent, child, meta } = await seedM2ReadyFamily();
    const otherChild = await service.addChild({
      family_id: family.family.family_id,
      display_name: '另一个孩子',
      birth_date: '2014-01-01',
      idempotency_key: 'idem-m2-102-other-child',
    }, meta);
    await service.createRelationship({
      family_id: family.family.family_id,
      person_a_id: parent.parent.person_id,
      person_b_id: otherChild.child.person_id,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: 'idem-m2-102-other-child-relationship',
    }, meta);
    await service.grantConsent({
      family_id: family.family.family_id,
      subject_person_id: otherChild.child.person_id,
      guardian_person_id: parent.parent.person_id,
      purpose: 'SERVICE',
      policy_version: 'm2-102-test',
      idempotency_key: 'idem-m2-102-other-child-consent-service',
    }, meta);
    await service.grantConsent({
      family_id: family.family.family_id,
      subject_person_id: otherChild.child.person_id,
      guardian_person_id: parent.parent.person_id,
      purpose: 'ASSESSMENT',
      policy_version: 'm2-102-test',
      idempotency_key: 'idem-m2-102-other-child-consent-assessment',
    }, meta);
    await service.grantConsent({
      family_id: family.family.family_id,
      subject_person_id: otherChild.child.person_id,
      guardian_person_id: parent.parent.person_id,
      purpose: 'GROWTH_TRACKING',
      policy_version: 'm2-102-test',
      idempotency_key: 'idem-m2-102-other-child-consent-growth',
    }, meta);
    const onboarding = await service.startGrowthOnboarding({
      family_id: family.family.family_id,
      child_id: child.child.person_id,
      guardian_person_id: parent.parent.person_id,
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-m2-102-onboarding-subject-mismatch',
    }, meta);

    await expect(service.recordPerspective({
      family_id: family.family.family_id,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: otherChild.child.person_id,
      author_person_id: parent.parent.person_id,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      related_dimension_ids: ['P03'],
      content: {
        prompt_id: 'parent-mismatch-v1',
        response_text: '不能挂到错误的 onboarding child。',
        selected_signals: [],
      },
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-record-subject-mismatch-perspective',
    }, meta)).rejects.toThrow('perspective_subject_must_match_onboarding_child');
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

  async function seedM2Perspectives(familyId: string, parentId: string, childId: string, meta: { actor: string; correlationId: string; source: string; occurredAt: string }) {
    const onboarding = await service.startGrowthOnboarding({
      family_id: familyId,
      child_id: childId,
      guardian_person_id: parentId,
      structured_safety_signals: ['NONE'],
      idempotency_key: `idem-m2-103-onboarding-${crypto.randomUUID()}`,
    }, meta);
    await service.recordPerspective({
      family_id: familyId,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: childId,
      author_person_id: parentId,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      related_dimension_ids: ['P03', 'R03'],
      content: {
        prompt_id: 'parent-m2-103-v1',
        response_text: '我发现自己经常还没听完就开始评价。',
        selected_signals: ['interrupts', 'evaluates-too-fast'],
      },
      structured_safety_signals: ['NONE'],
      idempotency_key: `idem-m2-103-parent-perspective-${crypto.randomUUID()}`,
    }, meta);
    await service.recordPerspective({
      family_id: familyId,
      onboarding_id: onboarding.onboarding.onboarding_id,
      subject_person_id: childId,
      author_person_id: childId,
      perspective_type: 'CHILD_PERSPECTIVE',
      capture_mode: 'FACILITATED_ENTRY',
      related_dimension_ids: ['R03', 'R04'],
      content: {
        prompt_id: 'child-m2-103-v1',
        response_text: '我希望大人先听我讲完，再一起想办法。',
        selected_signals: ['wants-to-be-heard'],
      },
      structured_safety_signals: ['NONE'],
      idempotency_key: `idem-m2-103-child-perspective-${crypto.randomUUID()}`,
    }, meta);
    return onboarding;
  }
});