# Phase D API Contract Entry Criteria and Blockers 001

## 1. Draft status and source boundary

```text
PHASE=D_ENTRY_CRITERIA_DRAFT
SOURCE_SUMMARY=reports/m2/frontend/PHASE_C_34_UI_COVERAGE_SUMMARY_001.md
PHASE_C_COVERAGE_COMMIT=7c4489f1a5be779e4fc935328327a9ca5de5a530
PHASE_D_ALLOWED=NO
API_CONTRACT_FILES_CREATED=0
CODE_FILES_MODIFIED=0
UI_SCOPE=UI-01..UI-34
ENTRY_CRITERIA_STATUS=DRAFT_FOR_ARCHITECT_HUMAN_REVIEW
```

本文件是 **Phase D 转段准入草案**，不构成 API Contract、OpenAPI、前后端开发任务、状态变更授权或外部效果授权。它继承 Phase C coverage summary 的已验证结论：34 个 UI 的前置文档覆盖完整，但所有页面 `API_CONTRACT_ALLOWED=NO`、`CODE_ALLOWED=NO`，并且没有运行后截图或 pixel diff。任何后续准入必须逐 UI 完成，不得以 Phase C 文档覆盖替代架构或人工决策。[1]

## 2. Phase D start criteria

每个 UI 只有在下表十项条件均有可审计证据时，才可以由 Architect/Human Review 将该 UI 的 API Contract 准入状态从 `NO` 改为待执行的 `GO_FOR_API_CONTRACT`。任何一项缺失均保持 `PHASE_D_ALLOWED=NO`，且不得创建具体 OpenAPI、DTO、Controller、Service、数据库迁移或 Web 业务组件。

| # | Mandatory entry condition | Minimum acceptance evidence | Decision owner |
|---:|---|---|---|
| 1 | Blocking Questions 闭合 | 每项 BQ 有编号、问题、Decision owner、Decision record、风险和后续 artifact；未裁决项不得以 recommendation 替代 decision。 | Architect + Business/Policy owner |
| 2 | Object and state semantics | 明确对象、来源、scope、状态机、事实/观点/假设边界；`Perspective/Hypothesis/Recommendation != Fact`。 | Domain architect |
| 3 | Named Action boundary | 每个可变更按钮对应已批准 Named Action；命令不能由自由文本直接改变核心 ontology。 | Domain architect + Policy owner |
| 4 | Consent/Human Gate matrix | 明确 actor、subject、purpose、scope、撤回、儿童/敏感场景、`REVIEW_REQUIRED`/`HUMAN_GATE_REQUIRED` 返回规则。 | Privacy/Policy owner + Human reviewer |
| 5 | Read Projection schema | 明确 read model、字段来源、版本、tenant/family/person scope、空态/错误态和 provenance 字段。 | Data architect |
| 6 | External Effect Adapter policy | 支付、预约、通知、日历、视频、分享、下载、客服、媒体、外联均定义 adapter、DEV no-op、fail-closed、审计和撤回策略。 | Integration architect |
| 7 | Model Gateway policy | 明确模型输入/输出 schema、allowed use、拒绝策略、人工升级和不得直写 ontology 的 Adapter 边界。 | AI architect + Policy owner |
| 8 | Audit and idempotency policy | 每个 Named Action 有 `correlation_id`、idempotency key、actor、policy decision、audit event、重试/冲突策略。 | Platform architect |
| 9 | Safety and evidence policy | 验证 no family ranking、no total score、no child diagnosis、no unproven causality；Evidence 有来源、版本、等级和纠错路径。 | Architect + Human reviewer |
| 10 | Visual and test plan | 基线图路径、viewport、路由、loading/empty/error/permission/HOLD 状态、Playwright 截图保存路径、pixel diff 规则已定义。 | Frontend architect + QA owner |

> **硬门禁。** 文档中的 Recommended Default 只是 Recommendation，不是 Decision；草稿、候选意图和 read projection 不能绕过上述十项条件成为正式 Action 或核心 Fact。每个准入包必须完成 **No family ranking / No total score validation**，并证明不产生儿童诊断、未经证据支持的因果或效果结论。

## 3. API Contract admission template

在某个 UI 获得逐页准入后，才可创建其具体 `UI-XX_API_CONTRACT_001.md`。该文件必须在实施前包含下表全部字段；本草案不创建任何具体 contract 文件。

