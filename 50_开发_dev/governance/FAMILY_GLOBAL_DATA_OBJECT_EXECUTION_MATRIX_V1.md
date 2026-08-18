# Family 全域数据对象可执行矩阵 V1

## 1. 目标

Family 的数据对象必须同时覆盖主数据、家庭私有主数据、交易/过程事实、产品事件、权益/资产事实、读模型投影、AI/多模态事实、审计与接口对象。任何新功能都要先登记对象分类、双范围字段、状态、业务键、版本、扩展路径和页面读写契约，不能把平台供给、家庭交易和页面投影混进临时表。

> **可信范围派生：** 客户端不能提交或覆盖 `tenant_id`。服务端从 `Account → TenantAccountMembership → TenantFamilyBinding → FamilyMembership` 派生 `tenant_id`、`family_id` 和 actor。`actor_person_id` 表示动作执行人；`subject_person_id` 仅在对象确需涉及某位成员时使用，默认不指向儿童。

## 2. 全域对象分类与范围

| 分类 | 对象举例 | tenant_id | family_id | actor_person_id | subject_person_id | 物理边界 | 写入方式 |
|---|---|---|---|---|---|---|---|
| 平台/租户主数据 | Tenant、PolicyProfile、CodeSet、CodeValue、ObjectRegistry | 平台级可空；租户级必需 | 不适用 | 不适用 | 不适用 | 主数据 Base 表 | 目录/管理动作 |
| 供给主数据 | ResourceAsset、ServiceOffering、Provider、Activity、ProductOffering、PricePlan、EntitlementPolicy、CommunityTemplate | 平台级或租户级必需 | 不适用 | 不适用 | 不适用 | 目录 Base 表；0024 仅兼容投影 | Catalog Command |
| 家庭私有主数据 | Family、Person、Membership、Relationship、Consent、Preference | 必需 | 必需 | 按动作需要 | 可选 | Family Base 表 | Guardian Named Action |
| 成长/服务过程事实 | Need、Intent、Decision、Journey、Task、ServiceCase、ServiceRecord、SupportReport | 必需 | 必需 | 必需或 system | 可选 | Fact 表 | Command + Named Action |
| 商业交易事实 | OrderIntent、OrderIntentLine、BookingRequest、RegistrationRequest、Invite/GroupFact | 必需 | 必需 | 必需 | 不适用 | Fact 表 | Command + idempotency |
| 权益/资产事实 | FamilyEntitlement、FamilyAsset、PointLedger、MembershipTerm | 必需 | 必需 | system 或 actor | 可选 | Fact/Ledger 表 | 交易或管理动作派生 |
| 产品事件 | FamilyProductEvent、OutboxEvent、GrowthEvent | 必需 | 按事件需要 | 可选 | 可选 | append-only 表 | Event service |
| 读模型投影 | FamilyHome、Catalog、CustomerAsset、Journey、Community、Report Projection | 必需 | 家庭投影必需 | 不适用 | 不适用 | View/read table | refresh only |
| AI/多模态控制 | ModelProfile、PromptPolicy、ToolDefinition、EvalSuite、MM Capability/Policy/Schema | 平台级或租户级 | 不适用 | 不适用 | 不适用 | Control Master 表 | policy/registry action |
| AI/多模态事实 | ContextSnapshot、MM Asset、MM Consent、ProcessingRun、DerivedArtifact | 必需 | 必需 | 必需或 system | 可选 | Fact/Audit 表 | Gateway/processing service |
| 审计对象 | LLM/MM/NamedAction/DataAccess Audit | 必需或平台级 | 按审计范围 | 可选 | 不适用 | append-only 表 | system only |
| 接口对象 | Command DTO、Read Model DTO、Event Envelope、Adapter Receipt | 服务端派生 | 服务端派生 | 服务端解析 | schema 约束 | API/TypeScript 边界 | 不直接入库 |

## 3. 每张表的扩展性设计规则

