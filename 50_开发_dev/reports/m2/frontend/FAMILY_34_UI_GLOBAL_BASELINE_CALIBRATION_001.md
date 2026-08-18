# 34 UI Canonical Baseline Calibration

> **门禁定位。** 本文档是继续任何页面动态化、路由绑定、API 契约或数据对象拆解之前的 global UI 基线。它不是 UI-05 的替代工作；UI-05 仅作为本门禁通过后的 `next_recursive_target`。
>
> **编号规则。** `global_ui_id` 是 34 页全局 screen ID。PPT 中的 `1–5` 或 `1–6` 是场景集合内的局部序号，只用于描述该集合内部的业务顺序，绝不可直接替代 `UI-01…UI-34`。
>
> **状态枚举。** `CONFIRMED`、`NEEDS_CONFIRMATION`、`SOURCE_ANCHOR_MISSING`、`CONFLICT` 是唯一允许状态。没有足够锚点时，宁可标出缺口，也不补写推测。

## 1. 证据和场景集合索引

| source_anchor_type | source_anchor_path_or_scene | 可确认范围 | 说明 |
|---|---|---|---|
| `P0_PPT_CORE_GROWTH` | 用户提供 / 同源商业模式 PPT 第5页“小程序 UI 方案参考” | 核心服务闭环局部 1–6：首页、家庭测评、AI诊断报告、个性化成长方案、陪跑服务、我的。 | 家庭测评显示的“第2/5步”是测评内部步骤。 |
| `P0_PPT_GROWTH_OPTIMIZATION` | 用户提供 / 同源商业模式 PPT 第6页“增长优化场景 UI 设计补充” | 增长闭环局部 1–6：体检、报告、每日任务、孩子助手、排行榜、海报。 | 独立局部编号域。 |
| `P0_PPT_COMMERCE_REFERRAL` | 用户提供 / 同源商业模式 PPT 第8页“分享裂变商城方案构思” | 商城闭环局部 1–6：商城、商品、邀请、拼团、积分、合伙人资产。 | 独立局部编号域。 |
| `P0_PPT_EXPERT_SALON` | 商业模式 PPT 第10页“名师咨询 & 线下沙龙场景设计” | 服务闭环局部 1–6：名师、详情、咨询预约、沙龙、活动、我的预约/活动。 | 用户口径“五 UI”指前五个服务旅程屏；第六列为资产回流屏。 |
| `P0_PPT_COMMUNITY_CHECKIN` | 商业模式 PPT 第12页“用户社区 & 打卡分享场景补充” | 社区闭环局部 1–5：社区、发帖、成果、互动、我的社区。 | 独立局部编号域。 |
| `P1_MASTER_PLAN` | `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md` | 34 个 global UI 条目、页面名、源图和闭环。 | global ID 主要锚点。 |
| `P2_REFERENCE_ASSET` | `apps/web/public/bangyang-reference/` | 33 个可核对原图。 | UI-01 的首版图未在该目录中。 |

## 2. 逐页 Canonical Baseline

