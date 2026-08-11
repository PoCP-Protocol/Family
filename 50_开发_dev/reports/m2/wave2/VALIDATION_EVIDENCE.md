# M2 Wave2 Validation Evidence

date: 2026-08-10
owner: AI-05 Real PostgreSQL / HTTP E2E / Browser QA
contract: M2_WAVE2_CF_V1

## Current Verdict

```text
E2E_GATE: PASS_6_OF_6_REAL_HTTP_POSTGRESQL
REAL_POSTGRESQL_GATE: PASS_ISOLATED_POSTGRESQL_15_MIGRATIONS_0001_TO_0008
BROWSER_DEMO_GATE: PASS_REAL_BROWSER_HTTP_POSTGRESQL
FINAL_WAVE2_GATE: NOT_PASS
```

AI-05 evidence gates now pass. Final Wave2 PASS is still withheld until governance rerun and independent AI-07 review are complete.

## Existing Pattern Checked

- API e2e tests use `NestFactory.create(AppModule)`, real HTTP via `app.listen(0)`, `TEST_DATABASE_URL`, and PostgreSQL cleanup through `cleanFamilyCoreTables`.
- Existing Wave1/M2 tests create business state through HTTP Named Actions such as `CreateFamily`, `GrantConsent`, `StartGrowthOnboarding`, `RecordPerspective`, `BuildGrowthProfileDrafts`, and `ConfirmGrowthProfile`.
- Wave2 focused services and DTOs exist.
- AI-00 registered Wave2 services in `FamilyModule` and wired HTTP routes in `family.controller.ts`.

## E2E-W2 Coverage Plan

```text
E2E-W2-01 happy path confirms priority, starts intervention, completes action, and checks no outcome-like or AI side effects: PASS
E2E-W2-02 revoked or missing consent blocks priority, intervention, and action flow without side effects: PASS
E2E-W2-03 safety escalation blocks normal Wave2 continuation without priority/intervention/action side effects: PASS
E2E-W2-04 forbidden fields are rejected and do not mutate Wave2 state: PASS
E2E-W2-05 no-priority decision and stale draft do not create hidden state: PASS
E2E-W2-06 migration/schema and event-side-effect boundary assertions: PASS
```

## Named Action Rule

The Wave2 E2E skeleton does not SQL-insert `growth_priorities`, `interventions`, or `growth_actions`. Final E2E must create priority, intervention, action, and reflection state only through HTTP routes backed by the approved Named Actions.

## Real PostgreSQL Evidence

```text
CONTAINER: family_pg_test (PostgreSQL 15, isolated host port 56432)
DATABASE: family_test
MIGRATIONS: 0001 through 0008 applied successfully
HTTP_E2E: 6 passed, 0 skipped, 0 failed
BROWSER_RUNTIME: web 5178 -> API 3100 -> PostgreSQL 56432
```

Browser-created state for family `ad30ac76-b3cd-4947-9416-dd5548034e40`:

```text
growth_priorities = 1
intervention_episodes = 1
growth_actions = 7
completed_or_partial_actions = 1
outcomes = 0
milestones = 0
growth_reviews = TABLE_ABSENT
prohibited Outcome/Milestone/AI/LLM/Model/Agent event side effects = 0
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
RESULT: PASS
SUMMARY: 6 passed against real PostgreSQL + HTTP.

pnpm --dir "d:\Family\50_开发_dev" --filter @family/web typecheck && pnpm --dir "d:\Family\50_开发_dev" --filter @family/web test
RESULT: PASS
SUMMARY: 1 file, 10 tests. Includes regression coverage for restoring Wave2 reads after reload when a confirmed profile already exists.

pnpm --filter @family/api exec tsc -p tsconfig.json --noEmit --pretty false
RESULT: PASS
```
