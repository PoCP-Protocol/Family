import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';
import type {
  AuditMeta,
  GrowthActionDto,
  InterventionEpisodeDto,
  M2GrowthDimensionId,
  StartInterventionRequest,
  StartInterventionResponse,
} from '@family/contracts';
import { FamilyRepository } from './family.repository';
import { assertFamilyManagePermission } from './family-permission';
import {
  ACTION_BOUNDARY,
  INTERVENTION_CODE,
  INTERVENTION_ID,
  INTERVENTION_POLICY_VERSION,
  PLANNED_DAYS,
  buildGrowthActionAssignments,
  getListenBeforeRespondCard,
} from './intervention.policy';
import { assertNormalSafetyRoute } from './normal-safety-route.policy';
import { GrowthSubjectResolver } from './growth-subject.resolver';

const START_INTERVENTION_ACTION = 'StartIntervention';
const INTERVENTION_STARTED_EVENT = 'InterventionStarted';

type IdempotencyResult<TResponse> = { replay: false } | { replay: true; response: TResponse };

@Injectable()
export class InterventionService {
  constructor(
    @Inject(FamilyRepository) private readonly repository: FamilyRepository,
    @Inject(GrowthSubjectResolver) private readonly growthSubjectResolver: GrowthSubjectResolver = new GrowthSubjectResolver(),
  ) {}

  async getInterventionCard(familyId: string, actorId: string) {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      return getListenBeforeRespondCard();
    });
  }

  async getActiveIntervention(familyId: string, onboardingId: string, actorId: string): Promise<StartInterventionResponse | null> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      const episodeResult = await client.query<InterventionEpisodeRow>(
        `select episode_id, family_id, onboarding_id, priority_id, intervention_id, intervention_code,
                status, started_by_actor_id, started_at, planned_days, policy_version, created_at
         from intervention_episodes
         where family_id = $1 and onboarding_id = $2 and status = 'ACTIVE'
         limit 1`,
        [familyId, onboardingId],
      );
      const episode = episodeResult.rows[0];
      if (!episode) return null;
      const actions = await listEpisodeActions(client, episode.episode_id);
      return { intervention: getListenBeforeRespondCard(), episode: mapInterventionEpisode(episode), actions };
    });
  }

  async startIntervention(request: StartInterventionRequest, meta: AuditMeta): Promise<StartInterventionResponse> {
    const requestHash = hashStartInterventionRequest(request, meta.actor);
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<StartInterventionResponse>(client, START_INTERVENTION_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      const activePriority = await getActivePriorityForStart(client, request);
      const subject = await this.growthSubjectResolver.resolve(client, {
        familyId: request.family_id,
        onboardingId: request.onboarding_id,
        priorityId: request.priority_id,
      });
      await assertRequiredGrowthConsents(client, request.family_id, subject.childPersonId);
      await assertNormalSafetyRoute(client, request.family_id, request.onboarding_id);
      await assertNoActiveInterventionEpisode(client, request.family_id, request.onboarding_id);

      const episode = await insertInterventionEpisode(client, request, meta);
      const assignments = buildGrowthActionAssignments(meta.occurredAt);
      const actions = await insertGrowthActions(client, request, episode.episode_id, activePriority.dimension_id, assignments);
      const response: StartInterventionResponse = {
        intervention: getListenBeforeRespondCard(),
        episode,
        actions,
      };

      await insertAudit(client, START_INTERVENTION_ACTION, 'InterventionEpisode', request.family_id, episode.episode_id, request.idempotency_key, meta, response);
      await insertInterventionStartedEvent(client, response, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response, 201);
      return response;
    });
  }
}

function hashStartInterventionRequest(request: StartInterventionRequest, actorId: string): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      onboarding_id: request.onboarding_id,
      priority_id: request.priority_id,
      intervention_code: request.intervention_code,
      actor_id: actorId,
    }))
    .digest('hex');
}

