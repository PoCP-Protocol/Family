# UI-05 Blocking Questions Decision Pack 001

> **阶段：** Stage A — UI-05 Architect Review BQ closure
>
> **Decision authority：** 本文不记录用户对 BQ 的逐条人工裁决。此前的设计建议不等于人工决定；需要人工决定的项目继续保持 `NEEDS_HUMAN_DECISION`。
>
> **总体结论：** `A_STAGE_VERDICT=NO_GO`。
>
> **代码门禁：** `NO_GO_FOR_CODE_IMPLEMENTATION`。

## Decision Method

本决策包使用对象级契约、34 UI master mapping、0020 migration、orchestration service、LLM page policy、家庭授权策略、Web route/page-object 测试和 UI-05 BA/Architect Review 作为 SSOT/工程来源。对原 SSOT 未能唯一决定的对象语义、Consent purpose、Named Action 和视觉替换边界，不得用设计建议冒充已决策；只有获得明确的逐条人工裁决后才能补足，本轮未获得该裁决。

`30_素材_materials` 及自家材料继续按 E1 使用，只作为业务假设和设计来源，不自证效果、诊断、资质或生产事实。所有裁决继续遵守：`Perspective != Fact`、`Hypothesis != Fact`、`Recommendation != Decision != Action`。

| Status | 含义 |
|---|---|
| `CLOSED_BY_EXISTING_SSOT` | 现有 SSOT/工程实现给出足够明确且可直接复用的决定。 |
| `NEEDS_HUMAN_DECISION` | 未获得人工决定，不得进入下一阶段。 |
| `DEFERRED` | 明确不进入本纵切，保持 HOLD。 |

## BQ-01 — FamilyDecision 的正式对象归属

**Question**

`family_service_decisions` 是否正式承载 UI-05 的 FamilyDecision，还是仅用于 Service Recommendation？

**Decision Source**

对象模型将 `FamilyDecision` 定义为家庭决定而非执行；0020 migration 的 `family_service_decisions` 已具备 `family_id`、`intent_ref`、`recommendation_ref`、`recommendation_version`、`decision_type` 和 `actor_person_id`；UI-05 master mapping 指向受保护的决定边界。

**Decision**

复用共享 `family_service_decisions`，但 UI-05 在后续契约中必须显式携带 `decision_context=GROWTH_PLAN` 或等价的类型化决定语义。不得把 UI-05 decision 混同为真人服务、Offer 履约或 ServiceCase 启动决定。

**Implementation Consequence**

Stage B API Contract 必须声明 `decision_context`、`source_page_id=UI-05`、`intent_ref`、`recommendation_ref/version`、actor、Consent 和审计字段。若现有表不能无歧义表达该上下文，允许在 API projection/audit envelope 中增加类型化字段；是否迁移仅由 Stage B contract gap 决定。

**Risk**

若省略上下文，仍可能导致服务候选决定和成长计划决定混淆。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需获得该 BQ 的明确逐条人工决策，且研究需求分析门禁闭合后，才能重新评估 Stage B。

## BQ-02 — PlanDraft 与 orchestration_plans 的关系

**Question**

`orchestration_plans` 的 `DRAFT/PROPOSED` 是否可以作为 UI-05 的 PlanDraft read projection？

**Decision Source**

对象模型规定 `OrchestrationPlan` 只在明确 Decision 后产生且不是真正执行事实；0020 schema 的 `accepted_by_decision_ref` 是必填；UI-05 mapping 只给出 `GrowthJourneyProjection` 和 `PLAN_ONLY` 上限。

**Decision**

首轮不直接写入或复用 `orchestration_plans` 作为决定前草稿真相。UI-05 使用 `GrowthPlanDraftProjection` adapter/fixture 作为只读、可过期、可追溯的 projection；它不是 OrchestrationPlan、Journey、Task 或 ServiceCase。

**Implementation Consequence**

