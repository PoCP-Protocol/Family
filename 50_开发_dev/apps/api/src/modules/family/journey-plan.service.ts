import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';
import type {
  AuditMeta,
  ConfirmJourneyPlanRequest,
  ConfirmJourneyPlanResponse,
  CreateJourneyPlanRequest,
  CreateJourneyPlanResponse,
  JourneyPlanDto,
  JourneyPlanPhase,
  JourneyPlanPhaseDto,
  JourneyPlanPhaseStatus,
  JourneyPlanProjection,
  JourneyPhaseReviewDecision,
  PauseJourneyPlanRequest,
  PauseJourneyPlanResponse,
  ReviewJourneyPhaseRequest,
  ReviewJourneyPhaseResponse,
} from '@family/contracts';
import { FamilyRepository } from './family.repository';
import { assertFamilyManagePermission } from './family-permission';
import { GrowthSubjectResolver } from './growth-subject.resolver';
import { assertNormalSafetyRoute } from './normal-safety-route.policy';

const POLICY_VERSION = 'JOURNEY_90_DAY_V1' as const;
const PLAN_BOUNDARY = 'PLAN_IS_FAMILY_CONFIRMED_CADENCE_NOT_DIAGNOSIS_OR_OUTCOME' as const;
const PHASE_BOUNDARY = 'PHASE_TRANSITION_REQUIRES_REVIEW_AND_FAMILY_DECISION' as const;
const CREATE_ACTION = 'Create90DayJourneyPlan';
const CONFIRM_ACTION = 'Confirm90DayJourneyPlan';
const PAUSE_ACTION = 'Pause90DayJourneyPlan';
const REVIEW_ACTION = 'Review90DayJourneyPhase';
const ONBOARDING_TYPE = 'PARENT_CHILD_COMMUNICATION_CONFLICT';

type IdempotencyResult<T> = { replay: false } | { replay: true; response: T };

interface JourneyPlanRow {
  plan_id: string;
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  title: string;
  status: JourneyPlanDto['status'];
  current_phase: JourneyPlanPhase;
  current_day: number;
  total_days: 90;
  confirmed_by_actor_id: string | null;
  confirmed_at: Date | string | null;
  paused_at: Date | string | null;
  completed_at: Date | string | null;
  version: number;
  policy_version: typeof POLICY_VERSION;
  boundary: typeof PLAN_BOUNDARY;
  created_at: Date | string;
  updated_at: Date | string;
}

interface JourneyPlanPhaseRow {
  phase: JourneyPlanPhase;
  start_day: number;
  end_day: number;
  status: JourneyPlanPhaseStatus;
  focus_dimensions: string[];
  review_due_day: number;
  boundary: typeof PHASE_BOUNDARY;
}

const PHASE_DEFINITIONS: Array<Pick<JourneyPlanPhaseDto, 'phase' | 'start_day' | 'end_day' | 'review_due_day'>> = [
  { phase: 'SEE', start_day: 1, end_day: 14, review_due_day: 14 },
  { phase: 'PARENT_FIRST', start_day: 15, end_day: 35, review_due_day: 35 },
  { phase: 'CO_CREATE', start_day: 36, end_day: 60, review_due_day: 60 },
  { phase: 'STABILIZE', start_day: 61, end_day: 90, review_due_day: 90 },
];

@Injectable()
export class JourneyPlanService {
  constructor(
    @Inject(FamilyRepository) private readonly repository: FamilyRepository,
    @Inject(GrowthSubjectResolver) private readonly growthSubjectResolver: GrowthSubjectResolver = new GrowthSubjectResolver(),
  ) {}

