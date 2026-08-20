# UI-05 BA Design Architect Review 001

> **Review status:** `ARCHITECT_REVIEW_COMPLETE_PENDING_CONFIRMATION`
>
> **Architecture verdict:** `NO_GO_FOR_CODE_IMPLEMENTATION`
>
> **审查对象：** UI-05 / 90 天成长方案 BA Design、实施计划和 34 UI BA Design Queue。
>
> **结论摘要：** UI-05 的业务设计和视觉基线已经具备进入架构确认的材料，但 `FamilyDecision` 正式语义、PlanDraft provenance、GROWTH_PLAN Consent purpose、Named Action ceiling 和未成年人 subject visibility 尚未闭合。因此本轮不准进入 API Contract、DB migration、FE/BE 业务代码或 runtime 状态写入。

## Review Scope

本次评审不重新设计 UI-05，不开发业务代码，不改变 34 UI 的范围。评审目标是判断 UI-05 BA Design 是否足以进入 API Contract，以及其是否遵守 Family 的证据、对象、权限、AI、Named Action、视觉复刻和外部 effect 规则。

评审重点包括：业务设计完整性、证据等级与 provenance、Family/Person/Consent/Plan/Decision/Action 对象边界、状态机的可逆性、Recommendation/Decision/Action 分层、儿童与敏感数据保护、前后端一致性、原图视觉保真和进入代码实现前的阻塞条件。

## Reviewed Inputs

| 输入 | 用途 | 评审结果 |
|---|---|---|
| `UI-05_BA_DESIGN_90_DAY_GROWTH_001.md` | BA Scope、90 天设计、对象和状态机 | 已读取；核心边界完整，但存在需架构确认的契约歧义。 |
| `UI-05_IMPLEMENTATION_PLAN_001.md` | Web/API/DB/Policy/Audit 现实和实施门禁 | 已读取；明确 `BA_DESIGN_REQUIRED_BEFORE_IMPLEMENTATION`。 |
| `FAMILY_34_UI_BA_DESIGN_QUEUE_001.md` | UI-05 在 34 页队列中的共享能力与准入 | 已读取；UI-05 被限定为单一纵切，需 BA/架构确认。 |
| `growth-plan-90day-reference-434x1130.png` | UI-05 visual baseline | 已查看；尺寸 434×1130，结构和文案与 BA 映射一致。 |
| `FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md` | 对象、API、Named Action、状态上限 | 已读取；UI-05 状态上限为 `PLAN_ONLY`，计划使用共享 GrowthJourneyProjection。 |
| `FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md` | 页面匹配和开发准入 | 已读取；UI-05 当前为 `UI_READY_BACKEND_GAP`。 |
| `BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md` | canonical page baseline 和证据纪律 | 作为 UI-05 页面、控件、入口/出口和 DEV/PROD 边界依据。 |
| `30_素材_materials/_extracted/逐页文本_含页码/` | BA source research | 仅按逐页文本使用；不使用 `all_materials.txt`。 |

## Architecture Verdict

总体结论为：

> **BA 设计方向正确，视觉基线可定位，治理边界基本正确；但当前只能通过架构/业务确认，不得进入代码实现。**

评审将 UI-05 判断为 `CONDITIONAL_BA_READY / NO_GO_FOR_CODE_IMPLEMENTATION`。`CONDITIONAL_BA_READY` 表示 BA 设计已经能支持正式架构问题讨论；`NO_GO_FOR_CODE_IMPLEMENTATION` 表示在下列 Blocking Questions 关闭前，不能创建 API、迁移、核心状态写入或前端业务动作。

## BA Design Completeness Review

