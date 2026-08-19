import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { AuditMeta } from '@family/contracts';
import { createTestPool } from '../../test/test-database';
import { seedFamilyPlatformFixture, FAMILY_PLATFORM_FIXTURE } from '../../test-fixtures/family-platform.integration.fixture';
import { FamilyRepository } from './family.repository';
import { GrowthSubjectResolver } from './growth-subject.resolver';
import { JourneyPlanService } from './journey-plan.service';
import { GrowthActionService } from './growth-action.service';

let pool: pg.Pool;
let repository: FamilyRepository;
let service: JourneyPlanService;
let growthActionService: GrowthActionService;
let runKey = '';

const meta = (suffix: string): AuditMeta => ({
  actor: FAMILY_PLATFORM_FIXTURE.guardianId,
  correlationId: `corr-journey-90-${suffix}-${runKey}`,
  source: 'journey-plan-integration-test',
  occurredAt: '2026-08-19T00:00:00.000Z',
});

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) throw new Error('REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set');
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  pool = createTestPool();
  await pool.query('select 1');
  repository = new FamilyRepository();
  const subjectResolver = new GrowthSubjectResolver();
  service = new JourneyPlanService(repository, subjectResolver);
  growthActionService = new GrowthActionService(repository, subjectResolver);
});

beforeEach(async () => {
  runKey = randomUUID();
  await seedFamilyPlatformFixture(pool);
});

afterAll(async () => {
  await repository?.onModuleDestroy();
  await pool?.end();
});

