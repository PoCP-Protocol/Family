import { Injectable } from '@nestjs/common';
import {
  DEV_CORE_GROWTH_SURFACES,
  type DevCoreGrowthCard,
  type DevCoreGrowthNoopCommandResult,
  type DevCoreGrowthProjection,
  type DevCoreGrowthSurface,
  type DevFamilyGrowthReportDraft,
  type DevGrowthFocus,
  type DevGrowthPlanPreview,
  getFamilyGrowthSurfaceArchitectureBinding,
} from '@family/contracts';

/**
 * DEV Core Growth adapter for UI-02..UI-10 and the researched UI-35 support
 * surface. It emits bounded test projections only: no model call, no diagnosis,
 * no outcome conclusion and no external adapter invocation.
 */
@Injectable()
export class DevCoreGrowthService {
  getProjection(
    familyId: string,
    flowEvents: readonly { ui_id: string; command: string; selection?: string }[] = [],
  ): DevCoreGrowthProjection {
    const focus = selectedFocus(flowEvents);
    const planPreviewed = flowEvents.some(
      (event) => event.ui_id === 'UI-04' && event.command === 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT',
    );
    const weeklyActionOpened = flowEvents.some(
      (event) => event.ui_id === 'UI-05' && event.command === 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION',
    );

    return {
      projection_version: 'DEV_CORE_GROWTH_V1',
      family_id: familyId,
      generated_at: new Date().toISOString(),
      data_source: 'SYNTHETIC_DEV_ONLY',
      family_growth_os_path: [
        'GrowthOnboarding',
        'Perspective',
        'GrowthProfileDraft',
        'GrowthPriority',
        'Intervention',
        'GrowthAction',
        'GrowthReview',
      ],
      model_gateway: {
        status: 'NOOP_NOT_INVOKED',
        rule: 'NO_FREE_TEXT_MODEL_WRITE_TO_CORE_ONTOLOGY',
      },
      cards: this.cards(focus, planPreviewed, weeklyActionOpened).map((item) => {
        const architecture = getFamilyGrowthSurfaceArchitectureBinding(item.surface);
        return {
          ...item,
          loop: architecture.loop,
          business_capability: architecture.business_capability,
          primary_objects: architecture.primary_objects,
          state_boundary: architecture.state_boundary,
        };
      }),
    };
  }

  supportsSurface(surface: string): surface is DevCoreGrowthSurface {
    return DEV_CORE_GROWTH_SURFACES.includes(surface as DevCoreGrowthSurface);
  }

  acknowledgeNoop(familyId: string, surface: DevCoreGrowthSurface, command: string): DevCoreGrowthNoopCommandResult {
    if (!this.supportsSurface(surface)) {
      throw new Error('unsupported_dev_core_growth_surface');
    }
    return {
      family_id: familyId,
      surface,
      command,
      status: 'NOOP_ACKNOWLEDGED',
      persistence: 'NONE',
      external_effect: false,
      audit_boundary: 'DEV_COMMAND_TRACE_ONLY',
    };
  }

