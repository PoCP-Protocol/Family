/**
 * @family/contracts — 共享类型与枚举(实现级契约的 TS 落地起点)。
 * 权威来源:../../specs/ontology/*.schema.yaml 与 ../../database/schema_v0_1.sql。
 * 后续可由 specs 自动生成;此处先手工承载 M1 Family Core 所需最小集合。
 */

// Growth Orchestration V3 运行时契约(FAMILY-GROWTH-VERTICAL-SLICE-001;禁语义别名)。
export * from './orchestration';
export * from './ui01-ui09-first-slice';

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
  structured_safety_signals: StructuredSafetySignal[];
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
  safety_disposition: SafetyDispositionDto;
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

export type GrowthPriorityPolicyVersion = 'M2_104_DETERMINISTIC_V2';
export type GrowthPriorityStatus = 'ACTIVE' | 'SUPERSEDED';
export type GrowthPriorityDecision = M2GrowthDimensionId | 'NO_PRIORITY_YET';
export type GrowthPriorityEligibility = 'ELIGIBLE' | 'REVIEW_REQUIRED' | 'NO_PRIORITY_YET';
export type GrowthPriorityBoundary = 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS';
export type GrowthPriorityReasonCode =
  | 'RECENTLY_CONFIRMED_PROFILE'
  | 'PRACTICE_READY'
  | 'PROFILE_UNRESOLVED'
  | 'PROFILE_UNCONFIRMED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'PERSPECTIVE_DIVERGENCE'
  | 'SAFETY_NOT_ELIGIBLE'
  | 'CONSENT_NOT_ACTIVE';
export type GrowthPriorityLimitation =
  | 'PROFILE_REQUIRED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'PERSPECTIVE_DIVERGENCE'
  | 'STALE_PROFILE'
  | 'SAFETY_BLOCKED'
  | 'CONSENT_REQUIRED';

export interface GrowthPriorityCandidateDto {
  dimension_id: M2GrowthDimensionId;
  profile_id: string;
  profile_version: number;
  state_snapshot: GrowthState;
  reason_codes: GrowthPriorityReasonCode[];
  evidence_summary: {
    supporting_evidence_count: number;
    limitations: ProfileLimitation[];
    agreement_level: AgreementLevel;
    confidence: ProfileConfidence;
  };
  eligibility: GrowthPriorityEligibility;
  boundary: GrowthPriorityBoundary;
  why: string;
  expected_change: string;
  limitations: GrowthPriorityLimitation[];
  policy_version: GrowthPriorityPolicyVersion;
  created_at: string;
}

export interface GrowthPriorityDraftDto {
  draft_id: string;
  family_id: string;
  onboarding_id: string;
  decision: GrowthPriorityDecision;
  candidate: GrowthPriorityCandidateDto | null;
  profile_refs: Array<{
    profile_id: string;
    version: number;
    dimension_id: M2GrowthDimensionId;
  }>;
  evidence_refs: string[];
  confidence: ProfileConfidence;
  policy_version: GrowthPriorityPolicyVersion;
  profile_snapshot: Record<string, unknown>;
  created_at: string;
}

export interface GrowthPriorityDto {
  priority_id: string;
  family_id: string;
  onboarding_id: string;
  profile_id: string;
  dimension_id: M2GrowthDimensionId;
  status: GrowthPriorityStatus;
  version: number;
  boundary: GrowthPriorityBoundary;
  reason_codes: GrowthPriorityReasonCode[];
  evidence_refs: string[];
  policy_version: GrowthPriorityPolicyVersion;
  confirmed_by_actor_id: string;
  confirmed_at: string;
  superseded_at: string | null;
  previous_priority_id: string | null;
  created_at: string;
}

export interface GrowthPriorityInsightResponse {
  onboarding_id: string;
  family_id: string;
  draft: GrowthPriorityDraftDto;
  active_priority: GrowthPriorityDto | null;
}

export interface ConfirmGrowthPriorityRequest {
  family_id: string;
  onboarding_id: string;
  draft_id: string;
  decision: GrowthPriorityDecision;
  idempotency_key: string;
}

