# 榜样教育规划 App → Family DEV 实现映射 001

> **产品 SSOT：** 三张榜样教育 App/PPT 截图与既有 `FAMILY_APP_MINIPROGRAM_UI_BLUEPRINT_DECOMPOSITION_DRAFT_001.md`、`FAMILY_APP_FUNCTION_DECOMPOSITION_FROM_BANGYANG_PPTS_DRAFT_001.md`。本表用于 DEV 产品实现与验收；所有用户可见页面不得出现开发、治理、测试、证据、风险或营销术语。

| 规划 App 页面/流程 | 规划的可见任务 | 当前 DEV 页面/组件/路由 | 当前状态 | 需直接补齐 |
|---|---|---|---|---|
| 家庭首页/成长平台 | 欢迎、今日成长、快捷入口、成长计划、陪伴入口、内容入口 | `test-loop.js` `home` section | 部分实现 | 调整首页信息密度为规划式模块，加入今日计划、成长旅程、内容与报告入口；删除内部标识。 |
| 家庭测评/体检 | 认识当下状态、选择方向、开始体验 | `support` 的 `INTRO/NEED/INTENT` | 部分实现 | 改为“成长体检/当下需要确认”产品表达，维持非评分和可跳过路径。 |
| 家庭规划/行动 | 21 天/90 天成长计划、每日行动、继续入口 | `process` section 与 Decision receipt | 缺失 | 新增计划总览、今日行动、阶段路径与继续入口；页面只做展示壳，不产生真实任务或效果结论。 |
| 服务旅程/陪跑 | 阶段进展、陪伴服务、继续/暂停 | `process` section | 部分实现 | 新增服务旅程卡、阶段节点、陪伴入口与温和提醒表达。 |
| 学习/素材/课程 | 课程、工具包、学习资料、推荐内容 | 无独立 section | 缺失 | 新增学习页、课程/素材卡、分类入口、继续学习按钮和详情页壳。 |
| 报告/反馈/记录 | 成长报告、家庭记录、反馈、档案 | `mine` section 与审计页 | 缺失 | 新增报告页、阶段回顾、家庭记录和反馈入口；以产品语言呈现，不露出审计/内部字段。 |
| 家长侧 | 父母成长、家庭沟通、支持工具、账户入口 | `mine` section | 部分实现 | 新增家长中心、父母成长素材、家庭共学入口。 |
| 孩子侧 | 孩子成长、每日小任务、陪伴助手、荣誉/挑战入口 | 无独立 section | 缺失 | 新增孩子成长页壳，避免账户、画像、评分、聊天或真实数据处理。 |
| 家庭成员 | 家庭成员、共同参与、角色视图 | 无独立 section | 缺失 | 新增家庭成员页壳，使用预置页面信息，不采集实际成员资料。 |
| 多模态助手 | AI 助手、语音/图像/文字材料理解、陪伴入口 | `MULTIMODAL` 与 `assistant` section | 部分实现 | 让入口融入首页、计划和孩子/家长页；改为家庭陪伴表达，移除 Gateway/stub 等内术语。 |
| 我的/会员 | 我的计划、报告、订单、权益、设置 | `mine` section | 部分实现 | 改为“我的”产品页，显示计划、报告、家庭成员和设置入口；交易内容仅呈现常规页面壳，不开放交易。 |
| 商城/邀请/积分 | 商品、会员、邀请、积分 | 无 | 临时占位 | 仅呈现符合截图的信息架构入口，不做支付、订单、邀请或积分逻辑。 |

## 当前组件与契约对照

| 前端组件/状态 | 目前关联后端契约 | 映射结论 |
|---|---|---|
| 当前需要确认、偏好选择、候选比较、选择/暂停/不行动 | `/orchestration/test-loop/need`、`/intent`、`/intents/:id/candidates`、`/decisions` | 用作成长体检与当下支持的受保护流程内核。 |
| 服务过程与决定回执 | `/orchestration/test-loop/audit/:correlationId` | 转译为用户可读的服务记录/阶段回顾页面，不显示内部审计字段。 |
| 多模态情境 | 本地 `test-loop-multimodal.js` | 用作家庭陪伴助手的动态入口，不标示技术或处理路径。 |
| 专业工具、真人协作、交易 | 现有固定停止/占位契约 | 只保留页面壳，具体执行能力不在当前 UI 可见范围内。 |

## 用户可见禁词检查基线

下面术语及其英文、缩写、变体不可出现在 Family 面向用户的页面文本、按钮、标签、卡片、提示或空状态中：`DEV`、`TEST`、`SYNTHETIC`、`PROD`、`HOLD`、`stub`、`Gateway`、`Gate`、`policy`、`contract`、`fixture`、`mock`、`audit`、`evidence`、`internal`、`开发`、`测试`、`合成`、`治理`、`策略`、`契约`、`审计`、`证据`、`占位`、`模型调用`、`训练`、`外发`、`风险`、`Gate`。这些信息只可存在于代码注释、服务端日志、测试、开发文档和证据包。

## 依据

[1] `architecture/FAMILY_APP_MINIPROGRAM_UI_BLUEPRINT_DECOMPOSITION_DRAFT_001.md`。
[2] `architecture/FAMILY_APP_FUNCTION_DECOMPOSITION_FROM_BANGYANG_PPTS_DRAFT_001.md`。
[3] 用户产品裁决：榜样教育规划 App 为 DEV App 产品权威与验收基线。
