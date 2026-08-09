# TASK-107 Family Core Integration Final Implementation Plan

status: FINAL_PLAN_APPROVED_FOR_TASK_107_IMPLEMENTATION
task: TASK-107_FAMILY_CORE_INTEGRATION
milestone: M1_FAMILY_CORE_RUNNING
date: 2026-08-10
implementation_started: NO

## TASK

Execute TASK-107 as the final M1 vertical integration proof:

```text
CreateFamily
-> AddParent
-> AddChild
-> CreateFamilyRelationship(PARENT_CHILD)
-> AssignLifeStage(EARLY_ADOLESCENCE_12_15)
-> GrantConsent(SERVICE)
-> GetFamilyAggregate
```

This task closes M1 only if the real PostgreSQL full flow, read aggregate, audit chain, outbox chain, idempotency, permission, and no-side-effect gates pass.

## UNDERSTANDING

TASK-107 is not a new Named Action. It is a read projection plus final vertical proof that approved M1 write actions compose correctly.

Current local evidence:

- OpenAPI already reserves `GET /families/{familyId}` with `operationId: GetFamilyAggregate`, but its `200` response is still only a description.
- `packages/contracts/src/index.ts` has DTOs for family, person, relationship, life stage, and consent, but no `FamilyAggregateResponse` yet.
- `family.controller.ts` exposes only M1 write endpoints.
- `family.service.ts` implements CreateFamily, AddParent, AddChild, CreateFamilyRelationship, AssignLifeStage, and GrantConsent.
- `family.repository.ts` owns PostgreSQL transaction scope only.
- Test harness already requires real PostgreSQL through `TEST_DATABASE_URL` and cleans Family Core plus Growth tables.

## FILES TO READ

Already read for this final plan:

- `CLAUDE.md`
- `50_开发_dev/CLAUDE.md`
- `50_开发_dev/PROJECT_STATUS.md`
- `50_开发_dev/CURRENT_SPRINT.md`
- `50_开发_dev/backlog/tasks/TASK-107_FAMILY_CORE_INTEGRATION.md`
- `50_开发_dev/reports/task-107/IMPLEMENTATION_PLAN.md`
- `50_开发_dev/specs/api/openapi-family-core-v0.1.yaml`
- `50_开发_dev/packages/contracts/src/index.ts`
- `50_开发_dev/apps/api/src/modules/family/family.controller.ts`
- `50_开发_dev/apps/api/src/modules/family/family.service.ts`
- `50_开发_dev/apps/api/src/modules/family/family.repository.ts`
- `50_开发_dev/apps/api/src/test/test-database.ts`
- `50_开发_dev/database/migrations/0001_family_identity.sql`
- `50_开发_dev/database/migrations/0005_consent_active_uniqueness.sql`
- `50_开发_dev/security/MINOR_DATA_SOP.md`
- `50_开发_dev/security/CONSENT_PERMISSION_MATRIX.csv`
- Representative existing E2E specs for CreateFamily and GrantConsent.

## FILES TO CHANGE

Expected implementation files:

- `packages/contracts/src/index.ts`
- `apps/api/src/modules/family/family.controller.ts`
- `apps/api/src/modules/family/family.service.ts`
- `apps/api/src/modules/family/family-aggregate.repository.ts` or equivalent read projection boundary
- `specs/api/openapi-family-core-v0.1.yaml`
- `apps/api/src/modules/family/family-core-integration.e2e-spec.ts` or equivalent focused M1 E2E spec
- `reports/task-107/INDEPENDENT_ARCHITECTURE_REVIEW.md`
- `reports/M1_FAMILY_CORE_REPORT.md`
- `reports/TASK-107_FAMILY_CORE_INTEGRATION_GATE.md`
- `reports/m2/M2_FIRST_GROWTH_VERTICAL_SLICE_PLAN.md`
- `PROJECT_STATUS.md`
- `backlog/tasks/TASK-107_FAMILY_CORE_INTEGRATION.md`

No database migration is planned unless implementation discovers a hard schema mismatch. Current canonical tables are sufficient for the read projection.

## DEPENDENCIES

- TASK-101 through TASK-106 are PASS.
- Real PostgreSQL is required: `TEST_DATABASE_URL=postgres://family:***@localhost:55433/family_gate`.
- Existing migration command remains `node tools/migrate.mjs up`.
- Existing permission helper `assertFamilyManagePermission` remains the M1 permission boundary.

## IMPLEMENTATION PLAN

### 1. Aggregate endpoint

