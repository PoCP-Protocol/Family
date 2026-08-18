# Family 34 页 UI 对象模型差距审查 V1

## 1. 审查范围与判定口径

本审查以 34 页 UI 逐图转录、六条闭环规则和当前 Family V2 35 个逻辑主数据目录为上游证据，再对照 0025 Tenant、0026 Multimodal、0030 Product Event migrations 及现有 DTO/服务实现。`35 个逻辑主数据`是设计目录，不代表当前数据库已经具备 35 个完整主数据表；当前物理实现仍存在兼容投影、JSON payload 和只读 fixture 层。

本审查把差距分为：

| 等级 | 含义 |
|---|---|
| P0 | 会导致 Tenant/Family 越权、对象无法确定归属、事实与投影混淆或事件不可追踪 |
| P1 | 会导致前后端字段/状态/版本不一致，或无法支持真实业务工作流 |
| P2 | 会影响可扩展目录、查询性能、数据血缘、可运营性或长期商业化 |
| MATCHED | 页面对象与现有结构已有可运行对应，但仍需逐页验收 |
| PARTIAL | 有对象/投影/fixture，但缺少正式主数据、事实或完整状态链 |
| MISSING | 页面证据存在，当前没有可复用的正式结构或接口 |
| HOLD | 视觉/流程证据存在，但按当前治理不能默认实现为真实生产事实 |

## 2. 总体结论

当前 Family 已拥有可运行的编排、Test Experience、LLM Gateway、多租户基础、多模态基础和统一产品事件，但 34 页 UI 与物理数据结构仍不是完全一致。当前最明显的问题不在“缺少更多页面”，而在同一个页面对象在不同层被重复表示：例如 0023 使用 JSON snapshot 表示家庭档案/报告/任务/服务记录，0024 使用 fixture catalog 表示商品/服务/活动，`family_customer_asset_projection` 又把测试操作投影成资产；这些结构可以支撑 DEV 体验，但不能直接作为最终商业化主数据和交易事实。

## 3. 逐页域差距矩阵

| 页面域 | 页面 | 证据对象 | 当前实现 | 判定 | 主要差距 |
|---|---|---|---|---|---|
| 首页 | UI-01/UI-02 | FamilyHome、Task、ContentCard、ServiceOffering | Family page objects + Web manifest | PARTIAL | 缺统一 HomeProjection envelope、事件/投影版本、TenantPolicy 继承 |
| 需要确认 | UI-03/UI-08 | NeedType、NeedIntake、Intent、Consent | L0/L1 orchestration DTO | PARTIAL | 证据中的“评估维度/问题”需正式 NeedType/AssessmentToolDefinition 目录；不能用旧诊断模型 |
| 报告 | UI-04 | SupportReport、ReportSection、Capability | 0023 report snapshot + LLM draft | HOLD/PARTIAL | 当前图中的分数/诊断/同龄平均不能直写事实；缺正式 ReportSchema/解释草稿版本链 |
| 计划任务 | UI-05/UI-09 | Journey、Stage、WeekPlan、TaskTemplate、TaskInstance | 0023 task items + existing orchestration | PARTIAL | 有任务事实但缺 JourneyTemplate/TaskTemplate 正式主数据、row_version 和事件投影刷新 |
| 陪跑/助手 | UI-06/UI-10 | ServiceOffering、ServiceCase、ServiceRecord、Reminder | 0023 service records + LLM Gateway | PARTIAL | 缺正式 ServiceCase/Reminder/AssistantSession 对象和服务时间线投影 |
| 成果/排名 | UI-11/UI-12/UI-27 | Achievement、GrowthArtifact、RankingProjection | 静态/视觉母版路径 | HOLD/PARTIAL | 排名和分数必须保持静态沙箱投影；缺私有 Artifact 模型、撤回/过期和分享草稿事实 |
| 商城 | UI-13–UI-17 | ProductOffering、PricePlan、Invite、Group、PointLedger、Asset | 0024 fixture catalog + Test Experience | PARTIAL | 缺正式 Product/Price/Entitlement/Order/Asset 基表；当前 catalog/provider/activity 是 projection/compatibility layer |
| 名师/预约 | UI-19–UI-21 | Provider、Qualification、ServiceOffering、Slot、Booking、ServiceCase | 0024 provider catalog + test operation | PARTIAL | ProviderQualification 和 AvailabilitySlot 未独立；booking 仍是测试操作事实 |
| 沙龙 | UI-22/UI-23 | Activity、Session、Venue、Registration、Attendance | 0024 activity catalog + test operation | PARTIAL | 缺 Session/Attendance/Registration 正式状态链与活动投影版本 |
| 社区 | UI-25–UI-29 | CommunitySpace、Template、Draft、Publication、Reaction/Comment | 模板发布 test operation + Web manifest | PARTIAL/HOLD | 缺 CommunitySpace、可见范围、Publication 正式表；公开外发/自由文本/关系图继续 HOLD |
| 客户后台 | UI-07/UI-18/UI-24/UI-30–UI-34 | Membership、Order、Asset、FamilyProfile、ServiceRecord | 0023 objects + asset view + test operations | PARTIAL | 客户资产是投影，不是 Order/Entitlement/Asset 事实；Family page service 仅按 family_id 查询 |

## 4. 当前物理结构的关键差距

