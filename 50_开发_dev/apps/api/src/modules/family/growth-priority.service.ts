import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { assertFamilyManagePermission as sharedAssertFamilyManagePermission } from './family-permission';
import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';
import type {
  AuditMeta,
  ConfirmGrowthPriorityRequest,
  ConfirmGrowthPriorityResponse,
  GrowthPriorityCandidateDto,
  GrowthPriorityDto,
  GrowthPriorityInsightResponse,
  M2GrowthDimensionId,
} from '@family/contracts';
import { FamilyRepository } from './family.repository';
import {
  type ConfirmedProfileForPriority,
  assertDecisionMatchesDraft,
  buildGrowthPriorityDraft,
  GROWTH_PRIORITY_BOUNDARY,
  GROWTH_PRIORITY_POLICY_VERSION,
} from './growth-priority.policy';
import { GrowthSubjectResolver } from './growth-subject.resolver';
import { assertNormalSafetyRoute } from './normal-safety-route.policy';

const CREATE_FAMILY_ACTION = 'CreateFamily';
const CONFIRM_GROWTH_PRIORITY_ACTION = 'ConfirmGrowthPriority';
const GROWTH_PRIORITY_CONFIRMED_EVENT = 'GrowthPriorityConfirmed';
const M2_ONBOARDING_JOURNEY_TYPE = 'PARENT_CHILD_COMMUNICATION_CONFLICT';

type IdempotencyResult<TResponse> = { replay: false } | { replay: true; response: TResponse };

@Injectable()
export class GrowthPriorityService {
  constructor(
    @Inject(FamilyRepository) private readonly repository: FamilyRepository,
    @Inject(GrowthSubjectResolver) private readonly growthSubjectResolver: GrowthSubjectResolver = new GrowthSubjectResolver(),
  ) {}

  async getGrowthPriorityInsight(familyId: string, onboardingId: string, actorId: string): Promise<GrowthPriorityInsightResponse> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      await assertActiveOnboarding(client, familyId, onboardingId);
      const profiles = await listConfirmedProfiles(client, familyId, onboardingId);
      const draft = buildGrowthPriorityDraft({
        familyId,
        onboardingId,
        profiles,
        createdAt: new Date().toISOString(),
      });
      const activePriority = await getActivePriority(client, familyId, onboardingId);
      return {
        onboarding_id: onboardingId,
        family_id: familyId,
        draft,
        active_priority: activePriority,
      };
    });
  }

  async confirmGrowthPriority(request: ConfirmGrowthPriorityRequest, meta: AuditMeta): Promise<ConfirmGrowthPriorityResponse> {
    const requestHash = hashConfirmGrowthPriorityRequest(request, meta.actor);
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const idempotency = await lockIdempotencyKey<ConfirmGrowthPriorityResponse>(
        client,
        CONFIRM_GROWTH_PRIORITY_ACTION,
        request.idempotency_key,
        requestHash,
      );
      if (idempotency.replay) {
        return idempotency.response;
      }

      await assertActiveOnboarding(client, request.family_id, request.onboarding_id);
      await assertNormalSafetyRoute(client, request.family_id, request.onboarding_id);
      await assertNoActiveInterventionEpisode(client, request.family_id, request.onboarding_id);

      const profiles = await listConfirmedProfiles(client, request.family_id, request.onboarding_id);
      const draft = buildGrowthPriorityDraft({
        familyId: request.family_id,
        onboardingId: request.onboarding_id,
        profiles,
        createdAt: meta.occurredAt,
      });
      if (draft.draft_id !== request.draft_id) {
        throw new ConflictException('growth_priority_draft_stale');
      }
      try {
        assertDecisionMatchesDraft(draft, request.decision);
      } catch (error) {
        throw new ConflictException((error as Error).message);
      }

      let candidate: GrowthPriorityCandidateDto | null = null;
      if (request.decision !== 'NO_PRIORITY_YET') {
        candidate = draft.candidate;
        if (!candidate || candidate.dimension_id !== request.decision) {
          throw new ConflictException('growth_priority_decision_not_eligible');
        }
      }

      const subject = await this.growthSubjectResolver.resolve(client, {
        familyId: request.family_id,
        onboardingId: request.onboarding_id,
        ...(candidate ? { profileId: candidate.profile_id } : {}),
      });
      await assertRequiredGrowthConsents(client, request.family_id, subject.childPersonId);

      let priority: GrowthPriorityDto | null = null;
      if (candidate) {
        const previousPriority = await getActivePriority(client, request.family_id, request.onboarding_id);
        await supersedeActivePriority(client, request.family_id, request.onboarding_id);
        priority = await insertPriority(client, request, candidate, draft.evidence_refs, previousPriority, meta);
      }

      const response: ConfirmGrowthPriorityResponse = {
        priority,
        decision: request.decision,
        draft,
      };
      await insertAudit(
        client,
        CONFIRM_GROWTH_PRIORITY_ACTION,
        'GrowthPriority',
        request.family_id,
        priority?.priority_id ?? request.onboarding_id,
        request.idempotency_key,
        meta,
        response,
      );
      await insertGrowthPriorityConfirmedEvent(client, request.family_id, request.onboarding_id, priority, response, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);
      return response;
    });
  }
}

