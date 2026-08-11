# FELS Schema Convergence Decision

Status: ACTIVE_DECISION
Date: 2026-08-10
Owner: Family Architecture / FELS Integration
Scope: FELS-1 Integration Hardening Gate / Gate A

## Decision

```text
SCHEMA_CONVERGENCE_DECISION = PASS_SQL_CONVERGED_NOT_REAL_DB_VALIDATED
ONE_CONCEPT_ONE_RUNTIME_TABLE = REQUIRED
AUTHORITATIVE_FELS1_RUNTIME_MODEL = legacy_* tables
FELS0_DOMAIN_COVERAGE_MODEL = LOGICAL_CONTRACT_ONLY
FELS2 = NOT_AUTHORIZED
```

FELS runtime must not expose two authoritative physical source models for the same business concept. For FELS-1, the executable source model is the `fels.legacy_*` table family introduced by `0002_fels1_core_business.sql`:

```text
fels.legacy_customers
fels.legacy_contacts
fels.legacy_students
fels.legacy_student_guardians
fels.legacy_assessment_templates
fels.legacy_assessment_sessions
fels.legacy_assessment_scores
fels.legacy_assessment_reports
fels.legacy_courses
fels.legacy_products
fels.legacy_orders
fels.legacy_order_items
fels.legacy_payments
fels.legacy_enrollments
fels.legacy_consent_records
fels.legacy_source_snapshots
fels.legacy_audit_logs
```

The earlier FELS-0 table family, such as `fels.customer`, `fels.contact`, `fels.student`, and `fels.student_guardian`, remains logical domain coverage evidence only. `0001_fels0_schema.sql` now creates only the `fels` schema marker and must not create those tables as active source-of-truth objects.

## Rationale

Before Gate A convergence, `0001_fels0_schema.sql` created broad old-world domain tables for the 12-domain FELS-0 coverage model. `0002_fels1_core_business.sql` creates the runtime-aligned FELS-1 physical model using `legacy_*` names, text identifiers, source snapshot metadata, and semantic classification fields.

Deploying both models as active runtime truth would create ambiguity:

```text
customer vs legacy_customers
contact vs legacy_contacts
student vs legacy_students
student_guardian vs legacy_student_guardians
assessment_session vs legacy_assessment_sessions
legacy_order vs legacy_orders
legacy_consent vs legacy_consent_records
```

That ambiguity would break FLM discovery because FLM could not know which table family represents authoritative source evidence.

## Pre-Live Rule

No shared or long-lived `family_legacy` database evidence has been recorded in this repository for FELS migrations. Until independent `LEGACY_DATABASE_URL` evidence proves otherwise, Gate A treats schema convergence as a pre-live baseline correction requirement.

If a shared or long-lived environment is later found to have already applied `0001` and `0002`, migration history must not be rewritten. In that case a new convergence migration must mark FELS-0 physical tables as non-authoritative compatibility artifacts or move them out of the active runtime path.

## FLM Read Rule

FLM FELS discovery must read only the authoritative FELS-1 runtime model unless a future approved ADR changes this boundary.

```text
FLM_ALLOWED_RUNTIME_TABLE_FAMILY = fels.legacy_*
FLM_FORBIDDEN_DUAL_TRUTH = customer + legacy_customers
FLM_FORBIDDEN_DUAL_TRUTH = student + legacy_students
FLM_FORBIDDEN_DUAL_TRUTH = student_guardian + legacy_student_guardians
```

## Gate Status

```text
SCHEMA_SINGLE_RUNTIME_MODEL = PASS_SQL_CONVERGED
ONE_CONCEPT_ONE_RUNTIME_TABLE = PASS_SQL_CONVERGED
FRESH_POSTGRESQL_MIGRATION = NOT_YET_PASS
FLM_REAL_DB_REFERENCE_DISCOVERY = NOT_YET_PASS
FELS1 = PASS_CODE_VALIDATED
FELS1_REAL_SYSTEM_VALIDATED = NOT_YET_PASS
```

This decision authorizes Gate B implementation work from a single authoritative SQL model, but does not validate fresh PostgreSQL execution until independent `LEGACY_DATABASE_URL` evidence exists.
