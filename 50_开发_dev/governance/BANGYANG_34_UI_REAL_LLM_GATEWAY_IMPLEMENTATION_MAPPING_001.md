# Family / 伐木累 34 页 UI：真实 LLM DEV Gateway 实现映射 001

> **状态：** `DEV_IMPLEMENTATION_INPUT`
> **范围：** 将 34 页 UI、6 条闭环与现有 Family AI Gateway 包映射为真实 LLM 的 DEV 接入清单。调用只处理合成/测试 fixture；模型永远只产出可验证的说明草稿，不写入核心事实链，不决定家庭下一步。
> **历史素材 alias：** 原素材/历史命名：榜样教育（Bangyang）；规范产品名：Family / 伐木累。

## 1. 实现原则

此映射不改写 34 页 UI 的视觉 SSOT，也不把**原素材/历史命名：榜样教育**页面中的“诊断、成长值、排名、购买、预约、社区”等视觉语言升级为真实能力。它要求每条闭环至少具有一个可审计的、真实 LLM 驱动的**受控解释节点**；其余页面可消费同一 journey 的已验证说明草稿，或走文本等价/固定停止路径。这样可以在不改变原图结构的前提下，让真实 LLM 参与完整体验闭环。

| 原则 | 实现要求 |
|---|---|
| 单一入口 | 所有模型调用只能经服务端 Family DEV Gateway；不从 Web bundle、浏览器、页面脚本或 Mock Action 直接调用提供者。 |
| 最小快照 | Context Assembler 仅传 `environment=DEV`、fixture ID/版本、journey/page ID、受控 Need/Intent、候选别名、当前 mock 状态和政策版本。 |
| 结构化输出 | 只接受严格 JSON Schema 的 `EXPLANATION_DRAFT`、`TEXT_EQUIVALENT_DRAFT`、`SAFETY_STOP_DRAFT` 或 `HUMAN_GATE_REQUIRED_DRAFT`。 |
| 工具约束 | 模型只能请求已登记的 Mock Action；工具执行仍由服务端 guard、schema、principal、family fixture、幂等和审计独立验证。 |
| 模型无写权 | 模型输出不得写入 Need、Intent、Decision、NO_ACTION、Plan、Case、Task、Order、Booking、Post、Asset 或真实 Ontology。 |
| 原图优先 | 模型文本只能填入原图已有的说明位、文本等价层或受控说明抽屉；不得生成新的营销卡片、AI 聊天产品壳或改变页面布局。 |
| 失败关闭 | 任何配置、范围、consent、fixture、模型、schema、政策、工具或输出校验问题都不得调用/展示未验证内容；统一回到固定停止与文本等价路径。 |

### 1.1 真实工作流实施口径

本清单中的 `mock.action.*` 是为兼容既有测试命名保留的 **Test Action 名称**。它们必须执行真实的领域验证、状态转换、测试数据库/测试存储持久化、幂等控制、API 返回、adapter 调用与审计回放；不得以静态跳转、固定 toast 或仅前端内存状态替代。`mock/test/sandbox` 仅说明数据与外部副作用被隔离，绝不表示订单、预约、活动、服务、社区、资产或 AI 工作流可以不实现。

| 领域动作 | DEV 必须真实完成 | 外部副作用隔离 |
|---|---|---|
| 报告与方案 | 调用真实 LLM、验证结构化输出、持久化草稿/审计、推动测试状态机 | 测试 fixture；不写真实家庭事实 |
| 任务与服务 | 任务状态、服务进度、暂停/恢复、幂等与审计 | 测试 principal/family 与 test store |
| 订单、积分、资产 | 目录查询、订单/兑换/邀请/拼团状态机、账本与回执 | test/sandbox commerce adapter；不扣真实款 |
| 预约与活动 | 时段、草稿、确认、满额、取消与记录 | test/sandbox booking/event adapter；不联系真人 |
| 社区与记录 | 模板内容、发布回执、详情、资料投影与审计 | test/sandbox community adapter；不对真实用户外发 |

## 2. 统一调用、工具和审计契约

### 2.1 Gateway use case allowlist