async function lockIdempotencyKey<TResponse>(
  client: pg.PoolClient,
  actionName: string,
  idempotencyKey: string,
  requestHash: string,
): Promise<IdempotencyResult<TResponse>> {
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
  if (row.response_body) {
    return { replay: true, response: row.response_body as TResponse };
  }
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
  if (result.rowCount !== 1) {
    throw new NotFoundException('family_not_found');
  }
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
  if (missing.length > 0) {
    throw new ForbiddenException(`missing_required_consent:${missing.join(',')}`);
  }
}

async function getActivePriorityForStart(client: pg.PoolClient, request: StartInterventionRequest): Promise<ActivePriorityRow> {
  if (request.intervention_code !== INTERVENTION_CODE) {
    throw new ConflictException('intervention_code_not_supported');
  }
  const result = await client.query<ActivePriorityRow>(
    `select gp.priority_id, gp.family_id, gp.onboarding_id, gp.profile_id, gp.dimension_id
     from growth_priorities gp
     join growth_profiles profile on profile.profile_id = gp.profile_id
     where gp.family_id = $1
       and gp.onboarding_id = $2
       and gp.priority_id = $3
       and gp.status = 'ACTIVE'
      and gp.dimension_id = $4
       and profile.status = 'WORKING'
       and profile.confirmed_at is not null
     for share`,
    [request.family_id, request.onboarding_id, request.priority_id, 'R03'],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundException('active_growth_priority_not_found');
  }
  return row;
}