| global_ui_id | canonical_title | source_anchor_type | source_anchor_path_or_scene | business_domain | local_sequence_if_any | confidence | conflict_or_gap | status | next_recursive_target |
|---|---|---|---|---|---|---|---|---|---|
| UI-01 | 家庭成长平台首页（首版参考） | P1_MASTER_PLAN + P0_PPT_CORE_GROWTH | P1 `pasted_file_ww7q6r_image.png`; P0 核心集 L1 首页 | 核心服务 | CORE_GROWTH:L1 候选 | 低 | 原始首版图未在 P2 目录；与 UI-02 主页版本关系未获人工裁定。 | SOURCE_ANCHOR_MISSING | 补入首版清晰原图并核验 UI-01/UI-02 版本关系。 |
| UI-02 | 家庭成长平台首页（清晰母版） | P1_MASTER_PLAN + P2_REFERENCE_ASSET + P0_PPT_CORE_GROWTH | `home-screen-ui-crop.png`; P0 核心集 L1 首页 | 核心服务 | CORE_GROWTH:L1 候选 | 中 | UI-01 与 UI-02 均为首页版本；P0 L1 与哪一版精确绑定需人工确认。 | NEEDS_CONFIRMATION | UI-01/02 主页版本裁定。 |
| UI-03 | 家庭测评第 2/5 步 | P1_MASTER_PLAN + P2_REFERENCE_ASSET + P0_PPT_CORE_GROWTH | `family-assessment-step2-reference-326x862.png`; P0 核心集 L2 家庭测评内部第2/5步 | 核心服务 | CORE_GROWTH:L2；内部 step 2/5 | 中 | P1 将其列为 global UI-03，P0 将其视为家庭测评内部步骤；两种粒度未完全对齐。 | CONFLICT | 人工确认：保留为 global UI-03，还是归并为 UI-02 的内部 step asset。 |
| UI-04 | AI 成长诊断报告 | P0_PPT_CORE_GROWTH + P0_PPT_GROWTH_OPTIMIZATION + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `ai-growth-diagnosis-reference-436x1118.png`; 核心集 L3、增长集 L2 | 核心服务 / 增长 | CORE_GROWTH:L3; GROWTH_OPTIMIZATION:L2 | 高 | 同一报告能力跨两个局部场景集复用，不构成第二个 global screen。 | CONFIRMED | Recommendation/read projection → UI-05。 |
| UI-05 | 90 天成长方案 | P0_PPT_CORE_GROWTH + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `growth-plan-90day-reference-434x1130.png`; 核心集 L4 | 核心服务 | CORE_GROWTH:L4 | 高 | 无编号冲突；只允许 plan_draft/read_projection，不能自动建 Journey/Task。 | CONFIRMED | UI-05 状态机、FamilyDecision、Named Action 血缘。 |
| UI-06 | 陪跑服务 / 社群服务 | P0_PPT_CORE_GROWTH + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `delivery-community-reference-458x1128.png`; 核心集 L5 | 核心服务 | CORE_GROWTH:L5 | 高 | 与 UI-25–29 的社区闭环不同；本页是服务交付/陪跑场景。 | CONFIRMED | 服务交付、社群服务投影。 |
| UI-07 | 我的 / 会员中心 | P0_PPT_CORE_GROWTH + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `mine-member-reference-434x1124.png`; 核心集 L6 | 核心服务 | CORE_GROWTH:L6 | 高 | 与 UI-18 合伙人我的、UI-30 年度会员我的属于不同业务域。 | CONFIRMED | 会员权益与个人资产投影。 |
| UI-08 | 家庭成长体检第 1/5 步 | P0_PPT_GROWTH_OPTIMIZATION + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `family-assessment-entry-reference-428x952.png`; 增长集 L1 | 增长 | GROWTH_OPTIMIZATION:L1；内部 step 1/5 | 高 | 无；内部第1/5步不新增 global ID。 | CONFIRMED | Assessment snapshot → UI-04 报告。 |
| UI-09 | 今日成长任务 | P0_PPT_GROWTH_OPTIMIZATION + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `daily-growth-task-reference-448x916.png`; 增长集 L3 | 增长 | GROWTH_OPTIMIZATION:L3 | 高 | 任务完成需来自受控投影/Named Action，不是界面显示即事实。 | CONFIRMED | Task projection / controlled completion。 |
| UI-10 | 成长小助手 | P0_PPT_GROWTH_OPTIMIZATION + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `growth-child-assistant-reference-448x920.png`; 增长集 L4 | 增长 | GROWTH_OPTIMIZATION:L4 | 高 | 孩子端交互需适龄、consent 和安全边界。 | CONFIRMED | Child-safe assistant projection。 |
| UI-11 | 成长排行榜 | P0_PPT_GROWTH_OPTIMIZATION + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `growth-ranking-reference-450x918.png`; 增长集 L5 | 增长 | GROWTH_OPTIMIZATION:L5 | 高 | 禁止家庭总分、跨家庭 ranking；只可作为视觉暴露/Guard 分析。 | CONFIRMED | Benchmark guard / HOLD。 |
| UI-12 | 成长成果海报 | P0_PPT_GROWTH_OPTIMIZATION + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `growth-poster-reference-444x970.png`; 增长集 L6 | 增长 | GROWTH_OPTIMIZATION:L6 | 高 | 外发分享是外部 effect；DEV/TEST 仅 mock/export stub。 | CONFIRMED | Evidence story / share adapter HOLD。 |
| UI-13 | 家庭成长商城首页 | P0_PPT_COMMERCE_REFERRAL + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `family-growth-mall-reference-424x978.png`; 商城集 L1 | 商城 | COMMERCE_REFERRAL:L1 | 高 | 商品目录不代表真实售卖或支付。 | CONFIRMED | Catalog projection。 |
| UI-14 | 商品详情 | P0_PPT_COMMERCE_REFERRAL + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `product-detail-reference-418x970.png`; 商城集 L2 | 商城 | COMMERCE_REFERRAL:L2 | 高 | 价格、购买和拼团不等于支付授权。 | CONFIRMED | Product/SKU projection。 |
| UI-15 | 邀请有礼 | P0_PPT_COMMERCE_REFERRAL + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `invite-rewards-reference-432x992.png`; 商城集 L3 | 商城 | COMMERCE_REFERRAL:L3 | 高 | 外发邀请与奖励发放受 adapter/policy 控制。 | CONFIRMED | Referral reward ledger draft。 |
| UI-16 | 拼团专区 | P0_PPT_COMMERCE_REFERRAL + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `group-buy-reference-440x960.png`; 商城集 L4 | 商城 | COMMERCE_REFERRAL:L4 | 高 | 团、倒计时和价格仅 mock/read model；真实拼团与支付 HOLD。 | CONFIRMED | Group-buy projection / L4 HOLD。 |
| UI-17 | 积分商城 | P0_PPT_COMMERCE_REFERRAL + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `points-mall-reference-472x982.png`; 商城集 L5 | 商城 | COMMERCE_REFERRAL:L5 | 高 | mock 积分不得视作真实资产。 | CONFIRMED | Points ledger projection。 |
| UI-18 | 成长合伙人我的 | P0_PPT_COMMERCE_REFERRAL + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `partner-mine-reference-440x994.png`; 商城集 L6 | 商城 | COMMERCE_REFERRAL:L6 | 高 | 邀请、奖励、收益不得推导为佣金/提现事实。 | CONFIRMED | Partner asset projection。 |
| UI-19 | 名师专区 | P0_PPT_EXPERT_SALON + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `teacher-zone-reference-458x1008.png`; 服务集 L1 | 名师沙龙 | EXPERT_SALON:L1 | 高 | Provider/Offering 主数据，不使用训练数据 `teacher` 字段。 | CONFIRMED | Teacher supply list slice。 |
| UI-20 | 名师详情 | P0_PPT_EXPERT_SALON + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `teacher-detail-reference-426x1002.png`; 服务集 L2 | 名师沙龙 | EXPERT_SALON:L2 | 高 | 资质、评分、可约时段要有主数据/证据锚点。 | CONFIRMED | Provider profile projection。 |
| UI-21 | 在线咨询 / 预约 | P0_PPT_EXPERT_SALON + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `consultation-booking-reference-492x1008.png`; 服务集 L3 | 名师沙龙 | EXPERT_SALON:L3 | 高 | 真实预约、联系和通知均为外部 effect HOLD。 | CONFIRMED | Booking draft / mock receipt。 |
| UI-22 | 线下沙龙 | P0_PPT_EXPERT_SALON + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `salon-list-reference-466x1008.png`; 服务集 L4 | 名师沙龙 | EXPERT_SALON:L4 | 高 | 活动名额/地点只读供给主数据。 | CONFIRMED | Activity catalog projection。 |
| UI-23 | 活动详情 | P0_PPT_EXPERT_SALON + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `activity-detail-reference-470x1016.png`; 服务集 L5 | 名师沙龙 | EXPERT_SALON:L5 | 高 | 报名和咨询以 draft/mock 表达，不触发真实 effect。 | CONFIRMED | Activity detail / registration draft。 |
| UI-24 | 我的咨询与活动 | P0_PPT_EXPERT_SALON + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `service-mine-reference-472x1018.png`; 服务集 L6资产回流列 | 名师沙龙 | EXPERT_SALON:L6 | 高 | 用户的“五 UI”口径不应遗漏 L6 资产回流屏。 | CONFIRMED | Service case / booking projection。 |
| UI-25 | 家长社区 | P0_PPT_COMMUNITY_CHECKIN + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `parent-community-reference-552x1034.png`; 社区集 L1 | 社区 | COMMUNITY_CHECKIN:L1 | 高 | 真实发布和公开画像 HOLD。 | CONFIRMED | Community read projection。 |
| UI-26 | 发布动态 | P0_PPT_COMMUNITY_CHECKIN + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `publish-dynamic-reference-548x1028.png`; 社区集 L2 | 社区 | COMMUNITY_CHECKIN:L2 | 高 | 内容与儿童信息需 consent/Human Gate。 | CONFIRMED | Post draft / no-op publish contract。 |
| UI-27 | 成长成果 | P0_PPT_COMMUNITY_CHECKIN + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `growth-outcomes-reference-522x1110.png`; 社区集 L3 | 社区 | COMMUNITY_CHECKIN:L3 | 高 | 成果展示不写成永久能力标签或 outcome Fact。 | CONFIRMED | Evidence story projection。 |
| UI-28 | 动态详情 | P0_PPT_COMMUNITY_CHECKIN + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `dynamic-detail-reference-524x1022.png`; 社区集 L4 | 社区 | COMMUNITY_CHECKIN:L4 | 高 | 评论/私信以 draft/no-op 表达。 | CONFIRMED | Community detail projection。 |
| UI-29 | 我的社区 | P0_PPT_COMMUNITY_CHECKIN + P1_MASTER_PLAN + P2_REFERENCE_ASSET | `my-community-reference-560x1030.png`; 社区集 L5 | 社区 | COMMUNITY_CHECKIN:L5 | 高 | 社群资产、积分、等级是读模型，非真实社交资产。 | CONFIRMED | Community asset projection。 |
| UI-30 | 我的（年度会员服务） | P1_MASTER_PLAN + P2_REFERENCE_ASSET | `annual-member-mine-reference-532x994.png` | 客户后台 | BACKOFFICE:N/A | 高 | 现有 P0 场景集未提供局部编号；不从其他“我的”外推。 | CONFIRMED | Membership asset projection。 |
| UI-31 | 我的服务 | P1_MASTER_PLAN + P2_REFERENCE_ASSET | `my-services-reference-532x1000.png` | 客户后台 | BACKOFFICE:N/A | 高 | 服务计划与 UI-05/06 的数据交接待后续显式映射。 | CONFIRMED | Service plan projection。 |
| UI-32 | 订单与资产 | P1_MASTER_PLAN + P2_REFERENCE_ASSET | `orders-assets-reference-552x1010.png` | 客户后台 | BACKOFFICE:N/A | 高 | 订单/权益显示不触发真实支付或续费。 | CONFIRMED | Order and entitlement projection。 |
| UI-33 | 家庭档案 | P1_MASTER_PLAN + P2_REFERENCE_ASSET | `family-profile-reference-542x1002.png` | 客户后台 | BACKOFFICE:N/A | 高 | 私有档案受 tenant/family scope 与 consent 约束。 | CONFIRMED | Family profile projection。 |
| UI-34 | 服务记录 | P1_MASTER_PLAN + P2_REFERENCE_ASSET | `service-records-reference-566x1008.png` | 客户后台 | BACKOFFICE:N/A | 高 | 服务记录必须来自受控过程事实。 | CONFIRMED | Service-record projection。 |

