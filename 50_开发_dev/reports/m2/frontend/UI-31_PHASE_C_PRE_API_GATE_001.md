# UI-31 Phase C Pre-API Gate 001

## Research/Needs summary

UI-31 是家长查看我的服务、咨询和活动进展的场景。Broad Research 必须覆盖家长、孩子、教师/服务者、顾问、运营和客服在服务状态、预约、服务记录、通知、取消、纠错和真人服务方面的真实需求，并核对 UI-31 基线、Family SSOT、Booking、ServiceCase、ServiceRecord、Outcome 和 Consent 来源。Needs Analysis 分别覆盖 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先 `_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt`；自家、榜样教育和波波校长材料最高 E1，仅作 Hypothesis/Design Input，不能自证效果、诊断、资质或因果关系。

## BA Design summary

候选对象为 `BookingProjection`、`ServiceCaseProjection`、`ServiceRecordProjection`、`ProviderProjection`、`OutcomeEvidenceProjection`、`ConsentGrant`、`CorrectionRequest`、`HumanGateReview` 和 `AuditEvent`。页面只展示 family-scoped、有来源和时间的 read projection；服务记录不等于服务效果，真人服务结果不得伪造。Fact、Perspective、Hypothesis、Recommendation、Decision、Action 必须分离。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/my-services-reference-532x1000.png`，核对导航、服务卡片、状态、时间、服务者、进入详情/反馈热点、空态、错误态、权限态、文案、颜色、间距和移动端尺寸。视觉复刻不等于真人服务已完成，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`BookingProjection`、`ServiceCaseProjection`、`ServiceRecordProjection`、`ProviderProjection`、`OutcomeEvidenceProjection`、`ConsentGrant`、`CorrectionRequest`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

服务和记录只读 projection；反馈、纠错、取消、改期或重新联系最多先形成 Controlled Draft。正式状态变更、通知、预约、支付、退款、真人联系和外部服务必须通过 Named Action、Consent、Human Gate、Audit、幂等和 Ontology Adapter，全部 External Effect HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童服务记录、敏感内容、家庭成员可见范围、真人联系和争议记录需要 Consent 与 Human Gate。AI 只能经 Model Gateway 生成摘要或问题草稿，不得自由文本直写 ServiceCase、ServiceRecord、Outcome 或 Consent ontology；Adapter 只接收批准动作，DEV no-op。

## Backend/API dependency candidates

候选 `MyServicesProjectionService`、`BookingProjectionService`、`ServiceCaseProjectionService`、`ServiceRecordProjectionService`、`CorrectionRequestBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`NotificationAdapter`、`CalendarVideoAdapter`、`PaymentAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Booking、ServiceCase、ServiceRecord 和 OutcomeEvidence 的权威来源、状态机和更新时间是什么？
2. 服务过程记录如何与效果、诊断和因果结论分离？
3. 儿童记录、家庭成员可见性和真人联系需要哪些 Consent/Human Gate？
4. 取消、改期、纠错、通知、支付和客服如何保证 Named Action、Audit、幂等和 DEV no-op？

## Required tests/screenshot diff preparation

准备 scope 隔离、来源缺失、状态过期、无 Consent、儿童敏感信息、纠错/撤回、Projection 与 Controlled Draft 分离、External Effect no-op、Human Gate、Audit，以及 loading/empty/error/permission/HOLD 截图与基线 diff。
