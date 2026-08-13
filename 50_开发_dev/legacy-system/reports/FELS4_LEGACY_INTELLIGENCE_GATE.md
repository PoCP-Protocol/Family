# FELS-4 脏世界 / 旧智能 Gate 报告

> 依据：总架构师 signoff **2026-08-13**（`reports/FELS2_AUTHORIZATION_REQUEST.md`）——
> `AUTHORIZE_FELS2=NO`、`FELS4_PRIORITY=BEFORE_FELS2`、`EARLY_FELS23_DISPOSITION=POSITIVE_SPLIT`、`LM1=PROMOTE_REVIEWED`。
> 平台基座：**对象 + 属性树 + 生成式AI**（护栏写死，智能生成式）。旧世界源忠实僵化；FLM 判定用声明式属性-迁移注册表（数据驱动），生成式 FLM 映射建议延后到已授权导入阶段。
> 验证方式：`tsc` 全绿 + `vitest` 单测（domain-runtime）+ 脏 seed 运行。**真实 PostgreSQL / HTTP / FLM DB 污染扫描待独立 `LEGACY_DATABASE_URL`**（当前 DB 测试自动 skip，fail-closed）。
> Family 正典库写入 = **0**；无 shadow/canonical import；不碰真实邦阳源（`SUSPENDED_NOT_BLOCKED`）。
> 分支 `fels/fels4-dirty-world`（基线=`fels/fels1-closure` HEAD）；仅追加提交，未改写任何已 push 历史；未碰他会话 WIP。

---

## 1. Gate 汇总

| Gate 项 | 结果 | 证据 |
|---|---|---|
| FELS4 | **PASS_CODE_VALIDATED** | §2–§5;api 15/15 + contracts 10/10 vitest 通过 |
| LEGACY_AI | **PASS** | `legacy_ai_reports` = `LEGACY_AI_HYPOTHESIS_NOT_FACT`（§3） |
| LEGACY_SCORE | **PASS** | `family_score → RETIRE`，非 GrowthState（§4） |
| LEGACY_RANKING | **PASS** | `ranking → RETIRE`，非 Family canonical（§4） |
| DIRTY_SCENARIOS | **52（≥50）** | `FELS_DIRTY_SCENARIOS` D001–D052（§2） |
| FLM_REJECTS_SEMANTIC_POLLUTION | **PASS** | `rejectSemanticPollution`：violations=0，护栏计数全 0（§4） |
| FAMILY_DB_MUTATIONS | **0** | 只读裁决，无 Family 写入 |
| BLOCKERS | **0** | — |
| 真实 DB/HTTP/FLM 扫描 | **NOT_YET_RUN** | 无独立 `LEGACY_DATABASE_URL`（§6） |

---

## 2. 数据模型与脏场景（FELS-401 / 404）

- 迁移 `db/migrations/0004_fels4_legacy_ai_analytics.sql`：`fels.legacy_profiles`（含 family_type/family_score/ranking/customer_level/student_level）、`legacy_tags`、`legacy_ai_reports`（ai_conclusion/has_supporting_evidence）、`legacy_alerts`（risk_score/severity/legacy_disposition）。列式严格沿用 0002/0003；每表默认 `semantic_classification` 为对应 NOT_* 护栏常量。
- 脏场景：`FELS_DIRTY_SCENARIOS` 由 20 扩至 **52**（D021–D052 覆盖 family_score/ranking present、越界、无证据AI诊断、诊断/事实/临床化措辞、自伤信号、矛盾预警、永久人格标签、旧标签当诊断、旧分当 GrowthState 等污染向量）。
- `createFels4DirtyDataset()` 实际注入计数（domain-runtime seed）：profiles=6, tags=7, ai_reports=7, alerts=7。

## 3. 语义保真（FELS-402）

每个旧智能对象由 runtime 强制打上 NOT_* 语义分类，export 只读透传：