Implement the existing approved endpoint only:

```text
GET /families/{familyId}
```

Do not add `/aggregate`, `/family-view`, `/family-detail-v2`, or a parallel read API.

Headers:

- `x-actor-id`: required.
- `x-correlation-id`: optional, used only as request context; aggregate read does not write audit/outbox in M1.
- `x-source`: optional.

### 2. Aggregate DTO

Add the minimal contract type:

```text
FamilyAggregateResponse
  family: FamilyDto
  members: PersonDto[]
  relationships: FamilyRelationshipDto[]
  lifeStages: LifeStageAssignmentDto[]
  consents: ConsentDto[]
```

Use existing canonical DTOs instead of creating duplicate parent/child summary shapes. Parent and child membership is represented by `members[].person_type`.

### 3. Data source tables

The aggregate is assembled only from canonical M1 tables:

- `families`
- `persons`
- `family_relationships`
- `life_stage_assignments`
- `consents`

Validation-only assertions may read:

- `audit_logs`
- `outbox_events`
- `idempotency_keys`
- Growth tables for no-side-effect counts.

### 4. Active LifeStage definition

Active LifeStage means:

```sql
life_stage_assignments.effective_to IS NULL
```

No LifeStage is inferred from `persons.birth_date`. If a child has `birth_date` but no active assignment, the aggregate returns `lifeStages: []`.

### 5. Active Consent definition

Active Consent means:

```sql
consents.status = 'GRANTED'
```

The aggregate returns only active consent rows. It remains purpose-specific; `SERVICE` does not imply `MODEL_IMPROVEMENT`, `RESEARCH`, or any other purpose.

### 6. Relationship representation

Relationships are returned as canonical `FamilyRelationshipDto` rows:

- `relationship_id`
- `family_id`
- `person_a_id`
- `person_b_id`
- `relationship_type`
- `created_at`

The projection must not infer consent from relationship existence and must not synthesize reverse relationship rows.

### 7. Member representation

Members are returned as canonical `PersonDto[]` rows containing both parents and children:

- `person_type = PARENT` identifies parent/guardian members.
- `person_type = CHILD` identifies child members.
- `parent_role` is null for children by DB invariant.

Do not duplicate the same data into separate `parents` and `children` arrays unless OpenAPI validation later proves this repo already requires that shape.

### 8. Child data minimization

M1 aggregate returns only already-approved `PersonDto` fields. It does not add school, psychological labels, safety signals, conversations, scores, or inferred age-band fields.

`birth_date` may be present because it is part of the existing child ontology and DTO, but no derived age, stage, risk, or recommendation is computed from it.

### 9. Read permission

Use the current M1 permission abstraction:

```text
assertFamilyManagePermission(client, familyId, actorId)
```

M1 read permission is therefore equivalent to the existing M1 family manage permission, currently evidenced by successful `CreateFamily` audit by the same actor for the family.

Tests must cover:

- Authorized actor reads successfully.
- Unauthorized actor receives `403`.
- Unknown family receives `404`.

If implementation discovers the helper cannot reliably support aggregate read without unsafe broadening, stop and report `READ_PERMISSION_GAP`; do not replace it with `actorId exists = read all`.

### 10. Query transaction / consistency strategy

Read the aggregate inside a repository-managed transaction for a transaction-consistent snapshot:

1. Check family existence.
2. Check permission.
3. Query family.
4. Query members.
5. Query relationships.
6. Query active life stages.
7. Query active consents.

No write, audit, outbox, idempotency, lock, or cache side effect is introduced by GET.

### 11. Repository projection

Add a dedicated read projection boundary, preferably `FamilyAggregateRepository`, instead of scattering SQL across the controller.

The service method should orchestrate authorization and projection, while mapping SQL rows to existing DTOs in a single local place.

### 12. Error handling

- Missing or blank `x-actor-id` -> `401`.
- Invalid `familyId` shape -> `400`.
- Existing UUID but no family -> `404`.
- Known family but actor lacks current M1 permission -> `403`.
- Aggregate read does not expose raw SQL errors or sensitive implementation details.

### 13. Test strategy

Add focused real PostgreSQL HTTP E2E coverage:

- `M1-E2E-01`: empty DB full flow through real API, ending with `GET /families/{familyId}`.
- `M1-E2E-02`: unauthorized actor read -> `403`.
- `M1-E2E-03`: unknown family -> `404`.
- `M1-E2E-04`: family with no LifeStage -> `lifeStages: []`.
- `M1-E2E-05`: family with no Consent -> `consents: []`.
- `M1-E2E-06`: expired old consent plus active new version -> only active version returned.
- `M1-E2E-07`: relationship exists but Consent absent -> `consents: []`.
- `M1-E2E-08`: child `birth_date` exists but LifeStage absent -> `lifeStages: []`.