Stage B 必须定义 `PlanDraftDto`，至少带 `source`、`projection_version`、`as_of`、`source_refs`、`policy_version`、`visibility`、`expires_at`、`consent_ref` 和安全停止状态。任何缺失 provenance 的草稿返回 `REVIEW_REQUIRED/BLOCKED`。

**Risk**

adapter 若泄露为可执行真相，会越过家庭决定边界。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策。

## BQ-03 — Growth Plan Consent purpose

**Question**

UI-05 应使用正式的 `GROWTH_PLAN` Consent purpose，还是拆分为读取计划、提交决定、儿童资料和服务承接等多个 purpose？

**Decision Source**

对象模型确认 Consent 是家庭范围权限前置且撤回立即 fail-closed；现有增长编排使用 `serviceConsentGranted`，但没有 UI-05 的正式 purpose registry。

**Decision**

采用分层 purpose：首轮最小使用 `PLAN_READ` 与 `PLAN_DECISION`；儿童敏感资料使用独立 `CHILD_DATA` purpose；真人服务/服务承接使用独立 `SERVICE_FOLLOWUP` purpose。`SERVICE` consent 不得替代上述所有授权。

**Implementation Consequence**

Stage B 必须定义每个 endpoint/action 所需 purpose、actor、subject、policy_version、有效期和撤回行为。缺少 `PLAN_READ` 时不返回含家庭计划内容的 projection；缺少 `PLAN_DECISION` 时 CTA 只能显示 `CONSENT_REQUIRED`，不得写 decision。

**Risk**

若 implementation 将多用途压缩为一个 consent，可能扩大儿童数据或真人服务的访问范围。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策，并完成 Consent 需求分析。

## BQ-04 — ConfirmGrowthPlan 与 DecideGrowthService

**Question**

`ConfirmGrowthPlan` 是否应成为正式 Named Action，还是复用现有 `DecideGrowthService`？

**Decision Source**

现有 `DecideGrowthService` 对非 dismiss 决定会创建 `family_service_decisions`、`orchestration_plans`，可能继续到 `service_cases`；UI-05 LLM policy 只允许 `READ_ONLY_ADMITTED_CANDIDATES`、`RETURN/PAUSE/NO_ACTION`。

**Decision**

首轮不复用会创建 Plan/Case 的 `DecideGrowthService` 执行路径。Stage B 定义 decision-only Named Action boundary：`PROPOSE_GROWTH_PLAN_DECISION` 与 `CONFIRM_GROWTH_PLAN_DECISION`（正式 code enum/名称以 API Contract 为准）。它只能创建或确认 FamilyDecision readback，不创建 Plan、Journey、Task、Intervention、ServiceCase，也不触发外部 effect。

**Implementation Consequence**

Stage B 必须定义该 action 的注册位置、guardian authorization、payload allowlist、idempotency、correlation、audit、NO_ACTION/PAUSE 和 version conflict 回执。Stage C 只能实现该受控 stub/approved action，不得将 UI-05 CTA 接到生产样式 `decide()`。

**Risk**

动作边界若模糊，CTA 可能误接到启动服务执行链的动作。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策，不得进入 API Contract。

## BQ-05 — FAMILY_DECISION_PENDING 的升级条件

**Question**

`FAMILY_DECISION_PENDING` 只是 L2 candidate，还是已经是正式 FamilyDecision？何时可以进入 `ACCEPTED_READBACK`？

**Decision Source**

对象模型规定 FamilyDecision 是决定而不是执行；synthetic decision path 可做到 `action_started=false`、`plan_id=null`、`case_id=null`；当前生产 `decide()` 没有 UI-05 pending endpoint/DTO。

**Decision**

采用两步边界：`FAMILY_DECISION_PENDING` 是 L2 candidate，不是 FamilyDecision 事实；只有 guardian 在具备 `PLAN_DECISION` consent、provenance/version 有效且 Named Action 成功后，才创建 L3 FamilyDecision readback。`ACCEPTED_READBACK` 仍不是 Plan/Case/Task 执行状态。

**Implementation Consequence**

