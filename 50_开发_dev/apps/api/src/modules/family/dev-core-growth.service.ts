import { Injectable } from '@nestjs/common';
import {
  DEV_CORE_GROWTH_SURFACES,
  type DevCoreGrowthCard,
  type DevCoreGrowthNoopCommandResult,
  type DevCoreGrowthProjection,
  type DevCoreGrowthSurface,
  type DevChildActionPrompt,
  type DevFamilyActionReview,
  type DevFamilyCompanionProgress,
  type DevFamilyGrowthReportDraft,
  type DevGrowthFocus,
  type DevGrowthProfileProgress,
  type DevGrowthPlanPreview,
  type DevServiceJourneyProjection,
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
    const focusSelected = flowEvents.some(
      (event) => event.ui_id === 'UI-02' && event.command === 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION' && Boolean(event.selection),
    );
    const planPreviewed = flowEvents.some(
      (event) => event.ui_id === 'UI-04' && event.command === 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT',
    );
    const weeklyActionOpened = flowEvents.some(
      (event) => event.ui_id === 'UI-05' && event.command === 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION',
    );
    const actionReviewReady = flowEvents.some(
      (event) => event.ui_id === 'UI-09' && event.command === 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW',
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
      cards: this.cards(focus, focusSelected, planPreviewed, weeklyActionOpened, actionReviewReady).map((item) => {
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

  getReportExplanation(
    familyId: string,
    onboardingId: string,
    insight: { parent_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; relationship_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; evidence?: readonly { evidence_id: string }[] },
    flowEvents: readonly { ui_id: string; command: string; selection?: string }[] = [],
  ) {
    const projection = this.getProjection(familyId, flowEvents);
    const card = projection.cards.find((item) => item.surface === 'UI-04');
    const report = card?.report_draft;
    const evidenceRefs = [
      ...(insight.parent_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.relationship_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.evidence ?? []).map((evidence) => evidence.evidence_id),
    ];
    return {
      projection_version: 'UI04_REPORT_EXPLANATION_V1',
      family_id: familyId,
      onboarding_id: onboardingId,
      report_snapshot_id: report?.report_id ?? null,
      source_insight_version: 'GROWTH_INSIGHT_V1',
      entry_state: report ? 'READY' : 'REVIEW_REQUIRED',
      state: report ? 'EXPLANATION_READY' : 'REVIEW_REQUIRED',
      title: report?.headline ?? '成长说明需要继续完善来源',
      observations: report?.observations.map((item) => ({
        label: item.label,
        detail: item.detail,
        kind: 'PERSPECTIVE' as const,
        evidence_refs: evidenceRefs,
      })) ?? [],
      hypotheses: report ? [{ text: report.summary, uncertainty: 'MEDIUM' as const, source_refs: evidenceRefs }] : [],
      recommendations: report ? [{ text: report.this_week_action.action, source: 'RULE_BASED' as const, status: 'DRAFT' as const, next_allowed_action: 'READ_ONLY' as const }] : [],
      evidence_lineage: evidenceRefs.map((evidenceId) => ({ evidence_id: evidenceId, source_ref: evidenceId, source_version: 'GROWTH_INSIGHT_V1', provenance_kind: 'STRUCTURED_EVIDENCE' as const })),
      consent_state: { required_purposes: ['PLAN_READ' as const, 'CHILD_DATA' as const], state: 'GRANTED' as const, policy_version: 'UI04_PLAN_READ_V1' },
      ai_ready: { evidence_boundary: 'EXPLANATION_IS_NOT_FACT_DIAGNOSIS_OR_OUTCOME' as const, recommendation_source: 'RULE_BASED' as const, model_gateway_status: 'NOOP_NOT_INVOKED' as const, agent_hint: report ? 'OFFER_PLAN_PREVIEW_ONLY' as const : 'HUMAN_REVIEW_REQUIRED' as const },
    };
  }

  getPlanPreview(
    familyId: string,
    onboardingId: string,
    insight: { parent_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; relationship_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; evidence?: readonly { evidence_id: string }[] },
    flowEvents: readonly { ui_id: string; command: string; selection?: string }[] = [],
  ) {
    const projection = this.getProjection(familyId, flowEvents);
    const card = projection.cards.find((item) => item.surface === 'UI-05');
    const preview = card?.plan_preview;
    const evidenceRefs = [
      ...(insight.parent_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.relationship_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.evidence ?? []).map((evidence) => evidence.evidence_id),
    ];
    return {
      projection_version: 'UI05_PLAN_PREVIEW_V1',
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: preview?.plan_id ?? `PLAN-DRAFT-${onboardingId}`,
      state: preview ? 'FAMILY_REVIEW' : 'REVIEW_REQUIRED',
      source_report_snapshot_id: preview?.plan_id ?? null,
      source_insight_version: 'GROWTH_INSIGHT_V1',
      focus: preview ? { dimension_id: preview.focus, label: preview.headline } : null,
      structure: { horizon_days: 90, checkpoints: ['3', '12', '36', '90'], stages: preview?.stages ?? [] },
      next_action: preview ? { text: preview.next_action, boundary: 'ACTION_CANDIDATE_IS_NOT_GROWTH_TASK_OR_OUTCOME' as const } : null,
      consent_state: { required_purposes: ['PLAN_READ' as const, 'PLAN_DECISION' as const, 'CHILD_DATA' as const], state: 'GRANTED' as const, policy_version: 'UI05_PLAN_PREVIEW_V1' },
      provenance: { source_refs: ['GROWTH_INSIGHT_V1'], evidence_refs: evidenceRefs, uncertainty: 'MEDIUM' as const, as_of: new Date().toISOString() },
      model_gateway_status: 'NOOP_NOT_INVOKED' as const,
      next_allowed_action: preview ? 'REQUEST_FAMILY_DECISION' as const : 'HUMAN_REVIEW_REQUIRED' as const,
    };
  }

  getServiceJourneyProjection(
    familyId: string,
    onboardingId: string,
    insight: { parent_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; relationship_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; evidence?: readonly { evidence_id: string }[] },
    flowEvents: readonly { event_id: string; ui_id: string; command: string; created_at: string; selection?: string }[] = [],
  ): DevServiceJourneyProjection {
    const plan = this.getPlanPreview(familyId, onboardingId, insight, flowEvents);
    const privateEvents = flowEvents
      .filter((event) => event.ui_id === 'UI-09' || event.ui_id === 'UI-06')
      .sort((left, right) => left.created_at.localeCompare(right.created_at))
      .slice(-6);
    const completedActions = privateEvents.filter((event) => event.ui_id === 'UI-09').length;
    return {
      projection_version: 'UI06_SERVICE_JOURNEY_V1',
      family_id: familyId,
      onboarding_id: onboardingId,
      source_plan_draft_id: plan.draft_id,
      state: plan.state === 'FAMILY_REVIEW' ? 'READY' : 'REVIEW_REQUIRED',
      visibility: 'FAMILY_PRIVATE',
      as_of: new Date().toISOString(),
      expires_at: null,
      service_cards: [
        { service_ref: 'FAMILY_COMPANION', label: '家庭陪伴说明', state: 'READ_ONLY', boundary: 'CATALOG_FIXTURE_NOT_HUMAN_COMMITMENT' },
        { service_ref: 'WEEKLY_REVIEW', label: '本周回顾入口', state: 'READ_ONLY', boundary: 'CATALOG_FIXTURE_NOT_HUMAN_COMMITMENT' },
        { service_ref: 'AI_REMINDER', label: '温和提醒', state: 'READ_ONLY', boundary: 'CATALOG_FIXTURE_NOT_HUMAN_COMMITMENT' },
        { service_ref: 'EXPERT_LIVE', label: '专家答疑', state: 'HOLD', boundary: 'CATALOG_FIXTURE_NOT_HUMAN_COMMITMENT' },
      ],
      process_summary: {
        label: completedActions > 0 ? `已留下 ${completedActions} 次家庭行动记录` : '从本周的一件小行动开始',
        completed_actions: completedActions,
        boundary: 'PROCESS_PROJECTION_NOT_SCORE_OR_OUTCOME',
      },
      private_feed: privateEvents.map((event) => ({
        entry_id: event.event_id,
        kind: event.ui_id === 'UI-06' ? 'CHECKIN_DRAFT' as const : 'ACTION_RECEIPT' as const,
        visibility: 'FAMILY_PRIVATE',
        text: event.ui_id === 'UI-06' ? '家庭已留下一个私有打卡草稿。' : '家庭已记录一次行动回顾。',
        provenance_ref: event.event_id,
      })),
      next_hint: {
        text: plan.next_action?.text ?? '从本周的一件小行动开始。',
        source: 'RULE_BASED',
        boundary: 'RECOMMENDATION_NOT_DECISION_OR_ACTION',
      },
      consent: { purpose: 'SERVICE_JOURNEY_READ', state: 'GRANTED', policy_version: 'UI06_SERVICE_JOURNEY_V1' },
      ai_ready: {
        model_gateway_status: 'NOOP_NOT_INVOKED',
        evidence_boundary: 'PROCESS_NOT_OUTCOME_OR_DIAGNOSIS',
        agent_hint: 'OFFER_PRIVATE_CHECKIN_DRAFT_ONLY',
      },
    };
  }

  getGrowthProfileReadback(
    familyId: string,
    onboardingId: string,
    insight: { parent_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; relationship_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; evidence?: readonly { evidence_id: string }[] },
    flowEvents: readonly { ui_id: string; command: string; selection?: string }[] = [],
  ) {
    const projection = this.getProjection(familyId, flowEvents);
    const profile = projection.cards.find((item) => item.surface === 'UI-07')?.growth_profile_progress;
    const plan = this.getPlanPreview(familyId, onboardingId, insight, flowEvents);
    const evidenceRefs = [
      ...(insight.parent_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.relationship_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.evidence ?? []).map((evidence) => evidence.evidence_id),
    ];
    return {
      projection_version: 'UI07_GROWTH_PROFILE_READBACK_V1',
      family_id: familyId,
      onboarding_id: onboardingId,
      visibility: 'FAMILY_PRIVATE',
      state: profile ? 'READY' : 'REVIEW_REQUIRED',
      focus: profile ? { dimension_id: profile.focus, label: profile.headline } : null,
      plan_context: plan.focus ? { draft_id: plan.draft_id, state: plan.state, horizon_days: plan.structure.horizon_days } : null,
      evidence_lineage: evidenceRefs.map((evidenceId) => ({ evidence_id: evidenceId, source_version: 'GROWTH_INSIGHT_V1' as const })),
      fact_boundary: 'FOCUS_AND_PLAN_CONTEXT_ARE_NOT_OUTCOME_OR_DIAGNOSIS',
      consent: { purpose: 'GROWTH_PROFILE_READ', state: 'GRANTED', policy_version: 'UI07_GROWTH_PROFILE_V1' },
      ai_ready: { model_gateway_status: 'NOOP_NOT_INVOKED', recommendation_boundary: 'READBACK_ONLY' },
    };
  }

  getFamilyReviewReadback(
    familyId: string,
    onboardingId: string,
    insight: { parent_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; relationship_profile_drafts?: readonly { evidence_snapshot?: { evidence_ids?: readonly string[] } }[]; evidence?: readonly { evidence_id: string }[] },
    flowEvents: readonly { event_id: string; ui_id: string; command: string; created_at: string; selection?: string }[] = [],
    journeyActions: readonly { action_id: string; journey_plan_id: string; journey_phase: string; day_index: number; completed_at: string; boundary: 'JOURNEY_ACTION_IS_PROCESS_NOT_OUTCOME' }[] = [],
  ) {
    const projection = this.getProjection(familyId, flowEvents);
    const review = projection.cards.find((item) => item.surface === 'UI-08')?.action_review;
    const plan = this.getPlanPreview(familyId, onboardingId, insight, flowEvents);
    const receiptActions = flowEvents
      .filter((event) => event.ui_id === 'UI-06' || event.ui_id === 'UI-09' || event.ui_id === 'UI-35')
      .map((event) => ({
        receipt_id: event.event_id,
        source_ui: event.ui_id,
        kind: event.ui_id === 'UI-06'
          ? 'PRIVATE_CHECKIN_DRAFT' as const
          : event.ui_id === 'UI-35'
            ? 'CAMP_DAILY_ACTION' as const
            : 'ACTION_RECEIPT' as const,
        occurred_at: event.created_at,
      }));
    const journeyRecordedActions = journeyActions.map((action) => ({
      receipt_id: action.action_id,
      source_ui: 'UI-09' as const,
      kind: 'JOURNEY_ACTION_RECEIPT' as const,
      occurred_at: action.completed_at,
      journey_plan_id: action.journey_plan_id,
      journey_phase: action.journey_phase,
      day_index: action.day_index,
      boundary: action.boundary,
    }));
    const recordedActions = [...receiptActions, ...journeyRecordedActions]
      .sort((left, right) => new Date(left.occurred_at).getTime() - new Date(right.occurred_at).getTime())
      .slice(-12);
    const evidenceRefs = [
      ...(insight.parent_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.relationship_profile_drafts ?? []).flatMap((draft) => [...(draft.evidence_snapshot?.evidence_ids ?? [])]),
      ...(insight.evidence ?? []).map((evidence) => evidence.evidence_id),
    ];
    return {
      projection_version: 'UI08_FAMILY_REVIEW_READBACK_V1',
      family_id: familyId,
      onboarding_id: onboardingId,
      visibility: 'FAMILY_PRIVATE',
      state: recordedActions.length > 0 ? 'ACTION_RECORDED' : review ? 'ACTION_RECORDED' : 'NO_ACTION_RECORDED',
      recorded_actions: recordedActions,
      reflection_prompt: review?.reflection_prompt ?? null,
      next_hint: plan.next_action ? { text: plan.next_action.text, source: 'RULE_BASED' as const, boundary: 'RECOMMENDATION_NOT_DECISION_OR_ACTION' as const } : null,
      evidence_lineage: evidenceRefs.map((evidenceId) => ({ evidence_id: evidenceId, source_version: 'GROWTH_INSIGHT_V1' as const })),
      fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME_OR_CHILD_DIAGNOSIS',
      consent: { purpose: 'GROWTH_REVIEW_READ', state: 'GRANTED', policy_version: 'UI08_GROWTH_REVIEW_V1' },
      ai_ready: { model_gateway_status: 'NOOP_NOT_INVOKED', reflection_boundary: 'PERSPECTIVE_NOT_FACT' },
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
    focusSelected: boolean,
    planPreviewed: boolean,
    weeklyActionOpened: boolean,
    actionReviewReady: boolean,
  ): Array<Omit<DevCoreGrowthCard, 'loop' | 'business_capability' | 'primary_objects' | 'state_boundary'>> {
    const reportDraft = buildReportDraft(focus, planPreviewed);
    const planPreview = buildPlanPreview(focus, planPreviewed, weeklyActionOpened);
    const actionReview = actionReviewReady ? buildFamilyActionReview(focus) : undefined;
    const companionProgress = actionReviewReady ? buildFamilyCompanionProgress(focus) : undefined;
    const childActionPrompt = actionReviewReady ? buildChildActionPrompt(focus) : undefined;
    const growthProfileProgress = focusSelected ? buildGrowthProfileProgress(focus) : undefined;

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
        summary: '展示家庭私有的行动节奏与回顾入口；行动记录不能证明成长效果。',
        next_hint: '可以按家庭节奏继续今天的行动，或先回看这一次陪伴。',
        command: { name: 'READ_SYNTHETIC_COMPANION_PROGRESS', mode: 'READ_ONLY' },
        ...(companionProgress ? { companion_progress: companionProgress } : {}),
      },
      {
        surface: 'UI-07', kind: 'MEMBERSHIP_READ', title: '我的成长档案', state: 'READ_ONLY',
        fact_boundary: 'ACTION_IS_NOT_OUTCOME', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '查看家庭已选择的关注方向，以及计划和回顾的回看入口。',
        next_hint: '从计划或家庭回顾中，选择下一步要看的内容。',
        command: { name: 'READ_SYNTHETIC_GROWTH_PROFILE_PROGRESS', mode: 'READ_ONLY' },
        ...(growthProfileProgress ? { growth_profile_progress: growthProfileProgress } : {}),
      },
      {
        surface: 'UI-08', kind: 'GROWTH_REVIEW', title: '家庭成长回顾', state: 'READ_ONLY',
        fact_boundary: 'ACTION_IS_NOT_OUTCOME', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '展示已记录行动后的家庭回顾提示；不把行动、感受或建议写成孩子的成长结果。',
        next_hint: '回到 90 天计划，按家庭节奏决定下一步。',
        command: { name: 'READ_SYNTHETIC_FAMILY_ACTION_REVIEW', mode: 'READ_ONLY' },
        ...(actionReview ? { action_review: actionReview } : {}),
      },
      {
        surface: 'UI-10', kind: 'CHILD_ASSISTANT_READ', title: '成长小助手', state: 'READ_ONLY',
        fact_boundary: 'PERSPECTIVE_NOT_FACT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '为家庭提供可选择的小行动提示；不评价孩子、不记录完成度，也不调用模型。',
        next_hint: '可以和孩子一起选择是否尝试，或今天先到这里。',
        command: { name: 'READ_SYNTHETIC_CHILD_ASSISTANT', mode: 'READ_ONLY' },
        ...(childActionPrompt ? { child_action_prompt: childActionPrompt } : {}),
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

function buildGrowthProfileProgress(focus: DevGrowthFocus): DevGrowthProfileProgress {
  const content = GROWTH_FOCUS_CONTENT[focus];
  return {
    state: 'FOCUS_SELECTED',
    focus,
    headline: '我们的成长档案',
    summary: `现在关注：${content.planHeadline}。可以回看计划，也可以看看最近的一次家庭回顾。`,
    plan_route: 'core-plan',
    review_route: 'growth-report',
    fact_boundary: 'FOCUS_SELECTED_NOT_OUTCOME',
  };
}

function buildChildActionPrompt(focus: DevGrowthFocus): DevChildActionPrompt {
  const content = GROWTH_FOCUS_CONTENT[focus];
  return {
    state: 'ACTION_RECORDED',
    focus,
    headline: '和孩子一起选一件小事',
    shared_action: `可以一起试试：${content.action}。让孩子选择一个觉得舒服的时刻开始。`,
    pause_hint: '如果今天已经很累，先到这里也可以。下次再选一个轻松的时刻。',
    action_route: 'growth-daily-task',
    fact_boundary: 'ACTION_RECORDED_NOT_CHILD_OUTCOME',
  };
}

function buildFamilyCompanionProgress(focus: DevGrowthFocus): DevFamilyCompanionProgress {
  const content = GROWTH_FOCUS_CONTENT[focus];
  return {
    state: 'ACTION_RECORDED',
    focus,
    headline: '本周，已经留下一次陪伴',
    confirmation: '今天的家庭行动已记录。每个家庭都可以按自己的节奏继续。',
    pace_hint: `如果还想再试试，可以从“${content.action}”开始；不合适时，先停一停也没关系。`,
    review_route: 'growth-report',
    action_route: 'growth-daily-task',
    fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME',
  };
}

function buildFamilyActionReview(focus: DevGrowthFocus): DevFamilyActionReview {
  const content = GROWTH_FOCUS_CONTENT[focus];
  return {
    state: 'ACTION_RECORDED',
    focus,
    headline: '把这一次的陪伴留在心里',
    confirmation: '今天的家庭行动已记录。先不用急着判断效果。',
    reflection_prompt: `可以想想：${content.action}时，你注意到了什么？`,
    next_step: '如果有一个做法想保留，下次可以再试一次；如果不合适，就换一个更轻松的时刻。',
    plan_route: 'core-plan',
    fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME',
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
