# FELS-1 真实系统收口 Gate 报告

> 依据：总架构师开发令 **FELS-1-CLOSE-001**（关闭 FELS-1 Real System Gate；隔离早期 FELS-2/3；不扩 FELS 功能）
> 验证方式：本地真实 PostgreSQL（`family_legacy`）+ 真实 HTTP + 真实 export + 只读 FLM 发现
> Family 正典库写入 = **0**（全程只读，无 shadow/canonical import）
> 报告以**独立文档**形式固化，未改写任何已 push 提交/他人历史（见 `FELS_LOCAL_CHANGE_OWNERSHIP_AUDIT.md`）

---

## 1. Gate 汇总

| Gate 项 | 结果 | 证据 |
|---|---|---|
| FELS0 | **PASS** | 代码 Gate `fels0=PASS`，readyForFels1=true |
| FELS1（代码级） | **PASS_CODE_VALIDATED** | 16/16 vitest 通过，blockers=[] |
| FELS1（真实系统） | **PASS_REAL_SYSTEM_VALIDATED** | 本报告 §2–§5 全部真实证据成立 |
| CORE_REAL_HTTP_API | **PASS_REAL_HTTP** | `/health` 200，realBangyangSource=false（§4） |
| EXPORT_REAL_HTTP_API | **PASS_REAL_HTTP** | `/legacy-export/*` 真实响应，只读边界 405（§4） |
| FRESH_DB_MIGRATION | **PASS_REAL_POSTGRESQL** | reset→3 迁移 applied→无 pending（§2） |
| CLEAN_SEED_DB | **PASS** | clean 小数据集写入真实 DB（§3） |
| DIRTY_SEED_DB | **PASS** | dirty 数据集歧义证据生成，未提升 Family 真相（§3） |
| FLM_REFERENCE_DISCOVERY_DB | **PASS_REAL_DB_READ** | H006 只读发现（§5） |
| FLM_REAL_DB_REFERENCE_DISCOVERY | **PASS_REFERENCE_SOURCE_READ_ONLY** | BEGIN READ ONLY，写入=0（§5） |
| VERTICAL_SLICE_E2E | **PASS_REAL_SYSTEM** | 迁移→seed→HTTP→export→发现链路（§6） |
| AMBIGUITY_E2E | **PASS_REAL_SYSTEM** | dirty 链路 review_flags 生效（§3/§6） |
| FAMILY_DB_MUTATIONS | **0** | 无 Family 正典库任何写入 |
| BLOCKERS | **0** | 代码 Gate blockers=[] |

---

## 2. Fresh DB 迁移（真实 PostgreSQL）

- 目标库：`family_legacy`（`LEGACY_DATABASE_URL` 专用，禁止 `DATABASE_URL`/`TEST_DATABASE_URL` 回退，工具已 fail-closed）
- `legacy-db.mjs reset` → applied：`0001_fels0_schema.sql`、`0002_fels1_core_business.sql`、`0003_fels1_program_lifecycle.sql`（applied 3 FELS migrations）
- `legacy-db.mjs migrate` → `no pending FELS migrations`
- 结论：**PASS_REAL_POSTGRESQL**（从零可重建）

> 注：`0003` 内含早期 FELS-2/3 表；迁移执行不等于授权其能力。早期表仅作负向语义测试，见 §5 / §7。

---

## 3. Clean / Dirty Seed（真实 PostgreSQL）

### Clean（授权 FELS-1 对象计数）
customers=12, contacts=12, students=12, student_guardians=12, assessment_templates=1, assessment_sessions=12, assessment_scores=48, assessment_reports=12, courses=1, products=1, orders=12, order_items=12, payments=12, enrollments=12, consent_records=12, source_snapshots=1 → **CLEAN_SEED_DB PASS**

### Dirty（歧义证据，未提升为 Family 真相）
- `duplicate_phone_count = 1`
- `cross_customer_guardian_count = 1`
- `weak_or_incomplete_consent_count = 1`
- `review_flags = [IDENTITY_REVIEW_REQUIRED, CONSENT_REVIEW_REQUIRED]`
- `mode = READ_ONLY`，`real_bangyang_source = false`
- 结论：**DIRTY_SEED_DB PASS** —— 重复/缺失身份/歧义监护人/弱同意仅被**标记待复核**，未写入任何 Family 正典对象。