  private cards(
    focus: DevGrowthFocus,
    planPreviewed: boolean,
    weeklyActionOpened: boolean,
  ): Array<Omit<DevCoreGrowthCard, 'loop' | 'business_capability' | 'primary_objects' | 'state_boundary'>> {
    const reportDraft = buildReportDraft(focus, planPreviewed);
    const planPreview = buildPlanPreview(focus, planPreviewed, weeklyActionOpened);

    return [
      {
        surface: 'UI-02', kind: 'ASSESSMENT_ENTRY', title: '家庭成长测评入口', state: 'READY',
        fact_boundary: 'PERSPECTIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'DEV 演示从家庭场景进入成长 Onboarding；输入只形成 Perspective/受控草稿。',
        next_hint: '可进入测评草稿，不生成诊断结论。',
        command: { name: 'START_SYNTHETIC_ASSESSMENT_DRAFT', mode: 'CONTROLLED_DRAFT' },
      },
      {
        surface: 'UI-03', kind: 'REPORT_EXPLANATION', title: 'AI成长解释草稿', state: 'DRAFT',
        fact_boundary: 'PERSPECTIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '仅解释家长已选择的关注维度、来源和不确定性；它不是儿童或家庭的真实判断、诊断或效果结论。',
        next_hint: '可预览 rule-based 解释边界和方案草稿；模型网关保持 NOOP_NOT_INVOKED。',
        command: { name: 'PREVIEW_SYNTHETIC_REPORT_EXPLANATION', mode: 'CONTROLLED_DRAFT' },
      },
      {
        surface: 'UI-04', kind: 'REPORT_EXPLANATION', title: '成长说明', state: 'READ_ONLY',
        fact_boundary: 'PROFILE_IS_INTERPRETIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '报告仅解释 Profile draft、证据限制和候选重点；不输出诊断、预测或效果承诺。',
        next_hint: '下一步可查看 90 天计划预览。',
        command: { name: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', mode: 'CONTROLLED_DRAFT' },
        report_draft: reportDraft,
      },
      {
        surface: 'UI-05', kind: 'PLAN_DRAFT', title: '90 天成长方案', state: 'DRAFT',
        fact_boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'DEV 视图展示 SEE、PARENT_FIRST、CO_CREATE、STABILIZE 四阶段计划结构；不代表已确认计划。',
        next_hint: '从本周的一件小行动开始。',
        command: { name: 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION', mode: 'CONTROLLED_DRAFT' },
        plan_preview: planPreview,
      },
      {
        surface: 'UI-06', kind: 'COMPANION_PROGRESS', title: '90 天陪跑', state: 'READ_ONLY',
        fact_boundary: 'ACTION_IS_NOT_OUTCOME', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '展示任务节奏与回顾入口；check-in 只代表行动记录，不能证明成长效果。',
        next_hint: '今日行动由 UI-09 的 CompleteGrowthAction 受控完成。',
        command: { name: 'READ_SYNTHETIC_COMPANION_PROGRESS', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-07', kind: 'MEMBERSHIP_READ', title: '我的成长服务', state: 'READ_ONLY',
        fact_boundary: 'ACTION_IS_NOT_OUTCOME', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'DEV 只读展示当前计划和任务入口；不创建权益、订单、续费或真人服务。',
        next_hint: '可返回计划或今日任务继续受控流程。',
        command: { name: 'READ_SYNTHETIC_GROWTH_SERVICE', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-08', kind: 'REPORT_EXPLANATION', title: '成长报告', state: 'READ_ONLY',
        fact_boundary: 'PROFILE_IS_INTERPRETIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'DEV 报告展示解释性信息和限制，不把 Perspective、推荐或行动记录写成 Fact。',
        next_hint: '报告可引导到计划草稿；不直接创建 Journey 或 Outcome。',
        command: { name: 'READ_SYNTHETIC_GROWTH_REPORT', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-10', kind: 'CHILD_ASSISTANT_READ', title: '成长小助手', state: 'NOOP',
        fact_boundary: 'PERSPECTIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '仅展示规则化的任务入口与系统状态；没有 Child-facing 模型调用、监控或诊断。',
        next_hint: '孩子自主能力与监护 Consent 需在后续受控切片中实现。',
        command: { name: 'READ_SYNTHETIC_CHILD_ASSISTANT', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-35', kind: 'GROWTH_CAMP_21', title: '21天智慧父母成长营（DEV课程草稿）', state: 'DRAFT',
        fact_boundary: 'ACTION_IS_NOT_OUTCOME', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'AI 辅助课程体系草稿：课程结构依据体验层“21 天行动/每日任务”与公开训练营交付线索生成；不等同官方课表，须经课程专家审核后方可发布或分配。',
        next_hint: '当前日单元可记录家长行动和 Perspective；阶段回顾只形成课程草稿建议，后续可推荐衔接 90 天计划但不会自动创建计划。',
        command: { name: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', mode: 'CONTROLLED_DRAFT' },
        curriculum_draft: {
          draft_id: 'CURR-UI35-DEV-21D-V1',
          status: 'SYNTHETIC_RULE_BASED_DRAFT',
          source_boundary: 'E1_PRODUCT_STRUCTURE_PLUS_PUBLIC_DESIGN_RESEARCH',
          model_gateway_status: 'NOOP_NOT_INVOKED',
          human_review: 'REQUIRED_BEFORE_PUBLISH_OR_ASSIGN',
          course_boundary: 'NOT_OFFICIAL_SYLLABUS_NOT_OUTCOME_NOT_DIAGNOSIS',
          day_count: 21,
          stages: [
            { stage_id: 'FOUNDATION', label: '阶段一：观察与连接', day_range: 'Day 1-7', intent: '以家长自我觉察和稳定回应作为练习起点。' },
            { stage_id: 'PRACTICE', label: '阶段二：沟通与习惯实践', day_range: 'Day 8-14', intent: '将已选择的家庭互动工具转化为可记录的小行动。' },
            { stage_id: 'REVIEW', label: '阶段三：复盘与延续设计', day_range: 'Day 15-21', intent: '回顾行动记录和家长 Perspective，形成后续计划草稿建议。' },
          ],
          current_day: {
            day_number: 1,
            theme: '观察一次完整的亲子互动',
            parent_action: '选择一个日常情境，先记录自己听到和看到的内容，再决定是否回应。',
            reflection_prompt: '这次互动中，我注意到了什么？这只是我的感受和观察，不是对孩子的结论。',
            evidence_boundary: 'PERSPECTIVE_NOT_FACT',
          },
          next_transition: 'GROWTH_PLAN_DRAFT_RECOMMENDATION_ONLY',
        },
      },
    ];
  }
}

const GROWTH_FOCUS_CONTENT: Record<DevGrowthFocus, {
  reportHeadline: string;
  reportSummary: string;
  observations: readonly { label: string; detail: string }[];
  action: string;
  fallback: string;
  planHeadline: string;
}> = {
  PARENT_CHILD_COMMUNICATION: {
    reportHeadline: '从一次认真倾听开始',
    reportSummary: '把注意力放回每一次真实对话，先理解，再回应。',
    observations: [{ label: '你在关注', detail: '亲子沟通是否更容易开始。' }, { label: '可以尝试', detail: '每天留出一个不被打断的倾听时刻。' }, { label: '慢慢调整', detail: '当对话卡住时，先暂停，再换一种问法。' }],
    action: '晚饭后留出 10 分钟，只问一个开放问题并听完回答。',
    fallback: '如果今天时间紧，就在睡前说一句“我愿意听你讲”。',
    planHeadline: '让每一次沟通多一点被听见的感觉',
  },
  LEARNING_HABITS: {
    reportHeadline: '从一个可开始的小步骤开始',
    reportSummary: '把学习安排变得更清楚、更容易启动，而不是一次要求完成很多。',
    observations: [{ label: '你在关注', detail: '开始学习时是否更有节奏。' }, { label: '可以尝试', detail: '一起约定一个短时段和明确的第一步。' }, { label: '慢慢调整', detail: '完成后先回顾方法，再讨论结果。' }],
    action: '和孩子一起确定今晚最先完成的一件小事，并约定 15 分钟开始。',
    fallback: '如果今天已经很累，就一起整理明天要用的一样物品。',
    planHeadline: '用更清楚的开始方式陪伴学习',
  },
  EMOTION_REGULATION: {
    reportHeadline: '先看见感受，再决定怎样回应',
    reportSummary: '给情绪留出被表达的空间，让互动回到更平稳的节奏。',
    observations: [{ label: '你在关注', detail: '情绪出现时彼此是否有被理解的机会。' }, { label: '可以尝试', detail: '先描述看到的状态，再邀请对方说说感受。' }, { label: '慢慢调整', detail: '冲突时可以先停一停，等平静后再继续。' }],
    action: '今天遇到情绪波动时，先说“我看到你现在很不容易”，再停 30 秒。',
    fallback: '如果当下不适合交谈，就约定稍后再回来继续。',
    planHeadline: '为情绪留出理解和恢复的空间',
  },
  SELF_REGULATION: {
    reportHeadline: '把选择权放进可完成的小行动里',
    reportSummary: '从一件自己能决定的小事开始，逐步练习自主和承担。',
    observations: [{ label: '你在关注', detail: '日常安排中是否有更多自主选择。' }, { label: '可以尝试', detail: '提供两个可行选项，一起约定完成方式。' }, { label: '慢慢调整', detail: '回顾卡住的地方，减少下一次的难度。' }],
    action: '为今晚的一件家务提供两个选择，让孩子自己决定先做哪一个。',
    fallback: '如果没有合适的家务，就一起决定明天起床后的第一件事。',
    planHeadline: '在日常选择里练习更多自主',
  },
  DEVICE_USE_CONTEXT: {
    reportHeadline: '先一起约定使用情境',
    reportSummary: '从共同约定开始，帮助数字设备使用更清楚、更有边界。',
    observations: [{ label: '你在关注', detail: '设备使用是否影响了休息和交流。' }, { label: '可以尝试', detail: '先约定一个不用设备的家庭时段。' }, { label: '慢慢调整', detail: '出现分歧时回到共同约定，而不是互相指责。' }],
    action: '今晚一起选一个 20 分钟的家庭时段，把设备放在看得见的地方。',
    fallback: '如果今天不方便，就先约定明天吃饭时不看设备。',
    planHeadline: '用共同约定建立更清楚的数字节奏',
  },
};

function selectedFocus(flowEvents: readonly { ui_id: string; command: string; selection?: string }[]): DevGrowthFocus {
  const selected = flowEvents.find(
    (event) => event.ui_id === 'UI-02' && event.command === 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION',
  )?.selection;
  return selected && selected in GROWTH_FOCUS_CONTENT ? selected as DevGrowthFocus : 'PARENT_CHILD_COMMUNICATION';
}

function buildReportDraft(focus: DevGrowthFocus, planPreviewed: boolean): DevFamilyGrowthReportDraft {
  const content = GROWTH_FOCUS_CONTENT[focus];
  return {
    report_id: `REPORT-${focus}-V1`,
    state: planPreviewed ? 'PLAN_PREVIEWED' : 'READY',
    focus,
    headline: content.reportHeadline,
    summary: content.reportSummary,
    observations: content.observations,
    this_week_action: {
      when: '本周任选一个轻松的时刻',
      action: content.action,
      fallback: content.fallback,
    },
    plan_link_state: planPreviewed ? 'VIEWED' : 'READY_TO_VIEW',
  };
}

function buildPlanPreview(
  focus: DevGrowthFocus,
  planPreviewed: boolean,
  weeklyActionOpened: boolean,
): DevGrowthPlanPreview {
  const content = GROWTH_FOCUS_CONTENT[focus];
  return {
    plan_id: `PLAN-${focus}-V1`,
    state: planPreviewed ? 'VIEWED_FROM_REPORT' : 'READY',
    focus,
    headline: content.planHeadline,
    stages: [
      { stage_id: 'SEE', label: '看见当下', weeks: '第 1-3 周', intent: '找到最适合开始的一件小事。', small_action: content.action },
      { stage_id: 'ADJUST', label: '温和调整', weeks: '第 4-6 周', intent: '根据家庭节奏微调做法。', small_action: '每周留出一次 10 分钟的小回顾。' },
      { stage_id: 'CO_CREATE', label: '一起共创', weeks: '第 7-10 周', intent: '让孩子参与选择和安排。', small_action: '一起决定下一周想尝试的一件事。' },
      { stage_id: 'STABILIZE', label: '延续习惯', weeks: '第 11-13 周', intent: '保留适合家庭的做法。', small_action: '选出最想延续的一项家庭约定。' },
    ],
    next_action: '从本周的一件小行动开始。',
    weekly_action_handoff: {
      state: weeklyActionOpened ? 'OPENED' : 'READY_TO_OPEN',
      stage_id: 'SEE',
      label: '今天可以先试试',
      action: content.action,
      fallback: content.fallback,
      target_route: 'growth-daily-task',
    },
  };
}
