/**
 * PerformanceIntent — Semantic performance expression
 *
 * Answers: "What does Famili intend to communicate through embodiment?"
 *
 * Renderer-neutral semantic layer between Principal cognition and frame rendering.
 *
 * Does NOT contain:
 * - eye geometry
 * - mouth configuration
 * - canvas colors
 * - pixel position
 * - animation frame numbers
 * - identity information
 *
 * Part of FPAI-MM3: Multimodal Performance Runtime.
 */

export type PerformanceIntent =
  | 'ATTEND'              // Actively listen, receive, understand
  | 'RESPOND_WARM'        // Respond with warmth and encouragement
  | 'RESPOND_SERIOUSLY'   // Respond to serious/concerning situation
  | 'SET_BOUNDARY'        // Establish or maintain clear boundary
  | 'PROVIDE_GUIDANCE';   // Offer direction or micro-action

export interface PerformanceIntentContext {
  intent: PerformanceIntent;
  // Optional semantic context for future extensions
  intensity?: number; // 0.0 to 1.0
  urgency?: 'low' | 'medium' | 'high';
}

/**
 * Derive PerformanceIntent from Principal semantic output.
 *
 * This function examines Principal AI's semantic signals and produces
 * a renderer-neutral performance intent.
 *
 * NOT a full Principal output parser; only extracts intent-relevant signals.
 */
export function derivePerformanceIntent(output: {
  risk_route?: 'NORMAL' | 'REVIEW' | 'HIGH_RISK';
  boundary?: string;
  one_small_action?: string;
}): PerformanceIntent {
  const hasBoundary = (output.boundary ?? '').trim().length > 0;
  const hasGuidance = (output.one_small_action ?? '').trim().length > 0;

  // Serious risk routes → respond seriously
  if (output.risk_route === 'REVIEW' || output.risk_route === 'HIGH_RISK') {
    return 'RESPOND_SERIOUSLY';
  }

  // Explicit boundary → set boundary
  if (hasBoundary) {
    return 'SET_BOUNDARY';
  }

  // Action guidance → provide guidance
  if (hasGuidance) {
    return 'PROVIDE_GUIDANCE';
  }

  // Default: attend/listen
  return 'ATTEND';
}
