# UI-23 Phase C Pre-API Gate 001

## Research/Needs summary

UI-23 是家庭查看单个沙龙/活动详情并评估是否参与的场景。Broad Research 必须覆盖活动组织者、家长、孩子、教师/教练、顾问和运营的真实流程，包括活动说明、时间地点、参加条件、名额、直播/录制、取消规则和儿童风险；同时核对 UI-23 原始基线、Family SSOT、Event/Activity 对象以及报名、日历、视频和通知边界。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先使用 `_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt` 作主证据；自家材料、榜样教育、波波校长材料最高 E1，仅可作为 Hypothesis/Design Input。

## BA Design summary

候选对象为 `Activity`、`EventSchedule`、`OrganizerProfile`、`AudienceRule`、`ActivityDetailProjection`、`RegistrationDraft`、`ConsentGrant`、`HumanGateReview`、`CalendarIntentDraft`、`VideoSessionDraft` 和 `AuditEvent`。详情页用于展示可追溯的活动内容与状态，不把描述性标签、热度、推荐或报名按钮解释成效果保证、资质事实或参加结果。页面中的报名意向必须保持 Controlled Draft 与正式报名的边界。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/activity-detail-reference-470x1016.png`，逐项核对返回/导航、活动主图、标题、组织者、时间地点、活动说明、适用人群、名额/状态、底部主按钮、提示文案、空态、权限态、颜色、间距和移动端尺寸。视觉复刻不等于报名或活动成立，当前没有运行后截图，不伪造 pixel diff。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

活动、组织者、时间表、适用范围和状态只读自 `ActivityDetailProjection`；按钮最多创建 `RegistrationDraft`、`CalendarIntentDraft` 或 `VideoSessionDraft`。确认报名、占用名额、支付、通知、写入日历、生成视频会议、录制和分享均为 External Effect，必须经过 Named Action、Consent、Audit、Human Gate 与 Adapter；本阶段 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童参与、直播/录制、群体互动、外部分享、通知和真人组织者联系均需明确 Consent purpose、可见范围与撤回机制。AI 只能经 Model Gateway 生成活动摘要、问题草稿或风险提示，不得直接写 Activity、Registration、Calendar 或 Video 核心 ontology。Ontology Adapter 只接收批准动作，DEV 必须 no-op。

## Backend/API dependency candidates

候选能力包括 `ActivityDetailProjectionService`、`RegistrationDraftBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`CalendarIntentBoundary`、`VideoSessionBoundary`、`NotificationAdapter`、`PaymentAdapter`、`ShareAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 活动详情的内容、组织者、时间、地点、状态和名额由哪个权威 projection 提供？
2. 报名草稿、正式报名、名额占用、支付和取消/退款的边界如何定义？
3. 儿童参与、直播录制、群体互动、视频和分享各自需要什么 Consent 与 Human Gate？
4. 通知、日历、视频、支付和分享的 Adapter 是否具有明确 no-op、幂等、审计和撤回策略？
5. “推荐参加”“适合”“热门”等文案如何避免无证据效果承诺、排名和优劣判断？

## Required tests/screenshot diff preparation

准备详情来源缺失、活动已结束、报名关闭、名额未知、无 Consent、儿童参与、录制/直播、重复点击、RegistrationDraft 与正式报名分离、External Effect no-op、Human Gate、Audit、错误/空/权限/HOLD 状态，以及移动端 Playwright 截图与基线 diff 流程。
