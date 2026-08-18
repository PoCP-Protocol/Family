# UI-25 Phase C Pre-API Gate 001

## Research/Needs summary

UI-25 是家长浏览家庭社区内容、理解社区规则并进入受控互动的场景。Broad Research 必须覆盖家长、孩子、教师/教练、顾问、运营和审核人员在发帖、评论、举报、隐私保护、儿童安全和社区治理中的真实需求；同时核对 UI-25 原始基线、Community/Thread/Post/Comment 对象、可见性、Consent、Moderation 和 Human Gate 边界。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先使用 `_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt` 作主证据；自家材料、榜样教育、波波校长材料最高 E1，只能作为 Hypothesis/Design Input，不能自证效果、诊断、资质或因果关系。

## BA Design summary

候选对象为 `Community`、`CommunityThread`、`PostProjection`、`CommentProjection`、`VisibilityPolicy`、`ConsentGrant`、`ModerationCase`、`HumanGateReview`、`ReportDraft`、`ReactionDraft` 和 `AuditEvent`。页面首先作为 family/community-scoped read projection 展示有来源的内容、时间、作者可见身份和治理提示；发帖、评论、点赞、举报、分享、删除和屏蔽必须分别建模，不得把社区热度、点赞、回复量或内容标签升级为家庭总分、排名、效果事实或安全结论。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/parent-community-reference-552x1034.png`，逐项核对顶部导航、社区标题、内容列表、作者/时间、图片或媒体占位、互动按钮、规则提示、发布入口、空态、审核态、权限态、风险提示、文案、颜色、间距和移动端尺寸。视觉复刻不等于社区内容已审核、作者身份已验证或互动已获授权，当前没有运行后截图，不伪造 pixel diff。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

Community、Thread、Post、Comment 和治理状态只读自 scoped projection；发帖、评论、反应、举报、删除、撤回、屏蔽和分享必须通过 Named Action，并经过权限、Consent、Moderation/Human Gate、Audit 和幂等控制。包含儿童敏感信息、疑似伤害、医疗/教育诊断、外部分享或高风险内容时必须 REVIEW_REQUIRED/HUMAN_GATE_REQUIRED；DEV 不执行真实通知、外发、分享或自动处罚。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

家庭成员范围、儿童信息、媒体发布、社区可见性和外部分享需要明确 Consent purpose、可见范围、撤回和删除规则。AI 只能经 Model Gateway 进行内容分类建议、摘要、风险提示或受控草稿，不能直接写 Post、Comment、ModerationCase、VisibilityPolicy 或核心 ontology；所有决策和处置必须由 Named Action 与人工治理流程承载。Ontology Adapter 仅接收获批动作，DEV 保证 no-op。

## Backend/API dependency candidates

候选能力包括 `CommunityProjectionService`、`ThreadProjectionService`、`VisibilityPolicy`、`ConsentPolicy`、`PostDraftBoundary`、`CommentDraftBoundary`、`ReportDraftBoundary`、`ModerationCaseService`、`HumanGateReviewService`、`AuditService`、`NotificationAdapter`、`ShareAdapter`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Community、Thread、Post、Comment 的权威来源、可见性范围、作者身份和内容状态如何定义？
2. 发帖、评论、反应、举报、删除、撤回、屏蔽和分享的 Named Action、幂等和审计边界是什么？
3. 儿童信息、媒体、家庭隐私和外部分享各自需要什么 Consent purpose 与撤回机制？
4. AI 风险分类、敏感内容提示和自动审核建议如何保持 Model Gateway/Adapter 边界，不直接处置用户内容？
5. 举报、疑似伤害、霸凌、医疗/教育诊断和争议内容的 Human Gate、升级、通知和证据保留规则是什么？

## Required tests/screenshot diff preparation

准备 community scope、私密/公开可见性、无 Consent、儿童敏感内容、媒体缺失、审核中、拒绝/撤回、举报幂等、AI 建议不写 ontology、禁止排名/总分、External Effect no-op、Human Gate、Audit，以及列表/空/错误/权限/审核/HOLD 状态的移动端 Playwright 截图与基线 diff 流程。
