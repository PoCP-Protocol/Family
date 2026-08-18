# Family 34 页证据优先数据结构修订蓝图 V1

## 1. 目标

Family 不再按照页面逐个临时建表，而是以 3 份 PPT、34 页 UI 和六条闭环为业务证据，以 Tenant→Family 为权属根，以 Oracle EBS 的主数据纪律和字节式产品数据循环为实现方法，形成一套可商业化演进的数据结构。

本蓝图解决四个问题：页面展示什么对象；对象属于主数据、家庭事实、交易事实、事件还是投影；对象之间如何通过主外键和状态机关联；哪些对象目前仅有 DEV/TEST 兼容实现，下一步怎样补齐为正式能力。

## 2. 统一分层

| 层级 | 责任 | 可写方式 | 典型对象 |
|---|---|---|---|
| L0 Reference | 状态、用途、风险、模态、准入、范围等参考值 | 版本化 seed/管理动作 | CodeSet、CodeValue、ValidationRule |
| L1 Supply Master | 平台/租户提供的资源、服务、活动、商品和模板 | 受控目录动作 | ResourceAsset、ServiceOffering、Provider、Activity、ProductOffering、CommunityTemplate |
| L2 Family Master | 家庭、成员、关系、Consent、家庭配置 | Guardian Named Action | Tenant、Family、Person、Membership、Consent、FamilyPreference |
| L3 Family Facts | 家庭表达、决定、计划、任务、预约、订单、服务和社区事实 | Command→校验→幂等→写事实 | Need、Intent、Decision、Journey、Task、Booking、Order、Publication |
| L4 Product Events | 产品过程和用户行为的最小记录 | Append-only event service | PageViewed、NeedConfirmed、TaskCompleted、BookingRequested |
| L5 Projections | 面向页面的可重建读模型 | Projection refresh only | FamilyHome、Journey、Catalog、CustomerAsset、Community |
| L6 AI Control/Context | 模型、策略、工具、评测和最小上下文 | Gateway/Policy only | ModelProfile、PromptPolicy、ToolDefinition、MultimodalPolicy、LLMContextSnapshot |

## 3. 关键对象关系

### 3.1 家庭成长链

`Tenant → TenantAccountMembership → TenantFamilyBinding → Family → Person/Membership/Consent`

`Family → NeedIntake → Intent → Decision/NO_ACTION → Journey → Stage/WeekPlan → TaskInstance → ServiceCase/ServiceRecord`

`NeedType/Capability/ResourceAsset/EvidenceSource` 只提供候选目录与解释依据；它们不能自动生成成长结果、永久标签、诊断或家庭评分。

### 3.2 供给与交易链

`TenantCatalogBinding → ProductOffering/PricePlan/EntitlementPolicy`

`TenantCatalogBinding → ServiceOffering → Provider → ProviderQualification → AvailabilitySlot`

`Activity → ActivitySession/AvailabilitySlot → Registration/Attendance`

`Family → Order/Booking/Registration → OrderLine/Asset/ServiceCase`

0024 的 family catalog 表和 test operation 表在第一阶段继续作为 DEV/TEST projection/compatibility layer；正式事实必须逐步迁移到上述对象链。

### 3.3 社区链

`Tenant → CommunitySpace → CommunityTemplate → PublicationDraft → Publication → Reaction/Comment`

每个 Publication 必须携带 `visibility_code`、`consent_ref`、`author_family_id`、`space_id` 和 `withdrawn_at`。在没有独立外发、内容审核和撤回链前，默认只做家庭私有或沙箱可见。

### 3.4 多模态与 AI 链

`MultimodalCapabilityProfile → MultimodalProcessingPolicy → MultimodalOutputSchema`

`Family → MultimodalConsent → MultimodalAsset → ProcessingRun → DerivedArtifact → LLMContextSnapshot`

派生草稿默认只能写入 `DerivedArtifact`，不能直接写入 Need、Intent、Decision、Plan、Case、GrowthProfile、Outcome、评分、诊断或永久标签。所有模型调用必须经过 Family Gateway，所有真实 key 只从 env/secret 读取。

