export type FesBoundaryStatus = 'FES_CANONICAL' | 'FES_AI_DRAFT' | 'HUMAN_CONFIRMED' | 'SYNTHETIC';

export type FesEntityKind =
  | 'Customer'
  | 'Contact'
  | 'Student'
  | 'Assessment'
  | 'AssessmentSession'
  | 'AssessmentReport'
  | 'Course'
  | 'Enrollment'
  | 'Task'
  | 'CheckIn'
  | 'Advisor'
  | 'ServiceNote';

export type FesSemanticBoundary =
  | 'score != GrowthProfile'
  | 'tag != Fact'
  | 'AI report != Diagnosis'
  | 'course complete != Growth'
  | 'check-in != Outcome'
  | 'customer != Family'
  | 'student != Child'
  | 'contact != Parent';

export const FES_SEMANTIC_BOUNDARIES: readonly FesSemanticBoundary[] = [
  'score != GrowthProfile',
  'tag != Fact',
  'AI report != Diagnosis',
  'course complete != Growth',
  'check-in != Outcome',
  'customer != Family',
  'student != Child',
  'contact != Parent',
] as const;

export interface FesEntityBase {
  source_system: 'FES';
  source_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  synthetic: boolean;
  provenance?: FesProvenance;
  business_status?: string;
}

export interface FesProvenance {
  actor: string;
  channel: 'staff' | 'parent' | 'system' | 'ai_assisted' | 'synthetic_factory';
  input_refs: string[];
}

export interface Customer extends FesEntityBase {
  entity: 'Customer';
  customer_id: string;
  display_name: string;
  phone?: string;
  tags: string[];
}

export interface Contact extends FesEntityBase {
  entity: 'Contact';
  contact_id: string;
  customer_id: string;
  role_candidate: 'parent' | 'guardian' | 'buyer' | 'other';
  name: string;
  phone?: string;
}

export interface Student extends FesEntityBase {
  entity: 'Student';
  student_id: string;
  customer_id: string;
  display_name: string;
  guardian_contact_id?: string;
  age_band?: '12-15' | 'other' | 'unknown';
}

export interface AssessmentSession extends FesEntityBase {
  entity: 'AssessmentSession';
  assessment_session_id: string;
  student_id: string;
  status: 'started' | 'submitted' | 'report_drafted' | 'report_confirmed';
  submitted_at?: string;
}

export interface AssessmentReport extends FesEntityBase {
  entity: 'AssessmentReport';
  assessment_report_id: string;
  assessment_session_id: string;
  score?: number;
  ai_interpretation?: string;
  human_confirmed: boolean;
}

export interface Course extends FesEntityBase {
  entity: 'Course';
  course_id: string;
  title: string;
  content_refs: string[];
}

export interface Enrollment extends FesEntityBase {
  entity: 'Enrollment';
  enrollment_id: string;
  course_id: string;
  student_id: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Task extends FesEntityBase {
  entity: 'Task';
  task_id: string;
  enrollment_id: string;
  title: string;
  day_index: number;
}

export interface CheckIn extends FesEntityBase {
  entity: 'CheckIn';
  check_in_id: string;
  task_id?: string;
  student_id: string;
  submitted_at: string;
  reflection_text?: string;
}

export interface Advisor extends FesEntityBase {
  entity: 'Advisor';
  advisor_id: string;
  display_name: string;
}

export interface ServiceNote extends FesEntityBase {
  entity: 'ServiceNote';
  service_note_id: string;
  customer_id: string;
  advisor_id: string;
  note_text: string;
  ai_draft_ref?: string;
  human_confirmed: boolean;
}

export type FesM1Entity =
  | Customer
  | Contact
  | Student
  | AssessmentSession
  | AssessmentReport
  | Course
  | Enrollment
  | Task
  | CheckIn
  | Advisor
  | ServiceNote;

export type FesBusinessEventType =
  | 'CustomerCreated'
  | 'StudentAdded'
  | 'AssessmentCompleted'
  | 'AssessmentReportDrafted'
  | 'AssessmentReportConfirmed'
  | 'CourseEnrolled'
  | 'TaskAssigned'
  | 'CheckInSubmitted'
  | 'AdvisorSummaryGenerated'
  | 'ServiceNoteSaved';

export interface FesBusinessEvent {
  event_type: FesBusinessEventType;
  source_id: string;
  occurred_at: string;
  actor: string;
  payload_ref: string;
  semantic_boundaries: readonly FesSemanticBoundary[];
}

export type FesAiUseCase = 'AIAssessmentDraft' | 'AdvisorCopilotSummary';

export interface FesAiOutputRecord<TPayload extends object> {
  use_case: FesAiUseCase;
  model: string;
  prompt_version: string;
  schema_version: string;
  input_refs: string[];
  generated_at: string;
  validation_status: 'valid' | 'invalid';
  human_status: 'draft' | 'confirmed' | 'rejected';
  payload: TPayload;
}

export interface AiAssessmentDraftPayload {
  assessment_session_id: string;
  structured_insight: string;
  evidence_refs: string[];
  limitations: string[];
}

export interface AdvisorCopilotSummaryPayload {
  customer_id: string;
  recent_context_summary: string;
  incomplete_tasks: string[];
  suggested_next_conversation: string[];
  service_note_draft: string;
}

export type DirtyDataScenario =
  | 'duplicate customer'
  | 'multiple children'
  | 'two parents'
  | 'buyer != student'
  | 'missing guardian'
  | 'orphan assessment'
  | 'orphan check-in'
  | 'missing consent'
  | 'legacy label'
  | 'legacy score'
  | 'AI conclusion';

export interface SyntheticDataFactoryContract {
  synthetic: true;
  no_real_person: true;
  no_real_minor: true;
  entities: readonly FesEntityKind[];
  dirty_data_scenarios: readonly DirtyDataScenario[];
}

export const FES_M1_ENTITY_KINDS: readonly FesEntityKind[] = [
  'Customer',
  'Contact',
  'Student',
  'Assessment',
  'AssessmentSession',
  'AssessmentReport',
  'Course',
  'Enrollment',
  'Task',
  'CheckIn',
  'Advisor',
  'ServiceNote',
] as const;

export const FES_M1_EVENTS: readonly FesBusinessEventType[] = [
  'CustomerCreated',
  'StudentAdded',
  'AssessmentCompleted',
  'AssessmentReportDrafted',
  'AssessmentReportConfirmed',
  'CourseEnrolled',
  'TaskAssigned',
  'CheckInSubmitted',
  'AdvisorSummaryGenerated',
  'ServiceNoteSaved',
] as const;

export const FES_SYNTHETIC_DATA_CONTRACT: SyntheticDataFactoryContract = {
  synthetic: true,
  no_real_person: true,
  no_real_minor: true,
  entities: FES_M1_ENTITY_KINDS,
  dirty_data_scenarios: [
    'duplicate customer',
    'multiple children',
    'two parents',
    'buyer != student',
    'missing guardian',
    'orphan assessment',
    'orphan check-in',
    'missing consent',
    'legacy label',
    'legacy score',
    'AI conclusion',
  ] as const,
};
