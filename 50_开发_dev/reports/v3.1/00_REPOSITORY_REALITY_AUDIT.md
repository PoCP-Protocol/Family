# V3.1 Phase 0 Repository Reality Audit

role: AI-00 Family Chief Integration / Architecture Lead
date: 2026-08-10
scope: READ_ONLY_REPOSITORY_REALITY_AUDIT
verdict: FAIL_FOR_WAVE2_CLOSE

## Executive Fields

```text
REPO_HEAD = 5ccce44c27af9262f8e0e1fec206019d8569c474
CURRENT_BRANCH = wave/m2-wave2-integration
WORKTREE_CLEAN = false
ACTUAL_M2_STATE = M2_WAVE_2_INTEGRATION_CONVERGENCE_NOT_PASS
DOCUMENT_DRIFT_COUNT = 12
SEMANTIC_BLOCKERS = 7
INTEGRATION_BLOCKERS = 5
DO_NOT_TOUCH_COUNT = 10
REALITY_AUDIT = PASS
```

`REALITY_AUDIT = PASS` means this read-only audit completed and froze repository reality. It does not mean Wave2 passed.

## Repository Facts

- Current branch is `wave/m2-wave2-integration`.
- Current HEAD is `5ccce44c27af9262f8e0e1fec206019d8569c474`.
- Worktree is not clean. Modified files include Wave2 API services, controller/module, DTOs/specs, web files, and M2 reports. Untracked files include `growth-subject.resolver.ts`, `normal-safety-route.policy.ts`, and new DTO specs.
- The codebase is beyond Wave1 and has local Wave2 implementation work, but final Wave2 gates are not closed.

## ACTUAL_M2_STATE

```text
M2_WAVE_1 = CLOSED
M2-103 = PASS
M2_WAVE_2 = IN_PROGRESS
M2-104 = LOCAL_GATE_PASS
M2-105 = LOCAL_GATE_PASS
M2_WAVE_2 = NOT_PASS
CURRENT_PHASE = WAVE2_INTEGRATION_CONVERGENCE
NEXT_ALLOWED_PHASE = V3.1_ARCHITECTURE_CONVERGENCE_AFTER_REVIEW
WAVE3 = FORBIDDEN
```

Actual implemented capability is local/backend-web integration readiness, not production-grade Wave2 closure.

## Actual Implemented Capabilities

- `FamilyController` currently wires Wave2 HTTP routes for priority read/confirm, intervention card/start/active, today action, and action completion.
- `FamilyModule` registers `GrowthSubjectResolver`, `GrowthPriorityService`, `InterventionService`, and `GrowthActionService`.
- `GrowthPriorityService` uses transaction, idempotency key, audit log, outbox event, normal safety route recheck, active onboarding check, consent check, and one-active-priority guard.
- `InterventionService` uses transaction, idempotency key, audit log, outbox event, normal safety route recheck, active-priority check, consent check, and one-active-intervention guard.
- `GrowthActionService` uses transaction, idempotency key, audit log, outbox event, consent check, normal safety route recheck, and reflection boundary.
- `GrowthSubjectResolver` exists and resolves child/guardian context from onboarding event, perspectives, relationship graph, profile/priority provenance, and consistency checks.
- Wave2 DTOs use strict allowlists for confirm priority, start intervention, and complete action.
- `family-wave2.e2e-spec.ts` exists and covers happy path, consent block, safety block, forbidden fields, no-priority, and stale draft paths, but real scenarios are skipped without `TEST_DATABASE_URL`.
- Frontend is static JS and calls real API routes in `apps/web/src/app.js` and `apps/web/src/wave2.js`; React migration is not present and must remain deferred.

## Documented Capabilities Versus Reality

| Area | Documented Claim | Repository Reality | Verdict |
|---|---|---|---|
| Wave2 state | Local gates pass, Wave2 not yet pass | Matches integration dashboard and evidence files | OK |
| Chief Architect state | Current wave is M2 Wave1, Wave2 pending approval | Actual engineering state is Wave2 Integration Convergence | DRIFT |
| PLAN_SSOT_V3.0 next task | Next task is `M2-000_FIRST_GROWTH_SLICE_DEFINITION` | M2-000, Wave1, Phase A, and local Wave2 tasks have already happened | DRIFT |
| PROJECT_STATUS Not Started | Lists Wave2 frontend/API/resolver/e2e as not started | Those are partially implemented | DRIFT |
| CURRENT_SPRINT old Sprint scope | Explicitly out of scope says GrowthPriority/Intervention forbidden for Sprint 1 | Later sections authorize M2 Wave2; document contains historical scope plus active state | DRIFT |
| actions specs | Only M1 action yaml files exist | M2 Named Actions are implemented in code but absent from machine specs | DRIFT |
| event specs | Only early/M1 event specs exist | M2 events exist in code/outbox but have no machine taxonomy | DRIFT |
| GrowthProfile ontology | Uses old `subject_id`, numeric confidence, `dimension_states` | Code/contracts use `profile_scope`, `subject_person_id`, `subject_relationship_id`, basis, evidence snapshot, symbolic confidence | DRIFT |
| OpenAPI v0.2 | Has bearer JWT, `/growth-priorities/confirm`, future outcomes/events | Runtime uses `X-Actor-Id`, onboarding-scoped routes, no approved MeasureOutcome | DRIFT |
| Contracts TS | Contains current M2 shapes | Header comment still says manual M1 minimum origin; machine generation not in place | PARTIAL_DRIFT |
| Browser demo | No PASS claimed | No real Browser + HTTP + PostgreSQL capture | OK_PENDING |
| E2E | Harness ready, PG skipped | Matches evidence; `test-database.ts` throws on missing env but E2E has explicit skip wrapper | OK_PENDING |

