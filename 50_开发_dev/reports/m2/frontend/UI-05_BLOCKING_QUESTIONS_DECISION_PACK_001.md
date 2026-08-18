# UI-05 Blocking Questions Decision Pack 001

> **阶段：** Stage A — UI-05 Architect Review BQ closure
>
> **总体结论：** `NO_GO_FOR_CODE_IMPLEMENTATION`
>
> **原因：** BQ-01~BQ-10 中只有 BQ-09 能由现有 SSOT/工程代码完整闭合，其余问题至少包含对象语义、Consent purpose、provenance、Named Action 或视觉文案的人工决策。按门禁规则，未全部 `CLOSED_BY_EXISTING_SSOT` 前，不进入 Stage B API Contract，也不进入 Stage C 业务代码。

## Decision Method

本决策包只使用现有仓库 SSOT 和工程实现作为决策来源，包括对象级契约、34 UI master mapping、0020 migration、orchestration service、LLM page policy、家庭授权策略、Web route/page-object 测试和 UI-05 BA/Architect Review。`30_素材_materials` 及自家材料仍按 E1 处理，不自证效果、诊断、资质或生产事实。

状态含义如下：

| Status | 含义 |
|---|---|
| `CLOSED_BY_EXISTING_SSOT` | 现有 SSOT/工程实现已经给出足够明确且可直接复用的决定，不需要新增业务语义裁决。 |
| `NEEDS_HUMAN_DECISION` | 现有材料存在候选方向，但不能安全地替代架构师/业务负责人对对象、权限、Consent、Action 或视觉语义的决定。 |
| `DEFERRED` | 已明确暂不进入本纵切；该项保持 HOLD，不代表已批准实现。 |

## BQ-01 — FamilyDecision 的正式对象归属

**Question**

`family_service_decisions` 是否正式承载 UI-05 的 FamilyDecision，还是仅用于 Service Recommendation？

**Decision Source**

对象模型规定 `FamilyDecision` 属于 `family_id`，记录家庭决定而不是执行；0020 migration 将表命名为 `family_service_decisions`，要求 `intent_ref`、`recommendation_ref`、`recommendation_version`、`decision_type` 和 `actor_person_id`；master mapping 将 UI-05 的受控动作指向 `DecideGrowthService`；现有 orchestration service 的 `decide()` 会插入该表。

**Decision**

现有 SSOT 证明该表是家庭服务/候选决定的既有事实对象，但没有证明它已经正式覆盖 UI-05 的“90 天成长计划决定”语义。尤其现有表强绑定 `recommendation_ref` 和 service 命名，不能直接假定它等同于 UI-05 的 Plan Decision。

**Implementation Consequence**

需要架构师确认：复用并增加明确 `decision_context/type`，还是建立共享的类型化 FamilyDecision boundary。未确认前不得定义 UI-05 写 DTO、迁移或 controller。

**Risk**

将 Service Recommendation Decision 当成 Growth Plan Decision，可能导致错误的对象生命周期、错误的审计语义或过早创建 Plan/Case。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。BQ-01 未关闭，不允许进入 API Contract。

## BQ-02 — PlanDraft 与 orchestration_plans 的关系

**Question**

`orchestration_plans` 的 `DRAFT/PROPOSED` 是否可以作为 UI-05 的 PlanDraft read projection？

**Decision Source**

对象模型明确 `OrchestrationPlan` 只有在明确 Decision 后产生，且不是执行真相；0020 migration 的 `orchestration_plans.accepted_by_decision_ref` 为必填，默认状态为 `ACCEPTED`；master mapping 只给出 `GrowthJourneyProjection` 和 `PLAN_ONLY`，没有 UI-05 专用 PlanDraft DTO；现有 `decide()` 会在非 dismiss 决定后写入 Plan。

**Decision**

不能由现有 SSOT直接闭合。现有对象可作为共享 Plan/Projection 来源，但其 schema 与运行路径更接近“已接受的声明式计划”，不能直接证明它能安全承载 UI-05 的“决定前草稿”。

**Implementation Consequence**

必须先决定：UI-05 是否读取独立的 admitted candidate/plan draft projection，或由 adapter 从既有对象安全投影；必须定义 source/version/evidence/consent provenance 和 execution-truth 隔离。

