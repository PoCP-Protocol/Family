# Family 家庭成长AI平台详细方案 V2.0

> 本文件是产品、教研、交付、架构、研发和数据团队的共同实施说明。主线为：业务 → Ontology → 产品 → 服务 → AI → 数据 → 技术 → 迁移。

# 第一篇｜业务与产品实施

# 01｜Family 总体产品架构
## Family Growth AI Platform Product Architecture V1.0

---

# 1. 产品战略定位

Family 不是课程商城、AI问答工具或单一测评系统，而是：

# Family Growth AI Platform
## 家庭成长智能平台

统一经营对象从：

`一次成交的课程客户`

升级为：

`持续成长的家庭 Family`

统一价值链：

```text
内容/场景触发
↓
Family Account
↓
Growth Onboarding
↓
Growth Profile
↓
Growth Priority
↓
Intervention
↓
Growth Action
↓
Growth Event
↓
Milestone
↓
Outcome
↓
Next Growth Journey
```

长期形成：

```text
Family Growth OS
+
Family AI Platform
+
Human Service Platform
+
Knowledge Foundry
+
Causal Intelligence
+
World Model
```

---

# 2. 三条核心成长主线

## 2.1 Child Growth

一期维度：

- C01 自我认知与身份发展
- C02 情绪识别与调节
- C03 能动性与选择能力
- C04 自我调节与执行
- C05 学习能力与成长动机
- C06 连接与社会能力
- C07 责任与贡献
- C08 韧性与适应

## 2.2 Parent Second Growth

一期维度：

- P01 父母自我觉察
- P02 父母情绪调节
- P03 理解与共情倾听
- P04 独立与自主支持
- P05 期待与成长观
- P06 边界与一致性
- P07 正向引导与反馈
- P08 父母身份与自我持续成长

## 2.3 Relationship Growth

一期维度：

- R01 情感连接
- R02 信任与心理安全
- R03 沟通质量
- R04 冲突调节
- R05 关系修复
- R06 边界与自主
- R07 共识与共同规则
- R08 家庭协作与韧性

---

# 3. Family 产品体系全景

Family 产品体系分为六个平台、二十三个产品模块。

## P1 Family Growth Platform｜家庭成长平台

### P1.1 Family Account
统一家庭账户，所有业务围绕 `family_id` 组织。

### P1.2 Family Onboarding
通过对话、测评、历史服务数据构建初始家庭状态。

### P1.3 Family Growth Home
首页显示三条成长线、今日行动、当前Journey、最近Milestone。

### P1.4 Growth Profile
孩子、家长、关系三张并列成长画像。

### P1.5 Growth Priority
当前阶段最值得关注的成长重点。

### P1.6 Growth Journey
21天、90天、年度等阶段成长旅程。

### P1.7 Growth Action
把课程知识转成真实生活中可执行的小行动。

### P1.8 Growth Event
记录家庭真实发生的变化与事件。

### P1.9 Milestone
记录值得长期保存的真实成长节点。

### P1.10 Family Growth Review
Day14/35/60/90等阶段回顾。

### P1.11 Family Timeline
从孩子年龄和LifeStage维度形成长期成长时间轴。

---

## P2 Learning & Intervention Platform｜学习与干预平台

### P2.1 Content Library
现有课程、直播、文章、音视频。

### P2.2 KnowledgeCard
经知识工厂审核后可供AI使用的知识单元。

### P2.3 Intervention Library
把课程和方法拆成可被系统调用的成长干预。

### P2.4 Growth Program
21天挑战、训练营、90天计划。

### P2.5 Action Template Library
不同成长维度对应的行动模板。

---

## P3 Human Service Platform｜人工服务平台

### P3.1 Growth Advisor
顾问围绕Family Profile和Journey服务家庭。

### P3.2 Class/Growth Companion
承接现有助教/班主任能力。

### P3.3 Expert Service
专家咨询、专题干预。

### P3.4 Service Scheduling
预约、调度、服务记录。

### P3.5 Consultant Workbench
顾问工作台：家庭优先级、预警、行动、Outcome。

### P3.6 Quality Review
服务质检和专业复核。

---

