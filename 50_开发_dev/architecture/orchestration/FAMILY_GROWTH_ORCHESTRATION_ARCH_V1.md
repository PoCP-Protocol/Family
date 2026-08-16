# FAMILY GROWTH ORCHESTRATION —— ARCH V1(Phase 1 架构契约 SSOT)

```text
DOC_KIND = PHASE1_ARCHITECTURE_CONTRACT(架构层;字段/状态/不变量/边界/黄金旅程,非迁移、非 runtime)
TASK     = FAMILY-GROWTH-ORCHESTRATION-ARCH-001
PARENT   = architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md(最高战略 SSOT;本文件不得与之冲突)
REFERENCE= architecture/allocation/{A..H}(PR#32,EARLY PHASE1 ARCH REFERENCE)——forward 输入,非原样 SSOT
BASE     = master @ 2aa6da6(含 V3 Blueprint + @family/program-runtime)
状态      = DRAFT;RUNTIME = HOLD;须过 §22/§27 Architecture Gate 才可写 runtime;AUTO_MERGE = NO
```

## 0. 目标(单家庭价值闭环的架构验证)

冻结 M1–M5 的**服务编排契约**:证明「一个家庭提出一个真实成长需求后,Family 能正确理解 → 判断能力 → 找到合适资源 → 形成路径 → 完成服务 → 回访 → 下一次复用上下文」。
本阶段**不讨论平台定位,不搭外围能力**,只把这条链做到:语义无漏洞、产品可感知、技术可实现。

## 1. 八个核心对象(V3 canonical 命名,统一 PR#32 旧命名)

命名迁移:`NeedSignal→GrowthNeedSignal · ServiceIntent→GrowthIntent · ServiceCandidate→ResourceOffer · ServiceRecommendation→ResourceRecommendation`;
**新增两个 PR#32 缺失的平台级对象:`GrowthCapability`(需求↔供给解耦)、`OrchestrationPlan`(有序/条件服务路径,≠Recommendation)。**

```text
① GrowthNeedSignal      NON_CANONICAL 推断
   signal_id, family_id, subject_person_id, source(WAF|PRINCIPAL|ONBOARDING|MANUAL),
   raw_ref(指来源,不复制原文), inferred_need_type, confidence(0–1), created_at
   不变量:canonical_family_fact=false;无诊断/标签;不写 Growth 真相;≠Fact≠Priority。

② GrowthIntent          NON_CANONICAL 服务请求(家长显式确认后才存在)
   intent_id, family_id, subject_person_id, need_type, goal_text(家长自述),
   status(OPEN|FULFILLED|CANCELLED), confirmed_by, confirmed_at
   不变量:≠GrowthPriority、≠Family Fact、≠诊断。GrowthPriority 可选(见 §3),非本链前置。

③ GrowthCapability      能力抽象层(需求↔供给解耦)【新增】
   capability_key(如 DE_ESCALATION|COMMUNICATION_REOPENING|BOUNDARY_NEGOTIATION|PARENT_SELF_REGULATION),
   description_ref, age_scope, need_scope, risk_class, evidence_expectation
   不变量:Capability 是"需要什么能力"的声明,不绑定任何具体资源;同一 capability 可由多类 ResourceOffer 满足(资源可替换性/第三方互操作前提)。禁 Need→直接推荐一个 Product。

④ ResourceOffer         供给统一描述(带"能力身份证")
   offer_id, provider_ref, type(NO_ACTION|CONTENT|PRACTICE|AI_COACH|PROGRAM|HUMAN_COACH|QUALIFIED_EXPERT|EXTERNAL_REFERRAL),
   capabilities[](指向 capability_key), age_scope, need_scope, evidence_refs[], risk_boundary,
   privacy_class, effort, duration, availability, cost_class, requires_human, requires_consent
   不变量:NO_ACTION 是一等 Offer;cost 仅分级、无真实支付;八型封闭(测评=CONTENT/PRACTICE 的实现,非第九类)。

⑤ ResourceRecommendation  Recommendation ≠ Decision ≠ Orchestration
   recommendation_id, intent_id, capability_key, offer_id, why_this, why_now, limitations, alternatives[](≤2),
   status(SHOWN|ACCEPTED|ALTERNATIVE_SELECTED|DISMISSED)
   不变量:可解释规则产生(禁 ML/黑盒);不自动决策、不自动启动服务。

⑥ OrchestrationPlan      有序/条件化服务路径【新增】(家庭确认后)
   plan_id, intent_id, family_id, subject_person_id,
   steps[]{ step_no, capability_key, offer_ref, trigger(NOW|AFTER_PREV|SCHEDULED|CONDITIONAL),
            condition(如 repeated≥N|complex|risk|out_of_scope), status },
   status(PROPOSED|ACCEPTED|ACTIVE|COMPLETED|ABANDONED)
   例:AI_COACH now → PRACTICE tonight → FOLLOWUP tomorrow;IF repeated→PROGRAM;IF complex→HUMAN;IF out-of-scope→EXTERNAL_REFERRAL。
   不变量:V1 不做通用 workflow DSL(仅上述有限条件路径);Plan 是"路径 Truth",Recommendation 只是"哪个合适"。

⑦ ServiceCase           家庭选择后创建(Family Steward 拥有状态)
   case_id, family_id, subject_person_id, intent_id, plan_ref,
   status(OPEN|ASSIGNED|IN_PROGRESS|WAITING_FAMILY|COMPLETED|ESCALATED|CANCELLED),
   owner, opened_at, next_action_at, sla_class, escalation_level, closed_at
   不变量:仅家庭显式选择创建;固定枚举生命周期(非通用 workflow 引擎)。
   **ServiceCase COMPLETED/Closed ≠ 家庭问题 Resolved ≠ Growth Outcome。**

⑧ ServiceContribution   记录贡献(不分钱)
   case_id, provider_ref, role(AI_COACH|DELIVERY_ASSISTANT|GROWTH_COACH|QUALIFIED_EXPERT|CONTENT_PROVIDER|PROGRAM_PROVIDER|STEWARD),
   task_ref, started_at, completed_at, quality_state
   不变量:无 compensation/commission/payment split(结算属未来 M8);仅记录"谁在此 case 贡献了什么"。

只读投影:GrowthPriority / active Intervention / recent OutcomeObservation(经授权只读,不写、不复制真相);DemandCluster=未来只读匿名聚合(count<阈值→NO_CLUSTER_EXPOSURE),非核心 transaction object。
```

