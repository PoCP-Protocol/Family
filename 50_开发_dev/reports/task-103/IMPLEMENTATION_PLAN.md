# TASK-103 AddChild Implementation Plan

status: PLANNING_ONLY
depends_on: TASK-102 PASS unless total architect authorizes different sequencing
reference_pattern: CreateFamily NAMED_ACTION_REFERENCE_PATTERN_V1

## Scope

Implement only `AddChild` Named Action after explicit authorization. Do not implement parent, relationship, life-stage assignment, growth profile, clinical labeling, ranking, or AI inference behavior.

## Domain

- Add a child member to an existing Family.
- Required fields from action contract: `family_id`, `display_name`, `idempotency_key`.
- Optional: `birth_date`.
- Forbidden: assign clinical label, infer growth profile.

## Action

- Add `AddChild` controller/service/repository slice following CreateFamily reference structure.
- Endpoint shape should align OpenAPI path: `POST /families/{familyId}/children`.

## API

- Path parameter: `familyId` UUID.
- Headers: `x-actor-id` required, `x-correlation-id` optional, `x-source` optional.
- Body: `display_name`, `idempotency_key`, optional `birth_date` as ISO date.
- Response should include created child/person DTO and family linkage.
- Error statuses: 400 invalid schema/date, 401 missing actor, 404 invalid family, 409 idempotency conflict/precondition where applicable.

## DB

- Verify existing `persons` support child rows with `person_type='CHILD'`, `display_name`, `birth_date` if present in schema.
- Use one transaction for family existence check, idempotency lock, child insert, audit insert, outbox insert, idempotency response update.
- No writes to `growth_profiles`, `growth_profile_dimensions`, `growth_journeys`, clinical labels, or inferred life-stage assignments.

## Event

- Emit `FamilyMemberAdded` outbox event.
- Required payload fields: `event_id`, `family_id`, `person_id`, `person_role`, `occurred_at`, `actor_id`, `correlation_id`.
- Use child role/person type consistently; if event contract lacks exact role enum for child, stop and clarify before coding.

## Audit

- Append audit action `AddChild` with family id, actor, correlation id, idempotency key, result, and response metadata.

## Idempotency

- Required by write-action policy even though action YAML omits an explicit idempotency block.
- Hash stable request payload including `family_id`, `display_name`, and normalized `birth_date`.
- Same key + same payload returns same logical response.
- Same key + different payload returns 409.

## Permission

- Minimum TASK-103 implementation may mirror CreateFamily actor presence check if no full permission engine exists.
- `actor_has_family_manage_permission` remains a named precondition and must be explicitly tested/stubbed or reported if not implementable.

## Precondition

- `family_exists` must be checked inside transaction before child creation.
- Invalid/nonexistent family must fail without side effects.

## Transaction

- Use CreateFamily `withTransaction` pattern.
- Add rollback test for invalid family/precondition failure.

## Tests

- Unit: DTO invalid schema, invalid `birth_date`, actor requirement.
- Integration: happy path, family not found, idempotency replay/conflict, audit/event, no growth profile/clinical label.
- E2E: `POST /families/{familyId}/children` happy path and key failures through HTTP.
- Required gate: `pnpm test:required` with `TEST_DATABASE_URL`.

## Files Ownership

- Likely new files: `add-child.dto.ts`, child/member service or action service, integration/e2e specs.
- Likely touched files: Family module registration, OpenAPI, contracts, testing reports, PROJECT_STATUS.

## Shared Files

- `apps/api/src/modules/family/family.module.ts`
- `packages/contracts/src/index.ts`
- `specs/api/openapi-family-core-v0.1.yaml`
- `PROJECT_STATUS.md`

## SHARED_FILE_CONFLICT_MATRIX

| File | TASK-103 | TASK-102 Conflict Risk | Rule |
|---|---|---:|---|
| `family.module.ts` | add providers/controllers | high | serialize edits or introduce shared member module first |
| `contracts/src/index.ts` | add child DTOs | high | split by exported types, review merge manually |
| `openapi-family-core-v0.1.yaml` | child endpoint schemas | high | one task at a time or pre-agree schema blocks |
| person/member repository | may overlap with parent insertion | high | prefer shared helper only after explicit approval |
| `PROJECT_STATUS.md` | task completion update | high | only current task updates |

## PARALLEL_BUILD

NO. TASK-103 overlaps with TASK-102 in module wiring, contracts, OpenAPI, event semantics, and person-table insertion patterns. Sequential execution is safer and matches current Sprint rules.