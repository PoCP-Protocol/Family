import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { AddChildRequest, AddChildResponse, AddParentRequest, AddParentResponse, AssignLifeStageRequest, AssignLifeStageResponse, AuditMeta, ConsentDto, ConsentPurpose, ConsentStatus, CreateFamilyRelationshipRequest, CreateFamilyRelationshipResponse, CreateFamilyRequest, CreateFamilyResponse, FamilyAggregateResponse, FamilyDto, FamilyRelationshipDto, GrantConsentRequest, GrantConsentResponse, GrowthOnboardingDto, LifeStageAssignmentDto, LifeStageCode, PersonDto, RelationshipType, StartGrowthOnboardingRequest, StartGrowthOnboardingResponse } from '@family/contracts';
import type pg from 'pg';
import { FamilyAggregateRepository } from './family-aggregate.repository';
import { FamilyRepository } from './family.repository';

const CREATE_FAMILY_ACTION = 'CreateFamily';
const CREATE_FAMILY_EVENT = 'FamilyCreated';
const ADD_PARENT_ACTION = 'AddParent';
const ADD_CHILD_ACTION = 'AddChild';
const CREATE_FAMILY_RELATIONSHIP_ACTION = 'CreateFamilyRelationship';
const ASSIGN_LIFE_STAGE_ACTION = 'AssignLifeStage';
const GRANT_CONSENT_ACTION = 'GrantConsent';
const START_GROWTH_ONBOARDING_ACTION = 'StartGrowthOnboarding';
const FAMILY_MEMBER_ADDED_EVENT = 'FamilyMemberAdded';
const FAMILY_RELATIONSHIP_CREATED_EVENT = 'FamilyRelationshipCreated';
const LIFE_STAGE_ASSIGNED_EVENT = 'LifeStageAssigned';
const CONSENT_GRANTED_EVENT = 'ConsentGranted';
const GROWTH_ONBOARDING_STARTED_EVENT = 'GrowthOnboardingStarted';
const M2_ONBOARDING_JOURNEY_TYPE = 'PARENT_CHILD_COMMUNICATION_CONFLICT';
const M2_ONBOARDING_DIMENSIONS = ['P03', 'R03', 'R04', 'R05'] as const;

@Injectable()
export class FamilyService {
  constructor(
    @Inject(FamilyRepository) private readonly repository: FamilyRepository,
    @Inject(FamilyAggregateRepository) private readonly aggregateRepository: FamilyAggregateRepository,
  ) {}

  async getFamilyAggregate(familyId: string, actorId: string): Promise<FamilyAggregateResponse> {
    return this.aggregateRepository.getFamilyAggregate(familyId, actorId);
  }

