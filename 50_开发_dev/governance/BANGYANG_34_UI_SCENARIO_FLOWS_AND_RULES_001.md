# Family / 伐木累 34 页 UI：业务场景、闭环流程与规则拆解 001

> **状态：** `DRAFT_FOR_DEV_MOCK_MASTER_CONTROL`
> **范围：** 本文从 **34 页清晰单页 UI、3 份 PPT、6 条闭环路径图** 提炼 DEV/mock 可体验流程。PPT/UI 均是场景与需求证据，**不是生产事实、真实数据授权、支付/预约/咨询/社区运营授权或效果证据**。
> **历史素材 alias：** 原素材/历史命名：榜样教育（Bangyang）；规范产品名：Family / 伐木累。

## 1. 共同术语与边界

| 术语 | 本文含义 | DEV/mock 实现上限 | 生产含义 |
|---|---|---|---|
| `Test Action`（兼容既有 `mock.action.*` 名称） | 受控、可追踪、幂等的测试动作，形如 `mock.action.createAssessmentSession` | 驱动真实领域状态机、测试数据库/测试存储与审计；必须带 `environment=DEV` 与 `source=TEST_FIXTURE` | 不能绕过真实 Named Action 与授权边界 |
| `DEV LLM` | 真实模型调用、最小化合成快照、严格输出契约和 Gateway | 生成受验证的说明草稿；可回放、可阻断、不可训练 | 不得处理真实家庭数据、获得事实写权、调用未授权工具或产生生产副作用 |
| `测试订单/预约/互动` | 通过真实领域状态机与 API 生成的测试业务状态 | 使用 test/sandbox adapter 产生数据库记录、回执、幂等与审计 | 不得触发生产收费、真实通知、真实履约、真人联系或跨家庭可见 |
| `页面出口` | 当前页面中可点击到的下一页面或安全返回路径 | 通过显式路由和受控 mock action 驱动 | 不应被 UI 文案隐式升级为真实服务结果 |
| `异常/未完成态` | 暂停、返回、NO_ACTION、取消、无可用 mock、上下文缺失等 | 必须可见、可回放、零副作用 | 生产应另行接受 Human Gate 与合规验证 |

### 1.1 全局业务规则

| 规则 ID | 规则 | DEV/mock 强制要求 |
|---|---|---|
| R-01 | 测试数据隔离 | 所有数据使用固定测试家庭、测试儿童、测试服务者、测试商品和测试内容；禁止真实家庭/儿童数据。 |
| R-02 | 来源可追踪 | 每个 mock 对象和事件具备 `environment=DEV`、`source=MOCK`、`fixture_version`、`journey_id`、`action_id`。 |
| R-03 | 受控动作 | 修改模拟状态只能经显式 Mock Action；自由文本、图片、语音和 Mock AI 输出不得直接写核心 Ontology。 |
| R-04 | 身份与范围 | 即使在 DEV，路由也必须保留测试 principal、测试 family scope 和测试 consent 的显式检查。 |
| R-05 | 可退出 | 所有闭环都支持返回、暂停、取消或 `NO_ACTION`；未完成状态不得偷偷创建计划、订单、预约或互动。 |
| R-06 | 禁止事实越权 | UI 中出现“诊断、成长值、榜单、订单、预约、积分、权益、粉丝”等展示，不得被解释为真实事实。 |
| R-07 | DEV 真实 LLM 边界 | 允许真实模型调用，但只传合成/测试最小快照，全部经 Gateway、allowlist、工具白名单、输出验证、审计和 Kill Switch；禁止训练、微调、真实数据、真实对话记忆或模型输出直接写入核心状态。 |
| R-08 | 审计最小化 | 每次 mock action 记录动作名、测试对象、前后状态、页面、fixture 版本和时间；不记录不必要原文。 |

## 2. 闭环一：核心服务闭环

> **路径：** 家庭成长平台首页 → 家庭成长体检 → AI 成长诊断报告 → 90 天成长方案 → 陪跑服务 / 社群服务 → 我的 / 会员中心。

### 2.1 场景、角色与状态