Stage B 必须定义 candidate envelope、confirm action、重复提交幂等、拒绝/暂停/调整、版本冲突、审计和 readback source。按钮点击只产生 pending candidate；成功回执必须明确 `action_started=false`。

**Risk**

若前端把点击或 Recommendation 直接展示为“已确认”，会伪造家庭事实。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策。

## BQ-06 — UI-04 report snapshot provenance

**Question**

UI-04 explanation/recommendation 如何绑定 UI-05 的 `source_report_id`、report version、evidence_refs 和 uncertainty？

**Decision Source**

对象模型要求 read DTO 带 source/version/visibility/status；master mapping 要求 projection 带 source_refs、projection_version、as_of、policy_version 和 expires_at；现有 orchestration schema 没有 UI-05 专用 provenance DTO。

**Decision**

采用最小 `PlanDraftProvenance`：`source_report_id`、`source_report_version`、`evidence_refs`、`uncertainty`、`projection_version`、`as_of`、`policy_version`、`consent_ref`、`visibility`、`expires_at`。任一关键 source/version/evidence/consent 缺失时返回 `REVIEW_REQUIRED/BLOCKED`，不推断补齐。

**Implementation Consequence**

Stage B 必须把这些字段放入 PlanDraft read DTO，且只允许服务端生成。若既有 ReportSnapshot 无法提供其中必要字段，Stage B 记录 contract gap 并停止 Stage C，而不是补写事实。

**Risk**

provenance 不完整会把报告解释、模型文本或模板说明误升级为家庭事实。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策，并完成 provenance 需求分析。

## BQ-07 — guardian actor 与 subject visibility

**Question**

当计划关注对象是儿童时，谁可以作为 actor 提交 FamilyDecision，`subject_person_id` 的可见和可操作范围是什么？

**Decision Source**

现有授权策略允许 OWNER_GUARDIAN/GUARDIAN 执行增长决定，拒绝 ADULT_MEMBER/CHILD_SUBJECT；orchestration service 从 intent 服务端派生 subject；对象模型要求 family scope、subject visibility 和 Consent。

**Decision**

UI-05 的 plan read/decision actor 限定为 OWNER_GUARDIAN 或 GUARDIAN；ADULT_MEMBER 与 CHILD_SUBJECT 不能提交或确认决定。`family_id`、`actor_person_id`、`subject_person_id` 均由可信服务端上下文/intent 派生，客户端不可提交或覆盖。儿童敏感解释默认不向 child route 展示；涉及儿童敏感数据时按 `CHILD_DATA` + Human Gate fail-closed。

**Implementation Consequence**

Stage B/API tests 必须包含 guardian 正例、adult/child 拒绝、跨家庭拒绝、subject 不在家庭拒绝、Consent 撤回拒绝和 visibility/Human Gate 回执。

**Risk**

若 role、subject 或 visibility 未服务端派生，可能产生儿童敏感数据越权。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策。

## BQ-08 — 90 天阶段/周/任务模板生命周期

**Question**

3 大阶段、12 周、36 个任务和阶段文案是否全部属于 Recommendation/PlanDraft，哪些条件下可以进入未来 Journey/Task runtime？

**Decision Source**

BA Design 已将 3/12/36/90 限定为计划结构；UI-05 mapping 的状态上限为 `PLAN_ONLY`；对象模型要求 Plan/Task runtime 经明确 Decision 与受控服务动作。

**Decision**

UI-05 首轮的 3 阶段/12 周/36 任务/90 天均属于 Recommendation/PlanDraft presentation，不是结果承诺、诊断事实、真实 Journey 或 Task。任何 runtime Journey/Task 升级必须在 UI-09/UI-31 后续独立纵切中，经独立 Named Action、模板版本/证据/适用范围审查、Consent 和新架构评审后才能发生。

**Implementation Consequence**

Stage B/Stage C 只能返回 plan template projection 与状态说明；不得创建 `TaskInstance`、`Journey`、`Intervention`、`ServiceCase` 或完成/效果事实。数字字段不得被解释为评分、排名、成功率或承诺。

