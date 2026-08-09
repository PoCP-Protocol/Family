# 02｜Family 业务架构与 Ontology
## Family Business Architecture & Ontology V1.0

---

# 1. 业务架构目标

业务架构的目标不是描述系统菜单，而是定义：

> Family长期经营的家庭世界是什么，它有哪些对象、关系、状态、事件、决策、行动与Outcome。

统一业务主链：

```text
Family
→ LifeStage
→ GrowthProfile
→ GrowthPriority
→ GrowthJourney
→ Intervention
→ GrowthAction
→ GrowthEvent
→ Milestone
→ Outcome
→ Next State
```

---

# 2. 一级业务域

## B1 Family Identity
家庭与成员。

## B2 Growth
孩子、家长、关系的成长状态。

## B3 Journey
成长周期、阶段、计划、行动。

## B4 Intervention
专业方法与适用条件。

## B5 Service
课程、顾问、助教、专家、社群、活动。

## B6 Knowledge
正式知识、内容、Evidence。

## B7 Commerce
会员、订单、权益、续费。

## B8 AI Decision
Agent、Recommendation、Decision。

## B9 Outcome
真实成长结果。

## B10 Causal Intelligence
Study、CausalEdge、CausalEpisode。

---

# 3. Core Object Model

## 3.1 Identity Objects

### Family
核心字段：
- family_id
- family_name
- primary_contact_id
- status
- created_at

### Parent
- parent_id
- family_id
- role
- consent_status
- account_id

### Child
- child_id
- family_id
- birth_year/month
- current_life_stage_id
- consent/guardian relation

### FamilyRelationship
- relationship_id
- family_id
- person_a_id
- person_b_id
- relationship_type
- status

---

## 3.2 Growth Objects

### LifeStage
表示当前发展阶段。

一期：
`EARLY_ADOLESCENCE / 12–15`

### GrowthDomain
- CHILD
- PARENT
- RELATIONSHIP
- FAMILY（**二期**）

> **【V1.1 裁决｜ISSUES.md A5】** 一期只启用 CHILD / PARENT / RELATIONSHIP 三域(与 `01` 的 24 维一致);FAMILY 域一期无维度,明确列为二期,避免与 RELATIONSHIP 的 R08「家庭协作与韧性」重叠。`1.6 24维Growth Model确认` 只需覆盖前三域。

### GrowthDimension
24个一期维度。

> **【V1.1 裁决｜ISSUES.md B4】** `1.6` 交付物须把 24 维与知识层 `Construct` **合并成一套字段**,一次定清:每个维度补 `measured_by`(测量通道)、`proxy_risk`(代理指标风险)、`direction`(期望改变方向);状态沿用下方 §11 的四档(EMERGING/DEVELOPING/PRACTICING/STABILIZING)。否则 24 维映射 Construct 会因"无测量通道"全部报 error。

### GrowthProfile
某主体在某LifeStage某时间段的动态画像。

核心字段：
- profile_id
- subject_type
- subject_id
- life_stage_id
- dimension_states
- strengths
- growth_opportunities
- confidence
- version
- effective_from/to

### GrowthPriority
当前最值得关注的1–2个重点。

---

## 3.3 Journey Objects

### GrowthJourney
例如90天共同成长Journey。

### GrowthCycle
Daily / Weekly / Phase Review。

### GrowthGoal
阶段成长目标。

### GrowthAction
现实可执行行动。

### GrowthEvent
家庭真实发生的事件。

### GrowthMilestone
值得长期保存的成长节点。

---

## 3.4 Evidence & Perspective

### Evidence
任何重要判断的依据。

> **【V1.1 裁决｜ISSUES.md B5】** 证据等级刻度与结论门为**规格权威定义**,`20_知识_knowledge\byresearch\evidence.py` 是其实现(以本节为准,代码不得自行漂移)。
>
> **等级 E0–E7(数值越大越强):**
> - E0 传闻/个案/无来源｜E1 内部材料主张(自家 PPT、口头共识)｜E2 二手媒体/自媒体
> - E3 商业机构行业报告/白皮书｜E4 官方统计/监管文件/权威指南
> - E5 一手运营数据(可复核)｜E6 观察性研究/准实验｜E7 RCT/系统综述与元分析
>
> **溯源 Provenance(与等级正交,说明"数字哪来的"):** `primary_real` / `third_party_real` / `self_report` / `unverified` / `inferred` / `simulated` / `unknown`。
>
> **结论门(`NON_DECISIVE`):** 溯源为 `inferred / simulated / unverified / unknown` 的证据**不得用于支撑"成立/有效"**,只能生成假设、设定验收门槛。自家素材与自家产出上限 **E1,不得自证**。要支撑结论,须 **E4+ 且真实溯源且有可追溯 source**。

