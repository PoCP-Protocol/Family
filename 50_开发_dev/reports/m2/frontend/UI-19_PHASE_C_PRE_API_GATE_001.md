# UI-19 Phase C Pre-API Gate 001

## Research/Needs summary

UI-19 为服务供给列表与筛选场景。研究家庭为何需要看到受控的教师/服务供给，而不是被导购、排名或自动推荐；角色包括家长、孩子、教师/服务者、运营、顾问和系统/AI。已有 UI-19 只读 projection/client/view 纵切只能作为现状输入，不代表完整动态能力。30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## BA Design summary

候选对象为 FamilyContext、Person、ServiceProvider、Offering、AvailabilitySlot、AdmissionStatus、ServiceSupplyProjection、ConsentGrant、HumanGateReview。首轮需求是 provider_kind=TEACHER 的受控列表、适龄/服务类型/可用性摘要、准入状态和 tenant/family scope；不做教师自注册、排名、优劣判断或自动推荐。

## Visual Fidelity Brief summary

对标 UI-19 原始服务供给/名师专区基线的导航、筛选、卡片、标签、可预约摘要、空态、权限态和移动端间距。已有实现若可复用，只能先做 visual baseline 对齐和只读 projection；当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

provider/offering/availability/admission 摘要和筛选结果是 Read Projection；筛选器不产生核心写入；预约、联系教师、通知、占座、视频和支付均需 Named Action、Consent、Audit、Human Gate 与 Adapter，External Effect HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

服务供给读取需要 tenant/family scope 和 SERVICE consent；儿童敏感需求、真人服务匹配、联系教师和预约需 Human Gate。AI 只能经 Model Gateway 解释筛选结果或生成草稿，不写 Provider/Offering/Booking；Ontology Adapter 只接收批准动作。

## Backend/API dependency candidates

候选 `ServiceSupplyProjectionService`、Provider/Offering/Availability read model、`FamilyAuthorizationPolicy`、ConsentPolicy、HumanGateReviewService、BookingDraftBoundary、Notification/Calendar/Video/Payment adapters、AuditService、ModelGatewayAdapter、OntologyAdapter；已有 UI-19 backend projection 可作为候选复用输入，但不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. provider/offering/availability/admission 的 authoritative source 和版本如何锁定？
2. SERVICE consent 与家庭/儿童 subject scope 如何绑定？
3. 筛选结果、推荐、排序和优劣判断如何严格区分？默认禁止 ranking。
4. 预约/联系/通知/视频/支付是否分别建模为 Named Action 和 Adapter？
5. UI-19 现有 projection 如何与 visual baseline 和后续 booking chain 对齐而不越权？

## Required tests/screenshot diff preparation

准备 tenant/family/provider scope、provider_kind=TEACHER、Offering 状态、适龄/服务类型筛选、无 SERVICE consent fail-closed、空/错误/权限状态、无推荐排序、projection/client/DTO 对齐、API/Web contract、Playwright mobile/desktop 和列表筛选截图准备。
