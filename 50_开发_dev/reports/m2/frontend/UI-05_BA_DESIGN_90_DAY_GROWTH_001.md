# UI-05 BA Design: 90 Day Growth Plan

> **Design Gate 状态：** `BA_DESIGN_COMPLETE_PENDING_ARCHITECT_BUSINESS_CONFIRMATION`
>
> **页面：** UI-05 / 90 天成长方案
>
> **设计原则：** 先完成家庭教育业务设计，再进入 Visual Baseline、Contract Plan、FE/BE Implementation；本文件不是代码完成声明。

## Scope

UI-05 承载的是家庭在阅读 UI-04 报告解释后，对一份**90 天家庭成长计划草稿**进行理解、确认、暂停或调整的页面。第一轮业务设计只覆盖计划草稿的可读投影、家庭选择边界和可逆状态，不把页面上的计划内容直接写成 Journey、Task、Intervention、ServiceCase 或教育效果事实。

页面范围包括：当前阶段与目标、3 个大阶段/12 周计划/36 个任务/90 天陪伴的结构化摘要、周计划卡、任务状态的受控投影、家庭确认入口、暂停/调整/不继续入口、来源与不确定性说明。页面不负责真实真人陪跑、通知、预约、支付、外发分享、效果证明或跨家庭比较。

## Source Research

### Evidence boundary

本轮研究优先使用：

1. `30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt`；
2. `30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt`；
3. `30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt`；
4. `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md` 的 UI-05 canonical baseline；
5. `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md` 的对象/API/Named Action 映射；
6. `governance/FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md` 的前后端一致性准入规则；
7. `apps/web/public/bangyang-reference/growth-plan-90day-reference-434x1130.png` 的视觉基线。

`30_素材_materials` 只读。优先使用 `_extracted/逐页文本_含页码/` 逐页文本；本轮不使用 `all_materials.txt`，也不把原始 PPT、用户讨论或本项目自己的设计文档当作外部事实证明。

### Evidence classification

| 证据 | 使用方式 | 上限 |
|---|---|---|
| UI-05 单图与 canonical baseline | 视觉结构、可见文案、控件、入口/出口和不确定项 | 可证明页面暴露点，不证明业务效果或生产授权。 |
| 新商业模式对外宣发第 1/4/7/17 页 | 家庭成长平台、父母二次成长、90 天陪跑作为业务设计输入 | E1；只能形成需求假设和设计来源。 |
| 战略白皮书第 4/6/9/11/12/14/15/17/18/19/28/29 页 | 家庭痛点、成长旅程、行为记录、标准化交付、AI 辅助位置 | E1；不能自证有效性或诊断事实。 |
| 家庭教育大模型平台合作方案第 5/6/8/9 页 | 知识库、Agent、数据结构和快速验证的产品设计输入 | E1；不构成真实模型、真人服务或外呼授权。 |
| 用户原图/项目内部材料 | 需求与视觉来源 | 自家材料最高 E1，不能自证成立。 |

本设计严格区分：`Perspective != Fact`、`Hypothesis != Fact`、`Recommendation != Decision != Action`。本文件中的“家庭需要”“阶段目标”“可见改变”均为 BA 设计假设或受控投影语义，不是系统已经证明的事实。

### Research findings translated for BA

优先材料反复表达三类设计输入：第一，家庭入口应从现实问题进入，而价值不应停留在单次课程交易；第二，家长需要低负担、可执行、可反馈的家庭行动节奏；第三，90 天陪跑应沉淀为家庭可见的计划、过程记录和可暂停的陪伴关系。上述内容支持 UI-05 做“家庭计划理解与选择”页面，但不支持自动诊断、效果承诺或自动执行。

## 90 Day Growth Design

### Design hypothesis

UI-05 的业务假设是：家庭在阅读受控报告解释后，需要一个可理解、可调整、可暂停的阶段性计划草稿，用于回答“当前关注什么、接下来分几段、每周做什么、是否愿意继续”。页面以家庭共同决定为边界，不以系统排名、总分或模型结论替代家庭判断。