## 3. 冲突审计表

| conflict_id | affected_ui_id | conflicting_sources | decision_or_hold | required_human_confirmation |
|---|---|---|---|---|
| C-001 | UI-01, UI-02 | P1 有两个首页版本；P2 仅有 UI-02 清晰母版；P0 核心集仅显示一张首页。 | UI-01 标 `SOURCE_ANCHOR_MISSING`；UI-02 标 `NEEDS_CONFIRMATION`；两页都不进入动态化。 | 提供 UI-01 首版清晰原图，确认 UI-01/UI-02 是版本替换、并存入口还是不同用户态。 |
| C-002 | UI-03 | P1 将“家庭测评第2/5步”列为 global UI-03；P0 将同一画面作为“家庭测评”内部步骤。 | 标 `CONFLICT`；保留资产和页面行，但不作为后续主 screen 动态化起点。 | 确认是否维持 `UI-03` 为 global 页面，或在下一版 map 中归并到 UI-02 flow state。 |
| C-003 | UI-04–UI-07 | 早期研究报告把源于 P1 的 UI-04/05/06/07 与 P0 核心集 L3/L4/L5/L6 的语义误作编号整体偏移。 | 以本表的 P1 global ID + P0 局部序号并存方式校正；早期 marker 仅历史审计。 | 无需阻塞本表；后续按 global ID 更新 Page Lineage Graph。 |
| C-004 | UI-19–UI-24 | 用户称 P0 第10页“五 UI”，但视觉图还显示“我的预约/我的活动”资产回流列。 | 前五列为服务旅程，L6 绑定 UI-24 资产回流；不丢弃 UI-24。 | 若希望 PPT 集合严格只记录五屏，确认是否把 UI-24 改列为集合外回流页。 |
| C-005 | UI-30–UI-34 | P0 第5/8/10/12页存在“我的”类局部终页；P1/P2 另有客户后台 5 页。 | UI-30–UI-34 保持 `BACKOFFICE:N/A`，不从局部“我的”推导编号。 | 后续如提供后台场景 PPT，再新增局部集合映射。 |

## 4. 校准结论和开发门禁

| 检查项 | 结果 |
|---|---:|
| global_ui_id 行数 | 34 |
| `CONFIRMED` | 31 |
| `NEEDS_CONFIRMATION` | 1 |
| `SOURCE_ANCHOR_MISSING` | 1 |
| `CONFLICT` | 1 |
| 未经证实而补写页面 | 0 |

> **门禁结论。** 在 C-001 与 C-002 获得人工确认前，不以 UI-01、UI-02 或 UI-03 启动新的动态化切片。其余页面的编号、页面名、业务域和原图锚点已形成可审计基线；后续动态化必须引用本表的 global ID，局部 PPT 序号只用于叙述场景顺序。
>
> **UI-05 规则。** UI-05 仍是已暂停、待本门禁通过后恢复的下一主线：仅可先实现 `plan_draft/read_projection`；FamilyDecision 与后续 Named Action 必须分层；不能自动创建真实 Journey、Task 或 Intervention。

**34_UI_BASELINE_CALIBRATION_READY** `50_开发_dev/reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`

## References

[1]: ../../governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md "34 页 UI 与 3 份 PPT 总交付计划"
[2]: ../../apps/web/public/bangyang-reference/ "34 页 UI 视觉参考资产目录"
[3]: /tmp/PPT_PAGE5_PAGE6_SIX_UI_VERIFICATION_NOTES.md "PPT 第5、6页六屏 UI 核验笔记"
[4]: /tmp/PPT_PAGE10_PAGE12_FIVE_UI_VERIFICATION_NOTES.md "PPT 第10、12页五屏 UI 核验笔记"


---

# UI × PPT Visual Source Cross-check Audit

> **审计范围。** 本节只核对同一份《榜样教育新商业模式对外宣发PPT_原图版(2)》第 **5、6、8、10、12、14** 页与 34 个 global UI 单图。映射必须同时满足四项：**图像视觉特征、可见文案标题、业务动作、数据对象/能力边界**。PPT 局部编号只描述该页内部顺序，绝不替代 global UI ID。
>
> **图像读取说明。** UI-02 至 UI-34 的 33 张参考图均已从 `apps/web/public/bangyang-reference/` 单图读取并按域保留视觉核验笔记；UI-01 预期源图 `pasted_file_ww7q6r_image.png` 不在参考目录，必须保持 `MISSING_IMAGE`。PPT 第14页通过嵌入的 `07_我的客户后台.png` 客户后台五屏图进行核验。

## A. 34 张 Global UI 单图逐项核对表

