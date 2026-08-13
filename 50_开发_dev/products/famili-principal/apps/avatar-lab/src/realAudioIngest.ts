/**
 * MM1-B1 · Real-Audio Ingest (§7 / §13)
 *
 * 独立组件, NOT wired into frozen realtimeServer.ts。
 * 目的:
 *   - 定义"服务端接收真实 PCM 二进制帧 → AudioInputNormalizer → SpeechToTextGateway"
 *     的桥。
 *   - 允许后续 (有 Azure credential 时) 在 realtimeServer 里通过一个新的、非破坏性
 *     附加点挂载:
 *       socket.on('message', raw => { if(binary) ingest.pushBinaryFrame(raw) })
 *
 * 严禁:
 *   - 直接引入 Azure SDK。
 *   - 修改 orchestrator.ts / realtimeServer.ts / client.ts。
 *   - 在服务器端持久化任何原始音频 (§29 EPHEMERAL)。
 */
import type { SpeechToTextGateway } from '@family/speech-gateway';
import { AudioInputNormalizer } from '@family/speech-gateway';

export interface RealAudioIngestOptions {
  turnId: string;
  turnStartMs?: number;
  stt: SpeechToTextGateway;
  /** 输入格式;当前只接受 16bit-LE mono 16kHz PCM。 */
  format?: 'INT16_LE_16K_MONO';
  /** 若 caller 想在服务端再打审计日志的钩子(仅长度/条数,不许打内容)。 */
  onFrame?: (info: { sequence: number; sample_count: number }) => void;
}

/**
 * RealAudioIngest — 单个 turn 单个实例。turn 结束后必须弃用。
 */
export class RealAudioIngest {
  private readonly opts: RealAudioIngestOptions;
  private readonly normalizer: AudioInputNormalizer;
  private started = false;
  private closed = false;

  public constructor(opts: RealAudioIngestOptions) {
    this.opts = opts;
    this.normalizer = new AudioInputNormalizer({
      turn_id: opts.turnId,
      turn_start_ms: opts.turnStartMs ?? Date.now(),
    });
  }

  /** 初始化 STT session (会调 stt.startSession)。 */
  public start(): void {
    if (this.started) throw new Error('RealAudioIngest already started');
    this.started = true;
    this.opts.stt.startSession(this.opts.turnId);
  }

  /**
   * 处理来自 WS 的 binary frame(必须是 16bit-LE mono 16kHz PCM 原始字节)。
   * 若发现 credential 缺失,STT 会立即 emit ERROR / BLOCKED_MISSING_CREDENTIAL,
   * 本组件不作二次判断。
   */
  public pushBinaryFrame(bytes: Uint8Array, nowMs?: number): void {
    if (!this.started) throw new Error('RealAudioIngest not started');
    if (this.closed) return;
    const frame = this.normalizer.fromPcm16LE(bytes, nowMs ?? Date.now());
    this.opts.onFrame?.({ sequence: frame.sequence, sample_count: frame.sample_count });
    this.opts.stt.pushAudioChunk(this.opts.turnId, frame.payload);
  }

  /** 客户端明示"停止说话"或 VAD 判定 endpoint。 */
  public finish(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.started) {
      this.opts.stt.finishInput(this.opts.turnId);
    }
  }

  /** 用户 barge-in 或系统 cancel。 */
  public cancel(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.started) {
      this.opts.stt.cancel(this.opts.turnId);
    }
  }
}
