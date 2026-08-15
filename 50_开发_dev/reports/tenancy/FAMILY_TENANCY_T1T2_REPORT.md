# FAMILY TENANCY T1/T2 报告(PR-A backend)

```text
RULING = FAMILY-PLATFORM-TENANCY-CLOSEOUT-002
DATE   = 2026-08-15
BASE   = master @ 268a6662(含 DEVOS-CONV-003 / PR #27)
BRANCH = platform/tenancy-v2-t1-t2
SCOPE  = PR-A(TENANCY-T1T2-BACKEND);PR-B(PLATFORM-SESSION-001 浏览器安全会话)独立、待联合 Gate
```

## 22 项

```text
1  new master SHA(PR#27 后)      = 268a6662c543f5ab2eeebd1b24d850d93da68927
2  T1/T2 分支                     = platform/tenancy-v2-t1-t2(Draft PR 待开;joint gate 前不合)
3  migrations                     = 0018(accounts/account_person_bindings/family_memberships+回填)· 0019(session 可空+account_ref)
4  account/session model          = Bearer→Account 会话(account_ref);family_id/person_id 可空;/auth/me + /auth/contexts
5  zero-family account            = PASS(contexts=[];OTP 未注册手机可登录)
6  multi-family context           = PASS(一 account 多 family;contexts 列全;逐个可解析)
7  CreateFirstFamily              = PASS(单事务 Family+Guardian+Binding+OWNER_GUARDIAN membership;二次拒;失败回滚)
8  role permission matrix         = PASS(FamilyAuthorizationPolicy 显式矩阵,无 RBAC 引擎/DSL;8 端点 @RequireFamilyAction 强制;单测 6/6)
9  x-actor-id remaining(消费)    = 0(Family 24 端点迁 @ActorId;required 模式 x-actor-only→401)
10 browser token storage          = 待 PR-B(PLATFORM-SESSION-001;本 PR-A 不含 apps/web)
11 cross-family attack matrix     = PASS(安全矩阵 10/10:cross-family 403 · 伪造 · revoked-membership · LEFT · revoked-binding · expired · revoked-session · zero-family · no-bearer)
12 CI(本地)                      = typecheck 0 · integration 53/53 · e2e 112/112 · api unit 105/105 · 授权扫描 PASS(0)
13 T1/T2 Gate 建议                = PR-A backend 达标;等 PR-B(浏览器安全会话)绿 + 合并集成绿 → 一起进 master
14 OTP account login              = PASS(废除 phone→person LIMIT1→family;签发 account session)
15 backfill counts                = 见 0018 回填(accounts by external_ref · bindings · 每 person 一 membership);integration 回填测试 3/3
16 CANONICAL_SEMANTIC_DELTA       = 0(persons/families/growth 未改;persons.account_id 保留)
17 CANONICAL_BYPASS               = 0
18 IDOR cross-family              = 0(FamilyScopeGuard:Account→ACTIVE binding→ACTIVE membership→Family)
19 revoked/expired                = DENY(membership/binding revoked、session expired/revoked 均拒)
20 FamilyScopeGuard               = PASS(唯一家庭作用域解析入口;controller-level guard + @ActorId)
21 report                         = 本文件
22 T3 readiness                   = 未启(Organization/AccessGrant/Community/RLS 仍 HOLD)
```

## 未达完整 Gate 的项(联合 Gate 前必补)

```text
RAW_BROWSER_TOKEN_WEBSTORAGE=0  → PR-B PLATFORM-SESSION-001(HttpOnly cookie + AccountContextStore/FamilyContextStore),消费端 Agent、独立分支
JOINT GATE                      → PR-A 绿 + PR-B 绿 + 合并集成绿 = TENANCY_T1_T2_GATE,两者一起进 master
```

## 边界

不合 master(joint gate 前);不自签 PASS_CLOSED;Organization/AccessGrant/RLS/真实家庭 alpha 全 HOLD。AUTO_MERGE=NO。
