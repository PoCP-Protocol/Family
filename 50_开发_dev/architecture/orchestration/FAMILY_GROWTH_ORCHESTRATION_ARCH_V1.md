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
   offer_id, resource_type(**恰好一个**:NO_ACTION|CONTENT|PRACTICE|AI_COACH|PROGRAM|HUMAN_COACH|QUALIFIED_EXPERT|EXTERNAL_REFERRAL),
   qualification_mode(REQUIRED|NOT_APPLICABLE|EXTERNAL_REFERRAL_POLICY;见 §4),
   provider_ref?,                 # 条件字段:仅 qualification_mode=REQUIRED 时必填
   external_referral_target_ref?, # 条件字段:仅 EXTERNAL_REFERRAL_POLICY 时使用
   supports_capability_keys[](1..N), age_scope, need_scope, evidence_refs[], risk_boundary,
   privacy_class, effort, duration, availability, cost_class, requires_human, requires_consent
   provider_ref/资格 规则:
     A REQUIRED(AI_COACH/CONTENT/PRACTICE/PROGRAM/HUMAN_COACH/QUALIFIED_EXPERT):provider_ref 必填;provider qualification 在 eligibility 评估与执行复验时都 MUST=ACTIVE。
     B NOT_APPLICABLE(NO_ACTION):provider_ref=null;**不得为满足 schema 伪造 SYSTEM Provider**。
     C EXTERNAL_REFERRAL_POLICY(EXTERNAL_REFERRAL):provider_ref 可 null,用 external_referral_target_ref;**不强迫转介对象先成为平台 Provider**;仍过 safety/scope/risk/referral-quality/consent。
   不变量:**ResourceOffer ≠ Solution Bundle**(组合是 OrchestrationPlan 的职责);**PLATFORM_MEMBERSHIP ≠ REFERRAL_ELIGIBILITY**;NO_ACTION 是一等 Offer;cost 仅分级、无真实支付;八型封闭,ASSESSMENT=HOLD(见 §10)。

⑤ ResourceRecommendation  Recommendation ≠ Decision ≠ Orchestration(可对 eligible Offer 确定性【排序】,但【不编排执行】)
   recommendation_id, intent_id, version,
   candidates[]{ offer_ref, covered_capability_keys[], why_this, limitations[], rank },   # rank=确定性排序,非执行顺序
   recommended_offer_refs[], required_capability_keys[], covered_capability_keys[], uncovered_capability_keys[], why_now,
   status(PROPOSED|SHOWN|SUPERSEDED|EXPIRED)   # 仅描述推荐自身生命周期
   MAY:对 eligible candidate Offers 做确定性排序(rank)· 推荐 1..N 原子 Offer · 解释 why_this/why_now/limitations · 描述 capability coverage。
   MUST NOT:定义执行顺序 / 时间 / 触发 / 条件服务路径 / 启动服务。
   不变量:**RANKING ≠ ORCHESTRATION**(Recommendation 答"推荐哪些 eligible 资源";OrchestrationPlan 答"已接受资源如何/何时/以何顺序/在何条件下使用");可解释规则产生(禁 ML/黑盒);**不含 ACCEPTED/ALTERNATIVE_SELECTED**(那是 Family Decision);Resource Fit 以 covered/uncovered capabilities 可解释。无 RecommendationSet 聚合,不新增核心对象。

〔边界/事件〕FamilyServiceDecision  【家庭决定边界,非核心 Aggregate】(Recommendation → Decision 的可审计边界)
   decision_id, family_id, subject_person_id, intent_id, recommendation_ref, recommendation_version, decision_type, selected_offer_refs[], actor_person_id, decided_at
   选择完整性(禁注入任意 offer):
     ACCEPT_RECOMMENDATION → selected_offer_refs == 该 recommendation version 的 recommended_offer_refs;
     SELECT_ALTERNATIVE → selected_offer_refs 为 recommendation.candidates[].offer_ref 的非空子集(否则须先生成新 Recommendation);
     DISMISS → selected_offer_refs = []。
   不变量:家庭决定是独立可审计真相,不是 Recommendation 的状态;**必须可追溯到其响应的 exact Recommendation version/snapshot**;需家庭决定处,无有效 Decision 不得启动服务。**CORE_OBJECTS=8,DECISION_BOUNDARY=1(本条不计入八核心)。**

