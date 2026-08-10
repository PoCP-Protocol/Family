# AI-07 Independent Architecture / Product Review

date: 2026-08-10
reviewer: AI-07 Independent Architecture / Product Reviewer
contract: M2_WAVE2_CF_V1
review_scope: current shared working tree, required review packet, referenced implementation and tests
implementation_changes: NONE

## Verdict Contract

```text
AI07_INDEPENDENT_REVIEW = FAIL
ARCHITECTURE = FAIL
PRODUCT_SEMANTICS = FAIL
REAL_SYSTEM_EVIDENCE = FAIL
GOVERNANCE_TRUTHFULNESS = FAIL
BLOCKERS = 5
FINDINGS = [AI07-B01, AI07-B02, AI07-B03, AI07-B04, AI07-B05, AI07-F01, AI07-F02, AI07-F03, AI07-F04, AI07-F05]
```

Wave2 must remain `NOT_PASS`. This review does not authorize Wave3 or F10-F12.

## Independent Review Basis

The review inspected the required packet inputs, migrations 0003/0006/0007/0008, Wave2 contracts/DTOs/policies/services/controllers, subject resolver and tests, real-HTTP E2E source, web runtime/tests, and the available evidence artifacts. No implementation file was modified.

No independent database reset or E2E rerun was performed because the test suite clears shared PostgreSQL tables and the reviewer was authorized for read-only implementation/test review. At review time there were no listeners on ports 3000, 3100, 5174, 5178, or 56432. Therefore prior-run claims were evaluated from their retained artifacts and source-testability, not assumed to be true.

The mandatory visual reality check found:

- `resources/views/` and root HTML files are absent; this repository uses a static JS web app.
- No `qa-playwright-capture.sh`, `public/qa-screenshots/`, `test-results.json`, or retained PNG/JPG browser evidence exists.
- The web package has jsdom/Vitest tests but no Playwright/browser automation dependency or checked-in capture harness.

## Required Check Matrix

| Required check | Result | Independent evidence |
|---|---|---|
| Frozen Wave2 scope preserved | PASS | Wave2 runtime services remain limited to priority, one intervention, action assignments and reflection. |
| PROFILE is not PRIORITY | PASS | Confirmed `growth_profiles` are read as proposal provenance; active state is written to `growth_priorities` only. No Wave2 profile mutation was found. |
| PRIORITY is not score/ranking/diagnosis | PASS | Candidate construction is qualitative and deterministic. No numeric scoring or diagnosis field exists in the Wave2 policy/API. Legacy `rank` is constrained to primary compatibility and is not exposed as a product ranking. |
| Human confirmation and `NO_PRIORITY_YET` | FAIL | Human confirmation exists and no priority row is created for `NO_PRIORITY_YET`, but that branch skips required consent recheck while still writing audit/outbox/idempotency state (AI07-B02). It also emits `GrowthPriorityConfirmed` with `priority_id = null`, which is semantically misleading. |
| Bounded 7-day practice, not course platform | PASS | `LISTEN_BEFORE_RESPOND` deterministically creates seven behavior assignments; no course/module system was found. |
| ACTION/REFLECTION are not Outcome/profile mutation | PASS | Actions and reflections carry explicit non-outcome boundaries; no profile, Outcome, Milestone or GrowthReview write was found in the three Wave2 services. |
| Consent and safety rechecked before writes | FAIL | Normal writes check stored consent and existing normal-route state, but `NO_PRIORITY_YET` writes without consent recheck, and new reflection text is never safety-assessed/routed (AI07-B02/B03). |
| Subject provenance; no first-child shortcut | PASS_WITH_EVIDENCE_GAP | `GrowthSubjectResolver` derives one child from onboarding event plus child-perspective provenance, validates profile/relationship linkage, and rejects zero/multiple candidates. Unit tests cover ambiguity. No first-child query exists. Real PostgreSQL E2E covers only one child, so multi-child provenance has no retained real-system proof. |
| Real Browser + HTTP + PostgreSQL evidence truthful | FAIL | The HTTP E2E source is capable of real Nest HTTP + PostgreSQL, but raw run logs and database query output are absent. Browser claims have no screenshots/trace/network capture, conflict with the runbook, and the reported sixth E2E case does not exist (AI07-B05). |
| No Outcome/Milestone/GrowthReview/AI/Wave3 side effect | PASS_AT_CODE_LEVEL | Static inspection found no such writes/calls in the Wave2 services. The retained real-system evidence is insufficient to elevate this to independently reproduced runtime proof. |
| Mobile and reload/resume meet slice | FAIL | A jsdom hydration regression test exists, but there is no retained mobile/browser artifact. More importantly, `getTodayAction` ignores `due_date`, so reload after completing Day 1 can expose future Day 2 as today's action (AI07-B04). |
| Gate does not authorize Wave3 | PASS | `M2_WAVE2_GATE.md` remains pending, keeps Wave2 `NOT_PASS`, sets `READY_FOR_M2_WAVE_3 = NO` and `START_M2_WAVE_3 = NO`, and explicitly requires separate F10-F12 authorization. |

