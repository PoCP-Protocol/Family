# Family 34 UI Development Admission Package

> **范围：** 本包只做开发准入判断，不启动 34 UI 全量开发，不修改业务代码，不创建 API/DB/Agent 实现。
>
> **总 verdict：** `NOT_READY_FOR_34_UI_FULL_DEVELOPMENT / READY_FOR_SINGLE_VERTICAL_SLICE`
>
> **核心判断：** 34 页已经形成覆盖台账，但 UI-01~UI-12 的 image-to-UI 映射闭包仍需人工确认，多个页面的视觉暴露点尚未转化为完整状态机和契约。因此不准入 34 页并行开发；只批准 **UI-05 90 天成长方案的单一受控纵切任务草案**进入下一阶段设计/实现准备。

## 1. 准入依据与禁止事项

本包引用 `FAMILY_34_UI_FEATURE_REVIEW_001.md` 的逐页纠偏表。该表已对每页列出可见暴露点、旧台账遗漏、血缘影响、工程边界影响和下一步动作。`READY_FOR_DEV` 只表示该页面具备进入单独 L1/L2 slice 设计的条件，不表示页面已有代码或可以启动外部 effect。

以下能力在所有分组中继续禁止：AI 直接写核心 Ontology；Recommendation 直接变成 Decision 或 Action；页面点击直接创建 Journey/Task/Intervention；无 Consent、Tenant/Family scope 或 Human Gate 时继续执行；排名、家庭 Total Score、支付、真实预约、通知、外发分享、直播、视频、提现和真人联系。

## 2. 34 UI 主要准入分组

| admission_group | UI 数量 | UI IDs | 说明 |
|---|---:|---|---|
| `READY_FOR_DEV` | 11 | UI-05、UI-09、UI-13、UI-19、UI-20、UI-25、UI-29、UI-30、UI-31、UI-33、UI-34 | 仅允许进入独立 L1/L2 设计或受控纵切；首个实际纵切只选 UI-05。 |
| `NEEDS_CONFIRMATION` | 4 | UI-03、UI-06、UI-07、UI-08 | 页面证据、粒度、角色/服务边界或入口资格仍需确认。 |
| `HOLD_HUMAN_GATE` | 5 | UI-11、UI-21、UI-23、UI-26、UI-28 | 涉及儿童、公开内容、真人咨询、报名、评论、私聊或敏感建议。 |
| `HOLD_EXTERNAL_EFFECT` | 9 | UI-12、UI-14、UI-15、UI-16、UI-17、UI-18、UI-22、UI-24、UI-32 | 涉及分享、购买、邀请、拼团、积分兑换、支付、报名、通知、退款或资产发放。 |
| `HOLD_REAL_MODEL_OR_AGENT` | 3 | UI-04、UI-10、UI-27 | 需要真实 Model Gateway、适龄策略、评测、Human Gate 或多模态安全闭环；当前只可做受控 projection/mock。 |
| `DOC_ONLY` | 2 | UI-01、UI-02 | UI-01 overlay 不在 repo；UI-01/UI-02 首页版本和 image-to-UI 映射尚未人工裁定，当前只保留文档与共享 Home Projection 设计。 |
| **合计** | **34** | UI-01~UI-34 | 不允许按页面并行启动。 |

## 3. 逐页准入理由

