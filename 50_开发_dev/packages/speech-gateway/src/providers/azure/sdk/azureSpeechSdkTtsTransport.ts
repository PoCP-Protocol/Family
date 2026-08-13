/**
 * MM1-B1.1 · AzureSpeechSdkTtsTransport (§9, §10, §11)
 *
 * 实现 AzureRealtimeTtsTransport port, 使用官方 microsoft-cognitiveservices-speech-sdk 的
 * `SpeechSynthesizer` + SSML streaming callback。
 *
 * 契约:
 *   - 输出必须是 streaming: `synthesizing` 事件里的 `result.audioData` 直接转为 AUDIO_CHUNK,
 *     不等 `synthesisCompleted` 才一次性发。
 *   - 事件映射:
 *       synthesisStarted     → STARTED
 *       synthesizing         → AUDIO_CHUNK
 *       visemeReceived       → VISEME (azureVisemeId + audioOffsetTicks)
 *       wordBoundary         → WORD_BOUNDARY
 *       synthesisCompleted   → COMPLETE
 *       SynthesisCanceled    → ERROR
 *   - cancel: **PROVIDER_CANCEL_MODE 未定** (§11)。当前实现:
 *       (1) 立刻置 state.closed=true, drop 后续 SDK callback
 *       (2) 若 synthesizer.stopSpeakingAsync 存在则 best-effort 调用
 *       (3) synthesizer.close()
 *     真实 PROVIDER_CANCEL_LATENCY_MS 必须 live run 实测, 不预设 PASS。
 *   - 无 credential / SDK 未安装 → 由 factory 层拦截; 本 transport 只做 wiring。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AzureRealtimeTtsTransport, TtsProviderEvent } from '../azureSpeechTts';
import type { AzureSpeechCredential } from '../secretReader';
import { loadAzureSdk, type AzureSdk } from './sdkLoader';

interface TurnState {
  synthesizer: any;
  closed: boolean;
  chunkIndex: number;
  /** 记录本 turn provider native cancel 是否被真正调用 (供 §11 telemetry 追踪)。 */
  nativeCancelAttempted: boolean;
}

export interface AzureSpeechSdkTtsTransportOptions {
  /** 允许注入替代 SDK (仅测试)。 */
  __sdkOverride?: AzureSdk;
  /** 输出音频格式;默认 Raw16Khz16BitMonoPcm (与 StreamingAudioPlayer 对齐)。 */
  outputFormat?: 'Raw16Khz16BitMonoPcm';
}

export type ProviderCancelMode =
  | 'PROVIDER_NATIVE_CANCEL'
  | 'TRANSPORT_DISPOSE_CANCEL'
  | 'UNKNOWN_PENDING_LIVE_TEST';

/**
 * §11 官方 JavaScript SDK 上 `stopSpeakingAsync` 的存在性 / 一致性未活体校验。
 * 保持默认 UNKNOWN_PENDING_LIVE_TEST, live run 后由 benchmark harness 更新此常量。
 */
export const AZURE_JS_TTS_NATIVE_CANCEL_EVIDENCE: ProviderCancelMode = 'UNKNOWN_PENDING_LIVE_TEST';

export class AzureSpeechSdkTtsTransport implements AzureRealtimeTtsTransport {
  private readonly sdk: AzureSdk;
  private readonly outputFormat: 'Raw16Khz16BitMonoPcm';
  private handler: ((evt: TtsProviderEvent) => void) | null = null;
  private turns = new Map<string, TurnState>();
  private lastCancelMode: ProviderCancelMode | null = null;

  public constructor(opts: AzureSpeechSdkTtsTransportOptions = {}) {
    this.sdk = opts.__sdkOverride ?? loadAzureSdk();
    this.outputFormat = opts.outputFormat ?? 'Raw16Khz16BitMonoPcm';
  }

  /** 便于 telemetry 读取"上一次 cancel 走的通道"。 */
  public getLastCancelMode(): ProviderCancelMode | null {
    return this.lastCancelMode;
  }

  public onProviderEvent(handler: (evt: TtsProviderEvent) => void): void {
    this.handler = handler;
  }

