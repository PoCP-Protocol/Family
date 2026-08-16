# Family App-first Gate 裁决输入包 001

> **状态：`DRAFT_FOR_APP_GATE_DECISION_INPUT`。**
>
> **资料边界：`E1_SELF_MATERIAL_SOURCE_FINDINGS`。**
>
> 本包用于总架构师决定是否开启下一条 App 体验工作包。它不授权业务代码、DTO/API、数据库、Web HOME、移动端 runtime、真实试点、生产、外部模型、训练/自学习、商业化、跨家庭统计/推荐、公开成长 IP 或任何既有 HOLD 的解除。

## 1. 请求裁决的内容

Family 已完成 PR #36 的 P0 Runtime Trust Closeout，代码 exact head `6103981dec6c7a4b9ceb988ddcdb75b5c44f6154` 被接受为 `PASS_CANDIDATE_ACCEPTED_FOR_REVIEW`。当前开发面冻结，唯一可推进事项是将榜样教育的 App 体验设想转化为可审计的 Gate 输入。

本包请求总架构师判断：是否将 **C1「亲子沟通紧张时的家庭私有当下支持」**立项为下一条 App-first 候选纵切的任务契约起点。C1 不是实施授权；如获同意，下一步仍须单独审阅任务契约、页面清单、API 影响与验证计划。

| 裁决对象 | 建议状态 | 说明 |
|---|---|---|
| PR #36 P0 Runtime Trust | `PASS_CANDIDATE_ACCEPTED_FOR_REVIEW` | 开发面冻结；Draft、AUTO_MERGE=NO、master=HOLD。 |
| App-first 设计原则 | 待确认 | App 为家庭主入口；Web 为辅助可访问、运营和验证载体。 |
| C1 当下支持候选纵切 | 待确认 | 仅为一条家庭私有、文本优先、可暂停的服务体验候选。 |
| C2 家庭私有服务过程摘要 | 待确认 | 仅可作为 C1 只读延伸，不独立启动。 |
| C3–C7（挑战、测评、社群、商业、AI 等） | HOLD | 仅保留设计材料，不进入任务契约。 |

## 2. 业务材料如何被安全转译

> PPT 的“孩子问题入口—家长成长—长期陪伴”是产品叙事，不是成长效果承诺；PPT 的“成长档案、画像、AI、分享、会员、顾问、生态”是未来能力线索，不是当前授权的功能目录。[1] [2]

| PPT 功能域 | 体验意图 | Family 安全转译 | 当前状态 |
|---|---|---|---|
| 问题入口 | 帮家庭说清当下困扰 | 文本 Need + 服务端派生 subject + 显式 Intent | C1 候选 |
| 觉醒/理解 | 帮家长明确下一步 | 家庭确认自己的服务意图；不诊断 | C1 候选 |
| 内容与课程 | 提供可选择支持 | 已准入资源候选；显示来源/限制；不声称效果 | C1 候选 |
| 行动/计划 | 从理解走向下一步 | 仅在家庭明确决定后显示 Plan/Case 的声明性过程 | C1 候选 |
| 反馈/陪伴 | 记录家庭感受 | 可选 FollowUp；仅主观帮助感 | C1 候选 |
| 服务档案 | 降低“每次从零开始” | 同家庭、同 consent 下的最小过程摘要 | C2 候选 |
| 测评/报告/画像 | 帮助理解家庭 | 暂不实施；未来须分目的、可撤回、非诊断审查 | HOLD |
| 社群/分享/城市网络 | 获得同伴连接或增长 | 默认私有；公开传播、身份和激励全部暂停 | HOLD |
| 会员/订单/活动 | 长期商业关系 | 支付、权益、交付、活动和交易分离到商业 Gate | HOLD |
| AI/Agent | 支持交付闭环 | 现阶段保持零外部模型；未来经 Model/Evidence/Human Gate | HOLD |

## 3. C1 候选纵切：家庭私有当下支持

### 3.1 可解决的家庭任务

该体验不试图解决“孩子成长”这一抽象问题。它只帮助一名已通过可信家庭身份链的监护人完成一件小事：在亲子沟通紧张的当下，以自己的文字表达需要，决定是否采用一个已准入资源，并在之后可选地记录“这对我是否有帮助”。

