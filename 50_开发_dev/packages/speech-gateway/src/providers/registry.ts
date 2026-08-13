/**
 * MM1-B0 · Speech Gateway Provider Registry
 *
 * 定义 STT / TTS Provider 能力契约、Descriptor、Factory、Registry。
 * 本文件不引入任何真实 provider SDK。真实 SDK 只允许出现在:
 *   packages/speech-gateway/src/providers/<providerFamily>/*.ts
 * 由 MM1-B1 之后按 SSOT 授权接入。
 *
 * 见:
 *   products/famili-principal/multimodal/FPAI_MM1B_PROVIDER_SELECTION_V1.md
 *   products/famili-principal/multimodal/FPAI_MM1B_BENCHMARK_SPEC_V1.md
 */

import type {
  ProviderClass,
  ProviderCommercialContract,
  ProviderDescriptorBase,
  ProviderHealth,
  TernaryCapability,
} from '@family/fpai-multimodal-contracts';

import type { SpeechToTextGateway, TextToSpeechGateway } from '../index';

// ---------------------------------------------------------------------------
// STT Capability
// ---------------------------------------------------------------------------

export type StreamingMode = 'STREAMING' | 'BATCH' | 'UNKNOWN';

export interface SttCapabilities {
  streaming: TernaryCapability;
  partial_transcript: TernaryCapability;
  final_transcript: TernaryCapability;
  vad_support: TernaryCapability;
  endpointing: TernaryCapability;
  punctuation: TernaryCapability;
  mandarin_quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  mixed_cn_en: TernaryCapability;
  speaker_diarization: TernaryCapability;
  word_timestamps: TernaryCapability;
  audio_formats: string[]; // 若 UNKNOWN 则 []
  sample_rates_hz: number[]; // 若 UNKNOWN 则 []
  cancel_support: TernaryCapability;
  estimated_cost_unit: 'PER_SECOND' | 'PER_MINUTE' | 'PER_HOUR' | 'PER_CHANNEL' | 'UNKNOWN';
}

export interface SttProviderDescriptor extends ProviderDescriptorBase {
  kind: 'STT';
  capabilities: SttCapabilities;
}

export type SttProviderFactory = (config: Record<string, unknown>) => SpeechToTextGateway;

export interface SttProviderRegistration {
  descriptor: SttProviderDescriptor;
  factory: SttProviderFactory;
  /** 只在 MM1-B0 harness 中调用;真实 provider 应返回 NOT_CONNECTED 直到 preflight 完成。 */
  health(): Promise<ProviderHealth>;
}

// ---------------------------------------------------------------------------
// TTS Capability
// ---------------------------------------------------------------------------

export interface TtsCapabilities {
  streaming: TernaryCapability;
  first_audio_chunk: TernaryCapability;
  cancel: TernaryCapability;
  voice_id_configurable: TernaryCapability;
  voice_versioning: TernaryCapability;
  emotion_control: TernaryCapability;
  style_control: TernaryCapability;
  speed_control: TernaryCapability;
  pitch_control: TernaryCapability;
  pause_control: TernaryCapability;
  ssml: TernaryCapability;
  word_timing: TernaryCapability;
  phoneme_timing: TernaryCapability;
  viseme: TernaryCapability;
  audio_formats: string[];
  sample_rates_hz: number[];
  custom_voice: TernaryCapability;
  voice_rights_ownership: 'PROVIDER' | 'CUSTOMER' | 'MIXED' | 'UNKNOWN';
  commercial_use_allowed: TernaryCapability;
  estimated_cost_unit:
    | 'PER_CHAR'
    | 'PER_1K_CHAR'
    | 'PER_MILLION_CHAR'
    | 'PER_SECOND_AUDIO'
    | 'UNKNOWN';
}

export interface TtsProviderDescriptor extends ProviderDescriptorBase {
  kind: 'TTS';
  capabilities: TtsCapabilities;
}

export type TtsProviderFactory = (config: Record<string, unknown>) => TextToSpeechGateway;

export interface TtsProviderRegistration {
  descriptor: TtsProviderDescriptor;
  factory: TtsProviderFactory;
  health(): Promise<ProviderHealth>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface SpeechProviderRegistry {
  registerStt(reg: SttProviderRegistration): void;
  registerTts(reg: TtsProviderRegistration): void;
  listStt(): SttProviderDescriptor[];
  listTts(): TtsProviderDescriptor[];
  lookupStt(id: string): SttProviderRegistration | undefined;
  lookupTts(id: string): TtsProviderRegistration | undefined;
}

export class InMemorySpeechProviderRegistry implements SpeechProviderRegistry {
  private stt = new Map<string, SttProviderRegistration>();
  private tts = new Map<string, TtsProviderRegistration>();

  public registerStt(reg: SttProviderRegistration): void {
    assertUnknownIfNoEvidence(reg.descriptor.provider_id, reg.descriptor.commercial);
    if (this.stt.has(reg.descriptor.provider_id)) {
      throw new Error(`STT provider already registered: ${reg.descriptor.provider_id}`);
    }
    this.stt.set(reg.descriptor.provider_id, reg);
  }

