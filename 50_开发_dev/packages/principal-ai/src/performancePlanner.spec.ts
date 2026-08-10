import { describe, expect, it } from 'vitest';
import { PrincipalPerformancePlanner } from './performancePlanner';
import type { PrincipalAiOutput } from '@family/fpai-multimodal-contracts';

describe('PrincipalPerformancePlanner', () => {
  it('routes normal coaching to calm warm performance', () => {
    const planner = new PrincipalPerformancePlanner();
    const output: PrincipalAiOutput = {
      turn_id: 'turn-1',
      response_text: '今晚先别解决手机。',
      risk_route: 'NORMAL',
      scenario_id: 'interactive_chat',
      method_refs: ['method://coaching/one-small-step'],
      safety_status: 'SAFE',
      soul_version: 'soul-v1',
      model_provider: 'fake',
    };

    const plan = planner.plan(output, 'INTERACTIVE_CHAT', 'NORMAL');
    expect(plan.speech.tone).toBe('CALM_WARM');
    expect(plan.avatar.expression).toBe('ATTENTIVE');
  });

  it('routes high risk to calm serious human gate posture', () => {
    const planner = new PrincipalPerformancePlanner();
    const output: PrincipalAiOutput = {
      turn_id: 'turn-2',
      response_text: '我建议先联系专业支持。',
      risk_route: 'HIGH_RISK',
      scenario_id: 'interactive_chat',
      method_refs: [],
      safety_status: 'HIGH_RISK',
      soul_version: 'soul-v1',
      model_provider: 'fake',
    };

    const plan = planner.plan(output, 'INTERACTIVE_CHAT', 'HIGH_RISK');
    expect(plan.speech.tone).toBe('CALM_SERIOUS');
    expect(plan.avatar.expression).toBe('CALM_SERIOUS');
  });
});
