# Family / 伐木累：真实 LLM DEV 证据包 001

**环境状态：** `DEV_READY_FOR_TEST`
**提交：** `73f18d9`（`platform-family-growth-vertical-slice-001`，已同步至对应远端分支）
**产品范围：** 34 页 UI、六条闭环、真实 LLM Gateway、测试 PostgreSQL、Web 原图路由与命名 alias。
**不代表：** master 合入、生产发布、真实用户试用、真实家庭/儿童数据处理、真实支付/预约/咨询/社区外发、训练/微调或商业化运营已获放行。

## 1. 已交付的真实运行能力

| 领域 | 已实现能力 | DEV/TEST 数据或副作用隔离 |
|---|---|---|
| 真实 LLM Gateway | 单一服务器端入口、配置解析、模型 allowlist、环境开关、最小快照、严格结构化输出、Validator、Tool Registry、最小审计与 replay | 只接受合成 fixture；真实 key 仅由用户在测试时本地 env/`.env.local`/受控 secret 注入。 |
| 配置失败关闭 | `BLOCK_CONFIGURATION / LLM_DISABLED / draft=null` 仍完成受控请求处理与审计，零 provider 网络调用、零领域状态写入 | HTTP `201` 仅表示受控处理已完成，不表示模型被调用或产生业务结果。 |
| 审计回放 | PostgreSQL `family_llm_gateway_audits`、trace、fixture/version、page、use case、模型 ID（可空）、策略/判定/工具元数据 | 不保存或返回 provider 原文、真实 prompt、模型推理、完整家庭文本、认证 header 或真实 key。 |
| 34 页 Web 体验 | `FAMILY_UI_34_ROUTE_MANIFEST` 覆盖 UI-01 至 UI-34；可受控直达；透明热点、文本等价与原图 asset 路径共存 | 图片/route/source 路径保留 `bangyang-reference` 作为历史素材 alias；运行时新增标签使用 Family/伐木累规则。 |
| 六条浏览器路径 | 核心服务、增长/计划、商城、名师、线下沙龙、社区、客户后台关键路径已抽样浏览器核验 | 无 API 时固定文本等价回退；未触发真实支付、预约、社区外发或权益写入。 |

## 2. 验证结果

| 验证 | 最终结果 |
|---|---|
| PostgreSQL API integration | `TEST_DATABASE_URL='postgresql://family_test:family_test@localhost:5432/family_test' pnpm --filter @family/api exec vitest run src/modules/orchestration/l0-l1-test-loop.integration.spec.ts --config vitest.integration.config.ts` → **1 file passed / 5 tests passed** |
| API typecheck | `pnpm --filter @family/api typecheck` → **通过** |
| 真实 Gateway 单元测试 | `pnpm --filter @family/api exec vitest run src/modules/orchestration/llm-gateway/family-llm-gateway.spec.ts` → **通过**（已在开发中运行） |
| Web 全量测试 | `pnpm --filter @family/web test` → **10 files passed / 61 tests passed** |
| Web typecheck | `pnpm --filter @family/web typecheck` → **通过** |
| Web build | `pnpm --filter @family/web build` → **通过** |
| 34 页 Web Gateway 测试 | `pnpm --filter @family/web exec vitest run src/test-loop.gateway.spec.ts` → **4 tests passed** |
| Git 质量 | `git diff --check` → **通过**；提交前 staged credential scan → **0 potential secret files** |

> Web 全量测试中的 JSDOM `navigation` 警告来自既有 WAF 测试的浏览器未实现提示；测试结论为 10 files / 61 tests 全部通过，不构成失败。

## 3. 浏览器关键路径状态

详细观察记录见 `reports/l1/WEB_BROWSER_SMOKE_FINDINGS_001.md`。

| 闭环 | 浏览器状态 | 说明 |
|---|---|---|
| 核心服务：首页 → 体检 → 测评 → 报告 → 计划 | `MATCHED` | 原图热点可达；未启动 API 时展示固定文本等价。 |
| 增长：报告 → 计划 → 任务入口 | `MATCHED` | 原图报告/计划页面与退出路径可达。 |
| 商城：商城 → 商品详情 → 拼团/分享入口 | `MATCHED` | 透明热点几何已补齐；未接生产支付。 |
| 名师服务：专区 → 详情 → 预约 | `MATCHED` | 预约原图可达；无 API 时安全回退。 |
| 线下沙龙：列表 → 活动详情 → 我的活动 | `MATCHED` | 页面与回流路径可达；未发起真实报名。 |
| 社区：社区 → 发布 | `MATCHED` | 发布页原图可达；无真实外发。 |
| 客户后台：年度会员 → 我的服务/档案 | `MATCHED` | 路由与文本等价可达；未写真实档案/权益。 |
| 34 页像素级视觉差异 | `IN_RESEARCH` | 关键页面已抽样；尚未完成 34/34 浏览器截图的像素差异表。 |

## 4. 密钥与数据安全验收

真实 LLM API key 只允许通过 `FAMILY_LLM_API_KEY`、`FAMILY_LLM_API_BASE`、`FAMILY_LLM_MODEL`、`FAMILY_LLM_ENABLED`、`FAMILY_LLM_ENVIRONMENT` 等**变量名称**在本地环境变量、未提交 `.env.local` 或受控 secret 中注入。代码、文档、fixture、日志、审计、回放、截图与测试快照均不得包含真实值、前缀、长度、hash 或 Authorization header。密钥缺失或环境/allowlist 无效时 Gateway 必须 fail-closed。

当前未注入用户真实 key；因此，真实 provider 的成功调用、结构化响应验证、审计回放和 Kill Switch 的 live call 验收状态为 `IN_RESEARCH`。这不是功能缺失，而是等待用户按约束提供本地受控测试配置后执行的最后一段 DEV 验证。

## 5. Family / 伐木累命名一致性

`governance/FAMILY_PRODUCT_NAMING_AND_LEGACY_ALIAS_MAPPING_001.md` 已定义并验证：产品显示名为 Family / 伐木累，对外角色名为法咪莉校长。已提交代码、路由、原图/PPT 文件名、asset/source 路径与 Git 历史保持原状；“榜样教育（Bangyang）”及“波波校长”只作为“原素材/历史命名”或“原素材/历史人物名”的可追溯 alias 出现。

## 6. 持续 HOLD 与下一步

| 项目 | 当前状态 | 进入条件 |
|---|---|---|
| 真实 LLM live-call DEV 验收 | `IN_RESEARCH` | 用户以本地受控 env/secret 注入真实 key；完成正例、负例、审计和 Kill Switch 验收。 |
| TEST/SANDBOX 提升 | `NOT_STARTED` | DEV live-call 证据、全套 Gateway Eval、完整 34 页视觉差异表、风险复核。 |
| PROD / 真实用户 / 真实数据 | `PROD_HOLD` | 独立 Human Gate、隐私/Consent、数据治理、外部 adapter、上线与运营审查。 |
| 真实支付、预约、咨询、社区外发 | `PROD_HOLD` | 生产 adapter、法务/合规、资金/履约/服务责任与独立能力 Gate。 |
| 训练、微调、自学习 | `PROD_HOLD` | 独立模型/数据/伦理裁决；本轮未实现。 |

## 7. 未随本轮提交的工作区资产

工作区仍有早期研究、PPT 分析、历史转录、视觉切片与草案等未跟踪资产。它们未纳入本轮提交，避免把未经本轮复核的历史研究输出与已验证的 Gateway/34 页实现混合。任何后续纳入版本控制的资产均应先执行命名 alias、证据等级、版权/来源和密钥扫描复核。