function hashConfirmGrowthPriorityRequest(request: ConfirmGrowthPriorityRequest, actorId: string): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      onboarding_id: request.onboarding_id,
      draft_id: request.draft_id,
      decision: request.decision,
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

  const result = await client.query<{
    action_name: string;
    request_hash: string;
    response_body: unknown | null;
  }>(
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

async function storeIdempotencyResponse<TResponse>(client: pg.PoolClient, idempotencyKey: string, response: TResponse): Promise<void> {
  await client.query(
    `update idempotency_keys
     set response_code = $2, response_body = $3::jsonb
     where idempotency_key = $1`,
    [idempotencyKey, 201, JSON.stringify(response)],
  );
}

async function ensureFamilyExists(client: pg.PoolClient, familyId: string): Promise<void> {
  const result = await client.query('select family_id from families where family_id = $1 for share', [familyId]);
  if (result.rowCount !== 1) {
    throw new NotFoundException('family_not_found');
  }
}

// 桥接:委托共享 family-permission(创建者 或 ACTIVE OWNER/GUARDIAN 成员)。
async function assertFamilyManagePermission(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
  return sharedAssertFamilyManagePermission(client, familyId, actorId);
}

async function assertActiveOnboarding(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<void> {
  const result = await client.query(
    `select journey_id
     from growth_journeys
     where family_id = $1
       and journey_id = $2
       and journey_type = $3
       and phase = 'ONBOARDING'
       and status = 'ACTIVE'
     for share`,
    [familyId, onboardingId, M2_ONBOARDING_JOURNEY_TYPE],
  );
  if (result.rowCount !== 1) {
    throw new NotFoundException('active_growth_onboarding_not_found');
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

async function listConfirmedProfiles(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<ConfirmedProfileForPriority[]> {
  const result = await client.query<{
    profile_id: string;
    family_id: string;
    dimension_id: M2GrowthDimensionId;
    state: ConfirmedProfileForPriority['state'];
    confidence: ConfirmedProfileForPriority['confidence'];
    version: number;
    basis: ConfirmedProfileForPriority['basis'];
    evidence_snapshot: ConfirmedProfileForPriority['evidence_snapshot'];
    confirmed_at: Date | string;
  }>(
    `select gp.profile_id, gp.family_id, gpd.dimension_id, gpd.state, gpd.confidence,
            gp.version, gp.basis, gp.evidence_snapshot, gp.confirmed_at
     from growth_profiles gp
     join growth_profile_dimensions gpd on gpd.profile_id = gp.profile_id
     where gp.family_id = $1
       and gp.status = 'WORKING'
       and gp.confirmed_at is not null
       and gpd.dimension_id = any($2::varchar[])
       and exists (
         select 1
         from jsonb_array_elements_text(coalesce(gp.evidence_snapshot->'evidence_ids', '[]'::jsonb)) as evidence_ref(value)
         join evidence_records er on er.evidence_id::text = evidence_ref.value
         join perspectives p on p.perspective_id = er.perspective_id
         where p.onboarding_id = $3
       )
     order by gp.confirmed_at desc`,
    [familyId, ['P03', 'R03', 'R04', 'R05'], onboardingId],
  );

  return result.rows.map((row) => ({
    profile_id: row.profile_id,
    family_id: row.family_id,
    dimension_id: row.dimension_id,
    state: row.state,
    confidence: row.confidence,
    version: row.version,
    basis: row.basis ?? {},
    evidence_snapshot: row.evidence_snapshot ?? {},
    confirmed_at: toIsoString(row.confirmed_at),
  }));
}

async function getActivePriority(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<GrowthPriorityDto | null> {
  const result = await client.query<GrowthPriorityRow>(
    `select priority_id, family_id, onboarding_id, profile_id, dimension_id, status, version,
            boundary, reason_codes, evidence_refs, policy_version, confirmed_by_actor_id,
            confirmed_at, superseded_at, previous_priority_id, created_at
     from growth_priorities
     where family_id = $1 and onboarding_id = $2 and status = 'ACTIVE'
     limit 1
     for share`,
    [familyId, onboardingId],
  );
  const row = result.rows[0];
  return row ? mapGrowthPriority(row) : null;
}

async function supersedeActivePriority(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<void> {
  await client.query(
    `update growth_priorities
     set status = 'SUPERSEDED', superseded_at = now()
     where family_id = $1 and onboarding_id = $2 and status = 'ACTIVE'`,
    [familyId, onboardingId],
  );
}

async function insertPriority(
  client: pg.PoolClient,
  request: ConfirmGrowthPriorityRequest,
  candidate: GrowthPriorityCandidateDto,
  evidenceRefs: string[],
  previousPriority: GrowthPriorityDto | null,
  meta: AuditMeta,
): Promise<GrowthPriorityDto> {
  const nextVersion = previousPriority ? previousPriority.version + 1 : 1;
  const result = await client.query<GrowthPriorityRow>(
    `insert into growth_priorities(
       family_id, onboarding_id, profile_id, dimension_id, rank, confirmed_by_actor_id,
       status, version, boundary, reason_codes, evidence_refs, policy_version, previous_priority_id
     ) values ($1, $2, $3, $4, 1, $5, 'ACTIVE', $6, $7, $8::jsonb, $9::jsonb, $10, $11)
     returning priority_id, family_id, onboarding_id, profile_id, dimension_id, status, version,
               boundary, reason_codes, evidence_refs, policy_version, confirmed_by_actor_id,
               confirmed_at, superseded_at, previous_priority_id, created_at`,
    [
      request.family_id,
      request.onboarding_id,
      candidate.profile_id,
      request.decision,
      meta.actor,
      nextVersion,
      GROWTH_PRIORITY_BOUNDARY,
      JSON.stringify(candidate.reason_codes),
      JSON.stringify(evidenceRefs),
      GROWTH_PRIORITY_POLICY_VERSION,
      previousPriority?.priority_id ?? null,
    ],
  );
  return mapGrowthPriority(result.rows[0]);
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
    [
      familyId,
      'USER',
      meta.actor,
      actionName,
      resourceType,
      resourceId,
      meta.correlationId,
      idempotencyKey,
      'SUCCESS',
      JSON.stringify({ source: meta.source, occurred_at: meta.occurredAt, response }),
    ],
  );
}

async function insertGrowthPriorityConfirmedEvent(
  client: pg.PoolClient,
  familyId: string,
  onboardingId: string,
  priority: GrowthPriorityDto | null,
  response: ConfirmGrowthPriorityResponse,
  meta: AuditMeta,
): Promise<void> {
  const eventId = randomUUID();
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'GrowthPriority',
      familyId,
      GROWTH_PRIORITY_CONFIRMED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        onboarding_id: onboardingId,
        priority_id: priority?.priority_id ?? null,
        decision: response.decision,
        occurred_at: meta.occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        priority,
        draft: response.draft,
      }),
      meta.occurredAt,
    ],
  );
}

interface GrowthPriorityRow {
  priority_id: string;
  family_id: string;
  onboarding_id: string;
  profile_id: string;
  dimension_id: M2GrowthDimensionId;
  status: GrowthPriorityDto['status'];
  version: number;
  boundary: GrowthPriorityDto['boundary'];
  reason_codes: GrowthPriorityDto['reason_codes'];
  evidence_refs: string[];
  policy_version: GrowthPriorityDto['policy_version'];
  confirmed_by_actor_id: string;
  confirmed_at: Date | string;
  superseded_at: Date | string | null;
  previous_priority_id: string | null;
  created_at: Date | string;
}

function mapGrowthPriority(row: GrowthPriorityRow): GrowthPriorityDto {
  return {
    priority_id: row.priority_id,
    family_id: row.family_id,
    onboarding_id: row.onboarding_id,
    profile_id: row.profile_id,
    dimension_id: row.dimension_id,
    status: row.status,
    version: row.version,
    boundary: row.boundary,
    reason_codes: row.reason_codes,
    evidence_refs: row.evidence_refs,
    policy_version: row.policy_version,
    confirmed_by_actor_id: row.confirmed_by_actor_id,
    confirmed_at: toIsoString(row.confirmed_at),
    superseded_at: row.superseded_at ? toIsoString(row.superseded_at) : null,
    previous_priority_id: row.previous_priority_id,
    created_at: toIsoString(row.created_at),
  };
}

function toIsoString(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString();
}
