/**
 * MM1-B1 · Azure Neural TTS Adapter (§10/§14)
 *
 * 硬约束:
 *   - 实现 TextToSpeechGateway 接口, 不改接口迁就 Azure
 *   - 不 import Azure SDK, 通过 `AzureRealtimeTtsTransport` port 解耦
 *   - Azure SDK 类型不得暴露给 Principal / Performance Planner / Family Core / Browser
 *   - viseme events → Family MouthShape (via visemeMapper), 不暴露 azure viseme_id
 *   - 缺 credential → synthesizeStream 立即 emit TTS_ERROR(BLOCKED_MISSING_CREDENTIAL)
 *   - cancel() 必须:
 *       停止 transport
 *       flush pending events
 *       emit TTS_ERROR(tts-cancelled)  (与 FakeTTS 行为一致)
 *
 * SpeechChunkEvent 事件映射:
 *   Azure `Synthesizing`         → TTS_STARTED + AUDIO_CHUNK(s)
 *   Azure `WordBoundary`         → AUDIO_CHUNK(optional; word_text, audio_offset_ms)
 *   Azure `VisemeReceived`       → VISEME (viseme = Family MouthShape string)
 *   Azure synthesis completed    → TTS_COMPLETE
 *   Azure canceled / error       → TTS_ERROR
 *
 * Lipsync mode 选择 (§17):
 *   若本轮有至少一个 viseme frame → LIPSYNC_MODE = L4_VISEME
 *   否则 → LIPSYNC_MODE = L1_AMPLITUDE_FALLBACK (telemetry only, avatar 层读)
 */
import type {
  RealtimeServerEvent,
  SpeechChunkEvent,
} from '@family/fpai-multimodal-contracts';
import type { TextToSpeechGateway } from '../../index';
import {
  readAzureSpeechCredential,
  AZURE_CREDENTIAL_BLOCKER,
  type AzureSpeechCredential,
} from './secretReader';
import { mapAzureVisemeToFamily } from '../visemeMapper';

export type LipSyncMode = 'L4_VISEME' | 'L1_AMPLITUDE_FALLBACK';

/**
 * Provider transport port for TTS.
 *
 * 生产 wiring 把 Azure `SpeechSynthesizer.speakSsmlAsync`(push stream mode)
 * 适配到这个接口。
 */
export interface AzureRealtimeTtsTransport {
  synthesize(opts: {
    turnId: string;
    ssml: string;
    credential: AzureSpeechCredential;
  }): void;
  cancel(turnId: string): void;
  onProviderEvent(
    handler: (evt: TtsProviderEvent) => void,
  ): void;
}

export type TtsProviderEvent =
  | { kind: 'STARTED'; turnId: string }
  | { kind: 'AUDIO_CHUNK'; turnId: string; chunkIndex: number; pcmBytes: Uint8Array }
  | {
      kind: 'VISEME';
      turnId: string;
      azureVisemeId: number;
      audioOffsetTicks: number;
      durationMs?: number;
    }
  | { kind: 'WORD_BOUNDARY'; turnId: string; wordText: string; audioOffsetTicks: number }
  | { kind: 'COMPLETE'; turnId: string }
  | { kind: 'ERROR'; turnId: string; reason: string };

export interface AzureSpeechTtsAdapterOptions {
  transport: AzureRealtimeTtsTransport;
  /** 推荐的 Azure voice name (默认 zh-CN-XiaoxiaoNeural, 仅 LAB REFERENCE VOICE)。 */
  voiceName?: string;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
}

/** LAB_REFERENCE_VOICE default — 非 FINAL_FAMILI_VOICE, 见 §11。 */
export const DEFAULT_LAB_VOICE = 'zh-CN-XiaoxiaoNeural';

export class AzureSpeechTtsAdapter implements TextToSpeechGateway {
  public static readonly providerId = 'tts.azure_tts_neural';

  private readonly transport: AzureRealtimeTtsTransport;
  private readonly credential: AzureSpeechCredential;
  private readonly voiceName: string;
  private readonly now: () => number;

  private handlers: Array<(event: RealtimeServerEvent | SpeechChunkEvent) => void> = [];
  private activeTurns = new Set<string>();
  /** 每个 turn 有几个 viseme 事件 (用于 §17 lipsync mode telemetry)。 */
  private visemeCountByTurn = new Map<string, number>();
  private chunkCountByTurn = new Map<string, number>();

  constructor(opts: AzureSpeechTtsAdapterOptions) {
    this.transport = opts.transport;
    this.credential = readAzureSpeechCredential(opts.env ?? process.env);
    this.voiceName = opts.env?.FPAI_AZURE_TTS_VOICE?.trim() ||
      opts.voiceName || DEFAULT_LAB_VOICE;
    this.now = opts.now ?? (() => Date.now());

    this.transport.onProviderEvent((evt) => this.dispatchProviderEvent(evt));
  }

