import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { assertFamilyManagePermission as sharedAssertFamilyManagePermission } from './family-permission';
import { createHash, randomUUID } from 'node:crypto';
import type { AddChildRequest, AddChildResponse, AddParentRequest, AddParentResponse, AssignLifeStageRequest, AssignLifeStageResponse, AuditMeta, BuildGrowthProfileDraftsRequest, BuildGrowthProfileDraftsResponse, ConfirmGrowthProfileRequest, ConfirmGrowthProfileResponse, ConsentDto, ConsentPurpose, ConsentStatus, CreateFamilyRelationshipRequest, CreateFamilyRelationshipResponse, CreateFamilyRequest, CreateFamilyResponse, EvidenceRecordDto, EvidenceSnapshotDto, EvidenceSynthesisDto, FamilyAggregateResponse, FamilyDto, FamilyRelationshipDto, GrantConsentRequest, GrantConsentResponse, GrowthInsightResponse, GrowthOnboardingDto, GrowthProfileDraftDto, GrowthProfileDto, LifeStageAssignmentDto, LifeStageCode, M2GrowthDimensionId, PersonDto, PerspectiveDto, PerspectiveSummaryResponse, RecordPerspectiveRequest, RecordPerspectiveResponse, RelationshipType, SafetyDispositionDto, StartGrowthOnboardingRequest, StartGrowthOnboardingResponse } from '@family/contracts';
import type pg from 'pg';
import { EvidenceSynthesisService } from './evidence-synthesis.service';
import { FamilyAggregateRepository } from './family-aggregate.repository';
import { FamilyRepository } from './family.repository';
import { assessStructuredSafetySignals } from './safety-assessment.policy';

const CREATE_FAMILY_ACTION = 'CreateFamily';
const CREATE_FAMILY_EVENT = 'FamilyCreated';
const ADD_PARENT_ACTION = 'AddParent';
const ADD_CHILD_ACTION = 'AddChild';
const CREATE_FAMILY_RELATIONSHIP_ACTION = 'CreateFamilyRelationship';
const ASSIGN_LIFE_STAGE_ACTION = 'AssignLifeStage';
const GRANT_CONSENT_ACTION = 'GrantConsent';
const START_GROWTH_ONBOARDING_ACTION = 'StartGrowthOnboarding';
const RECORD_PERSPECTIVE_ACTION = 'RecordPerspective';
const BUILD_GROWTH_PROFILE_DRAFTS_ACTION = 'BuildGrowthProfileDrafts';
const CONFIRM_GROWTH_PROFILE_ACTION = 'ConfirmGrowthProfile';
const FAMILY_MEMBER_ADDED_EVENT = 'FamilyMemberAdded';
const FAMILY_RELATIONSHIP_CREATED_EVENT = 'FamilyRelationshipCreated';
const LIFE_STAGE_ASSIGNED_EVENT = 'LifeStageAssigned';
const CONSENT_GRANTED_EVENT = 'ConsentGranted';
const GROWTH_ONBOARDING_STARTED_EVENT = 'GrowthOnboardingStarted';
const PERSPECTIVE_RECORDED_EVENT = 'PerspectiveRecorded';
const GROWTH_PROFILE_DRAFTED_EVENT = 'GrowthProfileDrafted';
const GROWTH_PROFILE_CONFIRMED_EVENT = 'GrowthProfileConfirmed';
const M2_ONBOARDING_JOURNEY_TYPE = 'PARENT_CHILD_COMMUNICATION_CONFLICT';
const M2_ONBOARDING_DIMENSIONS = ['P03', 'R03', 'R04', 'R05'] as const;