  async getActiveProjection(familyId: string, actorId: string): Promise<JourneyPlanProjection> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      const plan = await getCurrentPlan(client, familyId);
      return {
        family_id: familyId,
        plan: plan ? await hydratePlan(client, plan) : null,
        fact_boundary: 'JOURNEY_PROGRESS_IS_SCHEDULE_STATE_NOT_GROWTH_OUTCOME',
        recommendation_boundary: 'NEXT_PHASE_IS_A_FAMILY_DECISION_NOT_AN_AUTOMATIC_RECOMMENDATION',
        model_gateway_status: 'NOOP',
      };
    });
  }

  async createPlan(request: CreateJourneyPlanRequest, meta: AuditMeta): Promise<CreateJourneyPlanResponse> {
    const requestHash = hash({ family_id: request.family_id, onboarding_id: request.onboarding_id, priority_id: request.priority_id, actor_id: meta.actor });
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<CreateJourneyPlanResponse>(client, CREATE_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;

      await assertActiveOnboardingAndPriority(client, request);
      const subject = await this.growthSubjectResolver.resolve(client, {
        familyId: request.family_id,
        onboardingId: request.onboarding_id,
        priorityId: request.priority_id,
      });
      await assertRequiredGrowthConsents(client, request.family_id, subject.childPersonId);
      await assertNormalSafetyRoute(client, request.family_id, request.onboarding_id);

      const current = await getCurrentPlanForUpdate(client, request.family_id, request.onboarding_id);
      if (current) {
        const response: CreateJourneyPlanResponse = { plan: await hydratePlan(client, current), created: false };
        await storeIdempotencyResponse(client, request.idempotency_key, response);
        return response;
      }

      const priority = await getPriorityDimension(client, request.family_id, request.onboarding_id, request.priority_id);
      const result = await client.query<JourneyPlanRow>(
        `insert into family_journey_plans(
           family_id, onboarding_id, priority_id, title, status, current_phase, current_day,
           total_days, policy_version, boundary
         ) values ($1, $2, $3, $4, 'DRAFT', 'SEE', 1, 90, $5, $6)
         returning plan_id, family_id, onboarding_id, priority_id, title, status, current_phase,
                   current_day, total_days, confirmed_by_actor_id, confirmed_at, paused_at,
                   completed_at, version, policy_version, boundary, created_at, updated_at`,
        [request.family_id, request.onboarding_id, request.priority_id, '90天家庭共同成长计划', POLICY_VERSION, PLAN_BOUNDARY],
      );
      const planRow = result.rows[0];
      await insertPhases(client, planRow.plan_id, priority.dimension_id);
      const plan = await hydratePlan(client, planRow);
      const response: CreateJourneyPlanResponse = { plan, created: true };
      await insertAuditAndOutbox(client, CREATE_ACTION, 'JourneyPlanCreated', request.family_id, plan.plan_id, request.idempotency_key, meta, response);
      await storeIdempotencyResponse(client, request.idempotency_key, response);
      return response;
    });
  }

  async confirmPlan(request: ConfirmJourneyPlanRequest, meta: AuditMeta): Promise<ConfirmJourneyPlanResponse> {
    const requestHash = hash({ family_id: request.family_id, plan_id: request.plan_id, actor_id: meta.actor });
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<ConfirmJourneyPlanResponse>(client, CONFIRM_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;

      const plan = await getPlanForUpdate(client, request.family_id, request.plan_id);
      if (plan.status !== 'DRAFT') throw new ConflictException('journey_plan_not_draft');
      await assertNormalSafetyRoute(client, request.family_id, plan.onboarding_id);
      const subject = await this.growthSubjectResolver.resolve(client, { familyId: request.family_id, onboardingId: plan.onboarding_id, priorityId: plan.priority_id });
      await assertRequiredGrowthConsents(client, request.family_id, subject.childPersonId);

      await client.query(
        `update family_journey_plans
         set status = 'ACTIVE', confirmed_by_actor_id = $3, confirmed_at = $4,
             updated_at = $4, version = version + 1
         where family_id = $1 and plan_id = $2`,
        [request.family_id, request.plan_id, meta.actor, meta.occurredAt],
      );
      await client.query(
        `update family_journey_plan_phases
         set status = case when phase = 'SEE' then 'ACTIVE' else 'PENDING' end, updated_at = $2
         where plan_id = $1`,
        [request.plan_id, meta.occurredAt],
      );
      await createJourneyPlanActions(client, plan, meta.occurredAt);
      const updated = await getPlanForUpdate(client, request.family_id, request.plan_id);
      const response: ConfirmJourneyPlanResponse = { plan: await hydratePlan(client, updated) };
      await insertAuditAndOutbox(client, CONFIRM_ACTION, 'JourneyPlanConfirmed', request.family_id, request.plan_id, request.idempotency_key, meta, response);
      await storeIdempotencyResponse(client, request.idempotency_key, response);
      return response;
    });
  }

  async pausePlan(request: PauseJourneyPlanRequest, meta: AuditMeta): Promise<PauseJourneyPlanResponse> {
    const requestHash = hash({ family_id: request.family_id, plan_id: request.plan_id, actor_id: meta.actor });
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<PauseJourneyPlanResponse>(client, PAUSE_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;
      const plan = await getPlanForUpdate(client, request.family_id, request.plan_id);
      if (plan.status !== 'ACTIVE') throw new ConflictException('journey_plan_not_active');

      await client.query(
        `update family_journey_plans set status = 'PAUSED', paused_at = $3, updated_at = $3, version = version + 1
         where family_id = $1 and plan_id = $2`,
        [request.family_id, request.plan_id, meta.occurredAt],
      );
      const updated = await getPlanForUpdate(client, request.family_id, request.plan_id);
      const response: PauseJourneyPlanResponse = { plan: await hydratePlan(client, updated) };
      await insertAuditAndOutbox(client, PAUSE_ACTION, 'JourneyPlanPaused', request.family_id, request.plan_id, request.idempotency_key, meta, response);
      await storeIdempotencyResponse(client, request.idempotency_key, response);
      return response;
    });
  }

  async reviewCurrentPhase(request: ReviewJourneyPhaseRequest, meta: AuditMeta): Promise<ReviewJourneyPhaseResponse> {
    const requestHash = hash({ family_id: request.family_id, plan_id: request.plan_id, decision: request.decision, actor_id: meta.actor });
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<ReviewJourneyPhaseResponse>(client, REVIEW_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;
      const plan = await getPlanForUpdate(client, request.family_id, request.plan_id);
      if (plan.status !== 'ACTIVE') throw new ConflictException('journey_plan_not_active');
      const phases = await listPhases(client, plan.plan_id);
      const current = phases.find((phase) => phase.phase === plan.current_phase);
      if (!current || current.status !== 'REVIEW_DUE') throw new ConflictException('journey_phase_review_not_due');

      if (request.decision === 'CONTINUE') {
        const next = nextPhase(plan.current_phase);
        await client.query(
          `update family_journey_plan_phases set status = 'COMPLETED', updated_at = $3
           where plan_id = $1 and phase = $2`, [plan.plan_id, plan.current_phase, meta.occurredAt],
        );
        if (next) {
          const nextDefinition = phases.find((phase) => phase.phase === next)!;
          await client.query(
            `update family_journey_plan_phases set status = 'ACTIVE', updated_at = $3
             where plan_id = $1 and phase = $2`, [plan.plan_id, next, meta.occurredAt],
          );
          await client.query(
            `update family_journey_plans set current_phase = $3, current_day = $4, updated_at = $5, version = version + 1
             where family_id = $1 and plan_id = $2`, [request.family_id, plan.plan_id, next, nextDefinition.start_day, meta.occurredAt],
          );
        } else {
          await client.query(
            `update family_journey_plans set status = 'COMPLETED', completed_at = $3, current_day = 90,
                 updated_at = $3, version = version + 1 where family_id = $1 and plan_id = $2`,
            [request.family_id, plan.plan_id, meta.occurredAt],
          );
        }
      } else {
        await client.query(
          `update family_journey_plan_phases set status = 'BLOCKED', updated_at = $3
           where plan_id = $1 and phase = $2`, [plan.plan_id, plan.current_phase, meta.occurredAt],
        );
        await client.query(
          `update family_journey_plans set status = 'PAUSED', paused_at = $3, updated_at = $3, version = version + 1
           where family_id = $1 and plan_id = $2`, [request.family_id, plan.plan_id, meta.occurredAt],
        );
      }

      const updated = await getPlanForUpdate(client, request.family_id, request.plan_id);
      const response: ReviewJourneyPhaseResponse = { plan: await hydratePlan(client, updated), decision: request.decision };
      await insertAuditAndOutbox(client, REVIEW_ACTION, 'JourneyPhaseReviewed', request.family_id, request.plan_id, request.idempotency_key, meta, response);
      await storeIdempotencyResponse(client, request.idempotency_key, response);
      return response;
    });
  }
}