## P4 Membership & Community Platform｜会员与社群平台

### P4.1 Family Growth Membership
年度会员从权益卡升级为持续成长服务关系。

### P4.2 Benefit Center
课程、顾问、专家、活动等权益。

### P4.3 Growth Community
家长社群、主题群、阶段群。

### P4.4 Family Activity
沙龙、工作坊、城市活动、研学等。

### P4.5 Growth Referral
基于真实Milestone和Outcome的用户推荐。

---

## P5 Family AI Platform｜AI智能平台

### P5.1 Family Companion
统一家庭AI入口。

### P5.2 Parent Growth Companion
服务家长第二次成长。

### P5.3 Growth Planner
生成/调整阶段计划和今日行动。

### P5.4 Relationship Companion
支持沟通、冲突、修复、共同规则。

### P5.5 Child Growth Companion
第二阶段上线，必须强调孩子自主而非家长监控。

### P5.6 Human Copilot
服务顾问、助教、专家。

---

## P6 Management & Operations Platform｜经营与运营平台

### P6.1 Family CRM View
围绕家庭而非Lead查看经营关系。

### P6.2 Growth Operations
Journey运营、任务运营、预警。

### P6.3 Membership Operations
续费、权益、活跃。

### P6.4 Content Operations
内容触达与增长。

### P6.5 Management Dashboard
用户、增长、交付、AI、数据、Outcome综合经营看板。

---

# 4. 产品阶梯

保留现有成熟商业结构，但重新定义底层语义。

```text
免费入口
Family Growth Conversation / Assessment
↓
21 Day Growth Cycle
第一次可见小改变
↓
90 Day Family Growth Journey
系统性共同成长
↓
Annual Family Growth Membership
长期陪伴
↓
Specialist Services
顾问 / 专家 / 活动
↓
Family Ecosystem
城市 / 专家 / 机构 / 服务网络
```

---

# 5. 用户主路径

## 5.1 Problem Entry

```text
手机 / 厌学 / 拖延 / 冲突 / 情绪
↓
Scenario
↓
Growth Onboarding
↓
三条Growth Profile
↓
Growth Priority
↓
Journey
```

## 5.2 Growth Entry

```text
孩子进入某LifeStage
↓
“我想知道怎么陪孩子走过这一阶段”
↓
Growth Profile
↓
Growth Priority
↓
Journey
```

长期必须让用户即使没有严重问题也愿意使用Family。

---

# 6. 第一核心产品：12—15岁90天共同成长

## Phase 1｜SEE｜Day 1–14

核心目标：看见孩子、家长、关系。

核心产物：
- 初始Profile
- 关键Perspective
- Growth Priority

## Phase 2｜PARENT_FIRST｜Day 15–35

核心目标：家长先改变自己能够改变的部分。

重点：
- P02
- P03
- P04
- P05
- P06
- R03
- R04
- R05

## Phase 3｜CO_CREATE｜Day 36–60

核心目标：孩子参与成长目标和家庭规则。

重点：
- C03
- C04
- C07
- P04
- P06
- P07
- R06
- R07
- R08

## Phase 4｜STABILIZE｜Day 61–90

核心目标：让新互动方式跨时间、跨场景逐步稳定。

结束输出：
- Child Growth Review
- Parent Second Growth Review
- Relationship Growth Review
- Family Milestones
- 下一阶段建议

---

# 7. 五个业务闭环

## 7.1 获客闭环

`Content → Assessment → Family Account`

## 7.2 成长闭环

`Profile → Priority → Intervention → Action → Outcome`

## 7.3 服务闭环

`AI → Advisor → Expert → Service → Review`

## 7.4 商业闭环

`21 Day → 90 Day → Membership → Specialist → Next Journey`

## 7.5 学习闭环

`Action → Event → Outcome → Causal Episode → Better Decision`

---

# 8. 产品设计原则

1. Family是长期对象，Order只是交易对象。
2. 首页先看家庭成长，不先看课程。
3. AI是能力，不是产品全部。
4. 不做Family Total Score。
5. 不做家庭排行。
6. 不把Child Growth定义为服从。
7. Parent Growth是一等产品。
8. Milestone比连续打卡更重要。
9. Growth Profile是动态阶段状态，不是人格标签。
10. 每个产品功能必须可进入Outcome闭环。

