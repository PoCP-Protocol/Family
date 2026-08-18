# Family 34 UI BA Design Queue

> **队列原则：** 34 页不是 34 套独立系统。每一页必须先完成 BA Research 与 BA Design，再锁定用户原图 Visual Baseline，随后才进入 Contract Plan、FE/BE Implementation、Consistency Tests、Playwright Screenshot Diff、Fix Loop 和 Git Commit/Push。
>
> **统一流程：** `BA Research -> BA Design -> Visual Baseline -> Contract Plan -> FE/BE Implementation -> Consistency Tests -> Playwright Screenshot Diff -> Fix Loop -> Git Commit/Push`
>
> **证据规则：** `30_素材_materials` 只读；优先 `_extracted/逐页文本_含页码/`；不使用 `all_materials.txt`；榜样教育/波波校长材料最高 E1，只作为业务假设和设计来源；`Perspective != Fact`、`Hypothesis != Fact`、`Recommendation != Decision != Action`。

## Queue Table

| UI ID | 页面名 / 业务场景 | BA 研究主题 | 需研究材料 | 业务对象 | 前后端能力 | 证据风险 | Human Gate / Consent 要求 | 是否允许开发 |
|---|---|---|---|---|---|---|---|---|
| UI-01 | 家庭成长平台首页 | 家庭入口、家庭摘要、今日行动、内容与服务入口 | PPT-01 p1/7/17；UI-01 baseline；Family Home projection | Family、Person、Membership、Consent、Need、Task | Home projection、Gateway explanation、FE shell | 原图与 UI-02 清晰母版映射需人工闭包；推荐文案低清 | Family scope；AI explanation consent；不做自动推荐行动 | READY_FOR_DEV（只读/受控 projection） |
| UI-02 | 家庭成长平台清晰首页/体检入口 | 家庭体检入口、问题理解、测评启动 | PPT-01 p7/17；UI-02 baseline；Gateway policy | Family、Person、NeedType、Capability、Consent | L0 snapshot、Gateway draft、入口状态 | 图片/文案部分低清；不确定项需确认 | Assessment consent；不输出诊断事实 | NEEDS_CONFIRMATION |
| UI-03 | 家庭测评第 2/5 步 | Need 输入、家庭场景选择、补充资料 | PPT-01 p7；UI-03 baseline；Assessment evidence | Family、Person、NeedInput、NeedSignal、Intent、Consent | Need/Intent DTO、撤回/跳过、表单状态 | 选项与历史 UI 映射需逐字核对 | 儿童资料 Consent；敏感问题 Human Gate | NEEDS_CONFIRMATION |
| UI-04 | AI 成长诊断报告/家庭成长说明 | explanation、证据、不确定性、报告撤回 | PPT-01 p7；PPT-02 p4/15/19；UI-04 baseline | SupportReportSnapshot、EvidenceSource、Need、Consent | Report projection、Model Gateway schema、withdraw | 分数/标签/敏感建议不得成为 Fact；页面编号曾有冲突 | AI Gateway；敏感建议 Human Gate；report consent | NEEDS_CONFIRMATION |
| UI-05 | 90 天成长方案 | 计划草稿、阶段/周/任务模板、家庭决定 | PPT-01 p4/7/17；PPT-02 p6/9/11/12/14/28；UI-05 baseline；BA Design | JourneyTemplate、TaskTemplate、Capability、PlanDraft、FamilyDecision、Consent | GrowthPlan projection、Decision boundary、Named Action stub、Audit | source/evidence/consent/version 语义待架构师确认 | `GROWTH_PLAN` consent；FamilyDecision；Human Gate；无外部 effect | READY_FOR_SINGLE_VERTICAL_SLICE（BA/架构确认后） |
| UI-06 | 陪跑服务 / 社群服务 | 90 天交付、陪伴关系、服务记录和打卡入口 | PPT-01 p7/11/17；UI-06 baseline；UI-05 design | ServiceOffering、Provider、Activity、ServiceCase、ServiceRecord | ServiceJourney read DTO、community projection | 真实陪跑/真人服务不能由页面证明 | SERVICE consent；真人服务/通知 Human Gate | DOC_ONLY / 只读准备 |
| UI-07 | 我的会员中心 | 会员身份、资产、权益解释 | PPT-01 p15/17；PPT-02 p8/24；UI-07 baseline | ProductOffering、PriceEntitlementPolicy、CustomerAsset | 沙箱资产 projection、权益说明 | 真实会员/价格/支付材料不是运行事实 | Payment/entitlement Gate；资产 consent | HOLD_EXTERNAL_EFFECT |
| UI-08 | 成长报告 / 反馈 | 私有过程反馈、报告回看与撤回 | PPT-01 p7/13；PPT-02 p14/19；UI-08 baseline | EvidenceSource、SupportReportSnapshot、ServiceRecord | Private report projection、withdraw action | 静态分值不能变成长分/诊断；效果结论需证据 | Report consent；敏感内容 Human Gate | HOLD_HUMAN_GATE |
| UI-09 | 今日成长任务 | 任务查看、完成、暂停、取消和回流 | PPT-01 p7/17；PPT-02 p12/14/15；UI-09 baseline | JourneyTemplate、TaskTemplate、TaskInstance、Evidence | Task projection、Named Action、idempotency、audit | 完成任务不等于 Outcome；任务来源需追溯 | Family scope；儿童直接作答另行 Gate | READY_FOR_DEV（共享 Journey/Task） |
| UI-10 | 孩子侧成长助手 | 儿童可见内容、监护人控制、只读陪练 | PPT-02 p11/17/19；UI-10 baseline | Person、LifeStage、Consent、TaskTemplate | 家庭私有 read projection、Gateway explanation | 儿童直接作答和敏感画像证据不足 | Guardian consent；儿童数据 Human Gate | HOLD_HUMAN_GATE |
| UI-11 | 成长榜单 | 自我进度、激励与非排名展示 | PPT-01 p13；PPT-02 p21；UI-11 baseline | PrivateProgress、Journey、Evidence | 个人/家庭历史 projection | 跨家庭排名、同龄平均、总分禁止 | 永久禁止 ranking/total score | HOLD_HUMAN_GATE |
| UI-12 | 成长成果海报 | 私有成果记录、撤回、分享意图 | PPT-01 p7/13；PPT-02 p14/20；UI-12 baseline | EvidenceSource、PrivateOutcomeProcess、Consent | 私有海报 projection、withdraw action | 用户原图映射/公开分享证据不足；成果不等于效果 | Share consent；外发 Human Gate | HOLD_EXTERNAL_EFFECT |
| UI-13 | 家庭成长商城 | 目录、商品说明、服务候选 | PPT-01 p8/9/17；UI-13 baseline | ProductOffering、ResourceAsset、EvidenceSource | AdmittedCatalog projection、detail API | 价格/权益/商品真实性需服务端准入 | Commerce Gate；不接支付 | DOC_ONLY / 目录设计 |
| UI-14 | 商品详情 | 商品事实、体验意图、拼团入口 | PPT-01 p8/9；UI-14 baseline | ProductOffering、PriceEntitlementPolicy、CommerceOperation | Detail DTO、受控 intent | 购买文案可能被误当真实交易 | Payment/commerce consent；无真实扣款 | HOLD_EXTERNAL_EFFECT |
| UI-15 | 邀请有礼 | 成长邀请、测试资产回执、可撤回 | PPT-01 p8/9/16；UI-15 baseline；既有 operation contract | ProductOffering、CustomerAsset、CommerceOperation | Named Action fixture、幂等、private receipt | 分享/奖励资格需明确，不把测试资产当权益 | Invite consent；外部传播 adapter HOLD | READY_FOR_DEV（TEST no-op） |
| UI-16 | 拼团专区 | 成长小组、组状态、测试资产 | PPT-01 p8/9；UI-16 baseline；既有 operation contract | ProductOffering、CommerceOperation、CustomerAsset | CREATE_GROUP fixture、projection、cancel | 不接支付、不占真实名额 | Commerce consent；payment/seat HOLD | READY_FOR_DEV（TEST no-op） |
| UI-17 | 积分商城 | 积分说明、兑换候选、任务资产 | PPT-01 p9/15；UI-17 baseline | ProductOffering、PriceEntitlementPolicy、TestLedger | 说明/测试 ledger projection | 真实积分/兑换事实缺证据 | Commerce/entitlement Gate | HOLD_EXTERNAL_EFFECT |
| UI-18 | 我的资产/成长合伙人 | 私有资产、邀请和权益说明 | PPT-01 p9/15；UI-18 baseline | CustomerAsset、ProductOffering、Membership | Private asset projection | 合伙人收益/权益不可凭图确认 | Financial/entitlement Gate；资产 consent | DOC_ONLY / 只读准备 |
| UI-19 | 名师专区/服务供给列表 | 准入供给、provider、offering、可用摘要 | PPT-01 p10/11/17；UI-19 baseline；Provider supply slice | Provider、Qualification、Offering、AvailabilitySlot | Catalog projection、tenant/family scope、筛选 | 教师主数据/资格来源需受控；不做推荐排序 | SERVICE consent；不外呼、不预约 | READY_FOR_DEV（已有样板） |
| UI-20 | 名师详情 | 供给详情、资质来源、服务边界 | PPT-01 p10/11；UI-20 baseline | Provider、Qualification、Offering、EvidenceSource | Detail DTO、资格/version projection | 评分/资质/最佳判断不得无来源呈现 | SERVICE consent；真人服务 Human Gate | READY_FOR_DEV（只读详情） |
| UI-21 | 在线咨询预约 | 服务选择、时段草稿、预约意图 | PPT-01 p10/11/17；UI-21 baseline | Provider、AvailabilitySlot、Consent、Booking | Booking draft、Named Action fixture、audit | 不真实占座、不真实通知、不真人联系 | SERVICE consent；Human Gate；external effect HOLD | HOLD_EXTERNAL_EFFECT（TEST 可验证） |
| UI-22 | 线下沙龙列表 | 活动目录、城市/时间筛选、活动说明 | PPT-01 p10/11；UI-22 baseline | Activity、Provider、Qualification | Activity catalog read DTO | 活动资格、地点和名额需服务端准入 | Activity consent；不占座 | DOC_ONLY / 目录设计 |
| UI-23 | 活动详情/报名 | 活动说明、报名意图、测试回执 | PPT-01 p10/11；UI-23 baseline | Activity、EventRegistration、Consent | CREATE_EVENT fixture、audit、cancel | 不收费、不占真实席位 | Activity consent；external effect HOLD | HOLD_EXTERNAL_EFFECT（TEST no-op） |
| UI-24 | 我的预约/活动 | 私有服务资产、活动状态、取消/回执 | PPT-01 p11/14/15；UI-24 baseline | Booking、EventRegistration、ServiceRecord、CustomerAsset | ServiceTimeline projection | 记录不等于真人服务已发生 | SERVICE consent；取消需 Named Action | READY_FOR_DEV（只读 projection） |
| UI-25 | 家长社区/交流广场 | 合成 feed、求助讨论、成果入口 | PPT-01 p12/13；PPT-02 p20；UI-25 baseline | CommunityTemplate、Consent、EvidenceSource | Private synthetic feed、read projection | 不接真实 feed、不跨家庭推荐、不建公开画像 | Community consent；外发 Human Gate | READY_FOR_DEV（合成只读） |
| UI-26 | 发布动态/打卡分享 | 模板选择、私有发布回执、撤回 | PPT-01 p12/13；UI-26 baseline；PUBLISH_TEMPLATE contract | CommunityTemplate、CommunityPublication、Consent | Named Action template、private receipt、withdraw | 不真实外发；原文/敏感材料需脱敏 | Community/share consent；external effect HOLD | HOLD_EXTERNAL_EFFECT（private TEST） |
| UI-27 | 动态详情 | 私有动态内容、证据和互动边界 | PPT-01 p12/13；UI-27 baseline | CommunityTemplate、CommunityPublication | Synthetic detail projection | 不显示真实社区数据，不推断互动事实 | Community consent；敏感内容 Human Gate | DOC_ONLY |
| UI-28 | 我的社区 | 私有发布记录、社群资产 | PPT-01 p12/13；UI-28 baseline | Person、CommunityTemplate、CommunityPublication | Private community projection | 禁止公开等级/画像/排名 | Community consent；外发 HOLD | HOLD_HUMAN_GATE |
| UI-29 | 成长成果 | 私有过程回顾、报告撤回、证据链 | PPT-01 p7/13/20；PPT-02 p14/18；UI-29 baseline | EvidenceSource、SupportReportSnapshot、ServiceRecord | Private outcome/process projection、withdraw | 不能声称教育效果、因果或成功率 | Report consent；Human Gate for sensitive claims | READY_FOR_DEV（私有记录） |
| UI-30 | 年度会员服务 | 会员服务目录、资产和续费说明 | PPT-01 p11/15/17；PPT-02 p8/24；UI-30 baseline | ProductOffering、PriceEntitlementPolicy、CustomerAsset | Sandbox entitlement projection | 真实会员、支付、续费未授权 | Payment/entitlement Gate | HOLD_EXTERNAL_EFFECT |
| UI-31 | 我的服务 | 计划/陪跑/服务进度总览 | PPT-01 p7/11/15；UI-31 baseline | ServiceOffering、Provider、ServiceCase、ServiceRecord、TaskInstance | Service/Task projection、pause | 过程状态不等于结果；真人服务需证据 | SERVICE consent；pause/revoke Named Action | READY_FOR_DEV（只读/可逆） |
| UI-32 | 订单与资产 | 私有订单、资产、权益状态 | PPT-01 p14/15；UI-32 baseline | ProductOffering、CommerceOperation、Booking、Registration、CustomerAsset | Customer projection、分类 DTO | 不接支付，不伪造真实资产 | Commerce/entitlement Gate | DOC_ONLY / 沙箱投影 |
| UI-33 | 家庭档案 | Family/Person/关系/Consent 档案 | PPT-01 p15/18；PPT-02 p18/19；UI-33 baseline | Family、Person、Membership、Relationship、Consent、LifeStage | FamilyProfileSnapshot、脱敏 projection | 用户原图/字段证据需逐项确认；敏感画像风险 | Profile consent；儿童数据 Human Gate | READY_FOR_DEV（私有只读） |
| UI-34 | 服务记录 | 咨询/活动/服务过程记录和撤回 | PPT-01 p11/14/15；UI-34 baseline | ServiceOffering、Provider、Activity、ServiceRecord、Booking、Registration | ServiceRecord DTO、cancel/withdraw、audit | 过程记录不能证明真人服务或效果 | SERVICE consent；撤回/取消 Named Action | READY_FOR_DEV（私有记录） |

