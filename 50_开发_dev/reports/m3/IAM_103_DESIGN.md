# IAM-103 设计稿 — 身份进入运行时(消费/审核/运维 三角色)

```text
DOC_KIND = DESIGN_ONLY (不启用 runtime;实现/启用须架构师授权;pilot-gated)
RULING   = 架构师复盘 2026-08-14 §5–7(身份未进消费路径 + Review Queue 无 reviewer 授权)
PRIORITY = P0(pilot 前必做);不阻塞 synthetic 内部 eval
```

## 一、现状(高序真相:代码)
```text
IAM-101 = REAL:AuthService 签发不透明 Bearer(随机 token→SHA256 存储),resolveActor(token)→{personId,familyId,accountId},expiry/revoke 齐。
IAM-102 = REAL:OtpService(6位/哈希/过期/限流/一次性 consume)→ phone→Person → issueSession()。
缺口:
  · 消费路径(principal.controller)仍用 `x-actor-id` + requireActor(仅判字符串非空),未验证该 actor 是否经 Bearer 认证、是否属该 family。
  · Review Queue 端点 GET/POST `.../principal/handoffs[/:id/resolve]` 只 requireActor(x-actor-id),无 reviewer 角色授权(§7)。
  · Ops 端点(console/usage)已 assertInternalOps(),相对完整。
```

## 二、目标
把已有的真实身份基础设施**接进运行时强制**,覆盖三类角色:
```text
FAMILY_MEMBER  消费端(家长)—— 必须 Bearer 认证 + actor∈family scope
REVIEWER       人工复核 —— 必须 reviewer 角色授权(不是任意 x-actor-id)
INTERNAL_OPS   运维 —— 维持 assertInternalOps()
```

## 三、设计
1. **统一认证中间件/守卫** `resolveAuthenticatedActor(req)`:
   - 读 `Authorization: Bearer <token>` → `AuthService.resolveActor(token)` → {personId, familyId, role?}。失败 → 401。
   - 保留 `x-actor-id` 仅作**内部 dogfood**(profile=internal),生产/pilot 关闭(env gate);二者不可混用绕过。
2. **消费端(Family scope)**:principal 消费端点在认证后断言 `resolvedFamilyId === :familyId`(跨家庭 → 403)。替换现 `requireActor(x-actor-id)` 为 `requireAuthenticatedFamilyActor()`。
3. **Reviewer 授权**:handoffs list/resolve 加 `assertReviewer(actor)`——reviewer 角色来自身份声明/allowlist(内部)或未来 staff 表映射;非 reviewer → 403。补 product_event `principal_review_actor_denied`。
4. **角色来源**:短期 role 由内部 allowlist/claim;长期接 `legacy_staff`/成员关系(与 TENANCY-001 协同:家庭成员/监护/机构顾问/撤销访问)。
5. **迁移路径(fail-safe)**:
   - Phase A(内部):Bearer 与 x-actor-id 双接受(env=internal);默认行为不变,新增 Bearer 通道 + 单测。
   - Phase B(pilot 前):`FPAI_REQUIRE_BEARER=true` → x-actor-id 关闭,三角色强制;Review Queue 必须 reviewer。

## 四、不变量与边界
```text
不改核心状态写入口(仍 Named Action);仅在入口加认证/授权。
FAIL CLOSED:无 Bearer/角色不符 → 401/403,不降级放行。
与 TENANCY-001 协同:family 成员/监护/机构关系/撤销 是 role 的真实来源。
DESIGN_ONLY:本稿不启用;实现与 pilot 启用须架构师授权(AUTHORIZATION_REGISTRY 落记)。
```

## 五、验收(实现阶段)
```text
Bearer 有效 → 消费端 200 且 actor 绑定正确 family;无/失效 Bearer → 401
跨家庭 actor → 403;非 reviewer 调 handoffs → 403(product_event 记 denied)
x-actor-id 在 FPAI_REQUIRE_BEARER=true 下被拒;e2e 覆盖三角色
```