  async createFamily(request: CreateFamilyRequest, meta: AuditMeta): Promise<CreateFamilyResponse> {
    const requestHash = hashCreateFamilyRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<CreateFamilyResponse>(client, CREATE_FAMILY_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      const family = await insertFamily(client, request.display_name);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: CreateFamilyResponse = { family };

      await insertAudit(client, CREATE_FAMILY_ACTION, 'Family', family.family_id, family.family_id, request.idempotency_key, meta, response);
      await insertCreateFamilyEvent(client, family.family_id, eventId, occurredAt, meta, response);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async addParent(request: AddParentRequest, meta: AuditMeta): Promise<AddParentResponse> {
    const requestHash = hashAddParentRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<AddParentResponse>(client, ADD_PARENT_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);

      const parent = await insertParentPerson(client, request);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: AddParentResponse = { parent };

      await insertAudit(client, ADD_PARENT_ACTION, 'Person', request.family_id, parent.person_id, request.idempotency_key, meta, response);
      await insertFamilyMemberAddedEvent(client, request.family_id, parent.person_id, 'PARENT', eventId, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async addChild(request: AddChildRequest, meta: AuditMeta): Promise<AddChildResponse> {
    const requestHash = hashAddChildRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<AddChildResponse>(client, ADD_CHILD_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);

      const child = await insertChildPerson(client, request);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: AddChildResponse = { child };

      await insertAudit(client, ADD_CHILD_ACTION, 'Person', request.family_id, child.person_id, request.idempotency_key, meta, response);
      await insertFamilyMemberAddedEvent(client, request.family_id, child.person_id, 'CHILD', eventId, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async createRelationship(request: CreateFamilyRelationshipRequest, meta: AuditMeta): Promise<CreateFamilyRelationshipResponse> {
    const requestHash = hashCreateFamilyRelationshipRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<CreateFamilyRelationshipResponse>(client, CREATE_FAMILY_RELATIONSHIP_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const persons = await getRelationshipPersons(client, request);
      assertRelationshipInvariant(request, persons.personA, persons.personB);
      await assertRelationshipNotDuplicate(client, request);

      const relationship = await insertFamilyRelationship(client, request);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: CreateFamilyRelationshipResponse = { relationship };

      await insertAudit(client, CREATE_FAMILY_RELATIONSHIP_ACTION, 'FamilyRelationship', request.family_id, relationship.relationship_id, request.idempotency_key, meta, response);
      await insertFamilyRelationshipCreatedEvent(client, request.family_id, relationship, eventId, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async assignLifeStage(request: AssignLifeStageRequest, meta: AuditMeta): Promise<AssignLifeStageResponse> {
    const requestHash = hashAssignLifeStageRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<AssignLifeStageResponse>(client, ASSIGN_LIFE_STAGE_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      await assertChildBelongsToFamily(client, request.family_id, request.child_id);
      const activeAssignment = await getActiveLifeStageAssignment(client, request.child_id);
      assertLifeStageTemporalTransition(activeAssignment, request);
      await closeActiveLifeStageAssignment(client, activeAssignment, request.effective_from);

      const assignment = await insertLifeStageAssignment(client, request, meta.source);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: AssignLifeStageResponse = { assignment };

      await insertAudit(client, ASSIGN_LIFE_STAGE_ACTION, 'LifeStageAssignment', request.family_id, assignment.assignment_id, request.idempotency_key, meta, response);
      await insertLifeStageAssignedEvent(client, request.family_id, assignment, eventId, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async grantConsent(request: GrantConsentRequest, meta: AuditMeta): Promise<GrantConsentResponse> {
    const requestHash = hashGrantConsentRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<GrantConsentResponse>(client, GRANT_CONSENT_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const persons = await getConsentPersons(client, request);
      assertActorIsGuardian(persons.guardian, meta.actor);
      await assertGuardianAuthorizedForSubject(client, request, persons.guardian, persons.subject);
      const activeConsent = await getActiveConsent(client, request.family_id, request.subject_person_id, request.purpose);
      assertConsentPreconditions(activeConsent, request);
      await expireActiveConsent(client, activeConsent);

      const consent = await insertConsent(client, request);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: GrantConsentResponse = { consent };

      await insertAudit(client, GRANT_CONSENT_ACTION, 'Consent', request.family_id, consent.consent_id, request.idempotency_key, meta, response);
      await insertConsentGrantedEvent(client, request.family_id, consent, eventId, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async startGrowthOnboarding(request: StartGrowthOnboardingRequest, meta: AuditMeta): Promise<StartGrowthOnboardingResponse> {
    const requestHash = hashStartGrowthOnboardingRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<StartGrowthOnboardingResponse>(client, START_GROWTH_ONBOARDING_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      await assertChildBelongsToFamily(client, request.family_id, request.child_id);
      const activeAssignment = await getActiveLifeStageAssignment(client, request.child_id);
      assertM2LifeStageReady(activeAssignment);
      const persons = await getOnboardingPersons(client, request);
      assertActorIsGuardian(persons.guardian, meta.actor);
      await assertOnboardingGuardianAuthorized(client, request, persons.guardian, persons.child);
      await assertRequiredGrowthConsents(client, request.family_id, request.child_id);
      assertLowRiskOnboardingOnly(request);
      await assertNoActiveGrowthOnboarding(client, request.family_id);

      const onboarding = await insertGrowthOnboarding(client, request);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: StartGrowthOnboardingResponse = { onboarding };

      await insertAudit(client, START_GROWTH_ONBOARDING_ACTION, 'GrowthOnboarding', request.family_id, onboarding.onboarding_id, request.idempotency_key, meta, response);
      await insertGrowthOnboardingStartedEvent(client, request.family_id, onboarding, eventId, occurredAt, meta);
      await insertGrowthOnboardingDomainEvent(client, request.family_id, onboarding, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }
}

function hashCreateFamilyRequest(request: CreateFamilyRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      display_name: request.display_name,
      primary_contact_account_id: request.primary_contact_account_id ?? null,
    }))
    .digest('hex');
}

function hashAddParentRequest(request: AddParentRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      role: request.role,
      display_name: request.display_name,
      account_id: request.account_id ?? null,
    }))
    .digest('hex');
}

function hashAddChildRequest(request: AddChildRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      display_name: request.display_name,
      birth_date: request.birth_date ?? null,
    }))
    .digest('hex');
}

function hashCreateFamilyRelationshipRequest(request: CreateFamilyRelationshipRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      person_a_id: request.person_a_id,
      person_b_id: request.person_b_id,
      relationship_type: request.relationship_type,
    }))
    .digest('hex');
}

function hashAssignLifeStageRequest(request: AssignLifeStageRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      child_id: request.child_id,
      life_stage_code: request.life_stage_code,
      effective_from: request.effective_from,
    }))
    .digest('hex');
}

function hashGrantConsentRequest(request: GrantConsentRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      subject_person_id: request.subject_person_id,
      guardian_person_id: request.guardian_person_id,
      purpose: request.purpose,
      policy_version: request.policy_version,
    }))
    .digest('hex');
}

