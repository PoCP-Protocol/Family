# FAMILY GROWTH PLATFORM —— 商业架构蓝图(Commerce SSOT)

```text
DOC_KIND = COMMERCE_BLUEPRINT(商业架构 SSOT;架构 + Phase roadmap only)
PARENT   = architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md(最高战略 SSOT;本文件在其之下,不得与之冲突)
RULING   = 总架构师(2026-08-16):Family = 孩子与家庭成长服务【交易与编排】平台
状态      = DRAFT;RUNTIME = HOLD(Payment / Commission / Settlement Runtime 均未授权);AUTO_MERGE = NO
```

## 0. 交易本质(定版一句话)

> **Family 不是把"服务商的商品"摆上货架卖,而是从孩子和家庭的成长需求出发,先判断需要什么能力,再组织合适资源形成解决方案(Growth Solution),由家庭或其 Sponsor 购买,并由平台负责服务编排、过程治理、贡献记录与未来结算。**

平台主要出售的不是"商品",而是 **Growth Solution(成长解决方案)**。

## 1. 卖什么:三层价值 / 六层 Catalog

```text
RESOURCE(资源) → SOLUTION(方案) → RELATIONSHIP(关系)
单次收入          方案收入          长期 LTV
```
| 商品层 | 用户买什么 | 示例 | 核心对象 |
|---|---|---|---|
| L1 Resource | 一个资源 | 内容 / AI 陪练 / 练习 / 测评 / 专家 45min | `ResourceOffer` |
| L2 Micro Solution | 小问题解决方案 | 3 天 / 7 天手机冲突方案 | Solution(Offer bundle) |
| L3 Growth Program | 系统成长方案 | 21 天沟通计划 | Program(=PROGRAM_RESOURCE) |
| L4 Expert Solution | 专业组合服务 | AI + 顾问 + 专家 | Solution(multi-provider) |
| L5 Membership | 持续成长服务 | 年度家庭成长会员 | Entitlement(subscription) |
| L6 Lifecycle Solution | 阶段综合方案 | 青春期 / 升学 / 家庭转型 | Solution(program-of-programs) |

**利润与壁垒最大者 = L4–L6,而非 L1。** 最值钱的不是某一笔交易,而是 **Family 成为家庭可信赖的成长关系层(trusted growth relationship layer)**。

## 2. 谁卖:Growth Resource Provider(统一术语,取代 Seller)

Provider ∈ { Family 自营 · Expert 个人 · Institution 机构 · Content/Program Creator · AI/Infrastructure Provider · External Professional Service }。
- 五类供给分期:**① Family 自营先行(无自营无法验证平台)** → ② 认证专家 → ③ 专业机构 → ④ 内容/Program/IP Provider → ⑤ AI/技术基础设施 Provider(家庭无需感知底层调用谁,如打车不关心地图 API)。
- 机构不是"开店",而是**向平台提供某个 Growth Capability**(平台关心 Capability/Qualification/AgeScope/RiskBoundary/Availability,而非品牌招牌)。
- 入网前必过 Eligibility:`Qualification / Capability / Scope / Risk Boundary / Service Quality`(见母蓝图 §4 Eligibility Gate)。
Provider 提供 `ResourceOffer`;Family 负责:资格审核 · 能力描述 · 匹配 · 编排 · 交易 · 服务追踪 · 质量治理 · 结算。

## 3. 谁买:Family Account + Sponsor(角色分离)

**User ≠ Buyer ≠ Payer ≠ Beneficiary。** 典型:孩子=Beneficiary/Growth Subject · 妈妈=User+Decision Maker+Payer · 家庭=Account。
第一购买主体 = **家庭(Family Account)**,不是"孩子"。Family Account 下含 Members / Children / Decision Makers / Payers / Sponsors / Entitlements。
**Sponsor/Payer 可与 Family 分离**(企业/学校/政府/公益买单,家庭使用,数据仍归家庭):
```text
家庭 → Family                 C2P(家庭直购)
学校 → Family → 家庭           B2B2F
企业 → Family → 员工家庭        B2B2F(Employee Family Benefit)
政府/公益 → Family → 家庭       G2F / Sponsor-to-Family
机构 → Family → 家庭           Provider Marketplace
```
铁律:`Payer = Company/School/Gov` 时,`Family Account = Family`、`Data Sovereignty = Family` 彻底分离;Sponsor 只得**匿名服务统计**,绝不得孩子档案。

## 4. 怎么交易:Need-driven Commerce(需求驱动,非货架搜索)

```text
家庭"遇到什么问题" → GrowthIntent → GrowthCapability → Eligibility Gate → ResourceOffers → ResourceRecommendation
→ OrchestrationPlan → 家庭确认 → Quote/Offer → Order → Entitlement → ServiceCase → Delivery → Follow-up → Settlement
```
Order 不再对应单一 SKU,而是对应一个 Growth Solution(可含多 Resource + Human Service)。

## 5. 商业域对象(与成长链并行,新增)

