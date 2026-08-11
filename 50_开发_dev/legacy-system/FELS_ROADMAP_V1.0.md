# FELS Roadmap V1.0

Status: ACTIVE_PLAN
Date: 2026-08-10

## 1. Roadmap Summary

FELS runs in parallel with Family M2-M4. Family mainline remains higher priority.

```text
Family mainline priority = P0
FELS priority = P1 Parallel
FELS max engineering capacity during M2 Wave2 = 25%-30%
```

## 2. FELS-0 Architecture & Foundation

Target Duration: 1 week
Current Status: PASS

Goal: Freeze the traditional education old world.

Required assets:

- `FELS_ARCHITECTURE_V1.0.md`
- `FELS_DOMAIN_MODEL.yaml`
- `FELS_ENTITY_CATALOG.yaml`
- `FELS_EVENT_CATALOG.yaml`
- `FELS_TO_FAMILY_MAP.csv`
- `FELS_M001_M055_COVERAGE.csv`
- `SYNTHETIC_DATA_SPEC.md`
- `DIRTY_DATA_SCENARIOS.yaml`

Current implementation uses equivalent executable contracts and CSV/Markdown artifacts. Missing YAML/catalog expansions remain future hardening tasks, not blockers for the current FELS-0/FELS-1 code path.

Gate:

```text
FELS0 = PASS
DOMAINS = 12
MIGRATION_MATRIX_CLASSIFIED = 55/55
DB_BOUNDARY = PASS
REFERENCE_MODEL = PASS
NO_FAMILY_ONTOLOGY_POLLUTION = PASS
```

## 3. FELS-1 Core Education Business

Target Duration: 2 weeks
Current Status: PASS_CODE_VALIDATED; LIVE_DB_NOT_RUN_NO_LEGACY_DATABASE_URL

Implemented objects:

- Customer, Contact, Student, StudentGuardian.
- AssessmentTemplate, AssessmentSession, AssessmentScore, AssessmentReport.
- Course, Product.
- Order, OrderItem, Payment.
- Enrollment.
- LegacyConsent.
- SourceSnapshot.

Vertical slice:

```text
建立客户 -> 创建妈妈联系人 -> 创建孩子 -> 建立旧式 Guardian 关系
-> 做测评 -> 生成 score / label / report -> 购买课程 -> 支付
-> 学员报名 -> 记录旧授权 -> 创建 Snapshot -> Legacy Export
```

Seed commands:

```text
pnpm legacy:seed:clean-small
pnpm legacy:seed:dirty-core
```

Gate:

```text
FELS1 = PASS_CODE_VALIDATED
CORE_DOMAIN_RUNTIME = PASS
EXPORT_DOMAIN_RUNTIME = PASS
FELS1_DB_SCHEMA_CODE = PASS
FELS1_REAL_SYSTEM_CLOSURE = AUTHORIZED
CORE_REAL_HTTP_API = NOT_YET_PASS
EXPORT_REAL_HTTP_API = NOT_YET_PASS
CLEAN_SEED_DOMAIN_RUNTIME = PASS
DIRTY_SEED_DOMAIN_RUNTIME = PASS
CLEAN_SEED_DB = NOT_YET_PASS
DIRTY_SEED_DB = NOT_YET_PASS
VERTICAL_SLICE_E2E = PASS_DOMAIN_RUNTIME
FLM_REFERENCE_DISCOVERY_STATIC = PASS
FLM_REFERENCE_DISCOVERY_DB = NOT_YET_PASS
FLM_STATIC_REFERENCE_DISCOVERY = PASS
FLM_REAL_DB_REFERENCE_DISCOVERY = NOT_YET_PASS
FAMILY_DB_MUTATIONS = 0
MIGRATION_MATRIX_CLASSIFIED = 55/55
FELS1_RUNTIME_IMPLEMENTED = 10/55
```

Live DB condition:

```text
FRESH_DB = PENDING_UNTIL_INDEPENDENT_LEGACY_DATABASE_URL
```

## 4. FELS-2 Program & Human Service