| Contract section | Required content | Fail-closed rule |
|---|---|---|
| Read Projection DTO | `projection_version`、scope、source/provenance、display fields、state、timestamps、empty/error/permission state。 | scope/provenance 不足则不返回敏感字段。 |
| Named Action command | command name、actor、target、precondition、payload schema、idempotency key、correlation id、expected state transition。 | 未注册 Named Action 或 schema 不符则拒绝。 |
| Policy guard | tenant/family/person scope、role、Consent purpose、age/minor constraints、Human Gate trigger。 | policy/consent 不满足返回 `REVIEW_REQUIRED` 或 `HUMAN_GATE_REQUIRED`。 |
| Audit/event | `audit_event`、actor、policy decision、before/after reference、source and time、correlation id。 | audit 写入不可用时，核心 action 不执行。 |
| Error state | standardized code、user-safe message、retryable flag、recovery route、support correlation id。 | 不把系统错误伪装为成功。 |
| Adapter policy | external effect target、DEV no-op、fail-closed、idempotency、delivery evidence、withdraw/cancel strategy。 | 不允许直接调用真实支付、通知、预约、分享或外联系统。 |
| Model Gateway policy | prompt/input boundary、structured output schema、source citation/provenance、rejection and Human Gate routing。 | AI 自由文本不可直写 core ontology。 |
| Test fixtures | projection fixture、policy denial、consent denial、Human Gate、idempotency、adapter no-op、contract/UI alignment。 | fixture 与 DTO 不一致不得进入实现。 |
| Visual validation | baseline path、route、viewport、screenshot path、pixel diff threshold and exception record。 | 静态壳、原始基线、PPT/报告图不得作为运行截图。 |

## 4. High-risk review priority

下列类别必须优先进行 Architect/Human Review。优先级表示**先处理决策风险**，并不表示允许先实施。

| Priority | Risk domain | Affected UI | Required review focus |
|---|---|---|---|
| P0 | 儿童数据、身份、家庭档案、敏感 Assessment/Outcome | UI-01~UI-11、UI-24~UI-25、UI-29、UI-31、UI-33~UI-34 | Consent purpose、监护/成员 scope、诊断禁止、Human Gate、删除/导出。 |
| P0 | 支付、退款、订单、会员、权益、资产 | UI-13~UI-18、UI-30、UI-32 | Order/Entitlement source、payment/refund adapter、幂等、审计、DEV no-op。 |
| P0 | 社区发布、互动、媒体、审核、分享 | UI-05~UI-06、UI-12、UI-25~UI-28 | visibility、儿童媒体、Moderation、举报、撤回、外发与通知。 |
| P0 | 真人服务、预约、服务记录 | UI-19~UI-24、UI-31、UI-34 | Provider/qualification provenance、BookingDraft vs Booking、真人联系、服务记录/Outcome 边界。 |
| P1 | 预约、活动、通知、日历、视频 | UI-20~UI-23 | Registration/Booking draft、slot/名额、Adapter policy、Consent、Human Gate。 |
| P1 | AI 解释、助手、报告、成果叙事 | UI-03、UI-08、UI-10、UI-29 | Model Gateway schema、证据来源、诊断/因果禁止、AI 不直写 ontology。 |
| P1 | Ranking/score/points | UI-11、UI-17、UI-29 | no family ranking、no total score、禁止将指标升级为价值判断。 |

## 5. UI-01~UI-34 blocker index

下表是转段前的**索引**，不是对现有 BQ 的替代裁决。每一行至少需要表中列出的 owner 出具 Decision record，随后才可申请该 UI 的 API Contract admission。

