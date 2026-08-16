import { describe, expect, it } from 'vitest';
import { classifyNeed } from './need-classification.policy';
import { candidateOffersForCommunicationConflict, SELF_AI_COACH_PROVIDER_REF } from './resource.registry';
import { evaluateOfferEligibility, type EligibilityContext } from './eligibility.policy';
import { buildRecommendation } from './recommendation.policy';
import { checkDecisionIntegrity } from './decision-integrity.policy';
import type { ResourceOfferDto } from '@family/contracts';

const baseCtx = (over: Partial<EligibilityContext> = {}): EligibilityContext => ({
  requiredConsentGranted: true,
  providerQualificationActive: true,
  ageInScope: true,
  safetyRouteNormal: true,
  available: true,
  externalReferralTargetConfigured: true,
  policyVersion: 'orch-v1',
  evaluatedAt: '2026-08-16T00:00:00.000Z',
  evaluationRef: 'elig-1',
  ...over,
});

describe('need classification (确定性,无 ML,未知不臆造)', () => {
  it('摔门冲突 → PARENT_CHILD_COMMUNICATION_CONFLICT + 两能力', () => {
    const c = classifyNeed('孩子刚摔门，我今晚不知道怎么重新开口');
    expect(c.need_type).toBe('PARENT_CHILD_COMMUNICATION_CONFLICT');
    expect(c.required_capability_keys.sort()).toEqual(['COMMUNICATION_REOPENING', 'DE_ESCALATION']);
  });
  it('不相关文本 → null(不臆造类别)', () => {
    const c = classifyNeed('今天天气不错，想给孩子买双鞋');
    expect(c.need_type).toBeNull();
    expect(c.required_capability_keys).toEqual([]);
  });
});

describe('resource registry (原子 + provider_ref 条件化 + PRACTICE 需 approved ref)', () => {
  it('无 approved content ref → 无 PRACTICE;NO_ACTION/AI_COACH 始终在', () => {
    const offers = candidateOffersForCommunicationConflict({});
    const types = offers.map((o) => o.resource_type);
    expect(types).toContain('NO_ACTION');
    expect(types).toContain('AI_COACH');
    expect(types).not.toContain('PRACTICE');
  });
  it('有 approved content ref → 出现 PRACTICE', () => {
    const offers = candidateOffersForCommunicationConflict({ approvedPracticeContentRef: 'content.comm21.day1.practice' });
    expect(offers.map((o) => o.resource_type)).toContain('PRACTICE');
  });
  it('NO_ACTION provider_ref=null(不伪造 SYSTEM);AI_COACH provider_ref=自营', () => {
    const offers = candidateOffersForCommunicationConflict({});
    expect(offers.find((o) => o.resource_type === 'NO_ACTION')!.provider_ref).toBeNull();
    expect(offers.find((o) => o.resource_type === 'AI_COACH')!.provider_ref).toBe(SELF_AI_COACH_PROVIDER_REF);
  });
  it('EXTERNAL_REFERRAL 仅当配置目标才出现,且无需 provider_ref', () => {
    expect(candidateOffersForCommunicationConflict({}).map((o) => o.resource_type)).not.toContain('EXTERNAL_REFERRAL');
    const withRef = candidateOffersForCommunicationConflict({ externalReferralTargetRef: 'ext:crisis-line' });
    const ext = withRef.find((o) => o.resource_type === 'EXTERNAL_REFERRAL')!;
    expect(ext.provider_ref).toBeNull();
    expect(ext.external_referral_target_ref).toBe('ext:crisis-line');
  });
});