## 2. 主链

```text
GrowthNeedSignal → GrowthIntent → GrowthCapability → [Resource Eligibility Gate] → ResourceOffer → ResourceRecommendation
→ (Family Decision) → OrchestrationPlan → ServiceCase → ServiceContribution → Growth OS(Observation/Review)→ Family Growth Context → 下一次更好
```

## 3. 两个 Gate 必须分开(不得混用)

```text
A. Provider Qualification Gate(入网层,一次性/周期性):回答"这个 Provider 有没有资格进入 Resource Network"
   —— Qualification / Capability / Scope / RiskBoundary / ServiceQuality。产出:Provider 是否可发布 ResourceOffer。
B. Resource Eligibility Gate(编排层,每次针对某家庭此刻,FAIL CLOSED):回答"此刻是否允许这个家庭使用这个 Resource"
   —— consent / privacy / safety / professional_scope / risk_boundary / age_scope / availability。任一不过=INELIGIBLE,根本不进候选。
```
仅 eligible Offer 进入 **Growth Fiduciary Ranking**(蓝图 §4):child_growth_interest > confirmed_family_intent > resource_fit > evidence > past_context > family_preference > user_burden > cost。
**Platform Revenue = NOT_A_RANKING_SIGNAL(根本不参与)。** 必须支持 NO_ACTION / FREE_RESOURCE / EXTERNAL_REFERRAL。
**GrowthPriority 可选**(蓝图 §2d):`GrowthIntent ≠ GrowthPriority`;GrowthPriority = OPTIONAL / Growth-OS-owned / family-confirmed,**不是本链前置**;Intent 可事后可选 inform 一条 Priority。

## 4. 唯一黄金旅程(用于验证对象关系)

```text
"孩子刚摔门,我今晚不知道怎么重新开口"
  → GrowthNeedSignal(source=PRINCIPAL|MANUAL, need_type=PARENT_CHILD_COMMUNICATION_CONFLICT, canonical=false)
  → 家长确认 GrowthIntent(goal_text="今晚怎么重新开口", status=OPEN)
  → GrowthCapability(DE_ESCALATION, COMMUNICATION_REOPENING)
  → Resource Eligibility Gate(consent/age_scope/safety … pass)
  → ResourceOffer(AI_COACH 免费即时 + PRACTICE 今晚 + …)
  → ResourceRecommendation(why_this/why_now,可解释;NO_ACTION 亦可为首选)
  → Family Decision("开始")
  → OrchestrationPlan(AI_COACH now → PRACTICE tonight → FOLLOWUP tomorrow;IF repeated→PROGRAM)
  → ServiceCase(OPEN→IN_PROGRESS;Steward 持有)
  → Follow-up(24h)
  → Observation(Growth OS,家庭真相层)
  → 第二次同类需求:Context Reuse(不从零解释)
```
每个箭头都是可断言的对象转换;此旅程即 M1–M5 的验收脚本(架构层)。

## 5. 与既有技术的接线(读,不复制真相)

```text
family_id/subject_person_id → Family Core(persons/families)只读。
AI_COACH 交付 → 复用 Principal(handleMessage / Human Gate),不新建 AI。
PROGRAM Offer → @family/program-runtime(schedule/进度投影;不拥有 completion/Growth 真相)。
CONTENT/PRACTICE → Content Engine(内容 *_ref)。
真人角色 → Human Gate 编排;Case 状态 → Family Steward。
GrowthPriority/Intervention/Observation → Growth OS(只读投影;写仍走既有 Named Action)。
```

## 6. HOLD(本阶段严格不做)

```text
Demand Network / 匿名聚合 runtime · ML ranking / 学习排序 · Marketplace · Payment · Commission · Settlement
· Provider bidding · PR#34 Commerce Runtime · Enrollment/Delivery Runtime · Orchestration Runtime · ServiceCase Runtime。
本阶段只出【架构契约】。任何 runtime 须过 §22/§27 Architecture Gate + 独立 per-phase 授权。ORCHESTRATION_RUNTIME_STARTED = NO。
```

## 7. 与 PR#32 的对账(forward,非原样合入)

```text
PR#32 A–H = reference 输入。本 ARCH V1 相对其增补:① 命名统一到 V3 八对象;② 补 GrowthCapability;③ 补 OrchestrationPlan(Recommendation≠Orchestration);
④ 两个 Gate 分开(Provider Qualification vs Resource Eligibility);⑤ GrowthPriority 明确可选;⑥ Platform Revenue=NOT_A_RANKING_SIGNAL;⑦ 禁 Resolved/Closed 混淆(Case Closed≠Resolved≠Outcome)。
PR#32 不原样当最终 SSOT;以本文件为 Phase1 架构 SSOT。
```
