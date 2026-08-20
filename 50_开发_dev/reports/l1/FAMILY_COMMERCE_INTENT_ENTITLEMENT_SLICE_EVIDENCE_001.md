# Family 商城商品 → 订单意向 → 权益回执纵切证据包 001

**状态：** DEV_IMPLEMENTED_AND_VALIDATED
**数据环境：** 隔离 PostgreSQL `family_test`；仅测试数据、测试账户与 no-op 外部适配器。
**产品范围：** UI-14 商品详情与 UI-32 订单/资产读模型。原图素材路径保留历史来源命名；产品显示名为 Family / 伐木累。

## 1. 对象范围与物理边界

| 对象分类 | 对象/表 | 范围与职责 | 不承担的职责 |
|---|---|---|---|
| 供给主数据 | `family_product_offerings` | 版本化、准入可见的测试商品；平台级或租户级目录 | 不保存家庭订单或支付状态 |
| 交易/过程事实 | `family_order_intents` | 家庭明确商品选择；`tenant_id + family_id + actor_person_id`；幂等键、版本与审计 | 不等于支付、外部订单或交付 |
| 交易明细 | `family_order_intent_lines` | 可扩展产品行关系，避免把未来多商品数组塞入 JSON | 不保存权益状态 |
| 权益/资产事实 | `family_entitlements` | 由订单意向衍生的 DEV/TEST no-op 权益回执 | 不写生产权益或第三方系统 |
| 产品事件 | `family_product_events` | `order_intent_submitted`、`order_intent_cancelled` 的追加式产品事件 | 不保存支付凭证、联系人、模型原文或密钥 |
| 只读投影 | `family_customer_commerce_projection_v` | 客户资产查询视图 | 不是写入目标 |
| 接口对象 | `family-commerce-intent.contract.ts` | Command DTO、Receipt、Customer Projection；不接受 tenant/family/价格/支付/联系人 | 不允许客户端覆盖服务端范围 |

> 所有家庭交易事实使用 **Tenant → Family → Actor** 的服务端派生范围。商品目录与家庭交易事实分表；页面只提交受控 Command，服务端完成准入、Consent、Tenant/Family 绑定、幂等和事件写入。

## 2. 状态链与副作用

```text
Active + Admitted ProductOffering
  → SUBMITTED OrderIntent
  → AVAILABLE DEV/TEST Entitlement Receipt
  → Customer Commerce Projection
  → CANCELLED OrderIntent + REVOKED Entitlement
```

此纵切不存在支付、外部订单、库存扣减、预约通知、社区外发、生产权益或第三方 API 副作用。所有事实行强制 `external_effect=false`，环境限为 `DEV | TEST`。

## 3. 实现文件

| 类型 | 文件 |
|---|---|
| 迁移 | `database/migrations/0031_family_commerce_intent_and_entitlement.sql` |
| 接口契约 | `apps/api/src/modules/orchestration/family-commerce-intent.contract.ts` |
| 领域服务 | `apps/api/src/modules/orchestration/family-commerce-intent.service.ts` |
| 授权 | `apps/api/src/modules/auth/family-authorization.policy.ts`：`SubmitCommerceIntent` |
| API | `apps/api/src/modules/orchestration/orchestration.controller.ts` |
| 模块装配 | `apps/api/src/modules/orchestration/orchestration.module.ts` |
| 事件白名单 | `apps/api/src/modules/orchestration/family-product-event.contract.ts` |
| 测试数据库清理 | `apps/api/src/test/test-database.ts` |
| API 集成测试 | `apps/api/src/modules/orchestration/family-commerce-intent.integration.spec.ts` |
| 34 页 Web 接入 | `apps/web/src/test-loop.js`、`apps/web/src/styles.css`、`apps/web/src/test-loop.gateway.spec.ts` |

## 4. 窄验证结果

| 验证 | 命令 | 结果 |
|---|---|---|
| 商城集成 | `TEST_DATABASE_URL=... pnpm --filter @family/api exec vitest run src/modules/orchestration/family-commerce-intent.integration.spec.ts --config vitest.integration.config.ts` | **1 file / 3 tests passed** |
| 既有体验回归 | `TEST_DATABASE_URL=... pnpm --filter @family/api exec vitest run src/modules/orchestration/test-experience.integration.spec.ts --config vitest.integration.config.ts` | **1 file / 5 tests passed** |
| API 编译 | `pnpm --filter @family/api typecheck` | **passed** |
| Web 商城入口 | `pnpm exec vitest run src/test-loop.gateway.spec.ts` | **1 file / 7 tests passed** |

集成测试覆盖已准入产品读取、订单意向写入、订单行、权益回执、事件、顺序幂等回放、row-version 取消、权益撤销、缺 SERVICE Consent、错误页面和跨租户目录可见性阻断。Web 测试覆盖 UI-14 “立即购买”与 UI-32 权益投影均通过服务端商城 API。

## 5. 下一最小纵切：服务预约请求

下一切片建议为 **ServiceOffering → Provider → AvailabilitySlot → BookingRequest → ServiceRecord Projection**。该切片将复用 Tenant/Family 双范围、版本化供给、Named Action、产品事件、no-op 通知适配器和 UI-19 至 UI-24 原图路径，但会独立建立预约请求、时段与状态迁移，避免把当前 `test_experience_operations` 误用为最终预约事实。

## 6. 持续边界

真实支付、发票、库存、生产权益、真实预约通知、真人服务履约、社区外发、真实家庭数据、模型训练/微调、生产发布仍不在该 DEV/TEST 纵切内。真实 LLM API key 仍只允许用户在测试时通过本地环境变量、未提交 `.env.local` 或受控 secret 注入；不得在代码、文档、fixture、日志、回放或快照中记录或回显。