---

# 9. V1产品范围

V1必须做：
- Family Account
- 12–15 LifeStage
- Growth Onboarding
- 三张Growth Profile
- 90-Day Journey
- Intervention Library V1
- Growth Action
- Growth Event
- Milestone
- Outcome
- Family Home
- Parent Growth
- Family Companion
- Human Copilot
- Knowledge Foundry V1
- Evaluation V1

V1暂不做：
- 全年龄段
- 大型社区
- 全国城市生态
- 开放Agent市场
- 高自治Child Agent
- 大型神经世界模型
- Family Ranking / Total Score


---

# 第二篇｜业务架构与Ontology

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
- FAMILY

### GrowthDimension
24个一期维度。

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


---

# 第三篇｜技术架构与AI平台

# 03｜Family 技术架构
## Family Growth AI Platform Technical Architecture V1.0

---

# 1. 技术目标

技术平台必须同时满足：

1. 支撑现有教育业务迁入；
2. 支撑Family长期家庭账户；
3. 支撑Ontology-first业务语义；
4. 支撑AI模型可替换；
5. 支撑Agent/Tool/Workflow；
6. 支撑Knowledge/Evidence；
7. 支撑Outcome和因果数据；
8. 支撑未来World Model，但不为世界模型过度提前设计；
9. 强安全、审计、可追溯；
10. 未成年人数据治理。

---

# 2. 总体技术架构

```text
┌────────────────────────────────────┐
│ Experience                         │
│ Parent Web/MiniApp | Staff | Child │
└────────────────┬───────────────────┘
                 ↓
┌────────────────────────────────────┐
│ API Gateway / BFF                  │
│ Auth / RateLimit / Consent Context │
└────────────────┬───────────────────┘
                 ↓
┌────────────────────────────────────┐
│ Domain Services                    │
│ Family | Growth | Journey |        │
│ Intervention | Service | Outcome   │
└────────────────┬───────────────────┘
                 ↓
┌────────────────────────────────────┐
│ Ontology & Action Layer            │
│ Objects / Links / Named Actions    │
│ Decision Contracts / Audit         │
└───────┬─────────────┬──────────────┘
        ↓             ↓
┌───────────────┐ ┌──────────────────┐
│ AI Platform   │ │ Data Platform    │
│ Model Gateway │ │ OLTP/Event/Lake  │
│ Agent Runtime │ │ Feature/Timeline │
│ Prompt/Tool   │ │ Analytics        │
└───────┬───────┘ └────────┬─────────┘
        ↓                  ↓
┌────────────────────────────────────┐
│ Knowledge & Causal Platform        │
│ KG / Vector / Evidence / Causal    │
└────────────────┬───────────────────┘
                 ↓
┌────────────────────────────────────┐
│ Eval / Safety / Observability      │
│ Golden Set / Trace / Audit / Alert │
└────────────────┬───────────────────┘
                 ↓
┌────────────────────────────────────┐
│ Future: World Model Runtime        │
│ State / Transition / Intervention  │
└────────────────────────────────────┘
```

---

# 3. 系统边界原则

## Build

Family自主建设：
- Family Account
- Family Ontology
- Growth Profile
- Growth Journey
- Growth Priority
- Intervention Registry
- Growth Action/Event/Milestone
- Outcome
- Family Timeline
- Agent Runtime Integration
- Knowledge Foundry
- Evaluation
- Causal Platform

## Buy / Integrate

优先复用：
- 支付
- 订单
- 直播
- 基础教务
- 基础CRM
- 发票
- 短信
- IM基础设施
- 文件存储
- 视频云
- 基础商城

---

# 4. 应用层

建议应用：

### Parent App / Mini Program
- 家庭首页
- 90天Journey
- 我的第二次成长
- AI Companion
- 会员/服务/活动

### Child Experience
二阶段独立设计。

### Staff Web
- 顾问工作台
- 家庭Case
- Journey执行
- 预警
- Human Review
- 服务记录

