# UI-04 至 UI-10：PPT 第6页与第8页视觉核对及差距分析

**文档编号：** `UI04_UI10_PPT06_PPT08_VISUAL_GAP_ANALYSIS_001`
**范围：** 同一份《榜样教育新商业模式对外宣发PPT_原图版(2)》第 6 页“增长优化场景 UI 设计补充”与第 8 页“分享裂变商城方案构思”；global UI-04 至 UI-10 的单张参考图。
**方法：** 对每个候选映射同时比较视觉结构、可见文案、用户动作与对象/能力边界。PPT 局部序号仅为场景页内部顺序，不能改写 global UI ID。
**本轮约束：** 不修改 UI-01 至 UI-03 的用户确认映射；不重排 UI-04 至 UI-34；不修改代码、不 `git add`、不提交、不推送。

## 1. 审计结论

PPT 第 6 页为**增长执行闭环**：家庭体检、AI 体检报告、每日任务、孩子端助手、排行榜、成长海报。它与 UI-04、UI-08、UI-09、UI-10 存在直接视觉复用；但其局部 L2 报告与用户已确认的 global UI-03 AI 成长诊断报告同构，因此不能据此重排 UI-04。PPT 第 8 页为**分享裂变商城闭环**：商城、商品、邀请、拼团、积分和合伙人资产。它与 UI-04 至 UI-10 没有直接的商城视觉复用，只把“免费测评入口”和“生成成长报告”作为商业漏斗的上游触点。

> **重要边界：** “测评/报告可进入商业漏斗”不等于将家庭诊断报告、成长任务或儿童数据改写为商城交易事实；商城商品、订单意向、邀请和积分权益仍属于独立的 Commerce/Referral 子系统。

## 2. 图像级交叉核对矩阵

| global_ui_id | 单图素材与主要视觉信号 | PPT 第6页候选屏 | 第6页视觉结论 | PPT 第8页候选屏 | 第8页视觉结论 | 对象与能力边界 | 本轮状态 |
|---|---|---|---|---|---|---|---|
| UI-04 | `ai-growth-diagnosis-reference-436x1118.png`；成员测评卡、五维雷达、72 良好、孩子/同龄图例、问题标签、建议、方案 CTA。 | 增长 L2“AI体检报告”。 | `EXACT_VISUAL`：雷达、中心分、问题/建议、蓝色方案 CTA 均同构。 | 商业链 L2“生成成长报告”（业务节点，非单独报告屏）。 | `SEMANTIC_ONLY`：报告被视为商业漏斗触点，非相同页面。 | Report explanation / recommendation；分数、同龄比较、标签不能写为 Fact 或 ranking。 | `REUSE`；需保留 global UI-04 不变。 |
| UI-05 | `growth-plan-90day-reference-434x1130.png`；90天、3/12/36/90、周时间线、任务三态、橙色开始 CTA。 | 无直接方案屏；第6页推荐成长周期为 7/30/90 天。 | `PARTIAL_VISUAL`：存在 90 天周期语义，但无相同计划页面。 | L2 商品详情含“21天亲子沟通挑战营”；L4 拼团含“90天成长陪跑计划”商品卡。 | `SEMANTIC_ONLY`：商品/SKU 展示非家庭计划投影。 | Plan draft/read projection → FamilyDecision → 后续 Named Action；绝不自动建 Journey/Task。 | `NO_DIRECT_VISUAL_REUSE`。 |
| UI-06 | `delivery-community-reference-458x1128.png`；顾问/班主任/AI/专家、78%进度、打卡/交流/直播。 | 每日任务与孩子助手屏有进度/陪伴语义。 | `PARTIAL_VISUAL`：共享“执行/陪伴”语义，无同一服务交付屏。 | 商城商品权益出现“训练营 + 打卡社群 + 顾问答疑”。 | `SEMANTIC_ONLY`：权益文案不是陪跑服务记录。 | Service supply / service record / community read projection；真人服务、直播、通知为 Human Gate/adapter。 | `NO_DIRECT_VISUAL_REUSE`。 |
| UI-07 | `mine-member-reference-434x1124.png`；年度会员、积分/等级/亲子币、报告/计划/订单/邀请、会员权益。 | 无“我的/会员中心”同屏。 | `NO_VISUAL_MATCH`。 | L6“我的收益/会员中心”有会员与资产卡。 | `PARTIAL_VISUAL`：同为会员/资产终页，但裂变合伙人指标、订单/邀请对象不同。 | Membership entitlement read projection；不得将裂变奖励并入家庭会员资产。 | `OVERLAP`，对象域须隔离。 |
| UI-08 | `family-assessment-entry-reference-428x952.png`；家庭成长体检、第1/5步、五维、测评入口。 | 增长 L1“家庭成长体检入口”。 | `EXACT_VISUAL`：蓝横幅、五维、进度、问题卡与测评 CTA 同构。 | 商业链 L1“免费测评入口”（业务节点）。 | `SEMANTIC_ONLY`：同一入口被商业场景引用，非页面视觉复用。 | Assessment intake draft；家庭/成员/consent/量表版本、证据与审计。 | `EXACT`（第6页）；商业引用不改变对象边界。 |
| UI-09 | `daily-growth-task-reference-448x916.png`；AI 管家、三任务、78%、连续打卡、完成今日任务。 | 增长 L3“每日任务 / AI管家”。 | `EXACT_VISUAL`：提示、任务、完成度、CTA 和打卡天数同构。 | 无任务执行同屏。 | `NO_VISUAL_MATCH`。 | Task projection / controlled action；完成态须幂等、family scope、consent；无外部 effect。 | `EXACT`（第6页）。 |
| UI-10 | `growth-child-assistant-reference-448x920.png`；儿童成长助手、能量、训练/阅读/情绪/目标、开始挑战。 | 增长 L4“孩子端成长助手”。 | `EXACT_VISUAL`：儿童端卡片、能量、挑战和目标同构。 | 商品详情的挑战营插画/产品。 | `SEMANTIC_ONLY`：SKU 内容营销非儿童端运行屏。 | Child Subject 适龄互动；输入/输出受 consent、年龄策略、Human Gate；AI 不写核心事实。 | `EXACT`（第6页）。 |

