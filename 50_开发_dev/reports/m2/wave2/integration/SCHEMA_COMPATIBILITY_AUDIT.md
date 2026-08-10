# M2 Wave 2 Schema Compatibility Audit

role: AI-03 Schema / Contract Compatibility Owner
phase: WAVE2_INTEGRATION_CONVERGENCE
date: 2026-08-10
contract_baseline: M2_WAVE2_CF_V1
scope: Stream-A Schema / Contract Compatibility

## Gate Summary

```text
SCHEMA_CHAIN_VALID = FAIL
GROWTH_JOURNEY_SEMANTICS = PASS
SUBJECT_RESOLUTION = FAIL
GROWTH_ACTION_COMPATIBILITY = PASS
CONTRACT_DB_ALIGNMENT = FAIL
REAL_MIGRATION_READY = NO
BLOCKERS = 1
```

## Files Audited

- `database/migrations/0003_growth_foundation.sql`
- `database/migrations/0006_perspective_evidence_contract_alignment.sql`
- `database/migrations/0007_growth_profile_draft_confirmation.sql`
- `database/migrations/0008_m2_wave2_priority_intervention_action.sql`
- `packages/contracts/src/index.ts`
- `apps/api/src/modules/family/confirm-growth-priority.dto.ts`
- `apps/api/src/modules/family/start-intervention.dto.ts`
- `apps/api/src/modules/family/complete-growth-action.dto.ts`
- `apps/api/src/modules/family/growth-priority.policy.ts`
- `apps/api/src/modules/family/growth-priority.service.ts`
- `apps/api/src/modules/family/intervention.policy.ts`
- `apps/api/src/modules/family/intervention.service.ts`
- `apps/api/src/modules/family/growth-action.policy.ts`
- `apps/api/src/modules/family/growth-action.service.ts`

## Findings

### 1. Schema Chain

The intended Wave2 chain is present in schema and service shape:

```text
growth_journeys
-> growth_priorities.onboarding_id
-> intervention_episodes.priority_id / onboarding_id
-> growth_actions.priority_id / intervention_episode_id / onboarding_id
```

`0008_m2_wave2_priority_intervention_action.sql` adds the Wave2 priority/intervention/action columns additively and seeds `INTERVENTION-001` as `LISTEN_BEFORE_RESPOND`. This aligns with the frozen contract's no-destructive-migration rule.

However, the runtime priority confirmation path currently executes:

```sql
select subject_person_id
from growth_journeys
```

No audited migration adds `growth_journeys.subject_person_id`. `0003_growth_foundation.sql` creates `growth_journeys` with family, type, phase, status, timestamps, and version only; `0008` does not add a subject column. Therefore a real PostgreSQL run of the current `ConfirmGrowthPriority` subject check will fail before the Wave2 chain can be exercised.

Verdict: `SCHEMA_CHAIN_VALID = FAIL` until subject resolution stops depending on a non-existent journey subject column or an approved migration exists through the contract-change path.

### 2. Growth Journey Semantics

`GrowthJourney != Person-Owned Object` remains intact at the frozen schema level. No audited Wave2 migration adds `growth_journeys.subject_person_id`, and this audit does not request adding it for convenience.

The existing `growth_journeys` table remains a family-owned journey/context object. Subject identity must be resolved through canonical onboarding/profile/relationship records, not by making journey directly person-owned.

Verdict: `GROWTH_JOURNEY_SEMANTICS = PASS`.

### 3. Subject Resolution

Current implementation has two patterns:

- `InterventionService` and `GrowthActionService` resolve consent subject via `priority -> growth_profiles -> subject_person_id | subject_relationship_id -> family_relationships.person_b_id`.
- `GrowthPriorityService.assertActiveOnboarding` resolves consent subject via non-existent `growth_journeys.subject_person_id`.

The second pattern is a real migration blocker. It is also inconsistent with the Phase B2 directive because it assumes a journey subject shortcut that the frozen schema intentionally does not approve.

Recommended minimal boundary, without adding `growth_journeys.subject_person_id`:

```text
GrowthSubjectResolver
input: familyId + onboardingId/profileId/priorityId context
output: childPersonId + guardianPersonId + relationshipId + resolved_via
allowed resolved_via:
- RELATIONSHIP_PROFILE
- ONBOARDING_MATERIAL_RELATIONSHIP
forbidden:
- SELECT first child
- journey.subject_person_id shortcut unless a future approved contract change adds it
```

Minimum implementation direction for the next owner: move all Wave2 consent/minor subject lookup behind that boundary and derive the child from profile relationship or from the original onboarding material/relationship evidence already captured by Wave1, not from `growth_journeys.subject_person_id`.

Verdict: `SUBJECT_RESOLUTION = FAIL`.

### 4. Growth Actions Field Compatibility

Classification of `growth_actions` fields after `0008`:

