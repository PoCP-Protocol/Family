# UI-06 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-06 是 UI-05 90 天计划之后的陪跑服务/社群承接页。本文件只做 Research、Needs Analysis、BA、视觉和架构门禁准备，不定义 API Contract，不修改 Web/API/DB 代码。统一门禁为：Broad Research → Needs Analysis → BA Design → Visual Baseline → Architect Review → Blocking Questions → API Contract → FE/BE Implementation → Consistency Tests → Screenshot Diff → Fix Loop。

## Research/Needs Summary

研究范围包括家庭教育中的持续陪伴、家长查看过程记录和安全暂停场景；家长、孩子、老师/教练、顾问、运营和 AI 的职责边界；UI-06 原图与 34 UI baseline；Family SSOT、ServiceJourneyProjection、ServiceOffering、TaskProgress、Community/LiveSession；Consent、Human Gate、Model Gateway、Ontology Adapter、审计和前后端一致性。家庭陪伴有效、完成率代表成长效果、真人服务已承诺等只能作为待验证假设。

Needs Analysis 必须拆分 User Need（查看家庭私有陪跑过程和下一步）、Business Need（承接成长服务而非制造效果承诺）、Operational Need（投影来源、版本、可见范围、暂停/回顾）、Compliance Need（儿童数据、Consent、真人服务和外发边界）、Data Need（Family/Person/Journey/Task/Service/Reflection/Evidence 来源）、AI Need（仅解释、提醒草稿和安全停止，经 Model Gateway）。Fact、Perspective、Hypothesis、Recommendation、Decision、Action 不得混用。

旧 UI-06 草稿仅作为研究输入和设计线索；30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家、榜样教育和波波校长材料最高 E1，只能作 Hypothesis/Design Input。

## BA Design Summary

页面目标是展示受控的服务旅程、家庭私有过程记录、顾问/班主任/专家入口和成长打卡入口。候选对象包括 FamilyContext、Person、ServiceJourneyProjection、ServiceOffering、Provider、TaskProgressProjection、Reflection、CommunityThread、LiveSession、ServiceRecord、Evidence、ConsentGrant、HumanGateReview。首轮只允许 Read Projection 或 Controlled Draft；不能把服务卡当成真人承诺、过程指标当成 Outcome、社群内容当成公开发布。

## Visual Fidelity Brief Summary

Visual baseline：`apps/web/public/bangyang-reference/delivery-community-reference-458x1128.png`。必须复刻 Header、2×2 服务卡、完成度卡、tab、动态列表、悬浮“＋打卡”、底部导航和社群选中态；低清文案不得猜测。当前没有开发后运行截图，不伪造截图或差异结果。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Person`、`FamilyMembership`、`ConsentGrant`、`ServiceJourneyProjection`、`ServiceOffering`、`Provider`、`TaskProgressProjection`、`Reflection`、`CommunityThread`、`LiveSession`、`ServiceRecord`、`Evidence`、`HumanGateReview`。Projection 不是执行真相；过程记录不等于 Outcome。

## Read Projection vs Named Action Boundary

页面读取服务旅程、任务过程、私有社群和活动摘要时使用 Read Projection。`＋打卡`最多形成家庭私有 Controlled Draft；继续、暂停、调整、撤回只能是候选 Named Action，必须显式确认、actor/family/subject scope、Consent、审计、幂等和 correlation_id。不得创建真实 Task、ServiceCase、CommunityPost、Outcome、Notification、Booking 或外部 effect。

## Consent / Human Gate / Model Gateway / Ontology Adapter Boundary

儿童资料、家庭文本和私有动态需要 guardian scope 与对应 Consent；缺失或撤回时 fail-closed。真人顾问、班主任、专家、直播和外发分享需要 Human Gate/External Effect HOLD。AI 提醒、总结和解释必须经 Model Gateway、schema validation 和 policy；不能自由文本直写核心 Ontology。核心对象经 Ontology Adapter 受控写入。

## Backend/API Dependency Candidates

仅列候选：`ServiceJourneyProjectionService`、`PrivateCommunityProjectionService`、`TaskProgressProjectionService`、`CheckinDraftBoundary`、Consent/FamilyAuthorization policy、AuditService、ModelGatewayAdapter、OntologyAdapter、Service/Live/Notification adapters。此处不批准 endpoint、DTO 或 migration。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. UI-05 计划与 UI-06 服务旅程的正式关系及 provenance 如何定义？
2. `＋打卡`是 Controlled Draft 还是 Named Action candidate，谁可确认？
3. 完成度、7/9、78%等过程投影如何禁止评分/效果化？
4. ServiceOffering/Provider 文案如何避免真人承诺和资质自证？
5. 私有动态、儿童资料和家长交流的 Consent purpose 与可见性是什么？
6. AI 提醒是否只允许解释/草稿，如何禁止自动通知？
7. 直播、预约、视频、日历、公开发布的 adapter/Human Gate 由谁批准？
8. Pause/Amend/Revoke 的状态、审计和幂等如何定义？

## Required Tests/Screenshot Diff Preparation

后续需准备 family/tenant/subject scope、Consent 缺失/撤回、过期 projection、provenance 缺失、儿童越权、`＋打卡`不创建核心对象、Model Gateway schema rejection、API/Web contract、Playwright desktop/mobile、DOM text coverage、static/loading/empty/permission/review/checkin-draft/pending 状态截图对标。当前无运行截图，不进行差异声明。

## Status

`RESEARCH_REVIEW_REQUIRED`；本文件不授权 API Contract 或代码开发。
