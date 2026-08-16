import { describe, expect, it } from 'vitest';
import { FAMILY_DATA_GOVERNANCE_POLICY_VERSION } from './family-data-governance.policy';
import { evaluateSyntheticExportSecurityGates, type SyntheticExportSecurityExerciseInput } from './synthetic-export-security-exercise';

const valid: SyntheticExportSecurityExerciseInput = {
  synthetic: true,
  schema_version: 'FAMILY_SYNTHETIC_EXPORT_V1',
  approval_status: 'APPROVED_FOR_SYNTHETIC_VALIDATION',
  policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
  whitelist_digest_matches: true,
  export_consent_active: true,
  includes_third_party_or_child_sensitive_data: false,
  trusted_family_context_active: true,
  delivery_grant_unused: true,
  delivery_grant_unexpired: true,
  recipient_verified: true,
  audit_evidence_complete: true,
};

describe('synthetic export security exercise', () => {
  it('passes only a complete fixed synthetic descriptor and never returns package content', () => {
    expect(evaluateSyntheticExportSecurityGates(valid)).toEqual({
      status: 'PASS', exercise_boundary: 'SYNTHETIC_GATE_ASSERTION_ONLY_NO_EXPORT_NO_IO',
    });
  });

  it.each([
    ['scope drift', { whitelist_digest_matches: false }, 'POLICY_OR_SCOPE_MISMATCH'],
    ['withdrawn consent', { export_consent_active: false }, 'EXPORT_CONSENT_NOT_ACTIVE'],
    ['third-party or child-sensitive inclusion', { includes_third_party_or_child_sensitive_data: true }, 'THIRD_PARTY_OR_CHILD_RISK_REVIEW_REQUIRED'],
    ['replayed grant', { delivery_grant_unused: false }, 'DELIVERY_GRANT_INVALID'],
    ['expired grant', { delivery_grant_unexpired: false }, 'DELIVERY_GRANT_INVALID'],
    ['unknown recipient', { recipient_verified: false }, 'DELIVERY_GRANT_INVALID'],
    ['revoked identity', { trusted_family_context_active: false }, 'TRUSTED_FAMILY_CONTEXT_REQUIRED'],
    ['audit evidence gap', { audit_evidence_complete: false }, 'AUDIT_EVIDENCE_INCOMPLETE'],
    ['non-synthetic input', { synthetic: false }, 'SYNTHETIC_FIXTURE_REQUIRED'],
  ] as const)('fails closed for %s', (_name, patch, reasonCode) => {
    const result = evaluateSyntheticExportSecurityGates({ ...valid, ...patch });
    expect(result).toEqual({
      status: 'BLOCKED', reason_code: reasonCode, exercise_boundary: 'SYNTHETIC_GATE_ASSERTION_ONLY_NO_EXPORT_NO_IO',
    });
  });
});
