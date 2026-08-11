import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';
import type {
  AuditMeta,
  CompleteGrowthReviewRequest,
  CompleteGrowthReviewResponse,
  FamilyTimelineEventDto,
  FamilyTimelineResponse,
  GrowthReviewActionSummaryDto,
  GrowthReviewDto,
  GrowthReviewLimitation,
  NextStepDecisionDto,
  OutcomeObservationDto,
  RecordNextStepDecisionRequest,
  RecordNextStepDecisionResponse,
  RecordOutcomeObservationRequest,
  RecordOutcomeObservationResponse,
} from '@family/contracts';
import { FamilyRepository } from './family.repository';
import { GrowthSubjectResolver } from './growth-subject.resolver';
import { assertNormalSafetyRoute } from './normal-safety-route.policy';

const CREATE_FAMILY_ACTION = 'CreateFamily';
const RECORD_OUTCOME_OBSERVATION_ACTION = 'RecordOutcomeObservation';
const COMPLETE_GROWTH_REVIEW_ACTION = 'CompleteGrowthReview';
const RECORD_NEXT_STEP_DECISION_ACTION = 'RecordNextStepDecision';
const OUTCOME_OBSERVATION_RECORDED_EVENT = 'OutcomeObservationRecorded';
const GROWTH_REVIEW_COMPLETED_EVENT = 'GrowthReviewCompleted';
const NEXT_STEP_DECISION_RECORDED_EVENT = 'NextStepDecisionRecorded';

type IdempotencyResult<TResponse> = { replay: false } | { replay: true; response: TResponse };

@Injectable()
export class GrowthReviewService {
  constructor(
    @Inject(FamilyRepository) private readonly repository: FamilyRepository,
    @Inject(GrowthSubjectResolver) private readonly growthSubjectResolver: GrowthSubjectResolver = new GrowthSubjectResolver(),
  ) {}

  async recordOutcomeObservation(request: RecordOutcomeObservationRequest, meta: AuditMeta): Promise<RecordOutcomeObservationResponse> {
    const requestHash = hashRequest({ ...request, actor_id: meta.actor });
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<RecordOutcomeObservationResponse>(client, RECORD_OUTCOME_OBSERVATION_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;

      const episode = await getEpisode(client, request.family_id, request.intervention_episode_id);
      const subject = await this.growthSubjectResolver.resolve(client, {
        familyId: request.family_id,
        onboardingId: episode.onboarding_id,
        priorityId: episode.priority_id,
      });
      await assertRequiredGrowthConsents(client, request.family_id, subject.childPersonId);
      await assertNormalSafetyRoute(client, request.family_id, episode.onboarding_id);
      assertObservationSubject(request, subject.childPersonId);
      await assertObservationObserver(client, request, subject.guardianPersonIds);

      const observation = await insertOutcomeObservation(client, request);
      const response: RecordOutcomeObservationResponse = { observation };
      await insertAudit(client, RECORD_OUTCOME_OBSERVATION_ACTION, 'OutcomeObservation', request.family_id, observation.observation_id, request.idempotency_key, meta, response);
      await insertOutboxEvent(client, 'OutcomeObservation', observation.observation_id, OUTCOME_OBSERVATION_RECORDED_EVENT, response, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response, 201);
      return response;
    });
  }

  async completeGrowthReview(request: CompleteGrowthReviewRequest, meta: AuditMeta): Promise<CompleteGrowthReviewResponse> {
    const requestHash = hashRequest({ ...request, actor_id: meta.actor });
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<CompleteGrowthReviewResponse>(client, COMPLETE_GROWTH_REVIEW_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;

      const episode = await getEpisode(client, request.family_id, request.intervention_episode_id);
      const subject = await this.growthSubjectResolver.resolve(client, {
        familyId: request.family_id,
        onboardingId: episode.onboarding_id,
        priorityId: episode.priority_id,
      });
      await assertRequiredGrowthConsents(client, request.family_id, subject.childPersonId);
      await assertNormalSafetyRoute(client, request.family_id, episode.onboarding_id);
      await assertReviewNotCompleted(client, request.intervention_episode_id);

      const actions = await listEpisodeActionStatuses(client, request.intervention_episode_id);
      assertReviewEligible(episode, actions);
      const observations = await listOutcomeObservations(client, request.family_id, request.intervention_episode_id);
      const actionSummary = buildActionSummary(actions);
      const limitations = buildReviewLimitations(actionSummary, observations);
      const review = await insertGrowthReview(client, episode, actionSummary, observations, limitations, meta);
      const response: CompleteGrowthReviewResponse = { review, observations };
      await insertAudit(client, COMPLETE_GROWTH_REVIEW_ACTION, 'GrowthReview', request.family_id, review.review_id, request.idempotency_key, meta, response);
      await insertOutboxEvent(client, 'GrowthReview', review.review_id, GROWTH_REVIEW_COMPLETED_EVENT, response, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response, 201);
      return response;
    });
  }

  async recordNextStepDecision(request: RecordNextStepDecisionRequest, meta: AuditMeta): Promise<RecordNextStepDecisionResponse> {
    const requestHash = hashRequest({ ...request, actor_id: meta.actor });
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<RecordNextStepDecisionResponse>(client, RECORD_NEXT_STEP_DECISION_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;

      const review = await getReview(client, request.family_id, request.review_id);
      await assertDecisionNotRecorded(client, request.review_id);
      const decision = await insertNextStepDecision(client, review, request, meta);
      const response: RecordNextStepDecisionResponse = { decision };
      await insertAudit(client, RECORD_NEXT_STEP_DECISION_ACTION, 'NextStepDecision', request.family_id, decision.decision_id, request.idempotency_key, meta, response);
      await insertOutboxEvent(client, 'NextStepDecision', decision.decision_id, NEXT_STEP_DECISION_RECORDED_EVENT, response, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response, 201);
      return response;
    });
  }

  async getTimeline(familyId: string, interventionEpisodeId: string, actorId: string): Promise<FamilyTimelineResponse> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      await getEpisode(client, familyId, interventionEpisodeId);
      const events = await listTimelineEvents(client, familyId, interventionEpisodeId);
      return { family_id: familyId, intervention_episode_id: interventionEpisodeId, events };
    });
  }
}

