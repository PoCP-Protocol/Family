# 05_REPO_CI_TEST_VALIDATION

task: TASK-002 / AI-05 Repository·CI·Testing Validator
as_of: 2026-08-09
validator: AI-05(独立验证 Agent,只读构建/未改任何源码或契约)
code_root: `D:\Family\50_开发_dev\`
scope: 验证 TASK-001 实际产出;实测跑 build/lint/typecheck/test + API 启动 + health;DB 迁移活跑因 Docker 未运行标 NOT_EXECUTED。

---

## 0. VERDICT

**CONDITIONAL_PASS**

工程底座真实可用:`build / lint / typecheck / test` 四条流水线**实测全绿**,API 真启动、`/health` 返回 HTTP 200,依赖边界干净,无密钥入库,`.env` 已 gitignore。
**但发现 1 个 P1 阻断项**:`database/migrations/0001~0003.sql` 是把 `schema_v0_1.sql` 按行**机械切片**得到的,每个文件**单独不是合法 SQL**(语句被从中间切断);而 `tools/migrate.mjs` 逐文件**独立事务**执行 → `pnpm db:migrate up` 将在 `0001` 处语法报错。当前被 Docker 未启动掩盖,未真跑过。Sprint 0 PASS 需先修此项。

另有 2 个 P3(scaffold 模板与实际漂移、workspace 占位文本),不阻塞。

---

## 1. 实测命令与真实输出摘要

环境:pnpm 11 / turbo 2.10.9 / node ≥20;依赖已装(未 install)。

### `pnpm build` → PASS
```
@family/contracts:build: $ tsc -p tsconfig.json
@family/api:build:       $ tsc -p tsconfig.json
 Tasks:    2 successful, 2 total    Time: 2.626s
```

### `pnpm lint` → PASS
```
@family/api:lint:       $ eslint src           (0 error)
@family/contracts:lint: $ echo "(contracts) lint ok" && exit 0   ← 桩(stub),非真 lint
 Tasks:    2 successful, 2 total    Time: 2.138s
```

### `pnpm typecheck` → PASS
```
@family/contracts:typecheck: $ tsc -p tsconfig.json --noEmit
@family/api:typecheck:       $ tsc -p tsconfig.json --noEmit
 Tasks:    3 successful, 3 total (1 cached)   Time: 1.887s
```

### `pnpm test` → PASS
```
@family/api:test: $ vitest run
  ✓ src/health/health.controller.spec.ts (1 test) 3ms
  Test Files 1 passed (1) | Tests 1 passed (1)
@family/contracts:test: $ echo "(contracts) no tests yet" && exit 0   ← 桩,无测试
 Tasks:    3 successful, 3 total
 WARNING no output files found for task @family/api#test  (turbo.json test.outputs=coverage/** 但未产 coverage)