describe('eligibility (FAIL CLOSED;T1/T2 同函数;qualification_mode)', () => {
  const aiCoach = (): ResourceOfferDto => candidateOffersForCommunicationConflict({}).find((o) => o.resource_type === 'AI_COACH')!;
  const noAction = (): ResourceOfferDto => candidateOffersForCommunicationConflict({}).find((o) => o.resource_type === 'NO_ACTION')!;

  it('AI_COACH 全门通过 → eligible', () => {
    expect(evaluateOfferEligibility(aiCoach(), 'T1', baseCtx()).eligible).toBe(true);
  });
  it('consent 撤销 → AI_COACH INELIGIBLE(fail closed)', () => {
    const e = evaluateOfferEligibility(aiCoach(), 'T2', baseCtx({ requiredConsentGranted: false }));
    expect(e.eligible).toBe(false);
    expect(e.reason_codes).toContain('CONSENT_NOT_GRANTED');
  });
  it('provider 资格 SUSPENDED → REQUIRED offer INELIGIBLE', () => {
    const e = evaluateOfferEligibility(aiCoach(), 'T2', baseCtx({ providerQualificationActive: false }));
    expect(e.eligible).toBe(false);
    expect(e.reason_codes).toContain('PROVIDER_QUALIFICATION_NOT_ACTIVE');
  });
  it('HIGH_RISK 安全路由 → 任何执行 offer INELIGIBLE', () => {
    expect(evaluateOfferEligibility(aiCoach(), 'T2', baseCtx({ safetyRouteNormal: false })).eligible).toBe(false);
  });
  it('NO_ACTION 不因缺 provider 而失败(NOT_APPLICABLE)', () => {
    expect(evaluateOfferEligibility(noAction(), 'T1', baseCtx({ providerQualificationActive: false, available: false })).eligible).toBe(true);
  });
  it('T1 eligible 但 T2 consent 撤销 → T2 fail(T1≠T2)', () => {
    const t1 = evaluateOfferEligibility(aiCoach(), 'T1', baseCtx());
    const t2 = evaluateOfferEligibility(aiCoach(), 'T2', baseCtx({ requiredConsentGranted: false }));
    expect(t1.eligible).toBe(true);
    expect(t2.eligible).toBe(false);
  });
});

describe('recommendation (确定性排序,不编排;coverage)', () => {
  it('AI_COACH 排在 NO_ACTION 前;覆盖两能力;不含执行顺序字段', () => {
    const offers = candidateOffersForCommunicationConflict({});
    const rec = buildRecommendation({
      recommendationId: 'rec-1', intentId: 'intent-1', version: 1,
      requiredCapabilityKeys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'], eligibleOffers: offers,
    });
    const aiOffer = offers.find((o) => o.resource_type === 'AI_COACH')!;
    expect(rec.recommended_offer_refs).toContain(aiOffer.offer_id);
    expect(rec.uncovered_capability_keys).toEqual([]);
    // RANKING ≠ ORCHESTRATION:candidate 只有 rank,无 trigger/step/order。
    expect(Object.keys(rec.candidates[0])).not.toContain('trigger');
    expect(rec.candidates[0].rank).toBe(1);
  });
});

describe('decision integrity (禁注入任意 offer)', () => {
  const offers = candidateOffersForCommunicationConflict({});
  const rec = buildRecommendation({
    recommendationId: 'rec-1', intentId: 'intent-1', version: 3,
    requiredCapabilityKeys: ['DE_ESCALATION', 'COMMUNICATION_REOPENING'], eligibleOffers: offers,
  });
  it('ACCEPT 必须等于 recommended_offer_refs', () => {
    expect(checkDecisionIntegrity(rec, 'ACCEPT_RECOMMENDATION', rec.recommended_offer_refs, 3).ok).toBe(true);
    expect(checkDecisionIntegrity(rec, 'ACCEPT_RECOMMENDATION', ['offer:bogus:9'], 3).ok).toBe(false);
  });
  it('SELECT_ALTERNATIVE 必须是 candidates 子集且非空', () => {
    const oneCandidate = [rec.candidates[0].offer_ref];
    expect(checkDecisionIntegrity(rec, 'SELECT_ALTERNATIVE', oneCandidate, 3).ok).toBe(true);
    expect(checkDecisionIntegrity(rec, 'SELECT_ALTERNATIVE', [], 3).ok).toBe(false);
    expect(checkDecisionIntegrity(rec, 'SELECT_ALTERNATIVE', ['offer:bogus:9'], 3).ok).toBe(false);
  });
  it('DISMISS 必须为空;version 不匹配拒绝', () => {
    expect(checkDecisionIntegrity(rec, 'DISMISS', [], 3).ok).toBe(true);
    expect(checkDecisionIntegrity(rec, 'DISMISS', ['x'], 3).ok).toBe(false);
    expect(checkDecisionIntegrity(rec, 'ACCEPT_RECOMMENDATION', rec.recommended_offer_refs, 2).code).toBe('RECOMMENDATION_VERSION_MISMATCH');
  });
});
