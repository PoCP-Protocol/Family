# M2 Wave2 Browser Demo Evidence

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA

## Current Verdict

```text
BROWSER_DEMO_GATE: NOT_RUN_WAITING_RUNNING_BACKEND_AND_REAL_API_MODE
REAL_BROWSER_HTTP_POSTGRESQL_DEMO: PENDING
```

No browser demo PASS is claimed yet.

## Required Real Demo Evidence

The final demo must show:

```text
Browser
+ HTTP
+ PostgreSQL
+ Named Actions for priority/intervention/action
```

Required screenshots or observations:

- Family Home shows Wave2 state from real API.
- Growth Insight leads to priority draft/why screen.
- Confirm priority uses HTTP `ConfirmGrowthPriority` and persists active priority.
- Intervention detail shows `先听后回应` / `LISTEN_BEFORE_RESPOND`.
- Start 7-Day Practice uses HTTP `StartIntervention` and persists exactly seven actions.
- Today Action reads the current action from API.
- Completion/reflection uses HTTP `CompleteGrowthAction`.
- Returning to Family Home reflects persisted action state without outcome, score, ranking, AI, or milestone claims.

## Current Blockers

```text
PENDING_REAL_POSTGRESQL: TEST_DATABASE_URL is not set for local E2E execution.
PENDING_FRONTEND_REAL_API: AI-04 adapter prep is ready, but browser flow has not been run against a live backend.
PENDING_BROWSER_CAPTURE: no screenshot or browser observations have been captured for real Browser + HTTP + PostgreSQL.
```

## Runbook

Detailed execution steps are recorded in `reports/m2/demo/M2_WAVE2_REAL_DEMO_RUNBOOK.md`.