**Risk**

将视觉模板误写为运行时对象，会超出 UI-05 首轮范围并误导家庭。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策，runtime 继续 HOLD。

## BQ-09 — DEV/TEST no-op/stub 边界

**Question**

“开始执行计划”第一轮是否严格只记录 synthetic decision/no-op，不创建 Journey、Task、Intervention、ServiceCase，也不触发外部 effect？

**Decision Source**

现有 `recordSyntheticDecision()` 是 decision-only route，返回 `action_started=false`、`plan_id=null`、`case_id=null`；对象模型规定 `NO_ACTION` 不创建 Plan/Case/Task/Reminder；LLM policy 将 UI-05 限定为 `READ_ONLY_ADMITTED_CANDIDATES`。

**Decision**

UI-05 第一轮仅允许与现有 synthetic decision-only 语义等价的 no-op/fixture 回执，严格禁止调用会创建 Plan/Case 的生产样式 `decide()` 路径。

**Implementation Consequence**

后续 Stage C 的 action route 必须返回 `external_effect=false`、`action_started=false`、`plan_id=null`、`case_id=null`，并具备 idempotency、audit、scope、Consent 和负例测试。

**Risk**

若 Web CTA 误接入现有 `decide()`，会越过 UI-05 状态上限并启动服务执行链。

**Status**

`CLOSED_BY_EXISTING_SSOT`

**是否允许进入下一阶段**

否；当前 A_STAGE_VERDICT=NO_GO；该 SSOT 仅作为未来阶段的硬约束。

## BQ-10 — 原图文案与 projection 替换边界

**Question**

原图中阶段、周计划、任务和 CTA 文案哪些是不可变 visual copy，哪些允许受控 projection 替换？

**Decision Source**

UI-05 visual baseline 已定位；BA Design/Implementation Plan 已列出顶部结构、橙色阶段卡、3/12/36/90、四周卡片和 CTA；视觉门禁要求完整复刻；现有工程尚无 visual copy allowlist、DOM text manifest 或 screenshot diff artifact。

**Decision**

建立 Visual Copy Allowlist。不可变项包括：画面结构、导航、卡片层级、CTA 位置和 CTA 基本文案、统计区框架、颜色/间距/图标位置、原图可辨的固定说明。可替换项仅限已被 Contract 标记为 `projection_field` 的阶段标题、阶段目标、进度、周状态、版本/安全状态文案。低清或截断区域不得猜测扩写：保持原图可见文本或显示 `NEEDS_CONFIRMATION`/安全状态。

**Implementation Consequence**

Stage B 必须输出 DOM text manifest、field-to-region mapping 和 screenshot baseline manifest；Stage C 必须进行 desktop/mobile screenshot diff。未在 allowlist 中的动态替换视为视觉验收失败。

**Risk**

未受控动态文案可能破坏视觉基线，或将假设写成事实/效果承诺。

**Status**

`NEEDS_HUMAN_DECISION`

**是否允许进入下一阶段**

否；需先获得该 BQ 的明确逐条人工决策和视觉需求确认。

## Stage A Decision

| BQ | Status | 闭合来源 | 是否允许进入 Stage B |
|---|---|---|---|
| BQ-01 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 不足以唯一确定 GROWTH_PLAN context | 否 |
| BQ-02 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 不足以确定 PlanDraft projection 与 orchestration_plans 的边界 | 否 |
| BQ-03 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 未形成已批准的 UI-05 Consent purpose registry | 否 |
| BQ-04 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 未注册 UI-05 decision-only Named Action | 否 |
| BQ-05 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 未定义 UI-05 pending→readback 的正式状态机 | 否 |
| BQ-06 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 未提供 UI-05 PlanDraftProvenance 的完整决定 | 否 |
| BQ-07 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 未完成 UI-05 guardian/subject visibility 的业务裁决 | 否 |
| BQ-08 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 未批准 UI-05 90 天模板的 runtime 生命周期 | 否 |
| BQ-09 | `CLOSED_BY_EXISTING_SSOT` | 现有 synthetic decision-only 实现 | 否：A_STAGE_VERDICT=NO_GO |
| BQ-10 | `NEEDS_HUMAN_DECISION` | 现有 SSOT 未批准 UI-05 Visual Copy Allowlist | 否 |

