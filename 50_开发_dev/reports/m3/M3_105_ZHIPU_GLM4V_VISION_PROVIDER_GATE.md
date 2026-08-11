# M3-105 — Zhipu GLM-4V Independent Vision Provider Gate

date: 2026-08-11
baseline: 承接 M3-101A/B + M3-102/103/104 全部 PASS。分支 `m3/fpai-runtime-readiness`。
scope: 新增第二个真实视觉 Provider —— 智谱 GLM-4V(`glm-4v-plus`,OpenAI 兼容 v4 端点),env 可选厂商。用户已授权真实外呼;智谱为新的对外数据发送边界(经用户"下一步=智谱"确认)。

## 判定
```
ZHIPU_GATEWAY             = PASS   # ZhipuAiGateway:OpenAI 兼容 /chat/completions + image_url 视觉块 + A5 硬化(超时/失败分类/无fallback)+ stripCodeFence
VENDOR_SELECTION          = PASS   # createAiGatewayFromEnv:FPAI_MODEL_VENDOR=zhipu → ZhipuAiGateway;=anthropic 或 ANTHROPIC_* → cc switch;默认 Fake
BEARER_AUTH_RAW_KEY       = PASS   # v4 端点直接用原始 API key 作 Bearer(无需 JWT);直连实测 200
VISION_IMAGE_URL          = PASS   # 多模态走 OpenAI image_url(data:<mt>;base64,<data>);单测校验 block 结构
FENCE_STRIP_REUSE         = PASS   # GLM 同样用 ```json 包裹 → 复用 stripCodeFence;仍 FAIL CLOSED
PROVIDER_TAG              = PASS   # metadata/model_run = zhipu-compatible;与 anthropic-compatible 区分
QUOTA_ALL_REAL_VENDORS    = PASS   # countRealModelRunsToday 改为 provider NOT IN (fake,deterministic-fallback) → 任何真实厂商计入配额
LIVE_VISION               = PASS   # LIVE:48x48 PNG 经真实 GLM-4V 处理,route=NORMAL,zhipu-compatible,Growth 零写(≈5.7s)
CRISIS_EXEMPT_LIVE        = PASS   # LIVE:HIGH_RISK 不达 GLM-4V(deterministic-fallback)+ 转人工
FAIL_CLOSED               = PASS   # provider 出错 → service 捕获降级 REVIEW,绝不 500/原始文本(沿用 M3-102/104 硬化)
REAL_MODEL_CALLS          = >0

M3_105 = PASS
```

## 证据(本轮实测)
- **直连智谱 v4**:文本请求 HTTP 200(`glm-4v-plus`,OpenAI 兼容 `choices[0].message.content`,内容被 ```json 围裹 → 印证 stripCodeFence);原始 Bearer key 通过(无需 JWT)。
- **LIVE(FPAI_MODEL_VENDOR=zhipu + real,fresh 库)`2/2 PASS`**:
  - `[LIVE-ZHIPU] GLM-4V processed image; route=NORMAL`(48x48 PNG,zhipu-compatible,growth_actions=0,≈5.7s)
  - HIGH_RISK → deterministic-fallback(不外呼)+ human_handoff
- **离线全量**:full e2e `11 文件 / 77 PASS`;api 单测+集成 `26 / 119 PASS`;ai-gateway `22/22`(+5 Zhipu:端点/Bearer/image_url/围栏/失败分类/工厂+厂商选择);typecheck+build 全 PASS。
- CI 仍离线确定:`principal-zhipu.livecheck.ts` 不匹配 `*.spec/*.e2e-spec`,不入 CI。

## 新增/改动
- `packages/ai-gateway/src/index.ts`(ZhipuAiGateway + createZhipuAiGatewayFromEnv + FPAI_MODEL_VENDOR 选择 + zhipu-compatible tag)+ `zhipu.spec.ts`
- `packages/principal-ai/src/index.ts`(PrincipalModelRun.model_provider += zhipu-compatible)
- `apps/api/src/modules/principal/principal.repository.ts`(配额计入所有真实厂商)
- `apps/api/src/modules/principal/principal-zhipu.livecheck.ts`

## 生产配置(智谱视觉)
```
FPAI_PRINCIPAL_PROVIDER=real
FPAI_MODEL_VENDOR=zhipu
ZHIPUAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPUAI_API_KEY=<原始 key,仅本机 .env,勿入库>
ZHIPUAI_VISION_MODEL=glm-4v-plus
```

## 结论
```
M3_105 = PASS。平台现具双真实视觉厂商(cc switch/Anthropic + 智谱 GLM-4V),env 一键切换;配额、危机豁免、FAIL CLOSED 全部跨厂商一致。
安全不变量保持:危机不外呼、AI 不写 canonical、FAIL CLOSED 不返原始文本、keys 仅本机 .env。
于本 gate 停下待审。下一步候选(待授权):跨厂商 failover/路由策略 / REVIEW 队列前端 / 生产配额持久化与告警。
```
