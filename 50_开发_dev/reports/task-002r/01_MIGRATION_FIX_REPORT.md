# 01 Migration Fix Report (AI-01, TASK-002R)

as_of: 2026-08-09 ｜ FIX-01 ｜ SEMANTIC CHANGES = **NONE**

## Problem(原 BLOCKER-01)
`database/migrations/0001_family_core.sql / 0002_audit_outbox.sql / 0003_growth_foundation.sql` 系 `schema_v0_1.sql` **按行号机械切片**——逐文件非法 SQL(0001 consents 表中途截断、0002/0003 以孤立 `);` 开头),且 0002 的 `milestones` 外键引用 0003 才定义的 `growth_journeys`(顺序倒置)。`migrate.mjs` 逐文件独立事务执行 → `up` 必在 0001 语法失败。

## Files Changed
- **删除**(机械切片,非法):`0001_family_core.sql`、`0002_audit_outbox.sql`、`0003_growth_foundation.sql`(旧)
- **新增**(按语句边界 + 依赖顺序):
  - `0001_family_identity.sql` — pgcrypto + 7 身份枚举 + `families / persons / family_relationships / life_stage_assignments / consents`(含 primary_contact 的 DEFERRABLE FK、各索引/唯一索引/check)
  - `0002_platform_foundation.sql` — `audit_logs / outbox_events / idempotency_keys`(+ 索引)
  - `0003_growth_foundation.sql` — 2 growth 枚举 + `growth_profiles / growth_profile_dimensions / growth_priorities / interventions / growth_journeys / growth_actions / growth_events / perspectives / evidence_records / milestones / outcomes`

## Dependency Order(修正后)
- 0001 无外部依赖;0002 依赖 0001(audit_logs.family_id→families);0003 依赖 0001(families/persons/life_stage_code)。
- 0003 内部顺序:`growth_profiles → dimensions/priorities`;`interventions`、`growth_journeys` 均在 `growth_actions` 之前;`growth_actions → growth_events → perspectives`;`growth_journeys` 在 `milestones` 之前。**无任何表引用后于自己定义的表。**

## DDL Changes
- 每条 DDL **逐字取自 `schema_v0_1.sql`**,仅重新分组到正确文件、修正顺序、补齐被切断的语句边界。
- 全部保留 `IF NOT EXISTS` / `DO $$ ... duplicate_object` 幂等守卫,可单事务执行、可重复应用。

## Semantic Changes = NONE
未改任何表名/字段/类型/约束/默认值/枚举取值;未新增或删除任何业务对象;未触碰 Audit/Outbox/Idempotency 结构。仅工程修复。

## Test Plan(由 AI-02 在真实 PG 执行)
migrate up → 表/枚举核验 → 合法插入(Family→Parent→Child→Relationship→LifeStage→Consent)→ 非法用例必须失败(self-rel/child-parent_role/二次active-lifestage/outcome-window/dup-outbox)→ 回滚清理 → clean rebuild 重跑。结果见 `02_DATABASE_REAL_VALIDATION.md`。