function hashStartGrowthOnboardingRequest(request: StartGrowthOnboardingRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      child_id: request.child_id,
      guardian_person_id: request.guardian_person_id,
      safety_screening_result: request.safety_screening_result,
    }))
    .digest('hex');
}

async function lockIdempotencyKey<TResponse>(
  client: pg.PoolClient,
  actionName: string,
  idempotencyKey: string,
  requestHash: string,
): Promise<{ replay: false } | { replay: true; response: TResponse }> {
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

async function insertFamily(client: pg.PoolClient, displayName: string): Promise<FamilyDto> {
  const result = await client.query<{
    family_id: string;
    display_name: string;
    status: FamilyDto['status'];
    primary_contact_person_id: string | null;
    created_at: Date;
    updated_at: Date;
    version: number;
  }>(
    `insert into families(display_name)
     values ($1)
     returning family_id, display_name, status, primary_contact_person_id, created_at, updated_at, version`,
    [displayName],
  );

  const row = result.rows[0];
  return {
    family_id: row.family_id,
    display_name: row.display_name,
    status: row.status,
    primary_contact_person_id: row.primary_contact_person_id,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    version: row.version,
  };
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

async function insertParentPerson(client: pg.PoolClient, request: AddParentRequest): Promise<PersonDto> {
  const result = await client.query<{
    person_id: string;
    family_id: string;
    person_type: PersonDto['person_type'];
    parent_role: PersonDto['parent_role'];
    display_name: string;
    birth_date: Date | null;
    account_id: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `insert into persons(family_id, person_type, parent_role, display_name, account_id)
     values ($1, 'PARENT', $2, $3, $4)
     returning person_id, family_id, person_type, parent_role, display_name, birth_date, account_id, created_at, updated_at`,
    [request.family_id, request.role, request.display_name, request.account_id ?? null],
  );

  return mapPerson(result.rows[0]);
}

async function insertChildPerson(client: pg.PoolClient, request: AddChildRequest): Promise<PersonDto> {
  const result = await client.query<{
    person_id: string;
    family_id: string;
    person_type: PersonDto['person_type'];
    parent_role: PersonDto['parent_role'];
    display_name: string;
    birth_date: Date | null;
    account_id: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `insert into persons(family_id, person_type, display_name, birth_date)
     values ($1, 'CHILD', $2, $3)
     returning person_id, family_id, person_type, parent_role, display_name, birth_date, account_id, created_at, updated_at`,
    [request.family_id, request.display_name, request.birth_date ?? null],
  );

  return mapPerson(result.rows[0]);
}

async function getRelationshipPersons(client: pg.PoolClient, request: CreateFamilyRelationshipRequest): Promise<{ personA: PersonDto; personB: PersonDto }> {
  const result = await client.query<{
    person_id: string;
    family_id: string;
    person_type: PersonDto['person_type'];
    parent_role: PersonDto['parent_role'];
    display_name: string;
    birth_date: Date | null;
    account_id: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `select person_id, family_id, person_type, parent_role, display_name, birth_date, account_id, created_at, updated_at
     from persons
     where person_id = any($1::uuid[])
     for share`,
    [[request.person_a_id, request.person_b_id]],
  );

  const persons = new Map(result.rows.map((row) => [row.person_id, mapPerson(row)]));
  const personA = persons.get(request.person_a_id);
  const personB = persons.get(request.person_b_id);
  if (!personA || !personB) {
    throw new NotFoundException('person_not_found');
  }

  return { personA, personB };
}

function assertRelationshipInvariant(request: CreateFamilyRelationshipRequest, personA: PersonDto, personB: PersonDto): void {
  if (request.person_a_id === request.person_b_id) {
    throw new BadRequestException('relationship_self_link_not_allowed');
  }

  if (personA.family_id !== request.family_id || personB.family_id !== request.family_id) {
    throw new BadRequestException('relationship_persons_must_belong_to_same_family');
  }

  if ((request.relationship_type === 'PARENT_CHILD' || request.relationship_type === 'GUARDIAN_CHILD') && (personA.person_type !== 'PARENT' || personB.person_type !== 'CHILD')) {
    throw new BadRequestException('relationship_direction_invalid');
  }
}

async function assertRelationshipNotDuplicate(client: pg.PoolClient, request: CreateFamilyRelationshipRequest): Promise<void> {
  const symmetric = isSymmetricRelationship(request.relationship_type);
  const result = await client.query(
    `select relationship_id
     from family_relationships
     where family_id = $1
       and relationship_type = $4
       and (
         (person_a_id = $2 and person_b_id = $3)
         or ($5::boolean and person_a_id = $3 and person_b_id = $2)
       )
     limit 1
     for share`,
    [request.family_id, request.person_a_id, request.person_b_id, request.relationship_type, symmetric],
  );
  if (result.rowCount && result.rowCount > 0) {
    throw new ConflictException('relationship_already_exists');
  }
}

async function insertFamilyRelationship(client: pg.PoolClient, request: CreateFamilyRelationshipRequest): Promise<FamilyRelationshipDto> {
  try {
    const result = await client.query<{
      relationship_id: string;
      family_id: string;
      person_a_id: string;
      person_b_id: string;
      relationship_type: RelationshipType;
      created_at: Date;
    }>(
      `insert into family_relationships(family_id, person_a_id, person_b_id, relationship_type)
       values ($1, $2, $3, $4)
       returning relationship_id, family_id, person_a_id, person_b_id, relationship_type, created_at`,
      [request.family_id, request.person_a_id, request.person_b_id, request.relationship_type],
    );

    return mapRelationship(result.rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictException('relationship_already_exists');
    }
    throw error;
  }
}

async function assertChildBelongsToFamily(client: pg.PoolClient, familyId: string, childId: string): Promise<void> {
  const result = await client.query<{
    person_id: string;
    family_id: string;
    person_type: PersonDto['person_type'];
  }>(
    `select person_id, family_id, person_type
     from persons
     where person_id = $1
     for share`,
    [childId],
  );

  const child = result.rows[0];
  if (!child) {
    throw new NotFoundException('child_not_found');
  }

  if (child.family_id !== familyId) {
    throw new BadRequestException('child_must_belong_to_family');
  }

  if (child.person_type !== 'CHILD') {
    throw new BadRequestException('life_stage_subject_must_be_child');
  }
}

async function getActiveLifeStageAssignment(client: pg.PoolClient, childId: string): Promise<LifeStageAssignmentDto | null> {
  const result = await client.query<LifeStageAssignmentRow>(
    `select assignment_id, family_id, child_id, life_stage_code, effective_from, effective_to, source, created_at
     from life_stage_assignments
     where child_id = $1 and effective_to is null
     for update`,
    [childId],
  );

  return result.rows[0] ? mapLifeStageAssignment(result.rows[0]) : null;
}

function assertLifeStageTemporalTransition(activeAssignment: LifeStageAssignmentDto | null, request: AssignLifeStageRequest): void {
  if (!activeAssignment) {
    return;
  }

  if (activeAssignment.life_stage_code === request.life_stage_code) {
    throw new ConflictException('life_stage_assignment_already_active');
  }

  if (Date.parse(request.effective_from) <= Date.parse(activeAssignment.effective_from)) {
    throw new BadRequestException('life_stage_effective_from_must_be_after_active_assignment');
  }
}

async function closeActiveLifeStageAssignment(client: pg.PoolClient, activeAssignment: LifeStageAssignmentDto | null, effectiveTo: string): Promise<void> {
  if (!activeAssignment) {
    return;
  }

  await client.query(
    `update life_stage_assignments
     set effective_to = $2
     where assignment_id = $1`,
    [activeAssignment.assignment_id, effectiveTo],
  );
}

async function insertLifeStageAssignment(client: pg.PoolClient, request: AssignLifeStageRequest, source: string): Promise<LifeStageAssignmentDto> {
  try {
    const result = await client.query<LifeStageAssignmentRow>(
      `insert into life_stage_assignments(family_id, child_id, life_stage_code, effective_from, source)
       values ($1, $2, $3, $4, $5)
       returning assignment_id, family_id, child_id, life_stage_code, effective_from, effective_to, source, created_at`,
      [request.family_id, request.child_id, request.life_stage_code, request.effective_from, normalizeSource(source)],
    );

    return mapLifeStageAssignment(result.rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictException('life_stage_assignment_already_active');
    }
    throw error;
  }
}

function normalizeSource(source: string): string {
  const trimmed = source.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 64) : 'api';
}

function isSymmetricRelationship(relationshipType: RelationshipType): boolean {
  return relationshipType === 'SPOUSE' || relationshipType === 'SIBLING';
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
}

function mapRelationship(row: {
  relationship_id: string;
  family_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: RelationshipType;
  created_at: Date;
}): FamilyRelationshipDto {
  return {
    relationship_id: row.relationship_id,
    family_id: row.family_id,
    person_a_id: row.person_a_id,
    person_b_id: row.person_b_id,
    relationship_type: row.relationship_type,
    created_at: row.created_at.toISOString(),
  };
}

interface LifeStageAssignmentRow {
  assignment_id: string;
  family_id: string;
  child_id: string;
  life_stage_code: LifeStageCode;
  effective_from: Date;
  effective_to: Date | null;
  source: string;
  created_at: Date;
}

function mapLifeStageAssignment(row: LifeStageAssignmentRow): LifeStageAssignmentDto {
  return {
    assignment_id: row.assignment_id,
    family_id: row.family_id,
    child_id: row.child_id,
    life_stage_code: row.life_stage_code,
    effective_from: row.effective_from.toISOString(),
    effective_to: row.effective_to ? row.effective_to.toISOString() : null,
    source: row.source,
    created_at: row.created_at.toISOString(),
  };
}

function assertM2LifeStageReady(activeAssignment: LifeStageAssignmentDto | null): void {
  if (!activeAssignment) {
    throw new BadRequestException('life_stage_assignment_required');
  }

  if (activeAssignment.life_stage_code !== 'EARLY_ADOLESCENCE_12_15') {
    throw new BadRequestException('life_stage_not_supported_for_m2_slice');
  }
}

async function getOnboardingPersons(client: pg.PoolClient, request: StartGrowthOnboardingRequest): Promise<{ guardian: PersonDto; child: PersonDto }> {
  const result = await client.query<{
    person_id: string;
    family_id: string;
    person_type: PersonDto['person_type'];
    parent_role: PersonDto['parent_role'];
    display_name: string;
    birth_date: Date | null;
    account_id: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `select person_id, family_id, person_type, parent_role, display_name, birth_date, account_id, created_at, updated_at
     from persons
     where person_id = any($1::uuid[])
     for share`,
    [[request.guardian_person_id, request.child_id]],
  );

  const persons = new Map(result.rows.map((row) => [row.person_id, mapPerson(row)]));
  const guardian = persons.get(request.guardian_person_id);
  const child = persons.get(request.child_id);
  if (!guardian) {
    throw new NotFoundException('guardian_not_found');
  }
  if (!child) {
    throw new NotFoundException('child_not_found');
  }

  return { guardian, child };
}

async function assertOnboardingGuardianAuthorized(client: pg.PoolClient, request: StartGrowthOnboardingRequest, guardian: PersonDto, child: PersonDto): Promise<void> {
  if (guardian.family_id !== request.family_id || child.family_id !== request.family_id) {
    throw new BadRequestException('onboarding_persons_must_belong_to_family');
  }

  if (guardian.person_type !== 'PARENT') {
    throw new ForbiddenException('guardian_not_authorized');
  }

  if (child.person_type !== 'CHILD') {
    throw new BadRequestException('onboarding_subject_must_be_child');
  }

  const result = await client.query(
    `select relationship_id
     from family_relationships
     where family_id = $1
       and person_a_id = $2
       and person_b_id = $3
       and relationship_type in ('PARENT_CHILD', 'GUARDIAN_CHILD')
     limit 1
     for share`,
    [request.family_id, request.guardian_person_id, request.child_id],
  );

  if (result.rowCount !== 1) {
    throw new ForbiddenException('guardian_not_authorized');
  }
}

async function assertRequiredGrowthConsents(client: pg.PoolClient, familyId: string, childId: string): Promise<void> {
  const result = await client.query<{ purpose: ConsentPurpose }>(
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
  const missing = ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'].filter((purpose) => !granted.has(purpose as ConsentPurpose));
  if (missing.length > 0) {
    throw new ForbiddenException(`missing_required_consent:${missing.join(',')}`);
  }
}

function assertLowRiskOnboardingOnly(request: StartGrowthOnboardingRequest): void {
  if (request.safety_screening_result !== 'LOW') {
    throw new ForbiddenException('human_gate_required_for_safety_screening');
  }
}

async function assertNoActiveGrowthOnboarding(client: pg.PoolClient, familyId: string): Promise<void> {
  const result = await client.query(
    `select journey_id
     from growth_journeys
     where family_id = $1
       and journey_type = $2
       and status = 'ACTIVE'
     limit 1
     for update`,
    [familyId, M2_ONBOARDING_JOURNEY_TYPE],
  );
  if (result.rowCount && result.rowCount > 0) {
    throw new ConflictException('growth_onboarding_already_active');
  }
}

async function insertGrowthOnboarding(client: pg.PoolClient, request: StartGrowthOnboardingRequest): Promise<GrowthOnboardingDto> {
  const result = await client.query<{
    journey_id: string;
    family_id: string;
    journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT';
    phase: 'ONBOARDING';
    status: 'ACTIVE';
    started_at: Date;
    created_at: Date;
  }>(
    `insert into growth_journeys(family_id, journey_type, phase, status, started_at)
     values ($1, $2, 'ONBOARDING', 'ACTIVE', now())
     returning journey_id, family_id, journey_type, phase, status, started_at, created_at`,
    [request.family_id, M2_ONBOARDING_JOURNEY_TYPE],
  );

  const row = result.rows[0];
  return {
    onboarding_id: row.journey_id,
    family_id: row.family_id,
    child_id: request.child_id,
    guardian_person_id: request.guardian_person_id,
    journey_type: row.journey_type,
    life_stage_code: 'EARLY_ADOLESCENCE_12_15',
    target_dimensions: [...M2_ONBOARDING_DIMENSIONS],
    status: row.status,
    phase: row.phase,
    safety_screening_result: request.safety_screening_result,
    ai_personalization_enabled: false,
    started_at: row.started_at.toISOString(),
    created_at: row.created_at.toISOString(),
  };
}

function mapPerson(row: {
  person_id: string;
  family_id: string;
  person_type: PersonDto['person_type'];
  parent_role: PersonDto['parent_role'];
  display_name: string;
  birth_date: Date | null;
  account_id: string | null;
  created_at: Date;
  updated_at: Date;
}): PersonDto {
  return {
    person_id: row.person_id,
    family_id: row.family_id,
    person_type: row.person_type,
    parent_role: row.parent_role,
    display_name: row.display_name,
    birth_date: formatDateOnly(row.birth_date),
    account_id: row.account_id,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

function formatDateOnly(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
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

async function insertCreateFamilyEvent(
  client: pg.PoolClient,
  familyId: string,
  eventId: string,
  occurredAt: string,
  meta: AuditMeta,
  response: CreateFamilyResponse,
): Promise<void> {
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'Family',
      familyId,
      CREATE_FAMILY_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        family: response.family,
      }),
      occurredAt,
    ],
  );
}

async function insertFamilyMemberAddedEvent(
  client: pg.PoolClient,
  familyId: string,
  personId: string,
  personRole: 'PARENT' | 'CHILD',
  eventId: string,
  occurredAt: string,
  meta: AuditMeta,
): Promise<void> {
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'Family',
      familyId,
      FAMILY_MEMBER_ADDED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        person_id: personId,
        person_role: personRole,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
      }),
      occurredAt,
    ],
  );
}

