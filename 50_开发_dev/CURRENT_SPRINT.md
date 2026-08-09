# Current Sprint

sprint_id: S00-S01
sprint_name: Engineering Bootstrap + Family Core
sprint_goal: M1 Family Core Running
status: CLOSED

---

# Sprint 0 — Bootstrap

按顺序：

1. `TASK-000_REPO_AUDIT`
2. `TASK-001_ENGINEERING_BOOTSTRAP`
3. `TASK-002_ENGINEERING_CONTRACT_VALIDATION`

Sprint 0只有TASK-002验证PASS后才完成。

Sprint 0完成条件：
- Repo结构清楚
- 本地/DEV可运行
- lint/test/build可执行
- API基础项目可启动
- DB migration机制存在
- Audit基础能力存在

---

# Sprint 1 — Family Core

只有Sprint 0 PASS后才能开始。

Approved Tasks：

1. `TASK-101_CREATE_FAMILY`
2. `TASK-102_ADD_PARENT`
3. `TASK-103_ADD_CHILD`
4. `TASK-104_CREATE_RELATIONSHIP`
5. `TASK-105_ASSIGN_LIFE_STAGE`
6. `TASK-106_GRANT_CONSENT`
7. `TASK-107_FAMILY_CORE_INTEGRATION`

Sprint 1 status: CLOSED after TASK-107 PASS on 2026-08-10.

---

# Explicitly Out of Scope

本Sprint禁止开发：

- GrowthProfile
- GrowthPriority
- 90-Day Journey
- Intervention
- AI Agent
- Model Gateway
- Membership
- Community
- World Model
- CRM migration beyond interface placeholder

---

# Sprint Definition of Done

最终必须能通过API和Integration Test完成：

```text
Create Family
→ Add Parent
→ Add Child
→ Create Relationship
→ Assign LifeStage = EARLY_ADOLESCENCE_12_15
→ Grant SERVICE consent
→ Read Family Aggregate
```

并且：

- 每个写操作有Audit
- 支持correlation_id
- 关键写操作具备幂等策略
- 权限失败正确返回
- Schema invalid正确返回
- Unit / Integration tests通过

Sprint DoD status: PASS. M2 implementation is now authorized only for the active M2-101 task.

---

# M2 Planning Gate — V3.0 Rebaseline

Approved planning task:

1. `M2-000_FIRST_GROWTH_SLICE_DEFINITION`

M2-000 status: PASS_V3_0_CONTRACT_GATE on 2026-08-10.

V3.0 SSOT: `10_规格_spec/04_实施计划/PLAN_SSOT_V3.0.md`.
Active M2 sprint brief: `CURRENT_SPRINT_M2_000.md`.

Previous M2-000 attempt failed because Frontend / UI / UX was insufficient. V3.0 rebaseline kept that ruling as input and restarted M2-000 as a stricter Product Vertical Slice Contract Gate. The V3.0 M2-000 gate is now PASS with BLOCKERS=0 and READY_FOR_M2_WAVE1=YES.

M2-000 outputs:

- First Growth Slice definition.
- Domain Objects.
- Proposed contracts.
- AI minimum architecture.
- Consent/Safety/Human Gate.
- Outcome evaluation plan.
- User Journey.
- Information Architecture.
- Frontend Architecture.
- Screen Map F01-F12.
- UI State Model.
- Frontend Backend Contract Matrix.
- M2 implementation backlog.

M2 delivery rule:

```text
Domain Contract + API + Frontend + E2E + Demo
```

Family Web / Responsive Web is the only approved first frontend target. Native App and Mini Program are deferred.

M2 business implementation status: STARTING_M2_101_ONLY.
M2 frontend runtime implementation status: STARTING_M2_101_ONLY.
M2 gate blocker: NONE for M2-000.

User approval recorded: automatic review completed and automatic continuation approved on 2026-08-10.

Current Approved Task:

1. `M2-101_START_GROWTH_ONBOARDING`

Task boundary: implement only StartGrowthOnboarding + F01/F02 under V3.0 Wave 1 Understand. Do not start M2-102 or later tasks.
