# 01 Database Contract Validation (AI-01)

role: Family Database Contract Validator ｜ as_of: 2026-08-09
scope: 只读 + 静态分析。Docker 守护未运行、psql 缺失 → 活库执行类检查标 NOT_EXECUTED(BLOCKED_BY_DOCKER)。未修改任何 DDL。

## Verdict: **FAIL**（迁移文件非法,阻断 Sprint 0 与 TASK-101 集成测试)

`schema_v0_1.sql` 单文件设计良好,但 `migrations/` 不可用。

## BLOCKER

- **[BLOCKER] 迁移文件系机械行切片,逐文件非法 SQL**
  - `0001_family_core.sql`:括号 54/53 不平衡;`consents` 表 `CREATE TABLE` 在中途被截断(末行为孤立 `)`,表语句未闭合、无结束 `;`)。
  - `0002_audit_outbox.sql`:以孤立 `);` 开头(承接 0001 被切断的 consents),括号 45/46 不平衡。
  - `0003_growth_foundation.sql`:以 `);` 开头,末尾列 `created_at ... now()` 未闭合。
  - **三文件拼接后括号 174/174 平衡** → 实证为同一份 `schema_v0_1.sql` 的按行切分,而非按语句边界的合法增量迁移。
  - **顺序倒置**:`0002` 的 `milestones` 外键引用 `growth_journeys`,而后者定义在 `0003`。
  - 迁移器 `tools/migrate.mjs` 逐文件独立事务执行 → `pnpm db:migrate up` 必在 `0001` 语法错误处失败。
  - **根因掩盖**:本机 Docker 未启动,迁移从未真跑;BOOTSTRAP 仅做 `node --check`(JS 语法),未校验迁移 SQL 可解析性。

## 静态检查(基于 schema_v0_1.sql,设计层)

| # | 项 | 结论 | 备注 |
|---|---|---|---|
| 1 | PostgreSQL 版本 | PASS | 声明 15+;用 `gen_random_uuid()`/`pgcrypto` |
| 2 | DDL 语法(单 schema) | PASS(静态) | schema_v0_1 平衡;**迁移文件 FAIL** |
| 3 | UUID 策略 | PASS | UUID 主键 + `gen_random_uuid()` |
| 4 | Enum 定义 | PASS | `DO $$ ... EXCEPTION duplicate_object` 幂等建 type |
| 5 | FK | PASS(设计)| families.primary_contact 用 DEFERRABLE INITIALLY DEFERRED 解循环 |
| 6 | Unique 约束 | PASS | 关系有向唯一索引 |
| 7 | Check 约束 | PASS | `parent_role_only_for_parent`、`relationship_not_self`、生命期时间序 |
| 8 | Index | PASS | persons(family_id) 等 |
| 9 | 事务边界 | PASS | 迁移器每文件单事务 |
| 10 | Audit | 未验证 | 在 0002(未实跑) |
| 11 | Outbox | 未验证 | 在 0002(未实跑) |
| 12 | Idempotency | 未验证 | 需活库 |
| 13 | GrowthProfile version | PASS(设计)| 有 version,不覆盖历史 |
| 14 | Consent version | PASS | policy_version + purpose 版本化 |
| 15 | LifeStage 有效期 | PASS | 部分唯一索引保证 active 唯一 + 时间序 check |
| 16 | Event/Outcome 扩展 | PASS(设计)| 预留 milestones/outcomes |

## 重点核查
- persons↔families primary_contact FK:**PASS**(DEFERRABLE 解循环依赖)。
- FamilyRelationship 跨 Family:**PASS**(family_id 约束在同一家庭内)。
- Child 误赋 parent_role:**PASS**(check 约束阻止)。
- active life stage 唯一:**PASS**(`WHERE effective_to IS NULL` 部分唯一索引)。
- Consent purpose 隔离:**PASS**(purpose ENUM 齐)。
- GrowthProfile version / Outbox 唯一 / Idempotency key:**NOT_EXECUTED**(需活库)。

## 活库执行(NOT_EXECUTED,BLOCKED_BY_DOCKER)
migration up / schema validation / basic insert / constraint test / rollback —— 均未执行(Docker 引擎未运行,psql 缺失)。非伪造。

## Proposed Fix
- **FIX-01**:按**语句边界**重切迁移(每个 CREATE 完整、顺序满足 FK 依赖:先 growth_journeys 后 milestones),或直接以 `schema_v0_1.sql` 为单一 `0001` 全量迁移。**纯工程修复,不改任何业务语义,无需 RFC。** Owner:Tech Lead/DB。
- 修复后必须在真实 PG 上 `db:migrate up` 实跑 + 基础 insert/约束/回滚验证,方可将 Database 转 PASS。

未修改任何 DDL 以掩盖问题。
