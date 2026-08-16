import { FAMILY_DATA_GOVERNANCE_POLICY_VERSION } from './family-data-governance.policy';

export type SyntheticExportGateReason =
  | 'SYNTHETIC_FIXTURE_REQUIRED'
  | 'POLICY_OR_SCOPE_MISMATCH'
  | 'EXPORT_CONSENT_NOT_ACTIVE'
  | 'THIRD_PARTY_OR_CHILD_RISK_REVIEW_REQUIRED'
  | 'TRUSTED_FAMILY_CONTEXT_REQUIRED'
  | 'DELIVERY_GRANT_INVALID'
  | 'AUDIT_EVIDENCE_INCOMPLETE';

export interface SyntheticExportSecurityExerciseInput {
  synthetic: boolean;
  schema_version: 'FAMILY_SYNTHETIC_EXPORT_V1' | string;
  approval_status: 'APPROVED_FOR_SYNTHETIC_VALIDATION' | string;
  policy_version: string;
  whitelist_digest_matches: boolean;
  export_consent_active: boolean;
  includes_third_party_or_child_sensitive_data: boolean;
  trusted_family_context_active: boolean;
  delivery_grant_unused: boolean;
  delivery_grant_unexpired: boolean;
  recipient_verified: boolean;
  audit_evidence_complete: boolean;
}

export type SyntheticExportSecurityExerciseResult =
  | { status: 'PASS'; exercise_boundary: 'SYNTHETIC_GATE_ASSERTION_ONLY_NO_EXPORT_NO_IO' }
  | { status: 'BLOCKED'; reason_code: SyntheticExportGateReason; exercise_boundary: 'SYNTHETIC_GATE_ASSERTION_ONLY_NO_EXPORT_NO_IO' };

const BOUNDARY = 'SYNTHETIC_GATE_ASSERTION_ONLY_NO_EXPORT_NO_IO' as const;

export function evaluateSyntheticExportSecurityGates(input: SyntheticExportSecurityExerciseInput): SyntheticExportSecurityExerciseResult {
  if (!input.synthetic || input.schema_version !== 'FAMILY_SYNTHETIC_EXPORT_V1') return blocked('SYNTHETIC_FIXTURE_REQUIRED');
  if (input.approval_status !== 'APPROVED_FOR_SYNTHETIC_VALIDATION' || input.policy_version !== FAMILY_DATA_GOVERNANCE_POLICY_VERSION || !input.whitelist_digest_matches) return blocked('POLICY_OR_SCOPE_MISMATCH');
  if (!input.export_consent_active) return blocked('EXPORT_CONSENT_NOT_ACTIVE');
  if (input.includes_third_party_or_child_sensitive_data) return blocked('THIRD_PARTY_OR_CHILD_RISK_REVIEW_REQUIRED');
  if (!input.trusted_family_context_active) return blocked('TRUSTED_FAMILY_CONTEXT_REQUIRED');
  if (!input.delivery_grant_unused || !input.delivery_grant_unexpired || !input.recipient_verified) return blocked('DELIVERY_GRANT_INVALID');
  if (!input.audit_evidence_complete) return blocked('AUDIT_EVIDENCE_INCOMPLETE');
  return { status: 'PASS', exercise_boundary: BOUNDARY };
}

function blocked(reason_code: SyntheticExportGateReason): SyntheticExportSecurityExerciseResult {
  return { status: 'BLOCKED', reason_code, exercise_boundary: BOUNDARY };
}
