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
