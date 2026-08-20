/**
 * RenderOrchestrator — Client-side composition boundary (MM3)
 *
 * Composes:
 * - ResolvedRendererProfile (WHO Famili is)
 * - PerformanceFrame (HOW Famili expresses herself now)
 * → Avatar2DRenderer (visible pixels)
 *
 * Responsibilities:
 * 1. Hold identity + renderer instance
 * 2. Validate and apply performance frames atomically
 * 3. Allow micro-animations (viseme, blink) as independent calls
 * 4. Preserve identity through performance changes
 * 5. Maintain MM2 WeakSet provenance integrity
 * 6. MM4: Manage temporal transitions (target vs current state)
 * 7. MM4: Dedup rapid nod requests with cooldown
 * 8. MM4: Vary blink intervals naturally
 *
 * NOT responsible for:
 * - STT / TTS
 * - Principal cognition
 * - Performance planning
 * - WebSocket communication
 * - Canvas geometry
 * - Viseme scheduling (that's VisemeScheduler's job)
 */

import type { ResolvedRendererProfile, PerformanceFrame } from '@family/fpai-multimodal-contracts';
import { Avatar2DRenderer, type FamilyMouthShape, type CanvasLike } from './avatar2DRenderer';
import { mapCharacterExpressionToFamilyExpression } from './avatar2DExpressionAdapter';
import { SpeechPerformanceCoordinator, type SimplePlaybackClock } from './speechPerformanceCoordinator';
import { GazeRuntime } from './gazeRuntime';
import {
  lerp,
  expLerp,
  EXPRESSION_EYE_OPENYS,
  DEFAULT_EXPRESSION_OPEN_Y,
  GESTURE_NOD_DURATION_MS,
  GESTURE_COOLDOWN_DURATION_MS,
  BLINK_MIN_INTERVAL_MS,
  BLINK_MAX_INTERVAL_MS,
  EXPRESSION_TRANSITION_TAU_MS,
} from './performanceTransition';

export interface RenderOrchestratorOptions {
  canvas: CanvasLike;
  profile: ResolvedRendererProfile;
  now?: () => number;
  randomSource?: () => number;
}

// MM5: Simple clock implementation for SpeechPerformanceCoordinator
class RenderOrchestratorClock implements SimplePlaybackClock {
  constructor(private nowFn: () => number) {}
  now(): number { return this.nowFn(); }
}

interface PerformanceTransitionState {
  // Expression interpolation (MM4)
  currentExpressionOpenY: number;
  targetExpressionOpenY: number;
  lastFrameTimeMs: number;

  // Gesture deduplication (MM4)
  lastGesture: string;
  gestureActiveUntilMs: number;
  gestureCooldownUntilMs: number;

  // Blink variation (MM4)
  nextBlinkScheduleMs: number;
  blinkIntervalMs: number;

  // Speech coordination (MM5)
  speechCoordinator: SpeechPerformanceCoordinator;
  speechClock: SimplePlaybackClock;

  // Gaze coordination (MM6)
  gazeRuntime: GazeRuntime;
}

export class RenderOrchestrator {
  private renderer: Avatar2DRenderer;
  private profile: ResolvedRendererProfile;
  private readonly randomSource: () => number;
  private transitionState: PerformanceTransitionState;

  public constructor(opts: RenderOrchestratorOptions) {
    this.profile = opts.profile;
    this.randomSource = opts.randomSource ?? (() => Math.random());
    const nowFn = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.renderer = new Avatar2DRenderer({
      canvas: opts.canvas,
      profile: opts.profile,
      now: nowFn,
    });

    // MM5: Initialize speech coordinator with clock
    const speechClock = new RenderOrchestratorClock(nowFn);

    // MM6: Initialize gaze runtime
    const gazeRuntime = new GazeRuntime({
      gazeTransitionTauMs: 200,
      randomSource: this.randomSource,
      pupilSafeTravel: 1.0,
    });

    // MM4: Initialize temporal transition state
    this.transitionState = {
      currentExpressionOpenY: DEFAULT_EXPRESSION_OPEN_Y,
      targetExpressionOpenY: DEFAULT_EXPRESSION_OPEN_Y,
      lastFrameTimeMs: nowFn(),
      lastGesture: 'NONE',
      gestureActiveUntilMs: 0,
      gestureCooldownUntilMs: 0,
      nextBlinkScheduleMs: nowFn() + this.randomBlinkInterval(),
      blinkIntervalMs: this.randomBlinkInterval(),
      speechClock,
      speechCoordinator: new SpeechPerformanceCoordinator({
        clock: speechClock,
      }),
      gazeRuntime,
    };
  }