| UI | Gate verdict | Key blocker category | Required Decision owner | Phase D entry recommendation |
|---|---|---|---|---|
| UI-01 | NO_GO | Home projection、家庭范围、10 项未关闭 BQ、Consent/Named Action | Architect + Business/Policy | 先逐项关闭 BQ；不得创建 Contract。 |
| UI-02 | NO_GO_WITH_BLOCKERS | Assessment scope、题库/证据、儿童 Consent、状态机 | Domain/Privacy architect | 先裁决对象主体、题目版本与 consent。 |
| UI-03 | NO_GO_WITH_BLOCKERS | Report provenance、解释/诊断边界、Gateway schema | AI/Data architect + Human reviewer | 先定义 evidence/read projection 与 AI 输出 schema。 |
| UI-04 | NO_GO_WITH_BLOCKERS | PlanDraft provenance、Decision/Action、Consent、版本 | Domain architect + Policy owner | 先闭合 draft-to-decision 边界。 |
| UI-05 | NO_GO_WITH_BLOCKERS | GrowthPlan/Service/Community、真人服务、外部 effect | Architect + Business/Policy | 以已存在 Decision Pack 为输入逐项裁决。 |
| UI-06 | NO_GO_WITH_BLOCKERS | 陪跑服务、私有动态、真人服务、Consent | Service/Community architect | 闭合 service/community visibility 和 action 边界。 |
| UI-07 | NO_GO_WITH_BLOCKERS | UI-02 入口职责、题目版本、session draft | Assessment architect | 与 UI-02 共用 assessment contract 后再准入。 |
| UI-08 | NO_GO_WITH_BLOCKERS | Report/Evidence provenance、敏感内容、版本 | Data/AI architect | 先建立 report read projection 与 policy guard。 |
| UI-09 | NO_GO_WITH_BLOCKERS | Task projection、Complete/Pause/Amend、Outcome 边界 | Journey architect | 先注册 Named Action 和状态机。 |
| UI-10 | NO_GO_WITH_BLOCKERS | 未成年人、guardian Consent、敏感主题、Agent boundary | AI/Privacy architect + Human reviewer | P0：先完成 child-safe Gateway/consent review。 |
| UI-11 | HOLD_HUMAN_GATE / NO_GO | Ranking/Total Score 禁止、儿童比较 | Policy owner + Human reviewer | 先批准非排名的自我历史 projection。 |
| UI-12 | HOLD_EXTERNAL_EFFECT / NO_GO | Evidence/Outcome、媒体、公开分享、儿童 Consent | Community/Privacy architect | 先定义媒体与 share adapter no-op。 |
| UI-13 | HOLD_EXTERNAL_EFFECT / NO_GO | Product/Offering、购买、支付、权益 | Commerce architect | P0：先定义商品/权益 provenance 与 payment boundary。 |
| UI-14 | HOLD_EXTERNAL_EFFECT / NO_GO | Order、Payment、Refund、Entitlement | Commerce architect + Finance/Policy | P0：先定义 order lifecycle 和 adapter policy。 |
| UI-15 | HOLD_EXTERNAL_EFFECT / NO_GO | Invite、Reward、通知、反滥用、外发分享 | Growth/Commerce architect | 先定义 anti-abuse、consent 与 no-op adapters。 |
| UI-16 | HOLD_EXTERNAL_EFFECT / NO_GO | 库存、订单、支付、通知、价格 | Commerce architect | P0：先闭合 group/stock/order state machine。 |
| UI-17 | NO_GO_WITH_BLOCKERS | 积分规则、权益事实、no score/ranking | Policy + Commerce architect | 先定义 points event ledger，不得聚合为总分。 |
| UI-18 | HOLD_EXTERNAL_EFFECT / NO_GO | 续费、退款、权益、通知、客服 | Commerce architect | P0：先定义 membership/entitlement source 与 no-op。 |
| UI-19 | NO_GO_WITH_BLOCKERS | Provider/Offering/Availability、SERVICE consent、筛选/推荐 | Service architect + Privacy | 现有 read slice 仅作输入；先闭合 provider provenance。 |
| UI-20 | HOLD_EXTERNAL_EFFECT / NO_GO | Qualification、BookingDraft、预约/视频/支付 | Service architect + Human reviewer | P0：先定义资质证据和 BookingDraft boundary。 |
| UI-21 | HOLD_EXTERNAL_EFFECT / NO_GO | Slot、BookingDraft、占座、通知、支付、真人联系 | Service/Integration architect | P0：先定义 booking state/adapter no-op。 |
| UI-22 | HOLD_EXTERNAL_EFFECT / NO_GO | Activity provenance、报名、日历/视频/通知、儿童参与 | Event/Privacy architect | 先定义 Activity projection 和 registration draft。 |
| UI-23 | HOLD_EXTERNAL_EFFECT / NO_GO | 报名/名额、Consent、日历/视频/支付/分享 | Event/Integration architect | P0：先定义 registration lifecycle 与 adapter policy。 |
| UI-24 | NO_GO_WITH_BLOCKERS | Booking/Registration/ServiceCase/Record/Outcome、纠错 | Service/Data architect | 先闭合服务记录与 outcome 的对象边界。 |
| UI-25 | NO_GO_WITH_BLOCKERS | Community scope、Moderation、儿童风险、互动/分享 | Community/Privacy architect | P0：先定义 visibility、moderation 与 consent。 |
| UI-26 | HOLD_HUMAN_GATE / HOLD_EXTERNAL_EFFECT / NO_GO | 发布、媒体、审核、通知、分享 | Community/Privacy architect + Human reviewer | P0：先定义 PostDraft/PublishAction 和 moderation flow。 |
| UI-27 | HOLD_HUMAN_GATE / HOLD_EXTERNAL_EFFECT / NO_GO | 评论/点赞/举报、Evidence、分享、儿童内容 | Community/Privacy architect | P0：先定义 interaction actions 和 content policy。 |
| UI-28 | HOLD_HUMAN_GATE / HOLD_EXTERNAL_EFFECT / NO_GO | 私密可见性、撤回/删除、审核、通知 | Community/Privacy architect | P0：先定义 private scope、retention 和 deletion policy。 |
| UI-29 | HOLD_HUMAN_GATE / NO_GO | Outcome/Evidence、纠错、诊断/因果/总分/排名、导出 | Data/AI/Privacy architect | P0：先定义 evidence lineage 与 non-causal narrative policy。 |
| UI-30 | HOLD_EXTERNAL_EFFECT / NO_GO | Membership/Entitlement、续费/支付/退款/客服 | Commerce/Integration architect | P0：先定义 membership state 和 payment/support adapters。 |
| UI-31 | HOLD_EXTERNAL_EFFECT / NO_GO | ServiceCase/Record、真人服务、通知、纠错 | Service/Privacy architect | P0：先定义 service read model 和 correction action。 |
| UI-32 | HOLD_EXTERNAL_EFFECT / NO_GO | Order/Entitlement/Asset、支付、退款、下载、分享 | Commerce/Integration architect | P0：先定义 order/asset projection 与 external adapters。 |
| UI-33 | HOLD_HUMAN_GATE / NO_GO | Family/Person/Profile、儿童隐私、身份、Consent、导出/删除 | Privacy/Data architect + Human reviewer | P0：先定义 identity/guardian/consent and export/deletion policies。 |
| UI-34 | HOLD_HUMAN_GATE / NO_GO | ServiceRecord/Outcome/Evidence、纠错、儿童记录、导出/分享 | Service/Data/Privacy architect | P0：先定义 record provenance and correction/consent flow。 |

