# 课件方法库(Courseware Method Library)V1

```text
SCOPE   = 课件域(family 家庭教育)可复用的 constructs(要培养什么)+ methods(怎么练)
OWNER   = FELS / courseware line
CANON   = 这里不是循证来源的单一真相。verified_sources 的 canonical 在平台
          20_知识_knowledge/library/verified_sources.yaml,由 W2R-103B(Principal AI)硬化。
LINK    = 本库 methods.evidence_refs 用 source_id 引用平台源库;证据分级/门 = evidence.py(E0–E7)。
STATUS  = CONTENT_DRAFT(未接产品 runtime;未经人类专家终审)
```

## 为什么"先建库"(第一性)
好课件的真正资产不是某份文件,而是"**生成式循环 + 不变量**"。不变量具象化 = 这个库:
- **课件 = 从库实例化**(按家庭/冲突/情境把 method 填成话),不是每门课重采证据。
- 证据**采一次、治理一次、复用无数次**;生成式只在"库里没有"时触发采集,采完沉淀回库(策展核心库 + 及时收集 + 飞轮)。

## 分层(与平台 20_知识 对齐)
```
theories       理论                → 平台 20_知识/library/theories.yaml
constructs     构念(要培养什么)   → 本库 constructs.yaml
methods        方法(怎么练)       → 本库 methods.yaml(课件技能从此取)
modalities     形态(小事/话术/观察)→ lesson_template(见 COURSEWARE_AUTHORING_METHOD)
verified_sources 循证来源(DOI)     → 平台 20_知识/library/verified_sources.yaml(W2R-103B,canonical)
```

## 边界(不越权)
- 本库**只建 methods/constructs**(课件域);**不写 canonical verified_sources**(那是 W2R-103B)。
- 已 crossref 实核的 8 个来源 → 见 `sources_handoff_to_platform.yaml`,作为**待入平台源库**的建议清单,交 W2R-103B 收编。
- 证据诚实:每个 method 标 source_id + grade + 青少年**外推等级**(直接相关/MODERATE/LIMITED);无来源标 `practitioner`;不硬凑 DOI、不套高等级。
- 红线随 method 内建(不诊断/不承诺疗效/危机转人工)。

## 用法(课件 Agent)
```
spec → 查 constructs/methods 库(够就组装;不够→evidence-research 采集→核验→并入)→ 组装课件 → quality-gate → expert-signoff
```
