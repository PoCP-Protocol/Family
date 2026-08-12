# M3-W2-IAM-000 — Consumer Identity (IAM) Scope Gate

date: 2026-08-12
branch: `m3/w2-consumer-integration`
status: **SCOPE_PROPOSAL — 仅定范围/边界/阶段;不含实现。IAM 是 pilot 的硬前置,须架构师批准范围后再建。**
why now: WF1-C / W2-101 已内部级可用,但 `pilot_authorized = NO` 的根因是**没有真实用户身份**——现全程 `x-actor-id` 内部身份。真实外部家庭试点前必须先过本 gate。

## 0. 现状(实测)
```
apps/web / apps/api 全程 X-Actor-Id: config.actorPersonId(客户端可任填)
无登录、无会话令牌、无租户隔离、无"当前用户=某 person"的可信绑定
AUTHORIZATION_REGISTRY: 多能力 pilot_authorized/production_authorized = NO(受此阻)
101A-A 记录: BEARER_AUTH = FUTURE_IAM;IAM_PILOT_READY = NO
```

## 1. 目标(pilot 级最小充分)
```
真实家长可登录 → 获得可信身份 → 该身份被服务器绑定到某 family 的某 guardian person
所有写操作的 actor 来自令牌(不可由客户端伪造 x-actor-id)
家庭级隔离:A 家长不能读/写 B 家庭
未成年人数据的监护人授权链可追溯(接既有 consent canonical)
```

## 2. 边界(不做/暂不做)
```
不自建密码体系(优先托管:微信/手机号 OTP 等国内可行方案,或既有 IdP)
不引入 SSO/企业目录(消费级不需要)
不改 canonical consent 语义(IAM 只解决"你是谁",授权仍走既有 consent)
不在本 gate 打开任何真实模型/图片/生产 provider(与 IAM 正交)
```

## 3. 待架构师决策(建造前)
```
Q-IAM-1 身份提供方:手机号 OTP / 微信登录 / 既有 IdP?(国内消费级取向)
Q-IAM-2 令牌形态:服务端会话 cookie 还是 Bearer JWT?(现有 header 契约影响面)
Q-IAM-3 actor 绑定:令牌 → person_id 的映射存哪(新表 or persons.account_id 既有字段)?
Q-IAM-4 迁移:x-actor-id 内部通道保留为"内部 Ops/测试"专用(feature-flag),消费路径强制令牌?
Q-IAM-5 pilot 规模与数据驻留/合规要求?
```

## 4. 建议阶段(批准后)
```
IAM-101 身份接入(登录 + 令牌签发 + 令牌→person 绑定;persons.account_id 复用)
IAM-102 服务端强制:消费端写操作 actor 来自令牌;家庭级授权中间件(family 归属校验)
IAM-103 x-actor-id 降级为内部专用(FPAI_INTERNAL_OPS 同款 flag);消费路径拒绝裸 x-actor-id
IAM-104 pilot readiness gate:更新 registry pilot_authorized(WF1-C 等)= 视范围逐项开
```

## 5. 结论
```
IAM = pilot 的唯一硬阻断;与真实模型/图片/provider 授权正交(各自单独 gate)。
本 gate 只提范围;请架构师就 Q-IAM-1..5 定调后,我再进入 IAM-101 建造。
在此之前:消费端保持内部 dogfood 级(x-actor-id),不对真实外部家庭开放。
```
