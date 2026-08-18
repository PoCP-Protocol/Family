import { describe, expect, it } from 'vitest';
import { PrincipalPerformancePlanner } from './performancePlanner';
import type { PerformanceIntent } from '@family/fpai-multimodal-contracts';

describe('PrincipalPerformancePlanner (MM3: PerformanceIntent → PerformanceFrame)', () => {
  it('MM3-P01: ATTEND intent → LISTENING expression (canonical, not ATTENTIVE)', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan('ATTEND', 'NORMAL');
    expect(plan.speech.tone).toBe('CALM_WARM');
    expect(plan.avatar.expression).toBe('LISTENING');  // Canonical CharacterExpression
    expect(plan.avatar.gesture).toBe('SMALL_OPEN_HAND');
    expect(plan.visual?.subtitle_mode).toBe('NORMAL');
  });

  it('MM3-P02: RESPOND_SERIOUSLY intent always → CALM_SERIOUS (regardless of risk context)', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan('RESPOND_SERIOUSLY', 'NORMAL');
    expect(plan.speech.tone).toBe('CALM_SERIOUS');
    expect(plan.avatar.expression).toBe('CALM_SERIOUS');  // Canonical CharacterExpression
    expect(plan.avatar.gesture).toBe('LISTENING_GAZE');
    expect(plan.avatar.posture).toBe('STEADY');
    expect(plan.visual?.subtitle_mode).toBe('SERIOUS');
  });

  it('MM3-P03: SET_BOUNDARY intent → BOUNDARY_CLEAR expression', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan('SET_BOUNDARY', 'NORMAL');
    expect(plan.speech.tone).toBe('CALM_SERIOUS');
    expect(plan.avatar.expression).toBe('BOUNDARY_CLEAR');  // Canonical CharacterExpression
    expect(plan.avatar.posture).toBe('STEADY');
    expect(plan.visual?.subtitle_mode).toBe('SERIOUS');
  });

  it('MM3-P04: PROVIDE_GUIDANCE intent → SOFT_ENCOURAGING expression', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan('PROVIDE_GUIDANCE', 'NORMAL');
    expect(plan.speech.tone).toBe('CALM_WARM');
    expect(plan.avatar.expression).toBe('SOFT_ENCOURAGING');  // Canonical CharacterExpression
    expect(plan.avatar.gesture).toBe('SMALL_OPEN_HAND');
    expect(plan.visual?.subtitle_mode).toBe('NORMAL');
  });

  it('MM3-P05: HIGH_RISK route → CALM_SERIOUS tone + CALM_SERIOUS expression', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan('RESPOND_SERIOUSLY', 'HIGH_RISK');
    expect(plan.speech.tone).toBe('CALM_SERIOUS');
    expect(plan.avatar.expression).toBe('CALM_SERIOUS');  // Canonical CharacterExpression
    expect(plan.avatar.posture).toBe('STEADY');
    expect(plan.visual?.subtitle_mode).toBe('SERIOUS');
  });

  it('MM3-P06: PerformanceFrame contains speech_activity', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan('ATTEND', 'NORMAL');
    expect(plan.avatar.speech_activity).toBe('SPEAKING');  // Semantic speech state
    expect(plan.avatar.speech_activity).toBeDefined();
  });

  it('MM3-P07: All expressions are canonical CharacterExpression values', () => {
    const planner = new PrincipalPerformancePlanner();
    const intents: PerformanceIntent[] = ['ATTEND', 'RESPOND_WARM', 'RESPOND_SERIOUSLY', 'SET_BOUNDARY', 'PROVIDE_GUIDANCE'];
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

    for (const intent of intents) {
      const plan = planner.plan(intent, 'NORMAL');
      expect(validExpressions).toContain(plan.avatar.expression);
    }
  });
});
