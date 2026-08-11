# M3 Runtime — Architect Adjudication (supersedes self-authored gate authorizations)

date: 2026-08-11
issued_by: family-chief-architect
scope: 对 `m3/fpai-runtime-readiness` 上 M3-101A…108 各 Gate 报告的正式裁决。历史 Gate 文档保留(不删),但其中"授权/关闭"表述以本裁决 + AUTHORIZATION_REGISTRY 为准。

## 原则
```
Gate Report = 技术证据 + 测试证据 + 建议。
Gate Report ≠ 授权来源。
"用户已授权 / 用户裁决" 之类自述,不构成正式授权。
授权唯一来源 = governance/AUTHORIZATION_REGISTRY.yaml(由架构师落记)。
```

## 裁决
```
M3_101A (A/B/C)   = PASS_ACCEPTED_CLOSED   正式验收:受控内部 runtime 成立;Action Bridge 不旁路 Growth canonical。
M3_101B           = TECHNICAL_PASS;真实外部文本能力保留;PRODUCTION/PILOT 外呼 = NOT_AUTHORIZED(默认关闭)。
M3_102            = TECHNICAL_PASS;图片通道保留;外部图片处理 = NOT_AUTHORIZED_FOR_PILOT(隔离,默认关闭)。
M3_103            = PASS_INTERNAL(复核工作流可内部运行,不改 canonical)。
M3_104            = PARTIAL_PASS;配额前置拦截成立;计量口径须整改(provider attempt / billable)。
M3_105            = TECHNICAL_PASS;智谱 Adapter 保留;生产 Provider = NOT_AUTHORIZED(以 Provider Registry 为准)。
M3_106            = TECHNICAL_PASS;failover 机制保留;生产启用 = NOT_AUTHORIZED;须 policy-aware。
M3_107            = PASS_INTERNAL_PROTOTYPE;运营台 INTERNAL_OPS_ONLY,默认关闭。
M3_108            = PARTIAL_PASS;Usage API 保留;used 口径须基于真实 provider attempt;INTERNAL_OPS_ONLY。
```

被本裁决取代授权表述的历史 Gate(证据保留):
```
reports/m3/M3_101B_REAL_MODEL_RUNTIME_GATE.md              (其"用户裁决…"授权表述作废)
reports/m3/M3_102_103_104_MULTIMODAL_REVIEW_QUOTA_GATE.md
reports/m3/M3_105_ZHIPU_GLM4V_VISION_PROVIDER_GATE.md
reports/m3/M3_106_107_108_FAILOVER_CONSOLE_QUOTA_ALERT_GATE.md
```

## 后续
所有正式关闭/生产/试点授权,须进入 `M3-INT-001_FPAI_RUNTIME_ADMISSION_GATE` 并在 AUTHORIZATION_REGISTRY 落记。
