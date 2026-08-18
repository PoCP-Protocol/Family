# Family 34 页 UI 证据对象清单 V1

> 本文只把 34 页 UI 中可见的页面对象和交互线索登记为候选对象，不把页面文案自动当作事实、效果证明、诊断结论或最终数据模型。正式对象需要与 3 份 PPT、六条闭环、现有迁移和 API 契约交叉核对。

## 1. 页面分组与对象候选

| 页面组 | UI | 可见业务对象候选 | 事实/动作候选 | 读模型/投影候选 |
|---|---|---|---|---|
| 家庭成长入口 | UI-01/UI-02 | Family、Person、GrowthHome、ContentCard、ServiceOffering、TaskInstance | PageViewed、TaskOpened、ContentOpened、NotificationOpened | FamilyHomeProjection |
| 家庭需要确认 | UI-03/UI-08 | NeedType、NeedIntake、Intent、AssessmentStep、Child/Family Context | NeedSelected、IntentSubmitted、AssessmentExited、AssessmentCompleted | NeedIntakeProjection |
| AI/成长报告 | UI-04 | SupportReport、ReportSection、NeedSignal、Capability、LLMExplanation | ReportOpened、ExplanationRequested、ReportWithdrawn | PrivateReportProjection、LLMContextSnapshot |
| 成长方案与任务 | UI-05/UI-09 | JourneyTemplate、Journey、Stage、WeekPlan、TaskTemplate、TaskInstance | PlanAccepted、TaskStarted、TaskCompleted、NO_ACTION | JourneyProjection、TaskProgressProjection |
| 成长陪跑/助手 | UI-06/UI-10 | ServiceOffering、AssistantSession、Reminder、CommunityPost、LiveSession | ReminderRequested、AssistantOpened、CheckinRecorded、LiveOpened | ServiceJourneyProjection、WeeklyProgressProjection |
| 成长排名/成果 | UI-11/UI-12/UI-27 | AchievementTemplate、AchievementRecord、GrowthArtifact、ShareDraft | ArtifactViewed、ArtifactGenerated、ArtifactRevoked、ShareDrafted | PrivateAchievementProjection、ArtifactProjection |
| 家庭成长商城 | UI-13/UI-14/UI-15/UI-16/UI-17 | Catalog、ResourceAsset、ProductOffering、PricePlan、Invite、Group、PointLedger、EntitlementProjection | CatalogViewed、ProductOpened、InviteCreated、GroupJoined、PointsUsed | AdmittedCatalogProjection、CustomerAssetProjection |
| 名师与在线服务 | UI-19/UI-20/UI-21 | Provider、ProviderQualification、ServiceOffering、AvailabilitySlot、Booking、ServiceCase | ProviderViewed、BookingRequested、BookingCancelled、ServiceCaseOpened | ProviderProfileProjection、BookingProjection、ServiceTimelineProjection |
| 线下沙龙 | UI-22/UI-23 | Activity、ActivitySession、Venue/DeliveryMode、Registration、Attendance | ActivityViewed、RegistrationRequested、RegistrationCancelled、AttendanceRecorded | ActivityDetailProjection、FamilyActivityProjection |
| 家庭社区 | UI-25/UI-26/UI-28/UI-29 | CommunitySpace、CommunityTemplate、PublicationDraft、Publication、Comment/Reaction、CommunityMembership | CommunityViewed、DraftCreated、PublicationSubmitted、PublicationWithdrawn、ReactionRecorded | CommunityFeedProjection、MyCommunityProjection |
| 我的与客户后台 | UI-07/UI-18/UI-24/UI-30 | Membership、Subscription/Entitlement、Order、OrderLine、Asset、FamilyArchive、ServiceRecord | AssetViewed、InviteAccepted、OrderViewed、ServiceRecordViewed、RecordWithdrawn | MemberHomeProjection、OrderAssetProjection、FamilyArchiveProjection、ServiceRecordProjection |

## 2. 对象分层初步判断

### 2.1 稳定主数据候选

Family、Person、Membership、NeedType、Capability、ResourceAsset、EvidenceSource、Provider、ProviderQualification、ServiceOffering、Activity、AvailabilitySlot、CommunitySpace、CommunityTemplate、JourneyTemplate、TaskTemplate、AchievementTemplate、ProductOffering、PricePlan、EntitlementPolicy、Tenant、TenantPolicyProfile、TenantCatalogBinding、ModelProfile、PromptPolicy、ToolDefinition、EvalSuite、MultimodalCapabilityProfile、MultimodalProcessingPolicy、MultimodalOutputSchema 属于稳定定义或目录对象候选。它们应有代理主键、业务唯一键、状态、生效期、版本和统一审计列；并不意味着每个对象都必须立即单独建表。

