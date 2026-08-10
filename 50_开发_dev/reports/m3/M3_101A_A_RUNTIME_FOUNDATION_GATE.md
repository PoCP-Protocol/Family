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

GATEWAY_TIMEOUT             = PENDING(A5)     # 未实现:OpenAICompatibleAiGateway 的 timeoutMs 仍只配置不生效,需 AbortController
GATEWAY_FAILURE_MAPPING     = PENDING(A5)     # 未实现:TIMEOUT/NETWORK/4XX/5XX/INVALID_JSON/SCHEMA_INVALID/POLICY_REJECTED 分类

M3_101A_A                   = IN_PROGRESS     # A5 未完成 → A-Gate 尚未 PASS
```

## 证据(本轮实测)
- `@family/principal-runtime`:tsc build PASS;**vitest 15/15 PASS**(consent granted/missing/service-only/growth-tracking-only/assessment-only/withdrawn/expired/other-subject;processing FAKE-allow/EXTERNAL-fail-closed/private-reject/aggregate-reject/consent-deny;context granted-allowlist/deny-null)。
- `node tools/validate-contracts.mjs` / `node tools/m3-dangerous-authorization-scan.mjs`:见提交前运行结果(0 hits)。
- 新增/改动文件:`packages/principal-runtime/**`、`products/famili-principal/architecture/FPAI_API_CONTRACT_V1.md`(A1)、`.../FPAI_CONTEXT_FIELD_MATRIX_V1.md`、`.github/workflows/family-required.yml`(m3/** + m3-foundation)、`pnpm-lock.yaml`。

## 剩余(关闭 A-Gate 的唯一阻塞)
- **A5 Gateway Hardening**(在 `@family/ai-gateway`,单一网关不新建):真实 AbortController timeout → `PROVIDER_TIMEOUT` FAIL_CLOSED;失败分类;`AUTOMATIC_RETRY=0`;`CROSS_PROVIDER_FALLBACK=NO`;schema/invalid-json 失败 **绝不返回原始模型文本** → FAIL_CLOSED/REVIEW;+ 单元测试。

## 结论
```
M3_101A_A = IN_PROGRESS（A1/A2/A3/A4 + CI PASS;A5 待做)
下一步 = 完成 A5 → A-Gate PASS → 方可进入 101A-B(PrincipalModule/PG/HTTP/E2E)
不进入 B/C。REAL_MODEL_RUNTIME 仍 NOT_AUTHORIZED。
```