  public synthesizeStream(turnId: string, text: string): void {
    if (!this.credential.hasKey || !this.credential.hasRegion) {
      this.emit({
        type: 'TTS_ERROR',
        turn_id: turnId,
        text: AZURE_CREDENTIAL_BLOCKER,
        timestamp_ms: this.now(),
      });
      return;
    }

    this.activeTurns.add(turnId);
    this.visemeCountByTurn.set(turnId, 0);
    this.chunkCountByTurn.set(turnId, 0);

    // Simple SSML without SpeechStyleMapper (for basic use);
    // if caller wants styled synthesis, they should build SSML externally and pass via text.
    // This keeps adapter usable standalone AND with SpeechStyleMapper.
    const isXml = text.trimStart().startsWith('<speak');
    const ssml = isXml
      ? text
      : buildMinimalSsml(text, this.voiceName);

    this.transport.synthesize({ turnId, ssml, credential: this.credential });
  }

  public cancel(turnId: string): void {
    if (!this.activeTurns.has(turnId)) return;
    this.activeTurns.delete(turnId);
    this.visemeCountByTurn.delete(turnId);
    this.chunkCountByTurn.delete(turnId);
    this.transport.cancel(turnId);
    this.emit({
      type: 'TTS_ERROR',
      turn_id: turnId,
      text: 'tts-cancelled',
      timestamp_ms: this.now(),
    });
  }

  public onEvent(handler: (event: RealtimeServerEvent | SpeechChunkEvent) => void): void {
    this.handlers.push(handler);
  }

  private dispatchProviderEvent(evt: TtsProviderEvent): void {
    const { turnId } = evt;
    if (!this.activeTurns.has(turnId)) return; // stale event drop

    switch (evt.kind) {
      case 'STARTED':
        this.emit({ type: 'TTS_STARTED', turn_id: turnId, timestamp_ms: this.now() });
        break;

      case 'AUDIO_CHUNK': {
        const n = (this.chunkCountByTurn.get(turnId) ?? 0) + 1;
        this.chunkCountByTurn.set(turnId, n);
        this.emit({
          type: 'AUDIO_CHUNK',
          turn_id: turnId,
          chunk_id: `${turnId}-chunk-${n}`,
          timestamp_ms: this.now(),
        });
        break;
      }

      case 'VISEME': {
        const frame = mapAzureVisemeToFamily(
          evt.azureVisemeId,
          evt.audioOffsetTicks,
          turnId,
          evt.durationMs,
        );
        // increment viseme count
        const vc = (this.visemeCountByTurn.get(turnId) ?? 0) + 1;
        this.visemeCountByTurn.set(turnId, vc);
        this.emit({
          type: 'VISEME',
          turn_id: turnId,
          chunk_id: `${turnId}-viseme-${vc}`,
          viseme: frame.shape, // Family MouthShape string
          timestamp_ms: this.now(),
        });
        break;
      }

      case 'WORD_BOUNDARY':
        // WordBoundary → 作为 AUDIO_CHUNK with text payload (带 word timing)
        this.emit({
          type: 'AUDIO_CHUNK',
          turn_id: turnId,
          chunk_id: `${turnId}-wb-${evt.wordText}`,
          text: evt.wordText,
          timestamp_ms: this.now(),
        });
        break;

      case 'COMPLETE': {
        const visemeCount = this.visemeCountByTurn.get(turnId) ?? 0;
        const lipSyncMode: LipSyncMode =
          visemeCount > 0 ? 'L4_VISEME' : 'L1_AMPLITUDE_FALLBACK';
        this.activeTurns.delete(turnId);
        this.visemeCountByTurn.delete(turnId);
        this.chunkCountByTurn.delete(turnId);
        this.emit({
          type: 'TTS_COMPLETE',
          turn_id: turnId,
          timestamp_ms: this.now(),
          text: lipSyncMode, // §17 telemetry: LIPSYNC_MODE 注入到 TTS_COMPLETE.text
        });
        break;
      }

      case 'ERROR':
        this.activeTurns.delete(turnId);
        this.visemeCountByTurn.delete(turnId);
        this.chunkCountByTurn.delete(turnId);
        this.emit({
          type: 'TTS_ERROR',
          turn_id: turnId,
          text: evt.reason ?? 'tts-provider-error',
          timestamp_ms: this.now(),
        });
        break;
    }
  }

  private emit(event: RealtimeServerEvent | SpeechChunkEvent): void {
    for (const h of this.handlers) h(event);
  }

  public credentialDiagnostic(): { hasKey: boolean; hasRegion: boolean } {
    return {
      hasKey: this.credential.hasKey,
      hasRegion: this.credential.hasRegion,
    };
  }
}

/** 极简 SSML 构建,用于 adapter 内部(无 style) */
function buildMinimalSsml(text: string, voice: string): string {
  const safe = text.replace(/[<>&]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;',
  );
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="${voice}">${safe}</voice></speak>`;
}