⑥ OrchestrationPlan      【声明式期望路径】desired path,不拥有执行真相
   plan_id, intent_id, family_id, subject_person_id, version, accepted_by_decision_ref,
   steps[]{ step_no, capability_keys[](1..N), offer_ref, covered_capability_keys[], trigger(NOW|AFTER_PREV|SCHEDULED|CONDITIONAL), condition(repeated≥N|complex|risk|out_of_scope) },
   status(DRAFT|PROPOSED|ACCEPTED|SUPERSEDED)   # 仅 proposal/version 生命周期
   步骤基数:**一个 plan step 可覆盖 1..N GrowthCapability**(不为多能力重复同一 step);须保留可解释性:此步 accepted offer 覆盖哪些 required capability。
   不变量:**不含 ACTIVE/COMPLETED;step 不含执行状态**(执行真相归 ServiceCase);V1 不做通用 workflow DSL(仅上述有限条件路径)。Plan 回答"计划是什么",不回答"执行到哪"。

⑦ ServiceCase           【实际执行真相】actual service execution(Family Steward 拥有)
   case_id, family_id, subject_person_id, intent_id, plan_ref,
   status(OPEN|ASSIGNED|IN_PROGRESS|WAITING_FAMILY|ESCALATED|COMPLETED|CANCELLED),
   owner, opened_at, next_action_at, sla_class, escalation_level, closed_at
   不变量:仅家庭 Decision 后创建;固定枚举生命周期;**Plan accepted ≠ Service started;Plan superseded ≠ Service cancelled;ServiceCase COMPLETED/Closed ≠ 问题 Resolved ≠ Growth Outcome。**

⑧ ServiceContribution   记录贡献(不分钱)
   case_id, provider_ref, role(AI_COACH|DELIVERY_ASSISTANT|GROWTH_COACH|QUALIFIED_EXPERT|CONTENT_PROVIDER|PROGRAM_PROVIDER|STEWARD),
   task_ref, started_at, completed_at, quality_state
   不变量:无 compensation/commission/payment split(结算属 M8);仅记录"谁在此 case 贡献了什么"。

回访真相(见 §7)FollowUpResponse 与复用投影(见 §9)ContextReuseProjection 为服务层只读派生,非 canonical。
只读投影:GrowthPriority / active Intervention / recent OutcomeObservation(经授权只读,不写、不复制真相);DemandCluster=未来只读匿名聚合,非核心 transaction object。
```

## 3. 主链

```text
GrowthNeedSignal → GrowthIntent → required GrowthCapabilities(1..N) → Candidate ResourceOffers(原子)
→ [Resource Eligibility Gate] → Eligible ResourceOffers → Growth Fiduciary Ranking → ResourceRecommendation(coverage)
→ FamilyServiceDecision → OrchestrationPlan(声明) → ServiceCase(执行)
→ Follow-up → FollowUpResponse(含 helpfulness) →(真相分类)→ [仅合格者] Growth OS Named Action → Observation → 第二次:ContextReuseProjection
```
顺序不变量:**Eligibility 评估的是"某 Offer 对此家庭此刻是否合格",必须在 Candidate Offers 存在之后**;没有候选就没有评估对象(CANDIDATE_BEFORE_ELIGIBILITY)。

## 4. 两个 Gate + 连接点

```text
A. Provider Qualification Gate(入网层,source of truth):qualification_state ∈ {ACTIVE|SUSPENDED|EXPIRED|REVOKED}
   —— 审 Qualification/Capability/Scope/RiskBoundary/ServiceQuality。产出 Provider 是否可发布 ResourceOffer。
