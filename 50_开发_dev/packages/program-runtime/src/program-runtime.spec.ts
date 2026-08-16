import { describe, expect, it } from 'vitest';
import { resolveProgramDay, projectProgramSchedule } from './program-runtime';
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
  it('Day21 = 报告日 + 走到最后一天(reached_final_day,非"完成")', () => {
    const v = resolveProgramDay(COMMUNICATION_21DAY, 21);
    expect(v.is_report_day).toBe(true);
    expect(v.reached_final_day).toBe(true);
    // 语义护栏:视图里没有、也不应有任何 completion 字段。
    expect('is_final_day' in v).toBe(false);
    expect('completed' in v).toBe(false);
  });
  it('越界 clamp 到 [1,total]', () => {
    expect(resolveProgramDay(COMMUNICATION_21DAY, 0).day_index).toBe(1);
    expect(resolveProgramDay(COMMUNICATION_21DAY, 99).day_index).toBe(21);
  });
});

describe('projectProgramSchedule(仅日程位置,不判定完成)', () => {
  it('Day8/21 → schedule_percent≈38;Day21 → reached_final_day=true', () => {
    expect(projectProgramSchedule(COMMUNICATION_21DAY, 8).schedule_percent).toBe(38);
    expect(projectProgramSchedule(COMMUNICATION_21DAY, 8).reached_final_day).toBe(false);
    expect(projectProgramSchedule(COMMUNICATION_21DAY, 21).reached_final_day).toBe(true);
  });
  it('Program Runtime 不判定 Enrollment/Delivery 完成:投影中没有 completed 字段', () => {
    const p = projectProgramSchedule(COMMUNICATION_21DAY, 21);
    expect('completed' in p).toBe(false);
    // 到最后一天 ≠ 完成:completed/started/paused/cancelled/delivery 归未来 Enrollment/Delivery Domain。
    expect(p.program_id).toBe('communication-21day');
    expect(p.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
