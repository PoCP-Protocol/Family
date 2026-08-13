# FELS ↔ Family LM1 语义映射 V1（纠正版）

```text
STATUS = LM1_V1_PASS_PROPOSED_FOR_REVIEW
STAGE = LM1_SEMANTIC_MAPPING_OVER_FELS_REFERENCE
SUPERSEDES = FELS_LM1_SEMANTIC_MAPPING_DRAFT_V0_1.md (保留为历史,不覆盖)
CONFIRMED_AGAINST_REAL_BANGYANG_SOURCE = NO   (真实源 SUSPENDED_NOT_BLOCKED)
FAMILY_CANONICAL_WRITE = 0
AUTHORIZES_IMPORT = NO
GENERATIVE_MAPPING_RUNTIME = NOT_AUTHORIZED
SOURCE_SCHEMA_VERSION = fels-ref-0004
```

> 依据外部开发令 **FLM-AC-002**(2026-08-14):撤销 V0.1 的 `LM1_MAPPING_REVIEWED`,纠正 M014/M054/M055,新增波波校长冻结条款,并删除已失效的"开放问题需裁决"。本文件内部自洽:不再一边写 REVIEWED 一边留开放问题。
> 本文件仍只是**映射设计**,不授权任何 shadow/pilot/canonical 导入;不确认对真实邦阳源的映射。

---

## 0. 方法与口径

- **迁移是语义迁移,不是 ETL**。旧对象一律分类为 `TRANSFORM / MIGRATE / INTEGRATE / RETAIN_AND_REORGANIZE / RETIRE` 之一。
- **旧结论一律掉一级**:旧标签→Legacy Annotation;旧测评分→Historical Evidence;旧 AI 诊断→Historical AI Hypothesis;旧打卡→Historical Action check-in Evidence。
- **护栏写死,智能生成式**(承接《对象+属性树+生成式》ADR):红线映射(RETIRE/掉级)是确定性护栏;规则无法枚举的语义空间,才交给未来的 `GenerativeMappingProposal`(需人工复核 + 批准注册表),本阶段不接模型。
- 证据口径:榜样教育自家素材/产出上限 **E1**,不能自证。

---

## 1. 三处关键语义纠正（FLM-AC-002 §13–15）

### M014 打卡 legacy_checkin
```text
BEFORE (V0.1, 错误): legacy_checkin → ActionCompletion Event → MIGRATE
AFTER  (V1, 纠正):  legacy_checkin → HistoricalActionCheckInEvidence → TRANSFORM
FREEZE:
  LegacyCheckIn != GrowthActionCompletionFact
  LegacyCheckIn != Outcome
```
理由:直接 MIGRATE 成 ActionCompletion Event 会把"提交过打卡"当成"完成了成长行动的事实",这正是旧世界"打卡率=成长"的陷阱。只能作历史证据,由 Family 侧重新判定。

### M054 审计/研究数据 audit_log
```text
BEFORE: audit_log → Causal Evidence Registry source
AFTER:  audit_log → HistoricalEventEvidenceSource + ProvenanceSource
FREEZE: 不得直接进入因果层
```

### M055 成功案例/成长报告 success_case / growth_report
```text
BEFORE: success_case / growth_report → CausalEpisode candidate
AFTER:  success_case / growth_report → HistoricalOutcomeEvidenceCandidate
FREEZE: CausalEpisodeCreation = FORBIDDEN（直到未来 Causal Gate）
```

---

## 2. 波波校长 IP 语义冻结（FLM-AC-002 §16）

```text
Legacy Bobo Principal Role  !=  Famili Principal Identity

允许: Legacy service behavior → reference material → product requirement
禁止: Legacy role → identity migration → Famili Principal
```
旧世界"波波校长"是一个旧服务行为/话术角色,可作为**产品需求与参考素材**;**不得**把这个旧角色当作身份迁移进新世界的 Famili Principal 数字人身份。

---

## 3. 脏世界红线映射（确定性护栏,承接 FELS4_LEGACY_ATTRIBUTE_MAP）

| 旧字段/对象 | 迁移规则 | 冻结 |
|---|---|---|
| `legacy_profile.family_score` | **RETIRE** | 永不入 Family / 非 GrowthState(M036) |
| `legacy_profile.ranking` | **RETIRE** | 永不入 Family / 无家庭排行(M035) |
| `legacy_profile.family_type/customer_level/student_level` | LEGACY_ANNOTATION | 非固定身份/诊断/GrowthState |
| `legacy_tag.*` | LEGACY_ANNOTATION | 非永久人格标签/诊断 |
| `legacy_ai_report.ai_conclusion` | HISTORICAL_AI_HYPOTHESIS | 非 Fact/诊断/疗效承诺 |
| `legacy_alert.risk_score` | SAFETY_SIGNAL_SOURCE | 非阈值/自动动作;高风险须 Human Gate |
| `legacy_assessment_score.score` | HISTORICAL_EVIDENCE | 非 GrowthState |
| `legacy_advisor_note.note_text` | PERSPECTIVE | 非 Fact |

---

## 4. 完整漏斗映射（保留 V0.1 结构,已并入上述纠正）

阶段 A 获客 / B 测评→旧AI报告 / C 购买 / D 21天(任务·打卡) / E 90天(项目·顾问) /
F 人服务(顾问/助教/波波校长 IP) / G 社群活动 / H 会员裂变 / I 脏世界(RETIRE) / J Family 新能力(证据源)。

> 逐行对象规则以 `contracts/src/index.ts` 的 `FELS_MIGRATION_MATRIX_COVERAGE`(M001–M055)+ `FELS_TO_FAMILY_MAP` 为单一真相;本文件负责漏斗组织与语义纪律,二者已对齐(M014/M054/M055 同步纠正)。

---

## 5. 授权边界（本文件遵守）

- 纯映射设计;Family 正典库写入 = 0;不授权任何导入。
- 不确认对真实邦阳源的映射(真实源 SUSPENDED_NOT_BLOCKED)。
- FELS-2+ 代码 = NOT_AUTHORIZED;早期 FELS-2/3 资产保持冻结。
- 生成式映射运行时 = NOT_AUTHORIZED。
- 状态 `LM1_V1_PASS_PROPOSED_FOR_REVIEW`:提交总架构师复核,非自我批准。
