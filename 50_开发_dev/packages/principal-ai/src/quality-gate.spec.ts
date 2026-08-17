import { FakeAiGateway } from '@family/ai-gateway';
import { describe, expect, it } from 'vitest';
import {
  askPrincipal,
  assessResponseQuality,
  deterministicQualityFloor,
  type PrincipalAiInput,
  type PrincipalAiOutput,
  type PrincipalQualityJudgeOutput,
} from './index';

const baseInput: PrincipalAiInput = {
  request_id: 'q-001',
  session_id: 'q-sess-001',
  entry_point: 'ASK_FAMILI_PRINCIPAL',
  consent_context: { fpai_lab_consent: true, family_context_read_allowed: false },
  user_message: '孩子一回家就玩手机,我说两句他就摔门。',
};

// 一个结构合法、贴合输入的正常输出(what_i_hear 内嵌 user_message)。
const goodOutput = (): PrincipalAiOutput => askPrincipal(baseInput);

// judge 网关工厂:让 FPAI_PRINCIPAL_QUALITY_EVAL use_case 返回给定 verdict。
const judgeReturning = (v: PrincipalQualityJudgeOutput | object) =>
  new FakeAiGateway({ FPAI_PRINCIPAL_QUALITY_EVAL: v });

describe('W2R-104 确定性质量底座 deterministicQualityFloor', () => {
  it('贴合输出 + 风险一致 → pass', () => {
    const v = deterministicQualityFloor({
      user_message: baseInput.user_message, output: goodOutput(), scenario_id: 'SCREEN_TIME', precheck_route: 'NORMAL',
    });
    expect(v.pass).toBe(true);
    expect(v.dimensions).toEqual({ understanding: 'PASS', labeling: 'PASS', risk_leak: 'NONE' });
    expect(v.judged_by).toBe('deterministic-floor');
  });

  it('漏判风险:precheck 更严而 output=NORMAL → SUSPECTED + fail', () => {
    const out = { ...goodOutput(), risk_route: 'NORMAL' as const };
    const v = deterministicQualityFloor({
      user_message: baseInput.user_message, output: out, scenario_id: 'SCREEN_TIME', precheck_route: 'HIGH_RISK',
    });
    expect(v.pass).toBe(false);
    expect(v.dimensions.risk_leak).toBe('SUSPECTED');
    expect(v.failed_checks).toContain('risk_underclassified');
  });

  it('理解空壳:what_i_hear 与 user_message 无交集 → understanding FAIL', () => {
    const out = { ...goodOutput(), what_i_hear: '今天天气不错,我们聊点别的。' };
    const v = deterministicQualityFloor({
      user_message: baseInput.user_message, output: out, scenario_id: 'SCREEN_TIME', precheck_route: 'NORMAL',
    });
    expect(v.pass).toBe(false);
    expect(v.dimensions.understanding).toBe('FAIL');
    expect(v.failed_checks).toContain('understanding_empty');
  });
});

describe('W2R-104 生成式质量闸 assessResponseQuality', () => {
  const gateInput = {
    user_message: baseInput.user_message, output: goodOutput(), scenario_id: 'SCREEN_TIME' as const, precheck_route: 'NORMAL' as const,
  };

  it('无 judge(CI/默认)→ 走确定性底座', async () => {
    const v = await assessResponseQuality(gateInput);
    expect(v.judged_by).toBe('deterministic-floor');
    expect(v.pass).toBe(true);
  });

  it('有 judge 且判 PASS → judged_by=generative, pass=true', async () => {
    const v = await assessResponseQuality(gateInput, judgeReturning({ understanding: 'PASS', labeling: 'PASS', risk_leak: 'NONE' }));
    expect(v.judged_by).toBe('generative');
    expect(v.pass).toBe(true);
  });

  it('judge 判 WEAK 理解 → 降级 fail(WEAK 也不放行)', async () => {
    const v = await assessResponseQuality(gateInput, judgeReturning({ understanding: 'WEAK', labeling: 'PASS', risk_leak: 'NONE' }));
    expect(v.pass).toBe(false);
    expect(v.dimensions.understanding).toBe('WEAK');
    expect(v.failed_checks).toContain('understanding_weak');
  });

  it('judge 判场景 MISMATCH → fail', async () => {
    const v = await assessResponseQuality(gateInput, judgeReturning({ understanding: 'PASS', labeling: 'MISMATCH', risk_leak: 'NONE' }));
    expect(v.pass).toBe(false);
    expect(v.failed_checks).toContain('scenario_mislabeled');
  });

  it('judge 输出非法 → 回退确定性底座(不采信坏 verdict)', async () => {
    const v = await assessResponseQuality(gateInput, judgeReturning({ understanding: 'GREAT' }));
    expect(v.judged_by).toBe('deterministic-floor');
    expect(v.pass).toBe(true);
  });

  it('只降级不放宽:底座 SUSPECTED 不被 judge 的 NONE 抹掉', async () => {
    const leaky = {
      user_message: baseInput.user_message, output: { ...goodOutput(), risk_route: 'NORMAL' as const }, scenario_id: 'SCREEN_TIME' as const, precheck_route: 'REVIEW' as const,
    };
    const v = await assessResponseQuality(leaky, judgeReturning({ understanding: 'PASS', labeling: 'PASS', risk_leak: 'NONE' }));
    expect(v.dimensions.risk_leak).toBe('SUSPECTED');
    expect(v.pass).toBe(false);
  });

  it('judge 抛错(网关不可用)→ 回退底座', async () => {
    const throwing = { generateStructured: async () => { throw new Error('provider down'); }, embed: async () => ({ model: 'x', generated_at: '', vectors: [] }) };
    const v = await assessResponseQuality(gateInput, throwing);
    expect(v.judged_by).toBe('deterministic-floor');
    expect(v.pass).toBe(true);
  });
});
