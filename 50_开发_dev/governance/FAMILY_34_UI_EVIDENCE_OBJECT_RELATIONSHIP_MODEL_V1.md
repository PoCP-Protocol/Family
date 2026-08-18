# Family 34 页 UI 证据对象关系模型 V1

## 1. 建模结论

34 页 UI 不是 34 个独立功能，而是围绕六条闭环共享一组对象：家庭与成员、成长需要与意图、供给目录、服务与活动、家庭计划与任务、商城与客户资产、社区内容、AI/多模态控制面。页面只是这些对象的不同读模型与受控动作入口。

数据关系必须遵循：

> `Tenant → Family → Person/Membership → 家庭事实 → Product Event → Projection → LLM Context`

平台目录对象由 TenantPolicy、准入、版本和生效期控制；家庭事实由 `tenant_id + family_id` 双范围控制；事件是追加记录，不替代事实；投影只读，不反写事实；LLM 只读取最小 Context，不直接写核心对象。

## 2. 对象分层

| 层 | 对象类型 | 典型对象 | 主要责任 |
|---|---|---|---|
| L0 | 参考和值集 | 生命周期、状态、用途、模态、来源、风险、准入编码 | 统一校验，不承载业务事实 |
| L1 | 平台/租户主数据 | Tenant、TenantPolicy、Capability、NeedType、Provider、ServiceOffering、Activity、ProductOffering、CommunitySpace、ModelProfile | 稳定定义、版本、生效期、可见性 |
| L2 | 家庭主数据 | Family、Person、Membership、Relationship、Consent、FamilyProfile | 家庭归属和私有基础档案 |
| L3 | 家庭交易/事实 | NeedIntake、Intent、Decision、Plan、Journey、TaskInstance、Report、Case、Booking、Registration、Order、Publication、Asset | 由家庭或受控动作形成的事实，必须双范围 |
| L4 | 产品事件 | PageViewed、NeedSelected、TaskCompleted、BookingRequested、OrderViewed、PostDrafted、PostWithdrawn、MultimodalProcessed | 追加、幂等、可追踪，不直接等于成长结果 |
| L5 | 读模型/投影 | Home、Assessment、Report、Journey、Service、Catalog、CustomerAsset、Community、Archive、LLMContext | 面向页面和模型的只读汇总 |
| L6 | AI/多模态事实 | MultimodalAsset、Consent、ProcessingRun、DerivedArtifact、LLMAudit、Replay | 记录输入、用途、处理与验证，不写核心事实 |

## 3. 核心关系

### 3.1 租户、家庭和成员

`Tenant` 是最高数据隔离空间，拥有租户策略、目录可见性和租户级审计。`Family` 归属于 Tenant，但家庭是家庭事实的业务所有权根。`Account` 是访问主体，通过 Tenant membership 和 Family membership 获得访问范围；客户端不能提交或覆盖 `tenant_id`、`family_id`、`person_id`。

`Person` 可以是家长或儿童的家庭成员；`Membership` 和 `Relationship` 描述访问与家庭关系；页面显示的孩子资料默认来自只读 FamilyProfile/Person projection，不允许儿童页面直接写自由输入。

```text
Tenant 1 ── N TenantAccountMembership
Tenant 1 ── N TenantFamilyBinding N ── 1 Family
Family 1 ── N Person
Family 1 ── N FamilyMembership
Person 1 ── N Relationship
Family 1 ── N Consent
```

### 3.2 Need、Intent、Plan 与任务

UI-03/UI-08 的“家庭测评/体检”应拆为 NeedIntake 和 Intent，不将 UI-04 里的分数、诊断、雷达图自动写入 GrowthProfile。家庭选择产生 Need/Intent 候选；只有家庭明确 Decision 或 NO_ACTION，才允许进入后续 Plan/Case。Plan 由 JourneyTemplate 实例化，Journey 包含 Stage/WeekPlan，TaskTemplate 产生 TaskInstance。

```text
Family 1 ── N NeedIntake
NeedIntake 1 ── N Intent
Intent 1 ── 0..1 Decision/NO_ACTION
Decision 1 ── 0..1 Plan
Plan 1 ── N Journey
Journey 1 ── N Stage/WeekPlan
WeekPlan 1 ── N TaskInstance
TaskInstance 1 ── N ProductEvent
```

### 3.3 供给目录与服务编排

`ResourceAsset`、`ServiceOffering`、`ProductOffering`、`Activity` 和 `Provider` 属于平台/租户目录；`EvidenceSource`、版权、适用范围、资格、准入、版本和风险字段是可见性前置条件。家庭只能看到当前 TenantPolicy 下的 admitted、有效、资格完整候选。

```text
Capability N ── N NeedType
ResourceAsset N ── N Capability
ResourceAsset N ── N EvidenceSource
Provider 1 ── N ProviderQualification
Provider 1 ── N ServiceOffering
ServiceOffering 1 ── N AvailabilitySlot
Activity 1 ── N ActivitySession/AvailabilitySlot
ProductOffering 1 ── N PricePlan
ProductOffering 1 ── N EntitlementPolicy
```

### 3.4 家庭交易、服务和客户资产

页面点击不是交易事实。商城、预约、活动和社区动作先产生 Command，再由服务端完成 family scope、Consent、版本、资格、状态和幂等检查，成功后写入事实并发出 ProductEvent。客户后台只读取订单、资产、服务记录和会员投影，不直接拼装或改变源数据。

