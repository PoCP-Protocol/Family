import { describe, expect, it } from 'vitest';
import { resolveProgramDay, computeProgress } from './program-runtime';
import { COMMUNICATION_21DAY } from './communication-21day';

describe('COMMUNICATION_21DAY 定义', () => {
  it('21 天,问题域冻结,节奏检查点正确(Day7 周复盘 / Day14+21 报告)', () => {
    expect(COMMUNICATION_21DAY.total_days).toBe(21);
    expect(COMMUNICATION_21DAY.problem_domain).toBe('PARENT_CHILD_COMMUNICATION_CONFLICT');
    expect(COMMUNICATION_21DAY.days).toHaveLength(21);
    const cp = (d: number) => COMMUNICATION_21DAY.days.find((x) => x.day_index === d)?.delivery_checkpoint;
    expect(cp(7)).toBe('WEEKLY_REVIEW');
    expect(cp(14)).toBe('GROWTH_REPORT');
    expect(cp(21)).toBe('GROWTH_REPORT');
    expect(cp(3)).toBe('NONE');
  });
  it('Program 身份 = program_id + version(≠商业 product_id)', () => {
    expect(COMMUNICATION_21DAY.program_id).toBe('communication-21day');
    expect(COMMUNICATION_21DAY.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect((COMMUNICATION_21DAY as unknown as Record<string, unknown>).product_id).toBeUndefined();
  });
  it('内容全部走 ref(含 reflect.prompt_ref,不内联教研文本)', () => {
    const d3 = COMMUNICATION_21DAY.days[2];
    expect(d3.theme_ref).toMatch(/^content\.communication21\.day3\./);
    expect(d3.learn?.asset_ref).toMatch(/^content\./);
    expect(d3.reflect.prompt_ref).toMatch(/^content\.communication21\.day3\.reflect$/);
  });
  it('不臆造每日干预:growth_action_binding 默认 null(无冻结绑定契约)', () => {
    expect(COMMUNICATION_21DAY.days.every((d) => d.growth_action_binding === null)).toBe(true);
  });
});

describe('resolveProgramDay', () => {
  it('Day3 视图:LEARN/PRACTICE/COACH/REFLECT 四类活动', () => {
    const v = resolveProgramDay(COMMUNICATION_21DAY, 3);
    expect(v.day_index).toBe(3);
    expect(v.activities.map((a) => a.kind)).toEqual(['LEARN', 'PRACTICE', 'COACH', 'REFLECT']);
    expect(v.is_report_day).toBe(false);
  });
  it('Day21 = 报告日 + 结营', () => {
    const v = resolveProgramDay(COMMUNICATION_21DAY, 21);
    expect(v.is_report_day).toBe(true);
    expect(v.is_final_day).toBe(true);
  });
  it('越界 clamp 到 [1,total]', () => {
    expect(resolveProgramDay(COMMUNICATION_21DAY, 0).day_index).toBe(1);
    expect(resolveProgramDay(COMMUNICATION_21DAY, 99).day_index).toBe(21);
  });
});

describe('computeProgress', () => {
  it('Day8/21 → 38%,未完成;Day21 → 完成', () => {
    expect(computeProgress(COMMUNICATION_21DAY, 8).percent).toBe(38);
    expect(computeProgress(COMMUNICATION_21DAY, 8).completed).toBe(false);
    expect(computeProgress(COMMUNICATION_21DAY, 21).completed).toBe(true);
  });
});
