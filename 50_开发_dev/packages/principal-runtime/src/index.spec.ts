import { describe, it, expect } from 'vitest';
import {
  resolvePrincipalConsent,
  evaluateProcessing,
  buildPrincipalFamilyContext,
  type CanonicalConsentRow,
  type FamilyReadModelSlice,
} from './index';

const row = (p: CanonicalConsentRow['purpose'], s: CanonicalConsentRow['status']): CanonicalConsentRow => ({
  subject_person_id: 'child-1', guardian_person_id: 'mom-1', purpose: p, status: s, policy_version: 'v1',
});

describe('A2 resolvePrincipalConsent', () => {
  it('AI_PERSONALIZATION GRANTED → allowed', () => {
    expect(resolvePrincipalConsent([row('AI_PERSONALIZATION', 'GRANTED')], 'child-1').allowed).toBe(true);
  });
  it('missing → denied', () => {
    expect(resolvePrincipalConsent([], 'child-1').allowed).toBe(false);
  });
  it('SERVICE only → denied (无静默拓宽)', () => {
    expect(resolvePrincipalConsent([row('SERVICE', 'GRANTED')], 'child-1').allowed).toBe(false);
  });
  it('GROWTH_TRACKING only → denied', () => {
    expect(resolvePrincipalConsent([row('GROWTH_TRACKING', 'GRANTED')], 'child-1').allowed).toBe(false);
  });
  it('ASSESSMENT only → denied', () => {
    expect(resolvePrincipalConsent([row('ASSESSMENT', 'GRANTED')], 'child-1').allowed).toBe(false);
  });
  it('WITHDRAWN → denied', () => {
    expect(resolvePrincipalConsent([row('AI_PERSONALIZATION', 'WITHDRAWN')], 'child-1').allowed).toBe(false);
  });
  it('EXPIRED → denied', () => {
    expect(resolvePrincipalConsent([row('AI_PERSONALIZATION', 'EXPIRED')], 'child-1').allowed).toBe(false);
  });
  it('其他 subject 的同意不算数', () => {
    const other: CanonicalConsentRow = { ...row('AI_PERSONALIZATION', 'GRANTED'), subject_person_id: 'child-2' };
    expect(resolvePrincipalConsent([other], 'child-1').allowed).toBe(false);
  });
});

describe('A3 evaluateProcessing', () => {
  const granted = resolvePrincipalConsent([row('AI_PERSONALIZATION', 'GRANTED')], 'child-1');
  const base = { consent: granted, policyVersion: 'v1', subjectPersonId: 'child-1', guardianPersonId: 'mom-1', minorData: true } as const;
  it('FAKE + minimal + granted → allowed', () => {
    expect(evaluateProcessing({ ...base, dataCategory: 'MINIMAL_GROWTH_CONTEXT', providerClass: 'FAKE' }).allowed).toBe(true);
  });
  it('EXTERNAL_PROVIDER → FAIL_CLOSED', () => {
    expect(evaluateProcessing({ ...base, dataCategory: 'MINIMAL_GROWTH_CONTEXT', providerClass: 'EXTERNAL_PROVIDER' }).allowed).toBe(false);
  });
  it('PRIVATE_TEXT → 拒绝(超最小必要)', () => {
    expect(evaluateProcessing({ ...base, dataCategory: 'PRIVATE_TEXT', providerClass: 'FAKE' }).allowed).toBe(false);
  });
  it('FAMILY_AGGREGATE → 拒绝', () => {
    expect(evaluateProcessing({ ...base, dataCategory: 'FAMILY_AGGREGATE', providerClass: 'FAKE' }).allowed).toBe(false);
  });
  it('consent 未允许 → 拒绝', () => {
    const denied = resolvePrincipalConsent([], 'child-1');
    expect(evaluateProcessing({ ...base, consent: denied, dataCategory: 'MINIMAL_GROWTH_CONTEXT', providerClass: 'FAKE' }).allowed).toBe(false);
  });
});

describe('A4 buildPrincipalFamilyContext', () => {
  const slice: FamilyReadModelSlice = {
    familyRef: 'F-1', subjectRef: 'child-1', lifeStage: 'EARLY_ADOLESCENCE_12_15',
    confirmedGrowthPriority: ['P03'], activeIntervention: ['LISTEN_BEFORE_RESPOND'],
    recentGrowthActionState: ['ASSIGNED'], recentPermittedObservationSummary: ['ok'],
  };
  it('granted → 仅白名单字段', () => {
    const ctx = buildPrincipalFamilyContext(slice, resolvePrincipalConsent([row('AI_PERSONALIZATION', 'GRANTED')], 'child-1'));
    expect(ctx).not.toBeNull();
    expect(Object.keys(ctx!).sort()).toEqual([
      'activeIntervention', 'confirmedGrowthPriority', 'contextVersion', 'familyRef',
      'lifeStage', 'recentGrowthActionState', 'recentPermittedObservationSummary', 'subjectRef',
    ]);
  });
  it('denied → null(输出=0,不偷偷降级)', () => {
    expect(buildPrincipalFamilyContext(slice, resolvePrincipalConsent([], 'child-1'))).toBeNull();
  });
});