| 项目 | 定义 |
|---|---|
| 主角色 | 测试家长（测试家庭的 guardian principal） |
| 辅角色 | 测试儿童档案（只读 fixture）、Mock AI、Mock 陪跑服务、Mock 会员中心 |
| 起始输入 | 测试家庭进入首页；可点击“免费家庭测评” |
| 核心状态 | `HOME_READY → ASSESSMENT_ENTRY → ASSESSMENT_STEP_2 → MOCK_REPORT_READY → MOCK_PLAN_READY → MOCK_SERVICE_ACTIVE → MOCK_MEMBER_SUMMARY` |
| 页面输出 | 固定 mock 测评偏好、固定 mock 报告、固定 90 天计划、固定陪跑状态和 mock 会员摘要 |
| 成功出口 | 进入“我的服务 / 我的”静态可回放视图 |
| 安全出口 | `PAUSED`、`NO_ACTION`、`RETURN_HOME`、`MOCK_CONTEXT_BLOCKED` |

### 2.2 受控 Mock Action

| 动作 | 前置条件 | 状态变更 | 输出 | 禁止行为 |
|---|---|---|---|---|
| `mock.action.start_assessment` | DEV、测试 principal、测试 family scope、fixture 存在 | `HOME_READY → ASSESSMENT_ENTRY` | fixture ID、journey ID | 不创建真实 Need/Intent |
| `mock.action.select_assessment_option` | 测评会话有效、选项来自固定枚举 | 更新 `mock_selected_option` | 固定选项与版本 | 不接收自由文本、儿童直接作答或量表评分 |
| `mock.action.generate_dev_report` | 固定选项已选、真实 LLM Gateway 已启用、测试 fixture/consent/范围有效 | `ASSESSMENT_STEP_2 → DEV_REPORT_READY` | 已验证报告草稿 ID + 审计 ID | 不诊断、不预测、不写入真实 Plan/Case 或核心事实 |
| `mock.action.accept_mock_plan` | 固定报告可见、测试 consent 有效 | `MOCK_REPORT_READY → MOCK_PLAN_READY` | 固定计划 ID | 不创建真实 Plan/Case/Task |
| `mock.action.start_mock_service` | mock 计划存在 | `MOCK_PLAN_READY → MOCK_SERVICE_ACTIVE` | mock service session | 不联系真人、不创建真实服务交付 |
| `mock.action.no_action` | 任意可退出页面 | 状态进入 `NO_ACTION` | 审计回执 | 不生成计划、订单、服务或提醒 |

### 2.3 关键规则与异常路径

| 情况 | DEV 行为 | 不得发生 |
|---|---|---|
| 测试 consent 被撤回 | 停止后续 mock action，显示测试安全停止页 | 保留或推进 mock 服务状态 |
| fixture 版本不一致 | 显示“测试样例版本不可用”，回到首页 | 使用过期样例生成报告 |
| 用户选择暂停 | 记录 `mock.action.pause_journey`，保留只读回放 | 自动继续方案或服务 |
| 请求真实诊断/真人咨询 | 显示固定边界说明 | 诱导补充敏感信息或转接真人 |
| DEV LLM 输出/策略/配置异常 | Gateway 返回固定 block 模板与文本等价路径；缺 key 时零网络调用 | 展示未验证原文、绕过 Gateway、写入核心 Ontology |

## 3. 闭环二：增长闭环

> **路径：** 家庭成长体检 → AI 体检报告 → 每日任务 / AI 管家 → 孩子端成长助手 → 成长排行榜 → 成长报告海报 / 一键分享。

### 3.1 场景、角色与状态

| 项目 | 定义 |
|---|---|
| 主角色 | 测试家长；测试儿童仅显示为固定 fixture，不直接收集输入 |
| 辅角色 | Mock AI 管家、Mock task engine、静态榜单和静态海报渲染器 |
| 起始输入 | 核心服务闭环的 mock 报告或首页增长入口 |
| 核心状态 | `MOCK_REPORT_READY → MOCK_DAILY_TASKS_READY → MOCK_TASK_PROGRESS → MOCK_CHILD_VIEW → STATIC_RANKING_VIEW → STATIC_GROWTH_POSTER` |
| 页面输出 | 测试任务状态、固定成长能量、静态榜单、静态海报 |
| 成功出口 | 返回首页、我的服务或静态海报 |
| 安全出口 | 任务暂停、NO_ACTION、固定 Mock AI block |

