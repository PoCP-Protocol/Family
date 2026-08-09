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
