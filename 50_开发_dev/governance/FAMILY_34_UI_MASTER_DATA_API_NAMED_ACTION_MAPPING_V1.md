# Family / 伐木累 34 页主数据、API 与 Named Action 映射 V1

> 本表回答每一页“读什么对象、写什么事实、调用哪个接口、由哪个 Named Action 保护、允许写到什么状态”。页面不是主数据；没有对应对象和契约的页面只能先做只读或安全停止。

## 1. 统一 API 前缀和对象来源

| API 类别 | 路径模式 | 对象来源 | 写入规则 |
|---|---|---|---|
| 家庭首页/对象投影 | `/families/:familyId/home`、`/orchestration/test-loop/page-objects` | Family、Person、Membership、Consent、Intent、Task、Report、ServiceRecord | 读模型；family scope 服务端派生 |
| L0/L1 成长编排 | `/orchestration/needs`、`/intents`、`/decisions` | NeedInput、NeedSignal、Intent、AdmittedCandidate、FamilyDecision、Plan | `RequestGrowthHelp`、`ConfirmGrowthIntent`、`DecideGrowthService` |
| 页面对象动作 | `/orchestration/test-loop/page-objects/actions` | TaskInstance、ReportSnapshot、ServiceRecord | `ExecuteFamilyPageObjectAction`；只改家庭私有状态 |
| 目录投影 | `/orchestration/test-loop/catalog` | ProductOffering、ResourceAsset、Provider、Qualification、Activity、EvidenceSource | `ReadFamily`；只读准入候选 |
| 商业/服务体验 | `/orchestration/test-loop/experience/operations` | CommerceOperation、Booking、EventRegistration、CommunityPublication | `ExecuteTestExperienceAction`；固定 fixture、幂等、`external_effect=false` |
| 客户资产 | `/orchestration/test-loop/experience/customer-projection`、`/catalog` | CustomerAssetProjection、Operation | `ReadFamily`；投影不是真实订单/权益 |
| LLM | `/orchestration/test-loop/llm/draft`、`/replay` | ModelProfile、PromptPolicy、ToolDefinition、EvalSuite | 仅 Gateway；不直接写业务对象 |

## 2. 34 页逐页映射

