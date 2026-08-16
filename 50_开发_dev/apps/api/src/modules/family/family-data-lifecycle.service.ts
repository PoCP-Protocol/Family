import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type {
  AuditMeta,
  CreateFamilyDataLifecycleRequest,
  CreateFamilyDataLifecycleRequestResponse,
  FamilyDataGovernancePolicyDto,
  FamilyDataLifecyclePreviewDto,
  FamilyDataLifecycleRequestDto,
  FamilyDataLifecycleRequestStatus,
  FamilyDataLifecycleRequestType,
  FamilyDataLifecycleReviewDecision,
  FamilyDataLifecycleReviewDto,
  RecordFamilyDataLifecycleHumanDecisionRequest,
  SubmitFamilyDataLifecycleReviewRequest,
} from '@family/contracts';
import type pg from 'pg';
import { assertFamilyManagePermission } from './family-permission';
import { FamilyRepository } from './family.repository';
import { FAMILY_DATA_GOVERNANCE_POLICY, FAMILY_DATA_GOVERNANCE_POLICY_VERSION } from './family-data-governance.policy';

const CREATE_ACTION = 'CreateFamilyDataLifecycleRequest';
const REQUEST_EVENT = 'FamilyDataLifecycleRequestCreated';
const SUBMIT_REVIEW_ACTION = 'SubmitFamilyDataLifecycleReview';
const RECORD_DECISION_ACTION = 'RecordFamilyDataLifecycleHumanDecision';
const REVIEW_SUBMITTED_EVENT = 'FamilyDataLifecycleReviewSubmitted';
const REVIEW_DECISION_EVENT = 'FamilyDataLifecycleHumanDecisionRecorded';

type LifecycleRow = {
  family_data_lifecycle_request_id: string;
  family_id: string;
  request_type: FamilyDataLifecycleRequestType;
  request_scope: 'FAMILY_PRIVATE_DATA';
  status: FamilyDataLifecycleRequestStatus;
  requested_by_person_id: string;
  reason_text: string | null;
  requested_at: Date;
  created_at: Date;
};

@Injectable()
export class FamilyDataLifecycleService {
  constructor(@Inject(FamilyRepository) private readonly repository: FamilyRepository) {}

