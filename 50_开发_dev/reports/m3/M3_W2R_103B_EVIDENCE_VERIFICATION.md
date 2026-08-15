# M3-W2R-103B Evidence Verification Report

```text
DOC_KIND = EVIDENCE_VERIFICATION
RULING   = M3-W2R-CONV-001(总架构师批准来源)
DATE     = 2026-08-14
INTERVENTION = LISTEN_BEFORE_RESPOND(唯一;NEW_INTERVENTION=0)
SSOT     = 20_知识_knowledge/library/*.yaml + byresearch/evidence.py
GATE     = python_evidence_gate = PASS(compile_principal_bundle.py)
```

> 两层拆分:**Evidence.decisive**(研究结论层:THIRD_PARTY_REAL + 足够 Grade + 可追溯出处 = 可对"研究主张"decisive)
> ≠ **family_decision_non_decisive**(家庭决策层:研究证据永不直接决定某个家庭必须做什么)。
> DOI 存在时期刊文章不要求页码(裁决 §五)。

---

## 1. METHOD 主证据(MD-001 先连接再纠正)

```text
evidence_id      = TinT-2015
authors          = Havighurst, Kehoe, Harley
title            = Tuning in to Teens: improving parental responses to anger and reducing youth externalizing behavior problems
year             = 2015
journal          = Journal of Adolescence
DOI              = 10.1016/j.adolescence.2015.04.005
source_url       = https://pubmed.ncbi.nlm.nih.gov/26005933/
study_design     = 以学校为单位随机分配(cluster-randomized)干预/控制
sample_n         = 225 主要照顾者 / 224 青少年
population        = 青少年家长与青少年
target_age       = adolescence(与本方法目标直接相关)
claim_supported  = 情绪聚焦的家长干预可改善家长情绪社会化实践,并可能降低家庭冲突/青少年外化问题
claim_not_supported = "先听再回应一定有效" / "今晚复述一句必然改善关系"
grade            = E7
provenance       = THIRD_PARTY_REAL
evidence_role    = METHOD_EFFECT
directness       = DIRECT_OR_NEAR_DIRECT
limitations      = 干预为整套项目,非单一微动作;效应量与长期维持需另述
verified_at      = 2026-08-14(DOI/PMID 元数据核验;页码非必需)
```

## 2. METHOD 机制补充(MD-001)

```text
evidence_id      = TinT-2020-mechanism
title            = Tuning in to Teens: investigating moderators and mechanisms of change
year             = 2020
journal          = Developmental Psychology
DOI              = 10.1037/dev0000875
source_url       = https://pubmed.ncbi.nlm.nih.gov/32077729/
study_design     = 基于随机分配学校数据的中介/调节分析
claim_supported  = 家长情绪觉察/调节与情绪社会化变化,中介青少年内化问题改善
grade            = E6   # claim-specific 降级:试验随机,但"中介机制"不因 RCT 自动完全因果
provenance       = THIRD_PARTY_REAL
evidence_role    = MECHANISM_SUPPORT
verified_at      = 2026-08-14
```

## 3. CONSTRUCT 支撑(CN-002 防御/强制互动循环)

```text
evidence_id      = Coercive-2014
title            = Coercive family process and early-onset conduct problems from age 2 to school entry
year             = 2014
journal          = Development and Psychopathology
DOI              = 10.1017/S0954579414000169
source_url       = https://pubmed.ncbi.nlm.nih.gov/24690305/
study_design     = 观察性(直接观察 caregiver-child coercive interactions)
sample_n         = 731
population        = 2 岁至入学儿童及照顾者(早期儿童)
claim_supported  = 可观察的强制/防御互动循环与后续对立/不顺从行为相关
claim_not_supported = "12-15 岁所有顶嘴都源自强制循环"
grade            = E6
provenance       = THIRD_PARTY_REAL
evidence_role    = CONSTRUCT_SUPPORT
directness       = INDIRECT(早期儿童→青少年 外推 LIMITED)
verified_at      = 2026-08-14
```

## 4. THEORY 背景(TH-001,非效果证据)

```text
Rogers-1957
  DOI = 10.1037/h0045357 ; https://pubmed.ncbi.nlm.nih.gov/13416422/
  grade = E2 ; provenance = THIRD_PARTY_REAL
  evidence_role = THEORY_BACKGROUND ; effect_claim_allowed = NO
  用途:共情性理解概念源流;不作为 LISTEN_BEFORE_RESPOND 有效性证据。gate(E4)=FAIL(正确:非 decisive-for-effect)

Gottman-Katz-Hooven-1996
  status = VERIFY_EXACT_SOURCE ; grade(拟) = E6 ; provenance = UNVERIFIED(→ NON_DECISIVE)
  须经 APA/PsycNet 或原始 DOI 核验完整书目后方可升 THIRD_PARTY_REAL/E6;当前不进 decisive 集。

Gottman & DeClaire 1997(书)
  = BACKGROUND_REFERENCE only;不进 decisive 集。
```

## 5. MODALITY(MM-001)

```text
evidence = [](暂无 decisive 外部证据;工具信效度版本待选定核验)。诚实留空,不赋级。
minors_handling / privacy_risk 已按合规红线声明(视频含未成年人:默认不采原始音视频,仅脱敏结构化信号,单独 consent)。
```

---

## 6. Python Evidence Gate 结果(compiled bundle evidence_summary)

```text
python_evidence_gate        = PASS
library_validate_errors     = 0
external_verified_count     = 4
adolescent_direct_evidence  = 2  (TinT 2015/2020,tag=adolescence)
method_evidence_max_grade   = E7
construct_external_evidence  = 1  (CN-002)
unverified_decisive_evidence = 0
fake_or_missing_source      = 0
highest_grade               = E7
has_third_party_real        = true
```

诚实分布(不伪装每节点 E7):MD-001=E7 · CN-002=E6 · TH-001=E2(背景)· CN-001=E0(有限)· MM-001=E0。

## 7. 不变量

```text
Research Evidence ≠ Family Fact ≠ Family Decision;每节点 family_decision_non_decisive=true。
Model Recommendation ≠ Human Decision ≠ GrowthAction;GrowthAction 仍须过 Named Action 边界。
FAMILY_CANONICAL_WRITES = 0 ; NEW_INTERVENTION = 0 ; NEW_GROWTH_DIMENSION = 0 ; NEW_PROVIDER = 0。
```