@Injectable()
export class FamilyService {
  constructor(
    @Inject(FamilyRepository) private readonly repository: FamilyRepository,
    @Inject(FamilyAggregateRepository) private readonly aggregateRepository: FamilyAggregateRepository,
    @Inject(EvidenceSynthesisService) private readonly evidenceSynthesisService: EvidenceSynthesisService,
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

  async getActiveGrowthOnboarding(familyId: string, actorId: string): Promise<StartGrowthOnboardingResponse | null> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      const result = await client.query<{
        journey_id: string;
        phase: GrowthOnboardingDto['phase'];
        status: GrowthOnboardingDto['status'];
        started_at: Date;
        created_at: Date;
        payload: { child_id?: string; guardian_person_id?: string; safety_disposition?: SafetyDispositionDto } | null;
      }>(
        `select j.journey_id, j.phase, j.status, j.started_at, j.created_at,
                event.payload
         from growth_journeys j
         left join lateral (
           select ge.payload
           from growth_events ge
           where ge.family_id = j.family_id
             and ge.event_type = $2
             and ge.payload->>'onboarding_id' = j.journey_id::text
           order by ge.occurred_at desc
           limit 1
         ) event on true
         where j.family_id = $1
           and j.journey_type = $3
           and j.status = 'ACTIVE'
         order by j.started_at desc
         limit 1`,
        [familyId, GROWTH_ONBOARDING_STARTED_EVENT, M2_ONBOARDING_JOURNEY_TYPE],
      );
      if (result.rowCount !== 1) return null;
      const row = result.rows[0];
      const childId = row.payload?.child_id;
      const guardianPersonId = row.payload?.guardian_person_id;
      if (!childId || !guardianPersonId || !row.payload?.safety_disposition) {
        throw new ConflictException('active_growth_onboarding_projection_incomplete');
      }
      const activeAssignment = await getActiveLifeStageAssignment(client, childId);
      assertM2LifeStageReady(activeAssignment);
      if (!activeAssignment) {
        throw new ConflictException('active_growth_onboarding_life_stage_missing');
      }
      const targetDimensions: ['P03', 'R03', 'R04', 'R05'] = ['P03', 'R03', 'R04', 'R05'];
      return {
        onboarding: {
          onboarding_id: row.journey_id,
          family_id: familyId,
          child_id: childId,
          guardian_person_id: guardianPersonId,
          journey_type: M2_ONBOARDING_JOURNEY_TYPE,
          life_stage_code: activeAssignment.life_stage_code,
          target_dimensions: targetDimensions,
          status: row.status,
          phase: row.phase,
          safety_disposition: row.payload.safety_disposition,
          ai_personalization_enabled: false,
          started_at: row.started_at.toISOString(),
          created_at: row.created_at.toISOString(),
        },
      };
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
      const safetyDisposition = assessStructuredSafetySignals(request.structured_safety_signals);
      assertNormalSafetyDisposition(safetyDisposition);
      await assertNoActiveGrowthOnboarding(client, request.family_id);

      const onboarding = await insertGrowthOnboarding(client, request, safetyDisposition);
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

  async recordPerspective(request: RecordPerspectiveRequest, meta: AuditMeta): Promise<RecordPerspectiveResponse> {
    const requestHash = hashRecordPerspectiveRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<RecordPerspectiveResponse>(client, RECORD_PERSPECTIVE_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      await assertActiveOnboarding(client, request.family_id, request.onboarding_id);
      await assertPerspectiveSubjectMatchesOnboarding(client, request.family_id, request.onboarding_id, request.subject_person_id);
      const persons = await getPerspectivePersons(client, request);
      assertPerspectivePersons(request, persons.subject, persons.author);
      await assertRequiredGrowthConsents(client, request.family_id, request.subject_person_id);
      const safetyDisposition = assessStructuredSafetySignals(request.structured_safety_signals);
      assertNormalSafetyDisposition(safetyDisposition);

      const perspective = await insertPerspective(client, request, meta, safetyDisposition);
      const evidence = await insertEvidenceRecord(client, perspective, request);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: RecordPerspectiveResponse = { perspective, evidence, safety_disposition: safetyDisposition };

      await insertAudit(client, RECORD_PERSPECTIVE_ACTION, 'Perspective', request.family_id, perspective.perspective_id, request.idempotency_key, meta, response);
      await insertPerspectiveRecordedEvent(client, request.family_id, perspective, evidence, eventId, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async getPerspectiveSummary(familyId: string, onboardingId: string, actorId: string): Promise<PerspectiveSummaryResponse> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      await assertActiveOnboarding(client, familyId, onboardingId);
      return getPerspectiveSummary(client, familyId, onboardingId);
    });
  }

  async buildGrowthProfileDrafts(request: BuildGrowthProfileDraftsRequest, meta: AuditMeta): Promise<BuildGrowthProfileDraftsResponse> {
    const requestHash = hashBuildGrowthProfileDraftsRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<BuildGrowthProfileDraftsResponse>(client, BUILD_GROWTH_PROFILE_DRAFTS_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      await assertActiveOnboarding(client, request.family_id, request.onboarding_id);
      const context = await getOnboardingProfileContext(client, request.family_id, request.onboarding_id);
      await assertRequiredGrowthConsents(client, request.family_id, context.childId);
      const summary = await getPerspectiveSummary(client, request.family_id, request.onboarding_id);
      const synthesisResult = this.evidenceSynthesisService.synthesize({
        familyId: request.family_id,
        onboardingId: request.onboarding_id,
        parentPersonId: context.guardianPersonId,
        relationshipId: context.relationshipId,
        perspectives: summary.perspectives,
        evidence: summary.evidence,
      });
      const drafts = await insertGrowthProfileDrafts(client, request, synthesisResult.synthesis, synthesisResult.evidenceSnapshot);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: BuildGrowthProfileDraftsResponse = { drafts };

      await insertAudit(client, BUILD_GROWTH_PROFILE_DRAFTS_ACTION, 'GrowthProfileDraft', request.family_id, request.onboarding_id, request.idempotency_key, meta, response);
      await insertGrowthProfileDraftedEvent(client, request.family_id, request.onboarding_id, drafts, eventId, occurredAt, meta);
      await storeIdempotencyResponse(client, request.idempotency_key, response);

      return response;
    });
  }

  async getGrowthInsight(familyId: string, onboardingId: string, actorId: string): Promise<GrowthInsightResponse> {
    return this.repository.withTransaction(async (client) => {
      await ensureFamilyExists(client, familyId);
      await assertFamilyManagePermission(client, familyId, actorId);
      await assertActiveOnboarding(client, familyId, onboardingId);
      const summary = await getPerspectiveSummary(client, familyId, onboardingId);
      const drafts = await getGrowthProfileDrafts(client, familyId, onboardingId);
      const confirmedProfiles = await getConfirmedGrowthProfiles(client, familyId, drafts);
      return {
        onboarding_id: onboardingId,
        family_id: familyId,
        parent_profile_drafts: drafts.filter((draft) => draft.profile_scope === 'PARENT_GROWTH_PROFILE'),
        relationship_profile_drafts: drafts.filter((draft) => draft.profile_scope === 'RELATIONSHIP_GROWTH_PROFILE'),
        confirmed_profiles: confirmedProfiles,
        evidence: summary.evidence,
        perspectives: summary.perspectives,
      };
    });
  }

