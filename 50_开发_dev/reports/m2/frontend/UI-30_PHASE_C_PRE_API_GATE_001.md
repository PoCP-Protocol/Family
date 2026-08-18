# UI-30 Phase C Pre-API Gate 001

## Research/Needs summary

UI-30 是家庭查看年度会员、权益和服务入口的场景。Broad Research 必须覆盖家长、孩子、教师/服务者、顾问、运营和客服在会员状态、权益范围、到期、续费、退款、发票、客服和通知方面的真实需求；同时核对 UI-30 原始基线、Family SSOT、Membership、Entitlement、Order、ServiceAccess、Consent 和 Audit 对象。Needs Analysis 必须分别记录 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家/榜样教育/波波校长材料最高 E1，仅作为 Hypothesis/Design Input，不能自证效果、资质、价格或权益事实。

## BA Design summary

候选对象为 `MembershipProjection`、`EntitlementProjection`、`ServiceAccessProjection`、`OrderProjection`、`RenewalIntentDraft`、`RefundRequestDraft`、`SupportCaseDraft`、`ConsentGrant`、`HumanGateReview` 和 `AuditEvent`。页面只展示有来源、版本和生效时间的会员/权益 projection；续费意向、退款申请和客服草稿必须与已成立订单、付款、退款、权益变更和客服处理区分。不得把会员等级、权益数量、使用次数或推荐文案解释成家庭价值、效果事实、排名或总分。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/annual-member-mine-reference-532x994.png`，核对会员头部、状态/到期信息、权益卡片、服务入口、续费/客服热点、价格与说明、空态、异常态、权限态、文案、颜色、间距和移动端尺寸。视觉复刻不等于会员已生效、付款已完成或权益已兑现，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`MembershipProjection`、`EntitlementProjection`、`ServiceAccessProjection`、`OrderProjection`、`RenewalIntentDraft`、`RefundRequestDraft`、`SupportCaseDraft`、`ConsentGrant`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

会员、权益、订单和服务入口只读自 family-scoped projection；续费、退款、客服和权益申诉最多形成 Controlled Draft。付款、续费、退款、权益变更、通知、客服外联、发票、下载和分享均为 External Effect，必须通过 Named Action、Consent、Audit、Human Gate 和 Adapter；本阶段全部 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

家庭成员、儿童服务权益、支付信息、退款理由、客服记录和外部通知需要明确 Consent purpose 与访问范围。AI 只能经 Model Gateway 对已存在的会员/权益资料生成解释或客服问题草稿，不得直接写 Membership、Entitlement、Order、Refund 或 Support ontology。Ontology Adapter 只接收批准的 Named Action，DEV 保证 no-op。

## Backend/API dependency candidates

候选 `MembershipProjectionService`、`EntitlementProjectionService`、`ServiceAccessProjectionService`、`OrderProjectionService`、`RenewalIntentBoundary`、`RefundRequestBoundary`、`SupportCaseDraftBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`PaymentAdapter`、`NotificationAdapter`、`SupportAdapter`、`InvoiceAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Membership、Entitlement、ServiceAccess 和 Order 的权威来源、版本、生效/失效和纠错规则是什么？
2. 续费、支付、退款、权益变更和客服草稿与正式业务状态如何分层？
3. 儿童服务权益、支付信息、退款理由、客服记录和通知需要什么 Consent 与 Human Gate？
4. 价格、权益、到期、使用次数和“专属/保障/有效”等文案的证据来源是什么？
5. 支付、退款、通知、发票、客服和分享 Adapter 如何实现 DEV no-op、幂等、审计和撤回？

## Required tests/screenshot diff preparation

准备会员/权益来源缺失、过期、订单状态冲突、无 Consent、儿童权益、续费/退款/客服草稿分离、重复提交、支付/通知/发票/客服 no-op、Human Gate、Audit，以及会员/空/错误/权限/HOLD 状态截图与基线 diff。
