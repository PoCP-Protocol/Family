/**
 * MM1-B0 · Avatar Gateway Provider Registry
 *
 * 定义 Avatar Provider 能力契约、Descriptor、Factory、Registry。
 * 本文件不引入任何真实 provider SDK。
 *
 * 见:
 *   products/famili-principal/multimodal/FPAI_MM1B_PROVIDER_SELECTION_V1.md
 */

import type {
  ProviderClass,
  ProviderCommercialContract,
  ProviderDescriptorBase,
  ProviderHealth,
  TernaryCapability,
} from '@family/fpai-multimodal-contracts';

import type { AvatarGateway } from '../index';

// ---------------------------------------------------------------------------
// Avatar Capability
// ---------------------------------------------------------------------------

export type AvatarRendererType =
  | '2D'
  | '3D'
  | 'VIDEO_GENERATIVE'
  | 'HYBRID'
  | 'UNKNOWN';

export type LipSyncStrategy = 'L1_AMPLITUDE' | 'L2_AUDIO_NEURAL' | 'L3_PHONEME' | 'L4_VISEME';

export interface AvatarCapabilities {
  renderer_type: AvatarRendererType;
  realtime: TernaryCapability;
  streaming_audio_input: TernaryCapability;
  audio_driven_lipsync: TernaryCapability;
  phoneme_driven_lipsync: TernaryCapability;
  viseme_input: TernaryCapability;
  expression_control: TernaryCapability;
  gesture_control: TernaryCapability;
  gaze_control: TernaryCapability;
  head_motion_control: TernaryCapability;
  interrupt: TernaryCapability;
  /** 若已实测,填 P95 ms;若未测,填 undefined 表示 UNKNOWN。 */
  cancel_latency_p95_ms?: number;
  transparent_background: TernaryCapability;
  camera_control: TernaryCapability;
  custom_character: TernaryCapability;
  identity_lock: TernaryCapability;
  local_render_possible: TernaryCapability;
  cloud_only: TernaryCapability;
  gpu_requirement: 'NONE' | 'CLIENT' | 'CLOUD' | 'UNKNOWN';
  commercial_license_reviewed: TernaryCapability;
  concurrent_session_model:
    | 'PER_CONNECTION'
    | 'PER_ROOM'
    | 'PER_ACCOUNT'
    | 'UNKNOWN';
  supported_lipsync_strategies: LipSyncStrategy[];
}

export interface AvatarProviderDescriptor extends ProviderDescriptorBase {
  kind: 'AVATAR';
  capabilities: AvatarCapabilities;
}

export type AvatarProviderFactory = (config: Record<string, unknown>) => AvatarGateway;

export interface AvatarProviderRegistration {
  descriptor: AvatarProviderDescriptor;
  factory: AvatarProviderFactory;
  health(): Promise<ProviderHealth>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface AvatarProviderRegistry {
  registerAvatar(reg: AvatarProviderRegistration): void;
  listAvatar(): AvatarProviderDescriptor[];
  lookupAvatar(id: string): AvatarProviderRegistration | undefined;
}

export class InMemoryAvatarProviderRegistry implements AvatarProviderRegistry {
  private avatars = new Map<string, AvatarProviderRegistration>();

  public registerAvatar(reg: AvatarProviderRegistration): void {
    assertAvatarUnknownIfNoEvidence(reg.descriptor.provider_id, reg.descriptor.commercial);
    if (this.avatars.has(reg.descriptor.provider_id)) {
      throw new Error(`Avatar provider already registered: ${reg.descriptor.provider_id}`);
    }
    this.avatars.set(reg.descriptor.provider_id, reg);
  }

  public listAvatar(): AvatarProviderDescriptor[] {
    return [...this.avatars.values()].map((r) => r.descriptor);
  }

  public lookupAvatar(id: string): AvatarProviderRegistration | undefined {
    return this.avatars.get(id);
  }
}

export function assertAvatarUnknownIfNoEvidence(
  providerId: string,
  commercial: ProviderCommercialContract,
): void {
  const hasEvidence =
    Array.isArray(commercial.evidence.evidence_refs) &&
    commercial.evidence.evidence_refs.length > 0;
  if (hasEvidence) return;
  const trueFalseFields: TernaryCapability[] = [
    commercial.commercial_terms_reviewed,
    commercial.data_retention_policy_known,
    commercial.training_use_policy_known,
    commercial.paid_test_required,
  ];
  for (const v of trueFalseFields) {
    if (v !== 'UNKNOWN') {
      throw new Error(
        `Avatar provider ${providerId} has no evidence_refs but claims non-UNKNOWN capability. ` +
          `See FPAI_MM1B_PROVIDER_SELECTION_V1.md §11.`,
      );
    }
  }
}

export function emptyAvatarDescriptor(
  provider_id: string,
  provider_version: string,
  provider_class: ProviderClass = 'REAL',
): AvatarProviderDescriptor {
  return {
    kind: 'AVATAR',
    provider_id,
    provider_version,
    provider_class,
    commercial: emptyAvatarCommercial(),
    capabilities: {
      renderer_type: 'UNKNOWN',
      realtime: 'UNKNOWN',
      streaming_audio_input: 'UNKNOWN',
      audio_driven_lipsync: 'UNKNOWN',
      phoneme_driven_lipsync: 'UNKNOWN',
      viseme_input: 'UNKNOWN',
      expression_control: 'UNKNOWN',
      gesture_control: 'UNKNOWN',
      gaze_control: 'UNKNOWN',
      head_motion_control: 'UNKNOWN',
      interrupt: 'UNKNOWN',
      cancel_latency_p95_ms: undefined,
      transparent_background: 'UNKNOWN',
      camera_control: 'UNKNOWN',
      custom_character: 'UNKNOWN',
      identity_lock: 'UNKNOWN',
      local_render_possible: 'UNKNOWN',
      cloud_only: 'UNKNOWN',
      gpu_requirement: 'UNKNOWN',
      commercial_license_reviewed: 'UNKNOWN',
      concurrent_session_model: 'UNKNOWN',
      supported_lipsync_strategies: [],
    },
  };
}

function emptyAvatarCommercial(): ProviderCommercialContract {
  return {
    commercial_terms_reviewed: 'UNKNOWN',
    data_retention_policy_known: 'UNKNOWN',
    training_use_policy_known: 'UNKNOWN',
    paid_test_required: 'UNKNOWN',
    regional_endpoint: undefined,
    known_limitations: [],
    evidence: { evidence_refs: [] },
  };
}

// ---------------------------------------------------------------------------
// Avatar Shortlist seed
// ---------------------------------------------------------------------------

export const AVATAR_SHORTLIST_SEED_IDS: readonly string[] = Object.freeze([
  'avatar.heygen_realtime',
  'avatar.did_agents_realtime',
  'avatar.sensetime_xiaohui',
  'avatar.readyplayerme_local_l1l3',
  'avatar.local_2d_l1l3',
]);
