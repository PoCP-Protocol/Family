# UI-16 Phase C Pre-API Gate 001

## Research/Needs summary

UI-16 为拼团/组合购买场景。研究家庭购买成长服务时的真实需求、价格和规则理解，以及团购压力、儿童参与、库存和反滥用风险。角色包括家长、邀请对象、运营、服务者和系统/AI。需求拆分为 User、Business、Operational、Compliance、Data、AI Need；30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## BA Design summary

候选对象为 FamilyContext、Offering、GroupBuyCampaign、GroupMember、InventoryProjection、OrderDraft、PaymentIntent、EntitlementProjection、ConsentGrant、AbuseReview。团购规则/状态是投影，不是订单事实；推荐不等于决定，决定不等于外部行动。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/ui18/commerce-04-group-buy.png` 的团购 banner、人数/进度、规则、价格、倒计时、按钮、空态、权限态和移动端间距。当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

活动、进度、资格和价格是 Read Projection；保存团购意向最多是 Controlled Draft；加入团购、支付、库存锁定、订单创建、通知和权益发放必须是 Named Action，并经过 Consent、Audit、Payment/Commerce/Notification Adapter 与 Human Gate。所有 External Effect HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

家长/儿童参与、邀请对象和商业活动需 Consent；异常价格、反滥用、退款争议和真人服务需 Human Gate。AI 只能经 Model Gateway 解释规则或生成草稿，不写 GroupMember/Order/Payment/Entitlement；Ontology Adapter 只接收批准动作。

## Backend/API dependency candidates

候选 `GroupBuyProjectionService`、`InventoryProjectionService`、`CommerceIntentBoundary`、`ConsentPolicy`、`AbuseReviewService`、`PaymentAdapter`、`NotificationAdapter`、`EntitlementAdapter`、`AuditService`、ModelGatewayAdapter、OntologyAdapter；仅候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 团购、库存、价格和资格的 authoritative source 是什么？
2. 加入团购是否产生 draft、reservation 还是正式订单？
3. 支付、库存锁定、通知、退款和权益发放如何分离？
4. 儿童/邀请对象 Consent 和反滥用 Human Gate 如何执行？
5. 倒计时、人数和优惠文案是否会构成商业承诺？

## Required tests/screenshot diff preparation

准备 family/tenant scope、价格/库存版本、重复加入、无支付副作用、Consent 缺失、退款/超时、通知 adapter no-op、Named Action 幂等、Audit、API/Web contract、Playwright mobile/desktop 和静态/空/权限/HOLD 截图准备。
