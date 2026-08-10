# M2 Wave 2 Phase B2 Integration Convergence Directive

status: ACTIVE
wave: M2_WAVE_2_DECIDE_AND_ACT
phase: WAVE2_INTEGRATION_CONVERGENCE
date: 2026-08-10
mode: PARALLEL_MULTI_ROLE_DEVELOPMENT

## 0. Architect Ruling

```text
M2-104 GrowthPriority = LOCAL_GATE_PASS
M2-105 Intervention-001 + GrowthAction = LOCAL_GATE_PASS
M2_WAVE_2 = NOT YET PASS
READY_FOR_WAVE2_INTEGRATION = YES
```

Wave 2 is not complete. The project must not claim complete Decide & Act product capability until Real PostgreSQL, HTTP, Frontend, E2E, Browser Demo, Governance Review, and Independent Review all pass.

## 1. Phase B2 Objective

Converge the two local backend streams into a real product slice:

```text
PROFILE
-> PRIORITY
-> INTERVENTION
-> ACTION
-> REFLECTION
```

The slice must run through:

```text
REAL DATABASE
+ REAL HTTP
+ REAL FRONTEND
+ REAL BROWSER
```

## 2. Current Prohibitions

The following remain forbidden in Phase B2:

- Wave 3 implementation.
- Milestone.
- Outcome.
- GrowthReview.
- AI Recommendation.
- LLM.
- Model Gateway.
- Agent Runtime.
- Family Score.
- Ranking.
- Causal Engine.
- World Model.
- Native App.
- Mini Program.

Integration must not expand scope.

## 3. Team Roles

| Role | Responsibility |
|---|---|
| AI-00 | Wave2 Integration Lead: state, API/module wiring, shared files, barriers, final gate. |
| AI-01 | GrowthPriority domain fix owner. |
| AI-02 | Intervention/GrowthAction domain fix owner. |
| AI-03 | Schema/Contract compatibility owner. |
| AI-04 | Frontend real-integration owner. |
| AI-05 | Real PostgreSQL / HTTP E2E / Browser QA owner. |
| AI-06 | Consent / Safety / Domain Governance reviewer. |
| AI-07 | Independent architecture/product reviewer; implementation forbidden. |

AI-07 must not participate in implementation. AI-06 should not own primary business coding.

## 4. State Alignment

Required current state:

```text
M2_WAVE_1 = CLOSED
M2-103 = PASS
M2_WAVE_2 = IN_PROGRESS
M2-104 = LOCAL_GATE_PASS
M2-105 = LOCAL_GATE_PASS
current_phase = WAVE2_INTEGRATION_CONVERGENCE
active_task = M2-WAVE2-INTEGRATION
STATE_ALIGNMENT = PASS
```

Forbidden state claims:

```text
Do not mark M2_WAVE_2 as PASS
Family has complete Decide & Act product capability
```

## 5. Contract Freeze

Authoritative artifacts:

- `reports/m2/wave2/M2_WAVE2_CONTRACT_FREEZE.md`
- `reports/m2/wave2/SHARED_FILE_CONFLICT_MATRIX.md`

The freeze remains binding. Any required change must use a `CONTRACT_CHANGE_REQUEST` with:

```text
CCR_ID
DISCOVERED_BY
CURRENT_RULE
PROBLEM
WHY_IT_BLOCKS_REAL_INTEGRATION
PROPOSED_CHANGE
DOMAIN_IMPACT
DB_IMPACT
API_IMPACT
FRONTEND_IMPACT
TEST_IMPACT
BACKWARD_COMPATIBILITY
BLOCKING
```

AI-00 owns the ruling path.

## 6. Parallel Streams

| Stream | Scope | Owner |
|---|---|---|
| STREAM-A | Schema / Contract Compatibility | AI-03 |
| STREAM-B | API / Module / Orchestration Integration | AI-00 |
| STREAM-C | Frontend F01/F06/F07/F08/F09 Real Integration | AI-04 |
| STREAM-D | Real PostgreSQL + HTTP E2E + Browser QA | AI-05 |
| STREAM-E | Governance Pre-Review | AI-06 |

