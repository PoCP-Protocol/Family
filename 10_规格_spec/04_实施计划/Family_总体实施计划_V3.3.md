# Family 家庭成长AI平台总体实施计划 V3.3

版本：V3.3
日期：2026-08-11
状态：NEW AUTHORITATIVE EXECUTION BASELINE（执行层主计划）
上游裁决：M3-RB-001 = PASS_CLOSED；M3-RB-002 = Family Execution Rebaseline V3.3 & SSOT Convergence
program baseline：`m3/fpai-intelligence-contract-gate` HEAD = `8cadeb65cca205f3d2fe23b141988d6342444cc7`
program integration branch：`m3/family-1-0-mos`

## 0. Versioning

```
V3.0 = SUPERSEDED_FOR_EXECUTION / RETAINED_FOR_HISTORY
V3.3 = 当前唯一执行主计划 SSOT
```

V3.0 文件保留历史，不删除，不再作为当前排期 SSOT。

## 1. Rebaseline 说明

V3.3 不推翻战略蓝图，正式收敛「战略真相 = 计划真相 = 工程真相」。

M2 已确定性闭环并 CLOSED（Growth Loop + Timeline + GrowthReview + NextStepDecision + 真实 PostgreSQL HTTP E2E + Browser Gate + AI06/AI07 + GitHub Required Gates）。

M3 的执行定义由 V3.0 的「Family Growth Product（扩量）」收敛为「Family 1.0 Minimum Operable System（MOS）」。

## 2. 不变量

- Family 是主体，不是「修孩子」。
- Child Growth + Parent Second Growth + Relationship Growth。
- Perspective / Observation / AI Hypothesis != Fact。
- Action / Reflection != Outcome；OutcomeObservation != CausalEffect。
- GrowthReview != GrowthProfile/Diagnosis；NextStepDecision != NextAction。
- ParentObservation != ChildObservation。
- Recommendation != Decision != Action。
- 核心状态必须走 Named Action。
- AI 自由文本不得直接修改 GrowthProfile/Ontology。
- 不做 Family Total Score、不做家庭 Ranking、不做 diagnosis、不做 percentage improvement。
- Consent purpose 必须隔离；未成年人数据受 Consent/Permission/Safety 约束。
- Outcome First；World Model 必须后于真实 State/Action/Outcome 数据。

## 3. Roadmap（执行状态）

```
M0 = CLOSED
M1 = CLOSED
M2 = CLOSED
M3 = NOW  (FAMILY_1_0_MINIMUM_OPERABLE_SYSTEM)
M4 = FUTURE (Scale + Human Service + Business Integration)
M5 = FUTURE (Causal Learning)
M6 = LONG TERM (Family Growth World Model)
```

## 4. M3 定义

```
M3 = FAMILY_1_0_MINIMUM_OPERABLE_SYSTEM
M3_PRIMARY_QUESTION = Can Family become a real operable product for real families?
M3_PRIMARY_GOAL     = WAF + Famili Principal + Growth OS into one safe, persistent, measurable, returning user journey
```

M3 不再定义为 `MORE_FEATURES / MORE_DIMENSIONS / MORE_LIFESTAGES / MORE_INTERVENTIONS`。

## 5. M3-W0 — Operability Foundation

范围：

```
Execution SSOT
Git / Branch / CI Governance
IAM Pilot Minimum
WithdrawConsent + Consent UX
Safety / Human Handoff foundation
ProductEvent foundation / ModelRun governance / SafetyCase governance
BM-0 Hypothesis Register + Metric Contract + Pilot Measurement Contract
```

BM-0 在 W0 只定义（不做 Dashboard）：

```
WHAT_TO_VALIDATE
WHAT_TO_MEASURE
EVENTS_REQUIRED
DECISION_RULE_STRUCTURE
```

## 6. M3-W1 — Famili Principal Runtime

执行所有原 `M2_W4_INTELLIGENCE` 以及 M3/FPAI 新契约。

```
M2_W4_INTELLIGENCE = SUPERSEDED_FOR_EXECUTION
M3_W1              = EXECUTION_OWNER
M2_REOPEN          = NO
```

W1 包括：M3-000 contract baseline / M3-101A Controlled Principal Runtime / Canonical Consent Resolver / Context Broker / Principal Runtime / ModelRun / Safety Pre-Postcheck / Action Proposal / Human Confirmation / Action Bridge / LISTEN_BEFORE_RESPOND integration。

第一版仍禁止：

```
arbitrary AI GrowthAction
direct Growth DB write
```

## 7. M3-W2 — Consumer Product Integration

主链：

```
WAF → Famili Principal → Action Proposal → Human Confirm → Growth OS
    → Check-in/Reflection → OutcomeObservation → Timeline → Return
```

约束：

```
TIMELINE               = INTEGRATE_AND_PRODUCTIZE（不得重新实现 Timeline Domain）
LISTEN_BEFORE_RESPOND  = INTEGRATE_EXISTING_ASSET（不得重造 Intervention）
MINIMUM_RETURN_JOURNEY = YES
FULL_90_DAY_JOURNEY    = DEFER_POST_PILOT
```

## 8. M3-W3 — Operate & Measure

范围：Ops Console MVP / Analytics MVP / Pilot instrumentation / Safety Case Ops / Human Review Ops / BM hypothesis measurement / Pilot reporting / MOS operational dashboard。

W3 职责：`MEASURE / OPERATE / REVIEW / DECIDE`，不是继续扩功能。

## 9. Evidence-Driven Expansion

