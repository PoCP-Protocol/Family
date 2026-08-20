import type { FamilyLlmSnapshot, FamilyLlmStateUpperBound, FamilyLlmUseCase } from './family-llm.contract';

export interface FamilyLlmPagePolicy {
  page_id: string;
  use_case: FamilyLlmUseCase;
  allowed_state_upper_bound: FamilyLlmStateUpperBound;
  supported_actions: FamilyLlmSnapshot['supported_actions'];
}

const DEFAULT_ACTIONS: FamilyLlmSnapshot['supported_actions'] = ['RETURN', 'PAUSE', 'NO_ACTION'];

const PAGE_POLICIES: readonly FamilyLlmPagePolicy[] = [
  { page_id: 'UI-01', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'DECISION', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'ENTER_EXPERT_LIVE'] },
  { page_id: 'UI-02', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-03', use_case: 'family.dev.explain_need', allowed_state_upper_bound: 'NEED', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'SELECT_OPTION'] },
  { page_id: 'UI-04', use_case: 'family.dev.explain_report', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-05', use_case: 'family.dev.explain_report', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-06', use_case: 'family.dev.explain_task', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-07', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-08', use_case: 'family.dev.explain_need', allowed_state_upper_bound: 'NEED', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'SELECT_OPTION'] },
  { page_id: 'UI-09', use_case: 'family.dev.explain_task', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'TOGGLE_TASK'] },
  { page_id: 'UI-10', use_case: 'family.dev.explain_task', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-11', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'NONE', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-12', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'NONE', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-13', use_case: 'family.dev.explain_mock_commerce', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-14', use_case: 'family.dev.explain_mock_commerce', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-15', use_case: 'family.dev.explain_mock_commerce', allowed_state_upper_bound: 'DECISION', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'CREATE_INVITE'] },
  { page_id: 'UI-16', use_case: 'family.dev.explain_mock_commerce', allowed_state_upper_bound: 'DECISION', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'CREATE_GROUP'] },
  { page_id: 'UI-17', use_case: 'family.dev.explain_mock_commerce', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-18', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-19', use_case: 'family.dev.explain_mock_service', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-20', use_case: 'family.dev.explain_mock_service', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-21', use_case: 'family.dev.explain_mock_service', allowed_state_upper_bound: 'DECISION', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'CREATE_BOOKING'] },
  { page_id: 'UI-22', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-23', use_case: 'family.dev.explain_mock_service', allowed_state_upper_bound: 'DECISION', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'CREATE_EVENT'] },
  { page_id: 'UI-24', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-25', use_case: 'family.dev.explain_mock_community', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-26', use_case: 'family.dev.explain_mock_community', allowed_state_upper_bound: 'DECISION', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'PUBLISH_TEMPLATE'] },
  { page_id: 'UI-27', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'NONE', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-28', use_case: 'family.dev.explain_mock_community', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-29', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-30', use_case: 'family.dev.explain_mock_service', allowed_state_upper_bound: 'DECISION', supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION', 'CREATE_RENEWAL_INTEREST'] },
  { page_id: 'UI-31', use_case: 'family.dev.explain_mock_service', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-32', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-33', use_case: 'family.dev.explain_mock_service', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
  { page_id: 'UI-34', use_case: 'family.dev.text_equivalent', allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', supported_actions: DEFAULT_ACTIONS },
] as const;

export function getFamilyLlmPagePolicy(pageId: string): FamilyLlmPagePolicy | null {
  return PAGE_POLICIES.find((policy) => policy.page_id === pageId) ?? null;
}

export function listFamilyLlmPagePolicies(): readonly FamilyLlmPagePolicy[] {
  return PAGE_POLICIES;
}