### 90-day structure

| 层级 | BA 设计 | UI-05 可见承载 | 事实边界 |
|---|---|---|---|
| 90 天 | 一个家庭计划草稿周期 | “90天成长方案”“90天陪伴” | 只表示计划结构，不表示 90 天效果。 |
| 3 大阶段 | 关系/行为/习惯与情绪等阶段性主题 | 3 大阶段统计与阶段概览 | 阶段主题是推荐/草稿，不是儿童永久标签。 |
| 12 周计划 | 每周一个低负担行动主题 | 12 周计划统计和周卡片 | 周计划来自受控 projection，不自动写 Task。 |
| 36 个任务 | 每周任务模板候选 | 36 个任务统计、任务行 | 任务只有在后续受权 Named Action 后才可成为运行对象。 |
| 当前首屏 | 亲子沟通修复期、提升沟通+建立习惯 | 橙色阶段卡 | 是计划草稿文案，不是诊断结论或效果承诺。 |

### Household growth focus

本页主要支持 **Relationship Growth** 与 **Parent Second Growth** 的理解和选择，并间接支持 Child Growth 的家庭协作场景。第一轮不对孩子进行能力、情绪、风险或健康诊断；不显示跨家庭平均、不生成 Family Total Score、不做排名。

### User scenarios

家长可以阅读当前阶段、周计划和任务状态，选择“继续了解/提出家庭决定”“先不继续”“暂停”或“调整计划”。孩子不是默认直接行动主体；涉及儿童直接输入、敏感材料或真人服务时，需要独立 Consent 和 Human Gate。

## BA Object Model

| 对象 | UI-05 作用 | 来源/边界 |
|---|---|---|
| `Family` | 数据所有权和页面 scope 根 | 服务端派生，不接受客户端覆盖。 |
| `Person` / `subject_person` | 计划关注对象 | 受 Family membership、角色和 visibility 校验。 |
| `GrowthNeedSignal` | 上游候选需要 | 只能作为解释输入，`canonical_family_fact=false`。 |
| `GrowthIntent` | 家庭明确关注方向 | 由家庭确认后存在；不是 AI 自由文本直接生成的核心事实。 |
| `SupportReportSnapshot` / `source_report_id` | UI-04 解释来源 | 必须记录版本、来源和不确定性。 |
| `Recommendation` | 计划候选来源 | 只能是 Recommendation，不是 Decision/Action。 |
| `PlanDraft` / `OrchestrationPlan` | UI-05 读投影 | 声明式 steps；不等于执行真相。 |
| `FamilyDecision` | 家庭接受、调整、拒绝或暂停的决定 | 记录 actor、family、source、version、consent、reason、audit。 |
| `Journey` / `Task` / `Intervention` | 后续运行对象 | UI-05 第一轮禁止自动创建。 |
| `Consent` | AI、儿童材料、服务/陪跑等目的授权 | 缺失或撤回时 fail-closed。 |
| `Evidence` / `Uncertainty` | 解释来源和限制 | 不把材料或模型输出写成事实。 |
| `Named Action` | 受控状态改变入口 | DEV/TEST 可用 no-op/stub；必须有 policy、idempotency 和 audit。 |
| `Outcome` | 未来回访/结果对象 | 本页不生成，不把完成度当作 Outcome。 |

## State Machine

### Page and plan states

