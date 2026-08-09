# M1 Wave 2 Shared File Conflict Matrix

status: PASS
scope: TASK-102_ADD_PARENT + TASK-103_ADD_CHILD
decision: PARALLEL_BUILD = NO

## AI-00 Gate Inputs

- Root rules: `/CLAUDE.md`
- Engineering constitution: `50_开发_dev/CLAUDE.md`
- Sprint state: `50_开发_dev/CURRENT_SPRINT.md`
- Project state: `50_开发_dev/PROJECT_STATUS.md`
- Plans: `reports/task-102/IMPLEMENTATION_PLAN.md`, `reports/task-103/IMPLEMENTATION_PLAN.md`
- Action specs: `specs/actions/AddParent.action.yaml`, `specs/actions/AddChild.action.yaml`
- Event spec: `specs/events/FamilyMemberAdded.event.yaml`
- Security gate: `security/MINOR_DATA_SOP.md`, `security/CONSENT_PERMISSION_MATRIX.csv`
- API/DB/code surfaces: OpenAPI, migrations, contracts, Family module implementation and required test harness

## Parallel Decision

`PARALLEL_BUILD = NO`.

TASK-102 and TASK-103 both need shared writes in the same high-risk files and semantics: Family controller/module wiring, shared contracts, OpenAPI components, person insertion, idempotency/audit/outbox helpers, `FamilyMemberAdded` event payload, and final project status. Running them in separate worktrees would create artificial merge pressure and higher copy-paste divergence risk. Execute sequentially in the current worktree: TASK-102 first, then TASK-103 using only stable shared infrastructure that appears twice.

## Permission Gate Decision

No full IAM or durable permission subsystem exists in the current Sprint scope. `actor_has_family_manage_permission` is nevertheless an approved precondition for both actions, and TASK-102/103 require explicit permission failure tests.

Wave 2 may implement an M1-only, replaceable `FamilyManagePermissionPolicy` that grants manage permission only to the actor recorded as the successful `CreateFamily` actor for that family. This is not `actor_id exists = permission`; it is a narrow provenance-based policy backed by existing audit facts and contained outside the controller. If later IAM/roles are introduced, this policy is the single replacement point.

## Minor Data Gate Decision

AddChild is limited to M0 basic identity facts: `display_name` and optional `birth_date`. It must not create consent, life-stage assignment, growth profile, growth journey, clinical label, AI personalization state, research/model-improvement permission, or relationship records.

## Conflict Matrix

| Surface | File / Area | Owner Mark | Reason | Rule |
|---|---|---|---|---|
| Family controller | `apps/api/src/modules/family/family.controller.ts` | SHARED_WRITE | AddParent and AddChild both add routes and actor context handling | Serialize edits; keep business rules out of controller |
| Family service | `apps/api/src/modules/family/family.service.ts` | SHARED_WRITE | Existing CreateFamily private helpers will become duplicated unless extracted | Extract only minimal stable helpers after second action pressure is clear |
| Family repository | `apps/api/src/modules/family/family.repository.ts` | SHARED_READ | Existing transaction boundary is reusable | Do not mix query methods into connection wrapper unless responsibility remains clean |
| Module registration | `apps/api/src/modules/family/family.module.ts` | SHARED_WRITE | Permission policy/shared member helpers may need provider registration | One serialized module edit |
| Contracts | `packages/contracts/src/index.ts` | SHARED_WRITE | Parent/Child DTOs and member response shapes are shared exports | Add both action contracts in one controlled block |
| OpenAPI | `specs/api/openapi-family-core-v0.1.yaml` | SHARED_WRITE | Parent/Child paths and schemas share components and error responses | Update both endpoints consistently after implementation shape is fixed |
| Test DB helpers | `apps/api/src/test/test-database.ts` | SHARED_READ | Existing cleanup already covers persons/consents/life/growth/outbox/audit/idempotency | Do not edit unless a test proves missing cleanup |
| DB schema | `database/migrations/0001_family_identity.sql` | SHARED_READ | `persons` already supports parent/child and constraints | No migration needed for Wave 2 |
| Platform schema | `database/migrations/0002_platform_foundation.sql` | SHARED_READ | audit/outbox/idempotency already support both actions | No migration needed |
| Growth schema | `database/migrations/0003_growth_foundation.sql` | SHARED_READ | Used only for negative no-scope-creep assertions | No writes permitted |
| Person handling | service/helper functions | SHARED_WRITE | Both actions insert into `persons` with different constraints | Prefer narrow insert helper with explicit `person_role` |
| Event handling | outbox payload | SHARED_WRITE | Both actions emit `FamilyMemberAdded` with `person_role` | One shared event helper; no ParentCreated/ChildCreated |
| Audit handling | audit insert | SHARED_WRITE | Both actions need action-specific audit with same metadata pattern | Shared audit helper allowed after Rule of Two |
| Idempotency | idempotency key lock/update | SHARED_WRITE | Same replay/conflict semantics across three actions | Extract action-parametrized helper; preserve CreateFamily behavior |
| Permission | M1 policy | INTEGRATION_ONLY | Both actions share `actor_has_family_manage_permission` | Encapsulate in replaceable provider; test 403 |
| TASK-102 DTO/tests | new AddParent files | TASK-102_ONLY | Parent role/account validation is task-specific | Keep parent-specific validation local |
| TASK-103 DTO/tests | new AddChild files | TASK-103_ONLY | Birth date/minor data/parent_role injection rules are task-specific | Keep child-specific validation local |
| Final reports/status | `reports/M1_WAVE2_GATE.md`, `PROJECT_STATUS.md` | INTEGRATION_ONLY | Only after both tasks and full gate pass | Do not update TASK-104 readiness before Wave 2 PASS |

## Execution Order

1. Implement shared, minimal action infrastructure only where it removes repeated CreateFamily/AddParent/AddChild mechanics.
2. Implement TASK-102 AddParent and validate focused tests.
3. Implement TASK-103 AddChild and validate focused tests.
4. Run Wave 2 full gate with real PostgreSQL.
5. Run independent review and update final report/status only if both actions pass.