### Expert Portal
- 专业评审
- Intervention Review
- 高风险Case

### Admin / Ops
- 会员
- 课程
- 内容
- 活动
- 运营
- 数据

---

# 5. Domain Service层

建议按Bounded Context拆分：

1. identity-service
2. family-service
3. growth-profile-service
4. journey-service
5. intervention-service
6. action-event-service
7. outcome-service
8. service-interaction-service
9. membership-service
10. knowledge-service
11. ai-orchestration-service
12. evaluation-service
13. causal-service
14. safety-consent-service

V1可以先模块化单体，不强制微服务。

关键是Domain Boundary先正确。

---

# 6. OntologyAdapter

业务层不得直接依赖某一Ontology平台。

```text
Domain Service
      ↓
OntologyAdapter
      ├─ LocalOntologyAdapter
      └─ PalantirOntologyAdapter / Future Adapter
```

原则：

# Family Ontology Owns

业务模型、ID、Action Contract必须由Family掌握。

---

# 7. 数据架构

## 7.1 Transactional Store
存储家庭业务核心状态。

建议：
- PostgreSQL / MySQL

## 7.2 Event Store
存储：
- GrowthAction
- GrowthEvent
- AI decision trace
- service events
- membership events

可采用：
- Kafka/Redpanda + OLTP event tables

V1小规模可以先用数据库Outbox。

## 7.3 Analytical Lakehouse
用于长期分析、训练、因果数据集。

建议：
- Object Storage + Parquet
- DuckDB/Spark/Trino按规模升级

## 7.4 Vector Store
只用于语义检索，不替代知识图谱/Ontology。

## 7.5 Knowledge Graph
KnowledgeCard、Claim、Evidence、Intervention关系。

## 7.6 Causal Graph
独立保存：
- study
- population
- context
- edge
- mediator
- effect
- confidence

---

# 8. AI平台架构

## 8.1 Model Gateway

所有模型统一通过Gateway。

职责：
- model routing
- provider abstraction
- retry/fallback
- cost
- latency
- version
- data policy

## 8.2 Model Registry

记录：
- provider
- model
- purpose
- evaluation status
- approved use cases
- prohibited use cases

## 8.3 Prompt Registry

任何生产Prompt必须：
- prompt_id
- version
- owner
- linked agent
- eval score
- rollout status

## 8.4 Agent Runtime

Agent不直接拥有数据库权限。

流程：

```text
Context Builder
↓
Agent Reasoning
↓
Structured Recommendation
↓
Policy Gate
↓
Action API
```

## 8.5 Tool Registry

每个Tool定义：
- name
- input schema
- permission
- risk
- idempotency
- audit

---

# 9. Agent数据权限

## Family Companion
可读：
- 当前Family context
- Growth Profile
- Journey
- Action/Event
- Knowledge

默认不可直接：
- 修改核心Profile
- 触发高风险服务

## Parent Companion
只使用与家长成长相关且有授权的数据。

## Human Copilot
按Staff权限读取家庭必要信息。

## Child Agent
必须独立Consent/Privacy策略。

---

# 10. AI输出结构

禁止关键流程依赖自由文本。

示例：

```json
{
  "recommendation_id": "REC-001",
  "family_id": "F-001",
  "decision": "SELECT_TODAY_ACTION",
  "candidate_action": "PARENT_LISTEN_FIRST",
  "evidence_ids": ["EV-01", "EV-05"],
  "confidence": "MEDIUM",
  "human_review_required": false,
  "reason_codes": ["P03_PRIORITY", "RECENT_CONFLICT"],
  "model_version": "..."
}
```

Schema校验失败不得写入正式Recommendation。

---

# 11. Knowledge Foundry技术流

```text
Ingest
↓
Rights Check
↓
Transcribe/Parse
↓
Chunk
↓
Claim Extraction
↓
Dedup
↓
Contradiction Link
↓
Evidence Grade
↓
Expert Review
↓
KnowledgeCard
↓
Publish to Retrieval
```

必须保留：
- source
- version
- rights
- claim lineage

---

# 12. Evaluation Platform

至少支持：