### 4.1 P0：双范围没有贯彻到全部页面对象

0025 已建立 Tenant、TenantAccountMembership、TenantFamilyBinding、TenantPolicyProfile 和 TenantCatalogBinding；但 0023 的 `family_profile_snapshots`、`family_support_report_snapshots`、`family_page_task_items`、`family_service_records` 仍主要按 `family_id` 建模，不能仅依赖调用层保证 `tenant_id`。当前 FamilyPageObjectsService 的查询和 DTO 也缺少 `tenant_id`、`projection_version`、`as_of`、`policy_version`。这会导致 34 页客户后台和家庭对象链无法证明 Tenant→Family 双范围闭环。

修订要求：所有家庭对象查询必须从可信 context 得到 `(tenant_id, family_id)`，SQL 使用两者；跨租户 family_id、错误 binding、缺少 active tenant membership 均返回安全停止；DTO 和读模型明确 scope metadata。

### 4.2 P1：0023 页面对象仍是 snapshot/JSON，不是共享对象契约

0023 能快速支撑 UI-01/UI-04/UI-05/UI-06/UI-09/UI-33/UI-34，但 payload 承载的业务结构没有统一对象键、版本、生效期、row_version、source_refs 或字段级来源。需要在不破坏已有 DEV/TEST 数据的前提下，把 snapshot 视为 Projection/compatibility layer，再通过正式的 Report、Journey、Task、ServiceRecord DTO 和事件刷新它。

### 4.3 P1：0024 目录和客户资产仍是兼容投影

`family_admitted_catalog_items`、`family_service_provider_catalog`、`family_activity_catalog` 没有完整的 Tenant/Family policy lineage；`family_customer_asset_projection` 从 `test_experience_operations` 计算资产状态，不能作为 Order/OrderLine/Entitlement/Asset 的最终事实。可继续用于 DEV，但必须登记为 projection/compatibility layer，并补正式基表/命令边界。

### 4.4 P1：统一事件已存在，但不是所有页面动作都接入

0030 已提供 tenant、可选 family、page、purpose、correlation、schema_version、retention 和幂等约束；Test Experience 的商城、预约、活动和社区动作已开始写入。但 FamilyPageObjectsService 的任务完成、报告撤回、服务记录动作仍未全部发出统一事件，也缺少 row_version 检查。34 页矩阵必须标明每个页面动作的 event_type、aggregate_type、aggregate_id 和 projection refresh。

### 4.5 P1：AI/多模态已具备控制面，但页面还未形成完整入口

0026 已建立能力、处理策略、输出 schema、Consent、Asset、ProcessingRun、DerivedArtifact 和审计事实；目前是服务端控制面和测试结构，尚未在 34 页中形成一致的资产入口、状态显示、文本等价和撤回/删除体验。接入时必须先绑定 TenantPolicyProfile、用途和家庭 Consent，输出只到私有派生草稿。

### 4.6 P2：主数据目录与页面代码仍存在命名和版本重复

`NeedType/Capability/ServiceOffering/Provider/Activity/ProductOffering/CommunityTemplate` 在治理文档中是逻辑主数据，在代码中部分仍是 enum、fixture、JSON 或兼容目录。下一阶段要以 `family_data_object_registry` 登记每个对象的 Base/Interface/Projection/Audit 层级，并让 DTO 引用 `object_ref/version`，避免页面直接依赖 fixture 字段名。

## 5. 34 页一致性完成条件

每一页只有在以下条件同时满足时才能标记 `FRONTEND_BACKEND_MATCHED`：

1. 页面存在唯一 page_id 和历史 asset/source_file alias；
2. 页面读模型有正式 DTO，字段包含 `tenant_id/family_id` 的服务端派生结果、`as_of`、`projection_version` 和 `policy_version`；
3. 每个可写控件都对应一个 Named Action/Command DTO、状态机、幂等键和数据库事实；
4. 动作成功会写统一 Product Event，并能刷新对应投影；
5. 失败、暂停、返回、NO_ACTION、撤回和过期状态可见且不产生隐性事实；
6. LLM/多模态入口都经过 Gateway、TenantPolicy、Consent、OutputSchema 和文本等价路径；
7. 集成测试覆盖跨 Tenant、跨 Family、缺 Consent、失效版本、无资格供给、重复幂等和 provider unavailable；
8. 真实 LLM key 仅通过环境变量/secret 注入，不进入代码、fixture、日志、回放和快照。

## 6. 修订顺序

第一步补齐所有家庭对象的 tenant/family 双范围和读模型 envelope，不先扩散页面功能。第二步将 0023/0024 明确标注为 DEV projection/compatibility layer，并补正式对象 DTO 和事件挂接。第三步补 JourneyTemplate/TaskTemplate、ProductOffering/PricePlan/EntitlementPolicy、ProviderQualification/AvailabilitySlot、CommunitySpace/CommunityTemplate 和 ReportSchema。第四步将 34 页各动作接入统一事件和投影刷新。第五步才扩大真实 LLM/多模态页面体验和外部沙箱适配器。

## 7. 审查判定

当前可准确表述为：**34 页视觉母版已覆盖，核心闭环和若干正式测试工作流可运行；对象模型和前后端一致性仍处于 PARTIAL，尚未达到 34 页全部 FRONTEND_BACKEND_MATCHED，也尚未达到生产多租户商业化就绪。**