B. Resource Eligibility Gate(编排层,每次针对某家庭此刻,FAIL CLOSED):consent/privacy/safety/professional_scope/risk_boundary/age_scope/availability
   —— **不重审 Provider 证照**,但按 Offer 的 `qualification_mode` 处理上游 provider_qualification_state:
   `REQUIRED`(AI_COACH/CONTENT/PRACTICE/PROGRAM/HUMAN_COACH/QUALIFIED_EXPERT)→ 必须 == ACTIVE,否则 INELIGIBLE;
   `NOT_APPLICABLE`(NO_ACTION)→ 无 Provider,不判资格;
   `EXTERNAL_REFERRAL_POLICY`(EXTERNAL_REFERRAL)→ 仍过 safety/scope/risk/referral-quality,但**外部转介对象无需先成为平台 Provider**(Growth Fiduciary 高于平台网络成员资格,否则会因"未入网"无法转介更合适的外部专业资源)。
连接:Provider Qualification = source of truth;Resource Eligibility = consumer of current qualification state。
```
仅 eligible Offer 进入 **Growth Fiduciary Ranking**(蓝图 §4):child_growth_interest > confirmed_family_intent > resource_fit > evidence > past_context > family_preference > user_burden > cost。
**Platform Revenue = NOT_A_RANKING_SIGNAL(根本不参与)。** 必须支持 NO_ACTION / FREE_RESOURCE / EXTERNAL_REFERRAL。

### 4b. 执行时 Eligibility 复验(最高安全不变量)+ 可追溯

**家庭 Decision 不永久授权执行。** 在 Recommendation(T1)→ Decision → Plan → ServiceCase 执行(T2)之间,时变资格可能改变。
ServiceCase 执行某 selected Offer **前**,MUST 复验(FAIL CLOSED):active consent · safety/risk route · provider qualification(REQUIRED 时 ==ACTIVE)· resource availability · age/scope · professional/risk boundary。
```text
不变量:FAMILY_DECISION ≠ ELIGIBILITY_BYPASS;RECOMMENDATION_ELIGIBLE_AT_T1 ≠ EXECUTION_ELIGIBLE_AT_T2。
若 selected Offer 在 T2 变 INELIGIBLE:不得执行、【不得静默替换】其他资源;仅允许显式安全出口 RE_RECOMMEND_REQUIRED / NO_ACTION / EXTERNAL_REFERRAL;
  服务路径实质变化时,家庭须重新决定。
可追溯(仅最小语义 ref,不建大审计引擎、不复制 canonical 真相):eligibility_evaluation_ref · evaluated_at · policy_version;
  足以回答"推荐时为何 eligible(T1)"与"执行开始时是否仍 eligible(T2)"。
```

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
FollowUpResponse 字段: response_ref(原话/勾选) · helpfulness(HELPFUL|SOMEWHAT_HELPFUL|NOT_HELPFUL_YET|UNANSWERED) · truth_class(PERSPECTIVE|SERVICE_NOTE|OBSERVATION_CANDIDATE)
仅 OBSERVATION_CANDIDATE 且满足[既有 Growth OS observation contract + observer 合法 + subject 匹配 + consent] → 经既有 Named Action(RecordOutcomeObservation)→ Observation
```
不变量:`FollowUpResponse ≠ Observation`;`Check-in ≠ Observation`;服务层绝不直接写 Growth Truth。例:"感觉好一点" 首先只是 Perspective/Service Note。
**Helpfulness(user-perceived)**:`Helpfulness ≠ Observation ≠ GrowthOutcome ≠ intervention efficacy ≠ causality`;它是 North Star HGSLR 末端"family helpfulness signal",最低摩擦采集。ContextReuseProjection 读取 prior helpfulness **仅作家庭主观服务价值**,绝不作"方法有效"之证据。

## 8. 唯一黄金旅程(每箭头标 input/output/owner/write-boundary)

