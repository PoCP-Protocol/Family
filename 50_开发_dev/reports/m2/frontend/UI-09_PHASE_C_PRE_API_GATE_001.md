# UI-09 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-09 是今日成长任务页。本文件只做 Broad Research、Needs Analysis、BA、视觉和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation 或动态代码开发。

## Research/Needs Summary

研究家庭教育实践中家长/孩子如何查看、开始、暂停和回顾日常成长任务；家长、孩子、老师/教练、顾问、运营和 AI 的权限；UI-09 原图 `apps/web/public/bangyang-reference/ui18/growth-03-daily-task.png`；Family/Person/Journey/Task/Reflection/Outcome/Consent 的 SSOT；既有受控 `COMPLETE_TASK` 测试入口只能作为工程线索，不等于 UI-09 已完成。Needs Analysis：User Need 是理解今日任务和安全回顾；Business Need 是承接 GrowthJourney/Task；Operational Need 是任务版本、状态、幂等、暂停和回滚；Compliance Need 是儿童主体、Consent、敏感任务和 Human Gate；Data Need 是 TaskProjection、TaskEvent、Reflection、Evidence；AI Need 是解释/草稿，不直接改 Task 或 Outcome。

证据边界：30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长资料最高 E1，只作为 Hypothesis/Design Input。任务完成不自动证明成长效果。

## BA Design Summary

页面目标是展示今日任务、来源/阶段、完成状态、暂停/调整入口和回顾提示。候选对象包括 FamilyContext、Person、GrowthJourneyProjection、GrowthTask、TaskInstance、Reflection、Evidence、ConsentGrant、HumanGateReview、Outcome（仅未来）。任务状态“未开始/进行中/已完成/暂停”必须来自受控 projection 或 Named Action readback；不得把点击或输入直接当作 Outcome。

## Visual Fidelity Brief Summary

Baseline：`apps/web/public/bangyang-reference/ui18/growth-03-daily-task.png`。需核对顶部导航、日期/阶段、任务卡、说明、状态标签、完成按钮、暂停/调整入口、空态/权限态/错误态和移动端尺寸。当前无开发后运行截图，不伪造视觉差异。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Person`、`GrowthJourneyProjection`、`GrowthTask`、`TaskInstance`、`TaskProgressProjection`、`Reflection`、`Evidence`、`ConsentGrant`、`HumanGateReview`。`Outcome` 不能由任务完成事件直接产生。

## Read Projection vs Named Action Boundary

今日任务和状态使用 Read Projection。`StartTask`、`CompleteTask`、`PauseTask`、`AmendTask` 只能作为受控 Named Action 候选，必须 actor/family/subject scope、Consent、版本、幂等、audit 和 correlation_id。第一轮允许 synthetic/no-op 或受控 readback，不创建真实 Intervention、Outcome、Notification 或外部 effect。

## Consent / Human Gate / Model Gateway / Ontology Adapter Boundary

儿童主体任务、敏感干预和家庭文本需要 guardian/child scope 与 Consent；风险任务、异常反馈或真人介入需要 Human Gate。AI 只能经 Model Gateway 解释任务、生成回顾草稿或安全提示；Ontology Adapter 只接收批准的 Named Action，禁止 AI 自由文本写 Task/Outcome。

## Backend/API Dependency Candidates

候选共享能力：`DailyTaskProjectionService`、`TaskActionBoundary`、`ReflectionDraftService`、`FamilyAuthorizationPolicy`、Consent/HumanGate policy、AuditService、ModelGatewayAdapter、OntologyAdapter。仅列候选，不定义 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. UI-09 与 UI-05 计划和 UI-06 陪跑的任务 ownership 如何分界？
2. `COMPLETE_TASK` 是否允许真实任务状态写入，还是仅 synthetic/readback？
3. “已完成”能否被理解为 Outcome，如何显示过程边界？
4. 任务创建、暂停、调整、撤回的 Named Action 及版本策略是什么？
5. 儿童本人操作、guardian 操作和代理可见性如何授权？
6. 敏感任务、情绪任务和高风险建议何时 Human Gate？
7. 任务输入如何形成 Reflection/Evidence，而不直接写核心事实？
8. 通知、提醒、日历和真人跟进是否全部保持 External Effect HOLD？

## Required Tests/Screenshot Diff Preparation

需准备 family/tenant/person scope、task version、start/complete/pause 幂等、跨家庭拒绝、Consent 撤回、敏感任务 Human Gate、no Outcome/Intervention/Notification creation、Model Gateway schema rejection、API/Web contract、既有 Page Objects test 对齐、Playwright desktop/mobile 和所有 loading/empty/error/permission/review 状态截图准备。当前无运行截图，不进行视觉差异声明。

## Status

`RESEARCH_REVIEW_REQUIRED`；本文件不授权 API Contract 或代码开发。
