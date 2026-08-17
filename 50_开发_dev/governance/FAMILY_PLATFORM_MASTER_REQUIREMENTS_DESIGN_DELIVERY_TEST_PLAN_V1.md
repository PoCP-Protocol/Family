# Family 平台总需求、设计、交付与测试主控计划 V1

> **状态：** `DRAFT_FOR_DEV_MOCK_MASTER_CONTROL`
> **环境晋级：** `DEV_IMPLEMENTING → DEV_READY_FOR_TEST → TEST_VALIDATED → PROD_GATED`
> **产品事实基线：** **34 页清晰单页 UI + 3 份 PPT + 6 条闭环路径图 + Family V3 工程与治理契约**。任何历史 `18_UI` 文件名仅保留路径兼容，正文一律以 34 页 UI 为范围。

## 1. 证据先行与产品目标

Family 是以孩子最佳利益与家庭长期成长为中心的 **AI-native Family Operating System**。它以家庭授权上下文、可追溯资源/服务候选、家庭明确决定、受控动作、AI Control Plane、评测审计与环境晋级构成统一系统，而不是传统 App 外加一个聊天窗口。

34 页 UI、3 份 PPT 和六条闭环图是需求、场景、视觉和流程证据，不是生产事实、真实教育效果、真实交易、真实服务或真实数据处理的授权。DEV 的交付目标是使用合成/测试 fixture 与真实 LLM 的受控调用，跑通完整可体验闭环；模型不得成为事实写入者或家庭决定者。

| 证据来源 | 主要用途 | 不得证明 |
|---|---|---|
| `BANGYANG_34_UI_AND_3_PPT_MASTER_DELIVERY_PLAN_001.md` | 34 页 page baseline、原图、控件、布局、验收母版 | 真实服务、真实效果、生产授权 |
| `BANGYANG_34_UI_SCENARIO_FLOWS_AND_RULES_001.md` | 六条闭环、角色、规则、状态、异常、Mock Action | 真实转化、交易、履约或数据处理结果 |
| 3 份原素材/历史命名：榜样教育（Bangyang）PPT | App-first 产品定位、能力组合、品牌及服务场景 | 教育效果、模型治理、真实商业能力 |
| `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` | Family scope、Named Action、模块化单体等不变量 | 覆盖产品视觉与交互 SSOT |
| AI Gate/Eval/Gateway 草案 | 真实 LLM 的边界、拒绝、评测与审计基线 | 自动解冻生产或真实家庭数据处理 |

## 2. 环境、数据与真实 LLM 范围

| 环境 | 可用能力 | 数据与模型 | 持续禁止 |
|---|---|---|---|
| DEV | 34 页原图路由、六条闭环、受控 Mock Action、真实 LLM 解释/工具编排、审计与回放 | 仅合成或测试 fixture；最小结构化只读快照 | 真实家庭/儿童数据、训练、微调、真实支付/预约/咨询/社区外发、生产发布 |
| TEST/SANDBOX | 承接 DEV 自测通过能力；真实 PostgreSQL 测试库、集成与浏览器验证 | 隔离 fixture；用户在本地提供受控 LLM key 时才可实际调用 | 真实用户、真实外部服务、生产 schema 自动变更 |
| PROD | 必须逐能力独立申请 Gate | 未授权 | 默认 HOLD |

> 真实 LLM API key 仅在测试时由用户经本地环境变量、未提交 `.env.local` 或受控 secret 注入。**不得**在 Manus 对话、文档、代码、fixture、日志、审计、回放样本、异常消息、截图或测试快照中写入、复制、回显、序列化或推断任何真实 key。

| 配置规范 | 允许 | 禁止 |
|---|---|---|
| 代码槽位 | 仅使用 env var 名称：`FAMILY_LLM_API_KEY`、`FAMILY_LLM_API_BASE`、`FAMILY_LLM_MODEL`、`FAMILY_LLM_ENABLED`、`FAMILY_LLM_ENVIRONMENT` | 真实值、token 示例、默认凭证、客户端变量注入 |
| 注入方式 | 本地环境变量、未提交 `.env.local`、受控 secret store | 已提交 `.env`、fixture、测试快照、文档或日志 |
| 启动检查 | 只检查存在性、非空性、环境、allowlist 和开关；返回枚举错误 | 输出值、前缀、长度、哈希、header、环境转储 |
| 缺失/异常 | `LLM_NOT_CONFIGURED`、`LLM_DISABLED`、`LLM_MODEL_NOT_ALLOWED` 或 `LLM_PROVIDER_UNAVAILABLE`，零模型网络调用 | 退化到未受控调用或浏览器直接调用 |