AI-01 and AI-02 remain domain fix owners and may only modify their owned focused services/policies/tests unless AI-00 explicitly routes an integration issue.

## 7. Architecture Rulings

### GrowthJourney Subject

```text
GrowthJourney != Person-Owned Object
```

Do not add `growth_journeys.subject_person_id` for convenience. Consent subject must be resolved through canonical relations, such as:

```text
Journey / Intervention
-> Growth Onboarding
-> child_id
-> Minor Subject
```

or:

```text
Relationship Growth Profile
-> Parent-Child Relationship
-> Child
```

If contracts prove Journey is explicitly child-owned, AI-03 must submit `CCR-W2-SUBJECT-001`; no direct schema edit is allowed.

### GrowthSubjectResolver

If multiple Wave2 Actions need consent/minor/guardian subject resolution, create a minimal boundary such as `GrowthSubjectResolver`.

Allowed responsibility:

```text
input: familyId + journey/onboarding/profile/priority context
output: childPersonId + guardianPersonId + relationshipId + source provenance
```

Required provenance examples:

```text
resolved_via = ONBOARDING_CHILD
resolved_via = RELATIONSHIP_PROFILE
```

Forbidden shortcut:

```text
SELECT first child
```

### GrowthAction Legacy Compatibility

Dual-writing legacy `growth_actions` columns is allowed only as:

```text
TEMPORARY_SCHEMA_COMPATIBILITY
```

AI-03 must classify fields as:

```text
CANONICAL_WAVE2
LEGACY_EQUIVALENT
LEGACY_AMBIGUOUS
```

Semantic blockers must not be hidden by dummy values.

## 8. Stream-A Gate

AI-03 must produce:

- `reports/m2/wave2/integration/SCHEMA_COMPATIBILITY_AUDIT.md`

Required gate values:

```text
SCHEMA_CHAIN_VALID = PASS/FAIL
GROWTH_JOURNEY_SEMANTICS = PASS/FAIL
SUBJECT_RESOLUTION = PASS/FAIL
GROWTH_ACTION_COMPATIBILITY = PASS/FAIL
CONTRACT_DB_ALIGNMENT = PASS/FAIL
REAL_MIGRATION_READY = YES/NO
BLOCKERS = n
```

AI-05 may not enter the final Real PostgreSQL gate until `REAL_MIGRATION_READY = YES`.

## 9. Stream-B API Integration

AI-00 owns writes to:

- `apps/api/src/modules/family/family.controller.ts`
- `apps/api/src/modules/family/family.module.ts`
- necessary `family.service.ts` orchestration
- DTO wiring
- dependency injection
- route registration

Do not turn `FamilyService` into a larger monolith. Prefer controller/minimal orchestration to focused services.

Required user actions/API coverage, per frozen contract:

- Priority draft/read.
- `ConfirmGrowthPriority`.
- Get Intervention Detail.
- `StartIntervention`.
- Get Active Intervention / Action Plan.
- Get Today's Action.
- `CompleteGrowthAction`.
- Necessary Family Home Wave2 aggregate/read.

All write Named Actions must validate DTOs and reject unknown fields, client-supplied canonical status, safety severity, score, outcome, or milestone.

## 10. Stream-C Frontend

AI-04 may begin with frozen-contract fixtures, then switch to real API mode.

Required screens/states:

- F01 updated Wave2 Family Home.
- F06 Priority explanation and `NO_PRIORITY_YET`.
- F07 Intervention detail for `先听后回应`.
- F08 Today's Action with `PENDING`, `COMPLETED`, `PARTIAL`, `NOT_COMPLETED`.
- F09 lightweight Reflection.

Required final frontend gate:

```text
PRIORITY_REAL_API = PASS
INTERVENTION_REAL_API = PASS
ACTION_REAL_API = PASS
REFLECTION_REAL_API = PASS
FAMILY_HOME_REAL_API = PASS
NO_WAVE2_FAKE_STATE = PASS
```

Also update `FRONTEND_ARCHITECTURE_HEALTH.md` with either:

```text
STATIC_WEB_CONTINUE
```

or:

```text
FRONTEND_FRAMEWORK_RFC_REQUIRED
```

No framework migration is approved in Phase B2.

