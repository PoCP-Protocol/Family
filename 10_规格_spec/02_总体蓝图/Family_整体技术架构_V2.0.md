# Family 整体技术架构 V2.0
## Family Growth AI Platform — Enterprise Technical Architecture

---

# 1. 技术架构定位

Family不是一个AI聊天应用，而是一套面向家庭长期成长的企业级智能平台。

整体技术架构必须同时支撑：

1. 榜样教育现有课程、测评、训练营、助教、顾问、专家、社群、活动、会员等能力迁移；
2. One Family Account长期家庭账户；
3. Family Digital Twin；
4. Child / Parent / Relationship三条成长主线；
5. Growth Journey、Intervention、Action、Event、Milestone、Outcome完整闭环；
6. AI Agent与Human-in-the-loop；
7. Knowledge Foundry与Evidence体系；
8. CRM/LMS/订单/支付/直播/私域等既有系统集成；
9. Evaluation、Audit、Consent、未成年人安全；
10. Causal Learning与未来Family Growth World Model。

总原则：

# Business Stable · AI Replaceable · Platform Replaceable · Family Ontology Owned

即：

- 业务语义属于Family；
- 模型供应商可以替换；
- Ontology底层平台可以替换；
- SaaS可以替换；
- Family ID、Growth Model、Intervention、Outcome、Causal Data必须由Family掌握。

---

# 2. Family整体技术架构

```text
┌──────────────────────────────────────────────────────────────┐
│ 01 EXPERIENCE LAYER                                          │
│ Family App / Mini Program / Web                              │
│ Parent | Child | Family Growth Home                          │
│ Staff Workbench | Expert Portal | Management Console         │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 02 EXPERIENCE API / BFF                                      │
│ API Gateway | BFF | Auth | Session | Rate Limit              │
│ Consent Context | Channel Adapter                            │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 03 BUSINESS APPLICATION                                      │
│ Growth Home | Assessment | 21-Day | 90-Day Journey           │
│ Membership | Course | Community | Activity | Expert          │
│ Advisor | CRM View | Growth Operations                       │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 04 FAMILY GROWTH OS                                          │
│                                                              │
│ Family Core                                                  │
│ Family / Parent / Child / Relationship / LifeStage / Consent │
│                                                              │
│ Growth Core                                                  │
│ GrowthDomain / Dimension / Profile / Priority / Goal          │
│                                                              │
│ Journey Core                                                 │
│ Journey / Cycle / Intervention / Action / Event               │
│ Perspective / Evidence / Milestone / Outcome                 │
│                                                              │
│ Decision & Action                                            │
│ Recommendation / Decision / Named Action / Policy             │
└───────────────┬───────────────────────┬──────────────────────┘
                │                       │
                ↓                       ↓
┌──────────────────────────────┐   ┌───────────────────────────┐
│ 05 AI INTELLIGENCE           │   │ 06 HUMAN SERVICE          │
│ Model Gateway                │   │ Growth Advisor            │
│ Model Registry               │   │ Growth Companion          │
│ Prompt Registry              │   │ Expert                    │
│ Agent Runtime                │   │ Quality Reviewer          │
│ Tool Registry                │   │ Service Scheduling        │
│ Memory Service               │   │ Case Management           │
│ Decision Engine              │   │ Human Review Queue        │
│ Recommendation Engine        │   │ Human Copilot             │
│ Safety Classifier            │   │                           │
└──────────────┬───────────────┘   └────────────┬──────────────┘
               └──────────────────┬─────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────┐
│ 07 KNOWLEDGE & EVIDENCE PLATFORM                             │
│ Knowledge Foundry                                            │
│ Source → Content → Transcript → Claim → Evidence → Review     │
│ → KnowledgeCard → Intervention                               │
│                                                              │
│ Retrieval: Vector / Keyword / Reranker / Knowledge Graph      │
│ Evidence: Intervention Registry / Evidence Grade / Research    │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 08 DATA PLATFORM                                             │
│ Operational DB | Event Store | Family Timeline               │
│ Lakehouse | Feature Store | Vector Store                      │
│ Knowledge Graph | Causal Evidence Graph                       │
│ Dataset Registry | Catalog | Lineage | Data Quality           │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 09 INTEGRATION PLATFORM                                      │
│ CRM Adapter | LMS Adapter | Order / Payment Adapter           │
│ Live Adapter | IM / WeCom / Community Adapter                 │
│ Marketing Adapter | File / Media Adapter                      │
│ Anti-Corruption Layer: External DTO → Family Canonical Model  │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 10 PLATFORM INFRASTRUCTURE                                   │
│ Runtime | CI/CD | Object Storage | Cache | Queue/Event Bus     │
│ Secret Mgmt | Monitoring | Logging | Tracing | Backup / DR     │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 11 SECURITY / SAFETY / GOVERNANCE PLANE                      │
│ IAM | RBAC / ABAC | Consent | Minor Data Protection          │
│ Encryption | Audit | Retention / Deletion                     │
│ AI Evaluation | Safety Gate | Human Gate                      │
│ Model / Prompt / Agent / Knowledge Version Trace              │
└──────────────────────────────┬───────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│ 12 CAUSAL & WORLD MODEL LAYER                                │
│ Research Registry | Causal Evidence Graph                     │
│ Causal Episode Store | State Model                            │
│ Transition Model | Intervention Effect Model                  │
│ Policy Model | Simulation Runtime                             │
│ Future Family Growth World Model                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 3. 核心架构不是AI，而是Family Growth OS

Family Growth OS是整个技术架构的业务中枢。

```text
Family
│
├─ Identity
│  ├─ Parent
│  ├─ Child
│  └─ Relationship
│
├─ Context
│  ├─ LifeStage
│  ├─ Environment
│  └─ Consent
│
├─ Growth State
│  ├─ Child Growth Profile
│  ├─ Parent Growth Profile
│  └─ Relationship Growth Profile
│
├─ Growth Priority
├─ Growth Journey
├─ Intervention
├─ Growth Action
├─ Growth Event
├─ Perspective
├─ Evidence
├─ Milestone
└─ Outcome
```

AI、课程、顾问、社群和活动全部围绕这套业务语义运行。

---

# 4. Domain / Ontology技术原则

Family Core采用：

```text
Object
+
Link
+
State
+
Event
+
Decision
+
Action
+
Outcome
```

而不是：

```text
Table
+
Generic CRUD
```

核心状态禁止任意Patch。

AI不能直接写入GrowthProfile。

正确流程：

```text
Evidence
↓
AI Recommendation
↓
Schema Validation
↓
Policy / Human Gate
↓
Named Action
↓
New Profile Version
```

---

# 5. V1系统形态：Modular Monolith First

第一阶段不应一上来拆几十个微服务。

```text
Family Backend
├─ Identity
├─ Family
├─ Relationship
├─ Consent
├─ Growth
├─ Journey
├─ Intervention
├─ Event
├─ Outcome
├─ Membership
├─ Service
├─ Knowledge
├─ AI
├─ Evaluation
└─ Causal
```

第一阶段部署：

```text
Family Web / MiniApp / Staff Web
              ↓
             API
              ↓
      Modular Monolith
              ↓
 PostgreSQL / Redis / Object Storage
