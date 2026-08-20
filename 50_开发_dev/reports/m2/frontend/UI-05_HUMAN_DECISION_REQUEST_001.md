# UI-05 Human Decision Request 001

## Purpose and Decision Boundary

本文是供架构师、业务负责人和合规责任人逐条审阅的 **人工决策请求清单**。本文不记录任何人工裁决，不代表任何人已经批准选项，也不授权进入 API Contract、数据库迁移、Web/API 业务代码或外部 effect。

本文件只覆盖当前仍为 `NEEDS_HUMAN_DECISION` 的 BQ-01~BQ-08、BQ-10。BQ-09 已由现有 SSOT 闭合，状态为 `CLOSED_BY_EXISTING_SSOT`，不纳入人工裁决清单。

> **Recommendation != Decision。** “Recommended Default” 仅是分析建议，不是决定；只有责任人逐条明确选择并留下可追溯记录后，相关 BQ 才能从 `NEEDS_HUMAN_DECISION` 转为允许重新评估的状态。

## Global Research and Needs Analysis Gate

所有 Family UI 在进入 BA Design、API Contract 或前后端开发之前，必须先完成：

```text
Broad Research
→ Needs Analysis
→ BA Design
→ Visual Baseline
→ Contract Plan
→ FE/BE Implementation
→ Consistency Tests
→ Playwright Screenshot Diff
→ Fix Loop
→ Git Commit/Push
```

研究和需求分析必须覆盖家庭教育真实场景、用户角色、榜样教育/波波校长及现有素材中的业务假设、34 UI 视觉线索、Family SSOT、数据对象、Named Action、Consent/Human Gate、Model Gateway、前后端一致性、测试和截图对标。

需求分析必须分别识别 `User Need`、`Business Need`、`Operational Need`、`Compliance Need`、`Data Need` 和 `AI Need`，并严格区分 `Fact`、`Perspective`、`Hypothesis`、`Recommendation`、`Decision`、`Action`，以及 `Read Projection`、`Controlled Draft`、`Named Action`、`External Effect`。

## Evidence Boundary

`30_素材_materials` 只读，优先使用 `30_素材_materials/_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt` 作为研究主证据。榜样教育、波波校长和其他自家材料最高按 **E1** 使用，只能形成业务假设、实践素材或设计输入，不能自证效果、诊断、资质、因果关系或生产事实。所有决策请求必须标明证据来源和证据等级，不得把内部材料互相引用后升级为外部事实。

## Current Status Summary

| BQ | 当前状态 | 是否进入人工请求 |
|---|---|---|
| BQ-01 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-02 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-03 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-04 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-05 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-06 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-07 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-08 | `NEEDS_HUMAN_DECISION` | 是 |
| BQ-09 | `CLOSED_BY_EXISTING_SSOT` | 否；仅作为未来阶段硬约束 |
| BQ-10 | `NEEDS_HUMAN_DECISION` | 是 |

当前总门禁保持：

```text
A_STAGE_VERDICT=NO_GO
API_CONTRACT_ALLOWED=NO
CODE_IMPLEMENTATION_ALLOWED=NO
EXTERNAL_EFFECT=HOLD
```

---

## BQ-01 — FamilyDecision 的正式对象归属

### Question

`family_service_decisions` 是否正式承载 UI-05 的 FamilyDecision，还是仅用于 Service Recommendation？

### Why Human Decision Is Needed

现有 SSOT 同时出现 FamilyDecision、服务推荐和 `family_service_decisions`。对象模型能说明 FamilyDecision 不等于执行，但尚未唯一确定 UI-05 的成长计划决定是否复用该共享表，以及如何与真人服务决定区分。该选择会影响对象语义、审计、查询边界和后续迁移判断。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 直接复用 `family_service_decisions`，不增加 UI-05 类型化上下文。 |
| B | 复用共享表，但强制增加或在契约 envelope 中表达 `decision_context=GROWTH_PLAN`，并区分 Service Recommendation。 |
| C | 为成长计划决定建立独立对象/表。 |