## Drift Matrix

1. `agents/chief-architect/CURRENT_ARCHITECT_STATE.yaml` is stale and conflicts with active engineering status.
2. `10_规格_spec/04_实施计划/PLAN_SSOT_V3.0.md` still points to M2-000 as next task.
3. `PROJECT_STATUS.md` has stale `Not Started` entries for capabilities now partially implemented.
4. `CURRENT_SPRINT.md` contains historical Sprint 1 prohibitions alongside active M2 Wave2 authorization.
5. `specs/actions` lacks M2 Named Action machine contracts.
6. `specs/events` lacks M2 event taxonomy and payload contracts.
7. `specs/ontology/growth_profile.schema.yaml` is older than implementation/contracts.
8. `specs/api/openapi-family-platform-v0.2.yaml` does not match runtime route surface/security model and includes future outcome/event APIs.
9. `packages/contracts/src/index.ts` is current for M2 types but not generated from specs and still describes itself as M1 minimum.
10. Integration status documents claim local PASS for some focused checks, but recent terminal history includes failed focused service test commands that need reconciliation.
11. `VALIDATION_EVIDENCE.md` correctly says real PostgreSQL skipped; therefore any report implying final Wave2 E2E PASS would be false.
12. Frontend has real API functions but no completed browser evidence; any claim of real browser demo PASS would be false.

## Semantic Blockers

1. `CompleteGrowthAction` can update actions whose status is already `COMPLETED`, `PARTIAL`, or `NOT_COMPLETED`, so a new idempotency key can overwrite completion status/reflection.
2. `GrowthActionCompleted` event name is emitted for `PARTIAL` and `NOT_COMPLETED`, which conflates completion semantics.
3. `GrowthPriorityConfirmed` event is emitted even when decision is `NO_PRIORITY_YET` and `priority` is null; event taxonomy needs explicit decision semantics.
4. Priority version is inserted as fixed `1`; supersession stores previous priority but does not express version progression semantics.
5. Priority policy is deterministic but still hidden in code/policy and not mirrored into machine-readable action/event specs.
6. `Intervention-001` exists in both migration seed and policy/static card code; duplicate truth is not yet reconciled by a canonical catalog boundary.
7. Safety gate is deterministic and rechecked, but remains `normal-safety-route.policy.ts`, not a unified `GrowthSafetyGate` contract with explicit server-derived signal taxonomy.

## Integration Blockers

1. Worktree is dirty with many Wave2 implementation/report changes and untracked source files.
2. Real PostgreSQL migration chain and HTTP E2E have not passed; `TEST_DATABASE_URL` is missing in local evidence.
3. Browser demo has not run against live backend + real API + PostgreSQL.
4. Governance final review is blocked on final E2E evidence.
5. Independent review is blocked until barriers 1-5 are complete.

## Files With Conflicting Truth

- `50_开发_dev/agents/chief-architect/CURRENT_ARCHITECT_STATE.yaml`
- `10_规格_spec/04_实施计划/PLAN_SSOT_V3.0.md`
- `50_开发_dev/PROJECT_STATUS.md`
- `50_开发_dev/CURRENT_SPRINT.md`
- `50_开发_dev/specs/actions/*.action.yaml`
- `50_开发_dev/specs/events/*.event.yaml`
- `50_开发_dev/specs/ontology/growth_profile.schema.yaml`
- `50_开发_dev/specs/api/openapi-family-platform-v0.2.yaml`
- `50_开发_dev/packages/contracts/src/index.ts`
- `50_开发_dev/reports/m2/wave2/integration/status/AI06_STATUS.md`

## DO_NOT_TOUCH_FILES

These must not be modified in Phase 0 or before the architect approves the remediation streams:

