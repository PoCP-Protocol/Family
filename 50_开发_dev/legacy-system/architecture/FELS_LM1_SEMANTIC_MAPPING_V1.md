# FELS ↔ Family LM1 语义映射 V1

```text
STATUS = LM1_MAPPING_REVIEWED_FOR_FELS_REFERENCE   (总架构师批准 FLM-AC-002)
CONFIRMED_AGAINST_REAL_BANGYANG_SOURCE = NO        (真实源 SUSPENDED_NOT_BLOCKED)
AUTHORIZES_IMPORT = NO
GENERATIVE_MAPPING_RUNTIME = NOT_AUTHORIZED
SOURCE_SCHEMA_VERSION = fels-ref-0004
```

> 本文件仅对 **FELS 参考源** 完成映射复核;不确认对真实邦阳源的映射,不授权任何 shadow/pilot/canonical 导入。
> V0.1 草稿属历史证据,保留在证据分支,不并入 clean master。

---

## 0. 方法与口径

- 迁移是语义迁移,不是 ETL。旧对象分类为 `TRANSFORM / MIGRATE / INTEGRATE / RETAIN_AND_REORGANIZE / RETIRE`。
- 旧结论一律掉一级:旧标签→Legacy Annotation;旧测评分→Historical Evidence;旧 AI 诊断→Historical AI Hypothesis;旧打卡→Historical Action check-in Evidence。
- 护栏写死,智能生成式(见 ADR_OBJECT_ATTRIBUTE_GENERATIVE_MIGRATION_V1):红线映射是确定性护栏;规则无法枚举的语义空间才交给未来 `GenerativeMappingProposal`(人工复核+批准注册表),本阶段不接模型。
- 榜样教育自家素材/产出上限 E1,不能自证。

## 1. 关键语义纠正（已复核）

```text
M014 legacy_checkin  -> HistoricalActionCheckInEvidence (TRANSFORM)
     FREEZE: LegacyCheckIn != GrowthActionCompletionFact ; != Outcome
M054 audit_log       -> HistoricalEventEvidenceSource + ProvenanceSource
     FREEZE: 不得直接进入因果层
M055 success_case/growth_report -> HistoricalOutcomeEvidenceCandidate
     FREEZE: CausalEpisodeCreation = FORBIDDEN (until Causal Gate)
```

## 2. 波波校长 IP 语义冻结

```text
Legacy Bobo Principal Role  !=  Famili Principal Identity
允许: Legacy service behavior -> reference material -> product requirement
禁止: Legacy role -> identity migration -> Famili Principal
```

## 3. 脏世界红线映射（确定性护栏，对齐 FELS4_LEGACY_ATTRIBUTE_MAP）

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

## 4. 单一真相

逐行对象规则以 `contracts/src/index.ts` 的 `FELS_MIGRATION_MATRIX_COVERAGE`(M001–M055)+ `FELS_TO_FAMILY_MAP` 为准;本文件负责漏斗组织与语义纪律,二者已对齐。

## 5. 授权边界

Family 正典写入=0;不授权导入;不确认真实邦阳源映射;生成式映射运行时=NOT_AUTHORIZED;FELS-2+ 代码=NOT_AUTHORIZED。
