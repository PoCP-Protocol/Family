# FPAI Safety / Human Handoff Contract V1

purpose: 冻结安全路由与人工交接。复用 `@family/principal-ai` 的 `safetyPrecheck` / `safetyPostcheck` / `PrincipalRiskRoute`。
runtime: **NOT_AUTHORIZED**（仅契约)

---

## 1. 三条 Route
```
NORMAL     正常 coaching + 可产出 Action Proposal
REVIEW     需复核:降级/限制 proposal,标记待人工/领域复核
HIGH_RISK  停止普通 coaching;禁止普通 Action Proposal;禁止 canonical action bridge;必须 human handoff
```

## 2. 双层安全(顺序不变量)
```
Safety Precheck  —— 在 model invocation 之前(明显高风险输入不得发给普通 coaching 模型)
      ↓
(仅 NORMAL/REVIEW 且通过) Model Invocation via @family/ai-gateway
      ↓
Safety Postcheck —— 模型返回后再检
```
`safetyPrecheck` / `safetyPostcheck` 已存在于 `@family/principal-ai`,**复用,不重写**。

## 3. HIGH_RISK 不变量
```
HIGH_RISK ⇒ no normal coaching output
HIGH_RISK ⇒ no PrincipalActionProposal(canonical=false 亦不产出)
HIGH_RISK ⇒ action bridge FORBIDDEN
HIGH_RISK ⇒ PrincipalHumanHandoff required
```

## 4. PrincipalHumanHandoff 字段(冻结)
```
handoff_id
session_id
family_id
subject_id
risk_route = HIGH_RISK | REVIEW
trigger_reason              # precheck / postcheck / scenario
created_at
status                      # OPEN / ACKNOWLEDGED / CLOSED
assigned_role               # 复用现有 Staff/Advisor 权限语义(只读引用)
```
handoff 是 L3 对象,`!= Growth canonical state`;不得由 AI 直接改核心状态。

## 5. Fail-closed
安全失败(precheck/postcheck 命中、或安全判定不可用)⇒ **不给普通建议、不产出 proposal**,进入 REVIEW/HIGH_RISK 路由;绝不"因模型报错就把原始文本给用户"。
