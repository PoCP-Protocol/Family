# Family L1「共同决策与已准入候选」
## 零迁移候选供给阻断裁决输入
### 对应裁决：`ARCH-GO-L1-APP-001`

> **状态：`BLOCKED_PENDING_ARCHITECT_DECISION`。**
>
> 本文记录在启动 L1 实现前的代码事实核对中发现的阻断。它不是新的能力授权，也不改变 `ARCH-GO-L1-APP-001` 的范围、持续 HOLD 或数据库零迁移要求。

## 1. 阻断结论

当前工程中找不到可供 L1 展示的**非模型、非外部、具备 executor 的 admitted candidate**。在数据库零迁移、模型/外部资源/真人服务均 HOLD 的条件下，若直接开始 L1“候选列表—详情—比较—选择”实现，只能展示安全停止状态，不能诚实地提供一个可选、可执行的 admitted candidate。

因此，不能将现有编排 `recommend`/`decide` 直接连入 L1 App：这样会违反本次裁决的无排序、`Decision ≠ Action` 和禁止模型/外发要求。

## 2. 已核对的代码事实

| 代码位置 | 当前行为 | 与 L1 裁决的关系 |
|---|---|---|
| `apps/api/src/modules/orchestration/resource.registry.ts` | 当前候选仅为 `NO_ACTION`、`AI_COACH`，以及环境配置时的 `EXTERNAL_REFERRAL`；`PRACTICE` 因无 executor 明确不进入候选。 | `AI_COACH` 被本次裁决禁止；`EXTERNAL_REFERRAL`/真人/外部资源被禁止；`PRACTICE` 无 executor 必须 fail-closed。 |
| `apps/api/src/modules/orchestration/eligibility.policy.ts` | `PRACTICE` 恒返回 `INELIGIBLE_NO_EXECUTOR`；AI 需要额外 AI consent/可用 provider；外部转介需要真实目标。 | 不能通过 L1 例外展示或选择 PRACTICE、AI、外部转介。 |
| `apps/api/src/modules/orchestration/recommendation.policy.ts` | 会产生 `rank` 和 `recommended_offer_refs`。 | 与“等量无排序、不得推荐最佳/最适合”不一致，不能直接暴露给 L1。 |
| `apps/api/src/modules/orchestration/orchestration.service.ts::decide` | Decision 后立即创建 `orchestration_plans`、T2 评估、`service_cases`，并可能调用 AI 或记录外部转介。 | 与“Decision 不等于 Action；选择后零自动 Plan/Case/执行”不一致，不能直接作为 L1 写路径。 |
| 非编排模块资源目录搜索 | 当前 `apps/api/src/modules` 未发现独立 `resource asset/catalog/admission/executor` 模块或可复用的非模型 admitted candidate 查询。 | 在本工程实际代码中无既有候选来源可用于 L1。 |

## 3. 不可接受的“变通”方式

下列方式均会越过 `ARCH-GO-L1-APP-001`，因此不能采用：

| 变通方式 | 为什么禁止 |
|---|---|
| 把 `AI_COACH` 当作 admitted candidate 展示或选择 | 本轮明确禁止模型调用、Gateway、AI 助手 UI 与外部模型外呼。 |
| 配置或展示 `EXTERNAL_REFERRAL` | 禁止未准入/外部资源、真人顾问、预约/派单、第三方外发。 |
| 让 PRACTICE “先展示、后补 executor” | executor 缺失必须 fail-closed；不得把 E1 材料或内容引用当作可交付服务。 |
| 复用 `recommend` 的 rank / recommended list | 禁止排序、最佳推荐和系统替家庭决定。 |
| 复用 `decide` 让它自动建 Plan/Case | 违反 `Decision ≠ Action` 与 `NO_ACTION = 0 Plan/Case/Task/Reminder`。 |
| 新增表/迁移/列/索引存 L1 candidates 或 Decision 阶段 | 数据库 schema 明确为 ZERO MIGRATION；需单独 schema Gate。 |
| 以模拟资源、外链或自家材料填充候选 | 未准入、无 executor 或 E1 自证均不满足展示与执行边界。 |

## 4. 需要总架构师裁决的可选路径

| 裁决选项 | 说明 | 可实施范围 | 仍然禁止 |
|---|---|---|---|
| A. `SAFE_STOP_ONLY_GO` | 仅实施 L1 入口、无候选安全停止、返回、暂停、NO_ACTION、文本等价与所有 fail-closed 路径。 | 可验证身份/consent/context/版本/无候选失败关闭与 NO_ACTION 零 Action。 | 不展示可选择资源；不实现详情/比较/正向 Decision。 |
| B. `PROVIDE_EXISTING_ADMITTED_SOURCE` | 总架构师指明并确认当前工程中一个已有、非模型、非外部、可在零迁移条件下读取的 admitted candidate 来源与 executor 事实。 | 在该既有来源上实施等量展示、详情/比较、Decision-only。 | 不得补建 schema、不得接模型/外部/真人；每次仍重新门禁。 |
| C. `HOLD_L1_IMPLEMENTATION` | 保持 L1 为 Gate/UX 草案，直到资源资产目录与 executor 能力取得独立授权。 | 不写业务代码，仅保留文档。 | 不得进行任何 L1 runtime、API 或 Web 改动。 |
| D. `SCHEMA_GATE_REQUIRED` | 若架构师认为 L1 必须有新的候选准入/执行责任投影，另行申请 schema Gate。 | 本轮保持 HOLD，待新 Gate。 | 不得在本轮自行新增任何数据库结构。 |

## 5. 推荐裁决

从用户体验和治理一致性看，优先建议 **B**：由总架构师明确指定一个已存在、非模型、非外部、具有 executor 且当前 admitted 的资源来源；这才能兑现本次批准的“候选展示、详情/比较、明确选择确认”完整纵切，同时保持零迁移。

如果当前没有这种既有来源，建议选择 **A**：先用安全停止与 NO_ACTION 路径验证身份、consent、fail-closed 和家庭自主退出；但应明确其只是一条安全停止纵切，不能宣称已实现 admitted candidates 的正向体验。

## 6. 等待裁决期间的状态

- 已完成：实施计划、代码事实核对、零迁移确认、禁止路径排除。
- 未开始：任何业务代码、API/DTO、Web 页面、测试运行、真实 PostgreSQL、浏览器验证。
- 持续 HOLD：模型/Gateway/AI UI、真实家庭/儿童数据、L2/L3、ADT/生物特征、外部/真人/第三方、商业化、支付、Enrollment/Delivery、成长结果/标签/比较、试点、生产、master 合入和自动合并。

## 参考

[1] `governance/FAMILY_L1_APP_IMPLEMENTATION_PLAN_ARCH_GO_L1_APP_001.md`。
[2] `apps/api/src/modules/orchestration/resource.registry.ts`。
[3] `apps/api/src/modules/orchestration/eligibility.policy.ts`。
[4] `apps/api/src/modules/orchestration/recommendation.policy.ts`。
[5] `apps/api/src/modules/orchestration/orchestration.service.ts`。
[6] 总架构师裁决 `ARCH-GO-L1-APP-001`。

---

**作者：Manus AI**
**日期：2026-08-17（GMT+8）
