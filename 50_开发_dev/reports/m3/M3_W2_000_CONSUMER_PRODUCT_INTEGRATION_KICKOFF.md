# M3-W2-000 — Consumer Product Integration Kickoff / Scope Gate

date: 2026-08-12
branch: `m3/w2-consumer-integration`(off `m3/family-1-0-mos @ 3a5bd94`,FPAI Runtime 已并入)
status: **KICKOFF_PROPOSAL — 待总架构师批准范围后方可进入建造。本文件不含新功能实现,仅定范围/边界/第一切片/gate。**
mandate: 令 §47 —— Admission 之后不再扩 FPAI 后台能力,转入消费产品链:
`WAF → 法咪莉校长 → Action Proposal → Human Confirmation → Growth OS → Check-in → Timeline → 次日回来`。

## 0. 核心判断:M3-W2 主要是「打通」,不是「造新能力」
链路各环大多**已存在**,W2 的价值是把它们**接成一条真实消费者可走通的闭环 + 消费端 UI**,而非新增后台智能。

| 链路环 | 既有资产 | 状态 | W2 需要做 |
|---|---|---|---|
| 消费入口(WAF / we-are-family) | `products/we-are-family` 多模态 UI(前端) | 部分 | 接真实 API 的家长入口页/流程(待确认 WAF 精确定义) |
| 法咪莉校长 | Principal Runtime(sessions/messages→response+proposal) | ✅ 已建 | 复用;默认确定性 soul(外呼仍 NOT_AUTHORIZED) |
| Action Proposal | `principal_action_proposals`(canonical=false) | ✅ 已建 | 复用 |
| Human Confirmation | accept 端点 → 既有 `StartIntervention` Named Action(101A-C) | ✅ 已建 | 复用;家长确认 UI |
| Growth OS | `intervention_episodes` / `growth_actions` / complete / review(M1/M2) | ✅ 已建 | 复用 |
| Check-in / Today | `growth/actions/today` + complete-action(M2 Wave2) | ✅ 已建 | 消费端签到 UI |
| Timeline | 时间线/provenance(M2 Wave3) | ✅ 已建 | 消费端时间线视图 |
| 次日回来 | today action 边界 + 复盘(M2 Wave2/3) | ✅ 已建 | 端到端"次日再来"体验串联 |

结论:后端能力齐全,**W2 = 编排 + 消费端 UI + 端到端闭环验证**。

## 1. 边界与授权(不变,继承 M3-INT-001)
```
REAL_MODEL 默认外呼 = NO(消费流由确定性 soul 驱动;真实外呼仍 NOT_AUTHORIZED)
IMAGE 对外 / 生产 Provider / SFT / DH1 = NOT_AUTHORIZED
AI 不写 canonical;proposal canonical=false;唯有 Human Confirmation 经既有 Named Action 落 Growth
危机 HIGH_RISK 不外呼 + 转人工;FAIL CLOSED 不变
授权来源 = governance/AUTHORIZATION_REGISTRY.yaml(W2 不自增授权)
```

## 2. 第一切片提案:W2-101 «一条真实闭环»
最小可走通的家长端闭环(全部复用既有后端 Named Action / Principal 端点):
```
家长在消费入口提问(校长)
  → 收到 Action Proposal(今晚一件小事,LISTEN_BEFORE_RESPOND)
  → 家长确认(Human Gate → StartIntervention)
  → Growth OS 生成 7 天 action;今日 action 可见
  → 家长完成今日 action + 写复盘
  → 次日回来:今日 action 前移,时间线含 provenance
```
交付:消费端 UI(we-are-family 接真实 API)+ 端到端 E2E(真实 PG + HTTP)+ 浏览器验证。
不含:真实模型外呼、图片、任何新 canonical 写法、任何新 Growth intervention。

## 3. W2-101 Gate 标准(建造完成后)
```
CONSUMER_E2E            = 家长端一条闭环真实 PG+HTTP 全绿
HUMAN_GATE_ENFORCED     = proposal→Growth 仅经 accept→StartIntervention;无旁路
AI_CANONICAL_WRITES     = 0
REAL_MODEL_CALLS        = 0(确定性 soul)
NEXT_DAY_RETURN         = today action 边界 + timeline provenance 可复现
M2/M1 语义             = 0 改动
CI                     = Family Required Gates + m3-foundation 双绿
```

## 4. 待架构师确认(建造前)
```
Q1 WAF 的精确定义/范围?(消费入口是 we-are-family 现有 UI 增强,还是新 surface?)
Q2 W2-101 切片是否即批,还是先补 W2 契约/UX 设计?
Q3 消费端是否仍走 x-actor-id 内部身份,或需先接真实用户 IAM(影响 pilot readiness)?
Q4 分支/worktree:W2 在 m3/w2-consumer-integration → 最终 PR 回 family-1-0-mos,对否?
```

## 5. 结论
```
M3-W2-000 = KICKOFF_PROPOSAL(范围/边界/第一切片已定,后端能力齐全)。
请架构师批准 W2-101 切片(及 Q1–Q4)后,我再进入建造;在此之前不写实现代码。
并行:family-1-0-mos → master 集成评审见 PR #2(DRAFT,待终审)。
```
