/**
 * ARCH-GO-TEST-FULL-FUNCTION-001
 * 环境状态: DEV_IMPLEMENTING / PROD_HOLD
 *
 * DTO 仅服务于 DEV 合成闭环。family/actor/subject 必须由可信服务端上下文派生，
 * 因此不出现在 body 中；不接受自由文本、Plan/Case、外部链接或模型参数。
 */
import type { SyntheticIntentChoice, SyntheticNeedChoice } from './test-fixtures/synthetic-admitted-candidates';
import type { TestLoopCandidateView, TestLoopSafeStop, TestLoopStateUpperBound } from './l0-l1-test-loop.policy';

export interface StartSyntheticNeedDto {
  need_choice?: SyntheticNeedChoice;
  skip?: boolean;
}

export interface ConfirmSyntheticIntentDto {
  /** startSyntheticNeed 返回的服务端 Need signal 引用；不接受自由文本或客户端 subject。 */
  need_ref?: string;
  intent_choice?: SyntheticIntentChoice;
  no_action?: boolean;
}

export interface RecordSyntheticDecisionDto {
  intent_id: string;
  fixture_version: string;
  candidate_ref?: string;
  decision_type: 'SELECT' | 'DISMISS';
}

export interface TestLoopCapabilityDto {
  enabled: boolean;
  mode: 'DEV_SYNTHETIC_ONLY';
  policy_version: string;
  environment_status: 'DEV_IMPLEMENTING' | 'DEV_READY_FOR_TEST' | 'TEST_VALIDATED' | 'PROD_HOLD';
}

export interface TestLoopNeedResultDto {
  need_ref: string | null;
  next_state: 'INTENT' | 'NO_ACTION';
  allowed_state_upper_bound: 'NEED' | 'NO_ACTION';
  text_equivalent: string;
}

export interface TestLoopIntentResultDto {
  intent_id: string | null;
  next_state: 'CANDIDATES' | 'NO_ACTION';
  allowed_state_upper_bound: 'INTENT' | 'NO_ACTION';
  text_equivalent: string;
}

export interface TestLoopCandidatesDto {
  intent_id: string;
  fixture_version: string;
  candidates: TestLoopCandidateView[];
  safe_stop: TestLoopSafeStop | null;
  allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES' | 'NONE' | 'NO_ACTION';
  text_equivalent: string;
}

export interface TestLoopDecisionResultDto {
  decision_id: string;
  outcome: 'DECISION_RECORDED' | 'NO_ACTION';
  allowed_state_upper_bound: Extract<TestLoopStateUpperBound, 'DECISION' | 'NO_ACTION'>;
  action_started: false;
  plan_id: null;
  case_id: null;
  mock_executor: {
    executor: 'MOCK_EXECUTOR_ONLY';
    status: 'MOCK_EXECUTOR_ACKNOWLEDGED';
    delivery_started: false;
    plan_id: null;
    case_id: null;
    statement: string;
  } | null;
  text_equivalent: string;
}

export interface TestLoopAuditEntryDto {
  correlation_id: string;
  policy_version: string;
  fixture_version: string;
  input_category: 'CAPABILITY' | 'NEED' | 'INTENT' | 'CANDIDATES' | 'DECISION' | 'STUB';
  decision_type: 'SELECT' | 'DISMISS' | null;
  allowed_state_upper_bound: TestLoopStateUpperBound;
  safe_stop_reason: string | null;
  template_id: string | null;
  action_started: false;
}
