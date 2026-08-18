export type DevPlatformSurface =
  | 'UI-11' | 'UI-12' | 'UI-13' | 'UI-14' | 'UI-15' | 'UI-16' | 'UI-17' | 'UI-18'
  | 'UI-19' | 'UI-20' | 'UI-21' | 'UI-22' | 'UI-23' | 'UI-24'
  | 'UI-25' | 'UI-26' | 'UI-27' | 'UI-28' | 'UI-29' | 'UI-30' | 'UI-31' | 'UI-32' | 'UI-33' | 'UI-34';

export interface DevPlatformSurfaceCard {
  surface: DevPlatformSurface;
  domain: 'PERSONAL_HISTORY' | 'EVIDENCE' | 'COMMERCE' | 'ENTITLEMENT' | 'SERVICE' | 'ACTIVITY' | 'COMMUNITY' | 'PROFILE' | 'RECORD';
  title: string;
  state: 'READ_ONLY' | 'DRAFT' | 'NOOP';
  data_source: 'SYNTHETIC_DEV_ONLY';
  boundary: string;
  summary: string;
  next_hint: string;
  command: { name: string; mode: 'READ_ONLY' | 'CONTROLLED_DRAFT' | 'NOOP_NOT_PERSISTED' };
}

export interface DevPlatformSurfacesProjection {
  projection_version: 'DEV_PLATFORM_SURFACES_V1';
  family_id: string;
  generated_at: string;
  data_source: 'SYNTHETIC_DEV_ONLY';
  external_effect_adapter: 'NOOP_NOT_INVOKED';
  model_gateway: 'NOOP_NOT_INVOKED';
  cards: DevPlatformSurfaceCard[];
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
