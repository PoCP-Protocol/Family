/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · V1 资源注册表(确定性代码 registry,非 Marketplace)。
 * 稳定 Offer ID(resource:v1:*)保证 T1→Decision→T2 跨请求/进程的 exact traceability(不再进程全局自增)。
 * provider_ref 条件化:REQUIRED→自营;NOT_APPLICABLE(NO_ACTION)→null;EXTERNAL_REFERRAL_POLICY→外部目标,不入网。
 * PRACTICE 当前无 real executor，因此即使有 approved Content Ref 也不注册；EXTERNAL_REFERRAL 仅当配置真实目标(不臆造)。
 */
import type { GrowthCapabilityKey, ResourceOfferDto, ResourceType } from '@family/contracts';

export const SELF_AI_COACH_PROVIDER_REF = 'family-self:ai-coach';

export const OFFER_IDS = {
  NO_ACTION: 'resource:v1:no_action',
  AI_COACH: 'resource:v1:ai_coach',
  PRACTICE: 'resource:v1:practice',
  EXTERNAL_REFERRAL: 'resource:v1:external_referral',
} as const;

export interface ResourceRegistryEnv {
  approvedPracticeContentRef?: string | null;
  externalReferralTargetRef?: string | null;
}

function noActionOffer(): ResourceOfferDto {
  return {
    offer_id: OFFER_IDS.NO_ACTION, resource_type: 'NO_ACTION', qualification_mode: 'NOT_APPLICABLE',
    provider_ref: null, external_referral_target_ref: null,
    supports_capability_keys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'],
    age_scope: 'EARLY_ADOLESCENCE_12_15', need_scope: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
    requires_consent: false, requires_human: false, cost_class: 'FREE',
  };
}
function aiCoachOffer(): ResourceOfferDto {
  return {
    offer_id: OFFER_IDS.AI_COACH, resource_type: 'AI_COACH', qualification_mode: 'REQUIRED',
    provider_ref: SELF_AI_COACH_PROVIDER_REF, external_referral_target_ref: null,
    supports_capability_keys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'],
    age_scope: 'EARLY_ADOLESCENCE_12_15', need_scope: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
    requires_consent: true, requires_human: false, cost_class: 'FREE',
  };
}
function externalReferralOffer(targetRef: string): ResourceOfferDto {
  return {
    offer_id: `${OFFER_IDS.EXTERNAL_REFERRAL}:${targetRef}`, resource_type: 'EXTERNAL_REFERRAL', qualification_mode: 'EXTERNAL_REFERRAL_POLICY',
    provider_ref: null, external_referral_target_ref: targetRef,
    supports_capability_keys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'],
    age_scope: 'EARLY_ADOLESCENCE_12_15', need_scope: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
    requires_consent: false, requires_human: true, cost_class: 'EXTERNAL',
  };
}

/** 候选原子 Offer(先于 Eligibility)。稳定 ID;PRACTICE 在没有 real executor 前不进入候选。 */
export function candidateOffersForCommunicationConflict(env: ResourceRegistryEnv = {}): ResourceOfferDto[] {
  const offers: ResourceOfferDto[] = [noActionOffer(), aiCoachOffer()];
  // `approvedPracticeContentRef` 只证明内容引用存在，绝不等价于能交付内容的 executor。
  if (env.externalReferralTargetRef) offers.push(externalReferralOffer(env.externalReferralTargetRef));
  return offers;
}

/**
 * 运行时时变状态解析(非 provider DB)。自营 AI provider 默认 ACTIVE;测试可经 env 注入 SUSPENDED/unavailable,
 * 以验证 T1 ACTIVE → T2 fail-closed。offerRef 为稳定 ID。
 */
export interface ResourceRuntimeState {
  providerQualificationActive: boolean;
  available: boolean;
  externalReferralTargetConfigured: boolean;
}
export function resolveResourceRuntimeState(resourceType: ResourceType, env: NodeJS.ProcessEnv = process.env): ResourceRuntimeState {
  const suspended = env.FAMILY_TEST_PROVIDER_SUSPENDED === '1';
  const unavailable = env.FAMILY_TEST_RESOURCE_UNAVAILABLE === '1';
  return {
    providerQualificationActive: !suspended,           // 自营 AI provider V1 默认 ACTIVE
    available: !unavailable,
    externalReferralTargetConfigured: !!env.FAMILY_EXTERNAL_REFERRAL_TARGET,
  };
}

export const V1_GROWTH_CAPABILITIES: Record<GrowthCapabilityKey, { description_ref: string; risk_class: string }> = {
  DE_ESCALATION: { description_ref: 'capability.de_escalation', risk_class: 'LOW' },
  COMMUNICATION_REOPENING: { description_ref: 'capability.communication_reopening', risk_class: 'LOW' },
};
