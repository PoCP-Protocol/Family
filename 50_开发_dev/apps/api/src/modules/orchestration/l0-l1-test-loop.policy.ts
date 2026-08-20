/**
 * ARCH-GO-TEST-FULL-FUNCTION-001
 * 环境状态: DEV_IMPLEMENTING / PROD_HOLD
 *
 * L0/L1 test-loop 只处理合成 fixture 的流程体验；禁止排序、最佳推荐、效果断言、
 * 诊断、评分、标签、真实执行或外部调用。
 */
import type { SyntheticAdmittedCandidate } from './test-fixtures/synthetic-admitted-candidates';

export type TestLoopStateUpperBound = 'NONE' | 'NEED' | 'INTENT' | 'READ_ONLY_ADMITTED_CANDIDATES' | 'DECISION' | 'NO_ACTION';
export type TestLoopStopReason =
  | 'TEST_LOOP_NOT_ENABLED'
  | 'TRUSTED_CONTEXT_UNAVAILABLE'
  | 'SERVICE_CONSENT_REQUIRED'
  | 'SYNTHETIC_SUBJECT_UNAVAILABLE'
  | 'FIXTURE_VERSION_MISMATCH'
  | 'CANDIDATE_NOT_ADMITTED'
  | 'MOCK_EXECUTOR_UNAVAILABLE'
  | 'RISK_ROUTE_NOT_CLEAR'
  | 'L2_L3_OR_PROFESSIONAL_REQUEST'
  | 'CHILD_DIRECT_INPUT_NOT_ALLOWED'
  | 'THIRD_PARTY_OR_OUTBOUND_NOT_ALLOWED'
  | 'TEXT_EQUIVALENT_UNAVAILABLE';

export interface TestLoopSafeStop {
  safe_stop: true;
  reason: TestLoopStopReason;
  template_id: string;
  message: string;
  allowed_state_upper_bound: 'NONE' | 'NO_ACTION';
  human_gate_required: boolean;
}

export const TEST_LOOP_FORBIDDEN_COPY = [
  '最佳', '最适合', '系统建议', '必须做', '错过机会', '完成率', '保证效果', '效果保证', '已证实有效', '改善率', '提供诊断', '作出诊断', '风险等级',
  '成长分', '排名', '画像', '会员', '付费', '积分', '推荐第一',
] as const;

export function safeStop(reason: TestLoopStopReason): TestLoopSafeStop {
  switch (reason) {
    case 'SERVICE_CONSENT_REQUIRED':
      return { safe_stop: true, reason, template_id: 'REF-CONSENT-REVOKED', message: '当前服务同意不可用，因此不会继续使用相关服务信息。你可以退出，或在适当条件具备后再次确认。', allowed_state_upper_bound: 'NONE', human_gate_required: false };
    case 'L2_L3_OR_PROFESSIONAL_REQUEST':
      return { safe_stop: true, reason, template_id: 'REF-PROFESSIONAL-BOUNDARY', message: '当前流程只用于内部演示支持需要与服务偏好确认，不提供专业工具、诊断或结果解释。你可以返回或退出。', allowed_state_upper_bound: 'NONE', human_gate_required: true };
    case 'CHILD_DIRECT_INPUT_NOT_ALLOWED':
      return { safe_stop: true, reason, template_id: 'REF-CHILD-DIRECT-INPUT', message: '当前内部演示不会收集或处理儿童直接回答。你可以返回或退出。', allowed_state_upper_bound: 'NONE', human_gate_required: true };
    case 'THIRD_PARTY_OR_OUTBOUND_NOT_ALLOWED':
      return { safe_stop: true, reason, template_id: 'REF-THIRD-PARTY-OUTBOUND', message: '当前内部演示不会向第三方发送信息、安排真人服务或共享家庭内容。你可以返回或退出。', allowed_state_upper_bound: 'NONE', human_gate_required: true };
    case 'TRUSTED_CONTEXT_UNAVAILABLE':
      return { safe_stop: true, reason, template_id: 'REF-CONTEXT-UNAVAILABLE', message: '当前无法确认可用的家庭服务上下文，因此不会继续。你可以退出后稍后再试。', allowed_state_upper_bound: 'NONE', human_gate_required: false };
    case 'SYNTHETIC_SUBJECT_UNAVAILABLE':
      return { safe_stop: true, reason, template_id: 'REF-SYNTHETIC-SUBJECT-UNAVAILABLE', message: '当前内部测试家庭没有可用的合成演示对象，因此不会继续。你可以退出后使用已准备的内部测试数据再试。', allowed_state_upper_bound: 'NONE', human_gate_required: false };
    case 'CANDIDATE_NOT_ADMITTED':
    case 'FIXTURE_VERSION_MISMATCH':
    case 'MOCK_EXECUTOR_UNAVAILABLE':
    case 'RISK_ROUTE_NOT_CLEAR':
      return { safe_stop: true, reason, template_id: 'REF-L1-NOT-AVAILABLE', message: '这个选择当前还不能继续。你可以返回查看其他已准入选择，或现在先不继续。', allowed_state_upper_bound: 'NO_ACTION', human_gate_required: reason === 'RISK_ROUTE_NOT_CLEAR' };
    case 'TEXT_EQUIVALENT_UNAVAILABLE':
      return { safe_stop: true, reason, template_id: 'REF-TEXT-PATH-INCOMPLETE', message: '当前无法提供完整的文字说明，因此不会继续。你可以返回或退出。', allowed_state_upper_bound: 'NONE', human_gate_required: false };
    case 'TEST_LOOP_NOT_ENABLED':
    default:
      return { safe_stop: true, reason, template_id: 'REF-TEST-LOOP-NOT-ENABLED', message: '当前内部演示未启用，因此不会继续。你可以退出后在授权的开发环境中再试。', allowed_state_upper_bound: 'NONE', human_gate_required: false };
  }
}

