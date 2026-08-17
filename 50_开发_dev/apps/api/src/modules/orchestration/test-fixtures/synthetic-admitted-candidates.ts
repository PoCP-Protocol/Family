/**
 * ARCH-GO-TEST-FULL-FUNCTION-001
 * 环境状态: DEV_IMPLEMENTING / PROD_HOLD
 *
 * 本文件中的每一个对象都只是 TEST_ONLY_SYNTHETIC_FIXTURE。
 * 它们不对应真实资源、真实执行责任、教育效果或外部服务，且不得进入生产配置。
 */

export const SYNTHETIC_FIXTURE_VERSION = 'synthetic-l0-l1-fixtures.v1';
export const SYNTHETIC_NEED_CHOICES = {
  CALM_CONVERSATION: {
    key: 'CALM_CONVERSATION',
    text: '想先找一个更平和地重新开始沟通的方式',
  },
  DAILY_RHYTHM: {
    key: 'DAILY_RHYTHM',
    text: '想先理清最近的日常节奏',
  },
  LEARNING_ARRANGEMENT: {
    key: 'LEARNING_ARRANGEMENT',
    text: '想先看看学习安排方面的支持方式',
  },
} as const;

export type SyntheticNeedChoice = keyof typeof SYNTHETIC_NEED_CHOICES;

export const SYNTHETIC_INTENT_CHOICES = {
  READ_AND_DISCUSS: {
    key: 'READ_AND_DISCUSS',
    text: '先查看可以一起阅读和讨论的支持方式',
  },
  TRY_A_SMALL_STEP: {
    key: 'TRY_A_SMALL_STEP',
    text: '先查看一个可以由家庭自行决定是否尝试的小步骤',
  },
} as const;

export type SyntheticIntentChoice = keyof typeof SYNTHETIC_INTENT_CHOICES;

export interface SyntheticAdmittedCandidate {
  offer_ref: string;
  title: string;
  content_type: 'TEST_ONLY_GUIDED_READING' | 'TEST_ONLY_FAMILY_PRACTICE';
  source_label: 'TEST_ONLY_SYNTHETIC_FIXTURE';
  admission_state: 'SYNTHETIC_ADMITTED_FOR_DEV';
  admission_version: string;
  boundary_summary: string;
  comparison_fields: {
    what_it_is: string;
    what_it_is_not: string;
    executor: 'MOCK_EXECUTOR_ONLY';
    risk_route: 'TEST_NORMAL_ROUTE_ONLY';
  };
  allowed_actions: readonly ['VIEW_DETAILS', 'RETURN', 'PAUSE', 'NO_ACTION', 'SELECT'];
}

/**
 * 等量、固定顺序、无 rank、无 recommended 字段。顺序仅为稳定渲染和测试，不表达优先级。
 */
export const SYNTHETIC_ADMITTED_CANDIDATES: readonly SyntheticAdmittedCandidate[] = [
  {
    offer_ref: 'synthetic:family:communication-reset-reading',
    title: '一起阅读：重新开始一段沟通',
    content_type: 'TEST_ONLY_GUIDED_READING',
    source_label: 'TEST_ONLY_SYNTHETIC_FIXTURE',
    admission_state: 'SYNTHETIC_ADMITTED_FOR_DEV',
    admission_version: SYNTHETIC_FIXTURE_VERSION,
    boundary_summary: '这是用于内部体验的合成候选，仅供查看 L1 流程，不代表真实服务或效果。',
    comparison_fields: {
      what_it_is: '一段供家庭内部演示使用的合成阅读说明。',
      what_it_is_not: '不是专业工具、诊断、真实资源或效果承诺。',
      executor: 'MOCK_EXECUTOR_ONLY',
      risk_route: 'TEST_NORMAL_ROUTE_ONLY',
    },
    allowed_actions: ['VIEW_DETAILS', 'RETURN', 'PAUSE', 'NO_ACTION', 'SELECT'],
  },
  {
    offer_ref: 'synthetic:family:one-small-step-practice',
    title: '一起查看：一次小步骤的说明',
    content_type: 'TEST_ONLY_FAMILY_PRACTICE',
    source_label: 'TEST_ONLY_SYNTHETIC_FIXTURE',
    admission_state: 'SYNTHETIC_ADMITTED_FOR_DEV',
    admission_version: SYNTHETIC_FIXTURE_VERSION,
    boundary_summary: '这是用于内部体验的合成候选，仅供查看 L1 流程，不代表真实服务或效果。',
    comparison_fields: {
      what_it_is: '一段供家庭内部演示使用的合成小步骤说明。',
      what_it_is_not: '不是自动任务、真实执行责任或效果承诺。',
      executor: 'MOCK_EXECUTOR_ONLY',
      risk_route: 'TEST_NORMAL_ROUTE_ONLY',
    },
    allowed_actions: ['VIEW_DETAILS', 'RETURN', 'PAUSE', 'NO_ACTION', 'SELECT'],
  },
] as const;

export function findSyntheticCandidate(offerRef: string): SyntheticAdmittedCandidate | null {
  return SYNTHETIC_ADMITTED_CANDIDATES.find((candidate) => candidate.offer_ref === offerRef) ?? null;
}

export interface MockExecutorReceipt {
  executor: 'MOCK_EXECUTOR_ONLY';
  status: 'MOCK_EXECUTOR_ACKNOWLEDGED';
  delivery_started: false;
  plan_id: null;
  case_id: null;
  statement: '仅记录内部演示选择；未启动真实服务、任务、预约、外发或模型调用。';
}

export function createMockExecutorReceipt(): MockExecutorReceipt {
  return {
    executor: 'MOCK_EXECUTOR_ONLY',
    status: 'MOCK_EXECUTOR_ACKNOWLEDGED',
    delivery_started: false,
    plan_id: null,
    case_id: null,
    statement: '仅记录内部演示选择；未启动真实服务、任务、预约、外发或模型调用。',
  };
}