| use_case | 可用于 | 输出上限 | 不得执行 |
|---|---|---|---|
| `family.dev.explain_need` | UI-03、UI-08 | 中性解释已选择的支持方向 | 推断 Need、评分、诊断、自动创建计划 |
| `family.dev.explain_report` | UI-04、UI-05 | 解释 fixture 已提供的报告/阶段信息 | 诊断、风险判断、效果承诺、成长结论 |
| `family.dev.explain_task` | UI-06、UI-09、UI-10 | 解释固定任务与可选返回/暂停 | 评价儿童、催促、排名、自动完成任务 |
| `family.dev.explain_mock_commerce` | UI-13–18 | 解释 mock 商品/积分/资产状态与模拟边界 | 销售诱导、价格建议、支付、分佣、外发 |
| `family.dev.explain_mock_service` | UI-19–24、UI-30–34 | 解释 mock 名师/活动/服务记录状态 | 联系真人、预约、报名、转介、收费 |
| `family.dev.explain_mock_community` | UI-25–29 | 解释固定模板内容、mock 回执及退出方式 | 写入自由文本、跨家庭发布、审核/推荐 |
| `family.dev.text_equivalent` | 所有页面 | 与当前已验证状态一致的纯文本等价说明 | 图像推断、额外事实、遗漏退出路径 |
| `family.dev.safety_stop` | 所有页面 | 固定/受控停止理由与返回、暂停、NO_ACTION | 诊断、危机处置、自动转介或索取敏感信息 |

### 2.2 真实 LLM 可请求的工具白名单

模型的 tool call 是**请求**，不是执行授权。除下表外全部拒绝；工具返回只含 mock receipt，不含真实资料或凭证。

| 工具名 | 对应受控 Mock Action | 输入限制 | 最大状态变化 | 适用闭环 |
|---|---|---|---|---|
| `read_fixture_state` | 只读 fixture 投影 | fixture alias、已知 journey/page | 无 | 全部 |
| `propose_return_or_pause` | `mock.action.return` / `mock.action.pause_journey` | 固定枚举 | `RETURN` 或 `PAUSED` | 全部 |
| `propose_no_action` | `mock.action.no_action` | 无自由文本 | `NO_ACTION` | 全部 |
| `propose_select_option` | `mock.action.select_assessment_option` | 固定 L0 选项枚举 | `ASSESSMENT_STEP_2` 内局部状态 | 核心服务/增长 |
| `propose_task_toggle` | `mock.action.toggle_task_completion` | fixture task ID、布尔值 | `MOCK_TASK_PROGRESS` | 增长 |
| `propose_mock_invite_or_group` | `mock.action.create_mock_invite` / `mock.action.create_mock_group` | fixture campaign/SKU ID | mock receipt | 商城 |
| `propose_mock_booking_or_event` | `mock.action.draft_booking` / `mock.action.confirm_mock_booking` / `mock.action.confirm_mock_event` | fixture teacher/slot/event ID | mock receipt | 名师沙龙 |
| `propose_fixed_post_receipt` | `mock.action.publish_fixed_post` | fixture template ID | `MOCK_POST_RECEIPT` | 社区 |

禁止工具：HTTP/浏览器、文件系统、支付、消息外发、数据库 SQL、真实预约、真实搜索、第三方 API、自由文本写入、任何真实 Named Action、任何密钥读取或环境变量回显。

### 2.3 最小快照与审计字段

| 类型 | 允许字段 | 不得包含 |
|---|---|---|
| `JourneySnapshot` | `environment`、`fixture_id`、`fixture_version`、`journey_id`、`page_id`、`mock_state`、`language` | 真实姓名、联系方式、完整家庭档案、儿童原始材料、完整历史对话 |
| `NeedIntentSnapshot` | 受控 Need/Intent enum、已确认状态、copy policy version | 自由文本、模型推断、评分、标签、临床信息 |
| `CandidateSnapshot` | admitted alias、显示名、来源/准入摘要、可用动作、版本 | 未准入资源、外部 URL、支付金额、供应商排序 |
| `GatewayAudit` | request/use case、model ID、prompt/schema/policy version、fixture ID、validator verdict、tool proposal/result enum、时间 | API key、Authorization header、原始 prompt/response、隐式推理、密钥相关特征 |

