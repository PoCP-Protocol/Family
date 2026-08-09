# TASK-105 AssignLifeStage Implementation Plan Final

TASK: `TASK-105_ASSIGN_LIFE_STAGE`
ACTION: `AssignLifeStage`
PHASE: M1 Family Core Running
REFERENCE_PATTERN: `NAMED_ACTION_REFERENCE_PATTERN_V1`
STATUS: PLAN_READY_FOR_IMPLEMENTATION

## TASK

Implement the approved `AssignLifeStage` Named Action for assigning a clear, auditable, versioned LifeStage context to a Child in a Family.

Do not implement TASK-106 GrantConsent. AI-04 may only prepare Consent planning notes after TASK-105 implementation/gate.

## UNDERSTANDING

LifeStage is a `CONTEXT / DEVELOPMENT STAGE` assignment. It is not a GrowthProfile, GrowthState, clinical label, assessment result, AI diagnosis, recommendation, Family Score, or ranking.

`FACT: birth_date != ACTION: AssignLifeStage`.

`DetermineLifeStage` may produce a recommendation under human-rule-assisted V1 semantics, but it cannot directly mutate core state. The only approved state write in this task is `AssignLifeStage`.

## FILES TO READ

Already read for this plan:

- `CLAUDE.md`
- `50_开发_dev/CLAUDE.md`
- `50_开发_dev/PROJECT_STATUS.md`
- `50_开发_dev/CURRENT_SPRINT.md`
- `50_开发_dev/backlog/tasks/TASK-105_ASSIGN_LIFE_STAGE.md`
- `50_开发_dev/specs/actions/AssignLifeStage.action.yaml`
- `50_开发_dev/specs/ontology/life_stage.schema.yaml`
- `50_开发_dev/specs/ontology/child.schema.yaml`
- `50_开发_dev/specs/events/LifeStageAssigned.event.yaml`
- `50_开发_dev/specs/decisions/DetermineLifeStage.decision.yaml`
- `50_开发_dev/specs/policies/core-state-write.policy.yaml`
- `50_开发_dev/specs/policies/consent.policy.yaml`
- `50_开发_dev/specs/api/openapi-family-core-v0.1.yaml`
- `50_开发_dev/database/migrations/0001_family_identity.sql`
- `50_开发_dev/apps/api/src/modules/family/family.service.ts`
- `50_开发_dev/apps/api/src/modules/family/family.controller.ts`
- `50_开发_dev/apps/api/src/test/test-database.ts`

## FILES TO CHANGE

Planned TASK-105 files:

- `50_开发_dev/packages/contracts/src/index.ts`
- `50_开发_dev/apps/api/src/modules/family/assign-life-stage.dto.ts`
- `50_开发_dev/apps/api/src/modules/family/assign-life-stage.dto.spec.ts`
- `50_开发_dev/apps/api/src/modules/family/assign-life-stage.integration.spec.ts`
- `50_开发_dev/apps/api/src/modules/family/assign-life-stage.e2e-spec.ts`
- `50_开发_dev/apps/api/src/modules/family/family.controller.ts`
- `50_开发_dev/apps/api/src/modules/family/family.service.ts`
- `50_开发_dev/specs/api/openapi-family-core-v0.1.yaml`
- `50_开发_dev/reports/task-105/IMPLEMENTATION_PLAN_FINAL.md`
- `50_开发_dev/reports/task-106/IMPLEMENTATION_PLAN.md` plan only, no code
- `50_开发_dev/reports/task-105/TASK-105_ASSIGN_LIFE_STAGE_GATE.md`
- `50_开发_dev/backlog/tasks/TASK-105_ASSIGN_LIFE_STAGE.md`
- `50_开发_dev/PROJECT_STATUS.md`

Migration file is not expected unless implementation discovers the existing `life_stage_assignments` table/index is insufficient for the approved semantics.

## DEPENDENCIES

