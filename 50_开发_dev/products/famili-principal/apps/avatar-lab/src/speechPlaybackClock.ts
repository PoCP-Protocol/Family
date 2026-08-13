/**
 * MM1-B1.1 · SpeechPlaybackClock (§E)
 *
 * 建立音频播放时间轴, 与 WebSocket 事件到达时间解耦。
 * VisemeScheduler 与 Avatar2DRenderer 都基于本时钟调度嘴型/表情。
 *
 * 契约:
 *   - playback_position_ms 由 StreamingAudioPlayer.getPlaybackPositionMs() 提供。
 *   - turn_id / generation_id / started_at 由 beginTurn() 设定, endTurn/cancel 后不再变化。
 *   - state ∈ IDLE / PLAYING / FLUSHED / STOPPED
 *   - now()/scheduleAt() 都基于播放位置, 不基于 wall clock 或事件到达时序。
 */

export type PlaybackClockState = 'IDLE' | 'PLAYING' | 'FLUSHED' | 'STOPPED';

export interface PlaybackPositionProvider {
  getPlaybackPositionMs(): number;
  getActiveTurn(): string | null;
  getActiveGeneration(): string | null;
  getState(): string;
}

export interface PlaybackSnapshot {
  turn_id: string | null;
  generation_id: string | null;
  playback_position_ms: number;
  started_at_ms: number | null;
  state: PlaybackClockState;
  buffered_duration_ms: number;
}

export interface SpeechPlaybackClockOptions {
  provider: PlaybackPositionProvider;
  wallClock?: () => number;
}

export class SpeechPlaybackClock {
  private readonly provider: PlaybackPositionProvider;
  private readonly wallClock: () => number;
  private turnId: string | null = null;
  private generationId: string | null = null;
  private startedAtWallMs: number | null = null;
  private state: PlaybackClockState = 'IDLE';
  private lastPlaybackMs = 0;

  public constructor(opts: SpeechPlaybackClockOptions) {
    this.provider = opts.provider;
    this.wallClock = opts.wallClock ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  }

  public beginTurn(turn_id: string, generation_id: string): void {
    this.turnId = turn_id;
    this.generationId = generation_id;
    this.startedAtWallMs = this.wallClock();
    this.state = 'PLAYING';
    this.lastPlaybackMs = 0;
  }

  public endTurn(): void {
    if (this.state === 'STOPPED') return;
    this.state = 'IDLE';
    this.turnId = null;
    this.generationId = null;
  }

  public flush(): void {
    this.state = 'FLUSHED';
  }
  public stop(): void {
    this.state = 'STOPPED';
    this.turnId = null;
    this.generationId = null;
  }

  public getState(): PlaybackClockState { return this.state; }
  public getTurnId(): string | null { return this.turnId; }
  public getGenerationId(): string | null { return this.generationId; }

  /** 当前播放位置(ms), 相对 turn 起点。 */
  public now(): number {
    const pos = this.provider.getPlaybackPositionMs();
    if (pos > this.lastPlaybackMs) this.lastPlaybackMs = pos;
    return pos;
  }

  public snapshot(): PlaybackSnapshot {
    const pos = this.now();
    return {
      turn_id: this.turnId,
      generation_id: this.generationId,
      playback_position_ms: pos,
      started_at_ms: this.startedAtWallMs,
      state: this.state,
      buffered_duration_ms: Math.max(0, pos - this.lastPlaybackMs),
    };
  }

  /**
   * 在 playback_position_ms = targetMs 时 fire cb, 若目标已过期则立即 fire(不重放)。
   * 返回一个 cancel 函数。
   *
   * NOTE: 使用 setTimeout wall-clock 估算下一次唤醒, 但真实到期判定用 now() 检查
   * (playback position),避免因为 wall clock drift 而误判。
   */
  public scheduleAt(targetMs: number, cb: () => void, opts: { setTimeoutFn?: (fn: () => void, ms: number) => any; clearTimeoutFn?: (h: any) => void } = {}): () => void {
    const setTO = opts.setTimeoutFn ?? ((fn, ms) => setTimeout(fn, ms));
    const clearTO = opts.clearTimeoutFn ?? ((h) => clearTimeout(h));
    let cancelled = false;
    let handle: any = null;
    const tick = () => {
      if (cancelled) return;
      const nowPos = this.now();
      if (nowPos >= targetMs) {
        cb();
        return;
      }
      const wait = Math.max(1, targetMs - nowPos);
      handle = setTO(tick, wait);
    };
    tick();
    return () => {
      cancelled = true;
      if (handle) clearTO(handle);
    };
  }
}