## 3. 场景覆盖与差距

### 3.1 PPT 第6页覆盖情况

PPT 第6页对 UI-04 至 UI-10 的覆盖不是连续 global ID 对应，而是一个交叉切片：UI-04 作为报告复用、UI-08 作为体检入口、UI-09 作为任务执行、UI-10 作为儿童端参与。它的 L5/L6 视觉则分别落到 UI-11/UI-12，因此不属于本轮主范围。

| 覆盖类型 | UI | 数量 | 结论 |
|---|---|---:|---|
| `EXACT_VISUAL` | UI-04、UI-08、UI-09、UI-10 | 4 | 可作为视觉 SSOT，但仍须遵守各页面对象和安全边界。 |
| `PARTIAL_VISUAL` | UI-05、UI-06 | 2 | 只有周期/执行/陪伴语义，不能映射为同一 screen。 |
| `NO_VISUAL_MATCH` | UI-07 | 1 | 第6页未覆盖核心会员我的页。 |

### 3.2 PPT 第8页覆盖情况

PPT 第8页不直接复用 UI-04 至 UI-10 的页面。它把免费测评和成长报告放在获客、分享、参团、购买和复购的商业漏斗中；真正的单图视觉映射是 UI-13 至 UI-18。因此，对 UI-04 至 UI-10 的正确处理是“保留上游业务关联”，而不是重用第8页的 local sequence 或商城对象。

| 关联类型 | 关联 UI | 说明 | 禁止的错误实现 |
|---|---|---|---|
| 商业漏斗上游 | UI-08 | 免费测评可作为获客入口的来源场景。 | 把家庭测评答案写入 referral、订单或积分事实。 |
| 商业漏斗上游 | UI-04 | 生成成长报告可作为分享/解释触点。 | 以诊断总分、同龄比较或敏感建议决定购买、排序或权益。 |
| 商品内容关联 | UI-05、UI-06、UI-10 | 21天挑战营、90天陪跑、打卡社群和顾问答疑作为商品/权益素材出现。 | 将商品 SKU/团购状态自动转换为家庭 Journey/Task/ServiceRecord。 |
| 会员视觉邻近 | UI-07 | 第8页 L6 是成长合伙人资产；UI-07 是核心会员中心。 | 合并邀请收益、佣金/提现、家庭会员权益三类对象。 |