```text
Family 1 ── N Booking ── 1 ServiceOffering ── 1 Provider
Family 1 ── N Registration ── 1 Activity
Family 1 ── N Order ── N OrderLine ── 1 ProductOffering
Order 1 ── N Asset/EntitlementProjection
Family 1 ── N ServiceCase ── N ServiceRecord
Family 1 ── N Invite/GroupMembership/PointLedger (DEV/TEST)
```

### 3.5 社区对象

`CommunitySpace` 是租户或受控家庭空间主数据；`CommunityTemplate` 是允许的内容结构；`PublicationDraft` 是家庭私有草稿；`Publication` 只有在独立发布规则和范围确认后才产生。34 页 UI 里的动态、评论、点赞、关注、热门和粉丝只能登记为视觉/场景证据，不能默认创建跨家庭公开关系或社会图谱。

```text
Tenant 1 ── N CommunitySpace
CommunitySpace 1 ── N CommunityTemplate
Family 1 ── N CommunityMembership
Family 1 ── N PublicationDraft
PublicationDraft 0..1 ── 1 Publication
Publication 1 ── N Reaction/Comment (scope-bound)
```

### 3.6 AI 与多模态

`ModelProfile`、`PromptPolicy`、`ToolDefinition`、`EvalSuite`、`MultimodalCapabilityProfile`、`MultimodalProcessingPolicy`、`MultimodalOutputSchema` 是 AI 控制主数据；它们决定页面、租户和能力边界。`MultimodalAsset`、`MultimodalConsent`、`ProcessingRun`、`DerivedArtifact` 是家庭事实/处理事实；任何派生输出默认只到 `DERIVED_DRAFT_PRIVATE`，不能写 Need、Intent、Decision、Plan、Case、GrowthProfile、Outcome、评分或永久标签。

```text
Tenant 1 ── N TenantPolicyProfile
TenantPolicyProfile ── N ModelProfile/PromptPolicy/ToolDefinition
Family 1 ── N MultimodalAsset
MultimodalAsset 1 ── N MultimodalConsent
MultimodalAsset 1 ── N ProcessingRun
ProcessingRun 1 ── N DerivedArtifact
DerivedArtifact 1 ── N LLMContextSnapshot/LLMAudit
```

## 4. 页面到对象关系

| 页面 | 主读模型 | 主要对象 | 主要事件/动作 |
|---|---|---|---|
| UI-01/UI-02 | FamilyHomeProjection | Family、TaskInstance、ContentCard、ServiceOffering | PageViewed、TaskOpened、NeedEntryOpened |
| UI-03/UI-08 | AssessmentProjection | NeedType、NeedIntake、Intent、Consent | NeedSelected、AssessmentStepSaved、AssessmentExited |
| UI-04 | PrivateReportProjection | SupportReport、Capability、DerivedArtifact | ReportViewed、ExplanationRequested、ReportWithdrawn |
| UI-05/UI-09 | JourneyProjection | Plan、Journey、WeekPlan、TaskInstance | PlanAccepted、TaskStarted、TaskCompleted、NO_ACTION |
| UI-06/UI-10 | ServiceJourneyProjection | ServiceOffering、ServiceCase、ServiceRecord、Reminder | ServiceViewed、CheckinRecorded、AssistantOpened |
| UI-11/UI-12/UI-27 | PrivateAchievementProjection | AchievementRecord、GrowthArtifact | ArtifactViewed、ArtifactDrafted、ArtifactRevoked |
| UI-13–UI-17 | Catalog/CustomerAssetProjection | ProductOffering、PricePlan、Invite、Group、PointLedger、Asset | ProductViewed、InviteCreated、GroupJoined、AssetViewed |
| UI-19–UI-23 | Provider/ActivityProjection | Provider、Qualification、ServiceOffering、Booking、Activity、Registration | ProviderViewed、BookingDrafted、RegistrationRequested |
| UI-25–UI-29 | CommunityProjection | CommunitySpace、Template、Draft、Publication、Reaction | CommunityViewed、DraftCreated、PublicationWithdrawn |
| UI-07/UI-18/UI-24/UI-30–UI-34 | CustomerHome/Archive/ServiceProjection | Membership、Order、Asset、FamilyProfile、ServiceRecord | OrderViewed、ArchiveViewed、ServiceRecordViewed |

## 5. 需要与现有模型修正的地方

UI-04 的“AI成长诊告”、雷达图、总评、同龄平均和核心问题不能未经裁决进入正式 Family 对象；应保留为历史视觉证据，并在实际功能中改为经 Gateway 验证的私有说明草稿或家庭支持需要确认。

UI-11 的“成长排行榜”必须是静态/沙箱投影，不能使用真实跨家庭事件计算；任何成长能量、积分、等级、亲子币和会员权益都必须有明确产品目录、交易事实和资产投影，不能直接放进 Person 或 GrowthProfile。

UI-25–UI-29 的内容和互动必须先绑定 CommunitySpace 与可见范围；不允许页面自由文本直写核心事实或绕过发布范围、审核和撤回机制。

当前迁移中 0025/0026/0030 已分别提供 Tenant、多模态和统一产品事件基础，但仍需把 34 页映射中的 projection、event、command 与对象注册表逐项挂接，才能声称页面与数据结构一致。

## 6. 下一步实施顺序

先统一对象注册与读模型命名，再补 34 页 Command DTO 和事件类型；然后把六条闭环的页面操作全部接入同一事件 envelope 和投影刷新服务；最后再接入真实 LLM 和多模态页面入口。UI-04/UI-11/公开社区动作不作为默认自动化写入路径。