```text
STAGE_A=NO_GO
STAGE_B=NO_GO
STAGE_C=NO_GO
NO_EXTERNAL_EFFECT_GUARANTEE=REQUIRED
```

Stage A 未闭合。现有 SSOT 仅能关闭 BQ-09；BQ-01~BQ-08、BQ-10 仍需要用户或架构师逐条明确裁决。全局研究与需求分析门禁也未闭合，因此不得进入 Stage B API Contract，不得以设计建议、研究门禁或此前聊天内容替代逐条业务裁决。

## Acceptance Conditions for Stage B

| 条件 | 必须满足 |
|---|---|
| Read projection | `PlanDraftDto` 有 source/version/provenance/visibility/expiry/consent。 |
| Decision boundary | `PROPOSE_GROWTH_PLAN_DECISION` 与 `CONFIRM_GROWTH_PLAN_DECISION` 不创建 Plan/Case/Task。 |
| Consent | `PLAN_READ`、`PLAN_DECISION` 及 `CHILD_DATA` / `SERVICE_FOLLOWUP` 分层，撤回 fail-closed。 |
| Scope | family、actor、subject 服务端派生；guardian-only decision。 |
| Audit | 记录 named_action、correlation_id、idempotency_key、policy_version、consent_ref、source/environment。 |
| Visual | 提供 allowlist、field-to-region map、DOM text manifest、baseline screenshot manifest。 |
| Safety | `external_effect=false`；无真实模型、预约、支付、通知、分享、真人服务。 |

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


## Research and Needs Analysis Gate

### Global Rule

所有 Family UI 在进入 BA Design、API Contract 或 FE/BE implementation 之前，必须完成并留存可追溯的广泛研究与需求分析。研究不是页面标题的补充说明，而是开发准入条件。每个 UI 必须完成：

```text
Broad Research
→ Demand and Needs Analysis
→ BA Design
→ Visual Baseline
→ Contract Plan
→ FE/BE Implementation
→ Consistency Tests
→ Playwright Screenshot Diff
→ Fix Loop
→ Git Commit/Push
```

不得因为 BQ-01~BQ-10 中存在部分 SSOT 或设计建议，就跳过研究与需求分析门禁；全局研究门禁不等于业务事实，也不等于人工批准对象语义、Consent purpose、Named Action 或视觉替换边界。BQ closure 只能关闭对象/动作/权限等架构问题，不能替代业务需求研究，也不能把研究假设直接升级为事实。

### Required Research Coverage

UI-05 的研究包必须覆盖并逐项记录来源、证据等级和未决项：