### Recommended Default（仅建议）

建议选择 **B**。共享能力优先，但必须用类型化上下文区分成长计划决定、服务推荐和履约启动；这只是建议，不是决定。

### Impact If Chosen

选择 A 会保留现有共享结构，但增加语义混淆风险。选择 B 会要求 API DTO、audit envelope、查询 projection 和测试都携带上下文。选择 C 会引入新对象生命周期、迁移、权限和重复能力建设。

### Risk

若成长计划决定被误当作 ServiceCase 或真人服务决定，可能绕过计划与服务边界，导致错误的状态写入或外部 effect。

### Required Follow-up Artifact

需形成 `UI-05 Decision Context ADR`、对象/字段映射、权限矩阵、audit envelope 示例和反向测试清单。未完成前保持 `NEEDS_HUMAN_DECISION`。

---

## BQ-02 — PlanDraft 与 orchestration_plans 的关系

### Question

`orchestration_plans` 的 `DRAFT/PROPOSED` 是否可以作为 UI-05 的 PlanDraft read projection？

### Why Human Decision Is Needed

现有 migration 将 `accepted_by_decision_ref` 与 OrchestrationPlan 联系起来，而 UI-05 需要在家庭明确决定之前展示草稿。必须由责任人明确草稿是独立 projection、受控 draft，还是某种 Plan 对象，避免展示层提前制造执行真相。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 直接复用 `orchestration_plans` 的 DRAFT/PROPOSED 记录。 |
| B | 建立只读 `GrowthPlanDraftProjection` adapter/fixture，决定前不写入 OrchestrationPlan。 |
| C | 新建独立 PlanDraft 核心对象并定义完整生命周期。 |

### Recommended Default（仅建议）

建议选择 **B**。首轮只提供带 source/version/evidence/expiry/visibility 的 read projection，不把草稿当成 Plan、Journey、Task 或 ServiceCase；这只是建议，不是决定。

### Impact If Chosen

选择 A 可减少表数量，但需要强约束 accepted 状态和写入入口。选择 B 需要 projection DTO、fixture、过期和安全停止状态。选择 C 会扩大首个纵切范围，新增迁移、生命周期和治理成本。

### Risk

如果 Controlled Draft 被当成核心 Plan 或执行真相，页面按钮可能绕过 FamilyDecision 直接创建 Journey、Task 或服务案例。

### Required Follow-up Artifact

需形成 `PlanDraft Lifecycle Decision`、PlanDraft DTO 草案、source/provenance 字段表、projection 与执行真相边界图。未完成前禁止 API Contract。

---

## BQ-03 — Growth Plan Consent Purpose

### Question

UI-05 应使用单一 `GROWTH_PLAN` Consent purpose，还是拆分计划读取、提交决定、儿童资料和服务承接用途？

### Why Human Decision Is Needed

现有授权实现存在服务 Consent 语义，但尚未形成 UI-05 专用 purpose registry。计划读取、家庭决定、儿童敏感资料和真人服务承接具有不同风险和主体，必须由责任人确认用途粒度、撤回行为和 fail-closed 规则。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 使用单一 `GROWTH_PLAN` purpose 覆盖所有用途。 |
| B | 至少拆分 `PLAN_READ`、`PLAN_DECISION`，并将 `CHILD_DATA`、`SERVICE_FOLLOWUP` 独立处理。 |
| C | 暂不允许 UI-05 动态计划读取和决定，只保留无敏感数据的静态画面。 |

### Recommended Default（仅建议）

建议选择 **B**。不同用途分别授权，撤回某一用途时只开放仍被允许的 projection；这只是建议，不是决定。

### Impact If Chosen

选择 A 实现较简单但扩大权限范围。选择 B 需要 purpose registry、endpoint/action 规则、subject/actor 绑定和负向测试。选择 C 会推迟动态化但风险最低。

### Risk

将计划读取、儿童数据和真人服务压缩到同一 Consent，可能导致越权展示、错误决定或隐私范围扩大。

### Required Follow-up Artifact

