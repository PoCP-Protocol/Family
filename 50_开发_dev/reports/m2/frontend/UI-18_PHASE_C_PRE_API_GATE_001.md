# UI-18 Phase C Pre-API Gate 001

## Research/Needs summary

UI-18 为会员中心/权益场景。研究家庭为何需要理解会员服务范围、有效期和使用记录，以及续费、退款、权益变更和商业承诺风险。角色包括家长、孩子、运营、服务者、客服和系统/AI。需求拆分为 User、Business、Operational、Compliance、Data、AI Need；30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## BA Design summary

候选对象为 FamilyContext、MembershipPlan、MembershipEntitlement、EntitlementProjection、SubscriptionDraft、RefundRequest、ConsentGrant、HumanGateReview、AuditEvent。会员展示、权益资格和使用记录是 projection；续费、退款和权益改变不是页面事实，必须经过受控动作和外部适配器。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/ui18/commerce-06-membership.png` 的会员卡、权益列表、有效期、状态标签、续费/客服入口、空态/权限态和移动端间距。当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

会员计划、有效期、权益和使用摘要是 Read Projection；保存续费/退款意向最多是 Controlled Draft；续费、退款、权益变更、通知、支付和客服联系必须是 Named Action，经 Consent、Audit、Payment/Notification/Service Adapter 与 Human Gate。External Effect 全部 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

会员与家庭成员可见性需 Consent；退款争议、儿童权益、真人客服和权益裁定需 Human Gate。AI 只能经 Model Gateway 解释会员规则或生成客服草稿，不写 Membership/Payment/Entitlement；Ontology Adapter 只接收批准动作。

## Backend/API dependency candidates

候选 `MembershipProjectionService`、`EntitlementReadModel`、`SubscriptionDraftBoundary`、`RefundReviewService`、`ConsentPolicy`、`HumanGateReviewService`、PaymentAdapter、NotificationAdapter、ServiceAdapter、AuditService、ModelGatewayAdapter、OntologyAdapter；仅候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 会员计划、权益和有效期的 authoritative source 是什么？
2. 续费、退款、权益变更和客服联系是否分别建模为 Named Action？
3. 价格、权益和有效期文案如何保证 provenance 与版本一致？
4. 儿童权益、共享家庭权限和 Consent 撤回如何处理？
5. Payment/Notification/Service adapter 的 no-op 与生产边界如何批准？

## Required tests/screenshot diff preparation

准备会员版本、family scope、权限/Consent 缺失、退款/续费幂等、权益变更审计、外部 adapter no-op、客服 Human Gate、API/Web contract、Playwright mobile/desktop 和会员有效/过期/空/权限/HOLD 截图准备。