| ui_image_file | visual_signals | ppt_scene_id | ppt_local_sequence | ppt_visual_signals | candidate_global_ui_id | visual_match_level | mapping_type | evidence_note | conflict_or_gap |
|---|---|---|---|---|---|---|---|---|---|
| `UI-01 / pasted_file_ww7q6r_image.png` | 原图未在参考目录。 | `CORE_GROWTH` | L1 首页 | PPT 有家庭首页、蓝色测评横幅、六入口、任务和推荐卡。 | UI-01 / UI-02 | `MISSING_IMAGE` | `CONFLICT` | P1 指向 UI-01 首版；P0 L1 视觉与 UI-02 已有清晰图一致。 | 缺 UI-01 原图；无法裁定 P0 L1 属 UI-01 首版或 UI-02 清晰母版。 |
| `UI-02 / home-screen-ui-crop.png` | 顶部家庭成长平台；免费家庭测评蓝横幅；六入口；今日任务；推荐内容；底部导航。 | `CORE_GROWTH` | L1 首页 | 相同蓝横幅、六入口、今日任务和推荐卡。 | UI-02 | `EXACT_VISUAL` | `EXACT` | 四项均一致；见 UI-02/03 单图笔记。 | 与 UI-01 的首页版本关系仍待人工确认。 |
| `UI-03 / family-assessment-step2-reference-326x862.png` | 家庭测评；第2/5步；五个单选关注方向；补充信息；下一步。 | `CORE_GROWTH` | L2 家庭测评 | 同标题、进度、问题卡、补充项和下一步。 | UI-03 | `EXACT_VISUAL` | `EXACT` | 图像、文案、测评动作一致。 | P0 是测评局部步骤，P1 是 global UI-03；粒度冲突已登记。 |
| `UI-04 / ai-growth-diagnosis-reference-436x1118.png` | AI诊断；成员卡；雷达；72；同龄平均；问题标签；建议；生成方案。 | `CORE_GROWTH / GROWTH_OPTIMIZATION` | L3 / L2 | 两页均出现同一成员卡、雷达、72、问题与方案 CTA。 | UI-04 | `EXACT_VISUAL` | `REUSE` | 同一报告屏复用于核心与增长场景。 | 同龄平均、总评和标签不得写为 Fact/排名。 |
| `UI-05 / growth-plan-90day-reference-434x1130.png` | 90天；3/12/36/90；周计划；任务三态；开始执行计划。 | `CORE_GROWTH` | L4 个性化成长方案 | 相同 90 天统计、阶段线、任务和橙色 CTA。 | UI-05 | `EXACT_VISUAL` | `EXACT` | 视觉、计划动作和 draft 对象一致。 | 只能 plan_draft/read_projection；非自动 Journey/Task。 |
| `UI-06 / delivery-community-reference-458x1128.png` | 家庭顾问/班主任/AI提醒/专家答疑；78%；成长打卡/家长交流/直播。 | `CORE_GROWTH` | L5 陪跑服务 | 相同四宫格、完成度、任务、社群 tab。 | UI-06 | `EXACT_VISUAL` | `EXACT` | 服务交付和陪跑对象一致。 | 与 UI-25–29 社区内容域不同。 |
| `UI-07 / mine-member-reference-434x1124.png` | 年度会员；积分/等级/亲子币；报告/计划/订单/邀请；权益卡。 | `CORE_GROWTH` | L6 我的/会员中心 | 相同深蓝会员卡、个人资产入口与年度权益。 | UI-07 | `EXACT_VISUAL` | `EXACT` | 会员 read projection 一致。 | 与 UI-18 和 UI-30 “我的”不同域。 |
| `UI-08 / family-assessment-entry-reference-428x952.png` | 家庭成长体检；第1/5步；五维评估；测评入口。 | `GROWTH_OPTIMIZATION` | L1 体检入口 | 相同蓝横幅、五维、进度和问题卡。 | UI-08 | `EXACT_VISUAL` | `EXACT` | 视觉/评估动作一致。 | 内部步骤不新建 global ID。 |
| `UI-09 / daily-growth-task-reference-448x916.png` | 今日任务；AI管家；三任务；78%；完成今日任务。 | `GROWTH_OPTIMIZATION` | L3 每日任务 | 相同提醒、任务、进度与 CTA。 | UI-09 | `EXACT_VISUAL` | `EXACT` | 任务投影视觉一致。 | 完成必须为受控 action。 |
| `UI-10 / growth-child-assistant-reference-448x920.png` | 儿童助手；成长能量；训练/阅读/日记/目标；开始挑战。 | `GROWTH_OPTIMIZATION` | L4 孩子端助手 | 相同儿童端卡片和开始挑战。 | UI-10 | `EXACT_VISUAL` | `EXACT` | 儿童助手视觉/动作一致。 | 适龄、consent 和安全边界。 |
| `UI-11 / growth-ranking-reference-450x918.png` | 成长排行榜；周/月/同城/同班级；奖台；积分。 | `GROWTH_OPTIMIZATION` | L5 排行榜 | 相同排行、奖杯、奖台和积分。 | UI-11 | `EXACT_VISUAL` | `EXACT` | 视觉一致。 | 禁止家庭 Total Score 和真实跨家庭 ranking。 |
| `UI-12 / growth-poster-reference-444x970.png` | 成果海报；成长前后；勋章；二维码；分享。 | `GROWTH_OPTIMIZATION` | L6 成果海报 | 相同海报、成长值、二维码和分享形态。 | UI-12 | `EXACT_VISUAL` | `EXACT` | 视觉一致。 | 分享是 adapter/L4 effect。 |
| `UI-13 / family-growth-mall-reference-424x978.png` | 邀请礼盒；拼团/好物/积分/会员/抢购/邀请；商品推荐。 | `COMMERCE_REFERRAL` | L1 商城首页 | 相同邀请横幅、六入口和商品卡。 | UI-13 | `EXACT_VISUAL` | `EXACT` | 商城目录视觉一致。 | 不代表真实售卖/支付。 |
| `UI-14 / product-detail-reference-418x970.png` | 21天亲子沟通挑战营；多价格；权益；购买/发起拼团。 | `COMMERCE_REFERRAL` | L2 商品详情 | 同商品、三价、权益与双 CTA。 | UI-14 | `EXACT_VISUAL` | `EXACT` | 商品/SKU 对象一致。 | 支付和拼团外部 effect HOLD。 |
| `UI-15 / invite-rewards-reference-432x992.png` | 邀请有礼；3家庭；1/3；奖励；立即邀请；海报/微信。 | `COMMERCE_REFERRAL` | L3 邀请有礼 | 相同进度、奖励卡和邀请入口。 | UI-15 | `EXACT_VISUAL` | `EXACT` | 视觉和 referral 动作一致。 | 外发邀请和授奖为 adapter/ledger。 |
| `UI-16 / group-buy-reference-440x960.png` | 拼团专区；课程/会员/工具；团购价；倒计时；去拼团。 | `COMMERCE_REFERRAL` | L4 拼团专区 | 相同团购卡、人数、倒计时和 CTA。 | UI-16 | `EXACT_VISUAL` | `EXACT` | 视觉一致。 | 库存/支付/成团为 L4 HOLD。 |
| `UI-17 / points-mall-reference-472x982.png` | 积分商城；成长积分；任务中心；积分兑换。 | `COMMERCE_REFERRAL` | L5 积分商城/任务中心 | 同积分卡、任务和兑换品。 | UI-17 | `EXACT_VISUAL` | `EXACT` | 积分对象视觉一致。 | 必须受控账本。 |
| `UI-18 / partner-mine-reference-440x994.png` | 成长合伙人；邀请/成交/积分/奖励；订单/奖励/会员权益。 | `COMMERCE_REFERRAL` | L6 我的收益/会员中心 | 同合伙人身份、统计和权益。 | UI-18 | `EXACT_VISUAL` | `EXACT` | 伙伴资产视觉一致。 | 不推导佣金/提现事实。 |
| `UI-19 / teacher-zone-reference-458x1008.png` | 名师专区；搜索；名师在线；热门领域；教师卡；立即咨询。 | `EXPERT_SALON` | L1 名师专区 | 相同师资横幅、领域和咨询入口。 | UI-19 | `EXACT_VISUAL` | `EXACT` | Provider/Offering 入口一致。 | 咨询不触发真实联系。 |
| `UI-20 / teacher-detail-reference-426x1002.png` | 名师详情；资质；评分；标签；可预约时间；咨询/预约。 | `EXPERT_SALON` | L2 名师详情 | 相同教师详情、时段和双 CTA。 | UI-20 | `EXACT_VISUAL` | `EXACT` | 视觉和 provider profile 一致。 | 评分/资质须来源证据。 |
| `UI-21 / consultation-booking-reference-492x1008.png` | 在线咨询/预约；方式；时段；问题描述；隐私；确认预约。 | `EXPERT_SALON` | L3 在线咨询/预约 | 同咨询方式、时段、描述和确认。 | UI-21 | `EXACT_VISUAL` | `EXACT` | Booking draft 视觉一致。 | 日历/通知/视频/真实预约 HOLD。 |
| `UI-22 / salon-list-reference-466x1008.png` | 线下沙龙；城市；搜索；领域；活动卡/余量。 | `EXPERT_SALON` | L4 线下沙龙 | 同城市筛选、主题和活动列表。 | UI-22 | `EXACT_VISUAL` | `EXACT` | 活动供给视觉一致。 | 名额/地点为只读供给主数据。 |
| `UI-23 / activity-detail-reference-470x1016.png` | 活动详情；亮点；流程；适合人群；报名。 | `EXPERT_SALON` | L5 活动详情 | 同亲子沟通沙龙、流程和报名。 | UI-23 | `EXACT_VISUAL` | `EXACT` | 活动对象一致。 | 报名/咨询不执行真实 effect。 |
| `UI-24 / service-mine-reference-472x1018.png` | 我的咨询/活动；状态；进入咨询室；会员卡。 | `EXPERT_SALON` | L6 预约/活动回流屏 | 同我的预约/活动资产回流列。 | UI-24 | `EXACT_VISUAL` | `EXACT` | 服务记录 read projection 一致。 | L6 不是“前五服务旅程”中的遗漏页面。 |
| `UI-25 / parent-community-reference-552x1034.png` | 家长社区；分类；分享横幅；动态；赞评收藏。 | `COMMUNITY_CHECKIN` | L1 社区首页 | 同社区首页、发帖/打卡入口和动态流。 | UI-25 | `EXACT_VISUAL` | `EXACT` | 视觉一致。 | 真实公开表达受 consent/Human Gate。 |
| `UI-26 / publish-dynamic-reference-548x1028.png` | 发布动态；打卡/成果/求助/经验；图文；话题；同步社群；发布。 | `COMMUNITY_CHECKIN` | L2 发布/打卡 | 同发布和打卡屏。 | UI-26 | `EXACT_VISUAL` | `EXACT` | 视觉一致。 | 媒体/儿童信息/发布为 no-op draft。 |
| `UI-27 / growth-outcomes-reference-522x1110.png` | 成长成果；成长报告；勋章；成果对比；生成海报。 | `COMMUNITY_CHECKIN` | L3 成果展示/荣誉激励 | 同成果与勋章屏。 | UI-27 | `EXACT_VISUAL` | `EXACT` | Evidence story 视觉一致。 | 不写永久 outcome Fact。 |
| `UI-28 / dynamic-detail-reference-524x1022.png` | 动态详情；图片；评论；私聊顾问；官方建议。 | `COMMUNITY_CHECKIN` | L4 互动详情 | 同详情/评论/互动屏。 | UI-28 | `EXACT_VISUAL` | `EXACT` | 视觉一致。 | 私聊/评论/建议需 policy。 |
| `UI-29 / my-community-reference-560x1030.png` | 我的社区；粉丝/关注/积分；发帖/打卡/挑战；等级权益。 | `COMMUNITY_CHECKIN` | L5 我的社区 | 同我的社区/社群资产屏。 | UI-29 | `EXACT_VISUAL` | `EXACT` | 视觉一致。 | 等级/积分为投影而非真实社交资产。 |
| `UI-30 / annual-member-mine-reference-532x994.png` | 年度会员；服务/积分/等级/邀请奖励；快捷入口；90天服务。 | `CUSTOMER_BACKOFFICE` | L1 我的首页/客户总览 | 第14页保留同身份、指标、入口、90天进度和权益。 | UI-30 | `EXACT_VISUAL` | `EXACT` | 第14页直接补足客户后台局部序号。 | 与 UI-07/18 同名“我的”但对象域不同。 |
| `UI-31 / my-services-reference-532x1000.png` | 我的服务；90天进度；陪跑角色；周任务；查看方案/继续打卡。 | `CUSTOMER_BACKOFFICE` | L2 我的服务/陪跑进度 | 同90天进度、角色和任务。 | UI-31 | `EXACT_VISUAL` | `EXACT` | 第14页直接匹配。 | 任务状态必须来自受控 projection。 |
| `UI-32 / orders-assets-reference-552x1010.png` | 订单与资产；订单/券/积分/奖励；权益中心。 | `CUSTOMER_BACKOFFICE` | L3 订单/资产权益 | 同统计、订单卡和权益中心。 | UI-32 | `EXACT_VISUAL` | `EXACT` | 第14页直接匹配。 | 无真实支付/提现。 |
| `UI-33 / family-profile-reference-542x1002.png` | 家庭档案；孩子信息；关注问题；报告/方案/记录/历史；时间线。 | `CUSTOMER_BACKOFFICE` | L4 家庭档案/报告中心 | 同档案、关注项、对象卡和时间线。 | UI-33 | `EXACT_VISUAL` | `EXACT` | 第14页直接匹配。 | family/tenant 私有投影与 consent。 |
| `UI-34 / service-records-reference-566x1008.png` | 服务记录；咨询；活动；状态；客服支持。 | `CUSTOMER_BACKOFFICE` | L5 咨询活动/客服支持 | 同咨询、活动、服务状态和客服。 | UI-34 | `EXACT_VISUAL` | `EXACT` | 第14页直接匹配。 | 客服/外部通知不由 UI 自动触发。 |

