# Family 对象—属性—关系—Action—上下文模型 V1

```text
DOC_KIND       = OBJECT_ACTION_CONTEXT_ARCHITECTURE（非 SSOT、非 runtime 授权）
STATUS         = DRAFT_FOR_ARCHITECT_REVIEW
METHOD         = 适配对象—属性—关系—Action—工作流—生成式协作方法
ROOT_RULE      = Family 是主权与连续服务根；Child 是成长目标中心；平台是资源编排者。
```

## 1. Family 的“世界模型”不是全知画像

Family 的上下文模型只描述：在明确来源、权限、证据等级、版本、用途和时间边界内，家庭曾表达什么需要、确认了什么意图、哪些资源合格、家庭做了什么选择、服务发生了什么、家庭觉得是否有帮助，以及下一次如何减少重复解释。它不对孩子的人格、潜力、心理状态、家庭优劣或未来结果作永久判断。

> **可记忆不等于可推断；可推断不等于可行动；可行动不等于可自动执行。**

每个对象都必须可追溯到既有 Family Core、Growth OS、Principal、Program Runtime、Content/Resource、Consent、Audit 或首条 Orchestration 纵切的明确所有者。

## 2. 对象树与所有权

```text
Family (主权根 / Continuous Service Root)
├─ Account / Person / Membership / Relationship                 [Family Core + IAM]
├─ Consent / Purpose / Access Context                            [Consent + Tenancy]
├─ Lifecycle Context                                             [Life-stage assignments, 可更新]
├─ Growth OS
│  ├─ Perspective / Evidence / Observation / Review              [非诊断、来源分层]
│  └─ Optional GrowthPriority                                    [不阻塞服务编排]
├─ Service Orchestration
│  ├─ GrowthNeedSignal (non-canonical)
│  ├─ GrowthIntent (家庭确认)
│  ├─ GrowthCapability (平台共用、需求与供给解耦)
│  ├─ ResourceOffer (内容/练习/AI/Program/真人/转介)
│  ├─ ResourceRecommendation (eligible 集合内排序)
│  ├─ FamilyServiceDecision
│  ├─ OrchestrationPlan (条件路径)
│  ├─ ServiceCase / FollowUpResponse
│  └─ ContextReuseProjection (只读、非因果)
├─ Bangyang Assets
│  ├─ Content / Practice / Program / Playbook                    [approved refs]
│  └─ Advisor / Service SOP                                      [后续资质与 AccessGrant]
└─ Capability Learning
   ├─ SourceRegistry / ResearchArtifact
   ├─ CapabilityCard / AdoptionProposal
   └─ Approved Memory Projection                                 [只读、版本化]
```

## 3. 关键对象属性契约

| 对象 | 最小关键属性 | 关系 | 可执行 Action | 禁止的生成式行为 |
|---|---|---|---|---|
| `Family` | `family_id`、状态、主权边界 | 成员、同意、服务、关系 | 选择/撤回/共享/更正 | 推断家庭质量、跨家庭训练/营销 |
| `Child/Person` | 身份、生命周期上下文、角色 | 家庭、关系、被授权服务对象 | 记录自己的视角（在权限内） | 自动贴标签、风险评分、永久画像 |
| `GrowthNeedSignal` | 来源、文本、时间、非 canonical 标记 | 归属 Family/subject；可被 Intent 确认 | 创建、取消、澄清 | 写成 Fact/Diagnosis/Priority |
| `GrowthIntent` | 家庭确认的目标、状态、版本 | 需求、能力、资源建议 | 确认、取消、更新 | 自动由 AI 代替家庭确认 |
| `GrowthCapability` | 能力代码、适用需要、定义 | 多个 Intent 与 ResourceOffer | 映射、评审、版本更新 | 直接等同于某一个课程/产品 |
| `ResourceOffer` | 八类类型、能力映射、适龄/生命周期范围、证据、风险、同意、可用性 | Capability、Recommendation、Plan | 审核准入、激活/停用 | 未通过 Gate 即被生成式 AI 推荐 |
| `Recommendation` | 候选、资格结论、理由、限制、版本 | Intent、Offer、Decision | 请求、解释、替换 | 自动执行、隐去限制、使用收入排序 |
| `FamilyServiceDecision` | 明确选择、理由、操作者 | Recommendation、Plan | 接受/替代/拒绝/暂不行动 | AI 自动替家庭决定 |
| `OrchestrationPlan` | 有序/条件步骤、触发条件 | Decision、ServiceCase、Resource | 建立、取消、调整 | 把计划直接当交付完成 |
| `ServiceCase` | 负责人、SLA、状态、回访点 | Plan、Follow-up、未来 Steward | 开案、跟进、恢复、升级 | 自动声称成长结果 |
| `FollowUpResponse` | 用户感知帮助感、文本、来源 | ServiceCase | 回访、记录 | 自动写入 Observation 或因果效果 |
| `ResearchArtifact` | 来源、许可、hash、证据等级、时间 | CapabilityCard | 登记、评审、废弃 | 未审核成为平台事实或训练数据 |

