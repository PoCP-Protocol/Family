import type { FamilyDataGovernancePolicyDto } from '@family/contracts';

export const FAMILY_DATA_GOVERNANCE_POLICY_VERSION = 'FAMILY_DATA_GOVERNANCE_V1' as const;

export const FAMILY_DATA_GOVERNANCE_POLICY: FamilyDataGovernancePolicyDto = {
  policy_version: FAMILY_DATA_GOVERNANCE_POLICY_VERSION,
  classifications: [
    { category: 'IDENTITY_AND_MEMBERSHIP', retention_rule: 'Retain only while family account is active and subject to future approved deletion workflow.', export_eligible: false },
    { category: 'CONSENT_AND_LIFECYCLE', retention_rule: 'Retain consent and request history for governance traceability; no automated purge.', export_eligible: true },
    { category: 'FAMILY_SERVICE_PROCESS', retention_rule: 'Retain service process records until an approved lifecycle action; no automatic execution.', export_eligible: true },
    { category: 'FAMILY_SUBJECTIVE_FEEDBACK', retention_rule: 'Retain as family-reported service feedback only; not a growth result.', export_eligible: false },
    { category: 'AUDIT_AND_GOVERNANCE', retention_rule: 'Retain audit evidence until a separately approved governance retention policy exists.', export_eligible: false },
  ],
  export_field_whitelist: [
    {
      category: 'CONSENT_AND_LIFECYCLE',
      object_name: 'consents',
      field_names: ['purpose', 'status', 'policy_version', 'granted_at', 'withdrawn_at'],
      sensitivity: 'MODERATE',
      rationale: 'Family governance history may be reviewed without identity values or free-text content.',
    },
    {
      category: 'FAMILY_SERVICE_PROCESS',
      object_name: 'service_process_summary',
      field_names: ['need_type', 'decision_type', 'service_case_status', 'follow_up_recorded_at'],
      sensitivity: 'MODERATE',
      rationale: 'Only service process metadata is eligible for a future approved synthetic export-format test.',
    },
    {
      category: 'AUDIT_AND_GOVERNANCE',
      object_name: 'lifecycle_request',
      field_names: ['request_type', 'request_scope', 'status', 'requested_at'],
      sensitivity: 'LOW',
      rationale: 'Request governance can be reviewed without reasons, actor identifiers, or payload values.',
    },
  ],
  execution_boundary: 'POLICY_AND_WHITELIST_PREVIEW_ONLY_NO_REAL_EXPORT_NO_RETENTION_EXECUTION_NO_DELETE',
};