## Blockers

### AI07-B01 — Idempotent replay bypasses current actor authorization

Severity: CRITICAL
Area: Architecture / authorization

All three state-changing services call `lockIdempotencyKey` and return a stored response before `ensureFamilyExists`, `assertFamilyManagePermission`, subject resolution, consent and safety checks:

- `growth-priority.service.ts:62-75`
- `intervention.service.ts:67-75`
- `growth-action.service.ts:45-53`

The request hashes do not include `meta.actor`, and the web keys are predictable (`wave2.js:381-382`). A caller who supplies a previously used key and identical route/body can receive the stored family response without passing current authorization. Idempotency replay must remain behind authentication/authorization and be actor/tenant scoped.

Required proof to clear: negative HTTP E2E showing a different/unauthorized actor cannot replay each of the three Named Actions, while the original actor still receives an idempotent response.

### AI07-B02 — `NO_PRIORITY_YET` writes without required consent recheck

Severity: HIGH
Area: Consent / product contract / governance truthfulness

The frozen contract requires active `SERVICE`, `ASSESSMENT`, and `GROWTH_TRACKING` consent for `ConfirmGrowthPriority` (`M2_WAVE2_CONTRACT_FREEZE.md:110-114`) and requires consent recheck at every Named Action (`:300`). In `growth-priority.service.ts`, consent is checked only inside `decision !== 'NO_PRIORITY_YET'` (`:95-109`), while the `NO_PRIORITY_YET` path still inserts audit, outbox and idempotency response state (`:117-128`).

This directly contradicts `GOVERNANCE_PRE_REVIEW.md:32`, which states that all three actions query all required consents before write. Existing E2E-W2-05 uses fully granted consent and asserts only the absence of priority/intervention/action rows; it does not test missing/revoked consent for `NO_PRIORITY_YET` or its audit/outbox effects.

Required proof to clear: resolve the contract behavior, recheck consent using onboarding provenance before any non-decision write, and add real HTTP/PostgreSQL negative coverage for missing and revoked consent on `NO_PRIORITY_YET`.

### AI07-B03 — New reflection content bypasses server-side safety routing

Severity: CRITICAL
Area: Safety

The contract states that safety-sensitive reflection must route through server-side safety policy and medium/high/critical material must not continue as normal completion (`M2_WAVE2_CONTRACT_FREEZE.md:259,308-310`). `CompleteGrowthAction` only calls `assertNormalSafetyRoute` against the old onboarding event and stored perspectives, then writes the new reflection verbatim (`growth-action.service.ts:53-61,184-196`). `normal-safety-route.policy.ts` never accepts or evaluates the submitted reflection.

E2E-W2-03 mutates an existing perspective to `MEDIUM/HUMAN_REVIEW`; it does not submit safety-sensitive reflection. Thus the governance claim that safety is rechecked before reflection storage proves only prior-state gating, not routing of the new material.

Required proof to clear: evaluate raw reflection through an approved deterministic server-side safety boundary inside the same transaction, route non-normal material without normal completion semantics, and add real HTTP/PostgreSQL tests for sensitive reflection plus zero normal side effects.

### AI07-B04 — F08 "Today Action" returns future assignments

Severity: HIGH
Area: Product semantics / reload-resume

The frozen contract gives every action a day-specific `due_date` and requires F08 to show today's practice (`M2_WAVE2_CONTRACT_FREEZE.md:194,283`). `GrowthActionService.getTodayAction` filters only family, active episode and `PENDING`, then orders by due date (`growth-action.service.ts:27-38`); it does not restrict `due_date` to today.