```text
家长:"孩子刚摔门,我今晚不知道怎么重新开口"
  → GrowthNeedSignal   [in: 家长文本/Principal · out: signal(NON_CANONICAL) · owner: Orchestration · write: 服务层,canonical=false]
  → GrowthIntent 确认   [in: signal + 家长显式确认 · out: intent(OPEN) · owner: Orchestration · write: 服务层;需家长确认]
  → 必需 Capability: DE_ESCALATION + COMMUNICATION_REOPENING   [in: intent · out: required_capability_keys[2] · owner: Capability Engine · write: 无(声明)]
  → Candidate ResourceOffers(原子): OFFER_A(AI_COACH) · OFFER_B(PRACTICE) [· OFFER_C(PROGRAM) 条件]   [owner: Resource Network · write: 无]
  → Resource Eligibility 评估 @T1(按 qualification_mode:A REQUIRED→ACTIVE;consent/age_scope/safety;记 eligibility_evaluation_ref/evaluated_at/policy_version)   [out: eligible set 或 INELIGIBLE · owner: Eligibility Gate · write: 无]
  → Growth Fiduciary Ranking(确定性,rank≠执行顺序)→ ResourceRecommendation(candidates:A→COMMUNICATION_REOPENING, B→DE_ESCALATION;recommended=[A,B];why_this/why_now/limitations)   [status: SHOWN · owner: Orchestration · write: 服务层]
  → FamilyServiceDecision(ACCEPT_RECOMMENDATION;selected==recommended=[A,B];追溯 recommendation_version)   [in: recommendation + 家庭 · out: decision · owner: Family · write: 决定边界,可审计]
  → OrchestrationPlan(声明: A now → B tonight → FOLLOWUP tomorrow; IF repeated → C)   [status: ACCEPTED · owner: Orchestration · write: 声明,无执行真相]
  → Eligibility 复验 @T2(执行前重判 consent/safety/qualification/availability/scope;FAIL CLOSED;变 INELIGIBLE→RE_RECOMMEND/NO_ACTION/EXTERNAL_REFERRAL,不静默替换)   [owner: Eligibility Gate · write: 无]
  → ServiceCase(OPEN→IN_PROGRESS)   [owner: Family Steward · write: 执行真相]
  → AI service(复用 Principal) → Practice(仅当有 approved Content Ref 才交付,否则该 Offer INELIGIBLE/省略)
  → Follow-up(24h) → FollowUpResponse(helpfulness=SOMEWHAT_HELPFUL, "感觉好一点")   [owner: 服务层 · write: 服务层,非 Growth Truth]
  → 真相分类 → (若合格) Growth OS Named Action → Observation(可选)   [owner: Growth OS · write: canonical,经既有边界]
  → 第二次同类需求 → ContextReuseProjection(只读;含 prior helpfulness 仅作主观价值)   [owner: Orchestration · write: 无]
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
PRACTICE 内容安全:`PRACTICE_EXECUTION_REQUIRES_APPROVED_CONTENT_REF = PASS` —— runtime 若无 approved Content Ref,则 PRACTICE Offer 省略或 INELIGIBLE;**绝不在 Orchestration Runtime 内臆造 communication21 内容**;PR#35 不建 Content Engine。
```

## 11. ARCHITECTURE GATE(ARCH-001 自有;全 PASS 才可 runtime 授权;不借 §22/§27)

