/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · V1 资源注册表(确定性代码 registry,非 Marketplace)。
 * 首个纵切资源:NO_ACTION / AI_COACH / PRACTICE / EXTERNAL_REFERRAL。PROGRAM 可注册但条件化/非默认。
 * provider_ref 条件化:REQUIRED→自营 provider_ref;NOT_APPLICABLE(NO_ACTION)→null,不伪造 SYSTEM;
 *   EXTERNAL_REFERRAL_POLICY→external_referral_target_ref,不强迫入网。
 * PRACTICE 仅当存在 approved Content Ref 才 eligible;否则省略/INELIGIBLE(不臆造内容)。
 */
import type { GrowthCapabilityKey, ResourceOfferDto } from '@family/contracts';

/** 自营 AI_COACH provider 的 V1 显式资格状态(source of truth = Provider Qualification Gate)。 */
export const SELF_AI_COACH_PROVIDER_REF = 'family-self:ai-coach';

export interface ResourceRegistryEnv {
  /** 是否存在已批准的 communication practice Content Ref(runtime 证明,不臆造)。 */
  approvedPracticeContentRef?: string | null;
  /** 是否配置了真实外部转介目标(否则不提供 EXTERNAL_REFERRAL,不伪造医生/机构)。 */
  externalReferralTargetRef?: string | null;
}

let offerSeq = 0;
function offerId(kind: string): string {
  offerSeq += 1;
  return `offer:${kind}:${offerSeq}`;
}

/**
 * 为一个 PARENT_CHILD_COMMUNICATION_CONFLICT Intent 生成候选原子 Offer(未做 eligibility 过滤,过滤见 eligibility.policy)。
 * 注意:候选先于 Eligibility(CANDIDATE_BEFORE_ELIGIBILITY)。
 */
export function candidateOffersForCommunicationConflict(env: ResourceRegistryEnv = {}): ResourceOfferDto[] {
  const offers: ResourceOfferDto[] = [];

  // NO_ACTION —— 一等候选,永远合法安全兜底。
  offers.push({
    offer_id: offerId('no_action'),
    resource_type: 'NO_ACTION',
    qualification_mode: 'NOT_APPLICABLE',
    provider_ref: null,
    external_referral_target_ref: null,
    supports_capability_keys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'],
    age_scope: 'EARLY_ADOLESCENCE_12_15',
    need_scope: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
    requires_consent: false,
    requires_human: false,
    cost_class: 'FREE',
  });

  // AI_COACH —— 自营 Principal 适配;qualification REQUIRED。
  offers.push({
    offer_id: offerId('ai_coach'),
    resource_type: 'AI_COACH',
    qualification_mode: 'REQUIRED',
    provider_ref: SELF_AI_COACH_PROVIDER_REF,
    external_referral_target_ref: null,
    supports_capability_keys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'],
    age_scope: 'EARLY_ADOLESCENCE_12_15',
    need_scope: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
    requires_consent: true,
    requires_human: false,
    cost_class: 'FREE',
  });

  // PRACTICE —— 仅当有 approved Content Ref 才作为候选(否则不臆造)。
  if (env.approvedPracticeContentRef) {
    offers.push({
      offer_id: offerId('practice'),
      resource_type: 'PRACTICE',
      qualification_mode: 'REQUIRED',
      provider_ref: SELF_AI_COACH_PROVIDER_REF,
      external_referral_target_ref: null,
      supports_capability_keys: ['DE_ESCALATION'],
      age_scope: 'EARLY_ADOLESCENCE_12_15',
      need_scope: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      requires_consent: false,
      requires_human: false,
      cost_class: 'FREE',
    });
  }

  // EXTERNAL_REFERRAL —— 仅当配置真实转介目标;外部对象无需先入网。
  if (env.externalReferralTargetRef) {
    offers.push({
      offer_id: offerId('external_referral'),
      resource_type: 'EXTERNAL_REFERRAL',
      qualification_mode: 'EXTERNAL_REFERRAL_POLICY',
      provider_ref: null,
      external_referral_target_ref: env.externalReferralTargetRef,
      supports_capability_keys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'],
      age_scope: 'EARLY_ADOLESCENCE_12_15',
      need_scope: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      requires_consent: false,
      requires_human: true,
      cost_class: 'EXTERNAL',
    });
  }

  return offers;
}

export const V1_GROWTH_CAPABILITIES: Record<GrowthCapabilityKey, { description_ref: string; risk_class: string }> = {
  DE_ESCALATION: { description_ref: 'capability.de_escalation', risk_class: 'LOW' },
  COMMUNICATION_REOPENING: { description_ref: 'capability.communication_reopening', risk_class: 'LOW' },
};
