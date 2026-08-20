# Family 34 UI Research Needs Analysis Queue

## 1. Purpose and Hard Gate

本文件把“所有 UI 设计前必须先做 Broad Research + Needs Analysis”固化为 UI-01~UI-34 的逐页前置队列。它是研究准入台账，不是 BA Design、API Contract 或代码开发许可。

每个 UI 必须按以下顺序推进：

```text
Broad Research → Needs Analysis → BA Design → Visual Baseline → Contract Plan → FE/BE Implementation → Consistency Tests → Playwright Screenshot Diff → Fix Loop → Git Commit/Push
```

在当前队列中，任何页面都不得标记为 API Contract ready 或 Code ready。`Allowed Next Stage` 只能表示下一步可以继续研究、补证据或准备 BA Design，不能表示已经获准开发。

研究必须覆盖家庭教育真实场景、家长/孩子/教师/服务者等角色、榜样教育/波波校长及现有素材中的业务假设、34 UI 视觉线索、Family SSOT、数据对象、Named Action、Consent/Human Gate、Model Gateway、前后端一致性、测试和截图对标。

需求分析必须分开记录：

```text
User Need / Business Need / Operational Need / Compliance Need / Data Need / AI Need
Fact / Perspective / Hypothesis / Recommendation / Decision / Action
Read Projection / Controlled Draft / Named Action / External Effect
```

其中 `Recommendation != Decision != Action`。研究结论不能自动成为业务事实；建议不能自动成为决定；决定不能自动成为执行动作。

## 2. Evidence Boundary

`30_素材_materials` 只读。研究时优先使用 `30_素材_materials/_extracted/逐页文本_含页码/` 的逐页文本和页码锚点，不得使用 `all_materials.txt` 作为研究主证据。榜样教育、波波校长和其他自家材料最高按 E1 处理，只能形成假设、实践素材或设计输入，不能自证效果、诊断、资质、因果关系或生产事实。

34 UI baseline、用户提供的单页原图、PPT 局部画面和现有治理/契约文件只能证明各自允许证明的内容。视觉线索不等于已实现能力；业务关联不等于视觉复用；内部报告不互相自证。证据不足必须标记 `NEEDS_RESEARCH_REVIEW`，不得补写为事实。

## 3. Queue Status Vocabulary

| 状态 | 含义 |
|---|---|
| `RESEARCH_NOT_STARTED` | 尚未完成本页的 Broad Research 和 Needs Analysis。 |
| `NEEDS_RESEARCH_REVIEW` | 已有部分材料或视觉线索，但证据、需求分类、对象边界或治理条件未闭合。 |
| `RESEARCH_COMPLETE_PENDING_BA` | 仅表示研究包内部自检完成，仍需人工/架构复核后才能进入 BA Design；不表示 API 或代码许可。 |

本轮默认只使用前两种状态。整个队列的 code-readiness count 为 0，`API_CONTRACT_ALLOWED=NO`。

## 4. UI-01~UI-34 Research and Needs Analysis Queue