async function insertFamilyRelationshipCreatedEvent(
  client: pg.PoolClient,
  familyId: string,
  relationship: FamilyRelationshipDto,
  eventId: string,
  occurredAt: string,
  meta: AuditMeta,
): Promise<void> {
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'Family',
      familyId,
      FAMILY_RELATIONSHIP_CREATED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        relationship_id: relationship.relationship_id,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        relationship,
      }),
      occurredAt,
    ],
  );
}

async function insertLifeStageAssignedEvent(
  client: pg.PoolClient,
  familyId: string,
  assignment: LifeStageAssignmentDto,
  eventId: string,
  occurredAt: string,
  meta: AuditMeta,
): Promise<void> {
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'Family',
      familyId,
      LIFE_STAGE_ASSIGNED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        child_id: assignment.child_id,
        assignment_id: assignment.assignment_id,
        life_stage_code: assignment.life_stage_code,
        effective_from: assignment.effective_from,
        effective_to: assignment.effective_to,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        assignment,
      }),
      occurredAt,
    ],
  );
}

async function getConsentPersons(client: pg.PoolClient, request: GrantConsentRequest): Promise<{ guardian: PersonDto; subject: PersonDto }> {
  const result = await client.query<{
    person_id: string;
    family_id: string;
    person_type: PersonDto['person_type'];
    parent_role: PersonDto['parent_role'];
    display_name: string;
    birth_date: Date | null;
    account_id: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `select person_id, family_id, person_type, parent_role, display_name, birth_date, account_id, created_at, updated_at
     from persons
     where person_id = any($1::uuid[])
     for share`,
    [[request.guardian_person_id, request.subject_person_id]],
  );

  const persons = new Map(result.rows.map((row) => [row.person_id, mapPerson(row)]));
  const guardian = persons.get(request.guardian_person_id);
  const subject = persons.get(request.subject_person_id);
  if (!guardian) {
    throw new NotFoundException('guardian_not_found');
  }
  if (!subject) {
    throw new NotFoundException('subject_not_found');
  }

  return { guardian, subject };
}

