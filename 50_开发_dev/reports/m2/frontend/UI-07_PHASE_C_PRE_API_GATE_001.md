# UI-07 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-07 是成长测评入口页。本文件只做 Broad Research、Needs Analysis、BA Design、Visual Fidelity 和 Architect Gate 准备，不定义 API Contract，不修改业务代码。未完成证据、Consent、对象和视觉闭环前不得进入 API 或代码。

## Research/Needs Summary

研究家庭教育中家长为何需要安全、可解释的成长测评入口；家长、孩子、老师/教练和运营的角色；UI-07 原图 `apps/web/public/bangyang-reference/ui18/growth-01-assessment-entry.png` 与 global baseline；Assessment、Person、FamilyContext、Consent、Evidence、Report 的 SSOT；Model Gateway、Human Gate、Ontology Adapter、审计、测试和前后端一致性。测评可产生需要进一步研究的观察与输入，不自动产生诊断事实。

Needs Analysis：User Need 是理解入口、范围、耗时和授权；Business Need 是把家庭需求导入受控 Assessment；Operational Need 是版本、草稿、退出、重测和 scope；Compliance Need 是儿童数据、Consent、敏感问题和撤回；Data Need 是 Family/Person/AssessmentVersion/Response/Evidence；AI Need 是题目解释或草稿辅助，不生成诊断。Fact、Perspective、Hypothesis、Recommendation、Decision、Action 必须分开。

证据边界：30_素材_materials 只读，优先 `_extracted/逐页文本_含页码/`，不使用 all_materials.txt；自家/榜样教育/波波校长资料最高 E1，仅为 Hypothesis/Design Input。

## BA Design Summary

页面目标是说明测评用途、适用成员、预计流程、授权和开始/退出入口。候选对象包括 FamilyContext、Person、Assessment、AssessmentVersion、AssessmentSession、AssessmentResponse、Evidence、ConsentGrant、HumanGateReview。首轮允许读取入口说明和产生受控 assessment session draft；提交和敏感问题处理必须单独 Gate。

## Visual Fidelity Brief Summary

Baseline：`apps/web/public/bangyang-reference/ui18/growth-01-assessment-entry.png`。需核对顶部导航、标题/副标题、测评说明卡、题目/选项预览、进度或步骤提示、开始/返回/退出、空态、错误态、Consent 阻断和移动端尺寸。当前没有开发后运行截图，不伪造差异。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Person`、`Assessment`、`AssessmentVersion`、`AssessmentSession`、`AssessmentResponse`、`Evidence`、`ConsentGrant`、`HumanGateReview`、`ReportSnapshot`（后续来源）。AI 不得直接写 GrowthProfile、Need、Diagnosis 或 Outcome。

## Read Projection vs Named Action Boundary

入口说明和历史测评状态使用 Read Projection。开始测评可作为受控 `StartAssessmentSession` candidate，保存/退出/撤回/提交需显式 Named Action；提交不等于诊断，不得自动生成 Report、Need 或 Plan。敏感题目、儿童主体、跨家庭 scope 和报告生成必须 Consent/Human Gate。

## Consent / Human Gate / Model Gateway / Ontology Adapter Boundary

`ASSESSMENT_READ`、`ASSESSMENT_RESPOND`、`CHILD_DATA` 等 purpose 需要明确；Consent 缺失、撤回、subject 不匹配立即 fail-closed。AI 只能经 Model Gateway 做解释/摘要/草稿，schema rejection 时安全停止；核心 Response/Assessment 状态经 Ontology Adapter 和 Named Action，不由自由文本写入。

## Backend/API Dependency Candidates

候选共享能力：`AssessmentEntryProjectionService`、`AssessmentSessionProjectionService`、`AssessmentVersionProvider`、Consent/FamilyAuthorization policy、HumanGateReview、AuditService、ModelGatewayAdapter、OntologyAdapter。仅作候选，不定义 endpoint、DTO 或 migration。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. UI-07 与 UI-02 测评流程的入口/职责边界如何裁决？
2. 测评适用成员、儿童 subject 和 guardian actor 如何确定？
3. `StartAssessmentSession` 是否只创建 session draft，还是允许开始答题？
4. 题目版本、量表来源和 Evidence provenance 如何记录？
5. 敏感题目、风险信号和退出/撤回如何触发 Human Gate？
6. 结果页/报告是否必须由独立 Report Snapshot 产生，如何防止诊断化？
7. 重测、版本冲突和幂等策略如何定义？
8. 页面文案中的承诺是否有规格或外部研究证据，哪些需 `NEEDS_CONFIRMATION`？

## Required Tests/Screenshot Diff Preparation

需准备入口 scope、Consent 缺失/撤回、儿童越权、session draft 幂等、版本冲突、敏感题目 safe stop、Model Gateway schema rejection、API/Web contract、Playwright desktop/mobile、DOM text coverage 和 static/loading/empty/error/permission/review 状态截图准备。当前无运行截图，不进行视觉差异声明。

## Status

`NEEDS_RESEARCH_REVIEW`；本文件不授权 API Contract 或代码开发。
