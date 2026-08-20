# Phase C UI Development Queue 001

## 1. Gate rule

Phase C 先做逐页门禁文档，不等于进入 API Contract 或代码开发。统一顺序为：

```text
Broad Research → Needs Analysis → BA Design → Visual Baseline → Architect Review → Blocking Questions → API Contract → FE/BE Implementation → Consistency Tests → Playwright Screenshot Diff → Fix Loop → Commit/Push
```

任何 UI 未完成 Broad Research + Needs Analysis，或缺少可定位 visual baseline、对象/状态边界、Consent/Human Gate、Model Gateway/Ontology Adapter、FE/BE consistency 和截图验收准备时，不得进入 API Contract 或代码。`Recommendation != Decision != Action`；核心状态只能通过 Named Action；External Effect 必须 HOLD。

本队列继承 `FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md` 的研究门禁。`30_素材_materials` 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## 2. Batch division

| Batch | Scope | Deliverable |
|---|---|---|
| Batch 1 | UI-01~UI-05 | UI-01 既有门禁引用；UI-02~UI-05 pre-API gate。 |
| Batch 2 | UI-06~UI-10 | UI-06~UI-10 pre-API gate 已准备；旧 UI-06 草稿仅作只读参考。 |
| Batch 3 | UI-11~UI-15 | Ranking/Poster/Commerce 研究和 Human Gate/External Effect gate；已完成 pre-API gate。 |
| Batch 4 | UI-16~UI-20 | Commerce/Points/Membership/Service Supply 研究和 External Effect/Human Gate；已完成 pre-API gate。 |
| Batch 5 | UI-21~UI-25 | Consultation/Salon/Activity/Service Mine/Parent Community；已完成 pre-API gate，预约、报名、真人服务、通知、日历、视频、支付、分享和社区治理保持 HOLD。 |
| Batch 6 | UI-26~UI-30 | Publish/Dynamic/My Community/Growth Outcomes/Membership 研究和 Human Gate/External Effect gate；已完成 pre-API gate。 |
| Batch 7 | UI-31~UI-34 | Services/Orders/Profile/Records；已完成 pre-API gate，隐私、订单、导出、客服、通知和 External Effect 保持 HOLD。 |

## 3. 34 UI queue

`API_CONTRACT_ALLOWED` 和 `CODE_ALLOWED` 只允许在对应逐页 Architect Review 明确 GO 后变为 YES；本队列当前不授予任何页面 API/代码许可。

