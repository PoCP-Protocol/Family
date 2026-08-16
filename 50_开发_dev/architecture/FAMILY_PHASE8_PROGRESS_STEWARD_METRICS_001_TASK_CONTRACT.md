# FAMILY_PHASE8_PROGRESS_STEWARD_METRICS_001 任务契约

**状态：** 已获用户“全部授权开发”指令；本契约仅把授权收敛为可验证的内部确定性开发范围，不解除既有 HOLD。

**执行分支：** `family-growth-vertical-slice-001`

**主计划映射：** Phase 8 的家庭私有进度投影、Family Steward 连续服务基础与服务过程度量；对应 V3 M4 Service Continuity 与 M5 Context Reuse 的单家庭验证，不进入 M6–M8 网络/经济能力。

## 1. 目标与价值

本工作包必须帮助平台让家庭看懂当前一次服务走到哪里、下一步是什么、之前发生过什么，以及让内部确定性服务流程更容易发现待跟进、失败和恢复点。它不把服务过程包装成孩子成长结果，也不把运营效率变成对家庭或孩子的评分。

> **孩子是成长目标中心，家庭是服务与数据主权中心，平台只组织资源和持续跟进。**

## 2. 复用的既有资产

本工作包复用 `Family`、`Person`、ACTIVE binding/membership、Consent、Audit、Idempotency、GrowthIntent、GrowthCapability、ResourceRecommendation、FamilyServiceDecision、OrchestrationPlan、ServiceCase、FollowUpResponse、ContextReuseProjection 及现有 Web App。不会建立平行家庭、平行身份、平行资源、平行客户端或平行事件系统。

## 3. 本次允许实现

| 能力 | 允许实现 | 所有权与安全边界 |
|---|---|---|
| 家庭私有进度投影 | 从本家庭已有 Intent/Decision/Plan/Case/Follow-up 派生当前阶段、下一步、可暂停状态和最近一次主观帮助信号 | 只读派生视图；`family_id` 强制范围；不得写 Growth OS 的 Observation/Review/Outcome。 |
| Context Reuse 强化 | 以最小字段显示“上次家庭表达的需要、家庭选择了什么、服务现在处于何状态、是否回访”，支持过期和撤回后的 fail-closed | 非因果、非诊断、可解释；不推断孩子状态。 |
| 内部 Steward 队列基础 | 从 ServiceCase 的显式状态和回访点生成家庭范围内的待跟进/需恢复标记；可记录受控服务动作 | 仅确定性内部开发/沙箱验证；不授予真人顾问或组织访问。 |
| 协同草案 | 生成家庭范围内、可编辑、非 canonical 的 Steward handoff draft，来源字段必须指向既有 Case/Follow-up | 不发送外部、不向顾问开放、不写入 Organization/AccessGrant、不自动执行。 |
| 服务过程度量 | 计算当前家庭的 Time-to-useful-help、候选接受、回访完成和 helpfulness 信号等过程指标 | 只描述平台交付与家庭感知；不推断成长效果；不做跨家庭聚合、排名或推荐。 |
| Web 体验 | 在既有杏色 App 的服务/成长入口展示当前家庭进度和下一步，保留暂停、取消和无行动路径 | 不显示内部身份、UUID、模型、标签、效果承诺或支付诱导。 |

## 4. 明确禁止或继续 HOLD

本工作包不实现或不解除：`Organization`、`AccessGrant`、跨组织/跨家庭访问、跨家庭统计与推荐、真实顾问服务、真人交付、`Enrollment/Delivery`、支付/会员/商业化、外部模型外呼、训练/学习、ML 排序、成长 IP runtime、公开分享、儿童评分、成长结果、永久标签、公开画像、健康/心理/医学诊断、通用 workflow DSL、Kafka/Kubernetes/独立微服务。

特别地，`ServiceCase` 的“完成”不等于交付完成；`FollowUpResponse` 的帮助感不等于成长结果；内部 Steward handoff draft 不等于顾问已经接受任务。

## 5. 对象、Action 与 API 设计约束

所有新写操作必须经过 `FamilyPlatformAuthGuard`、`RequireTrustedFamilyContext`、ACTIVE binding + ACTIVE membership + role、显式 Named Action、idempotency、audit 和领域复检。只读投影不得由浏览器自行拼接事实，必须由服务端在家庭范围内派生。

建议的最小新对象为 `FamilyProgressProjection`、`StewardFollowUpQueueProjection` 与 `StewardHandoffDraft`。前两者优先作为 SQL/服务层派生投影；只有当审计、版本或人工编辑需要持久化时，才增加显式表。不得用 JSON 黑盒替代核心关系。若新增 handoff draft 表，其内容必须是来源引用与可编辑摘要，不得是 AI 生成的成长结论。

候选 Named Action 仅限：`ReadFamilyProgressProjection`、`ReadFamilyStewardQueue`、`CreateStewardHandoffDraft`、`UpdateStewardHandoffDraft`、`RecordStewardFollowUpAttempt`。每个 Action 在实现前必须有 DTO、角色矩阵、审计和负向测试；不新增顾问登录、组织授权或外部交付 Action。

## 6. 验收条件

通过条件包括：家庭只能读取自己的投影；错误家庭、非成员、撤销 binding/membership、过期/撤回同意均 fail-closed；Plan/Case/Follow-up 状态投影可重复计算且幂等；`NO_ACTION` 不生成进度假象；回访帮助感不能写入 Growth OS；取消、暂停、资源下架和服务失败有可读状态；无新外部模型连接、训练路径、跨家庭 SQL、儿童评分或永久标签命中；完整迁移、DTO、Action、单元、真实 PostgreSQL、HTTP E2E、Web 与静态扫描通过。

## 7. 蓝图复位问题

本工作包仍然回答“帮助平台更好地理解当前服务需要、组织服务、让下一次服务更好”五问中的服务组织、交付可见性与下一次上下文复用问题；它复用首条纵切，不把服务过程变成产品销售漏斗；家庭仍是决定点；所有派生信息仍然是可解释、可撤回、家庭范围和时间边界内的服务上下文。