| UI | primary_admission | 暴露点依据 | 旧台账遗漏/证据缺口 | 血缘影响 | 工程边界影响与准入理由 |
|---|---|---|---|---|---|
| UI-01 | DOC_ONLY | 首页横幅、六入口、今日任务、推荐卡、底部导航、空/权限态。 | 用户 overlay 不在 repo；UI-01~12 映射闭包未完成。 | 全部核心链路入口，UI-01/UI-02 关系未裁定。 | 只做文档和共享 Home Projection；暂不单页开发。 |
| UI-02 | DOC_ONLY | 清晰首页、六入口、任务卡、推荐卡、底部导航。 | 可能是 UI-01 版本/用户态，缺独立 route 证据。 | 作为 UI-01 候选版本，影响所有 source_ui。 | 只做版本假设登记；不写 `SelectHomeVariant`。 |
| UI-03 | NEEDS_CONFIRMATION | 第 2/5 步、选项、补充信息、下一步、输入阻断。 | PPT 内部 step 与 global screen 粒度冲突；返回/草稿恢复未逐图确认。 | Assessment → Report；对象粒度未裁定。 | 先确认 ID/route；不能写 Need/Diagnosis Fact。 |
| UI-04 | HOLD_REAL_MODEL_OR_AGENT | 报告成员卡、雷达、72、同龄平均、标签、建议、生成方案。 | 指标、标签和建议的 evidence/policy display 仍需裁定。 | Report → plan_draft；不能直达 Journey。 | 必须 Model Gateway、schema/eval、Human Gate；当前不开放真实 Agent。 |
| UI-05 | READY_FOR_DEV | 90天、3/12/36/90、周计划、任务三态、开始执行、调整/暂停。 | 需要补阶段展开、版本冲突、暂停/拒绝状态。 | UI-04 → plan_draft → FamilyDecision → UI-06/UI-09/UI-31。 | 可做 L1/L2 draft；不自动建 Journey/Task；适合作为唯一首个纵切。 |
| UI-06 | NEEDS_CONFIRMATION | 顾问/班主任/AI/专家、进度、打卡、交流、直播、服务回流。 | ServiceCase、Community、Activity、AI reminder 未按暴露点完全分离。 | UI-05 → Delivery → UI-24/UI-25/UI-31/UI-34。 | 先确认服务交付对象；真人/直播/通知全部 HOLD。 |
| UI-07 | NEEDS_CONFIRMATION | 年度会员、积分/等级/亲子币、报告/计划/订单/邀请、权益卡。 | 权益有效期、到期态、来源和入口分流未逐页确认。 | UI-01/UI-06 → Membership → UI-30/UI-32。 | 只可 L1 Entitlement projection；不能与 UI-18/UI-30 合并。 |
| UI-08 | NEEDS_CONFIRMATION | 体检入口、第1/5步、五维评估、开始测评、适用范围。 | 入口资格、person 选择和测评版本未完成证据闭包。 | Assessment entry → UI-03/UI-04；商业关联不是视觉复用。 | 先确认入口合同；不写 referral/order/score。 |
| UI-09 | READY_FOR_DEV | 今日任务、AI 管家、三任务、完成/部分/未完成、反思、暂停。 | 任务指标和反思来源需继续补状态测试。 | UI-05/UI-04 → Task → UI-10/UI-12/UI-31/UI-34。 | 可复用既有受控 action；不新造任务引擎，不写 Outcome。 |
| UI-10 | HOLD_REAL_MODEL_OR_AGENT | 儿童助手、能量、训练/阅读/情绪/目标、开始挑战。 | 年龄策略、Child/Parent view、多模态输入边界未闭合。 | Task/Assistant → UI-09/UI-27。 | 真实 Agent、儿童数据和情绪/风险必须 Gateway + Consent + Human Gate。 |
| UI-11 | HOLD_HUMAN_GATE | 周/月、同城/班级筛选、奖台、积分、名次卡、分享入口。 | 排名数值、空态、替代投影尚未完成产品裁定。 | UI-09 业务关联，但不是正常成长闭环出口。 | 默认 Guard/HOLD；禁止 Total Score、ranking 和同龄比较。 |
| UI-12 | HOLD_EXTERNAL_EFFECT | 成果海报、前后视觉、勋章、二维码、生成/分享。 | 素材选择、公开范围、效果文案校验未闭合。 | EvidenceStory → UI-25/UI-29/UI-07。 | 仅 draft/export；分享和儿童素材外发需 Human Gate/Adapter。 |
| UI-13 | READY_FOR_DEV | 商城横幅、分类卡、商品卡、筛选/推荐入口、空目录态。 | 商品资格、下架和推荐语义需补 projection 细节。 | Catalog → UI-14~18；与 Assessment/Report 隔离。 | L1 Catalog 可独立设计；不支付、不产生订单。 |
| UI-14 | HOLD_EXTERNAL_EFFECT | 商品详情、价格、权益、购买/拼团 CTA、活动状态。 | 价格/库存/权益和下架状态来源需确认。 | Product/SKU → UI-15/UI-16/UI-07。 | 只可 product/order draft；Payment/Inventory HOLD。 |
| UI-15 | HOLD_EXTERNAL_EFFECT | 邀请进度、奖励、立即邀请、海报/微信。 | 邀请对象、奖励条件、防重复和分享失败态未闭合。 | ReferralDraft → UI-18/UI-12。 | Share/Notification/Reward Adapter + Consent；不发邀请/奖励。 |
| UI-16 | HOLD_EXTERNAL_EFFECT | 拼团商品、价格、人数、倒计时、去拼团、售罄/结束态。 | 人数/倒计时/库存来源和团状态机未确认。 | GroupBuy → UI-18/UI-32。 | 只能 synthetic/read projection；成团/支付/履约 HOLD。 |
| UI-17 | HOLD_EXTERNAL_EFFECT | 积分余额、任务中心、兑换商品、兑换、积分不足态。 | 账本来源、兑换资格和扣减确认未闭合。 | PointsLedger → UI-18/UI-32。 | 只读/兑换 draft；不扣真实积分、不自动奖励。 |
| UI-18 | HOLD_EXTERNAL_EFFECT | 合伙人身份、邀请/成交/积分/奖励、订单/权益、收益入口。 | partner role、指标来源、佣金/提现/结算态未闭合。 | PartnerAsset → UI-32/UI-07。 | 不可与会员合并；Payout/Settlement/Tax/Share HOLD。 |
| UI-19 | READY_FOR_DEV | 搜索、热门领域筛选、教师卡、在线状态、可预约摘要、立即咨询、空结果。 | 需继续补准入状态和筛选边界的测试证据。 | Supply → UI-20/UI-21/UI-22/23。 | L1 read-only；已有独立 staged candidate；不预约、不排序。 |
| UI-20 | READY_FOR_DEV | Provider 详情、资质/评分/标签、可约时段、咨询/预约 CTA、无时段态。 | 资格和评分来源需进入 evidence refs。 | ProviderDetail → UI-21/UI-24。 | L1 detail/L2 booking draft；不锁时段、不做优劣排序。 |
| UI-21 | HOLD_HUMAN_GATE | 咨询方式、日期/时段、问题描述、隐私、确认预约、失败态。 | slot 竞态、敏感描述、确认前 consent、撤回未闭合。 | BookingDraft → UI-24/UI-31/UI-34。 | 需 Human Gate + Adapter；真实占座/通知/视频/支付 HOLD。 |
| UI-22 | HOLD_EXTERNAL_EFFECT | 城市/领域筛选、活动卡、时间地点余量、活动入口。 | 余量、资格、截止/满员和报名状态未闭合。 | ActivityCatalog → UI-23/UI-24。 | 只读可研究，但报名/名额/通知/日历 HOLD。 |
| UI-23 | HOLD_HUMAN_GATE | 活动详情、流程、适合人群、地点、报名 CTA、截止态。 | 适合人群不能自动诊断；报名条件和截止状态需人工确认。 | ActivityDetail → UI-24。 | 报名需 Human Gate；不触发真实活动注册。 |
| UI-24 | HOLD_EXTERNAL_EFFECT | 我的咨询/活动、状态、进入咨询室、取消/回看、空态。 | booking/activity 两类状态和真人空间入口未分离。 | ServiceMine → UI-31/UI-34/UI-07。 | 只读回流可设计；取消、通知、视频/真人入口 HOLD。 |
| UI-25 | READY_FOR_DEV | 社区 feed、分类、分享横幅、动态卡、赞评收藏、发帖/打卡入口。 | 跨家庭可见性、Moderation 和互动状态需补。 | CommunityFeed → UI-26~29。 | L1 private read 可做；不公开发布、不自动推荐。 |
| UI-26 | HOLD_HUMAN_GATE | 打卡/成果/求助/经验、图文、话题、同步社群、发布。 | media、post_type、visibility、发布失败和草稿恢复未闭合。 | PostDraft → UI-28/UI-29。 | 只能 draft/no-op；儿童材料、公开发布、同步社群需 Gate。 |
| UI-27 | HOLD_REAL_MODEL_OR_AGENT | 成长报告、勋章、成果对比、生成海报。 | evidence 来源、对比维度、效果文案和海报生成仍需模型/证据策略。 | EvidenceStory → UI-26/UI-28/UI-29/UI-33。 | 真实 Story Agent/多模态生成未准入；只能受控 projection/draft。 |
| UI-28 | HOLD_HUMAN_GATE | 动态详情、图片、评论、私聊顾问、官方建议、互动。 | comment/message draft、敏感建议、媒体权限和官方来源未闭合。 | Detail → UI-29/UI-06。 | 不发送、不通知、不自动联系顾问；需 Moderation/Human Gate。 |
| UI-29 | READY_FOR_DEV | 我的社区、粉丝/关注/积分、内容列表、发帖/打卡/挑战、等级权益。 | 社区资产来源和等级/排名隔离需补。 | CommunityAsset → UI-30/UI-33。 | L1 read projection 可做；不写社交等级/粉丝事实。 |
| UI-30 | READY_FOR_DEV | 年度会员、权益卡、服务/积分/邀请快捷入口、90天进度、过期态。 | entitlement expiry、快捷入口分流和无会员态需补。 | CustomerOverview → UI-31~34。 | L1 customer projection 可做；不续费、不发奖。 |
| UI-31 | READY_FOR_DEV | 我的服务、90天进度、陪跑角色、周任务、查看方案、继续打卡、暂停。 | plan/service/task 三类卡片和 Resume/Pause 版本审计需补。 | MyServices → UI-09/UI-34；回到 UI-05。 | L1 read；Resume/Pause 只能 Named Action，不自动建 Task。 |
| UI-32 | HOLD_EXTERNAL_EFFECT | 订单/券/积分/奖励、权益中心、查看/支持、失效态。 | 订单/权益分栏、券状态、退款/支持和来源未闭合。 | Assets → UI-30/UI-34。 | 只读或 review draft；支付/退款/提现/续费 HOLD。 |
| UI-33 | READY_FOR_DEV | 家庭档案、孩子信息、关注问题、报告/方案/记录/历史、时间线。 | Person selector、可编辑字段、更正申请和敏感字段策略需补。 | FamilyProfile → UI-04/05/06/09/24/34。 | L1 private projection/L2 correction draft；AI 不写档案。 |
| UI-34 | READY_FOR_DEV | 服务记录、咨询/活动分类、状态过滤、客服支持、时间线、空态。 | booking/activity/service record 分类和 support draft 需补。 | ServiceRecord → UI-30/UI-33；过程终点。 | L1 process read/L2 support draft；真人客服/通知/效果判断 HOLD。 |

