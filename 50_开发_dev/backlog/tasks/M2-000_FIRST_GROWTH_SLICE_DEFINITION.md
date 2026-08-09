# M2-000 — FIRST GROWTH SLICE DEFINITION & CONTRACT GATE

Status: READY
Coding: FORBIDDEN

## Business Intent

把 V3.0 第一真实 Growth Slice 转成可实施、可测试、可演示的 Contract Gate。

场景：

12–15岁青春期家庭 · 亲子沟通冲突

## Fixed Dimensions

P03
R03
R04
R05

## Fixed Intervention

INTERVENTION-001
LISTEN_BEFORE_RESPOND
先听后回应
Duration: 7 days

## AI Team

AI-00 Product / Architecture Lead
AI-01 Growth Domain Designer
AI-02 Ontology / Data Contract Designer
AI-03 Intervention / Knowledge Designer
AI-04 AI Decision Designer
AI-05 Outcome / Evaluation Designer
AI-06 Safety / Consent / Human Gate Reviewer
AI-07 UX / Product Designer
AI-08 Frontend Architecture Engineer
AI-09 Independent Product Reviewer

本任务没有 Coding Builder。

## Must Produce

reports/m2/M2_000_VERTICAL_SLICE_DEFINITION.md
reports/m2/M2_GROWTH_DOMAIN_MODEL.md
reports/m2/M2_CONTRACT_GAP_ANALYSIS.md
reports/m2/M2_AI_MINIMUM_ARCHITECTURE.md
reports/m2/M2_SAFETY_CONSENT_GATE.md
reports/m2/M2_OUTCOME_EVALUATION_PLAN.md
reports/m2/M2_USER_JOURNEY.md
reports/m2/M2_INFORMATION_ARCHITECTURE.md
reports/m2/M2_FRONTEND_ARCHITECTURE.md
reports/m2/M2_SCREEN_MAP.md
reports/m2/M2_UI_STATE_MODEL.md
reports/m2/M2_FRONTEND_BACKEND_CONTRACT_MATRIX.md
reports/m2/M2_IMPLEMENTATION_BACKLOG.md
reports/m2/M2_000_GATE.md
reports/m2/proposed-contracts/**

## Domain Scope

GrowthOnboarding
Perspective
Evidence
GrowthProfile
GrowthProfileDimension
GrowthPriority
Intervention
GrowthAction
GrowthEvent
Milestone
Outcome
GrowthReview

只定义第一切片需要，不做全平台。

## Frontend Scope

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

每个Screen必须定义：

USER
PURPOSE
INPUT
DISPLAY_STATE
EMPTY_STATE
LOADING_STATE
ERROR_STATE
PERMISSION_STATE
CONSENT_STATE
BACKEND_API
DOMAIN_OBJECT
PRIMARY_ACTION
NEXT_SCREEN

## AI Scope

只规划：

BuildGrowthInsight
RecommendGrowthPriority
RecommendIntervention
DraftGrowthReview

AL1–AL2。

## Consent Scope

明确以下purpose在何时需要：

SERVICE
ASSESSMENT
GROWTH_TRACKING
AI_PERSONALIZATION

Purpose不得继承。

## Safety Scope

LOW → Parent confirmation
MEDIUM → Growth Advisor Review
HIGH/CRITICAL → Safety Escalation

## Implementation Backlog

最终拆成4个Waves，主任务不超过10个。

## Gate

SCENARIO_SCOPE
4_DIMENSION_LIMIT
PERSPECTIVE_MODEL
EVIDENCE_MODEL
PROFILE_MODEL
PRIORITY_MODEL
INTERVENTION_001
ACTION_MODEL
EVENT_MODEL
MILESTONE_MODEL
OUTCOME_MODEL
GROWTH_REVIEW
USER_JOURNEY
SCREEN_MAP
FRONTEND_ARCHITECTURE
FRONTEND_BACKEND_CONTRACT
AI_MINIMUM_PATH
CONSENT_GATE
SAFETY_GATE
HUMAN_GATE
EVALUATION
NO_OVERENGINEERING
IMPLEMENTATION_BACKLOG

全部PASS且BLOCKERS=0：

READY_FOR_M2_WAVE1=YES

## Ending Rule

只做设计、契约、计划。

不得实现Growth业务代码、Model Gateway、Agent或前端业务页。
