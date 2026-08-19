import type { DevFlowReceiptSummary, ExternalEffectBoundary, FamilyBusinessLoop } from './family-growth-os';

export type DevPlatformSurface =
  | 'UI-11' | 'UI-12' | 'UI-13' | 'UI-14' | 'UI-15' | 'UI-16' | 'UI-17' | 'UI-18'
  | 'UI-19' | 'UI-20' | 'UI-21' | 'UI-22' | 'UI-23' | 'UI-24'
  | 'UI-25' | 'UI-26' | 'UI-27' | 'UI-28' | 'UI-29' | 'UI-30' | 'UI-31' | 'UI-32' | 'UI-33' | 'UI-34';

export interface DevPersonalGrowthJourneyEntry {
  event_id: string;
  label: string;
  detail: string;
}

export interface DevPersonalGrowthJourney {
  state: 'STARTING' | 'IN_PROGRESS';
  headline: string;
  entries: readonly DevPersonalGrowthJourneyEntry[];
  plan_route: 'core-plan';
  review_route: 'growth-report';
  fact_boundary: 'PROCESS_EVENTS_NOT_OUTCOME_OR_RANKING';
}

export interface DevPrivateGrowthStory {
  state: 'WAITING_FOR_MOMENT' | 'READY';
  title: string;
  summary: string;
  moments: readonly string[];
  journey_route: 'growth-ranking';
  fact_boundary: 'PROCESS_EVENTS_NOT_OUTCOME_OR_SHARE';
}

export interface DevPlatformSurfaceCard {
  surface: DevPlatformSurface;
  /** Six-loop architecture metadata, sourced from FAMILY_UI_ARCHITECTURE_BINDINGS. */
  loop: FamilyBusinessLoop;
  business_capability: string;
  primary_objects: readonly string[];
  state_boundary: ExternalEffectBoundary;
  domain: 'PERSONAL_HISTORY' | 'EVIDENCE' | 'COMMERCE' | 'ENTITLEMENT' | 'SERVICE' | 'ACTIVITY' | 'COMMUNITY' | 'PROFILE' | 'RECORD';
  title: string;
  state: 'READ_ONLY' | 'DRAFT' | 'NOOP';
  data_source: 'SYNTHETIC_DEV_ONLY';
  boundary: string;
  summary: string;
  next_hint: string;
  command: { name: string; mode: 'READ_ONLY' | 'CONTROLLED_DRAFT' | 'NOOP_NOT_PERSISTED' };
  /** Present only on UI-11; a same-family process history, never a comparative ranking. */
  personal_growth_journey?: DevPersonalGrowthJourney;
  /** Present only on UI-12; a private process narrative without media or external sharing. */
  private_growth_story?: DevPrivateGrowthStory;
}

export interface DevPlatformSurfacesProjection {
  projection_version: 'DEV_PLATFORM_SURFACES_V1';
  family_id: string;
  generated_at: string;
  data_source: 'SYNTHETIC_DEV_ONLY';
  external_effect_adapter: 'NOOP_NOT_INVOKED';
  model_gateway: 'NOOP_NOT_INVOKED';
  cards: DevPlatformSurfaceCard[];
  /** Populated by the Family API facade when authenticated DEV flow receipts exist. */
  recent_flow_events?: readonly DevFlowReceiptSummary[];
}

export interface DevPlatformNoopCommandResult {
  family_id: string;
  surface: DevPlatformSurface;
  command: string;
  status: 'NOOP_ACKNOWLEDGED';
  persistence: 'NONE';
  external_effect: false;
  model_gateway: 'NOOP_NOT_INVOKED';
}

export const DEV_PLATFORM_SURFACES: readonly DevPlatformSurface[] = [
  'UI-11', 'UI-12', 'UI-13', 'UI-14', 'UI-15', 'UI-16', 'UI-17', 'UI-18',
  'UI-19', 'UI-20', 'UI-21', 'UI-22', 'UI-23', 'UI-24',
  'UI-25', 'UI-26', 'UI-27', 'UI-28', 'UI-29', 'UI-30', 'UI-31', 'UI-32', 'UI-33', 'UI-34',
] as const;
