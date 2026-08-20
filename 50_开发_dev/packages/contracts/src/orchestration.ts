/**
 * @family/contracts · Growth Orchestration V3 运行时契约(FAMILY-GROWTH-VERTICAL-SLICE-001)。
 * 权威:architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md（已入 master）。
 * 铁律(禁语义别名):这些对象各有独立语义，绝不等同旧 GrowthOnboarding/GrowthPriority/InterventionEpisode/PrincipalProposal/GrowthAction。
 *   CORE_OBJECTS = 8；FamilyServiceDecision = 决定边界/事件（非第九核心 Aggregate）。
 *   建议 ≠ 决定 ≠ 计划 ≠ 执行 ≠ 回访 ≠ 观察 ≠ 复用；RANKING ≠ ORCHESTRATION；T1 推荐 eligible ≠ T2 执行 eligible。
 */

// ---- 枚举（V1 确定性，封闭集）----
export type GrowthNeedType = 'PARENT_CHILD_COMMUNICATION_CONFLICT';
export type GrowthNeedSource = 'MANUAL' | 'PRINCIPAL' | 'SERVICE_FOLLOWUP';
export type GrowthCapabilityKey = 'DE_ESCALATION' | 'COMMUNICATION_REOPENING';
export type ResourceType = 'NO_ACTION' | 'CONTENT' | 'PRACTICE' | 'AI_COACH' | 'PROGRAM' | 'HUMAN_COACH' | 'QUALIFIED_EXPERT' | 'EXTERNAL_REFERRAL';
export type QualificationMode = 'REQUIRED' | 'NOT_APPLICABLE' | 'EXTERNAL_REFERRAL_POLICY';
export type GrowthIntentStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'SUPERSEDED';
export type GrowthIntentCloseReason = 'SERVICE_DELIVERED' | 'NO_ACTION_SELECTED' | 'FAMILY_STOPPED' | 'SUPERSEDED_BY_NEW_INTENT' | 'EXTERNAL_REFERRAL';
export type RecommendationStatus = 'PROPOSED' | 'SHOWN' | 'SUPERSEDED' | 'EXPIRED';
export type FamilyDecisionType = 'ACCEPT_RECOMMENDATION' | 'SELECT_ALTERNATIVE' | 'DISMISS';
export type OrchestrationPlanStatus = 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED';
export type PlanStepTrigger = 'NOW' | 'AFTER_PREV' | 'SCHEDULED' | 'CONDITIONAL';
export type PlanStepCondition = 'repeated_ge_n' | 'complex' | 'risk' | 'out_of_scope';
export type ServiceCaseStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FAMILY' | 'ESCALATED' | 'COMPLETED' | 'CANCELLED';
export type EligibilityStage = 'T1' | 'T2';
export type Helpfulness = 'HELPFUL' | 'SOMEWHAT_HELPFUL' | 'NOT_HELPFUL_YET' | 'UNANSWERED';
export type FollowUpTruthClass = 'PERSPECTIVE' | 'SERVICE_NOTE' | 'OBSERVATION_CANDIDATE';
/** 复验/推荐失效后的显式安全出口——绝不静默替换资源。 */
export type SafeOrchestrationOutcome = 'RE_RECOMMEND_REQUIRED' | 'NO_ACTION' | 'EXTERNAL_REFERRAL';

// ---- ① GrowthNeedSignal（NON_CANONICAL 推断）----
export interface GrowthNeedSignalDto {
  signal_id: string;
  family_id: string;
  subject_person_id: string;
  source: GrowthNeedSource;
  raw_ref: string;                 // 指向服务层原始输入，不复制原文到多处
  inferred_need_type: GrowthNeedType | null;
  confidence: number;              // 0..1
  canonical_family_fact: false;    // 恒 false：不是家庭真相/诊断/Priority
  created_at: string;
}

// ---- ② GrowthIntent（家长显式确认后才存在）----
export interface GrowthIntentDto {
  intent_id: string;
  family_id: string;
  subject_person_id: string;
  need_type: GrowthNeedType;
  goal_text: string;
  required_capability_keys: GrowthCapabilityKey[]; // 1..N
  status: GrowthIntentStatus;
  close_reason: GrowthIntentCloseReason | null;
  confirmed_by: string;
  confirmed_at: string;
}

// ---- ③ GrowthCapability（能力抽象；需求↔供给解耦）----
export interface GrowthCapabilityDto {
  capability_key: GrowthCapabilityKey;
  description_ref: string;
  age_scope: string;
  need_scope: GrowthNeedType;
  risk_class: string;
}

