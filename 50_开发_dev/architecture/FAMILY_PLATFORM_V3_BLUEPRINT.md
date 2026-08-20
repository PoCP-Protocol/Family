# FAMILY GROWTH PLATFORM —— 正式总蓝图(SSOT)

```text
DOC_KIND        = MASTER_BLUEPRINT(最高、稳定的架构 SSOT;统合前几轮所有反向论证)
RULING          = 总架构师正式定版/冻结(2026-08-16),经 CLOSEOUT-001 / FINAL-SEMANTIC / ARCH-CLOSEOUT 修订
PARENT          = (无;本文件即最高战略 SSOT)
STRATEGIC_SCOPE = Child & Family Growth(跨学科生命周期;Vision Wide, Entry Narrow)
```

> **本文件只承载稳定架构真相(定义 / 架构不变量 / 成熟度模型 / 战略范围),不承载可变执行状态。**
> Phase / PR / BASE / merge 等**可变执行状态**一律归 `governance/PROGRAM_STATUS_PLATFORM_V1.md` 与 `governance/MERGE_AUTHORIZATIONS.yaml`;阶段变化不需修改本最高蓝图。

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
① Growth Need Engine        现在真正需要什么?  GrowthNeedSignal(NON_CANONICAL,≠Fact≠诊断≠Priority)→ GrowthIntent(家庭确认的服务需求)。**GrowthIntent 直接进 Capability/编排(见 §2b);不强制经过 GrowthPriority**(见 §2d)
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

## 2d. GrowthPriority 是可选的(平台级不变量)

**GrowthPriority ≠ 服务编排的必经节点。** 临时求助不应被强制"成长规划化"。
```text
GrowthNeedSignal
      ↓
GrowthIntent
      ├──────────────→ GrowthCapability → ResourceOffer → Orchestration → ServiceCase(主路径,无需 GrowthPriority)
      └── MAY INFORM ─→ GrowthPriority(可选;家庭确认;Growth OS 拥有;经既有 human-confirmed 边界)
```
不变量:`GrowthIntent ≠ GrowthPriority`;`GrowthPriority = OPTIONAL, Growth-OS-owned, family-confirmed`;`GrowthPriority ≠ prerequisite for Orchestration`。
例:"孩子刚摔门,我今晚不知道怎么重新开口" → NeedSignal → Intent → Capability(DE_ESCALATION/COMMUNICATION_REOPENING)→ AI Coach/Practice,**全程不需先建 GrowthPriority**;一个 Intent 可在事后**可选地** inform 一条 GrowthPriority。

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

**Helpful Growth Service Loop Rate(HGSLR)· 家庭成长有效帮助闭环率**
(取代旧 "Helpful Growth Resolution Rate" —— 旧名暗示"成长被解决/孩子改善",超出实际测量,SUPERSEDED)。
定义:一个家庭表达真实成长需求后,有多少比例真正获得并完成了一次**被家庭感知为有帮助**的服务闭环。
```text
confirmed GrowthIntent → eligible help found → family accepted → service delivered → follow-up captured → family helpfulness signal captured
```
末端加一个极低摩擦信号(仅 **user-perceived helpfulness**):"这次帮助对你有用吗? ○有帮助 ○有一点帮助 ○暂时没有帮助"。
**该信号 ≠ 孩子改善证明 / 成长结果证明 / 干预有效证明 / 因果证据。**

三层指标(永久分开,防以后把"服务完成率"包装成"孩子成长效果"):
```text
LEVEL 1 Platform Delivery(资源有没有被组织起来):TIME_TO_USEFUL_HELP · RESOURCE_MATCH_ACCEPTANCE · SERVICE_COMPLETION · HUMAN_HANDOFF_SUCCESS · SERVICE_RECOVERY_SUCCESS
LEVEL 2 Family Perceived Value(家庭觉不觉得有用):HELPFULNESS_SIGNAL · FOLLOWUP_COMPLETION · CONTEXT_REUSE · REPEAT_EXPLANATION_REDUCTION
LEVEL 3 Growth Signals(现实后来发生了什么):Observation · Review · NextStepDecision
```
不变量:`ServiceCompletion ≠ GrowthOutcome`;`Helpfulness ≠ GrowthOutcome`;`Observation ≠ Causality`。**不以 DAU/PV/时长/AI消息数为优化目标。**
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