export interface TestLoopCandidateView {
  offer_ref: string;
  title: string;
  content_type: SyntheticAdmittedCandidate['content_type'];
  source_label: 'TEST_ONLY_SYNTHETIC_FIXTURE';
  admission_state: 'SYNTHETIC_ADMITTED_FOR_DEV';
  admission_version: string;
  boundary_summary: string;
  comparison_fields: SyntheticAdmittedCandidate['comparison_fields'];
  allowed_actions: readonly ['VIEW_DETAILS', 'RETURN', 'PAUSE', 'NO_ACTION', 'SELECT'];
  text_equivalent: string;
}

/** 映射不暴露 rank 或 recommended 字段；数组顺序仅供稳定渲染，绝不表示优先级。 */
export function toEqualCandidateView(candidate: SyntheticAdmittedCandidate): TestLoopCandidateView {
  const textEquivalent = [
    candidate.title,
    `来源：${candidate.source_label}。`,
    `当前状态：${candidate.admission_state}。`,
    candidate.boundary_summary,
    `它是什么：${candidate.comparison_fields.what_it_is}`,
    `它不是什么：${candidate.comparison_fields.what_it_is_not}`,
    '你可以查看说明、返回、暂停、现在先不行动，或由家庭明确选择。平台不对候选排序，也不替家庭决定。',
  ].join(' ');
  assertNoForbiddenCopy(textEquivalent);
  return {
    offer_ref: candidate.offer_ref,
    title: candidate.title,
    content_type: candidate.content_type,
    source_label: candidate.source_label,
    admission_state: candidate.admission_state,
    admission_version: candidate.admission_version,
    boundary_summary: candidate.boundary_summary,
    comparison_fields: candidate.comparison_fields,
    allowed_actions: candidate.allowed_actions,
    text_equivalent: textEquivalent,
  };
}

export function assertNoForbiddenCopy(copy: string): void {
  const normalized = copy.replace(/\s+/g, '');
  const match = TEST_LOOP_FORBIDDEN_COPY.find((phrase) => normalized.includes(phrase));
  if (match) throw new Error(`test_loop_forbidden_copy:${match}`);
}

export function noActionTextEquivalent(): string {
  return '你们选择了现在先不行动。此选择不会创建计划、服务过程、任务或提醒，也不表示家庭没有需要。你可以返回或退出。';
}

export function decisionTextEquivalent(): string {
  return '已记录本次内部演示选择。它只是一条 Decision 记录；未启动真实服务、计划、案例、任务、预约、外发或模型调用。你可以返回或退出。';
}
