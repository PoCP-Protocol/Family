import type {
  GrowthProfileFactBoundary,
  GrowthPriorityBoundary,
  ReflectionBoundary,
} from './index';

/** UI-02..UI-10 的 DEV-only 读投影。禁止用于生产决策、诊断或外部效果。 */
export type DevCoreGrowthSurface =
  | 'UI-02'
  | 'UI-03'
  | 'UI-04'
  | 'UI-05'
  | 'UI-06'
  | 'UI-07'
  | 'UI-08'
  | 'UI-10';

export type DevCoreGrowthCardKind =
  | 'ASSESSMENT_ENTRY'
  | 'ASSESSMENT_DRAFT'
  | 'REPORT_EXPLANATION'
  | 'PLAN_DRAFT'
  | 'COMPANION_PROGRESS'
  | 'MEMBERSHIP_READ'
  | 'CHILD_ASSISTANT_READ';

export interface DevCoreGrowthCard {
  surface: DevCoreGrowthSurface;
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
  'UI-02', 'UI-03', 'UI-04', 'UI-05', 'UI-06', 'UI-07', 'UI-08', 'UI-10',
] as const;