```

以后按真实规模拆服务，而不是提前复杂化。

---

# 6. 推荐代码结构

```text
family-platform/
├── apps/
│   ├── family-web/
│   ├── family-miniapp/
│   ├── staff-web/
│   ├── admin-web/
│   └── api/
├── packages/
│   ├── domain/
│   ├── ontology/
│   ├── contracts/
│   ├── actions/
│   ├── events/
│   ├── ai-sdk/
│   ├── evaluation/
│   ├── ui/
│   └── config/
├── modules/
│   ├── identity/
│   ├── family/
│   ├── consent/
│   ├── growth/
│   ├── journey/
│   ├── intervention/
│   ├── event/
│   ├── outcome/
│   ├── membership/
│   ├── service/
│   ├── knowledge/
│   ├── ai/
│   ├── evaluation/
│   └── causal/
├── integrations/
│   ├── crm/
│   ├── lms/
│   ├── payment/
│   ├── order/
│   ├── live/
│   ├── community/
│   └── messaging/
├── specs/
│   ├── ontology/
│   ├── actions/
│   ├── decisions/
│   ├── events/
│   └── policies/
├── evals/
├── migrations/
├── docs/
└── .claude/
```

---

# 7. AI Platform架构

业务代码不得直接绑定模型厂商。

```text
Application
↓
AI Orchestration
↓
Model Gateway
↓
Provider Adapters
├─ OpenAI
├─ Claude
├─ DeepSeek
└─ Local / Future Model
```

Model Gateway负责：

- Model Routing
- Provider Abstraction
- Retry/Fallback
- Timeout
- Cost Control
- Data Policy
- Version Tracking
- Evaluation Status

---

# 8. Agent Runtime

Agent标准执行流程：

```text
Context Builder
↓
Family Ontology Context
↓
Knowledge Retrieval
↓
Agent Reasoning
↓
Structured Recommendation
↓
Schema Validation
↓
Policy / Safety Check
↓
Human Gate
↓
Named Action API
↓
Event / Audit
```

第一阶段：

1. Family Companion
2. Parent Growth Companion
3. Growth Planner
4. Relationship Companion
5. Human Copilot

Child Growth Companion后置。

---

# 9. Memory架构

必须把“聊天记忆”和“家庭事实”分开。

## Session Memory
当前会话。

## Episodic Memory
关键事件和过去互动。

## Semantic Memory
稳定偏好和非敏感长期信息。

## Formal Growth State
正式GrowthProfile。

核心规则：

# Chat Memory ≠ Family Truth

任何聊天内容进入正式Growth State必须经过Evidence与Action流程。

---

# 10. Knowledge Foundry技术架构

```text
Source Connector
↓
Raw Content Store
↓
Parser / Transcriber
↓
Chunk
↓
Claim Extraction
↓
Deduplication
↓
Contradiction Detection
↓
Evidence Grading
↓
Expert Review
↓
KnowledgeCard Registry
↓
RAG / Search / Agent
```

必须记录：

- source
- author
- rights
- version
- claim lineage
- evidence grade
- review status

---

# 11. 数据架构：五类存储

## 11.1 Transactional Store
Family、成员、Profile、Journey、Membership、Service。

V1推荐：
PostgreSQL。

## 11.2 Event Store
Action、Event、Recommendation、Decision、Service、Outcome。

V1：
PostgreSQL Event Table + Outbox。

规模后：
Kafka / Redpanda等。

## 11.3 Analytical Lakehouse
BI、Cohort、Outcome、训练集、因果数据。

推荐：
Object Storage + Parquet。

## 11.4 Vector Store
Knowledge和Case语义检索。

V1：
pgvector即可。

## 11.5 Graph
两种图分开：

- Knowledge Graph
- Causal Evidence Graph

不要建一张“万能图”。

---

# 12. Family Timeline

所有长期成长记录由事件投影生成：

```text
Event Store
↓
Timeline Projection
↓
Family Timeline
```

避免同一个历史事实在多个系统重复保存。

---

# 13. Decision Intelligence

长期Family真正的AI价值不是聊天，而是支持关键Decision：

- DetermineLifeStage
- SelectGrowthPriority
- RecommendIntervention
- SelectTodayAction
- DetectExecutionBreak
- DetectMilestone
- RecommendHumanService
- ReprioritizeGrowth
- NextBestGrowthAction

决策可组合：

```text
Rules
+
Ontology
+
Knowledge
+
LLM
+
Statistical Model
+
Future Causal Model
```

不是所有Decision都交给LLM。

---

# 14. Workflow架构

现有课程SOP、助教SOP、评估SOP、复购SOP逐渐变成可执行流程。

例如：

```text
Journey Started
↓
Action Assigned
↓
48h No Completion
↓
AI Nudge
↓
Repeated Break
↓
Human Copilot Review
↓
Advisor Intervention
↓
Growth Event
```

V1可先用轻量State Machine。

---

# 15. 现有系统集成架构

所有现有系统经Anti-Corruption Layer进入Family：

```text
Existing CRM / LMS / Order / Payment
                ↓
             Adapter
                ↓
         Canonical DTO
                ↓
        Family Named Action