  async confirmGrowthProfile(request: ConfirmGrowthProfileRequest, meta: AuditMeta): Promise<ConfirmGrowthProfileResponse> {
    const requestHash = hashConfirmGrowthProfileRequest(request);

    return this.repository.withTransaction(async (client) => {
      const idempotency = await lockIdempotencyKey<ConfirmGrowthProfileResponse>(client, CONFIRM_GROWTH_PROFILE_ACTION, request.idempotency_key, requestHash);
      if (idempotency.replay) {
        return idempotency.response;
      }

      await ensureFamilyExists(client, request.family_id);
      await assertFamilyManagePermission(client, request.family_id, meta.actor);
      const draft = await getGrowthProfileDraftForUpdate(client, request.family_id, request.draft_id);
      await assertActiveOnboarding(client, request.family_id, draft.onboarding_id);
      await assertGrowthProfileConfirmationPreconditions(client, request.family_id, draft.onboarding_id, meta.actor);
      assertDraftConfirmable(draft);
      await assertDraftSnapshotCurrent(client, draft);
      const previousProfile = await supersedeCurrentProfileDimension(client, draft);
      const profile = await insertConfirmedGrowthProfile(client, draft, previousProfile, meta);
      const confirmedDraft = await markDraftConfirmed(client, draft.draft_id);
      const occurredAt = new Date().toISOString();
      const eventId = randomUUID();
      const response: ConfirmGrowthProfileResponse = { profile, draft: confirmedDraft };

      await insertAudit(client, CONFIRM_GROWTH_PROFILE_ACTION, 'GrowthProfile', request.family_id, profile.profile_id, request.idempotency_key, meta, response);
      await insertGrowthProfileConfirmedEvent(client, request.family_id, profile, draft, eventId, occurredAt, meta);
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
      structured_safety_signals: request.structured_safety_signals,
    }))
    .digest('hex');
}

function hashRecordPerspectiveRequest(request: RecordPerspectiveRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      onboarding_id: request.onboarding_id,
      subject_person_id: request.subject_person_id,
      author_person_id: request.author_person_id,
      perspective_type: request.perspective_type,
      capture_mode: request.capture_mode,
      related_dimension_ids: request.related_dimension_ids,
      content: request.content,
      structured_safety_signals: request.structured_safety_signals,
      expressed_at: request.expressed_at ?? null,
    }))
    .digest('hex');
}

function hashBuildGrowthProfileDraftsRequest(request: BuildGrowthProfileDraftsRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      onboarding_id: request.onboarding_id,
    }))
    .digest('hex');
}

