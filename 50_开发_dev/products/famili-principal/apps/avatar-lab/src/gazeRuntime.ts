/**
 * MM6 Gaze Runtime
 *
 * Manages semantic gaze signals → temporal interpolation → renderer-safe offsets
 *
 * Authority:
 *   - Semantic: PerformanceFrame.gaze (semantic layer)
 *   - Temporal: expLerp (MM4 reused math)
 *   - Visual: normalized offset bounds for pupil geometry (this layer)
 *
 * Constraint: Does NOT modify PerformanceFrame. Renderer-local only.
 */

import { expLerp } from './performanceTransition';
import type { CharacterGazeSignal } from '@family/fpai-multimodal-contracts';

/**
 * Normalized gaze offset for renderer
 * Range: [-1, 1] maps to safe pupil travel within eye bounds
 */
export interface GazeOffset {
  x: number;
  y: number;
}

/**
 * Semantic gaze → renderer target mapping
 * Exhaustive; must cover all PerformanceFrame.gaze values
 */
function mapSemanticGazeToTarget(semantic: CharacterGazeSignal): GazeOffset {
  switch (semantic) {
    case 'USER':
      // Direct user-facing social gaze
      // Target: nearly centered, very slight variation allowed by micro-gaze only
      return { x: 0.0, y: 0.0 };

    case 'SOFT_DOWN_THINKING':
      // Reflective gaze break
      // Target: slightly down (thinking posture), minimal horizontal offset
      return { x: 0.0, y: 0.4 }; // Down 40% of safe travel

    default:
      const _exhaustive: never = semantic;
      throw new Error(`Unknown semantic gaze: ${_exhaustive}`);
  }
}

/**
 * Micro gaze variation: tiny, bounded, deterministic
 * Only applies when semantic target is stable (USER) for extended duration
 * Prevents infinite staring feel without semantic change
 */
function computeMicroGazeVariation(
  elapsedAtTargetMs: number,
  randomSource: () => number,
  pupilSafeTravel: number
): GazeOffset {
  // MM6: Only apply micro-gaze if stable at USER target for > 2 seconds
  const MICRO_GAZE_WARMUP_MS = 2000;
  if (elapsedAtTargetMs < MICRO_GAZE_WARMUP_MS) {
    return { x: 0, y: 0 };
  }

  // Bounded variation: ±10% of safe travel
  const MAX_MICRO_OFFSET_RATIO = 0.10;
  const maxOffset = pupilSafeTravel * MAX_MICRO_OFFSET_RATIO;

  // Deterministic but natural-looking oscillation using random source
  const phase = elapsedAtTargetMs / 1000; // seconds as phase
  const rand = randomSource();

  // Decompose random into x/y components
  const angle = rand * Math.PI * 2;
  const distance = (randomSource() - 0.5) * maxOffset;

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

/**
 * Runtime state for gaze interpolation
 */
export class GazeRuntime {
  private currentGaze: GazeOffset = { x: 0, y: 0 };
  private targetGaze: GazeOffset = { x: 0, y: 0 };
  private targetSemanticGaze: CharacterGazeSignal = 'USER';
  private lastSemanticChangeMs: number = 0;
  private readonly gazeTransitionTauMs: number;
  private readonly randomSource: () => number;
  private readonly pupilSafeTravel: number; // pixels or normalized units

  constructor(opts: {
    gazeTransitionTauMs?: number;
    randomSource?: () => number;
    pupilSafeTravel?: number;
  } = {}) {
    this.gazeTransitionTauMs = opts.gazeTransitionTauMs ?? 200; // ~200ms for gaze saccade
    this.randomSource = opts.randomSource ?? (() => Math.random());
    this.pupilSafeTravel = opts.pupilSafeTravel ?? 1.0; // normalized unit
  }

  /**
   * Update with new semantic gaze signal
   * Called when PerformanceFrame.gaze changes
   */
  public updateSemanticGaze(semantic: CharacterGazeSignal, nowMs: number): void {
    if (semantic !== this.targetSemanticGaze) {
      this.targetSemanticGaze = semantic;
      this.targetGaze = mapSemanticGazeToTarget(semantic);
      this.lastSemanticChangeMs = nowMs;
    }
  }

  /**
   * Temporal update: interpolate current gaze toward target
   * Called every rAF frame
   */
  public update(nowMs: number, dtMs: number): void {
    // Smooth interpolation
    this.currentGaze.x = expLerp(
      this.currentGaze.x,
      this.targetGaze.x,
      dtMs,
      this.gazeTransitionTauMs
    );
    this.currentGaze.y = expLerp(
      this.currentGaze.y,
      this.targetGaze.y,
      dtMs,
      this.gazeTransitionTauMs
    );

    // Add micro-gaze variation only if target is stable
    const elapsedAtTargetMs = nowMs - this.lastSemanticChangeMs;
    const microVariation = computeMicroGazeVariation(
      elapsedAtTargetMs,
      this.randomSource,
      this.pupilSafeTravel
    );

    // Clamp to safe bounds
    const maxTravel = this.pupilSafeTravel;
    this.currentGaze.x = Math.max(-maxTravel, Math.min(maxTravel, this.currentGaze.x + microVariation.x));
    this.currentGaze.y = Math.max(-maxTravel, Math.min(maxTravel, this.currentGaze.y + microVariation.y));
  }

  /**
   * Get current rendered gaze offset
   * Returned offset is safe to apply to pupil geometry
   */
  public getCurrentGaze(): Readonly<GazeOffset> {
    return Object.freeze({ ...this.currentGaze });
  }

  /**
   * Get semantic gaze target (for testing / debugging)
   */
  public getTargetSemanticGaze(): CharacterGazeSignal {
    return this.targetSemanticGaze;
  }

  /**
   * Get temporal target (for snapshot observability)
   */
  public getTargetGaze(): Readonly<GazeOffset> {
    return Object.freeze({ ...this.targetGaze });
  }
}