| Field | Classification | Audit note |
|---|---|---|
| `action_id` | CANONICAL_WAVE2 | Contract `GrowthActionDto.action_id`. |
| `family_id` | CANONICAL_WAVE2 | Contract `GrowthActionDto.family_id`. |
| `onboarding_id` | CANONICAL_WAVE2 | Added by `0008`; maps to contract. |
| `priority_id` | CANONICAL_WAVE2 | Added by `0008`; maps to contract. |
| `intervention_episode_id` | CANONICAL_WAVE2 | Added by `0008`; maps to contract. |
| `day_index` | CANONICAL_WAVE2 | Added by `0008`; constrained to 1-7. |
| `status` | CANONICAL_WAVE2 with TEMPORARY_SCHEMA_COMPATIBILITY | New Wave2 writes use `PENDING`, then `COMPLETED/PARTIAL/NOT_COMPLETED`; legacy `ASSIGNED` remains allowed only for old rows. |
| `assignment_text` | CANONICAL_WAVE2 | Added by `0008`; service writes same value as legacy `instruction`. |
| `due_date` | CANONICAL_WAVE2 | Added by `0008`; maps to contract date string. |
| `completed_at` | CANONICAL_WAVE2 | Existing column maps to contract. |
| `completion_status` | CANONICAL_WAVE2 | Added by `0008`; completion-only mirror of terminal status. |
| `reflection` | CANONICAL_WAVE2 | Added by `0008`; raw material only. |
| `reflection_boundary` | CANONICAL_WAVE2 | Added by `0008`; constrained to raw-material boundary. |
| `boundary` | CANONICAL_WAVE2 | Added by `0008`; constrained to `ACTION_IS_NOT_OUTCOME`. |
| `journey_id` | LEGACY_EQUIVALENT | Service dual-writes `journey_id = onboarding_id`. |
| `intervention_id` | LEGACY_EQUIVALENT | Service dual-writes stable `INTERVENTION-001`; episode remains canonical runtime instance. |
| `dimension_id` | LEGACY_EQUIVALENT | Service derives from active priority dimension. |
| `action_type` | LEGACY_EQUIVALENT | Service writes `LISTEN_BEFORE_RESPOND_DAILY_ACTION`; not exposed in Wave2 DTO. |
| `instruction` | LEGACY_EQUIVALENT | Service dual-writes same deterministic Chinese assignment as `assignment_text`. |
| `assigned_to_person_id` | LEGACY_AMBIGUOUS | Existing nullable legacy field is not used by Wave2; do not dummy-fill. |
| `assigned_at` | LEGACY_EQUIVALENT | Existing assignment timestamp; Wave2 relies on due date/status. |
| `created_at` | CANONICAL_WAVE2 | Contract `GrowthActionDto.created_at`. |

No `SCHEMA_SEMANTIC_BLOCKER` is found inside `growth_actions` itself because Wave2 writes have canonical columns and only use legacy columns as additive compatibility mirrors. The compatibility allowance must remain temporary and must not leak `ASSIGNED` into Wave2 API DTOs.

Verdict: `GROWTH_ACTION_COMPATIBILITY = PASS`.

### 5. Contract / DB Alignment

Aligned:

- `GrowthPriorityDecision` permits `P03`, `R03`, `R04`, `R05`, and `NO_PRIORITY_YET`; DB constrains persisted active priorities to `P03/R03/R04/R05`, while `NO_PRIORITY_YET` remains non-mutating.
- `InterventionCode` and DB seed both fix `LISTEN_BEFORE_RESPOND` / `INTERVENTION-001`.
- `GrowthActionStatus` contract excludes legacy `ASSIGNED`; service writes Wave2 actions as `PENDING` and completion updates only to approved terminal statuses.
- Reflection boundary and action boundary are represented in both contract and DB.

Not aligned:

- `GrowthPriorityService` expects `growth_journeys.subject_person_id`; DB and frozen journey semantics do not provide it.
- Because priority confirmation is upstream of intervention/action, this prevents a real end-to-end migration-backed Wave2 slice from being ready.

Verdict: `CONTRACT_DB_ALIGNMENT = FAIL`.

## Blockers

1. `SCHEMA_SEMANTIC_BLOCKER`: `GrowthPriorityService.assertActiveOnboarding` reads `growth_journeys.subject_person_id`, but no migration creates that column and Phase B2 forbids adding it for convenience. Real PostgreSQL execution will fail. Resolve through a minimal `GrowthSubjectResolver` using canonical onboarding/profile/relationship provenance, or submit a `CONTRACT_CHANGE_REQUEST` if a direct journey subject is claimed to be domain-required.

## Final Verdict

```text
SCHEMA_CHAIN_VALID = FAIL
GROWTH_JOURNEY_SEMANTICS = PASS
SUBJECT_RESOLUTION = FAIL
GROWTH_ACTION_COMPATIBILITY = PASS
CONTRACT_DB_ALIGNMENT = FAIL
REAL_MIGRATION_READY = NO
BLOCKERS = 1
```

No frozen contract or shared conflict matrix file was modified. No `growth_journeys.subject_person_id` schema change was added.