# Family 商城与服务预约纵切拟提交清单 001

> **收口原则：** 本清单只覆盖两条已验证纵切：
>
> 1. `商品供给 → 订单意向 → 权益回执 → 客户资产投影`；
> 2. `服务供给 → 可预约时段 → 预约请求 → 服务记录 → 客户服务投影`。
>
> 不提交宽范围治理历史草稿、原始素材、PPT/图片分析产物、`30_素材_materials`、多模态实现、家庭页面对象实现、测试体验历史实现或无关开发工具。

## 一、拟提交文件

### A. 必要数据库迁移（4 个）

| 文件 | 直接作用 |
|---|---|
| `database/migrations/0025_tenant_master_data_foundation.sql` | 两条纵切所需的 `Tenant → Family` 双范围前置结构。 |
| `database/migrations/0030_family_product_event_envelope.sql` | 商城与预约共同使用的 append-only 产品事件 envelope。 |
| `database/migrations/0031_family_commerce_intent_and_entitlement.sql` | 商品供给、订单意向、订单行、权益回执和客户资产只读投影。 |
| `database/migrations/0032_family_service_booking_objects.sql` | 服务者、服务供给、时段、预约请求、服务记录和客户服务只读投影。 |

### B. 新增后端领域文件（9 个）

| 文件 | 直接作用 |
|---|---|
| `apps/api/src/modules/orchestration/family-product-event.contract.ts` | 统一产品事件 DTO 与白名单。 |
| `apps/api/src/modules/orchestration/family-product-event.service.ts` | 事件 append-only 写入与范围/幂等校验。 |
| `apps/api/src/modules/orchestration/family-product-event.service.spec.ts` | 事件服务单测。 |
| `apps/api/src/modules/orchestration/family-commerce-intent.contract.ts` | 商品、订单意向、权益回执 DTO/状态契约。 |
| `apps/api/src/modules/orchestration/family-commerce-intent.service.ts` | 商城纵切服务。 |
| `apps/api/src/modules/orchestration/family-commerce-intent.integration.spec.ts` | 商城 PostgreSQL 集成测试。 |
| `apps/api/src/modules/orchestration/family-service-booking.contract.ts` | 服务供给、时段、预约、服务记录 DTO/状态契约。 |
| `apps/api/src/modules/orchestration/family-service-booking.service.ts` | 服务预约纵切服务。 |
| `apps/api/src/modules/orchestration/family-service-booking.integration.spec.ts` | 服务预约 PostgreSQL 集成测试。 |

### C. 共享文件的**仅纵切相关 hunk**（7 个，不整文件盲加）

| 文件 | 只保留的 hunk |
|---|---|
| `apps/api/src/modules/auth/family-authorization.policy.ts` | `SubmitCommerceIntent`、`SubmitServiceBooking` 两个 Named Action。 |
| `apps/api/src/modules/orchestration/orchestration.module.ts` | Product Event、Commerce Intent、Service Booking 三个 provider。 |
| `apps/api/src/modules/orchestration/orchestration.controller.ts` | 仅 `/commerce/*` 与 `/services/*` 的 API、对应 imports/constructor 注入。 |
| `apps/api/src/test/test-database.ts` | 商品/权益/预约/服务记录/事件及 Tenant 的外键安全清理项。 |
| `apps/web/src/test-loop.js` | 商品购买/资产投影与服务预约/服务记录投影 API 路由和热点绑定。 |
| `apps/web/src/test-loop.gateway.spec.ts` | 商品意向/资产与服务预约/服务投影窄测试。 |
| `apps/web/src/styles.css` | `clear-product-buy`、`clear-booking-confirm`、`clear-service-mine-projection` 的透明热点几何。 |

> 当前这七个文件还混有早前未提交的 Test Experience、Family Page Objects 或多模态变更。因此提交时必须使用**选择性 hunk 暂存**，而不是整文件 `git add`。

### D. 直接证据文件（2 个）

| 文件 | 作用 |
|---|---|
| `reports/l1/FAMILY_COMMERCE_INTENT_ENTITLEMENT_SLICE_EVIDENCE_001.md` | 商城纵切的对象边界、实现与验证。 |
| `reports/l1/FAMILY_SERVICE_BOOKING_SLICE_EVIDENCE_001.md` | 服务预约纵切的对象边界、实现与验证。 |

## 二、最终窄验证结果

| 类别 | 命令 | 结果 |
|---|---|---|
| 两条后端 PostgreSQL integration | `TEST_DATABASE_URL=… pnpm --filter @family/api exec vitest run family-commerce-intent.integration.spec.ts family-service-booking.integration.spec.ts --config vitest.integration.config.ts` | **2 files / 6 tests passed** |
| API 编译 | `pnpm --filter @family/api typecheck` | **通过** |
| Web 纵切窄测试 | `pnpm --filter @family/web exec vitest run src/test-loop.gateway.spec.ts` | **1 file / 9 tests passed** |
| Web 编译 | `pnpm --filter @family/web typecheck` | **通过** |
| Web 构建 | `pnpm --filter @family/web build` | **通过** |

## 三、明确排除项

以下内容**不在本次提交范围**：

| 排除类别 | 具体范围 |
|---|---|
| 宽范围治理/研究草稿 | `governance/FAMILY_*` 中除本次两份 slice evidence 外的主数据、Oracle、字节、多模态、多租户、App Gate、历史设计草稿。 |
| 素材与历史分析 | `30_素材_materials`、原始 PPT/图片、`reports/bangyang_*`、`reports/family_model_platform_analysis`、闭环裁剪图。 |
| 未复核后端实现 | `family-page-objects.*`、`family-commerce-objects.*`、`multimodal/**`、`test-experience.*` 及相关迁移 `0023/0024/0026–0029`。 |
| 非必要共享文件变更 | `apps/api/src/main.ts` 的 CORS 历史改动不纳入。 |
| 生产能力 | 真实支付、通知、日历、真人服务确认、社区外发、生产权益、真实家庭数据和真实 LLM key。 |

## 四、提交建议

建议在确认后形成一个单独提交：

```text
feat: add verified commerce intent and service booking slices
```

提交只推送至当前开发分支 `platform-family-growth-vertical-slice-001`，不切换、不合并、也不修改 `master`。
