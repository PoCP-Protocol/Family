# Schema Compatibility Audit Template

status: TEMPLATE
phase: WAVE2_INTEGRATION_CONVERGENCE
owner: AI-03

## Required Reads

- All growth migrations.
- `growth_journeys`.
- `growth_profiles`.
- `growth_priorities`.
- intervention-related schema.
- `growth_actions`.
- `consents`.
- family relationships.
- onboarding schema.
- Final PostgreSQL shape after the migration chain.

## Required Gate

```text
SCHEMA_CHAIN_VALID = PASS/FAIL
GROWTH_JOURNEY_SEMANTICS = PASS/FAIL
SUBJECT_RESOLUTION = PASS/FAIL
GROWTH_ACTION_COMPATIBILITY = PASS/FAIL
CONTRACT_DB_ALIGNMENT = PASS/FAIL
REAL_MIGRATION_READY = YES/NO
BLOCKERS = n
```

## Growth Actions Classification

| COLUMN | SOURCE_MIGRATION | CURRENT_NOT_NULL | CURRENT_DEFAULT | WAVE2_MEANING | LEGACY_MEANING | WRITE_STRATEGY | DEPRECATION_NEEDED |
|---|---|---|---|---|---|---|---|

Allowed `WRITE_STRATEGY` values:

- `CANONICAL_WAVE2`
- `TEMPORARY_DUAL_WRITE`
- `READ_ONLY_LEGACY`
- `SCHEMA_SEMANTIC_BLOCKER`

## Subject Resolution

Record whether subject resolution can use canonical chains:

```text
Journey / Intervention -> Growth Onboarding -> child_id -> Minor Subject
Relationship Growth Profile -> Parent-Child Relationship -> Child
```

Do not approve `SELECT first child`.
