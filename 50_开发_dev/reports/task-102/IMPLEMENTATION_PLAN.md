# TASK-102 AddParent Implementation Plan

status: PLANNING_ONLY
depends_on: TASK-101H PASS
reference_pattern: CreateFamily NAMED_ACTION_REFERENCE_PATTERN_V1

## Scope

Implement only `AddParent` Named Action after explicit authorization. Do not implement child, relationship, life-stage, consent, growth profile, ranking, or AI inference behavior.

## Domain

- Add a parent/guardian member to an existing Family.
- Required fields from action contract: `family_id`, `role`, `display_name`, `idempotency_key`.
- Allowed roles from ontology: `MOTHER`, `FATHER`, `GUARDIAN`, `OTHER_GUARDIAN`.
- Forbidden: infer parent growth profile.

## Action

- Add `AddParent` controller/service/repository slice under Family module or adjacent member module.
- Follow CreateFamily reference structure: DTO validator, service transaction, repository boundary, audit, outbox, idempotency.
- Endpoint shape should align OpenAPI path: `POST /families/{familyId}/parents`.

## API

- Path parameter: `familyId` UUID.
- Headers: `x-actor-id` required, `x-correlation-id` optional, `x-source` optional.
- Body: `role`, `display_name`, `idempotency_key`, optional `account_id` only if contract is confirmed before coding.
- Response should include created parent/person DTO and family linkage.
- Error statuses: 400 invalid schema, 401 missing actor, 404 invalid family, 409 idempotency conflict/precondition where applicable.

## DB

- Verify existing tables: `families`, `persons` support parent rows with `person_type='PARENT'`, `role`, `display_name`, `account_id`.
- Use one transaction for family existence check, idempotency lock, person insert, audit insert, outbox insert, idempotency response update.
- No writes to `growth_profiles`, `growth_profile_dimensions`, `growth_journeys`.

## Event

- Emit `FamilyMemberAdded` outbox event.
- Required payload fields: `event_id`, `family_id`, `person_id`, `person_role`, `occurred_at`, `actor_id`, `correlation_id`.
- Metadata must include `source`, `schema_version`.

## Audit

- Append audit action `AddParent` with family id, actor, correlation id, idempotency key, result, and response metadata.

## Idempotency

- Required.
- Hash stable request payload including `family_id`, `role`, `display_name`, and optional `account_id` if used.
- Same key + same payload returns same logical response.
- Same key + different payload returns 409.

## Permission

- Minimum TASK-102 implementation may mirror CreateFamily actor presence check if no full permission engine exists.
- `actor_has_family_manage_permission` remains a named precondition and must be explicitly tested/stubbed or reported if not implementable.

## Precondition

- `family_exists` must be checked inside transaction before person creation.
- Invalid/nonexistent family must fail without side effects.

## Transaction

- Use CreateFamily `withTransaction` pattern.
- Add rollback test for invalid family/precondition failure.

## Tests

- Unit: DTO invalid schema, role enum, actor requirement.
- Integration: happy path, family not found, idempotency replay/conflict, audit/event, no growth profile.
- E2E: `POST /families/{familyId}/parents` happy path and key failures through HTTP.
- Required gate: `pnpm test:required` with `TEST_DATABASE_URL`.

## Files Ownership

- Likely new files: `add-parent.dto.ts`, `parent.service.ts` or family member service, integration/e2e specs.
- Likely touched files: Family module registration, OpenAPI, contracts, testing reports, PROJECT_STATUS.

## Shared Files

- `apps/api/src/modules/family/family.module.ts`
- `packages/contracts/src/index.ts`
- `specs/api/openapi-family-core-v0.1.yaml`
- `PROJECT_STATUS.md`

## SHARED_FILE_CONFLICT_MATRIX

| File | TASK-102 | TASK-103 Conflict Risk | Rule |
|---|---|---:|---|
| `family.module.ts` | add providers/controllers | high | serialize edits or introduce shared member module first |
| `contracts/src/index.ts` | add parent DTOs | high | split by exported types, review merge manually |
| `openapi-family-core-v0.1.yaml` | parent endpoint schemas | high | one task at a time or pre-agree schema blocks |
| `family.repository.ts` | may reuse transaction only | medium | avoid changing shared semantics |
| `PROJECT_STATUS.md` | task completion update | high | only current task updates |

## PARALLEL_BUILD

NO. TASK-102 and TASK-103 both touch shared Family module, contracts, OpenAPI, event shape, and person table semantics. Execute sequentially unless a shared member abstraction task is explicitly approved first.