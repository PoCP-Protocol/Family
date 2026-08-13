# FLM-AC-002 真实参考源验证 Gate 报告

> 依据外部开发令 **FLM-AC-002**(2026-08-14)。本报告固化"真实独立 PostgreSQL / HTTP / FLM 只读防腐闭环"证据。
> 分支 `flm/anti-corruption-dirty-world`(基线=冻结 SHA `63232021`);仅追加提交,未改写任何已 push 历史,未并 master。
> Family 正典库写入 = **0**(真实 before/after 指纹证明,非自报)。

---

## 0. 环境（真实独立库）

```text
PostgreSQL server = docker 50__dev-postgres-test-1 (postgres:15) @ 127.0.0.1:53246
LEGACY_DATABASE_URL = postgres://family:family@127.0.0.1:53246/family_legacy_dirty   (独立 database)
DATABASE_URL        = postgres://family:family@127.0.0.1:53246/family_test
TEST_DATABASE_URL   = postgres://family:family@127.0.0.1:53246/family_test
独立性断言 = PASS (LEGACY_DATABASE_URL != DATABASE_URL != TEST_DATABASE_URL;工具 fail-closed 生效)
```

## 1. Gate 汇总

| Gate 项 | 结果 |
|---|---|
| FLM_AC_002 | **PASS** |
| FRESH_REFERENCE_DB | **PASS**（空库 → 0001→0002→0003→0004 → pending=0） |
| CLEAN_SEED_DB | **PASS** |
| DIRTY_SEED_DB | **PASS** |
| REAL_HTTP | **PASS**（7 real-HTTP 测试真跑，5.8s） |
| REAL_EXPORT | **PASS**（profiles/tags/ai-reports/alerts 带 source_schema_version+acceptance_surface+semantic_classification） |
| REAL_READONLY_DISCOVERY | **PASS**（BEGIN READ ONLY；guardrails 全 0） |
| SEMANTIC_POLLUTION_ATTACKS | **PASS**（13 向量矩阵 + rejectSemanticPollution=PASS + 3 条 mutation 必 FAIL） |
| FAMILY_CANONICAL_DELTA | **0**（真实 before/after 指纹） |
| SHADOW_IMPORT / CANONICAL_IMPORT | **0** |
| BLOCKERS | **0** |

## 2. Fresh Reference DB

```text
reset → applied 0001_fels0_schema / 0002_fels1_core_business / 0003_fels1_program_lifecycle / 0004_flm_dirty_world_reference
migrate → no pending FELS migrations
FRESH_REFERENCE_DB = PASS
```

## 3. Clean / Dirty Seed（真实写入 family_legacy_dirty）

- CLEAN：legacy_profiles=4, legacy_tags=4, legacy_ai_reports=4, legacy_alerts=4（+ 核心 FELS-1/早期表）。
- DIRTY：legacy_profiles=6, legacy_tags=7, legacy_ai_reports=7, legacy_alerts=7；并含身份脏数据(重复手机号/弱同意/歧义监护人/旧打卡) → `review_flags = [IDENTITY_REVIEW_REQUIRED, CONSENT_REVIEW_REQUIRED]`。
- 覆盖脏向量:family_score / ranking / 永久标签 / 无证据AI诊断 / AI结论无证据 / risk_score / severity / 矛盾预警 / duplicate phone / weak consent / ambiguous guardian / legacy checkin。

## 4. Real HTTP + Export

`vitest http-server.spec.ts` 对真实 PG 全通过(7/7)。示例断言:
- `GET /legacy-export/customers` → source_system=FELS, source_schema_version=fels-ref-0004, acceptance_surface=FELS1, items≥10, semantic_classification=LEGACY_DERIVED。
- `GET /legacy-export/profiles` → acceptance_surface=**FLM_DIRTY_WORLD**, semantic_classification=LEGACY_PROFILE_SNAPSHOT_NOT_STATE；tags/ai-reports/alerts 同理 NOT_*。
- 非 GET → 405（FELS_READ_ONLY）；未知实体 → 404。

## 5. FLM 只读发现 + 语义污染扫描（真实 DB）

```text
mode = READ_ONLY ; real_bangyang_source = false
fels4_dirty_world_entities: profiles=6, tags=7, ai_reports=7, alerts=7
semantic_pollution_scan = {
  family_score_present_count: 2, family_score_disposition: RETIRE,
  ranking_present_count: 2,     ranking_disposition: RETIRE,
  legacy_ai_without_evidence_count: 3,
  mismarked_pollution_count: 0,
  fels_rejects_semantic_pollution: PASS
}
guardrails = {
  FAMILY_DB_WRITE_COUNT: 0, SHADOW_IMPORT: 0, CANONICAL_IMPORT: 0,
  IDENTITY_PROMOTION: 0, CONSENT_PROMOTION: 0,
  LEGACY_SCORE_TO_GROWTH_STATE: 0, LEGACY_RANKING_TO_FAMILY: 0,
  LEGACY_AI_TO_FACT: 0, ADVISOR_NOTE_TO_FACT: 0
}
```

## 6. Pollution Attack Matrix（§24）+ Mutation（§25）

`flm-anti-corruption.spec.ts`:13 向量全部 REJECT/RETIRE(family_score/ranking→RETIRE、tag/ai/alert/advisor→非Fact/非诊断、checkin→非Outcome、course complete→非growth、same phone→REVIEW 不自动并户、legacy consent/minor→不自动授权、success_case→CausalEpisode FORBIDDEN)。
Mutation:把 semantic_classification 篡改为 `FAMILY_FACT` / `GROWTH_STATE` / `FAMILY_SAFETY_THRESHOLD` 均使 `rejectSemanticPollution` = **FAIL**(护栏确实会咬)。

## 7. Family Canonical 前后指纹（§23，比"自报 write=0"更有力）

对 Family 正典库 `family_test` 8 表,在整套 legacy reset/seed/http/scan **前后**分别计数:

```text
before = {families:1, persons:0, consents:0, growth_profiles:0, growth_priorities:0, intervention_episodes:0, growth_actions:0, outcomes:0}
after  = {families:1, persons:0, consents:0, growth_profiles:0, growth_priorities:0, intervention_episodes:0, growth_actions:0, outcomes:0}
delta  = 0 (全表)
```

## 8. 测试总量

```text
@family/fels-contracts: 10/10 PASS
@family/fels-api: 40/40 PASS (domain-runtime 33 + real-HTTP 7)
```

## 9. 授权边界（未越界）

- FELS4_FULL_BUILD / FELS2 / FELS3 / FELS5 = NOT_AUTHORIZED；只做 FLM_AC_001/002 授权内工作。
- 生成式映射运行时 = NOT_AUTHORIZED（ADR 只定义 GenerativeMappingProposalV1，REAL_MODEL_CALLS=0）。
- shadow/pilot/canonical import = 未授权；真实邦阳源 SUSPENDED。
- 早期 FELS-2/3 六表未动（QUARANTINE）；未碰 Family Core/Principal/M2/多租户/他会话 WIP。
- 未改写已 push 历史；不并 master（分支继承 fels1-closure 历史，含早期混合资产，需另做 FLM_INTEGRATION_001 从干净 master 正向选择）。

## 10. 建议

FLM-AC-002 全部通过标准成立(见 §1)。建议 **FLM_AC_002 = PASS**。下一步不应立即续造 FELS-2/FELS-4;FLM/FELS 转 P1 平行线,主线转 TENANCY-001 / W2R-101。等待总架构师裁决,不自动进入下一 Gate。
