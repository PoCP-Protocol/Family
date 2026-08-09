# TASK-104 CreateFamilyRelationship Implementation Plan

TASK: `TASK-104_CREATE_RELATIONSHIP`
ACTION: `CreateFamilyRelationship`
SCOPE: only implement relationship creation and minimum supporting code for M1 Family Core. Do not implement TASK-105/TASK-106 or any implicit Consent, LifeStage, GrowthProfile, GrowthPriority, Journey, Intervention, AI memory, or recommendation behavior.

## 1. HTTP Contract

- Route: `POST /families/{familyId}/relationships`.
- Required headers follow the current M1 pattern: `x-actor-id`; optional `x-correlation-id`, `x-source`.
- Request body follows existing approved write-action style: `person_a_id`, `person_b_id`, `relationship_type`, `idempotency_key`.
- `familyId` path parameter is copied into the service request as `family_id` after UUID validation.
- Response: `201` with `{ relationship: FamilyRelationshipDto }`.
- Controlled failures: `400 Invalid schema`, `401 actor_is_authenticated`, `403 actor_has_family_manage_permission`, `404 family_not_found/person_not_found`, `409 relationship_already_exists` or `Idempotency conflict`.

## 2. Domain Action

- Implement `CreateFamilyRelationship` as a Named Action in `FamilyService`.
- The action mutates only `family_relationships` and writes its required audit/outbox/idempotency records.
- It reuses the existing transaction/idempotency/audit/event pattern established by CreateFamily/AddParent/AddChild.

## 3. Relationship Invariants

- Both persons must exist.
- Both persons must belong to `family_id` from the route.
- `person_a_id != person_b_id`.
- `relationship_type` must be one of `PARENT_CHILD`, `SPOUSE`, `SIBLING`, `GUARDIAN_CHILD`, `OTHER`.
- `PARENT_CHILD` direction is strict: `person_a_id` must be `PARENT`, `person_b_id` must be `CHILD`; no automatic child-to-parent reversal.
- `GUARDIAN_CHILD` follows the same parent-to-child direction rule, but does not grant Consent or guardian processing permission.
- `SPOUSE` and `SIBLING` are symmetric: A-B and B-A are the same logical relationship.
- `OTHER` requires only same Family, existing members, non-self connection, and no duplicate logical relationship.

## 4. Permission

- Controller only extracts actor context.
- Service enforces `family_manage` by reusing the current `assertFamilyManagePermission(client, familyId, actorId)` behavior.
- Actor existence alone is not permission.
- Permission check runs inside the same transaction after family existence and before relationship insert.

## 5. Idempotency

- Use `idempotency_keys` with `action_name = CreateFamilyRelationship`.
- Request hash includes `family_id`, `person_a_id`, `person_b_id`, and `relationship_type`; it excludes `idempotency_key` and audit metadata.
- Same key + same hash replays the stored response without inserting duplicate relationship/audit/event.
- Same key + different hash returns `409 Idempotency conflict`.

## 6. Transaction Boundary

- One transaction covers idempotency lock, family/person/permission checks, duplicate checks, insert into `family_relationships`, audit insert, outbox insert, idempotency response storage, and commit.
- Normal domain failures are raised before commit as controlled HTTP exceptions.
- Race-sensitive duplicate protection is backed by DB uniqueness, not only SELECT-before-INSERT.

## 7. Event

- Emit `FamilyRelationshipCreated` to `outbox_events`.
- Required payload fields: `event_id`, `family_id`, `relationship_id`, `occurred_at`, `actor_id`, `correlation_id`, `metadata.source`, `metadata.schema_version`.
- Include the relationship DTO in payload for consumers, without adding derived consent/life-stage/growth state.

## 8. Audit

- Insert one `audit_logs` row on successful relationship creation.
- `action_name = CreateFamilyRelationship`.
- `resource_type = FamilyRelationship`.
- `resource_id = relationship_id`.
- Metadata includes `source`, `occurred_at`, and response snapshot, matching the existing Family service pattern.

## 9. Repository

- Keep the current repository abstraction: `FamilyRepository.withTransaction` owns begin/commit/rollback.
- Add service-local helper functions for finding persons, checking duplicates, inserting relationship, mapping relationship DTO, and inserting event.
- Do not introduce a new repository class unless duplication becomes material after TASK-104.

## 10. DB Constraints

- Existing DB already has `relationship_not_self` and unique directional index `(family_id, person_a_id, person_b_id, relationship_type)`.
- Add a minimal migration for symmetric logical uniqueness using a unique expression index for `SPOUSE` and `SIBLING` over `(family_id, least(person_a_id, person_b_id), greatest(person_a_id, person_b_id), relationship_type)`.
- Keep directional uniqueness for `PARENT_CHILD`, `GUARDIAN_CHILD`, and `OTHER`.
- Same-Family invariant remains enforced in service because PostgreSQL cannot express this cross-row family match with a simple FK from the current schema without larger model changes.

## 11. Tests

- DTO/unit tests: valid `PARENT_CHILD`, self relationship rejected, invalid relationship type rejected, child-to-parent `PARENT_CHILD` rejected through service/domain test, valid `SPOUSE`, reverse duplicate `SPOUSE` rejected, valid `SIBLING`, reverse duplicate `SIBLING` rejected, valid `OTHER` same-family pair.
- Integration tests on real PostgreSQL: missing family, missing person A/B, cross-family rejected, permission denied, audit/event written, idempotency replay, idempotency conflict, DB-backed symmetric duplicate protection, no Consent side effect, no Growth/LifeStage side effect.
- HTTP E2E tests: route success, schema invalid, actor missing, permission denied, cross-family rejected, idempotency replay/conflict, no side effects.
- Aggregate validation will be included only if existing `GET /families/{familyId}` aggregate exists or is already in TASK-104 scope; otherwise it is recorded as a TASK-107 dependency and not implemented here.

## 12. Shared File Changes

- `packages/contracts/src/index.ts`: add `FamilyRelationshipDto`, `CreateFamilyRelationshipRequest`, `CreateFamilyRelationshipResponse`.
- `apps/api/src/modules/family/create-family-relationship.dto.ts`: new validator.
- `apps/api/src/modules/family/family.controller.ts`: add `POST :familyId/relationships` method.
- `apps/api/src/modules/family/family.service.ts`: add action implementation and local helpers.
- `specs/api/openapi-family-core-v0.1.yaml`: expand relationship request/response schemas and route errors.
- Tests under `apps/api/src/modules/family/` for DTO, integration, and E2E.
- Migration file under `database/migrations/` for symmetric uniqueness.

## 13. Migration Decision

- Yes, a minimal migration is required.
- Reason: TASK-104 requires `SPOUSE` and `SIBLING` reverse duplicates to be impossible under race conditions. Current schema only prevents exact directional duplicates, so B-A can slip through unless the service serializes broadly or the DB owns the invariant.
- Proposed migration is additive and non-destructive.

## 14. Risks

- OpenAPI currently lists the relationship path only as a placeholder; implementation must harden it without breaking existing CreateFamily/AddParent/AddChild contracts.
- Same-Family enforcement remains service-level in this task; future schema hardening may require a larger composite-FK design.
- Existing permission model is intentionally minimal and tied to CreateFamily audit success; TASK-104 will reuse it rather than invent membership/role policy.
- `GET /families/{familyId}` aggregate appears in Sprint DoD but may not yet be implemented. TASK-104 will not expand into aggregate implementation unless an existing aggregate endpoint is already present and only needs relationship inclusion.