The full-flow test must also assert:

- Audit rows exist for `CreateFamily`, `AddParent`, `AddChild`, `CreateFamilyRelationship`, `AssignLifeStage`, and `GrantConsent`.
- Outbox events exist for all six write actions.
- The same correlation id is traceable across write audit/outbox rows.
- CreateFamily and GrantConsent idempotency replay does not duplicate data.
- Same idempotency key with different payload returns `409`.
- Growth/AI/Journey side-effect tables remain empty.

### 14. Performance boundary

M1 aggregate may use straightforward indexed PostgreSQL reads over one family. No materialized view, Elasticsearch, Graph DB, Kafka projection, cache layer, or read database is introduced in TASK-107.

Expected query scale is one family aggregate at a time. Broader pagination, search, cross-family analytics, and staff dashboards are outside M1.

### 15. Explicit non-goals

TASK-107 will not implement:

- New Named Action.
- GrowthProfile.
- Perspective.
- Evidence.
- GrowthPriority.
- Journey.
- Intervention.
- Recommendation.
- Model Gateway.
- Agent Runtime.
- World Model.
- Family Total Score.
- Family ranking.
- Consent withdrawal.
- IAM/RBAC/ABAC rewrite.
- New read infrastructure beyond PostgreSQL.
- M2 product code.

### 16. M1 final acceptance criteria

TASK-107 can be reported PASS only if:

- `GET /families/{familyId}` returns the canonical aggregate.
- Full M1 flow runs from empty real PostgreSQL through HTTP.
- Aggregate contains family, one parent, one child, one `PARENT_CHILD` relationship, one active `EARLY_ADOLESCENCE_12_15` life stage, and one active `SERVICE` consent.
- `MODEL_IMPROVEMENT` is absent unless explicitly granted; the M1 full flow must prove it is absent.
- Unauthorized read is denied.
- Unknown family is not found.
- No LifeStage inference from birth date occurs.
- No Consent inference from relationship occurs.
- Audit and outbox chains exist for all write actions.
- Correlation id is traceable.
- Idempotency replay and conflict semantics remain intact.
- Real PostgreSQL test gate passes.
- Contract validation, lint, typecheck, build, and required tests pass.
- Independent architecture review concludes PASS or explicitly documented non-blocking conditional pass.

## AI ROLE MAP

- AI-00 Architecture / Integration Lead: owns TASK-107 final plan, scope control, acceptance mapping, final gate synthesis, status update, and M1 closeout report.
- AI-01 TASK-107 Builder: only business-code writer for contracts, OpenAPI, controller, service, repository projection, and M1 E2E implementation.
- AI-02 Integration / PostgreSQL Gate Engineer: validates real PostgreSQL migration state, full-flow E2E evidence, audit/outbox/idempotency evidence, and required test gate.
- AI-03 Independent Reviewer: read-only review after implementation; checks no inference pollution, no scope creep, no duplicate API, no IAM rewrite, and no overdesigned infrastructure.
- AI-04 M2 Planner: creates only `reports/m2/M2_FIRST_GROWTH_VERTICAL_SLICE_PLAN.md` after TASK-107 gate; no M2 code.

Only AI-01 writes business code. AI-00 may write plan, reports, gate summaries, and status files. AI-02 and AI-03 provide validation/review evidence. AI-04 is planning-only.

## RISKS

- Current read permission is M1-minimal and audit-derived; it is acceptable for M1 but should be recorded as governance debt before pilot.
- OpenAPI currently has only a placeholder `200` response for `GetFamilyAggregate`; minimal schema sync is required.
- Service helper functions are currently private local functions in `family.service.ts`; implementation should keep the change small and avoid broad refactoring.
- Real PostgreSQL availability on `localhost:55433` is required for final gate.

## STOP CONDITIONS

Stop and report instead of coding around the issue if any of these occur:

- Existing permission helper cannot safely authorize reads without broadening access.
- OpenAPI requires a materially different aggregate shape than the canonical DTO plan.
- Implementing aggregate needs a database migration that changes core semantics.
- TASK-107 starts to require Growth, AI, Journey, scoring, or M2 code.
- Minor data policy requires additional approval beyond current M1 fields.

TASK-107_IMPLEMENTATION_STARTED: NO