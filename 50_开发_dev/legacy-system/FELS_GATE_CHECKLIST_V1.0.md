# FELS Gate Checklist V1.0

Status: ACTIVE_GATE_STANDARD
Date: 2026-08-10

## 1. Universal Gate Rule

No FELS phase passes because code exists. Every phase requires a closed loop across:

```text
CONTRACT
DB
API
TEST
E2E
SYNTHETIC_DATA
MAPPING
CAPABILITY_TRUTH
REPORT
```

Capability labels use the Family CT model:

```text
CT0 IDEA
CT1 DESIGNED
CT2 CONTRACTED
CT3 IMPLEMENTED
CT4 INTEGRATION_TESTED
CT5 USER_DEMOED
CT6 PILOT_VALIDATED
```

FELS normally targets CT5 at most. It does not require real-customer pilot validation.

## 2. Global Boundary Checks

These checks apply to every phase:

```text
REFERENCE_IMPLEMENTATION = TRUE
REAL_BANGYANG_PRODUCTION_SYSTEM = FALSE
FAMILY_CORE = FALSE
LEGACY_DATABASE_URL_REQUIRED = TRUE
DATABASE_URL_FALLBACK_FORBIDDEN = TRUE
TEST_DATABASE_URL_FALLBACK_FORBIDDEN = TRUE
NO_FAMILY_ONTOLOGY_POLLUTION = PASS
FAMILY_DB_MUTATIONS = 0 unless explicitly running a later authorized FLM shadow/import named action
```

## 3. FELS-0 Gate

```text
FELS0 = PASS | FAIL
DOMAINS = 12
MIGRATION_MATRIX = 55/55
DB_BOUNDARY = PASS | FAIL
REFERENCE_MODEL = PASS | FAIL
LEGACY_API_CONTRACT = PASS | FAIL
LEGACY_EXPORT_CONTRACT = PASS | FAIL
DIRTY_SCENARIOS >= 20
NO_FAMILY_ONTOLOGY_POLLUTION = PASS | FAIL
BLOCKERS = n
```

Current state:

```text
FELS0 = PASS
```

## 4. FELS-1 Gate

```text
FELS1 = PASS | FAIL
FRESH_DB = PASS | PENDING_WITH_REASON | FAIL
CORE_API = PASS | FAIL
EXPORT_API = PASS | FAIL
CLEAN_SEED = PASS | FAIL
DIRTY_SEED = PASS | FAIL
VERTICAL_SLICE_E2E = PASS | FAIL
AMBIGUITY_E2E = PASS | FAIL
FLM_DISCOVERY = PASS_REFERENCE_SOURCE_READ_ONLY | FAIL
FAMILY_DB_MUTATIONS = 0
MIGRATION_MATRIX = 55/55
BLOCKERS = n
```

Current state:

```text
FELS1 = PASS_CODE_VALIDATED
FRESH_DB = PENDING_NO_LEGACY_DATABASE_URL
FAMILY_DB_MUTATIONS = 0
```

## 5. FELS-2 Gate

Authorization state: NOT_AUTHORIZED

```text
FELS2 = PASS | FAIL
21_DAY_FLOW = PASS | FAIL
90_DAY_FLOW = PASS | FAIL
TASK_CHECKIN = PASS | FAIL
HOMEWORK = PASS | FAIL
ADVISOR = PASS | FAIL
PROGRAM_REPORT = PASS | FAIL
NO_OUTCOME_SEMANTIC_LEAK = PASS | FAIL
BLOCKERS = n
```

Semantic leak checks:

```text
ProgramCompleted != Outcome
TaskCompleted != Growth
CheckInSubmitted != Outcome
AdvisorNote != Fact
```

## 6. FELS-3 Gate

Authorization state: NOT_AUTHORIZED

```text
FELS3 = PASS | FAIL
MEMBERSHIP = PASS | FAIL
COMMUNITY = PASS | FAIL
ACTIVITY = PASS | FAIL
SUPPORT = PASS | FAIL
CRM_REFERENCE = PASS | FAIL
LMS_REFERENCE = PASS | FAIL
ADAPTER_REFERENCE_READY = YES | NO
BLOCKERS = n
```

## 7. FELS-4 Gate

Authorization state: NOT_AUTHORIZED

```text
FELS4 = PASS | FAIL
LEGACY_AI = PASS | FAIL
LEGACY_SCORE = PASS | FAIL
LEGACY_RANKING = PASS | FAIL
DIRTY_SCENARIOS >= 50
FLM_REJECTS_SEMANTIC_POLLUTION = PASS | FAIL
BLOCKERS = n
```

Required rejection/retirement checks:

```text
family_score -> RETIRE
ranking -> RETIRE
legacy label -> Legacy Annotation
assessment score -> Historical Evidence
legacy AI conclusion -> Historical AI Hypothesis
legacy AI conclusion != Fact
legacy score != GrowthState
legacy label != Diagnosis
```

## 8. FELS-5 Gate

Authorization state: NOT_AUTHORIZED

FELS-5 is Synthetic Migration Simulation, not a claim of real Bangyang production migration.

```text
FELS5A_CORE_MIGRATION_SIMULATION = PASS | FAIL
FELS5B_BUSINESS_MIGRATION_SIMULATION = PASS | FAIL
SOURCE_RECORDS = n
IDENTITY_EXACT = n
IDENTITY_REVIEW_REQUIRED = n
CONSENT_VALID = n
CONSENT_REAUTHORIZE = n
SEMANTIC_MAPPED = n
SEMANTIC_RETIRED = n
QUARANTINED = n
FAMILY_IMPORTED = n
CROSS_FAMILY_LEAK = 0
INVALID_RELATIONSHIP = 0
LEGACY_SCORE_TO_GROWTH_STATE = 0
LEGACY_AI_TO_FACT = 0
CHECKIN_TO_OUTCOME = 0
BLOCKERS = n
```

## 9. CI Jobs

Recommended independent jobs:

```text
fels-contract
fels-typecheck
fels-unit
fels-build
fels-postgres
fels-migration
fels-e2e
fels-export-test
fels-synthetic-test
```

FELS-5 additions:

```text
flm-fels-discovery
flm-fels-migration-simulation
```

FELS failures must not block unrelated Family M2 foundation work. PRs touching FELS or FLM/FELS integration must pass the relevant FELS gates.

## 10. Team Split

Use existing AI-00 to AI-07 roles:

| Role | FELS Responsibility |
|---|---|
| AI-00 | FELS Integration / Architecture |
| AI-01 | Legacy Domain Semantics |
| AI-02 | Identity / Guardian / Legacy Consent Semantics |
| AI-03 | PostgreSQL / Schema / API / Contracts |
| AI-04 | Legacy Admin Web |
| AI-05 | Synthetic Data / E2E / FLM Discovery / CI |
| AI-06 | Privacy / Minor / Consent Governance |
| AI-07 | Independent Review |

Maximum parallel coding streams: 4.
