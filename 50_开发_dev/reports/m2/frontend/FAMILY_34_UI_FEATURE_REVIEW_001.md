# Family 34 UI × 功能点拆解全面复核

> **复核性质：** 只读复核报告。依据 `FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md`、`FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`、`UI01_FULL_EXPOSURE_SUBSYSTEM_DECOMPOSITION_001.md`、`UI04_UI10_PPT06_PPT08_VISUAL_GAP_ANALYSIS_001.md` 与 `F06_F09_UI_NOTES.md` 进行，不代表新增代码实现。
>
> **总 verdict：** `CONDITIONALLY_READY_FOR_NEXT_SLICE`。34 页 A 层覆盖和关键字段完整，可以进入后续开发排期；但不能把全量台账直接视为“34 页都已动态实现”。UI-02/UI-03 仍有基线裁定项；Page Lineage Graph 存在少量表格与图形不完全对称的关系；UI-11、UI-21、UI-26、UI-28、UI-32 等页面的外部 effect 必须继续停在 HOLD；UI-05、UI-09、UI-19 是最适合率先进入纵切开发的页面。

## 1. 复核范围与判定标准

本轮复核把“完整”拆成三个层次。第一层是**结构完整**：每个 UI 都有页面锚点、可见线索、功能摘要、上下游、写入上限、动作候选、对象/API/Agent/Adapter 和 Gate/HOLD。第二层是**关系完整**：功能必须能够放入跨页链路，不能把同一共享子系统按页面重复建设。第三层是**工程可进入性**：L1/L2 投影或草稿必须与 Named Action、Consent、Human Gate 和外部 Adapter 分层，不能把推荐、草稿、点击或 mock 状态伪装成真实核心事实。

## 2. 程序化结构核验结果

| 检查项 | 结果 | 判定 |
|---|---:|---|
| A 层页面行数 | 34 | 通过 |
| 唯一 UI ID | 34 | 通过 |
| 重复 UI ID | 0 | 通过 |
| 缺失 UI ID | 0 | 通过 |
| A 层字段列结构 | 34 行均有 13 个业务字段 | 通过；Markdown 解析时每行包含首尾分隔符，awk 原始 `NF=16` 属正常分隔符计数，不是缺列 |
| feature_points_summary 过短 | 0 | 通过；没有只写标题的空摘要 |
| Page Lineage Graph | 存在 | 需要关系对称性修正 |
| Complete Feature Inventory | 存在 | 通过作为共享子系统归并台账 |
| UI-05 状态机 | 存在 | 通过；需保持 plan_draft 上限 |
| plan_draft → FamilyDecision → Named Action | 存在 | 通过；后续实现仍需契约和审计证据 |

## 3. 34 UI 逐页复核表

`Completeness` 关注字段是否齐全；`Feature quality` 关注摘要是否足以拆开发任务；`Lineage review` 关注上下游是否能进入统一链路；`Boundary review` 关注写入上限与动作候选是否匹配。`PASS` 代表当前台账足够进入排期，`REVIEW` 代表需要补证据、关系或安全契约后再进入实现。