阶段路线(稳定语义;各 Phase 的实时进度/PR/SHA 归 PROGRAM_STATUS,不在此承载):
```text
Phase0 战略+代码重定基            = 北极星→编排 · Program01→FIRST_PROGRAM_RESOURCE · Program Runtime→@family/program-runtime
Phase1 Growth Resource 架构契约   = FAMILY-GROWTH-ORCHESTRATION-ARCH-001(§2b 八对象 + 一条 Golden Journey),过其自有 Architecture Gate 才写 runtime
Phase2 首条纵切 runtime(13岁冲突:Need→Intent→Capability→Candidate Resources→Eligibility→Recommendation→Family Decision→Plan→ServiceCase→AI/Practice→Follow-up→FollowUpResponse→minimal Context Reuse;**Observation 可选,仅经既有 Growth OS 边界;不得让 Follow-up 自动变 Observation**)
Phase3 Context Reuse 强化/更广复用(Phase2 已证明同场景最小复用)   Phase4 Micro Program(验证 Program=资源)  Phase5 Human Service  Phase6 Family Steward(SLA/Recovery)
Phase7 Demand Aggregation(匿名)  Phase8 FGCN Provider Collaboration  Phase9 Learning-to-rank(现禁 ML)  Phase10 Economics(最后)
```

## 9. 架构纪律:推进顺序(稳定)

```text
Phase0 重定基 → Phase1 架构契约(ARCH-001)→ 其自有 Architecture Gate → 首条纵切 runtime → …(逐 Phase 后置网络/经济)
纪律:先冻结语义再写 runtime;不并行开新架构/runtime PR;每次合 master 须显式 per-merge 授权(见 MERGE_AUTHORIZATIONS.yaml)。
```
**各 PR 的 exact SHA / merge / Phase 完成状态等可变执行真相,一律归 `governance/PROGRAM_STATUS_PLATFORM_V1.md` 与 `governance/MERGE_AUTHORIZATIONS.yaml`,不在本最高蓝图硬写(避免 SHA/状态漂移)。**

## 10. DO_NOT_BUILD 过滤器(每个任务开工前必答)

> 这个功能是否帮助平台更好地:**理解成长需求 / 找到成长资源 / 组织成长服务 / 完成成长交付 / 让下一次服务更好**?五者皆非 → `DO_NOT_BUILD`。

HOLD(除非直挡 Phase 当前纵切):marketplace/佣金/payment/分账 · provider bidding · ML 推荐 · 无限 feed · 砍价裂变/焦虑 upsell · world model · Family 7B · 大组织多租户 · 成批新 dimension/intervention · 健康/心理诊断/医疗逻辑。合 master 须显式 per-merge 授权。

## 11. DEV 真实能力与 AI Control Plane（34 页 UI / 3 PPT 证据派生）

> 本章只固化架构不变量，不记录 PR、环境具体状态、模型版本或验收结果。产品证据、逐页基线、六条闭环、实现映射与实时交付状态分别见 `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md`、`governance/BANGYANG_34_UI_SCENARIO_FLOWS_AND_RULES_001.md`、`governance/BANGYANG_34_UI_REAL_LLM_GATEWAY_IMPLEMENTATION_MAPPING_001.md` 与 `governance/FAMILY_PLATFORM_MASTER_REQUIREMENTS_DESIGN_DELIVERY_TEST_PLAN_V1.md`。

### 11.1 不变量：DEV 应实现真实能力，不是静态 mock

**DEV 真实能力 = 相同的业务状态机、API、数据库/测试存储、权限、审计、异常恢复、AI Gateway 和 Adapter interface；测试数据 = 唯一数据源；沙箱 adapter = 唯一外部副作用出口。**

因此，测试订单、测试预约、测试活动、测试社区和测试服务不是“假功能”，而是可运行的领域工作流：它们生成可回放的受控状态与审计回执。生产 adapter 与真实用户数据仍需独立裁决，但未来接入时应替换 adapter，不得重写领域行为、权限或状态机。

```text
34-page Experience / Text Equivalent
        ↓ HTTP / explicit action contract
Family Application & Domain Workflows
        ↓           ↓
Named Action      Test Action (same invariants; test namespace)
        ↓           ↓
Canonical domain  Test fixture / test database projection
        ↓
AI Control Plane + External Adapter Ports
        ↓
DEV/TEST sandbox providers only → independent Production Gate later
```

### 11.2 双控制面：业务控制面与 AI 控制面

| 控制面 | 拥有的职责 | 永远不拥有的职责 |
|---|---|---|
| 业务控制面 | trusted context、family scope、consent、领域状态机、Named Action/Test Action、幂等、审计、领域事件、adapter invocation | 直接信任客户端 family ID、模型自由文本写事实、跨范围访问 |
| AI 控制面 | Gateway、模型 allowlist、Context Assembler、Prompt/Schema 版本、Tool Registry、Output Validator、Eval、Audit/Replay、Kill Switch | 领域事实写权、数据库直接写权、任意 HTTP/支付/外发/真人服务权限、训练和长期记忆 |

模型只能提出受 schema 约束的解释草稿或工具请求；业务控制面独立验证并决定是否执行 Test Action/Named Action。**模型不是行动主体，Domain 才是行动主体。**

### 11.3 真实 LLM Gateway 的稳定契约