describe('90-day Family Journey Plan PostgreSQL integration', () => {
  it('creates a family-private four-phase draft and confirms it without generating outcomes, diagnoses, or extra actions', async () => {
    const f = FAMILY_PLATFORM_FIXTURE;
    const before = await service.getActiveProjection(f.familyId, f.guardianId);
    expect(before.plan).toBeNull();

    const created = await service.createPlan({
      family_id: f.familyId,
      onboarding_id: f.journeyId,
      priority_id: f.priorityId,
      idempotency_key: `idem-journey-90-create-${runKey}`,
    }, meta('create'));

    expect(created.created).toBe(true);
    expect(created.plan).toMatchObject({
      family_id: f.familyId,
      onboarding_id: f.journeyId,
      priority_id: f.priorityId,
      status: 'DRAFT',
      current_phase: 'SEE',
      current_day: 1,
      total_days: 90,
      policy_version: 'JOURNEY_90_DAY_V1',
      boundary: 'PLAN_IS_FAMILY_CONFIRMED_CADENCE_NOT_DIAGNOSIS_OR_OUTCOME',
    });
    expect(created.plan.phases.map((phase) => [phase.phase, phase.start_day, phase.end_day, phase.review_due_day])).toEqual([
      ['SEE', 1, 14, 14],
      ['PARENT_FIRST', 15, 35, 35],
      ['CO_CREATE', 36, 60, 60],
      ['STABILIZE', 61, 90, 90],
    ]);
    expect(created.plan.phases.every((phase) => phase.boundary === 'PHASE_TRANSITION_REQUIRES_REVIEW_AND_FAMILY_DECISION')).toBe(true);

    const replay = await service.createPlan({
      family_id: f.familyId,
      onboarding_id: f.journeyId,
      priority_id: f.priorityId,
      idempotency_key: `idem-journey-90-create-${runKey}`,
    }, meta('create-replay'));
    expect(replay).toEqual(created);

    const confirmed = await service.confirmPlan({
      family_id: f.familyId,
      plan_id: created.plan.plan_id,
      idempotency_key: `idem-journey-90-confirm-${runKey}`,
    }, meta('confirm'));
    expect(confirmed.plan.status).toBe('ACTIVE');
    expect(confirmed.plan.confirmed_by_actor_id).toBe(f.guardianId);
    expect(confirmed.plan.phases.find((phase) => phase.phase === 'SEE')?.status).toBe('ACTIVE');
    expect(confirmed.plan.phases.filter((phase) => phase.phase !== 'SEE').every((phase) => phase.status === 'PENDING')).toBe(true);
    const persisted = await pool.query<{ plan_id: string; status: string }>('select plan_id, status from family_journey_plans where family_id = $1 and plan_id = $2', [f.familyId, created.plan.plan_id]);
    expect(persisted.rows).toEqual([{ plan_id: created.plan.plan_id, status: 'ACTIVE' }]);
    const plannedActions = await pool.query<{ day_index: number; journey_phase: string; status: string; boundary: string }>(
      `select day_index, journey_phase, status, boundary
       from growth_actions where journey_plan_id = $1 order by day_index`,
      [created.plan.plan_id],
    );
    expect(plannedActions.rowCount).toBe(90);
    expect(plannedActions.rows[0]).toMatchObject({ day_index: 1, journey_phase: 'SEE', status: 'PENDING', boundary: 'ACTION_IS_NOT_OUTCOME' });
    expect(plannedActions.rows[13]).toMatchObject({ day_index: 14, journey_phase: 'SEE' });
    expect(plannedActions.rows[14]).toMatchObject({ day_index: 15, journey_phase: 'PARENT_FIRST' });
    expect(plannedActions.rows[35]).toMatchObject({ day_index: 36, journey_phase: 'CO_CREATE' });
    expect(plannedActions.rows[60]).toMatchObject({ day_index: 61, journey_phase: 'STABILIZE' });

    const firstActionId = await pool.query<{ action_id: string }>(
      `select action_id from growth_actions where journey_plan_id = $1 and day_index = 1`,
      [created.plan.plan_id],
    );
    const todayAction = await growthActionService.getTodayAction(f.familyId, f.guardianId);
    expect(todayAction).toMatchObject({
      action_id: firstActionId.rows[0].action_id,
      journey_plan_id: created.plan.plan_id,
      journey_phase: 'SEE',
      day_index: 1,
      boundary: 'ACTION_IS_NOT_OUTCOME',
    });
    const completed = await growthActionService.completeGrowthAction({
      family_id: f.familyId,
      action_id: firstActionId.rows[0].action_id,
      completion_status: 'COMPLETED',
      reflection: '今天先完整听完，再复述了我听到的内容。',
      occurred_at: meta('day-one-checkin').occurredAt,
      idempotency_key: `idem-journey-90-day-one-${runKey}`,
    }, meta('day-one-checkin'));
    expect(completed.action).toMatchObject({
      journey_plan_id: created.plan.plan_id,
      journey_phase: 'SEE',
      day_index: 1,
      status: 'COMPLETED',
      reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME',
      boundary: 'ACTION_IS_NOT_OUTCOME',
    });
    const reviewableJourneyActions = await growthActionService.listCompletedJourneyActions(
      f.familyId,
      f.guardianId,
      f.journeyId,
    );
    expect(reviewableJourneyActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action_id: firstActionId.rows[0].action_id,
        journey_plan_id: created.plan.plan_id,
        journey_phase: 'SEE',
        day_index: 1,
        boundary: 'JOURNEY_ACTION_IS_PROCESS_NOT_OUTCOME',
      }),
    ]));

    const active = await service.getActiveProjection(f.familyId, f.guardianId);
    expect(active).toMatchObject({
      family_id: f.familyId,
      fact_boundary: 'JOURNEY_PROGRESS_IS_SCHEDULE_STATE_NOT_GROWTH_OUTCOME',
      recommendation_boundary: 'NEXT_PHASE_IS_A_FAMILY_DECISION_NOT_AN_AUTOMATIC_RECOMMENDATION',
      model_gateway_status: 'NOOP',
    });
    expect(active.plan?.plan_id).toBe(created.plan.plan_id);
    expect(active.plan?.current_day).toBe(1);
    expect(active.plan?.phases.find((phase) => phase.phase === 'SEE')?.status).toBe('ACTIVE');

    await expectNoOutcomeOrModelEffects(f.familyId);
    await expectTableCount('growth_actions', f.familyId, 91);
    await expectAuditAndOutbox(
      ['Create90DayJourneyPlan', 'Confirm90DayJourneyPlan'],
      ['JourneyPlanCreated', 'JourneyPlanConfirmed'],
      [meta('create').correlationId, meta('confirm').correlationId],
    );
  });

  it('requires a phase review and family decision before advancing, and pauses rather than inventing a next action when adjusted', async () => {
    const f = FAMILY_PLATFORM_FIXTURE;
    const created = await service.createPlan({
      family_id: f.familyId,
      onboarding_id: f.journeyId,
      priority_id: f.priorityId,
      idempotency_key: `idem-journey-90-phase-create-${runKey}`,
    }, meta('phase-create'));
    await service.confirmPlan({ family_id: f.familyId, plan_id: created.plan.plan_id, idempotency_key: `idem-journey-90-phase-confirm-${runKey}` }, meta('phase-confirm'));
    const persisted = await pool.query<{ plan_id: string; status: string }>('select plan_id, status from family_journey_plans where family_id = $1 and plan_id = $2', [f.familyId, created.plan.plan_id]);
    expect(persisted.rows).toEqual([{ plan_id: created.plan.plan_id, status: 'ACTIVE' }]);

    await expect(service.reviewCurrentPhase({
      family_id: f.familyId,
      plan_id: created.plan.plan_id,
      decision: 'CONTINUE',
      idempotency_key: `idem-journey-90-early-review-${runKey}`,
    }, meta('early-review'))).rejects.toThrow('journey_phase_review_not_due');

    await pool.query(
      `update family_journey_plan_phases set status = 'REVIEW_DUE' where plan_id = $1 and phase = 'SEE'`,
      [created.plan.plan_id],
    );
    const continued = await service.reviewCurrentPhase({
      family_id: f.familyId,
      plan_id: created.plan.plan_id,
      decision: 'CONTINUE',
      idempotency_key: `idem-journey-90-continue-${runKey}`,
    }, meta('continue'));
    expect(continued.plan.status).toBe('ACTIVE');
    expect(continued.plan.current_phase).toBe('PARENT_FIRST');
    expect(continued.plan.current_day).toBe(15);
    expect(continued.plan.phases.find((phase) => phase.phase === 'SEE')?.status).toBe('COMPLETED');
    expect(continued.plan.phases.find((phase) => phase.phase === 'PARENT_FIRST')?.status).toBe('ACTIVE');

    await pool.query(
      `update family_journey_plan_phases set status = 'REVIEW_DUE' where plan_id = $1 and phase = 'PARENT_FIRST'`,
      [created.plan.plan_id],
    );
    const adjusted = await service.reviewCurrentPhase({
      family_id: f.familyId,
      plan_id: created.plan.plan_id,
      decision: 'ADJUST',
      idempotency_key: `idem-journey-90-adjust-${runKey}`,
    }, meta('adjust'));
    expect(adjusted.plan.status).toBe('PAUSED');
    expect(adjusted.plan.phases.find((phase) => phase.phase === 'PARENT_FIRST')?.status).toBe('BLOCKED');
    await expectNoOutcomeOrModelEffects(f.familyId);
    await expectTableCount('growth_actions', f.familyId, 91);
  });
});