async function assertNoActiveInterventionEpisode(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<void> {
  const result = await client.query(
    `select episode_id
     from intervention_episodes
     where family_id = $1
       and onboarding_id = $2
       and status = 'ACTIVE'
     limit 1
     for share`,
    [familyId, onboardingId],
  );
  if (result.rowCount && result.rowCount > 0) {
    throw new ConflictException('active_intervention_episode_exists');
  }
}

async function insertInterventionEpisode(client: pg.PoolClient, request: StartInterventionRequest, meta: AuditMeta): Promise<InterventionEpisodeDto> {
  const result = await client.query<InterventionEpisodeRow>(
    `insert into intervention_episodes(
       family_id, onboarding_id, priority_id, intervention_id, intervention_code,
       status, started_by_actor_id, started_at, planned_days, policy_version
     ) values ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7, $8, $9)
     returning episode_id, family_id, onboarding_id, priority_id, intervention_id, intervention_code,
               status, started_by_actor_id, started_at, planned_days, policy_version, created_at`,
    [request.family_id, request.onboarding_id, request.priority_id, INTERVENTION_ID, INTERVENTION_CODE, meta.actor, meta.occurredAt, PLANNED_DAYS, INTERVENTION_POLICY_VERSION],
  );
  return mapInterventionEpisode(result.rows[0]);
}

async function insertGrowthActions(
  client: pg.PoolClient,
  request: StartInterventionRequest,
  episodeId: string,
  dimensionId: M2GrowthDimensionId,
  assignments: Array<{ dayIndex: number; assignmentText: string; dueDate: string }>,
): Promise<GrowthActionDto[]> {
  const actions: GrowthActionDto[] = [];
  for (const assignment of assignments) {
    const result = await client.query<GrowthActionRow>(
      `insert into growth_actions(
         family_id, journey_id, intervention_id, dimension_id, action_type, instruction,
         status, onboarding_id, priority_id, intervention_episode_id, day_index,
         assignment_text, due_date, completion_status, reflection, reflection_boundary, boundary
       ) values ($1, $2, $3, $4, 'LISTEN_BEFORE_RESPOND_DAILY_ACTION', $5,
         'PENDING', $2, $6, $7, $8, $5, $9::date, null, null, null, $10)
       returning action_id, family_id, onboarding_id, priority_id, intervention_episode_id,
                 day_index, status, assignment_text, due_date, completed_at,
                 completion_status, reflection, reflection_boundary, boundary, created_at`,
      [
        request.family_id,
        request.onboarding_id,
        INTERVENTION_ID,
        dimensionId,
        assignment.assignmentText,
        request.priority_id,
        episodeId,
        assignment.dayIndex,
        assignment.dueDate,
        ACTION_BOUNDARY,
      ],
    );
    actions.push(mapGrowthAction(result.rows[0]));
  }
  return actions;
}

async function listEpisodeActions(client: pg.PoolClient, episodeId: string): Promise<GrowthActionDto[]> {
  const result = await client.query<GrowthActionRow>(
    `select action_id, family_id, onboarding_id, priority_id, intervention_episode_id,
            day_index, status, assignment_text, due_date, completed_at,
            completion_status, reflection, reflection_boundary, boundary, created_at
     from growth_actions
     where intervention_episode_id = $1
     order by day_index`,
    [episodeId],
  );
  return result.rows.map(mapGrowthAction);
}

async function insertAudit(
  client: pg.PoolClient,
  actionName: string,
  resourceType: string,
  familyId: string,
  resourceId: string,
  idempotencyKey: string,
  meta: AuditMeta,
  response: unknown,
): Promise<void> {
  await client.query(
    `insert into audit_logs(
       family_id, actor_type, actor_id, action_name, resource_type, resource_id,
       correlation_id, idempotency_key, result, metadata
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
    [familyId, 'USER', meta.actor, actionName, resourceType, resourceId, meta.correlationId, idempotencyKey, 'SUCCESS', JSON.stringify({ source: meta.source, occurred_at: meta.occurredAt, response })],
  );
}

async function insertInterventionStartedEvent(client: pg.PoolClient, response: StartInterventionResponse, meta: AuditMeta): Promise<void> {
  const eventId = randomUUID();
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'InterventionEpisode',
      response.episode.episode_id,
      INTERVENTION_STARTED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({ event_id: eventId, occurred_at: meta.occurredAt, actor_id: meta.actor, correlation_id: meta.correlationId, ...response }),
      meta.occurredAt,
    ],
  );
}

interface ActivePriorityRow {
  priority_id: string;
  family_id: string;
  onboarding_id: string;
  profile_id: string;
  dimension_id: M2GrowthDimensionId;
}

interface InterventionEpisodeRow {
  episode_id: string;
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  intervention_id: InterventionEpisodeDto['intervention_id'];
  intervention_code: InterventionEpisodeDto['intervention_code'];
  status: InterventionEpisodeDto['status'];
  started_by_actor_id: string;
  started_at: Date | string;
  planned_days: 7;
  policy_version: InterventionEpisodeDto['policy_version'];
  created_at: Date | string;
}

interface GrowthActionRow {
  action_id: string;
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  intervention_episode_id: string;
  day_index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  status: GrowthActionDto['status'];
  assignment_text: string;
  due_date: Date | string;
  completed_at: Date | string | null;
  completion_status: GrowthActionDto['completion_status'];
  reflection: string | null;
  reflection_boundary: GrowthActionDto['reflection_boundary'];
  boundary: GrowthActionDto['boundary'];
  created_at: Date | string;
}

function mapInterventionEpisode(row: InterventionEpisodeRow): InterventionEpisodeDto {
  return {
    episode_id: row.episode_id,
    family_id: row.family_id,
    onboarding_id: row.onboarding_id,
    priority_id: row.priority_id,
    intervention_id: row.intervention_id,
    intervention_code: row.intervention_code,
    status: row.status,
    started_by_actor_id: row.started_by_actor_id,
    started_at: toIsoString(row.started_at),
    planned_days: row.planned_days,
    policy_version: row.policy_version,
    created_at: toIsoString(row.created_at),
  };
}

function mapGrowthAction(row: GrowthActionRow): GrowthActionDto {
  return {
    action_id: row.action_id,
    family_id: row.family_id,
    onboarding_id: row.onboarding_id,
    priority_id: row.priority_id,
    intervention_episode_id: row.intervention_episode_id,
    day_index: row.day_index,
    status: row.status,
    assignment_text: row.assignment_text,
    due_date: toDateOnly(row.due_date),
    completed_at: row.completed_at ? toIsoString(row.completed_at) : null,
    completion_status: row.completion_status,
    reflection: row.reflection,
    reflection_boundary: row.reflection_boundary,
    boundary: row.boundary,
    created_at: toIsoString(row.created_at),
  };
}

function toIsoString(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function toDateOnly(value: Date | string): string {
  if (typeof value === 'string') {
    return value.includes('T') ? value.slice(0, 10) : value;
  }
  return value.toISOString().slice(0, 10);
}
