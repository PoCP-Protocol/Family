/**
 * FAMILY-PRODUCT-RUNTIME-001 · Program Runtime(纯函数)。
 * 回答:这个家庭在计划第几天?今天该学/练/陪练/记录什么?何时出报告/真人介入?
 * 不持久化、不写 Growth OS;进度(当前天)由 EXPERIENCE/DATA 线的 enrollment 提供。
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
    is_final_day: clamped === program.total_days,
  };
}

export interface ProgramProgress { program_id: string; version: string; current_day: number; total_days: number; completed: boolean; percent: number; }
/** 由 enrollment 的当前天算进度(纯计算;不判定成长事实)。 */
export function computeProgress(program: Program, currentDay: number): ProgramProgress {
  const day = Math.max(1, Math.min(program.total_days, Math.floor(currentDay)));
  return {
    program_id: program.program_id,
    version: program.version,
    current_day: day,
    total_days: program.total_days,
    completed: day >= program.total_days,
    percent: Math.round((day / program.total_days) * 100),
  };
}
