# M2 Wave 2 Schema Compatibility Audit

role: AI-03 Schema / Contract Compatibility Owner
phase: WAVE2_INTEGRATION_CONVERGENCE
date: 2026-08-10
contract_baseline: M2_WAVE2_CF_V1
scope: Stream-A Schema / Contract Compatibility

## Gate Summary

```text
SCHEMA_CHAIN_VALID = PASS
GROWTH_JOURNEY_SEMANTICS = PASS
SUBJECT_RESOLUTION = PASS
GROWTH_ACTION_COMPATIBILITY = PASS
CONTRACT_DB_ALIGNMENT = PASS
REAL_MIGRATION_READY = YES
BLOCKERS = 0
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

The previous runtime priority confirmation blocker executed:

```sql
select subject_person_id
from growth_journeys
```

No audited migration adds `growth_journeys.subject_person_id`. `0003_growth_foundation.sql` creates `growth_journeys` with family, type, phase, status, timestamps, and version only; `0008` does not add a subject column.

The implementation now keeps `growth_journeys` as the family-owned onboarding context and validates onboarding existence with `journey_id` only. `ConfirmGrowthPriority` resolves the consent subject through the `GrowthSubjectResolver` boundary before writing an active priority:

```text
candidate.profile_id
-> growth_profiles.subject_person_id, when present
-> growth_profiles.subject_relationship_id -> family_relationships.person_b_id, otherwise
```

Focused tests assert that `growth_journeys.subject_person_id` is not queried and that relationship subjects resolve to `family_relationships.person_b_id`.

Verdict: `SCHEMA_CHAIN_VALID = PASS`.

### 2. Growth Journey Semantics

`GrowthJourney != Person-Owned Object` remains intact at the frozen schema level. No audited Wave2 migration adds `growth_journeys.subject_person_id`, and this audit does not request adding it for convenience.

The existing `growth_journeys` table remains a family-owned journey/context object. Subject identity must be resolved through canonical onboarding/profile/relationship records, not by making journey directly person-owned.

Verdict: `GROWTH_JOURNEY_SEMANTICS = PASS`.

### 3. Subject Resolution

Current implementation uses the approved profile/relationship subject-resolution semantics:

- `ConfirmGrowthPriority` resolves the consent subject from the selected candidate profile before priority insertion.
- `profile.subject_person_id` takes precedence.
- If `profile.subject_person_id` is null and `profile.subject_relationship_id` is present, `family_relationships.person_b_id` is the child/subject.
- `InterventionService` and `GrowthActionService` already resolve downstream consent subject via active priority/profile provenance.

The previous journey subject shortcut has been removed. No schema change adds `growth_journeys.subject_person_id`.

Implemented minimal boundary:

```text
GrowthSubjectResolver
input: profileId
output: subjectPersonId + subjectRelationshipId + resolvedVia
allowed resolvedVia:
- PROFILE_SUBJECT_PERSON
- PROFILE_SUBJECT_RELATIONSHIP_CHILD
forbidden:
- SELECT first child
- growth_journeys.subject_person_id shortcut
```

Verdict: `SUBJECT_RESOLUTION = PASS`.

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

Previously not aligned:

- `GrowthPriorityService` expected `growth_journeys.subject_person_id`; DB and frozen journey semantics do not provide it.

Resolved:

- `GrowthPriorityService` no longer reads a journey subject column.
- `ConfirmGrowthPriority` consent checks use profile/relationship subject resolution and preserve `GrowthJourney != Person-Owned Object`.

Verdict: `CONTRACT_DB_ALIGNMENT = PASS`.

## Blockers

None remaining for AI-03 schema/contract compatibility.

Resolved blocker:

- `SCHEMA_SEMANTIC_BLOCKER`: `GrowthPriorityService.assertActiveOnboarding` read `growth_journeys.subject_person_id`. Fixed by validating onboarding via `journey_id` and resolving confirmation consent subject through `GrowthSubjectResolver` from `growth_profiles.subject_person_id` or `growth_profiles.subject_relationship_id -> family_relationships.person_b_id`.

## Validation

```text
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- growth-priority.service.spec.ts --reporter=verbose
PASS: 1 test file, 8 tests

pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck
PASS: TYPECHECK_OK
```

## Final Verdict

```text
SCHEMA_CHAIN_VALID = PASS
GROWTH_JOURNEY_SEMANTICS = PASS
SUBJECT_RESOLUTION = PASS
GROWTH_ACTION_COMPATIBILITY = PASS
CONTRACT_DB_ALIGNMENT = PASS
REAL_MIGRATION_READY = YES
BLOCKERS = 0
```

No frozen contract or shared conflict matrix file was modified. No `growth_journeys.subject_person_id` schema change was added.