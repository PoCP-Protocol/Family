# M3-102 / 103 / 104 — Multimodal + Review Workflow + Provider Quota Gate

date: 2026-08-11
baseline: 承接 M3-101A/B 全部 PASS。分支 `m3/fpai-runtime-readiness`。
scope: 用户一并授权三项("1/2/3"):① 多模态图片通道;② REVIEW 人工复核工作流;③ 生产 Provider 配置 + 每日配额。附带两处真实硬化(gateway 错误 FAIL CLOSED、markdown 围栏剥离)。

## 判定
```
# ① M3-102 Multimodal
MM_INPUT_CHANNEL          = PASS   # PrincipalAiInput.images? → buildPrincipalAiGatewayRequest 顶层 images(image content block);base64 不入文本 prompt
MM_NO_BYTE_PERSIST        = PASS   # 只记 product_event image_count,不落原始字节(隐私)
MM_HTTP_VALIDATION        = PASS   # messages 端点校验 images[{media_type,data}];缺字段 → 400
MM_LIVE_VISION            = PASS   # LIVE:48x48 PNG 经 cc switch 真实视觉模型处理,route=NORMAL(1x1 会被 bedrock 拒→已改用合法图)

# ② M3-103 Review workflow
REVIEW_QUEUES_HANDOFF     = PASS   # route=REVIEW(含 FAIL_CLOSED 降级)→ 入人工复核队列(REVIEWER,trigger=review);响应存供复核;不建 proposal
REVIEW_LIST_ENDPOINT      = PASS   # GET /families/:id/principal/handoffs 列 OPEN
REVIEW_RESOLVE_ENDPOINT   = PASS   # POST handoffs/:id/resolve(APPROVED|REJECTED|ESCALATED|INFO_ONLY);解决后出队;重复/未知 → 404
REVIEW_NON_CANONICAL      = PASS   # 复核结论只落 principal_human_handoffs + product_event,不写 Growth 事实

# ③ M3-104 Provider config + quota
QUOTA_DAILY_CAP           = PASS   # env FPAI_PRINCIPAL_DAILY_CAP(0=off);超额前置拦截,不发外部调用 → REVIEW + quota handoff + principal_quota_exceeded
QUOTA_REAL_ONLY           = PASS   # 仅计真实外呼(anthropic-compatible/当日);确定性回退无成本不计
QUOTA_CRISIS_EXEMPT       = PASS   # precheck=HIGH_RISK 不受配额影响(危机永不因配额被挡)
QUOTA_LIVE                = PASS   # LIVE:cap=1 → 第2次真实调用被拦(family 当日 anthropic model_runs=1,quota_exceeded=1)

# 硬化(本轮真实发现并修复)
GATEWAY_ERROR_FAIL_CLOSED = PASS   # runPrincipalTextMvp 抛错(provider 4xx/5xx/超时/非法JSON)→ service 捕获 → REVIEW+model_error handoff,绝不 500、绝不返原始文本
MARKDOWN_FENCE_STRIP      = PASS   # AnthropicAiGateway 解析前剥离 ```json 围栏(真实模型偶发加围栏)→ 大幅降低 FAIL_CLOSED 误伤;仍 FAIL CLOSED
REAL_MODEL_CALLS          = >0     # LIVE 已真实外呼(文本 + 图片)

M3_102 = PASS   M3_103 = PASS   M3_104 = PASS
```

## 证据(本轮实测)
- **LIVE(真实 cc switch,fresh 库)`4/4 PASS`**:
  - `[LIVE] provider=anthropic-compatible model=claude-opus-4-8 route=NORMAL schema=PASS latency≈18s`(文本)
  - `[LIVE-MM] image processed by real model; route=NORMAL`(48x48 PNG 真实视觉)
  - quota cap=1 → 第2次 REVIEW+human_handoff、anthropic model_runs=1、quota_exceeded=1
  - HIGH_RISK → deterministic-fallback(不外呼)+ 转人工
  - 直连诊断:1x1 PNG→400"Could not process image";48x48 合法 PNG→200(模型返回被 ```json 围栏包裹 → 印证围栏剥离必要性)
- **离线全量**:full e2e `11 文件 / 77 PASS`(新增 REVIEW + multimodal 端点用例);api 单测+集成 `26 / 119 PASS`;principal-ai `15/15`(含 images 通道);ai-gateway `17/17`(含围栏剥离)。
- **typecheck + build**:全 PASS。CI 仍离线确定(gateway=null;live 文件 `.livecheck.ts` 不入 CI)。

## 新增/改动
- `packages/principal-ai/src/index.ts`(images 通道)+ `index.spec.ts`
- `packages/ai-gateway/src/index.ts`(stripCodeFence)+ `anthropic.spec.ts`
- `apps/api/src/modules/principal/principal.{service,controller,repository}.ts`(images / review 队列 / 配额 / gateway 错误 FAIL CLOSED)
- `apps/api/src/modules/principal/principal.e2e-spec.ts`(REVIEW + multimodal)+ `principal-live.livecheck.ts`(multimodal + quota)
- `database/migrations/0013_principal_review_workflow.sql`

## 生产 Provider 配置(交运维)
```
FPAI_PRINCIPAL_PROVIDER=real         # 开启真实外呼(缺省=确定性回退,零外呼)
ANTHROPIC_BASE_URL=<cc switch / 网关地址>
ANTHROPIC_AUTH_TOKEN=<token>         # 仅本机 .env,勿入库
FPAI_MM_MODEL=claude-opus-4-8        # 或 ANTHROPIC_MODEL
FPAI_MODEL_TIMEOUT_MS=40000
FPAI_PRINCIPAL_DAILY_CAP=<每 family 每日真实调用上限,0=不限>
```

## 结论
```
M3-102/103/104 = PASS。多模态图片、人工复核闭环、每日配额三项落地;真实模型链路更健壮(FAIL CLOSED 无 500、围栏剥离)。
安全不变量保持:危机不外呼、AI 不写 canonical、FAIL CLOSED 不返原始文本、keys 仅本机 .env。
于本 gate 停下待审。下一步候选(待授权):智谱 GLM-4V 独立视觉 provider / REVIEW 队列前端 / 生产配额存储与告警。
```