## 4. 物理结构修订原则

所有正式对象使用代理主键和业务唯一键。所有家庭对象统一使用 `tenant_id + family_id`，所有平台/租户目录使用 `scope_type` 与 `tenant_id`；平台级 AI 控制对象可无 tenant，但 TenantPolicyProfile 只能收紧平台规则。

主数据必须分离 `status_code`、`version_no`、`effective_from`、`effective_to`、`admission_status` 和 `qualification_status`。不能把这些语义合并成一个 status 字段。

家庭事实必须包含 `named_action`、`actor_id`、`correlation_id`、`idempotency_key`、`row_version`、`source_system`、`retention_class` 和 `external_effect`。投影必须包含 `as_of`、`projection_version`、`source_refs`、`policy_version`、`visibility_code` 和 `expires_at`。

## 5. 现有实现的状态

| 结构 | 当前状态 | 正确定位 |
|---|---|---|
| 0023 家庭页面对象 | 已可运行 | Projection/compatibility layer；需补双范围和 envelope |
| 0024 目录/资产 | 已可运行 | DEV/TEST catalog projection；不是最终交易真相 |
| 0025 Tenant 基础 | 已落地 | Tenant foundation；需把双范围传播到旧表 |
| 0026 多模态 | 已落地 | AI control + family facts；尚未接入 34 页入口 |
| 0027–0029 Oracle 元数据 | 已落地 | Reference/object registry/read views |
| 0030 产品事件 | 已落地 | Append-only event envelope；需接入所有 page actions |
| LLM Gateway | 已可运行 | Gateway/Context/Validator/Audit；真实 key 测试时注入 |

## 6. 实施顺序

### M1：统一范围和读模型契约

为 0023/0024 读模型补 `tenant_id`、`family_id`、`projection_version`、`as_of`、`policy_version`、`source_refs`、`visibility_code` 和 `expires_at`。所有 SQL 显式使用 Tenant→Family trusted context。此阶段不改 UI 视觉。

### M2：家庭成长正式对象

把 Need/Intent/Decision/Journey/Task/Report/ServiceRecord 的 Command DTO、Read Model DTO 和事实表字段统一；为任务完成、报告撤回、服务记录动作接入 0030 事件和 row_version；补跨租户、跨家庭、重复动作和过期对象测试。

### M3：供给与商业对象

将 ProductOffering、PricePlan、EntitlementPolicy、ProviderQualification、AvailabilitySlot、ActivitySession、Order、Booking、Registration、Asset 和 CommunitySpace/Publication 作为正式对象契约；0024 只作为兼容投影，继续使用测试账户和沙箱适配器。

### M4：AI/多模态页面接入

在允许的页面增加多模态入口、Consent/撤回、处理中/安全停止/私有草稿状态，并接入 Gateway 的 Context Snapshot；保留文本等价，不把派生结果直接写入核心事实。

### M5：34 页逐页一致性收口

逐页验证 `Page → ReadModel → Command → Fact → Event → Projection → Context`。页面只有在对象、字段、状态、权限、事件、错误和审计全部一致时才标记 `FRONTEND_BACKEND_MATCHED`。

## 7. 验收矩阵

每个页面必须通过：对象存在、双范围、DTO 对齐、Named Action、状态机、幂等、事件 envelope、投影刷新、LLM/多模态策略、文本等价、撤回/过期、跨租户负例、Web 回归和浏览器路径。真实 LLM key 只在测试运行前由用户注入，不进入任何代码、文档、fixture、日志、回放或快照。

## 8. 当前判定

34 页视觉母版和核心 DEV/TEST 工作流已经形成；34 页对象和前后端结构仍为 `PARTIAL`。下一阶段优先修复双范围和读模型契约，然后补家庭成长正式事实，再补商城/服务/社区正式事实，最后接入多模态页面。此顺序不会阻止平台继续做出来，但会避免继续堆叠互不兼容的页面临时结构。
