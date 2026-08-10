# M2 Wave2 Browser Demo Evidence

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA

## Current Verdict

```text
BROWSER_DEMO_GATE: NOT_RUN_WAITING_FRONTEND_AND_API
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
PENDING_API_INTEGRATION: Wave2 HTTP routes are not fully wired.
PENDING_FRONTEND_REAL_API: Browser flow cannot be validated until AI-04 real API mode is available.
PENDING_REAL_MIGRATION_READY: final PostgreSQL gate waits for AI-03.
```

## Runbook

Detailed execution steps are recorded in `reports/m2/demo/M2_WAVE2_REAL_DEMO_RUNBOOK.md`.