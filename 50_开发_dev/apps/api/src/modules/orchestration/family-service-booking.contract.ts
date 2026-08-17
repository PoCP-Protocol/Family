export const SERVICE_BOOKING_ACTIONS = ['REQUEST_BOOKING', 'CANCEL_BOOKING'] as const;
export type ServiceBookingAction = (typeof SERVICE_BOOKING_ACTIONS)[number];

export const SERVICE_BOOKING_PAGE_IDS = ['UI-19', 'UI-20', 'UI-21', 'UI-24'] as const;
export type ServiceBookingPageId = (typeof SERVICE_BOOKING_PAGE_IDS)[number];

export type BookingRequestStatus = 'DRAFT' | 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type AvailabilitySlotStatus = 'AVAILABLE' | 'RESERVED' | 'BLOCKED' | 'EXPIRED';
export type ServiceRecordStatus = 'PENDING' | 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

/** Client never provides tenant/family/provider qualification/notification recipient or raw consultation content. */
export interface RequestBookingDto {
  page_id?: ServiceBookingPageId;
  service_offering_ref?: string;
  service_offering_version?: number;
  availability_slot_ref?: string;
  attributes?: Record<string, unknown>;
}

export interface CancelBookingDto {
  page_id?: ServiceBookingPageId;
  booking_request_id?: string;
  expected_row_version?: number;
}

export interface ServiceOfferingReadModel {
  service_offering_id: string;
  service_offering_ref: string;
  version_no: number;
  title: string;
  provider_ref: string;
  provider_display_name: string;
  qualification_status: 'ACTIVE';
  admission_status: 'ADMITTED';
  fixture_only: true;
  attributes_schema_version: number;
}

export interface AvailabilitySlotReadModel {
  availability_slot_id: string;
  availability_slot_ref: string;
  service_offering_ref: string;
  starts_at: string;
  ends_at: string;
  channel: 'VIDEO' | 'TEXT' | 'OFFLINE';
  status: 'AVAILABLE' | 'RESERVED';
}

export interface BookingRequestReceipt {
  booking_request_id: string;
  booking_ref: string;
  status: BookingRequestStatus;
  service_offering_ref: string;
  availability_slot_ref: string;
  row_version: number;
  event_id: string;
  external_effect: false;
  environment: 'DEV' | 'TEST';
  text_equivalent: string;
}

export interface FamilyServiceRecordReceipt {
  service_record_id: string;
  status: ServiceRecordStatus;
  source_booking_request_id: string;
  projection_version: number;
  external_effect: false;
  text_equivalent: string;
}

export interface FamilyBookingProjection {
  tenant_id: string;
  family_id: string;
  projection_version: number;
  as_of: string;
  source_refs: string[];
  policy_version: string | null;
  visibility: 'FAMILY_PRIVATE';
  expires_at: string | null;
  bookings: Array<{
    booking_request_id: string;
    booking_ref: string;
    status: BookingRequestStatus;
    service_offering_ref: string;
    availability_slot_ref: string;
    starts_at: string;
    channel: 'VIDEO' | 'TEXT' | 'OFFLINE';
  }>;
  service_records: Array<{
    service_record_id: string;
    source_booking_request_id: string;
    status: ServiceRecordStatus;
  }>;
  text_equivalent: string;
}

export function pageAllowedForServiceBooking(value: unknown): value is ServiceBookingPageId {
  return typeof value === 'string' && (SERVICE_BOOKING_PAGE_IDS as readonly string[]).includes(value);
}

export function serviceBookingTextEquivalent(action: ServiceBookingAction): string {
  return action === 'REQUEST_BOOKING'
    ? '已记录你的服务预约选择，并生成可查看的服务记录回执。本次不会发送通知、确认真人服务或写入生产日程。'
    : '已取消本次预约选择。不会发送通知，也不会影响其他服务记录。';
}
