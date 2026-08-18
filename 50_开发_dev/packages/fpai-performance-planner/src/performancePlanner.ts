/**
 * Performance Planner (MM3)
 *
 * Maps PerformanceIntent + risk context to PerformanceFrame.
 *
 * Input: PerformanceIntent (what Famili intends to communicate)
 * Output: PrincipalPerformancePlan (speech + avatar frame + visual)
 *
 * Does NOT:
 * - Mutate Principal output
 * - Regenerate semantic content
 * - Invent new expressions/gestures
 * - Make principal decisions
 */

import type { PerformanceIntent, PrincipalPerformancePlan, PrincipalSceneMode } from '@family/fpai-multimodal-contracts';
import type { PrincipalRiskRoute } from '@family/principal-ai';

export type PrincipalSafetyRoute = PrincipalRiskRoute;

export class PrincipalPerformancePlanner {
  /**
   * Plan performance frame from semantic intent.
   *
   * @param intent PerformanceIntent (what Famili wants to express)
   * @param riskRoute Context (NORMAL/REVIEW/HIGH_RISK)
   * @returns PrincipalPerformancePlan with speech, avatar frame, visual
   */
  public plan(
    intent: PerformanceIntent,
    riskRoute: PrincipalSafetyRoute = 'NORMAL',
  ): PrincipalPerformancePlan {
    // Map intent + risk to speech tone and avatar expression
    // Using canonical CharacterExpression values (not FamilyExpression)

    if (riskRoute === 'HIGH_RISK' || intent === 'RESPOND_SERIOUSLY') {
      return {
        speech: {
          pace: 'SLOW',
          tone: 'CALM_SERIOUS',
          pauses_ms: [400, 600],
          emphasis: ['这很重要'],
        },
        avatar: {
          expression: 'CALM_SERIOUS',  // Canonical value
          gesture: 'LISTENING_GAZE',
          gaze: 'USER',
          posture: 'STEADY',
          speech_activity: 'SPEAKING',
        },
        visual: {
          subtitle_mode: 'SERIOUS',
          action_card: '我们需要认真对待这个。',
        },
      };
    }

    if (riskRoute === 'REVIEW' || intent === 'RESPOND_SERIOUSLY') {
      return {
        speech: {
          pace: 'MEDIUM',
          tone: 'CALM_CAUTIOUS',
          pauses_ms: [300],
          emphasis: ['让我们慢下来想一想'],
        },
        avatar: {
          expression: 'THINKING',  // Canonical value (was LISTENING)
          gesture: 'SMALL_NOD',
          gaze: 'USER',
          posture: 'STEADY',
          speech_activity: 'SPEAKING',
        },
        visual: {
          subtitle_mode: 'NORMAL',
          action_card: '让我听听更多。',
        },
      };
    }

    if (intent === 'SET_BOUNDARY') {
      return {
        speech: {
          pace: 'MEDIUM',
          tone: 'CALM_SERIOUS',
          pauses_ms: [400],
          emphasis: ['这一点很重要'],
        },
        avatar: {
          expression: 'BOUNDARY_CLEAR',  // Canonical value
          gesture: 'WARM_FIRM_GAZE',
          gaze: 'USER',
          posture: 'STEADY',
          speech_activity: 'SPEAKING',
        },
        visual: {
          subtitle_mode: 'SERIOUS',
          action_card: '这是我们一起需要设置的界限。',
        },
      };
    }

    if (intent === 'PROVIDE_GUIDANCE') {
      return {
        speech: {
          pace: 'MEDIUM',
          tone: 'CALM_WARM',
          pauses_ms: [300, 250],
          emphasis: ['我想建议一个小步骤'],
        },
        avatar: {
          expression: 'SOFT_ENCOURAGING',  // Canonical value
          gesture: 'SMALL_OPEN_HAND',
          gaze: 'USER',
          posture: 'RELAXED',
          speech_activity: 'SPEAKING',
        },
        visual: {
          subtitle_mode: 'NORMAL',
          action_card: '让我们从一个小的改变开始。',
        },
      };
    }

    // Default: ATTEND (listen, receive)
    return {
      speech: {
        pace: 'MEDIUM',
        tone: 'CALM_WARM',
        pauses_ms: [250, 350],
        emphasis: ['我在听'],
      },
      avatar: {
        expression: 'LISTENING',  // Canonical value (NOT ATTENTIVE)
        gesture: 'SMALL_OPEN_HAND',
        gaze: 'USER',
        posture: 'RELAXED',
        speech_activity: 'SPEAKING',
      },
      visual: {
        subtitle_mode: 'NORMAL',
        action_card: '告诉我更多关于这个。',
      },
    };
  }

}
