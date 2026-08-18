# Family 34 页对象属性、键、状态与生命周期模型 V1

## 1. 统一键与范围规则

所有正式业务对象均使用代理主键 `*_id uuid`。代理主键不能替代业务唯一键；业务唯一键由 `tenant_id`、自然业务标识和版本/生效期组成。所有家庭事实、事件、投影和多模态事实必须携带服务端派生的 `tenant_id` 与 `family_id`，不得由客户端覆盖。

### 1.1 Base 对象统一字段

`object_id`、`tenant_id`（平台级对象可为空但必须有 scope_type）、`family_id`（家庭对象必须有）、`business_ref`、`status_code`、`effective_from`、`effective_to`、`version_no`、`source_system`、`source_ref`、`created_at`、`created_by`、`updated_at`、`updated_by`、`correlation_id`、`idempotency_key`、`row_version`、`deleted_at`。

### 1.2 事件统一字段

`event_id`、`tenant_id`、`family_id`、`event_type`、`aggregate_type`、`aggregate_id`、`page_id`、`action_id`、`purpose_code`、`occurred_at`、`fixture_version`、`source_system`、`correlation_id`、`idempotency_key`、`retention_class`、`payload_hash`。事件 payload 不保存真实 key、认证头、原始 prompt、未审查媒体或不必要自由文本。

### 1.3 投影统一字段

`projection_id`、`tenant_id`、`family_id`、`projection_type`、`projection_version`、`as_of`、`source_refs`、`policy_version`、`visibility_code`、`expires_at`、`generated_at`。投影必须可重建、可过期和只读，不能作为事实写回来源。

## 2. 家庭与访问对象

| 对象 | 主键/业务键 | 关键字段 | 状态 | 生命周期 |
|---|---|---|---|---|
| Tenant | tenant_id / tenant_code | name、policy_profile_id、status | DRAFT/ACTIVE/SUSPENDED/RETIRED | 租户建立、启用、暂停、退休 |
| TenantFamilyBinding | binding_id / tenant_id+family_id | binding_status、effective dates | PENDING/ACTIVE/ENDED | 绑定有效期控制家庭可见性 |
| Family | family_id / tenant_id+family_ref | display_name、locale、timezone | ACTIVE/PAUSED/ARCHIVED | 家庭私有根；归档后只读 |
| Account | account_id / provider+subject | auth_subject、status | ACTIVE/LOCKED/REVOKED | 访问主体，不拥有家庭事实 |
| FamilyMembership | membership_id / family_id+person_id+role | role、consent_scope、effective dates | INVITED/ACTIVE/SUSPENDED/ENDED | 监护人/成员访问控制 |
| Person | person_id / tenant_id+person_ref | display_name、birth_band、role | ACTIVE/PRIVATE/ARCHIVED | 儿童数据最小化、默认私有 |
| Consent | consent_id / family_id+purpose+subject+version | purpose、scope、captured_at、withdrawn_at | REQUESTED/GRANTED/WITHDRAWN/EXPIRED | 撤回后停止处理，保留最小审计 |

## 3. 需要、计划与成长服务对象

| 对象 | 关系 | 状态机 | 状态上限 |
|---|---|---|---|
| NeedIntake | Family→NeedIntake | OPEN→SUBMITTED→WITHDRAWN/EXPIRED | 家庭表达，不是事实诊断 |
| Intent | NeedIntake→Intent | DRAFT→CONFIRMED→WITHDRAWN | 服务规划意图 |
| Decision | Intent→Decision | PROPOSED→ACCEPTED/DECLINED/NO_ACTION | 家庭明确决定，不等于执行 |
| Journey | Decision→Journey | DRAFT→ACTIVE→PAUSED→COMPLETED/ABANDONED | 只记录已选择路径 |
| Stage/WeekPlan | Journey→Stage→WeekPlan | NOT_STARTED→ACTIVE→DONE/SKIPPED | 过程状态，不产生效果结论 |
| TaskTemplate | JourneyTemplate→TaskTemplate | DRAFT→ACTIVE→RETIRED | 平台/租户目录定义 |
| TaskInstance | WeekPlan→TaskInstance | TODO→IN_PROGRESS→DONE/SKIPPED/CANCELLED | 行动过程事实 |
| SupportReport | Family→SupportReport | DRAFT→REVIEWED→VISIBLE→WITHDRAWN/EXPIRED | 私有支持说明草稿；禁止诊断/评分写回 |
| ServiceCase | Decision/Booking→ServiceCase | OPEN→ACTIVE→PAUSED→CLOSED/CANCELLED | 服务过程事实 |
| ServiceRecord | ServiceCase→ServiceRecord | DRAFT→CONFIRMED→WITHDRAWN | 记录已发生/已确认的过程，不是效果证明 |