  async policy(familyId: string, actorId: string): Promise<FamilyDataGovernancePolicyDto> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      return FAMILY_DATA_GOVERNANCE_POLICY;
    });
  }

  async createRequest(request: CreateFamilyDataLifecycleRequest, meta: AuditMeta): Promise<CreateFamilyDataLifecycleRequestResponse> {
    const requestHash = createHash('sha256').update(JSON.stringify({
      family_id: request.family_id,
      request_type: request.request_type,
      reason_text: request.reason_text ?? null,
      request_scope: 'FAMILY_PRIVATE_DATA',
    })).digest('hex');

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<CreateFamilyDataLifecycleRequestResponse>(client, request.idempotency_key, requestHash);
      if (idempotency.replay) return idempotency.response;

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const row = await client.query<LifecycleRow>(
        `insert into family_data_lifecycle_requests(
           family_id, request_type, request_scope, status, requested_by_person_id, reason_text, idempotency_key
         ) values ($1, $2, 'FAMILY_PRIVATE_DATA', 'REQUESTED', $3, $4, $5)
         returning family_data_lifecycle_request_id, family_id, request_type, request_scope, status,
                   requested_by_person_id, reason_text, requested_at, created_at`,
        [request.family_id, request.request_type, meta.actor, request.reason_text ?? null, request.idempotency_key],
      );
      const response: CreateFamilyDataLifecycleRequestResponse = { request: mapRequest(row.rows[0]) };
      await insertAudit(client, request.family_id, response.request.family_data_lifecycle_request_id, request.idempotency_key, meta, response);
      await insertOutboxEvent(client, request.family_id, response.request, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);
      return response;
    });
  }

  async submitForReview(request: SubmitFamilyDataLifecycleReviewRequest, meta: AuditMeta): Promise<FamilyDataLifecycleRequestDto> {
    const requestHash = hash({ family_id: request.family_id, request_id: request.request_id });
    return this.repository.withTransaction(async (client) => {
      const idem = await lockActionIdempotency<FamilyDataLifecycleRequestDto>(client, SUBMIT_REVIEW_ACTION, request.idempotency_key, requestHash);
      if (idem.replay) return idem.response;
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const existing = await getRequestForUpdate(client, request.family_id, request.request_id);
      if (existing.requested_by_person_id !== meta.actor) throw new ForbiddenException('lifecycle_requestor_required');
      if (existing.status !== 'REQUESTED') throw new ConflictException('lifecycle_request_not_requestable');
      const updated = await updateRequestStatus(client, request.request_id, 'PENDING_HUMAN_REVIEW');
      await insertAuditNamed(client, SUBMIT_REVIEW_ACTION, request.family_id, request.request_id, request.idempotency_key, meta, { request: updated });
      await insertNamedEvent(client, REVIEW_SUBMITTED_EVENT, request.family_id, request.request_id, meta, { request: updated });
      await storeIdempotencyResponse(client, request.idempotency_key, updated);
      return updated;
    });
  }

  async recordHumanDecision(request: RecordFamilyDataLifecycleHumanDecisionRequest, meta: AuditMeta): Promise<FamilyDataLifecycleReviewDto> {
    const requestHash = hash({ family_id: request.family_id, request_id: request.request_id, decision: request.decision, reason_code: request.reason_code });
    return this.repository.withTransaction(async (client) => {
      const idem = await lockActionIdempotency<FamilyDataLifecycleReviewDto>(client, RECORD_DECISION_ACTION, request.idempotency_key, requestHash);
      if (idem.replay) return idem.response;
      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const existing = await getRequestForUpdate(client, request.family_id, request.request_id);
      if (existing.status !== 'PENDING_HUMAN_REVIEW') throw new ConflictException('lifecycle_request_not_pending_human_review');
      if (existing.requested_by_person_id === meta.actor) throw new ForbiddenException('distinct_guardian_review_required');
      const inserted = await client.query<ReviewRow>(
        `insert into family_data_lifecycle_request_reviews(
           family_id, family_data_lifecycle_request_id, reviewer_person_id, decision, reason_code, policy_version, idempotency_key
         ) values ($1,$2,$3,$4,$5,$6,$7)
         returning family_data_lifecycle_request_review_id, family_id, family_data_lifecycle_request_id, reviewer_person_id,
                   decision, reason_code, policy_version, reviewed_at, created_at`,
        [request.family_id, request.request_id, meta.actor, request.decision, request.reason_code, FAMILY_DATA_GOVERNANCE_POLICY_VERSION, request.idempotency_key],
      );
      const review = mapReview(inserted.rows[0]);
      const updated = await updateRequestStatus(client, request.request_id, request.decision);
      await insertAuditNamed(client, RECORD_DECISION_ACTION, request.family_id, request.request_id, request.idempotency_key, meta, { review, request: updated });
      await insertNamedEvent(client, REVIEW_DECISION_EVENT, request.family_id, request.request_id, meta, { review, request: updated });
      await storeIdempotencyResponse(client, request.idempotency_key, review);
      return review;
    });
  }

  async listRequests(familyId: string, actorId: string): Promise<FamilyDataLifecycleRequestDto[]> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      const result = await client.query<LifecycleRow>(
        `select family_data_lifecycle_request_id, family_id, request_type, request_scope, status,
                requested_by_person_id, reason_text, requested_at, created_at
           from family_data_lifecycle_requests
          where family_id=$1
          order by requested_at desc, family_data_lifecycle_request_id desc`,
        [familyId],
      );
      return result.rows.map(mapRequest);
    });
  }

  async preview(familyId: string, actorId: string): Promise<FamilyDataLifecyclePreviewDto> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      const result = await client.query<{
        persons: number;
        consents: number;
        growth_intents: number;
        service_cases: number;
        follow_up_responses: number;
        lifecycle_requests: number;
      }>(
        `select
          (select count(*)::int from persons where family_id=$1) as persons,
          (select count(*)::int from consents where family_id=$1) as consents,
          (select count(*)::int from growth_intents where family_id=$1) as growth_intents,
          (select count(*)::int from service_cases where family_id=$1) as service_cases,
          (select count(*)::int from follow_up_responses where family_id=$1) as follow_up_responses,
          (select count(*)::int from family_data_lifecycle_requests where family_id=$1) as lifecycle_requests`,
        [familyId],
      );
      const counts = result.rows[0];
      return {
        family_id: familyId,
        request_scope: 'FAMILY_PRIVATE_DATA',
        counts,
        execution_boundary: 'PREVIEW_ONLY_NO_EXPORT_NO_RETENTION_EXECUTION_NO_DELETE',
      };
    });
  }
}

