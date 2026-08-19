import type {
  GrowthProfileFactBoundary,
  GrowthPriorityBoundary,
  ReflectionBoundary,
} from './index';
import type { DevFlowReceiptSummary, ExternalEffectBoundary, FamilyBusinessLoop } from './family-growth-os';

/** UI-02..UI-10 的 DEV-only 读投影。禁止用于生产决策、诊断或外部效果。 */
export type DevCoreGrowthSurface =
  | 'UI-02'
  | 'UI-03'
  | 'UI-04'
  | 'UI-05'
  | 'UI-06'
  | 'UI-07'
  | 'UI-08'
  | 'UI-10'
  | 'UI-35';

export type DevCoreGrowthCardKind =
  | 'ASSESSMENT_ENTRY'
  | 'ASSESSMENT_DRAFT'
  | 'REPORT_EXPLANATION'
  | 'GROWTH_REVIEW'
  | 'PLAN_DRAFT'
  | 'COMPANION_PROGRESS'
  | 'MEMBERSHIP_READ'
  | 'CHILD_ASSISTANT_READ'
  | 'GROWTH_CAMP_21';

export interface DevAiCurriculumDayDraft {
  day_number: number;
  theme: string;
  parent_action: string;
  reflection_prompt: string;
  evidence_boundary: 'PERSPECTIVE_NOT_FACT';
}

/**
 * AI-assisted curriculum structure for DEV only. It is a rule-based draft built
 * from bounded product inputs and must be reviewed before becoming a real course.
 */
export interface DevAiCurriculumDraft {
  draft_id: string;
  status: 'SYNTHETIC_RULE_BASED_DRAFT';
  source_boundary: 'E1_PRODUCT_STRUCTURE_PLUS_PUBLIC_DESIGN_RESEARCH';
  model_gateway_status: 'NOOP_NOT_INVOKED';
  human_review: 'REQUIRED_BEFORE_PUBLISH_OR_ASSIGN';
  course_boundary: 'NOT_OFFICIAL_SYLLABUS_NOT_OUTCOME_NOT_DIAGNOSIS';
  day_count: 21;
  stages: readonly {
    stage_id: string;
    label: string;
    day_range: string;
    intent: string;
  }[];
  current_day: DevAiCurriculumDayDraft;
  next_transition: 'GROWTH_PLAN_DRAFT_RECOMMENDATION_ONLY';
}

export type DevGrowthFocus =
  | 'PARENT_CHILD_COMMUNICATION'
  | 'LEARNING_HABITS'
  | 'EMOTION_REGULATION'
  | 'SELF_REGULATION'
  | 'DEVICE_USE_CONTEXT';

/**
 * Rule-based report content for the UI-04 read projection. It reflects a
 * guardian-selected focus only; it is neither a child diagnosis nor an outcome.
 */
export interface DevFamilyGrowthReportDraft {
  report_id: string;
  state: 'READY' | 'PLAN_PREVIEWED';
  focus: DevGrowthFocus;
  headline: string;
  summary: string;
  observations: readonly { label: string; detail: string }[];
  this_week_action: { when: string; action: string; fallback: string };
  plan_link_state: 'READY_TO_VIEW' | 'VIEWED';
}

export interface DevChildActionPrompt {
  state: 'ACTION_RECORDED';
  focus: DevGrowthFocus;
  headline: string;
  shared_action: string;
  pause_hint: string;
  action_route: 'growth-daily-task';
  fact_boundary: 'ACTION_RECORDED_NOT_CHILD_OUTCOME';
}

export interface DevFamilyCompanionProgress {
  state: 'ACTION_RECORDED';
  focus: DevGrowthFocus;
  headline: string;
  confirmation: string;
  pace_hint: string;
  review_route: 'growth-report';
  action_route: 'growth-daily-task';
  fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME';
}

export interface DevFamilyActionReview {
  state: 'ACTION_RECORDED';
  focus: DevGrowthFocus;
  headline: string;
  confirmation: string;
  reflection_prompt: string;
  next_step: string;
  plan_route: 'core-plan';
  fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME';
}

