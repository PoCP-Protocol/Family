# TASK-106 GrantConsent Final Implementation Plan

status: FINAL_PLAN_READY
task: TASK-106_GRANT_CONSENT
milestone: M1_FAMILY_CORE_RUNNING
date: 2026-08-09
implementation_started: NO

## TASK

Implement the `GrantConsent` Named Action for V1 child consent:

`Guardian(PARENT) grants purpose-specific consent for Child under explicit policy_version`.

This task must not implement Adult Self Consent, WithdrawConsent, Consent UI Center, Consent Expiration Scheduler, GrowthProfile, AI Agent, Family Aggregate, or Research Pipeline.

## UNDERSTANDING

The action must preserve the existing Named Action Reference Pattern:

HTTP -> DTO Validation -> Actor Context -> Permission -> Guardian Authorization Policy -> Consent Preconditions -> Idempotency -> Transaction -> Repository -> Audit -> Outbox -> Commit -> HTTP Response.

Consent is Processing Purpose Authorization only. It is not read access permission, role assignment, AI enablement, training approval execution, or family membership mutation.

## FILES READ

- `CLAUDE.md`
- `50_开发_dev/CLAUDE.md`
- `50_开发_dev/PROJECT_STATUS.md`
- `50_开发_dev/CURRENT_SPRINT.md`
- `50_开发_dev/backlog/tasks/TASK-106_GRANT_CONSENT.md`
- `50_开发_dev/specs/actions/GrantConsent.action.yaml`
- `50_开发_dev/specs/ontology/consent.schema.yaml`
- `50_开发_dev/specs/ontology/parent.schema.yaml`
- `50_开发_dev/specs/ontology/child.schema.yaml`
- `50_开发_dev/specs/ontology/family_relationship.schema.yaml`
- `50_开发_dev/specs/events/ConsentGranted.event.yaml`
- `50_开发_dev/specs/policies/consent.policy.yaml`
- `50_开发_dev/specs/policies/core-state-write.policy.yaml`
- `50_开发_dev/security/CONSENT_PERMISSION_MATRIX.csv`
- `50_开发_dev/security/MINOR_DATA_SOP.md`
- Current Family permission implementation: `assertFamilyManagePermission` in Family service
- Current Relationship implementation and tests
- Current OpenAPI Consent placeholder
- Database `consents` table in migration `0001_family_identity.sql`
- CreateFamily/AddParent/AddChild/CreateRelationship/AssignLifeStage implementations and test harness

## AI ROLE EXECUTION MAP

- AI-00 Consent Architecture / Integration Lead: owns this final plan, contract alignment decisions, actor binding policy, DB invariant decision, final gate synthesis.
- AI-01 TASK-106 Builder: only business-code writer for GrantConsent implementation.
- AI-02 Consent Policy & Security Test Engineer: writes policy/security-focused DTO, integration, and E2E validation where needed.
- AI-03 Independent Reviewer: read-only review after implementation; searches for bypasses, implicit consent, side effects, history loss, and error leakage.
- AI-04 TASK-107 Family Aggregate Planner: writes only `reports/task-107/IMPLEMENTATION_PLAN.md`; no TASK-107 code.

## REQUIRED DESIGN ANSWERS

### 1. Consent Subject

V1 subject is strictly a `persons` row with `person_type = 'CHILD'` and `family_id = request.family_id`.

`subjectPersonId` maps to service request field `subject_person_id`. Parent/self/adult consent is rejected in this task.

### 2. Guardian Definition

Guardian is strictly a `persons` row with `person_type = 'PARENT'`, `family_id = request.family_id`, and a valid guardian-to-child eligibility relationship.

Parent role may be `MOTHER`, `FATHER`, `GUARDIAN`, or `OTHER_GUARDIAN`; the authorization decision is based on person type plus relationship, not role label alone.

### 3. Actor Definition

Actor comes from `x-actor-id`, with `x-correlation-id` and `x-source` forming existing `AuditMeta`.

Actor must have M1 `family_manage / consent_manage` equivalent capability. Current code implements family write permission by prior successful `CreateFamily` audit for the actor. TASK-106 will reuse that minimal M1 permission gate and add guardian representation binding.

ACTOR_GUARDIAN_BINDING_GAP:
Current schema has `persons.account_id`, but AddParent does not require it and there is no separate account/person identity service. Minimum M1 policy: `GrantConsent` requires `guardian.account_id` to be non-empty and equal to `meta.actor`; otherwise reject with 403. This prevents treating mere actor presence as guardian authority.

### 4. Guardian Authorization Policy

Create an independent application policy boundary named `GuardianAuthorizationPolicy` in the Family module implementation surface.

Input:

- `family_id`
- `guardian_person_id`
- `subject_person_id`

Output:

- `AUTHORIZED`
- `NOT_AUTHORIZED`

V1 authorization requires all of:

