# M3-W2R 101–104 Principal Intelligence Integration Review

```text
DOC_KIND = INTEGRATION_REVIEW
RULING   = M3-W2R-CONV-001(总架构师)
DATE     = 2026-08-14
BASE     = master @ 7cf13c6 (RB-003)
HEAD     = m3/w2r-104 @ be9c134  (经 m3/w2r-104-integration-review 暴露 101–104 完整历史)
AUTO_MERGE = NO
PURPOSE  = 把 W2R-101…104 的完整历史暴露给主线 CI 与架构评审;不请求直接合并。
```

> 本文件是**集成状态真相表**,不是 gate 通过声明。禁止把 101–104 一口气写成 PASS_CLOSED。

## 1. 逐阶段状态(裁决口径)

```text
W2R-101 Object-aware Context
= PASS_CANDIDATE

W2R-102 Model-first Internal
= INTERNAL_TECHNICAL_PASS
= PILOT_NO

W2R-103 Evidence Grounding
= PARTIAL_PASS
= BLOCKER_PRESENT

W2R-104 Intelligence Quality
= CODE_PASS
= INTEGRATION_HOLD_UNTIL_103
```

## 2. 当前 blocker

```text
CURRENT_BLOCKER = W2R_101_104_INTEGRATION_CONVERGENCE
ROOT            = W2R-103 evidence grounding 未做真
```

W2R-103 现状(经代码核查,commit 95fd9af 自述):
- 已有:知识 YAML(Theory→Construct→Method→Modality)、`compile-knowledge.mjs`、编译 bundle、`retrieveGroundedKnowledge()` + 测试。
- 未完成(BLOCKER):
  1. grounded refs **未接入实时模型输入**(commit note: "grounded refs not yet threaded into live model input");`retrieveGroundedKnowledge()` 未被 `principal.service` 调用,bundle 未被 `buildPrincipalAiGatewayRequest` 消费。
  2. TS 侧知识卡 **未接入** `evidence.py` 的 Grade(E0–E7)/Provenance/NON_DECISIVE;`source_refs` 仅为内部 taxonomy ID(`FPAI-METHOD-TAXONOMY-V1:*`),`evidence_level` 硬编码 `E1_REVIEWED_METHOD_ASSET`,**非真实外部证据**。
  3. 模型输出无 `evidence_grade/provenance` 追溯,NON_DECISIVE 未在输入/输出层强制。

## 3. 收口顺序(冻结)

```text
W2R-103B Evidence Completion
        ↓
W2R-104 Final Integration Review(CI green)
        ↓
m3/w2r-104 → master(申请总架构师合并)
        ↓
PR #10 W2R-105 → master(rebase 后重跑 CI;安全闭环优先)
        ↓
PR #9 Object Semantic Runtime P1 → master
        ↓
W2R-106 Check-in→Observation→Timeline→Return
        ↓
W2R-107 Golden Family Browser E2E
```

不得插入 P2 / P3。

## 4. 最终 Intelligence Quality Gate 判据(W2R-104 FINAL 要求)

```text
Intelligence Quality =
  Deterministic Invariants
  + Gold Cases
  + Independent Model Judge
  + Human Expert Review
禁止:LLM judges LLM → Intelligence PASS
```

## 5. CI

两条既有 PR(#9 / #10,base=m3/w2r-104)GitHub CI 已跑真实 testdb harness(Reset Test DB / Integration / HTTP E2E / Web Tests+Build)全绿。本集成 PR 用于把 101–104 历史对主线 CI 暴露。
