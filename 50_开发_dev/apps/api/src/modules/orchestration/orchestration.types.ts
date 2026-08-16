export const VERTICAL_POLICY_VERSION = 'FAMILY-GROWTH-VERTICAL-SLICE-001';
export const COMMUNICATION_CONFLICT_NEED = 'PARENT_CHILD_COMMUNICATION_CONFLICT' as const;

export type ResourceType = 'NO_ACTION' | 'CONTENT' | 'PRACTICE' | 'AI_COACH' | 'PROGRAM' | 'HUMAN_COACH' | 'QUALIFIED_EXPERT' | 'EXTERNAL_REFERRAL';
export type Helpfulness = 'HELPFUL' | 'A_LITTLE_HELPFUL' | 'NOT_HELPFUL' | 'NOT_ANSWERED';
export type EligibilityResult = 'ELIGIBLE' | 'INELIGIBLE';

export interface AuditInput {
  actorId: string;
  correlationId: string;
  source: string;
  occurredAt: string;
}

export interface CreateIntentInput {
  familyId: string;
  subjectPersonId: string;
  signalText: string;
  goalText: string;
  idempotencyKey: string;
}

export interface RequestRecommendationInput {
  familyId: string;
  growthIntentId: string;
  idempotencyKey: string;
}

export interface DecideServiceInput {
  familyId: string;
  recommendationId: string;
  decisionType: 'ACCEPT' | 'SELECT_ALTERNATIVE' | 'DECLINE' | 'NO_ACTION';
  selectedOfferIds: string[];
  rationale?: string;
  idempotencyKey: string;
}

export interface CreatePlanInput {
  familyId: string;
  decisionId: string;
  idempotencyKey: string;
}

export interface OpenCaseInput {
  familyId: string;
  planId: string;
  idempotencyKey: string;
}

export interface RecordFollowUpInput {
  familyId: string;
  serviceCaseId: string;
  helpfulness: Helpfulness;
  responseText?: string;
  idempotencyKey: string;
}

export interface ResourceOffer {
  resource_offer_id: string;
  resource_code: string;
  resource_type: ResourceType;
  capability_codes: string[];
  title: string;
  description: string;
  age_scope: string;
  age_min_months: number | null;
  age_max_months: number | null;
  life_stage_scope: string[];
  need_type: typeof COMMUNICATION_CONFLICT_NEED;
  evidence_level: string;
  risk_boundary: string;
  privacy_boundary: string;
  effort_class: string;
  duration_class: string;
  cost_class: string;
  requires_consent: boolean;
  requires_human: boolean;
  content_ref: string | null;
  provider_qualification: string;
  availability_status: 'ACTIVE' | 'INACTIVE' | 'RETIRED';
  policy_version: string;
}

export interface EligibilityEvaluation {
  resourceOfferId: string;
  result: EligibilityResult;
  reasonCode: string;
  detail: string;
}

export interface RecommendationCandidate {
  resourceOfferId: string;
  resourceCode: string;
  resourceType: ResourceType;
  rank: number;
  eligibility: EligibilityResult;
  rationale: string;
  limitations: string;
}

export type ProgressStage = 'NEED_CONFIRMED' | 'RESOURCE_OPTIONS' | 'FAMILY_DECIDED' | 'PLAN_READY' | 'SERVICE_OPEN' | 'FOLLOW_UP_DUE' | 'FOLLOW_UP_CAPTURED' | 'NO_ACTION' | 'PAUSED';
export type StewardDraftStatus = 'DRAFT' | 'CANCELLED';

export interface FamilyProgressProjection {
  family_id: string;
  subject_person_id: string;
  current_stage: ProgressStage;
  next_step: 'CONFIRM_SERVICE' | 'REVIEW_OPTIONS' | 'MAKE_FAMILY_DECISION' | 'REVIEW_PLAN' | 'OPEN_SERVICE_CASE' | 'RECORD_FOLLOW_UP' | 'NONE';
  can_pause: boolean;
  can_cancel: boolean;
  last_family_signal: Helpfulness | null;
  source_refs: { growth_intent_id: string | null; recommendation_id: string | null; decision_id: string | null; plan_id: string | null; service_case_id: string | null; follow_up_response_id: string | null };
  truth_boundary: 'SERVICE_PROGRESS_NOT_GROWTH_OUTCOME';
}

export interface StewardQueueItem {
  family_id: string;
  service_case_id: string;
  subject_person_id: string;
  status: string;
  needs_follow_up: boolean;
  needs_recovery: boolean;
  sla_class: string;
  next_action_at: string | null;
  reason_code: 'FOLLOW_UP_DUE' | 'ESCALATION_REVIEW' | 'OPEN_CASE' | 'NO_ACTION';
  truth_boundary: 'INTERNAL_SERVICE_QUEUE_NOT_CHILD_OR_FAMILY_RISK_SCORE';
}

export interface FamilyServiceMetrics {
  family_id: string;
  subject_person_id: string;
  time_to_first_recommendation_ms: number | null;
  family_decision_rate: number;
  service_case_open_rate: number;
  follow_up_capture_rate: number;
  helpfulness_signal: Helpfulness | null;
  context_reuse_available: boolean;
  truth_boundary: 'SERVICE_DELIVERY_AND_FAMILY_PERCEPTION_NOT_GROWTH_OUTCOME';
}

export interface CreateStewardHandoffDraftInput {
  familyId: string;
  serviceCaseId: string;
  subjectPersonId: string;
  sourceFollowUpResponseId?: string;
  summaryText: string;
  idempotencyKey: string;
}

export interface UpdateStewardHandoffDraftInput {
  familyId: string;
  draftId: string;
  summaryText: string;
  status?: StewardDraftStatus;
  idempotencyKey: string;
}

export interface StewardHandoffDraft {
  steward_handoff_draft_id: string;
  family_id: string;
  service_case_id: string;
  subject_person_id: string;
  source_follow_up_response_id: string | null;
  status: StewardDraftStatus;
  summary_text: string;
  limitation_text: 'INTERNAL_DRAFT_NOT_ADVISOR_ASSIGNMENT_NOT_GROWTH_OUTCOME';
  created_at: string;
  updated_at: string;
}

export interface ContextReuseItem {
  serviceCaseId: string;
  needType: string;
  selectedResources: Array<{ resourceCode: string; resourceType: ResourceType; title: string }>;
  helpfulness: Helpfulness | null;
  followUpAt: string | null;
  note: 'USER_PERCEIVED_HELPFULNESS_NOT_GROWTH_OUTCOME';
}

export const VERTICAL_RESOURCE_CODES = {
  NO_ACTION: 'V3_NO_ACTION_COMMUNICATION',
  AI_COACH: 'V3_AI_COACH_COMMUNICATION',
  PRACTICE: 'V3_PRACTICE_COMMUNICATION',
  EXTERNAL_REFERRAL: 'V3_EXTERNAL_REFERRAL_COMMUNICATION',
} as const;

export function assertUuid(value: string, name: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`invalid_${name}`);
  }
}

export function assertIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim() ?? '';
  if (normalized.length < 8 || normalized.length > 128) throw new Error('invalid_idempotency_key');
  return normalized;
}
