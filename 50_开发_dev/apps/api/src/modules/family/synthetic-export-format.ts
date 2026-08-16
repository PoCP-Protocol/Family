import { ForbiddenException } from '@nestjs/common';
import { FAMILY_DATA_GOVERNANCE_POLICY_VERSION } from './family-data-governance.policy';

export const SYNTHETIC_EXPORT_SCHEMA_VERSION = 'FAMILY_SYNTHETIC_EXPORT_V1' as const;
export const SYNTHETIC_EXPORT_EXECUTION_BOUNDARY = 'SYNTHETIC_IN_MEMORY_SCHEMA_VALIDATION_ONLY_NO_DATABASE_NO_FILE_NO_DOWNLOAD_NO_NETWORK_NO_REAL_FAMILY_DATA' as const;

export interface SyntheticExportValidationInput {
  approval_status: 'APPROVED_FOR_SYNTHETIC_VALIDATION' | string;
  policy_version: string;
}

export interface SyntheticWhitelistedExportPackage {
  manifest: {
    schema_version: typeof SYNTHETIC_EXPORT_SCHEMA_VERSION;
    synthetic: true;
    policy_version: typeof FAMILY_DATA_GOVERNANCE_POLICY_VERSION;
    execution_boundary: typeof SYNTHETIC_EXPORT_EXECUTION_BOUNDARY;
  };
  consent_lifecycle: Array<{ purpose: string; status: string; policy_version: string; granted_at_token: 'T0'; withdrawn_at_token: null }>;
  service_process: Array<{ need_type: string; decision_type: string; service_case_status: string; follow_up_recorded_at_token: 'T1' }>;
  lifecycle_request: Array<{ request_type: string; request_scope: 'FAMILY_PRIVATE_DATA'; status: string; requested_at_token: 'T2' }>;
  governance: {
    classification_categories: string[];
    whitelist_object_names: string[];
    validation_marker: 'SYNTHETIC_FIXED_FIXTURE';
  };
}

export function buildSyntheticWhitelistedExportPackage(input: SyntheticExportValidationInput): SyntheticWhitelistedExportPackage {
  if (input.approval_status !== 'APPROVED_FOR_SYNTHETIC_VALIDATION') {
    throw new ForbiddenException('synthetic_export_requires_approved_synthetic_validation');
  }
  if (input.policy_version !== FAMILY_DATA_GOVERNANCE_POLICY_VERSION) {
    throw new ForbiddenException('synthetic_export_policy_version_mismatch');
  }

  return {
    manifest: {
      schema_version: SYNTHETIC_EXPORT_SCHEMA_VERSION,
      synthetic: true,
      policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
      execution_boundary: SYNTHETIC_EXPORT_EXECUTION_BOUNDARY,
    },
    consent_lifecycle: [{
      purpose: 'SERVICE',
      status: 'GRANTED',
      policy_version: 'synthetic-policy-v1',
      granted_at_token: 'T0',
      withdrawn_at_token: null,
    }],
    service_process: [{
      need_type: 'FAMILY_ROUTINE_SUPPORT',
      decision_type: 'FAMILY_CONFIRMED',
      service_case_status: 'OPEN',
      follow_up_recorded_at_token: 'T1',
    }],
    lifecycle_request: [{
      request_type: 'EXPORT_REQUEST',
      request_scope: 'FAMILY_PRIVATE_DATA',
      status: 'APPROVED_FOR_SYNTHETIC_VALIDATION',
      requested_at_token: 'T2',
    }],
    governance: {
      classification_categories: [
        'IDENTITY_AND_MEMBERSHIP',
        'CONSENT_AND_LIFECYCLE',
        'FAMILY_SERVICE_PROCESS',
        'FAMILY_SUBJECTIVE_FEEDBACK',
        'AUDIT_AND_GOVERNANCE',
      ],
      whitelist_object_names: ['consents', 'service_process_summary', 'lifecycle_request'],
      validation_marker: 'SYNTHETIC_FIXED_FIXTURE',
    },
  };
}