## B. PPT Local Screen Crosswalk

| ppt_scene_id | ppt_local_sequence | ppt_screen_title | mapped_global_ui_id | mapping_type | evidence_anchor | conflict_or_gap |
|---|---|---|---|---|---|---|
| CORE_GROWTH | L1 | 首页 | UI-02（UI-01 待裁定） | CONFLICT | 第5页视觉与 `home-screen-ui-crop.png` exact；UI-01 原图缺失。 | 不将 P0 L1 自动编号为 UI-01。 |
| CORE_GROWTH | L2 | 家庭测评 | UI-03 | EXACT | 第5页测评第2/5步与 UI-03 exact。 | P0 局部屏/内部步骤与 P1 global 粒度冲突。 |
| CORE_GROWTH | L3 | AI诊断报告 | UI-04 | EXACT | 第5页雷达/72/建议/方案 CTA 与 UI-04 exact。 | 同能力亦被增长集合复用。 |
| CORE_GROWTH | L4 | 个性化成长方案 | UI-05 | EXACT | 第5页 90天/周计划/橙 CTA 与 UI-05 exact。 | 无。 |
| CORE_GROWTH | L5 | 陪跑服务 | UI-06 | EXACT | 第5页四角色、78%、社群 tab 与 UI-06 exact。 | 不等于 UI-25–29 社区域。 |
| CORE_GROWTH | L6 | 我的/会员中心 | UI-07 | EXACT | 第5页年度会员卡/资产入口与 UI-07 exact。 | 不等于 UI-18 或 UI-30。 |
| GROWTH_OPTIMIZATION | L1 | 家庭成长体检入口 | UI-08 | EXACT | 第6页与 UI-08 第1/5步 exact。 | 内部步骤不映射 global 新 ID。 |
| GROWTH_OPTIMIZATION | L2 | AI体检报告 | UI-04 | REUSE | 第6页雷达/72/建议与 UI-04 exact。 | 复用报告能力，不新增 global screen。 |
| GROWTH_OPTIMIZATION | L3 | 每日任务/AI管家 | UI-09 | EXACT | 第6页任务、AI提醒、78% 与 UI-09 exact。 | 无。 |
| GROWTH_OPTIMIZATION | L4 | 孩子端成长助手 | UI-10 | EXACT | 第6页儿童端卡片与 UI-10 exact。 | 无。 |
| GROWTH_OPTIMIZATION | L5 | 家庭成长排行榜 | UI-11 | EXACT | 第6页排行/奖台与 UI-11 exact。 | 排名动态化受 Guard。 |
| GROWTH_OPTIMIZATION | L6 | 成长报告海报/分享 | UI-12 | EXACT | 第6页海报/二维码与 UI-12 exact。 | 分享 external effect HOLD。 |
| COMMERCE_REFERRAL | L1 | 裂变商城首页 | UI-13 | EXACT | 第8页商城首页与 UI-13 exact。 | 无。 |
| COMMERCE_REFERRAL | L2 | 商品详情 | UI-14 | EXACT | 第8页商品、价格、CTA 与 UI-14 exact。 | 支付 HOLD。 |
| COMMERCE_REFERRAL | L3 | 邀请有礼 | UI-15 | EXACT | 第8页邀请进度/奖励与 UI-15 exact。 | 外发/奖励 adapter。 |
| COMMERCE_REFERRAL | L4 | 拼团专区 | UI-16 | EXACT | 第8页拼团卡与 UI-16 exact。 | 真实拼团 HOLD。 |
| COMMERCE_REFERRAL | L5 | 积分商城/任务中心 | UI-17 | EXACT | 第8页积分任务/兑换与 UI-17 exact。 | 受控账本。 |
| COMMERCE_REFERRAL | L6 | 我的收益/会员中心 | UI-18 | EXACT | 第8页合伙人资产与 UI-18 exact。 | 不推导佣金。 |
| EXPERT_SALON | L1 | 名师专区 | UI-19 | EXACT | 第10页师资专区与 UI-19 exact。 | 无。 |
| EXPERT_SALON | L2 | 名师详情 | UI-20 | EXACT | 第10页详情/时段/CTA 与 UI-20 exact。 | 无。 |
| EXPERT_SALON | L3 | 在线咨询/预约 | UI-21 | EXACT | 第10页咨询预约流程与 UI-21 exact。 | 真实预约 HOLD。 |
| EXPERT_SALON | L4 | 线下沙龙 | UI-22 | EXACT | 第10页活动列表与 UI-22 exact。 | 无。 |
| EXPERT_SALON | L5 | 活动详情/报名 | UI-23 | EXACT | 第10页活动详情与 UI-23 exact。 | 报名 no-op。 |
| EXPERT_SALON | L6 | 我的预约/我的活动 | UI-24 | EXACT | 第10页资产回流列与 UI-24 exact。 | 用户“五 UI”口径不遗漏 L6。 |
| COMMUNITY_CHECKIN | L1 | 社区首页/交流广场 | UI-25 | EXACT | 第12页社区首页与 UI-25 exact。 | 无。 |
| COMMUNITY_CHECKIN | L2 | 发帖/打卡分享 | UI-26 | EXACT | 第12页发布打卡与 UI-26 exact。 | 发布 no-op。 |
| COMMUNITY_CHECKIN | L3 | 成果展示/荣誉激励 | UI-27 | EXACT | 第12页成果勋章与 UI-27 exact。 | 不是 permanent Fact。 |
| COMMUNITY_CHECKIN | L4 | 互动评论/家长互助 | UI-28 | EXACT | 第12页详情互动与 UI-28 exact。 | 外部互动 HOLD。 |
| COMMUNITY_CHECKIN | L5 | 我的社区/社群资产 | UI-29 | EXACT | 第12页我的社区与 UI-29 exact。 | 社区积分只读。 |
| CUSTOMER_BACKOFFICE | L1 | 我的首页/客户总览 | UI-30 | EXACT | 第14页嵌入 `07_我的客户后台.png` 与 UI-30 exact。 | 无。 |
| CUSTOMER_BACKOFFICE | L2 | 我的服务/陪跑进度 | UI-31 | EXACT | 第14页与 UI-31 exact。 | 无。 |
| CUSTOMER_BACKOFFICE | L3 | 我的订单/资产权益 | UI-32 | EXACT | 第14页与 UI-32 exact。 | 无。 |
| CUSTOMER_BACKOFFICE | L4 | 家庭档案/报告中心 | UI-33 | EXACT | 第14页与 UI-33 exact。 | 无。 |
| CUSTOMER_BACKOFFICE | L5 | 咨询活动/客服支持 | UI-34 | EXACT | 第14页与 UI-34 exact。 | 无。 |