```text
成长链(母蓝图 §2b,已冻结): GrowthNeedSignal → GrowthIntent → GrowthCapability → ResourceOffer → ResourceRecommendation → OrchestrationPlan → ServiceCase → ServiceContribution
商业链(本蓝图,新增):        Provider · CatalogListing · Offer · Quote · Order · Entitlement · Payment · Allocation · Settlement · Sponsor
连接:  GrowthIntent → OrchestrationPlan → Commercial Offer → Family Decision → Order/Entitlement → ServiceCase → ServiceContribution → Settlement
```

## 6. 最高架构原则:成长链**治理**商业链(不可反向)

```text
允许:  Growth Orchestration → Commercialization(先定什么最适合家庭,再问怎么付钱)
禁止:  高利润产品 → 推荐给家庭
```
长期不变量(与母蓝图 §4 一致):**`PLATFORM_REVENUE = NOT_A_RANKING_SIGNAL`;`PLATFORM_MARGIN_RANKING_SIGNAL = 0`**。这是 Family 最重要的品牌信任壁垒。

## 7. 四家机制在交易层的落地

```text
拼多多 → Demand Aggregation Purchase(非砍价):匿名聚合同类需求→ Group Growth Clinic(专家直播专题 + AI 个性化 Follow-up + Practice),需求规模↓服务成本;家庭付更少、专家单位时间收入↑、平台得组织价值。
字节   → Offer Timing as product quality:正确时间出现正确 Offer(刚冲突→免费建议/¥9.9 练习,反复三次→¥199 Micro,复杂→¥399 Coach);禁"不停推付费"。
海底捞 → PAYMENT ≠ TRANSACTION COMPLETE:Purchased→Started→Delivered→Follow-up→Resolved/Closed 才算完整交易;真人服务由 Family Steward 负责到底(交易+服务一体化)。
贝壳   → 按贡献分钱,非按客户归属:Order→ServiceCase→ServiceContributions→Allocation→Settlement;比例现不冻结,重点=贡献角色分账。
```

## 8. 价格与收入

**定价三模式**:① Family 自营=Family 定价 · ② 第三方标准服务=Provider `list_price` + 平台价 · ③ 复杂 Solution=Orchestrator 生成 `Quote`(用户只看"一个方案多少钱",不见后台多服务商)。
**交易五模式**:Direct Purchase · Membership(长期核心)· Pay-per-Service · **Solution Bundle(未来最重要,体现 Orchestration Value)** · Sponsored Entitlement。
**六层收入**:1 Membership · 2 自营 Resource/Program · 3 Human Service Margin · 4 Third-party Transaction Fee · 5 Provider Platform Fee(SaaS/流量/AI/基础设施)· 6 B2B/B2B2F。长期三大核心 ≈ **Membership + B2B2F + Service Transaction**。

## 9. 客户归属(必须冻结)

```text
Family Account belongs to Family。
Provider owns:      its service capability · its IP · its permitted service records。
Provider does NOT own:  the Family relationship · the Family longitudinal context。
```
一句话:**平台维护规则,家庭拥有关系,服务者获得贡献收益。** 防"专家入网即导出客户"与"平台把专家当工具"两种不信任。

## 10. 三/四边市场

需求端=家庭;供给端=Provider;支付端=家庭/企业/学校/政府/公益 Sponsor;平台=Family(规则/编排/治理/结算)。

## 11. Phase Roadmap(锚定母蓝图 M0–M8;商业化在网络/经济价值层,严格后置)

```text
M1–M5 单家庭价值(先证明连续+可复用)期间: 仅 L1/L3 自营直购 + Membership 雏形所需最小 Entitlement;不建佣金/分账/多方结算。
M6 DEMAND_NETWORK_READY   → 拼多多 Group Clinic(Demand Aggregation Purchase)架构。
M7 COLLABORATION_NETWORK_READY → 贝壳 FGCN:ServiceContribution → Allocation(仍不结算真金)。
M8 PLATFORM_ECONOMICS_READY   → Payment / Settlement / Provider Platform Fee / B2B2F Sponsor 结算 Runtime(最后)。
```
对应 Phase(母蓝图 §8):Provider/Offer/Quote/Order/Entitlement 架构契约 ≈ Phase 7–8;Allocation/Settlement/Sponsor ≈ Phase 8–10。
**本蓝图交付边界 = 架构 + roadmap;`Payment / Commission / Settlement Runtime = HOLD`(需独立 per-phase 授权 + Architecture Gate)。**

## 12. DO_NOT_BUILD / HOLD(商业域)

现在**不建**:Payment 网关 · Commission/分账引擎 · Settlement Runtime · Provider bidding/竞价 · Marketplace 商城式货架 · 砍价裂变 · 利润驱动排序。
任何商业对象若使 `PLATFORM_REVENUE` 进入排序、或让商业链反向控制成长链、或使 Provider 获得 Family 关系所有权 → **架构违规,拒绝**。
