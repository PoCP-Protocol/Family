# FPAI Principal API Contract V1（仅契约,runtime NOT_AUTHORIZED)

purpose: 冻结最小 Principal API 形状,对齐现有 Family controller 规范(`x-actor` / `X-Correlation-Id` / `Idempotency-Key`,`POST /families/:familyId/...`)。**不实现,不建 apps/api principal module。**

---

## 1. 候选端点(需在 M3-101 授权后对照现有路由最终冻结)
```
POST /families/:familyId/principal/sessions
POST /families/:familyId/principal/sessions/:sessionId/messages
GET  /families/:familyId/principal/sessions/:sessionId
POST /families/:familyId/principal/action-proposals/:proposalId/accept
POST /families/:familyId/principal/responses/:responseId/feedback
```

## 2. 头/约定(复用 Family 现状,非机械照搬)
```
x-actor-id         必填(内部受控 runtime 身份;与现有 Family Controller 一致)
X-Correlation-Id   必填(贯穿 audit/event/modelrun)
Idempotency-Key    对写端点(messages / accept / feedback)必填
```

> **【M3-101A-A1 纠正】** 现有 Family Controller 真实使用 `@Headers('x-actor-id')`,**没有 Bearer Auth**。故:
> ```
> M3_INTERNAL_ACTOR_CONTEXT = x-actor-id     # 内部受控 runtime 身份,INTERNAL_ONLY
> BEARER_AUTH               = FUTURE_IAM      # 不在 M3-101A 建 OAuth/JWT
> IAM_PILOT_READY           = NO
> ```
> `x-actor-id` **不得**被描述为生产级安全认证;真实 IAM 留待 MOS Operability Gate。

## 3. 语义边界(与契约一致)
- `messages`:进入 Session→Consent(AI_PERSONALIZATION)→Context Broker→Safety Precheck→Retrieval→Soul→Gateway→Schema Validation→Safety Postcheck→PrincipalResponse(+可选 Tonight Say / ActionProposal)。**产出 PrincipalResponse/Proposal,非 canonical。**
- `action-proposals/:id/accept`:须带 `explicit_confirmation`,经 Action Bridge → 既有 Named Action;`HIGH_RISK` proposal 不可 accept。
- `GET sessions/:id`:只读 L3 Principal 对象,不回传 canonical truth 明文(按 allowlist/最小化)。
- `feedback`:写 PrincipalFeedback(L3),不改 canonical。

## 4. 不变量
```
无 generic PATCH/PUT 核心对象
所有写端点走 Named Action / L3 对象,绝不直写 Family/Growth canonical
schema 校验失败 / safety 失败 → 不进入 canonical(FAIL CLOSED)
最终 URL/schema 冻结前必须对照现有 Family controller + WAF routes
```
