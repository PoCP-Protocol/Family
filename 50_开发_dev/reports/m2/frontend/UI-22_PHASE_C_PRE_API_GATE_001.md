# UI-22 Phase C Pre-API Gate 001

## Research/Needs summary

UI-22 是家庭浏览沙龙/活动列表的场景。Broad Research 必须覆盖家长、孩子、教师/教练、顾问、运营和活动组织者如何发现活动、判断适配性、查看时间地点/线上方式、理解报名条件以及处理儿童参与风险；同时核对 UI-22 原始基线、Family SSOT、Event/Activity 数据来源、日历与视频适配边界。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先使用 `_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt` 作主证据；自家材料、榜样教育、波波校长材料最高 E1，仅可作为 Hypothesis/Design Input。

## BA Design summary

候选对象为 `Activity`、`EventSchedule`、`AudienceRule`、`ActivityListProjection`、`RegistrationDraft`、`ConsentGrant`、`HumanGateReview`、`CalendarIntentDraft`、`VideoSessionDraft` 和 `AuditEvent`。列表只展示有来源的活动标题、时间、适用人群、状态和摘要；不得把推荐、热度、排序或“适合孩子”解释成效果、资质或优劣事实。报名意向、日历意向和视频意向必须与已成立的报名和外部会议区分。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/salon-list-reference-466x1008.png`，逐项核对导航、标题区、活动卡片、日期/标签、活动状态、图片、主次按钮、空态、筛选/搜索热点、文案、颜色、间距和移动端尺寸。视觉复刻不等于活动真实存在或可报名，当前没有运行后截图，不伪造 pixel diff。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

活动列表、活动状态、适用范围和时间只能通过 family-scoped `ActivityListProjection` 读取。点击查看详情或保存本地草稿不等于报名；正式报名、占位、支付、发送通知、写入日历、创建视频会议和分享均属于 External Effect，必须由 Named Action、Consent、Audit、Human Gate 与 Adapter 控制，本阶段 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童活动、家庭成员参与、录制/直播、群体互动和外部通知需要明确 Consent purpose 与参与范围。AI 只能经 Model Gateway 对活动说明做受控摘要或生成待确认问题，不得直接创建 Activity、Registration、Calendar 或 Video ontology。Ontology Adapter 只能接收批准的 Named Action；DEV 不连接真实报名、日历、视频、支付或通知系统。

## Backend/API dependency candidates

候选能力包括 `ActivityListProjectionService`、`ActivityDetailProjectionService`、`RegistrationDraftBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`CalendarIntentBoundary`、`VideoSessionBoundary`、`NotificationAdapter`、`PaymentAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 活动内容、时间、组织者、适用人群和活动状态的权威来源与版本是什么？
2. `RegistrationDraft` 与正式报名、名额占用、支付和通知的状态边界是什么？
3. 儿童参与、直播/录制、群体互动和家庭成员可见范围需要哪些 Consent 与 Human Gate？
4. 活动筛选、排序、热度或“推荐”是否会形成排名或不当适配结论？
5. 日历、视频、通知、分享和支付 Adapter 如何实现 DEV no-op、幂等、审计与撤回？

## Required tests/screenshot diff preparation

准备活动来源缺失、时间过期、报名关闭、无 Consent、儿童参与、直播录制、重复点击、RegistrationDraft 分离、禁止总分/排名/无证据推荐、External Effect no-op、Human Gate、Audit，以及列表/空态/错误/权限/HOLD 状态的 Playwright 截图与基线 diff 流程。
