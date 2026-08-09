# Family Database Contract V0.1

数据库目标：支持 M1 Family Core Running，并为 M2/M3 的 GrowthProfile、Journey、Event、Outcome 留出兼容扩展。

## 原则
- PostgreSQL 15+
- UUID主键
- 所有关键表有 `created_at`
- 核心可变聚合有 `version`
- 关键写操作由Named Action驱动
- 审计与Domain Event从Day 1存在
- Consent按purpose版本化
- 不做物理删除核心审计事实
- 未成年人PII与成长数据逻辑分层

## 文件
- `ER_DIAGRAM.md`
- `schema_v0_1.sql`
- `migrations/0001_family_core.sql`
- `migrations/0002_audit_outbox.sql`
- `migrations/0003_growth_foundation.sql`

生产部署前由DB Owner审核DDL。