- guardian and subject exist in same family
- guardian `person_type = 'PARENT'`
- subject `person_type = 'CHILD'`
- relationship exists with `person_a_id = guardian_person_id`, `person_b_id = subject_person_id`, and `relationship_type in ('PARENT_CHILD', 'GUARDIAN_CHILD')`

Wrong direction does not authorize.

### 5. Purpose Model

Allowed purpose enum is exactly:

- `SERVICE`
- `ASSESSMENT`
- `AI_PERSONALIZATION`
- `GROWTH_TRACKING`
- `EXPERT_SERVICE`
- `RESEARCH`
- `MODEL_IMPROVEMENT`
- `CONTENT_PUBLICATION`

No `GENERAL`, `ALL`, `FULL`, or `DEFAULT` consent is allowed.

### 6. Policy Version Model

`policy_version` is required, non-empty, max 64 characters to match DB `varchar(64)`, and must be written to consent, audit metadata, idempotency response, and event payload.

Server will not silently generate a default policy version.

### 7. Duplicate Grant Semantics

Case A: same idempotency key plus same payload replays same logical response.

Case B: new idempotency key plus same subject, purpose, and policy version with existing active `GRANTED` returns 409 business conflict `consent_already_granted` and inserts no new consent.

Case C: same idempotency key plus different payload returns 409 `Idempotency conflict`.

### 8. Re-consent Semantics

Same subject and purpose with a different `policy_version` is allowed.

Within one transaction, old active `GRANTED` consents for that subject/purpose are updated to `EXPIRED`; a new `GRANTED` consent row is inserted. Old rows are never deleted.

### 9. Transaction

Use the existing repository `withTransaction` boundary.

Successful grant writes in one transaction:

- `idempotency_keys`
- optional `consents` update from `GRANTED` to `EXPIRED` for new policy version
- new `consents` row with `GRANTED`
- `audit_logs`
- `outbox_events`
- idempotency response body

Rollback must leave no partial consent, audit, event, or idempotency response.

### 10. Permission

Permission is two-layered:

- Actor must pass existing family write permission (`assertFamilyManagePermission`) as M1 `family_manage / consent_manage` equivalent.
- Actor must represent the guardian: `guardian.account_id === meta.actor`.

Guardian relationship eligibility is not permission and is evaluated separately by `GuardianAuthorizationPolicy`.

### 11. Event

Emit `ConsentGranted` to `outbox_events` with core required fields:

- `event_id`
- `family_id`
- `consent_id`
- `purpose`
- `occurred_at`
- `actor_id`
- `correlation_id`
- `metadata.source`
- `metadata.schema_version`

Payload will also include optional implementation metadata: `subject_person_id`, `guardian_person_id`, and `policy_version`.

### 12. Audit

Audit `action_name = 'GrantConsent'`, `resource_type = 'Consent'`, resource id = `consent_id`.

Audit metadata must answer: actor, family, child subject, guardian, purpose, policy_version, when, correlation_id, result. It must not store high-sensitive raw child content.

### 13. Idempotency

Use existing `idempotency_keys` table and lock pattern.

Request hash includes: `family_id`, `subject_person_id`, `guardian_person_id`, `purpose`, and `policy_version`.

Replay returns stored response body. Hash mismatch returns 409.

### 14. API

Implement:

`POST /families/{familyId}/consents`

Headers:

- `x-actor-id`
- `x-correlation-id`
- `x-source`

Body:

- `subjectPersonId`
- `guardianPersonId`
- `purpose`
- `policyVersion`

Idempotency key is read from the `Idempotency-Key` header for TASK-106, then mapped to service field `idempotency_key` to reuse the existing idempotency repository pattern.

Response:

- `201` with `{ consent }`

DTO is not DB entity; wire fields are camelCase while service/domain and DB use snake_case.

TASK106_CONTRACT_ALIGNMENT:
Current OpenAPI has only a placeholder response for `/families/{familyId}/consents`. This task will align OpenAPI by adding request/response schemas, explicit V1 child/guardian description, idempotency header/body contract as currently used by this codebase, and 400/403/404/409 errors.

### 15. DB Changes

Existing `consents` table and `consent_purpose` / `consent_status` enums cover TASK-106 fields.

No migration is planned initially. Application logic will enforce active consent uniqueness and version transition under row locks.

DB invariant assessment: current DB cannot express same-family and child/guardian person-type invariants without broader composite FK/check redesign. TASK-106 will not add broad migration. If a race is exposed by tests, AI-00 may add only a minimal partial unique index for active `GRANTED` subject/purpose if compatible with re-consent semantics.

### 16. Tests

Unit/DTO tests:

- valid SERVICE consent
- invalid purpose
- subject id required/UUID validation
- guardian id required/UUID validation
- policyVersion required/non-empty
- idempotencyKey required
- additional fields rejected

Application/integration tests:

