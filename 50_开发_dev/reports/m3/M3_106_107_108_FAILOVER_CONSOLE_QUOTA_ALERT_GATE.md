# M3-106 / 107 / 108 — Failover Routing + Review Console + Quota Alerting Gate

date: 2026-08-11
baseline: 承接 M3-101A/B + 102/103/104 + 105 全部 PASS。分支 `m3/fpai-runtime-readiness`。
scope: 用户一并授权三项("1/2/3"):① 跨厂商 failover 路由(受控 opt-in);② REVIEW 队列运营台(HTML);③ 配额用量 API + 阈值告警。

## 判定
```
# ① M3-106 Cross-provider failover(受控)
ROUTING_INFRA_ONLY        = PASS   # RoutingAiGateway 仅对基础设施瞬时错误(TIMEOUT/NETWORK_ERROR/PROVIDER_5XX)failover 到下一厂商
NO_FALLBACK_ON_SAFETY     = PASS   # 4xx/INVALID_JSON/SCHEMA_INVALID/POLICY_REJECTED → 立即 FAIL CLOSED,绝不兜底(单测 + 断言 secondary 未被调用)
OPT_IN_DEFAULT_OFF        = PASS   # 仅 FPAI_MODEL_VENDOR=逗号列表(如 anthropic,zhipu)启用;单厂商行为不变;AI_GATEWAY_POLICY.cross_provider_fallback 仍 forbidden(新增 _when_routing 记录受控语义)
FAILOVER_LIVE             = PASS   # LIVE:主 anthropic 指死端口→NETWORK_ERROR→兜底真实 zhipu 成功(zhipu-compatible,route=NORMAL)

# ② M3-107 Review console
CONSOLE_SELF_CONTAINED    = PASS   # GET /families/:id/principal/review-console 返回自包含 HTML(无构建链);同域调 handoffs / resolve
CONSOLE_NON_CANONICAL     = PASS   # 纯运营台,只读队列 + 解决 handoff,不触碰 Growth canonical
CONSOLE_E2E               = PASS   # GET 200 text/html,含"人工复核队列"/familyId/fetch('handoffs')

# ③ M3-108 Quota usage + alert
USAGE_ENDPOINT            = PASS   # GET /families/:id/principal/usage → {date,used,cap,remaining,state}(OK|WARN|EXCEEDED|UNLIMITED)
USAGE_PERSISTENT          = PASS   # 用量来源=principal_model_runs(已持久,跨重启有效);无新表、无计数漂移
WARN_ALERT                = PASS   # 真实外呼达 warn 阈值(FPAI_PRINCIPAL_DAILY_WARN_PCT,默认80%)发一次 principal_quota_warning;exceeded 由前置守卫另发
QUOTA_ALERT_LIVE          = PASS   # LIVE:cap=2 warn=50%→warnAt=1,首次真实外呼即发 warning,usage state=WARN

SAFETY_INVARIANTS         = PASS   # 危机不外呼、AI 不写 canonical、FAIL CLOSED 不返原始文本 全部保持
REAL_MODEL_CALLS          = >0

M3_106 = PASS   M3_107 = PASS   M3_108 = PASS
```

## 证据(本轮实测)
- **LIVE ops `2/2 PASS`**:
  - `[LIVE-FAILOVER] primary anthropic dead -> secondary zhipu succeeded; route=NORMAL`(死主端口→NETWORK_ERROR→受控兜底到真实 GLM-4V)
  - `[LIVE-QUOTA] warn fired at used=1/cap=2 state=WARN`
- **离线全量**:full e2e `11 文件 / 79 PASS`(新增 usage + review-console 用例);api 单测+集成 `26 / 119 PASS`;ai-gateway `28/28`(+6 routing:5xx/timeout/network failover、4xx/invalid-json 不兜底、全败上抛、逗号工厂)。
- **typecheck + build**:全 PASS。CI 离线确定:`principal-ops.livecheck.ts` 不入 CI。

## 关键设计:failover 不违背 FAIL CLOSED
```
路由只对"基础设施瞬时错误"(某厂商临时不可用)切换,这不是"用兜底掩盖坏输出";
安全相关失败(schema 不过/policy 拒/4xx)一律立即失败闭合,绝不换厂商重试 → 保持"不静默兜底"原则。
默认关闭(单厂商),必须显式配置逗号厂商列表才启用。
```

## 新增/改动
- `packages/ai-gateway/src/index.ts`(RoutingAiGateway + buildVendorGateway + 逗号厂商路由 + 策略注记)+ `routing.spec.ts`
- `apps/api/src/modules/principal/principal.service.ts`(getUsage + warn 告警)
- `apps/api/src/modules/principal/principal.controller.ts`(GET usage + GET review-console + renderReviewConsole)
- `apps/api/src/modules/principal/principal.e2e-spec.ts`(usage + console)+ `principal-ops.livecheck.ts`

## 生产配置(路由 + 配额告警)
```
FPAI_MODEL_VENDOR=anthropic,zhipu     # 受控 failover 顺序(逗号列表);单值=不 failover
FPAI_PRINCIPAL_DAILY_CAP=<每family每日真实调用上限,0=不限>
FPAI_PRINCIPAL_DAILY_WARN_PCT=80      # 告警阈值百分比
# 运营台:GET /families/{familyId}/principal/review-console
# 用量:  GET /families/{familyId}/principal/usage
```

## 结论
```
M3_106/107/108 = PASS。跨厂商受控 failover、复核运营台、配额用量+告警三项落地。
安全不变量全部保持;failover 严格限基础设施瞬时错误,不违背 FAIL CLOSED。
于本 gate 停下待审。
```