## C. Global-only、PPT-only 与名称边界差异

| category | items | 审计结论 |
|---|---|---|
| Global UI 有、PPT 未获单图 visual confirmation | UI-01 | 预期源图缺失；核心首页 PPT L1 与 UI-02 exact，不能据名称推定 UI-01。 |
| PPT local screen 有、34 UI 无对应 global screen | 无 | 六页 PPT 的 34 个局部 screen 均能映射到一个 global UI；其中增长 L2 为 UI-04 的 `REUSE`。 |
| 名称相似但业务域/能力边界不同 | UI-06 vs UI-25–29；UI-07 vs UI-18 vs UI-30；UI-24 vs UI-34 | UI-06 是陪跑交付/社群服务；UI-25–29 是社区内容闭环。UI-07 是核心会员我的，UI-18 是裂变合伙人资产，UI-30 是客户后台总览。UI-24 是个人咨询/活动回流，UI-34 是服务记录/客服支持。不得因为“社区/我的/服务”同名而复用错误对象或路由。 |

## D. Mapping Correction Proposals

| old_mapping | new_mapping | reason | requires_human_confirmation |
|---|---|---|---|
| 将 PPT 第5页 L1 直接写作 global UI-01。 | `CORE_GROWTH:L1 → UI-02 exact visual`；UI-01 保持 `MISSING_IMAGE`。 | UI-02 单图与 PPT L1 在视觉、文案、动作和能力边界四项一致；UI-01 预期单图缺失。 | 是：确认 UI-01 与 UI-02 的版本关系和最终路由命名。 |
| 将 PPT 第5页 L2“家庭测评”当作 global UI-02。 | 保留 P1 `UI-03`，并注明它是 `CORE_GROWTH:L2` 内部 step 2/5。 | 单图 exact，但 global 条目粒度与 PPT 局部流程粒度不同。 | 是：确认该 global UI 是否在下一版归并为 UI-02 flow state。 |
| 将 PPT 第5页 L4/L5 当作旧文档 UI-05/UI-06 之外的顺序偏移页。 | `L4 → UI-05`；`L5 → UI-06`。 | 单图与 PPT exact；局部 1–6 不得被测评“第2/5步”整体挤位。 | 否：本次图像审计已确认。 |
| 将 PPT 第14页客户后台五屏视为 PPT-only、与 UI-30–34 无锚点。 | `L1–L5 → UI-30–UI-34 exact`。 | 第14页嵌入原图逐屏保留同一布局、文字、指标和动作。 | 否：本次图像审计已确认。 |

## E. 审计统计与门禁结论

| 指标 | 数量 |
|---|---:|
| Global UI 总数 | 34 |
| 可获得单图并已图像读取 | 33 |
| `MISSING_IMAGE` | 1（UI-01） |
| PPT local screen 总数 | 34 |
| `EXACT` mapping_type | 32 |
| `REUSE` mapping_type | 1（增长 L2 → UI-04） |
| `OVERLAP` mapping_type | 0 |
| `NO_GLOBAL_SCREEN` mapping_type | 0 |
| `CONFLICT` mapping_type | 1（核心 L1 首页映射） |
| Global UI 获得 exact/reuse visual coverage | 33 |
| PPT-only visual gaps | 0 |

> **门禁结论。** 本图像审计不是“名称相似”映射：UI-02 至 UI-34 已有单图视觉证据；第 5、6、8、10、12、14 页 PPT 的 34 个局部 screen 均与 global UI 形成 image-level crosswalk。唯一阻断缺口是 UI-01 源图和 UI-01/UI-02 首页版本关系；在人工确认前，不对 UI-01/02 新开动态化切片。UI-05 仍暂停，直到本审计 marker、隔离核验和架构师确认一并输出。

**34_SINGLE_UI_IMAGE_PPT_VISUAL_AUDIT_READY** `50_开发_dev/reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`


---

# Visual Audit Correction Overlay — UI-01 User-Provided Source

> **新 P0 证据。** 用户在本会话直接提供并明确确认的 UI-01 清晰原图（会话附件 `pasted_file_d59x8O_image.png`）是 UI-01 的直接视觉锚点。该图可见“家庭成长平台”、免费家庭测评蓝色横幅、AI诊断/21天挑战营/90天成长计划/成长案例/专家直播/家庭顾问六入口、今日成长任务、推荐内容/服务及首页底部导航。
>
> 本 overlay **只修正 UI-01 图像证据的可用性、PPT L1 的候选对应和统计**；不改变既有业务域、路由、对象、API 或代码。此前 `MISSING_IMAGE` 的原因是参考资源目录缺少预期文件，而不是 UI-01 原图不存在。

| field | 旧结论 | 校正结论 | evidence | effect |
|---|---|---|---|---|
| UI-01 image status | `MISSING_IMAGE` | `EXACT_VISUAL`（用户直接确认的 P0 原图） | 会话附件 `pasted_file_d59x8O_image.png`；可见视觉信号与核心首页一致。 | 图像可用性缺口关闭。 |
| `CORE_GROWTH:L1` | `CONFLICT`：仅视觉指向 UI-02 | `EXACT`：PPT L1 与 UI-01 用户原图在标题、蓝色横幅、六入口、今日任务、推荐服务、底部导航上逐项一致。 | PPT 第5页 L1 + 用户 UI-01 原图。 | PPT L1 的 canonical global 对应改为 UI-01。 |
| UI-02 | 与核心首页 L1 的 exact 视觉候选 | `REUSE / HOMOLOGOUS_HOME_VARIANT`：仍保留清晰母版，但不再抢占 UI-01 的 canonical L1 映射。 | `home-screen-ui-crop.png` 与 UI-01 用户原图、PPT L1 的同构布局。 | 保留 UI-01/UI-02 的版本/用户态关系为人工确认项。 |
| 图像统计 | 33 张可读 + 1 `MISSING_IMAGE` | 34 张均有直接图像证据。 | 33 张仓库参考图 + UI-01 用户直接原图。 | `MISSING_IMAGE=0`。 |