| UI | Screen / 功能拆解复核 | Completeness | Lineage review | Boundary review | Verdict / issue |
|---|---|---|---|---|---|
| UI-01 | 首页摘要、入口编排、今日任务、内容/服务目录、空错权限态；有完整对象/API/权限边界。 | PASS | 下游较多，作为编排入口合理；UI-02 是版本候选。 | L1 projection，NO_ACTION；没有越过写入边界。 | PASS；保留 UI-01/UI-02 版本关系确认。 |
| UI-02 | 首页同构视图、版本/用户态差异、复用入口；功能摘要不为空。 | PASS | 作为 UI-01 候选上游关系尚未裁定。 | L1 read only；`SelectHomeVariant` 仍是未确认候选。 | REVIEW；`NEEDS_CONFIRMATION`。 |
| UI-03 | 测评题目、选项、步骤进度、补充信息；具备 session/answer 草稿边界。 | PASS | UI-01/02、UI-08 → UI-03 → UI-04 关系合理。 | L1/L2 draft；不写 Need/Diagnosis Fact。 | REVIEW；PPT 内部 step 与 global screen 粒度 `CONFLICT`。 |
| UI-04 | 报告快照、证据/不确定性、建议、计划草稿入口；不是只写“AI报告”。 | PASS | UI-03/UI-08 → UI-04 → UI-05/UI-09/UI-12。 | L1/L2 explanation；总分、同龄平均和敏感建议 Gate/HOLD。 | PASS with Human Gate；不得诊断化。 |
| UI-05 | 90天、阶段线、周计划、任务三态、家庭确认、暂停/返回。 | PASS | UI-04 → UI-05 → UI-06/UI-09/UI-31，主链清晰。 | L1/L2 plan_draft；FamilyDecision 后才可能 L3。 | P0；`plan_draft → FamilyDecision → Named Action` 已成立。 |
| UI-06 | 陪跑服务摘要、顾问/班主任/AI/专家、打卡、交流、直播、记录回流。 | PASS | UI-05、UI-19/20 与 UI-24/25/29/31/34 存在业务承接；视觉上不等于社区页。 | L1 service projection/L2 intent；真人、通知、直播 HOLD。 | REVIEW；需进一步拆 ServiceCase 与 Community 边界。 |
| UI-07 | 会员权益、报告/计划/订单/邀请入口和资产分域。 | PASS | UI-01/05/06 → UI-07 → UI-30~34 合理。 | L1 entitlement；不购买、不发奖。 | PASS；注意与 UI-18/UI-30 的“我的”分域。 |
| UI-08 | 体检入口、适用范围、会话初始化、商业漏斗上游关系。 | PASS | UI-08 → UI-04；与 UI-03 是测评阶段承接。 | L1 readiness/L2 draft；不写 referral/order/score。 | PASS；商业关联不能当视觉复用。 |
| UI-09 | 任务投影、完成/部分/未完成、反思、暂停；具备 action status 语义。 | PASS | UI-04/UI-05/UI-01 → UI-09 → UI-10/UI-11/UI-12/UI-31/UI-34。 | L1 read，L3 仅受控完成/反思；不改 Outcome/Profile。 | P0；需复用既有受控 action，不新造任务引擎。 |
| UI-10 | 儿童助手、适龄交互、挑战入口、家长可见性、多模态边界。 | PASS | UI-09/UI-33 → UI-10 → UI-09/UI-27 存在回流。 | L1/L2 child-safe draft；不写儿童能力/情绪/风险。 | REVIEW；必须先做年龄、Consent、Human Gate。 |
| UI-11 | 排行榜、周期/地域/班级、奖台、积分均已登记。 | PASS | UI-09 → UI-11 → UI-12 业务链可读，但不能成为真实排名链。 | L0/L1 Guard 或禁用说明；默认 HOLD。 | HOLD；禁止 Total Score、ranking、同龄比较。 |
| UI-12 | 成果海报、前后视觉、勋章、二维码、分享草稿。 | PASS | UI-09/UI-27 → UI-12 → UI-25/UI-29/UI-07。 | L1/L2 evidence story；外发分享 L4 HOLD。 | REVIEW；不得把视觉对比升级为 Outcome Fact。 |
| UI-13 | 商城目录、入口分域、商品内容浏览。 | PASS | UI-01/UI-07 → UI-13 → UI-14~18。 | L1 catalog/intent；不产生订单支付。 | PASS；与 Assessment/Report 保持数据隔离。 |
| UI-14 | SKU/权益详情、购买意向、拼团意向草稿。 | PASS | UI-13 → UI-14 → UI-15/UI-16/UI-07。 | L1/L2 draft；不支付、扣款、自动转 Journey。 | PASS with EXTERNAL_EFFECT_HOLD。 |
| UI-15 | 邀请进度、邀请草稿、奖励账本候选。 | PASS | UI-13/14 → UI-15 → UI-18/UI-12。 | L1/L2；不发送、不发奖、不推导佣金。 | REVIEW；需 Referral ledger 与 Share Adapter 契约。 |
| UI-16 | 拼团商品、价格、人数、倒计时、团购意向。 | PASS | UI-13/14 → UI-16 → UI-18/UI-32；闭环可解释。 | L1 mock/read，L2 intent；库存/支付/成团 HOLD。 | HOLD；视觉数字不能当真实库存/交易。 |
| UI-17 | 积分余额/商品/任务兑换、来源说明。 | PASS | UI-09/UI-13 → UI-17 → UI-18/UI-32。 | L1 controlled ledger/L2 draft；不扣真实积分。 | REVIEW；需要账本事实与奖励 Policy。 |
| UI-18 | 合伙人身份、邀请/成交/积分/奖励、订单/权益投影。 | PASS | UI-15/16/17 → UI-18 → UI-32/UI-07。 | L1 partner asset；不写佣金、提现、结算。 | REVIEW；与 UI-07 会员资产必须隔离。 |
| UI-19 | 搜索、筛选、教师卡、领域、准入/可预约摘要、family scope。 | PASS | UI-01/UI-06/UI-13 → UI-19 → UI-20/UI-21/UI-22/23。 | L1 read-only；只读查询 Named Action；不排序/预约。 | P0；已有独立 staged candidate，边界清晰。 |
| UI-20 | Provider 详情、资质证据、标签、时段、咨询/预约草稿。 | PASS | UI-19 → UI-20 → UI-21/UI-24。 | L1 detail/L2 booking draft；不锁时段、不做最佳排序。 | P1；需补资格证据和评分来源。 |
| UI-21 | 咨询方式、时段、描述、隐私、booking draft/mock receipt。 | PASS | UI-20 → UI-21 → UI-24/UI-31/UI-34；业务回流合理。 | L1/L2，DEV stub 才能进入 L3 合同；真实 effect HOLD。 | REVIEW/HOLD；Consent、Human Gate、Adapter 必须先闭合。 |
| UI-22 | 城市/主题筛选、活动卡、余量摘要、活动注册草稿。 | PASS | UI-06/UI-19 → UI-22 → UI-23/UI-24。 | L1 activity read/L2 draft；不锁名额、不报名。 | PASS with EXTERNAL_EFFECT_HOLD。 |
| UI-23 | 活动详情、流程、适合人群、报名草稿。 | PASS | UI-22 → UI-23 → UI-24。 | L1/L2；“适合人群”不做自动诊断。 | PASS with HUMAN_GATE for registration。 |
| UI-24 | 我的咨询/活动、状态、会员卡、服务回流。 | PASS | UI-21/UI-23/UI-06 → UI-24 → UI-31/UI-34/UI-07。 | L1 process projection；取消/撤回需受权。 | PASS；真人空间/通知仍 HOLD。 |
| UI-25 | 社区 feed、分类、发帖/打卡入口、内容证据级别。 | PASS | UI-06/UI-12 → UI-25 → UI-26~29；与 UI-06 业务相连但非视觉复用。 | L1 private feed；不公开发布。 | P1；需定义跨家庭可见性和 Moderation。 |
| UI-26 | 打卡/成果/求助/经验、媒体、话题、社群同步、发布草稿。 | PASS | UI-25/UI-27 → UI-26 → UI-28/UI-29。 | L2 draft/no-op；不公开写入。 | REVIEW/HOLD；媒体、儿童资料、发布全需 Human Gate。 |
| UI-27 | 成长报告、勋章、成果对比、海报草稿。 | PASS | UI-09/UI-12 → UI-27 → UI-26/UI-28/UI-29/UI-33。 | L1/L2 evidence story；不写 Outcome/能力 Fact。 | REVIEW；成果展示与证据事实需分层。 |
| UI-28 | 动态详情、评论、私聊顾问、官方建议、互动草稿。 | PASS | UI-25/26/27 → UI-28 → UI-29/UI-06。 | L1/L2 comment/message draft；不发送。 | HOLD；私聊、评论、敏感建议需 Human Gate。 |
| UI-29 | 我的社区、粉丝/关注/积分、发帖/打卡/挑战、等级权益。 | PASS | UI-25~28 → UI-29 → UI-30/UI-33。 | L1 community asset；不写社交等级/粉丝事实。 | REVIEW；不得成为排名或画像来源。 |
| UI-30 | 年度会员客户总览、服务/积分/邀请奖励、90天入口。 | PASS | UI-07 → UI-30 → UI-31/UI-32/UI-33/UI-34。 | L1 customer/member projection；不续费/发奖。 | PASS；与 UI-07/UI-18 对象域需继续隔离。 |
| UI-31 | 我的服务、90天进度、陪跑角色、周任务、查看方案/打卡。 | PASS | UI-05/UI-06/UI-24 → UI-31 → UI-09/UI-34。 | L1 read；Resume/Pause 只能受权 Named Action。 | P1；不能由“继续打卡”自动建 Task。 |
| UI-32 | 订单、券、积分、奖励、权益中心。 | PASS | UI-07/UI-13~18/UI-30 → UI-32 → UI-30/UI-34。 | L1 read/L2 review draft；不支付/退款/提现。 | REVIEW/HOLD；Commerce adapter 边界要独立。 |
| UI-33 | 家庭档案、孩子、关注问题、报告/方案/记录/历史时间线。 | PASS | UI-01/02/UI-30/31 → UI-33 → UI-04/05/06/09/24/34；回流较多但合理。 | L1 read/L2 correction draft；AI 不自动更新档案。 | P1；需严格 Person/Consent/Correction 审计。 |
| UI-34 | 咨询、活动、状态、客服、服务过程时间线。 | PASS | UI-06/UI-24/UI-31/32 → UI-34 → UI-30/UI-33；可作为服务记录终点。 | L1 process read/L2 support draft；不写 Outcome。 | PASS with HUMAN_GATE；客服/真人服务外部 effect HOLD。 |

