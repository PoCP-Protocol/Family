# ADR: 对象 + 属性树 + 生成式 迁移架构 V1

```text
STATUS = ACCEPTED_ENGINEERING_PATTERN   (总架构师 FLM-AC-002 裁决)
SCOPE  = FLM = ADOPTED ; FAMILY / TENANCY = CANDIDATE_REUSE_PATTERN
NOTE   = 暂不升级为全平台不可修改宪法;待 TENANCY-001 真正使用一次后再决定是否提升为 Platform Architecture Principle
GENERATIVE_MODEL_RUNTIME = NOT_AUTHORIZED (本 ADR 只定义接口,不接模型)
```

## 背景

平台构建基座:**对象 + 属性树 + 生成式AI**。其力量不是"让 AI 什么都决定",而是:
对象与属性保持世界真实性,确定性规则保护不可逾越边界,生成式模型只处理规则无法提前枚举的语义空间。
将在 Family 做 C2C / B2C / 多租户 / 机构接入 / 旧系统接入(FLM)时复用。

## 决策：四层

```text
Layer 1  Object                             —— 有身份/链接的对象
Layer 2  Attribute Tree                      —— 少类型 + 属性 + 规则爆变体(非固定列/深分类树)
Layer 3  Deterministic Semantic Guardrails   —— 写死红线(RETIRE/REJECT/掉级/consent/schema)
Layer 4  Generative Mapping Proposal         —— 只处理规则枚举不了的语义空间,产出"建议"非决定
```

## 执行顺序

```text
Legacy Object → Attribute Tree → Known Mapping Registry → Deterministic Guardrail
  → if known:      TRANSFORM / RETIRE / REJECT
  → if unknown:    GenerativeMappingProposal → Human Review → Approved Mapping Registry
```

FLM-AC/INTEGRATION 的 `FELS4_LEGACY_ATTRIBUTE_MAP` + `rejectSemanticPollution` 即 Layer 2/3 首个实例:
属性节点带 `semantic_classification`(FLM metadata,非旧业务真相),护栏读注册表做确定性裁决;
`family_score/ranking→RETIRE`、旧AI→Hypothesis、旧标签→Annotation 均在 Layer 3,不进 Layer 4。

## AI 不能做什么（冻结）

```text
GenerativeProposal != ApprovedMapping
ModelConfidence    != MigrationAuthorization
AIInference        != Fact
AI cannot write Family canonical
AI cannot create new authorization
```

## GenerativeMappingProposalV1（仅定义，REAL_MODEL_CALLS = 0）

```text
GenerativeMappingProposalV1 {
  source_object, source_attribute, source_value_ref, observed_semantics,
  proposed_target_object, proposed_target_attribute, proposed_truth_type, proposed_disposition,
  reason_summary, uncertainties, evidence_refs, confidence
}
```
本阶段不接任何生成式模型。proposal 永不直接改 Family canonical,也永不自行产生授权;
待未来 Generative Mapping Gate 授权后由 Model Gateway 产出 → 人工复核 → 写入 Approved Mapping Registry。
