import { ForbiddenException } from '@nestjs/common';
import type { StructuredSafetySignal } from '@family/contracts';
import { assessStructuredSafetySignals } from './safety-assessment.policy';

export const REFLECTION_SAFETY_POLICY_VERSION = 'M2_105_REFLECTION_DETERMINISTIC_V1';

export interface ReflectionSafetyDisposition {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  disposition: 'NORMAL' | 'HUMAN_REVIEW' | 'SAFETY_ESCALATION';
  policy_version: typeof REFLECTION_SAFETY_POLICY_VERSION;
  signals: StructuredSafetySignal[];
}

const SIGNAL_PATTERNS: ReadonlyArray<{ signal: StructuredSafetySignal; pattern: RegExp }> = [
  { signal: 'SELF_HARM', pattern: /自杀|自伤|伤害自己|不想活|结束生命|轻生|suicid|self[- ]?harm|kill myself/i },
  { signal: 'HARM_TO_OTHERS', pattern: /杀了他|杀了她|伤害别人|伤害他人|打死|kill (him|her|them)|harm (him|her|them)/i },
  { signal: 'ABUSE', pattern: /虐待|性侵|猥亵|侵害孩子|abuse|sexual assault|molest/i },
  { signal: 'VIOLENCE', pattern: /家暴|暴力殴打|拿刀|持刀|violent attack|domestic violence/i },
  { signal: 'SEVERE_CRISIS', pattern: /活不下去|彻底失控|立即报警|紧急危险|immediate danger|severe crisis/i },
];

export function assessReflectionSafety(reflection: string): ReflectionSafetyDisposition {
  const signals = SIGNAL_PATTERNS
    .filter(({ pattern }) => pattern.test(reflection))
    .map(({ signal }) => signal);
  const disposition = assessStructuredSafetySignals(signals.length > 0 ? signals : ['NONE']);
  return { ...disposition, policy_version: REFLECTION_SAFETY_POLICY_VERSION };
}

export function assertReflectionSafetyRoute(reflection: string): void {
  const disposition = assessReflectionSafety(reflection);
  if (disposition.disposition !== 'NORMAL') {
    throw new ForbiddenException('reflection_requires_safety_support');
  }
}