| 状态 | 进入条件 | UI 可见表达 | 允许写入上限 | 退出 |
|---|---|---|---|---|
| `BLOCKED` | scope、来源、evidence、consent 或 policy 不满足 | 保留原页面骨架，显示安全停止/需确认 | 0 | `RETURN` / `NO_ACTION` |
| `DRAFT_READY` | 有受控 plan draft projection | 当前阶段、统计、周卡片 | L1 read projection | `FAMILY_DECISION_PENDING` / `PAUSE` |
| `FAMILY_DECISION_PENDING` | 家庭点击继续/确认候选 | 待家庭确认，不显示已执行 | L2 candidate + audit | `ACCEPTED_READBACK` / `AMENDED` / `NO_ACTION` |
| `ACCEPTED_READBACK` | 受控 Named Action stub 成功记录决定 | 确认后的只读回显 | L3 decision record；不建 runtime | `PAUSED` / `AMENDED` / `RETURN` |
| `AMENDED` | 家庭提出调整并通过 policy | 调整入口或新版本待确认 | 新 draft/version candidate | `FAMILY_DECISION_PENDING` |
| `PAUSED` | 家庭主动暂停或授权撤回 | 暂停状态和恢复/退出入口 | 可逆 pause/revoke audit | `DRAFT_READY` 或 `NO_ACTION` |
| `NO_ACTION` | 家庭不继续或 Gate 不满足 | 安全停止、返回、稍后再看 | 0 Plan/Case/Task/Reminder/外部 effect | `RETURN` |
| `VERSION_CONFLICT` | source/report/plan version 不一致 | 版本需刷新/重新确认 | 0 核心写入 | `DRAFT_READY` 或 `BLOCKED` |

### Recommendation / Decision / Action boundary

`Recommendation` 只说明“可以考虑的方向”；`FamilyDecision` 记录家庭是否接受、调整、拒绝或暂停；`Named Action` 才是受策略约束的状态改变入口。UI-05 的“开始执行计划”在第一轮不能直接执行计划，只能进入 `FAMILY_DECISION_PENDING` 或产生受控 Named Action stub。真实 Journey、Task、Intervention、ServiceCase、通知、预约和支付均为后续独立 Gate。

## UI Content Mapping

| 视觉区域 | UI-05 可见内容 | BA 语义 | 动态化规则 |
|---|---|---|---|
| 顶部导航 | 返回、90天成长方案、更多/圆形图标 | 页面身份、返回和辅助入口 | 保持原位置和层级；更多动作不自动写状态。 |
| 阶段概览 | 当前阶段、目标、预计时长、难度 | PlanDraft summary | 允许受控 projection 替换；不显示诊断/效果结论。 |
| 统计概览 | 3/12/36/90 | 计划结构摘要 | 不转化为总分、排名或成功率。 |
| 第1周卡 | 关系破冰、已完成 2/4、沟通任务 | 示例周计划/状态投影 | `COMPLETED` 只能来自受控 projection/fixture，不等于 Outcome。 |
| 第2周卡 | 行为训练、阶段中 1/4 | 进行中候选 | 不自动生成运行任务。 |
| 第3周卡 | 习惯建立、未开始 | 待开始候选 | 只读显示。 |
| 第4周卡 | 情绪管理、底部截断 | 后续计划候选 | 低清/截断文案保持 `NEEDS_CONFIRMATION`，不得补写。 |
| 底部 CTA | 开始执行计划 | Family Decision boundary | 触发确认候选或受控 stub，不直连 runtime action。 |

## Backend Contract Implication

### Read projection

UI-05 应使用共享 Growth Plan projection，至少返回：`page_id`、`family_id`、`subject_person_id`、`plan_draft_id`、`plan_version`、`source_report_id`、`status`、`current_stage`、`metrics`、`weeks`、`evidence_refs`、`uncertainty`、`consent`、`allowed_actions`、`projection_version`、`as_of`、`visibility`、`policy_version`、`expires_at`、`external_effect=false` 和 `correlation_id`。

### Decision and Named Action

候选 API 应保持在共享 orchestration module：

```text
GET  /families/:familyId/orchestration/ui-05/growth-plan
POST /families/:familyId/orchestration/ui-05/family-decisions
POST /families/:familyId/orchestration/ui-05/actions/propose-decision
POST /families/:familyId/orchestration/ui-05/actions/pause
```

API 不得接受客户端提交的 `tenant_id`、`family_id`、`actor_id`、模型、金额、外部地址或 policy identity。服务端从可信上下文派生 scope；写动作必须有 Named Action、idempotency key、correlation_id、audit event 和可逆策略。