Target Duration: 2-3 weeks
Current Status: NOT_AUTHORIZED

Scope after explicit authorization only:

- TrainingProgram, ProgramEnrollment.
- LegacyTask, LegacyCheckIn.
- Homework, HomeworkReview.
- Staff, Advisor, AdvisorSession, AdvisorNote.
- ProgramReport.

Primary slice:

```text
客户购买90天项目 -> 学生进入 Program -> 初始测评 -> 顾问解读
-> 课程 -> 每日任务 -> 打卡 -> 助教点评 -> 阶段报告 -> 项目完成
```

Required semantic blocks:

```text
ProgramCompleted != Outcome
TaskCompleted != Growth
CheckInSubmitted != Outcome
AdvisorNote != Fact
```

Gate:

```text
FELS2 = PASS
21_DAY_FLOW = PASS
90_DAY_FLOW = PASS
TASK_CHECKIN = PASS
ADVISOR = PASS
PROGRAM_REPORT = PASS
NO_OUTCOME_SEMANTIC_LEAK = PASS
```

## 5. FELS-3 Business Ecosystem

Target Duration: 1-2 weeks
Current Status: NOT_AUTHORIZED

Scope:

- Membership.
- Community, CommunityMember.
- Activity, ActivityEnrollment.
- CustomerSupport.
- CRM FollowUp.
- Class, Attendance.
- LiveSessionRef.

No real WeChat, real payment, or real live integration. Use external refs, statuses, events, and history only.

Gate:

```text
FELS3 = PASS
MEMBERSHIP = PASS
COMMUNITY = PASS
ACTIVITY = PASS
SUPPORT = PASS
CRM_REFERENCE = PASS
LMS_REFERENCE = PASS
ADAPTER_REFERENCE_READY = YES
```

## 6. FELS-4 Legacy Intelligence & Dirty World

Target Duration: 1-2 weeks
Current Status: NOT_AUTHORIZED

Scope:

- LegacyProfile, LegacyTag, LegacyAIReport, LegacyAlert.
- customer_level, student_level, family_type.
- assessment_score, risk_score, family_score, ranking.

FELS may store these as legacy artifacts. Family must not directly accept them.

Mapping rules:

```text
family_score -> RETIRE
ranking -> RETIRE
legacy label -> Legacy Annotation
assessment score -> Historical Evidence
legacy AI conclusion -> Historical AI Hypothesis
```

Dirty scenarios target:

```text
DIRTY_SCENARIOS >= 50
```

Gate:

```text
FELS4 = PASS
LEGACY_AI = PASS
LEGACY_SCORE = PASS
LEGACY_RANKING = PASS
DIRTY_SCENARIOS >= 50
FLM_REJECTS_SEMANTIC_POLLUTION = PASS
```

## 7. FELS-5 Synthetic Migration Simulation

Target Duration: after Family M2/M3 readiness
Current Status: NOT_AUTHORIZED

FELS-5 must be called Synthetic Migration Simulation because source is FELS reference implementation, not real Bangyang production.

FELS-5A Core Migration Simulation after Family M2 loop:

- Customer, Contact, Student, Guardian.
- Assessment.
- LegacyConsent evidence.
- Course ref, Order ref.

FELS-5B Business Migration Simulation after Family M3:

- TrainingCamp, 21-Day, 90-Day.
- Task, CheckIn, Advisor.
- Membership, Community, Historical Reports.

Required zero-leak counters:

```text
CROSS_FAMILY_LEAK = 0
INVALID_RELATIONSHIP = 0
LEGACY_SCORE_TO_GROWTH_STATE = 0
LEGACY_AI_TO_FACT = 0
CHECKIN_TO_OUTCOME = 0
```

## 8. Final Target Command Flow

Long-term completion target:

```text
pnpm legacy:reset
pnpm legacy:seed:dirty-medium
pnpm legacy:test
pnpm migration:discover:fels
pnpm migration:simulate:fels
```

This target is not current capability. It is the strategic completion scenario for FELS-5.
