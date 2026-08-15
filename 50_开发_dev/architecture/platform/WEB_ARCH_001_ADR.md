# WEB-ARCH-001 —— Family Web Platform Shell 架构决策(ADR)

```text
DOC_KIND = ADR
RULING   = FAMILY-PLATFORM-V1-BUILD-001 §1(P0)
DATE     = 2026-08-15
STATUS   = ACCEPTED(架构决策;实现分步,渐进迁移)
```

## 1. 背景

现状 `apps/web/src` = `app.js / principal.js / waf.js / wave2.js / wave3.js` 平铺页面模块,靠 URL 参数(`?product=`、`#principal`、`familyId/actorPersonId/childId`)决定展示与身份。这在 M1/M2 验证期合适,但:
- **URL 携带 `familyId/actorPersonId/childId` 作为信任来源**(安全缺陷,P0)。
- 无正式 Router / Session 状态层 / 统一 API client / 认证壳。
- 继续往上堆(支付/专家/通知/账户/报告/会员/家庭管理)会迅速失控。

## 2. 决策

建立**单一** `apps/web` 的类型化平台结构(不建第二套并行消费端,不大爆炸重写):

```text
src/platform/
  shell/          # 认证后的应用外壳(布局、主导航 Today/Growth/Principal/Family)
  router/         # 真实路由(非 URL 参数信任);路由表 + 守卫
  session/        # Session 状态层:Bearer 令牌存取、恢复、过期/撤销处理
  api/            # 统一 API data client(自动附 Authorization: Bearer;401→登录;错误规范化)
  auth/           # 登录/注册/登出/whoami 前台流程
  family-context/ # current Person / current Family / current Subject(来自 whoami,非 URL)
  components/      # 通用组件(loading/error/empty 状态)
  errors/          # 错误边界与规范化
  layout/          # 移动优先布局
```

## 3. 硬约束

```text
URL 不再作为以下的信任来源:actorPersonId · familyId · childId(内部 ID 永不要求用户从 URL 输入)
统一 API client 是唯一出网口:自动附 Bearer;无 Bearer(PLATFORM_AUTH_MODE=required)→ 跳登录
current Family/Person/Subject 来自认证后的 whoami / family-context,不来自查询串
```

## 4. 渐进迁移(NO BIG-BANG REWRITE)

```text
Step 1  引入 platform/ 骨架 + shell + session + api client(本 ADR 附最小类型化骨架)
Step 2  现有 Growth/Principal/WAF 页面经【兼容适配器】挂载进 shell(不删)
Step 3  逐个页面迁移到平台路由 + 统一 api client + family-context,移除 URL 信任
Step 4  移除旧 app.js 的 URL-参数产品选择;主导航收敛为 Today/Growth/Principal/Family
```
原则:`ONE apps/web · NO SECOND PARALLEL PRODUCT WEB · INCREMENTAL PLATFORMIZATION`。

## 5. 与后端的关系

平台壳消费的身份链 = IAM-103(已 master)+ PLATFORM-IAM-104(全平台 Bearer,下一步):
```text
Browser → (platform/api 附 Bearer) → AuthService.resolveActor → FamilyMembership/Scope → Named Action
```

## 6. 验收

见 `reports/platform/PLATFORM_SHELL_GATE.md`。骨架首版随本 PR;完整壳与页面迁移为后续增量 PR(各自 Draft,AUTO_MERGE=NO)。
