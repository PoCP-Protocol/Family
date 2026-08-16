# FAMILY GROWTH PLATFORM —— 正式总蓝图(SSOT)

```text
DOC_KIND = MASTER_BLUEPRINT(最高架构 SSOT;统合前几轮所有反向论证)
RULING   = 总架构师正式定版/冻结(2026-08-16),经 FAMILY-PLATFORM-V3-BLUEPRINT-CLOSEOUT-001 修订
BASE     = master @ 9d52358
PHASE0   = PASS_CANDIDATE / NOT_CLOSED(PR#31 尚未 merge,仍受 exact-head 架构复审约束;不得声称"已完成")
PHASE1   = 架构契约草案存在(PR#32),NOT AUTHORIZED_RUNTIME、NOT FINAL_SSOT
```

## 0. 定义与使命

**官方平台名 = Family Growth Platform;中文 = 孩子与家庭成长资源编排平台。**
架构描述语(仅解释用)可称 *Growth Resource Orchestration Platform*。**不再引入第三个平台品牌名**("Operating Platform"/"Market OS"等旧称一律 SUPERSEDED)。
不是家庭教育平台,不是 AI 家庭助手,不是"21天产品"。

三中心(同时成立):
```text
孩子   = Growth Objective Center(成长目标中心;为了谁成长)
家庭   = Continuous Service & Sovereignty Center(持续服务与数据主权;谁有权参与/怎么决策)
平台   = Resource Orchestration Center(资源编排中心;需要调用什么资源)
```
使命:**成长需要什么,Family 就在家庭授权、安全、专业边界内,识别需要·组织资源·编排服务·持续跟进,让每一次服务成为下一次更好服务的基础。**
品牌语:**成长需要什么,Family 就组织什么。** 内部永记后半句:*不为多卖服务,而为孩子和家庭得到此刻最合适的帮助。*
边界 = **Child & Family Growth**(跨学科生命周期,非 Family Education)。**Vision Wide, Entry Narrow**:入口仍仅 12–15 亲子沟通冲突。

## 1. 主循环:Growth Resource Orchestration Loop

```text
孩子/家庭变化 → 发现成长需求 → 理解真正问题 → 家庭确认("这是我现在想解决的")
→ 判断需要什么能力 → 寻找合适资源 → 组合成服务路径 → 家庭选择
→ AI/内容/计划/真人/外部资源执行 → 服务跟踪 → 发生了什么 → 更新 Family Growth Context → 下一次匹配更好
```
平台拥有的是"需求→能力→资源→编排→服务→反馈",而非某一种资源。

## 2. 五个核心 Engine

```text
① Growth Need Engine        现在真正需要什么?  三层:GrowthNeedSignal(NON_CANONICAL,≠Fact≠诊断≠Priority)→ GrowthIntent(家庭确认的服务需求)→ GrowthPriority(经成长决策才入 Growth OS)
② Growth Capability Engine   需要什么能力?     如 DE_ESCALATION / COMMUNICATION_REOPENING;同一 Capability 可由多资源满足(平台抽象,见 §2b)
③ Growth Resource Network    有哪些资源?       8 型:NO_ACTION·CONTENT·PRACTICE·AI_COACH·PROGRAM·HUMAN_COACH·QUALIFIED_EXPERT·EXTERNAL_REFERRAL;每 ResourceOffer 带"能力身份证"(capabilities/ageScope/problemScope/evidenceLevel/riskBoundary/privacy/effort/duration/availability/costClass/requiresHuman/requiresConsent)
④ Growth Orchestration Engine 平台心脏:产出 Next Best Growth **Path**(条件路径,非单条推荐,见 §2c)
⑤ Family Steward            全局服务状态层:ServiceCase / SLA / 主动 Follow-up / Service Recovery(用户只认识 Family,后台自解决谁服务)
```

## 2b. 核心平台对象链(Canonical Service Chain,正式冻结命名)

