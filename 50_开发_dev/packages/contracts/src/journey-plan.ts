import type { M2GrowthDimensionId } from './index';

/**
 * A family-confirmed, 90-day operating plan. It is deliberately distinct from
 * an intervention episode: the plan provides cadence and phase boundaries;
 * interventions provide reviewed, evidence-bounded actions.
 */
export const JOURNEY_PLAN_PHASES = ['SEE', 'PARENT_FIRST', 'CO_CREATE', 'STABILIZE'] as const;
export type JourneyPlanPhase = typeof JOURNEY_PLAN_PHASES[number];

export type JourneyPlanStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type JourneyPlanPhaseStatus = 'PENDING' | 'ACTIVE' | 'REVIEW_DUE' | 'COMPLETED' | 'BLOCKED';
export type JourneyPlanBoundary = 'PLAN_IS_FAMILY_CONFIRMED_CADENCE_NOT_DIAGNOSIS_OR_OUTCOME';
export type JourneyPhaseBoundary = 'PHASE_TRANSITION_REQUIRES_REVIEW_AND_FAMILY_DECISION';
export type JourneyPhaseReviewDecision = 'CONTINUE' | 'ADJUST' | 'PAUSE' | 'HUMAN_REVIEW_REQUIRED';

export interface JourneyPlanPhaseDto {
  phase: JourneyPlanPhase;
  start_day: number;
  end_day: number;
  status: JourneyPlanPhaseStatus;
  focus_dimensions: M2GrowthDimensionId[];
  review_due_day: number;
  boundary: JourneyPhaseBoundary;
}

export interface JourneyPlanDto {
  plan_id: string;
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  title: string;
  status: JourneyPlanStatus;
  current_phase: JourneyPlanPhase;
  current_day: number;
  total_days: 90;
  phases: JourneyPlanPhaseDto[];
  confirmed_by_actor_id: string | null;
  confirmed_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  version: number;
  policy_version: 'JOURNEY_90_DAY_V1';
  boundary: JourneyPlanBoundary;
  created_at: string;
  updated_at: string;
}

export interface CreateJourneyPlanRequest {
  family_id: string;
  onboarding_id: string;
  priority_id: string;
  idempotency_key: string;
}

export interface CreateJourneyPlanResponse {
  plan: JourneyPlanDto;
  created: boolean;
}

export interface ConfirmJourneyPlanRequest {
  family_id: string;
  plan_id: string;
  idempotency_key: string;
}

export interface ConfirmJourneyPlanResponse {
  plan: JourneyPlanDto;
}

export interface PauseJourneyPlanRequest {
  family_id: string;
  plan_id: string;
  idempotency_key: string;
}

export interface PauseJourneyPlanResponse {
  plan: JourneyPlanDto;
}

export interface ReviewJourneyPhaseRequest {
  family_id: string;
  plan_id: string;
  decision: JourneyPhaseReviewDecision;
  idempotency_key: string;
}

export interface ReviewJourneyPhaseResponse {
  plan: JourneyPlanDto;
  decision: JourneyPhaseReviewDecision;
}

export interface JourneyPlanProjection {
  family_id: string;
  plan: JourneyPlanDto | null;
  fact_boundary: 'JOURNEY_PROGRESS_IS_SCHEDULE_STATE_NOT_GROWTH_OUTCOME';
  recommendation_boundary: 'NEXT_PHASE_IS_A_FAMILY_DECISION_NOT_AN_AUTOMATIC_RECOMMENDATION';
  model_gateway_status: 'NOOP';
}
