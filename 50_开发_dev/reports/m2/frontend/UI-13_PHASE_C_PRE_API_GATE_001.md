# UI-13 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-13 是家庭成长商城首页。本文件只做 Broad Research、Needs Analysis、BA、视觉和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation、视觉修复或动态代码开发。

## Research/Needs Summary

研究家庭为什么需要按成长需求发现服务/内容，而不是被导购或强制购买；角色包括家长、孩子、服务者、运营和 AI；baseline 为 `apps/web/public/bangyang-reference/ui18/commerce-01-mall-home.png`。候选 SSOT 包括 FamilyContext、Need、Offering、Provider、Entitlement、ProductProjection、Consent、HumanGate、CommerceAdapter。Needs 分为 User/Business/Operational/Compliance/Data/AI Need；商品/服务展示不是推荐决定，推荐不等于购买。

30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作为 Hypothesis/Design Input，不能自证效果、资质或商业成功。

## BA Design Summary

页面目标是展示经过治理的成长服务/内容供给、筛选、权益状态和安全说明。候选对象包括 FamilyContext、Need、Offering、Provider、ProductProjection、EntitlementProjection、CommerceIntent、ConsentGrant、HumanGateReview。首轮只允许 Read Projection；收藏/询问/加入意向最多为 Controlled Draft，真实订单、支付、扣款和权益变更必须另行 Named Action/External Effect Gate。

## Visual Fidelity Brief Summary

需对标 UI-13 原图的商城导航、banner、分类/筛选、商品/服务卡、价格/权益文案、推荐区域、空态/权限态和移动端间距。当前无开发后运行截图，不伪造差异。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Need`、`Offering`、`Provider`、`ProductProjection`、`EntitlementProjection`、`CommerceIntent`、`ConsentGrant`、`HumanGateReview`、`AuditEvent`。任何 AI 推荐默认是 Recommendation，不是 Decision/Order/Entitlement。

## Read Projection vs Named Action Boundary

商城列表、筛选、权益说明是 Read Projection；收藏、咨询或加入购物意向可为 Controlled Draft；下单、支付、购买、退款和权益变更必须通过 Named Action、Consent、Audit 和 Commerce/Payment Adapter。Dev/Test 可 no-op，但生产同构边界必须声明。

## Consent/Human Gate/Model Gateway/Ontology Adapter Boundary

家庭成员/儿童服务用途需要 Consent；真人服务、敏感家庭建议和商业化推荐需要 Human Gate。AI 只能经 Model Gateway 输出解释/建议草稿，不直接写 Offering、Order、Payment 或 Entitlement；Ontology Adapter 受控接收批准动作。Payment/Notification/Share adapters 全部 External Effect HOLD。

## Backend/API Dependency Candidates

候选：`OfferingCatalogProjectionService`、`EntitlementProjectionService`、`CommerceIntentBoundary`、`ConsentPolicy`、`RecommendationPolicy`、`HumanGateReviewService`、`PaymentAdapter`、`NotificationAdapter`、`AuditService`、ModelGatewayAdapter、OntologyAdapter。仅候选，不定义 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 哪些商城卡是成长服务/Offering，哪些是商业商品/Product？
2. 价格、权益、折扣和效果文案的事实来源是什么？
3. 推荐排序是否允许，如何禁止 Ranking/总分/导购化判断？
4. 家庭/儿童服务的 Consent 和真人服务 Human Gate 如何分层？
5. 收藏、咨询、意向、订单、支付和权益变更的 Named Action 边界是什么？
6. Payment、Refund、Notification、Share adapter 的 no-op 与真实生产边界如何确认？
7. AI 推荐的证据、低置信度和拒答如何显示？

## Required Tests/Screenshot Diff Preparation

需准备 tenant/family scope、offering provenance、无支付副作用、订单/权益不自动创建、价格/权益版本、Consent 缺失、推荐不写核心对象、Payment/Notification adapter no-op、API/Web contract、Playwright mobile/desktop 和商品卡/筛选/空/权限状态截图准备。当前无运行截图。

## Status

`HOLD_EXTERNAL_EFFECT`；本文件不授权 API Contract 或代码开发。