| 检查项 | 结论 | 评语 |
|---|---|---|
| Scope / Out of Scope | PASS | 明确只做 plan draft projection、家庭选择和可逆状态，不做真实陪跑、通知、预约、支付和效果证明。 |
| Source Research | PASS WITH LIMIT | 已列出优先逐页文本和治理文件；材料最高 E1 的限制已明确。 |
| 90 Day Growth Design | PASS WITH LIMIT | 3/12/36/90 被定义为计划结构；仍需业务负责人确认阶段/任务模板只是设计假设。 |
| BA Object Model | PASS WITH LIMIT | Family、Person、Report、PlanDraft、FamilyDecision、Consent、Evidence、Action 均有边界；`family_service_decisions` 复用语义待定。 |
| State Machine | PASS WITH LIMIT | BLOCKED、DRAFT_READY、DECISION_PENDING、ACCEPTED_READBACK、AMENDED、PAUSED、NO_ACTION、VERSION_CONFLICT 已覆盖；Decision candidate 与正式 decision 的写入层级需拆清。 |
| UI Content Mapping | PASS | 视觉区域到 BA 语义和动态化规则有对应关系。 |
| Backend Contract Implication | NOT YET APPROVED | 候选 endpoint 已有，但 endpoint 的 L2/L3 语义、动作注册和 provenance 字段尚未正式批准。 |
| Risk / Human Gate | PASS WITH LIMIT | 高风险、外部 effect、儿童数据、排名/总分和 AI 写入边界已登记；Consent purpose 和 guardian/subject 细则待确认。 |
| Acceptance Criteria | PASS WITH LIMIT | 已覆盖视觉、契约、测试、截图和 NO_ACTION negative path；还需将 Blocking Questions 变成批准记录。 |

## Evidence and Provenance Compliance

### Compliant points

BA Design 已明确优先使用 `30_素材_materials/_extracted/逐页文本_含页码/`，并明确不使用 `all_materials.txt`。榜样教育、波波校长、自家 PPT、用户原图和本项目产出均被限定为最高 E1 的需求/设计来源，不被当作真实效果、专业资质、生产事实或用户事实证明。

BA Design 同时明确了：

```text
Perspective != Fact
Hypothesis != Fact
Recommendation != Decision != Action
```

3/12/36/90 被限定为计划结构，不得解释为家庭总分、同龄平均、排名、诊断结论、成功率或 90 天效果承诺。该项评审通过。

### Required tightening before contract

`source_report_id`、`evidence_refs`、`uncertainty`、`consent_ref`、`policy_version`、`projection_version` 和 `as_of` 已被提出，但还没有明确哪些字段是数据库事实、哪些字段是 projection metadata、哪些字段必须来自 UI-04 的版本化快照。API Contract 前必须提供字段来源矩阵，不能仅靠 DTO 类型名解决 provenance。

## Domain Boundary Review

UI-05 的业务职责应限定为：家庭阅读和理解一个受控的成长计划草稿，提出接受/调整/暂停/不继续的家庭决定，并回读决定状态。它不是测评系统、诊断系统、任务执行系统、真人陪跑系统、预约系统、通知系统或结果评估系统。

| 领域 | UI-05 可以做 | UI-05 不可以做 |
|---|---|---|
| Assessment / Need | 读取已确认的上游 Need/Report 摘要 | 新建诊断、计算家庭总分、生成永久标签。 |
| Plan | 读取 PlanDraft/OrchestrationPlan projection | 把 recommendation 直接升级为执行计划。 |
| Decision | 记录家庭明确的接受、调整、暂停、拒绝意图/决定 | 以页面点击代替完整 actor/scope/consent/audit。 |
| Journey / Task | 显示受控模板或 projection 状态 | 自动创建真实 Journey、Task、Intervention。 |
| Service | 仅说明未来可能的陪伴承接 | 真实真人服务、预约、通知或支付。 |
| Outcome | 未来作为回访输入 | 把计划完成度或卡片状态写成教育效果。 |

## Data and Object Boundary Review

现有 BA 对象分层基本正确：`PlanDraft/OrchestrationPlan` 是声明式 projection，`FamilyDecision` 是家庭决定边界，`Journey/Task/Intervention` 是后续运行对象，`Outcome` 是未来结果对象。

需要关闭的对象问题如下：

| 问题 | 风险 | 必须的决定 |
|---|---|---|
| `family_service_decisions` 名称与成长计划 Decision 语义是否一致 | 可能把 service decision 和 growth plan decision 混为一类事实 | 架构师确认复用、扩展或建立共享但类型化的 Decision 表。 |
| `orchestration_plans` 是否只作为 projection source | 可能误写执行真相 | 明确 `DRAFT/PROPOSED` 的事实边界和只读投影 adapter。 |
| `GrowthNeedSignal` 与 `GrowthIntent` 的关系 | 可能将模型推断写成家庭事实 | 明确 signal、intent、decision 的来源、actor 和可撤回性。 |
| `subject_person_id` 与 guardian actor | 可能出现家长替孩子决定、或儿童数据越权 | 明确 actor role、subject visibility、membership 和 guardian consent。 |
| `evidence_refs` 与 `uncertainty` | 可能只存文本而丢失来源版本 | 采用结构化 source/version/retention/provenance。 |