  public synthesize(opts: { turnId: string; ssml: string; credential: AzureSpeechCredential }): void {
    const { turnId, ssml, credential } = opts;
    if (!credential.subscriptionKey || !credential.region) {
      this.fire({ kind: 'ERROR', turnId, reason: 'BLOCKED_MISSING_CREDENTIAL' });
      return;
    }
    if (this.turns.has(turnId)) {
      this.fire({ kind: 'ERROR', turnId, reason: 'DUPLICATE_TURN_SYNTH' });
      return;
    }

    const sdk = this.sdk as any;
    const speechConfig = sdk.SpeechConfig.fromSubscription(credential.subscriptionKey, credential.region);
    // 输出格式 = Raw 16k mono PCM,与 StreamingAudioPlayer 对齐
    const fmtEnum = sdk.SpeechSynthesisOutputFormat?.[this.outputFormat];
    if (fmtEnum !== undefined) {
      speechConfig.speechSynthesisOutputFormat = fmtEnum;
    }

    // 不给 audioConfig → 音频通过 `synthesizing` 事件的 result.audioData 拿到,streaming
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    const state: TurnState = { synthesizer, closed: false, chunkIndex: 0, nativeCancelAttempted: false };
    this.turns.set(turnId, state);

    synthesizer.synthesisStarted = (_s: any, _e: any) => {
      if (state.closed) return;
      this.fire({ kind: 'STARTED', turnId });
    };

    synthesizer.synthesizing = (_s: any, e: any) => {
      if (state.closed) return;
      const audio: ArrayBuffer | undefined = e?.result?.audioData;
      if (audio && audio.byteLength > 0) {
        const bytes = new Uint8Array(audio);
        const chunkIndex = state.chunkIndex++;
        this.fire({ kind: 'AUDIO_CHUNK', turnId, chunkIndex, pcmBytes: bytes });
      }
    };

    synthesizer.visemeReceived = (_s: any, e: any) => {
      if (state.closed) return;
      const azureVisemeId = typeof e?.visemeId === 'number' ? e.visemeId : 0;
      // audioOffset 单位: 100ns ticks
      const audioOffsetTicks = typeof e?.audioOffset === 'number'
        ? e.audioOffset
        : Number(e?.audioOffset ?? 0);
      this.fire({ kind: 'VISEME', turnId, azureVisemeId, audioOffsetTicks });
    };

    synthesizer.wordBoundary = (_s: any, e: any) => {
      if (state.closed) return;
      const wordText = typeof e?.text === 'string' ? e.text : '';
      const audioOffsetTicks = typeof e?.audioOffset === 'number'
        ? e.audioOffset
        : Number(e?.audioOffset ?? 0);
      if (wordText) {
        this.fire({ kind: 'WORD_BOUNDARY', turnId, wordText, audioOffsetTicks });
      }
    };

    synthesizer.synthesisCompleted = (_s: any, _e: any) => {
      if (state.closed) return;
      this.fire({ kind: 'COMPLETE', turnId });
      this.disposeTurn(turnId);
    };

    synthesizer.SynthesisCanceled = (_s: any, e: any) => {
      if (state.closed) return;
      const reason = e?.reason === sdk.CancellationReason?.Error
        ? `azure-synthesis-error:${e?.errorDetails ?? 'error'}`
        : 'azure-synthesis-canceled';
      this.fire({ kind: 'ERROR', turnId, reason });
      this.disposeTurn(turnId);
    };

    try {
      synthesizer.speakSsmlAsync(
        ssml,
        (_result: any) => {
          // 完成或提前结束时进入此回调, 但我们主要依赖事件流, 这里不额外 fire。
        },
        (err: any) => {
          if (state.closed) return;
          this.fire({ kind: 'ERROR', turnId, reason: `azure-speakSsml-failed:${String(err)}` });
          this.disposeTurn(turnId);
        },
      );
    } catch (err) {
      this.fire({ kind: 'ERROR', turnId, reason: `azure-speakSsml-throw:${String(err)}` });
      this.disposeTurn(turnId);
    }
  }

  public cancel(turnId: string): void {
    const state = this.turns.get(turnId);
    if (!state || state.closed) return;
    state.closed = true; // 立即静默后续 SDK callback

    const nativeStop = typeof state.synthesizer?.stopSpeakingAsync === 'function'
      ? state.synthesizer.stopSpeakingAsync.bind(state.synthesizer)
      : null;

    if (nativeStop) {
      state.nativeCancelAttempted = true;
      try {
        nativeStop(
          () => {
            /* best-effort */
          },
          (_err: any) => {
            /* ignore */
          },
        );
        // 官方 JS SDK 存在 stopSpeakingAsync, 但真实"provider-side 立即停"未活体验证
        this.lastCancelMode = AZURE_JS_TTS_NATIVE_CANCEL_EVIDENCE;
      } catch {
        this.lastCancelMode = 'TRANSPORT_DISPOSE_CANCEL';
      }
    } else {
      this.lastCancelMode = 'TRANSPORT_DISPOSE_CANCEL';
    }

    this.disposeTurn(turnId);
  }

  private disposeTurn(turnId: string): void {
    const state = this.turns.get(turnId);
    if (!state) return;
    state.closed = true;
    try {
      state.synthesizer.close();
    } catch {
      /* ignore */
    }
    this.turns.delete(turnId);
  }

  private fire(evt: TtsProviderEvent): void {
    this.handler?.(evt);
  }
}
