export const FAMILY_LLM_USE_CASES = [
  'family.dev.explain_need',
  'family.dev.explain_report',
  'family.dev.explain_task',
  'family.dev.explain_mock_commerce',
  'family.dev.explain_mock_service',
  'family.dev.explain_mock_community',
  'family.dev.text_equivalent',
  'family.dev.safety_stop',
] as const;

export type FamilyLlmUseCase = (typeof FAMILY_LLM_USE_CASES)[number];

export const FAMILY_LLM_ALLOWED_STATE_UPPER_BOUNDS = [
  'NONE',
  'NEED',
  'INTENT',
  'READ_ONLY_ADMITTED_CANDIDATES',
  'DECISION',
  'NO_ACTION',
] as const;

export type FamilyLlmStateUpperBound = (typeof FAMILY_LLM_ALLOWED_STATE_UPPER_BOUNDS)[number];

export const FAMILY_LLM_TOOL_NAMES = [
  'read_fixture_state',
  'propose_return_or_pause',
  'propose_no_action',
  'propose_select_option',
  'propose_task_toggle',
  'propose_mock_invite_or_group',
  'propose_mock_booking_or_event',
  'propose_fixed_post_receipt',
] as const;

export type FamilyLlmToolName = (typeof FAMILY_LLM_TOOL_NAMES)[number];

export interface FamilyLlmCandidateSnapshot {
  alias: string;
  title: string;
  admission_version: string;
}

/**
 * Minimal, fixture-only model input. This intentionally has no family name,
 * contact data, child material, free-form conversation, provider credential,
 * external URL, price, or business-state write instruction.
 */
export interface FamilyLlmSnapshot {
  environment: 'DEV' | 'TEST';
  fixture_id: string;
  fixture_version: string;
  journey_id: string;
  page_id: string;
  use_case: FamilyLlmUseCase;
  policy_version: string;
  schema_version: string;
  allowed_state_upper_bound: FamilyLlmStateUpperBound;
  need_choice?: string;
  intent_choice?: string;
  mock_state?: string;
  admitted_candidates: readonly FamilyLlmCandidateSnapshot[];
  supported_actions: readonly ('RETURN' | 'PAUSE' | 'NO_ACTION' | 'SELECT_OPTION' | 'TOGGLE_TASK' | 'CREATE_INVITE' | 'CREATE_GROUP' | 'CREATE_BOOKING' | 'CREATE_EVENT' | 'PUBLISH_TEMPLATE' | 'CREATE_RENEWAL_INTEREST' | 'ENTER_EXPERT_LIVE')[];
}

export interface FamilyLlmToolProposal {
  name: FamilyLlmToolName;
  /** Only fixture aliases, fixed enums, or booleans are accepted by the registry. */
  arguments: Record<string, string | boolean>;
}

export interface FamilyLlmDraft {
  kind: 'EXPLANATION_DRAFT' | 'TEXT_EQUIVALENT_DRAFT' | 'SAFETY_STOP_DRAFT' | 'HUMAN_GATE_REQUIRED_DRAFT';
  title: string;
  body: string;
  text_equivalent: string;
  referenced_candidates: string[];
  allowed_state_upper_bound: FamilyLlmStateUpperBound;
  tool_proposals: FamilyLlmToolProposal[];
}

export const FAMILY_LLM_DRAFT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    kind: {
      type: 'string',
      enum: ['EXPLANATION_DRAFT', 'TEXT_EQUIVALENT_DRAFT', 'SAFETY_STOP_DRAFT', 'HUMAN_GATE_REQUIRED_DRAFT'],
    },
    title: { type: 'string', minLength: 1, maxLength: 120 },
    body: { type: 'string', minLength: 1, maxLength: 1200 },
    text_equivalent: { type: 'string', minLength: 1, maxLength: 1600 },
    referenced_candidates: {
      type: 'array',
      items: { type: 'string', minLength: 1, maxLength: 120 },
      maxItems: 3,
    },
    allowed_state_upper_bound: { type: 'string', enum: FAMILY_LLM_ALLOWED_STATE_UPPER_BOUNDS },
    tool_proposals: {
      type: 'array',
      maxItems: 1,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', enum: FAMILY_LLM_TOOL_NAMES },
          arguments: {
            type: 'object',
            additionalProperties: { type: ['string', 'boolean'] },
          },
        },
        required: ['name', 'arguments'],
        additionalProperties: false,
      },
    },
  },
  required: ['kind', 'title', 'body', 'text_equivalent', 'referenced_candidates', 'allowed_state_upper_bound', 'tool_proposals'],
  additionalProperties: false,
} as const;

export interface FamilyLlmGatewayAuditRecord {
  audit_id: string;
  trace_id: string;
  use_case: FamilyLlmUseCase;
  fixture_id: string;
  fixture_version: string;
  page_id: string;
  model: string | null;
  policy_version: string;
  schema_version: string;
  gateway_decision: 'ALLOW_DRAFT' | 'BLOCK_INPUT' | 'BLOCK_OUTPUT' | 'BLOCK_CONFIGURATION' | 'PROVIDER_FAILURE';
  input_block_reason: string | null;
  output_block_reason: string | null;
  allowed_state_upper_bound: FamilyLlmStateUpperBound;
  tool_names: FamilyLlmToolName[];
  created_at: string;
}

export interface FamilyLlmGatewayResult {
  decision: FamilyLlmGatewayAuditRecord['gateway_decision'];
  draft: FamilyLlmDraft | null;
  stop_code: string | null;
  text_equivalent: string;
  audit: FamilyLlmGatewayAuditRecord;
}
