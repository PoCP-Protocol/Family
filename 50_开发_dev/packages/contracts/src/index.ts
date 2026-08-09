/**
 * @family/contracts — 共享类型与枚举(实现级契约的 TS 落地起点)。
 * 权威来源:../../specs/ontology/*.schema.yaml 与 ../../database/schema_v0_1.sql。
 * 后续可由 specs 自动生成;此处先手工承载 M1 Family Core 所需最小集合。
 */

export type FamilyStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type PersonType = 'PARENT' | 'CHILD';
export type ParentRole = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER_GUARDIAN';
export type RelationshipType =
  | 'PARENT_CHILD'
  | 'SPOUSE'
  | 'SIBLING'
  | 'GUARDIAN_CHILD'
  | 'OTHER';
export type LifeStageCode = 'EARLY_ADOLESCENCE_12_15';
export type ConsentPurpose =
  | 'SERVICE'
  | 'ASSESSMENT'
  | 'AI_PERSONALIZATION'
  | 'GROWTH_TRACKING'
  | 'EXPERT_SERVICE'
  | 'RESEARCH'
  | 'MODEL_IMPROVEMENT'
  | 'CONTENT_PUBLICATION';
export type ConsentStatus = 'GRANTED' | 'WITHDRAWN' | 'EXPIRED';
export type GrowthDomain = 'CHILD' | 'PARENT' | 'RELATIONSHIP';
export type SafetyScreeningResult = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type GrowthOnboardingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type GrowthOnboardingPhase = 'ONBOARDING';
export type M2GrowthDimensionId = 'P03' | 'R03' | 'R04' | 'R05';
export type PerspectiveType = 'PARENT_PERSPECTIVE' | 'CHILD_PERSPECTIVE';
export type PerspectiveCaptureMode = 'DIRECT_SELF_REPORT' | 'FACILITATED_ENTRY' | 'PROXY_REPORTED';
export type PerspectiveFactBoundary = 'PERSPECTIVE_NOT_FACT';
export type EvidenceType = 'SELF_REPORT';
export type EvidenceSource = 'PARENT' | 'CHILD' | 'SYSTEM';
export type EvidenceLevel = 'E1';
export type StructuredSafetySignal = 'NONE' | 'SELF_HARM' | 'HARM_TO_OTHERS' | 'ABUSE' | 'VIOLENCE' | 'SEVERE_CRISIS';
export type SafetyDisposition = 'NORMAL' | 'HUMAN_REVIEW' | 'SAFETY_ESCALATION';
export type SafetyPolicyVersion = 'M2_102_DETERMINISTIC_V1';