---

## 4. 真实 HTTP + Export（只读边界）

服务：`node dist/apps/api/src/server.js`（`FELS reference HTTP API listening ... read-only, family_legacy`）

| 请求 | 结果 |
|---|---|
| `GET /health` | 200，`status:ok`，`realBangyangSource:false`，`readyForFels1:true`，`startFels1:false` |
| `GET /legacy-export` | 200，`source_kind:REFERENCE_IMPLEMENTATION`，`mode:READ_ONLY`，entities 含 customers/students/assessments/orders/consents + 早期 programs/tasks/checkins/advisor-notes/memberships |
| `GET /legacy-export/customers` | 200，items=12，source_system=FELS |
| `GET /legacy-export/programs` | items=1，`semantic_classification:LEGACY_PROGRAM_NOT_JOURNEY` |
| `GET /legacy-export/tasks` | count=3，`LEGACY_TASK_NOT_GROWTH_ACTION` |
| `GET /legacy-export/checkins` | count=36，`LEGACY_CHECKIN_NOT_OUTCOME` |
| `GET /legacy-export/advisor-notes` | count=12，`LEGACY_ADVISOR_TEXT_NOT_FACT` |
| `GET /legacy-export/memberships` | count=12，`LEGACY_MEMBERSHIP_STATE` |
| `GET /legacy-export/nope`（未知实体） | **404** |
| `POST /legacy-export/customers` | **405**（只读边界 FELS_READ_ONLY 生效） |

结论：**CORE_REAL_HTTP_API / EXPORT_REAL_HTTP_API = PASS_REAL_HTTP**

---

## 5. H006 — FLM 只读参考发现（真实 DB）

探针：`tools/flm-readonly-discovery.mjs`（每查询 `BEGIN READ ONLY`）

- `snapshot_id = snp_0260`，`source_system=FELS`，`source_schema=fels`，`mode=READ_ONLY`
- FELS-1 授权实体（8）：customers=12, contacts=12, students=12, student_guardians=12, assessment_scores=48, assessment_reports=12, orders=12, consent_records=12 → 授权行合计 **132**，`exportable_count=132`，`rejected_or_unknown_count=0`
- identity_profile（clean 基线）：duplicate_phone=0, cross_customer_guardian=0, null_contact_name=0
- consent_profile：legacy_consent_count=12, weak_or_incomplete=0
- 早期 FELS-2/3（负向语义，仅记录）：training_camps/daily_tasks/task_checkins/advisor_notes（EARLY_FELS2）+ memberships（EARLY_FELS3），全部 `disposition=QUARANTINE_PENDING`、`exportable_as_fels1=false`

**护栏（H006 断言全 0）：**
`FAMILY_DB_WRITE_COUNT=0`、`SHADOW_IMPORT=0`、`CANONICAL_IMPORT=0`、`IDENTITY_PROMOTION=0`、`CONSENT_PROMOTION=0`

结论：**FLM_REFERENCE_DISCOVERY_DB=PASS_REAL_DB_READ / FLM_REAL_DB_REFERENCE_DISCOVERY=PASS_REFERENCE_SOURCE_READ_ONLY**

---

## 6. H007 — 语义隔离 Gate（Family Ontology 零污染）

对每个 legacy 对象验证其**语义否定**（legacy ≠ Family 正典），并确认无任何提升路径：