| UI | 页面 | 主数据 | 交易事实 | 读模型/API | Named Action | 状态上限 | 当前实现 |
|---|---|---|---|---|---|---|---|
| UI-01 | 家庭首页 | M-01 Family、M-02 Person、M-03 Membership、M-06 Consent | 无 | `FamilyHomeProjection` / `/home` | `ReadFamily` | `READ_ONLY_PRIVATE_FAMILY` | 首页路由已完成；对象投影接入中 |
| UI-02 | 成长体检入口 | Family、Person、NeedType、Capability、PromptPolicy | 无 | `LLMContextSnapshot` / Gateway draft | `ReadFamily` | `EXPLANATION_OR_BLOCKED` | Gateway 已接入 |
| UI-03 | 当前需要确认 | NeedType、Capability、Consent | NeedInput、NeedSignal、Intent | L0 need/intent DTO | `RequestGrowthHelp`、`ConfirmGrowthIntent` | `NEED/INTENT/NO_ACTION` | 后端已存在；UI 逐字段接入 |
| UI-04 | 成长报告 | ResourceAsset、EvidenceSource、JourneyTemplate | SupportReportSnapshot | `GrowthJourneyProjection`、report projection | `ReadFamily`；撤回用 `ExecuteFamilyPageObjectAction` | `FAMILY_PRIVATE_REPORT` | 0023 对象已建立 |
| UI-05 | 成长计划 | JourneyTemplate、TaskTemplate、Capability | FamilyDecision、OrchestrationPlan | `GrowthJourneyProjection` | `DecideGrowthService` 后受控创建 | `PLAN_ONLY` | Plan 主链已存在；页面投影待接入 |
| UI-06 | 服务旅程 | ServiceOffering、Provider、Activity | ServiceCase、ServiceRecord | `ServiceJourneyProjection` | `ReadFamily` / 受控服务动作 | `SERVICE_RECORD_ONLY` | 现有 case 链可复用 |
| UI-07 | 我的会员 | ProductOffering、PriceEntitlementPolicy | 无真实权益；仅测试资产 | CustomerAssetProjection | `ReadFamily` | `PRIVATE_ASSET_PROJECTION` | 真实会员/支付保持 Gate |
| UI-08 | 成长报告/反馈 | EvidenceSource、JourneyTemplate | SupportReportSnapshot、ServiceRecord | Report/Service projection | `ReadFamily`、撤回动作 | `NO_SCORE_NO_DIAGNOSIS` | 0023 可承载；禁止成长分 |
| UI-09 | 今日任务 | TaskTemplate、JourneyTemplate | TaskInstance | `page-objects.tasks` | `ExecuteFamilyPageObjectAction` | `OPEN/COMPLETED/PAUSED/CANCELLED` | API + DB + 集成已通过 |
| UI-10 | 孩子侧页面 | Person、LifeStage、Consent | 无儿童直接作答事实 | 家庭私有只读投影 | `ReadFamily` | `READ_ONLY` | 儿童直接作答保持 HOLD |
| UI-11 | 成长榜单 | 无跨家庭排名主数据 | 禁止写排名事实 | 仅个人/家庭自有记录 | 无 | `PRIVATE_PROGRESS_ONLY` | 跨家庭排名永久禁止 |
| UI-12 | 成长海报 | EvidenceSource、JourneyTemplate | 私有成果记录 | Private report/progress projection | 仅私有记录动作 | `PRIVATE_ONLY` | 公开分享保持 HOLD |
| UI-13 | 商城首页 | ProductOffering、ResourceAsset、EvidenceSource | 无 | `AdmittedCatalogProjection` / `/catalog` | `ReadFamily` | `ADMITTED_READ_ONLY` | 0024 目录表已建立 |
| UI-14 | 商品详情 | ProductOffering、PriceEntitlementPolicy | 选择意图/体验操作 | Catalog detail | `ReadFamily` | `DETAIL_ONLY` | 详情 DTO 待接入 |
| UI-15 | 邀请有礼 | ProductOffering | CommerceOperation | CustomerAssetProjection | `ExecuteTestExperienceAction` / `CREATE_INVITE` | `CONFIRMED`, no external effect | 已通过 PostgreSQL/Web 集成 |
| UI-16 | 拼团 | ProductOffering、PriceEntitlementPolicy | CommerceOperation | CustomerAssetProjection | `ExecuteTestExperienceAction` / `CREATE_GROUP` | `CONFIRMED`, no payment | 已通过 PostgreSQL/Web 集成 |
| UI-17 | 积分商城 | ProductOffering、PriceEntitlementPolicy | 禁止真实积分/兑换事实 | 只能测试 ledger/说明 | 独立 Gate | `READ_ONLY_OR_BLOCKED` | 不创建真实权益 |
| UI-18 | 我的资产 | ProductOffering、PriceEntitlementPolicy | CommerceOperation | CustomerAssetProjection | `ReadFamily` | `PRIVATE_ASSET_PROJECTION` | projection 已有 |
| UI-19 | 名师专区 | Provider、ProviderQualification、ServiceOffering | 无 | Provider catalog | `ReadFamily` | `ADMITTED_PROVIDER_READ_ONLY` | 0024 provider 目录已建立 |
| UI-20 | 名师详情 | Provider、Qualification、EvidenceSource | 无 | Provider detail DTO | `ReadFamily` | `DETAIL_ONLY` | 详情 DTO 待接入 |
| UI-21 | 在线咨询预约 | Provider、Qualification、AvailabilitySlot、Consent | Booking/CommerceOperation | Service projection | `ExecuteTestExperienceAction` / `CREATE_BOOKING` | `CONFIRMED`, no human contact | 已通过 PostgreSQL/Web 集成 |
| UI-22 | 沙龙列表 | Activity、Provider、Qualification | 无 | Activity catalog | `ReadFamily` | `ADMITTED_ACTIVITY_READ_ONLY` | 0024 activity 目录已建立 |
| UI-23 | 活动详情/报名 | Activity、Provider、Consent | EventRegistration/CommerceOperation | Activity detail + asset | `ExecuteTestExperienceAction` / `CREATE_EVENT` | `CONFIRMED`, no seat/payment | 已通过 PostgreSQL/Web 集成 |
| UI-24 | 我的服务/活动 | Provider、Activity、ServiceOffering | Booking、EventRegistration、ServiceRecord | Service/CustomerAsset projection | `ReadFamily`、取消动作 | `PRIVATE_SERVICE_RECORD` | projection 基础已具备 |
| UI-25 | 家长社区 | CommunityTemplate、ServiceOffering、Consent | 无真实 feed 事实 | Private synthetic feed | `ReadFamily` | `PRIVATE_SYNTHETIC_READ_ONLY` | 真实社区外发保持隔离 |
| UI-26 | 发布动态 | CommunityTemplate、Consent | CommunityPublication/Operation | Private publication receipt | `ExecuteTestExperienceAction` / `PUBLISH_TEMPLATE` | `RECORDED`, no external publish | 已通过 PostgreSQL/Web 集成 |
| UI-27 | 动态详情 | CommunityTemplate | CommunityPublication | Private detail projection | `ReadFamily` | `PRIVATE_DETAIL_ONLY` | DTO 待接入 |
| UI-28 | 我的社区 | CommunityTemplate、Person | Private publication facts | Private community projection | `ReadFamily` | `PRIVATE_ONLY` | 不生成公开画像 |
| UI-29 | 成长成果 | EvidenceSource、JourneyTemplate | SupportReportSnapshot、ServiceRecord | Private outcomes/process projection | `ExecuteFamilyPageObjectAction` / `WITHDRAW_REPORT` | `NO_EFFECT_CLAIM` | report withdraw API + 集成已通过 |
| UI-30 | 年度会员 | ProductOffering、PriceEntitlementPolicy | 仅测试资产 | CustomerAssetProjection | `ReadFamily` | `PRIVATE_ASSET_PROJECTION` | 真实支付/权益保持 Gate |
| UI-31 | 我的服务 | ServiceOffering、Provider、Activity | ServiceCase、ServiceRecord、TaskInstance | `page-objects` service/tasks | `ReadFamily` / pause task | `PRIVATE_SERVICE_STATE` | 对象投影 API 已建立 |
| UI-32 | 订单资产 | ProductOffering、PriceEntitlementPolicy | CommerceOperation、Booking、Registration | `family_customer_asset_projection` | `ReadFamily` | `PRIVATE_ASSET_PROJECTION` | SQL view + experience projection 已有 |
| UI-33 | 家庭档案 | Family、Person、Membership、Relationship、Consent、LifeStage | ProfileSnapshot | `FamilyProfileSnapshotDto` | `ReadFamily` | `FAMILY_PRIVATE` | 0023 profile object + projection 已有 |
| UI-34 | 服务记录 | ServiceOffering、Provider、Activity | ServiceRecord、Booking、Registration | `FamilyServiceRecordDto` | `ReadFamily`、取消/撤回 | `RECORDED/CANCELLED` | 0023 record object + projection 已有 |

