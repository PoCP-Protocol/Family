/**
 * MM1-B1 · Azure Speech Realtime STT Adapter (§6)
 *
 * 硬约束:
 *   - 实现 SpeechToTextGateway 接口, **不改接口** 迁就 Azure
 *   - **不 import Azure SDK**(SDK 引入延后到 credentials 就位时的独立 wiring 模块)
 *     本 adapter 通过 `AzureRealtimeSttTransport` port 与 SDK 层解耦
 *   - 缺 credential → adapter 仍可 construct, 但每次 startSession() 立即 emit
 *     ERROR(BLOCKED_MISSING_CREDENTIAL), 让 orchestrator 认识到 provider 不可用
 *   - PARTIAL / FINAL / ERROR 三种事件严格符合 @family/fpai-multimodal-contracts
 *   - 无任何 provider-specific 字段泄漏
 *
 * 事件映射:
 *   Azure `recognizing`       → TRANSCRIPT_PARTIAL
 *   Azure `recognized`        → TRANSCRIPT_FINAL
 *   Azure `canceled` / error  → RealtimeServerEvent(ERROR)
 *   Azure `sessionStopped`    → 内部关闭, 不 emit
 */
import type {
  RealtimeServerEvent,
  TranscriptEvent,
} from '@family/fpai-multimodal-contracts';
import type { SpeechToTextGateway } from '../../index';
import {
  readAzureSpeechCredential,
  AZURE_CREDENTIAL_BLOCKER,
  type AzureSpeechCredential,
} from './secretReader';

/**
 * Provider transport port.
 *
 * 生产 wiring 会把 Azure Speech SDK 的 `SpeechRecognizer`(push-stream 模式)
 * 适配到这个接口。**Adapter 本文件不 import Azure SDK**。
 */
export interface AzureRealtimeSttTransport {
  /** 由 adapter 调用, transport 内部完成 recognizer 建立。可能 async, 但 adapter 不 await 阻塞流。 */
  open(opts: { turnId: string; credential: AzureSpeechCredential }): void;
  /** push 一段 INT16_LE PCM 到 recognizer。 */
  pushPcm(turnId: string, pcm: Uint8Array): void;
  /** 通知 recognizer 输入结束, 触发最终一次 recognized。 */
  finish(turnId: string): void;
  /** cancel & close recognizer。 */
  cancel(turnId: string): void;
  /** 由 adapter 注册, transport 内部把 Azure SDK event 映射后回调。 */
  onProviderEvent(
    handler: (evt: {
      turnId: string;
      kind: 'PARTIAL' | 'FINAL' | 'ERROR';
      text?: string;
      reason?: string;
    }) => void,
  ): void;
}

export interface AzureSpeechSttAdapterOptions {
  /** 生产: 传入真实 Azure SDK-based transport;测试: 传入 fake transport。 */
  transport: AzureRealtimeSttTransport;
  /** 允许注入 env (测试用)。默认 process.env。 */
  env?: NodeJS.ProcessEnv;
  /** 允许注入 clock (测试用)。默认 Date.now。 */
  now?: () => number;
}

export class AzureSpeechSttAdapter implements SpeechToTextGateway {
  public static readonly providerId = 'stt.azure_speech_realtime';

  private readonly transport: AzureRealtimeSttTransport;
  private readonly credential: AzureSpeechCredential;
  private readonly now: () => number;

  private handlers: Array<(event: RealtimeServerEvent | TranscriptEvent) => void> = [];
  private activeTurns = new Set<string>();

  constructor(opts: AzureSpeechSttAdapterOptions) {
    this.transport = opts.transport;
    this.credential = readAzureSpeechCredential(opts.env ?? process.env);
    this.now = opts.now ?? (() => Date.now());

    this.transport.onProviderEvent((evt) => this.dispatchProviderEvent(evt));
  }

  public startSession(turnId: string): void {
    // 无 credential → 立即报 blocker,不启动 transport
    if (!this.credential.hasKey || !this.credential.hasRegion) {
      this.emit({
        kind: 'ERROR',
        turn_id: turnId,
        payload: {
          provider_id: AzureSpeechSttAdapter.providerId,
          reason: AZURE_CREDENTIAL_BLOCKER,
        },
      });
      return;
    }
    this.activeTurns.add(turnId);
    // 通知客户端进入 TRANSCRIBING (与 Fake 一致)
    this.emit({
      kind: 'STATE_CHANGED',
      turn_id: turnId,
      payload: { state: 'TRANSCRIBING', provider_id: AzureSpeechSttAdapter.providerId },
    });
    this.transport.open({ turnId, credential: this.credential });
  }

  public pushAudioChunk(turnId: string, chunk: Uint8Array): void {
    if (!this.activeTurns.has(turnId)) return;
    this.transport.pushPcm(turnId, chunk);
  }

  public finishInput(turnId: string): void {
    if (!this.activeTurns.has(turnId)) return;
    this.transport.finish(turnId);
  }

  public cancel(turnId: string): void {
    if (!this.activeTurns.has(turnId)) return;
    this.activeTurns.delete(turnId);
    this.transport.cancel(turnId);
    this.emit({
      kind: 'ERROR',
      turn_id: turnId,
      payload: {
        provider_id: AzureSpeechSttAdapter.providerId,
        reason: 'stt-cancelled',
      },
    });
  }

  public onEvent(handler: (event: RealtimeServerEvent | TranscriptEvent) => void): void {
    this.handlers.push(handler);
  }

  private dispatchProviderEvent(evt: {
    turnId: string;
    kind: 'PARTIAL' | 'FINAL' | 'ERROR';
    text?: string;
    reason?: string;
  }): void {
    // 已经 cancel 的 turn 不再对外发,防止 stale event
    if (!this.activeTurns.has(evt.turnId)) return;

    if (evt.kind === 'PARTIAL') {
      this.emit({
        type: 'TRANSCRIPT_PARTIAL',
        turn_id: evt.turnId,
        text: evt.text ?? '',
        timestamp_ms: this.now(),
      });
      return;
    }
    if (evt.kind === 'FINAL') {
      this.emit({
        type: 'TRANSCRIPT_FINAL',
        turn_id: evt.turnId,
        text: evt.text ?? '',
        timestamp_ms: this.now(),
      });
      this.activeTurns.delete(evt.turnId);
      return;
    }
    // ERROR
    this.emit({
      kind: 'ERROR',
      turn_id: evt.turnId,
      payload: {
        provider_id: AzureSpeechSttAdapter.providerId,
        reason: evt.reason ?? 'stt-provider-error',
      },
    });
    this.activeTurns.delete(evt.turnId);
  }

  private emit(event: RealtimeServerEvent | TranscriptEvent): void {
    for (const h of this.handlers) h(event);
  }

  /** 用于外部诊断 (safe): 只返回布尔与命名来源, 不返回 key/region 值。 */
  public credentialDiagnostic(): { hasKey: boolean; hasRegion: boolean; namingSource: string } {
    return {
      hasKey: this.credential.hasKey,
      hasRegion: this.credential.hasRegion,
      namingSource: this.credential.namingSource,
    };
  }
}
