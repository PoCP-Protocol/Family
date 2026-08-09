# TASK-105 AssignLifeStage Implementation Plan

TASK: `TASK-105_ASSIGN_LIFE_STAGE`
ACTION: `AssignLifeStage`
SCOPE: planning only. Do not implement TASK-105 code until explicitly authorized after TASK-104 closeout.

## 1. Boundary Principle

- `FACT: birth_date != ACTION: AssignLifeStage`.
- A child's stored `birth_date` may be a fact, but it must not silently create, infer, update, or replace a LifeStage assignment.
- `AssignLifeStage` is the only approved state mutation for life-stage assignment in this slice.
- AI, recommendation logic, date math, and implicit age-band inference cannot create LifeStage state.

## 2. HTTP Contract

- Proposed route: `POST /families/{familyId}/children/{childId}/life-stage-assignments`.
- Required header: `x-actor-id`.
- Optional headers: `x-correlation-id`, `x-source`.
- Request body: `life_stage_code`, `effective_from`, `idempotency_key`.
- Only allowed `life_stage_code` in V1: `EARLY_ADOLESCENCE_12_15`.
- Response: `201` with `{ assignment }` using the ontology fields from `life_stage.schema.yaml`.

## 3. Domain Preconditions

- Family must exist.
- Actor must have family manage permission using the current service permission model.
- Child must exist in the route family.
- Child must have `person_type = CHILD`.
- `life_stage_code` must be one of the explicit approved values in `AssignLifeStage.action.yaml`.
- `effective_from` must be a valid date-time.

## 4. State Mutation

- Close any prior active assignment for the same family and child by setting `effective_to`.
- Insert a new active assignment with `effective_to = null`.
- Do not create new LifeStage codes.
- Do not mutate child demographics, relationships, consent, growth profile, recommendations, journey, or intervention state.

## 5. Idempotency

- Use `idempotency_keys` with `action_name = AssignLifeStage`.
- Request hash includes `family_id`, `child_id`, `life_stage_code`, and `effective_from`.
- Same key + same hash replays stored response.
- Same key + different hash returns conflict.
- Replay must not close/reopen assignments or duplicate audit/event rows.

## 6. Transaction Boundary

- One PostgreSQL transaction covers idempotency lock, family/child/permission checks, previous active assignment closure, new assignment insert, audit, outbox event, idempotency response storage, and commit.
- Domain failures roll back the whole mutation.

## 7. Audit And Event

- Audit action: `AssignLifeStage`.
- Resource type: `LifeStageAssignment`.
- Event name: `LifeStageAssigned`.
- Event payload should include `event_id`, `family_id`, `child_id`, `assignment_id`, `life_stage_code`, `effective_from`, `effective_to`, `actor_id`, `correlation_id`, and `metadata.schema_version`.

## 8. Repository And Schema Work

- Check whether `life_stage_assignments` already exists before implementation.
- If missing, add the minimal migration required by `life_stage.schema.yaml` and action contract.
- Add a DB guard for at most one active assignment per family/child if feasible with a partial unique index on `effective_to IS NULL`.
- Keep service-level checks for child membership and approved codes.

## 9. Tests

- DTO/unit tests: valid request, invalid UUIDs, invalid `life_stage_code`, invalid date-time, unknown fields rejected.
- Integration tests on real PostgreSQL: success, child not found, child belongs to another family, actor unauthorized, prior active assignment closed, idempotency replay, idempotency conflict, audit/event assertion.
- E2E tests: success, invalid schema, missing actor, unauthorized, cross-family child, idempotency replay/conflict.
- Side-effect tests: AddChild with `birth_date` does not create LifeStage; AssignLifeStage does not create consent, relationship, growth profile, journey, recommendation, or intervention records.

## 10. Out Of Scope

- Automatic age calculation.
- Full 0-18 LifeStage coverage.
- AI-derived LifeStage selection.
- Consent grants.
- Family aggregate endpoint implementation unless TASK-107 owns it.
- GrowthProfile, GrowthPriority, Journey, Intervention, World Model, ranking, or scoring.

## 11. Acceptance Mapping

| AC | Planned Check |
|---|---|
| AC1 only `EARLY_ADOLESCENCE_12_15` supported in V1 | DTO/service reject every other value. |
| AC2 child must belong to Family | Service checks child row by `family_id` and `person_type = CHILD`. |
| AC3 prior active assignment is closed/versioned | Integration asserts old row gets `effective_to` and new row is active. |
| AC4 event/audit exist | Integration/E2E assert `audit_logs` and `outbox_events`. |
| AC5 AI cannot invent new LifeStage | No AI path; enum allowlist and tests reject unknown codes. |

## 12. Stop Condition

This document is preparation only. No TASK-105 implementation has been started.
