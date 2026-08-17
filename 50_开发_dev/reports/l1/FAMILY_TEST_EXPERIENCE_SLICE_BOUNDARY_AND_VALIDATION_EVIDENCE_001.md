# Family Test Experience：Operation → Cancel → Customer Projection 纵切证据草稿

**范围状态：** `DEV_IMPLEMENTING`
**范围限制：** 本文仅覆盖固定测试 fixture 驱动的 Test Experience 后端闭环：创建受控 operation、取消 operation、读取家庭客户投影。本文不证明真实服务交付、真实业务效果或生产可用性。

## 1. 纵切边界

Test Experience 是 Family/伐木累在隔离 DEV/TEST 环境中的受控体验操作回执能力。请求只能引用已登记的页面、动作与 fixture 组合；领域服务在可信家庭范围、SERVICE consent、页面/动作/fixture 白名单与幂等条件均满足时，才写入本地 PostgreSQL operation 事实。

| 环节 | 本纵切内能力 | 写入上限 | 外部副作用 |
|---|---|---|---|
| Operation | 固定 fixture 的邀请、拼团、预约、活动、模板发布体验回执 | `test_experience_operations` | `external_effect=false` |
| Cancel | 对同一可信家庭内可取消 operation 的本地取消 | operation 状态更新为 `CANCELLED` | `external_effect=false` |
| Customer Projection | 读取本家庭的 operation 回执与文本等价说明 | 只读投影 | 无 |
| Audit / Event | 创建操作记录最小产品事件与关联 ID | 受控领域事件 | 无外发 |

## 2. DEV/TEST 数据与安全边界

所有操作仅允许 `DEV` 或 `TEST` 环境、`TEST_FIXTURE` 来源和本地 PostgreSQL 事实。操作创建前必须验证家庭范围、测试资格、SERVICE consent、白名单 fixture 与页面动作组合；任何不匹配或 consent 缺失均 fail-closed，不写入 operation。

幂等回放使用请求哈希和 idempotency key：相同 key 且请求相同，返回原 operation；相同 key 但请求不同，拒绝冲突。取消只允许可信家庭范围内的可取消 operation；失败时不产生额外 operation 或外部动作。

> 文本等价必须明确：不会扣款、发送通知、创建外部日程、联系真人、占用资源、外发到社区或调用外部服务。

## 3. 本证据明确排除的范围

| 排除范围 | 说明 |
|---|---|
| Family Page Objects | 不读取、不写入家庭档案快照、任务、报告或服务记录；不包含其 DTO、服务、路由、Named Action、表或测试。 |
| 多模态 / AI | 不处理媒体、模型、派生工件、模型输出、训练或记忆。 |
| Web / 34 页页面实现 | 不包含 Web 路由、热点、样式、浏览器测试或页面改动。 |
| 社区真实发布 | `PUBLISH_TEMPLATE` 仅记录本地测试回执；不向社区、家庭或第三方外发内容。 |
| 支付、续费、通知、外部履约 | 不扣款、不续费、不发送消息、不预约真人、不创建外部日程、不调用外部适配器。 |
| 生产与真实数据 | 不处理真实家庭/儿童数据，不进入生产，不作为试点或效果证据。 |

## 4. Focused 测试范围

`test-experience.focused.integration.spec.ts` 仅覆盖三类场景：

1. 五个固定 action/page/fixture 的 operation 创建、幂等回放、零外部副作用与客户投影读取；
2. 同一可信家庭 operation 的取消与状态同步；
3. 非白名单 fixture、page/action 不匹配、缺 SERVICE consent 时的 fail-closed 与零写入。

原 `test-experience.integration.spec.ts` 保持不变；其中涉及 Family Page Objects 的测试不属于本证据范围。

## 5. 验证命令与结果

```bash
TEST_DATABASE_URL='postgresql://family_test:family_test@localhost:5432/family_test' \
pnpm --filter @family/api exec vitest run \
src/modules/orchestration/test-experience.focused.integration.spec.ts \
--config vitest.integration.config.ts
# 结果：1 file passed / 3 tests passed

pnpm --filter @family/api typecheck
# 结果：通过
```

集成测试在真实 PostgreSQL `family_test` 上验证了五个固定 operation 的创建与幂等回放、可信家庭取消，以及 fixture/page/consent fail-closed；三项场景均断言 `external_effect=false`。本结果只证明 DEV/TEST 合成 fixture 的工程行为，不构成真实服务、真实家庭数据或生产能力证据。

## 6. 证据来源

| 证据 | 路径 |
|---|---|
| 数据表、约束与索引 | `database/migrations/0022_test_experience_workflows.sql` |
| 固定 action、fixture 与文本等价契约 | `apps/api/src/modules/orchestration/test-experience.contract.ts` |
| operation、cancel、projection、consent 与幂等实现 | `apps/api/src/modules/orchestration/test-experience.service.ts` |
| focused PostgreSQL 集成测试 | `apps/api/src/modules/orchestration/test-experience.focused.integration.spec.ts` |
| 原混合测试（仅作来源，不纳入本纵切） | `apps/api/src/modules/orchestration/test-experience.integration.spec.ts` |