统一命名到 V3(取代旧 Allocation 的 NeedSignal/ServiceIntent/ServiceCandidate/ServiceRecommendation 双命名):
```text
GrowthNeedSignal        AI 推断,NON_CANONICAL(≠Fact≠诊断≠Priority)
      │ family confirms
      ▼
GrowthIntent            家庭确认的服务需求
      ▼
GrowthCapability        需要什么"能力"(需求↔供给的解耦层)
      ▼
Eligible ResourceOffers 通过 Eligibility Gate 的资源(见 §4)
      ▼
ResourceRecommendation  在合格集合内的排序建议
      │ family decides
      ▼
OrchestrationPlan       有序/条件化的服务路径(≠单条推荐,见 §2c)
      ▼
ServiceCase             平台组织的一次服务(Family Steward 拥有状态)
      ▼
ServiceContribution     谁贡献了什么(未来 FGCN Allocation 输入)
      ▼
Growth OS: Observation / Review → Family Growth Context → 下一轮更好
```
`DemandCluster` = **未来只读聚合投影(read-only aggregate)**,不是核心 transaction object。
主链是 **Need → Capability → Resource → Orchestration → Service**,**绝不是 Need → Product**。

## 2c. Capability 抽象 与 Orchestration ≠ Recommendation(两条平台级不变量)

**(a) GrowthCapability 必须独立存在** —— 它把**需求与供给解耦**。同一 Capability 可由多类资源满足:
`CONTENT / PRACTICE / AI_COACH / PROGRAM / HUMAN_COACH / QUALIFIED_EXPERT / EXTERNAL_REFERRAL`。
这是**资源可替换性**与**未来第三方互操作**的前提。禁止 `Need → 直接推荐一个 Product`。

**(b) Recommendation ≠ Orchestration**:
```text
ResourceRecommendation 说:哪个资源/路径合适。
OrchestrationPlan 拥有:有序/条件化的服务路径。例:
  AI_COACH now → PRACTICE tonight → FOLLOWUP tomorrow
  IF repeated → PROGRAM   IF complex → HUMAN   IF out-of-scope → EXTERNAL_REFERRAL
```
没有 OrchestrationPlan,所谓"编排平台"终局仍只是 Recommendation Platform。**V1 不做通用 workflow DSL**(只做上述有限条件路径)。

## 3. 四家公司机制的融入(非四模块)

```text
拼多多 → Growth Demand Network:需求聚合(匿名 DemandCluster,阈值)· C2S 需求反向驱动供给 · Share Value not Family Problems(禁砍价/强制拉人)
字节   → Growth Distribution:Next Best Resource(反馈驱动),目标函数 = Growth Fiduciary(见 §4),【禁】最大化停留/无限 Feed
海底捞 → Family Steward:主动照顾整个服务过程 + Service Recovery,【非】堆人工/过度服务(AI-first + Human escalation)
贝壳   → FGCN(Family Growth Collaboration Network):一次服务拆成角色(Discoverer/Router/Content/Program/AI Coach/Delivery/Growth Coach/Expert/Reviewer/Steward),跨组织协作,Contribution→未来 Allocation;家庭永远是主权主体,不归任一服务者
三网络效应:Demand / Supply / Learning。
```

## 4. Growth Fiduciary(最高伦理)—— 两阶段,非单一排序表

**第一阶段:Resource Eligibility Gate(FAIL CLOSED,不参与排序)。** 任一关键 Gate 不通过 → `INELIGIBLE`,**根本不进入候选**:
```text
consent · privacy · safety · professional_scope · provider_qualification · risk_boundary · age_scope · required_availability
```
Safety / Consent / Qualification **不是** ranking factor —— 适配度 95 但未授权的资源,不能因排名高而给出。