## 6. Prohibited shortcuts

1. 不得因为 Phase C coverage complete 就声称动态 UI、API Contract、前后端一致或视觉验收完成。
2. 不得把现有静态壳、原始 baseline 图、PPT/报告图、素材图或浏览器可见页面当作开发后运行截图。
3. 不得在没有成对运行截图和明示差异规则时声称 pixel diff 完成。
4. 不得绕过 Model Gateway、Ontology Adapter、Named Action、Consent、Human Gate、Audit、idempotency 或 External Effect Adapter。
5. 不得把 `Perspective`、`Hypothesis`、`Recommendation`、PlanDraft、AI 输出或服务目录当作 `Fact`、`Decision`、`Action` 或核心 ontology 写入。
6. 不得生成家庭排名、家庭总分、儿童诊断、未经证据支持的因果/效果结论，或在 DEV 产生真实支付、预约、通知、分享、客服和外部系统调用。

## 7. References

[1] `reports/m2/frontend/PHASE_C_34_UI_COVERAGE_SUMMARY_001.md`（commit `7c4489f1a5be779e4fc935328327a9ca5de5a530`）
[2] `reports/m2/frontend/PHASE_C_UI_DEVELOPMENT_QUEUE_001.md`
[3] `reports/m2/frontend/FAMILY_34_UI_DEVELOPMENT_LEDGER_001.md`
[4] `reports/m2/frontend/34_UI_SHARED_RESEARCH_AND_NEEDS_ANALYSIS_001.md`
