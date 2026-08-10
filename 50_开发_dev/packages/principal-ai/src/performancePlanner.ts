import type { PrincipalAiOutput, PrincipalPerformancePlan, PrincipalSceneMode, PrincipalSafetyRoute } from '@family/fpai-multimodal-contracts';

export class PrincipalPerformancePlanner {
  public plan(output: PrincipalAiOutput, sceneMode: PrincipalSceneMode, riskRoute: PrincipalSafetyRoute): PrincipalPerformancePlan {
    if (riskRoute === 'HIGH_RISK') {
      return {
        speech: {
          pace: 'SLOW',
          tone: 'CALM_SERIOUS',
          pauses_ms: [400, 600],
          emphasis: ['先联系专业支持'],
        },
        avatar: {
          expression: 'CALM_SERIOUS',
          gaze: 'USER',
          gesture: 'SMALL_OPEN_HAND',
          posture: 'STEADY',
        },
        visual: {
          subtitle_mode: 'SERIOUS',
          action_card: output.response_text,
        },
      };
    }

    if (riskRoute === 'REVIEW') {
      return {
        speech: {
          pace: 'MEDIUM',
          tone: 'CALM_CAUTIOUS',
          pauses_ms: [300],
          emphasis: ['先慢一点'],
        },
        avatar: {
          expression: 'ATTENTIVE',
          gaze: 'USER',
          gesture: 'SMALL_NOD',
          posture: 'STEADY',
        },
        visual: {
          subtitle_mode: 'NORMAL',
          action_card: output.response_text,
        },
      };
    }

    return {
      speech: {
        pace: 'MEDIUM',
        tone: 'CALM_WARM',
        pauses_ms: [250, 350],
        emphasis: ['今晚先别解决手机'],
      },
      avatar: {
        expression: 'ATTENTIVE',
        gaze: 'USER',
        gesture: 'SMALL_OPEN_HAND',
        posture: 'RELAXED',
      },
      visual: {
        subtitle_mode: 'NORMAL',
        action_card: output.response_text,
      },
    };
  }
}