```

不允许直接把旧系统表结构变成Family Core模型。

---

# 16. 身份、权限与Consent

权限模型：

```text
RBAC
+
ABAC
+
Consent
```

角色包括：

- Parent
- Child
- Growth Advisor
- Growth Companion
- Expert
- Operations
- Reviewer
- AI Admin
- Data Analyst
- System Admin

Consent必须按Purpose管理：

- SERVICE
- ASSESSMENT
- AI_PERSONALIZATION
- GROWTH_TRACKING
- EXPERT_SERVICE
- RESEARCH
- MODEL_IMPROVEMENT
- CONTENT_PUBLICATION

---

# 17. Safety架构

Safety是横切控制平面：

```text
Input
↓
Safety Detection
↓
Risk Classification
↓
Policy
↓
Allowed / Restricted / Escalate
↓
Human Review
```

安全信号不得混入普通成长评分。

---

# 18. Evaluation架构

任何：

- Model Change
- Prompt Change
- Agent Change
- Knowledge Change

必须进入：

```text
Evaluation Runner
↓
Professional Golden Set
Safety Golden Set
Adversarial Golden Set
↓
Regression Comparison
↓
Release Gate
```

---

# 19. Observability与可追溯

每次关键AI行为记录：

```text
trace_id
family_id
actor
agent_version
model_version
prompt_version
knowledge_version
policy_version
tool_calls
recommendation
human_decision
named_action
latency
cost
safety_result
eventual_outcome_id
```

这样未来可以回答：

> 当时AI为什么对这个家庭提出这个建议？

---

# 20. DevOps / LLMOps

环境：

```text
DEV
↓
TEST
↓
EVAL
↓
PILOT
↓
PROD
```

Pipeline：

```text
Code
↓
Unit Test
↓
Domain Contract
↓
Integration Test
↓
AI Evaluation
↓
Security Check
↓
Pilot
↓
Production
```

---

# 21. 基础设施演进

V1优先简单稳定：

- Docker
- PostgreSQL
- Redis
- Object Storage
- pgvector
- CI/CD
- Central Logging
- Metrics/Tracing

达到真实规模后再升级：

- Kubernetes
- Kafka/Redpanda
- Dedicated Workflow
- Dedicated Vector DB
- Lakehouse
- Feature Store
- Graph DB
- GPU Inference

---

# 22. Build vs Buy边界

## Family必须自主Build

- Family Account
- Family Ontology
- Growth Profile
- Growth Priority
- Growth Journey
- Intervention Registry
- Growth Action/Event
- Milestone
- Outcome
- Family Timeline
- Decision Contracts
- Agent Logic
- Knowledge Foundry Domain
- Evaluation Domain
- Causal Episode
- Causal Evidence Graph

## 优先Buy / Integrate

- Payment
- Order
- Live Streaming
- Basic CRM
- LMS / 教务
- SMS
- Base IM
- Invoice
- CDN / File
- Commodity Cloud

---

# 23. Causal Platform

Pilot开始后逐步建设：

```text
Research Dataset Registry
↓
Causal Evidence Registry
↓
Causal Edge
↓
Family Causal Episode
↓
Causal Dataset Builder
↓
Effect Estimation
```

---

# 24. World Model架构

长期分四个模型：

## State Model
这个家庭现在是什么状态？

## Transition Model
不干预会怎样变化？

## Intervention Model
采取A/B/C会怎样变化？

## Policy Model
当前下一步最值得做什么？

```text
Family State_t
     │
     ├─ Action A → Future Distribution A
     ├─ Action B → Future Distribution B
     └─ Action C → Future Distribution C
                       ↓
                 Policy Recommendation
                       ↓
                    Human Gate
                       ↓
                    Real Action
                       ↓
                   Real Outcome
                       ↓
                      Learn
```

---

# 25. World Model前置条件

以下未达到，不启动复杂World Model训练：

1. Family ID稳定；
2. State可计算；
3. Intervention标准化；
4. Action标准化；
5. Outcome可测；
6. 时间点完整；
7. Context完整；
8. Causal Episode有基础规模；
9. Evaluation成熟；
10. 数据使用权清晰。

---

# 26. 技术实施里程碑

## T-M1 Family Core Running
系统能够真正认识并管理一个家庭。

## T-M2 Growth Loop Running
Profile→Intervention→Action→Outcome完整运行。

## T-M3 AI in the Loop
AI支持Decision，但不能绕过Policy/Human Gate。

## T-M4 Data Learning Ready
Event和Outcome成为可分析资产。

## T-M5 Causal Learning Starts
持续产生Causal Episode。

## T-M6 World Model Foundation
具备State/Transition/Intervention建模基础。

---

# 27. 技术架构最终定义

> **Family的技术核心不是“大模型”，而是以Family Ontology为业务语义层，以Family Growth OS为运行核心，以AI Decision为智能层，以Knowledge/Evidence为认知基础，以Human Gate为安全边界，以Outcome与Causal Episode为学习数据，并逐步演进成Family Growth World Model。**
