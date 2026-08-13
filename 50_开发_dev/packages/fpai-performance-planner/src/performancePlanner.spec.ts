import { describe, expect, it } from 'vitest';
import { PrincipalPerformancePlanner } from './performancePlanner';
import type { PrincipalAiOutput } from '@family/principal-ai';

function makeOutput(overrides: Partial<PrincipalAiOutput> = {}): PrincipalAiOutput {
  return {
    opening: '我听见你今晚很累。',
    what_i_hear: '你描述的是：我儿子每天回来就玩手机。',
    possible_pattern: '这可能是回避 + 缓冲的组合,不是一句"不听话"。',
    not_the_label: '不给孩子扣"手机瘾"标签。',
    say_it_tonight: '今晚先别解决手机。',
    one_small_action: '把今晚目标降到 10 分钟对话或 15 分钟启动。',
    look_for: '观察孩子是否愿意在饭后放下手机 5 分钟。',
    boundary: '我愿意听你怎么想,但摔门和互相伤人的话不能继续。',
    risk_route: 'NORMAL',
    method_refs: ['method://coaching/one-small-step'],
    source_refs: [],
    ...overrides,
  };
}

describe('PrincipalPerformancePlanner (authoritative principal-ai output)', () => {
  it('U01 NORMAL → CALM_WARM + emphasis 使用权威 one_small_action', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan(makeOutput(), 'INTERACTIVE_CHAT', 'NORMAL');
    expect(plan.speech.tone).toBe('CALM_WARM');
    expect(plan.avatar.expression).toBe('ATTENTIVE');
    expect(plan.speech.emphasis).toContain('把今晚目标降到 10 分钟对话或 15 分钟启动。');
    expect(plan.visual?.subtitle_mode).toBe('NORMAL');
    expect(plan.visual?.action_card).toBe('今晚先别解决手机。');
  });

  it('U02 REVIEW → CALM_CAUTIOUS', () => {
    const planner = new PrincipalPerformancePlanner();
    const plan = planner.plan(makeOutput({ risk_route: 'REVIEW' }), 'INTERACTIVE_CHAT', 'REVIEW');
    expect(plan.speech.tone).toBe('CALM_CAUTIOUS');
    expect(plan.avatar.expression).toBe('ATTENTIVE');
    expect(plan.visual?.subtitle_mode).toBe('NORMAL');
  });

  it('U03 HIGH_RISK → CALM_SERIOUS + emphasis 使用权威 boundary + SERIOUS subtitle', () => {
    const planner = new PrincipalPerformancePlanner();
    const output = makeOutput({
      risk_route: 'HIGH_RISK',
      boundary: 'HIGH_RISK 场景不生成普通行动卡,需要人工或专业支持路径。',
      one_small_action: '现在先联系人工顾问或当地紧急/专业支持。',
      say_it_tonight: '我们先暂停争执,我会找一个专业的人一起帮我们把这件事处理好。',
    });
    const plan = planner.plan(output, 'INTERACTIVE_CHAT', 'HIGH_RISK');
    expect(plan.speech.tone).toBe('CALM_SERIOUS');
    expect(plan.avatar.expression).toBe('CALM_SERIOUS');
    expect(plan.visual?.subtitle_mode).toBe('SERIOUS');
    expect(plan.speech.emphasis[0]).toContain('HIGH_RISK');
  });
});
