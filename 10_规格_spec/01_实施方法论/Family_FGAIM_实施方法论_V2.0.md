# Family 家庭成长AI平台实施方法论 V2.0
## FGAIM — Family Growth AI Implementation Methodology

> 本文件是 Family 项目的最高实施原则。产品、教研、交付、数据、AI、研发和项目管理均以此为上位规范。

---

# 1. 方法论目标

Family 不是建设一个家庭教育聊天机器人，而是把家庭成长专业体系、真实家庭数据、AI、人工服务、Outcome 与因果学习组织成一个可持续演进的系统。

统一公式：

**Ontology × Evidence × Decision × Agent × Action × Outcome × Causality × Learning**

统一运行主链：

```text
Family Context + LifeStage + State + Evidence
→ Decision
→ Recommendation
→ Human / Family Choice
→ Action
→ Growth Event
→ Milestone
→ Outcome
→ Learning
```

简称 **S-D-A-O-L：State → Decision → Action → Outcome → Learning**。

任何核心AI能力如果不能进入这一闭环，原则上不作为Family核心功能建设。

---

# 2. 三条成长主线

## 2.1 Child Growth
目标不是“更听话”，而是逐渐具备自我认知、情绪调节、能动性、自我管理、学习成长、社会连接、责任与韧性。

## 2.2 Parent Second Growth
家长不是改变孩子的工具。Family把父母自我觉察、情绪调节、共情倾听、自主支持、期待、边界、正向反馈和自我持续成长定义为一级产品域。

## 2.3 Relationship Growth
家庭关系本身是成长对象。重点关注连接、心理安全、沟通、冲突调节、关系修复、边界、共同规则与家庭韧性。

---

# 3. 十条最高原则

1. 家庭是共同成长主体，孩子不是被改造对象。
2. 成长是目标，问题只是Scenario入口。
3. 家长第二次成长是一等产品。
4. Perspective ≠ Fact。
5. Hypothesis ≠ Fact。
6. Recommendation ≠ Decision ≠ Action。
7. Evidence First：重要判断必须知道依据。
8. Outcome First：做了什么不等于发生了成长。
9. Growth before Automation：先证明有效，再提高自动化。
10. Learning before Scale：没有学习闭环，不规模化。

---

# 4. A0 + 8A 架构方法

## A0 Value & Ethics Architecture｜价值与伦理架构
回答：为谁创造什么家庭价值、希望什么Outcome、AI允许做什么和不能做什么。

**门禁：无明确Outcome，不立项。**

## A1 Family Growth Business Architecture｜业务架构
定义Family、Parent、Child、LifeStage、Growth Journey、Service与商业模式。

## A2 Ontology & Causal Architecture｜本体与因果架构
定义Object、Link、State、Event、Perspective、Decision、Action、Outcome、Causal Edge。

**原则：先定义真实世界，再定义数据库。**

## A3 Data, Knowledge & Evidence Architecture｜数据知识证据架构
至少区分Identity、Operational、Event、Perspective、Knowledge、Content、Evidence、Causal Data。

## A4 Model & World Model Architecture｜模型与世界模型架构
采用Model Portfolio，而非单一大模型：Foundation、Embedding、Reranker、Risk、Growth State、Recommendation、Causal、World Model等。

## A5 Agent, Decision & Action Architecture｜Agent与决策架构
每个Agent必须明确Purpose、Object、Decision、Evidence、Tool、Memory、Allowed Action、Forbidden Action、Human Gate、Eval。

## A6 Application & Experience Architecture｜体验架构
设计语言统一为 **Warm Intelligence**。产品第一入口是“我们家的成长”，不是“有什么想问AI”。

## A7 Platform & Engineering Architecture｜平台与工程架构
建设Family Core、Ontology、Model Gateway、Agent Runtime、Knowledge、Workflow、Evaluation、Observability、Safety与Causal Data。

## A8 Evaluation, Governance, Safety & Trust｜评测治理可信架构
从Day 1建设Professional Eval、Grounding、Safety、Adversarial、Human Eval、Outcome Eval、Audit、Consent与Traceability。

