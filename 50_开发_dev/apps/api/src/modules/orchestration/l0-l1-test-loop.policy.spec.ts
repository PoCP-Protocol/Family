import { describe, expect, it } from 'vitest';
import { assessmentIntakeStub, gatewayStub, humanGatePlaceholder } from './stubs/test-loop-governance-stubs';
import { SYNTHETIC_ADMITTED_CANDIDATES, createMockExecutorReceipt } from './test-fixtures/synthetic-admitted-candidates';
import { __test__, resolveTestLoopCapability } from './test-env.policy';
import { TEST_LOOP_FORBIDDEN_COPY, noActionTextEquivalent, safeStop, toEqualCandidateView } from './l0-l1-test-loop.policy';

describe('ARCH-GO-TEST-FULL-FUNCTION-001 DEV policy', () => {
  it('is disabled by default, refuses production, and permits a separately gated real LLM in DEV/TEST', () => {
    expect(resolveTestLoopCapability({} as NodeJS.ProcessEnv).enabled).toBe(false);
    expect(resolveTestLoopCapability({ FAMILY_TEST_FULL_LOOP_ENABLED: 'true', NODE_ENV: 'production' } as NodeJS.ProcessEnv).enabled).toBe(false);
    expect(resolveTestLoopCapability({ FAMILY_TEST_FULL_LOOP_ENABLED: 'true', FPAI_RUNTIME_PROFILE: 'model_first_internal' } as NodeJS.ProcessEnv).enabled).toBe(true);
    expect(__test__.isProductionLike({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe(true);
    expect(__test__.hasRealModelConfiguration({ MODEL_ASSISTANT_ENABLED: 'true' } as NodeJS.ProcessEnv)).toBe(true);
  });

  it('requires an explicit DEV synthetic flag and labels itself DEV_IMPLEMENTING', () => {
    expect(resolveTestLoopCapability({ FAMILY_TEST_FULL_LOOP_ENABLED: 'true', NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toMatchObject({
      enabled: true,
      mode: 'DEV_SYNTHETIC_ONLY',
      environment_status: 'DEV_IMPLEMENTING',
    });
  });

  it('maps fixtures to equal, unranked, text-equivalent candidate views', () => {
    const views = SYNTHETIC_ADMITTED_CANDIDATES.map(toEqualCandidateView);
    expect(views).toHaveLength(2);
    for (const view of views) {
      expect(view).not.toHaveProperty('rank');
      expect(view).not.toHaveProperty('recommended_offer_refs');
      expect(view.source_label).toBe('TEST_ONLY_SYNTHETIC_FIXTURE');
      expect(view.text_equivalent).toContain('平台不对候选排序');
      expect(view.allowed_actions).toEqual(['VIEW_DETAILS', 'RETURN', 'PAUSE', 'NO_ACTION', 'SELECT']);
      for (const forbidden of TEST_LOOP_FORBIDDEN_COPY) expect(view.text_equivalent).not.toContain(forbidden);
    }
  });

  it('keeps mock executor as non-delivery with zero Plan/Case', () => {
    expect(createMockExecutorReceipt()).toEqual({
      executor: 'MOCK_EXECUTOR_ONLY',
      status: 'MOCK_EXECUTOR_ACKNOWLEDGED',
      delivery_started: false,
      plan_id: null,
      case_id: null,
      statement: '仅记录内部演示选择；未启动真实服务、任务、预约、外发或模型调用。',
    });
  });

  it('uses neutral fail-closed templates and retains NO_ACTION zero-action wording', () => {
    const consent = safeStop('SERVICE_CONSENT_REQUIRED');
    expect(consent).toMatchObject({ safe_stop: true, template_id: 'REF-CONSENT-REVOKED', allowed_state_upper_bound: 'NONE' });
    expect(noActionTextEquivalent()).toContain('不会创建计划、服务过程、任务或提醒');
  });

  it('keeps Gateway, professional intake and Human Gate as fixed no-network stubs', () => {
    expect(gatewayStub()).toMatchObject({ status: 'NOT_ENABLED', external_model_called: false, training_used: false });
    expect(assessmentIntakeStub('ADT_OR_BIOMETRIC')).toMatchObject({ status: 'HOLD', questions_collected: false, score_calculated: false, report_generated: false });
    expect(humanGatePlaceholder()).toMatchObject({ status: 'HUMAN_GATE_REQUIRED', external_contacted: false, appointment_created: false });
  });
});
