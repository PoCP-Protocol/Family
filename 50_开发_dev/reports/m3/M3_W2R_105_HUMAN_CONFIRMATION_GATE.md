# M3-W2R-105 Human Confirmation 闭环 Gate 报告

date: 2026-08-13 · 阶段:M3-W2R(质量闸判 REVIEW 后的人工确认闭环)
上游:W2R-102(真实模型内部默认开)→ W2R-103(循证检索)→ W2R-104(智能质量闸)→ **W2R-105(Human Confirmation 闭环)**
授权来源:`governance/AUTHORIZATION_REGISTRY.yaml` → `W2R_105_HUMAN_CONFIRMATION_CLOSURE`(本报告仅为证据,不自我宣称授权)
授权人:family-chief-architect(本轮显式授权重做 W2R-105;此前同名工作树曾丢失、从未进入 git)

## 1. 目标与定位

W2R-104 智能质量闸能把「结构合法但答非所问 / 标签判错 / 漏判风险」的输出**降级为 REVIEW** 并入人工队列,但在 W2R-104 的**过渡实现**里,被降级的 REVIEW 响应**仍会连同 `output` 一起返回给家长**(`human_handoff=false`)——即"进了复核队列,但家长其实已经看到了"。这与硬规则 **「高风险家庭场景必须 Human Gate」** 相抵。

W2R-105 补上这道 Human Gate 闭环:

```
REVIEW 响应 → 【扣留】(response=null, human_handoff=true),response_id 挂到 handoff
           → 人工复核 APPROVED → 【释放】给家长
           → REJECTED / ESCALATED / INFO_ONLY → 保持扣留(永不释放该响应)
```

对应 CAPABILITY_TRUTH principle 三支柱的 **「HUMANS CONFIRM」**:MODEL UNDERSTANDS(生成响应)· RULES CONSTRAIN(质量闸降级)· **HUMANS CONFIRM(人工确认才放行)**。

## 2. 授权与边界

```
能力性质      = 安全控制面(DETERMINISTIC_GUARDRAIL),非生成式能力
外呼面        = 0(扣留/释放纯确定性,不调用任何外部模型)
释放决策       = 仅人工 APPROVED;生成式 AI 不参与是否释放
不变量        = 只 APPROVED 释放 + 幂等(released_at 一次性)+ 不可放宽(非 APPROVED 绝不释放)
canonical     = 不写(handoff/response 均非 Growth 事实)
pilot/production = 仍 NOT_AUTHORIZED
supersedes    = W2R-104 过渡期"REVIEW 响应直接展示给家长"
```

## 3. 实现(migration + repository + service + controller)

- **0017 迁移** `database/migrations/0017_principal_handoff_confirmation.sql`
  `principal_human_handoffs` 加 `response_id`(挂扣留的候选响应,FK→principal_responses,ON DELETE SET NULL)+ `released_at`(释放时刻);幂等 `ADD COLUMN IF NOT EXISTS`;窄索引 `idx_principal_handoffs_released`(仅已释放行)。
- **repository** `apps/api/.../principal.repository.ts`
  `saveHandoff(...)` 加 `responseId` 参数;新增 `loadHandoff` / `loadResponse` / `markHandoffReleased`(仅对已 APPROVED 且未释放的 handoff 打戳,幂等);`listOpenHandoffs` 带出 `response_id`。
- **service** `apps/api/.../principal.service.ts`
  REVIEW 分支改为**扣留早返回**:`saveHandoff(..., resp.response_id)` + `principal_human_handoff_created` 事件,返回 `response=null, human_handoff=true`。`resolveHandoff` 返回值由 `boolean` 改为 `{ ok, released_response }`:APPROVED 且 handoff 挂有扣留响应 → `markHandoffReleased` + `principal_handoff_response_released` 事件 + 返回响应体;其余保持扣留。
- **controller** `apps/api/.../principal.controller.ts`
  `POST handoffs/:id/resolve` 适配新返回值:`{ ok, resolution, released_response }`;`!ok` → 404。

## 4. 不变量(保持)

```
危机 HIGH_RISK → 仍在质量闸之前短路转人工(不受本闭环影响)
质量闸只降级不放宽(仅 NORMAL→REVIEW)—— W2R-104 不变
释放只降级的对偶:仅人工 APPROVED 释放,幂等,非 APPROVED 永不释放
AI 不写 canonical;proposal→Human Gate→Named Action;CI 零外呼(本能力不新增外呼)
真实家庭 pilot = NOT_AUTHORIZED
```

## 5. 证据

```
principal.service.spec.ts(W2R-104 断言更新 + W2R-105 新增):
  W2R-104 REVIEW 契约已更新为 W2R-105:human_handoff=true + response=null(扣留) + response_id 挂 handoff
  W2R-105:
    APPROVED → 释放候选响应 + principal_handoff_response_released 事件
    APPROVED 幂等:二次 resolve → ok=false,不再释放(handoff 已非 OPEN)
    REJECTED / ESCALATED / INFO_ONLY → released_response=null,不发 released 事件(保持扣留)
    不存在/跨家庭 handoff → ok=false,不释放
  既有 W2R-101/102/104 spec:不回归
```

（说明:单测走确定性 fakeRepo/内存态,零外呼;e2e/DB 用例随 testdb 迁移到 0017 后验证。）

## 6. 结论

```
W2R-105 = Human Confirmation 闭环已接线并授权(内部;确定性控制面,零外呼)。
REVIEW 响应自此【扣留待人工确认】,APPROVED 才释放 —— Human Gate 闭合。
pilot/production 仍不动;不写 canonical;不训练。
```
