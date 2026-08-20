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
  | 'ConfirmGrowthPriority' | 'StartIntervention' | 'CompleteAction' | 'GrantExternalAccess'
  // FAMILY-GROWTH-VERTICAL-SLICE-001 · V3 编排 NamedActions(家长面向 12–15 纵切)。
  | 'RequestGrowthHelp' | 'ConfirmGrowthIntent' | 'DecideGrowthService' | 'SubmitServiceFollowUp'
  | 'ExecuteTestExperienceAction' | 'ExecuteFamilyPageObjectAction'
  | 'SubmitCommerceIntent' | 'SubmitServiceBooking' | 'ManageMembershipEntitlement'
  | 'CreateJourneyPlan' | 'ConfirmJourneyPlan' | 'PauseJourneyPlan' | 'ReviewJourneyPhase';
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
  // V3 编排(3A §20 保守首版:本纵切家长/监护人面向;ADULT_MEMBER/CHILD_SUBJECT 一律 DENY,不用 LIMITED 作未兑现承诺;
  // 待专门的孩子/成员权利设计再放宽)。
  RequestGrowthHelp:     { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  ConfirmGrowthIntent:   { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  DecideGrowthService:   { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  SubmitServiceFollowUp: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  // 34 页商业流程的真实 DEV/TEST 状态机：仅测试 fixture、测试数据库和零外部副作用；仍由领域层校验 page/action/fixture/consent。
  ExecuteTestExperienceAction: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  ExecuteFamilyPageObjectAction: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  // 商城商品→订单意向→权益回执：仅本地 DEV/TEST 数据与 no-op adapter，不能触发支付或生产权益。
  SubmitCommerceIntent: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  // 服务供给→预约请求→服务记录：仅本地 DEV/TEST 供给与 no-op 通知适配器，不确认真人服务。
  SubmitServiceBooking: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  // 会员计划→订阅→权益授予/消耗/撤销：仅 DEV/TEST 事实与 no-op 支付/通知，不写生产会员权益。
  ManageMembershipEntitlement: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  // 90 天 Journey 是家庭确认的成长节奏；阶段变化不能由儿童/普通成员单方推进。
  CreateJourneyPlan: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  ConfirmJourneyPlan: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  PauseJourneyPlan: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
  ReviewJourneyPhase: { OWNER_GUARDIAN: 'ALLOW', GUARDIAN: 'ALLOW', ADULT_MEMBER: 'DENY', CHILD_SUBJECT: 'DENY' },
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
