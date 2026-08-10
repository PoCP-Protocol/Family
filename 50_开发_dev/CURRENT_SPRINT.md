# Current Sprint

sprint_id: M2-WAVE3
sprint_name: M2 Wave 3 — Observe & Review
sprint_goal: Complete the first deterministic Family Growth Loop with Observation, Review, Timeline, and Next-Step Decision
status: PHASE_B_PRODUCT_CLOSURE_IN_PROGRESS

## Active Wave3 Phase B Status

```text
M2_WAVE3 = IN_PROGRESS_NOT_CLOSED
PHASE_A_CONTRACT_FREEZE = PASS
API_REAL_POSTGRESQL_HTTP_E2E = PASS_12_TESTS
WEB_UNIT_TESTS = PASS_19_TESTS
WEB_TYPECHECK = PASS
BROWSER_F10_F11_GATE = PASS_REAL_API_DESKTOP_MOBILE
GOVERNANCE_PRE_REVIEW_PACKET = CREATED_NOT_SIGNED
AI06_INDEPENDENT_GOVERNANCE_REVIEW = PASS
AI07_INDEPENDENT_ARCHITECTURE_PRODUCT_REVIEW = PASS
GITHUB_CI = PASS_RUN_31437889629
GITHUB_REMOTE_CONVERGENCE = PASS_D931927
READY_FOR_M3 = NO
START_M3 = NO
```

Latest Wave3 browser evidence:

- `reports/m2/wave3/M2_WAVE3_BROWSER_EVIDENCE.md`
- `reports/m2/wave3/M2_WAVE3_GOVERNANCE_PRE_REVIEW.md`
- `reports/m2/wave3/AI06_GOVERNANCE_REVIEW_REPORT.md`
- `reports/m2/wave3/AI07_ARCHITECTURE_PRODUCT_REVIEW_REPORT.md`

Current closure blockers:

1. Final Wave3 closure certificate must be reviewed by the chief architect.
2. `PROJECT_STATUS.md` has unrelated dirty worktree changes and must be reconciled before final closure commit.

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

Sprint DoD status: PASS. M1 is closed.

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

M2 business implementation status: M2_101_COMPLETED_ONLY.
M2 frontend runtime implementation status: F01_F02_COMPLETED_ONLY.
M2 gate blocker: NONE for M2-000.

User approval recorded: automatic review completed and automatic continuation approved on 2026-08-10.

M2 Wave 1 status: PASS / CLOSED on 2026-08-10.

Completed Wave 1 tasks:

1. `M2-101_START_GROWTH_ONBOARDING`
2. `M2-102_RECORD_PERSPECTIVE_AND_EVIDENCE`
3. `M2-103_EVIDENCE_SYNTHESIS_AND_LIMITED_GROWTH_PROFILE`

Last completed task:

```text
M2-103_EVIDENCE_SYNTHESIS_AND_LIMITED_GROWTH_PROFILE
```

M2 Wave 2 Phase A status: PASS / CLOSED.

Approved Phase B task:

```text
M2-WAVE2-PHASE-B
```

Current wave:

```text
M2_WAVE_3_OBSERVE_AND_REVIEW
```

Current phase:

```text
PHASE_B_PRODUCT_CLOSURE_IN_PROGRESS
```

Active task:

```text
M2-WAVE3-GOVERNANCE-CI-REMOTE-CLOSURE
```

Stage ruling:

```text
M2_WAVE_1 = CLOSED
M2_WAVE_2_DECIDE_AND_ACT = PASS
M2_WAVE_2 = CLOSED
AI05_REAL_SYSTEM = PASS
WAVE2_AI06_FINAL_GOVERNANCE = PASS_HISTORICAL
WAVE2_AI07_INDEPENDENT_REVIEW = PASS_HISTORICAL
WAVE3_AI06_INDEPENDENT_GOVERNANCE = PASS
WAVE3_AI07_INDEPENDENT_REVIEW = PASS
BLOCKERS = 0
V3_2_ARCHITECTURE_REBASELINE = APPROVED
V3_2_ARCHITECTURE_GATE = PASS
M2_WAVE_3 = AUTHORIZED
READY_FOR_WAVE3 = YES
START_WAVE3 = YES
M3_RUNTIME = NOT_AUTHORIZED
```

Wave3 product scope:

```text
F10 Family Timeline = YES
F11 Growth Review = YES
F12 Family AI = NO
```

Wave3 runtime scope:

```text
DETERMINISTIC = YES
LLM_RUNTIME = NO
MODEL_GATEWAY = NO
AGENT_RUNTIME = NO
FPAI_RUNTIME = NO
WORLD_MODEL = NO
CAUSAL_ENGINE = NO
```

Approved Phase A outputs:

- `reports/m2/wave3/CCR-M2-WAVE4-001.md`
- `reports/m2/wave3/M2_WAVE3_CONTRACT_FREEZE_V1.md`
- `reports/m2/wave3/M2_WAVE3_SHARED_FILE_MATRIX.md`

Wave3 deterministic F10/F11 implementation and browser validation have passed. Remaining work is governance, CI, and remote convergence; M3 runtime remains closed.

Stage ruling:

```text
M2_WAVE_1 = CLOSED
M2-103 = PASS
M2_WAVE_2 = CLOSED
M2-104 = LOCAL_GATE_PASS
M2-105 = LOCAL_GATE_PASS
M2_WAVE_2 = PASS
READY_FOR_WAVE2_INTEGRATION = YES
M2_WAVE3 = IN_PROGRESS_NOT_CLOSED
READY_FOR_M3 = NO
START_M3 = NO
STATE_ALIGNMENT = PASS_WAVE3_AI06_AI07_DONE_NOT_CLOSED
```

Historical Wave2 integration streams:

1. STREAM-A Schema / Contract Compatibility — AI-03
2. STREAM-B API / Module / Orchestration Integration — AI-00
3. STREAM-C Frontend F01/F06/F07/F08/F09 Real Integration — AI-04
4. STREAM-D Real PostgreSQL + HTTP E2E + Browser QA — AI-05
5. STREAM-E Governance Pre-Review — AI-06
6. Domain Fix Owner: GrowthPriority — AI-01
7. Domain Fix Owner: Intervention / GrowthAction — AI-02
8. Independent Review after Barriers 1-5 — AI-07

Historical Wave2 Phase B boundary:

- `reports/m2/wave2/M2_WAVE2_CONTRACT_FREEZE.md` is immutable baseline `M2_WAVE2_CF_V1`.
- `reports/m2/wave2/SHARED_FILE_CONFLICT_MATRIX.md` is approved and binding.
- Any contract change requires `CONTRACT_CHANGE_REQUEST`; no role may freely edit the freeze baseline.
- Wave 3 planning and deterministic F10/F11 runtime were later authorized by Wave3 Phase A gate and are now browser-verified. M3 runtime code remains forbidden without explicit authorization.
- `growth_journeys.subject_person_id` is not approved; subject resolution must use canonical Family/Growth/Onboarding/Profile relations or a minimal resolver boundary.
- `growth_actions` legacy dual-write is allowed only as `TEMPORARY_SCHEMA_COMPATIBILITY` after semantic audit.

Phase B2 status artifacts:

- `reports/m2/wave2/integration/PHASE_B2_INTEGRATION_CONVERGENCE_DIRECTIVE.md`
- `reports/m2/wave2/integration/INTEGRATION_DASHBOARD.md`
- `reports/m2/wave2/integration/status/AI00_STATUS.md` through `AI06_STATUS.md`
