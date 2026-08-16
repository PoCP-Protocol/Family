# FAMILY GROWTH PLATFORM 3.0 —— 正式总蓝图(SSOT)

```text
DOC_KIND = MASTER_BLUEPRINT(最高架构 SSOT;统合前几轮所有反向论证)
RULING   = 总架构师正式定版/冻结(2026-08-16)
BASE     = master @ 9d52358
状态      = FROZEN(顶层蓝图);Phase 0 已完成(PR#31);Phase 1 架构契约进行中(PR#32 Allocation A-H)
```

## 0. 定义与使命

**Family = Child & Family Growth Resource Orchestration Platform(孩子与家庭成长资源智能编排平台)。**
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
② Growth Capability Engine   需要什么能力?     如 DE_ESCALATION / COMMUNICATION_REOPENING;同一 Capability 可由多资源满足(平台抽象)
③ Growth Resource Network    有哪些资源?       8 型:NO_ACTION·CONTENT·PRACTICE·AI_COACH·PROGRAM·HUMAN_COACH·QUALIFIED_EXPERT·EXTERNAL_REFERRAL;每 ResourceOffer 带"能力身份证"(capabilities/ageScope/problemScope/evidenceLevel/riskBoundary/privacy/effort/duration/availability/costClass/requiresHuman/requiresConsent)
④ Growth Orchestration Engine 平台心脏:产出 Next Best Growth **Path**(条件路径,非单条推荐)——如 AI 现在→今晚 Practice→明天 Follow-up→[反复]Micro Program→[复杂]Coach→[风险]Safety→[越界]External Referral
⑤ Family Steward            全局服务状态层:ServiceCase / SLA / 主动 Follow-up / Service Recovery(用户只认识 Family,后台自解决谁服务)
```

## 3. 四家公司机制的融入(非四模块)

```text
拼多多 → Growth Demand Network:需求聚合(匿名 DemandCluster,阈值)· C2S 需求反向驱动供给 · Share Value not Family Problems(禁砍价/强制拉人)
字节   → Growth Distribution:Next Best Resource(反馈驱动),目标函数 = Growth Fiduciary Ranking,【禁】最大化停留/无限 Feed
海底捞 → Family Steward:主动照顾整个服务过程 + Service Recovery,【非】堆人工/过度服务(AI-first + Human escalation)
贝壳   → FGCN(Family Growth Collaboration Network):一次服务拆成角色(Discoverer/Router/Content/Program/AI Coach/Delivery/Growth Coach/Expert/Reviewer/Steward),跨组织协作,Contribution→未来 Allocation;家庭永远是主权主体,不归任一服务者
三网络效应:Demand / Supply / Learning。
```

## 4. Growth Fiduciary Ranking(最高伦理,排序优先级)

```text
1 Child Interest  2 Family Confirmed Need  3 Safety  4 Resource Fit  5 Evidence
6 Past Context    7 Family Preference      8 User Burden  9 Cost  10 Platform Revenue(最后)
PLATFORM_MARGIN_RANKING_SIGNAL = 0(V1 利润不参与排序);必须支持 NO_ACTION / FREE_RESOURCE / EXTERNAL_REFERRAL(即使 0 收入)。
```
Truth Guard 保持:NeedSignal≠Fact/诊断;AI 不直写 GrowthPriority/Action;禁 Child/Family Score;禁大一统画像(Fact/Perspective/Observation/Intent/Inference 分开)。

## 5. North Star Metric

**Helpful Growth Resolution Rate** = 家庭表达真实成长需求后,被匹配到合适帮助并完成一次有效服务闭环的比例。
拆:Need Confirmed → Resource Matched → Family Accepted → Service Started → Service Completed → Follow-up Captured。
辅助:TIME_TO_USEFUL_HELP · RESOURCE_MATCH_ACCEPTANCE · SERVICE_COMPLETION · FOLLOWUP_COMPLETION · CONTEXT_REUSE · REPEAT_EXPLANATION_REDUCTION · HUMAN_HANDOFF_SUCCESS · SERVICE_RECOVERY_SUCCESS · NO_ACTION_ACCEPTANCE · EXTERNAL_REFERRAL_SUCCESS。**不以 DAU/PV/时长/AI消息数为优化目标。**

## 6. 总架构图(正式)

```text
┌─ FAMILY EXPERIENCE ───────────── 首页 · 成长 · 服务 · 家庭 ─┐
├─ FAMILY STEWARD LAYER ────────── Case·SLA·Follow-up·Recovery(海底捞)
├─ GROWTH ORCHESTRATION ENGINE ── Need→Capability→Resource→Plan(字节)
│      ├─ GROWTH DEMAND(拼多多:Demand Cluster / Sharing)
│      └─ RESOURCE NETWORK(AI/Program/Content/Human)
│              └─ FGCN COLLABORATION(贝壳:Role/Task/Access/Contribution)
└─ FAMILY INTELLIGENCE FOUNDATION ─ Family Core · Growth OS · Evidence · Model Gateway/Principal · Human Gate · Tenancy/Consent/Access
```
消费端一级导航:首页(Growth Gateway:"现在有什么需要 Family 帮忙")· 成长 · 服务 · 家庭。Principal = 嵌入 AI 能力,非一级。

## 7. 既有技术再定位(不推翻,全部归位)

```text
Family Core→Family Growth Account/连续上下文 · Growth OS→成长真实行动与观察协议 · Principal→AI Resource Provider
Evidence→Resource Quality/Evidence Gate · Human Gate→AI→真人编排基础设施 · @family/program-runtime→Program Resource Provider
Content Engine→Content/Practice Resource Provider · Tenancy/AccessGrant→多服务者安全进入 · Audit→Contribution/服务追溯 · WAF→Discovery/Community Resource(非中心)
```

## 8. 阶段路线(先冻结语义,再写运行时)

```text
Phase0 战略+代码重定基            = 已完成(PR#31:北极星→编排 · Program01→FIRST_PROGRAM_RESOURCE · Program Runtime→@family/program-runtime)
Phase1 Growth Resource 架构契约   = 进行中(PR#32 Allocation A–H 覆盖大半;V3 补:ResourceProvider 对象 · Growth Capability Engine 显式 · Family Steward 层 · North Star Metric)
Phase2 首条纵切 runtime(13岁冲突:Need→Intent→AI→Practice→Follow-up→Observation)
Phase3 Context Reuse   Phase4 Micro Program(验证 Program=资源)  Phase5 Human Service  Phase6 Family Steward(SLA/Recovery)
Phase7 Demand Aggregation(匿名)  Phase8 FGCN Provider Collaboration  Phase9 Learning-to-rank(现禁 ML)  Phase10 Economics(最后)
成熟度:M1 求助 → M2 组织 → M3 跟进 → M4 复用 → M5 需求网络 → M6 协作 → M7 学习 → M8 经济。
```

## 9. 与现有工件的对账

```text
PR#31(product-runtime-001,head e0533858):Phase 0 完成——北极星/Program 降级/包移出 web。待 review + 点名合并。
PR#32(allocation-v1-001):Phase 1 架构工件 A–H(NeedSignal/Intent/Candidate/Recommendation/ServiceCase/Contribution + DemandCluster + 受托原则)。
  V3 相对 A–H 的增补(下一步并入 Phase 1):ResourceProvider 对象 · Growth Capability Engine(能力抽象层)· Family Steward 层(Service Recovery/SLA)· North Star Metric=Helpful Growth Resolution Rate · 7 服务场景 S1–S7 · 主架构图。
PR#30(web-entry-mount):Entry Foundation,独立冻结,不混入。
```

## 10. DO_NOT_BUILD 过滤器(每个任务开工前必答)

> 这个功能是否帮助平台更好地:**理解成长需求 / 找到成长资源 / 组织成长服务 / 完成成长交付 / 让下一次服务更好**?五者皆非 → `DO_NOT_BUILD`。

HOLD(除非直挡 Phase 当前纵切):marketplace/佣金/payment/分账 · provider bidding · ML 推荐 · 无限 feed · 砍价裂变/焦虑 upsell · world model · Family 7B · 大组织多租户 · 成批新 dimension/intervention · 健康/心理诊断/医疗逻辑。合 master 须显式 per-merge 授权。
