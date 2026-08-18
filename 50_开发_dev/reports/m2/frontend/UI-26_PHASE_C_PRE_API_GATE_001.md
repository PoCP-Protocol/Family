# UI-26 Phase C Pre-API Gate 001

## Research/Needs summary

UI-26 是家长创建并发布社区动态的场景。Broad Research 必须覆盖家庭真实分享、家长/孩子/教师/教练/顾问/运营角色、文本与媒体上传、社区规则、儿童安全、可见性、审核、撤回、举报和通知；同时核对 UI-26 原始基线、Family SSOT、Post、Media、Visibility、Moderation 和 Consent 对象。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先 `_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt`；自家/榜样教育/波波校长材料最高 E1，仅作为 Hypothesis/Design Input，不能自证效果、诊断、资质或因果关系。

## BA Design summary

候选对象为 `PostDraft`、`MediaDraft`、`VisibilityPolicy`、`ConsentGrant`、`ModerationCase`、`HumanGateReview`、`PublishAction`、`NotificationIntentDraft` 和 `AuditEvent`。页面允许保存受控草稿，但发布不是普通文本提交；发布动作必须有明确 actor、scope、可见性、媒体来源、审核状态、撤回和审计。Perspective、Hypothesis、Recommendation 不得写成 Fact，AI 自由文本不得直写核心 Ontology。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/publish-dynamic-reference-548x1028.png`，核对导航、输入区、媒体入口、可见性选择、规则提示、发布按钮、审核提示、错误/空/权限态、文案、颜色、间距和移动端尺寸。视觉复刻不代表内容已发布、已审核或已外发，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`PostDraft`、`MediaDraft`、`VisibilityPolicy`、`ConsentGrant`、`ModerationCase`、`HumanGateReview`、`PublishAction`、`AuditEvent`、`CorrelationContext`。

## Read Projection vs Named Action boundary

规则、已保存草稿和审核状态可作为 read projection；保存草稿可形成 Controlled Draft。正式发布、媒体处理、通知、外部分享、公开可见性、删除和撤回必须通过 Named Action、Consent、Moderation/Human Gate、Audit、幂等和 Adapter；本阶段 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童信息、媒体、家庭隐私、公开/群体可见性、疑似伤害或敏感内容需明确 Consent purpose 和 Human Gate。AI 只能经 Model Gateway 生成标签/摘要/风险建议，不得直接写 Post、Media、Visibility 或 Moderation ontology；Ontology Adapter 只接收批准动作，DEV 保证 no-op。

## Backend/API dependency candidates

候选 `PostDraftBoundary`、`MediaAdapter`、`VisibilityPolicy`、`ConsentPolicy`、`ModerationCaseService`、`HumanGateReviewService`、`PublishActionHandler`、`NotificationAdapter`、`ShareAdapter`、`AuditService`、`IdempotencyService`、`ModelGatewayAdapter`、`OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. PostDraft、正式 Post、Media 和 Visibility 的状态机及权威来源是什么？
2. 儿童内容、媒体、家庭隐私和公开发布需要哪些 Consent purpose、撤回和删除规则？
3. 审核、疑似伤害、霸凌、医疗/教育诊断和争议内容如何触发 Human Gate？
4. 发布、通知、分享、媒体处理和外部可见性如何由 Adapter、Audit、幂等和 DEV no-op 保证？
5. AI 标签、摘要或建议如何防止成为事实、自动处罚或核心 ontology 写入？

## Required tests/screenshot diff preparation

准备草稿/发布分离、无 Consent、儿童敏感内容、媒体失败、审核中/拒绝/撤回、重复发布、可见性越权、AI 不写 ontology、通知/分享 no-op、Human Gate、Audit，以及 loading/empty/error/permission/HOLD 状态的 Playwright 截图与基线 diff。