| UI | Page / Scenario | Required artifacts | Current gate status | Blocking Questions | API_CONTRACT_ALLOWED | CODE_ALLOWED | Screenshot / visual comparison |
|---|---|---|---|---|---|---|---|
| UI-01 | Family Home | 已有 Research、BA/Visual Brief、Architect Review；需保留 Blocking 更新 | `NO_GO` | 10 项 `NEEDS_HUMAN_DECISION` | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-02 | Assessment | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | assessment scope、题目/证据、儿童 Consent、状态机 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-03 | AI Report | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | Report explanation、诊断边界、Gateway schema、Human Gate | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-04 | Growth Plan / 90 Day Plan | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | PlanDraft provenance、Decision/Action、Consent、版本 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-05 | Delivery Community / 90 Day Companion | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | GrowthPlan/Service/Community 语义、Consent、真人服务、外部 effect | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-06 | Delivery Community / Mine Member | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | 陪跑服务/社群、Consent、真人服务、私有动态、UI-06 旧草稿仅作只读参考 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-07 | Assessment Entry | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | 与 UI-02 的职责/入口分界、题目版本、儿童 Consent、session draft | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-08 | Growth Report | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | Report/Evidence provenance、解释/诊断边界、敏感内容、版本 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-09 | Daily Task | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | Task projection、Complete/Pause/Amend、Outcome 不等同、既有测试需复核 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-10 | Child Assistant | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared; Human Gate HOLD | 未成年人、guardian Consent、敏感主题、Model Gateway、Agent/Ontology boundary | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-11 | Family Ranking | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 3 pre-API gate prepared | `HOLD_HUMAN_GATE / NO_GO_WITH_BLOCKERS` | 禁止 Ranking/Total Score；替代自我历史需求、儿童比较和价值判断 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-12 | Growth Poster | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 3 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Evidence/Outcome、媒体、公开分享、文案、儿童 Consent | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-13 | Mall Home | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 3 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Product/Offering、成长服务与商业化边界、推荐/购买、支付/权益 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-14 | Product Detail | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 3 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Payment、Order、Entitlement、退款、价格/权益 provenance | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-15 | Invite Rewards | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 3 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Invite、通知、Reward、反滥用、Consent、外发分享 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-16 | Group Buy | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 4 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | 库存、订单、支付、通知、价格和反滥用 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-17 | Points Task | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 4 pre-API gate prepared | `NO_GO_WITH_BLOCKERS` | 积分规则、任务事件、权益事实、禁止总分/排名 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-18 | Membership Center | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 4 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | 续费、退款、权益变更、通知和客服 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-19 | Teacher Supply | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 4 pre-API gate prepared；已有只读 projection/client/view 仅作现状输入 | `NO_GO_WITH_BLOCKERS` | provider/offering/availability、SERVICE consent、筛选证据、禁止排序/推荐和真人外部效应 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-20 | Teacher Detail | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 4 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | 资质来源、评分边界、Booking draft、预约/通知/视频/支付和真人服务 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-21 | Consultation Booking | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 5 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | BookingDraft/正式 Booking、占座、Consent、通知、支付、真人联系 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-22 | Salon List | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 5 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Activity provenance、报名草稿、Calendar/Video/Notification adapter、儿童参与 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-23 | Activity Detail | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 5 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | 报名/名额、Consent、通知、日历、视频、支付、分享 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-24 | Service Mine | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 5 pre-API gate prepared | `NEEDS_RESEARCH_REVIEW / NO_GO_WITH_BLOCKERS` | Booking/Registration/ServiceCase/Record/Outcome provenance、纠错、真人服务 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-25 | Parent Community | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 5 pre-API gate prepared | `NEEDS_RESEARCH_REVIEW / NO_GO_WITH_BLOCKERS` | Community scope、Consent、Moderation/Human Gate、儿童风险、互动/分享 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-26 | Publish Dynamic | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 6 pre-API gate prepared | `HOLD_HUMAN_GATE / HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | PostDraft/Media/Visibility、审核、儿童内容、发布、通知、分享 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-27 | Dynamic Detail | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 6 pre-API gate prepared | `HOLD_HUMAN_GATE / HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Post/Evidence/Comment/Reaction、互动、举报、分享、儿童内容 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-28 | My Community | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 6 pre-API gate prepared | `HOLD_HUMAN_GATE / HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Private visibility、Consent、撤回、删除、审核、通知 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-29 | Growth Outcomes | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 6 pre-API gate prepared | `HOLD_HUMAN_GATE / NO_GO_WITH_BLOCKERS` | Outcome/Evidence provenance、纠错、禁止诊断/因果/总分/排名、导出分享 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-30 | Annual Member Mine | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 6 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Membership/Entitlement provenance、续费、支付、退款、客服、通知 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-31 | My Services | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 7 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | ServiceCase/Record provenance、真人服务、通知、取消/改期、纠错 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-32 | Orders Assets | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 7 pre-API gate prepared | `HOLD_EXTERNAL_EFFECT / NO_GO_WITH_BLOCKERS` | Order/Entitlement/Asset provenance、支付、退款、下载、分享、发票 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-33 | Family Profile | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 7 pre-API gate prepared | `HOLD_HUMAN_GATE / NO_GO_WITH_BLOCKERS` | Family/Person/Role/GrowthProfile、儿童隐私、身份、Consent、导出/删除 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-34 | Service Records | Research/Needs、BA、Visual Brief、Architect Review、Blocking；Batch 7 pre-API gate prepared | `HOLD_HUMAN_GATE / NO_GO_WITH_BLOCKERS` | ServiceRecord/Outcome/Evidence provenance、纠错、儿童记录、导出/分享 | NO | NO | `RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |

## 4. Screenshot gate

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

以上状态适用于 UI-01~UI-34；当前没有可确认的开发后运行截图或成对视觉差异 artifact。

## 5. Batch 1 and Batch 2 acceptance

Batch 1 已创建 UI-02~UI-05 pre-API gate 文档，并引用 UI-01 既有文档。Batch 2 已创建 UI-06~UI-10 五个规范 pre-API gate 文档；UI-06 两个旧草稿仅作只读参考，未纳入提交。即使文档齐全，UI-01~UI-10 也未自动获得 API Contract 或代码许可。运行截图和 Playwright artifact 当前均不存在；`RUNTIME_SCREENSHOT_READY=NO`、`PIXEL_DIFF_READY=NO`。

## 6. Batch 3, Batch 4 and Batch 5 acceptance

Batch 3 已创建 UI-11~UI-15 pre-API gate 文档；Batch 4 已创建 UI-16~UI-20 pre-API gate 文档；Batch 5 已创建 UI-21~UI-25 pre-API gate 文档；Batch 6 已创建 UI-26~UI-30 pre-API gate 文档；Batch 7 已创建 UI-31~UI-34 pre-API gate 文档。各批次均只完成 Research/Needs、BA、Visual Fidelity、Architect/Blocking 级准备，不产生 API Contract 或代码许可。UI-19 的既有只读 projection/client/view 仅作为现状输入，不改变其整体 NO_GO 状态。Batch 6 的五个页面均无运行截图或 pixel diff；Batch 7 的四个页面同样无运行截图或 pixel diff。

## 7. Global consistency review