需形成 `UI-05 Consent Purpose Decision`、purpose registry、actor/subject/expiry/revoke 矩阵、CONSENT_REQUIRED 与 REVIEW_REQUIRED 状态清单。

---

## BQ-04 — ConfirmGrowthPlan 与 DecideGrowthService

### Question

`ConfirmGrowthPlan` 是否应成为正式 Named Action，还是复用现有 `DecideGrowthService`？

### Why Human Decision Is Needed

现有 `DecideGrowthService` 可能创建 FamilyDecision、OrchestrationPlan 或 ServiceCase，而 UI-05 首轮只允许 decision-only 边界。必须由责任人明确动作名称、注册位置、payload allowlist、guardian authorization 和禁止的下游对象。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 复用 `DecideGrowthService`。 |
| B | 新增或注册 `PROPOSE_GROWTH_PLAN_DECISION` / `CONFIRM_GROWTH_PLAN_DECISION`，首轮只做 decision-only readback。 |
| C | UI-05 只读，不提供任何 CTA action。 |

### Recommended Default（仅建议）

建议选择 **B**；若无法完成严格的 decision-only 隔离，则退回 C。不得让普通 CTA 直接调用执行型 `decide()`；这只是建议，不是决定。

### Impact If Chosen

选择 A 可能直接打开 Plan/Case 执行链。选择 B 需要 Named Action registry、幂等、审计、权限和回执。选择 C 可保持视觉和 projection 但不提供家庭决定闭环。

### Risk

Recommendation 或按钮点击被误当成 Decision/Action，会越过 Consent、Human Gate 和核心 Ontology 写入边界。

### Required Follow-up Artifact

需形成 `UI-05 Named Action Decision`、action registry 记录、payload allowlist、actor policy、idempotency/audit 示例和 external-effect negative tests。

---

## BQ-05 — FAMILY_DECISION_PENDING 的升级条件

### Question

`FAMILY_DECISION_PENDING` 只是 L2 candidate，还是正式 FamilyDecision？何时可以进入 `ACCEPTED_READBACK`？

### Why Human Decision Is Needed

页面 CTA、推荐草稿、候选决定和正式家庭决定具有不同语义。现有 SSOT 尚未给出 UI-05 pending candidate 到 accepted readback 的完整状态机、重复提交和撤回规则。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 点击 CTA 即形成正式 FamilyDecision。 |
| B | 先产生 L2 pending candidate，guardian 在 Consent、provenance 和版本有效后通过 Named Action 显式确认，形成 L3 readback。 |
| C | UI-05 永远只展示 PlanDraft，不产生 candidate。 |

### Recommended Default（仅建议）

建议选择 **B**；`ACCEPTED_READBACK` 仍不代表 Journey、Task、Intervention 或 ServiceCase 已执行。这只是建议，不是决定。

### Impact If Chosen

选择 A 最简单但会伪造家庭事实。选择 B 需要 candidate envelope、confirm/reject/pause/amend、version conflict、idempotency 和 audit。选择 C 会推迟决定闭环但风险最低。

### Risk

将 Recommendation、按钮点击或草稿展示为已确认，会导致核心事实污染和儿童/家庭数据治理失效。

### Required Follow-up Artifact

需形成 `UI-05 FamilyDecision State Machine Decision`、状态转移表、动作回执、撤回/暂停策略和并发版本测试方案。

---

## BQ-06 — UI-04 Report Snapshot Provenance

### Question

UI-04 explanation/recommendation 如何绑定 UI-05 的 `source_report_id`、report version、evidence_refs 和 uncertainty？

### Why Human Decision Is Needed

如果没有正式 provenance 规则，计划草稿可能把模型解释、模板文案或过期报告误写成家庭事实。现有对象和契约材料提供候选字段，但尚未形成 UI-05 必须遵守的最低完整性标准。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 只保存 `source_report_id`。 |
| B | 保存 report id、report version、evidence refs、uncertainty、projection version、policy version、consent ref、visibility 和 expiry。 |
| C | 首轮不承接 UI-04 动态内容，只展示固定静态模板。 |

