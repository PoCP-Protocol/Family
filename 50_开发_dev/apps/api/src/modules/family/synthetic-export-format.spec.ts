import { describe, expect, it } from 'vitest';
import { FAMILY_DATA_GOVERNANCE_POLICY_VERSION } from './family-data-governance.policy';
import {
  buildSyntheticWhitelistedExportPackage,
  SYNTHETIC_EXPORT_EXECUTION_BOUNDARY,
  SYNTHETIC_EXPORT_SCHEMA_VERSION,
} from './synthetic-export-format';

describe('synthetic whitelisted export format', () => {
  it('builds a deterministic, metadata-only in-memory package only after synthetic approval', () => {
    const first = buildSyntheticWhitelistedExportPackage({
      approval_status: 'APPROVED_FOR_SYNTHETIC_VALIDATION',
      policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
    });
    const second = buildSyntheticWhitelistedExportPackage({
      approval_status: 'APPROVED_FOR_SYNTHETIC_VALIDATION',
      policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
    });

    expect(first).toEqual(second);
    expect(first.manifest).toEqual({
      schema_version: SYNTHETIC_EXPORT_SCHEMA_VERSION,
      synthetic: true,
      policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
      execution_boundary: SYNTHETIC_EXPORT_EXECUTION_BOUNDARY,
    });
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
  });

  it('contains only contract-white-listed synthetic metadata and no identifiers, free text, real timestamps, or download fields', () => {
    const payload = buildSyntheticWhitelistedExportPackage({
      approval_status: 'APPROVED_FOR_SYNTHETIC_VALIDATION',
      policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
    });
    const serialized = JSON.stringify(payload);

    for (const forbidden of [
      'display_name', 'response_text', 'reason_text', 'person_id', 'family_id', 'account_id',
      'guardian', 'child', 'download_url', 'attachment', 'http://', 'https://', 'file://', '2026-',
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
    expect(serialized).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(payload.consent_lifecycle[0]).toEqual({
      purpose: 'SERVICE', status: 'GRANTED', policy_version: 'synthetic-policy-v1', granted_at_token: 'T0', withdrawn_at_token: null,
    });
  });

  it('fails closed without explicit synthetic approval or a matching policy version', () => {
    expect(() => buildSyntheticWhitelistedExportPackage({
      approval_status: 'REQUESTED', policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
    })).toThrow('synthetic_export_requires_approved_synthetic_validation');
    expect(() => buildSyntheticWhitelistedExportPackage({
      approval_status: 'APPROVED_FOR_SYNTHETIC_VALIDATION', policy_version: 'FAMILY_DATA_GOVERNANCE_V0',
    })).toThrow('synthetic_export_policy_version_mismatch');
  });
});
