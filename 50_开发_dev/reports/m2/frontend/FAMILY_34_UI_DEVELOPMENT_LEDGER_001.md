# Family 34 UI Development Ledger 001

> **Phase A scope:** 只读盘点 34 个 global UI 的视觉基线、当前 Web 实现入口、路由、运行截图证据、API/后端依赖与门禁状态。本台账不是完成声明，不把静态壳、参考图或文档中的 screenshot 计划误认为动态实现或 pixel diff 证据。

## 1. Phase A 结论

| 字段 | 结果 |
|---|---|
| `TOTAL_UI_BASELINES_FOUND` | **34** 个可映射的 global UI 基线锚点：UI18 manifest 的 core/growth/commerce 18 张与 `bangyang-reference` 业务参考图 16 张。 |
| `TOTAL_UI_IMPLEMENTATIONS_FOUND` | **34** 个 `test-loop.js` global UI route/view 映射，均属于现有 Web shell/参考壳层级；其中 UI-19 有明确 read projection/client/view 纵切，UI-09 有受控 task action 测试入口。 |
| `TOTAL_UI_ROUTES_FOUND` | **34** 个 global UI route/view 映射，集中在 `apps/web/src/test-loop.js` 的 `UI_ROUTE_MAP`/`views`。 |
| `TOTAL_RUNTIME_SCREENSHOTS_FOUND` | **0** 个可在 Family 仓库中确认、且能归属于 UI-01~UI-34 的运行后/Playwright 截图。浏览器临时截图曾存在于 sandbox 路径，但不在仓库，也没有纳入本次 Phase A 证据。 |
| `TOTAL_PIXEL_DIFF_READY` | **0**。没有实现截图与对应 baseline 的成对 diff artifact。 |
| `LEDGER_STATUS` | `PHASE_A_LEDGER_COMPLETE_WITH_BLOCKERS` |
| `NEXT_PHASE_READY` | **YES，仅允许进入 Phase B Broad Research + Needs Analysis；不表示允许 API Contract、代码开发或视觉完成声明。** |

## 2. 证据与计数口径

`apps/web/public/bangyang-reference/ui18/manifest.csv` 提供 18 个局部场景基线，分别为 core、growth、commerce 三组，每组 6 张；其余 16 个业务参考图位于 `apps/web/public/bangyang-reference/`，通过文件名和既有 34 UI baseline/crosswalk 进行映射。`home-screen-ui-crop.png`、`src/assets/bangyang-reference/*`、PPT sheets、报告图和历史 artifacts 只作为参考/分析候选，不计入运行截图。

现有 `apps/web/src/test-loop.js` 明确存在 34 个 UI ID 到页面 key 的映射；这证明路由/视图壳存在，不证明每页已接通真实 API、DB projection、Named Action、Consent 或前后端一致性。UI-19 的 `teacher-supply-view.js`/`teacher-supply-client.js` 是当前最明确的 admitted read projection slice；UI-09 的 Page Objects test 覆盖受控 task action。其余页面大多仍是参考图/静态 view 或有限的受控测试入口。

## 3. 34 UI Development Ledger