## 4. 功能点质量问题清单

### 4.1 结构完整但仍需深挖的页面

A 层 34 行字段没有发现空字段、过短摘要或只写标题的页面。因此，**结构层面不存在缺行问题**。但是“摘要足以排期”不等于“已经具备实现契约”。UI-06、UI-10、UI-15、UI-17、UI-18、UI-20、UI-21、UI-25~UI-29 和 UI-32~UI-34 仍需在开发前把 projection DTO、状态枚举、事件、审计字段和负向权限测试进一步落细。

### 4.2 重复功能与共享子系统归并

复核确认以下能力不应按页面重复建设：Assessment 由 UI-03/UI-08 共用；Report Explanation 由 UI-04/UI-12/UI-27 共用；Plan/Journey/Task 由 UI-05/UI-09/UI-31 共用；Service Supply/Provider/Booking/ServiceRecord 覆盖 UI-06/UI-19~UI-24/UI-31/UI-34；Community/Post/Evidence 覆盖 UI-25~UI-29；Membership/Entitlement 与 Referral/PartnerAsset 必须分离，即 UI-07、UI-18、UI-30 不能合并为一个“我的”对象。

### 4.3 主要职责冲突

| issue_id | 受影响页面 | 风险 | 复核结论 |
|---|---|---|---|
| R-001 | UI-01/UI-02 | 两个首页版本可能被误合为一个 route 或误拆为两个业务域。 | 保留 `NEEDS_CONFIRMATION`；先做共享 Home Projection，不做版本特有写入。 |
| R-002 | UI-03/UI-04 | 测评内部 step 与 global screen 粒度冲突。 | 保留 `CONFLICT`；Assessment session 与 Report snapshot 分开。 |
| R-003 | UI-04/UI-05 | 报告建议可能直接变成计划事实。 | 必须经过 plan_draft、FamilyDecision、Named Action。 |
| R-004 | UI-05/UI-09/UI-31 | 计划任务三态可能被 UI 点击或 mock 状态直接推进。 | Task runtime 只能由受控 action 更新；计划草稿不自动建任务。 |
| R-005 | UI-06/UI-25~29 | 陪跑社群服务与公开社区被名称相似混淆。 | UI-06 使用 ServiceCase/ServiceRecord；UI-25~29 使用 Community/Post。 |
| R-006 | UI-07/UI-18/UI-30 | 三种“我的”被错误合并，会员、合伙人、客户后台资产泄漏。 | Membership、PartnerReferralAsset、CustomerOverview 分域。 |
| R-007 | UI-11/UI-12 | 排名/总分或成果海报被包装成效果事实。 | UI-11 默认 HOLD；UI-12 仅 evidence story/export draft。 |
| R-008 | UI-19/UI-20/UI-21 | 供给列表、详情、预约被误做成一键真人服务。 | Provider/Offering/Slot 只读；Booking draft；外部 effect HOLD。 |
| R-009 | UI-26/UI-28 | 草稿发布、评论、私聊可能被误触发真实外发。 | 所有内容和消息先 draft/no-op，经过 Visibility/Consent/Human Gate。 |
| R-010 | UI-32/UI-34 | 订单/资产和服务记录被混为支付履约或服务效果。 | UI-32 只读资产；UI-34 只读过程事实；两者都不自动执行外部 effect。 |

## 5. Page Lineage 复核

### 5.1 按业务链路归组

| 链路 | 页面关系 | 关系结论 | 断点/待补 |
|---|---|---|---|
| 测评 → 报告 → 计划 → 任务 | UI-03/UI-08 → UI-04 → UI-05 → UI-09/UI-31 → UI-06/UI-34 | 主链成立，数据交接为 assessment snapshot、report_id、plan_version、task/service refs。 | UI-02 版本关系、UI-03 粒度冲突；需补 report→plan decision contract。 |
| 服务供给 → 详情 → 预约 → 服务记录 | UI-19 → UI-20 → UI-21 → UI-24/UI-34 | 主链成立，provider/offering/slot → booking draft → service record。 | UI-21 的 Human Gate、Calendar/Notification/Video adapter 尚未进入实现。 |
| 商城 → 裂变 → 权益 | UI-13 → UI-14/UI-15/UI-16/UI-17 → UI-18 → UI-30/UI-32 | 业务链成立，目录、SKU、referral、points、entitlement 分域。 | 真实交易、库存、支付、奖励和提现全部 HOLD。 |
| 社区 → 成果 → 回流 | UI-25 → UI-26/UI-27/UI-28 → UI-29 → UI-12/UI-33 | 业务关联成立；内容、证据故事和家庭档案回流可解释。 | 发布、互动、儿童资料、公开分享需 Visibility/Consent/Human Gate。 |
| 后台 → 服务记录 | UI-30 → UI-31/UI-32/UI-33 → UI-34 | 客户后台聚合关系成立；UI-31 与 UI-34 形成服务过程回流。 | UI-32 订单资产不得写服务效果；UI-34 不得写 Outcome。 |

### 5.2 断点、孤立和非对称关系

| lineage_issue | 发现 | 严重性 | 建议 |
|---|---|---|---|
| L-001 | Page Lineage Graph 直接图中没有显式画出 UI-13→UI-18 的完整路径，也没有画出 UI-07/UI-30/UI-32 的全部回流边；表格中已有这些关系。 | 中 | 下一版图形与表格对齐，避免把“未画出”误解为“无血缘”。 |
| L-002 | Graph 画出 UI-01→UI-02，但 UI-02 仍是 `NEEDS_CONFIRMATION`。 | 中 | 标注为候选版本边，不作为已裁定业务跳转。 |
| L-003 | UI-06 同时指向 UI-25/29 和 UI-31/34，容易被误读为 UI-06 就是社区或服务记录。 | 中 | 增加 `business_linkage` 与 `visual_reuse` 两个分离字段。 |
| L-004 | UI-11 作为 UI-09 后续页存在，但它不是正常可执行的排名终点，而是 Policy Guard/HOLD。 | 高 | 图中增加虚线/HOLD 标识，禁止把它当作成长任务闭环的正常写入节点。 |
| L-005 | UI-21/UI-23 的 downstream UI-24 逻辑合理，但实际注册/预约只能停在 draft/stub。 | 高 | 明确“页面出口存在”不等于 external effect 已实现。 |
| L-006 | UI-34 被写为服务记录链终点，但后续真人服务或客服可能存在未来外部出口。 | 低 | 当前保留终点；未来若开放 Adapter，新增 Human Gate，不回写历史过程事实。 |

