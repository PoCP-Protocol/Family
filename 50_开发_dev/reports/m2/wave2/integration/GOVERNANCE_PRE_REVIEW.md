# Governance Pre-Review - AI-06

date: 2026-08-10
phase: WAVE2_INTEGRATION_CONVERGENCE
reviewer: AI-06 Consent / Safety / Domain Governance Pre-Review Owner
contract_version: M2_WAVE2_CF_V1
scope: M2-104 GrowthPriority, M2-105 Intervention/GrowthAction, Phase B2 directive

## Gate Result (Rerun)

```text
GOVERNANCE_PRE_REVIEW = PASS
GOVERNANCE_READY = YES
BARRIER-5 = PASS
BLOCKERS = 0
```

The governance gate was rerun after real PostgreSQL + HTTP E2E and browser evidence became available. This PASS clears Barrier 5 but is not the final Wave2 gate; AI-07 independent review is still required.

## PASS / FAIL / PENDING Matrix

| Check | Result | Evidence / reason |
| --- | --- | --- |
| PROFILE_NOT_PRIORITY | PASS | Priority candidates anchor to confirmed `growth_profiles` and write only `growth_priorities`; no profile write side effect found in M2-104. |
| PRIORITY_NOT_SCORE | PASS | Policy uses qualitative state/reason codes; tests assert no `score`, `rank`, `diagnosis`, or `recommendation` in draft JSON. |
| PRIORITY_NOT_DIAGNOSIS | PASS | Priority boundary is `PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS`; no diagnosis fields found in M2-104 service/policy. |
| NO_PRIORITY_YET | PASS | `NO_PRIORITY_YET` is accepted by DTO/policy and service returns `priority: null` without inserting active priority. |
| NO_HIDDEN_SCORE | PASS | No numeric scoring field found in M2-104 implementation; `rank` remains DB legacy compatibility and active priorities are constrained to `rank = 1`. |
| ONE_PRIMARY_PRIORITY | PASS | Migration adds one-active-priority unique index; service supersedes existing active priority before insert. |
| ACTION_NOT_OUTCOME | PASS | Actions carry `ACTION_IS_NOT_OUTCOME`; M2-105 tests check no profile/outcome/milestone/growth review writes. |
| REFLECTION_NOT_OUTCOME | PASS | Completion stores `REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME`; `CompleteGrowthAction` now rechecks the normal safety route before storing reflection. |
| CONSENT_RECHECKED | PASS | `ConfirmGrowthPriority`, `StartIntervention`, and `CompleteGrowthAction` all query active `SERVICE`, `ASSESSMENT`, and `GROWTH_TRACKING` consent before write. Current AI-03 evidence reports subject resolution as schema-compatible. |
| SAFETY_RECHECKED | PASS_WITH_EVIDENCE_GAP | M2-104/M2-105 writes now call `assertNormalSafetyRoute` before mutation. The route is deterministic and DB-backed: it requires the latest `GrowthOnboardingStarted` event to carry `LOW` screening and blocks if any linked perspective has missing/non-normal disposition. Evidence gap: schema still lacks a canonical active safety-state table, so this is the smallest auditable normal-route gate, not a complete future safety ledger. |
| MINOR_SUBJECT_RESOLUTION | PASS | Current AI-03 audit reports `SUBJECT_RESOLUTION = PASS`; `ConfirmGrowthPriority` validates onboarding by `journey_id` and resolves consent subject through profile/relationship provenance rather than `growth_journeys.subject_person_id`. |
| NO_FIRST_CHILD_SHORTCUT | PASS | Search found no `SELECT first child` / first-child fallback in Wave2 services. Current issue is unresolved/cross-contract subject semantics, not first-child shortcut. |
| NO_AI | PASS | No M2-104/M2-105 code path calls LLM, ModelGateway, Agent Runtime, or AI recommendation. |
| NO_WAVE3_SIDE_EFFECT | PASS | M2-104/M2-105 services/tests do not create Milestone, Outcome, GrowthReview, Causal Episode, World Model, or Wave3 state. |
| STRICT_DTO_REJECTION | PASS | `confirm-growth-priority.dto.ts`, `start-intervention.dto.ts`, and `complete-growth-action.dto.ts` now enforce strict body allowlists and reject any extra client field. Focused DTO specs cover approved shape, unknown fields, and client-supplied safety fields. |
| PRIORITY_RECONFIRMATION | PASS | Real HTTP E2E rejects stale priority drafts and asserts no hidden Wave2 state is created. |
| INTERVENTION_NOT_COURSE | PASS | Intervention policy defines a 7-day behavior practice card for `LISTEN_BEFORE_RESPOND`, not course content. |

