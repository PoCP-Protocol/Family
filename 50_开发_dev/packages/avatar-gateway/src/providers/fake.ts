/**
 * MM1-B0 · Fake Avatar Provider (baseline)
 */

import type { ProviderCommercialContract } from '@family/fpai-multimodal-contracts';

import { FakeAvatarGateway } from '../index';
import type { AvatarProviderDescriptor, AvatarProviderRegistration } from './registry';

const FAKE_COMMERCIAL: ProviderCommercialContract = {
  commercial_terms_reviewed: 'TRUE',
  data_retention_policy_known: 'TRUE',
  training_use_policy_known: 'TRUE',
  paid_test_required: 'FALSE',
  regional_endpoint: 'local',
  known_limitations: [
    '不做真实渲染',
    '不能推断真实 Avatar 视觉质量',
    'lip-sync 仅发出 VISEME_CHANGED event,无实际形象',
  ],
  evidence: {
    evidence_refs: [
      'packages/avatar-gateway/src/index.ts (自家源码)',
      'FPAI_MM1B_BENCHMARK_SPEC_V1.md §9',
    ],
    verified_at: '2026-08-13',
    verified_by: 'family-task-executor',
  },
};

export const FAKE_AVATAR_DESCRIPTOR: AvatarProviderDescriptor = {
  kind: 'AVATAR',
  provider_id: 'avatar.fake_baseline',
  provider_version: '0.1.0',
  provider_class: 'FAKE_BASELINE',
  commercial: FAKE_COMMERCIAL,
  capabilities: {
    renderer_type: '2D',
    realtime: 'TRUE',
    streaming_audio_input: 'FALSE',
    audio_driven_lipsync: 'FALSE',
    phoneme_driven_lipsync: 'FALSE',
    viseme_input: 'TRUE',
    expression_control: 'TRUE',
    gesture_control: 'TRUE',
    gaze_control: 'FALSE',
    head_motion_control: 'FALSE',
    interrupt: 'TRUE',
    cancel_latency_p95_ms: 1, // 内存中的 event emit,~ms 量级
    transparent_background: 'TRUE',
    camera_control: 'FALSE',
    custom_character: 'TRUE',
    identity_lock: 'TRUE', // Family owns
    local_render_possible: 'TRUE',
    cloud_only: 'FALSE',
    gpu_requirement: 'NONE',
    commercial_license_reviewed: 'TRUE',
    concurrent_session_model: 'PER_CONNECTION',
    supported_lipsync_strategies: ['L4_VISEME', 'L1_AMPLITUDE'],
  },
};

export const fakeAvatarRegistration: AvatarProviderRegistration = {
  descriptor: FAKE_AVATAR_DESCRIPTOR,
  factory: () => new FakeAvatarGateway(),
  health: async () => ({ status: 'READY', last_check_at: new Date().toISOString() }),
};
