import { describe, expect, it } from 'vitest';
import { assertFamilyRoleCan, roleCan, decisionFor, type FamilyRole } from './family-authorization.policy';

/** TENANCY-V2 T2 · Family 角色→NamedAction 显式矩阵真值(裁决 §6)。 */
describe('FamilyAuthorizationPolicy explicit matrix', () => {
  it('OWNER_GUARDIAN 可做全部登记的 NamedAction', () => {
    for (const a of ['ReadFamily','AddChild','InviteAdult','RevokeMembership','GrantConsent','WithdrawConsent','RecordPerspective','ConfirmGrowthPriority','StartIntervention','CompleteAction','GrantExternalAccess'] as const) {
      expect(roleCan('OWNER_GUARDIAN', a)).toBe(true);
    }
  });

  it('CHILD_SUBJECT 不能 AddChild/GrantConsent/StartIntervention/ConfirmGrowthPriority', () => {
    for (const a of ['AddChild','GrantConsent','WithdrawConsent','InviteAdult','ConfirmGrowthPriority','StartIntervention','CompleteAction'] as const) {
      expect(roleCan('CHILD_SUBJECT', a)).toBe(false);
    }
    expect(roleCan('CHILD_SUBJECT', 'ReadFamily')).toBe(true);      // LIMITED = 过角色门
    expect(roleCan('CHILD_SUBJECT', 'RecordPerspective')).toBe(true); // LIMITED
  });

  it('ADULT_MEMBER 不能 AddChild/InviteAdult/GrantConsent/RevokeMembership/GrantExternalAccess', () => {
    for (const a of ['AddChild','InviteAdult','GrantConsent','WithdrawConsent','RevokeMembership','GrantExternalAccess'] as const) {
      expect(roleCan('ADULT_MEMBER', a)).toBe(false);
    }
    expect(roleCan('ADULT_MEMBER', 'RecordPerspective')).toBe(true);
    expect(roleCan('ADULT_MEMBER', 'CompleteAction')).toBe(true);
  });

  it('GUARDIAN 可做家庭管理类;RevokeMembership/GrantExternalAccess = LIMITED', () => {
    expect(roleCan('GUARDIAN', 'AddChild')).toBe(true);
    expect(roleCan('GUARDIAN', 'GrantConsent')).toBe(true);
    expect(decisionFor('GUARDIAN', 'RevokeMembership')).toBe('LIMITED');
    expect(decisionFor('GUARDIAN', 'GrantExternalAccess')).toBe('LIMITED');
  });

  it('assertFamilyRoleCan 对 DENY 抛 403,ALLOW/LIMITED 放行', () => {
    expect(() => assertFamilyRoleCan('CHILD_SUBJECT', 'AddChild')).toThrow(/cannot_AddChild/);
    expect(() => assertFamilyRoleCan('OWNER_GUARDIAN', 'AddChild')).not.toThrow();
    expect(() => assertFamilyRoleCan('CHILD_SUBJECT', 'ReadFamily')).not.toThrow(); // LIMITED 放行
  });

  it('未知角色 → fail closed(DENY)', () => {
    expect(roleCan('STRANGER' as FamilyRole, 'ReadFamily')).toBe(false);
  });
});