### 3.2 受控 Mock Action

| 动作 | 前置条件 | 输出 | 规则 |
|---|---|---|---|
| `mock.action.load_daily_tasks` | 固定 mock 计划存在 | 三项固定任务 | 不从真实家庭数据推导 |
| `mock.action.toggle_task_completion` | 任务 ID 来自 fixture | mock task status | 幂等；仅写 mock store |
| `mock.action.open_child_view` | 测试家庭环境 | 固定孩子端视图 | 不收集儿童直接输入 |
| `mock.action.show_static_ranking` | DEV fixture 启用 | 静态排名页 | 禁止真实跨家庭比较或排名计算 |
| `mock.action.render_static_poster` | 固定 mock 成果记录 | 海报预览 | 禁止真实分享、二维码追踪、成长效果结论 |

### 3.3 规则与异常路径

| 规则 | 说明 |
|---|---|
| 成长值仅是 mock 展示字段 | 不得映射为儿童能力、心理状态、成长效果或永久标签。 |
| 榜单必须静态化 | UI 可复刻；数据必须来自固定 fixture，不能按真实家庭聚合。 |
| 海报只能预览 | 分享按钮只允许内部返回或 mock 回执，不打开系统分享、不生成真实二维码。 |
| 未完成任务 | 展示未完成态、返回和暂停；不得把任务未完成作为惩罚、排名或推荐依据。 |

## 4. 闭环三：商城闭环

> **路径：** 裂变商城首页 → 商品详情 → 邀请有礼 → 拼团专区 → 积分商城 / 任务中心 → 我的收益 / 会员中心。

### 4.1 场景、角色与状态

| 项目 | 定义 |
|---|---|
| 主角色 | 测试家长 / 测试成长合伙人 |
| 辅角色 | Mock 商品目录、Mock order、Mock invite、Mock group、Mock points ledger |
| 核心状态 | `MOCK_MALL_BROWSE → MOCK_PRODUCT_DETAIL → MOCK_INVITE_PROGRESS / MOCK_GROUP_VIEW / MOCK_POINTS_VIEW → MOCK_PARTNER_ASSET_VIEW` |
| 允许输出 | mock SKU、mock 价格、mock 邀请进度、mock 拼团展示、mock 积分/资产展示 |
| 禁止输出 | 支付结果、真实优惠券、真实提现、真实分佣、真实履约、真实商品库存 |

### 4.2 受控 Mock Action

| 动作 | 输入 | 输出 | 异常/未完成态 |
|---|---|---|---|
| `mock.action.view_product` | fixture SKU ID | 静态商品详情 | SKU 不存在则返回 mall fixture 首页 |
| `mock.action.create_mock_invite` | fixture invite campaign ID | invite progress + audit receipt | 不发送外部链接或消息 |
| `mock.action.create_mock_group` | fixture group product ID | mock group ID / 成团进度 | 不扣款、不通知、不履约 |
| `mock.action.redeem_mock_points` | fixture item ID | mock redemption receipt | 积分不足显示 mock 未完成态 |
| `mock.action.open_mock_asset` | fixture partner ID | 静态资产/会员页 | 不显示真实可提现金额 |

### 4.3 业务规则

1. 所有金额、价格、会员折扣、奖励和人数都是测试 fixture 字段，必须以 `mock` 来源可追溯。
2. “立即购买”“发起拼团”“立即兑换”“邀请好友”等 UI 行为只能产生内部模拟回执或页面状态切换。
3. 不得调用支付、物流、库存、外部消息、真实推广或分佣结算系统。
4. 订单与权益的 mock action 仍需具备幂等键，避免一次点击生成多个模拟订单。

## 5. 闭环四：名师沙龙闭环

> **路径：** 名师栏目首页 → 名师详情 → 在线咨询 / 预约 → 线下沙龙列表 → 活动详情 / 报名 → 我的预约 / 我的活动。