**第二阶段:Growth Fiduciary Ranking(仅对 eligible 资源排序):**
```text
child_growth_interest > confirmed_family_intent > resource_fit > evidence > past_context > family_preference > user_burden > cost
```
**Platform Revenue / Margin(V1):`PLATFORM_MARGIN_RANKING_SIGNAL = 0`,`PLATFORM_REVENUE = NOT_A_RANKING_SIGNAL` —— 不是"排最后",而是根本不参与排序。**
必须始终支持(即使 0 收入):`NO_ACTION / FREE_RESOURCE / EXTERNAL_REFERRAL`。

```text
Eligibility Gate → Eligible Resource Set → Growth Fiduciary Ranking → Next Best Growth Path
```
Truth Guard 保持:NeedSignal≠Fact/诊断;AI 不直写 GrowthPriority/Action;禁 Child/Family Score;禁大一统画像(Fact/Perspective/Observation/Intent/Inference 分开)。

## 5. North Star Metric

**Helpful Growth Resolution Rate** = 家庭表达真实成长需求后,被匹配到合适帮助并完成一次有效服务闭环的比例。
拆:Need Confirmed → Resource Matched → Family Accepted → Service Started → Service Completed → Follow-up Captured。
辅助:TIME_TO_USEFUL_HELP · RESOURCE_MATCH_ACCEPTANCE · SERVICE_COMPLETION · FOLLOWUP_COMPLETION · CONTEXT_REUSE · REPEAT_EXPLANATION_REDUCTION · HUMAN_HANDOFF_SUCCESS · SERVICE_RECOVERY_SUCCESS · NO_ACTION_ACCEPTANCE · EXTERNAL_REFERRAL_SUCCESS。**不以 DAU/PV/时长/AI消息数为优化目标。**
注:服务"完成"由 Enrollment / Delivery Domain 判定;Program Runtime 只知 schedule 到第几天,不拥有 completion 真相。

## 6. 总架构图(正式)

```text
┌─ FAMILY EXPERIENCE ───────────── 首页 · 成长 · 服务 · 家庭 ─┐
├─ FAMILY STEWARD LAYER ────────── Case·SLA·Follow-up·Recovery(海底捞)
├─ GROWTH ORCHESTRATION ENGINE ── Need→Capability→Resource→Plan(字节)· Eligibility Gate 前置
│      ├─ GROWTH DEMAND(拼多多:Demand Cluster / Sharing)
│      └─ RESOURCE NETWORK(AI/Program/Content/Human)
│              └─ FGCN COLLABORATION(贝壳:Role/Task/Access/Contribution)
└─ FAMILY INTELLIGENCE FOUNDATION ─ Family Core · Growth OS · Evidence · Model Gateway/Principal · Human Gate · Tenancy/Consent/Access
```
消费端一级导航:首页(Growth Gateway:"现在有什么需要 Family 帮忙")· 成长 · 服务 · 家庭。Principal = 嵌入 AI 能力,非一级。

## 7. 既有技术再定位(不推翻,全部归位)

```text
Family Core→Family Growth Account/连续上下文 · Growth OS→成长真实行动与观察协议 · Principal→AI Resource Provider
Evidence→Resource Quality/Evidence Gate · Human Gate→AI→真人编排基础设施 · @family/program-runtime→Program Resource Provider(仅 schedule/进度投影,无 completion 真相)
Content Engine→Content/Practice Resource Provider · Tenancy/AccessGrant→多服务者安全进入 · Audit→Contribution/服务追溯 · WAF→Discovery/Community Resource(非中心)
```

## 8. 成熟度模型(唯一,取代"产品做了几步/平台几个模块")

