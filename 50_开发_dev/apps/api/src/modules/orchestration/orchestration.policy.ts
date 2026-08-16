import type { EligibilityEvaluation, RecommendationCandidate, ResourceOffer } from './orchestration.types';
import { VERTICAL_RESOURCE_CODES } from './orchestration.types';

/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 的确定性 policy。
 * 它不是诊断、评分或成长预测；它只决定在已确认的低风险沟通需求下，哪些资源满足最低资格且如何解释排列。
 */
export function evaluateRecommendationEligibility(offer: ResourceOffer, hasActiveServiceConsent: boolean): EligibilityEvaluation {
  if (offer.availability_status !== 'ACTIVE') {
    return { resourceOfferId: offer.resource_offer_id, result: 'INELIGIBLE', reasonCode: 'OFFER_INACTIVE', detail: '该资源当前不可用，不进入候选集合。' };
  }
  if (offer.resource_type === 'PRACTICE' && !offer.content_ref) {
    return { resourceOfferId: offer.resource_offer_id, result: 'INELIGIBLE', reasonCode: 'PRACTICE_CONTENT_NOT_APPROVED', detail: '练习缺少已批准内容引用，不进入候选集合。' };
  }
  // V3 资源网络允许八型资源，但首条内部确定性纵切只授权 NO_ACTION / AI_COACH / PRACTICE / EXTERNAL_REFERRAL。
  // 其余类型需在 Program、Human Service 或 Provider 的独立 Gate 授权后，才能进入排序集合。
  if (!['NO_ACTION', 'AI_COACH', 'PRACTICE', 'EXTERNAL_REFERRAL'].includes(offer.resource_type)) {
    return { resourceOfferId: offer.resource_offer_id, result: 'INELIGIBLE', reasonCode: 'RESOURCE_TYPE_NOT_AUTHORIZED_FOR_VERTICAL', detail: '该资源类型已被平台数据模型预留，但尚未获得本纵切运行时授权。' };
  }
  if (offer.resource_type !== 'NO_ACTION' && offer.requires_consent && !hasActiveServiceConsent) {
    return { resourceOfferId: offer.resource_offer_id, result: 'INELIGIBLE', reasonCode: 'SERVICE_CONSENT_REQUIRED', detail: '未找到有效服务同意；除不行动外的资源不进入候选集合。' };
  }
  return { resourceOfferId: offer.resource_offer_id, result: 'ELIGIBLE', reasonCode: 'LOW_RISK_POLICY_PASS', detail: '资源满足当前低风险、可用性、内容与服务同意门。' };
}

export function evaluateExecutionEligibility(offer: ResourceOffer, hasActiveServiceConsent: boolean): EligibilityEvaluation {
  const t1 = evaluateRecommendationEligibility(offer, hasActiveServiceConsent);
  if (t1.result === 'INELIGIBLE') return { ...t1, reasonCode: `T2_${t1.reasonCode}` };
  if (offer.resource_type === 'EXTERNAL_REFERRAL') {
    return { resourceOfferId: offer.resource_offer_id, result: 'ELIGIBLE', reasonCode: 'REFERRAL_INFORMATION_ONLY', detail: '仅提供受控的外部专业支持提示；不会自动联系第三方。' };
  }
  return { resourceOfferId: offer.resource_offer_id, result: 'ELIGIBLE', reasonCode: 'T2_LOW_RISK_POLICY_PASS', detail: '执行前资格复核通过。' };
}

/**
 * 排序只在 T1 eligible 集合中发生。固定规则仅服务本纵切：低风险 AI 提示 + 练习优先；
 * 不使用收入、价格、留存、儿童评分、家庭画像或模型置信度作排序信号。
 */
export function buildCandidates(offers: ResourceOffer[], evaluations: EligibilityEvaluation[]): RecommendationCandidate[] {
  const byOffer = new Map(evaluations.map((e) => [e.resourceOfferId, e]));
  const preferred = [
    VERTICAL_RESOURCE_CODES.AI_COACH,
    VERTICAL_RESOURCE_CODES.PRACTICE,
    VERTICAL_RESOURCE_CODES.EXTERNAL_REFERRAL,
    VERTICAL_RESOURCE_CODES.NO_ACTION,
  ];
  return offers
    .map((offer) => ({ offer, evaluation: byOffer.get(offer.resource_offer_id)! }))
    .filter(({ evaluation }) => evaluation.result === 'ELIGIBLE')
    .sort((a, b) => preferred.indexOf(a.offer.resource_code as typeof preferred[number]) - preferred.indexOf(b.offer.resource_code as typeof preferred[number]))
    .map(({ offer, evaluation }, index) => ({
      resourceOfferId: offer.resource_offer_id,
      resourceCode: offer.resource_code,
      resourceType: offer.resource_type,
      rank: index + 1,
      eligibility: evaluation.result,
      rationale: rationaleFor(offer.resource_type),
      limitations: limitationFor(offer.resource_type),
    }));
}

function rationaleFor(type: ResourceOffer['resource_type']): string {
  switch (type) {
    case 'AI_COACH': return '提供稳定情绪、复述感受、开放提问与可逆小行动的低风险结构化提示。';
    case 'PRACTICE': return '提供一项经批准内容引用约束的亲子沟通重新开启练习。';
    case 'EXTERNAL_REFERRAL': return '当需要超出平台低风险教育支持范围时，保留寻求合格外部专业支持的路径。';
    case 'NO_ACTION': return '家庭可以选择暂不行动；不行动是被尊重的服务结果。';
    case 'CONTENT': return '该内容资源已预留，等待后续内容资源授权后才能进入服务路径。';
    case 'PROGRAM': return '该 Program 资源已预留，必须由未来 Enrollment/Delivery 域承接其交付事实。';
    case 'HUMAN_COACH': return '该真人教练资源已预留，必须通过人员资格与服务协同 Gate。';
    case 'QUALIFIED_EXPERT': return '该专业资源已预留，必须通过专业范围、资质与转介/协作 Gate。';
  }
}

function limitationFor(type: ResourceOffer['resource_type']): string {
  switch (type) {
    case 'AI_COACH': return '不是诊断、治疗、危机处置或替代专业服务；当前不调用真实外部模型。';
    case 'PRACTICE': return '完成练习只表示服务过程，不证明孩子、家庭关系或成长结果发生因果改变。';
    case 'EXTERNAL_REFERRAL': return '系统仅提示路径，不代表专业资格核验、预约、转介完成或第三方服务质量保证。';
    case 'NO_ACTION': return '不行动不会关闭家庭未来再次寻求帮助、选择练习或获取外部支持的权利。';
    case 'CONTENT': return '未进入当前纵切运行时；需要内容准入、适龄与证据 Gate。';
    case 'PROGRAM': return '未进入当前纵切运行时；日程位置不等于 Enrollment 或 Delivery 完成。';
    case 'HUMAN_COACH': return '未进入当前纵切运行时；需要资格、范围、访问授权与服务责任。';
    case 'QUALIFIED_EXPERT': return '未进入当前纵切运行时；需要专业资格、转介边界与人工责任。';
  }
}