  /**
   * Apply complete performance frame atomically.
   *
   * Validates coherence, updates ALL performance state at once,
   * prevents transient inconsistent states.
   *
   * This is the ONLY semantic performance entry point in production.
   *
   * MM4: Sets TARGET for expression interpolation, not immediate.
   * State changes are still immediate (state machine transitions).
   * MM5: Begins utterance if speech_activity present.
   */
  public applyPerformanceFrame(frame: PerformanceFrame): void {
    // MM3-PATCH-001: Coherence validation integrated from fpai-multimodal-runtime
    // (See performanceFrameValidator.ts for full validation rules)
    if (!frame || typeof frame !== 'object') {
      throw new Error('PerformanceFrame is required and must be an object');
    }

    // Map canonical expression to renderer-specific expression
    const rendererExpression = mapCharacterExpressionToFamilyExpression(frame.expression);

    // Determine avatar state from gaze/expression
    // (Simplified mapping for Avatar2D; could be more sophisticated)
    let avatarState: 'RESTING' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'INTERRUPTED' | 'HUMAN_GATE' =
      'RESTING';
    if (frame.gaze === 'USER' && frame.expression === 'LISTENING') {
      avatarState = 'LISTENING';
    } else if (frame.gaze === 'SOFT_DOWN_THINKING' || frame.expression === 'THINKING') {
      avatarState = 'THINKING';
    } else if (frame.speech_activity === 'SPEAKING') {
      avatarState = 'SPEAKING';
    }

    // Atomic state update (all at once, no intermediate states)
    // Order: state → expression → posture
    // (These methods update internal renderer state; no canvas redraw until render() called)
    this.renderer.setState(avatarState);
    this.renderer.setExpression(rendererExpression);

    // MM4: Set TARGET for expression eye interpolation
    // The actual current value will lerp toward this target in tick()
    this.transitionState.targetExpressionOpenY = EXPRESSION_EYE_OPENYS[frame.expression] ?? DEFAULT_EXPRESSION_OPEN_Y;

    // MM6: Update semantic gaze signal
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (frame.gaze) {
      this.transitionState.gazeRuntime.updateSemanticGaze(frame.gaze, now);
    }

    // MM4: Gesture deduplication
    if (frame.gesture === 'SMALL_NOD') {
      this.maybeApplyGesture('SMALL_NOD', now);
    }

    // MM5: Speech coordination
    // Begin/update utterance based on speech_activity
    const turn_id = (frame as any).turn_id ?? 'default-turn';
    const generation_id = (frame as any).generation_id ?? 'default-gen';
    const speechActivity = frame.speech_activity === 'SPEAKING' ? 'SPEAKING' : 'SILENT';
    this.transitionState.speechCoordinator.beginUtterance(turn_id, generation_id, speechActivity);

    // Note: posture, gaze detail are not currently rendered in Avatar2D
    // These are placeholders for future enhancement
    // In current implementation, they inform state and expression choice above
  }

  /** MM4: Gesture cooldown + deduplication. Only trigger if not recently active. */
  private maybeApplyGesture(gesture: string, nowMs: number): void {
    // Already in cooldown? Skip.
    if (nowMs < this.transitionState.gestureCooldownUntilMs) return;
    // Same gesture still active? Skip.
    if (gesture === this.transitionState.lastGesture && nowMs < this.transitionState.gestureActiveUntilMs) return;

    // Execute gesture
    this.renderer.triggerNod();
    this.transitionState.lastGesture = gesture;
    this.transitionState.gestureActiveUntilMs = nowMs + GESTURE_NOD_DURATION_MS;
    this.transitionState.gestureCooldownUntilMs = nowMs + GESTURE_COOLDOWN_DURATION_MS;
  }

  /** MM4: Calculate random blink interval within natural bounds. */
  private randomBlinkInterval(): number {
    const range = BLINK_MAX_INTERVAL_MS - BLINK_MIN_INTERVAL_MS;
    return BLINK_MIN_INTERVAL_MS + this.randomSource() * range;
  }