function hash(value: unknown): string { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

async function ensureFamilyExists(client: pg.PoolClient, familyId: string): Promise<void> {
  const result = await client.query('select family_id from families where family_id = $1 for share', [familyId]);
  if (result.rowCount !== 1) throw new NotFoundException('family_not_found');
}

async function assertActiveOnboardingAndPriority(client: pg.PoolClient, request: CreateJourneyPlanRequest): Promise<void> {
  const result = await client.query(
    `select gp.priority_id from growth_priorities gp
     join growth_journeys gj on gj.journey_id = gp.onboarding_id
     where gp.family_id = $1 and gp.onboarding_id = $2 and gp.priority_id = $3 and gp.status = 'ACTIVE'
       and gj.journey_type = $4 and gj.phase = 'ONBOARDING' and gj.status = 'ACTIVE' for share`,
    [request.family_id, request.onboarding_id, request.priority_id, ONBOARDING_TYPE],
  );
  if (result.rowCount !== 1) throw new NotFoundException('active_growth_priority_not_found');
}

async function getPriorityDimension(client: pg.PoolClient, familyId: string, onboardingId: string, priorityId: string): Promise<{ dimension_id: string }> {
  const result = await client.query<{ dimension_id: string }>(
    `select dimension_id from growth_priorities where family_id = $1 and onboarding_id = $2 and priority_id = $3 and status = 'ACTIVE' for share`,
    [familyId, onboardingId, priorityId],
  );
  if (!result.rows[0]) throw new NotFoundException('active_growth_priority_not_found');
  return result.rows[0];
}

async function assertRequiredGrowthConsents(client: pg.PoolClient, familyId: string, childId: string): Promise<void> {
  const result = await client.query<{ purpose: string }>(
    `select purpose from consents where family_id = $1 and subject_person_id = $2
       and purpose = any($3::consent_purpose[]) and status = 'GRANTED' for share`,
    [familyId, childId, ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING']],
  );
  const granted = new Set(result.rows.map((row) => row.purpose));
  const missing = ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'].filter((purpose) => !granted.has(purpose));
  if (missing.length) throw new ForbiddenException(`missing_required_consent:${missing.join(',')}`);
}

async function getCurrentPlan(client: pg.PoolClient, familyId: string): Promise<JourneyPlanRow | null> {
  const result = await client.query<JourneyPlanRow>(
    `select plan_id, family_id, onboarding_id, priority_id, title, status, current_phase, current_day, total_days,
            confirmed_by_actor_id, confirmed_at, paused_at, completed_at, version, policy_version, boundary, created_at, updated_at
     from family_journey_plans where family_id = $1 and status in ('DRAFT', 'ACTIVE', 'PAUSED')
     order by updated_at desc limit 1`, [familyId],
  );
  return result.rows[0] ?? null;
}

async function getCurrentPlanForUpdate(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<JourneyPlanRow | null> {
  const result = await client.query<JourneyPlanRow>(
    `select plan_id, family_id, onboarding_id, priority_id, title, status, current_phase, current_day, total_days,
            confirmed_by_actor_id, confirmed_at, paused_at, completed_at, version, policy_version, boundary, created_at, updated_at
     from family_journey_plans where family_id = $1 and onboarding_id = $2 and status in ('DRAFT', 'ACTIVE', 'PAUSED')
     order by updated_at desc limit 1 for update`, [familyId, onboardingId],
  );
  return result.rows[0] ?? null;
}

async function getPlanForUpdate(client: pg.PoolClient, familyId: string, planId: string): Promise<JourneyPlanRow> {
  const result = await client.query<JourneyPlanRow>(
    `select plan_id, family_id, onboarding_id, priority_id, title, status, current_phase, current_day, total_days,
            confirmed_by_actor_id, confirmed_at, paused_at, completed_at, version, policy_version, boundary, created_at, updated_at
     from family_journey_plans where family_id = $1 and plan_id = $2 for update`, [familyId, planId],
  );
  if (!result.rows[0]) throw new NotFoundException('journey_plan_not_found');
  return result.rows[0];
}

async function insertPhases(client: pg.PoolClient, planId: string, priorityDimension: string): Promise<void> {
  for (const definition of PHASE_DEFINITIONS) {
    const focus = definition.phase === 'SEE' || definition.phase === 'STABILIZE'
      ? [priorityDimension]
      : definition.phase === 'PARENT_FIRST' ? ['P03', 'R03'] : ['R04', 'R05'];
    await client.query(
      `insert into family_journey_plan_phases(plan_id, phase, start_day, end_day, status, focus_dimensions, review_due_day, boundary)
       values ($1, $2, $3, $4, 'PENDING', $5::jsonb, $6, $7)`,
      [planId, definition.phase, definition.start_day, definition.end_day, JSON.stringify(focus), definition.review_due_day, PHASE_BOUNDARY],
    );
  }
}

const PHASE_ACTION_TEMPLATES: Record<JourneyPlanPhase, readonly string[]> = {
  SEE: [
    '留出十分钟，先听孩子完整说完再回应。',
    '用一句话复述你听到的内容，确认是否理解。',
    '在一个自然时刻提出一个开放问题，不急着给建议。',
    '记录一次互动中的感受；这只是家庭视角，不是结果判断。',
  ],
  PARENT_FIRST: [
    '在回应前暂停三秒，先辨认自己想立刻解决的问题。',
    '选择一次沟通，先表达理解再提出自己的看法。',
    '把一条指令改成一个可以共同讨论的问题。',
    '回看今天一次沟通，记录父母可继续练习的一个小动作。',
  ],
  CO_CREATE: [
    '与孩子共同选定一件今天可尝试的小事。',
    '在家庭互动中轮流表达，每个人都先说完再回应。',
    '把一个分歧改写为双方都能理解的共同约定。',
    '回顾共同尝试的过程，只记录观察与感受，不评价效果。',
  ],
  STABILIZE: [
    '沿用一项已商定的沟通约定，并观察是否适合今天的情境。',
    '为一次顺利互动留出肯定和感谢的表达。',
    '遇到不顺利时，回到倾听、复述和共同选择这三个基础动作。',
    '记录本周想保留或调整的一项家庭做法，供阶段复盘讨论。',
  ],
};

function phaseForDay(dayIndex: number): JourneyPlanPhase {
  return PHASE_DEFINITIONS.find((phase) => dayIndex >= phase.start_day && dayIndex <= phase.end_day)?.phase ?? 'STABILIZE';
}

async function createJourneyPlanActions(client: pg.PoolClient, plan: JourneyPlanRow, occurredAt: string): Promise<void> {
  const existing = await client.query<{ count: string }>(
    `select count(*)::text as count from growth_actions where journey_plan_id = $1`,
    [plan.plan_id],
  );
  if (Number(existing.rows[0]?.count ?? '0') > 0) return;

  const priority = await getPriorityDimension(client, plan.family_id, plan.onboarding_id, plan.priority_id);
  for (let dayIndex = 1; dayIndex <= 90; dayIndex += 1) {
    const phase = phaseForDay(dayIndex);
    const templates = PHASE_ACTION_TEMPLATES[phase];
    const assignment = templates[(dayIndex - 1) % templates.length];
    await client.query(
      `insert into growth_actions(
         family_id, journey_id, intervention_id, dimension_id, action_type, instruction, status,
         assigned_at, onboarding_id, priority_id, journey_plan_id, journey_phase, day_index,
         assignment_text, due_date, completion_status, reflection, reflection_boundary, boundary
       ) values (
         $1, $2, null, $3, 'JOURNEY_90_DAY_PRACTICE', $4, 'PENDING',
         $5, $2, $6, $7, $8, $9::smallint, $4,
         ($5::timestamptz)::date + ($9::integer - 1), null, null, null, 'ACTION_IS_NOT_OUTCOME'
       )`,
      [plan.family_id, plan.onboarding_id, priority.dimension_id, assignment, occurredAt, plan.priority_id, plan.plan_id, phase, dayIndex],
    );
  }
}

async function listPhases(client: pg.PoolClient, planId: string): Promise<JourneyPlanPhaseDto[]> {
  const result = await client.query<JourneyPlanPhaseRow>(
    `select phase, start_day, end_day, status, focus_dimensions, review_due_day, boundary
     from family_journey_plan_phases where plan_id = $1 order by start_day`, [planId],
  );
  return result.rows.map((row) => ({
    phase: row.phase, start_day: row.start_day, end_day: row.end_day, status: row.status,
    focus_dimensions: row.focus_dimensions as JourneyPlanPhaseDto['focus_dimensions'],
    review_due_day: row.review_due_day, boundary: row.boundary,
  }));
}

async function hydratePlan(client: pg.PoolClient, row: JourneyPlanRow): Promise<JourneyPlanDto> {
  return {
    plan_id: row.plan_id, family_id: row.family_id, onboarding_id: row.onboarding_id, priority_id: row.priority_id,
    title: row.title, status: row.status, current_phase: row.current_phase, current_day: row.current_day,
    total_days: 90, phases: await listPhases(client, row.plan_id), confirmed_by_actor_id: row.confirmed_by_actor_id,
    confirmed_at: row.confirmed_at ? iso(row.confirmed_at) : null, paused_at: row.paused_at ? iso(row.paused_at) : null,
    completed_at: row.completed_at ? iso(row.completed_at) : null, version: row.version, policy_version: POLICY_VERSION,
    boundary: PLAN_BOUNDARY, created_at: iso(row.created_at), updated_at: iso(row.updated_at),
  };
}

function nextPhase(phase: JourneyPlanPhase): JourneyPlanPhase | null {
  const index = PHASE_DEFINITIONS.findIndex((item) => item.phase === phase);
  return index >= 0 && index < PHASE_DEFINITIONS.length - 1 ? PHASE_DEFINITIONS[index + 1].phase : null;
}

async function lockIdempotencyKey<T>(client: pg.PoolClient, action: string, key: string, requestHash: string): Promise<IdempotencyResult<T>> {
  await client.query(`insert into idempotency_keys(idempotency_key, action_name, request_hash) values ($1, $2, $3) on conflict (idempotency_key) do nothing`, [key, action, requestHash]);
  const result = await client.query<{ action_name: string; request_hash: string; response_body: unknown | null }>(
    `select action_name, request_hash, response_body from idempotency_keys where idempotency_key = $1 for update`, [key],
  );
  const row = result.rows[0];
  if (!row || row.action_name !== action || row.request_hash !== requestHash) throw new ConflictException('Idempotency conflict');
  return row.response_body ? { replay: true, response: row.response_body as T } : { replay: false };
}

async function storeIdempotencyResponse<T>(client: pg.PoolClient, key: string, response: T): Promise<void> {
  await client.query(`update idempotency_keys set response_code = 201, response_body = $2::jsonb where idempotency_key = $1`, [key, JSON.stringify(response)]);
}

async function insertAuditAndOutbox(
  client: pg.PoolClient, action: string, eventName: string, familyId: string, planId: string,
  idempotencyKey: string, meta: AuditMeta, response: unknown,
): Promise<void> {
  await client.query(
    `insert into audit_logs(family_id, actor_type, actor_id, action_name, resource_type, resource_id, correlation_id, idempotency_key, result, metadata)
     values ($1, 'USER', $2, $3, 'JourneyPlan', $4, $5, $6, 'SUCCESS', $7::jsonb)`,
    [familyId, meta.actor, action, planId, meta.correlationId, idempotencyKey, JSON.stringify({ source: meta.source, occurred_at: meta.occurredAt, response })],
  );
  const eventId = randomUUID();
  await client.query(
    `insert into outbox_events(aggregate_type, aggregate_id, event_name, event_version, event_id, correlation_id, payload, occurred_at)
     values ('JourneyPlan', $1, $2, 1, $3, $4, $5::jsonb, $6)`,
    [planId, eventName, eventId, meta.correlationId, JSON.stringify({ event_id: eventId, family_id: familyId, plan_id: planId, actor_id: meta.actor, correlation_id: meta.correlationId, policy_version: POLICY_VERSION, boundary: PLAN_BOUNDARY, response }), meta.occurredAt],
  );
}

function iso(value: Date | string): string { return typeof value === 'string' ? value : value.toISOString(); }
