# Family Page Objects：Private Projection → Controlled Action → UI-09 纵切证据

**范围状态：** `DEV_VALIDATED`
**范围限制：** 本文只覆盖 Family/伐木累在 DEV/TEST 合成 fixture 下的家庭私有对象读取、受控状态动作，以及 UI-09 原图“完成今日任务”热点的单页接入。本文不证明真实家庭服务、外部交付、生产可用性或教育效果。

## 1. 纵切边界

Family Page Objects 将家庭私有档案快照、支持报告、任务和服务记录按可信 `family_id` 聚合为只读客户投影。受控动作只允许固定页面与固定动作组合：任务完成、暂停、取消，以及报告撤回。动作必须保持家庭范围、幂等、文本等价和零外部副作用。

| 对象 | 本纵切职责 | 允许状态上限 | 外部副作用 |
|---|---|---|---|
| `family_profile_snapshots` | 家庭私有档案快照只读投影 | 只读 | 无 |
| `family_support_report_snapshots` | 家庭私有支持报告投影与撤回 | `WITHDRAWN` | 无 |
| `family_page_task_items` | 家庭私有任务投影与完成/暂停/取消；以 `source_page_id` 绑定原图页面归属 | `COMPLETED`、`PAUSED`、`CANCELLED` | 无 |
| `family_service_records` | 家庭私有服务记录只读投影 | 只读 | `external_effect=false` |

## 2. DEV/TEST 与 fail-closed 边界

本纵切只使用 `TEST_FIXTURE` 或既有家庭私有对象事实。读取和动作都必须受可信家庭范围约束；错误页面与动作组合、跨家庭或跨租户对象、缺失必要 consent、无效对象和幂等冲突均应 fail-closed，不得改变其他家庭事实。

动作使用 idempotency key 与请求哈希：相同 key 和相同请求返回原结果；同 key 但不同请求拒绝冲突。所有返回都必须声明 `external_effect=false`，且文本等价不得表示已通知、已支付、已发布、已预约真人或已发生外部服务。

`0034_family_page_task_source_page_id.sql` 是对已应用 `0023` 的前向兼容迁移：它为任务事实加入非空 `source_page_id`，以 `UI-01` 至 `UI-34` 正则约束页面归属，并建立 `(family_id, source_page_id, status, created_at DESC)` 查询索引。既有 DEV/TEST task 的 `UI-09` 回填仅用于兼容已存 fixture，不构成业务结论。受控任务动作同时以请求的 `page_id` 限制更新条件，因此 UI-09 不能更新 UI-31 或其他页面的任务。

> 页面对象是家庭私有事实投影，不产生儿童标签、成长评分、家庭排名、诊断结论或跨家庭比较。

## 3. 明确排除的范围

| 排除范围 | 不包含的内容 |
|---|---|
| Web | 除 UI-09 原图“完成今日任务”热点外的全部 33 页 UI、路由、样式、hotspot 和浏览器测试。UI-29/UI-31/UI-33/UI-34 均未接入 Page Objects API。 |
| 多模态 / AI | 媒体、模型、派生工件、模型输出、训练、记忆和多模态控制面。 |
| Test Experience | 不创建、取消或更新任何 `test_experience_operations`；`operation_ref` 仅为既有可空引用字段。 |
| Commerce / Service Booking / Membership | 不下单、不预约、不授予或消耗会员权益，不修改这些纵切对象。 |
| 外部动作 | 不真实社区发布、不支付、不续费、不发通知、不联系真人、不调用外部履约服务。 |
| 生产 | 不处理真实家庭或儿童数据，不进入生产，不作为用户试点或效果证明。 |

## 4. Focused PostgreSQL 集成测试范围

`family-page-objects.integration.spec.ts` 只覆盖：

1. 统一家庭私有对象/客户投影读取；
2. 代表性 `COMPLETE_TASK` 动作和幂等回放；
3. `source_page_id` 在投影中回传，UI-09 action 不得作用于 UI-31 task；
4. wrong page、cross-family/cross-tenant、missing consent 的 fail-closed；
5. 所有相关返回与服务记录的 `external_effect=false`。

原 `test-experience.integration.spec.ts` 是历史混合测试来源，保持不修改且不属于本纵切提交范围。

## 5. UI-09 单页 Web 接入

UI-09 保留原始 `daily-growth-task-reference-448x916.png` 画面及原按钮位置。点击“完成今日任务”后，前端先读取 Page Objects 投影，仅选择第一个 `source_page_id='UI-09'` 且 `status='OPEN'` 的 task，再以幂等 header 提交 `COMPLETE_TASK`。无 UI-09 开放任务时，前端只提供正常文本等价反馈，不伪造完成；回执只有在 `external_effect=false` 时才被视为成功。

`test-loop.page-objects.spec.ts` 验证原图仍渲染、GET→POST 的 URL 和请求体、UI-09 任务选择、幂等 header、零外部副作用文本等价，以及 UI-29/UI-31/UI-33/UI-34 未产生 Page Objects API 调用。

## 6. 验证命令与结果

```bash
pnpm --filter @family/api typecheck
# 结果：通过

TEST_DATABASE_URL='postgresql://family_test:family_test@localhost:5432/family_test' \
pnpm --filter @family/api exec vitest run \
src/modules/orchestration/family-page-objects.integration.spec.ts \
--config vitest.integration.config.ts
# 结果：1 file passed / 2 tests passed
```

集成测试在真实 PostgreSQL `family_test` 上验证了私有客户投影、任务完成、幂等回放、wrong page、跨家庭/跨租户和缺 SERVICE consent 的 fail-closed；所有可见结果均断言 `external_effect=false`。本结果只证明 DEV/TEST 合成 fixture 的工程行为，不构成真实服务、真实家庭数据、生产能力或教育效果证据。

## 7. 证据来源

| 证据 | 路径 |
|---|---|
| 家庭私有对象基础表 | `database/migrations/0023_family_growth_page_objects.sql` |
| 任务页面归属前向迁移、约束与索引 | `database/migrations/0034_family_page_task_source_page_id.sql` |
| 私有投影与动作 DTO | `apps/api/src/modules/orchestration/family-page-objects.contract.ts` |
| 家庭范围、幂等、投影与受控动作实现 | `apps/api/src/modules/orchestration/family-page-objects.service.ts` |
| focused PostgreSQL 集成测试 | `apps/api/src/modules/orchestration/family-page-objects.integration.spec.ts` |
| UI-09 focused Web 测试 | `apps/web/src/test-loop.page-objects.spec.ts` |