## 4. 差距、冲突与人工确认登记

| gap_id | 类型 | 受影响 UI | 证据 | 影响 | 处理建议 | 是否阻断本轮视觉审计 |
|---|---|---|---|---|---|---|
| G-04-01 | global ID / source collision | UI-03、UI-04 | 用户确认 UI-03 为 AI诊断；仓库同构报告图先前被标为 UI-04。 | 报告页与 global ID 的旧 source-label 有碰撞。 | 已在 baseline 中只修正 UI-01～03；UI-04 不改号，等待其自身 P0/确认 anchor。 | 否，但阻断 UI-04 动态化。 |
| G-05-01 | 视觉缺口 | UI-05 | 第6页无 90天方案同屏；第8页只有商品/拼团语义。 | 无法以第6/8页证明 UI-05 的完整方案页。 | 以独立 UI-05 原图作为唯一视觉 SSOT；计划页面继续维持 `plan_draft/read_projection`。 | 否。 |
| G-06-01 | 视觉缺口 | UI-06 | 第6页任务/儿童端与第8页商品权益均非服务交付同屏。 | 陪跑服务的服务记录、咨询、直播与社群边界缺 PPT 直接复用。 | 以 UI-06 原图 + 服务供给/服务记录对象为准；外部 action 继续 HOLD。 | 否。 |
| G-07-01 | 名称相似 / 对象重叠 | UI-07 与第8页 L6 | 都是“我的/会员”终页，但一个是核心会员资产，一个是成长合伙人裂变资产。 | 容易错误合并积分、订单、奖励和会员权益。 | 维持 `MembershipEntitlement` 与 `PartnerReferralAsset` 分离投影。 | 否。 |
| G-08-01 | 商业化边界 | UI-08、UI-04 | 第8页把测评/报告作为商业链路起点。 | 可能误把成长解释变成营销决策。 | 测评/报告只提供 explanation/export draft；商业 adapter 独立、受 consent/Human Gate。 | 否。 |
| G-09-01 | 状态机边界 | UI-09 | PPT“完成今日任务”与 UI 原图同构。 | 容易把 UI 点击实现为无条件完成事实。 | 使用 page-object 受控 action、idempotency、family scope、external_effect=false。 | 否。 |
| G-10-01 | 儿童保护 | UI-10 | PPT儿童端助手与单图同构。 | 容易将挑战、能量或情绪内容写为儿童能力标签。 | 只保留适龄 read projection/草稿；Human Gate 和 consent 优先。 | 否。 |

## 5. 可复用的二阶段审计模板

| global_ui_id | image_anchor | ppt6_match | ppt8_match | object_boundary | dynamic ceiling | gap / human confirmation |
|---|---|---|---|---|---|---|
| `UI-##` | `<single image or user P0 anchor>` | `EXACT_VISUAL / PARTIAL_VISUAL / NO_VISUAL_MATCH` | `EXACT_VISUAL / SEMANTIC_ONLY / NO_VISUAL_MATCH` | `<Family / Assessment / Journey / Task / Provider / Asset>` | `L1 / L2 / L3 / L4 HOLD` | `<gap ID or none>` |

## 6. 本轮结论与下一阶段前置条件

本轮完成了 UI-04 至 UI-10 对 PPT 第6/8页的图像级交叉核对。第6页是增长执行场景的视觉来源；第8页是商业化关联来源而不是这些页面的视觉 SSOT。审计没有产生任何 global ID 重排：**UI-04 至 UI-34 未重排**。

下一阶段若要恢复 UI-05 的动态化研究，仍须以 UI-05 自身单图为视觉 SSOT，并先由架构师确认 UI-04 的 global ID/source-label 碰撞如何在全局基线中长期消解。无论确认结果如何，UI-05 的初版只能是 `plan_draft/read_projection`，经 FamilyDecision 才可进入后续受权 Named Action；不自动创建真实 Journey、Task 或 Intervention。

**UI04_UI10_PPT06_PPT08_VISUAL_GAP_ANALYSIS_READY** `50_开发_dev/reports/m2/frontend/UI04_UI10_PPT06_PPT08_VISUAL_GAP_ANALYSIS_001.md`
