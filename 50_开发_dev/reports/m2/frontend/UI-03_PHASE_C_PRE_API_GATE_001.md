# UI-03 Phase C Pre-API Gate 001

## Research/Needs summary

UI-03 为 AI 成长诊断报告/Report Explanation 页面。研究必须覆盖家长如何理解孩子与关系场景、报告为何应帮助解释而非贴诊断标签、教师/顾问如何参与复核，以及模型输出被误读的风险。需求拆分为：User Need=理解已采集信息和可能关注点；Business Need=把 Assessment 转成可审阅的解释入口；Operational Need=报告版本、证据引用、反馈纠错和复核流程；Compliance Need=儿童敏感数据、诊断/情绪风险、误导防护；Data Need=ReportSnapshot、Evidence、Perspective、Hypothesis、Recommendation、uncertainty；AI Need=Model Gateway + structured explanation。

30_素材_materials 只读，优先逐页提取文本；自家/榜样教育/波波校长材料最高 E1，只能形成假设/设计素材，不能证明诊断、效果或因果。规格明确 `Perspective != Fact`、`Hypothesis != Fact`。

## BA Design summary

页面目标是展示带来源和不确定性的报告解释、关注点候选和下一步可选入口。候选对象为 Assessment、ReportSnapshot、Evidence、Perspective、Hypothesis、Recommendation、ConsentGrant、HumanGateReview、FamilyContext。报告分数、标签、摘要或建议不是家庭事实、诊断、排名或 Outcome。

建议状态：`REPORT_REQUESTED → EXTRACTING → REVIEW_REQUIRED/EXPLANATION_READY → FAMILY_VIEWED → FEEDBACK_DRAFTED → VERSIONED`。缺少 source/version/evidence/policy/Consent 时必须 `REVIEW_REQUIRED`，不可继续下游自动化。

## Visual Fidelity Brief summary

Baseline 由 Phase A ledger/global crosswalk 指定；必须核对标题、报告卡、分数/标签的视觉表达、证据/不确定性提示、建议列表、返回/下一步 CTA、空态/错误态/权限态和移动端尺寸。禁止把视觉中的数字改写成 Family Total Score、同龄平均、Ranking 或诊断事实；当前没有运行截图，不伪造 visual difference comparison。

## Object model candidates

`Assessment`、`ReportSnapshot`、`Evidence`、`Perspective`、`Hypothesis`、`Recommendation`、`FamilyContext`、`ConsentGrant`、`HumanGateReview`、`PlanDraft`（仅后续候选）。核心 GrowthProfile、Need、Outcome 只能由批准的状态流程产生，不由模型自由文本直写。

## Read Projection vs Named Action boundary

允许：ReportExplanation read projection、evidence refs、uncertainty、policy/version 摘要和受控 suggestion draft。候选动作：`RequestReportExplanationReview`、`AcknowledgeReport`、`ProvideReportFeedback`，需正式 registry、scope、Consent、audit、idempotency 和 correlation_id。不能以查看报告、点击建议或 LLM 输出直接创建 Plan、Journey、Task、Diagnosis 或 Intervention。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

`REPORT_READ`、`ASSESSMENT_READ`、`CHILD_DATA` 和敏感风险 purpose 必须分离。敏感情绪、未成年人风险、诊断暗示、跨成员可见性和任何真人建议需要 Human Gate。Model Gateway 只接受经 policy 的结构化输入并输出解释/推荐草稿；Evidence/Content/Provider 等外部来源必须经 Ontology Adapter。

## Backend/API dependency candidates

仅列候选：ReportExplanationProjectionService、Evidence lineage service、Assessment read model、Model Gateway orchestration、schema validator、family authorization/Consent policy、Human Gate review service、Audit/idempotency service、fixture/evaluation set。当前不定义 endpoint、DTO 或 API Contract。

## Architect Review verdict

```text
NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. UI-03 canonical 页面与 UI-04/报告页面的 global mapping 是否已确认？
2. 报告中的数字、标签、问题列表分别属于 Fact、Perspective、Hypothesis 还是 Recommendation？
3. 报告是否允许出现“诊断”“同龄平均”“总评”“排名”及其替代表述？
4. 每条解释和建议的 source_report/version/evidence/uncertainty/policy provenance 如何绑定？
5. 哪些风险信号需要专业人员 Human Gate，拒绝和升级路径是什么？
6. 家长、孩子、顾问对报告的 visibility 和反馈权限如何区分？
7. 查看/确认/反馈是否需要 Named Action，还是只保留 Read Projection？
8. 模型输出、缓存、版本和失败状态是否能被前后端一致表达？

## Screenshot gate

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Required tests/screenshot diff preparation

后续需准备多成员 scope、报告版本、证据缺失、低置信度、诊断/排名拒绝、Human Gate、Consent 撤回、模型 schema rejection、反馈幂等、API/Web contract、Playwright desktop/mobile screenshot 和文本覆盖检查。当前无运行截图，不得进行 visual difference comparison。