| UI ID | Page/Scenario | Broad Research Scope | Needs Analysis Scope（User/Business/Operational/Compliance/Data/AI Need） | Required Source Types | Evidence Boundary | Named Action / Consent / Human Gate Check | Allowed Next Stage | Current Status |
|---|---|---|---|---|---|---|---|---|
| UI-01 | 家庭成长平台首页 | 家庭入口、角色上下文、测评/诊断/挑战/计划/服务入口的真实使用场景。 | User：家庭找到下一步；Business：统一成长入口；Operational：首页投影；Compliance：家庭/儿童 scope；Data：Family/Person/Consent；AI：仅解释与导航。 | UI-01 原图、34 baseline、家庭教育材料、角色访谈、SSOT。 | 原图只证明布局和可见入口；E1 材料只作假设。 | `SelectHomeContext` 仅候选；Consent、儿童数据和高风险 AI 需 Gate。 | 继续研究首页角色与空/权限态，之后才可 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-02 | 清晰母版家庭首页 | UI-01/02 版本、用户态、路由和视觉差异的来源。 | User：理解差异；Business：版本定位；Operational：投影版本；Compliance：避免错页/错家庭；Data：HomeProjection；AI：不新增诊断。 | UI-02 原图、baseline、用户 overlay、PPT crosswalk、路由证据。 | UI-01/UI-02 映射未闭包时不得推断。 | 版本选择不得写事实；scope/Consent 需服务端派生。 | 补人工 image-to-UI mapping，再进入 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-03 | 家庭测评第 2/5 步 | 家庭教育评估场景、量表适用范围、家长/儿童作答和补充信息。 | User：描述关注方向；Business：获得需求线索；Operational：session/draft；Compliance：儿童与敏感问题；Data：Question/Answer/Evidence；AI：只做解释草稿。 | 单页原图、测评/家庭教育研究、题库规格、Consent 规则、PPT。 | 不能把答案写成 Need/Diagnosis Fact；效度未确认即 HOLD。 | `StartAssessment`/`SaveAssessmentDraft` 候选；儿童直接作答与敏感题 Human Gate。 | 完成量表与证据审查后进入 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-04 | AI 成长诊断报告 | 报告解释、证据等级、不确定性和家长理解场景。 | User：理解报告；Business：形成下一步建议；Operational：snapshot/explanation；Compliance：禁止诊断越权；Data：Report/Evidence；AI：Model Gateway 解释。 | UI-04 原图、报告治理、AI policy、测评证据、研究材料。 | 72/同龄平均/标签不能作 Fact、Ranking 或 Total Score。 | `RequestHumanReview` 候选；敏感诊断、高风险建议必须 Human Gate。 | 完成证据/解释边界复核后进入 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-05 | 90 天成长方案 | 家庭陪伴、父母第二成长、关系成长和阶段计划的真实实践研究。 | User：看到可理解的计划草稿；Business：形成可审议方案；Operational：PlanDraft projection；Compliance：Consent/guardian；Data：PlanDraft/Version/Decision；AI：只生成解释/草稿。 | 90 天原图、逐页材料、家庭教育研究、BA/架构 Decision Pack、对象 SSOT。 | 3/12/36/90 只作结构，不作效果承诺；E1 不自证。 | `PROPOSE/CONFIRM_GROWTH_PLAN_DECISION` 仅候选；`PLAN_READ/PLAN_DECISION`、guardian、Human Gate。 | 先完成 9 个 BQ 人工裁决和需求研究，之后才可 BA Design/API 评估。 | NEEDS_RESEARCH_REVIEW |
| UI-06 | 陪跑服务/社群服务 | 家长陪跑、班主任、顾问、专家答疑、社群和直播的服务实践。 | User：获得支持；Business：服务交付；Operational：ServiceProjection；Compliance：真人/未成年人；Data：Provider/Case/Record/Community；AI：提醒经 Gateway。 | UI-06 原图、服务实践材料、Provider/Offering SSOT、社群/直播规格。 | 视觉卡片不证明真人服务已存在；E1 只作假设。 | `RequestServiceDraft` 候选；SERVICE consent、真人联系/直播/通知 Human Gate。 | 先研究服务角色和交付责任，再进入 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-07 | 我的/会员中心 | 会员、权益、报告、计划、订单和邀请资产的家庭使用场景。 | User：查看自己的权益；Business：权益服务；Operational：Entitlement projection；Compliance：购买/儿童数据隔离；Data：Membership/Entitlement/Order；AI：无核心写入。 | UI-07 原图、会员规则、权益主数据、订单治理、用户研究。 | 视觉积分/等级不证明真实资产；E1 不证明商业效果。 | `ViewEntitlement` 只读；支付/升级/奖励需 Consent 与 External Effect HOLD。 | 补权益生命周期研究后进入 BA Design。 | RESEARCH_NOT_STARTED |
| UI-08 | 家庭成长体检第 1/5 步 | 体检入口、家庭五维成长、开始测评前的适用范围。 | User：判断是否参与；Business：评估入口；Operational：assessment readiness；Compliance：Consent；Data：Family/Person/Session；AI：不诊断。 | UI-08 原图、测评规格、家庭教育研究、Consent policy。 | 免费/入口不证明商业漏斗或效果；不得写 score。 | `StartAssessment` 候选；Consent 缺失 fail-closed。 | 补测评目的、适用人群和 session 研究后进入 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-09 | 今日成长任务 | 家庭日常行动、反思、打卡和任务完成的实践场景。 | User：完成今日行动；Business：支持成长流程；Operational：Task projection/action；Compliance：儿童参与和撤回；Data：Task/Reflection；AI：解释/提醒草稿。 | UI-09 原图、Task/Journey SSOT、家庭实践研究、完成状态规则。 | 78%/连续打卡不等于 Outcome；完成不等于成长效果。 | `CompleteTask`/`RecordReflection` 需 Named Action、幂等、Consent；通知 HOLD。 | 先研究任务有效性和 Outcome 边界，再进入 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-10 | 成长小助手 | 儿童适龄交互、训练/阅读/情绪/目标和家长可见性。 | User：儿童安全参与；Business：成长辅助；Operational：child-safe projection；Compliance：未成年人/敏感情绪；Data：Person/Media/Task；AI：Gateway + Human Gate。 | UI-10 原图、儿童保护规则、家庭教育研究、Model Gateway policy。 | 能量/标签不证明能力或情绪事实；多模态材料需授权。 | `StartChildChallenge` 候选；CHILD_DATA、Human Gate、外发/训练 HOLD。 | 先完成未成年人风险和 AI 交互研究。 | NEEDS_RESEARCH_REVIEW |
| UI-11 | 成长排行榜 | 视觉上出现的排名、奖台、积分与家庭成长激励风险。 | User：可能寻求反馈；Business：激励假设；Operational：安全阻断/自我历史；Compliance：禁止儿童竞争与家庭排名；Data：ProgressSnapshot；AI：Guard Skill。 | UI-11 原图、儿童发展研究、治理禁令、激励研究。 | 任何同龄平均、家庭 Total Score、Ranking 均不得当 Fact。 | 默认 `NoAction`/HOLD；Human Gate 评估任何 benchmark。 | 先做风险与替代反馈研究，不进入排名实现。 | NEEDS_RESEARCH_REVIEW |
| UI-12 | 成长成果海报 | 成果叙事、勋章、前后对比、二维码和分享风险。 | User：回顾过程；Business：Evidence story；Operational：story draft/export；Compliance：儿童图像/分享；Data：Evidence/Media；AI：受控生成草稿。 | UI-12 原图、Evidence/Outcome 规则、未成年人隐私、分享治理。 | 勋章/对比不证明教育效果；E1 不自证。 | `CreateEvidenceStoryDraft`/`RequestShareReview`；Share/儿童图像 Human Gate。 | 完成 Outcome/Evidence 与分享研究后进入 BA Design。 | NEEDS_RESEARCH_REVIEW |
| UI-13 | 家庭成长商城首页 | 商品/权益/邀请/拼团与家庭成长需求的关系，避免导购越权。 | User：浏览服务商品；Business：目录展示；Operational：Catalog projection；Compliance：商业化/儿童数据；Data：Product/SKU/Entitlement；AI：不自动营销。 | 商品原图、目录/权益 SSOT、商业流程、家庭需求研究。 | 商品卡不证明可售、库存或效果；内部材料不证明转化。 | `SelectProductIntent` 只读/草稿；支付/Referral Adapter HOLD。 | 先完成商品与成长能力边界研究。 | RESEARCH_NOT_STARTED |
| UI-14 | 商品详情 | 21 天挑战营/商品、价格、权益和购买意向场景。 | User：理解商品；Business：权益说明；Operational：Product/OrderDraft；Compliance：支付/营销；Data：SKU/Price/Entitlement；AI：无核心写入。 | 商品原图、商品/价格/权益规则、Consent、订单契约。 | 价格/权益不可由视觉推断；不承诺成长效果。 | `CreatePurchaseDraft` 仅候选；支付、库存、扣款 Human Gate。 | 先研究商品履约与成长计划分界。 | RESEARCH_NOT_STARTED |
| UI-15 | 邀请有礼 | 家庭邀请、奖励、海报和外发分享的真实流程。 | User：邀请家庭；Business：Referral 假设；Operational：Referral projection/draft；Compliance：外发/儿童数据；Data：Invite/Reward；AI：不生成事实。 | 邀请原图、Referral/Reward 规则、隐私/分享治理。 | 3 家庭/奖励数字不证明真实资格或收益。 | `CreateInvitationDraft`/`RequestRewardReview`；Share/Reward Human Gate。 | 先研究邀请同意、奖励资格和外发 adapter。 | NEEDS_RESEARCH_REVIEW |
| UI-16 | 拼团专区 | 拼团人数、倒计时、价格和成团的商业流程真实性。 | User：了解拼团；Business：团购场景；Operational：Group projection/draft；Compliance：支付/库存；Data：Group/SKU/Inventory；AI：不生成数字。 | 拼团原图、GroupBuy/Inventory/Payment SSOT、消费者保护规则。 | 人数/倒计时/价格不可当作实时事实；E1 不证明成交。 | `CreateGroupIntentDraft`；库存/支付/成团 External Effect HOLD。 | 先研究真实数据来源与 no-op 交互。 | NEEDS_RESEARCH_REVIEW |
| UI-17 | 积分商城 | 任务积分、兑换和成长反馈的家庭影响。 | User：查看可兑换内容；Business：权益激励；Operational：Ledger projection/draft；Compliance：虚拟资产/儿童；Data：Points/Reward；AI：不自动发奖。 | 积分原图、Ledger/Entitlement 规则、任务治理、儿童激励研究。 | 积分显示不等于真实资产；完成任务不自动发放生产奖励。 | `CreateRedemptionDraft`；扣减/发放/履约 Human Gate。 | 先研究积分事实来源与发放策略。 | RESEARCH_NOT_STARTED |
| UI-18 | 成长合伙人我的 | 邀请、成交、积分、奖励、订单和收益显示的业务边界。 | User：查看个人资产；Business：合伙人假设；Operational：asset projection；Compliance：佣金/税务/外发；Data：Partner/Referral/Reward；AI：不推断收益。 | 合伙人原图、Referral/Order/Reward/Settlement 规则、合规材料。 | 视觉成交/佣金不可当 Fact；E1 不证明商业收益。 | `ViewPartnerAsset` 只读；提现/结算/奖励 Human Gate。 | 先研究合伙人身份、账本和结算责任。 | NEEDS_RESEARCH_REVIEW |
| UI-19 | 名师专区/服务供给列表 | 受控教师/服务者供给、筛选、适龄和可预约摘要。 | User：理解服务供给；Business：服务目录；Operational：Provider/Offering projection；Compliance：资质/儿童/Consent；Data：Provider/Slot；AI：不排序/不评价。 | UI-19 原图、Provider/Offering SSOT、教师主体材料、服务供给研究。 | 训练数据 teacher 字段不能替代主体；标签/排序不证明优劣。 | `QueryServiceSupply` 只读；SERVICE consent、联系/预约 Human Gate。 | 先完成教师主体、准入和供给证据研究。 | NEEDS_RESEARCH_REVIEW |
| UI-20 | 名师详情 | 教师资质、标签、评分、可预约时段和咨询入口的可信展示。 | User：判断是否适配；Business：服务详情；Operational：Provider/Offering read；Compliance：资质/儿童/不排名；Data：Qualification/Slot/Evidence；AI：解释不推荐。 | UI-20 原图、Provider/Qualification SSOT、资质证据、服务研究。 | 评分/标签/资质必须可追溯；不做最佳/排名。 | `CreateConsultationDraft`/`CreateBookingDraft`；真人联系/预约 HOLD。 | 先完成资质证据与服务适配研究。 | NEEDS_RESEARCH_REVIEW |
| UI-21 | 在线咨询/预约 | 咨询方式、时段、问题描述、隐私和确认预约流程。 | User：提出服务意向；Business：预约流程；Operational：BookingDraft；Compliance：Consent/未成年人/真人服务；Data：Booking/Slot/Audit；AI：不代替真人判断。 | UI-21 原图、Booking/Calendar/Video 契约、服务研究、Consent。 | 页面时段不证明真实占座；mock receipt 不是真实预约。 | `CreateBookingDraft`；`ConfirmBooking` 只能经 Human Gate/DEV stub。 | 先研究预约主体、取消、通知和外部 effect。 | NEEDS_RESEARCH_REVIEW |
| UI-22 | 线下沙龙列表 | 城市、领域、活动卡、余量和适合人群的活动发现。 | User：发现活动；Business：活动目录；Operational：Activity projection；Compliance：地点/名额/儿童；Data：Activity/Venue/Capacity；AI：不诊断适合人群。 | UI-22 原图、活动/场地/容量规则、用户研究。 | 余量/地点/适合人群必须有来源；不实时承诺。 | `CreateActivityRegistrationDraft`；报名/通知/支付 HOLD。 | 先研究活动责任、资格和报名事实来源。 | RESEARCH_NOT_STARTED |
| UI-23 | 活动详情 | 活动亮点、流程、适合人群和报名信息的理解场景。 | User：判断是否适合；Business：活动说明；Operational：Detail projection；Compliance：资格/儿童；Data：Agenda/Eligibility；AI：仅解释。 | UI-23 原图、活动规则、适龄研究、Consent/报名契约。 | “适合人群”不自动诊断；活动说明不证明效果。 | `CreateActivityRegistrationDraft`；报名/名额/通知 Human Gate。 | 先完成活动适用范围与报名边界研究。 | RESEARCH_NOT_STARTED |
| UI-24 | 我的咨询与活动 | 已有服务/预约/活动的状态回流和进入咨询室入口。 | User：查看过程；Business：服务回流；Operational：Booking/Activity projection；Compliance：真人空间/通知；Data：ServiceCase/Record；AI：不改变状态。 | UI-24 原图、Booking/Activity/ServiceRecord SSOT、服务研究。 | 状态必须来自受控过程事实；按钮不等于进入真人空间。 | `CancelBooking`/`WithdrawServiceIntent` 候选；进入咨询室、通知、客服 HOLD。 | 先研究过程状态、取消和回流关系。 | NEEDS_RESEARCH_REVIEW |
| UI-25 | 家长社区 | 分类、动态、赞评收藏、分享入口和家庭交流场景。 | User：安全交流；Business：社区支持；Operational：Feed projection；Compliance：公开儿童信息/审核；Data：Post/Community/Consent；AI：不自动推荐敏感内容。 | UI-25 原图、社区治理、内容安全、家庭交流研究。 | Feed 不证明内容真实性；点赞/关注不证明影响。 | 默认 `NoAction`；发帖/互动需 Consent、Moderation Human Gate。 | 先研究社区角色、可见范围和审核流程。 | NEEDS_RESEARCH_REVIEW |
| UI-26 | 发布动态 | 打卡、成果、求助、经验、图文附件、话题和社群同步。 | User：表达/求助；Business：内容供给；Operational：PostDraft；Compliance：儿童媒体/敏感内容/公开发布；Data：Post/Media/Evidence；AI：仅安全辅助。 | UI-26 原图、内容安全规则、媒体/社区 SSOT、Consent。 | 草稿不等于公开内容；成果不等于 Outcome Fact。 | `CreatePostDraft`/`RequestPublishReview`；发布/通知/外发 Human Gate。 | 先研究可见范围、审核和撤回。 | NEEDS_RESEARCH_REVIEW |
| UI-27 | 成长成果 | 报告、勋章、成果对比和海报生成的证据叙事。 | User：回顾过程；Business：Evidence story；Operational：Evidence projection/draft；Compliance：效果承诺/儿童图像；Data：Evidence/Badge；AI：生成解释草稿。 | UI-27 原图、Evidence/Outcome 规则、成果研究、视觉基线。 | 勋章/前后对比不证明能力或教育效果；E1 不自证。 | `CreateEvidenceStoryDraft`；分享/图像/Outcome Human Gate。 | 先完成 Evidence/Outcome 语义和证据等级研究。 | NEEDS_RESEARCH_REVIEW |
| UI-28 | 动态详情 | 图片、评论、私聊顾问和官方建议的内容互动。 | User：理解/回应内容；Business：社区服务承接；Operational：Comment/MessageDraft；Compliance：敏感建议/私聊/儿童；Data：Post/Comment/Message；AI：不诊断。 | UI-28 原图、Moderation/Advisor/Message SSOT、社区研究。 | 官方建议不等于诊断；私聊草稿不等于已发送。 | `CreateCommentDraft`/`CreateAdvisorContactDraft`；消息/真人联系 Human Gate。 | 先研究私聊、审核、通知和撤回。 | NEEDS_RESEARCH_REVIEW |
| UI-29 | 我的社区 | 粉丝/关注、积分、发帖/打卡/挑战和等级权益。 | User：管理社区资产；Business：社区参与；Operational：Community projection；Compliance：不排名/不画像；Data：Membership/Follow/Points；AI：不推断社会影响。 | UI-29 原图、社区/积分规则、隐私和儿童研究。 | 粉丝/等级/积分不用于家庭排名或能力画像。 | `ViewCommunityAsset`/`CreatePostDraft`；关注/通知/外发 HOLD。 | 先研究社区资产和可见范围。 | RESEARCH_NOT_STARTED |
| UI-30 | 我的/年度会员服务 | 会员、服务、积分、邀请奖励和 90 天服务总览。 | User：查看服务总览；Business：客户后台；Operational：Customer projection；Compliance：权益/支付/儿童隔离；Data：Membership/Service/Entitlement；AI：仅解释。 | UI-30 原图、会员/服务/权益 SSOT、客户后台研究。 | 同名资产不代表同一对象；视觉进度不证明履约效果。 | `ViewMembershipAsset` 只读；续费/支付/奖励 Human Gate。 | 先研究 UI-07/UI-30 分域和服务总览语义。 | NEEDS_RESEARCH_REVIEW |
| UI-31 | 我的服务 | 90 天进度、陪跑角色、周任务、查看方案和继续打卡。 | User：继续已授权服务；Business：服务回流；Operational：Plan/Task projection；Compliance：不得自动推进任务；Data：ServicePlan/Journey/Task；AI：解释/提醒草稿。 | UI-31 原图、UI-05/06/09 lineage、ServicePlan/Task SSOT。 | “继续打卡”不等于执行 Action；进度不等于 Outcome。 | `ResumeServicePlan`/`PauseServicePlan` 候选；FamilyDecision/Named Action/Consent。 | 先研究计划回流、暂停、撤回和任务事实来源。 | NEEDS_RESEARCH_REVIEW |
| UI-32 | 订单与资产 | 订单、券、积分、奖励和权益中心的客户查询场景。 | User：查询资产；Business：资产服务；Operational：Order/Entitlement projection；Compliance：支付/退款/提现；Data：Order/Ledger/Entitlement；AI：不推断余额。 | UI-32 原图、订单/权益/账本 SSOT、商业流程规则。 | 视觉资产不证明支付或可提现余额。 | `RequestOrderReview`/`RequestEntitlementReview`；支付/退款/提现 External Effect HOLD。 | 先研究订单事实来源、争议和权益发放。 | RESEARCH_NOT_STARTED |
| UI-33 | 家庭档案 | 孩子信息、关注问题、报告/方案/记录/历史和时间线。 | User：管理家庭上下文；Business：家庭档案服务；Operational：private projection/correction draft；Compliance：儿童/敏感数据；Data：Family/Person/Need/Report；AI：不得自动更新 Ontology。 | UI-33 原图、Family/Person/Need SSOT、儿童数据规则、Consent。 | Need/画像必须区分 Fact/Hypothesis；AI 输出不能直写档案。 | `RequestProfileCorrection`/`SelectPersonContext`；Consent、Human Gate、审计。 | 先研究对象来源、修正流程和撤回策略。 | NEEDS_RESEARCH_REVIEW |
| UI-34 | 服务记录 | 咨询、活动、状态和客服支持的过程记录查询。 | User：查看服务过程；Business：服务记录；Operational：ServiceRecord projection/support draft；Compliance：真人服务/效果判断；Data：ServiceRecord/Booking/Audit；AI：仅摘要。 | UI-34 原图、ServiceRecord/Booking/Activity SSOT、客服与审计规则。 | 过程记录不等于 Outcome、效果或满意度事实。 | `RequestServiceSupport`/`WithdrawServiceIntent` 候选；客服/通知/真人服务 Human Gate。 | 先研究过程记录、客服边界和审计字段。 | NEEDS_RESEARCH_REVIEW |

