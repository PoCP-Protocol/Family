# FPAI MOS Text Runtime Slice V1（仅设计,不实现)

target: 未来 `M3-101_FPAI_TEXT_MOS_VERTICAL_SLICE`
status: **DEFINED / NOT_AUTHORIZED**(本阶段仅定义,禁止实现;runtime、API principal module、DB 迁移、浏览器 AI 运行一律不做)

---

## 1. 第一版真实 AI Growth Loop（未来跑通目标)
```
WAF
 ↓ Ask 法咪莉校长
Principal Session
 ↓ Consent Check（AI_PERSONALIZATION,见 Context Broker consent gap)
Context Broker（ALLOWLIST 只读)
 ↓ Safety Precheck
Reviewed Retrieval（REVIEWED_METHOD/KNOWLEDGE_CARDS)
 ↓ Principal Soul（PRINCIPAL_SOUL_PROFILE)
AI Gateway（@family/ai-gateway,structured)
 ↓ Structured Response（PRINCIPAL_AI_OUTPUT_SCHEMA)
Schema Validation（validatePrincipalOutput)
 ↓ Safety Postcheck
Tonight Say（SayItTonightOutput)
 ↓ One Small Action Proposal（PrincipalActionProposal,canonical=false)
User Explicit Confirmation
 ↓ Action Bridge（Proposal → 既有 Intervention)
Existing Family Named Action
 ↓ LISTEN_BEFORE_RESPOND（既有确定性干预)
GrowthAction → Check-In / Reflection → Timeline → 返回
```

## 2. 复用清单(不重造)
- 智能:`@family/principal-ai`(soul/output schema/retrieval/safety/action card/say-it-tonight/model run)
- Provider:`@family/ai-gateway`
- 成长写入:既有 M2 Named Actions(StartIntervention / Today GrowthAction / CompleteGrowthAction / OutcomeObservation / GrowthReview / NextStepDecision / Timeline)
- 治理:既有 Audit / Outbox / Idempotency / Correlation ID

## 3. M3-101 授权前置(本阶段不满足即不得启动)
- M3-000 Gate = PASS
- Context Broker allowlist 字段全部对齐真实读模型
- Consent scope(AI_PERSONALIZATION)收紧项关闭或明确接受
- 总架构师对 M3-101 单独授权

## 4. 明确不做(本阶段)
```
production model call / real user conversation runtime
apps/api principal module runtime / DB migration for principal runtime
browser AI runtime / DH1 / voice / avatar
AI 自由生成 GrowthAction/Priority/Profile
```
