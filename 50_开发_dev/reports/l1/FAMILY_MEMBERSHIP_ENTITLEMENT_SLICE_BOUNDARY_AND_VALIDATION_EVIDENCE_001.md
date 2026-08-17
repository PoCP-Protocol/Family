# Family 会员权益与客户资产纵切：对象边界与验证证据

**范围状态：** `DEV/TEST_BACKEND_VALIDATED`
**范围限制：** 本证据仅覆盖“会员计划/权益定义 → 家庭会员订阅 → 权益授予/消耗/撤销 → 客户资产投影”后端纵切。支付、续费、通知、外部履约、生产权益及其他能力均不在本证据范围内。

## 1. 对象链与表边界

> 本纵切将稳定供给目录、家庭交易事实、产品事件和只读投影分离。客户端不直接写任一基表；写入由受认证的 `ManageMembershipEntitlement` Named Action、领域服务和 PostgreSQL 事务完成。

| 对象分层 | 对象 | 物理表/视图 | 写入或读取边界 | 说明 |
|---|---|---|---|---|
| 主数据 | 会员计划 | `family_membership_plans` | 目录主数据；本纵切只读 | 版本化的 PLATFORM/TENANT 会员供给；不存储家庭订阅、支付或外部状态。 |
| 主数据 | 权益定义 | `family_membership_benefit_definitions` | 目录主数据；本纵切只读 | 隶属一个计划版本，定义权益类型、分配单位和有效天数。 |
| 交易事实 | 家庭会员订阅 | `family_membership_subscriptions` | 领域服务写入 | 记录一个家庭对某计划版本的 DEV/TEST 内部订阅事实；无支付和续费外发。 |
| 交易事实 | 权益授予 | `family_membership_benefit_grants` | 领域服务写入/更新 | 每个 grant 绑定一个订阅和一个权益定义；消耗/撤销更新 grant 当前状态和 `row_version`。 |
| 交易事实 | 权益台账 | `family_membership_benefit_ledger` | 领域服务仅追加写入 | `GRANT`、`CONSUME`、`REVOKE` 是不可由客户端直接写入的追加式事实。 |
| 产品事件 | 会员事件 | `family_product_events` | 经统一事件服务写入 | 仅登记 `membership_subscribed`、`membership_benefit_consumed`、`membership_benefit_revoked`；重放复用原 `correlation_id`。 |
| 读模型投影 | 家庭当前资产 | `family_customer_membership_asset_projection_v` | 只读 | 仅投影 `ACTIVE` subscription 与 `AVAILABLE`、未过期 grant；撤销、消耗和过期历史保留在基表及台账。 |

## 2. 范围字段与数据所有权

所有家庭交易事实使用 **`tenant_id + family_id` 双范围**。供给目录不混入家庭交易字段；家庭交易也不混入平台目录定义。

| 表 | `tenant_id` | `family_id` | `actor_person_id` | `subject_person_id` | 原因 |
|---|---|---|---|---|---|
| `family_membership_plans` | 适用；PLATFORM 范围时为空、TENANT 范围时必填 | 不适用 | 不适用 | 不适用 | 计划是平台或租户可见的供给主数据，不属于任一家庭。 |
| `family_membership_benefit_definitions` | 适用；随计划目录范围继承 | 不适用 | 不适用 | 不适用 | 权益定义是计划版本的目录明细，不是家庭权利事实。 |
| `family_membership_subscriptions` | 必填 | 必填 | 必填 | 可空 | 订阅属于一个租户内的一个家庭；发起监护人必须留痕；家庭级会员可不指向单一 subject。 |
| `family_membership_benefit_grants` | 必填 | 必填 | 必填 | 可空 | grant 是家庭获得的具体权益；继承订阅范围与 subject 语义。 |
| `family_membership_benefit_ledger` | 必填 | 必填 | 必填 | 可空 | 每一台账动作记录在家庭范围中，并保留执行人和可选 subject。 |
| `family_product_events` | 必填 | 会员事件必填 | 使用 `actor_id` 映射 | 不适用 | 统一产品事件记录最小行为事实，不复制 grant 或订阅详情。 |
| `family_customer_membership_asset_projection_v` | 必填 | 必填 | 不投影 | 继承 subscription 的可选字段 | 视图只面向当前家庭的资产读取，不暴露操作人历史。 |

## 3. 业务键、状态、版本、有效期与扩展性