## 方法沉淀 / 可复用模板

### 1. 为什么必须区分 `global_ui_id` 与 `ppt_local_sequence`

`global_ui_id` 是全产品 34 页屏幕基线中的稳定身份，用于路由、对象交接、测试名称、报告证据和后续实现切片。`ppt_local_sequence` 只描述某一张 PPT 场景页内部的叙事顺序，例如核心服务的 L1–L6 或社区的 L1–L5。两者不具备天然的一一同号关系：同一个 global UI 可以被多个场景复用，例如 UI-04 同时出现于核心服务和增长优化；同一场景页的局部“第2/5步”也可能只是一个 UI 内部流程状态，不应自动生成新的 global ID。

| 字段 | 用途 | 不应承担的用途 |
|---|---|---|
| `global_ui_id` | 34 页唯一身份、路由/测试/对象血缘锚点。 | 不能被 PPT 页内 L1/L2 或“第2/5步”直接改写。 |
| `ppt_scene_id` | 区分核心服务、增长优化、商城裂变、名师沙龙、社区打卡、客户后台等场景集合。 | 不能被视为 global 业务域以外的临时页面编号。 |
| `ppt_local_sequence` | 描述一个场景页的局部叙事与屏幕排序。 | 不能替代 `global_ui_id`，也不能决定实体、权限或 API 路由。 |
| `mapping_type` | 表示 `EXACT / REUSE / OVERLAP / NO_GLOBAL_SCREEN / CONFLICT` 的映射关系。 | 不能被“名称相同”或视觉颜色相同单独决定。 |

### 2. 单张 UI 图像核对的 visual signals

每项映射必须至少同时核对以下四类证据；缺任一类只能降级为 `PARTIAL_VISUAL`、`SEMANTIC_ONLY` 或待人工确认，不能写作 exact。

| signal class | 必查内容 | 例子 |
|---|---|---|
| 图像视觉结构 | 顶栏、主横幅、卡片布局、tab、底部导航、颜色和图标组合。 | UI-05 的橙色“开始执行计划”、周时间线与 3/12/36/90 统计。 |
| 可见文案标题 | 页面标题、CTA、任务/服务/资产标签、步骤文字。 | UI-21 的“在线咨询/预约”“确认预约”和四步流程。 |
| 业务动作 | 用户从页面可以读取、选择、草拟、确认、外发或回流的行为。 | UI-15 邀请、UI-26 发布、UI-31 继续打卡。 |
| 数据对象与能力边界 | 该画面读取或提出的对象，以及是否需要 consent、FamilyDecision、Named Action、adapter 或 Human Gate。 | UI-19 使用 Provider/Offering；UI-32 使用订单/权益投影；UI-27 不能写永久 outcome Fact。 |

可复用记录行模板如下。

| ui_image_file | visual_signals | ppt_scene_id | ppt_local_sequence | ppt_visual_signals | candidate_global_ui_id | visual_match_level | mapping_type | evidence_note | conflict_or_gap |
|---|---|---|---|---|---|---|---|---|---|
| `<single-image-or-user-anchor>` | `<layout + title + CTA>` | `<scene>` | `<L#>` | `<same four signals>` | `<UI-##>` | `EXACT_VISUAL / PARTIAL_VISUAL / SEMANTIC_ONLY / NO_VISUAL_MATCH / MISSING_IMAGE` | `EXACT / REUSE / OVERLAP / NO_GLOBAL_SCREEN / CONFLICT` | `<source paths and checked signals>` | `<explicit ambiguity>` |

### 3. 对不完整或重复证据的处理规则

| 情形 | 审计动作 | 是否可进入动态化 |
|---|---|---|
| `MISSING_IMAGE` | 记录预期 anchor、缺失原因和需要补充的原图；不以名称或记忆补写视觉信号。 | 否，除非用户/规格补充 P0/P2 图像。 |
| `REUSE` | 一张 global UI 被多个 PPT 场景复用时保留一个 global ID，记录所有场景来源。 | 可以；但需确认同一对象和边界，不能因复用重复建设功能。 |
| `CONFLICT` | 同一视觉或名称对应不同 global 粒度/版本时保留双方来源，写 `correction proposal` 与人类裁决问题。 | 暂不对受影响 ID 开始新动态化。 |
| `PPT-only gap` | PPT local screen 找不到 34 页单图时记录 `NO_GLOBAL_SCREEN`；不强行映射到相近页面。 | 否；需决定新增 global 页面、作为内部状态，还是不纳入交付。 |
| 名称相近但对象不同 | 以业务动作和对象边界拆开映射。 | 分别处理；例如 UI-07/18/30 都是“我的”，但分别属于会员、合伙人资产和客户后台。 |

### 4. READY marker 的精确定义

`34_SINGLE_UI_IMAGE_PPT_VISUAL_AUDIT_READY` **只代表**：六页 PPT 的局部屏幕与可获得的 34 页单图已经完成可追溯视觉比对，映射、缺口和校正提案已经写入。它**不代表** UI-01/UI-02 的版本关系或 UI-03 的 global 页面粒度已被裁决，也不代表任一 UI 已被开发、测试、准入生产或允许绕过数据/AI/Consent/Human Gate 边界。

本 overlay 关闭了 UI-01 的 `MISSING_IMAGE`，但保留两项独立的人类产品信息架构裁决：一是 UI-01 与 UI-02 是否为同一首页的版本替换、并存入口还是不同用户态；二是 P1 `UI-03` 是否维持为独立 global 页面，还是在下一版 global map 归并成 UI-02 测评 flow state。这两项不能由图像相似度单独决定。

### 5. 恢复 UI-05 前的人类确认条件

| confirmation_id | 最小人工确认问题 | 影响 | 确认前处理 |
|---|---|---|---|
| HC-UI01-02 | UI-01 与 UI-02 是“同一首页的版本替换”“并存首页入口”还是“不同角色/渠道用户态”？ | 决定 global UI 的 route alias、首页 projection 和测试 SSOT。 | 不开发 UI-01/02 的新动态化；保留 UI-01 canonical L1、UI-02 homologous variant。 |
| HC-UI03 | `UI-03` 是否保留为独立 global screen，还是归并为 `UI-02` 的测评第2/5步？ | 决定测评流程的 route、事件名、证据行和后续 lineage。 | 不把 UI-03 单独作为动态化起点。 |
| HC-UI05-RESUME | 在已确认 UI-01/02、UI-03 粒度并冻结 global map 后，是否授权恢复 UI-05 的 `plan_draft/read_projection → FamilyDecision → Named Action` 研究主线？ | 允许恢复 UI-05 文档级状态机/边界分析；仍不等于代码实施。 | UI-05 保持暂停。 |

**34_UI_VISUAL_AUDIT_METHOD_LEARNINGS_READY** `50_开发_dev/reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`


---

# User-Confirmed UI-01 / UI-02 Resolution Overlay

> **裁决来源。** 用户直接提供并明确标注两张清晰单图：第一张为 **UI-01 家庭成长平台首页**，第二张为 **UI-02 家庭测评（第 2/5 步）**。这一直接 P0 用户确认高于此前因参考目录缺文件、主计划粒度歧义而产生的推断。
>
> **范围控制。** 本 overlay 只裁决 UI-01、UI-02 与 PPT 第5页核心服务 L1/L2 的关系；不基于“局部 L3–L6 必然等于 global UI-03–UI-06”的假设，自动重编号其余页面。后续 global UI-03 至 UI-34 将在其各自单图 P0 证据或用户确认下继续复核。