## State Machine Review

状态机的方向是可接受的，但需要将 `FAMILY_DECISION_PENDING` 与 `ACCEPTED_READBACK` 的写入层级正式分离：

```text
DRAFT_READY
  → FAMILY_DECISION_PENDING       # 候选意图/待确认，不创建 Plan/Task
  → ACCEPTED_READBACK             # Named Action 成功后的 Decision record，只读回显
  → PAUSED / AMENDED / NO_ACTION
```

评审要求：

1. `DRAFT_READY` 只能是 L1 projection。
2. `FAMILY_DECISION_PENDING` 只能是 L2 candidate 或待确认 envelope，不得伪装成已决定事实。
3. `ACCEPTED_READBACK` 只有在合法 Named Action、Consent、policy、idempotency、audit 成功后才可出现，且仍不得创建 Journey/Task/Intervention。
4. `NO_ACTION` 必须保证 0 Plan、0 Case、0 Task、0 Reminder 和 0 外部 effect。
5. `PAUSED`、`AMENDED` 和 `VERSION_CONFLICT` 必须可追溯 source version、actor、reason 和 correlation_id。

## Named Action / Decision / Recommendation Boundary

本项总体通过原则审查，但 API Contract 前存在重大澄清项。

| 层 | 正确含义 | 当前评审结论 |
|---|---|---|
| Recommendation | 模型/规则提出的可考虑方向 | 设计已正确限制为 explanation/recommendation，不得写核心事实。 |
| PlanDraft | 声明式计划草稿/读投影 | 设计已正确限制为 projection，不等于 execution truth。 |
| FamilyDecision | 家庭明确接受、调整、拒绝或暂停 | 需要确认正式对象、decision_type、actor 和 consent 语义。 |
| Named Action | 经过 policy 的受控状态改变入口 | 需要正式登记 UI-05 action 名称、payload schema、idempotency 和 allowed state transition。 |
| Journey/Task/Intervention | 后续运行时对象 | UI-05 第一轮禁止自动创建。 |

必须保持以下不变量：

```text
Recommendation != Decision != Action
```

浏览器按钮不得直接调用 `CREATE_PLAN`、`CREATE_JOURNEY`、`CREATE_TASK` 或 `CREATE_INTERVENTION`。模型输出不得绕过 Model Gateway、schema validation、Policy 和 Human Gate。

## Consent / Human Gate / Minor Protection Review

### 通过项

BA Design 已要求儿童资料、敏感情绪/风险建议、真人服务、通知、预约、支付、视频和外发进入独立 Consent/Human Gate；已要求缺失、撤回或过期时 fail-closed；已禁止儿童直接作答在本页自动写入成长事实。

### 未闭合项

1. `GROWTH_PLAN` 是否是正式 Consent purpose，还是需要区分 `PLAN_READ`、`PLAN_DECISION`、`CHILD_DATA` 和 `SERVICE_FOLLOWUP`。
2. 谁可以作为 actor 提交 FamilyDecision；家长、监护人、家庭成员和儿童的角色是否不同。
3. `subject_person_id` 是否允许儿童为目标但只能由 guardian actor 确认。
4. 敏感计划建议是否必须人工审核，还是仅在风险条件命中时触发 Human Gate。
5. Consent 撤回后，历史 projection、audit 和派生草稿如何最小化留存、失效和不可再利用。

在这些问题关闭前，UI-05 不得进入 API Contract 和状态写入实现。

## Frontend Backend Consistency Implications

当前一致性矩阵将 UI-05 标为 `UI_READY_BACKEND_GAP`，该结论正确。前端已有 `core-plan` route 和视觉壳，但目前 `corePlan()` 主要是参考图背景与 CTA hotspot；后端尚无正式 UI-05 plan projection、FamilyDecision contract、Named Action registration 和完整状态 DTO。

