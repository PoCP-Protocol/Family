# Family M0–M6 Roadmap V3.3

版本：V3.3
日期：2026-08-11
状态：NEW AUTHORITATIVE EXECUTION BASELINE
上游裁决：M3-RB-001 = PASS_CLOSED；M3-RB-002 = V3.3 Execution Rebaseline & SSOT Convergence
program baseline：`m3/fpai-intelligence-contract-gate` HEAD = `8cadeb65cca205f3d2fe23b141988d6342444cc7`
program integration branch：`m3/family-1-0-mos`

## Versioning

- V3.0 = SUPERSEDED_FOR_EXECUTION / RETAINED_FOR_HISTORY
- V3.3 = 当前唯一执行 Roadmap SSOT

## M0–M6 Roadmap

| Milestone | 名称 | 核心问题 | 关键产出 | 状态 |
|---|---|---|---|---|
| M0 | Architecture & Engineering Foundation | 能不能稳定开发？ | 工程底座、契约、PG、测试门禁 | CLOSED |
| M1 | Real Family Core | 能不能正确记录一个家庭？ | Family/Member/Relationship/LifeStage/Consent/Aggregate | CLOSED |
| M2 | First Family Growth Loop | 能不能推动一次可观察成长？ | 确定性 7–14天 Growth Loop + Web + Timeline + GrowthReview + NextStepDecision | CLOSED |
| M3 | **Family 1.0 Minimum Operable System (MOS)** | **Family 能不能成为真实家庭可运行的产品？** | **WAF + Famili Principal + Growth OS 收敛为一条安全、可持久、可测量、可返回的用户旅程** | NOW |
| M4 | Scale + Human + Business Integration | 能不能规模化服务？ | Advisor/Expert/CRM/LMS/运营/Knowledge Foundry/Membership | FUTURE |
| M5 | Causal Learning | 哪些干预对谁有效？ | Causal Episode / Effect / Evidence | FUTURE |
| M6 | Family Growth World Model | 能不能模拟状态与干预？ | State/Transition/Policy/Simulation | LONG TERM |

## M3 定义变更（V3.0 → V3.3）

V3.0 曾把 M3 定义为「Family Growth Product：更多维度 / Intervention / Journey / Timeline / 榜样迁移」。

依据 M3-RB-001 裁决：

```
OLD_M3_STRATEGIC_CAPABILITIES = RETAIN
OLD_M3_EXECUTION_SEQUENCE     = SUPERSEDED
```

M3 重新定义为：

```
M3 = FAMILY_1_0_MINIMUM_OPERABLE_SYSTEM
M3_PRIMARY_QUESTION = Can Family become a real operable product for real families?
M3_PRIMARY_GOAL     = WAF + Famili Principal + Growth OS into one safe, persistent, measurable, returning user journey
```

M3 不再定义为：`MORE_FEATURES / MORE_DIMENSIONS / MORE_LIFESTAGES / MORE_INTERVENTIONS`。

## M3 四 Wave 结构

```
M3-W0  Operability Foundation
   ├─ Execution SSOT / Git / Branch / CI Governance
   ├─ IAM Pilot Minimum
   ├─ WithdrawConsent + Consent UX
   ├─ Safety / Human Handoff foundation
   ├─ ProductEvent / ModelRun / SafetyCase governance
   └─ BM-0 Hypothesis Register + Metric Contract + Pilot Measurement Contract（仅定义 WHAT/EVENTS/DECISION_RULE_STRUCTURE，不做 Dashboard）
        ↓ M3-W0 Gate
M3-W1  Famili Principal Runtime（原 M2-W4 Intelligence 的执行归属）
   ├─ M3-000 contract baseline / M3-101A Controlled Principal Runtime
   ├─ Canonical Consent Resolver / Context Broker / Principal Runtime
   ├─ ModelRun / Safety Pre-Postcheck
   └─ Action Proposal → Human Confirmation → Action Bridge → LISTEN_BEFORE_RESPOND integration
        ↓ M3-W1 Gate
M3-W2  Consumer Product Integration
   └─ WAF → Famili Principal → Action Proposal → Human Confirm → Growth OS → Check-in/Reflection → OutcomeObservation → Timeline → Return
        ↓ M3-W2 Gate
M3-W3  Operate & Measure
   └─ Ops Console MVP / Analytics MVP / Pilot instrumentation / Safety Case Ops / Human Review Ops / BM hypothesis measurement / Pilot reporting / MOS dashboard
        ↓ M3-W3 Gate
FAMILY_1_0_MOS_GATE
        ↓
PILOT_READINESS_GATE
        ↓
100_FAMILY_PILOT
        ↓
POST_PILOT_EXPANSION_REVIEW
```

## Evidence-Driven Expansion（范式变更）

执行范式由 roadmap-driven（做能力 → 更多能力 → 扩产品 → 运营）改为 evidence-driven：

```
最小正确能力 → 接成用户旅程 → 真实家庭使用 → 行为数据 → 用证据决定扩什么
```

以下旧 M3 能力保留战略价值但全部 `DEFER_POST_PILOT`，其启动依据不再是 Roadmap 时间，而是 Pilot 证据：

```
need_frequency
pain_intensity
principal_query_frequency
proposal_acceptance
action_completion
return_rate
observable_outcome_signal
```

正式建立 `POST_PILOT_EXPANSION_DECISION_FRAMEWORK`（指标/公式/裁决流程见总体实施计划 V3.3 §D6）。

## HOLD / FUTURE / NOT_HELD

```
DEFER_POST_PILOT = MORE_DIMENSIONS, MORE_LIFESTAGES, MORE_INTERVENTIONS, FULL_90D_JOURNEY
MOVE_LATER (M4)  = MEMBERSHIP, ADVISOR_PRODUCT, EXPERT, CRM/LMS, KNOWLEDGE_FOUNDRY_EXPANSION, FES_EXPANSION
HOLD             = DH1, VOICE_RUNTIME, AVATAR_RUNTIME, MODEL_TRAINING, SFT, LORA, MULTI_AGENT
FUTURE           = CAUSAL_ENGINE, WORLD_MODEL
P1_PARALLEL      = FELS / FLM（不进 MOS Gate、不阻塞 MOS）

NOT_HELD（已交付能力，当前为集成/产品化，不得重造）：
TIMELINE, LISTEN_BEFORE_RESPOND, GROWTH_LOOP, GROWTH_REVIEW, NEXT_STEP_DECISION
```

## 不变量（治理语义，跨里程碑恒定）

- Family 是主体，不是「修孩子」。
- Perspective / Observation / AI Hypothesis != Fact。
- Recommendation != Decision != Action。
- 核心状态必须走 Named Action；AI 自由文本不得直接修改 GrowthProfile/Ontology。
- 不做 Family Total Score、不做家庭 Ranking、不做 diagnosis、不做 percentage improvement。
- Consent purpose 隔离；未成年人数据受 Consent/Permission/Safety 约束。
- Outcome First；World Model 必须后于真实 State/Action/Outcome 数据。