**Risk**

把草稿误当成接受后的 Plan，可能越过家庭决定边界，或者让前端读到不可追溯的计划状态。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## BQ-03 — GROWTH_PLAN Consent purpose

**Question**

UI-05 应使用正式的 `GROWTH_PLAN` Consent purpose，还是拆分为读取计划、提交决定、儿童资料和服务承接等多个 purpose？

**Decision Source**

对象模型确认 Consent 是家庭范围的权限前置，撤回立即 fail-closed；现有 orchestration service 对增长需求使用 `serviceConsentGranted`；BA Design 提出 `GROWTH_PLAN`，但没有在现有 Consent registry/contract 中找到正式 purpose、授权主体、subject、有效期和撤回语义。

**Decision**

现有 SSOT 不足以确认 `GROWTH_PLAN` 是正式 purpose，也不足以确认读取、决定、儿童资料和服务承接是否共用授权。

**Implementation Consequence**

必须由架构/业务确认 Consent registry key、actor、subject_person、purpose、policy_version、expires/revoke 行为；在确认前 projection 和 write path 必须 fail-closed 或 REVIEW_REQUIRED。

**Risk**

同一 Consent 被过度复用，可能导致儿童数据、家庭决定和真人服务的授权范围越权。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## BQ-04 — ConfirmGrowthPlan 与 DecideGrowthService

**Question**

`ConfirmGrowthPlan` 是否应成为正式 Named Action，还是复用现有 `DecideGrowthService`？

**Decision Source**

master mapping 将 UI-05 指向 `DecideGrowthService`；家庭授权矩阵允许 OWNER_GUARDIAN/GUARDIAN 执行该动作；但现有 `decide()` 对非 dismiss 选择会创建 `family_service_decisions`、`orchestration_plans`，随后进行 T2 复验并可能创建 `service_cases`；现有 LLM policy 对 UI-05 仅允许 `RETURN/PAUSE/NO_ACTION`，状态上限为 `READ_ONLY_ADMITTED_CANDIDATES`。

**Decision**

不能安全地把现有 `DecideGrowthService` 直接接到 UI-05 CTA。它的实际执行路径高于 UI-05 第一轮允许的 PlanDraft/FamilyDecision boundary。现有 synthetic decision path 可记录 decision only，但它是测试循环动作，不等于正式 UI-05 action contract。

**Implementation Consequence**

必须确认正式 action 名称、payload、状态转移和执行上限；若首轮只允许 decision stub，应复用 synthetic no-op 语义或新增受控 action boundary，但不得调用会创建 Plan/Case 的生产样式 `decide()`。

**Risk**

“开始执行计划”可能直接创建 Plan、ServiceCase 或触发执行，违反 Recommendation → Decision → Action 分层和 UI-05 `PLAN_ONLY` 上限。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## BQ-05 — FAMILY_DECISION_PENDING 的升级条件

**Question**

`FAMILY_DECISION_PENDING` 只是 L2 candidate，还是已经是正式 FamilyDecision？何时可以进入 `ACCEPTED_READBACK`？

**Decision Source**

对象模型规定 FamilyDecision 是家庭决定，不是执行；BA state machine 将 pending 定为 candidate、accepted readback 定为 Named Action 成功后的 decision record；synthetic decision path 明确 `action_started=false`、`plan_id=null`、`case_id=null`；但现有生产 `decide()` 没有 UI-05 pending endpoint 或 pending DTO。

**Decision**

方向已经被 SSOT 约束，但正式 L2/L3 语义、事件名称、allowed transition 和 readback source 尚未在现有 contract 中闭合。

**Implementation Consequence**

API 前必须确定 candidate envelope、正式 decision record、重复提交、拒绝/暂停/调整、版本冲突、audit 和 idempotency 的边界。

**Risk**

把点击 CTA 直接显示为“已确认”，会将 Recommendation 或候选动作伪装成核心事实。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## BQ-06 — UI-04 report snapshot provenance

**Question**

UI-04 explanation/recommendation 如何绑定 UI-05 的 `source_report_id`、report version、evidence_refs 和 uncertainty？

