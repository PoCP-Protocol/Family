# M2 Wave2 Validation Evidence

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA
contract: M2_WAVE2_CF_V1

## Current Verdict

```text
E2E_GATE: HARNESS_READY_POSTGRESQL_SKIPPED
REAL_POSTGRESQL_GATE: NOT_RUN_TEST_DATABASE_URL_MISSING
BROWSER_DEMO_GATE: NOT_RUN_WAITING_RUNNING_BACKEND_AND_REAL_API_MODE
FINAL_WAVE2_GATE: NOT_PASS
```

AI-05/AI-00 do not declare final Real PostgreSQL PASS. The current E2E spec collects and runs, but the real scenarios are skipped because `TEST_DATABASE_URL` is not set in this local environment.

## Existing Pattern Checked

- API e2e tests use `NestFactory.create(AppModule)`, real HTTP via `app.listen(0)`, `TEST_DATABASE_URL`, and PostgreSQL cleanup through `cleanFamilyCoreTables`.
- Existing Wave1/M2 tests create business state through HTTP Named Actions such as `CreateFamily`, `GrantConsent`, `StartGrowthOnboarding`, `RecordPerspective`, `BuildGrowthProfileDrafts`, and `ConfirmGrowthProfile`.
- Wave2 focused services and DTOs exist.
- AI-00 registered Wave2 services in `FamilyModule` and wired HTTP routes in `family.controller.ts`.

## E2E-W2 Coverage Plan

```text
E2E-W2-01 happy path confirms priority, starts intervention, completes action, and checks no outcome-like or AI side effects: IMPLEMENTED_SKIPPED_WITHOUT_POSTGRESQL
E2E-W2-02 revoked or missing consent blocks priority, intervention, and action flow without side effects: IMPLEMENTED_SKIPPED_WITHOUT_POSTGRESQL
E2E-W2-03 safety escalation blocks normal Wave2 continuation without priority/intervention/action side effects: IMPLEMENTED_SKIPPED_WITHOUT_POSTGRESQL
E2E-W2-04 forbidden fields are rejected and do not mutate Wave2 state: IMPLEMENTED_SKIPPED_WITHOUT_POSTGRESQL
E2E-W2-05 no-priority decision and stale draft do not create hidden state: IMPLEMENTED_SKIPPED_WITHOUT_POSTGRESQL
```

## Named Action Rule

The Wave2 E2E skeleton does not SQL-insert `growth_priorities`, `interventions`, or `growth_actions`. Final E2E must create priority, intervention, action, and reflection state only through HTTP routes backed by the approved Named Actions.

## Blocking Evidence

```text
PENDING_REAL_POSTGRESQL: TEST_DATABASE_URL is not set.
PENDING_BROWSER_DEMO: no running backend + real API frontend browser run has been captured.
```

## Validation Commands

```text
pnpm --filter @family/api test -- family-wave2.e2e-spec.ts
RESULT: FAIL_EXPECTED_CONFIG_MISMATCH
REASON: default api Vitest config includes src/**/*.spec.ts and does not discover *.e2e-spec.ts.

pnpm --filter @family/api exec vitest run src/modules/family/family-wave2.e2e-spec.ts --reporter verbose
RESULT: FAIL_EXPECTED_CONFIG_MISMATCH
REASON: default api Vitest config includes src/**/*.spec.ts and reports no test files found for e2e-spec.

pnpm --filter @family/api exec vitest run --config vitest.e2e.config.ts src/modules/family/family-wave2.e2e-spec.ts --reporter verbose
RESULT: PASS_HARNESS_POSTGRESQL_SKIPPED
SUMMARY: 1 passed, 5 skipped. The skipped tests are the real PostgreSQL + HTTP scenarios and do not claim Wave2 E2E PASS.

pnpm --dir "d:\Family\50_开发_dev" --filter @family/web typecheck && pnpm --dir "d:\Family\50_开发_dev" --filter @family/web test
RESULT: PASS
SUMMARY: 1 file, 9 tests. Real API adapter prep is validated, but browser demo remains pending.

pnpm --filter @family/api exec tsc -p tsconfig.json --noEmit --pretty false
RESULT: PASS
```