- TASK-101 CreateFamily = PASS
- TASK-101H Reference Harness = PASS
- TASK-102 AddParent = PASS
- TASK-103 AddChild = PASS
- TASK-104 CreateFamilyRelationship = PASS
- Existing `life_stage_assignments` table exists in `0001_family_identity.sql`
- Existing `uq_active_life_stage` partial unique index enforces one active assignment per child
- Existing FamilyService permission model uses successful `CreateFamily` audit by actor for family manage permission

## IMPLEMENTATION PLAN

### 1. Action input

HTTP body fields:

- `child_id`: UUID, required
- `life_stage_code`: required, enum `EARLY_ADOLESCENCE_12_15`
- `effective_from`: ISO date-time, required
- `idempotency_key`: non-empty string, required

Service request adds route `family_id` after UUID validation.

Request hash includes `family_id`, `child_id`, `life_stage_code`, and `effective_from`; it excludes `idempotency_key` and audit metadata.

### 2. LifeStage business semantics

`LifeStageAssignment` records the current explicit developmental-stage context for a Child. V1 supports only `EARLY_ADOLESCENCE_12_15`.

The assignment is a fact-like core state created by a Named Action, not an AI diagnosis or derived label. It does not create GrowthProfile, GrowthPriority, Journey, Intervention, Consent, recommendation, assessment, score, or ranking records.

### 3. Permission

Controller extracts actor context only. Service enforces family manage permission by reusing `assertFamilyManagePermission(client, familyId, actorId)`.

Missing `x-actor-id` returns `401 actor_is_authenticated`. Actor existence alone is not permission.

### 4. Child/family preconditions

Inside the transaction:

- family exists
- actor has family manage permission
- child row exists
- child belongs to `family_id`
- child has `person_type = CHILD`
- `life_stage_code` is approved by the action contract

Failures are controlled exceptions and roll back all writes.

### 5. Active assignment rule

At most one active assignment per Child is allowed. Active means `effective_to IS NULL`.

Implementation closes the previous active assignment, if any, before inserting the new active assignment.

The existing `uq_active_life_stage` partial unique index on `life_stage_assignments(child_id) WHERE effective_to IS NULL` provides DB-level protection.

### 6. Temporal/versioning rule

The previous active row is versioned by setting `effective_to = request.effective_from`.

The new assignment is inserted with:

- `effective_from = request.effective_from`
- `effective_to = null`
- `source = meta.source` or an approved bounded source value if DB/source constraints require normalization

A prior active assignment with `effective_from >= request.effective_from` is invalid because it would create a non-forward version transition. It should return `400 life_stage_effective_from_must_be_after_active_assignment`.

### 7. Duplicate assignment behavior

Same idempotency key + same request replays stored response without changing rows, audit, or outbox.

Same idempotency key + different request returns `409 Idempotency conflict`.

A non-idempotent repeated request that assigns the same `life_stage_code` with the same `effective_from` while an identical active assignment already exists should return `409 life_stage_assignment_already_active` rather than close/reopen the same assignment.

A later `effective_from` with the same code is allowed as a versioned re-assignment only if it moves time forward and closes the previous active row.

### 8. Transaction boundary

One PostgreSQL transaction covers:

- idempotency lock
- family existence check
- permission check
- child lookup and validation
- active assignment lock/check
- previous active close
- new assignment insert
- audit insert
- outbox insert
- idempotency response storage
- commit

Rollback applies to every controlled failure.

### 9. DB constraints

Existing DB constraints:

- `life_stage_assignments.family_id` FK to `families`
- `life_stage_assignments.child_id` FK to `persons`
- `life_stage_code` enum
- `life_stage_time CHECK (effective_to IS NULL OR effective_to > effective_from)`
- `uq_active_life_stage ON life_stage_assignments(child_id) WHERE effective_to IS NULL`

Service-level constraints remain required for child belongs to family and `person_type = CHILD` because the current schema cannot express those checks with the existing simple FK shape.

### 10. Event

Emit `LifeStageAssigned` to `outbox_events`.

Required payload fields:

- `event_id`
- `family_id`
- `child_id`
- `life_stage_code`
- `occurred_at`
- `actor_id`
- `correlation_id`
- `metadata.source`
- `metadata.schema_version`