### Shared subsystem reuse

优先复用 `growth_intents`、`resource_recommendations`、`family_service_decisions`、`orchestration_plans`、统一 AuditService、LLM Model Gateway 和现有 policy guard。若现有 `orchestration_plans` 缺少 source/evidence/consent provenance，先返回 `REVIEW_REQUIRED/BLOCKED`；不得为了 UI-05 复制一套 Plan、Decision、Task 数据库。

## Risk and Human Gate

| 风险 | Gate / 处理 |
|---|---|
| E1 自家榜样教育/波波校长材料被当成事实 | 仅作为需求假设和设计来源；不作为效果、诊断或专业资质证明。 |
| 儿童敏感数据、情绪/风险建议 | 独立 Consent + Human Gate；默认 fail-closed。 |
| Recommendation 被当成 Plan/Decision/Action | 由 contract 和状态机分层；禁止模型直写核心 Ontology。 |
| 3/12/36/90 被解释为评分/成功率 | 仅为计划结构；禁止 Total Score/Ranking。 |
| “开始执行计划”自动创建任务 | 必须经过 FamilyDecision/Named Action；第一轮 external effect=false。 |
| 90 天陪跑/真人顾问 | 真人服务、通知、预约、支付、视频、外发均 L4 HOLD。 |
| 低清的第2周/第4周文案 | 标 `NEEDS_CONFIRMATION`，不猜测、不改 baseline。 |
| Consent 撤回/版本冲突 | 显示安全停止、暂停或重新确认；0 核心写入。 |

## Acceptance Criteria

UI-05 BA Design 只有在以下条件满足后才能进入 Contract Plan 和 FE/BE Implementation：

1. 架构师确认 `family_service_decisions` 与 UI-05 FamilyDecision 的正式语义。
2. 业务确认 90 天计划的目标、阶段、周计划和任务模板是受控设计假设，而不是已证明效果。
3. 确认 `source_report_id`、evidence、uncertainty、consent、version 和 visibility 的最小字段。
4. Visual Baseline 逐项通过：顶部结构、阶段卡、3/12/36/90、时间线、四类周卡、底部 CTA、颜色、间距和移动端比例不变。
5. API DTO、DB/read model、fixture 和 FE state 字段一致；tenant/family scope 服务端派生。
6. `Recommendation != Decision != Action` 通过正向/负向测试；NO_ACTION 产生 0 Plan、0 Case、0 Task、0 Reminder 和 0 外部 effect。
7. Consent、Human Gate、audit、idempotency、correlation_id 和版本冲突测试通过。
8. Playwright 截图覆盖静态态、loading、空态/权限态、plan draft、待确认、确认后只读回显、暂停/调整入口态，并与原图完成 screenshot diff。
9. 未通过视觉复刻或前后端一致性验收，不得声明 UI-05 runtime 完成。

## Decision Request

请架构师/业务负责人对 A-01 至 A-10 做确认，尤其确认 `FamilyDecision` 的对象归属、90 天设计假设的业务边界、Consent purpose 和 `开始执行计划` 的 Named Action ceiling。确认前，本页面只允许保留 BA Design、Contract Plan 和 Visual Baseline 工作，不进入业务代码开发。

## References

[1]: `30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt`，第 1、4、7、17 页等。
[2]: `30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt`，第 4、6、9、11、12、14、15、17、18、19、28、29 页等。
[3]: `30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt`，第 5、6、8、9 页等。
[4]: `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md`，UI-05 canonical baseline。
[5]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`，UI-05 对象/API/Action 映射。
[6]: `governance/FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md`，页面一致性准入规则。
[7]: `apps/web/public/bangyang-reference/growth-plan-90day-reference-434x1130.png`，UI-05 visual baseline。

**BA_DESIGN_READY** `reports/m2/frontend/UI-05_BA_DESIGN_90_DAY_GROWTH_001.md`