function hashRequest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function lockIdempotencyKey<TResponse>(client: pg.PoolClient, actionName: string, idempotencyKey: string, requestHash: string): Promise<IdempotencyResult<TResponse>> {
  await client.query(
    `insert into idempotency_keys(idempotency_key, action_name, request_hash)
     values ($1, $2, $3)
     on conflict (idempotency_key) do nothing`,
    [idempotencyKey, actionName, requestHash],
  );
  const result = await client.query<{ action_name: string; request_hash: string; response_body: unknown | null }>(
    `select action_name, request_hash, response_body
     from idempotency_keys
     where idempotency_key = $1
     for update`,
    [idempotencyKey],
  );
  const row = result.rows[0];
  if (!row || row.action_name !== actionName || row.request_hash !== requestHash) {
    throw new ConflictException('Idempotency conflict');
  }
  if (row.response_body) return { replay: true, response: row.response_body as TResponse };
  return { replay: false };
}

async function storeIdempotencyResponse<TResponse>(client: pg.PoolClient, idempotencyKey: string, response: TResponse, responseCode: number): Promise<void> {
  await client.query(
    `update idempotency_keys
     set response_code = $2, response_body = $3::jsonb
     where idempotency_key = $1`,
    [idempotencyKey, responseCode, JSON.stringify(response)],
  );
}

async function ensureFamilyExists(client: pg.PoolClient, familyId: string): Promise<void> {
  const result = await client.query('select family_id from families where family_id = $1 for share', [familyId]);
  if (result.rowCount !== 1) throw new NotFoundException('family_not_found');
}

async function assertFamilyManagePermission(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
  const result = await client.query(
    `select audit_id
     from audit_logs
     where family_id = $1 and actor_id = $2 and action_name = $3 and result = 'SUCCESS'
     limit 1`,
    [familyId, actorId, CREATE_FAMILY_ACTION],
  );
  if (result.rowCount !== 1) throw new ForbiddenException('actor_has_family_manage_permission');
}

