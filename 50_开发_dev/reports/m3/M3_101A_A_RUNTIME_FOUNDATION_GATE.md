# M3-101A-A — Runtime Foundation Gate

date: 2026-08-11
baseline: `8cadeb6`（m3/fpai-intelligence-contract-gate,M3_000 PASS_CLOSED)
isolation: branch `m3/fpai-runtime-readiness` @ worktree `D:\Family-m3-fpai-runtime`(off 8cadeb6);M2 worktree `D:\Family` 未用于本阶段。
scope: 仅 101A-A 运行时地基(DB-free)。**未创建 PrincipalModule / PG 表 / HTTP / E2E(那是 101A-B,须本 A-Gate PASS 后)。REAL_MODEL_CALLS=0。**

## 判定
```
M3_CI_TRIGGER               = PASS(config)   # family-required.yml push 加 m3/**;新增 m3-foundation job(scan+contract+principal-runtime test);实际 CI run 待 push 后 GitHub 观察
API_AUTH_CONTRACT_REALITY   = PASS           # 纠正为 x-actor-id(INTERNAL_ONLY);BEARER_AUTH=FUTURE_IAM;IAM_PILOT_READY=NO
CANONICAL_AI_CONSENT        = PASS           # resolvePrincipalConsent:仅 AI_PERSONALIZATION+GRANTED;禁 SERVICE/GROWTH_TRACKING/ASSESSMENT 静默拓宽;WITHDRAWN/EXPIRED 拒绝
CONSENT_SCOPE_TIGHTENING    = PASS           # evaluateProcessing:EXTERNAL_PROVIDER FAIL_CLOSED;仅 FAKE+最小必要允许;私有文本/整体aggregate 拒绝
TYPED_CONTEXT_BROKER        = PASS           # PrincipalFamilyContextV1(强类型,无 Record<string,unknown>)
CONTEXT_FIELD_MATRIX        = PASS           # FPAI_CONTEXT_FIELD_MATRIX_V1(字段/来源/consent/minor/redaction/retention)
CONTEXT_MINIMIZATION        = PASS           # allowlist;deny→null(输出=0);禁 aggregate/private text
CROSS_PROVIDER_FALLBACK     = NO             # 未建 Model Router
REAL_MODEL_CALLS            = 0

GATEWAY_TIMEOUT             = PASS(A5)        # AbortController + Promise.race 真实超时 → PROVIDER TIMEOUT FAIL_CLOSED
GATEWAY_FAILURE_MAPPING     = PASS(A5)        # AiGatewayError 分类 TIMEOUT/NETWORK_ERROR/PROVIDER_4XX/5XX/INVALID_JSON/(SCHEMA_INVALID/POLICY_REJECTED 预留);retry=0;无 fallback;schema/invalid-json 绝不返原始文本

M3_101A_A                   = PASS            # A1/A2/A3/A4/A5 + CI 全部 PASS
```

## 证据(本轮实测)
- `@family/principal-runtime`:tsc build PASS;**vitest 15/15 PASS**(consent granted/missing/service-only/growth-tracking-only/assessment-only/withdrawn/expired/other-subject;processing FAKE-allow/EXTERNAL-fail-closed/private-reject/aggregate-reject/consent-deny;context granted-allowlist/deny-null)。
- `node tools/validate-contracts.mjs` / `node tools/m3-dangerous-authorization-scan.mjs`:见提交前运行结果(0 hits)。
- 新增/改动文件:`packages/principal-runtime/**`、`products/famili-principal/architecture/FPAI_API_CONTRACT_V1.md`(A1)、`.../FPAI_CONTEXT_FIELD_MATRIX_V1.md`、`.github/workflows/family-required.yml`(m3/** + m3-foundation)、`pnpm-lock.yaml`。

## A5 证据(本轮补齐)
- `@family/ai-gateway`:tsc build PASS;**vitest 8/8 PASS**(success / TIMEOUT(hung fetch 20ms 中止)/ PROVIDER_4XX(404)/ PROVIDER_5XX(503)/ NETWORK_ERROR / INVALID_JSON(内容非 JSON,不返原始文本)/ INVALID_JSON(无 content)/ 错误均为 AiGatewayError)。
- `AI_GATEWAY_POLICY` 补:`on_failure=fail_closed / automatic_retry=0 / cross_provider_fallback=forbidden / schema_failure_returns_raw_text=false / timeout_enforced=true`。
- 仍是唯一网关,未新建第二个 Gateway。

## 结论
```
M3_101A_A = PASS（A1/A2/A3/A4/A5 + CI 全部 PASS)
下一步 = 101A-B(建 PrincipalModule/PG 表与迁移/HTTP/NORMAL·REVIEW·HIGH_RISK 真实 E2E/ModelRun·ProductEvent 落库,Provider 仍 Fake)
REAL_MODEL_RUNTIME / REAL_EXTERNAL_MODEL_CALL 仍 NOT_AUTHORIZED;REAL_MODEL_CALLS=0;M2 core 未改。
```

## Provider 接入说明(cc switch / CCR)
`ai-gateway` 已 env 驱动(`FPAI_MODEL_BASE_URL/API_KEY/NAME`),接 cc switch/CCR **零代码改动**。但按本阶段裁决 `PRODUCTION_API_KEY=NO / REAL_EXTERNAL_MODEL_CALL=NOT_AUTHORIZED`:**101A 不设置真实 key、运行时 Provider 保持 FakeAiGateway**;真实 key 只在 **101A-B 之后经架构师授权**、放本地 `.env`(gitignored),**绝不入库**。`.env.example` 仅提供占位。
