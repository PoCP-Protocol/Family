# Family 服务预约纵切证据包 001

## 1. 目标与边界

本证据包覆盖 Family 在 DEV/TEST 中的最小可运行服务链：**服务供给 → 合格服务者 → 可预约时段 → 家庭预约请求 → 服务记录回执 → 家庭只读投影**。它实现真实 PostgreSQL 状态与 API 工作流，但仅使用隔离测试数据和 no-op 通知适配器；不发送预约通知、不写入外部日历、不确认真人服务、不处理真实家庭数据。

## 2. 全域数据对象分层

| 对象 | 层级 | 范围 | 关键关系 | 说明 |
|---|---|---|---|---|
| `family_service_providers` | 供给主数据 | Tenant | Provider → Offering | 仅已准入、资格 ACTIVE、fixture-only 服务者可见。 |
| `family_service_offerings` | 供给主数据 | Tenant | Offering → Provider / Slot | 版本化、有效期与准入状态分离。 |
| `family_service_availability_slots` | 供给库存事实 | Tenant | Slot → Provider / Offering | 容量、预约计数、row version 和时段状态。 |
| `family_booking_requests` | 家庭交易事实 | Tenant + Family + Actor | Booking → Offering / Slot | 幂等键、来源页、Consent 引用、服务快照与 no-op 外部副作用。 |
| `family_booking_service_records` | 家庭服务事实 | Tenant + Family | Record → Booking | 由预约请求派生的 PENDING/CANCELLED 回执。 |
| `family_product_events` | 产品事件 | Tenant + Family | Event → Booking | 仅登记 `booking_request_submitted` / `booking_request_cancelled`。 |
| `family_customer_service_booking_projection_v` | 只读投影 | Tenant + Family | Projection ← Booking / Record | 不作为写目标，返回家庭私有读模型。 |

## 3. 接口与页面链路

| 34 页页面 | 受控 API | Named Action | 结果 |
|---|---|---|---|
| UI-19 名师专区 | `GET /services/offerings` | `ReadFamily` | 已准入服务供给读取。 |
| UI-20 名师详情 | `GET /services/slots` | `ReadFamily` | 已准入时段读取。 |
| UI-21 在线咨询预约 | `POST /services/booking-requests` | `SubmitServiceBooking` | 创建 REQUESTED 预约和 PENDING 服务记录。 |
| UI-24 我的咨询和活动 | `GET /services/customer-projection` | `ReadFamily` | 读取家庭私有预约/服务记录。 |
| UI-24 取消入口预留 | `POST /services/booking-requests/cancel` | `SubmitServiceBooking` | row version 取消、释放库存、取消本地服务记录。 |

UI-21 的确认预约热点已从旧的固定体验占位切换到服务预约 API。名师详情的解释入口仍保留受控 LLM 页面说明路径，默认缺少 key 时保持安全文本等价回退。

## 4. 验证结果

| 验证项 | 命令或范围 | 结果 |
|---|---|---|
| API typecheck | `pnpm --filter @family/api typecheck` | **通过** |
| 服务预约 PostgreSQL integration | `family-service-booking.integration.spec.ts` | **1 file / 3 tests passed** |
| Web 预约窄测试 | `test-loop.gateway.spec.ts` | **1 file / 9 tests passed** |
| Web typecheck | `pnpm --filter @family/web typecheck` | **通过** |
| Web build | `pnpm --filter @family/web build` | **通过** |

集成测试覆盖正常链、幂等回放、取消、时段容量释放、服务记录取消、Consent 缺失、错误页面、跨租户供给和 zero external effect。实现中修复了 PostgreSQL enum `CASE` 类型、预约幂等检查顺序、投影视图字段对齐和公开 DTO 不泄漏内部行类型的问题，未放宽任何数据库约束。

## 5. 持续边界

真实支付、真人服务确认、外部日历、预约通知、社区外发、真实家庭数据与生产权益持续不在本纵切范围。真实 LLM API key 仍仅允许在用户测试时通过本地环境变量、未提交 `.env.local` 或受控 secret 注入；任何代码、文档、fixture、日志、回放和测试快照均不保存或回显真实 key。