复核未发现真正孤立页面：UI-01 是入口，UI-02 是待裁定的同构入口，UI-11 是有意的安全阻断节点，其余页面至少有一个上游或下游。未发现无法解释的循环；UI-05/UI-09/UI-31 和 UI-25~UI-29 的回流属于状态刷新、记录回看或业务回流，不是无条件自动循环。

## 6. 工程边界复核

| 规则 | 复核结果 | 受影响页面 |
|---|---|---|
| L1/L2 不伪装成 L3/L4 | 总体通过；UI-05、UI-21、UI-31 的候选动作已注明未来或 stub。 | UI-05/UI-21/UI-31 |
| 核心状态必须 Named Action | 通过；Task、Plan、Booking、Profile correction、发布和兑换均以候选 Named Action 表达。 | UI-05/UI-09/UI-21/UI-26/UI-31/UI-33 |
| 模型必须经 Model Gateway | 通过；报告解释、儿童助手、故事生成均标 Gateway 或受控 Skill；未发现允许 Agent 直接写 ontology 的页面。 | UI-04/UI-05/UI-10/UI-12/UI-27 |
| AI 不直接写核心 ontology | 通过；报告、建议、草稿、解释与 profile/Need/Outcome 分开。 | UI-04/UI-05/UI-10/UI-27/UI-33 |
| Ontology 经受控 Adapter/Action 边界 | 基本通过；需在实现阶段将 FamilyDecision、Task、Booking、Profile correction 的 adapter/action contract 固化。 | UI-05/UI-09/UI-21/UI-31/UI-33 |
| 高风险场景 Human Gate | 已登记但尚未形成每页独立测试矩阵。 | UI-04/UI-10/UI-11/UI-12/UI-21/UI-26/UI-28 |
| Consent/tenant/family fail-closed | UI-01、UI-03、UI-08、UI-19、UI-20、UI-21、UI-33 已明确；其余页面需在实现合同中复用共享 Gate。 | 全局共享 |
| Ranking/Total Score 禁止 | UI-04、UI-11 已明确；UI-12/UI-27 的成果对比仍需禁止效果化表达。 | UI-04/UI-11/UI-12/UI-27 |

需要显式标记的页面集合如下：

| 标记 | 页面 |
|---|---|
| `HUMAN_GATE` | UI-04、UI-10、UI-12、UI-21、UI-23、UI-26、UI-28、UI-33、UI-34 |
| `CONSENT_GATE` | UI-03、UI-04、UI-05、UI-08、UI-09、UI-10、UI-19、UI-20、UI-21、UI-22、UI-23、UI-26、UI-28、UI-33、UI-34 |
| `EXTERNAL_EFFECT_HOLD` | UI-06、UI-07、UI-10、UI-12、UI-14、UI-15、UI-16、UI-17、UI-18、UI-20、UI-21、UI-22、UI-23、UI-24、UI-25、UI-26、UI-28、UI-29、UI-30、UI-31、UI-32、UI-34 |
| `NEEDS_CONFIRMATION` | UI-02 |
| `CONFLICT` | UI-03 |
| `RANKING_OR_TOTAL_SCORE_HOLD` | UI-04、UI-11、UI-12、UI-27 |

## 7. 开发优先级建议

| 优先级 | 纵切 | 页面 | 进入条件 | 动态上限 | 暂不做 |
|---|---|---|---|---|---|
| P0-1 | Service Supply read projection | UI-19 | 复用独立 staged candidate；确认 contract/test 入口 | L1 | UI-20 详情、预约、通知、真人联系 |
| P0-2 | Plan draft + Family Decision boundary | UI-04/UI-05 | UI-03/UI-04 source conflict 不阻塞 synthetic plan draft，但必须保留证据版本 | L1/L2 | 自动 Journey/Task/Intervention、外部服务 |
| P0-3 | Task projection + controlled completion | UI-09/UI-31 | 复用已有 action contract、幂等、pause/revoke、family scope | L1/L3 | 排名、提醒、效果判断 |
| P1-1 | Provider detail read projection | UI-20 | UI-19 供给 DTO 可追溯资格/时段来源 | L1/L2 | 评分排序、真实预约 |
| P1-2 | Family/Person private projection | UI-30/UI-33 | scope/consent/correction contract | L1/L2 | AI 自动画像、敏感资料推断 |
| P1-3 | Private Community feed + post draft | UI-25/UI-26 | VisibilityPolicy、MediaAsset、Moderation、no-op publish | L1/L2 | 公开发布、评论、私聊、通知 |
| HOLD | Ranking/Payment/External Effects | UI-11/UI-12/UI-14~18/UI-21~23/UI-28 | 需要额外 policy、adapter、human review 和生产证据 | L0/L1 或 draft | 一切真实排名、支付、报名、预约、分享、提现、通知 |

## 8. 必须人工确认项

| confirmation_id | 需要确认的内容 | 影响 |
|---|---|---|
| HC-001 | UI-01 与 UI-02 是版本替换、并存入口还是不同用户态。 | Home route、PPT L1 映射和测试基线。 |
| HC-002 | UI-03 是 global screen 还是 UI-02/08 测评流程内部 step。 | Assessment route、session state 和 Page Lineage ID。 |
| HC-003 | UI-04 的 72、同龄平均、问题标签和敏感建议在产品文案上是否全部改成解释/不确定性表达。 | Report DTO、Evidence Grade、Human Gate。 |
| HC-004 | UI-11 是否在 DEV/TEST 仅保留 Guard/禁用态。 | 防止 Ranking/Total Score 越界。 |
| HC-005 | UI-06 的陪跑服务、社群、直播和顾问答疑分别使用哪些 ServiceCase、Community、Activity、Adapter 对象。 | 防止 UI-06 与 UI-25~29 重复建设。 |
| HC-006 | UI-21/UI-23 是否只交付 booking/registration draft，还是允许受控 DEV stub。 | Named Action、Adapter 和集成测试范围。 |
| HC-007 | UI-26/UI-28 的发布、评论、私聊是否全部在当前阶段保持 no-op。 | Consent、Moderation、Human Gate 和外发风险。 |

## 9. 总结 Verdict

**结构完整性通过。** 34 个 UI 均已进入 A 层，字段齐全，功能摘要不是空标题，UI-01~UI-34 没有缺失或重复。

**功能拆解质量为条件通过。** 共享子系统归并规则已经建立，关键页面的状态写入上限、Named Action 和 Gate/HOLD 边界基本一致；但 UI-06、UI-10、UI-15、UI-17、UI-18、UI-20、UI-21、UI-25~UI-29、UI-32~UI-34 仍需要在具体纵切中补 DTO、状态机、事件、审计和负向测试。

**血缘关系为条件通过。** 测评/报告/计划/任务、服务供给/预约、商城/裂变/权益、社区/成果、后台/服务记录五条链已经建立；但 Graph 与表格存在少量表现层不对称，尤其是 UI-13~18、UI-07/UI-30/UI-32 的回流边，以及 UI-11 的 HOLD 属性，需要在下一版图中显式标注。