### Recommended Default（仅建议）

建议选择 **B**；任何关键 provenance 缺失时返回 `REVIEW_REQUIRED/BLOCKED`，不推断补齐。这只是建议，不是决定。

### Impact If Chosen

选择 A 实现简单但无法处理报告版本和证据失效。选择 B 需要 DTO、fixture、source lineage、过期和冲突回执。选择 C 能减少风险但牺牲 UI-04→UI-05 动态承接。

### Risk

缺失来源、版本、证据或不确定性，会把 Hypothesis 或 Recommendation 伪装成 Fact、Decision 或 Outcome。

### Required Follow-up Artifact

需形成 `UI-04→UI-05 Provenance Decision`、字段必填表、source lineage、evidence/uncertainty policy 和 stale/version-conflict 测试矩阵。

---

## BQ-07 — Guardian Actor 与 Subject Visibility

### Question

当计划关注对象是儿童时，谁可以作为 actor 提交 FamilyDecision，`subject_person_id` 的可见和可操作范围是什么？

### Why Human Decision Is Needed

现有授权策略提供部分 guardian 边界，但 UI-05 仍需明确计划读取、决定提交、儿童可见性、敏感解释、跨家庭和 Consent 撤回时的业务规则。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 所有家庭成员均可读取和确认。 |
| B | OWNER_GUARDIAN/GUARDIAN 可读取和确认；family/actor/subject 由服务端派生；ADULT_MEMBER/CHILD_SUBJECT 默认不能确认；敏感内容走 Human Gate。 |
| C | 儿童主体可以自主确认自己的成长计划。 |

### Recommended Default（仅建议）

建议选择 **B**，并以 fail-closed 作为跨家庭、subject 不属于 family、Consent 撤回和敏感内容的默认行为。这只是建议，不是决定。

### Impact If Chosen

选择 A 扩大儿童数据和决定权限。选择 B 需要 guardian/subject visibility matrix、负向测试和 Human Gate 回执。选择 C 会显著增加未成年人自主决定和风险评估要求。

### Risk

客户端提交或覆盖 family、actor、subject，可能造成跨家庭访问、儿童敏感数据暴露或未经授权的家庭决定。

### Required Follow-up Artifact

需形成 `UI-05 Guardian and Subject Visibility Decision`、角色矩阵、scope policy、Consent/Human Gate 状态表和拒绝场景测试。

---

## BQ-08 — 90 天阶段/周/任务模板生命周期

### Question

3 大阶段、12 周、36 个任务和阶段文案是否全部属于 Recommendation/PlanDraft？哪些条件下可以进入未来 Journey/Task runtime？

### Why Human Decision Is Needed

3/12/36/90 是原 UI 的视觉和计划结构线索，但不能自动解释为效果承诺、诊断事实、评分或真实运行任务。必须由业务和架构责任人明确模板、运行时、证据、适用范围、Consent 和后续 Named Action 的分界。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | UI-05 点击时直接创建 Journey/Task runtime。 |
| B | UI-05 首轮仅展示 Recommendation/PlanDraft；Journey/Task 另行立项，经过独立 Named Action、模板/证据审查、Consent 和架构评审。 |
| C | 90 天内容永远保持静态说明，不进入任何 runtime。 |

### Recommended Default（仅建议）

建议选择 **B**。UI-05 只做受控计划结构投影，不创建 TaskInstance、Journey、Intervention、ServiceCase 或 Outcome。这只是建议，不是决定。

### Impact If Chosen

选择 A 会越过计划决定边界并产生真实运行对象。选择 B 保留后续演进空间但需要独立 UI-09/UI-31 纵切。选择 C 风险最低但无法形成成长流程闭环。

### Risk

把数字或视觉模板解释为效果、评分、排名、成功率、诊断事实或已完成任务，会误导家庭并污染核心 Ontology。

### Required Follow-up Artifact

需形成 `UI-05 Plan Template Lifecycle Decision`、Recommendation/PlanDraft/Runtime 分界图、模板版本和证据规则、后续 runtime Gate 清单。