1. `10_规格_spec/04_实施计划/PLAN_SSOT_V3.0.md`
2. `50_开发_dev/PROJECT_STATUS.md`
3. `50_开发_dev/CURRENT_SPRINT.md`
4. `50_开发_dev/agents/chief-architect/CURRENT_ARCHITECT_STATE.yaml`
5. `50_开发_dev/reports/m2/wave2/M2_WAVE2_CONTRACT_FREEZE.md`
6. `50_开发_dev/reports/m2/wave2/SHARED_FILE_CONFLICT_MATRIX.md`
7. `50_开发_dev/database/migrations/0008_m2_wave2_priority_intervention_action.sql`
8. `50_开发_dev/apps/api/src/modules/family/family.repository.ts`
9. `50_开发_dev/apps/api/src/modules/family/family.service.ts`
10. `30_素材_materials/**`

## BLOCKERS

### Must Resolve Before Wave2 PASS

- Real PostgreSQL + HTTP E2E must pass without skipping required scenarios.
- Browser demo must prove Browser + HTTP + PostgreSQL + Named Actions.
- Governance must be reviewed against final runtime evidence.
- Independent review must run after barriers 1-5.
- Dirty/untracked Wave2 files must be reconciled through approved stream ownership.

### Must Resolve Before Wave3

- M2 action specs and event specs must catch up with runtime.
- OpenAPI must match actual runtime surface and approved security model.
- GrowthProfile ontology schema must align with implementation/contracts.
- Semantic event taxonomy must distinguish decision/action/outcome boundaries.
- Safety gate contract must be explicit and reusable.

## PROPOSED_PARALLEL_STREAMS

### AI-01 — GrowthPriority Semantics Owner

TASK: Normalize `ConfirmGrowthPriority` semantics, policy visibility, versioning, and `NO_PRIORITY_YET` event behavior.

OWNED_FILES:
- `50_开发_dev/apps/api/src/modules/family/growth-priority.service.ts`
- `50_开发_dev/apps/api/src/modules/family/growth-priority.policy.ts`
- `50_开发_dev/apps/api/src/modules/family/growth-priority.service.spec.ts`

SHARED_FILES:
- `50_开发_dev/packages/contracts/src/index.ts`
- `50_开发_dev/specs/actions/ConfirmGrowthPriority.action.yaml`
- `50_开发_dev/specs/events/GrowthPriority*.event.yaml`

DEPENDENCIES: AI-03 contract decisions; AI-06 event/safety taxonomy.

START_CONDITION: Architect approves Phase 1 remediation and assigns contract baseline.

STOP_CONDITION: Priority confirmation, no-priority, stale draft, active-priority, and version semantics are covered by unit tests and specs.

EXPECTED_OUTPUT: Priority semantic patch plus tests and contract notes.

### AI-02 — Intervention / GrowthAction Semantics Owner

TASK: Close action overwrite risk, event naming, reflection boundary, and Intervention-001 catalog duplication.

OWNED_FILES:
- `50_开发_dev/apps/api/src/modules/family/intervention.service.ts`
- `50_开发_dev/apps/api/src/modules/family/intervention.policy.ts`
- `50_开发_dev/apps/api/src/modules/family/growth-action.service.ts`
- `50_开发_dev/apps/api/src/modules/family/growth-action.policy.ts`
- `50_开发_dev/apps/api/src/modules/family/intervention.service.spec.ts`
- `50_开发_dev/apps/api/src/modules/family/growth-action.service.spec.ts`

SHARED_FILES:
- `50_开发_dev/packages/contracts/src/index.ts`
- `50_开发_dev/specs/events/GrowthAction*.event.yaml`
- `50_开发_dev/specs/actions/StartIntervention.action.yaml`
- `50_开发_dev/specs/actions/CompleteGrowthAction.action.yaml`

DEPENDENCIES: AI-03 contract schema; AI-06 event taxonomy.

START_CONDITION: AI-03 publishes draft event/action contract names.

STOP_CONDITION: Completed actions cannot be overwritten except exact idempotent replay; PARTIAL/NOT_COMPLETED do not emit misleading completed events.

EXPECTED_OUTPUT: Action/intervention semantic patch, focused tests, and catalog reconciliation note.

### AI-03 — Machine Contract / Ontology Owner

TASK: Align action specs, event specs, OpenAPI, GrowthProfile ontology, and TypeScript contracts to actual M2 runtime.

OWNED_FILES:
- `50_开发_dev/specs/actions/*.yaml`
- `50_开发_dev/specs/events/*.yaml`
- `50_开发_dev/specs/ontology/growth_profile.schema.yaml`
- `50_开发_dev/specs/api/openapi-family-platform-v0.2.yaml`
- `50_开发_dev/packages/contracts/src/index.ts`