| 表 | 业务键与幂等 | 状态与有效期 | 并发与审计 | 受控扩展 |
|---|---|---|---|---|
| `family_membership_plans` | 平台范围：`plan_ref + version_no`；租户范围：`tenant_id + plan_ref + version_no` | `DRAFT/ACTIVE/SUSPENDED/RETIRED`；`effective_from/effective_to` | `row_version`；`created_at/by`、`updated_at/by` | `attributes_schema_version + attributes JSONB`，并强制 JSON object。 |
| `family_membership_benefit_definitions` | `plan_id + benefit_ref + version_no` | 计划状态枚举；计划内有效期 | `row_version`；完整 WHO 审计列 | 同上；新增权益属性先通过 schema version 演进。 |
| `family_membership_subscriptions` | `tenant_id + family_id + subscription_ref`；部分唯一幂等键 | `PENDING/ACTIVE/PAUSED/EXPIRED/CANCELLED`；订阅有效期 | `row_version`、`correlation_id`、`idempotency_key`、WHO 审计列 | `attributes_schema_version + attributes JSONB`，仅接受服务端校验后的对象。 |
| `family_membership_benefit_grants` | `tenant_id + family_id + grant_ref` | `PENDING/AVAILABLE/CONSUMED/REVOKED/EXPIRED`；`valid_from/valid_to` | `row_version`；`revoked_at`；WHO 审计列 | 同上；额度与剩余额度受数据库 check 约束。 |
| `family_membership_benefit_ledger` | `tenant_id + family_id + ledger_ref`；部分唯一幂等键 | 追加式 `GRANT/CONSUME/REVOKE`；`occurred_at` | 不更新历史台账；以新行记录动作；`correlation_id` 与 `created_by` 完整留痕 | 同上；`remaining_units_after` 保留动作后的事实快照。 |
| `family_customer_membership_asset_projection_v` | 无客户端业务键；来源为 subscription/grant 主键 | 仅当前 `ACTIVE + AVAILABLE + 未过期` 状态 | 投影不写入；读取时带 Base 表 `row_version` | 不持久化自由扩展字段，避免把投影当作事实源。 |

## 4. 撤销、台账与投影一致性

撤销采用“双层语义”。`family_membership_benefit_ledger` 追加 `REVOKE` 事实，保留历史；同一事务将 `family_membership_benefit_grants.status` 更新为 `REVOKED`、设置 `revoked_at` 并递增 `row_version`。客户资产投影视图只选择当前可用 grant，因此被撤销 grant 不再展示；订阅若仍为 `ACTIVE`，会继续作为当前会员关系展示，但不会虚构被撤销权益。

消耗重放通过 `tenant_id + family_id + idempotency_key` 找回原台账，校验 grant、action 和 units 相同后复用原 `correlation_id` 调用统一事件服务。因此不会重复新增交易事实或产品事件。撤销携带过期 `expected_row_version` 时，更新条件不命中，返回 `409`；在更新失败后不会插入 ledger 或记录产品事件。

## 5. No-op 支付与通知副作用

本纵切中不存在支付通道、续费任务、通知发送、外部权益履约或生产写入。交易事实的 `environment` 仅允许 `DEV/TEST`，`source_system` 固定为 `TEST_NOOP_ADAPTER`，`external_effect` 由数据库 check 强制为 `false`。集成测试验证 subscription、grant 与台账均未产生 `external_effect=true` 记录；权益操作只更新本地 PostgreSQL 事实、台账、产品事件和只读投影。

## 6. 已验证命令与结果

| 命令 | 结果 | 覆盖内容 |
|---|---|---|
| `PGPASSWORD=family_test psql ... -f database/migrations/0033_family_membership_entitlement_objects.sql` | 通过；5 张表与只读投影视图存在 | 迁移可重放，目录、交易、台账与投影对象落库。 |
| `TEST_DATABASE_URL='postgresql://family_test:family_test@localhost:5432/family_test' pnpm --filter @family/api exec vitest run src/modules/orchestration/family-membership-entitlement.integration.spec.ts --config vitest.integration.config.ts` | **1 file / 3 tests passed** | 订阅和 grant 幂等、消耗与撤销、台账、状态、投影、stale row version、缺 Consent、错误页面、跨租户计划和 no-op 副作用。 |
| `pnpm --filter @family/api typecheck` | **通过** | 会员对象 DTO、领域服务、控制器、Named Action、事件类型和投影契约一致。 |

## 7. 本证据明确未触及的范围

本轮未提交、未接入和未验证支付、续费、通知、外部履约、生产权益及本纵切之外的任何对象链。所有结论仅适用于隔离 `family_test` 数据库、测试身份和 no-op 外部副作用环境。

## 8. 证据来源

| 证据 | 路径 |
|---|---|
| 表、约束和投影视图 | `database/migrations/0033_family_membership_entitlement_objects.sql` |
| 对象/API 契约 | `apps/api/src/modules/orchestration/family-membership-entitlement.contract.ts` |
| 领域服务与撤销/重放实现 | `apps/api/src/modules/orchestration/family-membership-entitlement.service.ts` |
| PostgreSQL 集成测试 | `apps/api/src/modules/orchestration/family-membership-entitlement.integration.spec.ts` |
| Named Action 矩阵 | `apps/api/src/modules/auth/family-authorization.policy.ts` |
| 统一产品事件 | `apps/api/src/modules/orchestration/family-product-event.contract.ts` |
