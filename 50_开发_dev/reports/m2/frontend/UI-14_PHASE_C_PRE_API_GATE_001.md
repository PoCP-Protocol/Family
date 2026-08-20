# UI-14 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-14 是商品/成长服务详情页。本文件只做 Research、Needs Analysis、BA、视觉和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation、视觉修复或动态代码开发。

## Research/Needs Summary

研究用户如何理解服务/商品适用范围、内容、限制、价格和权益，避免导购与效果承诺；角色包括家长、孩子、服务者、运营和 AI；baseline 为 `apps/web/public/bangyang-reference/ui18/commerce-02-product-detail.png`。候选 SSOT 包括 Offering、ProductProjection、Provider、Entitlement、CommerceIntent、Consent、HumanGate、Evidence。Needs 必须拆分 User/Business/Operational/Compliance/Data/AI Need；详情解释不等于推荐、购买或权益事实。

30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input，不能自证效果、资质、价格或商业结果。

## BA Design Summary

页面目标是展示一个 Offering/Product 的事实性描述、服务范围、适用条件、提供者来源、权益/限制、FAQ 和受控下一步。候选对象包括 Offering、ProductProjection、Provider、EntitlementProjection、CommerceIntent、Evidence、ConsentGrant、HumanGateReview、OrderDraft。首轮只能 Read Projection/Controlled Draft；购买、支付、退款、订单和权益变更是 External Effect HOLD。

## Visual Fidelity Brief Summary

需对标 UI-14 原图的详情头图、标题、标签、价格/权益区、内容模块、提供者/资质区、FAQ、底部 CTA、权限提示和移动端布局。所有按钮先作为静态入口或 HOLD，不伪造开发后截图或 pixel diff。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`Offering`、`ProductProjection`、`Provider`、`Evidence`、`EntitlementProjection`、`CommerceIntent`、`OrderDraft`、`ConsentGrant`、`HumanGateReview`、`AuditEvent`。价格/权益/资质必须有来源和版本。

## Read Projection vs Named Action Boundary

详情读取、FAQ、权益说明和版本查看是 Read Projection；咨询/收藏/加入意向可以 Controlled Draft；购买、支付、退款、兑换、订单确认和权益变更必须经过 Named Action、Consent、Audit 和 Payment/Commerce Adapter。不能用页面点击直接写 Order/Entitlement。

## Consent/Human Gate/Model Gateway/Ontology Adapter Boundary

家庭/儿童服务用途需 Consent；真人服务适配、敏感建议、商业利益冲突和任何付款需 Human Gate。AI 只能经 Model Gateway 做解释/FAQ 草稿，不写 Product/Order/Payment/Entitlement；Ontology Adapter 只接收批准动作。Payment、Notification、Share 全部 External Effect HOLD。

## Backend/API Dependency Candidates

候选：`OfferingDetailProjectionService`、`ProviderEvidenceService`、`EntitlementProjectionService`、`CommerceIntentBoundary`、`OrderDraftBoundary`、Consent/HumanGate policy、PaymentAdapter、AuditService、ModelGatewayAdapter、OntologyAdapter。仅列候选，不定义 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Offering/Product 的正式类型、提供者和适用条件如何确定？
2. 价格、权益、退款、有效期和资质的 authoritative source 是什么？
3. 详情 CTA 是咨询、意向、订单草稿还是购买 Action？
4. Payment/Refund/Entitlement 的 adapter、Consent、Human Gate 和审计谁负责？
5. 效果、成功率、排名和推荐文案如何禁止事实化？
6. AI FAQ/解释如何限制为有来源的建议/草稿？
7. 版本变更、下架、无权限和库存/资格不足如何 fail-closed？

## Required Tests/Screenshot Diff Preparation

需准备 offering provenance、价格/权益版本、无支付副作用、订单/权益不自动创建、Consent/资格缺失、退款状态只读、Model Gateway schema rejection、Payment adapter no-op、API/Web contract、Playwright desktop/mobile 和详情/空/权限/HOLD 状态截图准备。当前无运行截图。

## Status

`HOLD_EXTERNAL_EFFECT`；本文件不授权 API Contract 或代码开发。
