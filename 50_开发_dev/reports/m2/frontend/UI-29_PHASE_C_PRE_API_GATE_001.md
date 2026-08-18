# UI-29 Phase C Pre-API Gate 001

## Research/Needs summary

UI-29 是家庭查看成长成果、过程证据和复盘叙事的场景。Broad Research 必须覆盖家长、孩子、教师/教练、顾问和运营如何记录过程、理解反馈、核对证据、提出纠错并进行家庭复盘；同时核对 UI-29 原始基线、GrowthPlan、Task、Reflection、Assessment、Report、OutcomeCase 和 Evidence 的来源。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家/榜样教育/波波校长材料最高 E1，仅作为 Hypothesis/Design Input，不能自证效果、诊断、资质或因果关系。

## BA Design summary

候选对象为 `OutcomeCaseProjection`、`EvidenceProjection`、`TaskCompletionProjection`、`ReflectionProjection`、`Perspective`、`ReportSnapshot`、`CorrectionRequest`、`ConsentGrant`、`HumanGateReview` 和 `AuditEvent`。页面可以展示来源、时间、过程记录、用户观点和待确认叙事，但不得把 3/12/36/90 天数字、完成数量、趋势图或文案解释成效果承诺、诊断、因果结论、家庭总分或排名。AI 只能输出解释草稿或问题清单，不能直接写 Outcome、Assessment 或 GrowthProfile。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/growth-outcomes-reference-522x1110.png`，核对顶部导航、成果摘要、时间轴/卡片、证据区、反馈/复盘热点、说明文案、空态、待确认态、权限态、颜色、图像、间距和移动端尺寸。视觉复刻不等于成果事实成立，当前没有运行截图，不伪造 pixel diff。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`OutcomeCaseProjection`、`EvidenceProjection`、`TaskCompletionProjection`、`ReflectionProjection`、`Perspective`、`ReportSnapshot`、`CorrectionRequest`、`ConsentGrant`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

Outcome、Evidence、Task、Reflection 和 Report 只读自带来源与时间的 projection；纠错、补充反思、确认叙事和撤回最多形成 Controlled Draft。正式写入 Outcome、报告发布、通知、分享、导出或外部展示必须经过 Named Action、Consent、Human Gate、Audit 和 Adapter；本阶段不授权。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童成长记录、敏感内容、跨成员可见性、成果分享、报告导出和争议结果需要 Consent purpose、权限与 Human Gate。AI 只能经 Model Gateway 做证据摘要、叙事草稿或不确定性提示，不得将 Perspective/Hypothesis/Recommendation 写成 Fact，也不得直接写核心 ontology。Ontology Adapter 只接受批准动作。

## Backend/API dependency candidates

候选 `OutcomeProjectionService`、`EvidenceLineageService`、`ReflectionProjectionService`、`ReportSnapshotService`、`CorrectionRequestBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`ExportAdapter`、`ShareAdapter`、`NotificationAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. OutcomeCase、Evidence、TaskCompletion、Reflection 和 ReportSnapshot 的来源、版本、时间和纠错机制是什么？
2. 哪些内容是 Fact、Perspective、Hypothesis、Recommendation，如何阻止页面将其混成效果/诊断事实？
3. 3/12/36/90 天数字、趋势和完成量如何避免效果承诺、因果解释、家庭总分或排名？
4. 儿童数据、跨成员可见性、报告导出和分享需要什么 Consent 与 Human Gate？
5. AI 叙事草稿、证据摘要和不确定性提示如何通过 Model Gateway/Adapter 并保持 no-op 与审计？

## Required tests/screenshot diff preparation

准备证据缺失/冲突、来源和时间缺失、Perspective 与 Fact 分离、无 Consent、儿童敏感内容、纠错/撤回、禁止总分/排名/诊断/因果、导出/分享 no-op、Human Gate、Audit，以及成果/空/错误/权限/待确认/HOLD 状态截图与基线 diff。