**开发可进入性为条件通过。** 推荐先进入 UI-19、UI-04→UI-05、UI-09→UI-31 三类 L1/L2/L3 受控纵切；UI-11、支付、预约、发布、评论、私聊、分享、通知、视频和真人服务继续 HOLD。任何下一步实现都必须保持 `Recommendation → FamilyDecision → Named Action → Adapter/Human Gate` 的顺序。

## References

[1]: `FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md` — 34 UI 全量功能与血缘台账。
[2]: `FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md` — global UI、单图和 PPT crosswalk。
[3]: `UI01_FULL_EXPOSURE_SUBSYSTEM_DECOMPOSITION_001.md` — UI-01 方法、首页暴露点和既有血缘。
[4]: `UI04_UI10_PPT06_PPT08_VISUAL_GAP_ANALYSIS_001.md` — UI-04~UI-10 PPT6/PPT8 视觉与业务边界。
[5]: `F06_F09_UI_NOTES.md` — F06~F09 API、Named Action 和状态边界记录。


---

## 10. 逐页视觉暴露点复核（纠偏版）

> **纠偏说明。** 现有 A 层表证明了 34 个 global UI 均有一行台账，但不等于已经完成逐页图像级功能点核对。本节改用“页面可见暴露点 → 旧台账遗漏 → 血缘影响 → 工程边界影响 → 下一步动作”的格式，补足逐页核对层。
>
> **UI-01~UI-12 图片证据缺口。** 当前 repo 中可对应 UI-01~UI-12 批次的去重图片名只有 **11 个**：`home-screen-ui-crop`、`family-assessment-step2-reference`、`ai-growth-diagnosis-reference`、`growth-plan-90day-reference`、`delivery-community-reference`、`mine-member-reference`、`family-assessment-entry-reference`、`daily-growth-task-reference`、`growth-child-assistant-reference`、`growth-ranking-reference`、`growth-poster-reference`。其中 `family-assessment-entry-reference` 在批次输入中重复；UI-01 用户原图是 overlay，不在 repo 图片目录中。因此 UI-01~UI-12 的 image-to-UI 映射不能仅由文件名自动裁定，必须人工确认。本节对 UI-01~UI-12 的 `image_mapping_status` 统一保守标记为 `NEEDS_CONFIRMATION`；这不否认已有 PPT/单图视觉线索，只表示映射链尚未形成可复核的 repo 文件闭包。