## 3. 34 页逐页接入矩阵

| 页面 | 闭环 | 真实 LLM 节点与 use case | 最小输入快照 | 可请求工具 | 输出/状态上限 | fail-closed 行为 |
|---|---|---|---|---|---|---|
| UI-01 家庭成长平台首页（首版参考） | 核心服务 | 不新发调用；仅显示/复用 UI-02 已验证文本等价 | page/ref version | 无 | 只读 | 以原图文本等价展示 |
| UI-02 家庭成长平台首页（清晰母版） | 核心服务 | `text_equivalent`；解释可进入的测试体验入口 | journey/page/fixture | `read_fixture_state` | 只读入口说明 | 固定首页说明，不显示模型异常 |
| UI-03 家庭测评第 2/5 步 | 核心服务 | `explain_need`，中性复述已选 L0 选项 | option enum、Need snapshot、policy version | `propose_select_option`、return/pause/no-action | `EXPLANATION_DRAFT`；不超 `ASSESSMENT_STEP_2` | 固定 L0 边界说明；不收自由文本 |
| UI-04 AI 成长诊断报告 | 核心服务 | `explain_report`，解释 fixture 报告展示项 | report fixture、Need/Intent enum、candidate aliases | return/pause/no-action | 仅说明草稿；`MOCK_REPORT_READY` | `SAFETY_STOP_DRAFT`；不生成诊断/评分 |
| UI-05 90 天成长方案 | 核心服务 | `explain_report`，解释 fixture 阶段/任务可见含义 | plan fixture、报告 alias、状态 | return/pause/no-action | 只读 `MOCK_PLAN_READY` | 固定说明；不创建真实 Plan/Case |
| UI-06 陪跑服务 / 社群服务 | 核心服务 | `explain_task`，解释 mock 服务进度与退出方式 | service fixture、固定 task enum | return/pause/no-action | 只读 `MOCK_SERVICE_ACTIVE` | 停止说明；不联系真人/不外发 |
| UI-07 我的 / 会员中心 | 核心服务 | `text_equivalent`，解释 mock 汇总卡片 | member fixture、service state | `read_fixture_state` | 只读 `MOCK_MEMBER_SUMMARY` | 原图文本等价；不呈现真实权益 |
| UI-08 家庭成长体检第 1/5 步 | 增长 | `explain_need`，解释固定服务偏好选项 | Need enum、fixture version | select-option/return/pause/no-action | 仅 `EXPLANATION_DRAFT` | 固定说明；无评分/最佳推荐 |
| UI-09 今日成长任务 | 增长 | `explain_task`，解释固定任务与“可稍后继续” | task fixture、task status | `propose_task_toggle`、return/pause/no-action | `MOCK_TASK_PROGRESS` | 保留未完成态，不惩罚/不排名 |
| UI-10 成长小助手 | 增长 | `explain_task`，家庭监护人看到的测试任务说明 | fixed task/child display fixture | return/pause/no-action | 只读 `MOCK_CHILD_VIEW` | 儿童直接输入/敏感请求立即停止 |
| UI-11 成长排行榜 | 增长 | `text_equivalent`，解释静态 mock 展示边界 | static ranking fixture version | `read_fixture_state` | 只读 `STATIC_RANKING_VIEW` | 不计算、不比较、不生成排序 |
| UI-12 成长成果海报 | 增长 | `text_equivalent`，解释静态预览与不可外发边界 | outcome/poster fixture | return/pause/no-action | `STATIC_GROWTH_POSTER` | 不生成二维码、不分享、不作效果结论 |
| UI-13 家庭成长商城首页 | 商城 | `explain_mock_commerce`，解释 mock 商品目录与模拟边界 | SKU aliases、mock catalog version | `read_fixture_state` | 只读 `MOCK_MALL_BROWSE` | 不诱导消费/不调用真实交易 |
| UI-14 商品详情 | 商城 | `explain_mock_commerce`，解释 fixture 商品展示与可退出 | fixture SKU、mock state | return/pause/no-action | `MOCK_PRODUCT_DETAIL` | 不推荐、不支付、不提供外链 |
| UI-15 邀请有礼 | 商城 | `explain_mock_commerce`，解释模拟邀请回执 | campaign fixture、progress enum | `propose_mock_invite_or_group`、return/pause/no-action | mock invite receipt | 不产生外发消息/追踪链接 |
| UI-16 拼团专区 | 商城 | `explain_mock_commerce`，解释模拟拼团状态 | group fixture、product alias | `propose_mock_invite_or_group`、return/pause/no-action | mock group receipt | 不扣款、不通知、不履约 |
| UI-17 积分商城 | 商城 | `explain_mock_commerce`，解释 mock 积分/兑换状态 | ledger fixture、item alias | return/pause/no-action | 只读/mock receipt | 不核销真实积分/权益 |
| UI-18 成长合伙人我的 | 商城 | `text_equivalent`，解释静态资产页面 | partner asset fixture | `read_fixture_state` | `MOCK_PARTNER_ASSET_VIEW` | 不显示可提现/真实分佣数据 |
| UI-19 名师专区 | 名师沙龙 | `explain_mock_service`，解释 fixture 师资卡片与展示边界 | teacher aliases、directory fixture | `read_fixture_state` | `MOCK_TEACHER_DIRECTORY` | 不建立真人服务关系 |
| UI-20 名师详情 | 名师沙龙 | `explain_mock_service`，解释固定详情与退出 | teacher fixture、资格 display enum | return/pause/no-action | `MOCK_TEACHER_DETAIL` | 不评估家庭适配性、不推荐名师 |
| UI-21 在线咨询 / 预约 | 名师沙龙 | `explain_mock_service`，解释 mock 时段/预约回执 | slot fixture、channel enum | `propose_mock_booking_or_event`、return/pause/no-action | `MOCK_BOOKING_DRAFT`/mock receipt | 不联系真人、不收电话地址 |
| UI-22 线下沙龙 | 名师沙龙 | `text_equivalent`，解释固定活动目录 | salon fixture、city/topic enum | `read_fixture_state` | `MOCK_SALON_LIST` | 不提供真实报名入口 |
| UI-23 活动详情 | 名师沙龙 | `explain_mock_service`，解释 mock 报名/满额状态 | event fixture、availability enum | `propose_mock_booking_or_event`、return/pause/no-action | mock event receipt | 不收费、不通知、不候补 |
| UI-24 我的咨询与活动 | 名师沙龙 | `text_equivalent`，解释 mock 服务记录 | service record fixture | `read_fixture_state` | `MOCK_SERVICE_RECORD` | 不外发/不进入真人客服 |
| UI-25 家长社区 | 社区 | `explain_mock_community`，解释固定内容流/可见性边界 | static feed fixture | `read_fixture_state` | `STATIC_COMMUNITY_FEED` | 不跨家庭可见、不推荐 |
| UI-26 发布动态 | 社区 | `explain_mock_community`，解释固定模板发布回执 | post template enum | `propose_fixed_post_receipt`、return/pause/no-action | `MOCK_POST_RECEIPT` | 不接收或持久化自由文本/媒体 |
| UI-27 成长成果 | 社区 | `text_equivalent`，解释静态成果展示 | outcome fixture | `read_fixture_state` | `STATIC_OUTCOME_VIEW` | 不证明成长结果/不打标签 |
| UI-28 动态详情 | 社区 | `explain_mock_community`，解释固定内容和静态互动 | post/comment fixture aliases | return/pause/no-action | `STATIC_DETAIL_VIEW` | 不写评论/关注/私聊 |
| UI-29 我的社区 | 社区 | `text_equivalent`，解释静态资料/资产 | profile fixture | `read_fixture_state` | `STATIC_COMMUNITY_PROFILE` | 不创建真实关系图/等级 |
| UI-30 我的（年度会员服务） | 客户后台 | `explain_mock_service`，解释 mock 会员服务摘要 | customer/member fixture | `read_fixture_state` | `MOCK_CUSTOMER_HOME` | 不承诺真实权益/复购 |
| UI-31 我的服务 | 客户后台 | `explain_mock_service`，解释 mock 服务进度 | service/task fixture | return/pause/no-action | `MOCK_SERVICE_PROGRESS` | 不创建真实任务/服务 |
| UI-32 订单与资产 | 客户后台 | `text_equivalent`，解释 mock 订单/资产页 | order/asset fixture | `read_fixture_state` | `MOCK_ORDER_ASSET` | 不支付/提现/核销 |
| UI-33 家庭档案 | 客户后台 | `explain_mock_service`，解释 fixture 时间线与边界 | mock family profile fixture | return/pause/no-action | `MOCK_FAMILY_PROFILE` | 不产出诊断/永久档案/跨家庭访问 |
| UI-34 服务记录 | 客户后台 | `text_equivalent`，解释 mock 咨询/活动/客服记录 | service record fixture | `read_fixture_state` | `MOCK_SERVICE_RECORD` | 不联系人/不触发售后 |

