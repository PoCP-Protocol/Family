/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 确定性 Growth Fiduciary 排序 + Recommendation 构建。
 * RANKING ≠ ORCHESTRATION:此处只对 eligible 原子 Offer 排序/推荐/解释 coverage,绝不定义执行顺序/时间/条件。
 * PLATFORM_REVENUE_RANKING_SIGNAL = 0(利润不参与)。禁 ML/embeddings。
 */
import type { GrowthCapabilityKey, ResourceOfferDto, ResourceRecommendationDto, RecommendationCandidate } from '@family/contracts';

// 确定性资源类型优先级(仅对沟通冲突纵切;体现"先给即时可用、免费、低门槛帮助")。数字越小越靠前。
const TYPE_RANK: Record<string, number> = {
  AI_COACH: 1,
  PRACTICE: 2,
  NO_ACTION: 3,
  EXTERNAL_REFERRAL: 4,
  CONTENT: 5,
  PROGRAM: 6,
  HUMAN_COACH: 7,
  QUALIFIED_EXPERT: 8,
};

function coveredOf(offer: ResourceOfferDto, required: GrowthCapabilityKey[]): GrowthCapabilityKey[] {
  return required.filter((c) => offer.supports_capability_keys.includes(c));
}

function whyThis(offer: ResourceOfferDto): string {
  switch (offer.resource_type) {
    case 'AI_COACH': return '现在就能陪你练一遍今晚怎么重新开口,并帮助先把情绪降下来。';
    case 'PRACTICE': return '一个可今晚尝试的小练习,帮助降低冲突强度。';
    case 'NO_ACTION': return '也可以今晚先不做任何安排,给彼此一点空间。';
    case 'EXTERNAL_REFERRAL': return '必要时可转介到更合适的外部专业资源。';
    default: return '一个可能有帮助的资源。';
  }
}

function limitationsOf(offer: ResourceOfferDto): string[] {
  if (offer.resource_type === 'AI_COACH') return ['AI 陪练不替代专业人士;涉及安全风险会转人工。'];
  if (offer.resource_type === 'NO_ACTION') return ['暂不安排不等于问题被解决。'];
  return [];
}

/**
 * 构建 Recommendation。输入:已通过 T1 Eligibility 的原子 Offer(eligibleOffers)+ Intent 所需能力。
 * 输出确定性排序的 candidates + recommended_offer_refs(覆盖所需能力的最小推荐集)+ coverage。
 */
export function buildRecommendation(params: {
  recommendationId: string;
  intentId: string;
  version: number;
  requiredCapabilityKeys: GrowthCapabilityKey[];
  eligibleOffers: ResourceOfferDto[];
}): ResourceRecommendationDto {
  const { recommendationId, intentId, version, requiredCapabilityKeys, eligibleOffers } = params;

  const sorted = [...eligibleOffers].sort((a, b) => {
    const ra = TYPE_RANK[a.resource_type] ?? 99;
    const rb = TYPE_RANK[b.resource_type] ?? 99;
    if (ra !== rb) return ra - rb;
    return a.offer_id.localeCompare(b.offer_id); // 稳定确定性
  });

  const candidates: RecommendationCandidate[] = sorted.map((offer, i) => ({
    offer_ref: offer.offer_id,
    covered_capability_keys: coveredOf(offer, requiredCapabilityKeys),
    why_this: whyThis(offer),
    limitations: limitationsOf(offer),
    rank: i + 1,
  }));

  // 推荐集:按 rank 贪心选,直到覆盖全部所需能力(NO_ACTION 不单独满足能力覆盖诉求,但始终作为候选存在)。
  const recommended: string[] = [];
  const covered = new Set<GrowthCapabilityKey>();
  for (const c of candidates) {
    const addsNew = c.covered_capability_keys.some((k) => !covered.has(k));
    const isNoAction = sorted.find((o) => o.offer_id === c.offer_ref)?.resource_type === 'NO_ACTION';
    if (addsNew && !isNoAction) {
      recommended.push(c.offer_ref);
      for (const k of c.covered_capability_keys) covered.add(k);
    }
    if (requiredCapabilityKeys.every((k) => covered.has(k))) break;
  }
  // 若没有任何能覆盖能力的资源,则推荐 NO_ACTION(安全兜底)。
  if (recommended.length === 0) {
    const noAction = sorted.find((o) => o.resource_type === 'NO_ACTION');
    if (noAction) recommended.push(noAction.offer_id);
  }

  const coveredKeys = requiredCapabilityKeys.filter((k) => covered.has(k));
  const uncovered = requiredCapabilityKeys.filter((k) => !covered.has(k));

  return {
    recommendation_id: recommendationId,
    intent_id: intentId,
    version,
    candidates,
    recommended_offer_refs: recommended,
    required_capability_keys: requiredCapabilityKeys,
    covered_capability_keys: coveredKeys,
    uncovered_capability_keys: uncovered,
    why_now: '刚发生冲突时,先降温、再找机会重新开口,通常比讲道理更有帮助。',
    status: 'SHOWN',
  };
}