## Blocking Items

| ID | Severity | Owner | Problem | Required fix / evidence |
| --- | --- | --- | --- | --- |
| GOV-BLOCKER-01 | locally remediated with evidence gap | AI-06 | Wave2 named actions previously rechecked consent but not server-side safety state before mutating priority/intervention/action. | `ConfirmGrowthPriority`, `StartIntervention`, and `CompleteGrowthAction` now call deterministic `assertNormalSafetyRoute` before mutation. Focused service specs prove missing normal route evidence blocks writes. Remaining gap: no canonical active safety-state table yet. |
| GOV-BLOCKER-02 | resolved by AI-03 evidence | AI-03 / AI-00 | Minor subject resolution was not contract-clean in the earlier audit. | Current AI-03 report shows `SUBJECT_RESOLUTION = PASS`, `CONTRACT_DB_ALIGNMENT = PASS`, and `REAL_MIGRATION_READY = YES`. Final PostgreSQL E2E still required. |
| GOV-BLOCKER-03 | locally remediated | AI-06 | Wave2 write DTO validators previously did not reject unknown client-supplied fields. | Strict body allowlists are implemented for ConfirmGrowthPriority, StartIntervention, and CompleteGrowthAction. Focused DTO specs pass. |
| GOV-BLOCKER-04 | resolved | AI-05 / AI-00 | Real PostgreSQL + HTTP E2E now covers revoked/missing consent, safety escalation, forbidden DTO fields, stale drafts, no Outcome side effect, and no AI side effect. | 6/6 tests passed; browser-created state was also inspected directly in PostgreSQL. |

## Evidence Notes

- `get_errors` on `apps/api/src/modules/family` and `apps/web/src`: no Problems found.
- Search confirmed consent recheck calls in `growth-priority.service.ts`, `intervention.service.ts`, and `growth-action.service.ts`.
- `normal-safety-route.policy.ts` now provides the deterministic DB-backed normal-route check used by M2-104/M2-105 writes.
- Search found no `ModelGateway`, `LLM`, AI recommendation, Wave3 write, Outcome, Milestone, or GrowthReview creation in M2-104/M2-105 services.
- Current AI-03 `SCHEMA_COMPATIBILITY_AUDIT.md` reports `SCHEMA_CHAIN_VALID = PASS`, `SUBJECT_RESOLUTION = PASS`, `CONTRACT_DB_ALIGNMENT = PASS`, and `REAL_MIGRATION_READY = YES`.
- Focused regression passed: `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- growth-priority.service.spec.ts intervention.service.spec.ts growth-action.service.spec.ts confirm-growth-priority.dto.spec.ts start-intervention.dto.spec.ts complete-growth-action.dto.spec.ts` => 6 files, 24 tests passed.
- API typecheck passed on rerun with diagnostics disabled for pretty output: `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck -- --pretty false`.
- Real PostgreSQL + HTTP E2E passed: 6 tests, 0 skipped, 0 failed.
- Real browser + HTTP + PostgreSQL flow passed through PARTIAL reflection; browser console had zero warnings/errors.
- Direct PostgreSQL inspection for the demo family found 1 priority, 1 intervention, 7 actions, 0 outcomes, 0 milestones, no `growth_reviews` table, and 0 prohibited event side effects.

## Current Ruling

```text
GOVERNANCE_READY = YES
AI07_READY_FOR_USER_AUTHORIZATION = YES
AI07_AUTHORIZED_BY_USER = NO
AI07_STARTED = NO
M2_WAVE_2_CAN_PASS = NO
REMAINING_BLOCKER = AI07_INDEPENDENT_REVIEW
```
