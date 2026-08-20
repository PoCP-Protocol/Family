# UI-27 Phase C Pre-API Gate 001

## Research/Needs summary

UI-27 是家庭查看社区动态详情、证据附件和受控互动的场景。Broad Research 必须覆盖家长、孩子、教师/教练、顾问、运营和审核者在阅读、评论、点赞、举报、证据查看、隐私和儿童风险方面的真实需求；同时核对 UI-27 原始基线、Post、Evidence、Comment、Reaction、Visibility、Moderation 和 Consent。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家/榜样教育/波波校长材料最高 E1，仅作为 Hypothesis/Design Input。

## BA Design summary

候选对象为 `PostProjection`、`EvidenceProjection`、`CommentProjection`、`ReactionProjection`、`VisibilityPolicy`、`ConsentGrant`、`ModerationCase`、`ReportDraft`、`HumanGateReview` 和 `AuditEvent`。详情页首先是 scoped read projection；互动动作必须与内容展示分开，不得把点赞、评论数、热度、标签或证据叙述升级为效果事实、排名或家庭总分。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/dynamic-detail-reference-524x1022.png`，核对返回导航、作者与时间、正文、媒体/证据区、评论区、点赞/举报/分享热点、规则提示、空态、审核态、权限态、文案、颜色、间距和移动端尺寸。视觉复刻不等于内容真实、证据成立或互动获授权，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`PostProjection`、`EvidenceProjection`、`CommentProjection`、`ReactionProjection`、`VisibilityPolicy`、`ConsentGrant`、`ModerationCase`、`ReportDraft`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

Post、Evidence、Comment、Reaction 和审核状态只读 projection。评论、点赞、举报、删除、撤回、屏蔽和分享必须通过 Named Action、scope、Consent、Moderation/Human Gate、Audit 和幂等；外部分享、通知和内容处置属于 External Effect，DEV 只允许 no-op/stub。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童信息、敏感媒体、疑似伤害、医疗/教育判断、私密内容和外发分享需明确 Consent 与 Human Gate。AI 只能经 Model Gateway 生成摘要、风险提示或分类建议，不得直接写 Comment、Reaction、ModerationCase、Visibility 或 Evidence ontology；Ontology Adapter 只接受批准动作。

## Backend/API dependency candidates

候选 `PostDetailProjectionService`、`EvidenceProjectionService`、`CommentProjectionService`、`ReactionProjectionService`、`VisibilityPolicy`、`ConsentPolicy`、`ReportDraftBoundary`、`ModerationCaseService`、`HumanGateReviewService`、`NotificationAdapter`、`ShareAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Post/Evidence/Comment/Reaction 的来源、版本、作者可见性和内容状态如何验证？
2. 评论、点赞、举报、删除、撤回、屏蔽和分享分别对应哪些 Named Action 与审计事件？
3. 儿童内容、私密内容和外部分享需要什么 Consent purpose、Human Gate 和撤回机制？
4. 证据叙述如何保持来源与事实边界，不被解释为诊断、效果或因果结论？
5. AI 风险建议、内容标签和摘要如何保持 Model Gateway/Adapter 边界并禁止自动处置？

## Required tests/screenshot diff preparation

准备内容来源缺失、权限越界、评论/点赞/举报幂等、儿童敏感内容、审核中/拒绝/撤回、Evidence 不足、AI 不写 ontology、分享/通知 no-op、Human Gate、Audit，以及详情/空/错误/权限/HOLD 状态截图与基线 diff。