## 11. Stream-D Real PostgreSQL / E2E

AI-05 prepares migration harness, integration fixtures, HTTP E2E skeleton, and browser demo harness in parallel.

Final Real PostgreSQL gate must run from a clean database and, if supported, Wave1-compatible upgraded database.

Wave2 E2E must not SQL-insert business states such as growth priority, intervention episode, or growth action and call that E2E. Business state must be created by Named Actions. Migration fixtures are the only exception.

Minimum HTTP E2E cases:

```text
E2E-W2-01 profile -> priority draft
E2E-W2-02 confirm priority
E2E-W2-03 NO_PRIORITY_YET path
E2E-W2-04 stale priority rejected
E2E-W2-05 start intervention
E2E-W2-06 exactly 7 actions
E2E-W2-07 get today's action
E2E-W2-08 complete action
E2E-W2-09 reflection persisted
E2E-W2-10 idempotency replay
E2E-W2-11 idempotency conflict
E2E-W2-12 revoked/missing consent blocks
E2E-W2-13 safety escalation blocks
E2E-W2-14 no Outcome side effect
E2E-W2-15 no AI side effect
```

## 12. Stream-E Governance

AI-06 begins before final implementation completes and reviews:

```text
PROFILE_NOT_PRIORITY
PRIORITY_NOT_SCORE
PRIORITY_NOT_DIAGNOSIS
NO_PRIORITY_YET
NO_HIDDEN_SCORE
ONE_PRIMARY_PRIORITY
PRIORITY_RECONFIRMATION
INTERVENTION_NOT_COURSE
ACTION_NOT_OUTCOME
REFLECTION_NOT_OUTCOME
CONSENT_RECHECKED
SAFETY_RECHECKED
MINOR_SUBJECT_RESOLUTION
NO_FIRST_CHILD_SHORTCUT
NO_AI
NO_WAVE3_SIDE_EFFECT
```

## 13. Barriers

| Barrier | Name | Required |
|---|---|---|
| BARRIER-1 | SCHEMA_CONTRACT_READY | AI-03 PASS |
| BARRIER-2 | DOMAIN_API_READY | AI-01 PASS, AI-02 PASS, AI-00 wiring PASS |
| BARRIER-3 | FRONTEND_REAL_API_READY | AI-04 PASS |
| BARRIER-4 | REAL_E2E_READY | AI-05 PASS |
| BARRIER-5 | GOVERNANCE_READY | AI-06 PASS |

AI-07 starts only after BARRIER-1 through BARRIER-5 pass.

## 14. Browser Demo

The final demo must be real:

```text
Browser
+ HTTP
+ PostgreSQL
```

Required flow:

```text
Family Home
-> Growth Insight
-> Growth Priority
-> Why this Priority
-> Confirm
-> Intervention Detail
-> Start 7-Day Practice
-> Today Action
-> Complete / Partial / Not Completed
-> Reflection
-> Family Home
```

## 15. Final Required Reports

Required final artifacts:

- `reports/m2/wave2/M2_WAVE2_FINAL_INTEGRATION_REPORT.md`
- `reports/m2/wave2/M2_WAVE2_GATE.md`

`M2_WAVE2_GATE.md` must include the full PASS/FAIL matrix defined by the architect ruling, including schema compatibility, subject resolution, legacy action compatibility, M2-104, M2-105, frontend, real PostgreSQL, HTTP E2E, browser demo, governance, independent review, and blockers.

## 16. Success Condition

Only if:

```text
BLOCKERS = 0
all core gates = PASS
```

may the project state become:

```text
M2_WAVE_2_DECIDE_AND_ACT = PASS
READY_FOR_M2_WAVE_3 = NO
WAVE3 = CLOSED_NOT_AUTHORIZED
```

Wave3 must remain closed after Wave2 completion. Planning or coding Wave3 requires a new architecture decision, task pack, and explicit user authorization.

## 17. Ending Rule

When Wave2 Final Gate completes, stop.

```text
READY_FOR_M2_WAVE_3 = NO
START_M2_WAVE_3 = NO
WAVE3 = CLOSED_NOT_AUTHORIZED
M3_RUNTIME = NOT_AUTHORIZED
```