| UI ID | 可见暴露点（入口/按钮/卡片/筛选/状态/空态/风险提示） | 旧台账遗漏点 | 血缘影响 | 工程边界影响 | 下一步动作 | image_mapping_status |
|---|---|---|---|---|---|---|
| UI-01 | 顶部家庭上下文与导航；免费家庭测评横幅；AI诊断、21天挑战营、90天成长计划、成长案例、专家直播、家庭顾问六入口；今日成长任务；推荐内容/服务卡；底部 Home/社群/商城/我的；首页空态、权限态、consent 缺失态。 | 旧台账已列入口，但未把每个入口的卡片标题、CTA、内容推荐卡和底部导航逐一绑定到可复核 image asset；overlay 不在 repo。 | 首页是多链路入口，分别导向 UI-03/04/05/06/08/09/12/13/19/25/30；UI-01/UI-02 版本关系未闭合。 | 只能做 FamilyHomeProjection 与 NO_ACTION；不得由首页推荐直接创建 Plan、Task、Booking 或商业事实。 | 将用户 UI-01 overlay 复制/登记为受控 source anchor，人工确认 UI-01~UI-12 image-to-UI 映射后再固定 route/test ID。 | NEEDS_CONFIRMATION |
| UI-02 | 首页清晰母版；蓝色测评横幅；六入口/功能卡；今日任务卡；推荐内容卡；底部导航；可能的版本或用户态入口。 | 旧台账将其作为同构首页，但未拆“版本选择/家庭上下文/推荐卡点击/底部 tab”各自的功能点。 | 可能是 UI-01 版本替换、并存态或下游返回页；若误判会影响所有入口 source_ui。 | 只允许 L1 首页投影；`SelectHomeVariant` 不能变成业务写入。 | 人工确认 UI-01/UI-02 是否同一 screen、不同版本或不同角色态；补单页 source anchor。 | NEEDS_CONFIRMATION |
| UI-03 | 测评标题与第 2/5 步进度；五个关注方向单选项；补充信息/文本输入；下一步按钮；步骤阻断/缺失输入提示。 | 旧台账列题目与选项，但未拆输入校验、返回上一步、草稿恢复、必填/敏感输入提示和 step completion。 | UI-01/02、UI-08 → AssessmentSession → UI-04；必须传递 question_set_version、answer draft、family/person scope。 | 只能写 Assessment draft/session answer；不得写 Need、Diagnosis、Family Fact；缺 consent 必须 fail-closed。 | 补 Assessment step 状态机：ENTRY、DRAFT、VALIDATION_BLOCKED、NEXT、ABANDONED，并人工裁定 global UI-03 粒度。 | NEEDS_CONFIRMATION |
| UI-04 | 成员/孩子卡；雷达图与 72/同龄平均可视区域；问题标签；建议列表；生成方案 CTA；报告来源/不确定性/风险提示；返回或继续。 | 旧台账未逐项拆雷达图图例、分数解释、同龄比较说明、标签解释、建议展开和生成方案入口。 | UI-03/UI-08 → ReportSnapshot → UI-05；建议与计划必须通过 plan_draft，不得直写 Journey。 | L1/L2 explanation/recommendation；总分、同龄平均、排名、敏感建议必须 Human Gate/HOLD。 | 建立 Report Explanation exposure register，把每个视觉指标绑定 evidence_ref、uncertainty、display_policy。 | NEEDS_CONFIRMATION |
| UI-05 | 90天标题；3/12/36/90阶段节点；周计划/任务卡；任务状态标签；开始执行计划 CTA；调整/返回；暂停/退出；计划版本或来源提示。 | 旧台账已有 plan_draft，但未逐项登记阶段节点点击、周任务展开、状态筛选、调整入口、暂停/恢复和版本差异。 | UI-04 → plan_draft → FamilyDecision → 后续 UI-06/UI-09/UI-31；UI-05 不是 Journey/Task 的自动写入口。 | L1/L2 上限；开始执行只能形成 Decision candidate，之后才允许受控 Named Action；外部 effect HOLD。 | 补齐 UI-05 状态机和动作边界测试，覆盖查看、调整、接受、拒绝、暂停、撤回和版本冲突。 | NEEDS_CONFIRMATION |
| UI-06 | 家庭顾问/班主任/AI提醒/专家答疑角色卡；78%进度或状态；成长打卡；家长交流；直播入口；服务/社群入口；服务完成/暂停状态。 | 旧台账把服务、社群、直播放在摘要中，未逐一区分 ServiceCase、Community、Activity、AI reminder、ServiceRecord。 | UI-05 → Delivery；可回流 UI-24/UI-31/UI-34；与 UI-25~29 是业务关联，不是视觉复用。 | L1 service projection/L2 intent；真人、通知、直播和公开社群均 Adapter/Human Gate/HOLD。 | 拆成 Service Delivery、Community Service、Live Activity、Service Record 四个共享能力，不按 UI-06 复制建设。 | NEEDS_CONFIRMATION |
| UI-07 | 年度会员卡；积分/等级/亲子币指标；报告、计划、订单、邀请入口；会员权益卡；底部/返回导航；权益不可用状态。 | 旧台账未逐一拆权益详情、报告/计划回流入口、积分指标来源、会员到期/缺权益状态。 | UI-01/UI-06 → Membership → UI-30/UI-32；不能把 UI-18 合伙人收益混入会员。 | L1 Entitlement projection；不购买、不续费、不自动发放积分/权益。 | 建立 Membership/Entitlement exposure 表，明确来源、有效期、可见范围和过期态。 | NEEDS_CONFIRMATION |
| UI-08 | 家庭成长体检入口；第1/5步；五维评估卡；开始测评 CTA；入口说明/适用范围；可能的返回/阻断态。 | 旧台账未拆适用范围、入口资格、测评版本、家庭/成员选择和商业漏斗只读关联。 | UI-08 → UI-03/UI-04；商业链 UI-13 只能是 semantic upstream，不接收答案或报告事实。 | L1 readiness/L2 draft；不写 referral/order/score；consent 缺失 fail-closed。 | 补入口资格 projection、assessment version、person selection 和 NO_ACTION 分支。 | NEEDS_CONFIRMATION |
| UI-09 | 今日任务标题；AI管家/提醒卡；三项任务；78%或连续打卡指标；任务状态；完成今日任务按钮；部分完成/未完成/反思入口。 | 旧台账未拆任务展开、完成确认、部分完成、未完成、反思、暂停、连续打卡指标的事实来源。 | UI-05/UI-04/UI-01 → TaskInstance → UI-10/UI-12/UI-31/UI-34；UI-09 状态需回流而非只改变前端。 | L1 projection；L3 仅 `CompleteTask`/`RecordReflection` 等 Named Action；完成不等于 Outcome，不触发通知。 | 复用已有受控 action/page-object 规则，补 row version、幂等、actor、pause/revoke 和负向测试。 | NEEDS_CONFIRMATION |
| UI-10 | 儿童助手角色/欢迎区；成长能量或指标；训练、阅读、情绪、目标卡片；开始挑战 CTA；家长可见性、适龄提示、输入限制。 | 旧台账未拆年龄策略、儿童/家长双视角、能量指标来源、情绪入口、家长接管和退出态。 | UI-09 → Child Assistant → UI-09/UI-27；儿童输入不应直接写 Profile/Need/Outcome。 | L1/L2 child-safe projection/draft；所有自由文本、图像、语音、情绪/风险内容经 Model Gateway/Consent/Human Gate。 | 先做适龄 synthetic projection 和安全阻断态；定义 ParentView/ChildView 不同权限。 | NEEDS_CONFIRMATION |
| UI-11 | 排行榜标题；周/月切换；同城/同班级筛选；奖台；积分/名次卡；可能的空态、不可用提示和分享入口。 | 旧台账已标 HOLD，但未拆周期切换、范围筛选、名次卡、空态、分享 CTA 和视觉数字来源。 | UI-09 的任务/积分业务关联可能被误画成排名下游；UI-11 应是 Guard/HOLD 节点，不是正常运行态。 | 默认 L0/L1 Guard；禁止 Family Total Score、跨家庭 ranking、同龄比较和儿童竞争激励。 | 只实现安全阻断/替代的自我历史投影；在产品裁定前不实现排名 API。 | NEEDS_CONFIRMATION |
| UI-12 | 成果海报标题；成长前后/阶段对比；勋章/二维码；生成海报；分享至微信或外部渠道；导出/取消。 | 旧台账未拆素材选择、生成失败、二维码、分享确认、公开范围和效果文案校验。 | UI-09/UI-27 → EvidenceStoryDraft → UI-25/UI-29/UI-07；不得把海报导出变成 Outcome Fact。 | L1/L2 story/export draft；儿童图像、二维码、外发分享和效果前后对比全部 Human Gate/L4 HOLD。 | 补 `CreateEvidenceStoryDraft` 与 `RequestShareReview` 的输入、policy result、no-op adapter 和失败态。 | NEEDS_CONFIRMATION |
| UI-13 | 商城首页邀请礼盒横幅；拼团/好物/积分/会员/抢购/邀请分类卡；商品列表；推荐/筛选入口；底部商城导航。 | 旧台账只写目录和入口分域，未拆分类切换、商品卡 CTA、库存/价格展示状态、推荐语义。 | UI-01/UI-07 → Catalog → UI-14~18；Assessment/Report 只能作为业务上游，不写交易事实。 | L1 catalog/intent；商品可见不等于可售；Payment/Referral Adapter HOLD。 | 建立 Catalog exposure 与 product eligibility projection，明确空目录、下架和无资格态。 | CONFIRMED |
| UI-14 | 商品详情图/标题；价格或多价格；权益说明；购买 CTA；发起拼团 CTA；详情展开、库存/活动状态。 | 旧台账未拆价格来源、权益明细、CTA 分流、商品下架、购买前 consent 和订单草稿状态。 | UI-13 → Product/SKU → UI-15/UI-16/UI-07；不得把 SKU 转为 Journey/ServiceRecord。 | L1/L2 order/group draft；不扣款、不锁库存、不发权益。 | 补 ProductDetail state machine 和 PurchaseDraft/GroupBuyDraft 的 no-op contract。 | CONFIRMED |
| UI-15 | 邀请有礼标题；3家庭/1/3进度；奖励卡；立即邀请；海报/微信分享；邀请记录和未完成状态。 | 旧台账未拆邀请对象选择、进度来源、奖励条件、分享确认、失败/撤回和防重复邀请。 | UI-13/14 → ReferralDraft → UI-18/UI-12；不得接收报告分数或儿童数据作奖励依据。 | L1/L2 referral draft；Share/Notification/Reward Adapter HOLD；不发奖、不推导佣金。 | 补 Referral/Reward policy、幂等邀请 draft、share no-op 和奖励待审核态。 | CONFIRMED |
| UI-16 | 拼团标题；商品卡；团购价；人数/倒计时；去拼团 CTA；团状态、售罄/已结束/不可参与状态。 | 旧台账未拆人数/倒计时来源、团状态机、资格判断、已结束/售罄和支付前确认。 | UI-13/14 → GroupBuyProjection → UI-18/UI-32；不能把团状态写成真实支付或权益。 | L1 read/L2 intent；库存、成团、支付、通知和履约 L4 HOLD。 | 只做 synthetic/read projection 与状态说明，不实现真实 group-buy API。 | CONFIRMED |
| UI-17 | 积分商城标题；积分余额；任务中心；兑换商品；兑换 CTA；积分不足/兑换成功/失败/过期状态。 | 旧台账未拆积分来源、账本明细、兑换资格、积分不足和兑换确认。 | UI-09/UI-13 → PointsLedger → UI-18/UI-32；任务状态不能未经 Policy 自动扣积分。 | L1 controlled ledger/L2 redemption draft；不扣真实积分、不自动发奖。 | 定义 PointsLedger read schema、RewardPolicy、RedemptionDraft 和 no-op fulfillment。 | CONFIRMED |
| UI-18 | 合伙人身份卡；邀请/成交/积分/奖励指标；订单/奖励/会员权益入口；收益状态；可能的提现/结算入口。 | 旧台账未拆指标事实来源、partner role、奖励/订单分域、提现入口和无资格态。 | UI-15~17 → PartnerAsset → UI-32/UI-07；不能与会员中心合并。 | L1 partner projection；佣金、提现、结算、税务和外发全 HOLD。 | 补 PartnerAsset read model、RewardLedger source refs 和 Payout blocked state。 | CONFIRMED |
| UI-19 | 名师专区标题/横幅；搜索框；热门领域筛选；在线状态；教师/服务者卡；可预约摘要；立即咨询 CTA；空结果/无授权态。 | 旧台账已覆盖列表筛选，但仍需逐项登记 provider_kind、offering status、admission、availability 摘要和筛选状态。 | UI-01/UI-06/UI-13 → Supply → UI-20/UI-21/UI-22/23；UI-19 是只读供给入口。 | L1 read-only；只读查询可有 contract，不创建 Booking；禁止推荐排序/优劣判断。 | 以现有 UI-19 staged candidate 作为 Service Supply 样板，补空结果、consent 缺失和 tenant 隔离证据。 | CONFIRMED |
| UI-20 | 名师详情标题/头像；资质/标签/评分区；可预约时间；咨询/预约 CTA；详情展开；无时段/资格缺失态。 | 旧台账未逐项拆资质来源、评分来源、标签证据、时段刷新、无时段和 CTA 分流。 | UI-19 → ProviderDetail → UI-21/UI-24；provider_id/offering_id/slot_summary 必须版本化交接。 | L1 detail/L2 booking draft；不锁时段、不排序、不联系真人。 | 建立 ProviderDetail DTO、Evidence/Qualification source refs 和 booking draft contract。 | CONFIRMED |
| UI-21 | 咨询方式选择；日期/时段选择；问题描述；隐私/Consent；确认预约按钮；预约确认/失败/不可用状态。 | 旧台账未拆方式选择、时段占用竞态、问题描述敏感性、确认前 consent、失败/撤回。 | UI-20 → BookingDraft → UI-24/UI-31/UI-34；不是点击即预约。 | L1/L2 draft；DEV stub 也必须标 external_effect=false；真实占座/通知/视频/支付 HOLD。 | 补 BookingDraft 状态机与 Human Gate、幂等、slot recheck、no-op receipt。 | CONFIRMED |
| UI-22 | 线下沙龙标题；城市筛选；搜索/领域筛选；活动卡；时间/地点/余量；活动入口。 | 旧台账未拆城市与领域筛选组合、余量来源、活动资格、空结果和活动卡 CTA。 | UI-06/UI-19 → ActivityCatalog → UI-23/UI-24；与 UI-21 是不同服务路径。 | L1 activity read/L2 registration draft；不锁名额、不报名、不通知。 | 补 ActivityFilter DTO、CapacityProjection、Eligibility explanation 和空态。 | CONFIRMED |
| UI-23 | 活动详情；亮点/流程；适合人群；地点/时间；报名 CTA；报名失败/截止状态。 | 旧台账未拆适合人群解释、报名条件、截止/满员、返回和报名草稿确认。 | UI-22 → ActivityDetail → UI-24；“适合人群”只能内容说明，不能自动诊断。 | L1/L2 registration draft；真实报名/支付/通知/日历 Adapter HOLD。 | 补 RegistrationDraft、eligibility source、满员/截止状态和 Human Gate。 | CONFIRMED |
| UI-24 | 我的咨询/活动列表；状态标签；进入咨询室；会员卡；取消/回看/返回入口；空态。 | 旧台账未拆 booking/activity 两类状态、进入咨询室边界、取消/撤回、无记录空态。 | UI-21/UI-23/UI-06 → ServiceMine → UI-31/UI-34/UI-07；状态只能来自过程事实。 | L1 service/booking projection；取消/撤回需 Named Action；进入真人空间/通知 HOLD。 | 定义 BookingStatus、ActivityRegistrationStatus、ServiceCase projection 和安全空态。 | CONFIRMED |
| UI-25 | 社区标题；分类/筛选；分享横幅；动态 feed；赞/评/收藏；发帖/打卡入口；登录/权限/空态。 | 旧台账未拆分类筛选、feed 卡片、赞评收藏边界、登录/权限态和公开范围。 | UI-06/UI-12 → CommunityFeed → UI-26/27/28/29；不得把陪跑社群服务视为公开社区。 | L1 private read；互动与公开发布需 draft/Moderation/Consent/Human Gate。 | 补 CommunityFeed DTO、VisibilityPolicy、Moderation state 和跨家庭隔离测试。 | CONFIRMED |
| UI-26 | 发布动态标题；打卡/成果/求助/经验类型；图文上传；话题；同步社群开关；发布按钮；媒体校验/失败/权限态。 | 旧台账未拆 post_type、媒体输入、话题、可见范围、同步社群、发布失败和草稿恢复。 | UI-25/UI-27 → PostDraft → UI-28/UI-29；发布后才可能进入社区事实，当前必须 no-op。 | L2 draft only；媒体/儿童资料/公开发布/通知全部 Human Gate/HOLD。 | 补 PostDraft schema、MediaAsset scan、VisibilityPolicy 和 publish no-op adapter。 | CONFIRMED |
| UI-27 | 成长成果标题；报告/勋章；成果对比；生成海报；成果卡；回到社区/档案入口。 | 旧台账未拆勋章来源、对比维度、报告链接、海报 CTA 和成果缺失/未验证状态。 | UI-09/UI-12 → EvidenceStory → UI-26/UI-28/UI-29/UI-33；不直接生成 Outcome。 | L1/L2 evidence story；前后对比、勋章和分享不能写效果 Fact。 | 补 EvidenceStory source refs、OutcomeCandidate 与 policy wording test。 | CONFIRMED |
| UI-28 | 动态详情；图片/媒体；评论列表；评论输入；私聊顾问；官方建议；点赞/返回/空态。 | 旧台账未拆评论 draft、私聊 draft、官方内容来源、敏感建议、媒体权限和空评论态。 | UI-25/26/27 → Detail → UI-29/UI-06；私聊不是 Service Booking。 | L1/L2 comment/message draft；不发送、不通知、不把官方建议当诊断。 | 补 CommentDraft/AdvisorContactDraft、Moderation policy、Human Gate 和消息 no-op。 | CONFIRMED |
| UI-29 | 我的社区；粉丝/关注/积分；发帖/打卡/挑战入口；等级/权益；个人内容列表；空态。 | 旧台账未拆社区资产来源、关注/粉丝投影、等级规则、个人内容筛选和无资产态。 | UI-25~28 → MyCommunity → UI-30/UI-33；不进入成长排名链。 | L1 community asset；不写真实社交等级/粉丝/积分资产，不通知。 | 定义 CommunityAsset projection、source refs 和等级/排名隔离测试。 | CONFIRMED |
| UI-30 | 年度会员标题/权益卡；服务/积分/等级/邀请奖励快捷入口；90天服务进度；总览指标；空/过期态。 | 旧台账未拆年度权益有效期、快捷入口分流、90天进度来源、过期/无会员态。 | UI-07 → CustomerOverview → UI-31/32/33/34；与 UI-18/UI-07 分域。 | L1 customer/member projection；不续费、不发奖、不支付。 | 补 MembershipEntitlement source、expiry state、快捷入口 route contract。 | CONFIRMED |
| UI-31 | 我的服务标题；90天进度；陪跑角色；周任务；查看方案；继续打卡；暂停/返回/空态。 | 旧台账未拆 plan/service/task 三类卡片、进度来源、继续打卡动作、暂停和版本冲突。 | UI-05/UI-06/UI-24 → MyServices → UI-09/UI-34；是回流 projection，不是新任务入口。 | L1 read；Resume/Pause 只能 FamilyDecision/Named Action；不自动推进任务。 | 补 ServicePlanProjection、PlanVersion、Task summary、Pause/Resume audit contract。 | CONFIRMED |
| UI-32 | 订单/券/积分/奖励标签；订单卡；权益中心；查看详情/申请支持；空态/失效态。 | 旧台账未拆订单与权益分栏、券状态、奖励来源、失效/退款申请和支持入口。 | UI-07/UI-13~18/UI-30 → Assets → UI-30/UI-34；不回写服务效果。 | L1 read/L2 review draft；支付、退款、提现、续费、履约 HOLD。 | 补 Order/Entitlement projection、asset source refs 和 support review no-op。 | CONFIRMED |
| UI-33 | 家庭档案标题；孩子信息；关注问题；报告/方案/记录/历史入口；对象卡；时间线；编辑/更正/权限态。 | 旧台账未拆 Person selector、字段可编辑性、关注问题来源、时间线筛选、报告/方案/记录分流和更正申请。 | UI-01/02/UI-30/31 → FamilyProfile → UI-04/05/06/09/24/34；是共享上下文，不是 AI 写入面。 | L1 read/L2 correction draft；AI 不更新 Profile/Need；儿童资料严格 scope/Consent/Human Gate。 | 补 Family/Person projection、CorrectionDraft、actor/audit、person switch 和敏感字段 policy。 | CONFIRMED |
| UI-34 | 服务记录标题；咨询/活动分类；状态标签；客服支持；记录详情/时间线；空态/撤回态。 | 旧台账未拆 booking/activity/service record 分类、状态过滤、客服意向、详情和无记录态。 | UI-06/UI-24/UI-31/32 → ServiceRecord → UI-30/UI-33；作为过程记录终点，不生成 Outcome。 | L1 process read/L2 support draft；客服、通知、真人进入和效果判断均 Gate/HOLD。 | 补 ServiceRecord DTO、来源事件、状态过滤、SupportDraft 和 no-effect adapter。 | CONFIRMED |