## 5. Cross-UI Shared Research Tracks

研究不能按 34 页重复建设 34 套能力。后续应按共享研究轨道归并：

| Shared Track | 覆盖 UI | 研究重点 |
|---|---|---|
| Family Home / Context | UI-01/02/07/30/33 | Family、Person、成员切换、scope、Consent、首页投影和版本映射。 |
| Assessment / Report Explanation | UI-03/04/08 | 量表、证据、解释、不确定性、Model Gateway、Human Gate 和禁止诊断边界。 |
| Growth Plan / Journey / Task | UI-05/09/10/31 | PlanDraft、FamilyDecision、Named Action、Task projection、儿童安全和 Outcome 边界。 |
| Service Supply / Booking / Record | UI-06/19/20/21/22/23/24/34 | Provider、Offering、Qualification、Slot、Booking、ServiceCase、ServiceRecord 和真人服务 Gate。 |
| Membership / Commerce / Entitlement | UI-07/13/14/15/16/17/18/30/32 | Catalog、Order、Reward、Points、Entitlement、Payment/Share/Referral Adapter。 |
| Community / Evidence Story | UI-12/25/26/27/28/29 | Post、Media、Evidence、Visibility、Moderation、Outcome 叙事和公开分享 Gate。 |
| AI / Multimodal Governance | UI-03/04/05/06/10/12/26/27/28/33/34 | Model Gateway、schema validation、自由文本限制、媒体输入、Human Gate 和审计。 |