export interface ConfirmGrowthPriorityResponse {
  priority: GrowthPriorityDto | null;
  decision: GrowthPriorityDecision;
  draft: GrowthPriorityDraftDto;
}

export type InterventionCode = 'LISTEN_BEFORE_RESPOND';
export type InterventionId = 'INTERVENTION-001';
export type InterventionPolicyVersion = 'M2_105_DETERMINISTIC_V1';
export type InterventionEpisodeStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type GrowthActionStatus = 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'NOT_COMPLETED';
export type GrowthActionBoundary = 'ACTION_IS_NOT_OUTCOME';
export type ReflectionBoundary = 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME';

export interface InterventionCardDto {
  intervention_id: InterventionId;
  intervention_code: InterventionCode;
  name_zh: '先听后回应';
  duration_days: 7;
  why: string;
  target: string;
  behavior: string;
  applicability: string[];
  contraindications: string[];
  safety_notes: string[];
  expected_mediator: string;
  expected_outcome: string;
  action_template: string;
  policy_version: InterventionPolicyVersion;
}

export interface InterventionEpisodeDto {
  episode_id: string;
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  intervention_id: InterventionId;
  intervention_code: InterventionCode;
  status: InterventionEpisodeStatus;
  started_by_actor_id: string;
  started_at: string;
  planned_days: 7;
  policy_version: InterventionPolicyVersion;
  created_at: string;
}

export interface GrowthActionDto {
  action_id: string;
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  /** Existing 7-day intervention actions retain their episode; 90-day Journey actions do not require one. */
  intervention_episode_id: string | null;
  /** Family-confirmed 90-day plan linkage; null for legacy intervention actions. */
  journey_plan_id?: string | null;
  /** Schedule phase only; it is not a child state, diagnosis, score, or outcome. */
  journey_phase?: 'SEE' | 'PARENT_FIRST' | 'CO_CREATE' | 'STABILIZE' | null;
  day_index: number;
  status: GrowthActionStatus;
  assignment_text: string;
  due_date: string;
  completed_at: string | null;
  completion_status: GrowthActionStatus | null;
  reflection: string | null;
  reflection_boundary: ReflectionBoundary | null;
  boundary: GrowthActionBoundary;
  created_at: string;
}

export interface StartInterventionRequest {
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  intervention_code: InterventionCode;
  idempotency_key: string;
}

export interface StartInterventionResponse {
  intervention: InterventionCardDto;
  episode: InterventionEpisodeDto;
  actions: GrowthActionDto[];
}

export interface CompleteGrowthActionRequest {
  family_id: string;
  action_id: string;
  completion_status: Exclude<GrowthActionStatus, 'PENDING'>;
  reflection: string;
  occurred_at: string;
  idempotency_key: string;
}

export interface CompleteGrowthActionResponse {
  action: GrowthActionDto;
  reflection_boundary: ReflectionBoundary;
  /** True only when an identical idempotency key/request hash replays a stored receipt. */
  replayed?: boolean;
}

export type Wave3PolicyVersion = 'M2_106_DETERMINISTIC_V1';
export type OutcomeObservationPerspective = 'PARENT_OBSERVATION' | 'CHILD_OBSERVATION';
export type OutcomeObservationBoundary = 'OBSERVATION_IS_NOT_FACT_OR_CAUSAL_EFFECT';
export type GrowthReviewStatus = 'COMPLETED';
export type GrowthReviewBoundary = 'REVIEW_IS_NOT_PROFILE_MUTATION_OR_DIAGNOSIS';
export type GrowthReviewLimitation =
  | 'MISSING_CHECK_INS'
  | 'PARENT_CHILD_DIVERGENCE'
  | 'PARENT_OBSERVATION_ONLY'
  | 'CHILD_OBSERVATION_ONLY'
  | 'NO_OUTCOME_OBSERVATION'
  | 'SAFETY_ROUTE_NOT_NORMAL'
  | 'CONSENT_REQUIRED';