function hashConfirmGrowthProfileRequest(request: ConfirmGrowthProfileRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({
      family_id: request.family_id,
      draft_id: request.draft_id,
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

// 桥接:委托共享 family-permission(创建者 或 ACTIVE OWNER/GUARDIAN 成员)。
async function assertFamilyManagePermission(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
  return sharedAssertFamilyManagePermission(client, familyId, actorId);
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

async function insertGrowthOnboarding(client: pg.PoolClient, request: StartGrowthOnboardingRequest, safetyDisposition: SafetyDispositionDto): Promise<GrowthOnboardingDto> {
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
    safety_disposition: safetyDisposition,
    ai_personalization_enabled: false,
    started_at: row.started_at.toISOString(),
    created_at: row.created_at.toISOString(),
  };
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

async function assertPerspectiveSubjectMatchesOnboarding(client: pg.PoolClient, familyId: string, onboardingId: string, subjectPersonId: string): Promise<void> {
  const result = await client.query<{ child_id: string }>(
    `select payload->>'child_id' as child_id
     from growth_events
     where family_id = $1
       and event_type = $2
       and payload->>'onboarding_id' = $3
     order by occurred_at desc
     limit 1`,
    [familyId, GROWTH_ONBOARDING_STARTED_EVENT, onboardingId],
  );

  if (result.rowCount !== 1 || result.rows[0].child_id !== subjectPersonId) {
    throw new BadRequestException('perspective_subject_must_match_onboarding_child');
  }
}

async function getPerspectivePersons(client: pg.PoolClient, request: RecordPerspectiveRequest): Promise<{ subject: PersonDto; author: PersonDto }> {
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
    [[request.subject_person_id, request.author_person_id]],
  );

  const persons = new Map(result.rows.map((row) => [row.person_id, mapPerson(row)]));
  const subject = persons.get(request.subject_person_id);
  const author = persons.get(request.author_person_id);
  if (!subject) {
    throw new NotFoundException('perspective_subject_not_found');
  }
  if (!author) {
    throw new NotFoundException('perspective_author_not_found');
  }

  return { subject, author };
}

function assertPerspectivePersons(request: RecordPerspectiveRequest, subject: PersonDto, author: PersonDto): void {
  if (subject.family_id !== request.family_id || author.family_id !== request.family_id) {
    throw new BadRequestException('perspective_persons_must_belong_to_family');
  }

  if (request.perspective_type === 'PARENT_PERSPECTIVE' && author.person_type !== 'PARENT') {
    throw new BadRequestException('parent_perspective_author_must_be_parent');
  }

  if (request.perspective_type === 'CHILD_PERSPECTIVE' && author.person_type !== 'CHILD') {
    throw new BadRequestException('child_perspective_author_must_be_child');
  }
}

function assertNormalSafetyDisposition(disposition: SafetyDispositionDto): void {
  if (disposition.severity !== 'LOW' || disposition.disposition !== 'NORMAL') {
    throw new ForbiddenException('human_gate_required_for_safety_signals');
  }
}

async function insertPerspective(
  client: pg.PoolClient,
  request: RecordPerspectiveRequest,
  meta: AuditMeta,
  safetyDisposition: SafetyDispositionDto,
): Promise<PerspectiveDto> {
  const result = await client.query<PerspectiveRow>(
    `insert into perspectives(
       family_id, onboarding_id, subject_person_id, author_person_id, recorded_by_actor_id,
       perspective_type, capture_mode, related_dimension_ids, content, fact_boundary,
       safety_disposition, expressed_at, statement, person_id
     ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, 'PERSPECTIVE_NOT_FACT', $10::jsonb, $11, $12, $3)
     returning perspective_id, family_id, onboarding_id, subject_person_id, author_person_id,
       recorded_by_actor_id, perspective_type, capture_mode, related_dimension_ids, content,
       fact_boundary, safety_disposition, expressed_at, recorded_at, created_at, version`,
    [
      request.family_id,
      request.onboarding_id,
      request.subject_person_id,
      request.author_person_id,
      meta.actor,
      request.perspective_type,
      request.capture_mode,
      JSON.stringify(request.related_dimension_ids),
      JSON.stringify(request.content),
      JSON.stringify(safetyDisposition),
      request.expressed_at ?? null,
      request.content.response_text,
    ],
  );

  return mapPerspective(result.rows[0]);
}

async function insertEvidenceRecord(client: pg.PoolClient, perspective: PerspectiveDto, request: RecordPerspectiveRequest): Promise<EvidenceRecordDto> {
  const payload = {
    perspective_id: perspective.perspective_id,
    fact_boundary: perspective.fact_boundary,
    content: request.content,
    related_dimension_ids: request.related_dimension_ids,
    provenance: {
      subject_person_id: request.subject_person_id,
      author_person_id: request.author_person_id,
      recorded_by_actor_id: perspective.recorded_by_actor_id,
      capture_mode: request.capture_mode,
      perspective_type: request.perspective_type,
    },
  };
  const result = await client.query<EvidenceRecordRow>(
    `insert into evidence_records(family_id, perspective_id, evidence_type, source, evidence_level, source_ref, payload, observed_at)
     values ($1, $2, 'SELF_REPORT', $3, 'E1', ($2::uuid)::text, $4::jsonb, $5)
     returning evidence_id, family_id, perspective_id, evidence_type, source, evidence_level, payload, observed_at, created_at`,
    [perspective.family_id, perspective.perspective_id, perspectiveSource(request), JSON.stringify(payload), request.expressed_at ?? null],
  );

  return mapEvidenceRecord(result.rows[0]);
}

async function getPerspectiveSummary(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<PerspectiveSummaryResponse> {
  const perspectives = await client.query<PerspectiveRow>(
    `select perspective_id, family_id, onboarding_id, subject_person_id, author_person_id,
       recorded_by_actor_id, perspective_type, capture_mode, related_dimension_ids, content,
       fact_boundary, safety_disposition, expressed_at, recorded_at, created_at, version
     from perspectives
     where family_id = $1 and onboarding_id = $2
     order by recorded_at asc`,
    [familyId, onboardingId],
  );
  const evidence = await client.query<EvidenceRecordRow>(
    `select evidence_id, family_id, perspective_id, evidence_type, source, evidence_level, payload, observed_at, created_at
     from evidence_records
     where family_id = $1 and perspective_id = any($2::uuid[])
     order by created_at asc`,
    [familyId, perspectives.rows.map((row) => row.perspective_id)],
  );

  return {
    perspectives: perspectives.rows.map(mapPerspective),
    evidence: evidence.rows.map(mapEvidenceRecord),
  };
}

async function getOnboardingProfileContext(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<{ childId: string; guardianPersonId: string; relationshipId: string }> {
  const event = await client.query<{ child_id: string; guardian_person_id: string }>(
    `select payload->>'child_id' as child_id, payload->>'guardian_person_id' as guardian_person_id
     from growth_events
     where family_id = $1 and event_type = $2 and payload->>'onboarding_id' = $3
     order by occurred_at desc
     limit 1`,
    [familyId, GROWTH_ONBOARDING_STARTED_EVENT, onboardingId],
  );
  const row = event.rows[0];
  if (!row) {
    throw new NotFoundException('growth_onboarding_context_not_found');
  }
  const relationship = await client.query<{ relationship_id: string }>(
    `select relationship_id
     from family_relationships
     where family_id = $1
       and person_a_id = $2
       and person_b_id = $3
       and relationship_type in ('PARENT_CHILD', 'GUARDIAN_CHILD')
     order by created_at asc
     limit 1`,
    [familyId, row.guardian_person_id, row.child_id],
  );
  if (relationship.rowCount !== 1) {
    throw new NotFoundException('growth_profile_relationship_not_found');
  }
  return { childId: row.child_id, guardianPersonId: row.guardian_person_id, relationshipId: relationship.rows[0].relationship_id };
}

async function insertGrowthProfileDrafts(
  client: pg.PoolClient,
  request: BuildGrowthProfileDraftsRequest,
  synthesis: EvidenceSynthesisDto[],
  evidenceSnapshot: EvidenceSnapshotDto,
): Promise<GrowthProfileDraftDto[]> {
  const drafts: GrowthProfileDraftDto[] = [];
  for (const item of synthesis) {
    const itemEvidenceSnapshot: EvidenceSnapshotDto = {
      evidence_ids: item.supporting_evidence_ids,
      perspective_versions: evidenceSnapshot.perspective_versions,
    };
    const result = await client.query<GrowthProfileDraftRow>(
      `insert into growth_profile_drafts(
         family_id, onboarding_id, profile_scope, subject_type, subject_person_id,
         subject_relationship_id, dimension_id, candidate_state, qualitative_confidence,
         synthesis, evidence_snapshot, policy_version, status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13)
       returning draft_id, family_id, onboarding_id, profile_scope, subject_type, subject_person_id,
         subject_relationship_id, dimension_id, candidate_state, qualitative_confidence,
         synthesis, evidence_snapshot, policy_version, status, created_at`,
      [
        request.family_id,
        request.onboarding_id,
        item.profile_scope,
        item.subject_type,
        item.subject_person_id,
        item.subject_relationship_id,
        item.dimension_id,
        item.candidate_state,
        item.confidence,
        JSON.stringify(item),
        JSON.stringify(itemEvidenceSnapshot),
        item.policy_version,
        item.candidate_state === 'UNRESOLVED' ? 'REVIEW_REQUIRED' : 'DRAFT',
      ],
    );
    drafts.push(mapGrowthProfileDraft(result.rows[0]));
  }
  return drafts;
}

async function getGrowthProfileDrafts(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<GrowthProfileDraftDto[]> {
  const result = await client.query<GrowthProfileDraftRow>(
    `select draft_id, family_id, onboarding_id, profile_scope, subject_type, subject_person_id,
       subject_relationship_id, dimension_id, candidate_state, qualitative_confidence,
       synthesis, evidence_snapshot, policy_version, status, created_at
     from growth_profile_drafts
     where family_id = $1 and onboarding_id = $2
     order by created_at desc, dimension_id asc`,
    [familyId, onboardingId],
  );
  return result.rows.map(mapGrowthProfileDraft);
}

async function getGrowthProfileDraftForUpdate(client: pg.PoolClient, familyId: string, draftId: string): Promise<GrowthProfileDraftDto> {
  const result = await client.query<GrowthProfileDraftRow>(
    `select draft_id, family_id, onboarding_id, profile_scope, subject_type, subject_person_id,
       subject_relationship_id, dimension_id, candidate_state, qualitative_confidence,
       synthesis, evidence_snapshot, policy_version, status, created_at
     from growth_profile_drafts
     where family_id = $1 and draft_id = $2
     for update`,
    [familyId, draftId],
  );
  if (result.rowCount !== 1) {
    throw new NotFoundException('growth_profile_draft_not_found');
  }
  return mapGrowthProfileDraft(result.rows[0]);
}

function assertDraftConfirmable(draft: GrowthProfileDraftDto): void {
  if (draft.status !== 'DRAFT') {
    throw new ConflictException(`growth_profile_draft_not_confirmable:${draft.status}`);
  }
  if (draft.candidate_state === 'UNRESOLVED') {
    throw new ConflictException('unresolved_growth_profile_draft_cannot_be_confirmed');
  }
}

async function assertGrowthProfileConfirmationPreconditions(client: pg.PoolClient, familyId: string, onboardingId: string, actorId: string): Promise<void> {
  const context = await getOnboardingProfileContext(client, familyId, onboardingId);
  const persons = await getOnboardingContextPersons(client, familyId, context.guardianPersonId, context.childId);
  assertActorIsGuardian(persons.guardian, actorId);
  await assertOnboardingGuardianAuthorized(
    client,
    {
      family_id: familyId,
      guardian_person_id: context.guardianPersonId,
      child_id: context.childId,
      structured_safety_signals: ['NONE'],
      idempotency_key: 'confirm-growth-profile-precondition',
    },
    persons.guardian,
    persons.child,
  );
  await assertRequiredGrowthConsents(client, familyId, context.childId);
}

async function getOnboardingContextPersons(client: pg.PoolClient, familyId: string, guardianPersonId: string, childId: string): Promise<{ guardian: PersonDto; child: PersonDto }> {
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
     where family_id = $1 and person_id = any($2::uuid[])
     for share`,
    [familyId, [guardianPersonId, childId]],
  );
  const persons = new Map(result.rows.map((row) => [row.person_id, mapPerson(row)]));
  const guardian = persons.get(guardianPersonId);
  const child = persons.get(childId);
  if (!guardian) {
    throw new NotFoundException('guardian_not_found');
  }
  if (!child) {
    throw new NotFoundException('child_not_found');
  }
  return { guardian, child };
}

async function assertDraftSnapshotCurrent(client: pg.PoolClient, draft: GrowthProfileDraftDto): Promise<void> {
  if (draft.evidence_snapshot.perspective_versions.length === 0) {
    return;
  }
  const result = await client.query<{ perspective_id: string; version: number }>(
    `select perspective_id, version
     from perspectives
     where perspective_id = any($1::uuid[])`,
    [draft.evidence_snapshot.perspective_versions.map((item) => item.perspective_id)],
  );
  const current = new Map(result.rows.map((row) => [row.perspective_id, row.version]));
  const stale = draft.evidence_snapshot.perspective_versions.some((item) => current.get(item.perspective_id) !== item.version);
  if (stale || result.rowCount !== draft.evidence_snapshot.perspective_versions.length) {
    await markDraftStale(client, draft.draft_id);
    throw new ConflictException('growth_profile_draft_stale');
  }
}

async function supersedeCurrentProfileDimension(client: pg.PoolClient, draft: GrowthProfileDraftDto): Promise<GrowthProfileVersionAnchor | null> {
  const current = await client.query<GrowthProfileVersionAnchor>(
    `select gp.profile_id, gp.version
     from growth_profiles gp
     join growth_profile_dimensions gpd on gpd.profile_id = gp.profile_id
     where gp.family_id = $1
       and gp.profile_scope = $2
       and coalesce(gp.subject_person_id::text, '') = coalesce($3::uuid::text, '')
       and coalesce(gp.subject_relationship_id::text, '') = coalesce($4::uuid::text, '')
       and gpd.dimension_id = $5
       and gp.status = 'WORKING'
       and gp.effective_to is null
     order by gp.effective_from desc
     limit 1
     for update`,
    [draft.family_id, draft.profile_scope, draft.subject_person_id, draft.subject_relationship_id, draft.dimension_id],
  );
  const previousProfile = current.rows[0] ?? null;
  if (!previousProfile) {
    return null;
  }

  await client.query(
    `update growth_profiles gp
     set status = 'SUPERSEDED', effective_to = now()
     where gp.profile_id = $1
       and gp.family_id = $2
       and gp.status = 'WORKING'
       and gp.effective_to is null`,
    [previousProfile.profile_id, draft.family_id],
  );
  return previousProfile;
}

async function insertConfirmedGrowthProfile(client: pg.PoolClient, draft: GrowthProfileDraftDto, previousProfile: GrowthProfileVersionAnchor | null, meta: AuditMeta): Promise<GrowthProfileDto> {
  const state = draft.candidate_state;
  if (state === 'UNRESOLVED') {
    throw new ConflictException('unresolved_growth_profile_draft_cannot_be_confirmed');
  }
  const version = previousProfile ? previousProfile.version + 1 : 1;
  const profile = await client.query<GrowthProfileRow>(
    `insert into growth_profiles(
       family_id, subject_type, subject_ref_id, life_stage_code, confidence, version,
       effective_from, profile_scope, subject_person_id, subject_relationship_id, status,
       basis, evidence_snapshot, policy_version, confirmed_by_actor_id, confirmed_at,
       previous_profile_id
     ) values ($1, $2, $3, 'EARLY_ADOLESCENCE_12_15', $4, $5, now(), $6, $7, $8,
       'WORKING', $9::jsonb, $10::jsonb, $11, $12, now(), $13)
     returning profile_id, family_id, profile_scope, subject_type, subject_person_id,
       subject_relationship_id, status, basis, evidence_snapshot, policy_version,
       confirmed_by_actor_id, confirmed_at, effective_from, effective_to, previous_profile_id,
       created_at, version`,
    [
      draft.family_id,
      draft.subject_type,
      draft.subject_person_id ?? draft.subject_relationship_id,
      numericConfidence(draft.confidence),
      version,
      draft.profile_scope,
      draft.subject_person_id,
      draft.subject_relationship_id,
      JSON.stringify(draft.synthesis),
      JSON.stringify(draft.evidence_snapshot),
      draft.policy_version,
      meta.actor,
      previousProfile?.profile_id ?? null,
    ],
  );
  await client.query(
    `insert into growth_profile_dimensions(
       profile_id, dimension_id, state, evidence_ids, confidence,
       qualitative_confidence, synthesis, evidence_snapshot, policy_version
     ) values ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8::jsonb, $9)`,
    [
      profile.rows[0].profile_id,
      draft.dimension_id,
      state,
      JSON.stringify(draft.evidence_snapshot.evidence_ids),
      numericConfidence(draft.confidence),
      draft.confidence,
      JSON.stringify(draft.synthesis),
      JSON.stringify(draft.evidence_snapshot),
      draft.policy_version,
    ],
  );
  return mapGrowthProfile(profile.rows[0], draft.dimension_id, state, draft.confidence);
}

async function markDraftConfirmed(client: pg.PoolClient, draftId: string): Promise<GrowthProfileDraftDto> {
  const result = await client.query<GrowthProfileDraftRow>(
    `update growth_profile_drafts
     set status = 'CONFIRMED'
     where draft_id = $1
     returning draft_id, family_id, onboarding_id, profile_scope, subject_type, subject_person_id,
       subject_relationship_id, dimension_id, candidate_state, qualitative_confidence,
       synthesis, evidence_snapshot, policy_version, status, created_at`,
    [draftId],
  );
  return mapGrowthProfileDraft(result.rows[0]);
}

async function markDraftStale(client: pg.PoolClient, draftId: string): Promise<void> {
  await client.query(`update growth_profile_drafts set status = 'STALE' where draft_id = $1`, [draftId]);
}

async function getConfirmedGrowthProfiles(client: pg.PoolClient, familyId: string, drafts: GrowthProfileDraftDto[]): Promise<GrowthProfileDto[]> {
  if (drafts.length === 0) {
    return [];
  }
  const result = await client.query<GrowthProfileRow & { dimension_id: M2GrowthDimensionId; state: GrowthProfileDto['state']; qualitative_confidence: GrowthProfileDto['confidence'] }>(
    `select gp.profile_id, gp.family_id, gp.profile_scope, gp.subject_type, gp.subject_person_id,
       gp.subject_relationship_id, gp.status, gp.basis, gp.evidence_snapshot, gp.policy_version,
       gp.confirmed_by_actor_id, gp.confirmed_at, gp.effective_from, gp.effective_to,
       gp.previous_profile_id, gp.created_at, gp.version, gpd.dimension_id, gpd.state, gpd.qualitative_confidence
     from growth_profiles gp
     join growth_profile_dimensions gpd on gpd.profile_id = gp.profile_id
     where gp.family_id = $1 and gp.status = 'WORKING'
       and exists (
         select 1
         from jsonb_array_elements($2::jsonb) scope(item)
         where scope.item->>'profile_scope' = gp.profile_scope
           and coalesce(scope.item->>'subject_person_id', '') = coalesce(gp.subject_person_id::text, '')
           and coalesce(scope.item->>'subject_relationship_id', '') = coalesce(gp.subject_relationship_id::text, '')
           and scope.item->>'dimension_id' = gpd.dimension_id
       )
     order by gp.effective_from desc`,
    [familyId, JSON.stringify(drafts.map((draft) => ({
      profile_scope: draft.profile_scope,
      subject_person_id: draft.subject_person_id,
      subject_relationship_id: draft.subject_relationship_id,
      dimension_id: draft.dimension_id,
    })))],
  );
  return result.rows.map((row) => mapGrowthProfile(row, row.dimension_id, row.state, row.qualitative_confidence));
}

interface GrowthProfileVersionAnchor {
  profile_id: string;
  version: number;
}

function numericConfidence(confidence: GrowthProfileDraftDto['confidence']): number {
  if (confidence === 'HIGH') {
    return 0.75;
  }
  if (confidence === 'MEDIUM') {
    return 0.5;
  }
  return 0.25;
}

interface GrowthProfileDraftRow {
  draft_id: string;
  family_id: string;
  onboarding_id: string;
  profile_scope: GrowthProfileDraftDto['profile_scope'];
  subject_type: GrowthProfileDraftDto['subject_type'];
  subject_person_id: string | null;
  subject_relationship_id: string | null;
  dimension_id: M2GrowthDimensionId;
  candidate_state: GrowthProfileDraftDto['candidate_state'];
  qualitative_confidence: GrowthProfileDraftDto['confidence'];
  synthesis: EvidenceSynthesisDto;
  evidence_snapshot: EvidenceSnapshotDto;
  policy_version: GrowthProfileDraftDto['policy_version'];
  status: GrowthProfileDraftDto['status'];
  created_at: Date;
}

function mapGrowthProfileDraft(row: GrowthProfileDraftRow): GrowthProfileDraftDto {
  return {
    draft_id: row.draft_id,
    family_id: row.family_id,
    onboarding_id: row.onboarding_id,
    profile_scope: row.profile_scope,
    subject_type: row.subject_type,
    subject_person_id: row.subject_person_id,
    subject_relationship_id: row.subject_relationship_id,
    dimension_id: row.dimension_id,
    candidate_state: row.candidate_state,
    confidence: row.qualitative_confidence,
    synthesis: row.synthesis,
    evidence_snapshot: row.evidence_snapshot,
    policy_version: row.policy_version,
    status: row.status,
    created_at: row.created_at.toISOString(),
  };
}

interface GrowthProfileRow {
  profile_id: string;
  family_id: string;
  profile_scope: GrowthProfileDto['profile_scope'];
  subject_type: GrowthProfileDto['subject_type'];
  subject_person_id: string | null;
  subject_relationship_id: string | null;
  status: GrowthProfileDto['status'];
  basis: EvidenceSynthesisDto;
  evidence_snapshot: EvidenceSnapshotDto;
  policy_version: GrowthProfileDto['policy_version'];
  confirmed_by_actor_id: string;
  confirmed_at: Date;
  effective_from: Date;
  effective_to: Date | null;
  previous_profile_id: string | null;
  created_at: Date;
  version: number;
}

function mapGrowthProfile(row: GrowthProfileRow, dimensionId: M2GrowthDimensionId, state: GrowthProfileDto['state'], confidence: GrowthProfileDto['confidence']): GrowthProfileDto {
  return {
    profile_id: row.profile_id,
    family_id: row.family_id,
    profile_scope: row.profile_scope,
    subject_type: row.subject_type,
    subject_person_id: row.subject_person_id,
    subject_relationship_id: row.subject_relationship_id,
    dimension_id: dimensionId,
    state,
    confidence,
    status: row.status,
    version: row.version,
    basis: row.basis,
    evidence_snapshot: row.evidence_snapshot,
    policy_version: row.policy_version,
    confirmed_by_actor_id: row.confirmed_by_actor_id,
    confirmed_at: row.confirmed_at.toISOString(),
    effective_from: row.effective_from.toISOString(),
    effective_to: row.effective_to ? row.effective_to.toISOString() : null,
    previous_profile_id: row.previous_profile_id,
    created_at: row.created_at.toISOString(),
  };
}

function perspectiveSource(request: RecordPerspectiveRequest): EvidenceRecordDto['source'] {
  if (request.perspective_type === 'PARENT_PERSPECTIVE') {
    return 'PARENT';
  }
  return 'CHILD';
}

interface PerspectiveRow {
  perspective_id: string;
  family_id: string;
  onboarding_id: string;
  subject_person_id: string;
  author_person_id: string;
  recorded_by_actor_id: string;
  perspective_type: PerspectiveDto['perspective_type'];
  capture_mode: PerspectiveDto['capture_mode'];
  related_dimension_ids: PerspectiveDto['related_dimension_ids'];
  content: PerspectiveDto['content'];
  fact_boundary: PerspectiveDto['fact_boundary'];
  safety_disposition: SafetyDispositionDto;
  expressed_at: Date | null;
  recorded_at: Date;
  created_at: Date;
  version: number;
}

function mapPerspective(row: PerspectiveRow): PerspectiveDto {
  return {
    perspective_id: row.perspective_id,
    family_id: row.family_id,
    onboarding_id: row.onboarding_id,
    subject_person_id: row.subject_person_id,
    author_person_id: row.author_person_id,
    recorded_by_actor_id: row.recorded_by_actor_id,
    perspective_type: row.perspective_type,
    capture_mode: row.capture_mode,
    related_dimension_ids: row.related_dimension_ids,
    content: row.content,
    fact_boundary: row.fact_boundary,
    safety_disposition: row.safety_disposition,
    expressed_at: row.expressed_at ? row.expressed_at.toISOString() : null,
    recorded_at: row.recorded_at.toISOString(),
    created_at: row.created_at.toISOString(),
    version: row.version,
  };
}

interface EvidenceRecordRow {
  evidence_id: string;
  family_id: string;
  perspective_id: string;
  evidence_type: EvidenceRecordDto['evidence_type'];
  source: EvidenceRecordDto['source'];
  evidence_level: EvidenceRecordDto['evidence_level'];
  payload: Record<string, unknown>;
  observed_at: Date | null;
  created_at: Date;
}

function mapEvidenceRecord(row: EvidenceRecordRow): EvidenceRecordDto {
  return {
    evidence_id: row.evidence_id,
    family_id: row.family_id,
    perspective_id: row.perspective_id,
    evidence_type: row.evidence_type,
    source: row.source,
    evidence_level: row.evidence_level,
    payload: row.payload,
    observed_at: row.observed_at ? row.observed_at.toISOString() : null,
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
        safety_disposition: onboarding.safety_disposition,
        ai_personalization_enabled: onboarding.ai_personalization_enabled,
      }),
    ],
  );
}

async function insertPerspectiveRecordedEvent(
  client: pg.PoolClient,
  familyId: string,
  perspective: PerspectiveDto,
  evidence: EvidenceRecordDto,
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
      PERSPECTIVE_RECORDED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        onboarding_id: perspective.onboarding_id,
        perspective_id: perspective.perspective_id,
        evidence_id: evidence.evidence_id,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        perspective,
        evidence,
      }),
      occurredAt,
    ],
  );
}

async function insertGrowthProfileDraftedEvent(
  client: pg.PoolClient,
  familyId: string,
  onboardingId: string,
  drafts: GrowthProfileDraftDto[],
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
      GROWTH_PROFILE_DRAFTED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        onboarding_id: onboardingId,
        draft_ids: drafts.map((draft) => draft.draft_id),
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        drafts,
      }),
      occurredAt,
    ],
  );
}

async function insertGrowthProfileConfirmedEvent(
  client: pg.PoolClient,
  familyId: string,
  profile: GrowthProfileDto,
  draft: GrowthProfileDraftDto,
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
      'GrowthProfile',
      familyId,
      GROWTH_PROFILE_CONFIRMED_EVENT,
      1,
      eventId,
      meta.correlationId,
      JSON.stringify({
        event_id: eventId,
        family_id: familyId,
        onboarding_id: draft.onboarding_id,
        draft_id: draft.draft_id,
        profile_id: profile.profile_id,
        occurred_at: occurredAt,
        actor_id: meta.actor,
        correlation_id: meta.correlationId,
        metadata: {
          source: meta.source,
          schema_version: '0.1',
        },
        profile,
        draft,
      }),
      occurredAt,
    ],
  );
}