  public registerTts(reg: TtsProviderRegistration): void {
    assertUnknownIfNoEvidence(reg.descriptor.provider_id, reg.descriptor.commercial);
    if (this.tts.has(reg.descriptor.provider_id)) {
      throw new Error(`TTS provider already registered: ${reg.descriptor.provider_id}`);
    }
    this.tts.set(reg.descriptor.provider_id, reg);
  }

  public listStt(): SttProviderDescriptor[] {
    return [...this.stt.values()].map((r) => r.descriptor);
  }

  public listTts(): TtsProviderDescriptor[] {
    return [...this.tts.values()].map((r) => r.descriptor);
  }

  public lookupStt(id: string): SttProviderRegistration | undefined {
    return this.stt.get(id);
  }

  public lookupTts(id: string): TtsProviderRegistration | undefined {
    return this.tts.get(id);
  }
}

/**
 * 硬约束:若 provider_class === 'REAL' 且 evidence_refs 为空,
 * 则任何 boolean/enum 字段都必须是 'UNKNOWN'。
 * 违反 → 抛错。这样避免"看营销文案就写 TRUE"。
 * FAKE_BASELINE 不受此约束(FakeProvider 是自家代码,已知能力)。
 */
export function assertUnknownIfNoEvidence(
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
        `Provider ${providerId} has no evidence_refs but claims non-UNKNOWN capability. ` +
          `See FPAI_MM1B_PROVIDER_SELECTION_V1.md §11 (Descriptor 空表模板).`,
      );
    }
  }
}

/**
 * 空 descriptor 生成器:MM1-B1 preflight 之前,所有能力字段默认 UNKNOWN。
 * shortlist 里的每个 provider 都用这个建 seed descriptor。
 */
export function emptySttDescriptor(
  provider_id: string,
  provider_version: string,
  provider_class: ProviderClass = 'REAL',
): SttProviderDescriptor {
  return {
    kind: 'STT',
    provider_id,
    provider_version,
    provider_class,
    commercial: emptyCommercial(),
    capabilities: {
      streaming: 'UNKNOWN',
      partial_transcript: 'UNKNOWN',
      final_transcript: 'UNKNOWN',
      vad_support: 'UNKNOWN',
      endpointing: 'UNKNOWN',
      punctuation: 'UNKNOWN',
      mandarin_quality: 'UNKNOWN',
      mixed_cn_en: 'UNKNOWN',
      speaker_diarization: 'UNKNOWN',
      word_timestamps: 'UNKNOWN',
      audio_formats: [],
      sample_rates_hz: [],
      cancel_support: 'UNKNOWN',
      estimated_cost_unit: 'UNKNOWN',
    },
  };
}

export function emptyTtsDescriptor(
  provider_id: string,
  provider_version: string,
  provider_class: ProviderClass = 'REAL',
): TtsProviderDescriptor {
  return {
    kind: 'TTS',
    provider_id,
    provider_version,
    provider_class,
    commercial: emptyCommercial(),
    capabilities: {
      streaming: 'UNKNOWN',
      first_audio_chunk: 'UNKNOWN',
      cancel: 'UNKNOWN',
      voice_id_configurable: 'UNKNOWN',
      voice_versioning: 'UNKNOWN',
      emotion_control: 'UNKNOWN',
      style_control: 'UNKNOWN',
      speed_control: 'UNKNOWN',
      pitch_control: 'UNKNOWN',
      pause_control: 'UNKNOWN',
      ssml: 'UNKNOWN',
      word_timing: 'UNKNOWN',
      phoneme_timing: 'UNKNOWN',
      viseme: 'UNKNOWN',
      audio_formats: [],
      sample_rates_hz: [],
      custom_voice: 'UNKNOWN',
      voice_rights_ownership: 'UNKNOWN',
      commercial_use_allowed: 'UNKNOWN',
      estimated_cost_unit: 'UNKNOWN',
    },
  };
}

function emptyCommercial(): ProviderCommercialContract {
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
// Shortlist seed
// ---------------------------------------------------------------------------

/**
 * MM1-B0 STT Shortlist seed。所有字段均为 UNKNOWN,等 MM1-B1 preflight 填 evidence。
 * 请参考 FPAI_MM1B_PROVIDER_SELECTION_V1.md §7。
 */
export const STT_SHORTLIST_SEED_IDS: readonly string[] = Object.freeze([
  'stt.aliyun_paraformer_realtime',
  'stt.tencent_asr_realtime',
  'stt.iflytek_iat',
  'stt.azure_speech_realtime',
  'stt.deepgram_nova',
]);

export const TTS_SHORTLIST_SEED_IDS: readonly string[] = Object.freeze([
  'tts.minimax_speech_02',
  'tts.aliyun_cosyvoice',
  'tts.bytedance_volc_tts',
  'tts.azure_tts_neural',
  'tts.elevenlabs_multilingual',
]);
