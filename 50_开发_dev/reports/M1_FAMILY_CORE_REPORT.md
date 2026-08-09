# M1 Family Core Report

date: 2026-08-10
milestone: M1_FAMILY_CORE_RUNNING
status: PASS

## 1. M1目标

M1 proves the Family Core can run as a real vertical slice: create a family, add parent and child members, create a relationship, assign the first approved LifeStage, grant purpose-specific consent, and read the resulting family aggregate.

## 2. 已完成Named Actions

- CreateFamily
- AddParent
- AddChild
- CreateFamilyRelationship
- AssignLifeStage
- GrantConsent

TASK-107 adds no new write Named Action. It adds a read projection for the completed M1 state.

## 3. Final API Surface

- `POST /families`
- `POST /families/{familyId}/parents`
- `POST /families/{familyId}/children`
- `POST /families/{familyId}/relationships`
- `POST /families/{familyId}/life-stages`
- `POST /families/{familyId}/consents`
- `GET /families/{familyId}`

## 4. Final Database Objects

The M1 flow uses canonical PostgreSQL tables: `families`, `persons`, `family_relationships`, `life_stage_assignments`, `consents`, `audit_logs`, `outbox_events`, and `idempotency_keys`.

## 5. Full End-to-End Flow

The final E2E test runs this chain from an empty database:

```text
CreateFamily -> AddParent -> AddChild -> CreateFamilyRelationship(PARENT_CHILD) -> AssignLifeStage(EARLY_ADOLESCENCE_12_15) -> GrantConsent(SERVICE) -> GetFamilyAggregate
```

## 6. Real PG Evidence

All focused and required tests used PostgreSQL at `postgres://family:***@localhost:55433/family_gate` through `TEST_DATABASE_URL`.

## 7. Unit/Integration/E2E Evidence

- Unit: 8 files, 25 tests passed.
- Integration: 6 files, 29 tests passed.
- E2E: 7 files, 43 tests passed.
- TASK-107 focused E2E: 1 file, 8 tests passed.

## 8. Audit/Outbox Evidence

TASK-107 focused E2E verifies audit rows for `CreateFamily`, `AddParent`, `AddChild`, `CreateFamilyRelationship`, `AssignLifeStage`, and `GrantConsent`, all traceable by correlation id.

It also verifies outbox events: `FamilyCreated`, two `FamilyMemberAdded` events, `FamilyRelationshipCreated`, `LifeStageAssigned`, and `ConsentGranted`.

## 9. Idempotency Evidence

The full-flow test verifies CreateFamily and GrantConsent replay with the same key/payload returns the same response and does not create duplicate rows. The same key with a conflicting payload returns 409.

## 10. Permission Boundary

M1 aggregate read uses the existing family manage permission rule: the actor must have a successful `CreateFamily` audit entry for the same family. Unauthorized aggregate read returns 403. Unknown family returns 404.

This is sufficient for M1 but is not a pilot-grade IAM model.

## 11. Minor-Data Boundary

TASK-107 proves child `birth_date` remains data only. It does not infer or create a LifeStage. LifeStage appears only through explicit AssignLifeStage.

## 12. Consent Boundary

Consent appears only through explicit GrantConsent. Relationship presence does not infer consent. Only active `GRANTED` consent rows are included in the aggregate; old versions are retained as history and excluded from the active projection.

## 13. Explicit Non-Capabilities

M1 does not implement GrowthProfile, GrowthPriority, Journey, Intervention, Agent runtime, Model Gateway, Knowledge Foundry, Causal Platform, World Model, Family Total Score, or family ranking.

## 14. Technical Debt

- M1 read/write permission is minimal and must be hardened.
- Same-family and type invariants remain service-level in some places because the current FK shape is intentionally simple.
- WithdrawConsent is not implemented.
- Pilot readiness requires IAM hardening and consent lifecycle completion.

## 15. Deferred Work

- TASK-106B WithdrawConsent.
- IAM hardening.
- Full 0-18 LifeStage expansion.
- M2 first growth vertical slice.
- Model Gateway and AI features only after explicit approval and outcome/evaluation gates.

## 16. Readiness For M2

M1 is ready to close. The next approved phase may start M2 planning or implementation only after human authorization. The planning-only artifact is `reports/m2/M2_FIRST_GROWTH_VERTICAL_SLICE_PLAN.md`.