SHARED_FILES:
- `50_开发_dev/apps/api/src/modules/family/*.dto.ts`
- `50_开发_dev/apps/web/src/wave2.js`

DEPENDENCIES: AI-01/AI-02 semantic decisions; AI-06 safety/event taxonomy.

START_CONDITION: Architect approves contract drift remediation.

STOP_CONDITION: Runtime route/body/event shapes are represented in machine specs; future APIs are removed or marked deferred.

EXPECTED_OUTPUT: Contract alignment patch and machine-contract drift report.

### AI-04 — Frontend Real API / No Fake Capability Owner

TASK: Ensure Wave2 frontend cannot present frozen fixtures as real capability and prepare final real API browser path.

OWNED_FILES:
- `50_开发_dev/apps/web/src/app.js`
- `50_开发_dev/apps/web/src/wave2.js`
- `50_开发_dev/apps/web/src/app.spec.ts`
- `50_开发_dev/reports/m2/frontend/F06_F09_UI_NOTES.md`

SHARED_FILES:
- `50_开发_dev/packages/contracts/src/index.ts`
- `50_开发_dev/reports/m2/wave2/BROWSER_DEMO_EVIDENCE.md`

DEPENDENCIES: AI-03 OpenAPI/contracts; AI-05 live backend evidence.

START_CONDITION: Runtime API contract stable for Phase 1.

STOP_CONDITION: Frontend distinguishes fixture/pre-real mode from real API mode and has tests for no silent fallback in real mode.

EXPECTED_OUTPUT: Web adapter hardening and browser demo readiness notes.

### AI-05 — Real PostgreSQL / HTTP E2E / Browser QA Owner

TASK: Execute real PostgreSQL migration chain, HTTP E2E, and real browser demo once contract/runtime fixes are ready.

OWNED_FILES:
- `50_开发_dev/apps/api/src/modules/family/family-wave2.e2e-spec.ts`
- `50_开发_dev/apps/api/src/test/test-database.ts`
- `50_开发_dev/reports/m2/wave2/VALIDATION_EVIDENCE.md`
- `50_开发_dev/reports/m2/wave2/BROWSER_DEMO_EVIDENCE.md`

SHARED_FILES:
- `50_开发_dev/database/migrations/*.sql`
- `50_开发_dev/apps/web/src/app.js`
- `50_开发_dev/apps/web/src/wave2.js`

DEPENDENCIES: AI-01/AI-02 semantic fixes; AI-03 contracts; AI-04 real API mode.

START_CONDITION: Architect authorizes test execution phase and `TEST_DATABASE_URL` is available.

STOP_CONDITION: E2E scenarios pass without skip and browser evidence is captured against live backend + PostgreSQL.

EXPECTED_OUTPUT: Updated validation evidence with command outputs and browser observations.

### AI-06 — Governance / Safety / Event Taxonomy Owner

TASK: Review safety, consent, no-AI, no-outcome, no-score/ranking, audit/outbox, and event semantic boundaries.

OWNED_FILES:
- `50_开发_dev/apps/api/src/modules/family/normal-safety-route.policy.ts`
- `50_开发_dev/reports/m2/wave2/integration/GOVERNANCE_PRE_REVIEW.md`
- `50_开发_dev/reports/m2/wave2/integration/status/AI06_STATUS.md`

SHARED_FILES:
- `50_开发_dev/specs/events/*.yaml`
- `50_开发_dev/specs/actions/*.yaml`
- `50_开发_dev/apps/api/src/modules/family/*service.ts`

DEPENDENCIES: AI-01/AI-02 final semantics; AI-05 final evidence.

START_CONDITION: Semantic fixes have focused tests; final E2E evidence is available.

STOP_CONDITION: Governance PASS or explicit blocker list is produced from final runtime evidence.

EXPECTED_OUTPUT: Final governance review with safety/consent/event verdicts.

### AI-07 — Independent Review Owner

TASK: Independently verify Phase 1 remediation and Wave2 close readiness after all barriers pass.

OWNED_FILES:
- `50_开发_dev/reports/m2/wave2/integration/INDEPENDENT_REVIEW.md`
- `50_开发_dev/reports/m2/wave2/integration/status/AI07_STATUS.md`

SHARED_FILES:
- All Phase 1 reports and final evidence files, read-only.

DEPENDENCIES: AI-01 through AI-06 complete.

START_CONDITION: Barriers 1-5 are complete and AI-06 governance verdict exists.

STOP_CONDITION: Independent review returns PASS or enumerated blockers with file-level evidence.

EXPECTED_OUTPUT: Independent review report and final go/no-go recommendation.

## Phase 0 Final Statement

No business code was changed by this audit. No Wave3 work was started. No Phase 1 remediation stream was executed. The next step is architect review of this Reality Audit and explicit approval of the remediation streams.