| 对象 | semantic_classification | Family 语义否定 |
|---|---|---|
| legacy_profile | `LEGACY_PROFILE_SNAPSHOT_NOT_STATE` | 旧画像快照 ≠ GrowthState |
| legacy_tag | `LEGACY_TAG_CATEGORY_NOT_OFFICIAL` | 旧标签 = Annotation ≠ Diagnosis |
| legacy_ai_report | `LEGACY_AI_HYPOTHESIS_NOT_FACT` | 旧AI结论 = Historical Hypothesis ≠ Fact |
| legacy_alert | `LEGACY_ALERT_SIGNAL_NOT_THRESHOLD` | 旧预警 = 信号源 ≠ Family Safety 阈值/自动动作 |

## 4. FLM 语义污染拒绝（FELS-403，护栏）

`rejectSemanticPollution(runtime)`（只读，数据驱动，不用正则猜自由文本）实际输出（dirty 数据集）：

```text
fels_rejects_semantic_pollution = PASS
violation_count = 0
retire_disposition_count = 4      (2 脏 profile 的 family_score + ranking)
retired_attributes = [legacy_profile.family_score, legacy_profile.ranking]
guardrail_counters = {
  LEGACY_SCORE_TO_GROWTH_STATE: 0,
  LEGACY_RANKING_TO_FAMILY: 0,
  LEGACY_AI_TO_FACT: 0,
  ADVISOR_NOTE_TO_FACT: 0,
  FAMILY_CANONICAL_WRITE: 0,
}
generative_flm_mapping = DEFERRED_TO_AUTHORIZED_IMPORT
mode = READ_ONLY
```

护栏确实会咬：单测将一个 ai_report 的分类篡改为 `FAMILY_FACT` 后，`fels_rejects_semantic_pollution=FAIL` 且命中 `AI_REPORT_MUST_BE_HYPOTHESIS`——证明拒绝层非空跑。

映射规则（写入 `contracts` 的 `FELS4_LEGACY_ATTRIBUTE_MAP`）：
`family_score→RETIRE`、`ranking→RETIRE`、`legacy label→LEGACY_ANNOTATION`、`assessment score→HISTORICAL_EVIDENCE`、`legacy AI conclusion→HISTORICAL_AI_HYPOTHESIS`、`advisor_note→PERSPECTIVE`、`alert→SAFETY_SIGNAL_SOURCE`。

## 5. 测试

- `@family/fels-api`：**15/15** vitest 通过（含 5 个 FELS-4 新测：语义保真、≥50 脏场景、拒绝 PASS、护栏咬人、FLM 只读）。
- `@family/fels-contracts`：**10/10** 通过（脏场景断言更新为 ≥50）。
- `http-server.spec.ts`：新增 FELS-4 export 保真测试(profiles/tags/ai-reports/alerts)——**DB 相关 7 项在无 `LEGACY_DATABASE_URL` 时自动 skip**。

## 6. 未跑 / 待独立库（诚实）

- `CLEAN_SEED_DB / DIRTY_SEED_DB / EXPORT_REAL_HTTP_API / FLM_DB_POLLUTION_SCAN = NOT_YET_RUN`。原因：本机无独立 `LEGACY_DATABASE_URL`（与 FELS-1 同一 truthful blocker）。
- `flm-readonly-discovery.mjs` 已扩 FELS-4 只读污染扫描段（`semantic_pollution_scan` + 4 项污染护栏计数），但需真实 DB 方可跑出证据；届时另出 `FELS4_REAL_SYSTEM_CLOSURE` 增补。

## 7. 授权边界（未越界）

- FELS-4 = AUTHORIZED；**FELS-2 / FELS-3 / FELS-5 = NOT_AUTHORIZED**。
- 早期 FELS-2/3 六表（camp/task/checkin/advisor/membership）本轮**未动**，维持 `QUARANTINE_PENDING / DO_NOT_MERGE`；POSITIVE_SPLIT 待 FELS-2 授权时另起会话执行（不改写他人历史）。
- 生成式 FLM 映射、shadow/pilot/canonical import = 延后/未授权。
- Family Core / Growth OS / Principal / M2 语义 / 他会话 WIP 改动 = 0。

## 8. 最终建议

FELS-4 代码级条件全部成立（脏场景≥50、污染拒绝 PASS、护栏计数全 0、Family 写入=0、blockers=0）。建议记 **FELS-4 = PASS_CODE_VALIDATED**；真实系统闭环（DB/HTTP/FLM 扫描）待独立 `LEGACY_DATABASE_URL` 后按 FELS-1 收口先例单独出增补报告。