旧 M3 能力（`MORE_DIMENSIONS / MORE_LIFESTAGES / MORE_INTERVENTIONS / FULL_90_DAY_JOURNEY`）保留战略价值，全部 `DEFER_POST_PILOT`。

启动依据来自：`need_frequency / pain_intensity / principal_query_frequency / proposal_acceptance / action_completion / return_rate / observable_outcome_signal`。

正式建立 `POST_PILOT_EXPANSION_DECISION_FRAMEWORK`。

## D6. Threshold Rule

现在冻结（框架）：

```
metric definitions
denominators
data quality rules
decision formula
decision states
calibration procedure
```

暂不凭空编造最终数值阈值：

```
NUMERIC_THRESHOLDS = CALIBRATE_THEN_FREEZE
```

一旦进入正式扩量裁决期：

```
NO_POST_HOC_METRIC_SWITCHING
NO_RESULT_DRIVEN_THRESHOLD_EDITING
```

## 10. Capability Classification

MOVE-IN：IAM / WithdrawConsent / Consent UX / Safety-Handoff / ProductEvent / ModelRun / Git-CI-SSOT / FPAI Runtime / Context Broker / Consent Resolver / Action Bridge / WAF runtime integration / Ops / Analytics / Pilot instrumentation / BM-0。

KEEP-IN-M3：Timeline product integration / LISTEN_BEFORE_RESPOND integration / minimum Journey-return loop。

DEFER-POST-PILOT：More Growth Dimensions / More LifeStages / More Interventions / Full 90-Day Journey。

MOVE-LATER：Membership / Advisor Product / Expert / CRM-LMS / Knowledge Foundry expansion / FES expansion / Digital Human Runtime / Voice Runtime / Avatar Runtime / Causal Engine / World Model。

## 11. FELS / FLM Ruling

```
FELS_FLM              = P1_PARALLEL
MOS_GATE_DEPENDENCY   = NO
MOS_BLOCKER           = NO
```

Hard boundary：无 MOS shared-file pollution / 无 M3 program-branch mixed commits / 无 Family canonical writes / 无 MOS CI coupling（除非显式要求）。

一旦出现 shared-file conflict / resource conflict / CI coupling / critical-path delay：

```
MOS_PRIORITY = ABSOLUTE
FELS_FLM     = PAUSE_ALLOWED
```

## 12. Branch Strategy

```
PROGRAM_INTEGRATION_BRANCH = m3/family-1-0-mos
```

后续禁止任何人直接长期在该 branch 上开发。用短生命周期分支：

```
m3/w0-operability-* / m3/w1-principal-* / m3/w2-consumer-* / m3/w3-operate-*
或 task-level：m3/iam-* / m3/consent-* / m3/principal-* / m3/waf-* / m3/ops-* / m3/analytics-*
```

流程：

```
feature/task branch → PR → m3/family-1-0-mos
最终 MOS Gate 后：m3/family-1-0-mos → PR → default branch (master)
```

## 13. Default Branch Reality

```
DEFAULT_BRANCH = master
```

禁止在 V3.3 文档凭空写 `main = default`。default-branch rename 单独登记为 `GOV_DEFAULT_BRANCH_NORMALIZATION`，非本阶段。

## 14. CI Trigger

workflow 触发由 `main + wave/**` 调整为至少 `master + main + wave/** + m3/**`。`main` 暂时保留兼容，`master + m3/**` 必须进入。

## 17. M3 Gates

```
M3-W0 Gate → M3-W1 Gate → M3-W2 Gate → M3-W3 Gate
→ FAMILY_1_0_MOS_GATE → PILOT_READINESS_GATE → 100_FAMILY_PILOT → POST_PILOT_EXPANSION_REVIEW
```

## 18. Pilot Gate（至少必须包含）

```
IAM_PILOT_MINIMUM = PASS
WITHDRAW_CONSENT = PASS
CONSENT_UX = PASS
MINOR_DATA_SOP = PASS
SAFETY_ESCALATION = PASS
HUMAN_REVIEW_PATH = PASS
FAMILY_GROWTH_LOOP = PASS
FPAI = PASS
WAF_INTEGRATION = PASS
OPS = PASS
ANALYTICS = PASS
PILOT_MEASUREMENT_PLAN = PASS
```

## 19. Explicit HOLD / NOT_HELD

```
MORE_DIMENSIONS = HOLD
MORE_LIFESTAGES = HOLD
MORE_INTERVENTIONS = HOLD
FULL_90D_JOURNEY = HOLD
MEMBERSHIP = HOLD
ADVISOR_PRODUCT = HOLD
FES_EXPANSION = HOLD
KNOWLEDGE_FOUNDRY_EXPANSION = HOLD
DH1 = HOLD
VOICE_RUNTIME = HOLD
AVATAR_RUNTIME = HOLD
MODEL_TRAINING = HOLD
SFT = HOLD
LORA = HOLD
MULTI_AGENT = HOLD
CAUSAL_ENGINE = FUTURE
WORLD_MODEL = FUTURE
```

```
TIMELINE = NOT_HELD
LISTEN_BEFORE_RESPOND = NOT_HELD
GROWTH_LOOP = NOT_HELD
GROWTH_REVIEW = NOT_HELD
NEXT_STEP_DECISION = NOT_HELD
```

以上 NOT_HELD 是已交付能力，当前工作是集成 / 产品化。

## 25. No Runtime Creep

V3.3 对这些能力的记载属于 `DOCUMENTATION_OF_AUTHORIZED_FUTURE_WORK`，`!= IMPLEMENTATION`。RB-002 不实现 PrincipalModule / IAM / WithdrawConsent / WAF / Ops / Analytics / DB tables / real model。