## 4. 六条闭环的真实 LLM 验收路径

| 闭环 | 必须能完成的真实 LLM 路径 | 必须能证明的失败关闭 |
|---|---|---|
| 核心服务 | UI-03 → `explain_need` → UI-04 → `explain_report` → UI-05/06 文本等价 → UI-07 | 缺 fixture、撤回 consent、输出含诊断/评分/推荐时，显示固定停止，零核心写入 |
| 增长 | UI-08 → `explain_need` → UI-09 → `explain_task` → UI-10/11/12 文本等价 | 儿童直接输入、排名计算、成长结论、分享请求均阻断 |
| 商城 | UI-13/14 → `explain_mock_commerce` → UI-15/16 mock receipt → UI-17/18 文本等价 | 支付、推广外发、分佣/提现、商业诱导均阻断 |
| 名师沙龙 | UI-19/20 → `explain_mock_service` → UI-21/23 mock receipt → UI-24 文本等价 | 真人联系、真实预约、收费、通知与转介均阻断 |
| 社区 | UI-25 → `explain_mock_community` → UI-26 mock receipt → UI-27/28/29 文本等价 | 自由文本/媒体持久化、跨家庭发布、评论/私聊/推荐均阻断 |
| 客户后台 | UI-30/31/33 → `explain_mock_service` → UI-32/34 文本等价 | 真实档案、权益、订单、客服联络或家庭范围冲突均阻断 |