```text
M1 GROWTH_NEED_READY
  NEED_SIGNAL_NON_CANONICAL = PASS   INTENT_EXPLICIT_CONFIRMATION = PASS   GROWTH_PRIORITY_OPTIONAL = PASS
M2 RESOURCE_NETWORK_READY
  RESOURCE_OFFER_ATOMIC = PASS   CAPABILITY_CARDINALITY = PASS   PROVIDER_QUALIFICATION_LINK = PASS
  QUALIFICATION_APPLICABILITY = PASS   CANDIDATE_BEFORE_ELIGIBILITY = PASS   ELIGIBILITY_FAIL_CLOSED = PASS
  NO_ACTION_SUPPORTED = PASS   EXTERNAL_REFERRAL_SUPPORTED = PASS   CORE_OBJECT_COUNT = 8
M3 ORCHESTRATION_READY
  RECOMMENDATION_NE_DECISION = PASS   RECOMMENDATION_CARDINALITY = PASS   RECOMMENDATION_NE_PLAN = PASS
  RECOMMENDATION_RANKING_NE_EXECUTION_ORDER = PASS   PROVIDER_REF_CONDITIONALITY = PASS   PLAN_CAPABILITY_CARDINALITY = PASS
  DECISION_SELECTION_INTEGRITY = PASS   EXECUTION_ELIGIBILITY_REVALIDATION = PASS   ELIGIBILITY_TRACEABILITY = PASS
  FAMILY_DECISION_BOUNDARY = PASS   PLAN_NE_EXECUTION = PASS   ORCHESTRATION_PLAN_DECLARATIVE = PASS   PLATFORM_REVENUE_RANKING_SIGNAL = 0
M4 SERVICE_CONTINUITY_READY
  SERVICE_CASE_OWNS_EXECUTION = PASS   CASE_CLOSED_NE_RESOLVED = PASS   FOLLOWUP_NE_OBSERVATION = PASS   HUMAN_ESCALATION_DESIGNED = PASS
M5 CONTEXT_REUSE_READY
  CONTEXT_REUSE_PROJECTION = PASS   NO_CAUSAL_REUSE_CLAIM = PASS   REPEAT_EXPLANATION_REDUCTION = DESIGNED
  HELPFULNESS_SIGNAL_DEFINED = PASS   HELPFULNESS_NE_GROWTH_OUTCOME = PASS
GLOBAL
  CHILD_INTEREST_FIRST = PASS   FAMILY_SOVEREIGN = PASS   CANONICAL_DUPLICATION = 0   AI_DIAGNOSIS = 0
  ML_RANKING = 0   MARKETPLACE = 0   PAYMENT = 0   COMMISSION = 0   RUNTIME_STARTED = 0   SEMANTIC_ALIASING = 0
  PROGRAM_STATUS_NO_COMPETING_GATE = PASS
CODE_READINESS(与 master 实际代码对齐,见 §14)
  ONBOARDING_REBASE_REQUIRED = ACKNOWLEDGED   HOME_REBASE_REQUIRED = ACKNOWLEDGED   PRINCIPAL_ADAPTER_BOUNDARY = PASS
  GROWTH_OS_WRITE_BOUNDARY = PASS   MODULE_TOPOLOGY = PASS   CONTRACT_LOCATION = PASS   MIGRATION_BOUNDARY = PASS
```
本 Gate 未全 PASS 前:`RUNTIME_AUTHORIZATION = NO`。文档"大致完成"不得替代 Gate。

## 12. HOLD(本阶段严格不做)

Demand Network / 匿名聚合 runtime · ML ranking · Marketplace · Payment · Commission · Settlement · Provider bidding · PR#34 Commerce Runtime · Enrollment/Delivery Runtime · Orchestration Runtime · ServiceCase Runtime · ASSESSMENT_RESOURCE。任何 runtime 须过 §11 Gate + 独立 per-phase 授权。`ORCHESTRATION_RUNTIME_STARTED = NO`。

## 13. 与 PR#32 对账(forward,非原样合入)

PR#32 A–H = reference 输入。本 ARCH V1 增补:V3 命名统一 · 补 GrowthCapability/OrchestrationPlan · **ResourceOffer 原子化** · **FamilyServiceDecision 边界** · **Plan≠Execution 状态分离** · **Follow-up 真相分类** · **Capability cardinality** · **Provider Qualification 连接** · **ContextReuseProjection(M5)** · **Intent CLOSED+close_reason** · Assessment HOLD · NeedSignal source 收敛 · 两 Gate 分离 · Priority 可选 · Revenue 非排序 · 禁 Closed≠Resolved 混淆 · 自有 Architecture Gate。以本文件为 Phase1 架构 SSOT。

---

# 代码现实对齐(CODE-REALITY-FINAL-CLOSEOUT)

