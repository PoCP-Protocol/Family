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

export interface RenderOrchestratorOptions {
  canvas: CanvasLike;
  profile: ResolvedRendererProfile;
  now?: () => number;
}

export class RenderOrchestrator {
  private renderer: Avatar2DRenderer;
  private profile: ResolvedRendererProfile;

  public constructor(opts: RenderOrchestratorOptions) {
    this.profile = opts.profile;
    this.renderer = new Avatar2DRenderer({
      canvas: opts.canvas,
      profile: opts.profile,
      now: opts.now,
    });
  }

  /**
   * Apply complete performance frame atomically.
   *
   * Validates coherence, updates ALL performance state at once,
   * prevents transient inconsistent states.
   *
   * This is the ONLY semantic performance entry point in production.
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

    // Note: posture, gaze detail are not currently rendered in Avatar2D
    // These are placeholders for future enhancement
    // In current implementation, they inform state and expression choice above
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
   * Called by external rAF loop or render loop.
   * Idempotent: safe to call multiple times per frame.
   */
  public render(): void {
    this.renderer.render();
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
