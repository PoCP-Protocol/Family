/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · FamilyServiceDecision 选择完整性(禁注入任意 offer)。
 * ACCEPT_RECOMMENDATION → selected == recommendation.recommended_offer_refs;
 * SELECT_ALTERNATIVE → selected 为 candidates[].offer_ref 的非空子集;
 * DISMISS → selected = []。必须追溯 exact recommendation_version。
 */
import type { FamilyDecisionType, ResourceRecommendationDto } from '@family/contracts';
import { OFFER_IDS } from './resource.registry';

export interface DecisionIntegrityResult {
  ok: boolean;
  code: string | null;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

export function checkDecisionIntegrity(
  recommendation: ResourceRecommendationDto,
  decisionType: FamilyDecisionType,
  selectedOfferRefs: string[],
  recommendationVersion: number,
): DecisionIntegrityResult {
  if (recommendationVersion !== recommendation.version) {
    return { ok: false, code: 'RECOMMENDATION_VERSION_MISMATCH' };
  }
  const candidateRefs = new Set(recommendation.candidates.map((c) => c.offer_ref));
  const noActionRefs = new Set(recommendation.candidates.filter((c) => c.offer_ref === OFFER_IDS.NO_ACTION).map((c) => c.offer_ref));
  // NO_ACTION 是家庭明确选择暂不执行的语义，不是可被 ACCEPT/alternative 当作服务资源的 offer。
  if (decisionType !== 'DISMISS' && selectedOfferRefs.some((r) => noActionRefs.has(r))) {
    return { ok: false, code: 'NO_ACTION_REQUIRES_DISMISS' };
  }

  switch (decisionType) {
    case 'ACCEPT_RECOMMENDATION':
      if (!sameSet(selectedOfferRefs, recommendation.recommended_offer_refs)) {
        return { ok: false, code: 'ACCEPT_MUST_EQUAL_RECOMMENDED' };
      }
      return { ok: true, code: null };
    case 'SELECT_ALTERNATIVE':
      if (selectedOfferRefs.length === 0) return { ok: false, code: 'ALTERNATIVE_MUST_BE_NONEMPTY' };
      if (!selectedOfferRefs.every((r) => candidateRefs.has(r))) {
        return { ok: false, code: 'ALTERNATIVE_MUST_BE_SUBSET_OF_CANDIDATES' };
      }
      return { ok: true, code: null };
    case 'DISMISS':
      if (selectedOfferRefs.length !== 0) return { ok: false, code: 'DISMISS_MUST_BE_EMPTY' };
      return { ok: true, code: null };
    default:
      return { ok: false, code: 'UNKNOWN_DECISION_TYPE' };
  }
}
