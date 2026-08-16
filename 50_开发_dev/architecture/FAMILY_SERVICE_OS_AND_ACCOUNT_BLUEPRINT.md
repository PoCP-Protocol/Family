# FAMILY SERVICE OS & ACCOUNT —— 经营/交付母体架构(companion 蓝图)

```text
DOC_KIND = ARCHITECTURE_COMPANION(经营与交付母体;补 V3 缺失的 Service OS / Family Account 资产层)
PARENT   = architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md(最高战略 SSOT;本文件在其之下,不冲突)
RULING   = 总架构师(2026-08-16):把榜样教育"经营一个家庭整个生命周期"的操作系统装回 V3
状态      = DRAFT;RUNTIME = HOLD;0 code / 0 canonical;AUTO_MERGE = NO;不并入 PR#36
```

## 0. 纠偏与升级公式

V3 把"AI + 成长资源编排"做先进了,但因追求架构纯度**弱化了榜样教育的经营/交付母体**(产品→交付→陪伴→数据→报告→复购→长期关系)。Family 不能只是"遇到问题很聪明的 AI 编排平台",还必须是**经营一个家庭整个生命周期的操作系统**。

**升级公式(冻结):`Family = Growth Intelligence × Service OS × Family Account × Resource Network`。**
- Growth Intelligence = 理解与判断;Service OS = 真正把服务做完;Family Account = 长期关系与资产连续性;Resource Network = 组织社会资源。
- **AI 横跨四层,但不替代任何一层。**"AI 应放在交付闭环里,不放在品牌第一句里。"

品牌 Truth 原则:**承诺 Process Certainty(过程确定性),不承诺 Outcome Certainty**。
```text
Process Certainty = 遇问题有人接住 → 理解现在发生什么 → 知道下一步 → 服务真的发生 → 卡住有人处理 → 变化被记录 → 下次不从零。
（修正旧白皮书"用户购买孩子改变的确定性";平台不承诺 Outcome。）
```

## 1. 九层平台栈(第 5 层 Service OS 为本次补齐)

```text
1 FAMILY EXPERIENCE        Home / Growth / Service / Family
2 GROWTH INTELLIGENCE      Need / Intent / Capability / Context
3 RESOURCE INTELLIGENCE    Offer / Eligibility / Ranking
4 ORCHESTRATION            Decision / Plan / ServiceCase
5 SERVICE OPERATING SYSTEM ← 补:Steward / Attention / Alert / SLA / Advisor Workbench
6 PROGRAM DELIVERY         7/21/90-day / Task / Check-in
7 GROWTH PROGRESS          Review / Report / Evidence
8 FAMILY ACCOUNT ASSETS    Membership / Entitlement / Services
9 AI INTELLIGENCE          Family AI + Advisor Copilot
```

## 2. Family Growth Account(从"身份账户"升为"经营账户")

现状 Account 解决 Identity/Members/权限/Consent/Context(身份主权)。须扩为四类资产:
```text
Family Growth Account
├─ Identity          Family / Members / Relationships / Consent
├─ Growth Context    Need / Intent / Observation / Review
├─ Service Assets    Active ServiceCases / Programs / Appointments / Support
└─ Entitlement Assets Membership / Program / Consultation / Activity entitlement
```
**Entitlement 边界现在必须预留**(不做 Payment/Order Runtime):`Membership / Purchased Program / Sponsor Entitlement → Service Entitlement → Resource Eligibility`。
⇒ Resource Eligibility Gate(见 ARCH-001 §4)未来新增一个 **entitlement 维度**:某资源是否在家庭当前 Entitlement 覆盖内(V1 全 FREE,不 gate;但契约位预留)。

## 3. Service Operating System / Service Attention Layer(海底捞落地)

ServiceCase 已有 owner/status/next_action_at/ESCALATED,但还不是"交付操作系统"。补运营层(可为运行事件/投影,非必须核心 Aggregate):
```text
ServiceAttentionSignal ∈ { HIGH_RISK · SERVICE_STUCK · FOLLOWUP_OVERDUE · ENGAGEMENT_DROP · LOW_CONFIDENCE · DATA_CONFLICT · PROVIDER_DELAY · FAMILY_DISTRESS }
流程:Attention Signal → Family Steward Queue → Advisor Workbench → Acknowledge → Act / Escalate / Re-route → Close attention
```
运营视图:"今天 N 个家庭在服务;其中 需顾问处理 / 高风险 / 卡住 / 超 SLA / 明天需 Follow-up 各多少"。顾问诉求:"别让我翻聊天记录,告诉我今天最该关注谁、为什么、做什么"(家庭 360 / 高风险审核 / Alert / 调计划 / 记录人工干预)。

## 4. Program Resource Bridge(Program 仍是 Resource,但交付能力不能消失)