| Legacy 对象 | 语义否定 | 载体证据 | 计数 |
|---|---|---|---|
| Customer | Customer ≠ Family | export source_system=FELS，无 Family 写 | 0 提升 |
| Contact | Contact ≠ Parent | semantic_classification=LEGACY_RELATIONSHIP_EVIDENCE | 0 提升 |
| Student | Student ≠ Child | 无 Family Child 写入 | 0 提升 |
| AssessmentScore | AssessmentScore ≠ GrowthState | 无 GrowthState 写入 | 0 提升 |
| LegacyReport | LegacyReport ≠ Fact | Report 仅 export，不入 Ontology | 0 提升 |
| LegacyConsent | LegacyConsent ≠ Family consent | CONSENT_EVIDENCE_CANDIDATE | 0 提升 |
| LegacyTask（早期） | LegacyTask ≠ GrowthAction | LEGACY_TASK_NOT_GROWTH_ACTION | 0 提升 |
| LegacyCheckIn（早期） | LegacyCheckIn ≠ Outcome | LEGACY_CHECKIN_NOT_OUTCOME | 0 提升 |
| AdvisorNote（早期） | AdvisorNote ≠ Fact | LEGACY_ADVISOR_TEXT_NOT_FACT | 0 提升 |
| Membership（早期） | Membership ≠ Family state | LEGACY_MEMBERSHIP_STATE | 0 提升 |

**语义隔离计数器：**
`FAMILY_ONTOLOGY_POLLUTION=0`、`LEGACY_SCORE_TO_GROWTH_STATE=0`、`LEGACY_CHECKIN_TO_OUTCOME=0`、`ADVISOR_NOTE_TO_FACT=0`、`LEGACY_AI_TO_FACT=0`、`FAMILY_CANONICAL_WRITE=0`

> 早期 FELS-2/3 对象仅作**负向语义测试**存在，**不代表 FELS-2/3 已开放**。
结论：**H007 PASS**

---

## 7. H008 — 真实端到端 Gate

链路：`HTTP → FELS API → family_legacy(PostgreSQL) → Legacy Export → FLM 只读发现`

| 环节 | 结果 |
|---|---|
| REAL_POSTGRESQL | PASS（§2/§3） |
| REAL_HTTP | PASS（§4） |
| REAL_EXPORT | PASS（§4） |
| READ_ONLY_DISCOVERY | PASS（§5，BEGIN READ ONLY，写=0） |
| FRESH DB（零→迁移→seed→HTTP→export→发现，无回退） | PASS |
| CLEAN + DIRTY 均真实 PostgreSQL | PASS（§3） |

结论：**H008 PASS_REAL_SYSTEM**

---

## 8. FELS-1 Runtime Implemented（n/55，仅计 IMPLEMENTED_FELS1）

| 分类 | 计数 |
|---|---|
| **IMPLEMENTED_FELS1** | **10** |
| PLANNED_FELS2 | 6 |
| PLANNED_FELS3 | 4 |
| PLANNED_FELS4 | 23 |
| EXTERNAL_INTEGRATION | 8 |
| RETIRED | 2 |
| FAMILY_NEW_CAPABILITY | 2 |
| 合计 | 55 |

**FELS1_RUNTIME_IMPLEMENTED = 10/55** （**未**用 PLANNED_FELS2/3 灌水；migrationMatrixClassified=55/55）

---

## 9. 授权边界（未越界）

- FELS-1 PASS **不自动授权 FELS-2**。`readyForFels2=NO`、`startFels2=NO`。
- FELS-2 / FELS-3 / FELS-4 / FELS-5 = **NOT_AUTHORIZED**。
- 无 FLM 迁移：`FLM_DISCOVERY=READ_ONLY`，shadow/canonical import = NOT_AUTHORIZED。
- Family Core / Growth OS / Principal / WAF / IAM 改动 = 0（本轮未触碰）。
- 早期 FELS-2/3 代码：`LOCAL_QUARANTINE_PENDING`，`DO_NOT_MERGE_AS_CAPABILITY`。

---

## 10. 最终建议

FELS-1 真实系统收口条件全部成立（真实 PostgreSQL / HTTP / export / 只读发现 + Family 写入=0 + blockers=0）。
建议将 **FELS-1** 由 `PASS_CODE_VALIDATED` 升级为 **`PASS_REAL_SYSTEM_VALIDATED`**，并**关闭 FELS-1 Real System Gate**。
后续 FELS-2 起步须由总架构师**单独显式授权**；早期 FELS-2/3 资产保持隔离冻结，未来授权时另起会话正向拆分（不改写他人已 push 历史）。
