# TASK-106 GrantConsent Gate Report

status: PASS
as_of: 2026-08-09
task: TASK-106_GRANT_CONSENT
action: GrantConsent
reference_pattern: CreateFamily NAMED_ACTION_REFERENCE_PATTERN_V1
ready_for_task_107: YES
task_107_implementation_started: NO

## Scope

Implemented only the approved `GrantConsent` Named Action and minimum supporting code required for the Family Core write path: shared contracts, DTO validation, controller route, transactional service logic, audit, outbox event, idempotency, OpenAPI contract, real PostgreSQL integration tests, and HTTP E2E tests.

No TASK-107 aggregate implementation, WithdrawConsent, Consent Center, GrowthProfile, Journey, Intervention, AI inference, model training, recommendation, Family Total Score, or family ranking behavior was added.

## Gate Checklist

| Gate | Result | Evidence |
|---|---|---|
| ACTION_CONTRACT | PASS | `GrantConsent` implemented as a Named Action with schema validation, actor context, permission, idempotency, audit, and outbox. |
| ONTOLOGY | PASS | Purpose enum is restricted to `SERVICE`, `ASSESSMENT`, `AI_PERSONALIZATION`, `GROWTH_TRACKING`, `EXPERT_SERVICE`, `RESEARCH`, `MODEL_IMPROVEMENT`, `CONTENT_PUBLICATION`; status uses `GRANTED` / `EXPIRED` history semantics. |
| CHILD_ONLY_V1 | PASS | Subject must be a `CHILD`; parent/adult/self-consent is rejected in this task. |
| GUARDIAN_AUTHORIZATION | PASS | Guardian must be same-family `PARENT` with directed `PARENT_CHILD` or `GUARDIAN_CHILD` relationship to the child. |
| ACTOR_AUTHORIZATION | PASS | Actor must pass family manage permission and must match `guardian.account_id`; missing/mismatched guardian binding is rejected. |
| RELATIONSHIP_NOT_CONSENT | PASS | `PARENT_CHILD` / `GUARDIAN_CHILD` relationship creation alone does not create consent rows or grant broad processing authority. |
| PURPOSE_ISOLATION | PASS | A grant for one purpose creates exactly one purpose-specific consent; `SERVICE` does not create `MODEL_IMPROVEMENT`, and `RESEARCH` does not create `CONTENT_PUBLICATION`. |
| POLICY_VERSION | PASS | `policyVersion` is mandatory, bounded by DB length, written to consent, response, audit/event metadata, and idempotency response. |
| CONSENT_HISTORY | PASS | Same subject/purpose/new policy version expires prior active `GRANTED` consent and inserts a new `GRANTED` row; history is retained. |
| PERMISSION | PASS | Existing M1 family manage permission is enforced before consent mutation. |
| IDEMPOTENCY | PASS | Same `Idempotency-Key` + same request replays response; same key + different request returns conflict without partial writes. |
| TRANSACTION | PASS | Idempotency lock, preconditions, consent update/insert, audit, outbox, and idempotency response storage run inside one PostgreSQL transaction. |
| AUDIT | PASS | Success writes `audit_logs.action_name = GrantConsent`. |
| OUTBOX | PASS | Success writes `outbox_events.event_name = ConsentGranted`. |
| REAL_PG | PASS | Integration and E2E tests ran against real PostgreSQL via `TEST_DATABASE_URL=postgres://family:***@localhost:55433/family_gate`. |
| HTTP_E2E | PASS | HTTP E2E covers success, validation, authorization, purpose isolation, idempotency, and policy-version history. |
| NO_AI_SIDE_EFFECT | PASS | No AI personalization state, agent memory, model training job, recommendation, research dataset, score, or ranking side effect is created. |
| NO_GROWTH_SIDE_EFFECT | PASS | Tests assert no LifeStage, GrowthProfile, Journey, GrowthEvent, or related growth state side effects. |
| INDEPENDENT_REVIEW | PASS_WITH_MANUAL_REVIEW | Read-only CodeReviewer subagent invocation failed with `Response contained no choices`; manual closeout review checked the implemented consent path for implicit consent, purpose inheritance, guardian shortcut, actor spoofing, permission bypass, policy overwrite, history deletion, side effects, transaction split, and TASK-107 implementation. No blocker found. |
| BLOCKERS | NONE | No TASK-106 blocker remains. |

## Implementation Summary

