# M2 Wave2 Validation Evidence

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA
contract: M2_WAVE2_CF_V1

## Current Verdict

```text
E2E_GATE: PENDING_API_INTEGRATION
REAL_POSTGRESQL_GATE: NOT_RUN_WAITING_REAL_MIGRATION_READY
BROWSER_DEMO_GATE: NOT_RUN_WAITING_FRONTEND_AND_API
FINAL_WAVE2_GATE: NOT_PASS
```

AI-05 does not declare final Real PostgreSQL PASS before AI-03 reports `REAL_MIGRATION_READY = YES`.

## Existing Pattern Checked

- API e2e tests use `NestFactory.create(AppModule)`, real HTTP via `app.listen(0)`, `TEST_DATABASE_URL`, and PostgreSQL cleanup through `cleanFamilyCoreTables`.
- Existing Wave1/M2 tests create business state through HTTP Named Actions such as `CreateFamily`, `GrantConsent`, `StartGrowthOnboarding`, `RecordPerspective`, `BuildGrowthProfileDrafts`, and `ConfirmGrowthProfile`.
- Wave2 focused services and DTOs exist, but Wave2 controller routes are not yet present in `family.controller.ts`.

## E2E-W2 Coverage Plan

```text
E2E-W2-01 profile -> priority draft: TODO after route integration
E2E-W2-02 confirm priority: TODO after route integration
E2E-W2-03 NO_PRIORITY_YET path: TODO after route integration
E2E-W2-04 stale priority rejected: TODO after route integration
E2E-W2-05 start intervention: TODO after route integration
E2E-W2-06 exactly 7 actions: TODO after route integration
E2E-W2-07 get today's action: TODO after route integration
E2E-W2-08 complete action: TODO after route integration
E2E-W2-09 reflection persisted: TODO after route integration
E2E-W2-10 idempotency replay: TODO after route integration
E2E-W2-11 idempotency conflict: TODO after route integration
E2E-W2-12 revoked/missing consent blocks: TODO after route integration
E2E-W2-13 safety escalation blocks: TODO after route integration
E2E-W2-14 no Outcome side effect: TODO after route integration
E2E-W2-15 no AI side effect: TODO after route integration
```

## Named Action Rule

The Wave2 E2E skeleton does not SQL-insert `growth_priorities`, `interventions`, or `growth_actions`. Final E2E must create priority, intervention, action, and reflection state only through HTTP routes backed by the approved Named Actions.

## Blocking Evidence

```text
PENDING_API_INTEGRATION: Wave2 HTTP routes are absent from family.controller.ts.
PENDING_SCHEMA_GATE: AI-03 REAL_MIGRATION_READY has not been confirmed as YES in AI-05 evidence.
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
RESULT: PASS_READINESS_SKELETON
SUMMARY: 1 passed, 15 todo. The passing test asserts PENDING_API_INTEGRATION and does not claim Wave2 E2E PASS.

pnpm --filter @family/api exec tsc -p tsconfig.json --noEmit --pretty false
RESULT: PASS
```