**Decision Source**

BA Design 要求这些字段；对象模型要求读 DTO 带 source/version/visibility/status；master mapping 要求 projection 带 source_refs、projection_version、as_of、policy_version 和 expires_at；但现有 0020 schema 的 `orchestration_plans` 没有 `source_report_id`、evidence_refs、uncertainty 或 consent provenance，且没有 UI-05 专用 projection DTO。

**Decision**

现有 SSOT 只给出字段原则，没有给出可直接执行的 provenance contract。不能通过猜测填充。

**Implementation Consequence**

必须先建立 PlanDraft Provenance Matrix，并决定使用现有 ReportSnapshot reference、projection adapter 或最小迁移；缺失时只能返回 `BLOCKED/REVIEW_REQUIRED`。

**Risk**

计划草稿无法追溯到报告版本和证据，可能把模型建议当作家庭事实或永久计划来源。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## BQ-07 — guardian actor 与 subject visibility

**Question**

当计划关注对象是儿童时，谁可以作为 actor 提交 FamilyDecision，`subject_person_id` 的可见和可操作范围是什么？

**Decision Source**

家庭授权策略明确 `RequestGrowthHelp`、`ConfirmGrowthIntent`、`DecideGrowthService` 仅允许 OWNER_GUARDIAN/GUARDIAN，ADULT_MEMBER/CHILD_SUBJECT 一律 DENY；对象模型要求 Family scope、subject visibility 和 Consent；orchestration service 从 intent 派生 subject。但现有策略没有给 UI-05 单独定义 guardian purpose、儿童 subject visibility 或不同 Consent purpose 的组合规则。

**Decision**

角色门可以复用，但 UI-05 的 actor/subject/guardian/Consent 组合仍需要人工确认。

**Implementation Consequence**

API 必须服务端派生 actor/family/subject，并补充 guardian、目标儿童、家庭成员关系、儿童敏感数据和撤回的正负向测试。

**Risk**

家长可能对儿童数据或计划做超出授权范围的决定，或者儿童访问到不应显示的敏感解释。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## BQ-08 — 90 天阶段/周/任务模板生命周期

**Question**

3 大阶段、12 周、36 个任务和阶段文案是否全部属于 Recommendation/PlanDraft，哪些条件下可以进入未来 Journey/Task runtime？

**Decision Source**

BA Design 已将 3/12/36/90 限定为计划结构；对象模型规定 Plan 只有明确 Decision 后产生，Journey/Task 是后续运行对象；master mapping 将 UI-05 状态上限设为 `PLAN_ONLY`；但现有 SSOT 没有 90 天模板的版本、作者、证据、适用范围、审批或升级规则。

**Decision**

现有 SSOT 能闭合“首轮不创建 Journey/Task”，但不能闭合未来模板进入 runtime 的生命周期和审核规则。

**Implementation Consequence**

本轮应保持只读 projection/decision stub；未来 runtime 升级必须是独立 Named Action 和新的架构评审，不得在 UI-05 代码中隐式升级。

**Risk**

把视觉模板、任务计数或完成状态误写成真实干预、效果或 Outcome。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## BQ-09 — DEV/TEST no-op/stub 边界

**Question**

“开始执行计划”第一轮是否严格只记录 synthetic decision/no-op，不创建 Journey、Task、Intervention、ServiceCase，也不触发外部 effect？

**Decision Source**

现有 `recordSyntheticDecision()` 明确注释为 decision-only route，写入 `FamilyServiceDecision`，`action_started=false`、`plan_id=null`、`case_id=null`；其返回 `external_effect` 语义为测试回执且不执行；对象模型规定 `NO_ACTION` 不创建 Plan/Case/Task/Reminder；LLM policy 将 UI-05 限定为 `READ_ONLY_ADMITTED_CANDIDATES`，仅允许 RETURN/PAUSE/NO_ACTION。

**Decision**

可以闭合：UI-05 第一轮若进入受控 DEV/TEST stub，只能复用或等价于现有 synthetic decision-only 语义，严格禁止调用会创建 Plan/Case 的 `DecideGrowthService` 生产样式路径。

