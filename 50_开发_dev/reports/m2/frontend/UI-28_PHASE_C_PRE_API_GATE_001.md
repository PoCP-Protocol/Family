# UI-28 Phase C Pre-API Gate 001

## Research/Needs summary

UI-28 是家长查看自己参与或管理的社区内容、私密动态和互动记录的场景。Broad Research 必须覆盖家长、孩子、教师/教练、顾问、运营和审核者在私密可见性、家庭成员范围、撤回、删除、评论、举报、儿童隐私和内容留存方面的真实需求；同时核对 UI-28 原始基线、Community、Post、Comment、Visibility、Consent 和 Moderation 对象。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家/榜样教育/波波校长材料最高 E1，仅作为 Hypothesis/Design Input。

## BA Design summary

候选对象为 `PrivateCommunityProjection`、`PostProjection`、`CommentProjection`、`VisibilityPolicy`、`ConsentGrant`、`DeletionRequest`、`WithdrawalRequest`、`ModerationCase`、`HumanGateReview` 和 `AuditEvent`。页面只展示当前家庭/用户有权看到的 projection；删除、撤回、可见性修改、评论和举报均需保持动作边界。私密内容、互动数量和内容标签不能成为家庭总分、排名或效果事实。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/my-community-reference-560x1030.png`，核对导航、社区分组、我的动态/互动列表、私密标签、内容卡片、撤回/删除/进入详情热点、规则提示、空态、审核态、权限态、文案、颜色、间距和移动端尺寸。视觉复刻不等于用户拥有实际删除权、内容已撤回或身份已验证，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`PrivateCommunityProjection`、`PostProjection`、`CommentProjection`、`VisibilityPolicy`、`ConsentGrant`、`DeletionRequest`、`WithdrawalRequest`、`ModerationCase`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

我的社区内容、状态和互动历史只读自 private scoped projection。撤回、删除、修改可见性、评论、举报、屏蔽和分享必须通过 Named Action、Consent、权限策略、Human Gate、Audit 和幂等；外发、通知和实际删除属于 External Effect，DEV 只允许 no-op/stub。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

家庭成员、儿童信息、媒体和私密社区内容需要明确 Consent purpose、可见范围、撤回和删除规则。疑似伤害、霸凌、敏感内容、争议归属和跨家庭可见性必须 Human Gate。AI 只能经 Model Gateway 生成分类建议或风险提示，不得直接写 Post、Visibility、Deletion、Moderation 或 Consent ontology；Ontology Adapter 只接收批准动作。

## Backend/API dependency candidates

候选 `PrivateCommunityProjectionService`、`VisibilityPolicy`、`ConsentPolicy`、`WithdrawalRequestBoundary`、`DeletionRequestBoundary`、`ModerationCaseService`、`HumanGateReviewService`、`NotificationAdapter`、`ShareAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. “我的社区”范围如何定义：作者、家庭成员、被授权成员、私密群组还是历史参与者？
2. 私密/公开/群组可见性、撤回、删除、保留和备份的权威状态与生命周期是什么？
3. 儿童信息、媒体和跨家庭可见性需要什么 Consent purpose、撤回和 Human Gate？
4. 删除、撤回、屏蔽、举报、通知和分享哪些步骤需要 Adapter、幂等和审计？
5. AI 分类或风险建议如何不越权修改可见性、删除内容或直接写核心 ontology？

## Required tests/screenshot diff preparation

准备私密/公开/群组 scope、成员越权、Consent 缺失/撤回、儿童敏感内容、删除/撤回幂等、审核中/拒绝、通知/分享 no-op、AI 不写 ontology、Human Gate、Audit，以及列表/空/错误/权限/HOLD 状态截图与基线 diff。