## 2.1 DEV 真实能力定义：测试数据不是功能降级

DEV 的标准是**真实可运行能力**，不是静态画面、固定文本或仅为演示而写的空壳。`mock` 仅描述数据来源、测试账户或外部副作用适配器，不代表业务工作流、权限、状态机、数据库、API、审计或 LLM 能力可以缺失。

| 能力层 | DEV 必须真实实现 | 测试隔离方式 |
|---|---|---|
| 体验与接口 | 34 页页面、双向导航、表单状态、文本等价、前后端 API 契约、错误态与恢复路径 | 使用测试 principal、测试 family scope、fixture 和本地/沙箱浏览器 |
| 领域工作流 | Need/Intent/Decision/NO_ACTION、服务进度、订单、预约、活动、社区、档案与资产的状态机、幂等和审计 | 仅测试数据库、测试 schema/namespace 和可重置测试数据 |
| AI | 真实 LLM Gateway、真实模型调用、Context Assembler、工具调用、JSON Schema、Validator、Eval、Replay 与 Kill Switch | 仅最小化测试快照；用户在测试时本地注入 key；模型无事实链写权 |
| 外部集成 | 支付、预约、消息、分享、真人供给、社区外发等的完整 adapter interface、request schema、状态回执、异常恢复 | 默认接 test/sandbox adapter 或受控模拟端点，禁止生产商户、真实联系人、真实外发 |
| 数据与观测 | 数据库读写、scope/consent 检查、事件、审计、回放、指标与失败关闭 | 所有对象显式带 `environment=DEV/TEST`、测试来源和可清理标识 |

因此，所谓“模拟订单/预约/活动/社区”是**对外部生产副作用的隔离**，而不是不实现订单/预约/活动/社区领域能力。每一项都必须具备真实状态转换、受控 API、数据库/测试存储、审计和异常恢复；未来只需替换经批准的生产 adapter，而非重写业务流程。

## 2.2 真实 LLM Gateway 的 HTTP 与失败关闭契约

真实 LLM 草稿接口是一个受认证的、可审计的**受控处理请求**。当请求在服务端完成 scope、fixture、page policy 与 Gateway 判定后，HTTP `201` 表示该受控处理和审计回执已经完成；它不表示模型一定被调用，也不表示产生了领域业务写入。模型配置缺失或策略阻断必须以结构化 body 显式返回，不能伪装成解释草稿。

| 情形 | HTTP | 必填 body 语义 | 副作用上限 |
|---|---:|---|---|
| 已验证草稿 | `201` | `decision=ALLOW_DRAFT`、受 schema 验证的 `draft`、审计 alias | 仅审计元数据；模型无领域写权 |
| LLM 未启用/未配置/模型不允许/环境阻断 | `201` | `decision=BLOCK_CONFIGURATION`、`draft=null`、枚举 `stop_code`、文本等价说明 | 零模型网络调用、零领域状态写入；最小审计元数据 |
| 输入或输出策略阻断 | `201` | `decision=BLOCK_INPUT` 或 `BLOCK_OUTPUT`、`draft=null`、枚举 `stop_code` | 零未验证内容展示、零领域状态写入；最小审计元数据 |
| provider 不可用 | `201` | `decision=PROVIDER_FAILURE`、`draft=null`、稳定 `stop_code` | 零原文错误回显、零领域状态写入；最小审计元数据 |
| 认证/家族范围/consent 不成立 | `401`/`403` | 既有 Guard 的稳定拒绝语义 | 不构造模型快照、不写审计/领域状态 |
| page/fixture/request 参数不合法 | `400` | 稳定参数错误枚举 | 不构造模型快照、不写审计/领域状态 |

审计与 replay 只存并只返回：trace alias、fixture/version、page、use case、模型 ID（可空）、policy/schema version、Gateway 决策、阻断理由、状态上限、工具名与时间。不得保存或回放 provider 原文、真实 prompt、模型推理、完整家庭文本、认证 header 或任何真实 key；因而也不得为这些值记录可逆内容、前缀、长度或 hash。

## 3. 34 页 UI 与六条闭环交付范围

