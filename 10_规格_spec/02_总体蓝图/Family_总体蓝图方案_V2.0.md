# Family 家庭成长AI平台总体蓝图 V2.0

> 本文件回答：Family最终建设成什么、各层之间是什么关系、现有业务怎样进入未来平台。它不进入代码细节。

# 1. 战略定义

Family建设的是 **Family Growth AI Platform（家庭成长智能平台）**。经营对象从一次成交的课程客户升级为持续成长的Family。

核心价值主张：

> **陪孩子长大，也陪家长重新成长一次。**

终局能力：

```text
Family Digital Twin
+ Family Growth OS
+ Intervention Library
+ Human Service OS
+ AI Intelligence
+ Knowledge & Evidence
+ Outcome Database
+ Causal Intelligence
+ Family Growth World Model
```

# 2. 七层总体架构

```text
① FAMILY EXPERIENCE
家长端 / 孩子端 / 顾问端 / 专家端 / 管理端
        ↓
② BUSINESS PLATFORM
课程 / 训练营 / 会员 / 订单 / 社群 / 活动 / 服务
        ↓
③ FAMILY GROWTH OS
Family / Profile / Journey / Intervention / Action / Outcome
        ↓
④ FAMILY AI PLATFORM
Agent / Decision / Model / Memory / Recommendation
        ↓
⑤ KNOWLEDGE & DATA PLATFORM
Knowledge / Evidence / Event / Ontology / Vector / Graph
        ↓
⑥ HUMAN SERVICE PLATFORM
顾问 / 助教 / 专家 / 教研 / 质检 / 调度
        ↓
⑦ CAUSAL & WORLD MODEL
State / Transition / Intervention / Policy / Simulation
```

# 3. One Family Account

所有系统围绕唯一 `family_id` 工作。CRM中的客户、LMS中的学员、会员、订单、服务、测评、AI对话最终都映射回Family。

Family Digital Twin至少包含：Parent、Child、Relationship、LifeStage、三类Growth Profile、Journey、Intervention、Action、Event、Perspective、Evidence、Milestone、Outcome、Membership、Service、Timeline。

# 4. 现有体系进入Family的基本映射

```text
课程 → Knowledge + Intervention
测评 → Growth Onboarding
训练营 → Growth Program
21天挑战 → Growth Cycle
90天陪跑 → Growth Journey
助教 → Growth Companion
顾问 → Human Growth Advisor
专家 → Specialist Intervention
社群 → Growth Community
活动 → Family Activity
会员 → Family Growth Membership
打卡 → Action Completion Event
成长报告 → Family Growth Review
客户后台 → Family Account
案例 → Outcome Case
裂变 → Growth Referral
```

# 5. 三年演进

**Year 1 Family Digitalization**：客户→Family、Profile、Journey、Outcome、现有业务迁移。

**Year 2 Family Intelligence**：Agent、Knowledge、Intervention、会员、Causal Learning。

**Year 3 Family Ecosystem & World Model**：专家/城市/机构生态、Simulation与Adaptive Policy。

---

# 6. 产品蓝图详细结构

# 01｜Family 总体产品架构
## Family Growth AI Platform Product Architecture V1.0

---

# 1. 产品战略定位

Family 不是课程商城、AI问答工具或单一测评系统，而是：

# Family Growth AI Platform
## 家庭成长智能平台

统一经营对象从：

`一次成交的课程客户`

升级为：

`持续成长的家庭 Family`

统一价值链：

```text
内容/场景触发
↓
Family Account
↓
Growth Onboarding
↓
Growth Profile
↓
Growth Priority
↓
Intervention
↓
Growth Action
↓
Growth Event
↓
Milestone
↓
Outcome
↓
Next Growth Journey
```

长期形成：

```text
Family Growth OS
+
Family AI Platform
+
Human Service Platform
+
Knowledge Foundry
+
Causal Intelligence
+
World Model
```

---

# 2. 三条核心成长主线