首个 runtime 前的最终架构收尾。**以 master 实际代码为实现真相**,显式对账既有代码与 V3(非复述抽象)。以下事实经核验 master @ 2aa6da6。

## 14. CURRENT_CODE_REALITY(已核验)

```text
A. apps/api/src/modules/family/onboarding.service.ts —— ORDER 强制:
   create_family → add_child → assign_life_stage → grant_consent → growth_onboarding → confirm_priority → enter_today
   (complete 判据含 grant_consent;当前把 growth_onboarding/confirm_priority 作为进入产品前置)。
B. apps/web/src/platform/onboarding/onboarding-flow.ts —— screenFor 含同一强制成长路径:
   growth_onboarding「此刻最困扰的亲子沟通问题」→ confirm_priority「确认成长重点」→ enter_today。
C. apps/web/src/platform/today/today-view.ts —— PRIMARY_NAV = ['today','growth','principal','family'](Principal 仍一级);
   Today 卡片围绕 今天 One Small Action(today_action)+ Check-in + principalFollowup 组织。
D. apps/api/src/modules/family/today.service.ts —— TodayService 依赖 GrowthActionService.getTodayAction;currentFocus 目前=null(注明需 onboarding 上下文)。
E. apps/api/src/modules/principal/principal.service.ts —— handleMessage(可复用为 AI_COACH 交付能力)。
F. 同文件 acceptProposal(params: { onboarding_id, priority_id, idempotency_key }) → 桥接 intervention.startIntervention(...)
   = LEGACY Growth-Intervention Bridge;【不得】成为新 V3 FamilyServiceDecision/Orchestration 路径。
G. apps/api/src/modules/family/growth-review.service.ts —— recordOutcomeObservation 必须 getEpisode(intervention_episode_id),
   并经 episode.onboarding_id/priority_id + assertNormalSafetyRoute + review 门。⇒ FollowUpResponse ≠ Observation;不得直插 outcome_observations、不得伪造 episode_id。
H. packages/contracts/src/index.ts —— 主要为旧 Family Core/GrowthOnboarding/Consent/Perspective/Safety 等契约;
   【禁】把旧类型伪装为 GrowthNeedSignal/GrowthIntent/ResourceRecommendation/OrchestrationPlan/ServiceCase 的别名。
I. database/migrations 止于 0019;尚无 V3 Orchestration 域表。
```

## 15. LEGACY vs V3 边界(冻结)

```text
LEGACY / 既有能力(保留、非删除,但【不再】是求助的强制入口路径):
  GrowthOnboarding · GrowthPriority · Intervention · GrowthAction · GrowthReview · Principal Action Bridge · Today
NEW V3 路径:
  Home → GrowthNeedSignal → GrowthIntent → GrowthCapability → Resource → Recommendation → FamilyServiceDecision → OrchestrationPlan → ServiceCase
GrowthPriority 仍 OPTIONAL;既有 Growth OS 仅当 V3 服务合法跨越"human-confirmed Growth OS 边界"时才被调用。
真实生活出问题 → Family 先帮助 →(必要时才)进入 Growth OS;【不是】先建 GrowthPriority 才能得到帮助。
```

## 16. Runtime 目标态(仅架构,PR#35 不写代码)