## 4. 供给、目录、商城和活动对象

| 对象 | 主外键关系 | 关键业务键 | 状态 |
|---|---|---|---|
| ResourceAsset | Capability/EvidenceSource | tenant+asset_code+version | DRAFT/REVIEW/ADMITTED/DEGRADED/RETIRED |
| ServiceOffering | Provider/Qualification | tenant+service_code+version | DRAFT/ACTIVE/SUSPENDED/RETIRED |
| Provider | Tenant/ProviderQualification | tenant+provider_code | PENDING/QUALIFIED/SUSPENDED/RETIRED |
| AvailabilitySlot | Provider/ServiceOffering | provider+start_at+channel | OPEN/HELD/BOOKED/CLOSED |
| Activity | Tenant/ActivitySession | tenant+activity_code+version | DRAFT/PUBLISHED/FULL/CANCELLED/ENDED |
| ProductOffering | Catalog/PricePlan | tenant+sku+version | DRAFT/ACTIVE/SUSPENDED/RETIRED |
| PricePlan | ProductOffering | product+currency+effective_from | DRAFT/ACTIVE/EXPIRED |
| EntitlementPolicy | Product/Service | product+policy_version | DRAFT/ACTIVE/RETIRED |
| CatalogProjection | TenantPolicy/Admission | tenant+projection_type+version | FRESH/STALE/EXPIRED |

## 5. 交易事实与客户资产

| 对象 | 主外键关系 | 状态机 | 关键规则 |
|---|---|---|---|
| Booking | Family→Slot/Offering/Provider | DRAFT→REQUESTED→CONFIRMED/CANCELLED/EXPIRED | DEV/TEST 可用沙箱适配器；生产需独立集成 |
| Registration | Family→Activity | DRAFT→REQUESTED→CONFIRMED/CANCELLED/EXPIRED | 不能自动通知或收费 |
| Order | Family→ProductOffering | DRAFT→PLACED→CONFIRMED/CANCELLED | 测试订单不能冒充支付事实 |
| OrderLine | Order→ProductOffering | OPEN→FULFILLED/CANCELLED | 只保留测试履约状态 |
| Asset | Order/Decision→Family | PENDING→AVAILABLE→USED/EXPIRED/REVOKED | 家庭私有客户资产投影/事实 |
| Invite | Family→Campaign/Group | CREATED→SENT_SANDBOX→ACCEPTED/CANCELLED | 不发送外部链接 |
| PointLedger | Family→PointEvent | OPEN→POSTED→REVERSED | DEV/TEST 账本，不映射儿童能力 |
| PublicationDraft | Family→CommunitySpace/Template | DRAFT→SUBMITTED→WITHDRAWN/EXPIRED | 草稿默认私有 |
| Publication | Draft→CommunitySpace | PENDING→VISIBLE→WITHDRAWN/ARCHIVED | 可见范围与撤回必须显式 |
| Reaction/Comment | Publication→FamilyMembership | CREATED→VISIBLE→WITHDRAWN | 必须 scope-bound，不能形成公开关系图 |

## 6. 多模态与 AI 对象

