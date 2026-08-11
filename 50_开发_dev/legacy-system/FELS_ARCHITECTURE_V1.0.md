# FELS Architecture V1.0

Status: FROZEN_FOR_FELS0_AND_FELS1
Date: 2026-08-10

## 1. Architecture Identity

```text
REFERENCE_IMPLEMENTATION = TRUE
RUNNABLE_LEGACY_SOURCE = TRUE
REAL_BANGYANG_PRODUCTION_SYSTEM = FALSE
```

FELS models the old-world education operation system that FLM migrates from. It intentionally preserves legacy naming, friction, and semantic ambiguity.

Taxonomy boundary:

```text
Bangyang Legacy = real historical old system = unavailable
FELS = runnable reference legacy implementation = old-world test source for FLM
FES = future AI Native education operations system = not legacy and not Bangyang evidence
FLM = semantic migration method
Family = new-world canonical system of record
```

## 2. Runtime Shape

```text
Legacy Web / Admin
  -> Legacy API
  -> family_legacy PostgreSQL
  -> Normal API / Export API
  -> FLM
  -> Family
```

Implementation constraints:

- Backend: TypeScript, NestJS-compatible modular monolith.
- Frontend: internal legacy operations admin, not a Family consumer UI.
- Database: PostgreSQL, isolated `family_legacy`, FELS-owned schema.
- API: normal legacy business API plus read-only export/snapshot API.
- Auth: early dev role auth only.
- Excluded: microservices, Kafka, GraphDB, Agent Runtime, World Model, real payment integration, real WeChat/live-streaming integration.
- Current FELS-1 status: domain runtime validated; real PostgreSQL, real HTTP, and real export HTTP are not yet validated.

## 3. Database Boundary

```text
Family database: DATABASE_URL
FELS database: LEGACY_DATABASE_URL
FELS database name: family_legacy
FELS schema: fels
```

Rules:

- FELS must never silently fallback to `DATABASE_URL`.
- FELS must never silently fallback to `TEST_DATABASE_URL`.
- FELS legacy tables must not be installed into Family canonical schema.
- FELS exports are source evidence candidates, not imported Family truth.

## 4. Twelve Domains

| ID | Domain | Main Capability | Core Objects |
| --- | --- | --- | --- |
| D01 | Identity & Customer | 客户/联系人 | Customer, Contact |
| D02 | CRM & Growth | 线索/商机/跟进 | Lead, Opportunity, FollowUp |
| D03 | Student | 学员/监护关联 | Student, StudentGuardian |
| D04 | Assessment | 测评/评分/报告 | Assessment, Score, Report |
| D05 | Course & LMS | 课程/班级/报名 | Course, Class, Enrollment |
| D06 | Program | 训练营/21天/90天 | Program, ProgramEnrollment |
| D07 | Learning Action | 任务/打卡/作业 | Task, CheckIn, Homework |
| D08 | Human Service | 助教/顾问/班主任 | Advisor, Session, Note |
| D09 | Community | 社群/活动 | Community, Activity |
| D10 | Commerce | 商品/订单/支付/会员 | Order, Payment, Membership |
| D11 | Legacy Intelligence | 标签/画像/AI/预警 | Profile, AIReport, Alert |
| D12 | Governance & History | 协议/授权/报告/历史 | Consent, GrowthReport, Case |

These domains must cover M001-M055 with no missing rows.

Coverage metric rule:

```text
MIGRATION_MATRIX_CLASSIFIED = 55/55
FELS1_RUNTIME_IMPLEMENTED = 10/55
```

55/55 means classification coverage, not FELS-1 implementation completeness.

## 5. Semantic Anti-Corruption Rules

```text
Customer != Family
Contact != Parent
Student != Child
StudentGuardian != FamilyRelationship
AssessmentScore != GrowthState
ProgramCompleted != Outcome
TaskCompleted != Growth
CheckInSubmitted != Outcome
AdvisorNote != Fact
LegacyAIReport != Fact
FamilyScore -> RETIRE
Ranking -> RETIRE
```

FLM is responsible for semantic migration, validation, quarantine, and named action boundaries before Family writes.

## 6. API Families

Normal API supports old-world operations:

- Customers, contacts, students, guardians.
- Assessments, scores, reports.
- Courses, products, orders, payments, enrollments.
- Future authorized phases: programs, tasks, check-ins, advisor notes, membership, community, legacy AI.

Export API supports read-only FLM source discovery:

- `/legacy-export/customers`
- `/legacy-export/students`
- `/legacy-export/assessments`
- `/legacy-export/programs`
- `/legacy-export/tasks`
- `/legacy-export/checkins`
- `/legacy-export/advisor-notes`
- `/legacy-export/orders`
- `/legacy-export/consents`

Every export batch must carry source snapshot metadata.

## 7. Admin Web

FELS admin web must look and behave like traditional CRM + academic affairs + service operations. It is not the Family growth product UI.

Planned screens:

- L01 Legacy Dashboard
- L02 Customer List
- L03 Customer Detail
- L04 Student Detail
- L05 Assessment
- L06 Course / Enrollment
- L07 Order / Payment
- L08 Program
- L09 Task / Check-In
- L10 Advisor Service
- L11 Legacy Profile / AI
- L12 Export / Snapshot

Current FELS-1 shell covers the FELS-1 subset and must not expose Family native objects as editable legacy screens.