---

# 5. 九阶段实施生命周期

## L0 Strategy Alignment
战略、Owner、North Star、边界。

## L1 Discover
用户、LifeStage、Growth Objective、Decision、Outcome。

## L2 Model the World
完成Ontology、Action、Event、Outcome设计。

## L3 Build Evidence
数据、知识、Intervention、Evidence与权限准备。

## L4 Design Intelligence
决定模型、Agent、Decision、Human Gate、Eval。

## L5 Build Vertical Slice
必须完整跑通 `State → Decision → Action → Outcome`。

## L6 Evaluate
Professional / Safety / Adversarial / Human / Performance / Cost评测。

## L7 Pilot
按30 → 100 → 500家庭推进，真实采集Context、State、Action、Dose、Mediator、Outcome。

## L8 Learn & Scale
根据真实Outcome更新Knowledge、Intervention、Policy、Prompt、Model和Journey，再扩大年龄、场景、城市与自动化。

---

# 6. 四大闭环

**Family Growth Loop**：Profile → Priority → Intervention → Action → Event → Milestone → Outcome → New Profile。

**AI Learning Loop**：Context → Recommendation → Human Decision → Action → Outcome → Evaluation → Update。

**Knowledge-Causal Loop**：Content → Claim → Evidence → Intervention → Real Family → Outcome → Validate/Reject/Refine。

**Governance Loop**：Risk → Policy → Control → Monitor → Finding/Incident → Improvement。

---

# 7. AI自治等级

- AL0：查询与信息
- AL1：Recommendation
- AL2：Draft + Human Confirmation
- AL3：低风险自动Action
- AL4：边界内自治
- AL5：高度自治

Family近期专业干预主要控制在 **AL1—AL2**。高风险场景必须Human Gate。

---

# 8. World Model成熟度

- WM0 Knowledge AI
- WM1 Ontology-aware AI
- WM2 Decision-Action AI
- WM3 Outcome-learning AI
- WM4 Causal Family Model
- WM5 Simulation World Model
- WM6 Adaptive Policy

Family近期建设顺序：**WM1 → WM2 → WM3 → WM4**。

没有Outcome、时间序列State、Causal Evidence与Causal Episode之前，不训练大型World Model。

---

# 9. 研发与项目门禁

## Gate 0｜Strategy
Business Owner与Outcome明确。

## Gate 1｜Ontology
核心Object、Link、Action、Outcome评审通过。

## Gate 2｜Data
来源、Consent、权限、迁移规则明确。

## Gate 3｜Vertical Slice
Profile→Outcome端到端跑通。

## Gate 4｜Evaluation
Professional/Safety/Adversarial达到上线阈值。

## Gate 5｜Pilot
人工支持、退出机制、风险升级、回滚准备完毕。

## Gate 6｜Scale
真实Outcome和数据质量达到阈值后才扩量。

---

# 10. Definition of Ready

每个Story进入Sprint前必须回答：

1. 当前LifeStage是什么？
2. 属于Child / Parent / Relationship哪个Domain？
3. 涉及哪个Object？
4. 支持哪个Decision？
5. Evidence是什么？
6. Recommendation是什么？
7. Named Action是什么？
8. Human Gate是什么？
9. Outcome是什么？
10. 如何Eval？

---

# 11. Definition of Done

一个AI功能只有同时满足以下条件才算完成：

- Functional
- Domain Correct
- Evidence Grounded
- Safe
- Evaluated
- Traceable
- Actionable
- Outcome-ready
- Observable
- Rollback-ready

“页面开发完成”不等于完成。

---

# 12. 最终验收八问

1. Value：创造什么真实家庭价值？
2. World：系统真的理解家庭世界吗？
3. Evidence：依据是什么？
4. Decision：AI支持什么判断？
5. Action：最终改变什么真实行为？
6. Outcome：如何证明成长发生？
7. Safety：AI错了怎么办？
8. Learning：结果如何让下一次更好？
