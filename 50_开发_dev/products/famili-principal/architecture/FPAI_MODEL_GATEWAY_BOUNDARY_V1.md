# FPAI Model Gateway Boundary V1

purpose: 冻结 `@family/ai-gateway` 为**唯一** Provider Gateway。不得开发第二个 Gateway。
runtime: **NOT_AUTHORIZED**（仅契约)

---

## 1. 唯一网关
`@family/ai-gateway`(已存在:`AiGateway` 接口 + `FakeAiGateway` + `OpenAICompatibleAiGateway` + `AI_GATEWAY_POLICY`)。M3 冻结其为唯一 Provider 抽象。

## 2. 不变量
```
business_module_direct_provider_call = FORBIDDEN   # 业务模块不得直连 provider
canonical_mutation_by_ai            = FORBIDDEN    # Gateway 不得触碰 Family/Growth repo 或 Named Action
structured_output_required          = TRUE
schema_validation_required          = TRUE          # 复用 PRINCIPAL_AI_OUTPUT_SCHEMA / validatePrincipalOutput
human_confirmation_required         = TRUE          # 进入 canonical 前必须人工确认
provider_replaceable                = TRUE          # Fake / OpenAICompatible 可替换
```

## 3. 失败行为(FAIL CLOSED)
必须明确定义(runtime 授权前冻结语义,不实现):
```
timeout            → 视为失败,不产出建议;不泄原始/半成品文本
provider_error     → 失败;记 ModelRun(见 ledger);对用户友好降级(不给伪建议)
invalid_json       → schema 校验前即失败 → 不进入 canonical
schema_failure     → validatePrincipalOutput 失败 → 丢弃输出,route=REVIEW
safety_failure     → precheck/postcheck 命中 → HIGH_RISK/REVIEW,human handoff
retry_policy       → 有限次、幂等、不放大副作用
fallback_policy    → 仅在不违反 safety/consent 前提下;无合规候选 → ABSTAIN
```
第一原则:**FAIL CLOSED**,而非"模型报错就把原始文本给用户"。

## 4. 禁止的连接(forbidden surface,契约测试守)
```
AiGateway → familyRepository
AiGateway → growthRepository
AiGateway → 任意 NamedAction
apps/api/**（业务模块) → provider SDK 直连
```

## 5. Provider 选型(契约层,runtime 仍 NOT_AUTHORIZED)
- 现状(实测):`@family/ai-gateway` **不硬连任何 LLM**。`FakeAiGateway`=默认确定性假网关(不走网络);`OpenAICompatibleAiGateway`=通用 OpenAI 兼容客户端,POST `{baseUrl}/chat/completions`、Bearer key、`response_format:json_object`,全部 env 配置:`FPAI_MODEL_BASE_URL / FPAI_MODEL_API_KEY / FPAI_MODEL_NAME / FPAI_MODEL_TIMEOUT_MS`。
- **选定 Provider 接入方式 = 经 `cc switch` / CCR(OpenAI 兼容路由)**:仅需把 `FPAI_MODEL_BASE_URL` 指向 CCR 端点 + key + model 名,**零代码改动**(网关已是 OpenAI 兼容)。
- 兼容性前置(runtime 授权前必须满足):
  - CCR 下游(如 Claude)须返回 OpenAI 式 `choices[].message.content` 并支持 `json_object`(或由 CCR 归一)。
  - **补齐网关强化**:当前 `OpenAICompatibleAiGateway` 未实施 `timeoutMs`/retry/fallback → 记 `M3_GATEWAY_HARDENING_REQUIRED`(runtime 前关闭),按 §3 FAIL CLOSED 落地。
- **边界不变量**:provider 仅由 env/配置切换(`provider_replaceable=TRUE`);业务代码不得直连;M3-000 不设置真实 key、不发起任何真实调用。