## 4. 共享子系统归并

| shared_subsystem | 覆盖 UI | 归并原则 |
|---|---|---|
| Home / Family Context | UI-01/UI-02/UI-30/UI-33 | 一个 Family/Person/Consent 投影，不按首页和后台重复建家庭上下文。 |
| Assessment | UI-03/UI-08 | 测评入口和步骤共用 Session、QuestionSet、Answer、Consent。 |
| Report Explanation / Model Gateway | UI-04/UI-05/UI-10/UI-27 | AI 只生成 explanation/recommendation/draft，不能写核心 Ontology；所有模型经 Gateway。 |
| Plan / Journey / Task | UI-05/UI-09/UI-31 | UI-05 是 draft/decision 面，UI-09 是 Task runtime 面，UI-31 是回流 projection 面。 |
| Service Supply / Booking / ServiceRecord | UI-06/UI-19~UI-24/UI-31/UI-34 | Provider、Offering、Slot、Booking、ServiceCase、ServiceRecord 共享状态机和审计。 |
| Commerce / Referral / Entitlement | UI-07/UI-13~UI-18/UI-30/UI-32 | Membership、PartnerAsset、Order、Points、Reward、Entitlement 分域，不因“我的”重复或合并。 |
| Community / Evidence | UI-06/UI-12/UI-25~UI-29/UI-33 | Community/Post/Media/EvidenceStory 共享可见性和 Moderation，不与陪跑服务混合。 |
| Consent / Policy / Human Gate / Adapter | 全局 | 共享 Gate、Audit、Correlation、ExternalEffect=false 和 fail-closed，不按页面复制策略。 |

