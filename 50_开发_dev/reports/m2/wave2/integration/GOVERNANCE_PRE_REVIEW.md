# Governance Pre-Review - AI-06

date: 2026-08-10
phase: WAVE2_INTEGRATION_CONVERGENCE
reviewer: AI-06 Consent / Safety / Domain Governance Pre-Review Owner
contract_version: M2_WAVE2_CF_V1
scope: M2-104 GrowthPriority, M2-105 Intervention/GrowthAction, Phase B2 directive

## Gate Result

```text
GOVERNANCE_PRE_REVIEW = FAIL
GOVERNANCE_READY = NO
BARRIER-5 = BLOCKED
BLOCKERS = 4
```

This is a pre-review result, not a final Wave2 gate. Several semantic boundaries pass locally, but governance cannot pass until safety rechecks, canonical minor subject resolution, strict write DTO rejection, and final integration/E2E evidence are available.

## PASS / FAIL / PENDING Matrix

| Check | Result | Evidence / reason |
|---|---|---|
| PROFILE_NOT_PRIORITY | PASS | Priority candidates anchor to confirmed `growth_profiles` and write only `growth_priorities`; no profile write side effect found in M2-104. |
| PRIORITY_NOT_SCORE | PASS | Policy uses qualitative state/reason codes; tests assert no `score`, `rank`, `diagnosis`, or `recommendation` in draft JSON. |
| PRIORITY_NOT_DIAGNOSIS | PASS | Priority boundary is `PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS`; no diagnosis fields found in M2-104 service/policy. |
| NO_PRIORITY_YET | PASS | `NO_PRIORITY_YET` is accepted by DTO/policy and service returns `priority: null` without inserting active priority. |
| NO_HIDDEN_SCORE | PASS | No numeric scoring field found in M2-104 implementation; `rank` remains DB legacy compatibility and active priorities are constrained to `rank = 1`. |
| ONE_PRIMARY_PRIORITY | PASS | Migration adds one-active-priority unique index; service supersedes existing active priority before insert. |
| ACTION_NOT_OUTCOME | PASS | Actions carry `ACTION_IS_NOT_OUTCOME`; M2-105 tests check no profile/outcome/milestone/growth review writes. |
| REFLECTION_NOT_OUTCOME | PASS_WITH_BLOCKER | Completion stores `REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME`; however reflection write still fails governance until safety recheck exists before storage. |
| CONSENT_RECHECKED | PASS_WITH_SUBJECT_BLOCKER | `ConfirmGrowthPriority`, `StartIntervention`, and `CompleteGrowthAction` all query active `SERVICE`, `ASSESSMENT`, and `GROWTH_TRACKING` consent before write. Correctness depends on blocked subject resolution. |
| SAFETY_RECHECKED | FAIL | M2-104/M2-105 named actions do not call `assessStructuredSafetySignals`, `assertNormalSafetyDisposition`, or any active safety-block check before write. |
| MINOR_SUBJECT_RESOLUTION | FAIL | AI-03 audit reports `SUBJECT_RESOLUTION = FAIL`; `GrowthPriorityService.assertActiveOnboarding` selects non-existent and unapproved `growth_journeys.subject_person_id`. |
| NO_FIRST_CHILD_SHORTCUT | PASS | Search found no `SELECT first child` / first-child fallback in Wave2 services. Current issue is unresolved/cross-contract subject semantics, not first-child shortcut. |
| NO_AI | PASS | No M2-104/M2-105 code path calls LLM, ModelGateway, Agent Runtime, or AI recommendation. |
| NO_WAVE3_SIDE_EFFECT | PASS | M2-104/M2-105 services/tests do not create Milestone, Outcome, GrowthReview, Causal Episode, World Model, or Wave3 state. |
| STRICT_DTO_REJECTION | FAIL | `confirm-growth-priority.dto.ts`, `start-intervention.dto.ts`, and `complete-growth-action.dto.ts` validate required fields but do not reject unknown/forbidden client fields such as safety severity, score, outcome, or milestone. |
| PRIORITY_RECONFIRMATION | PENDING | Local service rechecks draft id and active intervention conflict; final HTTP/API and E2E stale-priority behavior not yet available. |
| INTERVENTION_NOT_COURSE | PASS | Intervention policy defines a 7-day behavior practice card for `LISTEN_BEFORE_RESPOND`, not course content. |

## Blocking Items

| ID | Severity | Owner | Problem | Required fix / evidence |
|---|---|---|---|---|
| GOV-BLOCKER-01 | blocking | AI-00 / AI-02 / AI-01 | Wave2 named actions recheck consent but not server-side safety state before mutating priority/intervention/action. | Add or route an approved safety gate for `ConfirmGrowthPriority`, `StartIntervention`, and `CompleteGrowthAction`; prove medium/high/critical or active safety block cannot proceed as normal growth flow. |
| GOV-BLOCKER-02 | blocking | AI-03 / AI-00 | Minor subject resolution is not contract-clean: AI-03 reports `SUBJECT_RESOLUTION = FAIL`, `CONTRACT_DB_ALIGNMENT = FAIL`, and `REAL_MIGRATION_READY = NO`. | Implement an approved `GrowthSubjectResolver` / canonical resolver path or issue CCR; do not use `growth_journeys.subject_person_id`. |
| GOV-BLOCKER-03 | blocking | AI-00 / AI-01 / AI-02 | Wave2 write DTO validators do not reject unknown or forbidden client-supplied governance fields. | Enforce strict body allowlists for ConfirmGrowthPriority, StartIntervention, and CompleteGrowthAction; reject client-supplied safety severity, score, outcome, milestone, diagnosis, recommendation, and other unknown fields. |
| GOV-BLOCKER-04 | blocking | AI-05 / AI-00 | No final real PostgreSQL + HTTP E2E evidence yet for revoked consent, safety escalation block, no Outcome side effect, and no AI side effect. | Run required E2E cases E2E-W2-12 through E2E-W2-15 after schema/API integration. |

## Evidence Notes

- `get_errors` on `apps/api/src/modules/family` and `apps/web/src`: no Problems found.
- Search confirmed consent recheck calls in `growth-priority.service.ts`, `intervention.service.ts`, and `growth-action.service.ts`.
- Search found safety enforcement only in Wave1/onboarding/perspective paths (`family.service.ts`, `record-perspective.dto.ts`, `safety-assessment.policy.ts`), not in M2-104/M2-105 named actions.
- Search found no `ModelGateway`, `LLM`, AI recommendation, Wave3 write, Outcome, Milestone, or GrowthReview creation in M2-104/M2-105 services.
- AI-03 `SCHEMA_COMPATIBILITY_AUDIT.md` exists and reports `SCHEMA_CHAIN_VALID = FAIL`, `SUBJECT_RESOLUTION = FAIL`, `CONTRACT_DB_ALIGNMENT = FAIL`, and `REAL_MIGRATION_READY = NO`.

## Current Ruling

```text
GOVERNANCE_READY = NO
AI07_CAN_START = NO
M2_WAVE_2_CAN_PASS = NO
```
