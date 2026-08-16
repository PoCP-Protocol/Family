# FAMILY_PHASE8_PROGRESS_STEWARD_METRICS_001 实现设计

## 1. 设计原则

Phase 8 不是另一个成长系统，而是现有 `ServiceCase` 连续服务层的最小增强。家庭仍是数据主权根，孩子仍是成长目标中心，平台只对当前服务链做可解释投影。所有投影都从已经经过家庭决定的 `GrowthIntent`、`FamilyServiceDecision`、`OrchestrationPlan`、`ServiceCase` 和 `FollowUpResponse` 派生；不从自由文本推断事实，不创建成长结论，不写入 `Observation`、`Review`、`GrowthPriority` 或未来 Growth IP。

外部研究支持把服务连续性落在计划、角色协调、资源连接和家庭跟进上，但 Family 只采纳其中适合当前单家庭确定性验证的部分。[1] 家庭自决要求 `NO_ACTION`、暂停、取消和人工确认保持显式；儿童中心数据治理要求最小范围、透明、可撤回、无歧视和可问责。[2] [3]

## 2. 投影对象

### 2.1 `FamilyProgressProjection`

这是服务端只读 DTO，不新增事实表。它按 `family_id + subject_person_id` 查询最近的开放 Intent、最近的 Recommendation/Decision/Plan/Case 和最近 Follow-up，输出：

| 字段 | 语义 | 禁止解释 |
|---|---|---|
| `current_stage` | `NEED_CONFIRMED`、`RESOURCE_OPTIONS`、`FAMILY_DECIDED`、`PLAN_READY`、`SERVICE_OPEN`、`FOLLOW_UP_DUE`、`FOLLOW_UP_CAPTURED`、`NO_ACTION`、`PAUSED` | 不是孩子成长阶段、能力等级或完成度。 |
| `next_step` | 家庭可以执行的下一步或 `NONE` | 不是必须执行的任务，不自动触发外部服务。 |
| `can_pause` / `can_cancel` | 当前服务是否允许家庭停止 | 不改变家庭同意以外的授权。 |
| `last_family_signal` | 最后一次家庭主观帮助感 | 不代表成长结果、干预效果或因果关系。 |
| `source_refs` | 对应 Intent/Decision/Plan/Case/Follow-up 的内部来源标识 | API 不向浏览器展示裸 UUID；只用于审计/服务端引用。 |
| `truth_boundary` | 固定字符串 `SERVICE_PROGRESS_NOT_GROWTH_OUTCOME` | 不能被客户端改写。 |

`NO_ACTION` 的投影只能表示家庭没有选择资源，不得伪造 `PLAN_READY`、`SERVICE_OPEN` 或完成信号。资源下架、同意撤回、binding/membership 撤回时，投影 fail-closed 为不可操作状态，且不把过去的帮助感重新解释为当前准入。

### 2.2 `StewardQueueProjection`

这是家庭范围只读运营投影，由 `ServiceCase.status`、`next_action_at`、`escalation_reason`、Follow-up 是否存在和当前时间确定性派生。队列项只包含：Case 状态、是否需要回访、是否需要恢复、SLA 类别、下一动作时间和固定原因码。它不产生优先级分数，不跨家庭排序，不把“积压”转成家庭/孩子风险等级。

### 2.3 `StewardHandoffDraft`

这是本阶段唯一建议持久化的新对象。它不是顾问任务、不是 AccessGrant、不是 Delivery 记录，而是内部家庭范围的可编辑草案：

```text
family_id
service_case_id
subject_person_id
source_follow_up_response_id nullable
draft_status = DRAFT | CANCELLED
summary_text
limitation_text
created_by_person_id
updated_by_person_id
idempotency_key
policy_version
created_at / updated_at
```

`summary_text` 必须由受信任内部动作或明确家庭输入写入；本阶段不接模型、不允许外部发送。草案只能引用当前 Case 和 Follow-up，不生成孩子标签、诊断、结果或跨家庭比较。

## 3. API 与 Named Action

控制器继续复用 `FamilyPlatformAuthGuard` 与 `RequireTrustedFamilyContext`；所有 family ID 和 subject ID 必须由服务端校验，读查询必须同时绑定家庭与主体。建议 API：

| API | Named Action | 说明 |
|---|---|---|
| `GET /families/:familyId/progress/:subjectPersonId` | `ReadFamilyProgressProjection` | 读取当前家庭、当前主体的服务进度。 |
| `GET /families/:familyId/steward/queue` | `ReadFamilyStewardQueue` | 读取当前家庭的服务跟进/恢复投影；不开放组织队列。 |
| `GET /families/:familyId/service-metrics/:subjectPersonId` | `ReadFamilyServiceMetrics` | 只返回当前家庭的交付/感知过程指标。 |
| `POST /families/:familyId/steward/handoff-drafts` | `CreateStewardHandoffDraft` | 创建家庭范围、可编辑的草案；不发送、不分派。 |
| `PATCH /families/:familyId/steward/handoff-drafts/:draftId` | `UpdateStewardHandoffDraft` | 仅更新草案文本/状态；不能改变 Case/Consent。 |

本阶段不新增“接受顾问任务”“开放顾问访问”“交付完成”“跨家庭聚合” Action。对于不满足身份、范围、同意或 Case 关系的请求，统一 fail-closed。

## 4. 服务过程度量

指标全部在当前家庭范围内计算，且返回固定 truth boundary：

| 指标 | 计算 | 不表示 |
|---|---|---|
| `time_to_first_recommendation_ms` | Intent 创建到 Recommendation 创建 | 平台一定找到有效帮助。 |
| `family_decision_rate` | 已有 Recommendation 中有 Decision 的比例 | 家庭满意度或成长改善。 |
| `service_case_open_rate` | 明确选择的 Decision 中已开 Case 的比例 | 真实交付完成。 |
| `follow_up_capture_rate` | 已开 Case 中有 Follow-up 的比例 | 服务效果。 |
| `helpfulness_signal` | 最近一次 Follow-up 的主观帮助感 | 孩子成长结果或因果证据。 |
| `context_reuse_available` | 是否存在可复用的最小来源上下文 | 平台了解孩子全貌。 |

禁止输出 DAU、停留时长、付费转化、收入排序、家庭评分、孩子评分和跨家庭统计。

## 5. 测试设计

单元测试覆盖阶段机、`NO_ACTION`、取消/暂停、状态映射和指标分母为零；真实 PostgreSQL 测试覆盖跨家庭、非成员、撤销 binding/membership、撤回同意、Case 与 draft 不同家庭、幂等重放和不写 Growth OS；Web 测试覆盖空状态、错误状态、可暂停和帮助感边界；静态扫描确认无模型外呼、训练、组织访问、支付、画像和结果字段。

## References

[1]: https://www.nccp.org/strategy-case-management/ — National Center for Children in Poverty, “Case-Management / Linking Families to Services”.
[2]: https://und.edu/cfstc/_files/docs/2020-sfpm-case-mgmt-overview-handout-with-notes.pdf — University of North Dakota, “Safety Framework Practice Model: Case Management”.
[3]: https://www.unicef.org/innocenti/reports/policy-guidance-ai-children — UNICEF Innocenti, “Guidance on AI and children”, Version 3.0.