// ---- ④ ResourceOffer（原子资源：ONE offer = ONE callable resource）----
export interface ResourceOfferDto {
  offer_id: string;
  resource_type: ResourceType;              // 恰好一个
  qualification_mode: QualificationMode;
  provider_ref: string | null;              // 仅 REQUIRED 时必填
  external_referral_target_ref: string | null; // 仅 EXTERNAL_REFERRAL_POLICY 时使用
  supports_capability_keys: GrowthCapabilityKey[]; // 1..N
  age_scope: string;
  need_scope: GrowthNeedType;
  requires_consent: boolean;
  requires_human: boolean;
  cost_class: string;
}

// ---- Eligibility 评估（T1 推荐前 / T2 执行前；FAIL CLOSED）----
export interface EligibilityEvaluationDto {
  eligibility_evaluation_ref: string;
  stage: EligibilityStage;
  offer_ref: string;
  eligible: boolean;
  reason_codes: string[];
  policy_version: string;
  evaluated_at: string;
}

// ---- ⑤ ResourceRecommendation（可确定性排序，不编排执行）----
export interface RecommendationCandidate {
  offer_ref: string;
  covered_capability_keys: GrowthCapabilityKey[];
  why_this: string;
  limitations: string[];
  rank: number;                    // 确定性排序，非执行顺序
}
export interface ResourceRecommendationDto {
  recommendation_id: string;
  intent_id: string;
  version: number;
  candidates: RecommendationCandidate[];
  recommended_offer_refs: string[];
  required_capability_keys: GrowthCapabilityKey[];
  covered_capability_keys: GrowthCapabilityKey[];
  uncovered_capability_keys: GrowthCapabilityKey[];
  why_now: string;
  status: RecommendationStatus;
}

// ---- 〔边界/事件〕FamilyServiceDecision（Recommendation→Decision 可审计边界；非核心 Aggregate）----
export interface FamilyServiceDecisionDto {
  decision_id: string;
  family_id: string;
  subject_person_id: string;
  intent_id: string;
  recommendation_ref: string;
  recommendation_version: number;  // 追溯到 exact recommendation version
  decision_type: FamilyDecisionType;
  selected_offer_refs: string[];
  actor_person_id: string;
  decided_at: string;
}

// ---- ⑥ OrchestrationPlan（声明式期望路径；不拥有执行真相）----
export interface OrchestrationPlanStep {
  step_no: number;
  capability_keys: GrowthCapabilityKey[]; // 1..N（一步可覆盖多能力）
  offer_ref: string;
  covered_capability_keys: GrowthCapabilityKey[];
  trigger: PlanStepTrigger;
  condition: PlanStepCondition | null;
}
export interface OrchestrationPlanDto {
  plan_id: string;
  intent_id: string;
  family_id: string;
  subject_person_id: string;
  version: number;
  accepted_by_decision_ref: string;
  steps: OrchestrationPlanStep[];
  status: OrchestrationPlanStatus; // 仅 proposal/version 生命周期；无 ACTIVE/COMPLETED
}

// ---- ⑦ ServiceCase（实际执行真相；Family Steward 拥有）----
export interface ServiceCaseDto {
  case_id: string;
  family_id: string;
  subject_person_id: string;
  intent_id: string;
  plan_ref: string;
  status: ServiceCaseStatus;
  owner: string;
  opened_at: string;
  next_action_at: string | null;
  closed_at: string | null;
}

// ---- ⑧ ServiceContribution（记录贡献，不分钱）----
export interface ServiceContributionDto {
  case_id: string;
  provider_ref: string | null;
  role: string;
  task_ref: string;
  started_at: string;
  completed_at: string | null;
  quality_state: string;
}

// ---- 回访真相（服务层只读派生，非 canonical）----
export interface FollowUpResponseDto {
  followup_id: string;
  case_id: string;
  response_ref: string | null;
  helpfulness: Helpfulness;
  truth_class: FollowUpTruthClass;
  captured_at: string;
}

// ---- 复用投影（M5，只读；禁因果断言）----
export interface ContextReuseProjectionDto {
  family_id: string;
  subject_person_id: string;
  need_type: GrowthNeedType;
  prior_case_ref: string | null;
  prior_selected_offer_refs: string[];
  prior_helpfulness: Helpfulness | null;
  // 面向用户的只读回顾语句（家庭主观价值，绝非"方法已证明有效"）
  reuse_statements: string[];
}