## 4. Action 与工作流

Family 的 Action 必须由可信身份、Family scope、role→NamedAction、purpose、同意、安全与领域规则共同约束。生成式 AI 只能协助提案：例如将一段家庭表达整理为**候选** NeedSignal、给出已批准资源的解释、草拟下一步问题或生成顾问摘要。它不能直接确认 Intent、跳过 Eligibility、做 FamilyServiceDecision、启动外部服务、修改 Observation、生成诊断或重写核心策略。

```text
AI / Human / Family input
  → Proposal (source + policy + limitations)
  → Trusted Action authorization
  → Domain validation / Eligibility Gate
  → Family Decision where required
  → Audit + event
  → Read-only projection
```

## 5. 生成式 AI 的四层能力边界

| 层级 | 允许能力 | 依赖的既有资产 | 必须经过 |
|---|---|---|---|
| L1 解释 | 解释已批准内容、资源限制、服务状态 | Content Ref、ResourceOffer、ServiceCase | Family scope、引用/版本显示 |
| L2 整理 | 将家庭文字整理为候选 Need/问题/顾问摘要 | Growth OS、NeedSignal、Evidence | 来源保留、可编辑、不可自动确认 |
| L3 提案 | 提出资源组合或条件路径草案 | Capability、eligible offers、policy | Eligibility 先行、Human/Family Gate、理由与替代 |
| L4 协作 | 为顾问/Steward 准备受限服务摘要与恢复建议 | ServiceCase、approved memory | 角色、purpose、AccessGrant（未来）、人工确认 |

诊断、评分、预测、处罚、资格授予、儿童/家庭价值判断、未授权跨家庭学习以及系统自改政策始终不属于上述能力。

## 6. 全生命周期与未来网络的可扩展性

对象模型把 `Lifecycle Context`、`GrowthCapability` 和 `ResourceOffer` 分开。这样新增婴幼儿、学龄、青春期或青年早期的资源，不需要改变 Family、Intent、Decision、Plan 或 ServiceCase 的主链。未来 Organization、AccessGrant、Community、DemandCluster、Provider Network、Payment/Entitlement 只能以独立对象加入并获得专门 Gate；它们不能替代 Family 主权根或改变当前家庭的对象关系。

## 7. 当前实现对齐

首条纵切的 `0020_growth_orchestration_v1.sql` 已开始落实：`GrowthNeedSignal → GrowthIntent → growth_intent_capabilities → resource_offer_capabilities → ResourceRecommendation → FamilyServiceDecision → OrchestrationPlan → ServiceCase → FollowUpResponse`。当前只授权四类低风险资源运行，但数据模型预留八型资源网络；Program、Human Coach、Qualified Expert 和 Content 需在各自 Phase/Gate 通过后才会进入运行时。

## 参考

[1]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` §§1–7
[2]: `architecture/FAMILY_LIFECYCLE_GROWTH_ARCHITECTURE_V1.md`
[3]: `architecture/FAMILY_RESEARCH_MEMORY_INTELLIGENCE_INTEGRATION_V1.md`
[4]: `architecture/tenancy/TENANCY_001_OWNERSHIP_TENANCY_CONTRACT_V1.md`
[5]: `apps/api/src/modules/principal/principal.module.ts`