## 5. 首个纵切准入结论

### 5.1 唯一推荐：UI-05 `plan_draft → FamilyDecision → Named Action boundary`

UI-05 比 UI-09 和 UI-19 更适合作为首个纵切，不是因为它风险更低，而是因为它位于全平台最关键的**推荐到决策、决策到受控行动**边界：上游承接 UI-04 的 explanation/recommendation，下游连接 UI-06 服务交付、UI-09 任务运行和 UI-31 我的服务。它能一次验证 PlanDraft、FamilyDecision、Consent、Human Gate、Named Action、Audit、幂等和回流投影这些共享平台能力，同时可以严格停在 L1/L2，不触发真实外部 effect。

| 候选 | 优点 | 当前不优先的原因 |
|---|---|---|
| UI-05 | 有清晰独立单图、对象链完整、能验证 Recommendation/Decision/Action 三层边界、下游覆盖 UI-06/UI-09/UI-31。 | 需要保守处理报告风险指标和家庭确认；这正是平台治理边界的核心验证。 |
| UI-09 | 有既有 action/API 经验，可验证任务完成。 | 容易把“完成今日任务”误做 Outcome；依赖 UI-05 计划版本和 Task runtime。 |
| UI-19 | 已有独立 staged L1 供给切片，风险边界清楚。 | 更偏只读 projection，不能验证从 AI recommendation 到家庭 decision 的核心控制链。 |