function assertActorIsGuardian(guardian: PersonDto, actorId: string): void {
  if (!guardian.account_id || guardian.account_id !== actorId) {
    throw new ForbiddenException('actor_must_match_guardian_account');
  }
}

async function assertGuardianAuthorizedForSubject(client: pg.PoolClient, request: GrantConsentRequest, guardian: PersonDto, subject: PersonDto): Promise<void> {
  if (guardian.family_id !== request.family_id || subject.family_id !== request.family_id) {
    throw new BadRequestException('consent_persons_must_belong_to_family');
  }

  if (guardian.person_type !== 'PARENT') {
    throw new ForbiddenException('guardian_not_authorized');
  }

  if (subject.person_type !== 'CHILD') {
    throw new BadRequestException('consent_subject_must_be_child');
  }

  const result = await client.query(
    `select relationship_id
     from family_relationships
     where family_id = $1
       and person_a_id = $2
       and person_b_id = $3
       and relationship_type in ('PARENT_CHILD', 'GUARDIAN_CHILD')
     limit 1
     for share`,
    [request.family_id, request.guardian_person_id, request.subject_person_id],
  );

  if (result.rowCount !== 1) {
    throw new ForbiddenException('guardian_not_authorized');
  }
}

async function getActiveConsent(client: pg.PoolClient, familyId: string, subjectPersonId: string, purpose: ConsentPurpose): Promise<ConsentDto | null> {
  const result = await client.query<ConsentRow>(
    `select consent_id, family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at, withdrawn_at, created_at
     from consents
     where family_id = $1 and subject_person_id = $2 and purpose = $3 and status = 'GRANTED'
     for update`,
    [familyId, subjectPersonId, purpose],
  );

  return result.rows[0] ? mapConsent(result.rows[0]) : null;
}

