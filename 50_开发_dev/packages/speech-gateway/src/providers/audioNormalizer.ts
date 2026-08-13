/**
 * MM1-B1 · AudioInputNormalizer (§8)
 *
 * 目的:
 *   把不同来源(浏览器 getUserMedia / 测试合成 wav / 未来 provider-native format)
 *   的音频统一成 provider-neutral 内部格式:16 kHz mono 16-bit PCM,
 *   携带 timestamp/sequence/turn_id 元信息。
 *
 * 硬约束(§8):
 *   Provider 特定的音频要求(如 Azure Speech 的 riff-16khz-16bit-mono-pcm)
 *   **不得**泄漏到 Principal / Performance Planner / Browser Contract。
 *   Adapter 内部可以再做 provider-native 编码, 但 orchestrator 只见 normalized frame。
 *
 * 不依赖:
 *   任何真实音频 codec 库 / provider SDK。
 *   浏览器已经能通过 AudioContext + AudioWorklet 输出 Float32 PCM,
 *   本文件做的是**内部数值转换**(Float32 [-1,1] → Int16 [-32768,32767]) 与 chunk 拼装。
 */

export type PcmSampleFormat = 'INT16_LE';

export interface NormalizedAudioFrame {
  turn_id: string;
  /** 帧序号,自 0 起单调递增。 */
  sequence: number;
  /** 到达服务器时的相对时间戳(ms since turn_start),不含墙钟。 */
  timestamp_ms: number;
  /** 采样率, MM1-B1 固定 16000。 */
  sample_rate_hz: 16000;
  /** 通道数, MM1-B1 固定 1 (mono)。 */
  channels: 1;
  /** 采样格式, MM1-B1 固定 INT16_LE。 */
  format: PcmSampleFormat;
  /** 帧样本数 = payload.byteLength / 2 (16-bit)。 */
  sample_count: number;
  /** 归一化后的 PCM 字节流。 */
  payload: Uint8Array;
}

export interface NormalizerOptions {
  turn_id: string;
  /** 由 orchestrator 设置为该 turn 的开始 monotonic ms。 */
  turn_start_ms: number;
}

/**
 * 逐帧归一化器。**线程内**使用,不做并发保证。
 */
export class AudioInputNormalizer {
  private sequence = 0;
  private readonly turnId: string;
  private readonly turnStartMs: number;

  constructor(opts: NormalizerOptions) {
    if (!opts.turn_id) throw new Error('AudioInputNormalizer: turn_id required');
    this.turnId = opts.turn_id;
    this.turnStartMs = opts.turn_start_ms;
  }

  /**
   * 接受 Float32Array PCM (取值 [-1,1]) → 输出 Int16 mono 16k PCM frame。
   * 输入必须已经是 16 kHz mono (由浏览器 AudioContext resample+downmix)。
   * 本函数**不做重采样** —— 重采样在浏览器 AudioWorklet 更省 CPU。
   *
   * @param samples Float32 samples,长度即帧样本数(不能为空)
   * @param nowMs 当前 monotonic ms (由 caller 传, 便于测试)
   */
  public fromFloat32(samples: Float32Array, nowMs: number): NormalizedAudioFrame {
    if (samples.length === 0) {
      throw new Error('AudioInputNormalizer.fromFloat32: empty samples');
    }
    const payload = new Uint8Array(samples.length * 2);
    const view = new DataView(payload.buffer);
    for (let i = 0; i < samples.length; i++) {
      // clamp
      let s = samples[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      const int16 = Math.round(s * 32767);
      view.setInt16(i * 2, int16, true /* littleEndian */);
    }
    return this.emit(payload, samples.length, nowMs);
  }

  /**
   * 接受已经是 INT16_LE 的 PCM chunk (Uint8Array, byteLength 必须偶数),
   * 用于测试或已经预处理过的音频。
   */
  public fromPcm16LE(bytes: Uint8Array, nowMs: number): NormalizedAudioFrame {
    if (bytes.length === 0) {
      throw new Error('AudioInputNormalizer.fromPcm16LE: empty bytes');
    }
    if (bytes.length % 2 !== 0) {
      throw new Error('AudioInputNormalizer.fromPcm16LE: byteLength must be even (16-bit)');
    }
    return this.emit(bytes, bytes.length / 2, nowMs);
  }

  private emit(payload: Uint8Array, sampleCount: number, nowMs: number): NormalizedAudioFrame {
    const seq = this.sequence++;
    return {
      turn_id: this.turnId,
      sequence: seq,
      timestamp_ms: Math.max(0, nowMs - this.turnStartMs),
      sample_rate_hz: 16000,
      channels: 1,
      format: 'INT16_LE',
      sample_count: sampleCount,
      payload,
    };
  }
}