| resolution_id | direct user-confirmed global UI | direct visual anchor | PPT local screen | corrected mapping | visual basis | status |
|---|---|---|---|---|---|---|
| R-UI01 | UI-01 家庭成长平台首页 | 会话附件 `pasted_file_d59x8O_image.png` | `CORE_GROWTH:L1` 首页 | `CORE_GROWTH:L1 → UI-01` | 同一“家庭成长平台”标题、免费家庭测评横幅、六入口、今日成长任务、推荐内容/服务和首页导航。 | CONFIRMED |
| R-UI02 | UI-02 家庭测评 | 会话附件 `pasted_file_ugLcqV_image.png` | `CORE_GROWTH:L2` 家庭测评 | `CORE_GROWTH:L2 → UI-02` | 同一“家庭测评”标题、第2/5步、五个关注方向、补充信息和“下一步”。 | CONFIRMED |

## Superseded Visual-Audit Conclusions

| earlier conclusion | correction | reason | remaining confirmation |
|---|---|---|---|
| UI-01 = `MISSING_IMAGE`。 | UI-01 = `EXACT_VISUAL`，直接 P0 用户确认。 | 原图存在于会话视觉证据，不在仓库参考目录不等于页面缺失。 | 无。 |
| `CORE_GROWTH:L1 → UI-02`，且 UI-01/UI-02 首页关系待裁决。 | `CORE_GROWTH:L1 → UI-01`。 | 用户确认 UI-01 原图；其视觉与 PPT L1 四类信号 exact。 | UI-02 仓库同构首页图是旧版/替代版/另一个入口的关系可后续注明，但不阻塞 UI-01。 |
| `CORE_GROWTH:L2 → UI-03`，并将其视为 UI-03 的粒度冲突。 | `CORE_GROWTH:L2 → UI-02`；“第2/5步”是 UI-02 内部 flow state。 | 用户直接确认 UI-02 原图。 | 后续需逐一重验 UI-03 及其后页面的 existing master-plan ID 是否受旧偏移影响。 |
| 图像统计：33 direct + 1 missing。 | 图像统计：34 direct P0/P2 visual anchors。 | UI-01 新 P0 附件补足单图。 | `MISSING_IMAGE=0`。 |

## Revised Gate Meaning

`34_SINGLE_UI_IMAGE_PPT_VISUAL_AUDIT_READY` 仍然表示图像级审计产物已完成；本 overlay 将 UI-01 和 UI-02 的首页/测评映射裁决为 confirmed。它**不自动确认**旧主计划中 UI-03 至 UI-34 的编号没有被此前“将测评第2/5步列为 UI-03”影响。为了避免重新引入以局部 PPT 顺序替代 global ID 的错误，后续页面继续采用“单图 P0 + PPT visual signals + 用户/架构师确认”的逐页复核方式。

**34_UI01_UI02_USER_CONFIRMATION_OVERLAY_READY** `50_开发_dev/reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`


---

# User-Confirmed UI-01 / UI-02 / UI-03 Deduplication Overlay

> **硬边界。** 用户直接确认的三张单图只裁决 global UI-01、UI-02、UI-03 及 PPT 第5页 `CORE_GROWTH:L1/L2/L3`。本 overlay **不自动顺延、不重排、不改写 UI-04 至 UI-34 的 `global_ui_id`**；后续页面只有在获得其对应用户原图或已经确认的 source anchor 后，才能单独发起校正。

## A. 三张用户确认原图与 PPT 第5页 L1/L2/L3 的去重映射

| global_ui_id | 用户直接确认的单图 | 可见视觉信号 | PPT local screen | 去重后的 mapping | 状态 |
|---|---|---|---|---|---|
| UI-01 | 会话附件 `pasted_file_d59x8O_image.png` | 家庭成长平台、免费家庭测评横幅、六入口、今日成长任务、推荐内容/服务、首页导航。 | `CORE_GROWTH:L1` 首页 | `L1 → UI-01`，`EXACT_VISUAL`。 | CONFIRMED |
| UI-02 | 会话附件 `pasted_file_ugLcqV_image.png` | 家庭测评、第2/5步、五个关注方向、补充信息、下一步。 | `CORE_GROWTH:L2` 家庭测评 | `L2 → UI-02`，`EXACT_VISUAL`；第2/5步是 UI-02 内部状态。 | CONFIRMED |
| UI-03 | 会话附件 `pasted_file_DkGyu2_image.png` | AI成长诊断、成员/测评卡、五维雷达、72良好、孩子得分/同龄平均图例、问题标签、建议、生成个性化方案。 | `CORE_GROWTH:L3` AI诊断报告 | `L3 → UI-03`，`EXACT_VISUAL`。 | CONFIRMED |

## B. 受控去重规则

| evidence collision | 处理 | 本轮是否改 global ID |
|---|---|---|
| 仓库中 `home-screen-ui-crop.png` 与用户 UI-01 原图、PPT L1 同构。 | 将其标记为 UI-01 的 **homologous reference variant**，不能再作为将 L1 映到 UI-02 的理由。 | 否；UI-02 已由用户 P0 测评图直接确认。 |
| 仓库中 `family-assessment-step2-reference-326x862.png` 与用户 UI-02 原图、PPT L2 同构。 | 作为 UI-02 的仓库清晰参考版本；“第2/5步”不再单列为 UI-03。 | 否；UI-02 已确认。 |
| 仓库中 `ai-growth-diagnosis-reference-436x1118.png` 与用户 UI-03 原图、PPT L3 同构。 | 作为 UI-03 的仓库清晰参考版本；其此前被旧主计划赋予的 UI-04 语义仅保留为历史 source-label 冲突。 | **否**；不因这一证据碰撞重排 UI-04 或任何后续编号。 |

## C. Superseded Conclusions and Preserved Boundaries

| earlier conclusion | replacement | impact |
|---|---|---|
| `CORE_GROWTH:L2 → UI-03`，并把第2/5步当作 UI-03 独立 screen。 | `CORE_GROWTH:L2 → UI-02`；这是 UI-02 内部 flow state。 | UI-03 从该测评步骤映射中去重。 |
| AI 成长诊断由仓库 reference 暂映为 UI-04。 | 用户直接确认 `CORE_GROWTH:L3 → UI-03`。 | UI-03 的 P0 视觉锚点闭合。 |
| 根据前三屏变化推断 UI-04 及以后应整体前移。 | 明确禁止。UI-04–UI-34 的既有 global IDs、映射行和 source anchors 保持原样。 | **未重排后续编号。** |

## D. Revised Method / Human Confirmation Scope

用户 P0 原图优先于“仓库参考图文件名”和“PPT 局部顺序”解决同一屏视觉身份；但它只裁决被直接提供的 global UI。即使 PPT 第5页 L4–L6 与用户确认的前三页是连续叙事，也不得因此推定 L4 必然是 UI-04、L5 必然是 UI-05，或使 UI-04–UI-34 自动改号。

恢复某个后续页面的动态化研究前，必须满足：该页面的 global ID 具有用户 P0 原图、或经架构师确认的 source anchor；其 PPT local sequence、可见动作和对象边界能够与该 global ID 对照；任何与既有 global ID 的不一致都要新增 correction proposal，而不能在全表做连锁替换。

**34_UI01_UI02_UI03_USER_DEDUP_READY** `50_开发_dev/reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`

**NO_CASCADE_RENUMBER_UI04_TO_UI34**：已执行；UI-04 至 UI-34 未在本 overlay 中重排或修改。