| 顺序 | 家长任务 | 可见页面/状态候选 | 系统事实边界 |
|---|---|---|---|
| 1 | 进入并确认是自己的家庭空间 | 家庭欢迎、隐私说明、暂停/退出 | 只接受服务端 trusted family context。 |
| 2 | 用文本表达当下需要 | Need 输入页 | 创建 Need，不推断诊断。 |
| 3 | 确认本次希望得到的支持 | Intent 确认页 | 明确 intent；child 由服务端派生。 |
| 4 | 看见可选或暂不行动 | 已准入候选页 + NO_ACTION | 只显示 T1 合格候选；不显示未准入资源。 |
| 5 | 作出家庭决定 | 决定确认页 | 仅明确 Decision 后才允许 Plan/Case。 |
| 6 | 理解下一步或安全等待 | 过程页 / handoff 状态 | 仅展示服务过程；不承诺真人已接单。 |
| 7 | 可选地留下主观感受 | FollowUp 页 | 记录家庭感受，不写成长结果。 |
| 8 | 回看家庭私有过程 | 私有摘要候选 | 有效 SERVICE consent 下的最小投影。 |

### 3.2 正清单

| 编号 | 能力/页面候选 | 明确允许的最小内容 | 现有基础 | 当前是否实施 |
|---|---|---|---|---|
| A-01 | 家庭欢迎/进入 | 家庭可读隐私提示、文本入口、返回/暂停 | strict Account→binding→membership→family | 否 |
| A-02 | Need 输入 | 一段文本和最小服务意图选择 | RequestHelp | 否 |
| A-03 | Intent 确认 | 家长确认后的意图文本 | ConfirmIntent | 否 |
| A-04 | 候选列表 | admission/provenance/risk/copyright 的最小摘要；NO_ACTION | Recommend、resource asset Gate | 否 |
| A-05 | 家庭决定 | ACCEPT、替代或 DISMISS + [] | Decide、decision integrity、idempotency | 否 |
| A-06 | 声明性服务过程 | Plan/Case 状态、下一步、暂停 | T2、Plan/ServiceCase | 否 |
| A-07 | 安全等待 | REVIEW/HIGH_RISK 的非承诺状态文本 | durable handoff trace | 否 |
| A-08 | 主观回访 | 可跳过的“是否对我有帮助” | FollowUp | 否 |
| A-09 | 私有摘要 | 同家庭服务过程事实、撤回后的最小可见 | Context Reuse consent gate | 否 |
| A-10 | 文本等价与无障碍 | 所有状态与动作的清晰文本 | App Gate 待定义 | 否 |

### 3.3 负清单

C1 不得携带任何 Web HOME、大型发现页、原生移动端发布、公开社区、分享/邀请/积分、身份等级、课程商城、支付、会员、订单、优惠券、真人预约、组织访问、Provider 市场、外部模型、训练、跨家庭统计、成长 IP、成长结果、永久标签、公开画像、真实导出/删除/外发或加密文件交付。任何新增需要上述能力的需求，必须停止 C1 并创建新 Gate。

## 4. 数据、Consent 与隐私设计

| 对象/信息 | 允许用途 | 最小展示 | 前置条件 | 禁止项 |
|---|---|---|---|---|
| Account / family / role | 将操作绑定到当前家庭 | 家庭可读标识，不显内部 ID | ACTIVE account、binding、membership、严格 context | 客户端指定 actor/family 或多身份默认选一个。 |
| child subject | 服务意图的成长对象 | 仅最小关系文案 | 服务端派生、年龄范围、SERVICE consent | 前端伪造、跨家庭、成人主体代替 child。 |
| Need / Intent | 当前家庭本次服务链 | 家长输入和确认文案 | Named Action、purpose 限定 | 诊断、标签、公开分享、跨家庭推荐。 |
| Resource | 家庭自主选择的候选 | 来源、限制、风险、admission 摘要 | admission + T1/T2 | 未准入/降级/版权不明/无 executor 时展示。 |
| Decision / Plan / Case | 家庭明确选择后的服务过程 | 状态、下一步、暂停 | Decision、T2、幂等 | NO_ACTION 创建 Case；把 Case 解释为已交付。 |
| FollowUp | 家庭主观帮助感 | 家长自己选择填写的最小文本/选项 | FollowUp action | 把主观感受转成成长效果或画像。 |
| Context Reuse | 服务过程连续性 | 最小私有事实 | 有效 SERVICE consent | consent 撤回后继续显示或生成推断。 |