function assertConsentPreconditions(activeConsent: ConsentDto | null, request: GrantConsentRequest): void {
  if (activeConsent && activeConsent.policy_version === request.policy_version) {
    throw new ConflictException('consent_already_granted');
  }
}

async function expireActiveConsent(client: pg.PoolClient, activeConsent: ConsentDto | null): Promise<void> {
  if (!activeConsent) {
    return;
  }

  await client.query(
    `update consents
     set status = 'EXPIRED'
     where consent_id = $1`,
    [activeConsent.consent_id],
  );
}

async function insertConsent(client: pg.PoolClient, request: GrantConsentRequest): Promise<ConsentDto> {
  try {
    const result = await client.query<ConsentRow>(
      `insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at)
       values ($1, $2, $3, $4, 'GRANTED', $5, now())
       returning consent_id, family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at, withdrawn_at, created_at`,
      [request.family_id, request.subject_person_id, request.guardian_person_id, request.purpose, request.policy_version],
    );

    return mapConsent(result.rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictException('consent_already_granted');
    }
    throw error;
  }
}

interface ConsentRow {
  consent_id: string;
  family_id: string;
  subject_person_id: string;
  guardian_person_id: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  policy_version: string;
  granted_at: Date;
  withdrawn_at: Date | null;
  created_at: Date;
}

