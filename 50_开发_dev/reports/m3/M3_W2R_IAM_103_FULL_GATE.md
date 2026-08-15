# IAM-103 FULL — Bearer 认证运行时强制(Gate 报告)

```text
DOC_KIND = GATE_REPORT
RULING   = M3-MOS-CLOSEOUT-WAVE-2 Lane A(AUTHORIZED,P0)
DATE     = 2026-08-15
BASE     = origin/master @ 26615d5
SCOPE    = 把 x-actor-id 从真实 Consumer 安全路径移除,改为 Bearer→AuthService.resolveActor→family scope
PILOT    = NO   PRODUCTION = NO   (本轮只做代码完整 + 跑通 Gate)
```

## 一、链路

```text
Authorization: Bearer <token>
  → AuthService.resolveActor()  (无效/过期/撤销 → null)
  → ResolvedActor { personId, familyId }
  → family scope:actor.familyId == :familyId  (否则 403)
  → Principal / Growth Named Action(canonical 仍只经 Named Action)
```

## 二、三类主体

| 主体 | 强制(FPAI_REQUIRE_BEARER=true) |
|---|---|
| **Family Member**(消费:sessions/messages/session/proposals·accept/feedback) | 有效 Bearer + familyId 匹配;否则 401/403;x-actor-id-only → 401 |
| **Reviewer**(handoffs list/resolve) | 认证身份(Bearer)+ reviewer 授权(FPAI_REQUIRE_REVIEWER_AUTH + FPAI_REVIEWER_IDS);非 reviewer → 403 |
| **Internal Ops**(usage/review-console) | 保留独立 `assertInternalOps`(FPAI_INTERNAL_OPS),与 Consumer/Reviewer 分离 |

flag 关(默认内部 dogfood):无 Bearer 回退 x-actor-id(现行为不变);带 Bearer 仍强制解析 + family scope。

## 三、硬测试(principal-iam103.e2e-spec.ts,9/9 PASS)

```text
VALID_BEARER → 201
NO_BEARER (require=true) → 401
x-actor-id ONLY (require=true) → 401 (DENY)
EXPIRED_BEARER → 401
REVOKED_BEARER → 401
WRONG_FAMILY → 403
VALID_FAMILY_MEMBER → Principal message 201
NON_REVIEWER → handoffs 403
VALID_REVIEWER → handoffs 200
CANONICAL_WRITE_BYPASS = 0  (Principal 消息不写 growth_actions;Named Action 未被绕过)
```

## 四、回归

```text
全 e2e 104/104(95 基线 + 9 IAM-103,x-actor-id 既有用例隔离不破)· integration 40/40 · api 单测 95/95 · typecheck 全包 · 授权扫描 PASS(0)
```

## 五、边界

pilot/production = NO;真实家庭数据未用。IAM-103 与 W2R-105 都触碰 Principal Controller,最终须在共同 integration 分支合流后跑完整 Golden E2E。AUTO_MERGE=NO。
