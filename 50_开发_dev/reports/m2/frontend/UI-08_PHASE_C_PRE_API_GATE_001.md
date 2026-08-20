# UI-08 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-08 是成长报告/报告查看页。本文件只做研究、需求、BA、视觉和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation 或动态代码开发。

## Research/Needs Summary

研究家庭教育场景中家长查看成长记录、证据和下一步解释的需要；家长、孩子、老师/教练、顾问和 AI 的角色；UI-08 原图 `apps/web/public/bangyang-reference/ui18/growth-02-ai-report.png`；Assessment、ReportSnapshot、Evidence、Perspective、Hypothesis、Recommendation、Consent、HumanGateReview 的 SSOT；Model Gateway、Ontology Adapter、审计、测试和前后端一致性。报告数字、标签和建议不是诊断事实、家庭总分、同龄平均或排名。

Needs Analysis：User Need 是理解已有记录和不确定性；Business Need 是提供可追溯解释而非夸大诊断；Operational Need 是报告版本、来源、状态、反馈和撤回；Compliance Need 是儿童敏感信息、Consent、可见性和 Human Gate；Data Need 是 Assessment/Report/Evidence/SourceVersion；AI Need 是经 Model Gateway 生成解释/摘要/建议草稿。所有 Fact、Perspective、Hypothesis、Recommendation、Decision、Action 要独立表达。

证据边界：30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长资料最高 E1，只能作为 Hypothesis/Design Input，不能自证效果、诊断、资质或因果。

## BA Design Summary

页面目标是以家庭 scope 展示 ReportSnapshot、来源 Evidence、不确定性、解释和可选下一步。候选对象包括 FamilyContext、Person、Assessment、ReportSnapshot、Evidence、Perspective、Hypothesis、Recommendation、ConsentGrant、HumanGateReview、FeedbackDraft。首轮只读投影和 Controlled Draft，不把建议直接升级为 Plan 或 Action。

## Visual Fidelity Brief Summary

Baseline：`apps/web/public/bangyang-reference/ui18/growth-02-ai-report.png`。需核对顶部标题、报告卡、指标/标签、证据说明、不确定性提示、建议列表、返回/下一步、权限/错误/空态和移动端尺寸。当前没有开发后运行截图，不伪造视觉差异。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Person`、`Assessment`、`ReportSnapshot`、`Evidence`、`Perspective`、`Hypothesis`、`Recommendation`、`ConsentGrant`、`HumanGateReview`、`FeedbackDraft`。`GrowthProfile`、`Need`、`Outcome` 等核心事实不得由 AI 解释文本直接写入。

## Read Projection vs Named Action Boundary

报告查看、证据展开和版本切换使用 Read Projection。家长反馈、隐藏/撤回或请求复核可作为候选 Named Action；建议采纳不等于 Decision，Decision 不等于 Action。任何生成计划、任务、敏感诊断、真人服务或外部通知都必须另行审批和 Human Gate。

## Consent / Human Gate / Model Gateway / Ontology Adapter Boundary

报告读取和儿童主体可见性由 Consent/guardian scope 控制；敏感情绪、风险和诊断暗示进入 Human Gate。LLM/VLM 只经 Model Gateway、结构化 schema、evidence refs 和 policy version 输出解释/草稿；Ontology Adapter 只接受批准的 Named Action，不接受自由文本核心状态。

## Backend/API Dependency Candidates

候选共享能力：`ReportSnapshotProjectionService`、`EvidenceTraceService`、`ReportVisibilityPolicy`、`ReportFeedbackDraftService`、ModelGatewayAdapter、OntologyAdapter、AuditService、HumanGateReview。仅列候选，不创建 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. UI-08 与 UI-03 AI Report 的 canonical 责任如何区分？
2. 报告来源、版本、Evidence refs、uncertainty 和 policy version 是否完整？
3. 页面数字/标签如何明确不是 Total Score、Ranking 或诊断事实？
4. 哪些情绪/风险内容必须 Human Gate 或隐藏？
5. 报告反馈是 draft、Named Action 还是仅事件记录？
6. 家长、孩子、老师、顾问的可见性和 Consent 如何分层？
7. 报告撤回、纠错和版本冲突如何处理？
8. AI 解释的 schema rejection、低置信度和无证据路径如何安全停止？

## Required Tests/Screenshot Diff Preparation

需准备多成员 scope、报告版本、Evidence 缺失、低置信度、敏感诊断拒绝、Ranking/Total Score 拒绝、Consent 撤回、Model Gateway schema rejection、反馈幂等、API/Web contract、Playwright desktop/mobile、DOM text 和 loading/empty/error/permission/review 状态截图准备。当前无运行截图，不进行视觉差异声明。

## Status

`NEEDS_RESEARCH_REVIEW`；本文件不授权 API Contract 或代码开发。
