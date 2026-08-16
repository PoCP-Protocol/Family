/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · Resource Eligibility(FAIL CLOSED)。
 * 同一纯函数用于 T1(推荐前)与 T2(执行前)。最高安全不变量:T1 eligible ≠ T2 eligible。
 * 按 qualification_mode 处理 provider 资格:REQUIRED→必须 ACTIVE;NOT_APPLICABLE→不判;EXTERNAL_REFERRAL_POLICY→过 safety/scope,不要求入网。
 */
import type { EligibilityEvaluationDto, EligibilityStage, ResourceOfferDto } from '@family/contracts';

/** 评估某个 Offer 对某家庭此刻的时变资格所需的上下文(由服务层在 T1/T2 各查一次)。 */
export interface EligibilityContext {
  requiredConsentGranted: boolean;      // 该 offer.requires_consent 时,对应 consent 是否 GRANTED
  providerQualificationActive: boolean; // REQUIRED offer 的 provider 资格是否 ACTIVE
  ageInScope: boolean;
  safetyRouteNormal: boolean;           // HIGH_RISK 时不得走普通资源执行
  available: boolean;
  externalReferralTargetConfigured: boolean; // EXTERNAL_REFERRAL 才需要
  policyVersion: string;
  evaluatedAt: string;                  // 由调用方注入(避免此处用不可用的 Date.now)
  evaluationRef: string;                // 由调用方注入
}

/** 纯评估:返回带 reason_codes 的 EligibilityEvaluationDto。任一必需门不过 → eligible=false(fail closed)。 */
export function evaluateOfferEligibility(offer: ResourceOfferDto, stage: EligibilityStage, ctx: EligibilityContext): EligibilityEvaluationDto {
  const reasons: string[] = [];

  if (!ctx.safetyRouteNormal) reasons.push('SAFETY_ROUTE_NOT_NORMAL');
  if (!ctx.ageInScope) reasons.push('AGE_OUT_OF_SCOPE');
  if (offer.requires_consent && !ctx.requiredConsentGranted) reasons.push('CONSENT_NOT_GRANTED');

  switch (offer.qualification_mode) {
    case 'REQUIRED':
      if (!ctx.providerQualificationActive) reasons.push('PROVIDER_QUALIFICATION_NOT_ACTIVE');
      if (!ctx.available) reasons.push('RESOURCE_UNAVAILABLE');
      break;
    case 'NOT_APPLICABLE':
      // NO_ACTION 无 provider;无需资格/可用性判定。
      break;
    case 'EXTERNAL_REFERRAL_POLICY':
      // 外部转介:过 safety/age/scope(上面已判),但不要求入网;需真实转介目标。
      if (!ctx.externalReferralTargetConfigured || !offer.external_referral_target_ref) reasons.push('NO_EXTERNAL_REFERRAL_TARGET');
      break;
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
