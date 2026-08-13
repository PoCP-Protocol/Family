/**
 * MM1-B0 · Fake Speech Providers
 *
 * 把已有的 FakeSpeechToTextGateway / FakeTextToSpeechGateway 包装成
 * ProviderRegistration,供 registry 与 benchmark harness 使用。
 *
 * 特点:
 * - provider_class = 'FAKE_BASELINE'
 * - 不受 assertUnknownIfNoEvidence 约束(自家代码,能力已知)
 * - health() 始终 READY
 */

import type { ProviderCommercialContract } from '@family/fpai-multimodal-contracts';

import { FakeSpeechToTextGateway, FakeTextToSpeechGateway } from '../index';
import type {
  SttProviderDescriptor,
  SttProviderRegistration,
  TtsProviderDescriptor,
  TtsProviderRegistration,
} from './registry';

const FAKE_COMMERCIAL: ProviderCommercialContract = {
  commercial_terms_reviewed: 'TRUE',
  data_retention_policy_known: 'TRUE',
  training_use_policy_known: 'TRUE',
  paid_test_required: 'FALSE',
  regional_endpoint: 'local',
  known_limitations: [
    '不做真实识别',
    '不做真实合成',
    '仅用于验证 harness 与合同,不能推断真实 provider 质量',
  ],
  evidence: {
    evidence_refs: [
      'packages/speech-gateway/src/index.ts (自家源码)',
      'FPAI_MM1B_BENCHMARK_SPEC_V1.md §9',
    ],
    verified_at: '2026-08-13',
    verified_by: 'family-task-executor',
  },
};

export const FAKE_STT_DESCRIPTOR: SttProviderDescriptor = {
  kind: 'STT',
  provider_id: 'stt.fake_baseline',
  provider_version: '0.1.0',
  provider_class: 'FAKE_BASELINE',
  commercial: FAKE_COMMERCIAL,
  capabilities: {
    streaming: 'TRUE',
    partial_transcript: 'TRUE',
    final_transcript: 'TRUE',
    vad_support: 'FALSE',
    endpointing: 'FALSE',
    punctuation: 'FALSE',
    mandarin_quality: 'UNKNOWN', // Fake 不做真实识别,能力字段留 UNKNOWN
    mixed_cn_en: 'UNKNOWN',
    speaker_diarization: 'FALSE',
    word_timestamps: 'FALSE',
    audio_formats: [],
    sample_rates_hz: [],
    cancel_support: 'TRUE',
    estimated_cost_unit: 'PER_SECOND',
  },
};

export const FAKE_TTS_DESCRIPTOR: TtsProviderDescriptor = {
  kind: 'TTS',
  provider_id: 'tts.fake_baseline',
  provider_version: '0.1.0',
  provider_class: 'FAKE_BASELINE',
  commercial: FAKE_COMMERCIAL,
  capabilities: {
    streaming: 'TRUE',
    first_audio_chunk: 'TRUE',
    cancel: 'TRUE',
    voice_id_configurable: 'FALSE',
    voice_versioning: 'FALSE',
    emotion_control: 'FALSE',
    style_control: 'FALSE',
    speed_control: 'FALSE',
    pitch_control: 'FALSE',
    pause_control: 'FALSE',
    ssml: 'FALSE',
    word_timing: 'FALSE',
    phoneme_timing: 'FALSE',
    viseme: 'TRUE',
    audio_formats: [],
    sample_rates_hz: [],
    custom_voice: 'FALSE',
    voice_rights_ownership: 'CUSTOMER',
    commercial_use_allowed: 'TRUE',
    estimated_cost_unit: 'PER_CHAR',
  },
};

export const fakeSttRegistration: SttProviderRegistration = {
  descriptor: FAKE_STT_DESCRIPTOR,
  factory: () => new FakeSpeechToTextGateway(),
  health: async () => ({ status: 'READY', last_check_at: new Date().toISOString() }),
};

export const fakeTtsRegistration: TtsProviderRegistration = {
  descriptor: FAKE_TTS_DESCRIPTOR,
  factory: () => new FakeTextToSpeechGateway(),
  health: async () => ({ status: 'READY', last_check_at: new Date().toISOString() }),
};
