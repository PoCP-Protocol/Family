# 02 Database Real Validation (AI-02, TASK-002R)

## Verdict: **PASS**（真实 PostgreSQL,非静态代替)

- **引擎**:PostgreSQL **17.9**(本机服务 `PostgreSQL17` running,localhost:5432)。Docker 引擎未启动 → 依架构师裁决改用**本机隔离测试库**(非 SQLite)。
- **隔离测试库**:`family_test`(drop + create 全新,含 clean rebuild 语义)。
- 执行器:`tools/migrate.mjs`(逐文件单事务);验证:`tools/db-validate.mjs`。

## 结果:33 项检查全部 PASS,失败 0

| 组 | 结果 |
|---|---|
| migrate up | 3 迁移全部 applied(0001_family_identity / 0002_platform_foundation / 0003_growth_foundation) |
| 表存在 | 14/14(families…outcomes + audit_logs/outbox_events/idempotency_keys) |
| 枚举存在 | 9/9(family_status…growth_state) |
| 合法插入 | PASS:Family→Parent(MOTHER)→Child→Relationship(PARENT_CHILD)→LifeStage(12-15)→Consent(SERVICE/GRANTED) 全部接受 |
| 非法用例(须失败) | 5/5 均被约束正确拒绝 |
| audit / idempotency 可写 | PASS |
| 回滚清理 | PASS(ROLLBACK 后 families 行数=0) |
| clean rebuild | PASS(drop+create+migrate up 二次重跑成功) |

## 非法用例明细(全部按预期被拒)
| 用例 | 触发的约束 |
|---|---|
| self relationship(person_a=person_b) | CHECK `relationship_not_self` |
| CHILD 赋 parent_role | CHECK `parent_role_only_for_parent` |
| 同一 child 第二条 active life stage | UNIQUE `uq_active_life_stage`(部分唯一索引) |
| outcome window_end ≤ window_start | CHECK `outcome_window` |
| 重复 outbox event_id | UNIQUE `outbox_events_event_id_key` |

## 重点核查(架构师指定)
persons↔families primary_contact FK:PASS(DEFERRABLE INITIALLY DEFERRED,合法插入时用 `SET CONSTRAINTS ALL DEFERRED` 正常);FamilyRelationship 不能 self:PASS;Child 误赋 parent_role:被拒;active LifeStage 唯一:被拒二次;Consent purpose/status 结构:PASS;Audit/Outbox/Idempotency 可写:PASS;Growth foundation 无 FK 顺序错误:PASS(迁移应用无报错)。

## 结论
Database 从 CONDITIONAL/FAIL 转 **PASS(真实 PG 实跑)**。原 BLOCKER-01 已彻底解除。
