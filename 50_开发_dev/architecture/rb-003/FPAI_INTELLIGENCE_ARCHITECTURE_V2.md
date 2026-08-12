# FPAI_INTELLIGENCE_ARCHITECTURE_V2 — M3-RB-003

取代 V1 的隐含定义(校长 = prompt + if/else)。正式定义:

```
Famili Principal = Object Context + Evidence-Grounded Knowledge + Principal Soul
                 + Strong Generative Model + Tools + Safety/Policy
≠ Prompt + if/else
```

## 1. 新 Principal Pipeline(冻结目标)
```
User Input
 → Identity(IAM:令牌→可信 actor)
 → Consent(canonical AI_PERSONALIZATION)
 → Hard Safety Tripwire(Layer-1 确定性:显式自伤/暴力/虐待 → STOP)
 → Family Object Context(对象化上下文,最小必要 + truth_type 标注)
 → Knowledge Retrieval(循证知识,E0-E7 + provenance,NON_DECISIVE)
 → Principal Soul(人格/边界系统提示)
 → Strong Model(真实生成式模型 —— 校长智能本体)
 → Structured Understanding(PrincipalUnderstandingV1,AI_INFERENCE)
 → Structured Response(schema 校验)
 → Safety/Policy Verification(Layer-2/3)
 → Action Proposal(canonical=false)
 → Human Confirmation(Human Gate)
 → Named Action(唯一改 canonical 的合法路径)
```

## 2. PrincipalUnderstandingV1(新 Intelligence Object,truth_type=AI_INFERENCE)
```
primary_scenario / secondary_scenarios / user_need / interaction_pattern
risk_route / uncertainties / confidence / knowledge_refs
```
**不是 canonical**;不得写入 Child/GrowthProfile 等 Fact。

## 3. 场景识别重定义(§14)
```
废止: KEYWORD_MATCH = PRIMARY_SCENARIO_ENGINE
改为: MODEL UNDERSTANDING = PRIMARY
关键词仅允许: HARD SAFETY TRIPWIRE + TEST BASELINE
```

## 4. 三层安全(§15)
```
Layer-1 Deterministic Hard Safety  显式自伤/暴力/虐待,高召回 → STOP(保留 safetyPrecheck)
Layer-2 Model Safety Understanding 隐性/复杂风险 → NORMAL/REVIEW/HIGH_RISK
Layer-3 Policy + Human             低置信/策略冲突/高危类别 → HUMAN GATE
原则: MODEL UNDERSTANDS · RULES CONSTRAIN · HUMANS CONFIRM
```

## 5. Fallback(§16)
模型不可用 → **禁止伪装校长**;只允许 SAFE_GENERIC_GUIDANCE / TEMPORARILY_UNAVAILABLE / REVIEW / HUMAN_HANDOFF。

## 6. 与现状的差
```
现状(V1 隐含): 默认 = createDeterministicPrincipalResponse(假)+ detectScenario 关键词(假)
             真模型 env 关着;"能跑"被当作"智能"
V2:          默认 = Strong Model(真);确定性仅护栏 + 安全降级;Intelligence Gate 独立于 Runtime Gate
```

## 7. 授权边界(不变,交 AUTHORIZATION_REGISTRY)
```
REAL_MODEL_DEFAULT = NO_CHANGE(RB-003 阶段)
到 W2R-102 才做 CONTROLLED_MODEL_FIRST_INTERNAL_GATE:
  1 个获批强模型 · 内部 dogfood · 真实 consent · 获批上下文 · 获批 provider · 真实 ModelRun/Attempt 账本
仍不是 100-family pilot。
```

## 8. 模型可替换原则
Family 核心竞争力 = Object World + Growth OS + Evidence Knowledge + Principal Intelligence + Named Action + Outcome Loop + Real Family Data;**不是某一个基础模型**。模型必须始终可替换(Gateway 抽象已支持)。
