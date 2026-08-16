# FAMILY GROWTH ORCHESTRATION —— ARCH V1(Phase 1 架构契约 SSOT)

```text
DOC_KIND = PHASE1_ARCHITECTURE_CONTRACT(架构层;字段/状态/不变量/边界/黄金旅程/自有 Gate,非迁移、非 runtime)
TASK     = FAMILY-GROWTH-ORCHESTRATION-ARCH-001(经 ARCHITECTURE-CLOSEOUT)
PARENT   = architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md(最高战略 SSOT)
REFERENCE= architecture/allocation/{A..H}(PR#32,EARLY PHASE1 ARCH REFERENCE)——forward 输入,非 SSOT、非放行依据
BASE     = master @ 2aa6da6(含 V3 Blueprint + @family/program-runtime)
状态      = DRAFT;RUNTIME = HOLD;须过本文件 §11 ARCHITECTURE GATE 全 PASS 才可写 runtime;AUTO_MERGE = NO
```

## 0. 目标(单家庭价值闭环的架构验证)

冻结 M1–M5 服务编排契约:证明「一个家庭提出一个真实成长需求后,Family 能正确理解 → 判断能力 → 找到合适资源 → 形成路径 → 完成服务 → 回访 → 下一次复用上下文」。
最高纪律:**进入 runtime 之前,把「建议 / 决定 / 计划 / 执行 / 回访 / 观察 / 复用」七种真相彻底分开。** 平台壁垒来自"知道自己何时知道了什么、谁做了决定、什么只是建议、什么真的发生、什么仍不能下结论"。

## 1. 七种真相(本契约的第一原则)

```text
Recommendation(建议)   ≠ Decision(决定)   ≠ Plan(计划)   ≠ Execution(执行)
≠ FollowUpResponse(回访)  ≠ Observation(观察/Growth 真相)  ≠ ContextReuse(复用投影)
```
每种真相有独立对象/边界与写入口;禁任一层直接写下游真相(尤其禁服务层直接写 Growth Truth)。

## 2. 核心对象(V3 canonical;含决定边界)