### 5.2 34 UI 全量开发门禁

当前结论不是 `READY_FOR_34_UI_FULL_DEVELOPMENT`。只有在 UI-01~UI-12 image-to-UI 人工确认、UI-03 粒度冲突裁定、UI-05 纵切通过 API/DB/Web/负向权限/状态机测试后，才重新评估是否开放第二个纵切。其余页面必须按本准入分组逐步放行，不能因为已有一行台账就进入全量开发。

**FAMILY_34_UI_DEVELOPMENT_ADMISSION_READY** `reports/m2/frontend/FAMILY_34_UI_DEVELOPMENT_ADMISSION_001.md`

## References

[1]: `FAMILY_34_UI_FEATURE_REVIEW_001.md` — 34 UI 逐页视觉暴露点复核、遗漏、血缘和工程边界。
[2]: `FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md` — 34 UI 全量功能与血缘总台账。
[3]: `FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md` — global UI、单图和 PPT crosswalk。


## Visual Fidelity Gate（硬门禁）

Manus 后续开发任何 UI，必须完整复刻用户提供的 UI 画面。这里的“完成”不是实现一个语义相似的页面，也不是把页面改造成更现代的产品，而是以用户提供的截图、原始 UI 画面或经过人工确认的 overlay 作为该 UI 的 **visual baseline**。

每个进入开发的 UI 都必须先绑定一个可定位、可复核的 visual baseline，并以此复刻画面结构、布局层级、文案、导航、卡片、按钮、图标位置、状态区、空态、权限态、颜色与间距意图。页面中的视觉层级和可见信息不能因为后端接入、组件重构或响应式实现而被任意删减、改名、重排或替换。

以下做法一律不满足准入条件：

- “重新设计”原 UI；
- 进行“更现代化改造”；
- 用通用模板替代用户提供的页面；
- 只做功能、不还原原画面；
- 以产品人员主观理解替代截图/原始画面的视觉证据；
- 在缺少单页截图、image-to-UI 映射未闭包或 visual baseline 无法定位时直接开始编码。

如果截图证据缺失、映射未闭包或 visual baseline 不可定位，该 UI 不得进入代码开发，只能标记为 `NEEDS_CONFIRMATION` 或 `DOC_ONLY`。UI-01~UI-12 当前仍受 image-to-UI 映射人工确认门禁约束。

动态化必须在不破坏原画面可见结构的前提下接入数据、加载态、状态机、Named Action、审计、Consent 和 Human Gate。数据投影、草稿、受控动作和错误处理可以增加实现能力，但不能借此改变原画面的主结构、文案意图、入口位置和可见层级。任何视觉 baseline comparison 未通过的 UI，不得声明为 runtime 完成。

本门禁是 34 UI 后续开发的前置条件，优先级高于 API 接入速度和组件复用速度。
