import type { GrowthActionDto, InterventionCardDto, InterventionCode, InterventionId, InterventionPolicyVersion } from '@family/contracts';

export const INTERVENTION_ID: InterventionId = 'INTERVENTION-001';
export const INTERVENTION_CODE: InterventionCode = 'LISTEN_BEFORE_RESPOND';
export const INTERVENTION_POLICY_VERSION: InterventionPolicyVersion = 'M2_105_DETERMINISTIC_V1';
export const ACTION_BOUNDARY: GrowthActionDto['boundary'] = 'ACTION_IS_NOT_OUTCOME';
export const PLANNED_DAYS = 7;

export const LISTEN_BEFORE_RESPOND_ASSIGNMENTS = [
  '停顿三秒,让孩子把话说完,今天不急着给建议。',
  '先复述你听到的意思,再表达自己的看法。',
  '在提出解决办法前,先问一个澄清问题。',
  '先说出你观察到的感受,不评价对错。',
  '把倾听和纠正分开,今天先完成倾听。',
  '选一个没听好的时刻,补一句“我刚才没有听完,你愿意再说一遍吗?”',
  '回看这七天的练习感受,不判断有没有改善。',
] as const;

export function getListenBeforeRespondCard(): InterventionCardDto {
  return {
    intervention_id: INTERVENTION_ID,
    intervention_code: INTERVENTION_CODE,
    name_zh: '先听后回应',
    duration_days: PLANNED_DAYS,
    why: '把家庭沟通中的第一个练习点收敛到可执行的倾听行为。',
    target: '亲子沟通中的回应方式。',
    behavior: '每天完成一个小的倾听动作,先听完再回应。',
    applicability: ['P03', 'R03', 'R04', 'R05'],
    contraindications: ['当前存在需要人工安全介入的高风险信号时,不进入普通成长练习。'],
    safety_notes: ['如出现安全风险,先走安全处理,不继续普通练习流。'],
    expected_mediator: '练习过程中的倾听行为记录。',
    expected_outcome: '不承诺结果改善,仅记录练习过程。',
    action_template: LISTEN_BEFORE_RESPOND_ASSIGNMENTS.join('\n'),
    policy_version: INTERVENTION_POLICY_VERSION,
  };
}

export function buildGrowthActionAssignments(startedAt: string | Date): Array<{ dayIndex: number; assignmentText: string; dueDate: string }> {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  return LISTEN_BEFORE_RESPOND_ASSIGNMENTS.map((assignmentText, index) => ({
    dayIndex: index + 1,
    assignmentText,
    dueDate: toDateOnly(addDaysUtc(start, index)),
  }));
}

function addDaysUtc(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}