# M3-000 Shared File Conflict Matrix

stage: M3-000_FPAI_INTELLIGENCE_INTEGRATION_CONTRACT_GATE
branch: `m3/fpai-intelligence-contract-gate`
worktree: `D:\Family-m3-fpai`(独立;**M2 worktree `D:\Family` 不用于 M3 开发**)
baseline: `origin/wave/m2-wave2-integration = 600c08e`(fetch 已确认,local HEAD 一致)
principle: M3-000 = ARCHITECTURE + CONTRACT + BOUNDARY + RUNTIME_SLICE_DEFINITION + TEST_PLAN。**无任何 runtime 实现。**

---

## OWNED（M3-000 本阶段可新增/修改,仅 contract/doc/test)
```
reports/m3/**
products/famili-principal/architecture/FPAI_*_V1.md
products/famili-principal/architecture/**（仅新增 contract 文档 / JSON Schema / TS 类型契约）
products/famili-principal/architecture/tests/**（contract / forbidden-surface / static 测试)
tools/m3-*.mjs（静态扫描脚本,只读分析)
```

## READ_ONLY（必须审计复用,禁止修改)
```
packages/principal-ai/**        # 唯一智能核心
packages/ai-gateway/**          # 唯一 Provider Gateway
packages/contracts/**
apps/api/src/modules/family/**  # M2 已验证 Named Actions / 安全 / 仓储
apps/web/**                     # WAF 只读其 Principal Entry Contract
specs/**  database/**  events/**  policies/**  security/**  agents/**  models/**
```

## FORBIDDEN（M3-000 一律不得修改)
```
Family ontology / GrowthProfile / GrowthPriority / Intervention / GrowthAction /
OutcomeObservation / GrowthReview / NextStepDecision 的语义
database/migrations/**          # 不为 Principal runtime 建迁移
legacy-system/**  migration/**  FELS  FLM
apps/api/src/modules/waf/**     # 不借 M3 继续开发 WAF 页面功能
apps/api/src/modules/**         # 不新建 apps/api principal runtime module
PROJECT_STATUS.md  CURRENT_SPRINT.md（Gate closure 前不改）
CLAUDE.md  manifest*.json
```

## SHARED（如需引用,只读引用,不改)
```
Family controller/route 风格(x-actor / X-Correlation-Id / Idempotency-Key)
WAF Principal Entry Contract
Consent purposes（specs/ontology/consent.schema.yaml + DB enum）
```

## 规则
- M3-000 若发现必须改动 FORBIDDEN 中的 M2 validated core,**不得直接改**,记 `M3_CONTRACT_CHANGE_REQUEST_REQUIRED` 到 Gate,交总架构师。
- 单一提交所有权:本 worktree 内的提交只含 M3-000 契约产物;跨方向(Family/WAF/FELS/FPAI)混合提交 = 禁止。