**Implementation Consequence**

若未来进入 Stage C，必须把 action route 限定为 `external_effect=false`、`action_started=false`、`plan_id=null`、`case_id=null` 的受控回执，并通过 idempotency、audit、scope、Consent 和负例测试。

**Risk**

如果 Web CTA 误接到现有 `decide()`，会越过 UI-05 状态上限并启动服务执行链。

**Status**

`CLOSED_BY_EXISTING_SSOT`

**是否允许进入下一阶段**

仅允许作为后续 Stage C 的硬约束；BQ-09 单项闭合不解除整体门禁。

## BQ-10 — 原图文案与 projection 替换边界

**Question**

原图中阶段、周计划、任务和 CTA 文案哪些是不可变 visual copy，哪些允许受控 projection 替换？

**Decision Source**

UI-05 原图已定位，BA Design 和 Implementation Plan 已列出顶部结构、橙色阶段卡、3/12/36/90、四周卡片和 CTA；视觉门禁要求完整复刻原画面；BA Design 对第 2 周低清进度和第 4 周截断文案标记 `NEEDS_CONFIRMATION`，不得猜测补写。但现有工程没有 visual copy allowlist、DOM text manifest 或 screenshot diff acceptance artifact。

**Decision**

视觉结构可以由现有 baseline 闭合；动态文案替换许可和低清/截断文本的正式 allowlist 不能由现有 SSOT 完整闭合。

**Implementation Consequence**

API/FE Contract 前必须建立 visual copy allowlist、DOM text coverage 和 screenshot baseline manifest；证据不足的文案保持原图或 `NEEDS_CONFIRMATION`，不动态生成。

**Risk**

动态数据接入可能改写原文案、破坏画面结构，或把假设性阶段目标写成诊断/效果事实。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否。

## Stage A Decision

| BQ | Status | 是否由现有 SSOT 完整闭合 |
|---|---|---|
| BQ-01 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-02 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-03 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-04 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-05 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-06 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-07 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-08 | `NEEDS_HUMAN_DECISION` | 否 |
| BQ-09 | `CLOSED_BY_EXISTING_SSOT` | 是 |
| BQ-10 | `NEEDS_HUMAN_DECISION` | 否 |

由于 BQ-01~BQ-10 并非全部 `CLOSED_BY_EXISTING_SSOT`：

```text
STAGE_A=NO_GO
STAGE_B=NOT_STARTED
STAGE_C=NOT_STARTED
NO_GO_FOR_CODE_IMPLEMENTATION
```

本轮只允许提交本 Decision Pack；不创建 UI-05 API Contract，不修改业务代码，不新增 DB migration，不接 Web API，不运行 UI-05 runtime。

## Required Human Decisions

架构师/业务负责人需要对 BQ-01、BQ-02、BQ-03、BQ-04、BQ-05、BQ-06、BQ-07、BQ-08、BQ-10 作出明确决定。决定应至少包含对象归属、Consent purpose、actor/subject、provenance、Named Action、状态转移和 visual copy allowlist；不能只回复“同意继续”。

**UI05_BLOCKING_DECISION_PACK_READY** `reports/m2/frontend/UI-05_BLOCKING_QUESTIONS_DECISION_PACK_001.md`

## References

[1]: `reports/m2/frontend/UI-05_BA_DESIGN_ARCHITECT_REVIEW_001.md`
[2]: `reports/m2/frontend/UI-05_BA_DESIGN_90_DAY_GROWTH_001.md`
[3]: `reports/m2/frontend/UI-05_IMPLEMENTATION_PLAN_001.md`
[4]: `governance/FAMILY_34_UI_OBJECT_MODEL_AND_CONTRACT_DESIGN_001.md`
[5]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`
[6]: `database/migrations/0020_growth_orchestration_v1.sql`
[7]: `apps/api/src/modules/orchestration/orchestration.service.ts`
[8]: `apps/api/src/modules/orchestration/llm-gateway/family-llm-page-policy.ts`
[9]: `apps/api/src/modules/auth/family-authorization.policy.ts`
[10]: `apps/web/src/test-loop.js`
[11]: `apps/web/src/test-loop.page-objects.spec.ts`
