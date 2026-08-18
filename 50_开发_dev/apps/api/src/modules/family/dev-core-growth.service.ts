import { Injectable } from '@nestjs/common';
import {
  DEV_CORE_GROWTH_SURFACES,
  type DevCoreGrowthCard,
  type DevCoreGrowthNoopCommandResult,
  type DevCoreGrowthProjection,
  type DevCoreGrowthSurface,
} from '@family/contracts';

/**
 * DEV Core Growth adapter for UI-02..UI-10.
 * It deliberately has no repository, transaction, outbox consumer, model call or external adapter.
 * Values demonstrate the existing Family Growth OS lineage only and must never be treated as family facts.
 */
@Injectable()
export class DevCoreGrowthService {
  getProjection(familyId: string): DevCoreGrowthProjection {
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
      cards: this.cards(),
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

  private cards(): DevCoreGrowthCard[] {
    return [
      {
        surface: 'UI-02', kind: 'ASSESSMENT_ENTRY', title: '家庭成长测评入口', state: 'READY',
        fact_boundary: 'PERSPECTIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'DEV 演示从家庭场景进入成长 Onboarding；输入只形成 Perspective/受控草稿。',
        next_hint: '可进入测评草稿，不生成诊断结论。',
        command: { name: 'START_SYNTHETIC_ASSESSMENT_DRAFT', mode: 'CONTROLLED_DRAFT' },
      },
      {
        surface: 'UI-03', kind: 'ASSESSMENT_DRAFT', title: '家庭测评草稿', state: 'DRAFT',
        fact_boundary: 'PERSPECTIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '已选择“亲子沟通”作为 DEV 示例关注维度；它不是儿童或家庭的真实判断。',
        next_hint: '草稿可被安全读取；确认与持久化不在此 no-op adapter 执行。',
        command: { name: 'SAVE_SYNTHETIC_ASSESSMENT_DRAFT', mode: 'NOOP_NOT_PERSISTED' },
      },
      {
        surface: 'UI-04', kind: 'REPORT_EXPLANATION', title: '成长说明', state: 'READ_ONLY',
        fact_boundary: 'PROFILE_IS_INTERPRETIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '报告仅解释 Profile draft、证据限制和候选重点；不输出诊断、预测或效果承诺。',
        next_hint: '下一步需要经受控确认形成 Growth Priority。',
        command: { name: 'READ_SYNTHETIC_REPORT_EXPLANATION', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-05', kind: 'PLAN_DRAFT', title: '90 天成长方案', state: 'DRAFT',
        fact_boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'DEV 视图展示 SEE、PARENT_FIRST、CO_CREATE、STABILIZE 四阶段计划结构；不代表已确认计划。',
        next_hint: '计划草稿可衔接已有 Intervention → GrowthAction 任务链路。',
        command: { name: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', mode: 'CONTROLLED_DRAFT' },
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
    ];
  }
}
