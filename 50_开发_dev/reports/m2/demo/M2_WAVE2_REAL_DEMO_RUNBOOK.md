# M2 Wave2 Real Demo Runbook

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA
status: PENDING_API_INTEGRATION

## Gate Rule

Do not declare Wave2 demo PASS unless the flow runs through:

```text
Real Browser + HTTP + PostgreSQL
```

Priority, intervention, action, and reflection state must be created by Named Actions. Do not SQL-insert business state to simulate E2E. Migration fixtures are the only exception.

## Preconditions

```text
AI-03 REAL_MIGRATION_READY = YES
AI-00 Wave2 HTTP routes integrated
AI-04 frontend real API mode available
TEST_DATABASE_URL or demo DATABASE_URL points to PostgreSQL with migrations applied
```

## Demo Flow

1. Start PostgreSQL and apply migrations.
2. Start API against the demo PostgreSQL database.
3. Start Family Web in real API mode.
4. In browser, open Family Home.
5. Create or load a Wave1-ready family through approved setup flow.
6. Navigate Family Home -> Growth Insight.
7. Open Growth Priority / Why this Priority.
8. Confirm one eligible priority or exercise `NO_PRIORITY_YET` for the non-decision path.
9. Open Intervention Detail for `先听后回应` / `LISTEN_BEFORE_RESPOND`.
10. Start 7-Day Practice.
11. Verify exactly seven actions exist through API/database evidence.
12. Open Today Action.
13. Mark the action `COMPLETED`, `PARTIAL`, or `NOT_COMPLETED`.
14. Add reflection text and submit.
15. Return to Family Home and confirm persisted state is shown.

## Negative Checks

Verify no user-visible or persisted side effect claims:

```text
Outcome
Milestone
GrowthReview
Family Score
Ranking
AI Recommendation
LLM / Model Gateway / Agent Runtime
Causal Episode / World Model
```

## Current Status

```text
RUNBOOK_READY: YES
DEMO_EXECUTED: NO
BLOCKER: PENDING_API_INTEGRATION; PENDING_FRONTEND_REAL_API; PENDING_REAL_MIGRATION_READY
```