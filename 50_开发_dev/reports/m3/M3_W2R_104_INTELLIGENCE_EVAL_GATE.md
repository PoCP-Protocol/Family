# M3-W2R-104 智能质量闸 Gate 报告

date: 2026-08-13 · 阶段:M3-W2R(真实模型内部默认开之后的独立质量门)
上游:W2R-102(真实模型内部默认开)→ W2R-103(循证检索)→ **W2R-104(智能质量闸)** → W2R-105(Human Confirmation 闭环,pending)
授权来源:`governance/AUTHORIZATION_REGISTRY.yaml` → `W2R_104_INTELLIGENCE_QUALITY_GATE`(本报告仅为证据,不自我宣称授权)

## 1. 目标与定位

W2R-102 起真实模型在内部 dogfood 默认打开。既有 `validatePrincipalOutput`(结构/禁语硬门)只能挡空壳与违禁词,**挡不住**「结构合法但答非所问」「场景标签判错」「本应 REVIEW/HIGH_RISK 却被判 NORMAL(漏判风险)」。W2R-104 在结构硬门之外新增一道**智能质量门**,评估三维:

```
understanding  理解质量:是否真正接住家长说的具体情境(PASS/WEAK/FAIL)
labeling       场景标签化:scenario_id 是否与真实议题一致(PASS/MISMATCH)
risk_leak      漏判风险:隐含安全风险却被判 NORMAL(NONE/SUSPECTED)
```

不过 → **安全降级 REVIEW**(进人工复核队列),不建 Action Proposal。

## 2. 授权与边界

```
能力性质      = 防御性质量闸(guardrail 语义),不新增任何外呼面
生成式 judge  = 仅在 FPAI_RUNTIME_PROFILE=model_first_internal 下复用 W2R-102 approved provider(anthropic-cc-switch)
CI / 未设 profile = 无 judge → 确定性安全底座,零外呼(不变)
不变量        = 只降级不放宽(仅 NORMAL→REVIEW;绝不把 REVIEW/HIGH_RISK 提升为 NORMAL)
pilot/production = 仍 NOT_AUTHORIZED;不写 canonical;不训练
```

## 3. 实现(双层:生成式主体 + 确定性底座)

- 能力:`packages/principal-ai/src/index.ts` → `assessResponseQuality(input, judge?)`
  - 有 judge:构造独立 eval 请求 `use_case=FPAI_PRINCIPAL_QUALITY_EVAL`(独立 prompt_version + `PRINCIPAL_QUALITY_VERDICT_SCHEMA`,`may_mutate_business_state:false`),模型结构化返回三维 verdict;judge 输出经 `isValidJudgeOutput` 校验,不合法/网关抛错 → 回退确定性底座(FAIL CLOSED)。
  - 无 judge:`deterministicQualityFloor` 仅做安全可判定子集——risk 单调性(precheck 比 output 更严即 `risk_underclassified`)+ 理解空壳(what_i_hear 与 user_message 无 2-gram 交集即 `understanding_empty`)。
  - 合并:安全维度取**更严**(底座发现的 SUSPECTED/FAIL 不可被 judge 抹掉);`understanding=WEAK|FAIL`、`labeling=MISMATCH`、`risk_leak=SUSPECTED` 任一 → `pass=false`。
- 接线:`apps/api/src/modules/principal/principal.service.ts` —— 在 `runPrincipalTextMvp` 之后、HIGH_RISK 早返回之后、REVIEW/NORMAL 分岔之前插入;judge 与主模型同门控(`willCallExternal` 才注入网关)。不过 → `route=REVIEW` + `principal_quality_gate_failed` 事件 + 复用既有 REVIEW 人工分支;始终发 `principal_quality_gate_evaluated` 事件供观测。

## 4. 不变量(保持)

```
危机 HIGH_RISK → 不进质量闸(precheck 已短路转人工,单测证明)
质量闸只降级不放宽(仅 NORMAL→REVIEW;结构上不可能置 NORMAL)
judge 不可用/失败/输出非法 → 回退确定性底座,绝不放行未评估输出
AI 不写 canonical;proposal→Human Gate→Named Action;图片隔离;CI 零外呼
真实家庭 pilot = NOT_AUTHORIZED
```

## 5. 证据

```
principal-ai/quality-gate.spec.ts:
  底座:贴合→pass;漏判(precheck 更严)→SUSPECTED+fail;理解空壳→FAIL
  生成式:无 judge→deterministic-floor;judge PASS→generative pass;WEAK/ MISMATCH→fail;
          judge 非法→回退底座;判空网关抛错→回退底座;只降级不放宽(底座 SUSPECTED 不被 judge NONE 抹掉)
principal.service.spec.ts(W2R-104):
  model_first_internal + judge 判不合格 → route=REVIEW + human_handoff + 无 proposal + principal_quality_gate_failed
  judge 合格 → NORMAL + 建 proposal + principal_quality_gate_evaluated(无 failed)
  默认 profile → 主模型与 judge 均不外呼(零外呼)+ 确定性底座放行
既有 W2R-101/102 spec:不回归(质量闸在网关调用之后,不改外呼门与图片隔离)
```

LIVE 内部验证(可选,需 cc switch + AI_PERSONALIZATION consent seed):对一条"结构合法但答非所问"样本,真实 judge 给出 `understanding=FAIL` → 降级 REVIEW。

## 6. 结论

```
W2R-104 = 智能质量闸已接线并授权(内部;生成式 judge 复用 W2R-102 provider + 确定性底座兜底)。
下一步:W2R-105 Human Confirmation 闭环。
pilot/production 仍不动;不写 canonical;不训练。
```
