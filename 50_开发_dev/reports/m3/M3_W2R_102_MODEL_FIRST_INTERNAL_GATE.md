# M3-W2R-102 — Controlled Model-First Internal Gate

date: 2026-08-12 · 架构师授权:真实模型内部默认打开,provider=anthropic-cc-switch;**pilot/production 仍未授权**。

## 授权与边界
```
FLIP: 真实外呼 默认关 → 内部 dogfood 默认开(profile=model_first_internal)
APPROVED_MODEL = anthropic-cc-switch(claude-opus-4-8;本会话 live 验证)
scope = 内部 dogfood(x-actor-id);pilot_authorized=NO;production_authorized=NO
默认(未设 profile)/ CI = 仍确定性、零外呼(不变)
```

## 6 条件核验(§32)
```
1 单一获批强模型      = anthropic-cc-switch(FPAI_PROVIDER_REGISTRY approved_environment 含 model_first_internal)
2 内部 dogfood        = x-actor-id;非真实家庭
3 真实 consent        = AI_PERSONALIZATION GRANTED(resolvePrincipalConsent 强制)
4 获批 provider       = Provider Registry 已批(内部默认)
5 真实 ModelRun/Attempt 账本 = principal_model_runs + principal_model_attempts(B1)
6 非 pilot            = pilot/production 仍 NO
```

## 实现
```
profile model_first_internal(principal.service resolveRuntimeProfile):externalText=true + 文本类白名单;图片仍隔离。
真实外呼路径:consent 门 → processing 门(evaluateProcessing) → provider 门 → gateway;危机 precheck 短路仍不外呼。
对象化上下文(W2R-101)在 consent 下注入。
AUTHORIZATION_REGISTRY:M3_101B_REAL_EXTERNAL_TEXT.live_external_call_authorized=true(内部);新增 W2R_102_MODEL_FIRST_INTERNAL。
```

## 不变量(保持)
```
危机 HIGH_RISK → 不外呼 + 转人工(单测证明)
AI 不写 canonical;proposal→Human Gate→Named Action
FAIL CLOSED 不返原始文本;图片隔离;CI 零外呼
真实家庭 pilot = NOT_AUTHORIZED(须 IAM + 合规 + 单独 pilot 门)
```

## 证据
```
service.spec:model_first_internal → 真实外呼 ON + 对象上下文注入;危机仍短路(no external)
质量闸:W2R-104 智能 eval(理解/标签化/漏risk)为默认开之后的独立门(pending)
LIVE 内部验证:cc switch 跑通真校长(需 cc switch 运行 + AI_PERSONALIZATION consent seed)
```

## 结论
```
W2R-102 = 真实模型内部默认已授权并接线(provider=anthropic-cc-switch,内部 dogfood)。
下一步:W2R-103 循证检索 → W2R-104 智能 eval(质量闸)→ W2R-105 Human Confirmation 闭环 → …
pilot 仍不动。
```
