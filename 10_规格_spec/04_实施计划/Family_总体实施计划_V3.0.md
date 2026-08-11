# Family 家庭成长AI平台总体实施计划 V3.0

> **STATUS: SUPERSEDED_FOR_EXECUTION / RETAINED_FOR_HISTORY**（自 2026-08-11，M3-RB-002）
> 当前执行主计划 SSOT 为 `Family_总体实施计划_V3.3.md`。本文件仅保留历史。

版本：V3.0
日期：2026-08-10
状态：执行层主计划

## 1. Rebaseline

V3.0 不推翻战略蓝图，正式调整“如何做出来”。

执行路线由：

Platform First

调整为：

真实家庭场景
→ Vertical Slice
→ Outcome
→ 产品化
→ 规模化
→ 因果学习
→ World Model

以后每条核心能力必须以：

Domain + Data + API + Frontend + AI(需要时) + Safety + Test + Demo + Outcome

共同交付。

## 2. 不变量

- Family 是主体，不是“修孩子”。
- Child Growth + Parent Second Growth + Relationship Growth。
- Perspective != Fact。
- AI Hypothesis != Fact。
- Recommendation != Decision != Action。
- 核心状态必须走 Named Action。
- AI自由文本不得直接修改GrowthProfile/Ontology。
- 不做Family Total Score。
- 不做家庭Ranking。
- Consent purpose必须隔离。
- 未成年人数据受Consent/Permission/Safety约束。
- Outcome First。
- World Model必须后于真实State/Action/Outcome数据。

## 3. Roadmap

### M0 — Architecture & Engineering Foundation
状态：CLOSED

### M1 — Real Family Core
状态：CLOSED

已完成：
CreateFamily
→ AddParent
→ AddChild
→ CreateFamilyRelationship
→ AssignLifeStage
→ GrantConsent
→ GetFamilyAggregate

### M2 — First Real Family Growth Loop
状态：NOW

第一场景固定：

**12–15岁青春期家庭 · 亲子沟通冲突**

目标：

7–14天内跑通：

GrowthOnboarding
→ ParentPerspective
→ ChildPerspective
→ Evidence
→ LimitedGrowthProfile
→ GrowthPriority
→ Intervention
→ GrowthAction
→ GrowthEvent
→ Milestone
→ Outcome
→ GrowthReview

### M3 — Family Growth Product
扩更多Growth Dimension、LifeStage、Intervention、Journey、Timeline、Membership、Advisor，并正式承接榜样教育成熟业务。

### M4 — Scale + Human Service + Business Integration
顾问/专家、CRM/LMS、会员、活动、社群、Knowledge Foundry、运营体系。

### M5 — Causal Learning
真实Growth Episode → Intervention Effect → Causal Evidence。

### M6 — Family Growth World Model
State / Transition / Intervention / Policy / Simulation。

## 4. M2第一切片范围

只允许四个维度：

P03 — 理解与共情倾听
R03 — 沟通质量
R04 — 冲突调节
R05 — 关系修复

Growth State：

EMERGING
DEVELOPING
PRACTICING
STABILIZING

禁止总分、排名、百分位。

## 5. 第一Intervention

ID：INTERVENTION-001
Code：LISTEN_BEFORE_RESPOND
中文：先听后回应
Duration：7 days

核心行为：

每天一次约10分钟非评判倾听：

- 不打断
- 不立即评价
- 不马上讲道理
- 不立即解决问题
- 先复述理解
- 再询问：“你希望我只是听，还是一起想办法？”

目标维度：
P03 / R03 / R04 / R05

## 6. M2四个Wave

### Wave 1 — Understand

Backend：
GrowthOnboarding / ParentPerspective / ChildPerspective / Evidence / LimitedGrowthProfile

Frontend：
Family Home / Growth Onboarding / Parent Perspective / Child Perspective / Growth Insight

Demo：
家庭完成5分钟Onboarding，双方Perspective分开保存，形成有限沟通成长画像。

### Wave 2 — Decide & Act

Backend：
GrowthPriority / Intervention / GrowthAction

Frontend：
Growth Priority / Intervention Detail / 7-Day Plan / Today Action / Action Check-in

Demo：
Family解释为什么R03是当前优先项，并启动“先听后回应”。

### Wave 3 — Observe & Review

Backend：
GrowthEvent / Milestone / Outcome / GrowthReview

Frontend：
Check-in / Timeline / Milestone / Growth Review

Demo：
用户看到7天发生了什么、哪些行为变化、有没有repair。

### Wave 4 — Intelligence

AI/Backend：
Minimal Model Gateway / Structured Growth Insight / RecommendGrowthPriority / RecommendIntervention / DraftGrowthReview / KnowledgeCard / Human Gate

Frontend：
Family AI / Evidence Explanation / AI-assisted Growth Review

Demo：
AI基于真实Family Context + Evidence + Knowledge给出结构化建议，由Parent/Human确认后才进入Named Action。

## 7. Frontend升级为一级交付线

M2首期只建设：

Family Web / Responsive Web

暂不同时开发：

Native App / Mini Program