```text
① GrowthNeedSignal      NON_CANONICAL 推断
   signal_id, family_id, subject_person_id, source(MANUAL|PRINCIPAL|SERVICE_FOLLOWUP),
   raw_ref(指来源,不复制原文), inferred_need_type, confidence(0–1), created_at
   不变量:canonical_family_fact=false;无诊断/标签;≠Fact≠Priority。
   source 说明:V1 不含 ONBOARDING(onboarding 只建 Account/Family/Child/Relationship/Consent,value before data)、暂不含 WAF(未进当前纵切)。

② GrowthIntent          NON_CANONICAL 服务请求(家长显式确认后才存在)
   intent_id, family_id, subject_person_id, need_type, goal_text(家长自述),
   status(OPEN|CLOSED|CANCELLED|SUPERSEDED), close_reason?, confirmed_by, confirmed_at
   close_reason ∈ {SERVICE_DELIVERED|NO_ACTION_SELECTED|FAMILY_STOPPED|SUPERSEDED_BY_NEW_INTENT|EXTERNAL_REFERRAL}
   requires: 1..N GrowthCapability(见 §6 cardinality)
   不变量:≠GrowthPriority、≠Family Fact、≠诊断;**Intent CLOSED ≠ 需求被解决 ≠ growth outcome**。GrowthPriority 可选(§5),非本链前置。

③ GrowthCapability      能力抽象层(需求↔供给解耦)
   capability_key(DE_ESCALATION|COMMUNICATION_REOPENING|BOUNDARY_NEGOTIATION|PARENT_SELF_REGULATION|…),
   description_ref, age_scope, need_scope, risk_class, evidence_expectation
   不变量:声明"需要什么能力",不绑定具体资源;同一 capability 可由多类 ResourceOffer 满足;禁 Need→直接推荐一个 Product。

④ ResourceOffer         【原子资源】ONE ResourceOffer = ONE callable resource
   offer_id, provider_ref, resource_type(**恰好一个**:NO_ACTION|CONTENT|PRACTICE|AI_COACH|PROGRAM|HUMAN_COACH|QUALIFIED_EXPERT|EXTERNAL_REFERRAL),
   supports_capability_keys[](1..N), age_scope, need_scope, evidence_refs[], risk_boundary,
   privacy_class, effort, duration, availability, cost_class, requires_human, requires_consent
   不变量:**ResourceOffer ≠ Solution Bundle**(组合是 OrchestrationPlan 的职责);NO_ACTION 是一等 Offer;cost 仅分级、无真实支付;八型封闭,ASSESSMENT=HOLD(见 §10)。

⑤ ResourceRecommendation  Recommendation ≠ Decision ≠ Orchestration
   recommendation_id, intent_id, offer_id,
   required_capability_keys[], covered_capability_keys[], uncovered_capability_keys[],
   why_this, why_now, limitations, alternatives[](≤2),
   status(PROPOSED|SHOWN|SUPERSEDED|EXPIRED)   # 仅描述推荐自身生命周期
   不变量:可解释规则产生(禁 ML/黑盒);**不含 ACCEPTED/ALTERNATIVE_SELECTED**(那是 Family Decision,见 ⑥);Resource Fit 必须以 covered/uncovered capabilities 可解释。

⑥ FamilyServiceDecision  【家庭决定边界/事件】(Recommendation → Decision 的可审计边界)
   decision_id, family_id, subject_person_id, intent_id, recommendation_ref,
   decision_type(ACCEPT_RECOMMENDATION|SELECT_ALTERNATIVE|DISMISS), selected_offer_refs[], actor_person_id, decided_at
   不变量:家庭决定是独立可审计真相,不是 Recommendation 的状态;需家庭决定处,无有效 Decision 不得启动服务。(V1 可为 event/boundary,非必须第九聚合。)

⑦ OrchestrationPlan      【声明式期望路径】desired path,不拥有执行真相
   plan_id, intent_id, family_id, subject_person_id, version, accepted_by_decision_ref,
   steps[]{ step_no, capability_key, offer_ref, trigger(NOW|AFTER_PREV|SCHEDULED|CONDITIONAL), condition(repeated≥N|complex|risk|out_of_scope) },
   status(DRAFT|PROPOSED|ACCEPTED|SUPERSEDED)   # 仅 proposal/version 生命周期
   不变量:**不含 ACTIVE/COMPLETED;step 不含执行状态**(执行真相归 ServiceCase);V1 不做通用 workflow DSL(仅上述有限条件路径)。Plan 回答"计划是什么",不回答"执行到哪"。

⑧ ServiceCase           【实际执行真相】actual service execution(Family Steward 拥有)
   case_id, family_id, subject_person_id, intent_id, plan_ref,
   status(OPEN|ASSIGNED|IN_PROGRESS|WAITING_FAMILY|ESCALATED|COMPLETED|CANCELLED),
   owner, opened_at, next_action_at, sla_class, escalation_level, closed_at
   不变量:仅家庭 Decision 后创建;固定枚举生命周期;**Plan accepted ≠ Service started;Plan superseded ≠ Service cancelled;ServiceCase COMPLETED/Closed ≠ 问题 Resolved ≠ Growth Outcome。**

⑨ ServiceContribution   记录贡献(不分钱)
   case_id, provider_ref, role(AI_COACH|DELIVERY_ASSISTANT|GROWTH_COACH|QUALIFIED_EXPERT|CONTENT_PROVIDER|PROGRAM_PROVIDER|STEWARD),
   task_ref, started_at, completed_at, quality_state
   不变量:无 compensation/commission/payment split(结算属 M8);仅记录"谁在此 case 贡献了什么"。

回访真相(见 §7)FollowUpResponse 与复用投影(见 §9)ContextReuseProjection 为服务层只读派生,非 canonical。
只读投影:GrowthPriority / active Intervention / recent OutcomeObservation(经授权只读,不写、不复制真相);DemandCluster=未来只读匿名聚合,非核心 transaction object。
```

## 3. 主链

```text
GrowthNeedSignal → GrowthIntent(1..N Capability) → [Resource Eligibility Gate] → 原子 ResourceOffer(s)
→ ResourceRecommendation(coverage) → FamilyServiceDecision → OrchestrationPlan(声明) → ServiceCase(执行)
→ Follow-up → FollowUpResponse →(真相分类)→ [仅合格者] Growth OS Named Action → Observation → 第二次:ContextReuseProjection
```

## 4. 两个 Gate + 连接点

