// Performance Planner 只决定 tone / pace / pause / expression / gesture / gaze / posture / subtitle。
// 输入必须来自权威 Principal AI 的领域 PrincipalAiOutput（@family/principal-ai）。
// 不得改变 risk_route、method_refs、source_refs、say_it_tonight、one_small_action、look_for、boundary。
import type { PrincipalAiOutput, PrincipalRiskRoute } from '@family/principal-ai';
import type { PrincipalPerformancePlan, PrincipalSceneMode } from '@family/fpai-multimodal-contracts';

export type PrincipalSafetyRoute = PrincipalRiskRoute;

export class PrincipalPerformancePlanner {
  public plan(
    output: PrincipalAiOutput,
    sceneMode: PrincipalSceneMode,
    riskRoute: PrincipalSafetyRoute,
  ): PrincipalPerformancePlan {
    void sceneMode; // 保留供 MICRO_LESSON / FAMILY_DIALOGUE 后续差异化

    if (riskRoute === 'HIGH_RISK') {
      return {
        speech: {
          pace: 'SLOW',
          tone: 'CALM_SERIOUS',
          pauses_ms: [400, 600],
          emphasis: this.pickHighRiskEmphasis(output),
        },
        avatar: {
          expression: 'CALM_SERIOUS',
          gaze: 'USER',
          gesture: 'SMALL_OPEN_HAND',
          posture: 'STEADY',
        },
        visual: {
          subtitle_mode: 'SERIOUS',
          action_card: this.summarizeForSubtitle(output),
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
          expression: 'LISTENING',
          gaze: 'USER',
          gesture: 'SMALL_NOD',
          posture: 'STEADY',
        },
        visual: {
          subtitle_mode: 'NORMAL',
          action_card: this.summarizeForSubtitle(output),
        },
      };
    }

    return {
      speech: {
        pace: 'MEDIUM',
        tone: 'CALM_WARM',
        pauses_ms: [250, 350],
        emphasis: this.pickNormalEmphasis(output),
      },
      avatar: {
        expression: 'LISTENING',
        gaze: 'USER',
        gesture: 'SMALL_OPEN_HAND',
        posture: 'RELAXED',
      },
      visual: {
        subtitle_mode: 'NORMAL',
        action_card: this.summarizeForSubtitle(output),
      },
    };
  }

  private pickHighRiskEmphasis(output: PrincipalAiOutput): string[] {
    const boundary = (output.boundary ?? '').trim();
    return boundary ? [boundary] : ['先联系专业支持'];
  }

  private pickNormalEmphasis(output: PrincipalAiOutput): string[] {
    const oneSmall = (output.one_small_action ?? '').trim();
    if (oneSmall) return [oneSmall];
    const sayTonight = (output.say_it_tonight ?? '').trim();
    return sayTonight ? [sayTonight] : ['今晚先别急'];
  }

  private summarizeForSubtitle(output: PrincipalAiOutput): string {
    // 字幕直接使用权威文本，不生成新建议。
    return (output.say_it_tonight?.trim())
      || (output.what_i_hear?.trim())
      || (output.opening?.trim())
      || '';
  }
}