| 研究轨道 | 必须回答的问题 | 当前证据 | 当前状态 |
|---|---|---|---|
| 家庭教育真实场景 | 家长、儿童、家庭在 90 天陪跑中面对的真实场景、困难和可观察行为是什么？ | 现有家庭教育/白皮书材料有摘要，但尚未形成 UI-05 场景—需求—验收矩阵。 | `INCOMPLETE` |
| 用户角色 | OWNER_GUARDIAN、GUARDIAN、ADULT_MEMBER、CHILD_SUBJECT、教师/服务者各自的目标、权限和不可做事项是什么？ | 授权策略和对象文档已有部分边界。 | `PARTIAL` |
| 榜样教育/波波校长/现有素材 | 哪些是业务假设、实践素材、宣传表达，哪些不能作为效果或资质事实？ | 已声明 E1 边界，但尚未逐项映射到 UI-05 需求。 | `PARTIAL` |
| 34 UI 视觉线索 | UI-04 → UI-05 → UI-09/UI-31 的入口、返回、状态和内容承接是什么？ | UI-05 原图和全局 baseline 已定位。 | `PARTIAL` |
| Family SSOT | Family、Person、Need、Capability、Journey、Task、ServiceProvider、Evidence、Outcome 的关系是什么？ | 对象/契约文档已有候选映射。 | `PARTIAL` |
| 数据对象 | 哪些是 master/process fact、read projection、controlled draft、FamilyDecision 和 Action？ | BQ 已定义边界，但尚未形成完整 UI-05 data lineage matrix。 | `PARTIAL` |
| Named Action | 哪个 action 可以产生什么状态，谁能执行，如何撤回/暂停/幂等？ | BQ-04/BQ-05 已给出 decision-only 建议。 | `PARTIAL` |
| Consent/Human Gate | PLAN_READ、PLAN_DECISION、CHILD_DATA、SERVICE_FOLLOWUP 的 purpose、撤回和 Human Gate 条件是什么？ | BQ-03/BQ-07 已给出设计决定，尚缺完整需求验收证据。 | `PARTIAL` |
| Model Gateway | AI 是否参与解释/草稿，输入输出 schema、拒绝策略和禁止写入是什么？ | LLM page policy 已有边界，尚缺 UI-05 需求到 gateway schema 的映射。 | `PARTIAL` |
| 前后端一致性 | 页面字段、DTO、fixture、DB/read model、policy、audit 和错误状态如何一一对应？ | 一致性矩阵已指出 UI_READY_BACKEND_GAP。 | `INCOMPLETE` |
| 测试与截图对标 | 如何证明不是静态 mock，且 desktop/mobile 和交互状态复刻原图？ | 视觉门禁已有原则，尚缺 UI-05 完整 state manifest 和差异基线。 | `INCOMPLETE` |

### Required Needs Analysis Categories

UI-05 还必须建立需求矩阵，至少区分以下六类需求，不得用一条“用户想要成长”替代：

| 需求类型 | UI-05 必须明确 |
|---|---|
| `User Need` | 监护人希望理解当前成长方案、查看阶段/任务结构，并在充分知情后决定是否进入下一步。 |
| `Business Need` | 平台需要把成长解释、计划草稿、家庭决定和后续服务/任务链连接起来，但不制造效果承诺或服务履约事实。 |
| `Operational Need` | 需要版本、来源、状态、暂停、调整、撤回、幂等、审计、错误回执和 safe-stop。 |
| `Compliance Need` | 需要 family/tenant scope、guardian policy、purpose-limited Consent、儿童保护、Human Gate、E1 证据边界和无排名/总分。 |
| `Data Need` | 需要 PlanDraft projection、source_report/version、evidence_refs、uncertainty、Decision candidate/readback、visibility 和 as_of。 |
| `AI Need` | 仅允许 Model Gateway 进行解释/摘要/草稿/安全停止；不允许自由文本写入核心 Ontology、Plan、Task、Outcome 或诊断事实。 |

### Semantic Separation Matrix

在进入任何 API Contract 前，UI-05 需求包必须对下列概念逐项标注：

| 概念 | UI-05 允许表达 | 不得表达 |
|---|---|---|
| `Fact` | 已有、可追溯、权限允许的过程/配置事实 | 将模板或模型文本当家庭成长事实。 |
| `Perspective` | 家庭/用户对当前需要的看法 | 不得当作系统诊断。 |
| `Hypothesis` | 待验证的需求或实践假设 | 不得写成效果、资质或因果结论。 |
| `Recommendation` | 解释或计划草稿中的建议 | 不得直接成为 Decision/Action。 |
| `Decision` | guardian 经 Consent 和 Named Action 明确确认的决定回执 | 不得等同于 Journey/Task 已执行。 |
| `Action` | 已注册、受策略控制、可审计和幂等的 Named Action | 不得由自由文本或普通按钮直接触发核心写入。 |
| `Read Projection` | UI-05 首轮主要交付形式 | 不得冒充执行真相。 |
| `Controlled Draft` | 仅可撤回、可过期、带 provenance 的草稿 | 不得自动成为 Plan/Task/Intervention。 |
| `Named Action` | 受控 decision-only stub/approved action | 不得带来真实外部 effect。 |
| `External Effect` | 当前全部 HOLD | 不得执行通知、预约、支付、分享、真人联系或直播。 |