## 3. 页面实现验收

页面必须同时满足以下条件才可标记为 `FRONTEND_BACKEND_MATCHED`：UI 热点调用的 API 与页面对象一致；API DTO 不允许客户端提交 `family_id`、模型、金额、资格或外部地址；服务端从 trusted family context 派生家庭范围；写操作有 Named Action、幂等键和数据库状态；读模型带 `source`、`version`、`visibility` 和 `status`；文本等价与视觉入口同时存在；API integration、Web test 和浏览器黄金路径均有证据。

页面只读而没有后端对象时，状态应为 `UI_READY_BACKEND_GAP`；涉及真实支付、真实权益、真人咨询、儿童直接作答、跨家庭排名、公开社区外发或诊断结论时，状态应为 `GATE_BOUNDARY`，不能通过静态页面宣称完成。

## 4. 当前差距汇总

| 类别 | 页面 | 下一步 |
|---|---|---|
| 已具备正式写闭环 | UI-09、UI-15、UI-16、UI-21、UI-23、UI-26、UI-29 | 接入更细的对象读回和取消/撤回 UI |
| 已具备对象读投影，需接前端热点 | UI-01、UI-04、UI-08、UI-18、UI-24、UI-31、UI-32、UI-33、UI-34 | 统一 API client 与页面状态 |
| 已有底层对象但目录/详情 DTO 待补 | UI-13、UI-14、UI-19、UI-20、UI-22、UI-25、UI-27、UI-28 | 接 admitted catalog/provider/activity DTO |
| 必须保持边界或独立 Gate | UI-07、UI-10、UI-11、UI-12、UI-17、UI-30 | 只做私有投影/安全停止，不伪造生产事实 |


## 5. 字节式产品数据循环增量映射

