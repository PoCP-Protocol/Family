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
| Batch 2 | UI-06~UI-12 | UI-06~UI-10 pre-API gate 已准备；UI-11~UI-12 待后续补齐研究、BA、视觉和 Architect/Blocking 文档。 |
| Batch 3 | UI-11~UI-15 | Ranking/Poster/Commerce 研究和 Human Gate/External Effect gate；UI-16~UI-18 待后续批次。 |
| Batch 4 | UI-16~UI-20 | Commerce/Points/Membership/Service Supply 研究和 External Effect/Human Gate；UI-21~UI-24 待后续批次。 |
| Batch 5 | UI-25~UI-29 | Community/Evidence/Share 研究和 Human Gate。 |
| Batch 6 | UI-30~UI-34 | Membership/Admin/Records 研究和数据权限 gate。 |

## 3. 34 UI queue

`API_CONTRACT_ALLOWED` 和 `CODE_ALLOWED` 只允许在对应逐页 Architect Review 明确 GO 后变为 YES；本队列当前不授予任何页面 API/代码许可。

| UI | Page / Scenario | Required artifacts | Current gate status | Blocking Questions | API_CONTRACT_ALLOWED | CODE_ALLOWED | Screenshot / visual comparison |
|---|---|---|---|---|---|---|---|
| UI-01 | Family Home | 已有 Research、BA/Visual Brief、Architect Review；需保留 Blocking 更新 | `NO_GO` | 10 项 `NEEDS_HUMAN_DECISION` | NO | NO | Runtime NONE；diff NOT_READY |
| UI-02 | Assessment | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | assessment scope、题目/证据、儿童 Consent、状态机 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-03 | AI Report | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | Report explanation、诊断边界、Gateway schema、Human Gate | NO | NO | Runtime NONE；diff NOT_READY |
| UI-04 | Growth Plan / 90 Day Plan | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | PlanDraft provenance、Decision/Action、Consent、版本 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-05 | Delivery Community / 90 Day Companion | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` | GrowthPlan/Service/Community 语义、Consent、真人服务、外部 effect | NO | NO | Runtime NONE；diff NOT_READY |
| UI-06 | Delivery Community / Mine Member | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | 陪跑服务/社群、Consent、真人服务、私有动态、UI-06 旧草稿仅作只读参考 | NO | NO | Runtime NONE；`RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-07 | Assessment Entry | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | 与 UI-02 的职责/入口分界、题目版本、儿童 Consent、session draft | NO | NO | Runtime NONE；`RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-08 | Growth Report | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | Report/Evidence provenance、解释/诊断边界、敏感内容、版本 | NO | NO | Runtime NONE；`RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-09 | Daily Task | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared | Task projection、Complete/Pause/Amend、Outcome 不等同、既有测试需复核 | NO | NO | Runtime NONE；`RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
| UI-10 | Child Assistant | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NO_GO_WITH_BLOCKERS` / Batch 2 pre-API gate prepared; Human Gate HOLD | 未成年人、guardian Consent、敏感主题、Model Gateway、Agent/Ontology boundary | NO | NO | Runtime NONE；`RUNTIME_SCREENSHOT_READY=NO`; `PIXEL_DIFF_READY=NO` |
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
| UI-21 | Consultation Booking | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `HOLD_EXTERNAL_EFFECT` | 占座、通知、支付、真人联系 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-22 | Salon List | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | Activity、Calendar/Video adapter | NO | NO | Runtime NONE；diff NOT_READY |
| UI-23 | Activity Detail | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `HOLD_EXTERNAL_EFFECT` | 报名、通知、日历、视频 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-24 | Service Mine | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | Booking/ServiceCase/Record、过程与 Outcome | NO | NO | Runtime NONE；diff NOT_READY |
| UI-25 | Parent Community | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | 社区规则、Consent、审核、儿童风险 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-26 | Publish Dynamic | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `HOLD_HUMAN_GATE` | Publish Action、Moderation、Media、外发 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-27 | Dynamic Detail | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | Post/Comment/Evidence、互动权限 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-28 | My Community | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | Private visibility、撤回、删除 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-29 | Growth Outcomes | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | OutcomeCase、Evidence、不得因果化 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-30 | Annual Member Mine | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `HOLD_EXTERNAL_EFFECT` | Membership、续费、退款、权益 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-31 | My Services | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | ServiceCase/Record、真人服务、通知 | NO | NO | Runtime NONE；diff NOT_READY |
| UI-32 | Orders Assets | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `HOLD_EXTERNAL_EFFECT` | Payment、Refund、Download、Share | NO | NO | Runtime NONE；diff NOT_READY |
| UI-33 | Family Profile | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `HOLD_HUMAN_GATE` | 儿童敏感数据、成员权限、Consent | NO | NO | Runtime NONE；diff NOT_READY |
| UI-34 | Service Records | Research/Needs、BA、Visual Brief、Architect Review、Blocking | `NEEDS_RESEARCH_REVIEW` | ServiceRecord 与 Outcome 区分、纠错和来源 | NO | NO | Runtime NONE；diff NOT_READY |

## 4. Screenshot gate

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

以上状态适用于 UI-01~UI-05；当前没有可确认的开发后运行截图或成对视觉差异 artifact。

## 5. Batch 1 and Batch 2 acceptance

Batch 1 已创建 UI-02~UI-05 pre-API gate 文档，并引用 UI-01 既有文档。Batch 2 已创建 UI-06~UI-10 五个规范 pre-API gate 文档；UI-06 两个旧草稿仅作只读参考，未纳入提交。即使文档齐全，UI-01~UI-10 也未自动获得 API Contract 或代码许可。运行截图和 Playwright artifact 当前均不存在；`RUNTIME_SCREENSHOT_READY=NO`、`PIXEL_DIFF_READY=NO`。

## 6. Shared subsystem rule

不得为 34 个页面重复建设后端。后续按共享能力归并：Family Home Projection、Assessment、Report Explanation、Growth Plan/Family Decision、Journey/Task、Service Supply/Booking/Service Record、Commerce/Entitlement、Community/Evidence、Family Profile/Consent、Model Gateway、Ontology Adapter 和外部 Effect Adapter。

## 7. Global blockers

1. 全局 Broad Research + Needs Analysis 是 BA Design 前置门禁，不是人工裁决，也不授权 API/代码。
2. 页面逐页 baseline、原图映射和运行截图尚未形成成对视觉差异证据。
3. 任何 Recommendation、PlanDraft、服务目录或 AI 输出都不能直接成为 Decision、Action 或核心 Fact。
4. 未成年人、诊断暗示、排名/总分、真实服务、支付、预约、通知、分享和真人联系必须保持 Human Gate 或 External Effect HOLD。
5. 本队列不创建 API Contract、不修改业务代码、不提交 UI-06 文件。

## 8. References

- `reports/m2/frontend/FAMILY_34_UI_DEVELOPMENT_LEDGER_001.md`
- `reports/m2/frontend/34_UI_SHARED_RESEARCH_AND_NEEDS_ANALYSIS_001.md`
- `reports/m2/frontend/FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md`
- `reports/m2/frontend/UI-01_ARCHITECT_REVIEW_AND_BLOCKING_QUESTIONS_001.md`
- `reports/m2/frontend/UI-05_BLOCKING_QUESTIONS_DECISION_PACK_001.md`