```text
A. Provider Qualification Gate(入网层,source of truth):qualification_state ∈ {ACTIVE|SUSPENDED|EXPIRED|REVOKED}
   —— 审 Qualification/Capability/Scope/RiskBoundary/ServiceQuality。产出 Provider 是否可发布 ResourceOffer。
B. Resource Eligibility Gate(编排层,每次针对某家庭此刻,FAIL CLOSED):consent/privacy/safety/professional_scope/risk_boundary/age_scope/availability
   —— **不重审 Provider 证照**,但每次 MUST 读取上游 provider_qualification_state 且要求 == ACTIVE,否则 INELIGIBLE。
连接:Provider Qualification = source of truth;Resource Eligibility = consumer of current qualification state。
```
仅 eligible Offer 进入 **Growth Fiduciary Ranking**(蓝图 §4):child_growth_interest > confirmed_family_intent > resource_fit > evidence > past_context > family_preference > user_burden > cost。
**Platform Revenue = NOT_A_RANKING_SIGNAL(根本不参与)。** 必须支持 NO_ACTION / FREE_RESOURCE / EXTERNAL_REFERRAL。

## 5. GrowthPriority 可选

`GrowthIntent ≠ GrowthPriority`;GrowthPriority = OPTIONAL / Growth-OS-owned / family-confirmed,**不是本链前置**;Intent 可事后可选 inform 一条 Priority(经既有 human-confirmed 边界)。临时求助不被强制"成长规划化"。

## 6. Capability Cardinality(现在冻结,防 runtime 返工)

```text
ONE GrowthIntent   requires   1..N GrowthCapability
ONE ResourceOffer  supports   1..N GrowthCapability
ResourceRecommendation 必须声明: required_capability_keys[] / covered_capability_keys[] / uncovered_capability_keys[]
```
禁隐式"单 capability"假设;Resource Fit 的可解释性建立在 covered/uncovered 之上。

## 7. Follow-up 真相边界(禁直写 Growth Truth)

```text
Follow-up 提问 → FollowUpResponse(服务层,家长原话/勾选)
FollowUpResponse 真相分类 ∈ { PERSPECTIVE | SERVICE_NOTE | OBSERVATION_CANDIDATE }
仅 OBSERVATION_CANDIDATE 且满足[既有 Growth OS observation contract + observer 合法 + subject 匹配 + consent] → 经既有 Named Action(RecordOutcomeObservation)→ Observation
```
不变量:`FollowUpResponse ≠ Observation`;`Check-in ≠ Observation`;服务层绝不直接写 Growth Truth。例:"感觉好一点" 首先只是 Perspective/Service Note。

## 8. 唯一黄金旅程(每箭头标 input/output/owner/write-boundary)

```text
家长:"孩子刚摔门,我今晚不知道怎么重新开口"
  → GrowthNeedSignal   [in: 家长文本/Principal · out: signal(NON_CANONICAL) · owner: Orchestration · write: 服务层,canonical=false]
  → GrowthIntent 确认   [in: signal + 家长显式确认 · out: intent(OPEN) · owner: Orchestration · write: 服务层;需家长确认]
  → 必需 Capability: DE_ESCALATION + COMMUNICATION_REOPENING   [in: intent · out: required_capability_keys[2] · owner: Capability Engine · write: 无(声明)]
  → Resource Eligibility(consent/age_scope/safety + provider_qualification==ACTIVE)   [out: eligible set 或 INELIGIBLE · owner: Eligibility Gate · write: 无]
  → 原子 ResourceOffer: OFFER_A(AI_COACH) · OFFER_B(PRACTICE) [· OFFER_C(PROGRAM) 备选]   [owner: Resource Network · write: 无]
  → ResourceRecommendation(covered: A→COMMUNICATION_REOPENING, B→DE_ESCALATION;why_this/why_now/limitations)   [status: SHOWN · owner: Orchestration · write: 服务层]
  → FamilyServiceDecision(ACCEPT_RECOMMENDATION, selected=[A,B])   [in: recommendation + 家庭 · out: decision · owner: Family · write: 决定边界,可审计]
  → OrchestrationPlan(声明: A now → B tonight → FOLLOWUP tomorrow; IF repeated → C)   [status: ACCEPTED · owner: Orchestration · write: 声明,无执行真相]
  → ServiceCase(OPEN→IN_PROGRESS)   [owner: Family Steward · write: 执行真相]
  → AI service(复用 Principal) → Practice(Content Engine 交付)
  → Follow-up(24h) → FollowUpResponse("感觉好一点")   [owner: 服务层 · write: 服务层,非 Growth Truth]
  → 真相分类 → (若合格) Growth OS Named Action → Observation   [owner: Growth OS · write: canonical,经既有边界]
  → 第二次同类需求 → ContextReuseProjection(只读)   [owner: Orchestration · write: 无]
```

## 9. M5 Context Reuse 契约(只读,禁因果断言)