| 对象 | 输入/输出 | 状态 | 禁止写回 |
|---|---|---|---|
| ModelProfile | Provider/model/capabilities | ACTIVE/RETIRED | 客户端不能选模型 |
| PromptPolicy | use_case/policy/version | DRAFT/ACTIVE/RETIRED | 不保存真实 prompt |
| ToolDefinition | action/schema/scope | REGISTERED/ENABLED/DISABLED | 只允许白名单 Named Action |
| EvalSuite | synthetic cases/threshold | DRAFT/ACTIVE/RETIRED | 不混入真实数据 |
| MultimodalAsset | hash/type/size/tenant/family | RECEIVED/QUARANTINED/AVAILABLE/DELETED | 不直接写家庭事实 |
| MultimodalConsent | asset/purpose/retention | REQUESTED/GRANTED/WITHDRAWN/EXPIRED | 撤回后停止处理 |
| ProcessingRun | asset/policy/model | QUEUED/RUNNING/SUCCEEDED/BLOCKED/FAILED | 不保存 provider 原文 |
| DerivedArtifact | run/output_schema | DRAFT/VALIDATED/BLOCKED/EXPIRED/DELETED | 默认只能 `DERIVED_DRAFT_PRIVATE` |
| LLMContextSnapshot | sources/policy/as_of | READY/EXPIRED/BLOCKED | 只读最小快照 |
| LlmAuditReplay | trace/decision/hashes | RECORDED/REDACTED/EXPIRED | 不保存 key、原 prompt、provider 原文 |

## 7. 34 页页面状态映射

| 页面组 | 读模型 | 可写 Command | 事实/事件 |
|---|---|---|---|
| UI-01/UI-02 首页 | FamilyHomeProjection | OpenNeedIntake | PageViewed、NeedEntryOpened |
| UI-03/UI-08 需要确认 | AssessmentProjection | SaveNeedSelection、ConfirmIntent、NoAction | NeedSelected、IntentConfirmed |
| UI-04 报告 | PrivateReportProjection | RequestExplanation、WithdrawReport | ReportViewed、ExplanationRequested |
| UI-05/UI-09 计划任务 | Journey/TaskProjection | AcceptDecision、StartTask、CompleteTask、PauseJourney | PlanAccepted、TaskCompleted |
| UI-06/UI-10 陪跑 | ServiceJourneyProjection | OpenServiceCase、RecordCheckin | ServiceViewed、CheckinRecorded |
| UI-11/UI-12/UI-27 成果 | AchievementProjection | DraftArtifact、RevokeArtifact | ArtifactViewed、ArtifactRevoked |
| UI-13–UI-17 商城 | Catalog/AssetProjection | CreateInvite、JoinGroup、RedeemSandbox | ProductViewed、GroupJoined、AssetViewed |
| UI-19–UI-23 名师/活动 | Provider/ActivityProjection | DraftBooking、ConfirmSandboxBooking、RegisterSandbox | BookingRequested、RegistrationRequested |
| UI-25–UI-29 社区 | CommunityProjection | CreateDraft、PublishTemplate、WithdrawPublication | DraftCreated、PublicationWithdrawn |
| UI-07/UI-18/UI-24/UI-30–UI-34 客户后台 | CustomerHome/Archive/ServiceProjection | ViewOrderAsset、WithdrawRecord | OrderViewed、ServiceRecordWithdrawn |

## 8. 生命周期与删除

家庭事实必须保留 `retention_class` 与用途；撤回不等于无痕删除，删除操作要留下最小不可逆审计摘要。投影可重建，过期后删除或重算；事件按保留级别归档；多模态原始资产按最短必要保留期处理，派生草稿与缓存必须有 `expires_at`。真实生产数据的保留、删除、导出和法定留存还需独立数据治理 Gate。

## 9. 关系模型待实施的关键约束

第一，所有家庭对象必须通过数据库约束或服务端派生同时验证 `tenant_id` 与 `family_id`，防止只按 Family ID 查询造成跨租户访问。第二，所有状态变更必须带 `row_version` 或等价的乐观并发检查，并由 Named Action 写入。第三，所有投影查询必须从正式事实/目录读取并带 `as_of`，不能从前端状态拼接。第四，事件和交易写入必须共用 `correlation_id` 与 `idempotency_key`，保证可回放和幂等。第五，主数据的状态、版本、生效期和准入状态必须分开，不能用一个 `status` 字段承载全部语义。