| 设计维度 | 强制规则 | 推荐实现 |
|---|---|---|
| 稳定核心 | 表只承载长期稳定且高频查询的核心属性 | 明确列，如 `*_id`、`*_ref`、状态、范围、版本、日期、审计 |
| 业务唯一键 | 每表同时有代理主键与业务唯一键 | `uuid` 主键 + `(tenant_id, ref, version)` 或 `(tenant_id, family_id, intent_ref)` 唯一索引 |
| 范围继承 | 范围列必须按对象类型明确，不能隐含于 payload | `tenant_id`、`family_id`、必要时 actor/subject 外键；复合索引以范围开头 |
| 生命周期 | 状态、生效期、版本、软删除语义分开 | `status_code`、`effective_from/to`、`version_no`、`withdrawn_at/deleted_at` |
| 乐观并发 | 可编辑事实对象不可静默覆盖 | `row_version`，更新时 `WHERE row_version = :expected` |
| 可控扩展属性 | 不稳定且低频的附加字段不污染核心列 | `attributes jsonb`，只允许命名空间键、JSON schema 与 whitelist；禁止关键范围/状态进入 JSONB |
| 一对多/多对多 | 不把数组塞入 JSON payload | `*_lines`、`*_assignments`、`*_bindings`、`*_attributes` 关联表 |
| 本地化/展示 | 名称/说明与稳定业务键分离 | `*_translations` 或 `display_content` 投影；不替代 ref/code |
| 版本与血缘 | 目录、规则、投影、AI 结果必须可追溯 | `source_ref`、`source_system`、`schema_version`、`policy_version`、`source_refs` |
| 审计与幂等 | 所有事实写入可回放不可重复 | `correlation_id`、`idempotency_key`、`created_by`、`named_action`、append-only audit |
| 查询模型 | 页面模型不反写 Base/Facts | 独立 view/read table，带 `projection_version/as_of/expires_at` |
| 性能与演进 | 避免大字段/高频状态混写造成锁竞争 | 高频状态分表或 ledger；范围索引；按 tenant/time 预留分区策略 |
| 外部适配器 | 外部 ID 与内部事实分离 | `external_refs` 关联表，包含 adapter、environment、external_id、sync_status；DEV/TEST no-op |

## 4. 禁止混合规则

| 禁止混合 | 正确对象边界 |
|---|---|
| ProductOffering 与 OrderIntent | 产品目录是供给主数据；意向是家庭交易事实 |
| OrderIntent 与 FamilyEntitlement | 意向/交易过程不等于已获得权益；权益是独立事实 |
| fixture catalog 与正式产品目录 | fixture 只能是 DEV/TEST adapter/projection |
| 客户资产卡片与资产事实 | 卡片是 `CustomerAssetProjection`；资产事实是 `FamilyAsset/FamilyEntitlement` |
| 任务 JSON snapshot 与 Template/Instance | 模板是供给主数据，实例是家庭事实，页面是投影 |
| LLM 输出与 Need/Decision/Plan | LLM 只生成草稿/解释；核心状态只能由 Named Action 写入 |
| 产品事件与成长结果 | 事件记录过程，不生成效果、诊断、标签或跨家庭特征 |

## 5. 可扩展商城最小纵切

| 对象 | 分类 | 业务键 | 必填范围 | 状态 | 扩展路径 |
|---|---|---|---|---|---|
| ProductOffering | 供给主数据 | `tenant_id + product_ref + version_no` | tenant | DRAFT/ACTIVE/SUSPENDED/RETIRED | `product_offering_attributes`、price/entitlement bindings、translation |
| OrderIntent | 交易事实 | `tenant_id + family_id + intent_ref` | tenant/family/actor | DRAFT/SUBMITTED/CANCELLED/EXPIRED | `order_intent_lines`、metadata whitelist、external refs |
| OrderIntentLine | 从属事实 | `order_intent_id + line_no` | tenant/family | OPEN/CANCELLED | line attributes、catalog snapshot ref |
| FamilyEntitlement | 权益事实 | `tenant_id + family_id + entitlement_ref + source_intent_id` | tenant/family | PENDING/AVAILABLE/REVOKED/EXPIRED | entitlement attributes、usage ledger、service bindings |
| CustomerAssetProjection | 读模型 | `tenant_id + family_id + projection_version` | tenant/family | FRESH/STALE/EXPIRED | new widgets through projection schema version |
| FamilyProductEvent | 产品事件 | correlation/event/object business key | tenant/family | append-only | event schema version + whitelisted payload |

## 6. 纵切边界与验收

商城最小纵切只允许测试商品选择、订单意向、无支付权益回执和客户资产投影。它不调用真实支付、不预扣资金、不发送通知、不写生产权益、不创建外部订单、不触发社区外发。

验收必须同时满足：migration 可重复应用；范围从可信上下文派生；供给、意向、权益三类表独立；Named Action 受 orchestration-auth.guard 保护；意向幂等；跨 Tenant/Family、失效产品、缺少测试 Consent、重复请求正确拒绝；成功动作写 0030 事件；资产投影只从事实读取；对应 PostgreSQL integration spec 和 `pnpm --filter @family/api typecheck` 通过。