### 5.1 场景、角色与状态

| 项目 | 定义 |
|---|---|
| 主角色 | 测试家长 |
| 辅角色 | Mock 名师目录、Mock 咨询时段、Mock 沙龙、Mock 活动、Mock 服务记录 |
| 核心状态 | `MOCK_TEACHER_DIRECTORY → MOCK_TEACHER_DETAIL → MOCK_BOOKING_DRAFT → MOCK_SALON_LIST → MOCK_EVENT_DETAIL → MOCK_SERVICE_RECORD` |
| DEV 页面输出 | 静态名师资料、固定时段、模拟预约回执、模拟活动报名状态、服务记录 |
| 生产禁止 | 真人顾问服务、真实电话/视频/线下咨询、真实预约、真实活动、真实报名、支付 |

### 5.2 受控 Mock Action

| 动作 | 输入 | 输出 | 必要审计 |
|---|---|---|---|
| `mock.action.select_teacher` | fixture teacher ID | 静态名师详情 | teacher fixture 版本 |
| `mock.action.draft_booking` | fixture teacher/slot/channel | mock booking draft | action ID、slot、mock provider |
| `mock.action.confirm_mock_booking` | mock booking draft | mock booking receipt | 幂等键、状态前后值 |
| `mock.action.view_salon` | fixture city/topic | 静态沙龙列表 | filter fixture |
| `mock.action.confirm_mock_event` | fixture event ID | mock enrollment receipt | 不发送通知、不产生收费 |

### 5.3 异常路径

| 情况 | DEV/mock 行为 |
|---|---|
| 时段不可用 | 显示固定“测试时段不可用”，返回时段选择；不提供真实替代时段。 |
| 请求真人联系 | 显示静态边界说明；不收集电话、地址、身份资料。 |
| 活动满额 | 展示固定满额状态；不自动候补、通知或收集联系方式。 |

## 6. 闭环五：社区闭环

> **路径：** 社区首页 / 交流广场 → 发帖 / 打卡分享 → 成果展示 / 荣誉激励 → 互动评论 / 家长互助 → 我的社区 / 社群资产。

### 6.1 场景、角色与状态

| 项目 | 定义 |
|---|---|
| 主角色 | 测试家长 |
| 辅角色 | 固定 mock 内容作者、Mock post、Mock reaction、Mock challenge、静态荣誉展示 |
| 核心状态 | `STATIC_COMMUNITY_FEED → MOCK_POST_DRAFT → MOCK_POST_RECEIPT → STATIC_OUTCOME_VIEW → STATIC_DETAIL_VIEW → STATIC_COMMUNITY_PROFILE` |
| 允许输出 | 固定内容流、固定评论、mock 发布回执、静态挑战进度、静态社区资产 |
| 禁止输出 | 真实跨家庭可见、真实自由文本发布、真实评论/私聊/关注、真实审核、真实社群积分 |

### 6.2 受控 Mock Action

| 动作 | 输入 | 输出 | 禁止行为 |
|---|---|---|---|
| `mock.action.open_post_draft` | 固定内容类型枚举 | mock draft | 不接收/保存自由文本为核心事实 |
| `mock.action.publish_fixed_post` | fixture post template ID | mock receipt | 不向其他用户或外部服务发布 |
| `mock.action.open_static_detail` | fixture post ID | 静态动态详情 | 不写真实互动状态 |
| `mock.action.open_static_profile` | fixture profile ID | 静态我的社区 | 不建立真实关注、粉丝或关系图 |
| `mock.action.open_outcome` | fixture outcome ID | 静态成果页 | 不证明成长结果、不生成永久标签 |

### 6.3 社区规则

1. UI 中的“评论、关注、求助、热门、社区等级、积分、挑战”等仅能显示测试 fixture 状态。
2. Mock 发布 action 不得把图片、语音、自由文本写入核心 Ontology；可在隔离 mock store 存固定模板 ID 和测试事件。
3. 所有跨家庭、跨组织、外部可见、私聊、审核和推荐均持续 HOLD。

## 7. 闭环六：客户后台核心闭环

