export const COMMERCE_INTENT_ACTIONS = ['SUBMIT_ORDER_INTENT', 'CANCEL_ORDER_INTENT'] as const;
export type CommerceIntentAction = (typeof COMMERCE_INTENT_ACTIONS)[number];

export const COMMERCE_INTENT_PAGE_IDS = ['UI-14', 'UI-17'] as const;
export type CommerceIntentPageId = (typeof COMMERCE_INTENT_PAGE_IDS)[number];

export type OrderIntentStatus = 'DRAFT' | 'SUBMITTED' | 'CANCELLED' | 'EXPIRED';
export type EntitlementStatus = 'PENDING' | 'AVAILABLE' | 'REVOKED' | 'EXPIRED';

/**
 * Command object only. tenant_id/family_id/actor_person_id/currency/price/payment/contact
 * are intentionally absent: server derives scope and DEV/TEST never creates a payment.
 */
export interface SubmitOrderIntentDto {
  page_id?: CommerceIntentPageId;
  product_ref?: string;
  product_version?: number;
  attributes?: Record<string, unknown>;
}

export interface CancelOrderIntentDto {
  page_id?: CommerceIntentPageId;
  order_intent_id?: string;
  expected_row_version?: number;
}

export interface CommerceProductReadModel {
  product_id: string;
  product_ref: string;
  product_version: number;
  title: string;
  admission_status: 'ADMITTED';
  source_ref: string;
  fixture_only: true;
  attributes_schema_version: number;
}

export interface OrderIntentReceipt {
  order_intent_id: string;
  intent_ref: string;
  status: OrderIntentStatus;
  product_ref: string;
  product_version: number;
  row_version: number;
  event_id: string;
  external_effect: false;
  environment: 'DEV' | 'TEST';
  text_equivalent: string;
}

export interface FamilyEntitlementReceipt {
  entitlement_id: string;
  entitlement_ref: string;
  status: EntitlementStatus;
  source_order_intent_id: string;
  asset_projection_version: number;
  external_effect: false;
  text_equivalent: string;
}

export interface CustomerCommerceProjection {
  tenant_id: string;
  family_id: string;
  projection_version: number;
  as_of: string;
  source_refs: string[];
  policy_version: string | null;
  visibility: 'FAMILY_PRIVATE';
  expires_at: string | null;
  order_intents: Array<{
    order_intent_id: string;
    intent_ref: string;
    status: OrderIntentStatus;
    product_ref: string;
    product_version: number;
    created_at: string;
  }>;
  entitlements: Array<{
    entitlement_id: string;
    entitlement_ref: string;
    status: EntitlementStatus;
    source_order_intent_id: string;
    available_at: string | null;
    expires_at: string | null;
  }>;
  text_equivalent: string;
}

export function isCommerceIntentAction(value: unknown): value is CommerceIntentAction {
  return typeof value === 'string' && (COMMERCE_INTENT_ACTIONS as readonly string[]).includes(value);
}

export function pageAllowedForCommerceIntent(value: unknown): value is CommerceIntentPageId {
  return typeof value === 'string' && (COMMERCE_INTENT_PAGE_IDS as readonly string[]).includes(value);
}

/** Only a versioned, admitted DEV/TEST product can be selected in this slice. */
export function commerceIntentTextEquivalent(action: CommerceIntentAction): string {
  return action === 'SUBMIT_ORDER_INTENT'
    ? '已记录你的选择，并生成可查看的服务权益回执。本次不会扣款、创建外部订单、发送通知或启用生产权益。'
    : '已取消本次选择。不会扣款、不会发送通知，也不会影响其他服务记录。';
}
