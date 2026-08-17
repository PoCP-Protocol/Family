export type FamilyObjectSource = 'TEST_FIXTURE' | 'FAMILY_EXPRESSION' | 'SERVICE_PROJECTION' | 'SERVICE_RECORD' | 'SERVICE_CASE' | 'TEST_EXPERIENCE_OPERATION';
export type FamilyPrivateVisibility = 'FAMILY_PRIVATE';

export type FamilyPageTaskStatus = 'OPEN' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
export type FamilySupportReportStatus = 'DRAFT' | 'SHOWN' | 'WITHDRAWN';
export type FamilyServiceRecordStatus = 'RECORDED' | 'CANCELLED';

export interface FamilyProfileSnapshotDto {
  profile_snapshot_id: string;
  family_id: string;
  source: Extract<FamilyObjectSource, 'TEST_FIXTURE' | 'FAMILY_EXPRESSION' | 'SERVICE_PROJECTION'>;
  visibility: FamilyPrivateVisibility;
  version: number;
  members: Array<{ person_id: string; person_type: 'PARENT' | 'CHILD'; display_name: string; life_stage: string | null }>;
  active_intent_refs: string[];
  active_service_record_count: number;
  created_at: string;
  withdrawn_at: string | null;
}

export interface FamilySupportReportSnapshotDto {
  report_snapshot_id: string;
  family_id: string;
  intent_ref: string | null;
  source: Extract<FamilyObjectSource, 'FAMILY_EXPRESSION' | 'SERVICE_RECORD' | 'TEST_FIXTURE'>;
  status: FamilySupportReportStatus;
  visibility: FamilyPrivateVisibility;
  evidence_refs: string[];
  support_summary: Array<{ key: string; value: string; source: string }>;
  created_at: string;
  withdrawn_at: string | null;
}

export interface FamilyPageTaskItemDto {
  task_id: string;
  family_id: string;
  source_page_id: string;
  subject_person_id: string | null;
  plan_ref: string | null;
  source: Extract<FamilyObjectSource, 'TEST_FIXTURE' | 'FAMILY_EXPRESSION' | 'SERVICE_CASE'>;
  title: string;
  status: FamilyPageTaskStatus;
  duration_minutes: number | null;
  text_equivalent: string;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface FamilyServiceRecordDto {
  service_record_id: string;
  family_id: string;
  case_ref: string | null;
  operation_ref: string | null;
  record_kind: string;
  source: Extract<FamilyObjectSource, 'TEST_FIXTURE' | 'SERVICE_CASE' | 'TEST_EXPERIENCE_OPERATION'>;
  status: FamilyServiceRecordStatus;
  visibility: FamilyPrivateVisibility;
  external_effect: false;
  occurred_at: string;
  text_equivalent: string;
}

export interface FamilyPageObjectProjectionDto {
  family_id: string;
  environment: 'DEV' | 'TEST';
  source: 'TEST_FIXTURE' | 'SERVICE_PROJECTION';
  profile: FamilyProfileSnapshotDto | null;
  reports: FamilySupportReportSnapshotDto[];
  tasks: FamilyPageTaskItemDto[];
  service_records: FamilyServiceRecordDto[];
  allowed_state_upper_bound: 'READ_ONLY_PRIVATE_FAMILY_OBJECTS';
  text_equivalent: string;
}

export type FamilyPageObjectAction = 'COMPLETE_TASK' | 'PAUSE_TASK' | 'CANCEL_TASK' | 'WITHDRAW_REPORT';

export interface FamilyPageObjectActionDto {
  page_id: string;
  action: FamilyPageObjectAction;
  object_id: string;
  idempotency_key?: string;
}

export interface FamilyPageObjectActionResultDto {
  object_id: string;
  action: FamilyPageObjectAction;
  status: FamilyPageTaskStatus | FamilySupportReportStatus | FamilyServiceRecordStatus;
  external_effect: false;
  allowed_state_upper_bound: 'PRIVATE_FAMILY_OBJECT_STATE';
  text_equivalent: string;
}
