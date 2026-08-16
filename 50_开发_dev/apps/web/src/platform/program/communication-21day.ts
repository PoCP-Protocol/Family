/**
 * FAMILY-PRODUCT-RUNTIME-001 · 《21天青春期亲子沟通成长计划》程序定义(编排结构)。
 * 这是【产品编排】:每日活动槽 + 成长动作绑定 + 交付检查点 + 报告节奏。
 * theme_ref / asset_ref / instruction_ref / scenario_ref 指向 Content Engine 的循证课件(CONTENT 线导入),
 * 本文件【不内联教研文本】,不臆造教育主张。问题域冻结:12–15 岁亲子沟通冲突。
 */
import type { Program, ProgramDay } from './program-types';

const PID = 'FAMILY_PRODUCT_01';
const REF = (d: number, k: string) => `content.communication21.day${d}.${k}`; // Content Engine 解析为家长可读内容

/** 生成一天的编排槽(内容全部走 ref;绑定与检查点在此显式排布)。 */
function day(d: number, opts: { binding?: string | null; checkpoint?: ProgramDay['delivery_checkpoint']; learnMin?: number; practice?: boolean; coach?: boolean } = {}): ProgramDay {
  return {
    day_index: d,
    theme_ref: REF(d, 'theme'),
    learn: { asset_ref: REF(d, 'learn'), est_minutes: opts.learnMin ?? 5 },
    practice: opts.practice === false ? undefined : { instruction_ref: REF(d, 'practice') },
    coach: opts.coach === false ? undefined : { scenario_ref: REF(d, 'coach') },
    reflect: { prompt: '今晚花 1 分钟:今天有类似场景吗?做了 / 做了一部分 / 没机会做?发生了什么?' },
    growth_action_binding: opts.binding === undefined ? 'LISTEN_BEFORE_RESPOND' : opts.binding,
    delivery_checkpoint: opts.checkpoint ?? 'NONE',
  };
}

// 节奏:Day7 周复盘 · Day14 阶段报告 · Day21 结营报告。检查点排布是编排职责(内容仍由 Content 线充实)。
const days: ProgramDay[] = [];
for (let d = 1; d <= 21; d++) {
  let checkpoint: ProgramDay['delivery_checkpoint'] = 'NONE';
  if (d === 7) checkpoint = 'WEEKLY_REVIEW';
  else if (d === 14) checkpoint = 'GROWTH_REPORT';
  else if (d === 21) checkpoint = 'GROWTH_REPORT';
  days.push(day(d, { checkpoint }));
}

export const COMMUNICATION_21DAY: Program = {
  product_id: PID,
  title: '21天青春期亲子沟通成长计划',
  problem_domain: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
  life_stage: 'EARLY_ADOLESCENCE_12_15',
  total_days: 21,
  days,
};
