# FELS — Family Education Legacy System

```text
REFERENCE_IMPLEMENTATION = TRUE
REAL_BANGYANG_SOURCE = FALSE
SOURCE_SYSTEM = FELS_REFERENCE_IMPLEMENTATION
PRODUCTION_BANGYANG_SOURCE = NO
```

FELS is the runnable reference legacy education business system for Family migration work. It represents the old-world education operation model: customers, contacts, students, assessments, courses, programs, check-ins, advisors, orders, memberships, communities, legacy AI reports, and historically weak consent records.

FELS is not Family Core, not a future Family product architecture, and not a discovered Bangyang production schema. It is the first controlled source system for FLM adapter and migration validation.

## FELS-0 Scope

- Architecture and executable foundation only.
- Independent PostgreSQL contract: `family_legacy`.
- Independent runtime URL: `LEGACY_DATABASE_URL`.
- REST and export API contracts.
- 12 old-world business modules.
- 42 core legacy tables.
- Synthetic data specification with clean, medium, and dirty datasets.
- 55/55 migration matrix coverage.
- Tests that prove Family ontology pollution is blocked.

## Local Checks

```bash
pnpm --filter @family/fels-contracts typecheck
pnpm --filter @family/fels-contracts test
pnpm --filter @family/fels-api typecheck
pnpm --filter @family/fels-api test
pnpm --filter @family/fels-web typecheck
pnpm --filter @family/fels-web test
```

## Stop Line

FELS-0 may declare contracts and minimal health/snapshot/admin surfaces. It must not start FELS-1 business CRUD, Family migration execution, or M3 work without Chief Architect authorization.