async function ensureFamilyExists(client: pg.PoolClient, familyId: string): Promise<void> {
  const result = await client.query(`select family_id from families where family_id=$1 for share`, [familyId]);
  if (result.rowCount !== 1) throw new NotFoundException('family_not_found');
}

async function lockIdempotencyKey<T>(client: pg.PoolClient, idempotencyKey: string, requestHash: string): Promise<{ replay: false } | { replay: true; response: T }> {
  await client.query(
    `insert into idempotency_keys(idempotency_key, action_name, request_hash)
     values ($1, $2, $3)
     on conflict (idempotency_key) do nothing`,
    [idempotencyKey, CREATE_ACTION, requestHash],
  );
  const result = await client.query<{ action_name: string; request_hash: string; response_body: unknown | null }>(
    `select action_name, request_hash, response_body from idempotency_keys where idempotency_key=$1 for update`,
    [idempotencyKey],
  );
  const row = result.rows[0];
  if (!row || row.action_name !== CREATE_ACTION || row.request_hash !== requestHash) {
    throw new ConflictException('Idempotency conflict');
  }
  if (row.response_body) return { replay: true, response: row.response_body as T };
  return { replay: false };
}

async function storeIdempotencyResponse<T>(client: pg.PoolClient, idempotencyKey: string, response: T): Promise<void> {
  await client.query(`update idempotency_keys set response_code=200, response_body=$2::jsonb where idempotency_key=$1`, [idempotencyKey, JSON.stringify(response)]);
}

function mapRequest(row: LifecycleRow): FamilyDataLifecycleRequestDto {
  return {
    family_data_lifecycle_request_id: row.family_data_lifecycle_request_id,
    family_id: row.family_id,
    request_type: row.request_type,
    request_scope: row.request_scope,
    status: row.status,
    requested_by_person_id: row.requested_by_person_id,
    reason_text: row.reason_text,
    requested_at: row.requested_at.toISOString(),
    created_at: row.created_at.toISOString(),
  };
}

async function insertAudit(client: pg.PoolClient, familyId: string, requestId: string, idempotencyKey: string, meta: AuditMeta, response: unknown): Promise<void> {
  await client.query(
    `insert into audit_logs(
       family_id, actor_type, actor_id, action_name, resource_type, resource_id,
       correlation_id, idempotency_key, result, metadata
     ) values ($1, 'USER', $2, $3, 'FamilyDataLifecycleRequest', $4, $5, $6, 'SUCCESS', $7::jsonb)`,
    [familyId, meta.actor, CREATE_ACTION, requestId, meta.correlationId, idempotencyKey, JSON.stringify({ source: meta.source, occurred_at: meta.occurredAt, response })],
  );
}

