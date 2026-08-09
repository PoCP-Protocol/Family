# Family Platform — 本地开发(TASK-001 引导产物)

工程执行层。代码根即本目录(`50_开发_dev/`),与 `specs/`、`database/`、`backlog/` 并列。

## 结构
```
apps/api            NestJS 后端(health 端点 + audit 基础 + family 占位)
packages/contracts  共享类型/枚举(实现级契约 TS 落地起点)
database/           契约 DDL 与迁移(schema_v0_1.sql + migrations/*.sql)
tools/migrate.mjs   轻量迁移器(up / status)
docker-compose.yml  本地 PostgreSQL 15
```

## 快速开始
```bash
pnpm install
cp .env.example .env

# 起本地 PG
docker compose up -d

# 迁移(应用 database/migrations/*.sql)
pnpm db:migrate            # up
pnpm db:migrate:status     # 查看状态

# 构建 / 单测 / lint / 类型检查
pnpm build
pnpm test
pnpm lint
pnpm typecheck

# 启动 API,验证 health
pnpm --filter @family/api start
# GET http://localhost:3000/health -> {"status":"ok",...}
```

## 迁移 up/down 策略(AC5)
- **up**:前向迁移,每文件单事务执行,成功后记入 `schema_migrations`(幂等,已应用则跳过)。
- **down**:V0 用「前向修复」——不自动逆向;需回滚时新增 `migrations/NNNN_rollback_*.sql` 显式提供。DDL 采用 `IF NOT EXISTS` / `DO $$` 幂等写法,可安全重放。

## 边界(A3)
证据/知识层为既有 Python(`../20_知识_knowledge/byresearch`,evidence.py)。**不重写为 TS**,后续以内部服务/CLI 边界调用。本 bootstrap 未引入该边界代码(超出 Sprint 0 范围)。

## Sprint 纪律
一次只做一个 Approved Task,不跨 Sprint;核心状态只经 Named Action;不做 generic PATCH;模型调用走 ModelGateway(后续)。见 `CLAUDE.md` 与 `CURRENT_SPRINT.md`。
