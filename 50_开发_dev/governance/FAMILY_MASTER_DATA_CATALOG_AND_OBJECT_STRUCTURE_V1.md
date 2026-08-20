# Family / 伐木累主数据目录与对象结构 V1

> **历史草案说明：** 本文件保留作为 22 对象历史盘点；新开发统一以 `FAMILY_MASTER_DATA_CATALOG_V2.md` 的 32 个逻辑对象基线为准，尤其是多租户 Tenant 五对象和 Activity/Slot、CommunitySpace/Template、PricePlan/EntitlementPolicy 拆分。

## 结论先行

现有数据库里有许多表，但**物理表数量不等于主数据数量**。`audit_logs`、`growth_events`、`family_service_decisions`、`test_experience_operations` 等是审计、事实或交易记录，不应被当成主数据重复建设。

当前建议把 Family 产品的主数据分成 **22 个对象**，其中 **18 个业务主数据对象**、**4 个 AI 控制主数据对象**。除此之外，另有 **12 类交易/事实对象**和 **5 类读模型/投影对象**。这个数量是 V1 的可控边界；后续新能力必须先判断属于主数据、事实还是投影，不能直接新增页面表。

| 层 | 对象数量 | 作用 | 是否作为业务事实 |
|---|---:|---|---|
| 业务主数据 | 18 | 稳定定义“家庭是谁、提供什么、谁能提供、内容和商业规则是什么” | 否，作为被引用的定义 |
| AI 控制主数据 | 4 | 定义模型、提示策略、工具、评测和版本 | 否，作为 AI 运行控制定义 |
| 交易/事实对象 | 12 类 | 记录家庭表达、决定、执行、预约、活动、社区和审计过程 | 是，按 Named Action 写入 |
| 读模型/投影 | 5 类 | 为 34 页 UI 提供按家庭范围的页面视图 | 否，由主数据和事实派生 |

## 一、18 个业务主数据对象

### 1. 家庭身份与治理主数据：6 个

| 编号 | 对象 | 权威含义 | 当前物理表/状态 |
|---:|---|---|---|
| M-01 | `Family` | 数据所有权根、家庭生命周期和显示名 | `families`，已存在 |
| M-02 | `Person` | 家庭成员的最小身份与成员类型 | `persons`，已存在 |
| M-03 | `FamilyMembership` | Person 在 Family 内的角色和状态 | `family_memberships`，已存在 |
| M-04 | `FamilyRelationship` | 家庭成员之间的受控关系 | `family_relationships`，已存在 |
| M-05 | `LifeStage` | 生命周期阶段定义和有效期 | `life_stage_assignments`，定义与实例需分开 |
| M-06 | `ConsentPolicy` | 同意目的、版本、撤回和适用范围 | `consents` + policy registry；需补独立 policy 定义 |

`Account`、`AccountBinding`、`IdentitySession` 是身份与访问控制对象，不计入业务主数据；它们属于平台基础设施，但必须参与所有 family scope 解析。

### 2. 成长与服务目录主数据：5 个

| 编号 | 对象 | 权威含义 | 当前物理表/状态 |
|---:|---|---|---|
| M-07 | `NeedType` | 家庭支持需要的受控分类，不是家庭标签 | `need-classification.policy.ts`，尚未独立主数据表 |
| M-08 | `Capability` | Family 能提供或编排的能力键 | `GrowthCapabilityKey`/代码注册，尚未独立主数据表 |
| M-09 | `ResourceAsset` | 内容、实践、课程等候选资源及版本、证据、风险、准入 | 资源 registry/资产目录，部分已实现 |
| M-10 | `ServiceOffering` | 可被家庭选择的服务能力/供给定义 | `interventions`、resource registry，需统一目录 |
| M-11 | `EvidenceSource` | 资源/服务来源、证据等级、版权和授权状态 | `evidence_records` 可记录事实；来源主数据需独立定义 |

### 3. 供给与活动主数据：3 个

| 编号 | 对象 | 权威含义 | 当前物理表/状态 |
|---:|---|---|---|
| M-12 | `Provider` | 名师、服务团队、沙龙主理人的供给主体 | `family_service_provider_catalog`，DEV/TEST 已建立 |
| M-13 | `ProviderQualification` | 资格、培训、有效期和解释责任 | 目前为 provider 字段，需逐步拆分 |
| M-14 | `AvailabilitySlot/Activity` | 可预约时间和活动定义；不等于已预约 | `family_activity_catalog`；预约事实仍在 operation 表 |

### 4. 内容与体验主数据：2 个

| 编号 | 对象 | 权威含义 | 当前物理表/状态 |
|---:|---|---|---|
| M-15 | `JourneyTemplate` | 服务旅程/成长路径的模板定义 | `growth_journeys` 是实例，模板尚未独立 |
| M-16 | `TaskTemplate` | 任务标题、说明、时长和适用边界的模板定义 | `family_page_task_items` 是实例，模板尚未独立 |

### 5. 商业化定义主数据：2 个

| 编号 | 对象 | 权威含义 | 当前物理表/状态 |
|---:|---|---|---|
| M-17 | `ProductOffering` | 商品/课程/实践的可展示定义，不含客户端可改价格 | `family_admitted_catalog_items`，DEV/TEST 已建立 |
| M-18 | `PriceEntitlementPolicy` | 价格引用、权益规则、适用条件和版本 | 当前仅 `price_ref`，正式支付/权益仍需独立商业化 Gate |

## 二、4 个 AI 控制主数据对象

