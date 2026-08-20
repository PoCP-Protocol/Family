export const MEMBERSHIP_ENTITLEMENT_ACTIONS = ['SUBSCRIBE_MEMBERSHIP', 'CONSUME_BENEFIT', 'REVOKE_BENEFIT'] as const;
export type MembershipEntitlementAction = (typeof MEMBERSHIP_ENTITLEMENT_ACTIONS)[number];

export const MEMBERSHIP_ENTITLEMENT_PAGE_IDS = ['UI-30', 'UI-31', 'UI-32'] as const;
export type MembershipEntitlementPageId = (typeof MEMBERSHIP_ENTITLEMENT_PAGE_IDS)[number];

export type MembershipSubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
export type MembershipBenefitGrantStatus = 'PENDING' | 'AVAILABLE' | 'CONSUMED' | 'REVOKED' | 'EXPIRED';
export type MembershipBenefitLedgerAction = 'GRANT' | 'CONSUME' | 'REVOKE';

/**
 * Scope rules shared by the migration, service and controller:
 * - plan and benefit definition: PLATFORM or TENANT catalogue master; never family transaction facts.
 * - subscription/grant/ledger: Tenant + Family facts; actor is server derived; subject is nullable
 *   because a family membership can be family-level rather than child-specific.
 * - client commands never provide tenant_id, family_id, actor_person_id, subject_person_id,
 *   price, payment, contact, external adapter or free-form operational payload.
 */
export interface SubscribeMembershipDto {
  page_id?: MembershipEntitlementPageId;
  plan_ref?: string;
  plan_version?: number;
  subject_person_id?: string;
  attributes?: Record<string, unknown>;
}

export interface ConsumeMembershipBenefitDto {
  page_id?: MembershipEntitlementPageId;
  benefit_grant_id?: string;
  expected_row_version?: number;
  units?: number;
  attributes?: Record<string, unknown>;
}

export interface RevokeMembershipBenefitDto {
  page_id?: MembershipEntitlementPageId;
  benefit_grant_id?: string;
  expected_row_version?: number;
}

export interface MembershipPlanReadModel {
  plan_id: string;
  scope_type: 'PLATFORM' | 'TENANT';
  tenant_id: string | null;
  plan_ref: string;
  version_no: number;
  title: string;
  status: 'ACTIVE';
  effective_from: string;
  effective_to: string | null;
  attributes_schema_version: number;
  fixture_only: true;
  benefits: Array<{
    benefit_definition_id: string;
    benefit_ref: string;
    title: string;
    allocation_type: 'COUNT' | 'ACCESS' | 'CREDIT';
    units_per_grant: number;
    valid_days: number | null;
  }>;
}

export interface MembershipSubscriptionReceipt {
  membership_subscription_id: string;
  subscription_ref: string;
  plan_ref: string;
  plan_version: number;
  status: MembershipSubscriptionStatus;
  subject_person_id: string | null;
  row_version: number;
  event_id: string;
  external_effect: false;
  environment: 'DEV' | 'TEST';
  text_equivalent: string;
}

export interface MembershipBenefitGrantReceipt {
  benefit_grant_id: string;
  benefit_ref: string;
  status: MembershipBenefitGrantStatus;
  allocated_units: number;
  remaining_units: number;
  valid_from: string;
  valid_to: string | null;
  row_version: number;
  external_effect: false;
  text_equivalent: string;
}

export interface MembershipBenefitActionReceipt {
  benefit_grant_id: string;
  action: MembershipBenefitLedgerAction;
  status: MembershipBenefitGrantStatus;
  remaining_units: number;
  row_version: number;
  event_id: string;
  external_effect: false;
  text_equivalent: string;
}

export interface FamilyMembershipAssetProjection {
  tenant_id: string;
  family_id: string;
  projection_version: number;
  as_of: string;
  source_refs: string[];
  policy_version: string | null;
  visibility: 'FAMILY_PRIVATE';
  expires_at: string | null;
  subscriptions: Array<{
    membership_subscription_id: string;
    subscription_ref: string;
    plan_ref: string;
    plan_version: number;
    status: MembershipSubscriptionStatus;
    subject_person_id: string | null;
    effective_from: string;
    effective_to: string | null;
    row_version: number;
  }>;
  benefits: Array<{
    benefit_grant_id: string;
    benefit_ref: string;
    status: MembershipBenefitGrantStatus;
    allocated_units: number;
    remaining_units: number;
    valid_from: string;
    valid_to: string | null;
    row_version: number;
  }>;
  /** Dev-only read snapshot; never a production points ledger or redemption balance. */
  dev_points?: {
    balance: number;
    source: 'DEV_FIXTURE';
    redeemable: false;
  };
  text_equivalent: string;
}

export function isMembershipEntitlementAction(value: unknown): value is MembershipEntitlementAction {
  return typeof value === 'string' && (MEMBERSHIP_ENTITLEMENT_ACTIONS as readonly string[]).includes(value);
}

export function pageAllowedForMembershipEntitlement(value: unknown): value is MembershipEntitlementPageId {
  return typeof value === 'string' && (MEMBERSHIP_ENTITLEMENT_PAGE_IDS as readonly string[]).includes(value);
}

export function membershipEntitlementTextEquivalent(action: MembershipEntitlementAction): string {
  if (action === 'SUBSCRIBE_MEMBERSHIP') {
    return '已生成当前家庭的会员订阅与权益回执。本次不会扣款、续费、发送通知或启用生产权益。';
  }
  if (action === 'CONSUME_BENEFIT') {
    return '已记录本次权益使用回执。本次不会调用外部服务、发送通知或改变生产权益。';
  }
  return '已撤销当前可撤销的权益回执。本次不会扣款、发送通知或影响其他家庭资产。';
}
