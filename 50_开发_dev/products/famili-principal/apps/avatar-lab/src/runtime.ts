import type { PrincipalAiOutput, PrincipalSafetyRoute, PrincipalSceneMode } from '@family/fpai-multimodal-contracts';

export function classifyRiskRoute(text: string): PrincipalSafetyRoute {
  const normalized = text.toLowerCase();
  if (normalized.includes('伤害') || normalized.includes('自杀') || normalized.includes('威胁')) {
    return 'HIGH_RISK';
  }
  if (normalized.includes('家暴') || normalized.includes('离婚') || normalized.includes('暴力')) {
    return 'REVIEW';
  }
  return 'NORMAL';
}

export function shouldDropEvent(currentTurnId: string, eventTurnId: string | undefined, currentSeq: number, eventSeq: number): boolean {
  if (!eventTurnId) {
    return false;
  }
  return currentTurnId !== eventTurnId || currentSeq !== eventSeq;
}

export function buildPrincipalOutput(turnId: string, inputText: string, riskRoute: PrincipalSafetyRoute, sessionId: string): PrincipalAiOutput {
  const responseText = riskRoute === 'HIGH_RISK'
    ? '我先把这个情况先转给专业支持和家长一起处理。'
    : '今晚先别解决手机。我们可以先从一个小步骤开始。';

  return {
    turn_id: turnId,
    request_id: `${turnId}-request`,
    session_id: sessionId,
    entry_point: 'ASK_FAMILI_PRINCIPAL',
    response_text: responseText,
    risk_route: riskRoute,
    scenario_id: 'INTERACTIVE_CHAT',
    method_refs: ['method://coaching/one-small-step'],
    source_refs: ['source://avatar-lab/fake-runtime'],
    safety_status: riskRoute === 'HIGH_RISK' ? 'HIGH_RISK' : riskRoute === 'REVIEW' ? 'REVIEW' : 'SAFE',
    soul_version: 'soul-v1',
    model_provider: 'fake-runtime',
    schema_validation: 'PASS',
    family_context_read_allowed: false,
    consent_context: {
      consented: true,
      purpose: 'LAB',
      subjectType: 'HOUSEHOLD',
    },
  };
}

export function buildSceneMode(text: string): PrincipalSceneMode {
  return text.includes('课程') || text.includes('教学') ? 'MICRO_LESSON' : 'INTERACTIVE_CHAT';
}
