# AI-03 Status

role: Schema / Contract Compatibility Owner
phase: WAVE2_INTEGRATION_CONVERGENCE

```text
STATE: STREAM_A_SCHEMA_COMPATIBILITY_READY
LAST_CHANGESET: Removed GrowthPriorityService dependency on growth_journeys.subject_person_id and updated schema audit to REAL_MIGRATION_READY = YES.
DONE:
- Contract Freeze and Shared File Conflict Matrix remain frozen and binding.
- Audited Wave2 migrations, shared contracts, API DTOs, priority/intervention/action policies and services.
- Confirmed no approved schema path adds growth_journeys.subject_person_id.
- Classified growth_actions fields across CANONICAL_WAVE2 / LEGACY_EQUIVALENT / LEGACY_AMBIGUOUS.
- Implemented GrowthSubjectResolver boundary for ConfirmGrowthPriority consent subject resolution.
- ConfirmGrowthPriority now validates onboarding via growth_journeys.journey_id only.
- Consent subject resolution uses profile.subject_person_id first, then profile.subject_relationship_id -> family_relationships.person_b_id.
- Focused API tests and API typecheck passed.
NEXT:
- AI-05 can include ConfirmGrowthPriority in real PostgreSQL migration-backed E2E validation.
BLOCKER: none for AI-03 schema/contract compatibility.
NEEDS_FROM:
- AI-05: real PostgreSQL migration-backed Wave2 E2E result.
CONTRACT_VERSION: M2_WAVE2_CF_V1
GATES: SCHEMA_CHAIN_VALID=PASS; GROWTH_JOURNEY_SEMANTICS=PASS; SUBJECT_RESOLUTION=PASS; GROWTH_ACTION_COMPATIBILITY=PASS; CONTRACT_DB_ALIGNMENT=PASS; REAL_MIGRATION_READY=YES; BLOCKERS=0
VALIDATION: pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- growth-priority.service.spec.ts --reporter=verbose => PASS 8/8; pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck => PASS TYPECHECK_OK
```