function mapConsent(row: ConsentRow): ConsentDto {
  return {
    consent_id: row.consent_id,
    family_id: row.family_id,
    subject_person_id: row.subject_person_id,
    guardian_person_id: row.guardian_person_id,
    purpose: row.purpose,
    status: row.status,
    policy_version: row.policy_version,
    granted_at: row.granted_at.toISOString(),
    withdrawn_at: row.withdrawn_at ? row.withdrawn_at.toISOString() : null,
    created_at: row.created_at.toISOString(),
  };
}

async function insertConsentGrantedEvent(
  client: pg.PoolClient,
  familyId: string,
  consent: ConsentDto,
  eventId: string,
  occurredAt: string,
  meta: AuditMeta,
): Promise<void> {
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'Family',
      familyId,
      CONSENT_GRANTED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        consent_id: consent.consent_id,
        subject_person_id: consent.subject_person_id,
        guardian_person_id: consent.guardian_person_id,
        purpose: consent.purpose,
        policy_version: consent.policy_version,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        consent,
      }),
      occurredAt,
    ],
  );
}

async function insertGrowthOnboardingStartedEvent(
  client: pg.PoolClient,
  familyId: string,
  onboarding: GrowthOnboardingDto,
  eventId: string,
  occurredAt: string,
  meta: AuditMeta,
): Promise<void> {
  await client.query(
    `insert into outbox_events(
       aggregate_type, aggregate_id, event_name, event_version, event_id,
       correlation_id, payload, occurred_at
     ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      'GrowthOnboarding',
      familyId,
      GROWTH_ONBOARDING_STARTED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        onboarding_id: onboarding.onboarding_id,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        onboarding,
      }),
      occurredAt,
    ],
  );
}

async function insertGrowthOnboardingDomainEvent(
  client: pg.PoolClient,
  familyId: string,
  onboarding: GrowthOnboardingDto,
  occurredAt: string,
  meta: AuditMeta,
): Promise<void> {
  await client.query(
    `insert into growth_events(family_id, event_type, occurred_at, source, payload)
     values ($1, $2, $3, $4, $5::jsonb)`,
    [
      familyId,
      GROWTH_ONBOARDING_STARTED_EVENT,
      occurredAt,
      normalizeSource(meta.source),
      JSON.stringify({
        onboarding_id: onboarding.onboarding_id,
        child_id: onboarding.child_id,
        guardian_person_id: onboarding.guardian_person_id,
        life_stage_code: onboarding.life_stage_code,
        target_dimensions: onboarding.target_dimensions,
        safety_screening_result: onboarding.safety_screening_result,
        ai_personalization_enabled: onboarding.ai_personalization_enabled,
      }),
    ],
  );
}