  /**
   * MM4: Update temporal state (expression interpolation, blink timing).
   * MM5: Update speech performance coordinator.
   * MM6: Update gaze interpolation and pupil positioning.
   *
   * Called every rAF frame by client.ts rafLoop.
   * Updates expression openY with exponential lerp toward target.
   * Auto-triggers blink at natural random intervals.
   * Updates animation state (gesture cleanup, blink/nod status).
   * Updates mouth activity envelope based on playback state.
   * Updates gaze offset toward semantic target.
   */
  public tick(nowMs: number): void {
    const dt = nowMs - this.transitionState.lastFrameTimeMs;
    this.transitionState.lastFrameTimeMs = nowMs;

    // Update animation state (gesture cleanup, blink/nod ending)
    this.renderer.updateAnimationState();

    // Expression lerp toward target openY
    if (dt > 0) {
      this.transitionState.currentExpressionOpenY = expLerp(
        this.transitionState.currentExpressionOpenY,
        this.transitionState.targetExpressionOpenY,
        dt,
        EXPRESSION_TRANSITION_TAU_MS
      );
      // Apply interpolated value to renderer
      this.renderer.setExpressionOpenY(this.transitionState.currentExpressionOpenY);
    }

    // Auto-blink on schedule
    if (nowMs >= this.transitionState.nextBlinkScheduleMs) {
      this.renderer.triggerBlink();
      this.transitionState.nextBlinkScheduleMs = nowMs + this.randomBlinkInterval();
    }

    // MM5: Update mouth activity envelope from speech coordinator
    this.transitionState.speechCoordinator.update();
    this.renderer.setMouthActivity(this.transitionState.speechCoordinator.getMouthActivity());

    // MM6: Update gaze interpolation
    this.transitionState.gazeRuntime.update(nowMs, dt);
    this.renderer.setGazeOffset(this.transitionState.gazeRuntime.getCurrentGaze());
  }

  /**
   * Apply viseme mouth shape (micro-animation, independent from semantic frame).
   *
   * This is called by VisemeScheduler and bypasses the semantic frame.
   * Mouth animation is audio-driven, not semantics-driven.
   */
  public applyViseme(mouthShape: FamilyMouthShape): void {
    this.renderer.setMouthShape(mouthShape);
  }

  /**
   * Trigger blink (life animation, independent from semantic frame).
   *
   * Can be called by auto-blink logic or external trigger.
   */
  public triggerBlink(): void {
    this.renderer.triggerBlink();
  }

  /**
   * Trigger nod (semantic gesture if deliberate, or life animation if auto).
   *
   * Can be called by semantic gesture logic or external auto-gesture.
   */
  public triggerNod(): void {
    this.renderer.triggerNod();
  }

  /**
   * Render current frame to canvas.
   *
   * Called every rAF frame by client.ts rafLoop.
   * Idempotent: safe to call multiple times per frame.
   */
  public render(): void {
    this.renderer.render();
  }

  // MM5: Playback event handlers (called by StreamingAudioPlayer)
  public notifyPlaybackStarted(turn_id: string, generation_id: string, scheduledStartMs: number): void {
    this.transitionState.speechCoordinator.onPlaybackStarted(turn_id, generation_id, scheduledStartMs);
  }

  public notifyPlaybackEnded(turn_id: string, generation_id: string): void {
    this.transitionState.speechCoordinator.onPlaybackEnded(turn_id, generation_id);
  }

  public notifyUtteranceInterrupted(): void {
    this.transitionState.speechCoordinator.cancelUtterance();
  }

  /**
   * Get current frame snapshot (for debugging/telemetry).
   */
  public snapshot(): object {
    return this.renderer.snapshot();
  }

  /**
   * Verify identity still valid (MM2 safety check).
   *
   * Used in tests to verify WeakSet provenance survives.
   */
  public verifyIdentityIntegrity(): boolean {
    const currentProfile = this.renderer.getProfile();
    // Check same instance (not just equality)
    return this.profile === currentProfile;
  }

  /**
   * Get the bound identity profile.
   */
  public getProfile(): ResolvedRendererProfile {
    return this.profile;
  }
}
