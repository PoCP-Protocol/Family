# AI-05 Real PostgreSQL / HTTP E2E / Browser QA Report

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA Owner
phase: V3.1 Phase 1 Convergence Execution
depends_on: AI-03 OpenAPI / TS Contracts, AI-04 Frontend Real API Boundary

## Verdict

```text
AI05_REAL_SYSTEM_E2E = REAL_POSTGRESQL_HTTP_AND_BROWSER_REAL_API_PASS
E2E_HARNESS_COLLECTION = PASS
REAL_POSTGRESQL_HTTP_SCENARIOS = PASS_55_OF_55
BROWSER_REAL_API_DEMO = PASS_REAL_API_F06_F09
API_WAVE2_SERVICE_TESTS = PASS
API_TYPECHECK = PASS
FINAL_BARRIER_4_REAL_SYSTEM = PASS_LOCAL_REQUIRED_AND_BROWSER_REAL_API
FINAL_BARRIER_5_REAL_PRODUCT = PASS_AFTER_AI06_AI07_CLOSEOUT
BUSINESS_CODE_MODIFIED = NO
WAVE3_STARTED = NO
```

## Scope Checked

- Wave2 real HTTP E2E harness at `apps/api/src/modules/family/family-wave2.e2e-spec.ts`.
- E2E Vitest entry at `apps/api/vitest.e2e.config.ts`.
- Existing AI-05 status and validation evidence under `reports/m2/wave2/`.
- Current local runtime prerequisites: `TEST_DATABASE_URL`, Docker, and Node.js availability.
- Wave2 service tests for Growth Priority, Intervention, and Growth Action.
- Browser real-api flow on live local API + real PostgreSQL: F02/F03/F04/F05/F06/F07/F08/F09.

## Findings

- Missing `TEST_DATABASE_URL` now fails fast with `REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set` instead of producing skip-based false green evidence.
- Docker is available and responding.
- Node.js is available: `v24.15.0`.
- The default API test script does not discover `*.e2e-spec.ts`; this is a test-entry mismatch, not a Wave2 business failure.
- The dedicated E2E config collects the Wave2 harness correctly.
- `pnpm run test:e2e` now runs through `tools/testdb.mjs` with real PostgreSQL and passes 8 E2E files / 55 tests.
- `pnpm run test:required` passed locally after B02/B03/B04 repairs: build, typecheck, unit, testdb reset, integration, and E2E.
- Browser Gate now passes in `wave2ApiMode=real-api` against live API `http://localhost:3110`, web `http://localhost:5178`, and real PostgreSQL test database.
- Browser Gate verifies `data-api-mode="real-api"`, `已连接 · real-api`, F06/F07/F08/F09, 7 generated daily actions, completed today action, and `REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME`.
- Browser Gate verifies forbidden future/AI runtime claims are absent: Principal AI, FPAI, digital human, voice, model gateway, Family Total Score, ranking, and AI recommendation.
- Browser Gate console error list is empty.

## Validation

```text
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api exec vitest run --config vitest.e2e.config.ts src/modules/family/family-wave2.e2e-spec.ts --reporter verbose
RESULT: FAIL_FAST_WITHOUT_TEST_DATABASE_URL
SUMMARY: REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set

pnpm --dir "d:\Family\50_开发_dev" run test:e2e
RESULT: PASS_REAL_POSTGRESQL_HTTP_E2E
SUMMARY: 8 files passed, 55 tests passed; family-wave2.e2e-spec.ts passed

pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck
RESULT: PASS

pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- growth-priority.service.spec.ts intervention.service.spec.ts growth-action.service.spec.ts
RESULT: PASS
SUMMARY: 3 files, 19 tests

pnpm --dir "d:\Family\50_开发_dev" run test:integration
RESULT: PASS_REAL_POSTGRESQL_INTEGRATION
SUMMARY: 6 files passed, 40 tests passed

pnpm --dir "d:\Family\50_开发_dev" run test:required
RESULT: PASS_LOCAL_REQUIRED_GATE
SUMMARY: build, typecheck, unit, testdb reset, integration, and E2E passed

Browser Gate final run
RESULT: PASS_REAL_API_BROWSER_GATE
API: http://localhost:3110 backed by postgres://family:family@localhost:65240/family_test
WEB: http://localhost:5178/?wave2ApiMode=real-api&apiBaseUrl=http://localhost:3110
SEEDED_FAMILY_ID: d28fa1e1-d6ee-48cd-b8f9-009981bd476e
SEEDED_CHILD_ID: 8098fd26-5e36-482e-a376-21bec6930f1c
SEEDED_GUARDIAN_ID: 67d459a3-70c3-4f92-b849-c06c105d5568
ACTOR_PERSON_ID: ai07-browser-guardian-ai07-browser-135437
SCREENSHOT: reports/m2/wave2/integration/evidence/ai07-browser-gate-f08-f09-complete-20260810-1408.jpg
ASSERTIONS: data-api-mode=real-api; F06/F07/F08/F09 visible; 7 daily actions generated; today action COMPLETED; REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME visible; forbidden runtime AI/FPAI/score/ranking claims absent; consoleErrors=[]
```

## E2E Scenario Status

```text
E2E-W2-01 happy path priority -> intervention -> action completion: PASS_REAL_POSTGRESQL_HTTP
E2E-W2-02 revoked or missing consent blocks Wave2 flow: PASS_REAL_POSTGRESQL_HTTP
E2E-W2-03 safety escalation blocks normal continuation: PASS_REAL_POSTGRESQL_HTTP
E2E-W2-04 forbidden fields rejected without mutation: PASS_REAL_POSTGRESQL_HTTP
E2E-W2-05 no-priority decision and stale draft create no hidden state: PASS_REAL_POSTGRESQL_HTTP
E2E-W2-06 unauthorized actor cannot replay idempotent Named Action responses: PASS_REAL_POSTGRESQL_HTTP
E2E-W2-07 completing today action does not expose future scheduled actions: PASS_REAL_POSTGRESQL_HTTP
E2E-W2-08 multi-child onboarding resolves the intended child without first-child shortcut: PASS_REAL_POSTGRESQL_HTTP
```

## Gate Statement

AI-05 has cleared the real PostgreSQL + HTTP E2E part of Barrier 4 in the local required harness.

AI-05 has also cleared the browser real-api product evidence for F06-F09 against a live local backend and real PostgreSQL.

`BARRIER-4 REAL SYSTEM` and `BARRIER-5 REAL PRODUCT` are `PASS` for AI-05 scope. AI-06 and AI-07 have now closed their reviews. Wave3 remains closed and not authorized.