进入实现前必须同时满足：

| 一致性门 | 必须证明 |
|---|---|
| Field matched | FE 显示字段逐一对应 API DTO；fixture 与真实 projection 字段一致。 |
| Scope matched | `tenant_id`、`family_id`、`actor_id` 和 subject 由服务端可信上下文派生。 |
| State matched | FE 状态只由服务端 `status/allowed_actions/policy` 驱动，不由本地按钮推断。 |
| Action matched | CTA 只调用已登记 Named Action；无 action 时显示 disabled/NO_ACTION。 |
| Audit matched | Decision/action 有 actor、reason、source version、correlation_id、idempotency 和 before/after。 |
| Negative matched | 无 consent、无 evidence、跨 family、版本冲突、儿童越权均 fail-closed。 |
| Projection matched | read model 带 `projection_version`、`as_of`、`source_refs`、`visibility`、`policy_version`、`expires_at`。 |

## Visual Fidelity Implications

视觉基线评审通过，且没有发现需要改版的理由。原图为 434×1130 竖屏画面，关键不可变结构包括：

- 顶部返回箭头、居中“90天成长方案”、右侧菜单和圆形图标；
- 橙色阶段概览卡、当前阶段、目标、90 天和难度；
- `3 / 12 / 36 / 90` 统计区；
- 第 1 至第 4 周纵向时间线、颜色分区、任务行和图标；
- 底部橙色“开始执行计划”按钮。

动态化必须在原有区域内注入 projection，不得用通用卡片替代原结构，不得改写文案以制造诊断、效果或排名含义。第 2 周低清进度文案和第 4 周底部截断部分必须保留不确定性，不得凭空补写。loading、empty、permission、consent、pending、readback、paused 和 version conflict 都应留在同一页面骨架内。

## Blocking Questions

| ID | 架构师/业务必须回答的问题 | 关闭标准 |
|---|---|---|
| BQ-01 | `family_service_decisions` 是否正式承载 UI-05 FamilyDecision？ | 明确对象归属、类型、唯一键和复用策略。 |
| BQ-02 | `orchestration_plans` 的 `DRAFT/PROPOSED` 是否只作为 PlanDraft projection？ | 明确不可成为 execution truth，并给出 adapter 边界。 |
| BQ-03 | `GROWTH_PLAN` Consent purpose 的正式名称、授权主体、目标 subject 和撤回策略是什么？ | Consent registry、actor/subject、retention 和撤回规则明确。 |
| BQ-04 | `ConfirmGrowthPlan` 是否为正式 Named Action，还是复用已有 `DecideGrowthService`？ | action name、payload schema、allowed transitions、idempotency 明确。 |
| BQ-05 | `FAMILY_DECISION_PENDING` 是否只记录 candidate，何时升级为 accepted decision？ | L2/L3 分界、audit event 和 NO_ACTION negative path 明确。 |
| BQ-06 | UI-04 report snapshot 到 UI-05 plan draft 的 source/version/evidence 如何绑定？ | source_report_id、report_version、evidence_refs、uncertainty 可追溯。 |
| BQ-07 | guardian actor 与 `subject_person_id` 的 visibility 规则是什么？ | 家庭成员、监护人和儿童角色的正负向测试定义。 |
| BQ-08 | 90 天阶段/周/任务模板是否全部属于 Recommendation/PlanDraft，哪些可进入后续 runtime？ | 模板、Decision、Journey、Task 的生命周期和审批点明确。 |
| BQ-09 | “开始执行计划”第一轮是否严格为 no-op/stub，不创建 Journey/Task/Intervention？ | DEV/TEST external_effect=false 证据和禁止 endpoint 测试通过。 |
| BQ-10 | 原图中的阶段和任务文案哪些允许 projection 替换？ | Visual copy allowlist、DOM text coverage 和截图 diff 规则签字。 |

## Required Fixes Before API Contract

以下不是业务代码修改，而是 API Contract 前的设计修正和确认材料：

