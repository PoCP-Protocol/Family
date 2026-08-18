# UI-21 Phase C Pre-API Gate 001

## Research/Needs summary

UI-21 是家庭选择在线咨询并形成预约意向的场景。Broad Research 必须覆盖家长、孩子、教师/服务者、顾问和运营在咨询前的信息需要、时间选择、取消与改期规则、未成年人保护、服务资质来源，以及 UI-21 原始基线的页面层级。Needs Analysis 必须分别确认 User、Business、Operational、Compliance、Data、AI Need；不得把预约意向当成已成立服务事实。30_素材_materials 只读，优先使用 `_extracted/逐页文本_含页码/`，不得使用 `all_materials.txt` 作主证据；自家材料、榜样教育、波波校长材料最高 E1，只能作为 Hypothesis/Design Input，不能自证效果、诊断、资质或因果关系。

## BA Design summary

候选对象为 `ServiceProvider`、`Offering`、`AvailabilitySlot`、`ProviderDetailProjection`、`BookingDraft`、`ConsentGrant`、`HumanGateReview`、`AuditEvent` 和 `CorrelationContext`。页面目标是让用户查看有来源的服务供给、选择候选时段并保存受控预约草稿；不承诺占座、确认服务、服务效果或真人响应。必须区分 Fact、Perspective、Hypothesis、Recommendation、Decision、Action，并把 Recommendation 与 Decision、Named Action 分开。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/consultation-booking-reference-492x1008.png`，逐项核对顶部导航、服务者信息、咨询说明、日期/时间选择、价格或权益提示、主按钮、说明文案、空态、错误态、权限态和移动端间距。视觉复刻不等于预约业务事实，当前没有运行后截图，不伪造 pixel diff。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

服务者、Offering、可用性和价格/权益摘要只能来自 family-scoped read projection；选择时段只能形成 `BookingDraft` 或 `ConsultationIntentDraft`。确认预约、占座、支付、发送通知、建立真人联系、写入日历或视频会议均属于 External Effect，必须经过 Named Action、Consent、Audit、Human Gate 和生产同构 Adapter；本阶段全部 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

读取服务供给需要明确家庭范围和 SERVICE consent。涉及儿童敏感信息、健康/教育判断、真人服务联系或争议资质时必须进入 Human Gate。AI 只能经 Model Gateway 对已有证据生成问题草稿或解释，不得直接写入 Booking、ServiceCase、Consent 或 Provider ontology。Ontology Adapter 只接受经批准的 Named Action，并在 DEV 保证 no-op。

## Backend/API dependency candidates

候选能力包括 `ProviderAvailabilityProjectionService`、`ConsultationBookingDraftBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`AuditService`、`IdempotencyKey`/`CorrelationContext`、`NotificationAdapter`、`PaymentAdapter`、`CalendarVideoAdapter`、`ModelGatewayAdapter` 和 `OntologyAdapter`；这里只列依赖候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 可用时段、服务资质、价格和权益的来源、版本、证据等级及失效规则是什么？
2. `BookingDraft`、正式 Booking、ServiceCase 和外部占座之间的状态边界是什么？
3. Consent purpose、家庭成员范围和未成年人参与规则如何绑定到预约动作？
4. 预约确认、支付、通知、日历、视频和真人联系的 Adapter 与 Human Gate 是否允许在 DEV no-op？
5. 取消、改期、重复提交、超时和时段失效如何保证幂等、审计和用户可见错误？

## Required tests/screenshot diff preparation

准备 family/provider scope、无 SERVICE consent、儿童敏感内容、时段过期、重复提交、BookingDraft 与正式 Booking 分离、价格/权益缺证据、Human Gate、Audit、幂等、External Effect no-op、loading/empty/error/permission/HOLD 状态，以及移动端 Playwright 截图与基线 diff 流程。
