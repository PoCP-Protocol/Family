# ADR: 对象 + 属性树 + 生成式 迁移架构 V1

```text
STATUS = PROPOSED (FLM-AC-002 §26–30, 2026-08-14)
SCOPE = 全平台上位约束(family / FES / FLM / FELS)
AUTHORITY = 用户定调"对象+属性树+生成式AI构建的平台" + 开发令 FLM-AC-002
GENERATIVE_MODEL_RUNTIME = NOT_AUTHORIZED (本 ADR 只定义,不接模型)
```

## 背景

平台构建基座定为 **对象 + 属性树 + 生成式AI**。其真正的力量不是"让 AI 什么都决定",而是:
让**对象与属性**保持世界的真实性,让**确定性规则**保护不可逾越的边界,让**生成式模型**只处理规则无法提前枚举的语义空间。该模式将在 Family 做 C2C / B2C / 多租户 / 机构接入 / 旧系统接入(FLM)时反复复用。

## 决策：四层

```text
Layer 1  Object                             —— 有身份/链接的对象(世界的真实实体)
Layer 2  Attribute Tree                      —— 少类型 + 属性 + 规则爆变体(非固定列/深分类树)
Layer 3  Deterministic Semantic Guardrails   —— 写死的红线(RETIRE/REJECT/掉级/consent/schema)
Layer 4  Generative Mapping Proposal         —— 仅处理规则枚举不了的语义空间,产出"建议",非决定
```

## 执行顺序

```text
Legacy Object
  ↓
Attribute Tree
  ↓
Known Mapping Registry
  ↓
Deterministic Guardrail
  ↓
if known:      TRANSFORM / RETIRE / REJECT
  ↓
if unknown/ambiguous:  GenerativeMappingProposal
  ↓
Human Review
  ↓
Approved Mapping Registry
```

FELS-4/FLM-AC-001 的 `FELS4_LEGACY_ATTRIBUTE_MAP` + `rejectSemanticPollution` 即 Layer 2/3 的首个实例:
属性节点携带 `semantic_classification`(FLM metadata,非旧业务真相),护栏读注册表做确定性裁决;
`family_score/ranking→RETIRE`、旧AI→Hypothesis、旧标签→Annotation 等均在 Layer 3,不进 Layer 4。

## AI 不能做什么（冻结）

```text
GenerativeProposal   != ApprovedMapping
ModelConfidence      != MigrationAuthorization
AIInference          != Fact
AI cannot write Family canonical
AI cannot create new authorization
```

## GenerativeMappingProposalV1（仅定义,REAL_MODEL_CALLS = 0）

```text
GenerativeMappingProposalV1 {
  source_object
  source_attribute
  source_value_ref
  observed_semantics

  proposed_target_object
  proposed_target_attribute
  proposed_truth_type          // Fact | Perspective | Hypothesis | Evidence | Annotation | RETIRE
  proposed_disposition         // TRANSFORM | MIGRATE | INTEGRATE | RETAIN_AND_REORGANIZE | RETIRE | REJECT

  reason_summary
  uncertainties
  evidence_refs
  confidence
}
```

约束:本阶段不接任何生成式模型(`REAL_MODEL_CALLS = 0`)。该结构仅为 Layer 4 的接口契约,
待未来 Generative Mapping Gate 授权后,由 Model Gateway 产出 proposal → 人工复核 → 写入 Approved Mapping Registry。
proposal 永不直接改 Family canonical,也永不自行产生授权。

## 影响

- 所有旧系统接入(FLM)、C2C/B2C 对象建模、多租户、机构接入统一走此四层。
- 护栏永远优先于生成式:生成式只在"规则不知道怎么办"时被调用,且输出必须过人工与注册表。
- 与证据治理(evidence.py 的 E0–E7 / NON_DECISIVE 门)同频:proposal 的 confidence/evidence 不等于结论成立。
