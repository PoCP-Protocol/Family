# PLATFORM_SHELL_GATE —— Web Platform Shell 验收门

```text
RULING = FAMILY-PLATFORM-V1-BUILD-001 §1
BASE   = master @ d03931d
```

## 通过判据

```text
AUTH_URL_TRUST                 = 0    (URL 不再携带/信任 actorPersonId/familyId/childId)
USER_ENTERED_UUID              = 0    (用户永不手输内部 ID)
PLATFORM_STRUCTURE_PRESENT     = YES  (src/platform/ shell/router/session/api/auth/family-context/…)
SINGLE_WEB_APP                 = YES  (仅一个 apps/web;无第二并行消费端)
UNIFIED_API_CLIENT             = YES  (唯一出网口,自动附 Bearer,401→登录)
SESSION_RESTORE                = YES  (刷新后恢复;过期/撤销→重新登录)
FAMILY_CONTEXT_FROM_WHOAMI     = YES  (current Person/Family/Subject 来自认证态)
LOADING_ERROR_EMPTY_STATES     = YES
MOBILE_FIRST_LAYOUT            = YES
LEGACY_MOUNTED_VIA_ADAPTER     = YES  (旧页面兼容挂载,渐进迁移,不大爆炸)
```

## 本 PR 覆盖(首版骨架)

```text
✅ platform/ 目录结构 + ADR + 本 Gate 文档
✅ session(token 存取/恢复/清除)+ api client(附 Bearer + 401 规范化)+ family-context(whoami 派生)+ router 路由表类型
✅ 单测(session/api/family-context)+ web typecheck 通过
⏳ shell 布局 / 主导航 / 旧页面适配挂载 / 逐页迁移 = 后续增量 PR
```

## 状态

`PLATFORM_SHELL = IN_PROGRESS`(骨架已立,壳与迁移待增量)。URL-trust 移除随页面迁移逐步达成;完成即 `AUTH_URL_TRUST=0`。
