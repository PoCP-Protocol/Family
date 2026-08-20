# 34 UI DEV Test and Coverage Report 001

| Field | Value |
|---|---|
| Environment | Local isolated PostgreSQL database `family_test`; `TEST_DATABASE_URL` is stored outside the repository in a permission-restricted local environment file. |
| UI scope | UI-01 through UI-34 |
| Runtime mode | DEV synthetic fixture / read projection / controlled Named Action / no-op external-effect adapter |
| Report status | PASS_WITH_COVERAGE_BASELINE |
| Real external effects | Not invoked: payment, refund, real appointment, notification, public publication, share, export, and direct model call remain no-op or fail-closed. |

## 1. Test execution summary

The isolated `family_test` database passed the complete API suite in single-thread mode. The initial run exposed two failing `test-experience.integration` fixtures: the live schema now requires `family_page_task_items.source_page_id`, while the fixture omitted it. The fixture was corrected to bind its private task record explicitly to `UI-09`; the focused integration test and full serial suite then passed.

| Test layer | Command family | Result |
|---|---|---:|
| API full unit + PostgreSQL integration | `vitest run --poolOptions.threads.singleThread` with isolated `TEST_DATABASE_URL` | **50 files / 257 tests passed** |
| API focused UI family checks | Today, GrowthAction, DEV Core Growth, DEV Platform Surfaces, controller facade | **13 tests passed** |
| Web type safety | `tsc -p tsconfig.json --noEmit` | PASS |
| Web integration / route / no-op contracts | `vitest run` | **14 files / 85 tests passed** |
| 34 UI baseline route run | Chromium local runtime capture | **34 / 34 screenshots created** outside the repository |

> The full API suite is run serially because database-backed integration tests deliberately truncate/reseed shared tables. Parallel execution can introduce non-deterministic interference and is not treated as the authoritative PostgreSQL result.

## 2. V8 coverage totals

| Module | Lines | Statements | Functions | Branches |
|---|---:|---:|---:|---:|
| API total | 68.69% | 68.69% | 69.77% | 72.25% |
| Web total | 90.87% | 90.87% | 85.89% | 76.57% |

Raw V8 JSON summaries remain outside the repository under `/home/ubuntu/family_api_coverage/` and `/home/ubuntu/family_web_coverage/`. They are not product artifacts and are intentionally not staged.

## 3. UI module coverage and verification

| UI module group | Runtime/data boundary | Verification | Coverage evidence |
|---|---|---|---|
| UI-01 + UI-09: Today / daily task check-in | `FamilyTodayProjection → CompleteGrowthAction → TaskCheckinResultProjection`; action/check-in only, no Outcome claim | API controller tests, GrowthAction idempotency tests, Web contract tests, PostgreSQL integration suite | `today.service.ts`: 100% lines; `growth-action.service.ts`: 93.93% lines; first-slice controller contract covered |
| UI-02~UI-10: Core Growth | Shared `DEV_CORE_GROWTH_V1`; synthetic/non-diagnostic cards and controlled no-op receipt | DEV Core Growth unit tests, Web projection/no-op/fail-closed tests, 34-route test | `dev-core-growth.service.ts`: 100% lines/functions/branches |
| UI-11~UI-34: Platform surfaces | Shared `DEV_PLATFORM_SURFACES_V1`; catalog/read projection, controlled draft or no-op receipt | Platform surface unit tests, UI-21 no-op action test, 24-route Web projection checks, 34-route test | `dev-platform-surfaces.service.ts`: 100% lines/functions/branches |
| 34 default visual shells | Original route/baseline shell in default mode; no implicit DEV overlay | 34-route render test and 34 Chromium screenshots | `test-loop.js`: 90.67% lines, 70.00% functions, 75.26% branches |

The Family controller is a broad shared controller, so its 32.95% line coverage is reported transparently rather than used to claim complete controller coverage. The new DEV surface facade is covered by focused success and invalid-surface negative tests; remaining untested controller routes belong to prior modules outside this 34 UI increment.

## 4. Correctness improvements completed in this cycle

The first improvement makes DEV no-op commands reject unknown UI surface identifiers before reaching their services. Both `DEV_CORE_GROWTH_V1` and `DEV_PLATFORM_SURFACES_V1` now expose an allow-list predicate. The controller returns a bounded bad-request result for an unsupported surface, which prevents an accidental internal-error response and preserves fail-closed behavior.

The second improvement updates the PostgreSQL integration fixture for private task completion so it includes `source_page_id='UI-09'`. This matches the active not-null schema, maintains UI lineage, and restores full real-database integration verification for both the valid private task action and cross-family negative case.

## 5. Visual/runtime boundary

The current local runtime screenshot set contains 34 files in `/home/ubuntu/ui34_runtime_screenshots_20260818/`. These images validate route startup and default visual-shell retention; they are not a pixel-diff acceptance claim. Authenticated real-success browser screenshots remain a separate next step because they require a browser-safe transient test token workflow; API behavior is already validated through the 257-test PostgreSQL suite.

## 6. Remaining coverage opportunities

The immediate high-value improvement is an authenticated browser harness that mints a local synthetic test token, starts the API against `family_test`, and captures successful read/check-in/no-op screens. That would increase `apps/web/src/main.js` coverage, currently 0% because browser URL/session bootstrap is not exercised by jsdom unit tests, and it would support normalized visual pixel-diff automation.

A second opportunity is to split the large `FamilyController` into focused surface controllers or expand integration cases for existing unrelated routes; this would improve its current 32.95% line coverage without changing the 34 UI domain boundaries.

## 7. Conclusion

The 34 UI DEV platform now has a real PostgreSQL API regression baseline, shared projection coverage for every page, 34 default runtime route captures, and an explicit module-level coverage baseline. The implementation remains intentionally bounded: synthetic data is labelled, Reflection is not treated as Fact, and no external effects or direct model calls occur.