| 编号 | 对象 | 作用 | 当前状态 |
|---:|---|---|---|
| AI-M-01 | `ModelProfile` | 模型 allowlist、能力、环境和版本 | `family-llm.config.ts` + live catalog |
| AI-M-02 | `PromptPolicy` | 页面/用例的输入边界、状态上限和禁词 | `family-llm-page-policy.ts` + Gateway policy |
| AI-M-03 | `ToolDefinition` | 允许模型提出的 Named Action/工具参数 schema | `tool-registry.ts`，已建立 |
| AI-M-04 | `EvalSuite` | 正例、负例、阈值和回放版本 | AI Gate 文档/合成评测，需持续结构化 |

这四个对象不属于家庭业务主数据，不写入儿童/家庭画像，也不允许由模型自行修改。真实 API key 是运行时 secret，不是主数据，永远不进入对象表。

## 三、12 类交易/事实对象：不计入主数据

| 类别 | 代表对象/表 | 写入方式 |
|---|---|---|
| 家庭表达 | `NeedInput`, `NeedSignal` | L0 Named Action；Signal 非 canonical |
| 家庭意图 | `Intent` | 家庭明确确认后写入 |
| 候选展示 | `EligibilityEvaluation`, `ResourceRecommendation` | 服务端准入复验和版本快照 |
| 家庭决定 | `FamilyDecision` | 家庭选择、返回、暂停或 `NO_ACTION` |
| 计划与执行 | `OrchestrationPlan`, `ServiceCase`, `ServiceContribution` | 明确 Decision 后受控创建 |
| 任务实例 | `TaskInstance`/`family_page_task_items` | 从模板实例化；Named Action 更新状态 |
| 报告快照 | `SupportReportSnapshot` | 家庭私有说明；不得是诊断/成长分 |
| 服务记录 | `ServiceRecord`/`family_service_records` | 记录过程，不证明效果 |
| 商城/邀请/拼团 | `CommerceOperation` | 测试或正式订单事实，当前 DEV 为 `test_experience_operations` |
| 预约/活动报名 | `Booking`, `EventRegistration` | 当前 DEV 为 operation；真实渠道另行接入 |
| 社区发布 | `CommunityPublication` | 当前仅模板回执；真实外发继续隔离 |
| AI 运行审计 | `LLMGatewayAudit`, `AuditLog`, `OutboxEvent` | 只保存脱敏摘要、哈希和决策，不保存 key/原文 |

## 四、5 类 UI 读模型/投影：不作为真相表重复写

| 投影 | 服务页面 | 来源 |
|---|---|---|
| `FamilyHomeProjection` | UI-01、UI-02、UI-33 | Family/Person/Membership/Consent/Intent/ServiceRecord |
| `GrowthJourneyProjection` | UI-04–UI-12、UI-29、UI-31 | Intent/Decision/Plan/Task/Report/ServiceRecord |
| `AdmittedCatalogProjection` | UI-13–UI-23、UI-25–UI-26 | ProductOffering/ServiceOffering/Provider/Activity/Admission |
| `CustomerAssetProjection` | UI-18、UI-24、UI-30–UI-32 | CommerceOperation/Booking/Event/Community facts |
| `LLMContextSnapshot` | 需要解释的全部页面 | Gateway 只读裁剪；不写回核心事实 |

当前 `family_customer_asset_projection` 使用 SQL view 从 `test_experience_operations` 派生，符合投影不重复建真相表原则。

## 五、统一结构模板

### 5.1 平台级主数据

`object_id`、`object_code`、`version`、`status`、`source_ref`、`evidence_level`、`risk_flags`、`valid_from`、`valid_to`、`owner_ref`、`created_at`、`updated_at`。

平台级目录对象必须具备版本、准入、证据、风险、版权/授权和资格字段。没有完整资格、准入或风险路由时，候选不可展示或只能显示安全停止。

### 5.2 家庭级主数据

`object_id`、`family_id`、`visibility`、`status`、`version`、`consent_ref`、`source`、`created_by_person_id`、`created_at`、`updated_at`、`withdrawn_at`。

家庭级对象必须由服务端派生 `family_id`，客户端不得提交或覆盖。默认 `FAMILY_PRIVATE`，撤回后只读或不可见，不能转成公开画像。

### 5.3 交易事实

`fact_id`、`family_id`、`actor_person_id`、`named_action`、`correlation_id`、`idempotency_key`、`status`、`source`、`environment`、`external_effect`、`created_at`、`cancelled_at`。

交易事实必须可重放、可取消或可安全停止。`NO_ACTION` 不得创建 Plan、Case、Task、Reminder 或外部事件。

## 六、为什么不是“一张万能主表”

Family 不能把所有页面字段塞入一个 JSONB `ontology` 或自由文本表。这样会丢失家庭所有权、版本、撤回、证据、准入、资格、Named Action 和审计语义，也会让 LLM 输出直接污染核心事实链。正确做法是：**22 个稳定主数据对象 + 明确的交易事实 + 可重建读模型**，每一类对象拥有自己的状态和生命周期，但通过 `family_id`、对象引用、版本和事件关联成完整系统。

## 七、当前建议的落地顺序

第一步锁定 M-01 至 M-06，并把 Account/Binding/Consent 作为所有 API 的前置上下文。第二步统一 M-07 至 M-11，消除 `need-classification.policy.ts`、resource registry、intervention 和 evidence 之间的重复定义。第三步完成 M-12 至 M-16，支撑名师、沙龙、服务旅程和任务页面。第四步再建设 M-17/M-18 的沙箱商业化定义，不在没有独立支付/权益 Gate 前接入真实支付。AI-M-01 至 AI-M-04 贯穿全部步骤，但始终作为控制平面，不作为家庭业务数据。

> **数量口径：** 现阶段先按 **22 个主数据对象**设计；新增对象必须说明它为何不是已有对象的版本、实例、事实或投影，并同时提交对象字典、关系、权限、状态、迁移、DTO、Named Action 和测试证据。