async function insertOutboxEvent(client: pg.PoolClient, familyId: string, request: FamilyDataLifecycleRequestDto, meta: AuditMeta): Promise<void> {
  const eventId = randomUUID();
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ('Family', $1, $2, 1, $3, $4, $5::jsonb, $6)`,
    [
      familyId,
      REQUEST_EVENT,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        request_id: request.family_data_lifecycle_request_id,
        request_type: request.request_type,
        request_scope: request.request_scope,
        status: request.status,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        occurred_at: meta.occurredAt,
        execution_boundary: 'REQUEST_RECORDED_ONLY_NO_EXPORT_NO_RETENTION_EXECUTION_NO_DELETE',
      }),
      meta.occurredAt,
    ],
  );
}


type ReviewRow = {
  family_data_lifecycle_request_review_id: string;
  family_id: string;
  family_data_lifecycle_request_id: string;
  reviewer_person_id: string;
  decision: FamilyDataLifecycleReviewDecision;
  reason_code: string;
  policy_version: 'FAMILY_DATA_GOVERNANCE_V1';
  reviewed_at: Date;
  created_at: Date;
};

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function getRequestForUpdate(client: pg.PoolClient, familyId: string, requestId: string): Promise<FamilyDataLifecycleRequestDto> {
  const result = await client.query<LifecycleRow>(
    `select family_data_lifecycle_request_id, family_id, request_type, request_scope, status,
            requested_by_person_id, reason_text, requested_at, created_at
       from family_data_lifecycle_requests
      where family_id=$1 and family_data_lifecycle_request_id=$2
      for update`,
    [familyId, requestId],
  );
  if (result.rowCount !== 1) throw new NotFoundException('family_data_lifecycle_request_not_found');
  return mapRequest(result.rows[0]);
}

async function updateRequestStatus(
  client: pg.PoolClient,
  requestId: string,
  status: FamilyDataLifecycleRequestStatus,
): Promise<FamilyDataLifecycleRequestDto> {
  const result = await client.query<LifecycleRow>(
    `update family_data_lifecycle_requests
        set status=$2
      where family_data_lifecycle_request_id=$1
      returning family_data_lifecycle_request_id, family_id, request_type, request_scope, status,
                requested_by_person_id, reason_text, requested_at, created_at`,
    [requestId, status],
  );
  if (result.rowCount !== 1) throw new NotFoundException('family_data_lifecycle_request_not_found');
  return mapRequest(result.rows[0]);
}

async function lockActionIdempotency<T>(
  client: pg.PoolClient,
  actionName: string,
  idempotencyKey: string,
  requestHash: string,
): Promise<{ replay: false } | { replay: true; response: T }> {
  await client.query(
    `insert into idempotency_keys(idempotency_key, action_name, request_hash)
     values ($1,$2,$3)
     on conflict (idempotency_key) do nothing`,
    [idempotencyKey, actionName, requestHash],
  );
  const result = await client.query<{ action_name: string; request_hash: string; response_body: unknown | null }>(
    `select action_name, request_hash, response_body from idempotency_keys where idempotency_key=$1 for update`,
    [idempotencyKey],
  );
  const row = result.rows[0];
  if (!row || row.action_name !== actionName || row.request_hash !== requestHash) throw new ConflictException('Idempotency conflict');
  if (row.response_body) return { replay: true, response: row.response_body as T };
  return { replay: false };
}

function mapReview(row: ReviewRow): FamilyDataLifecycleReviewDto {
  return {
    family_data_lifecycle_request_review_id: row.family_data_lifecycle_request_review_id,
    family_id: row.family_id,
    family_data_lifecycle_request_id: row.family_data_lifecycle_request_id,
    reviewer_person_id: row.reviewer_person_id,
    decision: row.decision,
    reason_code: row.reason_code,
    policy_version: row.policy_version,
    reviewed_at: row.reviewed_at.toISOString(),
    created_at: row.created_at.toISOString(),
  };
}

async function insertAuditNamed(
  client: pg.PoolClient,
  actionName: string,
  familyId: string,
  requestId: string,
  idempotencyKey: string,
  meta: AuditMeta,
  response: unknown,
): Promise<void> {
  await client.query(
    `insert into audit_logs(
       family_id, actor_type, actor_id, action_name, resource_type, resource_id,
       correlation_id, idempotency_key, result, metadata
     ) values ($1,'USER',$2,$3,'FamilyDataLifecycleRequest',$4,$5,$6,'SUCCESS',$7::jsonb)`,
    [familyId, meta.actor, actionName, requestId, meta.correlationId, idempotencyKey, JSON.stringify({ source: meta.source, occurred_at: meta.occurredAt, response })],
  );
}

async function insertNamedEvent(
  client: pg.PoolClient,
  eventName: string,
  familyId: string,
  requestId: string,
  meta: AuditMeta,
  payload: unknown,
): Promise<void> {
  const eventId = randomUUID();
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ('Family',$1,$2,1,$3,$4,$5::jsonb,$6)`,
    [familyId, eventName, eventId, meta.correlationId, JSON.stringify({ event_id: eventId, family_id: familyId, request_id: requestId, actor_id: meta.actor, correlation_id: meta.correlationId, occurred_at: meta.occurredAt, payload, execution_boundary: 'GOVERNANCE_RECORD_ONLY_NO_REAL_EXPORT_NO_RETENTION_EXECUTION_NO_DELETE' }), meta.occurredAt],
  );
}