async function assertRequiredGrowthConsents(client: pg.PoolClient, familyId: string, childId: string): Promise<void> {
  const result = await client.query<{ purpose: string }>(
    `select purpose
     from consents
     where family_id = $1
       and subject_person_id = $2
       and purpose = any($3::consent_purpose[])
       and status = 'GRANTED'
     for share`,
    [familyId, childId, ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING']],
  );
  const granted = new Set(result.rows.map((row) => row.purpose));
  const missing = ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'].filter((purpose) => !granted.has(purpose));
  if (missing.length > 0) throw new ForbiddenException(`missing_required_consent:${missing.join(',')}`);
}

async function getEpisode(client: pg.PoolClient, familyId: string, episodeId: string): Promise<EpisodeRow> {
  const result = await client.query<EpisodeRow>(
    `select ie.episode_id, ie.family_id, ie.onboarding_id, ie.priority_id, gp.dimension_id,
            ie.status, ie.started_at, ie.planned_days
     from intervention_episodes ie
     join growth_priorities gp on gp.priority_id = ie.priority_id
     where ie.family_id = $1 and ie.episode_id = $2
     for share of ie, gp`,
    [familyId, episodeId],
  );
  const row = result.rows[0];
  if (!row) throw new NotFoundException('intervention_episode_not_found');
  return row;
}

function assertObservationSubject(request: RecordOutcomeObservationRequest, childPersonId: string): void {
  if (request.subject_person_id !== childPersonId) throw new ConflictException('observation_subject_mismatch');
}

async function assertObservationObserver(client: pg.PoolClient, request: RecordOutcomeObservationRequest, guardianPersonIds: string[]): Promise<void> {
  const result = await client.query<{ person_type: string }>(
    `select person_type::text as person_type
     from persons
     where family_id = $1 and person_id = $2
     for share`,
    [request.family_id, request.observer_person_id],
  );
  const personType = result.rows[0]?.person_type;
  if (!personType) throw new NotFoundException('observer_not_found');
  if (request.perspective_type === 'PARENT_OBSERVATION' && (personType !== 'PARENT' || !guardianPersonIds.includes(request.observer_person_id))) {
    throw new ConflictException('parent_observation_observer_mismatch');
  }
  if (request.perspective_type === 'CHILD_OBSERVATION' && (personType !== 'CHILD' || request.observer_person_id !== request.subject_person_id)) {
    throw new ConflictException('child_observation_observer_mismatch');
  }
}

async function insertOutcomeObservation(client: pg.PoolClient, request: RecordOutcomeObservationRequest): Promise<OutcomeObservationDto> {
  const result = await client.query<OutcomeObservationRow>(
    `insert into outcome_observations(
       family_id, subject_person_id, observer_person_id, intervention_episode_id,
       perspective_type, observation_text, action_refs, reflection_refs, evidence_refs, limitations, observed_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11)
     returning observation_id, family_id, subject_person_id, observer_person_id, intervention_episode_id,
               perspective_type, observation_text, action_refs, reflection_refs, evidence_refs, limitations,
               observed_at, boundary, policy_version, created_at`,
    [
      request.family_id,
      request.subject_person_id,
      request.observer_person_id,
      request.intervention_episode_id,
      request.perspective_type,
      request.observation_text,
      JSON.stringify(request.action_refs ?? []),
      JSON.stringify(request.reflection_refs ?? []),
      JSON.stringify(request.evidence_refs ?? []),
      JSON.stringify(request.limitations ?? []),
      request.observed_at,
    ],
  );
  return mapOutcomeObservation(result.rows[0]);
}

async function assertReviewNotCompleted(client: pg.PoolClient, episodeId: string): Promise<void> {
  const result = await client.query('select review_id from growth_reviews where intervention_episode_id = $1 for share', [episodeId]);
  if (result.rowCount && result.rowCount > 0) throw new ConflictException('growth_review_already_completed');
}

async function listEpisodeActionStatuses(client: pg.PoolClient, episodeId: string): Promise<Array<{ status: string; completion_status: string | null }>> {
  const result = await client.query<{ status: string; completion_status: string | null }>(
    `select status, completion_status
     from growth_actions
     where intervention_episode_id = $1
     order by day_index
     for share`,
    [episodeId],
  );
  return result.rows;
}

function assertReviewEligible(episode: EpisodeRow, actions: Array<{ status: string; completion_status: string | null }>): void {
  const terminal = actions.length === 7 && actions.every((action) => action.status !== 'PENDING');
  const startedAt = new Date(episode.started_at).getTime();
  const plannedEnded = startedAt + episode.planned_days * 24 * 60 * 60 * 1000 <= Date.now();
  if (!terminal && !plannedEnded) throw new ConflictException('growth_review_not_eligible');
}

async function listOutcomeObservations(client: pg.PoolClient, familyId: string, episodeId: string): Promise<OutcomeObservationDto[]> {
  const result = await client.query<OutcomeObservationRow>(
    `select observation_id, family_id, subject_person_id, observer_person_id, intervention_episode_id,
            perspective_type, observation_text, action_refs, reflection_refs, evidence_refs, limitations,
            observed_at, boundary, policy_version, created_at
     from outcome_observations
     where family_id = $1 and intervention_episode_id = $2
     order by observed_at, created_at`,
    [familyId, episodeId],
  );
  return result.rows.map(mapOutcomeObservation);
}

function buildActionSummary(actions: Array<{ status: string; completion_status: string | null }>): GrowthReviewActionSummaryDto {
  return {
    total_actions: 7,
    completed: actions.filter((action) => action.completion_status === 'COMPLETED').length,
    partial: actions.filter((action) => action.completion_status === 'PARTIAL').length,
    not_completed: actions.filter((action) => action.completion_status === 'NOT_COMPLETED').length,
    missing: 7 - actions.filter((action) => action.completion_status !== null).length,
  };
}

function buildReviewLimitations(actionSummary: GrowthReviewActionSummaryDto, observations: OutcomeObservationDto[]): GrowthReviewLimitation[] {
  const limitations = new Set<GrowthReviewLimitation>();
  if (actionSummary.missing > 0) limitations.add('MISSING_CHECK_INS');
  if (observations.length === 0) limitations.add('NO_OUTCOME_OBSERVATION');
  const hasParent = observations.some((observation) => observation.perspective_type === 'PARENT_OBSERVATION');
  const hasChild = observations.some((observation) => observation.perspective_type === 'CHILD_OBSERVATION');
  if (hasParent && !hasChild) limitations.add('PARENT_OBSERVATION_ONLY');
  if (hasChild && !hasParent) limitations.add('CHILD_OBSERVATION_ONLY');
  if (hasParent && hasChild) limitations.add('PARENT_CHILD_DIVERGENCE');
  return Array.from(limitations);
}

async function insertGrowthReview(
  client: pg.PoolClient,
  episode: EpisodeRow,
  actionSummary: GrowthReviewActionSummaryDto,
  observations: OutcomeObservationDto[],
  limitations: GrowthReviewLimitation[],
  meta: AuditMeta,
): Promise<GrowthReviewDto> {
  const result = await client.query<GrowthReviewRow>(
    `insert into growth_reviews(
       family_id, onboarding_id, intervention_episode_id, priority_id, dimension_id,
       action_summary, observation_ids, limitations, completed_by_actor_id, completed_at
     ) values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)
     returning review_id, family_id, onboarding_id, intervention_episode_id, priority_id, dimension_id,
               status, action_summary, observation_ids, limitations, boundary, policy_version,
               completed_by_actor_id, completed_at, created_at`,
    [
      episode.family_id,
      episode.onboarding_id,
      episode.episode_id,
      episode.priority_id,
      episode.dimension_id,
      JSON.stringify(actionSummary),
      JSON.stringify(observations.map((observation) => observation.observation_id)),
      JSON.stringify(limitations),
      meta.actor,
      meta.occurredAt,
    ],
  );
  return mapGrowthReview(result.rows[0]);
}

async function getReview(client: pg.PoolClient, familyId: string, reviewId: string): Promise<GrowthReviewDto> {
  const result = await client.query<GrowthReviewRow>(
    `select review_id, family_id, onboarding_id, intervention_episode_id, priority_id, dimension_id,
            status, action_summary, observation_ids, limitations, boundary, policy_version,
            completed_by_actor_id, completed_at, created_at
     from growth_reviews
     where family_id = $1 and review_id = $2
     for share`,
    [familyId, reviewId],
  );
  const row = result.rows[0];
  if (!row) throw new NotFoundException('growth_review_not_found');
  return mapGrowthReview(row);
}

async function assertDecisionNotRecorded(client: pg.PoolClient, reviewId: string): Promise<void> {
  const result = await client.query('select decision_id from next_step_decisions where review_id = $1 for share', [reviewId]);
  if (result.rowCount && result.rowCount > 0) throw new ConflictException('next_step_decision_already_recorded');
}

async function insertNextStepDecision(client: pg.PoolClient, review: GrowthReviewDto, request: RecordNextStepDecisionRequest, meta: AuditMeta): Promise<NextStepDecisionDto> {
  const result = await client.query<NextStepDecisionRow>(
    `insert into next_step_decisions(
       family_id, review_id, intervention_episode_id, decision, rationale, decided_by_actor_id, decided_at
     ) values ($1, $2, $3, $4, $5, $6, $7)
     returning decision_id, family_id, review_id, intervention_episode_id, decision, rationale,
               boundary, policy_version, decided_by_actor_id, decided_at, created_at`,
    [review.family_id, review.review_id, review.intervention_episode_id, request.decision, request.rationale ?? null, meta.actor, meta.occurredAt],
  );
  return mapNextStepDecision(result.rows[0]);
}

async function listTimelineEvents(client: pg.PoolClient, familyId: string, episodeId: string): Promise<FamilyTimelineEventDto[]> {
  const result = await client.query<TimelineRow>(
    `select ie.episode_id::text as event_id, ie.family_id::text as family_id, ie.episode_id::text as intervention_episode_id,
            'INTERVENTION_STARTED' as event_type, ie.started_at as occurred_at,
            'INTERVENTION_EPISODE' as source, ie.episode_id::text as resource_id,
            'Intervention started' as title,
            jsonb_build_object('status', ie.status, 'planned_days', ie.planned_days, 'intervention_code', ie.intervention_code) as payload
     from intervention_episodes ie
     where ie.family_id = $1 and ie.episode_id = $2
     union all
     select ga.action_id::text, ga.family_id::text, ga.intervention_episode_id::text,
            'GROWTH_ACTION_COMPLETED', coalesce(ga.completed_at, ga.created_at),
            'GROWTH_ACTION', ga.action_id::text, 'Growth action check-in',
            jsonb_build_object('day_index', ga.day_index, 'status', ga.status, 'boundary', ga.boundary)
     from growth_actions ga
     where ga.family_id = $1 and ga.intervention_episode_id = $2 and ga.completion_status is not null
     union all
     select oo.observation_id::text, oo.family_id::text, oo.intervention_episode_id::text,
            'OUTCOME_OBSERVATION_RECORDED', oo.observed_at,
            'OUTCOME_OBSERVATION', oo.observation_id::text, 'Outcome observation recorded',
            jsonb_build_object('perspective_type', oo.perspective_type, 'boundary', oo.boundary)
     from outcome_observations oo
     where oo.family_id = $1 and oo.intervention_episode_id = $2
     union all
     select gr.review_id::text, gr.family_id::text, gr.intervention_episode_id::text,
            'GROWTH_REVIEW_COMPLETED', gr.completed_at,
            'GROWTH_REVIEW', gr.review_id::text, 'Growth review completed',
            jsonb_build_object('limitations', gr.limitations, 'boundary', gr.boundary)
     from growth_reviews gr
     where gr.family_id = $1 and gr.intervention_episode_id = $2
     union all
     select nsd.decision_id::text, nsd.family_id::text, nsd.intervention_episode_id::text,
            'NEXT_STEP_DECISION_RECORDED', nsd.decided_at,
            'NEXT_STEP_DECISION', nsd.decision_id::text, 'Next-step decision recorded',
            jsonb_build_object('decision', nsd.decision, 'boundary', nsd.boundary)
     from next_step_decisions nsd
     where nsd.family_id = $1 and nsd.intervention_episode_id = $2
     order by occurred_at, event_type`,
    [familyId, episodeId],
  );
  return result.rows.map(mapTimelineEvent);
}

async function insertAudit(client: pg.PoolClient, actionName: string, resourceType: string, familyId: string, resourceId: string, idempotencyKey: string, meta: AuditMeta, response: unknown): Promise<void> {
  await client.query(
    `insert into audit_logs(
       family_id, actor_type, actor_id, action_name, resource_type, resource_id,
       correlation_id, idempotency_key, result, metadata
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
    [familyId, 'USER', meta.actor, actionName, resourceType, resourceId, meta.correlationId, idempotencyKey, 'SUCCESS', JSON.stringify({ source: meta.source, occurred_at: meta.occurredAt, response })],
  );
}

async function insertOutboxEvent(client: pg.PoolClient, aggregateType: string, aggregateId: string, eventName: string, response: unknown, meta: AuditMeta): Promise<void> {
  const eventId = randomUUID();
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [aggregateType, aggregateId, eventName, 1, eventId, meta.correlationId, JSON.stringify({ event_id: eventId, occurred_at: meta.occurredAt, actor_id: meta.actor, correlation_id: meta.correlationId, response }), meta.occurredAt],
  );
}

interface EpisodeRow {
  episode_id: string;
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  dimension_id: GrowthReviewDto['dimension_id'];
  status: string;
  started_at: Date | string;
  planned_days: 7;
}

interface OutcomeObservationRow {
  observation_id: string;
  family_id: string;
  subject_person_id: string;
  observer_person_id: string;
  intervention_episode_id: string;
  perspective_type: OutcomeObservationDto['perspective_type'];
  observation_text: string;
  action_refs: string[];
  reflection_refs: string[];
  evidence_refs: string[];
  limitations: string[];
  observed_at: Date | string;
  boundary: OutcomeObservationDto['boundary'];
  policy_version: OutcomeObservationDto['policy_version'];
  created_at: Date | string;
}

interface GrowthReviewRow {
  review_id: string;
  family_id: string;
  onboarding_id: string;
  intervention_episode_id: string;
  priority_id: string;
  dimension_id: GrowthReviewDto['dimension_id'];
  status: GrowthReviewDto['status'];
  action_summary: GrowthReviewActionSummaryDto;
  observation_ids: string[];
  limitations: GrowthReviewLimitation[];
  boundary: GrowthReviewDto['boundary'];
  policy_version: GrowthReviewDto['policy_version'];
  completed_by_actor_id: string;
  completed_at: Date | string;
  created_at: Date | string;
}

interface NextStepDecisionRow {
  decision_id: string;
  family_id: string;
  review_id: string;
  intervention_episode_id: string;
  decision: NextStepDecisionDto['decision'];
  rationale: string | null;
  boundary: NextStepDecisionDto['boundary'];
  policy_version: NextStepDecisionDto['policy_version'];
  decided_by_actor_id: string;
  decided_at: Date | string;
  created_at: Date | string;
}

interface TimelineRow {
  event_id: string;
  family_id: string;
  intervention_episode_id: string;
  event_type: FamilyTimelineEventDto['event_type'];
  occurred_at: Date | string;
  source: FamilyTimelineEventDto['source'];
  resource_id: string;
  title: string;
  payload: Record<string, unknown>;
}

function mapOutcomeObservation(row: OutcomeObservationRow): OutcomeObservationDto {
  return {
    observation_id: row.observation_id,
    family_id: row.family_id,
    subject_person_id: row.subject_person_id,
    observer_person_id: row.observer_person_id,
    intervention_episode_id: row.intervention_episode_id,
    perspective_type: row.perspective_type,
    observation_text: row.observation_text,
    action_refs: row.action_refs,
    reflection_refs: row.reflection_refs,
    evidence_refs: row.evidence_refs,
    limitations: row.limitations,
    observed_at: toIsoString(row.observed_at),
    boundary: row.boundary,
    policy_version: row.policy_version,
    created_at: toIsoString(row.created_at),
  };
}

function mapGrowthReview(row: GrowthReviewRow): GrowthReviewDto {
  return {
    review_id: row.review_id,
    family_id: row.family_id,
    onboarding_id: row.onboarding_id,
    intervention_episode_id: row.intervention_episode_id,
    priority_id: row.priority_id,
    dimension_id: row.dimension_id,
    status: row.status,
    action_summary: row.action_summary,
    observation_ids: row.observation_ids,
    limitations: row.limitations,
    boundary: row.boundary,
    policy_version: row.policy_version,
    completed_by_actor_id: row.completed_by_actor_id,
    completed_at: toIsoString(row.completed_at),
    created_at: toIsoString(row.created_at),
  };
}

function mapNextStepDecision(row: NextStepDecisionRow): NextStepDecisionDto {
  return {
    decision_id: row.decision_id,
    family_id: row.family_id,
    review_id: row.review_id,
    intervention_episode_id: row.intervention_episode_id,
    decision: row.decision,
    rationale: row.rationale,
    boundary: row.boundary,
    policy_version: row.policy_version,
    decided_by_actor_id: row.decided_by_actor_id,
    decided_at: toIsoString(row.decided_at),
    created_at: toIsoString(row.created_at),
  };
}

function mapTimelineEvent(row: TimelineRow): FamilyTimelineEventDto {
  return {
    event_id: row.event_id,
    family_id: row.family_id,
    intervention_episode_id: row.intervention_episode_id,
    event_type: row.event_type,
    occurred_at: toIsoString(row.occurred_at),
    source: row.source,
    resource_id: row.resource_id,
    title: row.title,
    payload: row.payload,
    boundary: 'TIMELINE_IS_PROVENANCE_NOT_SCORE_OR_RANKING',
  };
}

function toIsoString(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString();
}