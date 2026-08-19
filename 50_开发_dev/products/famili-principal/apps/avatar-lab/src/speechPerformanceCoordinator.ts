/**
 * MM5: SpeechPerformanceCoordinator
 *
 * 协调实际音频播放与嘴型动画。
 *
 * 职责：
 * - 维护当前utterance生命周期
 * - 计算mouth_activity envelope (0..1)
 * - 协调实际播放状态变化
 * - interruption时清理
 *
 * 不负责：
 * - Principal semantics
 * - PerformanceIntent
 * - Identity
 * - TTS生成
 * - WebSocket transport
 * - Expression决策
 * - Gesture语义
 */

/**
 * Simple clock interface for time-based envelope calculations
 */
export interface SimplePlaybackClock {
  now(): number;
}

/**
 * 实际音频播放生命周期
 */
export type AudioPlaybackState = 'IDLE' | 'BUFFERING' | 'PLAYING' | 'RELEASING' | 'STOPPED';

/**
 * 语义上的说话意图（来自PerformanceFrame）
 */
export type SemanticSpeechActivity = 'SILENT' | 'SPEAKING';

/**
 * 当前utterance标识
 */
export interface UtteranceIdentity {
  readonly turn_id: string;
  readonly generation_id: string;
}

/**
 * 口型活动状态
 */
export interface MouthActivityState {
  readonly utterance: UtteranceIdentity;
  readonly semantic_activity: SemanticSpeechActivity;
  readonly playback_state: AudioPlaybackState;
  readonly mouth_activity: number;  // 0..1
  readonly playback_position_ms: number;
  readonly attack_started_at_ms: number | null;
  readonly release_started_at_ms: number | null;
}

/**
 * Mouth envelope时间参数（毫秒）
 */
export const MOUTH_ATTACK_MS = 100;
export const MOUTH_RELEASE_MS = 80;
export const MOUTH_INTERRUPT_RELEASE_MS = 50;

export interface SpeechPerformanceCoordinatorOptions {
  clock: SimplePlaybackClock;
  attackDurationMs?: number;
  releaseDurationMs?: number;
  interruptReleaseDurationMs?: number;
  now?: () => number;
}

export class SpeechPerformanceCoordinator {
  private readonly clock: SimplePlaybackClock;
  private readonly nowFn: () => number;
  private readonly attackMs: number;
  private readonly releaseMsValue: number;
  private readonly interruptReleaseMs: number;

  private currentUtterance: UtteranceIdentity | null = null;
  private semanticActivity: SemanticSpeechActivity = 'SILENT';
  private playbackState: AudioPlaybackState = 'IDLE';
  private mouth_activity = 0;
  private attackStartedAt: number | null = null;
  private releaseStartedAt: number | null = null;
  private playbackScheduledStartMs: number | null = null;
  private isInterruptRelease = false;

  public constructor(opts: SpeechPerformanceCoordinatorOptions) {
    this.clock = opts.clock;
    this.nowFn = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.attackMs = opts.attackDurationMs ?? MOUTH_ATTACK_MS;
    this.releaseMsValue = opts.releaseDurationMs ?? MOUTH_RELEASE_MS;
    this.interruptReleaseMs = opts.interruptReleaseDurationMs ?? MOUTH_INTERRUPT_RELEASE_MS;
  }

  /**
   * 新utterance开始：设置语义意图
   */
  public beginUtterance(turn_id: string, generation_id: string, semanticActivity: SemanticSpeechActivity): void {
    this.currentUtterance = { turn_id, generation_id };
    this.semanticActivity = semanticActivity;
    this.playbackState = 'IDLE';
    this.mouth_activity = 0;
    this.attackStartedAt = null;
    this.releaseStartedAt = null;
    this.playbackScheduledStartMs = null;
    this.isInterruptRelease = false;
  }

  /**
   * 更新当前utterance的语义意图（不改变playback状态）
   */
  public updateSemanticActivity(turn_id: string, generation_id: string, activity: SemanticSpeechActivity): void {
    if (this.currentUtterance?.turn_id !== turn_id || this.currentUtterance?.generation_id !== generation_id) {
      // 不是当前utterance，忽略
      return;
    }
    this.semanticActivity = activity;
  }