```

### API 启动 + health → PASS
```
PORT=3009 node apps/api/dist/main.js
[Nest] HealthController {/health}: Mapped {/health, GET}
[family-api] listening on :3009
GET http://localhost:3009/health → HTTP 200
{"status":"ok","service":"family-api","version":"0.1.0","time":"2026-08-09T10:52:06.284Z"}
```

### DB 迁移活跑 → NOT_EXECUTED (BLOCKED_BY_DOCKER)
```
docker ps → failed to connect ... dockerDesktopLinuxEngine ... daemon not running
```
- Docker 客户端在(v29.4.3)、**引擎未运行** → 无法 `docker compose up` 起 PG,无法对活库 `pnpm db:migrate`。与 BOOTSTRAP_REPORT 的诚实标注一致,未伪造。
- 迁移器静态验证:`node --check tools/migrate.mjs` 通过;无 `DATABASE_URL` 时优雅报错并 `exit 1`(实测:`DATABASE_URL 未设置(见 .env.example)`)。

---

## 2. 验证清单结果

| # | 项 | 结果 | 说明 |
|---|---|---|---|
| 1 | monorepo 可用性 | PASS | pnpm workspace + turbo,2 包(@family/api、@family/contracts)全部 build/typecheck 绿 |
| 2 | pnpm workspace | PASS | `pnpm-workspace.yaml` packages: apps/*、packages/*;工作区引用 `workspace:*` 生效 |
| 3 | 依赖边界 | PASS | contracts 无任何对 api 的反向引用(grep `@family/api`/`apps/api` in contracts/src = 0);api→contracts 单向 |
| 4 | TS strict | PASS | `tsconfig.base.json` `strict:true`,两包继承;typecheck 干净 |
| 5 | build 真过 | PASS | 见 §1 |
| 6 | lint 真过 | PASS(api 真)/ 桩(contracts) | api 走真 eslint;contracts 是 `echo` 桩 |
| 7 | typecheck 真过 | PASS | 见 §1 |
| 8 | unit test 真过 | PASS(仅 1 例) | 仅 health 一个单测;contracts test 为 `echo` 桩 |
| 9 | integration/contract/migration test 基础 | 部分 | 无 integration/contract 测试文件(仅 unit);TESTING_STANDARD 定义了 9 项/5 层但未落地测试脚手架。属 bootstrap 合理边界,但需明确记账 |
| 10 | env 配置 | PASS | `.env.example`(PORT/DATABASE_URL);仅本地占位口令 `family:family@localhost`,可接受 |
| 11 | Docker/local dev | PASS(配置)/ NOT_EXECUTED(运行) | `docker-compose.yml` PG15 + healthcheck 合理;守护未启动无法实跑 |
| 12 | secret handling | PASS | git 未跟踪任何 `.env`(仅 `.env.example`);全仓 grep 密钥模式 0 命中;`.env`/`.env.local` 已在 `D:\Family\.gitignore` |
| 13 | CI 与实际脚本一致 | PART/漂移 | 见 §3 P3-a |
| 14 | branch/PR 规则 | PASS(文档) | `scaffold/BRANCH_PR_POLICY.md`:main 受保护、AI 不直推、1 TaskPack≈1PR、PR 六要素;未见实际分支保护配置(GitHub 侧,不在本仓可验) |
| 15 | health check | PASS | 见 §1,HTTP 200 + 结构化字段 |
| 16 | logging/correlation 能力 | PASS(基础) | `AuditService.record(action, AuditMeta{actor,correlationId,source,occurredAt}, payload)` 结构化 `console.log`;correlationId 载体已在类型(contracts)与 audit_logs DDL(correlation_id 列 + idx_audit_corr)就位。尚无 HTTP 中间件自动注入 correlationId(bootstrap 阶段可接受) |

---

## 3. 问题清单(标级 + 文件 + 建议)

### P1 — BLOCKER｜迁移文件被切碎,`db:migrate up` 必失败
- **文件**:`database/migrations/0001_family_core.sql`、`0002_audit_outbox.sql`、`0003_growth_foundation.sql`
- **证据(实测括号计数 + 首末行)**:
  - `0001` 括号 open=54 / close=53 → `consents` 表(第105行起)**未闭合**,文件末行为 CHECK 约束的 `  )`,缺表尾 `);`。
  - `0002` open=45 / close=46 → **首行即孤立 `);`**(用来闭合 0001 的 consents),末行也是孤立 `);`。
  - `0003` open=75 / close=75(自平衡)但**首行仍是孤立 `);`** + 紧接 `CREATE INDEX ... ON consents`。
  - 三文件**拼接后** open=174 / close=174,与 `schema_v0_1.sql`(174/174,314 行)**完全一致** → 证实是把单体 DDL 按行号硬切,切点落在语句中间。
- **为何是阻断**:`tools/migrate.mjs` 对每个文件 `BEGIN → query(整文件 SQL) → COMMIT`(逐文件独立事务)。`0001` 单独送入 PG 即因未闭合的 `CREATE TABLE consents` 语法错误而 `ROLLBACK` + `process.exit(1)`。整个 `pnpm db:migrate up` 无法完成。当前仅因 Docker 未起、无人真跑而未暴露。
- **建议**:按**完整语句边界**重切三个迁移(每个文件自身括号平衡、可独立解析/执行),或临时改为单文件 `0001_init.sql = schema_v0_1.sql`。修完后在 Docker 起 PG 上真跑 `pnpm db:migrate up` + `status` 验证幂等重放。**这是 Sprint 0 PASS 的前置。**

### P3-a — LOW｜scaffold 模板与实际 workspace 漂移(记录,不判 FAIL)
- **文件**:`scaffold/package.json`(`pnpm@9.15.0`、`turbo ^2.0.0`)、`scaffold/.github/workflows/ci.yml`(`pnpm/action-setup version: 9`)
  vs 实际根 `package.json`(`pnpm@11.1.3`、`turbo ^2.3.0`,实运行 turbo 2.10.9)。
- **影响**:CI 模板固定 pnpm 9,与本地 pnpm 11 主版本不一致,`--frozen-lockfile` 在 CI 可能因 lockfile 版本而报错。CI 步骤顺序(install→lint→typecheck→test→build)与根脚本一致,内容 OK。
- **建议**:实例化 CI 到根 `.github/workflows/`(当前根**无** `.github/workflows`,仅 scaffold 模板),并把 pnpm 版本对齐 11 / 由 `packageManager` 字段驱动 `pnpm/action-setup`。

### P3-b — LOW｜`pnpm-workspace.yaml` 含占位坏值 + contracts 质检为桩
- **文件**:`pnpm-workspace.yaml`
  ```
  allowBuilds:
    esbuild: set this to true or false   ← 未替换的占位文本(应为布尔或删除)
  ```
  当前不影响 build(esbuild 未参与构建路径),但是遗留占位,建议清理或改为 `false`/删除该键。
- `packages/contracts` 的 `test`/`lint` 是 `echo` 桩:契约包无真 lint、无 contract 测试。bootstrap 可接受,但 TESTING_STANDARD 的 "Contract: OpenAPI/schema" 尚未落地测试,应在进入 TASK-101 前补 contract 测试脚手架。

---

## 4. 与 BOOTSTRAP_REPORT 的核对

- AC1 build / AC2 lint / AC3 test / typecheck / AC4 API 启动 / AC6 health / AC7 no secrets / AC8 audit:**实测复核全部属实**。
- AC5(迁移 up/down):BOOTSTRAP 标 "✅文档/机制、⏸活跑"。AI-05 复核:机制在,但**机制之上的迁移文件本身有 P1 缺陷**——BOOTSTRAP 只做了 `node --check`(JS 语法)与"无 DATABASE_URL 优雅报错",**未对迁移 SQL 做逐文件可解析性检查**,故未发现切片缺陷。此为本次验证的新增发现。
- A3 边界(不重写 Python 知识层)与"未写业务代码":复核一致,`FamilyModule` 为空占位,contracts 仅类型。

---

## 5. 结论

工程骨架四条流水线真绿、API/health 真通、边界与密钥卫生达标 → 底座扎实。唯一实质缺陷是迁移文件切片(P1),会在首次真跑迁移时爆;修复并在活库验证后,Sprint 0 可判 PASS。DB 集成/迁移活跑标 **NOT_EXECUTED (BLOCKED_BY_DOCKER)**,非伪造。

verdict: **CONDITIONAL_PASS**(修 P1 迁移切片 + 活库真跑迁移后可转 PASS)
status: TASK-002 AI-05 验证完成。未修改任何源码/契约,未 git 提交,未触碰 TASK-101。
