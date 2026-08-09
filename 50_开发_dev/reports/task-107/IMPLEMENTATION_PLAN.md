# TASK-107 Family Core Integration Implementation Plan

status: PLANNING_ONLY
task: TASK-107_FAMILY_CORE_INTEGRATION
milestone: M1_FAMILY_CORE_RUNNING
date: 2026-08-09
depends_on: TASK-106 PASS
implementation_started: NO

## Boundary

This is a plan-only artifact created after TASK-106 PASS. No TASK-107 code, tests, aggregate endpoint, service method, migration, or OpenAPI change is implemented by this document.

TASK-107 may start only after explicit human authorization.

## Goal

Prove the M1 Family Core can run as a complete, auditable flow from an empty database:

```text
CreateFamily
-> AddParent
-> AddChild
-> CreateFamilyRelationship(PARENT_CHILD)
-> AssignLifeStage(EARLY_ADOLESCENCE_12_15)
-> GrantConsent(SERVICE)
-> GetFamilyAggregate
```

The task is an integration proof, not a license to add GrowthProfile, AI, Journey, Intervention, ranking, or scoring behavior.

## Required Reading Before Implementation

- `CLAUDE.md`
- `50_开发_dev/CLAUDE.md`
- `50_开发_dev/CURRENT_SPRINT.md`
- `50_开发_dev/PROJECT_STATUS.md`
- `50_开发_dev/backlog/tasks/TASK-107_FAMILY_CORE_INTEGRATION.md`
- Gate reports for TASK-101 through TASK-106
- Current Family controller/service/repository implementation
- Current OpenAPI Family Core contract
- Current DB migrations and test harness

## Scope

Implement the smallest integration slice required to satisfy TASK-107:

- A real PostgreSQL integration/E2E test that executes the full M1 flow.
- `GetFamilyAggregate` behavior if it does not already exist.
- Aggregate response containing Family Core state only: family, members, relationships, active LifeStage, and Consent summary.
- Audit/event/correlation/idempotency assertions across all write steps.
- Unauthorized read failure.
- Side-effect assertions proving no GrowthProfile, AI, Journey, or implicit derived state is created.
- Final report `reports/M1_FAMILY_CORE_REPORT.md`.

## Out Of Scope

- GrowthProfile implementation.
- GrowthState, Journey, Intervention, Recommendation, Agent Runtime, Model Gateway, Causal Platform, World Model, Family Total Score, family ranking.
- Consent withdrawal.
- Adult/self consent.
- Full IAM/RBAC replacement.
- M2 milestone transition; human gate owns milestone movement after TASK-107 report.

## Proposed HTTP Contract

If aggregate endpoint is missing, implement the approved read endpoint conservatively:

`GET /families/{familyId}`

Headers:

- `x-actor-id` required
- `x-correlation-id` optional
- `x-source` optional

Response should include only current M1 Family Core aggregate state:

- `family`
- `members.parents`
- `members.children`
- `relationships`
- `lifeStages.activeAssignments`
- `consents.activeSummary`

Error behavior:

- `400` invalid `familyId`
- `401` missing actor
- `403` actor has no family read/manage permission
- `404` family not found

## Aggregate Semantics

- Aggregate is a read model assembled from existing canonical tables; it must not create or mutate state.
- It must not infer LifeStage from `birth_date`.
- It must not infer Consent from relationship.
- It must not infer GrowthProfile from member or LifeStage data.
- It must not collapse purpose-specific consents into a broad all-purpose grant.
- Consent summary should be purpose-specific and include only active `GRANTED` rows unless the task explicitly requires history.

## Permission Plan

Use the current M1 permission model unless a task contract requires otherwise:

- Actor must be authenticated.
- Actor must have existing family manage/read permission derived from the existing M1 policy surface.
- Unauthorized read must be tested.

Do not introduce a broad new IAM subsystem in TASK-107.

## Idempotency And Correlation Plan

The full-flow test should prove idempotency on representative write actions without creating duplicates:

