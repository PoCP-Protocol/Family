# UI-24 Phase C Pre-API Gate 001

## Research/Needs summary

UI-24 是家长查看本人家庭范围内咨询、活动和服务进展的场景。Broad Research 必须覆盖家长、孩子、教师/服务者、顾问和运营如何查看预约状态、活动参与状态、待办事项、服务记录、取消/改期与后续反馈；同时核对 UI-24 原始基线、Family SSOT、Booking、ServiceCase、ServiceRecord 的来源和权限边界。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先使用 `_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt` 作主证据；自家材料、榜样教育、波波校长材料最高 E1，只能作为 Hypothesis/Design Input，不能自证效果、诊断、资质或因果关系。

## BA Design summary

候选对象为 `BookingProjection`、`RegistrationProjection`、`ServiceCaseProjection`、`ServiceRecordProjection`、`OutcomeEvidenceProjection`、`ConsentGrant`、`HumanGateReview`、`CorrectionRequest` 和 `AuditEvent`。页面只显示家庭范围内、具有来源和状态时间的投影；不能把服务记录、用户反馈或展示性指标升级为效果事实、诊断、因果结论或真人服务已完成。必须严格区分 Fact、Perspective、Hypothesis、Recommendation、Decision、Action，以及 Read Projection、Controlled Draft、Named Action、External Effect。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/service-mine-reference-472x1018.png`，逐项核对页面导航、咨询/活动分类、卡片层级、状态标签、时间、服务者信息、进入详情/反馈热点、空态、错误态、权限态、文案、颜色、间距和移动端尺寸。视觉复刻不等于服务已交付或结果已验证，当前没有运行后截图，不伪造 pixel diff。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

Booking、Registration、ServiceCase、ServiceRecord 和 OutcomeEvidence 只能作为 family-scoped read projection 展示。取消、改期、补充反馈、纠错、重新联系和服务确认最多先形成 Controlled Draft；任何正式状态变更、真人联系、通知、支付、退款或外部预约都必须通过 Named Action、Consent、Audit、Human Gate 与 Adapter，本阶段 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

家庭成员可见范围、儿童服务记录、敏感内容、反馈发布和真人服务联系需要明确 Consent purpose、授权主体、撤回和审计。AI 只能经 Model Gateway 对已有记录生成摘要、待确认问题或草稿，不得自由文本直写 Booking、ServiceCase、ServiceRecord、Outcome 或 Consent ontology。Ontology Adapter 只接受批准的 Named Action，DEV 保证 no-op。

## Backend/API dependency candidates

候选能力包括 `FamilyServiceMineProjectionService`、`BookingProjectionService`、`RegistrationProjectionService`、`ServiceCaseProjectionService`、`ServiceRecordProjectionService`、`CorrectionRequestBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`NotificationAdapter`、`CalendarVideoAdapter`、`PaymentAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Booking、Registration、ServiceCase、ServiceRecord 和 OutcomeEvidence 的权威来源、状态机和更新时间是什么？
2. 如何区分预约/报名草稿、已确认服务、服务记录和未经验证的结果叙述？
3. 家庭成员、儿童和服务者之间的可见范围、Consent purpose、撤回和纠错流程是什么？
4. 取消、改期、反馈、纠错、重新联系、通知、支付和退款哪些动作可在 DEV no-op，哪些必须 Human Gate？
5. 页面是否存在“已解决”“有效”“改善”等效果性文案；若有，如何收紧为来源明确的记录或用户观点？

## Required tests/screenshot diff preparation

准备家庭范围隔离、记录来源缺失、状态过期、服务未完成、结果证据不足、无 Consent、儿童敏感信息、纠错与撤回、重复操作、Projection 与 Controlled Draft 分离、External Effect no-op、Human Gate、Audit、加载/空/错误/权限/HOLD 状态，以及移动端 Playwright 截图与基线 diff 流程。
