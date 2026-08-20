/**
 * MM1-B1.1 · StreamingAudioPlayer (§D)
 *
 * 浏览器侧真实的流式播放器。
 *
 * 契约:
 *   - enqueueChunk({turn_id, generation_id, chunkIndex, pcmBytes, sampleRate})
 *   - INTERRUPT / flush 必须立即静音, 不等当前 chunk 播完。
 *   - stale generation → 丢弃, 不排队, 不播。
 *   - 提供 playback_position_ms(相对 first_audio_ms), 供 SpeechPlaybackClock 使用。
 *   - 支持 AudioContext 注入(测试), 生产用 browser AudioContext。
 *
 * PCM 假设:
 *   - INT16_LE mono
 *   - 与 Azure Raw16Khz16BitMonoPcm 对齐 (16000 Hz)
 *   - 若与 provider 的 sample rate 不同, 由上层负责 resample(v1 不做)。
 *
 * NOTE:
 *   - 不引入任何 Azure SDK。
 *   - 不假设 window/document 存在, 由测试注入 AudioContextLike。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type PlayerState = 'IDLE' | 'PLAYING' | 'FLUSHED' | 'STOPPED' | 'DISPOSED';

export interface AudioBufferSourceLike {
  buffer: any;
  onended: null | (() => void);
  connect(destination: any): void;
  start(when?: number): void;
  stop(when?: number): void;
  disconnect?(): void;
}

export interface AudioContextLike {
  readonly currentTime: number;
  readonly sampleRate: number;
  readonly destination: any;
  createBuffer(channels: number, length: number, sampleRate: number): any;
  createBufferSource(): AudioBufferSourceLike;
  close(): Promise<void> | void;
  resume?(): Promise<void>;
  state?: string;
}

export type AudioContextFactory = (sampleRate: number) => AudioContextLike;

export interface StreamingChunk {
  turn_id: string;
  generation_id: string;
  chunkIndex: number;
  pcmBytes: Uint8Array;
  sampleRate: number;
}

export interface StreamingAudioPlayerMetrics {
  first_audio_ms: number | null;
  chunks_queued: number;
  chunks_played: number;
  chunks_dropped_stale: number;
  chunks_dropped_interrupt: number;
  last_playback_position_ms: number;
}

export interface PlaybackLifecycleCallbacks {
  onPlaybackStarted?(turn_id: string, generation_id: string, scheduled_start_context_time: number): void;
  onPlaybackEnded?(turn_id: string, generation_id: string): void;
  onUtteranceInterrupted?(): void;
}

export interface StreamingAudioPlayerOptions {
  contextFactory?: AudioContextFactory;
  now?: () => number;
  lifecycleCallbacks?: PlaybackLifecycleCallbacks;
}

export class StreamingAudioPlayer {
  private context: AudioContextLike | null = null;
  private state: PlayerState = 'IDLE';
  private activeTurn: string | null = null;
  private activeGeneration: string | null = null;
  private nextPlaybackTime = 0;
  private firstAudioAt: number | null = null;
  private readonly metrics: StreamingAudioPlayerMetrics = {
    first_audio_ms: null,
    chunks_queued: 0,
    chunks_played: 0,
    chunks_dropped_stale: 0,
    chunks_dropped_interrupt: 0,
    last_playback_position_ms: 0,
  };
  private readonly contextFactory?: AudioContextFactory;
  private readonly nowFn: () => number;
  private readonly lifecycleCallbacks?: PlaybackLifecycleCallbacks;
  /** 当前挂在 AudioContext 上的 source 列表, flush/stop 时需要 stop() 掉。 */
  private activeSources: AudioBufferSourceLike[] = [];
  /** MM5: Track if playback start callback was fired for current utterance */
  private playbackStartedFired = false;

  public constructor(opts: StreamingAudioPlayerOptions = {}) {
    this.contextFactory = opts.contextFactory;
    this.nowFn = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.lifecycleCallbacks = opts.lifecycleCallbacks;
  }

  public getState(): PlayerState {
    return this.state;
  }
  public getMetrics(): Readonly<StreamingAudioPlayerMetrics> {
    return this.metrics;
  }
  public getActiveTurn(): string | null {
    return this.activeTurn;
  }
  public getActiveGeneration(): string | null {
    return this.activeGeneration;
  }
  public getPlaybackPositionMs(): number {
    if (this.state === 'DISPOSED') return this.metrics.last_playback_position_ms;
    if (!this.context || this.firstAudioAt === null) return 0;
    // playback_position_ms = context.currentTime - firstAudioAt(相对 turn 起点)
    const pos = Math.max(0, (this.context.currentTime - this.firstAudioAt) * 1000);
    this.metrics.last_playback_position_ms = pos;
    return pos;
  }

  /**
   * 开始一个新 turn: 若已有 turn 且不同 → 视为 flush + 切换。
   */
  public beginTurn(turn_id: string, generation_id: string): void {
    if (this.state === 'DISPOSED') return;
    if (this.activeTurn && (this.activeTurn !== turn_id || this.activeGeneration !== generation_id)) {
      this.flush('turn_switch');
    }
    this.activeTurn = turn_id;
    this.activeGeneration = generation_id;
    this.firstAudioAt = null;
    this.nextPlaybackTime = 0;
    this.state = 'IDLE';
    this.playbackStartedFired = false;
  }

  public enqueueChunk(chunk: StreamingChunk): 'PLAYED' | 'DROPPED_STALE' | 'DROPPED_INTERRUPT' | 'DROPPED_DISPOSED' {
    if (this.state === 'DISPOSED') {
      return 'DROPPED_DISPOSED';
    }
    // stale generation / stale turn
    if (this.activeTurn !== chunk.turn_id || this.activeGeneration !== chunk.generation_id) {
      this.metrics.chunks_dropped_stale += 1;
      return 'DROPPED_STALE';
    }
    if (this.state === 'FLUSHED' || this.state === 'STOPPED') {
      this.metrics.chunks_dropped_interrupt += 1;
      return 'DROPPED_INTERRUPT';
    }
    if (!this.context) {
      this.context = this.buildContext(chunk.sampleRate);
    }
    this.metrics.chunks_queued += 1;

    const audioBuffer = pcm16LEToAudioBuffer(this.context, chunk.pcmBytes, chunk.sampleRate);
    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);

    // 首次播放时定基准
    let isFirstChunk = false;
    if (this.firstAudioAt === null) {
      this.firstAudioAt = this.context.currentTime;
      this.metrics.first_audio_ms = this.nowFn();
      this.nextPlaybackTime = this.context.currentTime;
      isFirstChunk = true;
    }
    const startAt = Math.max(this.nextPlaybackTime, this.context.currentTime);
    source.start(startAt);
    this.nextPlaybackTime = startAt + audioBuffer.duration;
    this.state = 'PLAYING';
    this.activeSources.push(source);
    source.onended = () => {
      this.metrics.chunks_played += 1;
      // 若队列已尽 → 保持 PLAYING 直到显式 stop / new chunk / turn 结束
      const idx = this.activeSources.indexOf(source);
      if (idx >= 0) this.activeSources.splice(idx, 1);

      // MM5: If all sources have finished and this was the last one, fire playbackEnded
      if (this.activeSources.length === 0 && this.activeTurn && this.activeGeneration) {
        this.lifecycleCallbacks?.onPlaybackEnded?.(this.activeTurn, this.activeGeneration);
      }
    };

    // MM5: Fire playback started callback only once per utterance (on first chunk)
    if (isFirstChunk && !this.playbackStartedFired) {
      this.playbackStartedFired = true;
      this.lifecycleCallbacks?.onPlaybackStarted?.(
        chunk.turn_id,
        chunk.generation_id,
        startAt
      );
    }

    return 'PLAYED';
  }

  /**
   * INTERRUPT / barge-in 立刻静音, 丢弃所有 pending 音频, 不等 chunk 播完。
   */
  public flush(reason: string = 'flush'): void {
    if (this.state === 'DISPOSED') return;
    for (const s of this.activeSources) {
      try { s.stop(0); } catch { /* ignore */ }
      try { s.disconnect?.(); } catch { /* ignore */ }
    }
    this.activeSources = [];
    this.state = 'FLUSHED';
    this.nextPlaybackTime = 0;

    // MM5: Fire interruption callback if playback was active
    if (this.playbackStartedFired && reason !== 'turn_switch') {
      this.lifecycleCallbacks?.onUtteranceInterrupted?.();
    }
    this.playbackStartedFired = false;

    void reason;
  }

  /** turn 正常结束: 保持已排入的音频播完, 但不再接受新 chunk。 */
  public endTurn(): void {
    if (this.state === 'DISPOSED') return;
    this.activeTurn = null;
    this.activeGeneration = null;
    // 已入队的 source 让它播完自然结束
    this.state = 'IDLE';
    this.firstAudioAt = null;
  }

  public stop(): void {
    if (this.state === 'DISPOSED') return;
    this.flush('stop');
    this.state = 'STOPPED';
  }

  public dispose(): void {
    if (this.state === 'DISPOSED') return;
    this.flush('dispose');
    if (this.context) {
      try { void this.context.close(); } catch { /* ignore */ }
    }
    this.context = null;
    this.state = 'DISPOSED';
  }

  private buildContext(sampleRate: number): AudioContextLike {
    if (this.contextFactory) return this.contextFactory(sampleRate);
    // 生产环境: 依赖浏览器 AudioContext
    const AC: any = (globalThis as any).AudioContext ?? (globalThis as any).webkitAudioContext;
    if (!AC) throw new Error('AudioContext unavailable');
    return new AC({ sampleRate });
  }
}

/**
 * PCM16-LE mono → AudioBuffer (float32 [-1, 1])
 */
function pcm16LEToAudioBuffer(ctx: AudioContextLike, pcm: Uint8Array, sampleRate: number): any {
  if (pcm.byteLength % 2 !== 0) throw new Error('pcm16 length must be even');
  const nSamples = pcm.byteLength / 2;
  const buffer = ctx.createBuffer(1, nSamples, sampleRate);
  const dv = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const channel: Float32Array = typeof buffer.getChannelData === 'function'
    ? buffer.getChannelData(0)
    : new Float32Array(nSamples);
  for (let i = 0; i < nSamples; i++) {
    const s = dv.getInt16(i * 2, true);
    channel[i] = s < 0 ? s / 0x8000 : s / 0x7fff;
  }
  if (typeof buffer.copyToChannel === 'function' && channel !== buffer.getChannelData?.(0)) {
    buffer.copyToChannel(channel, 0, 0);
  }
  return buffer;
}