| 闭环 | UI 页 | DEV 可体验交付 | 状态上限 | 生产/真实能力状态 |
|---|---:|---|---|---|
| 核心服务 | UI-01–07 | 测试 Need/Intent、AI 解释草稿、mock 报告/方案/服务 | `MOCK_SERVICE_ACTIVE` | 诊断、真人陪跑、真实会员 HOLD |
| 增长 | UI-08–12 | mock 任务、孩子端页面壳、静态成果/海报 | `STATIC_POSTER` | 真实排行、成长结论、公开分享 HOLD |
| 商城 | UI-13–18 | mock SKU、订单、邀请、拼团、积分、伙伴资产 | `MOCK_PARTNER_ASSET_VIEW` | 支付、分佣、提现、履约 HOLD |
| 名师沙龙 | UI-19–24 | mock 名师、预约、活动与服务记录 | `MOCK_SERVICE_RECORD` | 真人咨询、报名、线下服务 HOLD |
| 社区 | UI-25–29 | 固定内容流、mock 发布回执、静态互动/成果/社区 | `STATIC_PROFILE` | 跨家庭内容、互动、私聊、审核 HOLD |
| 客户后台 | UI-30–34 | mock 服务、订单资产、家庭档案、咨询活动/客服记录 | `MOCK_SERVICE_RECORD` | 真实档案、客服、权益、订单 HOLD |

所有 mock 状态变更必须经过 `Mock Action`，具有 schema、环境约束、幂等键、前后状态、页面来源与审计回执。`NO_ACTION`、返回和暂停是完整出口，且必须保持 `0 Plan / 0 ServiceCase / 0 Task / 0 Reminder`。

## 4. AI-native 目标架构

```text
Experience Shell (34 页原图、文本等价、路由、场景状态)
  → Journey Orchestrator / Named Action & Mock Action Registry
  → Family Domain (trusted context、family scope、consent、Need/Intent、admitted candidates)
  → AI Control Plane (Gateway、Context Assembler、Tool Registry、Validator、Eval、Audit/Replay、Kill Switch)
  → Environment Foundation (DEV fixtures、TEST PostgreSQL、PROD Gate)
```

| AI Control Plane 组件 | DEV 真实 LLM 职责 | 必须禁止 |
|---|---|---|
| Gateway | 唯一服务器端调用入口、模型 allowlist、配置检查、关闭开关、schema | 客户端调用、数据库写入、凭证记录 |
| Context Assembler | 从 fixture 构造最小化 Need/Intent/候选/页面快照 | 读取真实档案、完整对话、儿童直接输入 |
| Tool Registry | 只暴露 mock action 白名单；返回受控 receipt | 任意 HTTP、支付、预约、外发或事实链写入 |
| Output Validator | JSON Schema、候选别名、枚举、禁词、状态上限和文本等价校验 | 评分/标签/诊断/排序/效果承诺/幻觉资源/自动执行 |
| Audit & Replay | 记录模型 ID、版本、fixture ID、策略和验证判定 | API key、认证 header、原始 prompt/response、隐式推理 |
| Eval Harness | 合成正例与高危负例自动化 | 用真实家庭数据评测或训练 |
| Kill Switch | 全局、模型、能力、页面与 fixture 级立即关闭 | 关闭后绕过 Gateway |

## 5. 实施里程碑

| 里程碑 | 交付物 | 验收 |
|---|---|---|
| M0 | 34 页/六闭环/证据索引与主计划；密钥安全规范 | 文档相互引用、无真实 key |
| M1 | 原图 route manifest、全页导航、文本等价、视觉对照 | 34 页可达与浏览器状态表 |
| M2 | 核心服务/增长真实工作流、测试 fixture 与 AI 解释场景 | unit/API/数据库/浏览器黄金路径 |
| M3 | 商城/名师沙龙真实领域工作流与 test/sandbox adapter、受控 receipts | 无生产交易/预约外发负例 |
| M4 | 社区/客户后台真实领域工作流、test/sandbox adapter、审计 projection | 无跨家庭/自由文本事实写入负例 |
| M5 | 真实 LLM Gateway、tool whitelist、validator、eval/replay、kill switch | 合成高危负例 100% 阻断；密钥缺失 fail-closed |
| M6 | DEV evidence package 与 TEST promotion input | typecheck/build/API/DB/browser/LLM 验收全通过 |

## 6. 验收项

