# UI-02 Phase C Pre-API Gate 001

## Research/Needs summary

UI-02 为家庭测评/Assessment 页面。研究必须覆盖家庭教育中的问题入口、家长与孩子的不同视角、测评为何服务于理解而不是贴标签，以及测评后的回流。需求拆分为：User Need=理解当前家庭成长关注点；Business Need=形成受控 onboarding；Operational Need=题库、版本、复测和人工升级；Compliance Need=儿童数据、Consent、最小化和撤回；Data Need=Assessment、Response、Perspective、Evidence、source/version；AI Need=仅做结构化解释/候选摘要，经 Model Gateway。

现有规格支持 `Content → Assessment → Family Account` 和 Growth Onboarding，但页面视觉映射、题目/量表来源、结果字段、复测规则和家庭/成员 visibility 尚未逐页闭合。30_素材_materials 只读，优先逐页文本；自家/榜样教育/波波校长材料最高 E1，仅为 Hypothesis/Design Input。

## BA Design summary

页面目标是让授权家庭成员开始或继续一次结构化 Assessment，并知道用途、对象、预计时间、退出/保存和 Consent 状态。候选对象为 FamilyContext、Person、Assessment、AssessmentVersion、Response、Evidence、Perspective、ConsentGrant、HumanGateReview。Recommendation 不得自动创建 Need、Profile 或 Diagnosis；测评结果首先是受控 Read Projection/Controlled Draft。

建议状态：`NOT_STARTED → CONSENT_REQUIRED → IN_PROGRESS → DRAFT_SAVED → SUBMITTED → REVIEW_REQUIRED → EXPLANATION_READY`。任何撤回、scope 不明、儿童敏感问题或版本冲突都应 fail-closed。

## Visual Fidelity Brief summary

Baseline 由 Phase A ledger 和 global crosswalk 指定；本轮不伪造运行截图。必须逐项确认顶部导航、标题/说明、题目卡、选项、进度、返回/下一步、保存/退出、空态、错误态、Consent 阻断和移动端尺寸。视觉复刻不等于测评事实，题目和文案必须以用户原图、规格和已确认文本为准；没有成对运行截图前不能做 visual difference comparison 声明。

## Object model candidates

`FamilyContext`、`Person`、`Assessment`、`AssessmentVersion`、`AssessmentResponse`、`Perspective`、`Evidence`、`ConsentGrant`、`HumanGateReview`、`ReportSnapshot`（仅后续来源）。AI 不能直接写 GrowthProfile、Need、Diagnosis 或 Outcome。

## Read Projection vs Named Action boundary

允许：Assessment metadata/read projection、当前 session projection、已保存 draft projection。候选动作：`StartAssessment`、`SaveAssessmentDraft`、`SubmitAssessment`，均需正式注册、scope、Consent、actor、idempotency、correlation_id、audit 和可撤回/修正策略。Recommendation/AI 摘要不能等同 Decision；提交也不能自动创建 Journey、Task、Diagnosis 或 Intervention。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

`ASSESSMENT_READ`、`ASSESSMENT_RESPONSE`、`CHILD_DATA` 等 purpose 必须分离；儿童/敏感风险、诊断暗示和跨成员可见性需要 Human Gate。AI 只经 Model Gateway 生成结构化解释/草稿；题目、答案和外部资料经 Adapter 转成受控 projection，不得直接写核心 Ontology。

## Backend/API dependency candidates

仅列候选：Assessment projection service、question bank/version adapter、Family authorization policy、Consent service、Evidence/lineage service、Model Gateway orchestration、Audit service、Human Gate policy、test fixture/read model。当前不定义 endpoint、DTO 或 API Contract。

## Architect Review verdict

```text
NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. UI-02 canonical baseline 与 UI-07 assessment entry 的职责和页面映射是否已人工确认？
2. 题库/量表来源、版本、适用年龄和证据等级是什么？
3. Assessment 是家庭、孩子、家长还是关系主体的 session？跨成员可见性如何定义？
4. `CHILD_DATA` 与 `ASSESSMENT_RESPONSE` Consent purpose 如何分离、撤回如何传播？
5. 提交后仅形成 Response/Evidence，还是允许生成 explanation draft？
6. 哪些题目/风险信号必须 Human Gate，如何返回 `REVIEW_REQUIRED`？
7. 复测、撤回、修正和版本冲突的状态机是否批准？
8. 页面状态与后端 projection 的字段、错误码、空态和审计是否能闭合？

## Screenshot gate

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Required tests/screenshot diff preparation

后续需准备 question/version fixture、tenant/family/person scope、Consent 缺失/撤回、儿童敏感题目、draft/submit 幂等、版本冲突、Model Gateway schema rejection、API/Web contract、Playwright desktop/mobile screenshot 和 loading/empty/error/permission/review 状态覆盖。当前无运行截图，不得进行 visual difference comparison。