```text
ContextReuseProjection(只读派生,非 canonical)可引用【经授权】: prior ServiceCase · prior accepted OrchestrationPlan · prior selected ResourceOffer · prior Named Action · prior Observation · prior helpfulness signal
面向用户【允许】:"上次类似情况你选择过先暂停争论、再重新开口。" / "后来你记录到第二天能继续讨论。"
【禁止】:"这个方法已证明对你们家有效。" / "这就是最适合你们家的方法。"
不变量:Context reuse ≠ causal inference。目标度量 REPEAT_EXPLANATION_REDUCTION(不从零解释)。
```

## 10. 既有技术接线 + Assessment HOLD

```text
family_id/subject_person_id → Family Core 只读;AI_COACH → 复用 Principal(handleMessage/Human Gate),不新建 AI;
PROGRAM → @family/program-runtime(schedule/进度投影,不拥有 completion/Growth 真相);CONTENT/PRACTICE → Content Engine(*_ref);
真人角色 → Human Gate;Case 状态 → Family Steward;GrowthPriority/Intervention/Observation → Growth OS(只读投影,写走既有 Named Action)。
ASSESSMENT_RESOURCE = HOLD:测评含 questionnaire/scoring/interpretation/risk implications,非天然 Content/Practice;V1 不支持;是否作第九类/工具型 capability/外部资源,后续单独评审(现不硬塞八型)。
```

## 11. ARCHITECTURE GATE(ARCH-001 自有;全 PASS 才可 runtime 授权;不借 §22/§27)

```text
M1 GROWTH_NEED_READY
  NEED_SIGNAL_NON_CANONICAL = PASS   INTENT_EXPLICIT_CONFIRMATION = PASS   GROWTH_PRIORITY_OPTIONAL = PASS
M2 RESOURCE_NETWORK_READY
  RESOURCE_OFFER_ATOMIC = PASS   CAPABILITY_CARDINALITY = PASS   PROVIDER_QUALIFICATION_LINK = PASS
  ELIGIBILITY_FAIL_CLOSED = PASS   NO_ACTION_SUPPORTED = PASS   EXTERNAL_REFERRAL_SUPPORTED = PASS
M3 ORCHESTRATION_READY
  RECOMMENDATION_NE_DECISION = PASS   FAMILY_DECISION_BOUNDARY = PASS   PLAN_NE_EXECUTION = PASS
  ORCHESTRATION_PLAN_DECLARATIVE = PASS   PLATFORM_REVENUE_RANKING_SIGNAL = 0
M4 SERVICE_CONTINUITY_READY
  SERVICE_CASE_OWNS_EXECUTION = PASS   CASE_CLOSED_NE_RESOLVED = PASS   FOLLOWUP_NE_OBSERVATION = PASS   HUMAN_ESCALATION_DESIGNED = PASS
M5 CONTEXT_REUSE_READY
  CONTEXT_REUSE_PROJECTION = PASS   NO_CAUSAL_REUSE_CLAIM = PASS   REPEAT_EXPLANATION_REDUCTION = DESIGNED
GLOBAL
  CHILD_INTEREST_FIRST = PASS   FAMILY_SOVEREIGN = PASS   CANONICAL_DUPLICATION = 0   AI_DIAGNOSIS = 0
  ML_RANKING = 0   MARKETPLACE = 0   PAYMENT = 0   COMMISSION = 0   RUNTIME_STARTED = 0
```
本 Gate 未全 PASS 前:`RUNTIME_AUTHORIZATION = NO`。文档"大致完成"不得替代 Gate。

## 12. HOLD(本阶段严格不做)

Demand Network / 匿名聚合 runtime · ML ranking · Marketplace · Payment · Commission · Settlement · Provider bidding · PR#34 Commerce Runtime · Enrollment/Delivery Runtime · Orchestration Runtime · ServiceCase Runtime · ASSESSMENT_RESOURCE。任何 runtime 须过 §11 Gate + 独立 per-phase 授权。`ORCHESTRATION_RUNTIME_STARTED = NO`。

## 13. 与 PR#32 对账(forward,非原样合入)

PR#32 A–H = reference 输入。本 ARCH V1 增补:V3 命名统一 · 补 GrowthCapability/OrchestrationPlan · **ResourceOffer 原子化** · **FamilyServiceDecision 边界** · **Plan≠Execution 状态分离** · **Follow-up 真相分类** · **Capability cardinality** · **Provider Qualification 连接** · **ContextReuseProjection(M5)** · **Intent CLOSED+close_reason** · Assessment HOLD · NeedSignal source 收敛 · 两 Gate 分离 · Priority 可选 · Revenue 非排序 · 禁 Closed≠Resolved 混淆 · 自有 Architecture Gate。以本文件为 Phase1 架构 SSOT。