## Shared Subsystem Grouping

| 共享子系统 | 覆盖页面 | 不允许的重复建设 |
|---|---|---|
| Family Home / Profile / Consent | UI-01、02、03、10、33 | 不为每页复制 Family/Person/scope/consent。 |
| Assessment / Need / Intent | UI-02、03、04 | 不把每个入口做成独立测评数据库。 |
| Report Explanation / Evidence | UI-04、08、12、29 | 不复制报告表；不把分数、建议、过程记录写成事实。 |
| Growth Plan / Journey / Task | UI-05、06、09、31 | UI-05 不直接创建运行对象；共享 Plan/Task/Projection。 |
| Service Supply / Provider / Activity / Booking | UI-19、20、21、22、23、24、34 | 不按名师、沙龙、预约页重复建供给系统。 |
| Commerce / Customer Asset / Entitlement | UI-07、13、14、15、16、17、18、30、32 | 共享 catalog/asset；真实支付和权益独立 Gate。 |
| Community / Publication / Evidence | UI-25、26、27、28、29 | 不建立真实公开 feed；使用模板和私有回执。 |
| Model Gateway / Policy / Human Gate | UI-02、04、05、06、08、10、11、12、25、29、31 | AI 只能解释/草稿/建议，不能直写核心 Ontology。 |
| Notification / Payment / Calendar / Video / External Adapter | UI-06、07、14、21、23、26、30 | DEV/TEST 可 stub/no-op；生产 effect 全部 HOLD。 |

