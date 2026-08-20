# UI-32 Phase C Pre-API Gate 001

## Research/Needs summary

UI-32 是家庭查看订单、权益和数字资产的场景。Broad Research 必须覆盖家长、孩子、运营、客服和服务供给方在订单状态、权益、付款、退款、下载、分享、发票、隐私和通知方面的真实需求，并核对 UI-32 基线、Order、Entitlement、Asset、Membership、Consent 和 Audit 来源。Needs Analysis 分别覆盖 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家、榜样教育和波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## BA Design summary

候选对象为 `OrderProjection`、`EntitlementProjection`、`AssetProjection`、`MembershipProjection`、`PaymentStatusProjection`、`RefundRequestDraft`、`DownloadIntentDraft`、`ShareIntentDraft`、`ConsentGrant`、`HumanGateReview` 和 `AuditEvent`。订单、权益、资产和支付状态只展示有来源的 projection；退款、下载、分享和权益变更不得伪造为已完成。不得把权益数量、消费记录或推荐解释为家庭总分、排名或效果事实。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/orders-assets-reference-552x1010.png`，核对导航、订单卡片、状态、权益/资产区、下载/分享/客服热点、价格文案、空态、错误态、权限态、颜色、间距和移动端尺寸。视觉复刻不等于订单已付款、退款已完成或资产可外发，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`OrderProjection`、`EntitlementProjection`、`AssetProjection`、`MembershipProjection`、`PaymentStatusProjection`、`RefundRequestDraft`、`DownloadIntentDraft`、`ShareIntentDraft`、`ConsentGrant`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

订单、权益、资产和付款状态只读 projection；退款、下载、分享、客服和权益申诉最多形成 Controlled Draft。付款、退款、下载、分享、通知、发票和权益变更均为 External Effect，必须经 Named Action、Consent、Human Gate、Audit、幂等及外部 Adapter，本阶段 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

支付信息、儿童权益、数字资产、外部分享和客服记录需要 Consent purpose、权限、撤回和审计。AI 只能经 Model Gateway 解释已有订单/权益或生成客服问题草稿，不得直接写 Order、Entitlement、Asset、Refund 或 Payment ontology；Ontology Adapter 只接受批准动作，DEV no-op。

## Backend/API dependency candidates

候选 `OrdersAssetsProjectionService`、`EntitlementProjectionService`、`AssetProjectionService`、`RefundRequestBoundary`、`DownloadAdapter`、`ShareAdapter`、`PaymentAdapter`、`InvoiceAdapter`、`NotificationAdapter`、`ConsentPolicy`、`HumanGateReviewService`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Order、Entitlement、Asset 和 PaymentStatus 的权威来源、版本和纠错规则是什么？
2. 退款、下载、分享、发票、客服和权益变更的 draft 与正式状态如何分层？
3. 支付信息、儿童权益、资产可见性和外部分享需要哪些 Consent/Human Gate？
4. Payment、Refund、Download、Share、Notification 和 Invoice Adapter 如何保证 no-op、幂等和审计？

## Required tests/screenshot diff preparation

准备订单/权益来源缺失、状态冲突、无 Consent、儿童资产、退款/下载/分享草稿分离、重复提交、外部 Adapter no-op、Human Gate、Audit，以及订单/空/错误/权限/HOLD 截图与基线 diff。