### Evidence Boundary

`30_素材_materials` 继续只读；优先使用 `30_素材_materials/_extracted/逐页文本_含页码/`，禁止使用 `all_materials.txt` 作为研究主证据。榜样教育、波波校长及其他自家材料最高按 E1 使用，只能作为业务假设、实践素材和设计输入，不能自证有效性、诊断、资质、效果或因果关系。研究文档必须逐项标注 `Fact / Perspective / Hypothesis / Recommendation`，不得将内部产出互相引用后当作外部验证。

### A Stage Verdict

BQ-01~BQ-10 的真实状态为：

```text
CLOSED_BY_EXISTING_SSOT=1
NEEDS_HUMAN_DECISION=9
DEFERRED=0
FORBIDDEN_HUMAN_DECISION_STATUS=ABSENT
```

本轮没有获得用户对任何 BQ 的逐条人工裁决；全局“广泛研究 + 需求分析”要求只是前置门禁，不构成 BQ 的人工决定。

但是，**研究与需求分析门禁尚未闭合**：家庭教育真实场景、六类需求矩阵、跨 UI 需求承接、完整 data lineage、Model Gateway schema、前后端一致性证据和截图状态 manifest 尚未形成一份可审计的 UI-05 Research/Needs Analysis Pack。因此本轮下一阶段许可必须被研究门禁覆盖：

```text
RESEARCH_NEEDS_ANALYSIS_GATE=REQUIRED_BEFORE_BA_API_OR_CODE
RESEARCH_NEEDS_ANALYSIS_GATE=NOT_CLOSED
A_STAGE_VERDICT=NO_GO
BQ_GATE=NO_GO_UNTIL_ALL_NON_SSOT_BQ_HAVE_EXPLICIT_HUMAN_DECISION_OR_EXISTING_SSOT_CLOSURE
STAGE_B_API_CONTRACT=NO_GO
STAGE_C_CODE_IMPLEMENTATION=NO_GO
UI06_SCOPE=STOPPED
CODE_STATUS=0
```

BQ-09 的既有 SSOT 闭合不改变其它 BQ 的未决状态。当前不得创建 `UI-05_API_CONTRACT_001.md`，不得修改业务代码、迁移、测试或 Web route；只有 BQ-01~BQ-10 全部由现有 SSOT 关闭，且研究与需求分析门禁闭合后，才可重新评估 Stage B。下一步只能补齐 UI-05 Research/Needs Analysis Pack，并再次经过架构/业务确认。

## Research Needs Analysis Acceptance Checklist

- [ ] 读取并登记家庭教育真实场景与角色行为证据。
- [ ] 读取并登记榜样教育/波波校长/现有材料的 E1 假设边界；不使用 `all_materials.txt`。
- [ ] 建立 User/Business/Operational/Compliance/Data/AI Needs 六类矩阵。
- [ ] 建立 Fact/Perspective/Hypothesis/Recommendation/Decision/Action 分层矩阵。
- [ ] 建立 Read Projection/Controlled Draft/Named Action/External Effect 状态上限矩阵。
- [ ] 建立 UI-04→UI-05→UI-09/UI-31 的需求、对象、状态和视觉承接表。
- [ ] 建立 UI-05 字段→DTO→fixture/read model→policy→audit→test 的前后端一致性矩阵。
- [ ] 建立 desktop/mobile、static/loading/empty/permission/consent/draft/pending/readback/pause 的截图验收 manifest。
- [ ] 研究包和需求包经架构师/业务负责人确认后，才能把 A_STAGE_VERDICT 改为 GO_FOR_STAGE_B_API_CONTRACT_ONLY。

**RESEARCH_NEEDS_ANALYSIS_GATE_READY** `reports/m2/frontend/UI-05_BLOCKING_QUESTIONS_DECISION_PACK_001.md`
