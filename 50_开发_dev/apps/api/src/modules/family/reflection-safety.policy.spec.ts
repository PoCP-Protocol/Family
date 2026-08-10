import { describe, expect, it } from 'vitest';
import { assessReflectionSafety, assertReflectionSafetyRoute, REFLECTION_SAFETY_POLICY_VERSION } from './reflection-safety.policy';

describe('reflection safety policy', () => {
  it('keeps ordinary action reflection on the normal route', () => {
    expect(assessReflectionSafety('今天我先听完孩子说话，再复述了自己的理解。')).toMatchObject({
      severity: 'LOW',
      disposition: 'NORMAL',
      policy_version: REFLECTION_SAFETY_POLICY_VERSION,
    });
  });

  it('blocks self-harm language from normal action completion', () => {
    expect(assessReflectionSafety('我不想活了，想伤害自己。')).toMatchObject({
      severity: 'CRITICAL',
      disposition: 'SAFETY_ESCALATION',
    });
    expect(() => assertReflectionSafetyRoute('我不想活了，想伤害自己。')).toThrow('reflection_requires_safety_support');
  });
});
