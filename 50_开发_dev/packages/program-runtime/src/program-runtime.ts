/**
 * @family/program-runtime · Program Runtime(纯函数)。
 * 回答:这个家庭在计划**日程**第几天?今天该学/练/陪练/记录什么?何时出报告/真人介入?
 * 不持久化、不写 Growth OS;当前天由 Enrollment/Delivery Domain 提供。
 * 铁律:本域只投影【日程位置(schedule position)】,**不派生任何"完成"真相**——
 *   started / paused / completed / cancelled / delivery_completed 归未来 Enrollment / Delivery Domain。
 *   到第 21 天(reached_final_day) ≠ Program 完成 ≠ 交付完成 ≠ Growth 结果。
 */
import type { Program, ProgramDayView } from './program-types';

/** 解析某天视图(day 从 1 起;越界 clamp)。 */
export function resolveProgramDay(program: Program, dayIndex: number): ProgramDayView {
  const clamped = Math.max(1, Math.min(program.total_days, Math.floor(dayIndex)));
  const d = program.days.find((x) => x.day_index === clamped);
  if (!d) throw new Error(`program_day_not_found:${clamped}`);
  const activities: ProgramDayView['activities'] = [];
  if (d.learn) activities.push({ kind: 'LEARN', ref: d.learn.asset_ref, est_minutes: d.learn.est_minutes });
  if (d.practice) activities.push({ kind: 'PRACTICE', ref: d.practice.instruction_ref });
  if (d.coach) activities.push({ kind: 'COACH', ref: d.coach.scenario_ref });
  activities.push({ kind: 'REFLECT', ref: d.reflect.prompt_ref });
  return {
    day_index: clamped,
    total_days: program.total_days,
    theme_ref: d.theme_ref,
    activities,
    growth_action_binding: d.growth_action_binding,
    delivery_checkpoint: d.delivery_checkpoint,
    is_report_day: d.delivery_checkpoint === 'GROWTH_REPORT',
    reached_final_day: clamped === program.total_days,  // 仅日程位置:走到最后一天;≠ 完成
  };
}

/**
 * 日程位置投影(schedule position only)。
 * 刻意不含 `completed`:Program Runtime 无权判定 Enrollment/Delivery 是否完成。
 */
export interface ProgramScheduleProjection {
  program_id: string;
  version: string;
  current_day: number;
  total_days: number;
  schedule_percent: number;   // 日程进度%(纯位置,非完成度)
  reached_final_day: boolean; // 是否已走到最后一天(≠ 完成)
}

/** 由 Enrollment 的当前天投影日程位置(纯计算;不判定成长事实,也不判定完成)。 */
export function projectProgramSchedule(program: Program, currentDay: number): ProgramScheduleProjection {
  const day = Math.max(1, Math.min(program.total_days, Math.floor(currentDay)));
  return {
    program_id: program.program_id,
    version: program.version,
    current_day: day,
    total_days: program.total_days,
    schedule_percent: Math.round((day / program.total_days) * 100),
    reached_final_day: day >= program.total_days,
  };
}