export interface DevWeeklyGrowthActionHandoff {
  state: 'READY_TO_OPEN' | 'OPENED';
  stage_id: 'SEE';
  label: string;
  action: string;
  fallback: string;
  target_route: 'growth-daily-task';
}

/** Read-only UI-05 preview; it never creates a formal GrowthPlan or task. */
export interface DevGrowthPlanPreview {
  plan_id: string;
  state: 'READY' | 'VIEWED_FROM_REPORT';
  focus: DevGrowthFocus;
  headline: string;
  stages: readonly { stage_id: string; label: string; weeks: string; intent: string; small_action: string }[];
  next_action: string;
  /** A family-readable UI-05 → UI-09 navigation context, not a GrowthTask. */
  weekly_action_handoff: DevWeeklyGrowthActionHandoff;
}

export interface DevCoreGrowthCard {
  surface: DevCoreGrowthSurface;
  /** Architecture metadata sourced from the shared six-loop UI mapping. */
  loop: FamilyBusinessLoop;
  business_capability: string;
  primary_objects: readonly string[];
  state_boundary: ExternalEffectBoundary;
  kind: DevCoreGrowthCardKind;
  title: string;
  state: 'READY' | 'DRAFT' | 'READ_ONLY' | 'NOOP';
  fact_boundary:
    | 'PERSPECTIVE_NOT_FACT'
    | GrowthProfileFactBoundary
    | GrowthPriorityBoundary
    | 'ACTION_IS_NOT_OUTCOME'
    | ReflectionBoundary;
  data_source: 'SYNTHETIC_DEV_ONLY';
  summary: string;
  next_hint: string;
  command: {
    name: string;
    mode: 'READ_ONLY' | 'CONTROLLED_DRAFT' | 'NOOP_NOT_PERSISTED';
  };
  /** Present only on course-capability cards such as UI-35. */
  curriculum_draft?: DevAiCurriculumDraft;
  /** Present on UI-04; a family-readable report derived from the selected focus. */
  report_draft?: DevFamilyGrowthReportDraft;
  /** Present on UI-05; a read-only 90-day plan preview derived from the same focus. */
  plan_preview?: DevGrowthPlanPreview;
  /** Present on UI-08 after an authenticated UI-09 action has been recorded. */
  action_review?: DevFamilyActionReview;
  /** Present on UI-06 after an authenticated UI-09 action has been recorded. */
  companion_progress?: DevFamilyCompanionProgress;
  /** Present on UI-10 after an authenticated UI-09 action has been recorded. */
  child_action_prompt?: DevChildActionPrompt;
}

export interface DevCoreGrowthProjection {
  projection_version: 'DEV_CORE_GROWTH_V1';
  family_id: string;
  generated_at: string;
  data_source: 'SYNTHETIC_DEV_ONLY';
  family_growth_os_path: [
    'GrowthOnboarding',
    'Perspective',
    'GrowthProfileDraft',
    'GrowthPriority',
    'Intervention',
    'GrowthAction',
    'GrowthReview',
  ];
  model_gateway: {
    status: 'NOOP_NOT_INVOKED';
    rule: 'NO_FREE_TEXT_MODEL_WRITE_TO_CORE_ONTOLOGY';
  };
  cards: DevCoreGrowthCard[];
  /** Populated by the Family API facade when authenticated DEV flow receipts exist. */
  recent_flow_events?: readonly DevFlowReceiptSummary[];
}

export interface DevCoreGrowthNoopCommandResult {
  family_id: string;
  surface: DevCoreGrowthSurface;
  command: string;
  status: 'NOOP_ACKNOWLEDGED';
  persistence: 'NONE';
  external_effect: false;
  audit_boundary: 'DEV_COMMAND_TRACE_ONLY';
}

export const DEV_CORE_GROWTH_SURFACES: readonly DevCoreGrowthSurface[] = [
  'UI-02', 'UI-03', 'UI-04', 'UI-05', 'UI-06', 'UI-07', 'UI-08', 'UI-10', 'UI-35',
] as const;
