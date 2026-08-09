# TASK-103 AddChild Gate Report

status: PASS
as_of: 2026-08-09
task: TASK-103_ADD_CHILD
action: AddChild
reference_pattern: CreateFamily NAMED_ACTION_REFERENCE_PATTERN_V1

## Scope

Implemented only the approved `AddChild` Named Action and the minimum shared action support already needed by CreateFamily/AddParent/AddChild: DTO validation, controller route, transactional service path, idempotency, audit, and outbox event.

No relationship, life-stage assignment, consent, growth profile, clinical label, ranking, or AI inference behavior was implemented.

## Implementation Summary

| Area | Result |
|---|---|
| API route | `POST /families/{familyId}/children` |
| Request validation | `familyId`, `display_name`, optional `birth_date`, and `idempotency_key`; unknown fields rejected |
| Actor context | Requires `x-actor-id`; carries `x-correlation-id` and `x-source` into service metadata |
| Transaction | One PostgreSQL transaction covers idempotency lock, family/permission preconditions, child insert, audit, event, and idempotency response update |
| Idempotency | Same key + same request replays response; same key + different request returns conflict |
| Audit | Writes `audit_logs.action_name = AddChild` with actor, correlation id, idempotency key, resource id, and response metadata |
| Domain event | Writes `outbox_events.event_name = FamilyMemberAdded` with `person_role = CHILD` |
| Date-only handling | `birth_date` is serialized as a stable date-only value without timezone day shift |
| Out-of-scope guard | Tests assert no consent, relationship, life-stage, growth profile, growth journey, or growth event side effects |

## Acceptance Criteria

| AC | Result | Evidence |
|---|---|---|
| AC1 child is linked to Family | PASS | Integration/E2E assert child `family_id`, `person_type = CHILD`, and DB `persons` row |
| AC2 birth_date is optional and validated | PASS | Unit rejects invalid date; integration/e2e cover provided and missing `birth_date` |
| AC3 unauthorized actor fails | PASS | Integration/E2E reject non-creator actor with no child row |
| AC4 event/audit exist | PASS | Integration/E2E assert `audit_logs` and `outbox_events` side effects |
| AC5 no clinical/growth label is inferred | PASS | Integration/E2E assert no growth/life-stage/relationship/consent side effects |

## Validation

Commands run:

```powershell
$env:TEST_DATABASE_URL='postgres://family:***@localhost:55433/family_gate'
pnpm --filter @family/api test:required
pnpm --filter @family/api typecheck
pnpm --filter @family/api lint
pnpm --filter @family/api build
pnpm --filter @family/contracts build
```

Results:

- `pnpm --filter @family/api test:required`: PASS after DB spec serialization; unit 11/11, integration 10/10, e2e 18/18.
- `pnpm --filter @family/api typecheck`: PASS.
- `pnpm --filter @family/api lint`: PASS.
- `pnpm --filter @family/api build`: PASS.
- `pnpm --filter @family/contracts build`: PASS.

## Fix During Gate

The first aggregate `test:required` run failed because multiple integration spec files ran concurrently against the same isolated PostgreSQL database and shared cleanup function. Failures showed cross-file row counts and FK cleanup interference, not AddChild business logic failure.

Fix: `vitest.integration.config.ts` and `vitest.e2e.config.ts` now set `fileParallelism: false`, matching the shared database fixture boundary. The same required gate then passed.

## Files Changed For TASK-103 Slice

- `apps/api/src/modules/family/add-child.dto.ts`
- `apps/api/src/modules/family/add-child.dto.spec.ts`
- `apps/api/src/modules/family/add-child.integration.spec.ts`
- `apps/api/src/modules/family/add-child.e2e-spec.ts`
- `apps/api/src/modules/family/family.controller.ts`
- `apps/api/src/modules/family/family.service.ts`
- `apps/api/vitest.integration.config.ts`
- `apps/api/vitest.e2e.config.ts`
- `packages/contracts/src/index.ts`
- `backlog/tasks/TASK-103_ADD_CHILD.md`
- `PROJECT_STATUS.md`

## Decision

TASK-103 is complete. Stop after this task; do not begin TASK-104 or any adjacent Family Core action without explicit authorization.