## 2.1 Child Growth

一期维度：

- C01 自我认知与身份发展
- C02 情绪识别与调节
- C03 能动性与选择能力
- C04 自我调节与执行
- C05 学习能力与成长动机
- C06 连接与社会能力
- C07 责任与贡献
- C08 韧性与适应

## 2.2 Parent Second Growth

一期维度：

- P01 父母自我觉察
- P02 父母情绪调节
- P03 理解与共情倾听
- P04 独立与自主支持
- P05 期待与成长观
- P06 边界与一致性
- P07 正向引导与反馈
- P08 父母身份与自我持续成长

## 2.3 Relationship Growth

一期维度：

- R01 情感连接
- R02 信任与心理安全
- R03 沟通质量
- R04 冲突调节
- R05 关系修复
- R06 边界与自主
- R07 共识与共同规则
- R08 家庭协作与韧性

---

# 3. Family 产品体系全景

Family 产品体系分为六个平台、二十三个产品模块。

## P1 Family Growth Platform｜家庭成长平台

### P1.1 Family Account
统一家庭账户，所有业务围绕 `family_id` 组织。

### P1.2 Family Onboarding
通过对话、测评、历史服务数据构建初始家庭状态。

### P1.3 Family Growth Home
首页显示三条成长线、今日行动、当前Journey、最近Milestone。

### P1.4 Growth Profile
孩子、家长、关系三张并列成长画像。

### P1.5 Growth Priority
当前阶段最值得关注的成长重点。

### P1.6 Growth Journey
21天、90天、年度等阶段成长旅程。

### P1.7 Growth Action
把课程知识转成真实生活中可执行的小行动。

### P1.8 Growth Event
记录家庭真实发生的变化与事件。

### P1.9 Milestone
记录值得长期保存的真实成长节点。

### P1.10 Family Growth Review
Day14/35/60/90等阶段回顾。

### P1.11 Family Timeline
从孩子年龄和LifeStage维度形成长期成长时间轴。

---

## P2 Learning & Intervention Platform｜学习与干预平台

### P2.1 Content Library
现有课程、直播、文章、音视频。

### P2.2 KnowledgeCard
经知识工厂审核后可供AI使用的知识单元。

### P2.3 Intervention Library
把课程和方法拆成可被系统调用的成长干预。

### P2.4 Growth Program
21天挑战、训练营、90天计划。

### P2.5 Action Template Library
不同成长维度对应的行动模板。

---

## P3 Human Service Platform｜人工服务平台

### P3.1 Growth Advisor
顾问围绕Family Profile和Journey服务家庭。

### P3.2 Class/Growth Companion
承接现有助教/班主任能力。

### P3.3 Expert Service
专家咨询、专题干预。

### P3.4 Service Scheduling
预约、调度、服务记录。

### P3.5 Consultant Workbench
顾问工作台：家庭优先级、预警、行动、Outcome。

### P3.6 Quality Review
服务质检和专业复核。

---

## P4 Membership & Community Platform｜会员与社群平台

### P4.1 Family Growth Membership
年度会员从权益卡升级为持续成长服务关系。

### P4.2 Benefit Center
课程、顾问、专家、活动等权益。

### P4.3 Growth Community
家长社群、主题群、阶段群。

### P4.4 Family Activity
沙龙、工作坊、城市活动、研学等。

### P4.5 Growth Referral
基于真实Milestone和Outcome的用户推荐。

---

## P5 Family AI Platform｜AI智能平台

### P5.1 Family Companion
统一家庭AI入口。

### P5.2 Parent Growth Companion
服务家长第二次成长。

### P5.3 Growth Planner
生成/调整阶段计划和今日行动。

### P5.4 Relationship Companion
支持沟通、冲突、修复、共同规则。

### P5.5 Child Growth Companion
第二阶段上线，必须强调孩子自主而非家长监控。

### P5.6 Human Copilot
服务顾问、助教、专家。