## 11. 纠偏后问题清单与处理结论

| issue_id | 类型 | 受影响 UI | 当前结论 | 下一步 |
|---|---|---|---|---|
| V-001 | 图片映射闭包不足 | UI-01~UI-12 | repo 去重图片名仅 11 个；`family-assessment-entry-reference` 重复；UI-01 overlay 不在 repo。 | 人工确认 UI-01~UI-12 image-to-UI 映射；确认前这些页面的视觉映射状态保持 `NEEDS_CONFIRMATION`。 |
| V-002 | 暴露点不足 | UI-01~UI-12 | 旧台账更多是能力摘要，未逐项登记按钮、筛选、状态、空态、风险提示和输入校验。 | 以本节 34 行表为最低核对清单；后续逐页补 interaction/state evidence。 |
| V-003 | 首页/测评粒度冲突 | UI-01/UI-02/UI-03 | 首页版本与测评内部 step 仍会影响 route 与 source_page_id。 | 人工裁定后再固定 route/contract/test ID。 |
| V-004 | 业务关联与视觉复用混淆 | UI-06/UI-13~18/UI-25~29 | PPT/图片中的语义邻近不能合并 Service、Commerce、Community 对象。 | 保留 shared subsystem 分域；crosswalk 增加 `visual_reuse` 与 `business_linkage`。 |
| V-005 | 推荐/草稿越权 | UI-04/UI-05/UI-09/UI-21/UI-26/UI-31 | 任何 CTA 都可能被误做成真实 Action。 | 所有写入必须落到 Decision/Named Action；外部动作必须 Adapter + Human Gate/no-op。 |
| V-006 | 功能摘要不能替代开发证据 | UI-05/UI-09/UI-19/UI-20/UI-21/UI-25~UI-34 | 34 行已完整，但仍不是逐页 API/DB/状态测试。 | 下一阶段按优先级补 projection DTO、状态机、负向权限和浏览器 evidence。 |

## 12. 纠偏后 Verdict

本轮不再声称“34 页逐页视觉功能核对已完成”。准确结论是：**34 页逐页复核表已经补齐，34 个 UI 每行均列出可见暴露点、旧台账遗漏、血缘影响、工程边界影响和下一步动作；但 UI-01~UI-12 的 image-to-UI 映射仍需人工确认，且 UI-05 之后的页面还需要按本表进入逐页交互/状态证据补齐。**

因此本报告的开发门禁从原来的 `CONDITIONALLY_READY_FOR_NEXT_SLICE` 收紧为：`READY_FOR_EVIDENCE_GATED_SLICING`。允许继续做证据明确、L1/L2 受控的 UI-19/UI-05/UI-09 纵切；不允许因为本表存在就打开 Ranking、支付、预约、发布、分享、通知、视频或真人服务。

**FAMILY_34_UI_FEATURE_REVIEW_READY** `reports/m2/frontend/FAMILY_34_UI_FEATURE_REVIEW_001.md`