- Replaying CreateFamily with same idempotency key returns same family.
- Replaying GrantConsent with same `Idempotency-Key` returns same consent.
- At minimum, assert row counts for families, persons, relationships, life-stage assignments, active consents, audit logs, outbox events, and idempotency keys.

Correlation chain:

- Use one correlation id across the full flow.
- Assert every write action audit/event carries that correlation id.

## Test Plan

### Integration / E2E Flow

1. Start from clean real PostgreSQL test database.
2. CreateFamily.
3. AddParent with `account_id = actor`.
4. AddChild with optional `birth_date`.
5. CreateFamilyRelationship with `PARENT_CHILD`.
6. AssignLifeStage with `EARLY_ADOLESCENCE_12_15`.
7. GrantConsent for `SERVICE` with `Idempotency-Key` header.
8. GetFamilyAggregate.
9. Assert aggregate includes family, parent, child, relationship, active life stage, and `SERVICE` consent summary.
10. Assert all write steps have audit rows.
11. Assert all write steps have outbox events.
12. Assert correlation id is traceable across audit/outbox.
13. Replay representative idempotent writes and assert no duplicate data.
14. Attempt unauthorized aggregate read and expect failure.
15. Assert no `growth_profiles`, `growth_journeys`, `growth_events`, AI/model/recommendation side effects.

### Contract Validation

If OpenAPI is changed for aggregate response, update schemas and run:

```powershell
node tools/validate-contracts.mjs
```

### Full Gate

Run the established full gate after implementation:

```powershell
pnpm --filter @family/contracts build
pnpm --filter @family/api typecheck
pnpm --filter @family/api lint
pnpm --filter @family/api build
$env:TEST_DATABASE_URL='postgres://family:***@localhost:55433/family_gate'; pnpm --filter @family/api test:required
node tools/validate-contracts.mjs
```

## Expected Files To Change After Authorization

Implementation may touch:

- `packages/contracts/src/index.ts`
- `apps/api/src/modules/family/family.controller.ts`
- `apps/api/src/modules/family/family.service.ts`
- `apps/api/src/modules/family/family-core-integration.e2e-spec.ts` or equivalent
- `apps/api/src/modules/family/get-family-aggregate.e2e-spec.ts` or equivalent
- `specs/api/openapi-family-core-v0.1.yaml`
- `reports/M1_FAMILY_CORE_REPORT.md`
- `backlog/tasks/TASK-107_FAMILY_CORE_INTEGRATION.md`
- `PROJECT_STATUS.md`

Migration should not be needed unless an existing schema cannot represent the approved aggregate read safely.

## Acceptance Mapping

| AC | Planned Evidence |
|---|---|
| AC1 empty DB can complete full flow | One real PostgreSQL integration/E2E creates the full M1 chain from clean tables. |
| AC2 aggregate includes members, relationship, LifeStage, Consent summary | Aggregate response assertions cover all required sections. |
| AC3 every write step has Audit | Query `audit_logs` for all six write action names. |
| AC4 every write step has Domain Event | Query `outbox_events` for all six event names. |
| AC5 correlation chain traceable | Same correlation id appears in all relevant audit/outbox rows. |
| AC6 duplicate key requests do not duplicate data | Replay representative idempotent requests and assert stable row counts/responses. |
| AC7 unauthorized read fails | HTTP/integration test with unauthorized actor expects `403`. |
| AC8 no implicit GrowthProfile/AI/Journey side effects | Table count assertions remain zero for growth/journey/AI-adjacent state. |

## Risks

- If `GetFamilyAggregate` is absent, implementing it is the main TASK-107 code surface and should stay read-only.
- Existing M1 permission policy is audit-derived and minimal; TASK-107 should document this rather than replace it.
- Aggregate response must not become a hidden business inference layer.
- Consent summary must remain purpose-specific.

## Stop Condition

TASK-107_IMPLEMENTATION_STARTED: NO

This plan is complete. Stop here until TASK-107 is explicitly authorized.
