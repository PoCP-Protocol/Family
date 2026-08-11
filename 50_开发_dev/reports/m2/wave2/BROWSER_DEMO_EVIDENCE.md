# M2 Wave2 Browser Demo Evidence

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA

## Current Verdict

```text
BROWSER_DEMO_GATE: PASS
REAL_BROWSER_HTTP_POSTGRESQL_DEMO: PASS
WAVE3: CLOSED_NOT_AUTHORIZED
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
WEB: http://localhost:5178/?wave2ApiMode=real-api&apiBaseUrl=http://localhost:3110&familyId=d28fa1e1-d6ee-48cd-b8f9-009981bd476e&childId=8098fd26-5e36-482e-a376-21bec6930f1c&guardianPersonId=67d459a3-70c3-4f92-b849-c06c105d5568&actorPersonId=ai07-browser-guardian-ai07-browser-135437
API: http://localhost:3110
FAMILY_ID: d28fa1e1-d6ee-48cd-b8f9-009981bd476e
CHILD_ID: 8098fd26-5e36-482e-a376-21bec6930f1c
GUARDIAN_PERSON_ID: 67d459a3-70c3-4f92-b849-c06c105d5568
ACTOR_PERSON_ID: ai07-browser-guardian-ai07-browser-135437
SCREENSHOT: reports/m2/wave2/integration/evidence/ai07-browser-gate-f08-f09-complete-20260810-1408.jpg
CONNECTION_BADGE: 已连接 · real-api
START_GROWTH_ONBOARDING: PASS
ONBOARDING_STATUS: 已启动 / ACTIVE
SERVER_DERIVED_SAFETY_DISPOSITION: NORMAL / LOW
STRUCTURED_SAFETY_SIGNALS: NONE
ACTOR_HEADER_ROUTE: X-Actor-Id uses account actor `ai07-browser-guardian-ai07-browser-135437`; guardian person id remains the parent UUID.
FLOW: onboarding -> parent perspective -> child perspective -> profile draft -> confirmed profile
WAVE2: priority insight -> confirm priority -> start 7-day practice -> today action -> save reflection
REFLECTION: 今天我先听完孩子的表达，再复述了自己的理解。
COMPLETION: PARTIAL
SEMANTIC_LABEL: REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME
RELOAD_RESUME: PASS after confirmed-profile hydration regression fix
CONSOLE: 0 warnings, 0 errors
MOBILE_390x844: PASS, no horizontal overflow; four core cards aligned
```

AI07 browser replay evidence captured from the real page at `http://localhost:5178/?wave2ApiMode=real-api&apiBaseUrl=http://localhost:3110&familyId=d28fa1e1-d6ee-48cd-b8f9-009981bd476e&childId=8098fd26-5e36-482e-a376-21bec6930f1c&guardianPersonId=67d459a3-70c3-4f92-b849-c06c105d5568&actorPersonId=ai07-browser-guardian-ai07-browser-135437`:

```text
UI_STATUS: 已启动
UI_MESSAGE: 成长入口已启动。下一步分别记录父母视角和孩子视角。
UI_RESULT_STATUS: ACTIVE
UI_RESULT_JOURNEY: PARENT_CHILD_COMMUNICATION_CONFLICT
UI_RESULT_PHASE: ONBOARDING
UI_RESULT_DIMENSIONS: P03, R03, R04, R05
UI_RESULT_SAFETY_ROUTE: NORMAL / LOW
F08_VISIBLE: PASS
F09_VISIBLE: PASS
F09_COMPLETION_RECORDED: PASS
OUTCOME_WARNING_VISIBLE: PASS
FAMILY_TOTAL_SCORE_VISIBLE: NO
FAMILY_RANKING_VISIBLE: NO
HTTP_FORBIDDEN_REGRESSION: parent-UUID actor header is not used; account actor header passed.
```

The mobile viewport measured `bodyScrollWidth = 375` with `overflow = false`; the Wave2 workspace width was 370px and each core card width was 326px.

## Remaining Gate

Browser/demo evidence is complete. Wave2 final PASS is supported by AI-06 and AI-07 closeout. This file closes Wave3 authorization for now and does not authorize F10-F12.

## Runbook

Detailed execution steps are recorded in `reports/m2/demo/M2_WAVE2_REAL_DEMO_RUNBOOK.md`.
