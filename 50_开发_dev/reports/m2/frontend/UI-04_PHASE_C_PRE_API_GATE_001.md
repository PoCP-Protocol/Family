# UI-04 Phase C Pre-API Gate 001

## Research/Needs summary

UI-04 为 90 天成长方案/计划草稿页面。研究必须覆盖家庭教育中的共同成长、Parent Second Growth、Child Growth、Relationship Growth、家长确认和可逆行动；业务材料与波波校长叙事最高 E1，只作为假设/设计输入。需求拆分为：User Need=把报告解释转为可理解的成长方向；Business Need=承接 90 Day Growth Journey；Operational Need=计划版本、阶段、任务候选、暂停/调整；Compliance Need=儿童与敏感干预、Consent、Human Gate；Data Need=ReportSnapshot、PlanDraft、FamilyDecision、GrowthJourney/Task candidates、Evidence；AI Need=只生成候选草稿和解释。

规格支持 12–15 岁 90 天共同成长的 `SEE → PARENT_FIRST → CO_CREATE → STABILIZE` 设计，但这些是设计结构，不是效果事实或自动运行状态。

## BA Design summary

页面目标是展示来自 UI-03 的受控 PlanDraft、阶段目标、候选行动和不确定性，并让家庭明确知道“建议、决定、执行”不同。候选对象为 ReportSnapshot、PlanDraft、GrowthGoal、GrowthActionCandidate、FamilyDecision、ConsentGrant、Evidence、HumanGateReview。初版只能 read projection/controlled draft，不自动创建 GrowthJourney、GrowthTask、Intervention、ServiceCase。

建议状态：`DRAFT_READ → FAMILY_REVIEW → DECISION_PENDING → ACCEPTED_READBACK/REJECTED/PAUSED/AMENDMENT_DRAFT`。任何确认、暂停、调整、撤回都必须通过正式 Named Action；版本冲突、Consent 缺失、provenance 不全或敏感干预必须 fail-closed。

## Visual Fidelity Brief summary

Baseline 由 Phase A ledger/global crosswalk 指定；必须复刻计划标题、阶段统计、时间线/周卡、任务行、状态文案、底部 CTA、返回/调整入口、空态/权限态/版本冲突态和移动端尺寸。3/12/36/90 只能作为计划结构 projection，不得解释为总分、排名、成功率、诊断或效果承诺。没有运行截图，不能声称 visual difference comparison 通过。

## Object model candidates

`ReportSnapshot`、`PlanDraft`、`GrowthPlan`（仅正式状态后）、`GrowthGoal`、`GrowthActionCandidate`、`FamilyDecision`、`ConsentGrant`、`Evidence`、`HumanGateReview`、`GrowthJourney`/`GrowthTask`（后续受控 runtime）。

## Read Projection vs Named Action boundary

允许：PlanDraft read projection、阶段/任务候选、source/version/evidence/uncertainty 和家庭审阅状态。候选动作：`ProposeFamilyDecision`、`ConfirmGrowthPlanDecision`、`PauseGrowthPlanDecision`、`AmendGrowthPlanDraft`；首轮必须 decision-only/no-op，不能自动创建 Journey/Task/Intervention。Recommendation != Decision != Action。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

`PLAN_READ`、`PLAN_DECISION`、`CHILD_DATA`、`SERVICE_FOLLOWUP` purpose 必须分离。敏感干预、未成年人风险、真人服务和外部通知/预约/支付必须 Human Gate 或 L4 HOLD。AI 只能经 Model Gateway 输出 schema-validated draft/recommendation；外部内容/服务数据经 Ontology Adapter，不能直接写核心状态。

## Backend/API dependency candidates

仅列候选：GrowthPlanDraftProjectionService、Report provenance service、FamilyDecision boundary service、Consent/authorization policy、Human Gate review service、Audit/idempotency/correlation service、synthetic decision fixture、Journey/Task read projection。当前不定义 endpoint、DTO 或 API Contract。

## Architect Review verdict

```text
NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. PlanDraft 正式 provenance 是否必须绑定 source_report_id、version、evidence_refs、uncertainty、policy_version？
2. `orchestration_plans` 是 projection、draft 还是执行真相？
3. `FamilyDecision` 是否复用共享对象并带 `decision_context=GROWTH_PLAN`？
4. `ConfirmGrowthPlanDecision` 是否只产生 readback，何时才允许后续 runtime action？
5. Guardian、child subject、家庭成员的 visibility 和 Decision 权限如何定义？
6. 3/12/36/90 和任务三态哪些是静态 copy，哪些可由 projection 替换？
7. Pause/Amend/Revoke 的可逆策略、审计和版本冲突如何定义？
8. 缺少 Consent、Evidence 或 Human Gate 时页面如何保持原骨架并返回 `REVIEW_REQUIRED`？

## Screenshot gate

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Required tests/screenshot diff preparation

后续需准备 PlanDraft provenance、Decision candidate/confirm、guardian-only、Consent 缺失/撤回、版本冲突、pause/amend/revoke、no Plan/Task creation、idempotency、audit、API/Web contract、原图 DOM text、desktop/mobile screenshot 和状态 diff。当前无运行截图，不得进行 visual difference comparison。