| Consistency dimension | Batch 1~5 review result | Required interpretation |
|---|---|---|
| Evidence boundary | CONSISTENT | `30_素材_materials` 只读，优先逐页提取文本；自家/榜样教育/波波校长材料最高 E1，只能作为 Hypothesis/Design Input，不自证效果、诊断、资质或因果关系。 |
| Semantic categories | CONSISTENT | 所有文档保持 Fact / Perspective / Hypothesis / Recommendation / Decision / Action 分离；`Recommendation != Decision != Action`。 |
| Object and state boundary | CONSISTENT | Read Projection、Controlled Draft、Named Action、External Effect 分层；核心状态不得由自由文本或 AI 输出直接写入 ontology。 |
| AI and ontology boundary | CONSISTENT | AI 只能经 Model Gateway 生成建议、摘要、解释或草稿；Ontology Adapter 只接受批准的 Named Action。 |
| Safety and consent | CONSISTENT | 儿童敏感信息、诊断暗示、社区风险、真人服务和高风险家庭场景进入 Consent/Human Gate；不允许 Family Total Score 或 Ranking。 |
| Visual and test evidence | CONSISTENT | UI-01~UI-34 均为 `RUNTIME_SCREENSHOT_READY=NO`、`PIXEL_DIFF_READY=NO`；不能声称已完成视觉 diff。 |
| Development admission | CONSISTENT | 当前 34 UI 的 `API_CONTRACT_ALLOWED=NO`、`CODE_ALLOWED=NO`；Batch 5 不例外。 |

### Normalization findings

一致性扫描发现：24 个已存在的 `UI-02~UI-25_PHASE_C_PRE_API_GATE_001.md` 均有 Blocking Questions 和截图否定状态，但 UI-06~UI-15 有 10 个文件尚未采用 Batch 5 使用的统一章节标题；UI-02、UI-03、UI-04、UI-05 的 Architect verdict 使用独立的裸值行，而 UI-06~UI-25 使用 `ARCHITECT_REVIEW_VERDICT=` 字段。该差异属于文档规范化问题，不改变当前所有页面 `API_CONTRACT_ALLOWED=NO`、`CODE_ALLOWED=NO` 的门禁结论；本轮不修改 Batch 1~4 文件，后续可单独做文档标准化提交。

### Blocker summary by class

1. **Research and provenance blockers**：UI-21~UI-34 仍需确认供给、活动、预约、服务记录、社区内容、作者身份、资质、时间、状态、会员/权益和成果证据来源；不得把 E1 材料或页面文案当作业务事实。
2. **Domain and object blockers**：BookingDraft 与正式 Booking、RegistrationDraft 与报名、ServiceCase 与 ServiceRecord、OutcomeEvidence 与效果事实、Community projection 与用户互动动作、MembershipProjection 与正式订单/权益状态、Family/Profile/Consent、ServiceRecord/Outcome 的边界尚未由逐页 Architect Review 闭合。
3. **Consent and Human Gate blockers**：儿童参与、家庭成员可见范围、SERVICE/COMMUNITY consent、直播/录制、敏感内容、真人联系、社区举报与审核仍需明确 purpose、授权主体、撤回、升级和审计。
4. **External Effect blockers**：占座、报名、支付、退款、通知、日历、视频会议、分享、真人服务、发布、评论/点赞/举报、内容删除/撤回、客服、权益变更、数据导出、身份/资料变更和服务记录纠错均必须由 Adapter、Named Action、幂等、Audit 和 Human Gate 控制；DEV 只允许 no-op/stub。
5. **Visual and test blockers**：所有批次尚无可用于成对 pixel diff 的开发后运行截图；需先完成基线尺寸/文案/布局核对、运行截图保存、Playwright 状态覆盖和 diff 报告。

## 8. Shared subsystem rule

不得为 34 个页面重复建设后端。后续按共享能力归并：Family Home Projection、Assessment、Report Explanation、Growth Plan/Family Decision、Journey/Task、Service Supply/Booking/Service Record、Commerce/Entitlement、Community/Evidence、Family Profile/Consent、Model Gateway、Ontology Adapter 和外部 Effect Adapter。

## 9. Global blockers

1. 全局 Broad Research + Needs Analysis 是 BA Design 前置门禁，不是人工裁决，也不授权 API/代码。
2. 页面逐页 baseline、原图映射和运行截图尚未形成成对视觉差异证据。
3. 任何 Recommendation、PlanDraft、服务目录或 AI 输出都不能直接成为 Decision、Action 或核心 Fact。
4. 未成年人、诊断暗示、排名/总分、真实服务、支付、预约、通知、分享和真人联系必须保持 Human Gate 或 External Effect HOLD。
5. 本队列不创建 API Contract、不修改业务代码、不提交 UI-06 文件。

## 10. References

- `reports/m2/frontend/FAMILY_34_UI_DEVELOPMENT_LEDGER_001.md`
- `reports/m2/frontend/34_UI_SHARED_RESEARCH_AND_NEEDS_ANALYSIS_001.md`
- `reports/m2/frontend/FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md`
- `reports/m2/frontend/UI-01_ARCHITECT_REVIEW_AND_BLOCKING_QUESTIONS_001.md`
- `reports/m2/frontend/UI-05_BLOCKING_QUESTIONS_DECISION_PACK_001.md`