---

## P6 Management & Operations Platform｜经营与运营平台

### P6.1 Family CRM View
围绕家庭而非Lead查看经营关系。

### P6.2 Growth Operations
Journey运营、任务运营、预警。

### P6.3 Membership Operations
续费、权益、活跃。

### P6.4 Content Operations
内容触达与增长。

### P6.5 Management Dashboard
用户、增长、交付、AI、数据、Outcome综合经营看板。

---

# 4. 产品阶梯

保留现有成熟商业结构，但重新定义底层语义。

```text
免费入口
Family Growth Conversation / Assessment
↓
21 Day Growth Cycle
第一次可见小改变
↓
90 Day Family Growth Journey
系统性共同成长
↓
Annual Family Growth Membership
长期陪伴
↓
Specialist Services
顾问 / 专家 / 活动
↓
Family Ecosystem
城市 / 专家 / 机构 / 服务网络
```

---

# 5. 用户主路径

## 5.1 Problem Entry

```text
手机 / 厌学 / 拖延 / 冲突 / 情绪
↓
Scenario
↓
Growth Onboarding
↓
三条Growth Profile
↓
Growth Priority
↓
Journey
```

## 5.2 Growth Entry

```text
孩子进入某LifeStage
↓
“我想知道怎么陪孩子走过这一阶段”
↓
Growth Profile
↓
Growth Priority
↓
Journey
```

长期必须让用户即使没有严重问题也愿意使用Family。

---

# 6. 第一核心产品：12—15岁90天共同成长

## Phase 1｜SEE｜Day 1–14

核心目标：看见孩子、家长、关系。

核心产物：
- 初始Profile
- 关键Perspective
- Growth Priority

## Phase 2｜PARENT_FIRST｜Day 15–35

核心目标：家长先改变自己能够改变的部分。

重点：
- P02
- P03
- P04
- P05
- P06
- R03
- R04
- R05

## Phase 3｜CO_CREATE｜Day 36–60

核心目标：孩子参与成长目标和家庭规则。

重点：
- C03
- C04
- C07
- P04
- P06
- P07
- R06
- R07
- R08

## Phase 4｜STABILIZE｜Day 61–90

核心目标：让新互动方式跨时间、跨场景逐步稳定。

结束输出：
- Child Growth Review
- Parent Second Growth Review
- Relationship Growth Review
- Family Milestones
- 下一阶段建议

---

# 7. 五个业务闭环

## 7.1 获客闭环

`Content → Assessment → Family Account`

## 7.2 成长闭环

`Profile → Priority → Intervention → Action → Outcome`

## 7.3 服务闭环

`AI → Advisor → Expert → Service → Review`

## 7.4 商业闭环

`21 Day → 90 Day → Membership → Specialist → Next Journey`

## 7.5 学习闭环

`Action → Event → Outcome → Causal Episode → Better Decision`

---

# 8. 产品设计原则

1. Family是长期对象，Order只是交易对象。
2. 首页先看家庭成长，不先看课程。
3. AI是能力，不是产品全部。
4. 不做Family Total Score。
5. 不做家庭排行。
6. 不把Child Growth定义为服从。
7. Parent Growth是一等产品。
8. Milestone比连续打卡更重要。
9. Growth Profile是动态阶段状态，不是人格标签。
10. 每个产品功能必须可进入Outcome闭环。

---

# 9. V1产品范围

V1必须做：
- Family Account
- 12–15 LifeStage
- Growth Onboarding
- 三张Growth Profile
- 90-Day Journey
- Intervention Library V1
- Growth Action
- Growth Event
- Milestone
- Outcome
- Family Home
- Parent Growth
- Family Companion
- Human Copilot
- Knowledge Foundry V1
- Evaluation V1

V1暂不做：
- 全年龄段
- 大型社区
- 全国城市生态
- 开放Agent市场
- 高自治Child Agent
- 大型神经世界模型
- Family Ranking / Total Score
