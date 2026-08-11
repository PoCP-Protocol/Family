# FELS Master Plan V1.0

Status: ACTIVE
Date: 2026-08-10
Owner: Family Architecture / FELS Integration
Applies To: `50_开发_dev/legacy-system/`
Constraint Source: Family V3.0 / AI Development OS V1.1

## 1. Definition

```text
FELS = Family Education Legacy System
FELS = Family 教育业务参考老系统
```

FELS is a formal Family implementation track. It is not a toy legacy mock. It carries four responsibilities:

1. Traditional family education business reference implementation.
2. FLM first runnable source system.
3. Dirty data and migration experiment field.
4. Family business inheritance validation system.

## 2. Capability Truth

```text
REFERENCE_IMPLEMENTATION = TRUE
RUNNABLE_LEGACY_SOURCE = TRUE

REAL_BANGYANG_PRODUCTION_SYSTEM = FALSE
FAMILY_CORE = FALSE
FUTURE_FAMILY_PRODUCT = FALSE
```

FELS rows, tags, scores, reports, and AI conclusions are legacy-source material. They are not Family canonical truth.

## 2.1 Taxonomy Truth

```text
Bangyang Legacy = real historical old system = currently UNAVAILABLE
FELS = Family Education Legacy System = runnable reference legacy implementation for FLM validation
FES = Family Education System = future AI Native education business operations system
FLM = Family Legacy Migration Method = old-world to Family semantic translation method
Family = New World / Family Growth Canonical System of Record
```

FELS is not Bangyang production evidence. FES is not Legacy, not FELS, and not a Bangyang substitute. This plan may clarify the relationship, but it does not authorize expanding FES scope.

## 3. System Relationship

```text
FELS
Traditional education old world
  -> DB / API / Snapshot
  -> FLM Semantic Migration Layer
  -> Identity / Consent / Mapping / Validation / Quarantine
  -> Family Growth System of Record
```

FLM must translate semantic meaning. It must not copy old tables, old labels, old scores, legacy family ranking, or legacy AI conclusions directly into Family canonical ontology.

## 4. Program Control State

```text
FELS_PROGRAM = ACTIVE

FELS0 = PASS
FELS1 = PASS_CODE_VALIDATED
FELS1_REAL_SYSTEM_CLOSURE = AUTHORIZED

FELS1_DOMAIN_MODEL = PASS
FELS1_CODE_RUNTIME = PASS_CODE_VALIDATED

FELS1_REAL_POSTGRESQL = NOT_YET_PASS
FELS1_REAL_HTTP_API = NOT_YET_PASS
FELS1_REAL_EXPORT_API = NOT_YET_PASS
FLM_FELS_REAL_DB_DISCOVERY = NOT_YET_PASS

FELS2 = NOT_AUTHORIZED
FELS3 = NOT_AUTHORIZED
FELS4 = NOT_AUTHORIZED
FELS5 = NOT_AUTHORIZED

FAMILY_M2_PRIORITY = HIGHER_THAN_FELS

REAL_BANGYANG_SOURCE = NO
FELS_REFERENCE_IMPLEMENTATION = YES
FLM_SHADOW_IMPORT = NOT_AUTHORIZED
FLM_CANONICAL_IMPORT = NOT_AUTHORIZED
FAMILY_CANONICAL_WRITES = 0
```

Authorization policy remains:

```text
FELS1 = AUTHORIZED_AFTER_FELS0
FELS2 = REQUIRES_EXPLICIT_NEW_AUTHORIZATION
FELS3 = REQUIRES_EXPLICIT_NEW_AUTHORIZATION
FELS4 = REQUIRES_EXPLICIT_NEW_AUTHORIZATION
FELS5 = REQUIRES_EXPLICIT_NEW_AUTHORIZATION
```

## 5. Objectives

FELS must support the old-world education business chain:

```text
获客 -> 客户 -> 学员 -> 测评 -> 报告 -> 购买 -> 报名 -> 课程
-> 训练营 -> 每日任务 -> 打卡 -> 顾问服务 -> 阶段报告 -> 会员/续费
```

FELS must deliberately keep legacy semantics:

```text
Customer
Student
AssessmentScore
StudentLevel
FamilyType
FamilyScore
Ranking
AIReport
Task
CheckIn
```

FELS must not rename old-world objects into Family native ontology:

```text
Customer != Family
Contact != Parent
Student != Child
AssessmentScore != GrowthState
Task != GrowthAction
CheckIn != Outcome
AIReport != Fact
```

## 6. Scope Boundaries

FELS owns only the isolated legacy database:

```text
FELS_DATABASE = family_legacy
FELS_DATABASE_URL = LEGACY_DATABASE_URL
FORBIDDEN_FALLBACK = DATABASE_URL | TEST_DATABASE_URL
```

Family owns its own system of record database and canonical schemas. Legacy tables must not be placed in Family canonical schema.

## 7. Synchronization With Family M0-M6

| Family Track | FELS Track | FLM Track |
| --- | --- | --- |
| M2 Wave2 | FELS-0 / FELS-1 | Control Plane / Discovery smoke |
| M2 Wave3/4 | FELS-2 when separately authorized | FELS Discovery |
| M3 Early | FELS-3 / FELS-4 when separately authorized | Semantic Mapping + Simulation |
| M3 Mid/Late | FELS-5A / FELS-5B when separately authorized | Business Migration Validation |
| M4 | FELS as Adapter Reference | CRM / LMS / Commerce Integration |
| M5/M6 | FELS mostly frozen | No causal/world-model ownership |

FELS supports business inheritance. It must not become the main Family product line.

## 8. Current Evidence

- FELS-0 executable contracts exist under `legacy-system/contracts`.
- FELS-1 core runtime exists under `legacy-system/apps/api`.
- FELS admin shell exists under `legacy-system/apps/web`.
- FELS migrations exist under `legacy-system/db/migrations`.
- FELS independent DB tool exists under `legacy-system/tools/legacy-db.mjs`.
- 55/55 migration matrix classification exists under `legacy-system/architecture/MIGRATION_MATRIX_COVERAGE.csv`.
- FELS-1 gate report exists under `reports/legacy-system/FELS1_CORE_EDUCATION_BUSINESS_GATE.md`.

Live PostgreSQL migration was not executed because no independent `LEGACY_DATABASE_URL` is available. This is a truthful blocker for live DB proof only, not for FELS-1 code validation.

Current metric split:

```text
MIGRATION_MATRIX_CLASSIFIED = 55/55
FELS1_RUNTIME_IMPLEMENTED = 10/55
```

The 55/55 metric means all M001-M055 rows have been identified, classified, and assigned. It does not mean all 55 rows have FELS-1 runtime implementation.
