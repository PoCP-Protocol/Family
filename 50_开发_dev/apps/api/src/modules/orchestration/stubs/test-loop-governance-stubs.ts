/**
 * ARCH-GO-TEST-FULL-FUNCTION-001
 * 环境状态: DEV_IMPLEMENTING / PROD_HOLD
 *
 * 仅用于测试闭环的固定治理占位。无模型 SDK、无网络、无题项、无计分、无自动转介。
 */
export interface GatewayStubResult {
  status: 'NOT_ENABLED';
  template_id: 'REF-GATEWAY-NOT-ENABLED';
  message: string;
  external_model_called: false;
  training_used: false;
}

export function gatewayStub(): GatewayStubResult {
  return {
    status: 'NOT_ENABLED',
    template_id: 'REF-GATEWAY-NOT-ENABLED',
    message: '当前内部演示不启用模型或 Gateway。你可以返回使用不依赖模型的文字路径，或退出。',
    external_model_called: false,
    training_used: false,
  };
}

export interface IntakeStubResult {
  status: 'HOLD';
  template_id: 'REF-PROFESSIONAL-BOUNDARY';
  message: string;
  questions_collected: false;
  score_calculated: false;
  report_generated: false;
}

export function assessmentIntakeStub(category: 'L2_STANDARDIZED_TOOL' | 'L3_SAFETY_TOOL' | 'ADT_OR_BIOMETRIC'): IntakeStubResult {
  const label = category === 'ADT_OR_BIOMETRIC' ? '该工具或生物特征信息' : '该类工具';
  return {
    status: 'HOLD',
    template_id: 'REF-PROFESSIONAL-BOUNDARY',
    message: `${label}当前未进入内部演示流程；不会收集题项、图像、指纹、生物特征，不会计分、诊断或生成报告。你可以返回或退出。`,
    questions_collected: false,
    score_calculated: false,
    report_generated: false,
  };
}

export interface HumanGatePlaceholderResult {
  status: 'HUMAN_GATE_REQUIRED';
  template_id: 'REF-HUMAN-GATE-PLACEHOLDER';
  message: string;
  external_contacted: false;
  appointment_created: false;
}

export function humanGatePlaceholder(): HumanGatePlaceholderResult {
  return {
    status: 'HUMAN_GATE_REQUIRED',
    template_id: 'REF-HUMAN-GATE-PLACEHOLDER',
    message: '当前内部演示不会自动安排真人服务、外发信息或作出专业结论。此处仅保留需要独立 Human Gate 的停止标记。你可以返回或退出。',
    external_contacted: false,
    appointment_created: false,
  };
}
