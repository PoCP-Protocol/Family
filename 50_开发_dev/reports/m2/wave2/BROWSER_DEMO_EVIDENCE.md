# M2 Wave2 Browser Demo Evidence

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA

## Current Verdict

```text
BROWSER_DEMO_GATE: PASS
REAL_BROWSER_HTTP_POSTGRESQL_DEMO: PASS
```

The real browser demo was executed against the live API and isolated PostgreSQL database. Browser console warnings/errors: 0.

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

## Captured Observations

```text
CONNECTION_BADGE: 已连接 · real-api
START_GROWTH_ONBOARDING: PASS
ONBOARDING_STATUS: 已启动 / ACTIVE
SERVER_DERIVED_SAFETY_DISPOSITION: NORMAL / LOW
STRUCTURED_SAFETY_SIGNALS: NONE
ACTOR_HEADER_ROUTE: X-Actor-Id uses account actor `browser-gate-actor`; guardian person id remains the parent UUID.
FLOW: onboarding -> parent perspective -> child perspective -> profile draft -> confirmed profile
WAVE2: priority insight -> confirm priority -> start 7-day practice -> today action -> save reflection
REFLECTION: 今天我先听完孩子的表达，再复述了自己的理解。
COMPLETION: PARTIAL
SEMANTIC_LABEL: REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME
RELOAD_RESUME: PASS after confirmed-profile hydration regression fix
CONSOLE: 0 warnings, 0 errors
MOBILE_390x844: PASS, no horizontal overflow; four core cards aligned
```

Phase1R browser replay evidence captured from the real page at `http://localhost:5174/?apiBaseUrl=http%3A%2F%2Flocalhost%3A3100&familyId=eba4bfcc-8019-45d8-933d-3d015db11896&childId=1aed4c06-f302-4be7-88cc-5ee3144783fa&guardianPersonId=49d05f6c-7398-4a05-b825-da7d64855c1e&actorPersonId=browser-gate-actor`:

```text
UI_STATUS: 已启动
UI_MESSAGE: 成长入口已启动。下一步分别记录父母视角和孩子视角。
UI_RESULT_STATUS: ACTIVE
UI_RESULT_JOURNEY: PARENT_CHILD_COMMUNICATION_CONFLICT
UI_RESULT_PHASE: ONBOARDING
UI_RESULT_DIMENSIONS: P03, R03, R04, R05
UI_RESULT_SAFETY_ROUTE: NORMAL / LOW
HTTP_FORBIDDEN_REGRESSION: earlier parent-UUID actor header returned actor_has_family_manage_permission; corrected account actor header passed.
```

The mobile viewport measured `bodyScrollWidth = 375` with `overflow = false`; the Wave2 workspace width was 370px and each core card width was 326px.

## Remaining Gate

Browser/demo evidence is complete. Wave2 final PASS remains pending governance rerun and independent review; this file does not authorize F10-F12.

## Runbook

Detailed execution steps are recorded in `reports/m2/demo/M2_WAVE2_REAL_DEMO_RUNBOOK.md`.