Include `assignment_id`, `effective_from`, and `effective_to` as additional useful payload fields, without adding derived growth/consent state.

### 11. Audit

Insert one `audit_logs` row on successful new assignment.

- `action_name = AssignLifeStage`
- `resource_type = LifeStageAssignment`
- `resource_id = assignment_id`
- metadata includes source, occurred_at, and response snapshot following existing FamilyService pattern

Idempotent replay must not add another audit row.

### 12. Idempotency

Use `idempotency_keys` with `action_name = AssignLifeStage`.

The transaction must lock the idempotency row before domain writes. Replay returns the stored response. Conflict returns `409`.

### 13. API

Implement route:

`POST /families/{familyId}/life-stages`

Use the existing core OpenAPI placeholder path and harden it with:

- request body schema `AssignLifeStageRequest`
- response schema `AssignLifeStageResponse`
- assignment schema `LifeStageAssignment`
- controlled `400`, `401`, `403`, `404`, `409` errors

Do not add `GrantConsent` implementation.

### 14. Tests

Unit/DTO:

- valid request accepted
- invalid family id rejected
- invalid child id rejected
- invalid `life_stage_code` rejected
- invalid `effective_from` rejected
- unknown fields rejected
- empty `idempotency_key` rejected

Integration on real PostgreSQL:

- successful assignment writes row, audit, outbox, idempotency response
- child must belong to family
- person must be child, not parent
- missing family/child controlled failures
- unauthorized actor controlled failure and no row
- previous active assignment is closed/versioned
- duplicate active same effective_from returns conflict
- idempotency replay does not duplicate row/audit/event
- idempotency conflict returns 409
- AddChild with `birth_date` does not create life-stage assignment
- AssignLifeStage creates no consent/growth/relationship side effects

HTTP E2E:

- success response shape
- invalid schema
- missing actor
- unauthorized actor
- cross-family child
- versioning
- idempotency replay/conflict
- no side effects

Aggregate testing remains TASK-107 unless an existing aggregate endpoint already exists and only needs non-invasive assertion.

### 15. Migration requirement

Initial assessment: no migration required for the core TASK-105 semantics because `life_stage_assignments` and `uq_active_life_stage` already exist.

A migration should be added only if implementation discovers a missing DB-level invariant that can be added without changing public API or deleting historical data.

### 16. Risks

- `source` in DB is `varchar(64)`, while `meta.source` may exceed 64 chars. Implement bounded validation or truncation policy carefully; prefer DTO/header normalization in controller/service metadata if already established.
- same-family and child type remain service-level invariants due to current FK shape.
- Time-versioning must avoid closing an active row to an invalid interval.
- The V1 decision spec can recommend a code, but implementation must not let recommendation equal action.
- TASK-106 Consent must not be implemented or implicitly prepared through DB writes in TASK-105.

## AI ROLE EXECUTION MAP

- AI-00 Architecture / Integration Lead: plan, orchestration, final gate, status updates.
- AI-01 TASK-105 Builder: only business writer for DTO/controller/service/contracts/OpenAPI.
- AI-02 Temporal Integrity & Test Engineer: time/versioning rule, DB constraint usage, integration/e2e validation.
- AI-03 Independent Reviewer: read-only review before PASS.
- AI-04 TASK-106 Consent Planner: plan-only after TASK-105 gate; no TASK-106 code.

## ACCEPTANCE CRITERIA MAPPING

| AC | Planned Evidence |
|---|---|
| AC1 only EARLY_ADOLESCENCE_12_15 supported in V1 | DTO and service reject other values; OpenAPI enum is single-value V1. |
| AC2 child must belong to Family | Integration/E2E cross-family child rejection. |
| AC3 prior active assignment is closed/versioned | Integration asserts old `effective_to` and new active row. |
| AC4 event/audit exist | Integration/E2E assert audit and outbox records. |
| AC5 AI cannot invent new LifeStage | No AI write path; decision remains recommendation only; enum allowlist tests. |

## NEXT STEP

Proceed to implementation of TASK-105 only after this plan is created. Do not start TASK-106 implementation.
