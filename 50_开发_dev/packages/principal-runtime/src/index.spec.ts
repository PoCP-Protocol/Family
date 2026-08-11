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

describe('A3 evaluateProcessing (M3-INT-001 强化)', () => {
  const granted = resolvePrincipalConsent([row('AI_PERSONALIZATION', 'GRANTED')], 'child-1');
  // 默认:外部处理关闭、provider 未批、policy 未批、无对外类别白名单(即 internal profile)
  const base = {
    consent: granted, policyVersion: 'v1', policyVersionApproved: false,
    subjectPersonId: 'child-1', guardianPersonId: 'mom-1', minorData: false,
    providerApproved: false, externalProcessingEnabled: false,
    authorizedExternalCategories: [] as const,
  };
  // 一个"全部对外门打开"的外呼上下文(仅用于验证 ALLOW 路径)
  const externalOpen = {
    ...base, providerClass: 'EXTERNAL_PROVIDER' as const, providerApproved: true,
    externalProcessingEnabled: true, policyVersionApproved: true,
    authorizedExternalCategories: ['USER_PROVIDED_TEXT', 'MINIMAL_GROWTH_CONTEXT'] as const,
  };

  it('FAKE + 文本 + granted → ALLOW(无对外出口)', () => {
    const d = evaluateProcessing({ ...base, dataCategory: 'USER_PROVIDED_TEXT', providerClass: 'FAKE' });
    expect(d.decision).toBe('ALLOW');
  });
  it('FAKE + 图片 → DENY(图片需显式授权)', () => {
    expect(evaluateProcessing({ ...base, dataCategory: 'USER_PROVIDED_IMAGE', providerClass: 'FAKE' }).allowed).toBe(false);
  });
  it('EXTERNAL 默认关闭 → DENY', () => {
    expect(evaluateProcessing({ ...base, dataCategory: 'USER_PROVIDED_TEXT', providerClass: 'EXTERNAL_PROVIDER' }).decision).toBe('DENY');
  });
  it('EXTERNAL 全门通过 → ALLOW', () => {
    expect(evaluateProcessing({ ...externalOpen, dataCategory: 'USER_PROVIDED_TEXT' }).decision).toBe('ALLOW');
  });
  it('EXTERNAL provider 未批 → DENY', () => {
    expect(evaluateProcessing({ ...externalOpen, providerApproved: false, dataCategory: 'USER_PROVIDED_TEXT' }).allowed).toBe(false);
  });
  it('EXTERNAL policy 未批 → DENY', () => {
    expect(evaluateProcessing({ ...externalOpen, policyVersionApproved: false, dataCategory: 'USER_PROVIDED_TEXT' }).allowed).toBe(false);
  });
  it('EXTERNAL 类别不在白名单 → DENY', () => {
    expect(evaluateProcessing({ ...externalOpen, dataCategory: 'FAMILY_PRIVATE_TEXT' }).allowed).toBe(false);
  });
  it('EXTERNAL 未成年人数据未授权 → DENY', () => {
    expect(evaluateProcessing({ ...externalOpen, dataCategory: 'USER_PROVIDED_TEXT', minorData: true }).allowed).toBe(false);
  });
  it('EXTERNAL 图片 → DENY(M3-102 隔离)', () => {
    const withImg = { ...externalOpen, authorizedExternalCategories: ['USER_PROVIDED_IMAGE'] as const };
    expect(evaluateProcessing({ ...withImg, dataCategory: 'USER_PROVIDED_IMAGE' }).allowed).toBe(false);
  });
  it('FAMILY_AGGREGATE → DENY', () => {
    expect(evaluateProcessing({ ...externalOpen, dataCategory: 'FAMILY_AGGREGATE' }).allowed).toBe(false);
  });
  it('consent 未允许 → DENY', () => {
    const denied = resolvePrincipalConsent([], 'child-1');
    expect(evaluateProcessing({ ...externalOpen, consent: denied, dataCategory: 'USER_PROVIDED_TEXT' }).allowed).toBe(false);
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