| UI ID | Page / Scenario | Baseline path | Current implementation path / route | Runtime screenshot | API / backend dependency | Gate status | Development status |
|---|---|---|---|---|---|---|---|
| UI-01 | Family Home / 家庭成长首页 | `apps/web/public/bangyang-reference/ui18/core-01-home.png` | `apps/web/src/test-loop.js` → `home` / root | NONE | FamilyHomeProjection；Family/Person/Consent/Model Gateway candidates，尚未形成 UI-01 contract | `NO_GO`；研究、BA、Architect Review 已有，API/Code 不允许 | STATIC_SHELL_ONLY |
| UI-02 | Assessment / 家庭测评 | `.../ui18/core-02-assessment.png` | `test-loop.js` → `growth-assessment` | NONE | Assessment projection、Need/Evidence、Consent；映射仍需人工确认 | `NEEDS_CONFIRMATION` | STATIC_SHELL_ONLY |
| UI-03 | AI Report / AI 成长诊断报告 | `.../ui18/core-03-ai-report.png` | `test-loop.js` → `assessment` / `growth-report` | NONE | ReportExplanation、Evidence、Model Gateway、Human Gate | `CONFLICT / NO_GO` | STATIC_SHELL_ONLY |
| UI-04 | Growth Plan / 90 天成长方案 | `.../ui18/core-04-growth-plan.png` | `test-loop.js` → `core-report` / `core-plan` | NONE | PlanDraft projection、FamilyDecision、Named Action；BQ 未闭合 | `NO_GO`；API Contract 禁止 | STATIC_SHELL_ONLY |
| UI-05 | Delivery Community / 90 天陪跑与社群 | `.../ui18/core-05-delivery-community.png` | `test-loop.js` → `core-community` | NONE | Delivery/Community projection、Consent、Human Gate；UI-05 BA/Decision Pack 已有，仍受研究需求分析门禁 | `NO_GO` | STATIC_SHELL_ONLY |
| UI-06 | Mine Member / 我的会员 | `.../ui18/core-06-mine-member.png` | `test-loop.js` → `core-mine` | NONE | Entitlement/Family profile；UI-06 BA 草稿未提交，不得推断为准入 | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-07 | Assessment Entry / 成长测评入口 | `.../ui18/growth-01-assessment-entry.png` | `test-loop.js` → `growth-assessment` | NONE | AssessmentEntry、Consent、Assessment session | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-08 | AI Report / 成长报告 | `.../ui18/growth-02-ai-report.png` | `test-loop.js` → `growth-report` | NONE | Report read projection、Evidence、Model Gateway | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-09 | Daily Task / 今日成长任务 | `.../ui18/growth-03-daily-task.png` | `test-loop.js` → `growth-daily-task`；`test-loop.page-objects.spec.ts` | NONE | Family-scoped task projection；受控 `COMPLETE_TASK` action，no external effect | `RESEARCH_REVIEW_REQUIRED`；可作为后续受控 slice 候选 | STATIC_PLUS_CONTROLLED_TEST_ENTRY |
| UI-10 | Child Assistant / 成长小助手 | `.../ui18/growth-04-child-assistant.png` | `test-loop.js` → `growth-child` | NONE | Child/person scope、Model Gateway、minor protection、Human Gate | `HOLD_HUMAN_GATE / NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-11 | Family Ranking / 成长排行榜 | `.../ui18/growth-05-family-ranking.png` | `test-loop.js` → `growth-ranking` | NONE | 禁止 Family Total Score、跨家庭 Ranking、同龄比较；只能研究替代性自我历史投影 | `HOLD_HUMAN_GATE` | STATIC_SHELL_ONLY |
| UI-12 | Growth Poster / 成长海报 | `.../ui18/growth-06-growth-poster.png` | `test-loop.js` → `growth-poster` | NONE | Evidence/Outcome story、Media/Share Adapter；外发分享 HOLD | `HOLD_EXTERNAL_EFFECT / NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-13 | Mall Home / 家庭成长商城 | `.../ui18/commerce-01-mall-home.png` | `test-loop.js` → `commerce-mall` | NONE | Product/Offering/Entitlement；支付与商业化需外部 effect gate | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-14 | Product Detail / 商品详情 | `.../ui18/commerce-02-product-detail.png` | `test-loop.js` → `commerce-product` | NONE | Product projection、Commerce intent、Entitlement；支付 HOLD | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-15 | Invite Rewards / 邀请有礼 | `.../ui18/commerce-03-invite.png` | `test-loop.js` → `commerce-invite` | NONE | Campaign/Invite/Reward；外发邀请、通知、权益发放需 Adapter/Human Gate | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-16 | Group Buy / 拼团 | `.../ui18/commerce-04-group-buy.png` | `test-loop.js` → `commerce-group` | NONE | Group/Commerce intent；支付、库存、订单和通知 HOLD | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-17 | Points Task / 积分任务 | `.../ui18/commerce-05-points-task.png` | `test-loop.js` → `commerce-points` | NONE | Points/Entitlement projection；规则和权益来源需研究 | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-18 | Mine Member / 会员中心 | `.../ui18/commerce-06-mine-member.png` | `test-loop.js` → `commerce-mine` | NONE | Membership/Entitlement；退款、支付、权益变更需 Gate | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-19 | Teacher Zone / 名师专区服务供给列表 | `apps/web/public/bangyang-reference/teacher-zone-reference-458x1008.png` | `test-loop.js` → `teacher-zone`; `teacher-supply-view.js`; `teacher-supply-client.js` | NONE | Family-scoped provider/offering/availability read projection；API 已有候选 | `READY_FOR_RESEARCH_REVIEWED_SLICE`；仍需视觉截图 diff | READ_PROJECTION_SLICE |
| UI-20 | Teacher Detail / 名师详情 | `apps/web/public/bangyang-reference/teacher-detail-reference-426x1002.png` | `test-loop.js` → `teacher-detail` | NONE | Provider/Offering detail；Booking draft，真实联系/预约 HOLD | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-21 | Consultation Booking / 在线咨询预约 | `apps/web/public/bangyang-reference/consultation-booking-reference-492x1008.png` | `test-loop.js` → `consultation-booking` | NONE | Availability、Booking draft、Consent；真实占座/通知/支付 HOLD | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-22 | Salon List / 沙龙活动列表 | `apps/web/public/bangyang-reference/salon-list-reference-466x1008.png` | `test-loop.js` → `salon-list` | NONE | Event/Activity projection、Video/Calendar Adapter | `HOLD_EXTERNAL_EFFECT / NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-23 | Activity Detail / 活动详情 | `apps/web/public/bangyang-reference/activity-detail-reference-470x1016.png` | `test-loop.js` → `activity-detail` | NONE | Event detail、registration draft；通知/日历/视频 HOLD | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-24 | Service Mine / 我的咨询与活动 | `apps/web/public/bangyang-reference/service-mine-reference-472x1018.png` | `test-loop.js` → `service-mine` | NONE | Booking/ServiceCase/ServiceRecord projection；真人服务结果不能伪造 | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-25 | Parent Community / 家长社区 | `apps/web/public/bangyang-reference/parent-community-reference-552x1034.png` | `test-loop.js` → `parent-community` | NONE | Community read projection、Consent、moderation/Human Gate | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-26 | Publish Dynamic / 发布动态 | `apps/web/public/bangyang-reference/publish-dynamic-reference-548x1028.png` | `test-loop.js` → `publish-dynamic` | NONE | Post draft、Media Adapter、moderation、Consent；发布是 Named Action | `HOLD_HUMAN_GATE / HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-27 | Dynamic Detail / 动态详情 | `apps/web/public/bangyang-reference/dynamic-detail-reference-524x1022.png` | `test-loop.js` → `dynamic-detail` | NONE | Post/Evidence/Comment projection；未授权互动和外发 HOLD | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-28 | My Community / 我的社区 | `apps/web/public/bangyang-reference/my-community-reference-560x1030.png` | `test-loop.js` → `my-community` | NONE | Private community projection、Consent、privacy | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-29 | Growth Outcomes / 成长成果 | `apps/web/public/bangyang-reference/growth-outcomes-reference-522x1110.png` | `test-loop.js` → `growth-outcomes` | NONE | Outcome/Evidence story；不得把展示数据变成效果事实 | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-30 | Annual Member Mine / 年度会员中心 | `apps/web/public/bangyang-reference/annual-member-mine-reference-532x994.png` | `test-loop.js` → `annual-member-mine` | NONE | Membership/Entitlement；支付/续费/退款 HOLD | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-31 | My Services / 我的服务 | `apps/web/public/bangyang-reference/my-services-reference-532x1000.png` | `test-loop.js` → `my-services` | NONE | ServiceCase/Booking/ServiceRecord projection；真人服务与通知 HOLD | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-32 | Orders Assets / 订单与资产 | `apps/web/public/bangyang-reference/orders-assets-reference-552x1010.png` | `test-loop.js` → `orders-assets` | NONE | Order/Entitlement/Asset projection；支付/退款/下载外发需 Gate | `HOLD_EXTERNAL_EFFECT` | STATIC_SHELL_ONLY |
| UI-33 | Family Profile / 家庭档案 | `apps/web/public/bangyang-reference/family-profile-reference-542x1002.png` | `test-loop.js` → `family-profile` | NONE | Family/Person/GrowthProfile、Consent；敏感儿童数据 Human Gate | `HOLD_HUMAN_GATE / NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |
| UI-34 | Service Records / 服务记录 | `apps/web/public/bangyang-reference/service-records-reference-566x1008.png` | `test-loop.js` → `service-records` | NONE | ServiceRecord/Outcome projection；过程记录不等于 Outcome 或效果事实 | `NEEDS_RESEARCH_REVIEW` | STATIC_SHELL_ONLY |

## 4. 共享实现与非重复建设边界

34 个 UI 当前共享一个 `test-loop.js` route/view shell；不应按页面复制 34 套后端。后续应按共享能力归并：Family Home Projection、Assessment、Report Explanation、Growth Plan/Decision、Journey/Task、Service Supply/Booking/Service Record、Commerce/Entitlement、Community/Evidence、Family Profile/Consent、Model Gateway、Notification/Calendar/Video/Payment/Media Adapter。

UI-19 是现有最明确的只读 Service Supply projection 样板；UI-09 有受控 task action 测试样例。两者都不能替代其它 UI 的视觉基线、BA 研究或 Architect Review。

## 5. Phase A blockers

1. **运行截图缺口：**仓库中没有可确认归属于 UI-01~UI-34 的运行后/Playwright screenshot artifact；因此 34 页 `TOTAL_PIXEL_DIFF_READY=0`。
2. **实现状态混淆风险：**34 个 route/view 映射只证明静态 shell 存在，不能作为 dynamic runtime、API、DB 或 FE/BE consistency 完成证据。
3. **视觉证据闭包缺口：**部分 baseline 通过 global baseline/crosswalk 映射，仍需逐页确认原图与 global UI 的一一对应；缺图页面必须保持 `NEEDS_CONFIRMATION`，不得猜测。
4. **门禁前置：**UI-01、UI-04、UI-05、UI-10、UI-11、UI-12、UI-21、UI-26、UI-33 等页面存在 Human Gate、Consent、External Effect 或 Ranking/Total Score 风险，不能直接进入 API/代码。
5. **研究前置：**Phase B 必须先完成共享 Broad Research + Needs Analysis，分别记录 User/Business/Operational/Compliance/Data/AI Need，并区分 Fact、Perspective、Hypothesis、Recommendation、Decision、Action。

## 6. Phase A 字段化交付

```text
PHASE=A
TOTAL_UI_BASELINES_FOUND=34
TOTAL_UI_IMPLEMENTATIONS_FOUND=34  # route/view shell entries; not 34 completed runtimes
TOTAL_UI_ROUTES_FOUND=34
TOTAL_RUNTIME_SCREENSHOTS_FOUND=0  # confirmed repo-mapped runtime artifacts
TOTAL_PIXEL_DIFF_READY=0
LEDGER_PATH=reports/m2/frontend/FAMILY_34_UI_DEVELOPMENT_LEDGER_001.md
BLOCKERS=NO_RUNTIME_SCREENSHOTS;NO_PIXEL_DIFF;STATIC_SHELL_NOT_DYNAMIC_RUNTIME;RESEARCH_AND_GATE_GAPS;SOME_BASELINE_MAPPING_NEEDS_CONFIRMATION
NEXT_PHASE_READY=YES  # Phase B research only; API/Code remain NO_GO
```

## 7. Phase A acceptance boundary

本台账完成只读盘点，不声明任何 UI 已完成开发。`NEXT_PHASE_READY=YES` 仅表示可以继续 Phase B 的共享 Broad Research + Needs Analysis；在相应 UI 的 BA Design、Visual Baseline、Architect Review、API Contract 和一致性测试闭合前，不得进入业务代码实现。任何运行截图必须注明 viewport、route、source baseline 和状态，并在有成对文件时才可进行 pixel diff。

> **Phase A marker:** `FAMILY_34_UI_DEVELOPMENT_LEDGER_READY`

## References

1. `apps/web/src/test-loop.js`：34 UI route/view 映射与现有静态 shell 入口。
2. `apps/web/public/bangyang-reference/ui18/manifest.csv`：core/growth/commerce 18 张局部场景基线。
3. `apps/web/public/bangyang-reference/`：16 张业务参考基线图。
4. `reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`：global UI baseline/crosswalk。
5. `reports/m2/frontend/FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md`：功能与页面血缘台账。
6. `reports/m2/frontend/FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md`：34 UI 研究需求前置队列。
7. `apps/web/src/teacher-supply-view.js`、`apps/web/src/teacher-supply-client.js`：UI-19 只读供给 projection 样例。
8. `apps/web/src/test-loop.page-objects.spec.ts`：UI-09 受控任务动作测试入口。

[1]: ../../apps/web/src/test-loop.js
[2]: ../../apps/web/public/bangyang-reference/ui18/manifest.csv
[3]: ../../apps/web/public/bangyang-reference/
[4]: ./FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md
[5]: ./FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md
[6]: ./FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md
[7]: ../../apps/web/src/teacher-supply-view.js
[8]: ../../apps/web/src/test-loop.page-objects.spec.ts

FAMILY_34_UI_DEVELOPMENT_LEDGER_READY

## Visual audit record

本次 Phase A 未生成新的浏览器截图，未执行像素差异计算。仓库内的 `reports/**/artifacts`、PPT screenshot 和历史图片仅作为候选资产，未被错误标记为本轮 UI-01~UI-34 runtime screenshot。