```text
M0 NORTH_STAR_ALIGNED
  ↓
M1 GROWTH_NEED_READY
  ↓
M2 RESOURCE_NETWORK_READY
  ↓
M3 ORCHESTRATION_READY
  ↓
M4 SERVICE_CONTINUITY_READY
  ↓
M5 CONTEXT_REUSE_READY
  ⇒ FAMILY_GROWTH_ORCHESTRATION_V1_READY
之后(仅未来):M6 DEMAND_NETWORK_READY → M7 COLLABORATION_NETWORK_READY → M8 PLATFORM_ECONOMICS_READY
```
**关键战略分界(固定):`M1–M5 = Single-family Platform Value`(先证明一个家庭的服务能连续、能复用);`M6–M8 = Network / Platform Economic Value`(拼多多需求网络 / 贝壳协作网络 / 经济)。在 M1–M5 未成之前,不进入 M6–M8。**
(旧"M1 求助→M2 组织→M3 跟进→M4 复用→M5 需求网络→M6 协作→M7 学习→M8 经济"映射 SUPERSEDED,已删除,避免双状态机。)

阶段路线(先冻结语义,再写运行时):
```text
Phase0 战略+代码重定基            = PASS_CANDIDATE / NOT_CLOSED(PR#31:北极星→编排 · Program01→FIRST_PROGRAM_RESOURCE · Program Runtime→@family/program-runtime;待 exact-head 复审)
Phase1 Growth Resource 架构契约   = 草案(PR#32,见 §9);正式 Phase1 = FAMILY-GROWTH-ORCHESTRATION-ARCH-001(八对象 + 一条 Golden Journey),过 Architecture Gate 才写 runtime
Phase2 首条纵切 runtime(13岁冲突:Need→Intent→Capability→Resource→AI→Practice→Follow-up→Observation)
Phase3 Context Reuse   Phase4 Micro Program(验证 Program=资源)  Phase5 Human Service  Phase6 Family Steward(SLA/Recovery)
Phase7 Demand Aggregation(匿名)  Phase8 FGCN Provider Collaboration  Phase9 Learning-to-rank(现禁 ML)  Phase10 Economics(最后)
```

## 9. 与现有工件的对账

```text
PR#31(product-runtime-001):Phase 0 —— 北极星/Program 降级/包移出 web。状态 = Phase0 Closeout Candidate(尚未合并);
  exact merge SHA 归 governance/review ledger,不在本最高蓝图硬写(避免 SHA 漂移)。第二轮须:移除 Program completion 真相 · rebase 到含本蓝图的 master · 修剩余状态漂移。
PR#32(allocation-v1-001):= EARLY PHASE1 ARCHITECTURE REFERENCE;NOT AUTHORIZED_RUNTIME;NOT FINAL_SSOT。
  流程记录:PROCESS_DEVIATION = PHASE1_ARCH_ARTIFACT_CREATED_BEFORE_PHASE0_REVIEW;影响 = NO_RUNTIME / NO_CANONICAL / NO_ROLLBACK。
  须在 Phase0 closeout 后,以 #32 为输入 rebase/forward 成 FAMILY-GROWTH-ORCHESTRATION-ARCH-001(命名统一到 §2b 八对象:补齐 GrowthCapability 与 OrchestrationPlan)。
PR#30(web-entry-mount):Entry Foundation,独立冻结,不混入。
```
推进顺序(冻结):**PR#33 V3 蓝图 → 合入 master → PR#31 rebase+第二轮 → 合入 → PR#32 forward 成 ARCH-001 → Architecture Gate → 首条纵切 runtime。不再并行开新架构 PR。**

## 10. DO_NOT_BUILD 过滤器(每个任务开工前必答)

> 这个功能是否帮助平台更好地:**理解成长需求 / 找到成长资源 / 组织成长服务 / 完成成长交付 / 让下一次服务更好**?五者皆非 → `DO_NOT_BUILD`。

HOLD(除非直挡 Phase 当前纵切):marketplace/佣金/payment/分账 · provider bidding · ML 推荐 · 无限 feed · 砍价裂变/焦虑 upsell · world model · Family 7B · 大组织多租户 · 成批新 dimension/intervention · 健康/心理诊断/医疗逻辑。合 master 须显式 per-merge 授权。