## 6. Release Gate Summary

在所有 UI 完成各自 Broad Research + Needs Analysis 前：

```text
API_CONTRACT_ENTRY_COUNT=0
CODE_ENTRY_COUNT=0
API_CONTRACT_ALLOWED=NO
CODE_IMPLEMENTATION_ALLOWED=NO
UI06_SCOPE=RESEARCH_ONLY
UI05_SCOPE=RESEARCH_AND_HUMAN_DECISION_ONLY
```

任何页面若出现以下情况，必须保持 `NEEDS_RESEARCH_REVIEW` 或回退到 `RESEARCH_NOT_STARTED`：visual baseline 不可定位；单图与 global UI 映射不闭包；业务素材只能提供 E1 假设；对象语义冲突；Consent/Human Gate 未定义；Named Action 未注册；Model Gateway/AI 边界未确定；前后端 DTO、fixture、审计和截图验收未形成方案。

## 7. References

[1]: `reports/m2/frontend/FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md`
[2]: `reports/m2/frontend/FAMILY_34_UI_FEATURE_REVIEW_001.md`
[3]: `reports/m2/frontend/UI-05_BLOCKING_QUESTIONS_DECISION_PACK_001.md`
[4]: `reports/m2/frontend/UI-05_HUMAN_DECISION_REQUEST_001.md`
[5]: `reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`
[6]: `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md`
[7]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`

**FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_READY** `reports/m2/frontend/FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md`
