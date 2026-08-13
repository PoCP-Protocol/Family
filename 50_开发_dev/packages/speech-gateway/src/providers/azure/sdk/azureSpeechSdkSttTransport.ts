/**
 * MM1-B1.1 · AzureSpeechSdkSttTransport (§7, §8)
 *
 * 实现 AzureRealtimeSttTransport port, 内部使用官方 microsoft-cognitiveservices-speech-sdk。
 *
 * 契约:
 *   - 不把 Azure SDK 类型 / 事件 shape 暴露给上层。所有对外事件严格是
 *     { turnId, kind: 'PARTIAL'|'FINAL'|'ERROR', text?, reason? }
 *   - 每个 turn 独立 recognizer + pushStream, 生命周期由本 transport 负责。
 *   - cancel / finish → 停止 push、停止 recognizer、close pushStream、close recognizer。
 *   - stale callback: recognizer close 后再收到的 Azure 事件必须被 drop (§8)。
 *   - 无 credential / SDK 未安装 → 构造时抛错;由 adapter 或 factory 处理为 BLOCKED。
 *     transport 本身只做 wiring, 不做 credential 判断 (adapter 已判过)。
 *
 * 音频输入:
 *   AudioInputStream.createPushStream(AudioStreamFormat.getWaveFormatPCM(16000,16,1))
 *   与 AudioInputNormalizer 完全一致。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AzureRealtimeSttTransport } from '../azureSpeechStt';
import type { AzureSpeechCredential } from '../secretReader';
import { loadAzureSdk, type AzureSdk } from './sdkLoader';

type ProviderEvent = {
  turnId: string;
  kind: 'PARTIAL' | 'FINAL' | 'ERROR';
  text?: string;
  reason?: string;
};

interface TurnState {
  recognizer: any;
  pushStream: any;
  closed: boolean;
}

export interface AzureSpeechSdkSttTransportOptions {
  /** 语言,默认 zh-CN。 */
  language?: string;
  /** 允许注入替代 SDK (仅测试)。 */
  __sdkOverride?: AzureSdk;
}

export class AzureSpeechSdkSttTransport implements AzureRealtimeSttTransport {
  private readonly language: string;
  private readonly sdk: AzureSdk;
  private handler: ((evt: ProviderEvent) => void) | null = null;
  private turns = new Map<string, TurnState>();

  public constructor(opts: AzureSpeechSdkSttTransportOptions = {}) {
    this.language = opts.language ?? 'zh-CN';
    this.sdk = opts.__sdkOverride ?? loadAzureSdk();
  }

  public onProviderEvent(handler: (evt: ProviderEvent) => void): void {
    this.handler = handler;
  }

  public open(opts: { turnId: string; credential: AzureSpeechCredential }): void {
    const { turnId, credential } = opts;
    if (!credential.subscriptionKey || !credential.region) {
      // adapter 应已阻断到这里, 但为安全再做一次防御。
      this.fire({ turnId, kind: 'ERROR', reason: 'BLOCKED_MISSING_CREDENTIAL' });
      return;
    }
    if (this.turns.has(turnId)) {
      this.fire({ turnId, kind: 'ERROR', reason: 'DUPLICATE_TURN_OPEN' });
      return;
    }

    const sdk = this.sdk as any;
    const speechConfig = sdk.SpeechConfig.fromSubscription(credential.subscriptionKey, credential.region);
    speechConfig.speechRecognitionLanguage = this.language;
    // 尽量早开始 partial
    // 无强制 timeout 配置, 由 orchestrator 侧生命周期约束。

    const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
    const pushStream = sdk.AudioInputStream.createPushStream(format);
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    const state: TurnState = { recognizer, pushStream, closed: false };
    this.turns.set(turnId, state);

    // 事件绑定 —— 全部经过 `state.closed` 守卫,避免 stale
    recognizer.recognizing = (_sender: any, e: any) => {
      if (state.closed) return;
      const text = safeText(e?.result?.text);
      if (text) this.fire({ turnId, kind: 'PARTIAL', text });
    };
    recognizer.recognized = (_sender: any, e: any) => {
      if (state.closed) return;
      const reason = e?.result?.reason;
      // ResultReason.RecognizedSpeech = 3
      if (reason === sdk.ResultReason.RecognizedSpeech) {
        const text = safeText(e?.result?.text);
        this.fire({ turnId, kind: 'FINAL', text });
      }
      // NoMatch → 忽略 (不上抛 FINAL 空串)
    };
    recognizer.canceled = (_sender: any, e: any) => {
      if (state.closed) return;
      const reasonStr = e?.reason === sdk.CancellationReason.Error
        ? `azure-canceled:${e?.errorDetails ?? 'error'}`
        : 'azure-canceled';
      this.fire({ turnId, kind: 'ERROR', reason: reasonStr });
      this.disposeTurn(turnId);
    };
    recognizer.sessionStopped = (_sender: any, _e: any) => {
      // 内部关闭事件, 不上抛
      this.disposeTurn(turnId);
    };

    try {
      recognizer.startContinuousRecognitionAsync(
        () => {
          /* started */
        },
        (err: any) => {
          if (state.closed) return;
          this.fire({ turnId, kind: 'ERROR', reason: `azure-start-failed:${String(err)}` });
          this.disposeTurn(turnId);
        },
      );
    } catch (err) {
      this.fire({ turnId, kind: 'ERROR', reason: `azure-start-throw:${String(err)}` });
      this.disposeTurn(turnId);
    }
  }

  public pushPcm(turnId: string, pcm: Uint8Array): void {
    const state = this.turns.get(turnId);
    if (!state || state.closed) return;
    try {
      // PushAudioInputStream.write 接受 ArrayBuffer
      const ab = pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength);
      state.pushStream.write(ab);
    } catch (err) {
      this.fire({ turnId, kind: 'ERROR', reason: `azure-push-failed:${String(err)}` });
      this.disposeTurn(turnId);
    }
  }

  public finish(turnId: string): void {
    const state = this.turns.get(turnId);
    if (!state || state.closed) return;
    try {
      state.pushStream.close();
    } catch {
      /* ignore */
    }
    try {
      state.recognizer.stopContinuousRecognitionAsync(
        () => this.disposeTurn(turnId),
        (_err: any) => this.disposeTurn(turnId),
      );
    } catch {
      this.disposeTurn(turnId);
    }
  }

  public cancel(turnId: string): void {
    const state = this.turns.get(turnId);
    if (!state || state.closed) return;
    state.closed = true; // 立即让 stale callback 静默
    try {
      state.pushStream.close();
    } catch {
      /* ignore */
    }
    try {
      state.recognizer.stopContinuousRecognitionAsync(
        () => this.disposeTurn(turnId),
        (_err: any) => this.disposeTurn(turnId),
      );
    } catch {
      this.disposeTurn(turnId);
    }
  }

  private disposeTurn(turnId: string): void {
    const state = this.turns.get(turnId);
    if (!state) return;
    state.closed = true;
    try {
      state.recognizer.close();
    } catch {
      /* ignore */
    }
    this.turns.delete(turnId);
  }

  private fire(evt: ProviderEvent): void {
    this.handler?.(evt);
  }
}

function safeText(t: unknown): string {
  return typeof t === 'string' ? t : '';
}
