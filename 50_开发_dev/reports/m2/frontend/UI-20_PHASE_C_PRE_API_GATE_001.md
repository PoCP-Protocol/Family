# UI-20 Phase C Pre-API Gate 001

## Research/Needs summary

UI-20 为教师/服务者详情场景。研究家庭如何理解服务者的服务范围、资质来源、可用时间和适配信息，避免评分、标签和推荐被解释成优劣事实。角色包括家长、孩子、教师/服务者、顾问、运营和系统/AI。30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## BA Design summary

候选对象为 ServiceProvider、Person、Offering、QualificationEvidence、AvailabilitySlot、ProviderProfileProjection、ServiceCaseDraft、BookingDraft、ConsentGrant、HumanGateReview、AuditEvent。详情页只展示有来源的供给资料、服务范围、可用性摘要和过程信息；评分、标签和最佳/排名判断不得升级为事实。

## Visual Fidelity Brief summary

对标 UI-20 原始教师详情基线的头像/图像、标题、资质区、标签、服务说明、评分/评价区域、时间摘要、咨询/预约入口、空态/权限态和移动端间距。资质和评价低清/缺证据部分必须保持 `NEEDS_CONFIRMATION`，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

Provider/Offering/Qualification/Availability 只读 projection；发起咨询或预约最多形成 BookingDraft/ServiceCaseDraft；联系教师、占座、通知、视频、支付、评价提交和真人服务必须经过 Named Action、Consent、Audit、Human Gate 与生产同构 Adapter，External Effect HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

服务者详情读取需要 tenant/family scope 和 SERVICE consent；儿童敏感需求、资质争议、评价发布、真人联系和预约需 Human Gate。AI 只能经 Model Gateway 总结已有证据或生成问题草稿，不写 Provider/Qualification/Booking/Review；Ontology Adapter 只接收批准动作。

## Backend/API dependency candidates

候选 `ProviderDetailProjectionService`、QualificationEvidenceProjection、AvailabilityReadModel、BookingDraftBoundary、ServiceCaseDraftBoundary、ConsentPolicy、HumanGateReviewService、Notification/Calendar/Video/Payment adapters、AuditService、ModelGatewayAdapter、OntologyAdapter；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Provider 资质、评价、标签和可预约时间的来源、版本及证据等级是什么？
2. 评分是否允许展示；如何禁止“最佳/优劣/排名”暗示？
3. 预约/咨询/联系的 BookingDraft 与正式 Booking 如何分层？
4. 儿童需求、家庭 Consent 和真人服务 Human Gate 如何绑定？
5. 评价提交、通知、日历、视频和支付 Adapter 如何保证 no-op/审计/撤回？

## Required tests/screenshot diff preparation

准备 provider scope、资质证据缺失、评价/标签来源、无 SERVICE consent、儿童敏感内容、BookingDraft 幂等、预约/通知/视频/支付无外部 effect、Human Gate、Audit、API/Web contract、Playwright mobile/desktop 和详情/空/权限/HOLD 截图准备。