第一批Screen：

F01 Family Home
F02 Growth Onboarding
F03 Parent Perspective
F04 Child Perspective
F05 Growth Insight
F06 Growth Priority
F07 Intervention Detail
F08 Today Growth Action
F09 Action Reflection
F10 Family Timeline
F11 Growth Review
F12 Family AI

Family Home不是课程商城。

首页主轴：

当前家庭
→ 当前成长旅程
→ Today Action
→ Recent Changes
→ Growth Insight
→ Milestone
→ Family AI

## 8. AI实施路线

M2开始进入真实AI，但只允许AL1–AL2。

链路：

Family Context
→ Perspective
→ Evidence
→ Curated Knowledge
→ Minimal Model Gateway
→ Structured Recommendation
→ Schema Validation
→ Policy
→ Parent/Human Confirmation
→ Named Action

第一阶段AI只做：

BuildGrowthInsight
RecommendGrowthPriority
RecommendIntervention
DraftGrowthReview

禁止：

- 直接写GrowthProfile
- 自动确认Priority
- 自动启动Intervention
- 自动MeasureOutcome
- 业务代码直接绑定具体模型Provider

## 9. Knowledge路线

M2不先造完整Knowledge Graph/Graph DB/大型RAG。

先做：

KnowledgeCard-001：青春期沟通
KnowledgeCard-002：共情倾听
InterventionCard-001：先听后回应

每张卡至少记录：

source / version / owner / review_status / target_dimensions / safety_notes

M3/M4再扩Knowledge Foundry。

## 10. Outcome First

Engineering：
build / lint / typecheck / contract / integration / e2e

AI：
structured_output_validity / grounding / unsupported_claim_rate / safety_recall / human_overturn

Product/Growth：
onboarding_completion
perspective_completion
priority_acceptance
intervention_acceptance
daily_action_completion
milestone_occurrence
growth_review_completion
observable_outcome_coverage

第一切片只主张：

L1 Behavioral Outcome
L3 Relationship Outcome

## 11. Consent / IAM并行治理

M2开发不因治理重构停滞。

但外部Pilot前必须：

GOV-001 WithdrawConsent = PASS
GOV-002 IAM Hardening = PILOT_MINIMUM_PASS

M2功能按需检查：

SERVICE
ASSESSMENT
GROWTH_TRACKING
AI_PERSONALIZATION

不得相互继承。

## 12. Safety / Human Gate

LOW：
普通沟通建议 → Parent confirmation

MEDIUM：
Evidence不足 / Perspective冲突 / 低confidence → Growth Advisor Review

HIGH/CRITICAL：
self-harm / harm / abuse / violence / severe crisis → Safety Escalation

高风险时普通Growth Flow暂停。

## 13. 榜样教育迁移

M2只引入第一场景必需内容。

M3正式迁移：

课程 → Knowledge + Intervention
训练营 → Growth Journey
打卡 → Growth Event
顾问 → Growth Advisor
客户 → Family Account
案例 → Outcome Case
会员 → Family Growth Membership
内容 → Growth Discovery / Knowledge Source

## 14. 技术约束

M2继续：

Modular Monolith
PostgreSQL
Existing Audit/Outbox/Idempotency
Responsive Web
Minimal Model Gateway

M2禁止预先引入：

Microservices
Kafka
Graph DB
Feature Store
Complex Workflow Platform
Multi-Agent Runtime
Causal Engine
World Model Runtime

除非第一切片有真实证据需要。

## 15. 团队结构

Growth Cell：
Domain / Evidence / Intervention / Outcome

Product UX Cell：
Journey / IA / UI / Frontend / Interaction

AI Cell：
Model / Knowledge / Recommendation / Evaluation

Platform & QA Cell：
Backend / DB / API / Safety / Test / CI

Product / Architecture Lead负责纵向集成。

## 16. M2 Wave DoD

一个Wave只有同时满足以下条件才算Done：

- Domain contract PASS
- API PASS
- Frontend可操作
- Real PostgreSQL PASS
- HTTP E2E PASS
- Consent/Safety PASS
- Demo Scenario PASS
- Product metric可采集
- Outcome Link存在
- 无未经批准的平台扩张

## 17. Pilot Gate

外部家庭Pilot前必须：

- WithdrawConsent可运行
- IAM Minimum Gate PASS
- Minor Data SOP验证
- Safety Escalation可运行
- Consent UX可运行
- Human Review path可运行
- 第一Growth Slice E2E PASS
- Pilot measurement plan PASS

## 18. 项目管理模式

从V3.0起：

Epic
→ Vertical Slice Wave
→ Story
→ Task

每个Task必须回答：

1. 属于哪个真实User Journey？
2. 用户会看到什么？
3. 改变哪个Domain State？
4. 哪个API/Screen使用？
5. 哪个Outcome验证？
6. 哪个Consent/Safety Gate生效？

无法回答的问题，不进入M2主线。

## 19. 当前下一步

先执行：

M2-000 FIRST GROWTH SLICE DEFINITION & CONTRACT GATE

M2-000 PASS后再进入M2 Wave 1编码。
