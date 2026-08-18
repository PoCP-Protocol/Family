/**
 * PerformanceFrameValidator (MM3)
 *
 * Validates PerformanceFrame coherence.
 *
 * Ensures semantic consistency: expression + gesture + posture + speech_activity
 * form a logically coherent performance state, not impossible combinations.
 *
 * Part of FPAI-MM3 Runtime.
 */

import type { PerformanceFrame } from '@family/fpai-multimodal-contracts';

export interface FrameValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates that a PerformanceFrame is structurally complete and semantically coherent.
 */
export function validatePerformanceFrame(frame: unknown): FrameValidationResult {
  // Type guard
  if (!frame || typeof frame !== 'object') {
    return { valid: false, reason: 'PerformanceFrame is not an object' };
  }

  const f = frame as Record<string, unknown>;

  // Required fields present
  const required: (keyof PerformanceFrame)[] = ['expression', 'gesture', 'gaze', 'posture', 'speech_activity'];
  for (const field of required) {
    if (!(field in f)) {
      return { valid: false, reason: `Missing required field: ${field}` };
    }
  }

  const expr = f.expression as string;
  const gesture = f.gesture as string;
  const gaze = f.gaze as string;
  const posture = f.posture as string;
  const speechActivity = f.speech_activity as string;

  // Validate field types
  const validExpressions = [
    'NEUTRAL_WARM',
    'LISTENING',
    'THINKING',
    'SOFT_ENCOURAGING',
    'WARM_FIRM',
    'CALM_SERIOUS',
    'CONCERNED_CALM',
    'BOUNDARY_CLEAR',
  ];
  if (!validExpressions.includes(expr)) {
    return { valid: false, reason: `Invalid expression: ${expr}` };
  }

  const validGestures = [
    'NONE',
    'SMALL_NOD',
    'DOUBLE_SMALL_NOD',
    'SLIGHT_LEAN_IN',
    'THINKING_PAUSE',
    'SOFT_SMILE',
    'CALM_SERIOUS',
    'WARM_FIRM_GAZE',
    'LISTENING_GAZE',
    'GENTLE_HEAD_TILT',
    'RETURN_TO_NEUTRAL',
  ];
  if (!validGestures.includes(gesture)) {
    return { valid: false, reason: `Invalid gesture: ${gesture}` };
  }

  const validGazes = ['USER', 'SOFT_DOWN_THINKING', 'RETURN_USER', 'AWAY', 'STABLE'];
  if (!validGazes.includes(gaze)) {
    return { valid: false, reason: `Invalid gaze: ${gaze}` };
  }

  const validPostures = ['RELAXED', 'STEADY', 'FORWARD'];
  if (!validPostures.includes(posture)) {
    return { valid: false, reason: `Invalid posture: ${posture}` };
  }

  const validSpeechActivities = ['SILENT', 'SPEAKING'];
  if (!validSpeechActivities.includes(speechActivity)) {
    return { valid: false, reason: `Invalid speech_activity: ${speechActivity}` };
  }

  // Semantic coherence rules (minimal set, based on actual Famili semantics)

  // Rule 1: LISTENING should not actively SPEAK
  if (expr === 'LISTENING' && speechActivity === 'SPEAKING') {
    // Allow speaking while listening (e.g., clarifying questions)
    // This is actually valid for responsive listening
  }

  // Rule 2: THINKING can SPEAK (thinking out loud)
  if (expr === 'THINKING' && speechActivity === 'SPEAKING') {
    // Valid: thinking aloud
  }

  // Rule 3: BOUNDARY_CLEAR requires serious posture (STEADY or FORWARD)
  if (expr === 'BOUNDARY_CLEAR' && posture === 'RELAXED') {
    return {
      valid: false,
      reason: 'BOUNDARY_CLEAR requires STEADY or FORWARD posture, not RELAXED',
    };
  }

  // Rule 4: SOFT_ENCOURAGING should pair with appropriate gesture
  if (expr === 'SOFT_ENCOURAGING') {
    const appropriateGestures = [
      'NONE',
      'SMALL_NOD',
      'SOFT_SMILE',
      'GENTLE_HEAD_TILT',
      'RETURN_TO_NEUTRAL',
    ];
    if (!appropriateGestures.includes(gesture)) {
      return {
        valid: false,
        reason: `SOFT_ENCOURAGING gesture ${gesture} may be semantically mismatched`,
      };
    }
  }

  // Rule 5: CONCERNED_CALM should pair with serious gaze or down gaze
  if (expr === 'CONCERNED_CALM' && gaze === 'AWAY') {
    return {
      valid: false,
      reason: 'CONCERNED_CALM should look at user or down in thought, not AWAY',
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Assert helper: throws if frame is incoherent.
 *
 * Used in production path before passing frame to renderer.
 */
export function assertPerformanceFrameCoherent(frame: unknown): asserts frame is PerformanceFrame {
  const result = validatePerformanceFrame(frame);
  if (!result.valid) {
    throw new Error(`PerformanceFrame coherence violation: ${result.reason}`);
  }
}