## 5. 风险路由与 Human Gate

| 情形 | App 必须做什么 | App 绝不做什么 | 后续 Gate |
|---|---|---|---|
| 无认证/范围不明 | 拒绝并回到安全入口 | 不显示任何家庭数据 | 无；P0 已收口。 |
| 高风险/需人工 | 显示等待/安全说明；保留 trace | 不显示扣留响应、不承诺真人服务 | 真人交付/组织协作另立 Gate。 |
| 资源不合格 | 不显示或不可选 | 不以“内容已存在”代替执行资格 | resource admission 改动另立 Gate。 |
| consent 撤回 | 空投影/停止复用 | 不保留可行动 UI | 数据生命周期能力另立 Gate。 |
| 多模态输入 | 保留文本路径 | 不处理语音、图、截图、视频 | 多模态独立 Gate。 |
| AI 助手 | 维持确定性或无 AI 路径 | 不外呼、不训练、不自由生成 | Model Gateway / Evidence / Human Gate。 |

## 6. 不可变的文本等价与 fail-closed 要求

所有 C1 页面必须由文本完整操作；颜色、插图、图表、卡片状态、语音或动画不能成为唯一信息来源。文本必须说明“这是家庭的选择与服务过程，不是孩子改变的结论”。

| 编号 | 负例 | 预期结果 |
|---|---|---|
| FC-01 | 无会话、x-actor-only、disabled account | `401`，零家庭数据。 |
| FC-02 | binding/membership 撤销或 ambiguous context | `403`，不默认选择任何身份。 |
| FC-03 | cookie 跨 Origin 写请求 | `403`；不得创建 Need/Decision。 |
| FC-04 | 无 SERVICE consent、跨家庭 child、年龄不适配 | 拒绝，零写入。 |
| FC-05 | 未准入/降级/版权不明资源 | 不显示、不可选。 |
| FC-06 | PRACTICE 无 real executor | `INELIGIBLE_NO_EXECUTOR`，不可作为 T1/T2 候选。 |
| FC-07 | NO_ACTION 被 ACCEPT/alternative 选中 | 拒绝；只允许 DISMISS + []。 |
| FC-08 | consent/provider/资格在 T1 后改变 | T2 拒绝；不建 Case。 |
| FC-09 | 同键重放或同键异请求 | 前者零重复；后者 `409`。 |
| FC-10 | REVIEW/HIGH_RISK | 无自动回复/legacy proposal；仅可审计等待状态。 |
| FC-11 | 文案/数据试图形成结果或标签 | 不写 canonical outcome，不渲染“已证明改变”。 |
| FC-12 | UI 请求外部模型、支付、分享、组织访问 | 无入口、无调用、无降级绕过。 |

## 7. DTO/API/数据库影响与验证矩阵

**当前声明：无变更。** C1 首选复用 PR #36 已收口的既有 API 和 Named Action。若被提出的体验无法通过现有契约完成，必须在实施前给出差异表，由总架构师逐项审阅，不得由前端需求隐式新增后端能力。

| 验证层 | 必须验证 | 通过标准 |
|---|---|---|
| UI 单元 | 文案、状态、文本等价、暂停、资源限制、NO_ACTION | 无结果宣称、无默认同意、无内部 ID/令牌。 |
| API 合同 | Scope、Consent、Decision、idempotency error | 前端无法越权；服务端始终为真相源。 |
| 真正 PostgreSQL | 合成家庭、跨家庭、撤回、重复、降级资源 | 正向闭环可重放；所有负例 fail-closed。 |
| 移动视口浏览器 | 文本路径从 Need 到回访 | 无障碍可完成、无未授权输入、无泄露。 |
| 浏览器后回归 | 全量 API 回归 | 合成数据/会话不污染基线。 |
| 静态审计 | 代码、依赖、路由、日志 | 零外部模型、训练、支付、公开分享、跨家庭、文件 I/O。 |

## 8. Human Gate 决策清单

