import type { SafetyDispositionDto, StructuredSafetySignal } from '@family/contracts';

const POLICY_VERSION = 'M2_102_DETERMINISTIC_V1' as const;
const ESCALATION_SIGNALS = new Set<StructuredSafetySignal>([
  'SELF_HARM',
  'HARM_TO_OTHERS',
  'ABUSE',
  'VIOLENCE',
  'SEVERE_CRISIS',
]);

export function assessStructuredSafetySignals(signals: StructuredSafetySignal[]): SafetyDispositionDto {
  const normalized = normalizeSafetySignals(signals);

  if (normalized.includes('SEVERE_CRISIS') || normalized.includes('SELF_HARM') || normalized.includes('HARM_TO_OTHERS')) {
    return {
      severity: 'CRITICAL',
      disposition: 'SAFETY_ESCALATION',
      policy_version: POLICY_VERSION,
      signals: normalized,
    };
  }

  if (normalized.some((signal) => ESCALATION_SIGNALS.has(signal))) {
    return {
      severity: 'HIGH',
      disposition: 'SAFETY_ESCALATION',
      policy_version: POLICY_VERSION,
      signals: normalized,
    };
  }

  return {
    severity: 'LOW',
    disposition: 'NORMAL',
    policy_version: POLICY_VERSION,
    signals: normalized,
  };
}

function normalizeSafetySignals(signals: StructuredSafetySignal[]): StructuredSafetySignal[] {
  const withoutNone = signals.filter((signal) => signal !== 'NONE');
  const unique = Array.from(new Set(withoutNone.length > 0 ? withoutNone : ['NONE' as const]));
  return unique.sort();
}