async function expectTableCount(table: 'growth_actions', familyId: string, expected: number): Promise<void> {
  const result = await pool.query<{ count: string }>(`select count(*)::text as count from ${table} where family_id = $1`, [familyId]);
  expect(Number(result.rows[0].count)).toBe(expected);
}

async function expectNoOutcomeOrModelEffects(familyId: string): Promise<void> {
  const [observations, reviews, modelAudits] = await Promise.all([
    pool.query<{ count: string }>('select count(*)::text as count from outcome_observations where family_id = $1', [familyId]),
    pool.query<{ count: string }>('select count(*)::text as count from growth_reviews where family_id = $1', [familyId]),
    pool.query<{ count: string }>('select count(*)::text as count from family_llm_gateway_audits where family_id = $1', [familyId]),
  ]);
  expect(Number(observations.rows[0].count)).toBe(0);
  expect(Number(reviews.rows[0].count)).toBe(0);
  expect(Number(modelAudits.rows[0].count)).toBe(0);
}

async function expectAuditAndOutbox(actions: string[], events: string[], correlationIds: string[]): Promise<void> {
  const [audit, outbox] = await Promise.all([
    pool.query<{ action_name: string }>(`select action_name from audit_logs where action_name = any($1::text[]) and correlation_id = any($2::text[]) order by action_name`, [actions, correlationIds]),
    pool.query<{ event_name: string }>(`select event_name from outbox_events where event_name = any($1::text[]) and correlation_id = any($2::text[]) order by event_name`, [events, correlationIds]),
  ]);
  expect(audit.rows.map((row) => row.action_name).sort()).toEqual([...actions].sort());
  expect(outbox.rows.map((row) => row.event_name).sort()).toEqual([...events].sort());
}