> **路径：** 我的首页 / 客户总览 → 我的服务 / 陪跑进度 → 我的订单 / 资产权益 → 家庭档案 / 报告中心 → 咨询活动 / 客服支持。

### 7.1 场景、角色与状态

| 项目 | 定义 |
|---|---|
| 主角色 | 测试家长 |
| 辅角色 | Mock member summary、Mock service plan、Mock order/asset、Mock family profile、Mock service record |
| 核心状态 | `MOCK_CUSTOMER_HOME → MOCK_SERVICE_PROGRESS → MOCK_ORDER_ASSET → MOCK_FAMILY_PROFILE → MOCK_SERVICE_RECORD` |
| 页面输出 | 固定会员总览、服务进度、订单资产、家庭档案、咨询/活动/客服记录 |
| 禁止输出 | 真实会员身份、真实权益、真实订单、真实服务记录、真实档案、真实客服联络 |

### 7.2 受控 Mock Action

| 动作 | 前置条件 | 状态输出 | 规则 |
|---|---|---|---|
| `mock.action.open_customer_home` | 测试 principal + family fixture | mock summary | 只读 fixture |
| `mock.action.open_service_progress` | mock service fixture 有效 | mock task list | 不创建真实任务 |
| `mock.action.open_order_asset` | mock customer fixture 有效 | mock order/asset summary | 禁止支付、提现、权益核销 |
| `mock.action.open_family_profile` | mock family fixture 有效 | 静态时间线 | 禁止真实诊断、永久档案、跨家庭访问 |
| `mock.action.open_service_record` | mock service fixture 有效 | 静态咨询/活动/客服记录 | 禁止真人联络与真实售后 |

### 7.3 客户后台规则

1. “身份沉淀、服务跟进、档案记录、权益复购、转介绍裂变”是 PPT 的经营设计证据，DEV 中只能展示为 mock journey，不构成真实运营能力。
2. 家庭档案必须保持家庭范围隔离；DEV 页面只能使用固定 fixture family，不能让测试 UI 读取真实数据库家庭记录。
3. 所有订单、积分、权益和奖励都使用 mock ledger；绝不混用真实订单表或真实支付状态。

## 8. 六条闭环统一异常状态

| 状态 | 触发条件 | 页面行为 | Mock Action | 禁止副作用 |
|---|---|---|---|---|
| `RETURN` | 用户点击返回 | 返回上游页面 | `mock.action.return` | 不删除或推进下游状态 |
| `PAUSED` | 用户暂停 | 保留只读回放入口 | `mock.action.pause_journey` | 不自动提醒、转服务或创建订单 |
| `NO_ACTION` | 用户明确不继续 | 显示确认回执 | `mock.action.no_action` | 不创建计划、任务、订单、预约、互动 |
| `MOCK_CONTEXT_BLOCKED` | 测试 principal/family/fixture 缺失 | 固定安全停止说明 | `mock.action.block_context` | 不降级为匿名真实访问 |
| `FIXTURE_UNAVAILABLE` | fixture 或版本不匹配 | 提示测试样例不可用 | `mock.action.block_fixture` | 不回退到真实数据 |
| `BOUNDARY_BLOCKED` | 行为请求越过 DEV 边界 | 固定边界说明 | `mock.action.block_boundary` | 不发起支付、外发、真人联系、模型外呼 |

## 9. B 阶段修改文件与后续输入

| 文件 | 作用 |
|---|---|
| `governance/BANGYANG_34_UI_SCENARIO_FLOWS_AND_RULES_001.md` | 本文；六条闭环的角色、状态、规则、异常和 mock action 拆解。 |
| `governance/BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md` | A 阶段证据清单和 34 页基线；C 阶段将把本规则文件纳入主计划。 |
| `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` | D 阶段只在引用 A/B 证据后更新相关架构章节。 |

> **B 阶段结论：** DEV 要实现完整的真实可运行闭环：每个业务语义均需落到显式的 `Test Action（兼容 mock.action 名称）+ 测试数据 + 数据库/测试存储 + API + 审计回执 + 受控外部 adapter`，而非静态图、固定回执或自由文本。生产外部副作用仍通过 test/sandbox adapter 隔离。