```text
① Onboarding 目标态:仅建最小家庭上下文 —— Account/Family/Child/Relationship(必要时)/Required Consent;
   LifeStage 可作为 12–15 纵切的轻量 child context 捕获,但【不得】强制 GrowthPriority。
   移出强制目标:growth_onboarding、confirm_priority。最小设置后 ENTER_HOME(非 ENTER_TODAY)。不变量 FIRST_VALUE_BEFORE_GROWTH_PRIORITY=PASS。
② Home 目标态:PRIMARY_NAV = HOME/GROWTH/SERVICE/FAMILY;Principal=嵌入 AI 资源(非一级);Today=Home 的一种只读状态投影(非平台身份)。
   Home 主问句"现在有什么需要 Family 帮忙的吗?";可显示 当前孩子/进行中服务/一个下一步/近期 context reuse,但【不得】要求 active GrowthPriority。
③ Principal adapter 边界:handleMessage 适配为 AI_COACH Resource Provider,既有安全(Consent/Policy/Provider Gate/Safety/Human Gate/quality/fail-closed)不变、不重写、不绕过;
   acceptProposal() ≠ FamilyServiceDecision ≠ Orchestration 接纳(保留为 legacy bridge);新 Orchestrator 即时沟通支持【不得】要求 onboarding_id/priority_id。
④ Follow-up/Growth OS 写边界:Follow-up → FollowUpResponse(服务层)→ 分类 {PERSPECTIVE|SERVICE_NOTE|OBSERVATION_CANDIDATE};
   仅 OBSERVATION_CANDIDATE 且过既有 Named Action/subject/observer/consent/safety 门才 RecordOutcomeObservation;禁服务层直插 outcome_observations、禁伪造 intervention_episode_id。
⑤ 模块拓扑:新建 apps/api/src/modules/orchestration/(OrchestrationModule/Controller/Service/Repository),AppModule 导入;
   【不得】塞进既有巨大 FamilyService、【不得】让 FamilyModule 拥有 Orchestration;避免环依赖(PrincipalModule 已依赖 FamilyModule,不得反向让 FamilyModule 导入 OrchestrationModule)。
   角色:Family Core/Growth OS=既有真相提供者;Principal=AI 资源;Program Runtime=Program 资源;Orchestration=协调域。
⑥ 契约位置:V3 runtime 契约入 @family/contracts 的独立 orchestration section;CANONICAL_DUPLICATION=0、SEMANTIC_ALIASING=0
   (禁 GrowthNeedSignal=GrowthOnboarding / GrowthIntent=GrowthPriority / ServiceCase=InterventionEpisode / FamilyServiceDecision=PrincipalProposal)。
⑦ 数据库边界:PR#35【不得】建 migration 0020;Gate PASS 后首个 runtime 才提 0020_growth_orchestration_v1.sql(仅纵切最小表);
   【不得】复用 growth_onboardings/growth_priorities/intervention_episodes 存 V3 Need/Intent/Plan/Case(语义正确性 > schema 复用)。
```

## 17. 首个 Runtime 纵切(冻结 scope,PR#35 不实现)

```text
任务名:FAMILY-GROWTH-VERTICAL-SLICE-001(THIN END-TO-END,非"仅 M1 基础设施";必须证明有用的服务)。
唯一场景:12–15 · PARENT_CHILD_COMMUNICATION_CONFLICT · "孩子刚摔门,我今晚不知道怎么重新开口。"
须最终证明:HOME → NeedSignal → 显式 Intent 确认 → Capability → 原子 eligible ResourceOffers → 确定性 Recommendation
  → FamilyServiceDecision → 声明式 OrchestrationPlan → ServiceCase → AI_COACH/PRACTICE → Follow-up → FollowUpResponse → 第二次同类 Context Reuse。
Observation 可选;不强制 GrowthPriority;不强制 Intervention。
V1 资源集:NO_ACTION · AI_COACH · PRACTICE · EXTERNAL_REFERRAL;PROGRAM 可注册但条件化/非默认;
  HUMAN_COACH/QUALIFIED_EXPERT 可经既有 Human Gate 概念路由,但不建 marketplace/provider runtime;CONTENT 仅当有真实 Content Ref 才用,绝不臆造内容。
确定性 only:无 ML ranking、无 embeddings 排序、无 LLM 选商业资源、无 revenue signal;need_type 仅 PARENT_CHILD_COMMUNICATION_CONFLICT;
  capabilities 仅 {DE_ESCALATION, COMMUNICATION_REOPENING};排序=确定性可检视规则;PLATFORM_REVENUE_RANKING_SIGNAL=0。
```

## 18. DO NOT IMPLEMENT(PR#35)

```text
RUNTIME_STARTED = 0。PR#35 不改:apps/api runtime · apps/web runtime · database migrations · @family/contracts runtime types。不动 PR#34。不启动 Vertical Slice。
```