### Perspective
某成员对事件/问题的主观视角。

### Hypothesis
AI/顾问尚未被确认的解释。

必须遵守：

`Perspective != Fact`

`Hypothesis != Fact`

---

## 3.5 Intervention Objects

### Intervention
专业方法。

核心字段：
- intervention_id
- life_stage
- target_domain
- target_dimension
- applicable_conditions
- contraindications
- mechanism
- actions
- dose
- fidelity
- mediator
- expected_outcomes
- evidence_grade
- risk_level
- human_requirement
- failure_mode（**V1.1 新增**）
- derived_from（**V1.1 新增**）

> **【V1.1 裁决｜ISSUES.md B2】** 新增两字段,与知识层 `Method` 对齐:
> `failure_mode` = 典型做坏方式(交付端据此避坑);`derived_from` = 源自哪个已验证 `Program`。
> `derived_from` 关联的 `Program.licensing`(版权/认证)直接决定该方法能否商用。

### InterventionVersion
所有专业方法必须版本化。

---

## 3.6 Decision Objects

### Recommendation
AI/规则给出的候选建议。

### Decision
人/系统最终确定的选择。

### Action
真正改变业务状态的Named Action。

必须：

`Recommendation != Decision != Action`

---

## 3.7 Outcome Objects

### Outcome
字段：
- outcome_id
- dimension_id
- baseline
- current
- measurement_window
- source
- evidence_ids
- confidence
- context
- confounders

### OutcomeRelation
默认使用：
`ASSOCIATED_WITH`

不得默认使用：
`CAUSES`

---

## 3.8 Measurement Objects（**V1.1 新增**）

> **【V1.1 裁决｜ISSUES.md B3】** 新增测量通道对象,与知识层 `Modality` 对齐。原因:未成年人合规下"同意做成长追踪"**不等于**"同意用视频通道采集" —— `Consent.purpose` 必须能落到具体采集手段。缺这一层,同意的粒度不足以合规。

### MeasurementChannel
一种获取家庭真实信号的通道。

核心字段：
- channel_id
- channel_type（量表 / 语音 / 视频 / 文本 / 行为日志 / 生理）
- measures_dimensions（对应 GrowthDimension）
- instrument（具体工具或编码体系）
- reliability（信效度已知情况）
- privacy_risk（**必填**：隐私风险等级与处理要求 —— 缺失即不合格)
- minors_handling（**必填**：涉未成年人时的额外要求 —— 缺失即不合格)
- linked_consent_purpose（该通道采集须挂到的 Consent.purpose）

`privacy_risk` 与 `minors_handling` 缺失,该通道不得启用(与 `Modality` 校验器一致,二者缺失直接 error)。

---

# 4. Service Ontology

现有业务能力统一映射。

| 现有概念 | Family Ontology |
|---|---|
| 课程 | Course + Knowledge + Intervention |
| 训练营 | GrowthProgram |
| 21天挑战 | GrowthCycle / Program |
| 90天陪跑 | GrowthJourney |
| 助教 | GrowthCompanion / Staff |
| 顾问 | GrowthAdvisor |
| 专家 | Expert |
| 社群 | GrowthCommunity |
| 活动/沙龙 | FamilyActivity |
| 测评 | Assessment |
| 报告 | GrowthReview |
| 打卡 | GrowthActionCompletion Event |
| 案例 | OutcomeCase |
| 会员 | Membership |
| 权益 | Entitlement |
| 咨询 | ServiceInteraction |

---

# 5. Commerce Ontology

Family不是替换交易系统。

核心对象：
- Membership
- Entitlement
- OrderRef
- PaymentRef
- CouponRef
- Subscription
- Renewal
- Referral

交易系统可在外部SaaS，Family只保留必要引用与家庭关系。

---

# 6. Knowledge Ontology

```text
ContentSource
→ ContentItem
→ Transcript
→ Chunk
→ Claim
→ Evidence
→ Review
→ KnowledgeCard
→ Intervention
```

