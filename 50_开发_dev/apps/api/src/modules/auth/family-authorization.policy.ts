import { ForbiddenException } from '@nestjs/common';

/**
 * TENANCY-V2 T2 · FamilyAuthorizationPolicy(显式 Family 角色→NamedAction 权限矩阵)。
 * 明确禁止:通用 RBAC 引擎 / 权限 DSL / `role==='ADMIN' → allow everything`。
 * 这是一张【硬编码显式矩阵】。'LIMITED' = 过角色门,但更细的业务限制由领域层细化(后续)。
 */
export type FamilyRole = 'OWNER_GUARDIAN' | 'GUARDIAN' | 'ADULT_MEMBER' | 'CHILD_SUBJECT';
export type FamilyNamedAction =
  | 'ReadFamily' | 'AddChild' | 'InviteAdult' | 'RevokeMembership'
  | 'GrantConsent' | 'WithdrawConsent' | 'RecordPerspective'
  | 'ConfirmGrowthPriority' | 'StartIntervention' | 'CompleteAction' | 'GrantExternalAccess';
type Decision = 'ALLOW' | 'DENY' | 'LIMITED';

// 显式矩阵(裁决 §6):行=NamedAction,列=角色。缺省视为 DENY(fail closed)。
const MATRIX: Record<FamilyNamedAction, Record<FamilyRole, Decision>> = {
  ReadFamily:            { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'LIMITED', CHILD_SUBJECT: 'LIMITED' },
  AddChild:              { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY',    CHILD_SUBJECT: 'DENY' },
  InviteAdult:           { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY',    CHILD_SUBJECT: 'DENY' },
  RevokeMembership:      { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'LIMITED', ADULT_MEMBER: 'DENY',  CHILD_SUBJECT: 'DENY' },
  GrantConsent:          { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY',    CHILD_SUBJECT: 'DENY' },
  WithdrawConsent:       { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY',    CHILD_SUBJECT: 'DENY' },
  RecordPerspective:     { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'ALLOW',   CHILD_SUBJECT: 'LIMITED' },
  ConfirmGrowthPriority: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'LIMITED', CHILD_SUBJECT: 'DENY' },
  StartIntervention:     { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'LIMITED', CHILD_SUBJECT: 'DENY' },
  CompleteAction:        { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'ALLOW',   CHILD_SUBJECT: 'DENY' },
  GrantExternalAccess:   { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'LIMITED', ADULT_MEMBER: 'DENY',  CHILD_SUBJECT: 'DENY' },
};

/** 该角色能否执行该 NamedAction(DENY / 缺省 → 不能;ALLOW/LIMITED → 能过角色门)。 */
export function roleCan(role: FamilyRole, action: FamilyNamedAction): boolean {
  const d = MATRIX[action]?.[role];
  return d === 'ALLOW' || d === 'LIMITED';
}
export function decisionFor(role: FamilyRole, action: FamilyNamedAction): Decision {
  return MATRIX[action]?.[role] ?? 'DENY';
}

/** 显式断言:角色不允许该 NamedAction → 403。领域层可在 'LIMITED' 上再加细化限制。 */
export function assertFamilyRoleCan(role: FamilyRole, action: FamilyNamedAction): void {
  if (!roleCan(role, action)) {
    throw new ForbiddenException(`family_role_${role}_cannot_${action}`);
  }
}