| 编号 | 需要明确回答的问题 | 建议答案 |
|---|---|---|
| HG-01 | 是否仅把 C1 立为候选任务契约起点？ | 是；C2 仅候选只读延伸，C3–C7 继续 HOLD。 |
| HG-02 | 是否确认第一阶段 App 消费既有可信 API，不新增 DTO/API/DB？ | 是；任何新增项必须单独列项再审。 |
| HG-03 | 是否确认“进展”只能是服务过程与家庭主观帮助感？ | 是；不得成为效果、画像、标签或预测。 |
| HG-04 | 是否确认 E1 内容资产只能显示来源/版权/限制，不能展示成效果证据？ | 是。 |
| HG-05 | 是否确认 C1 零外部模型、零训练、零多模态输入？ | 是；文本等价路径为唯一必要路径。 |
| HG-06 | 是否确认 REVIEW/HIGH_RISK 只显示安全等待，不进入真人服务？ | 是；真人服务另 Gate。 |
| HG-07 | 是否确认实施仅在开发分支内部确定性验证，仍不 merge/master/pilot/production？ | 是。 |
| HG-08 | 是否确认任何商业、公开、组织、跨家庭、数据导出需求为退出条件？ | 是。 |

## 9. 裁决后的下一步（不自动执行）

若 HG-01 至 HG-08 获明确批准，下一步仅可编写 `FAMILY_APP_FIRST_C1_TASK_CONTRACT`：列明页面、复用 API、零新增数据结构声明、状态文案、测试夹具、退出条件和 Gate 证据模板。该契约本身不等于代码授权；实施、验证、提交和任何 runtime 仍须由后续裁决明确。

## References

[1] 用户提供：《榜样教育新商业模式对外宣发PPT_原图版(2)》，重点见第 1–2、7、9、11、13、15–20 页。  
[2] 用户提供：《榜样教育战略白皮书_30页演讲汇报版》，重点见第 3–6、8–19、20–30 页。  
[3] `architecture/FAMILY_APP_FUNCTION_DECOMPOSITION_FROM_BANGYANG_PPTS_DRAFT_001.md`。  
[4] `architecture/FAMILY_APP_FIRST_EXPERIENCE_GATE_DECISION_INPUT_DRAFT_001.md`。  
[5] `governance/PR36_P0_RUNTIME_TRUST_EVIDENCE_INDEX_2026-08-16.md`。

---

**作者：Manus AI**  
**日期：2026-08-16（GMT+8）


## 10. 补充设计输入：贝壳式受治理分配机制

用户提出在商业内核图中增加“贝壳式分配机制”。Family 只借鉴其将复杂服务拆解为明确阶段、以规则约束协作、保留责任追溯和对异常进行治理的方法；不迁移经纪网络、收益分配、服务者评分、跨组织协作、线索竞争或交易撮合。[6]

| Family 设计问题 | App Gate 约束 |
|---|---|
| 家庭如何获得“下一步” | `Need → Intent → Capability → admitted Resource → Family Decision → T2 → Plan/Case → FollowUp/Handoff`；每一跳都必须可解释、可拒绝、可暂停。 |
| 候选如何出现 | 只基于当前家庭范围、有效 consent、资源 admission、T1/T2 与 executor readiness；不得用跨家庭画像、付费能力、转化率、服务者排名或商业价值。 |
| 没有合格下一步怎么办 | 显示无可用候选或安全等待；不以未准入资源、自动替代、暗中派单或真人服务承诺填补空白。 |
| 异常如何处理 | REVIEW/HIGH_RISK 只记录 handoff trace 与非承诺等待；组织访问、真人服务、预约、转介和 AccessGrant 均需独立 Gate。 |
| 如何保障家庭主权 | 家庭明确 Decision 是 Plan/Case 的唯一前提；`NO_ACTION` 始终可用且无服务执行；路线不是销售线索分配。 |

完整八项拆解、状态/责任表和 Human Gate 问题见 `architecture/FAMILY_BEIKE_GOVERNED_ALLOCATION_DESIGN_INPUT_001.md`。此补充不改变本包的零 API/DTO/数据库变更声明，不构成 C1 实现授权。

[6] 尹西明等，《贝壳找房：自我颠覆的整合式创新引领产业数字化》，清华管理评论案例分析，2021-12-02，https://www.sem.tsinghua.edu.cn/info/1173/32544.htm 。
