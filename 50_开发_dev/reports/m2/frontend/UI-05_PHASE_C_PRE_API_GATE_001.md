# UI-05 Phase C Pre-API Gate 001

## Research/Needs summary

UI-05 为 90 天成长陪跑/社群服务页面。研究必须覆盖家庭教育真实场景、家长/孩子/教练/顾问角色、90 天共同成长设计、服务/社群边界、家校协同和退出/暂停。已推送的 UI-05 BA、Architect Review、Decision Pack 只能作为已有研究和门禁记录，不替代新的需求确认。30_素材_materials 只读，优先逐页文本；榜样教育/波波校长和自家材料最高 E1，仅作 Hypothesis/Design Input。

Needs 分为：User Need=理解陪跑内容、当前阶段和可选择帮助；Business Need=形成持续成长服务关系；Operational Need=计划/服务/社群交付、反馈和质量记录；Compliance Need=儿童数据、家庭 Consent、真人服务和外部 effect；Data Need=FamilyContext、GrowthPlan、CommunityThread、ServiceRecord、Consent、Evidence；AI Need=解释/草稿/提醒候选，经 Model Gateway，不自动执行。

## BA Design summary

页面目标是承载 90 天成长旅程、阶段/周结构、陪跑/社群服务信息和受控回顾入口。候选对象为 FamilyContext、GrowthPlan/PlanDraft、GrowthJourney、GrowthTask candidate、CommunityThread、ServiceProvider/Coach、ServiceRecord、Reflection、Evidence、ConsentGrant、HumanGateReview。页面可展示 projection/draft，但不能把服务承诺、打卡、完成或反馈自动写成 Outcome/Fact。

建议状态：`PLAN_READ → FAMILY_REVIEW → DECISION_PENDING → CONFIRMED_READBACK → ACTIVE_PROJECTION → PAUSED/AMENDMENT_DRAFT/REVIEW_REQUIRED`。真实服务交付、通知、预约、直播、支付和外发分享均保持 HOLD。

## Visual Fidelity Brief summary

Baseline 由 Phase A ledger/global crosswalk 和 UI-05 `growth-plan-90day-reference-434x1130.png`/相关 UI-05 视觉证据指定；必须核对标题、阶段卡、3/12/36/90 结构、时间线/周卡、任务状态、陪跑/社群卡片、底部 CTA、返回/调整入口、空态/权限态/Consent blocked 和移动端尺寸。必须先完整复刻原画面，再接受控 projection；没有开发后运行截图，不伪造 visual difference comparison。

## Object model candidates

`FamilyContext`、`PlanDraft`、`GrowthPlan`、`GrowthJourney`、`GrowthTaskCandidate`、`FamilyDecision`、`CommunityThread`、`ServiceProvider`、`ServiceRecord`、`Reflection`、`Evidence`、`ConsentGrant`、`HumanGateReview`。正式 Journey/Task/Intervention 只能由后续受权 Named Action 创建。

## Read Projection vs Named Action boundary

允许：90 Day PlanDraft/read projection、阶段与任务候选、服务/社群目录 projection、确认/暂停/调整的 pending candidate。候选动作：`ProposeFamilyDecision`、`ConfirmGrowthPlanDecision`、`PauseGrowthPlanDecision`、`AmendGrowthPlanDraft`；首轮只允许 decision-only/no-op 或现有批准的 synthetic stub，不能创建真实 Journey/Task/Intervention/ServiceCase，也不能触发外部 effect。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

`PLAN_READ`、`PLAN_DECISION`、`CHILD_DATA`、`SERVICE_FOLLOWUP` 和 Community/Media purpose 必须分离。儿童风险、敏感干预、真人服务、预约、通知、直播、支付、日历、视频、分享必须 Human Gate 或 L4 HOLD。AI 经 Model Gateway + schema/policy 只能生成解释、提醒候选和 Controlled Draft；服务/媒体/日历数据经 Adapter，不能直接写 Ontology。

## Backend/API dependency candidates

仅列候选：GrowthPlanDraftProjectionService、FamilyDecisionBoundaryService、Journey/Task read projection、Community/ServiceRecord projection、Consent/authorization policy、Human Gate review、Model Gateway orchestration、Ontology/External Effect Adapter、Audit/idempotency/correlation service、synthetic fixture。当前不定义 endpoint、DTO 或 API Contract。

## Architect Review verdict

```text
NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

该结论继承 UI-05 Architect Review 和 Decision Pack：Broad Research + Needs Analysis 是 BA Design 前置门禁，不等于人工裁决；现有 BQ 中仍有 `NEEDS_HUMAN_DECISION`，因此不得进入 API Contract。

## Blocking Questions

1. 90 天成长计划、陪跑服务和社群线程的 Domain SSOT 是否已经分开并可共享投影？
2. PlanDraft、FamilyDecision、GrowthJourney、GrowthTask、ServiceRecord 的生命周期和升级边界是什么？
3. `PLAN_READ`、`PLAN_DECISION`、`SERVICE_FOLLOWUP`、`CHILD_DATA` Consent purpose 如何分离？
4. Guardian/child/coach/advisor 的 visibility 和 action 权限如何服务端派生？
5. 3/12/36/90、阶段任务、打卡和陪跑反馈哪些是结构 copy，哪些可动态替换？
6. 服务/社群卡片是目录 projection、推荐还是已购买/已预约事实？
7. AI 提醒、反馈摘要和阶段建议是否只能 Controlled Draft，如何经过 Model Gateway/Human Gate？
8. Pause/Amend/Revoke、版本冲突、Consent 撤回和真人服务升级路径如何审计？
9. 预约、通知、直播、支付、分享、日历/视频是否全部保持 no-op/HOLD？

## Screenshot gate

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Required tests/screenshot diff preparation

后续需准备 plan/provenance、decision candidate/confirm、guardian scope、Consent 缺失/撤回、Community/Service visibility、pause/amend/revoke、no Journey/Task/ServiceCase creation、idempotency、audit、Model Gateway schema rejection、API/Web contract、原图 DOM text、desktop/mobile screenshot 和静态/加载/空态/待确认/确认回显/暂停调整状态 diff。当前无运行截图，不得进行 visual difference comparison。
