/**
 * MM1-B1.1 · VisemeScheduler (§F)
 *
 * VisemeEvent(server, arrival time) → SpeechPlaybackClock → scheduled MouthShape 输出。
 *
 * 严禁按 WS 事件到达时间点渲染嘴型 —— 必须按 playback timeline。
 *
 * 输入契约:
 *   {
 *     turn_id, generation_id, mouth_shape (Family MouthShape),
 *     audio_offset_ms (相对 turn 起点)
 *   }
 *
 * 输出:
 *   通过 onApply(callback) 触发, 参数 (mouth_shape, meta), meta 含 lip_sync_offset_ms。
 *
 * 迟到策略:
 *   若 now - audio_offset_ms > LATE_VISEME_THRESHOLD_MS (默认 200ms):
 *     - viseme_late_drop_count += 1
 *     - 不 fire, 直接丢弃(不补播)
 *   否则:
 *     - 若目标已过 → 立即 fire, lip_sync_offset_ms = now - audio_offset_ms
 *     - 否则 → scheduleAt(audio_offset_ms)
 */

import type { SpeechPlaybackClock } from './speechPlaybackClock';

export type FamilyMouthShape =
  | 'REST'
  | 'OPEN_SMALL'
  | 'OPEN_MEDIUM'
  | 'OPEN_WIDE'
  | 'ROUND'
  | 'NARROW'
  | 'SMILE_SPEECH'
  | 'CLOSED';

export const LATE_VISEME_THRESHOLD_MS_DEFAULT = 200;

export interface VisemeInput {
  turn_id: string;
  generation_id: string;
  mouth_shape: FamilyMouthShape;
  audio_offset_ms: number;
}

export interface VisemeApplyMeta {
  turn_id: string;
  generation_id: string;
  audio_offset_ms: number;
  actual_playback_ms: number;
  lip_sync_offset_ms: number;
}

export interface VisemeSchedulerMetrics {
  viseme_scheduled_count: number;
  viseme_applied_count: number;
  viseme_late_drop_count: number;
  viseme_stale_drop_count: number;
  last_lip_sync_offset_ms: number;
}

export interface VisemeSchedulerOptions {
  clock: SpeechPlaybackClock;
  lateThresholdMs?: number;
  setTimeoutFn?: (fn: () => void, ms: number) => any;
  clearTimeoutFn?: (h: any) => void;
}

export class VisemeScheduler {
  private readonly clock: SpeechPlaybackClock;
  private readonly threshold: number;
  private readonly setTO: (fn: () => void, ms: number) => any;
  private readonly clearTO: (h: any) => void;
  private readonly cancels = new Set<() => void>();
  private applyHandler: ((shape: FamilyMouthShape, meta: VisemeApplyMeta) => void) | null = null;
  private readonly metrics: VisemeSchedulerMetrics = {
    viseme_scheduled_count: 0,
    viseme_applied_count: 0,
    viseme_late_drop_count: 0,
    viseme_stale_drop_count: 0,
    last_lip_sync_offset_ms: 0,
  };

  public constructor(opts: VisemeSchedulerOptions) {
    this.clock = opts.clock;
    this.threshold = opts.lateThresholdMs ?? LATE_VISEME_THRESHOLD_MS_DEFAULT;
    this.setTO = opts.setTimeoutFn ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTO = opts.clearTimeoutFn ?? ((h) => clearTimeout(h));
  }

  public onApply(handler: (shape: FamilyMouthShape, meta: VisemeApplyMeta) => void): void {
    this.applyHandler = handler;
  }

  public getMetrics(): Readonly<VisemeSchedulerMetrics> {
    return this.metrics;
  }

  public schedule(input: VisemeInput): 'SCHEDULED' | 'APPLIED_IMMEDIATE' | 'DROPPED_LATE' | 'DROPPED_STALE' {
    if (this.clock.getTurnId() !== input.turn_id || this.clock.getGenerationId() !== input.generation_id) {
      this.metrics.viseme_stale_drop_count += 1;
      return 'DROPPED_STALE';
    }
    const now = this.clock.now();
    const lag = now - input.audio_offset_ms;

    if (lag > this.threshold) {
      this.metrics.viseme_late_drop_count += 1;
      return 'DROPPED_LATE';
    }
    if (input.audio_offset_ms <= now) {
      this.fire(input, now);
      return 'APPLIED_IMMEDIATE';
    }
    this.metrics.viseme_scheduled_count += 1;
    const cancel = this.clock.scheduleAt(input.audio_offset_ms, () => {
      // 二次检查: turn 未切换
      if (this.clock.getTurnId() !== input.turn_id || this.clock.getGenerationId() !== input.generation_id) {
        this.metrics.viseme_stale_drop_count += 1;
        return;
      }
      const posNow = this.clock.now();
      const finalLag = posNow - input.audio_offset_ms;
      if (finalLag > this.threshold) {
        this.metrics.viseme_late_drop_count += 1;
        return;
      }
      this.fire(input, posNow);
    }, { setTimeoutFn: this.setTO, clearTimeoutFn: this.clearTO });
    this.cancels.add(cancel);
    return 'SCHEDULED';
  }

  public flushAll(): void {
    for (const c of this.cancels) {
      try { c(); } catch { /* ignore */ }
    }
    this.cancels.clear();
  }

  private fire(input: VisemeInput, playbackMs: number): void {
    const lag = playbackMs - input.audio_offset_ms;
    this.metrics.viseme_applied_count += 1;
    this.metrics.last_lip_sync_offset_ms = lag;
    this.applyHandler?.(input.mouth_shape, {
      turn_id: input.turn_id,
      generation_id: input.generation_id,
      audio_offset_ms: input.audio_offset_ms,
      actual_playback_ms: playbackMs,
      lip_sync_offset_ms: lag,
    });
  }
}