export interface FamilyDto {
  family_id: string;
  display_name: string;
  status: FamilyStatus;
  primary_contact_person_id: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface PersonDto {
  person_id: string;
  family_id: string;
  person_type: PersonType;
  parent_role: ParentRole | null;
  display_name: string;
  birth_date: string | null;
  account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyRelationshipDto {
  relationship_id: string;
  family_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: RelationshipType;
  created_at: string;
}

export interface LifeStageAssignmentDto {
  assignment_id: string;
  family_id: string;
  child_id: string;
  life_stage_code: LifeStageCode;
  effective_from: string;
  effective_to: string | null;
  source: string;
  created_at: string;
}

export interface ConsentDto {
  consent_id: string;
  family_id: string;
  subject_person_id: string;
  guardian_person_id: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  policy_version: string;
  granted_at: string;
  withdrawn_at: string | null;
  created_at: string;
}

export interface CreateFamilyRequest {
  display_name: string;
  primary_contact_account_id?: string;
  idempotency_key: string;
}

export interface CreateFamilyResponse {
  family: FamilyDto;
}

export interface AddParentRequest {
  family_id: string;
  role: ParentRole;
  display_name: string;
  account_id?: string;
  idempotency_key: string;
}

export interface AddParentResponse {
  parent: PersonDto;
}

export interface AddChildRequest {
  family_id: string;
  display_name: string;
  birth_date?: string;
  idempotency_key: string;
}

export interface AddChildResponse {
  child: PersonDto;
}

export interface CreateFamilyRelationshipRequest {
  family_id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: RelationshipType;
  idempotency_key: string;
}

export interface CreateFamilyRelationshipResponse {
  relationship: FamilyRelationshipDto;
}

export interface AssignLifeStageRequest {
  family_id: string;
  child_id: string;
  life_stage_code: LifeStageCode;
  effective_from: string;
  idempotency_key: string;
}

export interface AssignLifeStageResponse {
  assignment: LifeStageAssignmentDto;
}

export interface GrantConsentRequest {
  family_id: string;
  subject_person_id: string;
  guardian_person_id: string;
  purpose: ConsentPurpose;
  policy_version: string;
  idempotency_key: string;
}

export interface GrantConsentResponse {
  consent: ConsentDto;
}

export interface FamilyAggregateResponse {
  family: FamilyDto;
  members: PersonDto[];
  relationships: FamilyRelationshipDto[];
  lifeStages: LifeStageAssignmentDto[];
  consents: ConsentDto[];
}

export interface StartGrowthOnboardingRequest {
  family_id: string;
  child_id: string;
  guardian_person_id: string;
  safety_screening_result: SafetyScreeningResult;
  idempotency_key: string;
}

export interface GrowthOnboardingDto {
  onboarding_id: string;
  family_id: string;
  child_id: string;
  guardian_person_id: string;
  journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT';
  life_stage_code: LifeStageCode;
  target_dimensions: ['P03', 'R03', 'R04', 'R05'];
  status: GrowthOnboardingStatus;
  phase: GrowthOnboardingPhase;
  safety_screening_result: SafetyScreeningResult;
  ai_personalization_enabled: false;
  started_at: string;
  created_at: string;
}

export interface StartGrowthOnboardingResponse {
  onboarding: GrowthOnboardingDto;
}

export interface PerspectiveContentDto {
  prompt_id: string;
  response_text: string;
  selected_signals: string[];
}

export interface RecordPerspectiveRequest {
  family_id: string;
  onboarding_id: string;
  subject_person_id: string;
  author_person_id: string;
  perspective_type: PerspectiveType;
  capture_mode: PerspectiveCaptureMode;
  related_dimension_ids: M2GrowthDimensionId[];
  content: PerspectiveContentDto;
  structured_safety_signals: StructuredSafetySignal[];
  expressed_at?: string;
  idempotency_key: string;
}

export interface SafetyDispositionDto {
  severity: SafetyScreeningResult;
  disposition: SafetyDisposition;
  policy_version: SafetyPolicyVersion;
  signals: StructuredSafetySignal[];
}

export interface PerspectiveDto {
  perspective_id: string;
  family_id: string;
  onboarding_id: string;
  subject_person_id: string;
  author_person_id: string;
  recorded_by_actor_id: string;
  perspective_type: PerspectiveType;
  capture_mode: PerspectiveCaptureMode;
  related_dimension_ids: M2GrowthDimensionId[];
  content: PerspectiveContentDto;
  fact_boundary: PerspectiveFactBoundary;
  safety_disposition: SafetyDispositionDto;
  expressed_at: string | null;
  recorded_at: string;
  created_at: string;
  version: number;
}

export interface EvidenceRecordDto {
  evidence_id: string;
  family_id: string;
  perspective_id: string;
  evidence_type: EvidenceType;
  source: EvidenceSource;
  evidence_level: EvidenceLevel;
  payload: Record<string, unknown>;
  observed_at: string | null;
  created_at: string;
}

export interface RecordPerspectiveResponse {
  perspective: PerspectiveDto;
  evidence: EvidenceRecordDto;
  safety_disposition: SafetyDispositionDto;
}

export interface PerspectiveSummaryResponse {
  perspectives: PerspectiveDto[];
  evidence: EvidenceRecordDto[];
}

export type GrowthState = 'EMERGING' | 'DEVELOPING' | 'PRACTICING' | 'STABILIZING';
export type GrowthProfileCandidateState = GrowthState | 'UNRESOLVED';
export type GrowthProfileScope = 'PARENT_GROWTH_PROFILE' | 'RELATIONSHIP_GROWTH_PROFILE';
export type GrowthProfileSubjectType = 'PARENT' | 'RELATIONSHIP';
export type GrowthProfileStatus = 'WORKING' | 'REVIEW_REQUIRED' | 'SUPERSEDED';
export type ProfileDraftStatus = 'DRAFT' | 'REVIEW_REQUIRED' | 'STALE' | 'CONFIRMED';
export type AgreementLevel = 'ALIGNED' | 'PARTIAL' | 'DIVERGENT' | 'INSUFFICIENT';
export type ProfileConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProfileSynthesisPolicyVersion = 'M2_103_DETERMINISTIC_V1';
export type GrowthProfileFactBoundary = 'PROFILE_IS_INTERPRETIVE_NOT_FACT';
export type ProfileLimitation =
  | 'INSUFFICIENT_EVIDENCE'
  | 'SELF_REPORT_ONLY'
  | 'PERSPECTIVE_DIVERGENCE'
  | 'SAFETY_ESCALATION_EXCLUDED'
  | 'PROXY_CHILD_PERSPECTIVE'
  | 'NO_CHILD_PERSPECTIVE';

export interface PerspectiveCoverageDto {
  parent_perspective_count: number;
  child_perspective_count: number;
  proxy_child_perspective_count: number;
}

export interface EvidenceGradeCoverageDto {
  E1: number;
}

export interface EvidenceSynthesisDto {
  dimension_id: M2GrowthDimensionId;
  fact_boundary: GrowthProfileFactBoundary;
  profile_scope: GrowthProfileScope;
  subject_type: GrowthProfileSubjectType;
  subject_person_id: string | null;
  subject_relationship_id: string | null;
  supporting_evidence_ids: string[];
  contradicting_evidence_ids: string[];
  perspective_coverage: PerspectiveCoverageDto;
  evidence_grade_coverage: EvidenceGradeCoverageDto;
  agreement_level: AgreementLevel;
  confidence: ProfileConfidence;
  candidate_state: GrowthProfileCandidateState;
  limitations: ProfileLimitation[];
  policy_version: ProfileSynthesisPolicyVersion;
}

export interface EvidenceSnapshotDto {
  evidence_ids: string[];
  perspective_versions: Array<{
    perspective_id: string;
    version: number;
  }>;
}

export interface GrowthProfileDraftDto {
  draft_id: string;
  family_id: string;
  onboarding_id: string;
  profile_scope: GrowthProfileScope;
  subject_type: GrowthProfileSubjectType;
  subject_person_id: string | null;
  subject_relationship_id: string | null;
  dimension_id: M2GrowthDimensionId;
  candidate_state: GrowthProfileCandidateState;
  confidence: ProfileConfidence;
  synthesis: EvidenceSynthesisDto;
  evidence_snapshot: EvidenceSnapshotDto;
  policy_version: ProfileSynthesisPolicyVersion;
  status: ProfileDraftStatus;
  created_at: string;
}

export interface GrowthProfileDto {
  profile_id: string;
  family_id: string;
  profile_scope: GrowthProfileScope;
  subject_type: GrowthProfileSubjectType;
  subject_person_id: string | null;
  subject_relationship_id: string | null;
  dimension_id: M2GrowthDimensionId;
  state: GrowthState;
  confidence: ProfileConfidence;
  status: GrowthProfileStatus;
  version: number;
  basis: EvidenceSynthesisDto;
  evidence_snapshot: EvidenceSnapshotDto;
  policy_version: ProfileSynthesisPolicyVersion;
  confirmed_by_actor_id: string;
  confirmed_at: string;
  effective_from: string;
  effective_to: string | null;
  previous_profile_id: string | null;
  created_at: string;
}

export interface BuildGrowthProfileDraftsRequest {
  family_id: string;
  onboarding_id: string;
  idempotency_key: string;
}

export interface BuildGrowthProfileDraftsResponse {
  drafts: GrowthProfileDraftDto[];
}

export interface GrowthInsightResponse {
  onboarding_id: string;
  family_id: string;
  parent_profile_drafts: GrowthProfileDraftDto[];
  relationship_profile_drafts: GrowthProfileDraftDto[];
  confirmed_profiles: GrowthProfileDto[];
  evidence: EvidenceRecordDto[];
  perspectives: PerspectiveDto[];
}

export interface ConfirmGrowthProfileRequest {
  family_id: string;
  draft_id: string;
  idempotency_key: string;
}

export interface ConfirmGrowthProfileResponse {
  profile: GrowthProfileDto;
  draft: GrowthProfileDraftDto;
}

/** 审计元数据:每个关键写 Action 必带(CLAUDE C06)。 */
export interface AuditMeta {
  actor: string;
  correlationId: string;
  source: string;
  occurredAt: string;
}

export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
  time: string;
}