## 5. 实现清单与验证挂钩

1. 复用 `packages/ai-gateway` 的结构化请求、超时、JSON 解析和失败分类；**不**沿用其“缺少 provider 配置时静默回退 Fake”行为作为 Family 真实 LLM 路径。
2. 新增 Family 专属 DEV Gateway 外层，环境变量只使用 `FAMILY_LLM_*` 名称；未配置时返回 `LLM_NOT_CONFIGURED`，不调用 Fake 或任何外部模型。
3. `FAMILY_LLM_API_KEY` 仅从运行时环境读取；不得传到前端、工具参数、日志、审计、回放、错误对象或测试快照。
4. 真实 LLM 启用需要同时满足：DEV/TEST 环境、显式开关、allowlist、合成 fixture、测试 principal、测试 family scope、有效 mock consent、政策版本和 schema 版本。
5. 页面必须同时提供文本等价路径。模型失败或被策略拦截时，不显示未验证模型原文，只显示固定停止模板。
6. 每个 use case 至少具备：正常结构化输出、缺 key、关闭开关、模型不在 allowlist、非法 schema、禁词、幻觉候选、非法工具、fixture/consent/family scope 失效等测试。

## 6. 仍然持续 HOLD

真实家庭/儿童数据、真实模型训练/微调/自学习、真实诊断或风险判断、真实成长结论/排行/画像、真实支付、真实预约/真人咨询、真实社区发布/互动、真实订单/权益、生产发布与 master 合入持续 HOLD。真实 LLM DEV 调用只能解释合成 fixture 与 mock 状态，不能使上述项目自动解冻。
