/**
 * MM4 Animation Helpers
 *
 * Temporal math for smooth transitions between semantic performance states
 */

export function lerp(from: number, to: number, rate: number): number {
  return from + (to - from) * rate;
}

export function expLerp(from: number, to: number, dt: number, tau: number): number {
  const rate = 1 - Math.exp(-dt / tau);
  return lerp(from, to, rate);
}

// Expression eye openness mapping (CharacterExpression → semantic eye openY)
// MM3 defines expressions; MM4 adds temporal interpolation for smooth transitions
// MUST match EXPRESSION_EYE in avatar2DRenderer.ts
export const EXPRESSION_EYE_OPENYS: Record<string, number> = {
  'LISTENING': 0.55,
  'THINKING': 0.48,
  'CALM_WARM': 0.55,        // ✓ fixed: was 0.60, matches EXPRESSION_EYE
  'CALM_SERIOUS': 0.35,     // ✓ fixed: was 0.52, matches EXPRESSION_EYE
  'GENTLE_ENCOURAGING': 0.60,
  'CALM_CAUTIOUS': 0.42,
  'WARM_FIRM': 0.48,
};

export const DEFAULT_EXPRESSION_OPEN_Y = 0.55; // LISTENING default

// Gesture lifecycle durations (milliseconds)
export const GESTURE_NOD_DURATION_MS = 400;
export const GESTURE_COOLDOWN_DURATION_MS = 800; // 2× duration

// Blink bounds
export const BLINK_MIN_INTERVAL_MS = 2000;
export const BLINK_MAX_INTERVAL_MS = 5000;
export const BLINK_DURATION_MS = 120;

// Transition timing constant (tau for exponential lerp)
export const EXPRESSION_TRANSITION_TAU_MS = 150; // ~150ms for smooth transition
