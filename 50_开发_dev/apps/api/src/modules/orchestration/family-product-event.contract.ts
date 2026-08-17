export const FAMILY_PRODUCT_EVENT_SCHEMA_VERSION = 1;

export const FAMILY_PRODUCT_EVENT_TYPES = [
  'page_view', 'explanation_requested', 'need_confirmed', 'decision_submitted', 'no_action_selected',
  'task_completed', 'report_opened', 'report_withdrawn', 'catalog_viewed', 'catalog_item_opened',
  'invite_created', 'group_created', 'provider_viewed', 'activity_viewed', 'booking_requested',
  'registration_requested', 'booking_cancelled', 'community_viewed', 'template_opened',
  'publication_recorded', 'service_record_viewed', 'profile_viewed', 'record_withdrawn', 'asset_revoked',
  'order_intent_submitted', 'order_intent_cancelled', 'entitlement_receipted',
  'booking_request_submitted', 'booking_request_cancelled',
  'membership_subscribed', 'membership_benefit_consumed', 'membership_benefit_revoked',
] as const;
export type FamilyProductEventType = (typeof FAMILY_PRODUCT_EVENT_TYPES)[number];

export type FamilyProductEventScope = 'TENANT' | 'TENANT_FAMILY';

export interface RecordFamilyProductEventInput {
  tenantId: string;
  familyId?: string | null;
  actorId?: string | null;
  eventType: FamilyProductEventType;
  objectType: string;
  objectId?: string | null;
  sourcePageId?: string | null;
  purpose: 'PRODUCT_EXPERIENCE' | 'SERVICE_PLANNING' | 'ACCESSIBILITY' | 'MULTIMODAL_ASSIST';
  consentRef?: string | null;
  correlationId: string;
  payload?: Record<string, unknown>;
  retentionClass?: 'PRODUCT_EVENT_MINIMAL' | 'FAMILY_EVENT_SHORT' | 'AUDIT_REVIEW_REQUIRED';
  createdBy?: string | null;
}

export interface FamilyProductEventReceipt {
  eventId: string;
  eventType: FamilyProductEventType;
  tenantId: string;
  familyId: string | null;
  correlationId: string;
  schemaVersion: number;
  recorded: true;
  externalEffect: false;
}

export const FORBIDDEN_PRODUCT_EVENT_KEYS = [
  'raw_prompt', 'provider_prompt', 'provider_response', 'api_key', 'authorization',
  'raw_media', 'child_profile', 'permanent_label', 'risk_level', 'diagnosis', 'ranking',
] as const;