1. 真实模型调用一律从服务端单一 Gateway 发出；页面、浏览器、领域模块和 adapter 不得直连提供者。
2. Gateway 只接收 Context Assembler 生成的最小、结构化、只读快照；不得读取整库、完整档案、完整聊天历史、儿童原始材料、审计原文或外部未准入数据。
3. Gateway 只返回严格 JSON Schema 的说明草稿、文本等价草稿、受控停止草稿或 tool proposal；所有输出先经语义、词法、枚举、候选别名、状态上限和文本等价验证。
4. 任一范围、consent、fixture、schema、策略、模型 allowlist、工具权限、输出验证或基础设施条件不满足时，必须 fail-closed，绝不降级为未受控文本或客户端直连。
5. Gateway 与模型均无 Need、Intent、Decision、Plan、Case、Task、Order、Booking、Post、Profile、Asset、Resource Admission 或审计事实的直接写权限。

### 11.4 真实密钥的配置不变量

真实 LLM API key 仅由用户在测试时通过本地环境变量、未提交 `.env.local` 或受控 secret 配置注入。代码、文档、fixture、日志、审计、回放、错误、截图和测试快照只允许出现配置槽位**名称**，不得包含、回显、序列化、哈希或推断任何真实凭证。

| 配置槽位 | 架构作用 | 缺失时行为 |
|---|---|---|
| `FAMILY_LLM_ENABLED` | 显式启用受控 DEV/TEST LLM 路径 | `LLM_DISABLED`；零网络调用 |
| `FAMILY_LLM_API_KEY` | 仅服务器内存中的认证配置 | `LLM_NOT_CONFIGURED`；零网络调用 |
| `FAMILY_LLM_API_BASE` | 允许的兼容服务端点 | `LLM_NOT_CONFIGURED`；零网络调用 |
| `FAMILY_LLM_MODEL` | model allowlist 的候选模型 | `LLM_MODEL_NOT_ALLOWED`；零网络调用 |
| `FAMILY_LLM_ENVIRONMENT` | 强制仅 DEV/TEST 的环境声明 | `LLM_ENVIRONMENT_BLOCKED`；零网络调用 |

配置检查不记录值、前缀、长度、hash、认证 header 或 provider 异常原文。审计仅记录模型 ID、请求类别、版本、fixture/trace alias、判定和时间。

### 11.5 Tool Registry 与 External Adapter Port

Tool Registry 只能暴露受控业务动作的**请求能力**，不能暴露原始数据库、文件、网络、支付、消息、分享、搜索或环境变量。任何 LLM tool proposal 必须经业务控制面再验证 principal、family scope、consent、fixture、schema、幂等键、状态前置条件与副作用环境。

```text
LLM tool proposal
  → Tool Registry allowlist
  → Domain Action Guard
  → Test/DEV state transition
  → Adapter Port
  → sandbox/test provider receipt
  → Audit + replay projection
```

外部能力均以 Port/Adapter 建模。DEV/TEST 使用可运行的 sandbox/test adapter；真实支付、真实消息、真实预约、真人供给、真实社区外发或生产数据 adapter 只有在独立 Gate 后才可绑定。该限制不降低领域功能完整度，而是把外部副作用替换为可控实现。

### 11.6 六闭环共用的可验证能力

34 页和六条闭环共享同一组能力：可信家庭范围、测试数据投影、领域状态机、幂等 Action、真实 LLM 解释、受控工具、外部 adapter receipt、审计回放、文本等价和失败关闭。每条闭环至少要有一个真实 LLM Gateway 节点，并能端到端验证正常路径与范围/配置/输出失败路径。

| 场景簇 | 真实领域能力 | 真实 LLM 的合法职责 | 隔离的外部副作用 |
|---|---|---|---|
| 核心服务与增长 | Need/Intent、服务路径、任务、报告呈现、返回/暂停/NO_ACTION | 解释受控 fixture、任务与文本等价 | 无真人、无诊断、无真实分享 |
| 商城 | 目录、订单、积分、邀请/拼团状态机、资产账本 | 解释测试商品/状态及模拟边界 | test/sandbox commerce adapter；无生产支付/分佣 |
| 名师沙龙 | 师资目录、时段、预约草稿/确认、活动状态 | 解释测试服务/活动状态 | test/sandbox booking/event adapter；无真人联系 |
| 社区 | 内容模板、发布回执、详情、资料/成果投影 | 解释固定内容与安全出口 | test/sandbox community adapter；无跨家庭/真实外发 |
| 客户后台 | 服务、订单、资产、档案、记录状态投影 | 解释测试记录及文本等价 | 无真实客服、权益或生产档案 |

### 11.7 E1 研究材料与效果真相的永久分离

原素材/历史命名：榜样教育（Bangyang）的 PPT、UI、课程、案例，以及家庭教育研究和后续研究材料只能作为需求、设计和假设的输入。它们按 Family `evidence.py` 与 Evidence Gate 处理；自家材料的证据上限为 E1，不得被用作教育效果、成长结果、模型正确性、资源资格或生产放行证明。AI 输出同样不能把服务过程、家庭主观感受或 E1 素材改写为效果因果结论。