### 2.2 家庭私有事实候选

NeedIntake、Intent、Decision、NO_ACTION、Journey、TaskInstance、SupportReport、ServiceCase、ServiceRecord、Booking、Registration、Invite、GroupMembership、Order、OrderLine、PointLedger、Asset、PublicationDraft、Publication、Reaction、AchievementRecord、GrowthArtifact、MultimodalAsset、MultimodalConsent、MultimodalProcessingRun、MultimodalDerivedArtifact 属于家庭范围的事实或交易对象。它们必须继承 `tenant_id + family_id`，不能被写成跨家庭统计或永久画像。

### 2.3 产品事件候选

页面浏览、入口点击、详情打开、解释请求、选择提交、NO_ACTION、任务开始/完成、邀请、拼团、预约、报名、取消、打卡、草稿、发布、撤回、资产查看和多模态处理运行均应记录为最小产品事件。事件不能替代事实，也不能从事件自动生成成长结果、评分、排名或长期标签。

### 2.4 读模型与投影候选

FamilyHomeProjection、NeedIntakeProjection、PrivateReportProjection、JourneyProjection、TaskProgressProjection、ServiceJourneyProjection、WeeklyProgressProjection、AdmittedCatalogProjection、CustomerAssetProjection、ProviderProfileProjection、BookingProjection、ActivityDetailProjection、CommunityFeedProjection、MemberHomeProjection、OrderAssetProjection、FamilyArchiveProjection、ServiceRecordProjection、LLMContextSnapshot 是面向 UI/LLM 的读模型候选。投影只读，必须带 `as_of`、`source_refs`、`projection_version`、`visibility` 和 `expires_at`，不得反写基表。

## 3. 关键关系候选

```text
Tenant
  └── TenantFamilyBinding
        └── Family
              ├── Person ── Membership/Relationship
              ├── NeedIntake ── Intent ── Decision/NO_ACTION
              ├── Journey ── Stage ── TaskInstance
              ├── SupportReport ── ReportSection
              ├── ServiceCase ── ServiceRecord
              ├── Booking ── ServiceOffering ── Provider
              ├── Registration ── Activity ── AvailabilitySlot
              ├── Order ── OrderLine ── ProductOffering
              ├── Asset/EntitlementProjection
              ├── CommunityMembership ── PublicationDraft/Publication
              ├── AchievementRecord ── GrowthArtifact
              └── MultimodalAsset ── Consent ── ProcessingRun ── DerivedArtifact

Platform Catalog
  ├── ResourceAsset ── EvidenceSource
  ├── Capability ── NeedType
  ├── ServiceOffering ── ProviderQualification
  ├── JourneyTemplate ── TaskTemplate
  ├── ProductOffering ── PricePlan ── EntitlementPolicy
  └── CommunityTemplate/Activity

AI Control Plane
  ├── ModelProfile ── PromptPolicy ── ToolDefinition ── EvalSuite
  ├── MultimodalCapabilityProfile ── ProcessingPolicy ── OutputSchema
  └── TenantPolicyProfile ── LLMContextSnapshot ── Audit/Replay
```

## 4. 证据冲突与待核对项

UI-04 明确展示了评分、雷达图、诊断和同龄平均，但这只能登记为原始视觉证据，不能直接作为 Family 当前允许的生产对象或 AI 输出。需要以 PPT/治理文档裁决其在 DEV 中是否仅作为历史素材视觉母版，或是否要改为支持需要/服务偏好确认的非评分页面。

UI-07/UI-18/UI-24/UI-30 显示会员、成长积分、等级、亲子币、邀请权益和订单资产；这些是产品化场景线索，但支付、真实权益、真实会员履约和商业化仍应通过独立交易对象与沙箱适配器实现，不能用静态卡片文字冒充真实交易事实。

UI-06/UI-25/UI-26/UI-28/UI-29 显示社区互动、家长动态、点赞和评论；需要区分家庭私有打卡、租户内社区和公开外发，不能把 UI 里的社会互动文案直接写入公共内容或跨家庭事实。

UI-11 的“成长排行榜”和 UI-04 的“总评/同龄平均”是高风险视觉线索。它们必须进入差距表和待裁决项，不能进入默认家庭事实、AI Context 或跨家庭推荐模型。

## 5. 下一步

下一步应把以上候选对象与 3 份 PPT 和六条闭环逐项对照，给每个对象分配正式的 `object_type`、`base/interface/projection/audit` 层级、主键/外键、租户/家庭范围、状态机、Named Action、事件和页面清单；然后再决定当前迁移中哪些表需要重构，避免从现有代码反向冻结错误的数据结构。
