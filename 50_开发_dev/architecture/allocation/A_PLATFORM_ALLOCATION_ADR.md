# A · PLATFORM ALLOCATION ADR —— FAMILY-ALLOCATION-V1-001

```text
STATUS   = PROPOSED(架构决策;运行时须先过 §22 Architecture Gate)
RULING   = 总架构师正式架构重定基(2026-08-16)
BASE     = master @ 9d52358
SCOPE    = 仅架构工件 A–H(无大 runtime、无 canonical 写、无 marketplace/payment/ML)
```

## 1. 背景与决策

Family 的核心商品不是课程/AI/专家,而是**家庭成长资源配置能力**:围绕一个孩子、在持续存在的家庭上下文中,识别此刻需要什么、匹配什么资源、由谁服务、如何协同、服务完如何进入下一次更好的配置。本 ADR 冻结这一"配置平台"的最小纵向切片语义,先架构后运行时(防对象边界错误→语义污染)。

## 2. 四条最高原则(冻结)

```text
CHILD_INTEREST_FIRST  孩子是 Growth Subject;算法不优化点击/停留/焦虑/购买/AI调用;第一判断=是否真适合当前孩子与家庭
FAMILY_SOVEREIGN      家庭是长期服务账户与数据主权主体;课程/专家/机构/AI 会换,Family stays
SERVICE_AROUND_FAMILY 不让家庭自己找资源;平台按状态组织正确资源围绕家庭工作
VALUE_BEFORE_DATA     不让用户为数据资产填表;顺序=用户先获价值→服务自然产数据→数据令下次更好
```
硬优先级:`Child Interest > Family Goal > Provider Interest > Platform Revenue`。

## 3. 平台外循环:FAMILY SERVICE ALLOCATION LOOP

```text
家庭需求 → Need Understanding → Next Best Help → Service Matching(内容/AI/Program/Coach/Expert)
→ Service Orchestration → Family Decision(家庭确认)→ Delivery → Observation/Result
→ Family Context Updated → 下一次匹配更好
```
Growth OS(Recommendation/Decision/Action/Observation/Review/NextStep)是**内循环**,是本外循环的一个被编排的能力,不被复制。

## 4. V1 范围(只做一条纵切)

问题域**仅** 12–15 岁亲子沟通冲突。验证一句话:*家长说一件真实冲突 → 平台理解 → 给 2–3 个合适候选(含 NO_ACTION)→ 家长选择 → 组织交付 → 结果进入既有 Growth Context。* 同时验证 Demand/Distribution/Service/Growth 四层的最小形态。

## 5. 明确不做(本阶段)

marketplace · 真实佣金/分账/payment split · provider bidding · AI 自主派单 · ML 推荐/向量黑盒 · 无限 feed · 裂变/砍价/积分 · family/child ranking · world model · 新 7B · 大组织多租户 · 成批新 dimension/intervention。理由:未被第一条纵切价值链证明需要。

## 6. 架构先行 + Gate

本 PR 只交 A–H;运行时须先过 §22 Architecture Gate(NeedSignal 非 canonical、无诊断标签、Recommendation 不自动决策/行动、NO_ACTION 合法、Context Reuse/ServiceCase/Human Escalation 已设计、Demand 无原始家庭暴露、无 ML/marketplace/payment、无 canonical 重复)。PR #30(Entry Foundation)独立,不混入。

## 6b. 平台终局愿景(2026-08-16 深化):家庭成长资源编排平台

```text
定位升级:Family Growth Operating Platform —— 核心不是课程/AI/专家,而是"成长需要什么,平台就【识别·匹配·组合·调度·连接】什么"。
关键词纠正:"提供"→【组织】。Family 不必制造所有资源(内容自有;AI=DeepSeek/GPT/Claude/自有;心理/营养/运动/升学=合格第三方);
  Family 的价值 = 发现·匹配·组合·授权·调度·跟踪·复盘(asset-light)。
三个中心:孩子=成长目标中心(Growth Subject)· 家庭=持续服务中心(Continuous Context)· 平台=资源编排中心(Orchestration)。
三层能力:① Growth Intelligence(此刻真正需要什么)② Resource Orchestration(需要什么资源/谁提供/怎么组合)③ Growth Continuity(服务完如何进下一阶段)。
长期边界:Child & Family Growth(非 Family Education;跨学科:教育/心理/健康/营养/运动/社交/生涯/家庭关系/生活技能)= 家庭生命周期消费+服务市场。
类比:Growth Triage + Growth Orchestration(像医院分诊/编排,但非医疗);用户只说"我们家遇到这个问题",平台组织后面的资源配置。
扩展方式:每扩一个域 = 新增一个 Capability(定义:适用对象/触发条件/风险边界/服务资源/证据等级/可执行动作/结果观察/升级路径),不是"增加一个频道/商城品类"。
```
**Vision Wide, Entry Narrow(冻结)**:愿景宽=一切为了孩子与家庭成长;入口窄=V1 仅 12–15 亲子沟通冲突。先用一个需求证明"识别→匹配→编排→服务→Follow-up→Context 复用"确实优于用户自己找资源,再扩第二个。大空间 ≠ 第一阶段大范围。

## 6c. 最高伦理约束:Growth Fiduciary Principle(成长受托原则)

```text
平台在资源推荐/编排时,须【优先维护孩子与家庭的成长利益,而非平台自身收入最大化】。
因此必须支持(即使平台赚不到钱):NO_ACTION · 免费内容 · 最低成本方案 · 外部第三方资源 · 退出平台边界转介合格资源(如医疗)。
防陷阱:拥有 需求识别+推荐+服务商+分配+交易 者,极易滑向"制造需求→推付费产品→自赚";受托原则是硬约束,也是最大信任壁垒。
品牌位:"关于孩子成长,不知道怎么办时,先问 Family" → 占据 需求入口→判断权→匹配权→编排权(产业链最上游),而非某类服务供应商。
```

## 7. 既有技术再定位(不推翻)

Family Core→Account/Sovereign Context · Growth OS→成长事实与行动闭环 · Principal→第一个 AI_COACH Provider · Evidence→ServiceCandidate 质量门 · Human Gate→升级基础设施 · Tenancy/AccessGrant→Provider 访问边界 · Audit→Contribution/服务追溯。均从"主角"降为基础设施。