  /**
   * 实际音频播放开始
   */
  public onPlaybackStarted(turn_id: string, generation_id: string, scheduledStartMs: number): void {
    if (!this.isCurrentUtterance(turn_id, generation_id)) {
      return;  // stale event
    }
    this.playbackState = 'PLAYING';
    this.playbackScheduledStartMs = scheduledStartMs;
    this.attackStartedAt = this.clock.now();
    this.releaseStartedAt = null;
  }

  /**
   * 实际音频播放结束（自然完成）
   */
  public onPlaybackEnded(turn_id: string, generation_id: string): void {
    if (!this.isCurrentUtterance(turn_id, generation_id)) {
      return;  // stale event
    }
    this.playbackState = 'RELEASING';
    this.releaseStartedAt = this.clock.now();
  }

  /**
   * Interruption/barge-in：立刻取消
   */
  public cancelUtterance(): void {
    if (this.currentUtterance === null) return;
    this.playbackState = 'RELEASING';
    this.releaseStartedAt = this.clock.now();
    this.isInterruptRelease = true;
    // 标记为stale，防止后续callback
    this.currentUtterance = null;
  }

  /**
   * 检查是否属于当前utterance
   */
  private isCurrentUtterance(turn_id: string, generation_id: string): boolean {
    return (
      this.currentUtterance !== null &&
      this.currentUtterance.turn_id === turn_id &&
      this.currentUtterance.generation_id === generation_id
    );
  }

  /**
   * MM4 tick中被调用，更新mouth_activity envelope
   *
   * 规则：
   * - IDLE: mouth = 0
   * - BUFFERING: mouth = 0 (不开启，除非playback真正开始)
   * - PLAYING:
   *   - attack phase: mouth从0→1，用时attackMs
   *   - sustain phase: mouth = 1
   * - RELEASING:
   *   - release phase: mouth从current→0，用时releaseMs
   *   - 如果是interrupt release，使用更快的时间
   */
  public update(): void {
    if (this.currentUtterance === null) {
      this.mouth_activity = 0;
      this.playbackState = 'IDLE';
      return;
    }

    const now = this.clock.now();

    // 状态转移检查
    if (this.playbackState === 'PLAYING' && this.attackStartedAt !== null) {
      const elapsedSinceAttack = now - this.attackStartedAt;
      if (elapsedSinceAttack < this.attackMs) {
        // Attack phase
        this.mouth_activity = elapsedSinceAttack / this.attackMs;
      } else {
        // Sustain phase
        this.mouth_activity = 1;
      }
    } else if (this.playbackState === 'RELEASING' && this.releaseStartedAt !== null) {
      const elapsedSinceRelease = now - this.releaseStartedAt;
      // Use faster release duration if this was an interrupt
      const releaseDuration = this.isInterruptRelease ? this.interruptReleaseMs : this.releaseMsValue;
      if (elapsedSinceRelease < releaseDuration) {
        // Release phase
        const startMouth = this.mouth_activity;
        this.mouth_activity = Math.max(0, startMouth * (1 - elapsedSinceRelease / releaseDuration));
      } else {
        // Release complete
        this.mouth_activity = 0;
        this.playbackState = 'IDLE';
        this.isInterruptRelease = false;
      }
    } else {
      // IDLE or BUFFERING
      this.mouth_activity = 0;
    }

    // Clamp
    this.mouth_activity = Math.max(0, Math.min(1, this.mouth_activity));
  }

  /**
   * 获取当前mouth活动状态（供renderer使用）
   */
  public getMouthActivity(): number {
    return this.mouth_activity;
  }

  /**
   * 获取完整状态快照（用于测试/telemetry）
   */
  public snapshot(): MouthActivityState {
    const posMs = this.clock.now();
    return {
      utterance: this.currentUtterance ?? { turn_id: '', generation_id: '' },
      semantic_activity: this.semanticActivity,
      playback_state: this.playbackState,
      mouth_activity: this.mouth_activity,
      playback_position_ms: posMs,
      attack_started_at_ms: this.attackStartedAt,
      release_started_at_ms: this.releaseStartedAt,
    };
  }

  /**
   * 获取当前utterance（用于stale event检查）
   */
  public getCurrentUtterance(): UtteranceIdentity | null {
    return this.currentUtterance;
  }

  /**
   * 检查是否有活动utterance
   */
  public isActive(): boolean {
    return this.currentUtterance !== null;
  }
}