### Dataset Registry
- Professional Golden Set
- Safety Set
- Adversarial Set

### Evaluation Runner
对每次：
- model
- prompt
- agent
- knowledge
变更做回归。

### Metrics
- professional accuracy
- evidence grounding
- unsupported claim rate
- safety recall
- human overturn
- abstention quality
- latency
- cost

### Release Gate
未达阈值不得生产。

---

# 13. Observability

每次AI交互至少记录：

- trace_id
- family_id（脱敏/权限受控）
- user/actor
- agent_version
- model_version
- prompt_version
- knowledge_version
- tool_calls
- recommendation
- action
- latency
- token/cost
- safety result
- eventual outcome link

---

# 14. Consent / Privacy / Security

必须建设：
- Purpose-specific Consent
- Guardian consent
- Minor data policy
- data minimization
- role-based access
- sensitive field encryption
- audit log
- deletion/withdrawal workflow
- data retention
- model-improvement opt-in separation

服务同意不能自动等同于模型训练同意。

---

# 15. Integration架构

对现有系统采用Anti-Corruption Layer。

```text
Existing SaaS / CRM / LMS
↓
Integration Adapter
↓
Canonical Event / DTO
↓
Family Domain
```

禁止直接把旧系统字段模型扩散到Family Core。

---

# 16. API原则

API围绕Domain Action设计，而不是generic patch。

示例：

```text
POST /families
POST /families/{id}/members
POST /families/{id}/onboarding
GET  /families/{id}/growth-home
POST /families/{id}/growth-priorities/confirm
POST /journeys/{id}/start
POST /journeys/{id}/actions/assign
POST /actions/{id}/complete
POST /families/{id}/events
POST /journeys/{id}/milestones/confirm
POST /outcomes/measure
POST /consents/grant
POST /consents/withdraw
```

避免：
`PATCH /family/{id} { arbitrary_fields }`

---

# 17. 推荐技术路线（V1）

如果团队希望统一技术栈：

### Frontend
- React / Next.js 或 Vite
- 小程序可Taro/React TS

### Backend
- NestJS + TypeScript
- Zod / JSON Schema
- OpenAPI

### Data
- PostgreSQL
- Redis
- Object Storage
- pgvector起步

### Workflow
V1可自研轻量状态机/队列；
复杂后再引入Temporal等。

### AI
- Model Gateway
- 多模型provider adapter
- structured output
- eval framework

### Testing
- Vitest/Jest
- Contract Test
- Golden Eval

不要为了“先进”在V1引入过多分布式组件。

---

# 18. World Model技术演进

## WM1
Ontology-aware Retrieval + Rule/LLM。

## WM2
Decision/Action policy。

## WM3
Outcome learning。

## WM4
Causal feature/data pipeline。

## WM5
Simulation。

## WM6
Adaptive Policy。

世界模型前：
先积累Causal Episode。

---

# 19. 非功能指标

### Availability
核心家庭服务目标 ≥ 99.9%（规模后）

### Traceability
关键AI recommendation 100%可追溯。

### Safety
高风险signal必须进入Gate。

### Data Quality
核心family_id、life_stage、profile version、event timestamp完整。

### Performance
家长端常规API p95目标<500ms；
AI交互按场景分级。

### Cost
每Family建立AI成本预算和用量监控。

---

# 20. 技术实施优先级

1. Identity + Family Account
2. Ontology + Actions
3. Profile + Journey
4. Event + Outcome
5. Intervention
6. Integration
7. AI Gateway
8. Family/Parent Agent
9. Knowledge Foundry
10. Eval
11. Pilot data
12. Causal
13. World Model


---

# 第四篇｜现有业务迁移

# 04｜Family 现有业务迁移矩阵
## Existing Business → Family Target Model V1.0

迁移原则：

- **保留**：业务价值已经成立，直接进入Family。
- **改造**：保留能力，但改变语义、数据结构或流程。
- **集成**：成熟Commodity能力继续由现有SaaS承担。
- **淘汰/降级**：与Family长期价值冲突。
- **后置**：长期需要，但不进入V1。

下面矩阵作为第一版全量迁移底稿。


## 迁移矩阵