| Area | Result |
|---|---|
| API route | `POST /families/{familyId}/consents` |
| Idempotency carrier | `Idempotency-Key` header, mapped to service `idempotency_key` |
| Request body | `subjectPersonId`, `guardianPersonId`, `purpose`, `policyVersion` |
| Response | `201` with `{ consent }` |
| Shared contracts | `ConsentPurpose`, `ConsentStatus`, `ConsentDto`, `GrantConsentRequest`, `GrantConsentResponse` |
| DB migration | Added `0005_consent_active_uniqueness.sql` partial unique index for one active `GRANTED` consent per family/subject/purpose |
| Event | `ConsentGranted` outbox event |
| Out-of-scope guard | No TASK-107 aggregate endpoint or adjacent business behavior implemented |

## Acceptance Criteria

| AC | Result | Evidence |
|---|---|---|
| AC1 subject and guardian belong to same Family | PASS | Integration/E2E reject cross-family and missing person cases. |
| AC2 guardian authorization validated | PASS | Directed `PARENT_CHILD` and `GUARDIAN_CHILD` authorize; absent/wrong direction/invalid subject or guardian role rejects. |
| AC3 purpose-specific record is created | PASS | Integration/E2E assert exact consent purpose and no unrelated purpose rows. |
| AC4 `SERVICE` does not create `MODEL_IMPROVEMENT` consent | PASS | Purpose isolation tests assert only requested purpose is inserted. |
| AC5 event/audit exist | PASS | Integration/E2E assert `GrantConsent` audit and `ConsentGranted` outbox event. |
| AC6 `policy_version` mandatory | PASS | DTO/unit and HTTP validation reject missing/blank `policyVersion`; policy version history is verified. |

## Validation

Focused commands passed:

```powershell
pnpm --filter @family/api test:unit -- grant-consent.dto.spec.ts
$env:TEST_DATABASE_URL='postgres://family:***@localhost:55433/family_gate'; pnpm --filter @family/api test:integration -- grant-consent.integration.spec.ts
$env:TEST_DATABASE_URL='postgres://family:***@localhost:55433/family_gate'; pnpm --filter @family/api test:e2e -- grant-consent.e2e-spec.ts
```

Focused results:

- DTO unit: PASS, 6/6.
- GrantConsent integration: PASS, 6/6.
- GrantConsent HTTP E2E: PASS, 5/5.

Full gate commands passed:

```powershell
node tools/validate-contracts.mjs
pnpm lint
pnpm typecheck
pnpm build
$env:TEST_DATABASE_URL='postgres://family:***@localhost:55433/family_gate'; pnpm test:required
```

Full gate results:

- API unit: PASS, 8 files / 25 tests.
- API integration: PASS, 6 files / 29 tests.
- API E2E: PASS, 6 files / 35 tests.
- Contract validation: PASS, total 49, failed 0.
- Lint: PASS, 2 successful tasks.
- Typecheck: PASS, 3 successful tasks.
- Build: PASS, 2 successful tasks.
- Required tests: PASS, 3 successful tasks.

## Gate Fixes During Closeout

- Real PostgreSQL initially rejected consent insert because `consents.granted_at` is `NOT NULL` and has no default. `GrantConsent` now inserts `granted_at = now()` explicitly.
- Consent history integration assertion was changed to order-insensitive matching after PostgreSQL row ordering produced a false test failure.
- A minimal DB-level active-consent uniqueness guard was added to prevent concurrent duplicate active `GRANTED` rows.

## Files Changed For TASK-106 Slice

- `packages/contracts/src/index.ts`
- `apps/api/src/modules/family/grant-consent.dto.ts`
- `apps/api/src/modules/family/grant-consent.dto.spec.ts`
- `apps/api/src/modules/family/grant-consent.integration.spec.ts`
- `apps/api/src/modules/family/grant-consent.e2e-spec.ts`
- `apps/api/src/modules/family/family.controller.ts`
- `apps/api/src/modules/family/family.service.ts`
- `database/migrations/0005_consent_active_uniqueness.sql`
- `specs/api/openapi-family-core-v0.1.yaml`
- `reports/task-106/IMPLEMENTATION_PLAN_FINAL.md`
- `reports/TASK-106_GRANT_CONSENT_GATE.md`
- `reports/task-107/IMPLEMENTATION_PLAN.md` plan only
- `backlog/tasks/TASK-106_GRANT_CONSENT.md`
- `PROJECT_STATUS.md`

## Known Constraints

- Actor-to-guardian binding uses M1 `persons.account_id === x-actor-id`; this is intentionally minimal and should be replaced by a durable identity/role policy in later milestones.
- WithdrawConsent remains deferred and must be implemented before pilot consent lifecycle completion.
- Consent does not grant read access, role membership, AI execution, research processing, or model training by itself.
- Family aggregate read behavior remains TASK-107 scope and has not been implemented here.

## Decision

TASK-106 is complete and PASS.

READY_FOR_TASK_107 = YES, but TASK-107 implementation has not started and must not begin without explicit authorization.