原则：
- Content不是正式Knowledge。
- Claim不是Fact。
- Popularity不是Evidence Grade。
- 社交媒体内容默认只作为候选知识。

---

# 7. Causal Ontology

新增：

### CausalStudy
研究来源。

### Population
适用人群。

### Context
家庭/年龄/文化背景。

### InterventionExposure
干预或暴露。

### Mediator
中介机制。

### Moderator
调节因素。

### Timepoint
时间。

### EffectEstimate
效果估计。

### CausalEdge
两个状态/变量之间的证据关系。

### CausalEpisode
Family内部真实成长Episode。

因果关系等级：

1. CORRELATES_WITH
2. ASSOCIATED_WITH
3. HYPOTHESIZED_TO_INFLUENCE
4. SUPPORTED_CAUSAL_EFFECT
5. INTERNALLY_REPLICATED

---

# 8. 核心 Link Model

```text
Family
├─ hasMember → Parent
├─ hasMember → Child
├─ contains → FamilyRelationship
├─ currentlyIn → LifeStage
├─ has → GrowthProfile
├─ follows → GrowthJourney
├─ receives → ServiceInteraction
└─ owns → Membership

GrowthProfile
├─ covers → GrowthDimension
└─ generates → GrowthPriority

GrowthPriority
├─ addressedBy → Intervention
└─ convertedTo → GrowthGoal

GrowthJourney
├─ targets → GrowthPriority
├─ contains → GrowthCycle
├─ contains → GrowthAction
├─ produces → GrowthEvent
├─ contains → Milestone
└─ produces → Outcome

Perspective
├─ belongsTo → Person
└─ refersTo → GrowthEvent

KnowledgeCard
└─ supports → Intervention

CausalEdge
├─ from → State/Dimension
├─ via → Mediator
└─ to → Outcome/State
```

---

# 9. 核心 Named Actions

禁止用通用CRUD修改关键家庭状态。

一期Actions：

1. CreateFamily
2. AddFamilyMember
3. AssignLifeStage
4. CompleteGrowthOnboarding
5. CreateGrowthProfile
6. ProposeProfileUpdate
7. ConfirmGrowthPriority
8. StartGrowthJourney
9. SelectIntervention
10. AssignGrowthAction
11. CompleteGrowthAction
12. LogGrowthEvent
13. RecordPerspective
14. ConfirmMilestone
15. MeasureOutcome
16. ReviewGrowthCycle
17. TransitionJourneyPhase
18. CompleteGrowthJourney
19. StartNextGrowthStage
20. RaiseSafetyAlert
21. EscalateToHuman
22. GrantConsent
23. WithdrawConsent

---

# 10. 核心 Decisions

1. DetermineLifeStage
2. SelectGrowthPriorities
3. SelectPrimaryGrowthThread
4. GrowthOrProblemMode
5. RecommendIntervention
6. HumanReviewRequired
7. SelectTodayAction
8. SharedFamilyActionRequired
9. ExecutionBreakDetected
10. SafetyEscalationRequired
11. MilestoneDetected
12. MeasureGrowthProgress
13. ReprioritizeGrowth
14. TransitionJourneyPhase
15. NextBestGrowthAction
16. RecommendHumanService

---

# 11. 状态与评分原则

成长状态只使用：
- EMERGING
- DEVELOPING
- PRACTICING
- STABILIZING

且必须伴随：
- observable_signals
- evidence
- confidence
- context

禁止：
- Family Total Score
- 家庭排名
- 永久人格标签

---

# 12. Safety / Consent Ontology

家庭尤其涉及未成年人。

必须有：

### Consent
- consent_id
- guardian_id
- child_id
- purpose
- status
- granted_at
- withdrawn_at
- version

Purpose至少区分：
- service
- assessment
- personalization
- growth_tracking
- expert_service
- research
- model_improvement
- content_publication

安全信号不进入普通成长评分。

---

# 13. 第一条 Vertical Slice Ontology

```text
CreateFamily
↓
AddFamilyMember
↓
AssignLifeStage
↓
CompleteGrowthOnboarding
↓
Create 3 GrowthProfiles
↓
ConfirmGrowthPriority
↓
Start 90-Day Journey
↓
SelectIntervention
↓
AssignGrowthAction
↓
LogGrowthEvent
↓
ConfirmMilestone
↓
MeasureOutcome
↓
Update GrowthProfile
```

这个闭环跑通之前，不扩生态。