| ID | 现有资产 | 现状形态 | 策略 | Family目标对象/模块 | 改造重点 | 技术方式 | 优先级 | Owner | 计划 |
|---|---|---|---|---|---|---|---|---|---|
| M001 | 客户/线索 | 客户档案 | 改造 | Family Account / Family | family_id作为长期主键；Lead只保留增长视图 | CRM Adapter | P0 | 产品+数据 | 0-60天 |
| M002 | 家长信息 | 客户联系人 | 改造 | Parent | 分离身份、家庭角色、Consent | CRM/User | P0 | 数据 | 0-45天 |
| M003 | 孩子信息 | 备注/测评 | 改造 | Child | 建立独立对象和Guardian关系 | Family Core | P0 | 产品+数据 | 0-45天 |
| M004 | 家庭成员关系 | 弱/无 | 新建 | FamilyRelationship | 亲子、夫妻、兄弟姐妹等 | Family Core | P0 | Ontology | 0-60天 |
| M005 | 家庭测评 | 问卷/报告 | 改造 | Assessment + Growth Onboarding | 从一次测评升级动态画像输入 | Assessment Adapter | P0 | 产品+教研 | 30-75天 |
| M006 | AI诊断 | 报告文本 | 改造 | Growth Insight / Recommendation | 避免临床化语言；Evidence驱动 | AI Platform | P0 | AI+教研 | 60-105天 |
| M007 | 家庭档案 | 测评/报告/成长记录 | 改造 | GrowthProfile + FamilyTimeline | 三张成长画像+时间线 | Family Core | P0 | 产品+数据 | 30-90天 |
| M008 | 课程 | 视频/课件 | 改造 | Course + KnowledgeCard + Intervention | 课程拆知识/方法/行动 | Knowledge Foundry | P0 | 教研 | 30-120天 |
| M009 | 训练营 | 班级+内容 | 改造 | GrowthProgram | 与Journey/Profile关联 | Learning Adapter | P0 | 产品+交付 | 45-105天 |
| M010 | 21天挑战 | 任务+打卡 | 改造 | 21-Day GrowthCycle | 任务变GrowthAction | Journey Service | P0 | 产品+交付 | 45-105天 |
| M011 | 90天陪跑 | 课程+顾问+群 | 改造 | 90-Day GrowthJourney | 四阶段+Outcome | Journey Service | P0 | 产品+交付 | 45-120天 |
| M012 | 年度会员 | 会员权益 | 改造 | Family Growth Membership | 从优惠权益升级持续陪伴关系 | Membership Adapter | P1 | 商业化 | 90-150天 |
| M013 | 任务 | 学习任务 | 改造 | GrowthAction | 必须绑定Dimension/Intervention | Action Service | P0 | 产品+教研 | 45-90天 |
| M014 | 打卡 | 完成记录 | 改造 | ActionCompletion Event | 形成Event/Evidence | Event Service | P0 | 数据+研发 | 45-90天 |
| M015 | 作业点评 | 助教文本 | 改造 | HumanObservation / Feedback | 结构化Evidence+Perspective | Staff Workbench | P1 | 交付 | 75-135天 |
| M016 | 助教 | 提醒/点评 | 改造 | Growth Companion + Human Copilot | 从催打卡转成长陪伴 | Staff Platform | P0 | 交付+AI | 75-120天 |
| M017 | 班主任 | 班级服务 | 改造 | Growth Advisor / Service Owner | 围绕Family Case管理 | Staff Platform | P1 | 交付 | 90-150天 |
| M018 | 顾问 | 咨询/销售混合 | 改造 | Human Growth Advisor | 专业服务和商业推荐分离 | Staff Platform | P0 | 交付 | 75-135天 |
| M019 | 专家 | 名师/咨询 | 保留+改造 | Expert + Specialist Intervention | 专业服务进入Journey/Outcome | Service Platform | P1 | 教研+服务 | 90-150天 |
| M020 | 社群 | 微信群 | 集成+改造 | GrowthCommunity | 群继续存在，事件回写Family | Community Adapter | P1 | 运营 | 90-150天 |
| M021 | 沙龙/活动 | 报名活动 | 保留+改造 | FamilyActivity | 绑定Family Journey/Outcome | Activity Service | P1 | 运营 | 90-150天 |
| M022 | 城市活动 | 区域运营 | 后置 | City Growth Network | 第二年平台化重点 | Ecosystem | P2 | 战略 | 180天后 |
| M023 | 课程SOP | 文档 | 改造 | Executable Workflow | 流程进入Workflow Engine | Workflow | P0 | 交付+研发 | 30-120天 |
| M024 | 助教SOP | 文档 | 改造 | Growth Service Workflow | 提醒/中断/升级规则化 | Workflow | P0 | 交付+AI | 45-120天 |
| M025 | 运营SOP | 文档 | 改造 | Growth Operations Workflow | Journey、会员、活动运营 | Workflow | P1 | 运营 | 90-150天 |
| M026 | 评估SOP | 报告流程 | 改造 | Outcome Measurement Workflow | 阶段Review标准化 | Outcome Service | P0 | 教研+数据 | 45-120天 |
| M027 | 复购SOP | 销售流程 | 改造 | Next Growth Journey Decision | 从卖课升级下一阶段成长 | Membership/Decision | P1 | 商业化 | 90-150天 |
| M028 | 质检SOP | 抽查 | 改造 | Quality & Eval Platform | Human+AI质检 | Evaluation | P1 | 交付+AI | 90-150天 |
| M029 | 成长报告 | PDF/文本 | 改造 | Family Growth Review | Child/Parent/Relationship分开 | Review Service | P0 | 产品+教研 | 60-120天 |
| M030 | 成功案例 | 营销素材 | 改造 | OutcomeCase | 需Evidence与授权 | Knowledge/Marketing | P1 | 运营+教研 | 90-150天 |
| M031 | 内容获客 | 短视频/直播 | 保留 | Growth Discovery Content | 继续做增长入口 | Marketing | P0 | 增长 | 持续 |
| M032 | 私域运营 | 社群/企微 | 保留+集成 | Family Engagement | 事件回传Family | CRM/Community Adapter | P1 | 增长 | 90-150天 |
| M033 | 裂变/邀请 | 邀请权益 | 改造 | Growth Referral | 围绕真实Milestone分享 | Referral Service | P1 | 增长 | 120-180天 |
| M034 | 积分商城 | 积分/礼品 | 降级 | Membership Benefit | 不能成为成长核心激励 | Membership | P2 | 商业化 | 120天后 |
| M035 | 排行榜 | 游戏排名 | 淘汰 | N/A | 与Family价值观冲突 | N/A | 禁止 | 产品 | 立即 |
| M036 | 家庭总分 | 综合评分 | 淘汰 | GrowthProfile States | 改为Strength/Opportunity/Evidence | Family Core | 禁止 | 产品+教研 | 立即 |
| M037 | 订单 | 订单系统 | 集成 | OrderRef | 继续外部成熟系统 | Commerce Adapter | P0 | 平台 | 0-90天 |
| M038 | 支付 | 支付平台 | 集成 | PaymentRef | 不重复研发 | Commerce Adapter | P0 | 平台 | 0-90天 |
| M039 | 直播 | 直播SaaS | 集成 | LearningSessionRef | 不重复研发 | Learning Adapter | P1 | 平台 | 60-120天 |
| M040 | 教务 | 教培SaaS | 集成 | Program/Class Reference | 保留成熟SaaS | LMS Adapter | P0 | 平台 | 0-120天 |
| M041 | CRM | 线索/成交 | 集成+重构视图 | Family CRM View | CRM仍做增长，Family做长期对象 | CRM Adapter | P0 | 平台+产品 | 0-120天 |
| M042 | 客服 | 售后入口 | 集成 | SupportInteraction | 服务记录进入Family Timeline | Support Adapter | P1 | 运营 | 90-150天 |
| M043 | 会话记录 | 散落聊天 | 改造 | ServiceInteraction / Perspective | 分权限存储，不能全部当Fact | Data Platform | P0 | 数据+安全 | 45-120天 |
| M044 | 用户画像 | 标签 | 改造 | GrowthProfile | 动态、阶段性、Evidence驱动 | Family Core | P0 | 数据+教研 | 30-90天 |
| M045 | 知识库 | 文档/向量库 | 改造 | Knowledge Foundry | Claim/Evidence/Review机制 | Knowledge Platform | P0 | AI+教研 | 60-120天 |
| M046 | 家长顾问Agent | 初步Agent | 改造 | Parent Growth Companion | 绑定P-domain和Outcome | AI Platform | P0 | AI | 75-120天 |
| M047 | 孩子陪练Agent | 初步Agent | 后置 | Child Growth Companion | 需Consent/独立UX | AI Platform | P2 | AI+安全 | 150天后 |
| M048 | 助教助手 | 初步Agent | 升级 | Human Copilot | 家庭优先级/预警/建议 | AI Platform | P0 | AI+交付 | 75-120天 |
| M049 | 成长规划师 | 初步Agent | 升级 | Growth Planner | Profile→Priority→Plan | AI Platform | P0 | AI+产品 | 75-120天 |
| M050 | 经营助手 | 管理AI | 保留+后置 | Management Copilot | 基于统一数据 | Analytics/AI | P1 | 数据+管理 | 120-180天 |
| M051 | 预警 | 人工判断 | 改造 | Alert + Safety Gate | 安全和执行中断分离 | Safety/Workflow | P0 | 安全+交付 | 60-120天 |
| M052 | 用户数据授权 | 零散协议 | 重构 | Consent | 按purpose管理 | Safety Service | P0 | 法务+安全 | 0-60天 |
| M053 | 历史成长数据 | 散落业务库 | 迁移 | Family Timeline/Event | 分批清洗映射 | Data Migration | P0 | 数据 | 30-120天 |
| M054 | 研究/实验数据 | 无统一 | 新建 | Causal Evidence Registry | 后续世界模型底座 | Causal Platform | P1 | 数据科学 | 120-180天 |
| M055 | 真实干预结果 | 案例/口碑 | 新建结构化 | CausalEpisode | Context/State/Action/Outcome | Causal Platform | P1 | 数据科学+交付 | 90-180天 |