After Day 1 is completed, a reload can return Day 2 immediately even when its due date is tomorrow. This breaks the claimed seven-day cadence and makes the stated reload/resume PASS unreliable.

Required proof to clear: define timezone/day semantics, restrict today's read accordingly, specify behavior when today's action is already completed, and add clock-controlled API plus browser reload tests.

### AI07-B05 — Real-system evidence and reported E2E coverage are not auditable

Severity: HIGH
Area: Evidence / governance truthfulness

`BROWSER_DEMO_EVIDENCE.md` declares real browser + HTTP + PostgreSQL PASS and mobile/console results, but retains no screenshots, trace, HAR/network log, console export, database query output, or machine-readable test result. The referenced runbook still says `status: PENDING_API_INTEGRATION`, `DEMO_EXECUTED: NO`, and lists unresolved blockers (`M2_WAVE2_REAL_DEMO_RUNBOOK.md:5,63-64`). Evidence documents also disagree on web port 5178 versus the cited replay URL on 5174.

The validation report declares E2E-W2-01 through E2E-W2-06 and "6 passed". The actual `family-wave2.e2e-spec.ts` contains five Wave2 cases (W2-01 through W2-05) plus one readiness test at line 58; E2E-W2-06 is absent. The readiness test accepts either `REAL_POSTGRESQL_READY` or `PENDING_REAL_POSTGRESQL`, so it is not a migration/event-side-effect case. Calling this six covered E2E scenarios is inaccurate.

Required proof to clear: retain timestamped raw Vitest output with pass/skip/fail counts, add the missing W2-06 or correct the coverage claim, retain database query output keyed to the test/demo family, and capture desktop/tablet/mobile plus before/after interaction screenshots and browser network/console evidence from one identified run. Update the runbook to the same run identity and ports.

## Additional Findings

### AI07-F01 — Safety policy is explicitly a temporary proxy

`assertNormalSafetyRoute` uses the latest onboarding-start event plus perspective snapshots, not a canonical active safety ledger. AI-06 disclosed this gap. Even after AI07-B03 is fixed, this proxy must not be represented as a complete future safety-state model.

### AI07-F02 — `GrowthPriorityConfirmed` is emitted for a non-confirmation

`NO_PRIORITY_YET` produces an outbox event named `GrowthPriorityConfirmed` with no priority. Downstream consumers may interpret the name as an actual confirmed focus. Prefer an explicit decision/deferred event or document and enforce null-aware semantics.

### AI07-F03 — Subject provenance is well designed but incompletely proven at the real-system layer

The resolver rejects unresolved and ambiguous child provenance and validates relationship/profile linkage. This is materially better than a first-child shortcut. Add a real PostgreSQL multi-child case so schema behavior, joins and locks are proven beyond fake-client unit tests.

### AI07-F04 — Priority/product boundary is otherwise credible

The current deterministic policy selects only an eligible R03 proposal, uses qualitative states/reason codes, supports human deferral, and contains no score, diagnosis or AI recommendation. The legacy `rank` field is technical compatibility debt, not evidence of a user-facing ranking in this slice.

### AI07-F05 — Wave3 boundary and no-side-effect code paths are credible

No Wave2 service writes profiles, Outcome, Milestone or GrowthReview, and no LLM/ModelGateway/Agent call was found. The gate wording correctly withholds Wave3 authorization. These passes do not override the blockers above.

## Realistic Quality Certification

```text
OVERALL_QUALITY = C+
DESIGN_IMPLEMENTATION_LEVEL = GOOD_BUT_INCOMPLETE
PRODUCTION_READINESS = NEEDS_WORK
M2_WAVE_2_DECIDE_AND_ACT = NOT_PASS
READY_FOR_M2_WAVE_3 = NO
REASSESSMENT_REQUIRED = YES
```

The implementation has a credible semantic core, especially PROFILE/PRIORITY separation, qualitative priority policy, bounded intervention design, subject provenance, and no-Wave3 boundaries. It is not ready for a final gate because authorization replay, consent coverage, reflection safety routing, day scheduling, and evidence truthfulness remain unresolved.
