# M3-000 Gate — FPAI Intelligence Integration Contract Gate

date: 2026-08-11
stage: `M3-000_FPAI_INTELLIGENCE_INTEGRATION_CONTRACT_GATE`
baseline SHA: `600c08e1789eab9dd3c5f5fbd305f5469e9005c5`（origin/wave/m2-wave2-integration,`git fetch` 确认 remote 与 local 一致)
isolation: branch `m3/fpai-intelligence-contract-gate` @ worktree `D:\Family-m3-fpai`(独立;M2 worktree `D:\Family` 未用于 M3);`git worktree list` 为证。

## 判定
```
M3_000                       = PASS
M2_CORE_FROZEN               = PASS   # 未改任何 M2 validated core;FORBIDDEN 矩阵约束
FAMILY_TRUTH_OWNERSHIP       = PASS   # L1
GROWTH_STATE_OWNERSHIP       = PASS   # L2,仅 Named Action 改 canonical
PRINCIPAL_DOMAIN_OWNERSHIP   = PASS   # L3,Principal 对象 != canonical truth/state
CONTEXT_BROKER_CONTRACT      = PASS   # ALLOWLIST + consent 前置
AI_CONSENT_BOUNDARY          = PASS   # AI_PERSONALIZATION 为合法前置;禁止 SERVICE/GROWTH_TRACKING 静默解释
ACTION_BRIDGE_CONTRACT       = PASS   # AI Proposal→人工确认→既有 Named Action;禁止直写 Growth DB
HUMAN_CONFIRMATION_REQUIRED  = PASS
SAFETY_PRECHECK              = PASS   # 复用 safetyPrecheck,先于 model invocation
SAFETY_POSTCHECK             = PASS   # 复用 safetyPostcheck
HIGH_RISK_BRIDGE_BLOCK       = PASS   # HIGH_RISK 禁 proposal/bridge,强制 human handoff
MODEL_GATEWAY_BOUNDARY       = PASS   # @family/ai-gateway 唯一;禁业务直连/AI 改 canonical
MODEL_RUN_LEDGER             = PASS   # 复用 PrincipalModelRun;与 ProductEvent/GrowthEvent/AuditEvent 三分
PRODUCT_EVENT_BOUNDARY       = PASS   # accept=ProductEvent != GrowthAction 变化
GROWTH_EVENT_BOUNDARY        = PASS
PRIVACY_DATA_BOUNDARY        = PASS   # Contract Level;ModelRun 默认存 hash,最小化/redaction
M3_101_RUNTIME_SLICE         = DEFINED
M3_RUNTIME                   = NOT_AUTHORIZED
BLOCKERS                     = 0
```

## Pre-runtime 契约项(非 M3-000 Blocker,M3-101 授权前须关闭)
1. `M3_CONSENT_SCOPE_TIGHTENING_REQUIRED` — 明确 `AI_PERSONALIZATION` 是否覆盖"向(可能外部)provider 模型发送未成年人/家长私有文本";未收紧前,私有文本+外部 provider 路径 FAIL CLOSED。
2. `M3_GATEWAY_HARDENING_REQUIRED` — `OpenAICompatibleAiGateway` 现未实施 timeout/retry/fallback;runtime 前按 FAIL CLOSED 补齐。
3. Context Broker allowlist 字段须逐一对齐真实读模型(不得虚构)。

## 自动化证据
- `node tools/m3-dangerous-authorization-scan.mjs` → **557 文件,危险授权 0 / 禁止调用面 0 / 缺失契约 0 → PASS**。
  - 危险授权(0):M3_RUNTIME/START_M3_RUNTIME/REAL_MODEL_RUNTIME/AGENT_RUNTIME/WORLD_MODEL/CAUSAL_ENGINE/DH1/VOICE/AVATAR/AUTO_GROWTH_*/AUTO_INTERVENTION/AI_DIRECT_FAMILY_WRITE 的肯定式授权。
  - 禁止调用面(0):`model.output.growthProfile/priority/action` 直落 canonical;`ai-gateway` 触碰 family/growth 仓储或 NamedAction;`apps/api/src/modules/principal` runtime module。
- 无 runtime / 无真实模型调用 / 无 DB 迁移 / 无浏览器 AI 运行。

## 产出文件(本阶段)
```
reports/m3/M3_000_FPAI_INTELLIGENCE_CONTRACT_FREEZE.md
reports/m3/M3_000_SHARED_FILE_CONFLICT_MATRIX.md
reports/m3/M3_000_GATE.md
products/famili-principal/architecture/FPAI_CONTEXT_BROKER_CONTRACT_V1.md
products/famili-principal/architecture/FPAI_ACTION_BRIDGE_CONTRACT_V1.md
products/famili-principal/architecture/FPAI_SAFETY_HUMAN_HANDOFF_CONTRACT_V1.md
products/famili-principal/architecture/FPAI_MODEL_GATEWAY_BOUNDARY_V1.md
products/famili-principal/architecture/FPAI_MODEL_RUN_LEDGER_V1.md
products/famili-principal/architecture/FPAI_PRODUCT_EVENT_CONTRACT_V1.md
products/famili-principal/architecture/FPAI_MOS_TEXT_RUNTIME_SLICE_V1.md
tools/m3-dangerous-authorization-scan.mjs
```

## 结论
```
READY_FOR_M3_101_AUTHORIZATION_REVIEW = YES
M3_RUNTIME = NOT_AUTHORIZED
```
即使 M3_000=PASS,仍不得启动 M3-101 / CreateFamily runtime / GrowthProfile / AI Agent / 真实模型调用 / DH1 / voice / avatar。**停止,等待总架构师对 M3-101 单独授权。**

## 对 M3-101 的建议
- 先关闭上述 3 个 pre-runtime 契约项(consent scope、gateway hardening、broker 字段对齐)。
- 第一版严格按 `FPAI_MOS_TEXT_RUNTIME_SLICE_V1` 的克制链路:AI 只把用户带入既有 `LISTEN_BEFORE_RESPOND`,不自由生成 GrowthAction。
- provider 经 `cc switch`/CCR(OpenAI 兼容)以 env 接入,零代码改动;先用 `FakeAiGateway` 跑通契约,再切真实 provider。