export type NextStepDecision = 'CONTINUE' | 'ADJUST' | 'PAUSE' | 'REVIEW_REQUIRED';
export type NextStepDecisionBoundary = 'NEXT_STEP_DECISION_IS_NOT_NEXT_ACTION';
export type FamilyTimelineEventType =
  | 'INTERVENTION_STARTED'
  | 'GROWTH_ACTION_COMPLETED'
  | 'OUTCOME_OBSERVATION_RECORDED'
  | 'GROWTH_REVIEW_COMPLETED'
  | 'NEXT_STEP_DECISION_RECORDED';

export interface OutcomeObservationDto {
  observation_id: string;
  family_id: string;
  subject_person_id: string;
  observer_person_id: string;
  intervention_episode_id: string;
  perspective_type: OutcomeObservationPerspective;
  observation_text: string;
  action_refs: string[];
  reflection_refs: string[];
  evidence_refs: string[];
  limitations: string[];
  observed_at: string;
  boundary: OutcomeObservationBoundary;
  policy_version: Wave3PolicyVersion;
  created_at: string;
}

export interface RecordOutcomeObservationRequest {
  family_id: string;
  subject_person_id: string;
  observer_person_id: string;
  intervention_episode_id: string;
  perspective_type: OutcomeObservationPerspective;
  observation_text: string;
  action_refs?: string[];
  reflection_refs?: string[];
  evidence_refs?: string[];
  limitations?: string[];
  observed_at: string;
  idempotency_key: string;
}

export interface RecordOutcomeObservationResponse {
  observation: OutcomeObservationDto;
}

export interface GrowthReviewActionSummaryDto {
  total_actions: 7;
  completed: number;
  partial: number;
  not_completed: number;
  missing: number;
}

export interface GrowthReviewDto {
  review_id: string;
  family_id: string;
  onboarding_id: string;
  intervention_episode_id: string;
  priority_id: string;
  dimension_id: M2GrowthDimensionId;
  status: GrowthReviewStatus;
  action_summary: GrowthReviewActionSummaryDto;
  observation_ids: string[];
  limitations: GrowthReviewLimitation[];
  boundary: GrowthReviewBoundary;
  policy_version: Wave3PolicyVersion;
  completed_by_actor_id: string;
  completed_at: string;
  created_at: string;
}

export interface CompleteGrowthReviewRequest {
  family_id: string;
  intervention_episode_id: string;
  idempotency_key: string;
}

export interface CompleteGrowthReviewResponse {
  review: GrowthReviewDto;
  observations: OutcomeObservationDto[];
}

export interface NextStepDecisionDto {
  decision_id: string;
  family_id: string;
  review_id: string;
  intervention_episode_id: string;
  decision: NextStepDecision;
  rationale: string | null;
  boundary: NextStepDecisionBoundary;
  policy_version: Wave3PolicyVersion;
  decided_by_actor_id: string;
  decided_at: string;
  created_at: string;
}

export interface RecordNextStepDecisionRequest {
  family_id: string;
  review_id: string;
  decision: NextStepDecision;
  rationale?: string;
  idempotency_key: string;
}

export interface RecordNextStepDecisionResponse {
  decision: NextStepDecisionDto;
}

export interface FamilyTimelineEventDto {
  event_id: string;
  family_id: string;
  intervention_episode_id: string;
  event_type: FamilyTimelineEventType;
  occurred_at: string;
  source: 'INTERVENTION_EPISODE' | 'GROWTH_ACTION' | 'OUTCOME_OBSERVATION' | 'GROWTH_REVIEW' | 'NEXT_STEP_DECISION';
  resource_id: string;
  title: string;
  payload: Record<string, unknown>;
  boundary: 'TIMELINE_IS_PROVENANCE_NOT_SCORE_OR_RANKING';
}

export interface FamilyTimelineResponse {
  family_id: string;
  intervention_episode_id: string;
  events: FamilyTimelineEventDto[];
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

export * from './dev-core-growth';
export * from './dev-platform-surfaces';
export * from './family-growth-os';
export * from './journey-plan';
