/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · Resource Eligibility(FAIL CLOSED)。
 * 同一纯函数用于 T1(推荐前)与 T2(执行前)。最高安全不变量:T1 eligible ≠ T2 eligible。
 * 两 consent 分离:SERVICE=可运行/存储此服务交互;AI_PERSONALIZATION=AI_COACH 个性化的额外要求。
 * 安全参与:HIGH_RISK 时 AI_COACH 普通服务 INELIGIBLE(Principal 内部 Human Gate 仍在)。年龄严格 12–15,不可证则 false。
 */
import type { EligibilityEvaluationDto, EligibilityStage, ResourceOfferDto } from '@family/contracts';

export interface EligibilityContext {
  serviceConsentGranted: boolean;              // SERVICE consent(所有会落库/执行的服务交互前提)
  aiPersonalizationConsentGranted: boolean;    // AI_COACH 额外要求
  ageInScope: boolean;                         // 严格 12–15;不可证=false
  safetyRouteNormal: boolean;                  // 非 NORMAL(HIGH_RISK)→ AI_COACH 普通服务不 eligible
  providerQualificationActive: boolean;
  available: boolean;
  externalReferralTargetConfigured: boolean;
  policyVersion: string;
  evaluatedAt: string;
  evaluationRef: string;
}

/** 纯评估:任一必需门不过 → eligible=false(fail closed)。按 offer.resource_type/qualification_mode 应用差异化 consent。 */
export function evaluateOfferEligibility(offer: ResourceOfferDto, stage: EligibilityStage, ctx: EligibilityContext): EligibilityEvaluationDto {
  const reasons: string[] = [];

  // 所有需要落库/执行的服务交互都要 SERVICE consent(NO_ACTION 也在服务上下文内,但不执行资源——仍要求 SERVICE 以记录服务决定)。
  if (!ctx.serviceConsentGranted) reasons.push('SERVICE_CONSENT_NOT_GRANTED');
  if (!ctx.ageInScope) reasons.push('AGE_OUT_OF_SCOPE_12_15');

  switch (offer.resource_type) {
    case 'NO_ACTION':
      // 安全兜底:不需要 provider/AI consent;SERVICE + age 已判。
      break;
    case 'AI_COACH':
      if (!ctx.safetyRouteNormal) reasons.push('SAFETY_ROUTE_NOT_NORMAL');
      if (!ctx.aiPersonalizationConsentGranted) reasons.push('AI_PERSONALIZATION_CONSENT_NOT_GRANTED');
      if (!ctx.providerQualificationActive) reasons.push('PROVIDER_QUALIFICATION_NOT_ACTIVE');
      if (!ctx.available) reasons.push('RESOURCE_UNAVAILABLE');
      break;
    case 'PRACTICE':
      // Architect ruling: APPROVED_CONTENT_REF alone is not execution. Until a real
      // approved-content executor is implemented and independently gated, Practice
      // must be invisible to both T1 recommendation and T2 execution.
      reasons.push('INELIGIBLE_NO_EXECUTOR');
      break;
    case 'EXTERNAL_REFERRAL':
      // 外部转介:过 SERVICE/age/safety(上面已判 SERVICE/age;safety 见下),但不要求入网。
      if (!ctx.safetyRouteNormal) reasons.push('SAFETY_ROUTE_NOT_NORMAL');
      if (!ctx.externalReferralTargetConfigured || !offer.external_referral_target_ref) reasons.push('NO_EXTERNAL_REFERRAL_TARGET');
      break;
    default:
      reasons.push('UNSUPPORTED_RESOURCE_TYPE_V1');
  }

  return {
    eligibility_evaluation_ref: ctx.evaluationRef,
    stage,
    offer_ref: offer.offer_id,
    eligible: reasons.length === 0,
    reason_codes: reasons,
    policy_version: ctx.policyVersion,
    evaluated_at: ctx.evaluatedAt,
  };
}
