# M3-INT-001 — FPAI Runtime Admission & Governance Reconciliation Gate

date: 2026-08-11
branch: `m3/fpai-runtime-admission-fix`(off frozen evidence `99d4797`)
evidence_baseline (frozen): `m3/fpai-runtime-readiness @ 99d479755510cd85f55a19fbc7127a6fee16c3d0`
status: **TRANCHE_1_DONE — 安全/治理阻断项已闭合;账本/配额口径/policy-aware failover/MOS 程序分支 为 TRANCHE_2。**
mission: 不加功能,把高质量隔离研发线变成可合法并入 Family 1.0 MOS 的 Runtime Candidate。

## 判定矩阵(§45)
```
M3_101A                       = PASS_ACCEPTED
M3_101B_CODE                  = PASS (integration candidate; 代码保留)
REAL_MODEL_DEFAULT_ENABLED    = NO            # 默认 internal profile,外呼默认关闭(单测证明)
PROCESSING_POLICY_RUNTIME     = PASS          # evaluateProcessing 已强制接入 handleMessage 外呼前;6 项 enforcement 单测绿
EXTERNAL_TEXT_PROCESSING      = PASS          # 需 AI_PERSONALIZATION GRANTED + profile 允许 + provider/policy 批 + 类别白名单,否则 DENY→确定性回退
IMAGE_PROCESSING              = DISABLED      # 图片对外隔离;收到即 quarantine 不外发(单测 lastImages=undefined)
AUTHORIZATION_REGISTRY        = PASS          # governance/AUTHORIZATION_REGISTRY.yaml;扫描以其为授权来源
PROVIDER_REGISTRY             = PASS          # governance/FPAI_PROVIDER_REGISTRY.yaml(anthropic/zhipu = TECHNICALLY_VALIDATED,非 production)
DANGEROUS_AUTH_SCAN           = PASS          # runtime 代码存在但 registry 未授权 → FAIL;当前 registry 已授权 101A runtime → PASS(0 hits)
MODEL_RUN_LEDGER              = PASS          # principal_model_runs 存在
MODEL_ATTEMPT_LEDGER          = DEFERRED_T2   # principal_model_attempts 未建(§22-26)→ TRANCHE_2
QUOTA_ACCOUNTING              = PARTIAL       # 前置拦截成立;used 仍基于成功 run,须改 provider attempt/billable(§27-28)→ TRANCHE_2
FAILOVER_POLICY_AWARE         = PARTIAL       # RoutingAiGateway 仅 infra-only + 默认关闭;按数据类别/consent 的 provider 准入路由 → TRANCHE_2
REVIEW_WORKFLOW               = PASS_INTERNAL
REVIEW_CONSOLE                = INTERNAL_ONLY # 默认关闭,FPAI_INTERNAL_OPS=true 才开;e2e 证明默认 404
USAGE_ENDPOINT                = INTERNAL_ONLY # 同上,默认 404
DIRECT_GROWTH_WRITES          = 0
HIGH_RISK_EXTERNAL_ATTEMPTS   = 0             # 单测:HIGH_RISK spy.called=false
M2_SEMANTIC_CHANGES           = 0
SFT                           = NOT_AUTHORIZED
DISTILLATION                  = NOT_AUTHORIZED
DH1 / VOICE / AVATAR          = NOT_AUTHORIZED
WAF_WF1_C                     = NOT_AUTHORIZED

BLOCKERS (to final PR)        = 4
  B1 MODEL_ATTEMPT_LEDGER (Run/Attempt 拆分 + 外呼前 persist + failover/timeout 计入)
  B2 QUOTA_ATTEMPT_ACCOUNTING (used=provider attempts;usage 返回 attempts/failovers/cost)
  B3 FAILOVER_POLICY_AWARE (Router 只在同一 processing 授权的 approved provider 间切换)
  B4 M3-RB-002 / m3/family-1-0-mos (V3.3 SSOT rebaseline;Runtime PR 的并入基)
```

## 本 tranche 交付(TRANCHE_1)
```
分支隔离            证据分支 99d4797 冻结;修复分支 m3/fpai-runtime-admission-fix(说明:采用同 worktree 隔离分支,等价隔离意图)
授权治理 SSOT       AUTHORIZATION_REGISTRY.yaml + FPAI_PROVIDER_REGISTRY.yaml
扫描升级            m3-dangerous-authorization-scan 读 registry;Gate 文档不再是授权来源(§6/§8)
P0 强制             evaluateProcessing 重写(ALLOW/DENY/REVIEW + FAIL_CLOSED + 数据类别 + 未成年人/图片/provider/policy 门)并接入 handleMessage 外呼前
默认外呼关闭        RuntimeProfile(internal 默认);willCallExternal = gateway && processing.allowed
图片隔离            收到图片一律 quarantine 不外发;记 principal_image_quarantined
内部 Ops 专用       review-console + usage 默认 404,须 FPAI_INTERNAL_OPS=true
历史 Gate 裁决       M3_RUNTIME_ARCHITECT_ADJUDICATION.md(101A 接受;101B–108 证据保留、授权表述被取代)
```

## 证据(offline,fresh PG 0001–0013)
```
package units   principal-runtime 21 · ai-gateway 28 · principal-ai 15
api unit        85(含 principal.service.spec 6 项 enforcement:granted+livecheck→外呼;默认/无consent/撤回/HIGH_RISK→不外呼;图片→quarantine)
api integration 40
api e2e         80(含 internal-ops 默认 404;usage UNLIMITED;console HTML)
scan            M3 STATIC + GOVERNANCE SCAN PASS (0 hits)
builds+typecheck  clean
```

## 安全不变量(保持)
```
危机不外呼 / AI 不写 canonical / proposal canonical=false / Action Bridge 不旁路既有 Named Action /
FAIL CLOSED 不返原始文本 / 默认零外呼 / keys 仅本机 .env / M2 语义零改。
```

## PASS 语义(§46)
```
本 Gate TRANCHE_1 PASS 只表示:安全/治理阻断已消除,Runtime 代码在治理约束下可继续走 Admission。
不表示:PUBLIC_LAUNCH / PILOT_READY / ALL_PROVIDERS_ENABLED。
最终 PR(admission-fix → m3/family-1-0-mos)须 B1–B4 全部 PASS 且 BLOCKERS=0,并由总架构师做 M3-W1 最终评审;AUTO_MERGE=NO。
```

## 下一步
```
TRANCHE_2:B1 Attempt Ledger → B2 配额口径 → B3 policy-aware failover → B4 RB-002/MOS 分支;
之后开 PR 待 M3-W1 最终评审。继续禁止加功能。
```
