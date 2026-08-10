import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';
import type { AuditMeta, CompleteGrowthActionRequest, CompleteGrowthActionResponse, GrowthActionDto } from '@family/contracts';
import { FamilyRepository } from './family.repository';
import { REFLECTION_BOUNDARY, assertCompletableGrowthActionStatus } from './growth-action.policy';

const CREATE_FAMILY_ACTION = 'CreateFamily';
const COMPLETE_GROWTH_ACTION_ACTION = 'CompleteGrowthAction';
const GROWTH_ACTION_COMPLETED_EVENT = 'GrowthActionCompleted';

type IdempotencyResult<TResponse> = { replay: false } | { replay: true; response: TResponse };

@Injectable()
export class GrowthActionService {
  constructor(private readonly repository: FamilyRepository) {}

  async completeGrowthAction(request: CompleteGrowthActionRequest, meta: AuditMeta): Promise<CompleteGrowthActionResponse> {
    assertCompletableGrowthActionStatus(request.completion_status);
    const requestHash = hashCompleteGrowthActionRequest(request);
    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<CompleteGrowthActionResponse>(client, COMPLETE_GROWTH_ACTION_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const existing = await getCompletableGrowthAction(client, request.family_id, request.action_id);
      const consentSubjectId = await getConsentSubjectForPriority(client, existing.priority_id);
      await assertRequiredGrowthConsents(client, request.family_id, consentSubjectId);
      const action = await updateGrowthActionCompletion(client, request);
      const response: CompleteGrowthActionResponse = {
        action,
        reflection_boundary: REFLECTION_BOUNDARY,
      };
      await insertAudit(client, COMPLETE_GROWTH_ACTION_ACTION, 'GrowthAction', request.family_id, request.action_id, request.idempotency_key, meta, response);
      await insertGrowthActionCompletedEvent(client, response, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response, 200);
      return response;
    });
  }
}

function hashCompleteGrowthActionRequest(request: CompleteGrowthActionRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      action_id: request.action_id,
      completion_status: request.completion_status,
      reflection: request.reflection,
      occurred_at: request.occurred_at,
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

async function assertFamilyManagePermission(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
  const result = await client.query(
    `select audit_id
     from audit_logs
     where family_id = $1 and actor_id = $2 and action_name = $3 and result = 'SUCCESS'
     limit 1`,
    [familyId, actorId, CREATE_FAMILY_ACTION],
  );
  if (result.rowCount !== 1) {
    throw new ForbiddenException('actor_has_family_manage_permission');
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

async function getCompletableGrowthAction(client: pg.PoolClient, familyId: string, actionId: string): Promise<{ action_id: string; priority_id: string }> {
  const result = await client.query<{ action_id: string; priority_id: string }>(
    `select ga.action_id, ga.priority_id
     from growth_actions ga
     join intervention_episodes ie on ie.episode_id = ga.intervention_episode_id
     where ga.family_id = $1
       and ga.action_id = $2
       and ie.status = 'ACTIVE'
       and ga.status in ('PENDING', 'COMPLETED', 'PARTIAL', 'NOT_COMPLETED')
     for update of ga`,
    [familyId, actionId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundException('growth_action_not_found');
  }
  return row;
}

async function getConsentSubjectForPriority(client: pg.PoolClient, priorityId: string): Promise<string> {
  const result = await client.query<{ subject_person_id: string | null; subject_relationship_id: string | null }>(
    `select profile.subject_person_id, profile.subject_relationship_id
     from growth_priorities priority
     join growth_profiles profile on profile.profile_id = priority.profile_id
     where priority.priority_id = $1
     for share`,
    [priorityId],
  );
  const profile = result.rows[0];
  if (!profile) {
    throw new NotFoundException('growth_priority_not_found');
  }
  if (profile.subject_person_id) {
    return profile.subject_person_id;
  }
  if (profile.subject_relationship_id) {
    const relationship = await client.query<{ person_b_id: string }>(
      `select person_b_id
       from family_relationships
       where relationship_id = $1
       for share`,
      [profile.subject_relationship_id],
    );
    const row = relationship.rows[0];
    if (row) {
      return row.person_b_id;
    }
  }
  throw new ConflictException('growth_action_consent_subject_unresolved');
}

async function updateGrowthActionCompletion(client: pg.PoolClient, request: CompleteGrowthActionRequest): Promise<GrowthActionDto> {
  const result = await client.query<GrowthActionRow>(
    `update growth_actions
     set status = $3,
         completion_status = $3,
         completed_at = $4,
         reflection = $5,
         reflection_boundary = $6
     where family_id = $1 and action_id = $2
     returning action_id, family_id, onboarding_id, priority_id, intervention_episode_id,
               day_index, status, assignment_text, due_date, completed_at,
               completion_status, reflection, reflection_boundary, boundary, created_at`,
    [request.family_id, request.action_id, request.completion_status, request.occurred_at, request.reflection, REFLECTION_BOUNDARY],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundException('growth_action_not_found');
  }
  return mapGrowthAction(row);
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

async function insertGrowthActionCompletedEvent(client: pg.PoolClient, response: CompleteGrowthActionResponse, meta: AuditMeta): Promise<void> {
  const eventId = randomUUID();
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'GrowthAction',
      response.action.action_id,
      GROWTH_ACTION_COMPLETED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({ event_id: eventId, occurred_at: meta.occurredAt, actor_id: meta.actor, correlation_id: meta.correlationId, ...response }),
      meta.occurredAt,
    ],
  );
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