---

# 迁移批次

## Batch 1｜P0基础资产
0–90天：
- Family Account
- Parent/Child/Relationship
- Assessment
- GrowthProfile
- Course→Intervention
- 21/90 Journey
- Action/Event
- Outcome
- CRM/LMS/Order基础集成
- Consent

## Batch 2｜服务与AI
75–150天：
- Growth Advisor
- Human Copilot
- Family/Parent Agent
- Community
- Membership
- Expert
- Review/Eval

## Batch 3｜因果与生态
120天以后：
- CausalEpisode
- Causal Evidence
- Referral
- City
- Child Agent
- Ecosystem

---

# 数据迁移原则

1. 不直接把旧“标签”写入GrowthProfile。
2. 历史主观描述默认转换为Perspective或Raw Record。
3. 历史打卡可迁成ActionCompletion，但不能自动推导成长Outcome。
4. 历史报告作为Evidence Source，不作为新的事实唯一来源。
5. 每条迁移数据保留source_system/source_id/migration_version。
6. 所有敏感数据迁移必须先完成Consent/合法性评估。


---

# 第五篇｜实施边界与关键决策

## V1必须完成
- Family Account
- 12–15岁LifeStage
- 24维Growth Model
- 三张Growth Profile
- 90-Day Journey
- Intervention Registry V1
- Growth Action/Event/Milestone/Outcome
- Family Home / Parent Growth
- Family Companion / Parent Companion / Human Copilot
- Knowledge Foundry V1
- Evaluation V1
- 30→100家庭Pilot

## V1明确不做
- 全年龄段
- 大型社区
- 全国城市生态
- Agent Marketplace
- 高自治Child Agent
- 大型神经World Model
- Family Total Score / Ranking

## Build vs Integrate
Family自主Build：Family Account、Ontology、Profile、Journey、Intervention、Event、Outcome、Timeline、Agent逻辑、Knowledge、Evaluation、Causal。

优先Integrate：支付、订单、直播、基础CRM、教务、发票、短信、IM、基础商城。