Program ≠ Platform(不变)。补 **Moment↔Program 升级规则**与交付桥:
```text
GrowthIntent → Capability → ResourceRecommendation → PROGRAM ResourceOffer → OrchestrationPlan → ServiceCase → Program Enrollment/Delivery → Daily Task → Check-in → Follow-up
升级阶梯:Moment → Repeated Moment → Micro Solution → 7-day → 21-day Program → 90-day Service → Annual Membership
```
Moment 解决"今天突发问题";Program 解决"反复发生、需 7/21/90 天系统性改变"。缺的不是 Program Runtime,是 **Moment→Program 的升级规则**。

## 5. Family Growth Progress Report = Evidence-bound Progress Projection(让改变被看见,但不越界)

不叫 Outcome Proof。严格分层展示(过去 21 天):尝试了什么 → 完成哪些任务 → 被确认发生的事件 → 家长反馈 → Observation → 哪里证据不足 → 下一阶段建议。
```text
分层:Service Facts | Family-Perceived Helpfulness | Confirmed Observations | Uncertainty | Next-Step Decision
绝不说"孩子提高 37%"。既守 Truth Architecture,又恢复"让改变被看见"(承担价值展示/续费/分享/长期档案)。
```

## 6. 交付人员 AI:Advisor Copilot(AI × 海底捞进组织)

现仅有家长面向 Principal/AI Coach,不够。下一阶段最该加的不是"孩子 Agent",而是 **Advisor Copilot(成长顾问智能助手)**:每天给顾问"今天最该处理的 10 个家庭 + 为什么(卡住 36h / 连续 NOT_HELPFUL_YET / 冲突升级 / AI confidence low)+ 建议动作"。用户侧 AI 提体验;员工侧 AI 提人效/一致性/响应/SLA/质量。呼应"从依赖名师→复制型组织"。

## 7. 三层指标(不混;补经营层)

```text
L1 Family Value        HGSLR · Helpfulness · Repeat Explanation Reduction
L2 Delivery Quality    完课/打卡 · Follow-up SLA · Escalation resolution · Program adherence · Advisor load · Human handoff success · Recommendation acceptance · Human review rate · Overturn rate · Risk recall · Agent-to-Action conversion · Alert count · 自动化处理比例
L3 Business Continuity Membership activation · Renewal · Family LTV · Natural referral · Entitlement usage
不变量:Renewal ≠ Growth Outcome;三层不混。
```

## 8. Acquisition / Sponsor Context(增长入口=账户来源关系)

Family Account 须记最小 `acquired_via ∈ { CONTENT · REFERRAL · PROGRAM · CITY_EVENT · SCHOOL · EMPLOYER · COMMUNITY · PUBLIC_BENEFIT · PAID · DIRECT }`。来源决定 Entitlement / Consent / Service path / Data access / Commercial relationship(呼应 `User ≠ Buyer ≠ Payer ≠ Beneficiary`,见 [[family-commerce-architecture]])。**Sponsor 仍不得家庭私有 Context,只得匿名统计。**

## 9. 旧语义纠正:Assessment / Diagnosis / 承诺

```text
Assessment:onboarding 前置 → 降为 Optional Resource(未来重进,不阻挡首次价值)。
Diagnosis:永久退出普通家庭成长语义 → Working Hypothesis / Need Understanding / Risk Assessment(除非合资格医疗/心理专业服务)。
旧 Assessment→Diagnosis→Plan  映射为  Moment/Optional Assessment → GrowthNeedSignal → 显式 GrowthIntent → Capability → Recommendation → FamilyDecision → OrchestrationPlan。
```

## 10. 现在必须设计 vs 现在不要开发

**现在纳入架构(否则返工)**:① Family Account Asset/Entitlement ② Advisor/Steward Workbench ③ ServiceAttentionSignal/Alert/SLA ④ Program Resource Bridge ⑤ Growth Progress Report Projection ⑥ Advisor Copilot ⑦ Acquisition/Sponsor Context ⑧ Delivery Metrics Contract。
**PR#36 现在不加**:仍仅证明 `Moment → Help → Decision → Service → Follow-up → Context Reuse`,不塞以上八项(否则首条纵切失控)。

## 11. 路线修订(覆盖上轮"#36→AI-INTELLIGENCE-001")

```text
#36 做完 → FAMILY-SERVICE-OPERATING-SYSTEM-001(仅四件:ServiceCase→Steward/Advisor ownership;→Attention/Alert/SLA;Program Resource→Delivery/Task/Check-in bridge;Service History→Progress Report Projection)
→ FAMILY-AI-INTELLIGENCE-001(此时才有真实交付数据可学:谁需帮助/为什么/顾问做了什么/是否卡住/什么被采用/升级/反馈)
→ 治理化 Family Growth Dataset → 才训模型(先数据结构后模型)。
```
先补业务操作系统,再做高级 AI Intelligence;否则回到"AI 很聪明但没有真正交付数据"。
