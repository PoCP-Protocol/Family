import { describe, expect, it } from 'vitest';
import { buildCandidates, evaluateExecutionEligibility, evaluateRecommendationEligibility } from './orchestration.policy';
import type { ResourceOffer } from './orchestration.types';

function offer(input: Partial<ResourceOffer>): ResourceOffer {
  return {
    resource_offer_id: input.resource_offer_id ?? '00000000-0000-4000-8000-000000000001',
    resource_code: input.resource_code ?? 'V3_AI_COACH_COMMUNICATION',
    resource_type: input.resource_type ?? 'AI_COACH',
    capability_codes: input.capability_codes ?? ['COMMUNICATION_REOPENING'],
    title: input.title ?? '提示', description: input.description ?? '低风险提示',
    age_scope: input.age_scope ?? 'EARLY_ADOLESCENCE_12_15', age_min_months: input.age_min_months ?? 144, age_max_months: input.age_max_months ?? 191,
    life_stage_scope: input.life_stage_scope ?? ['EARLY_ADOLESCENCE_12_15'],
    need_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT', evidence_level: input.evidence_level ?? 'E0_INTERNAL_CURATED', risk_boundary: input.risk_boundary ?? 'LOW_RISK_NON_CLINICAL',
    privacy_boundary: input.privacy_boundary ?? 'FAMILY_SCOPED_NO_EXTERNAL_DISCLOSURE', effort_class: input.effort_class ?? 'LOW', duration_class: input.duration_class ?? 'MOMENT', cost_class: input.cost_class ?? 'FREE',
    requires_consent: input.requires_consent ?? true, requires_human: input.requires_human ?? false,
    content_ref: input.content_ref ?? null, provider_qualification: input.provider_qualification ?? 'INTERNAL_DETERMINISTIC',
    availability_status: input.availability_status ?? 'ACTIVE', policy_version: input.policy_version ?? 'test',
  };
}

describe('FAMILY-GROWTH-VERTICAL-SLICE-001 policy', () => {
  it('requires active SERVICE consent for AI/Practice but preserves NO_ACTION as an eligible family choice', () => {
    const noAction = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000010', resource_code: 'V3_NO_ACTION_COMMUNICATION', resource_type: 'NO_ACTION' });
    const coach = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000011', resource_code: 'V3_AI_COACH_COMMUNICATION', resource_type: 'AI_COACH' });
    expect(evaluateRecommendationEligibility(noAction, false)).toMatchObject({ result: 'ELIGIBLE' });
    expect(evaluateRecommendationEligibility(coach, false)).toMatchObject({ result: 'INELIGIBLE', reasonCode: 'SERVICE_CONSENT_REQUIRED' });
  });

  it('fails closed when a Practice lacks an approved content reference', () => {
    const practice = offer({ resource_type: 'PRACTICE', resource_code: 'V3_PRACTICE_COMMUNICATION', content_ref: null });
    expect(evaluateRecommendationEligibility(practice, true)).toMatchObject({ result: 'INELIGIBLE', reasonCode: 'PRACTICE_CONTENT_NOT_APPROVED' });
  });

  it('sorts only eligible resources with fixed low-risk order and contains no commercial signal', () => {
    const coach = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000021', resource_code: 'V3_AI_COACH_COMMUNICATION', resource_type: 'AI_COACH' });
    const practice = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000022', resource_code: 'V3_PRACTICE_COMMUNICATION', resource_type: 'PRACTICE', content_ref: 'approved-ref' });
    const inactive = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000023', resource_code: 'V3_EXTERNAL_REFERRAL_COMMUNICATION', resource_type: 'EXTERNAL_REFERRAL', availability_status: 'INACTIVE' });
    const offers = [practice, inactive, coach];
    const evaluations = offers.map((item) => evaluateRecommendationEligibility(item, true));
    expect(buildCandidates(offers, evaluations).map((item) => item.resourceCode)).toEqual(['V3_AI_COACH_COMMUNICATION', 'V3_PRACTICE_COMMUNICATION']);
  });

  it('rechecks execution eligibility and retains the external-referral boundary', () => {
    const referral = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000031', resource_code: 'V3_EXTERNAL_REFERRAL_COMMUNICATION', resource_type: 'EXTERNAL_REFERRAL', risk_boundary: 'REFER_ONLY' });
    expect(evaluateExecutionEligibility(referral, true)).toMatchObject({ result: 'ELIGIBLE', reasonCode: 'REFERRAL_INFORMATION_ONLY' });
  });
});


describe('V3 resource-network authorization boundary', () => {
  it('keeps future Program resources in the shared network but fail-closes them before their own runtime gate', () => {
    const program = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000041', resource_code: 'FUTURE_PROGRAM_COMMUNICATION', resource_type: 'PROGRAM', content_ref: 'bangyang-program-ref' });
    expect(evaluateRecommendationEligibility(program, true)).toMatchObject({ result: 'INELIGIBLE', reasonCode: 'RESOURCE_TYPE_NOT_AUTHORIZED_FOR_VERTICAL' });
  });

  it('does not make the family choice of NO_ACTION dependent on SERVICE consent', () => {
    const noAction = offer({ resource_offer_id: '00000000-0000-4000-8000-000000000042', resource_code: 'V3_NO_ACTION_COMMUNICATION', resource_type: 'NO_ACTION', requires_consent: true });
    expect(evaluateRecommendationEligibility(noAction, false)).toMatchObject({ result: 'ELIGIBLE' });
  });
});