- valid PARENT_CHILD authorization
- valid GUARDIAN_CHILD authorization
- subject must be CHILD
- guardian must be PARENT
- same family required
- no relationship denied
- wrong direction denied
- actor permission denied
- actor cannot represent unbound/different guardian
- relationship alone creates no consent
- purpose isolation
- audit generated
- outbox generated
- idempotency replay
- idempotency conflict
- duplicate same consent rejected
- new policy version creates new consent and expires old one
- transaction rollback leaves no partial writes

HTTP E2E tests:

- CreateFamily -> AddParent with `account_id = actor` -> AddChild -> Create PARENT_CHILD -> AssignLifeStage -> Grant SERVICE -> 201
- no relationship -> 403
- cross-family guardian -> reject
- parent as subject -> reject
- same key same payload replay
- same key different payload -> 409
- same purpose/policy new key -> already granted 409
- SERVICE does not create MODEL_IMPROVEMENT
- audit correlation
- ConsentGranted outbox

### 17. Security Boundary

GrantConsent must not mutate Family role, RBAC, ABAC, advisor access, expert access, data ownership, membership, AI permissions, or model routing.

It must not create GrowthProfile, LifeStage, Relationship, Journey, GrowthPriority, Intervention, Agent Memory, AI Recommendation, Model Training Job, Research Dataset, or derived processing side effects.

MODEL_IMPROVEMENT and RESEARCH consent are only consent rows in this task.

### 18. Deferred Scope

DEFERRED: `TASK-106B_WITHDRAW_CONSENT`.

The design preserves future transition `GRANTED -> WITHDRAWN` by retaining status and `withdrawn_at`, keeping audit history, and not deleting previous consent rows.

Withdrawal must be completed before Pilot.

### 19. Risks

- Actor/person binding is only minimally available through `persons.account_id`; this is acceptable for M1 only if GrantConsent rejects missing or mismatched binding.
- Active consent uniqueness is application-enforced unless a narrow DB invariant is later proven necessary.
- Existing `assertFamilyManagePermission` is audit-derived and M1-limited, not a complete RBAC/ABAC permission system.
- Existing service file is growing; task scope favors local pattern consistency over broad refactoring.
- OpenAPI field naming must be contract-aligned without breaking earlier actions.

## FILES TO CHANGE

Expected implementation files:

- `50_开发_dev/packages/contracts/src/index.ts`
- `50_开发_dev/apps/api/src/modules/family/grant-consent.dto.ts`
- `50_开发_dev/apps/api/src/modules/family/grant-consent.dto.spec.ts`
- `50_开发_dev/apps/api/src/modules/family/family.controller.ts`
- `50_开发_dev/apps/api/src/modules/family/family.service.ts`
- `50_开发_dev/apps/api/src/modules/family/grant-consent.integration.spec.ts`
- `50_开发_dev/apps/api/src/modules/family/grant-consent.e2e-spec.ts`
- `50_开发_dev/specs/api/openapi-family-core-v0.1.yaml`
- `50_开发_dev/reports/TASK-106_GRANT_CONSENT_GATE.md`
- `50_开发_dev/reports/task-107/IMPLEMENTATION_PLAN.md` planning only
- `50_开发_dev/backlog/tasks/TASK-106_GRANT_CONSENT.md`
- `50_开发_dev/PROJECT_STATUS.md`

No DB migration is planned unless validation proves a minimal invariant is required.

## DEPENDENCIES

- TASK-101 through TASK-105 remain PASS.
- Real PostgreSQL tests require `TEST_DATABASE_URL` and must not silently skip.
- Shared contracts must be rebuilt before API typecheck when contract source changes.

## IMPLEMENTATION PLAN

1. Add contract types: `ConsentDto`, `GrantConsentRequest`, `GrantConsentResponse`.
2. Add DTO validator for `POST /families/{familyId}/consents` with strict purpose enum and required `policyVersion`.
3. Add controller route using existing actor/correlation/source pattern.
4. Add service constants and request hash for `GrantConsent`.
5. Add guardian/subject loading and independent `GuardianAuthorizationPolicy` decision.
6. Add actor binding and permission checks before consent mutation.
7. Add active consent lookup with row locking, duplicate conflict, and re-consent expiration.
8. Insert new consent, audit, ConsentGranted outbox event, and stored idempotency response in one transaction.
9. Update OpenAPI contract for request/response/errors.
10. Add DTO, integration, security, and HTTP E2E tests.
11. Run full gate: `node tools/validate-contracts.mjs`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:required`.
12. Run AI-03 independent read-only review and record findings.
13. Generate TASK-106 gate report.
14. Generate TASK-107 planning-only artifact.
15. Update TASK-106 task card and `PROJECT_STATUS.md`; stop before TASK-107 implementation.

## RISKS

See Required Design Answer 19. No stop-condition conflict is present if actor binding is enforced as above and no public breaking change is made beyond filling the already-approved GrantConsent placeholder.