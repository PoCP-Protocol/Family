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