| 类别 | 必须通过 | 负例/失败关闭 |
|---|---|---|
| UI 证据 | 34 页可路由；原图可追溯；六闭环关键路径可走通；每页标记 `MATCHED`、`IN_RESEARCH` 或 `NOT_MATCHED` | UI 不得展示 DEV、Gate、fixture、HOLD、政策等内部术语 |
| 领域与动作 | family scope、consent、Named Action/Mock Action、幂等和审计有效 | context/consent/fixture/action 无效时零写入、零外发 |
| 真实 LLM | Gateway allowlist、最小 snapshot、工具白名单、输出验证、Kill Switch、合成 eval | 未配置 key、模型关闭/不允许、schema 失败、输出越权时零模型调用或固定停止 |
| API key 安全 | `.env.local`/私密文件在 Git ignore；代码只出现变量名；启动检查不打印值 | 代码库、API、日志、截图、录制、回放、Vitest 快照不得有 key、Authorization header 或任何凭证片段 |
| 质量 | `pnpm --filter @family/web typecheck`；`pnpm --filter @family/web build`；聚焦 unit/API/DB/browser 测试 | 失败不能被“页面看起来可用”替代 |

## 7. 持续 HOLD

`master` 合入、生产、真实家庭/儿童数据、真实用户试用、训练/微调/自学习、真实支付、真实预约、真人咨询、真实社区外发、跨家庭统计/推荐、公开画像、成长结果/永久标签、L2/L3 标准化工具和任何真实生物特征处理均持续 HOLD。任何一项都必须经过独立 Gate，不能从 DEV 完整闭环自动推导为已获授权。

## 8. 当前顺序

1. A：34 页 evidence inventory/page baseline 已完成。
2. B：六条闭环角色、规则、状态与异常已完成。
3. C：本文件补建完成，作为 DEV/mock 总需求、架构、交付与测试 SSOT。
4. D：引用 A/B/C 更新 Family V3 蓝图的 AI-native Control Plane 章节。
5. E：补齐 34 页 route coverage、Mock Action/fixture 清单及真实 LLM Gateway 的页面接入点。
6. F：完成 Web/API 类型、构建、合成 LLM/DB/浏览器验证。
7. G：按原图和闭环交付 `MATCHED / IN_RESEARCH / NOT_MATCHED` 证据表及持续 HOLD 清单。

## 9. 后续 Research Pack（不阻断 A–G）

家庭教育、原素材/历史命名：榜样教育（Bangyang）材料，以及原素材/历史人物名：波波校长的公开材料，将在 A–G 主线形成可验证的 34 页 UI、六条闭环和真实 LLM DEV Gateway 证据后，作为单独的 `FAMILY_EDUCATION_FAMILY_PRINCIPAL_RESEARCH_PACK` 开展；当前对外角色名统一为**法咪莉校长**。它不构成当前页面、闭环、架构、数据模型或真实 LLM 调用的前置条件，也不得中断当前交付节奏。

| 研究材料类别 | 可用位置 | 证据等级与处理 | 明确不得作为 |
|---|---|---|---|
| 家庭教育研究、方法论与行业实践 | 服务问题定义、能力假设、文案与体验设计候选 | 依 Family 既有 `evidence.py` 和 Evidence Gate 登记来源、版本、用途与不确定性 | 教育效果结论、诊断、评分、画像、真实家庭推断 |
| 原素材/历史命名：榜样教育（Bangyang）PPT、课程、案例和品牌材料 | 产品场景、页面语言、服务流程与设计素材 | 一律按**自家素材 E1 上限**处理；不得用 E1 自证效果 | 真实服务资格、资源准入、效果承诺、生产证明 |
| 原素材/历史人物名：波波校长公开材料/观点；当前对外角色名：法咪莉校长 | 研究假设、内容主题、问题框架与后续访谈提纲候选 | 记录原始来源、版本、版权/授权状态并经人工复核 | 独立事实、专业工具依据、模型训练语料、模型输出事实 |

Research Pack 的每一项发现必须标记为“设计素材/假设来源”，保留反证或未知项；任何拟进入资源准入、专业工具、模型提示、页面承诺或真实服务的内容，仍需按 Family Evidence Gate、Consent Gate、Human Gate、Model Gateway 和独立 App Gate 逐项裁决。该研究不使用真实家庭/儿童数据，不复制受版权保护工具题项、计分或报告，也不进入训练、微调或自学习数据集。