## Admission Vocabulary

`READY_FOR_DEV` 只表示 BA 主题和证据边界足以进入受控 DEV/TEST 纵切，不表示生产能力已完成。`NEEDS_CONFIRMATION` 表示页面/图片/业务语义或映射未闭包。`HOLD_HUMAN_GATE` 表示需要人工审查或儿童/敏感数据治理。`HOLD_EXTERNAL_EFFECT` 表示支付、预约、通知、外发、真人服务等必须隔离。`DOC_ONLY` 表示先做业务设计、视觉基线和契约，不进入运行时代码。`READY_FOR_SINGLE_VERTICAL_SLICE` 仅用于 UI-05 当前受控准入状态。

## Per-Slice Required Evidence

每个进入开发的 UI slice 必须交付 Visual Baseline Sheet、Frontend Component Plan、Backend Contract Plan、Data Lineage Plan、API/DB/Policy/Audit 证据、FE/BE 一致性测试、Playwright desktop/mobile 截图和差异修正记录。任何只完成静态图、只完成 API、只完成 mock 而未完成前后端一致性和截图对标的 slice，不得声明完成。

## References

[1]: `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md`
[2]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`
[3]: `governance/FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md`
[4]: `30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt`
[5]: `30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt`
[6]: `30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt`

**BA_QUEUE_READY** `reports/m2/frontend/FAMILY_34_UI_BA_DESIGN_QUEUE_001.md`