---

## BQ-10 — 原图文案与 Projection 替换边界

### Question

原图中的阶段、周计划、任务和 CTA 文案，哪些是不可变 visual copy，哪些允许受控 projection 替换？

### Why Human Decision Is Needed

UI-05 必须完整复刻用户提供的原始画面，动态接线不能变成重新设计。当前已有视觉基线和原则，但尚未由责任人确认固定文案、可变字段、低清/截断文案和各字段对应的页面区域。

### Decision Options

| 选项 | 内容 |
|---|---|
| A | 所有画面文案都允许动态替换。 |
| B | 建立 Visual Copy Allowlist：结构、导航、卡片层级、CTA 位置、颜色/间距/图标位置和可辨固定文案不可变；仅允许 Contract 明确的 projection fields 替换。 |
| C | 全部保持静态，不接动态 projection。 |

### Recommended Default（仅建议）

建议选择 **B**。低清或截断区域不猜测扩写，保留原图可见文本或显示安全状态/`NEEDS_CONFIRMATION`。这只是建议，不是决定。

### Impact If Chosen

选择 A 会破坏视觉基线并扩大事实生成范围。选择 B 需要 DOM text manifest、field-to-region map、baseline screenshot manifest 和 desktop/mobile diff。选择 C 可确保视觉一致但不能验证动态能力。

### Risk

未经允许的动态文案可能把 Hypothesis、Recommendation 或模型生成文本写成事实，也可能造成原始布局和用户画面不一致。

### Required Follow-up Artifact

需形成 `UI-05 Visual Copy Allowlist Decision`、DOM text manifest、field-to-region mapping、静态/加载/空态/权限态/草稿/待确认/只读回显/暂停态截图 manifest。

---

## Request for Human Response

请对 BQ-01~BQ-08、BQ-10 **逐条**选择一个 Decision Option，并由责任人填写：

| 字段 | 要求 |
|---|---|
| BQ ID | 只能填写 BQ-01~BQ-08、BQ-10。 |
| Selected Option | 只能填写 A/B/C 或经记录的自定义选项。 |
| Decision Rationale | 说明业务、合规、数据和运营依据。 |
| Decision Owner | 填写实际责任人和角色。 |
| Evidence References | 填写可追溯来源；E1 材料不能作为自证事实。 |
| Effective Scope | 明确仅适用 UI-05 首轮还是共享平台能力。 |
| Reversible/Pause Policy | 说明如何撤回、暂停、修订和处理版本冲突。 |
| Decision Date/Version | 记录日期和决策版本。 |

在上述字段完成并通过 Research + Needs Analysis Gate 之前，所有 9 个 BQ 仍保持 `NEEDS_HUMAN_DECISION`，A_STAGE_VERDICT 仍为 `NO_GO`。

## Explicit Non-Authorization

本文件：

- 不记录人工裁决；
- 不把 Recommended Default 变成 Decision；
- 不授权进入 `UI-05_API_CONTRACT_001.md`；
- 不授权 API、DB migration、Web/API 业务代码或测试实现；
- 不授权创建 Journey、Task、Intervention、ServiceCase 或任何 External Effect；
- 不改变 UI-06 的未决状态；
- 不替代 Broad Research + Needs Analysis、BA Design、Visual Baseline 或架构评审。

## References

[1]: `reports/m2/frontend/UI-05_BLOCKING_QUESTIONS_DECISION_PACK_001.md`
[2]: `reports/m2/frontend/UI-05_BA_DESIGN_90_DAY_GROWTH_001.md`
[3]: `reports/m2/frontend/UI-05_BA_DESIGN_ARCHITECT_REVIEW_001.md`
[4]: `governance/FAMILY_34_UI_OBJECT_MODEL_AND_CONTRACT_DESIGN_001.md`
[5]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`
[6]: `database/migrations/0020_growth_orchestration_v1.sql`

**UI05_HUMAN_DECISION_REQUEST_READY** `reports/m2/frontend/UI-05_HUMAN_DECISION_REQUEST_001.md`
