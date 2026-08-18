# UI-12 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-12 是成长海报/成果表达页面。本文件只做 Research、Needs Analysis、BA、Visual Fidelity 和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation 或动态代码开发。

## Research/Needs Summary

研究家庭如何整理成长过程中的可见成果、如何保护儿童隐私、如何区分 Evidence Story 与效果承诺；角色包括家长、孩子、老师/教练、顾问、运营和 AI；baseline 为 `apps/web/public/bangyang-reference/ui18/growth-06-growth-poster.png`。候选 SSOT 包括 FamilyContext、Person、Evidence、Reflection、OutcomeStory、MediaAsset、Consent、HumanGate 和 ShareAdapter。需求区分 User/Business/Operational/Compliance/Data/AI Need；海报是表达/草稿，不自动证明成长效果。

30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家、榜样教育和波波校长材料最高 E1，仅为 Hypothesis/Design Input，不能自证成果、资质、效果或因果。Recommendation != Decision != Action。

## BA Design Summary

页面目标是展示家庭选择的 Evidence/Reflection 片段、生成可编辑海报草稿，并提供隐私和分享前检查。候选对象包括 FamilyContext、Person、Evidence、Reflection、OutcomeStory（非因果事实）、MediaAsset、PosterDraft、ConsentGrant、HumanGateReview、ShareRequest。首轮只允许 Read Projection/Controlled Draft；公开分享、下载外发和通知均为 External Effect HOLD。

## Visual Fidelity Brief Summary

需对标 UI-12 原图中的海报画布、标题、照片/插图区域、文字层级、按钮、保存/分享入口、隐私提示、空态和移动端布局。当前没有开发后运行截图，不伪造视觉差异。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Person`、`Evidence`、`Reflection`、`OutcomeStory`、`MediaAsset`、`PosterDraft`、`ConsentGrant`、`HumanGateReview`、`ShareRequest`。Evidence 必须有来源，OutcomeStory 不能被自动解释为因果效果。

## Read Projection vs Named Action Boundary

海报读取和草稿预览是 Read Projection；编辑/保存 PosterDraft 可是 Controlled Draft；确认生成、下载、公开分享、发送通知和外发必须是受控 Named Action，并经过 Consent/Human Gate/Adapter。首轮不得创建外发 Share、Notification 或真实 Media publication。

## Consent/Human Gate/Model Gateway/Ontology Adapter Boundary

儿童照片、姓名、语音、家庭故事需要单独 Consent purpose、成员可见性和撤回策略；公开分享、敏感内容和真人审核需 Human Gate。AI 只经 Model Gateway 做排版建议、摘要或文案草稿，不直写 Evidence/Outcome；Ontology Adapter 只接收批准动作。Media/Share/Notification Adapter 全部 HOLD。

## Backend/API Dependency Candidates

候选：`EvidenceStoryProjectionService`、`PosterDraftService`、`MediaAssetPolicy`、`ConsentPolicy`、`Moderation/HumanGateReviewService`、`ShareAdapter`、`NotificationAdapter`、`AuditService`、ModelGatewayAdapter、OntologyAdapter。仅列候选，不定义 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 哪些 Evidence/Reflection 可进入海报，来源和版本如何证明？
2. OutcomeStory 的文案如何避免效果、因果、诊断或资质承诺？
3. 儿童图片/姓名/故事的 Consent purpose、撤回和可见性是什么？
4. 生成/下载/分享/通知是否分成不同 Named Action？
5. 内容审核、敏感内容和公开分享是否必须 Human Gate？
6. AI 文案草稿的证据引用、低置信度和拒答如何处理？
7. 视觉原图中哪些分享按钮只能作为 HOLD 的静态入口？

## Required Tests/Screenshot Diff Preparation

需准备 Evidence provenance、儿童媒体 Consent、敏感内容 Human Gate、草稿版本/撤回、无外发副作用、Share/Notification adapter no-op、Model Gateway schema rejection、DOM text、Playwright mobile/desktop 和静态/空/权限/审核待定态视觉准备。当前无运行截图。

## Status

`HOLD_EXTERNAL_EFFECT`；本文件不授权 API Contract 或代码开发。