1. 产出 `Decision Type / Action Type / State Transition` 矩阵，分离 candidate、decision 和 action。
2. 产出 `PlanDraft Provenance Matrix`，明确每个字段来自 UI-04 snapshot、projection adapter、家庭输入还是测试 fixture。
3. 产出 `Consent and Minor Visibility Matrix`，明确 purpose、actor、subject、guardian、撤回和过期行为。
4. 将 `ConfirmGrowthPlan`、`PauseGrowthPlan`、`AmendGrowthPlan` 的 Named Action 是否注册作为架构决策记录，而不是仅作为 endpoint 候选。
5. 对 `orchestration_plans` 做只读字段审计，证明不会把 UI-05 projection 写进执行真相。
6. 将 `NO_ACTION`、无 Consent、无 Evidence、跨租户、版本冲突和儿童越权写入 contract negative test plan。
7. 对 UI-05 原图逐项建立 screenshot baseline manifest；第 2 周歧义和第 4 周截断保持 `NEEDS_CONFIRMATION`。
8. 在以上材料获批前，保持 `BA_DESIGN_REQUIRED_BEFORE_IMPLEMENTATION` 和 `NO_GO_FOR_CODE_IMPLEMENTATION`。

## Go / No-Go Verdict

| 决策项 | 结论 |
|---|---|
| BA Design 是否可进入架构/业务评审 | **GO** |
| Visual Baseline 是否可作为 UI-05 当前基线 | **GO WITH EVIDENCE LIMITS** |
| 是否可开始 API Contract | **NO-GO，等待 BQ-01 至 BQ-08 关闭** |
| 是否可开始 DB migration | **NO-GO** |
| 是否可开始 FE/BE 业务代码 | **NO-GO** |
| 是否可接真实 AI Agent、真人服务、预约、支付、通知或外发 | **NO-GO / HOLD** |
| 是否可继续做不写核心状态的 BA、契约草案和视觉测试设计 | **GO** |

最终结论：

> **NO_GO_FOR_CODE_IMPLEMENTATION**。UI-05 的视觉基线和 BA 设计可以继续接受人工评审，但在架构师/业务负责人关闭 Blocking Questions 并形成确认记录前，不得进入代码实现。

## Acceptance Checklist

| 检查项 | 当前状态 | 进入 API Contract 前要求 |
|---|---|---|
| Perspective / Fact 分离 | PASS | 保持在 DTO、projection 和文案中。 |
| Hypothesis / Fact 分离 | PASS | E1 材料不得升级为效果事实。 |
| Recommendation / Decision / Action 分离 | PASS WITH BLOCKER | 形成正式 Decision/Action transition matrix。 |
| Family Total Score / Ranking 禁止 | PASS | 加入 negative tests。 |
| AI Gateway / 禁止直写 Ontology | PASS | 保留 Gateway schema/policy/Human Gate。 |
| Named Action 核心写入 | PASS WITH BLOCKER | 注册正式 action、幂等、审计和 allowed transitions。 |
| PlanDraft 只读投影 | PASS WITH BLOCKER | 完成 provenance 和 execution-truth 隔离确认。 |
| Consent / Minor Protection | PASS WITH BLOCKER | 完成 purpose、actor、subject、guardian、撤回矩阵。 |
| Visual Fidelity | PASS WITH LIMITS | 截图 manifest、DOM text、mobile/desktop diff 通过。 |
| FE/BE consistency | NOT READY | DTO、read model、policy、audit、fixture 和 browser 证据齐备。 |
| 外部 effect | HOLD | DEV/TEST 只能 stub/no-op。 |
| 代码实现准入 | **NO-GO** | 仅在 Blocking Questions 关闭后重新评审。 |

**UI05_BA_ARCHITECT_REVIEW_READY** `reports/m2/frontend/UI-05_BA_DESIGN_ARCHITECT_REVIEW_001.md`

## References

[1]: `reports/m2/frontend/UI-05_BA_DESIGN_90_DAY_GROWTH_001.md`
[2]: `reports/m2/frontend/UI-05_IMPLEMENTATION_PLAN_001.md`
[3]: `reports/m2/frontend/FAMILY_34_UI_BA_DESIGN_QUEUE_001.md`
[4]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`
[5]: `governance/FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md`
[6]: `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md`
[7]: `30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt`
[8]: `30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt`
[9]: `30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt`
[10]: `apps/web/public/bangyang-reference/growth-plan-90day-reference-434x1130.png`