V1 的主数据/API/Named Action 映射继续有效；本节增加产品事件、实时投影和 AI Context 约束。每页只允许记录与当前页面动作直接相关的最小事件，不建立跨家庭行为画像。

| 页面组 | 允许产品事件 | 刷新投影 | 可进入 LLM Context | 保留/撤回边界 |
|---|---|---|---|---|
| UI-01–UI-06 成长与服务入口 | `page_view`、`explanation_requested`、`need_confirmed`、`decision_submitted`、`no_action_selected`、`task_completed` | FamilyHome、GrowthJourney、TaskBoard、ServiceJourney | 当前页面、家庭明确 Need/Intent、admitted candidate 摘要 | 目的限定；可撤回；不生成成长结果 |
| UI-07–UI-12 会员/报告/孩子侧 | `asset_viewed`、`report_opened`、`report_withdrawn`、`task_paused` | CustomerAssets、ReportSnapshot、PrivateProgress | 只读私有资产/报告状态；孩子侧不接收儿童直接作答 | 不记录公开人设、排名、评分或儿童画像 |
| UI-13–UI-18 商城 | `catalog_viewed`、`catalog_item_opened`、`invite_created`、`group_created`、`asset_viewed` | AdmittedCatalog、CustomerAssets | 只读准入候选、家庭明确选择和测试资产状态 | 无支付/权益事实；测试操作可撤销/过期 |
| UI-19–UI-24 名师/沙龙 | `provider_viewed`、`activity_viewed`、`booking_requested`、`registration_requested`、`booking_cancelled` | ProviderCatalog、ActivityCatalog、ServiceTimeline | 资格完整的服务/活动摘要和家庭明确动作 | 不外呼真人、不占真实席位、不产生真实预约 |
| UI-25–UI-28 社区 | `community_viewed`、`template_opened`、`publication_recorded` | PrivateCommunity、PublicationReceipt | 仅模板说明和私有回执，不传公开社区 feed | 不外发，不建立公开画像，不记录敏感原文 |
| UI-29–UI-34 成果/服务/档案 | `outcome_viewed`、`service_record_viewed`、`profile_viewed`、`record_withdrawn` | PrivateOutcomeProcess、ServiceTimeline、FamilyProfile | 家庭私有过程记录和可撤回报告摘要 | 不把过程指标写成教育效果，不跨租户共享 |

### 5.1 事件统一 Envelope

所有新增页面事件必须使用统一 envelope：`event_id`、`tenant_id`、`family_id`（若为家庭事件）、`actor_id`、`event_type`、`object_type`、`object_id`、`source_page_id`、`purpose`、`consent_ref`、`occurred_at`、`correlation_id`、`schema_version`、`retention_class`。客户端不得提交或覆盖 `tenant_id`、`family_id`、`actor_id`；这些字段由服务端可信上下文派生。

### 5.2 Projection 与 Context freshness

每个 UI Read Model 必须带 `projection_version`、`as_of`、`source_refs`、`policy_version`、`visibility` 和 `expires_at`。LLM Gateway 只能读取仍在有效期内、租户策略允许、家庭范围匹配的快照。若 `as_of`、版本、Consent、准入或资格未知，Gateway 返回安全停止，不使用过期或未验证投影。

### 5.3 家庭自主决定优先

事件和投影用于解释当前可见状态、刷新页面和支持家庭比较，不用于自动排序“最佳方案”。任何从候选到 Plan/Case 的推进必须经过家庭明确 Decision；`NO_ACTION` 不创建 Plan、Case、Task、Reminder 或外部副作用。

### 5.4 当前一致性状态增量

在 V1 状态基础上，每页新增以下检查项：

| 检查项 | 通过条件 |
|---|---|
| Event matched | 页面动作有明确事件类型和 schema_version |
| Projection matched | API 返回对象带 projection_version/as_of/source_refs/visibility |
| Context matched | LLM Context 只读最小快照并继承 TenantPolicy |
| Decision matched | 家庭明确 Decision/NO_ACTION 可回读，且状态上限正确 |
| Retention matched | 事件、投影、派生草稿有 purpose/retention/expires_at |
| Cross-tenant negative | 变更 family_id、tenant_id、binding 或过期策略均 fail-closed |

新增条件全部满足后，页面才可标记为 `FRONTEND_BACKEND_PRODUCT_LOOP_MATCHED`；只有视觉和路由通过而事件/投影/Context 未完成的页面，仍标记为 `UI_READY_BACKEND_GAP`。
