# DEV 真实 LLM：实时模型目录与 Gateway 边界核对 001

> **状态：** `DEV_REAL_LLM_DESIGN_INPUT`
> **获取时间：** 2026-08-17 GMT+8
> **目录来源：** 沙箱内置 OpenAI 兼容代理 `GET $OPENAI_API_BASE/models`；完整原始响应保存在 `reports/l1/live_llm_model_catalog.json`。

## 1. 实时可用模型能力

本次实时目录返回 10 个模型，全部声明支持工具调用、视觉输入、JSON Schema 结构化输出和推理；代理当前不提供流式输出。模型 ID 与能力应在每次实现/部署前重新读取目录，不得硬编码为永久事实。

| 模型 | 推理参数 | 适合的 DEV 角色 | 备注 |
|---|---|---|---|
| `gpt-5-nano` | `reasoning` | 低成本结构校验、轻量分类 | 不作为复杂家庭解释默认模型 |
| `gpt-5-mini` | `reasoning` | 常规结构化解释、fixture 摘要、批量评测 | DEV 默认候选 |
| `gpt-5` | `reasoning` | 复杂业务规则解释、工具调用测试 | 受预算与严控评测约束 |
| `gpt-5.5` | `reasoning` | 高难推理和红队评测 | 仅评测/架构验证候选 |
| `claude-haiku-4-5` | `thinking` | 低延迟解释草稿 | 必须显式 thinking 预算 |
| `claude-sonnet-4-6` | `thinking` | 复杂场景解释、代码与规则推理 | DEV 高质量候选 |
| `claude-opus-4-6` | `thinking` | 高难规则评测 | 仅受控使用 |
| `claude-opus-4-7` | `thinking` | 高难红队/评测 | 仅受控使用 |
| `gemini-3-flash-preview` | `thinking` | 合成多模态 fixture、长上下文分析 | 使用 `max_tokens`，不能用 GPT 的 token 参数 |
| `gemini-3.1-pro-preview` | `thinking` | 长上下文、多模态复杂推理与评测 | 使用 `max_tokens`，不能用 GPT 的 token 参数 |

## 2. DEV 真实 LLM 选型建议

| 用例 | 第一候选 | 备用候选 | 必须的调用约束 |
|---|---|---|---|
| 家庭支持解释草稿 | `gpt-5-mini` | `claude-sonnet-4-6` | 只传合成/测试 fixture 的最小快照；JSON Schema 输出；输出后验证 |
| UI 文本等价说明 | `gpt-5-mini` | `gemini-3-flash-preview` | 不传真实页面会话或家庭数据；结果仅为草稿 |
| 受控工具调用验证 | `gpt-5` | `claude-sonnet-4-6` | 工具仅 Mock Action 白名单；模型不具备数据库写权限 |
| 高危负例/红队 | `gpt-5.5` | `claude-opus-4-7` | 合成用例；严格 schema；结果进入 Eval 审计 |
| 多模态合成素材理解 | `gemini-3-flash-preview` | `gemini-3.1-pro-preview` | 只用合成/公开许可素材；不处理真实家庭照片/语音/视频 |

## 3. 已核对的 Gateway 强制边界

现有 AI Model Gate 和 Gateway 策略草案仍是真实 LLM DEV 架构的控制基线。DEV 真实模型调用必须继承以下规则：

1. 模型调用只能从单一 Gateway 发出，Gateway 默认拒绝，环境开关必须显式开启。
2. 模型只接收服务端构建的最小、结构化、测试 fixture 快照；不读取数据库、不读取真实家庭档案、不读取完整对话。
3. 模型输出只能是说明草稿或固定结构结果；不拥有 Need、Intent、Decision、Plan、Case、FollowUp、资源准入或审计事实写权限。
4. 工具调用只能访问 Mock Action 白名单，且每次工具执行必须独立做 schema、环境、principal、family fixture、幂等和审计验证。
5. 输入前拦截至少覆盖未准入候选、未成年人直接输入、诊断/专业工具、危机、生物特征、consent/上下文失效、外发、训练请求和版本不匹配。
6. 输出后验证至少阻断事实链写入、评分/标签、诊断/风险、最佳推荐/排序、效果承诺、幻觉资源、自动服务、商业诱导和缺失文本等价。
7. 全部真实 LLM 请求和回放仅使用合成/测试数据；禁止训练、微调、自学习、真实家庭数据、真实外发与生产调用。

## 4. 实现前仍需补齐的架构项

| 项目 | 实现目标 | 验收方式 |
|---|---|---|
| DEV LLM Gateway | 服务器端单一入口、模型 allowlist、环境开关、request/response schema | 单元测试 + API 集成 |
| Context Assembler | 将 mock family/journey/fixture 最小化为只读快照 | 白名单字段测试 |
| Tool Registry | 只允许 Mock Action；模型工具结果不可绕过服务端 guard | 工具越权负例 |
| Output Validator | JSON Schema + 词法/枚举/状态上限/fixture 交叉检查 | 合成正负例 100% |
| Audit & Replay | 记录模型/提示/策略/fixture/action/验证决策，无不必要原文 | 回放审计测试 |
| Kill Switch | 按全局、模型、能力、页面和测试 family fixture 立即关闭 | fail-closed 测试 |
| Eval Harness | 既有合成 Eval 与 Gateway 阻断策略自动化 | 高危漏过即 BLOCKED |

## 5. 结论

DEV 可以使用真实 LLM 跑完整合成闭环，但该能力应被实现为**可关闭、可验证、无核心写权限、无真实数据、无训练、无真实服务执行的受控 AI Control Plane**。UI 中的 AI 报告、AI 陪跑和 AI 问答页面只在通过上述 Gateway、工具、输出验证和评测后才能连接真实 LLM；其余页面可继续使用 mock adapter，直到相应能力经过独立验证。

## 参考

- 实时模型目录：`reports/l1/live_llm_model_catalog.json`。
- `architecture/FAMILY_SUPPORT_CONVERSATION_ORCHESTRATION_ASSISTANT_AI_MODEL_GATE_DRAFT_001.md`。
- `architecture/FAMILY_SUPPORT_ASSISTANT_GATEWAY_INTERCEPTION_AND_REFUSAL_POLICY_DRAFT_001.md`。
- `architecture/FAMILY_SUPPORT_ASSISTANT_SYNTHETIC_EVAL_NEGATIVE_TEST_SUITES_DRAFT_001.md`。

## 6. API Key 安全约束与配置槽位规范

> **硬约束：** 真实 LLM API key 仅在测试时由用户通过本地环境变量、`.env.local` 或受控 secret 注入。真实 key 不得写入、复制、回显、序列化或持久化到 Manus 对话、代码、文档、fixture、日志、审计、回放样本、异常文本、截图或测试快照。

| 类别 | 允许做法 | 禁止做法 |
|---|---|---|
| 配置槽位 | 仅声明 `FAMILY_LLM_API_KEY`、`FAMILY_LLM_API_BASE`、`FAMILY_LLM_MODEL`、`FAMILY_LLM_ENABLED` 等变量**名称** | 提供真实 key 示例、默认值、占位 token 格式或将 key 拼接到 URL |
| 注入位置 | 用户本地环境变量、未提交的 `.env.local`、受控 secret store | 已提交 `.env`、源代码常量、测试 fixture、CI 日志或文档 |
| 启动检查 | 仅检查变量是否存在、是否非空、是否满足启用条件；返回枚举化缺失原因 | 记录变量实际值、前缀、长度、哈希、Base64 或任何可识别片段 |
| 调用与错误 | 在服务器端内存中使用配置；失败时返回通用 `LLM_NOT_CONFIGURED`、`LLM_DISABLED` 或 `LLM_PROVIDER_UNAVAILABLE` | 将请求 header、异常对象、环境转储、供应商响应中的认证信息写入日志 |
| 审计与回放 | 只记录模型 ID、政策版本、fixture ID、请求类别、验证结论和时间戳 | 记录 API key、Authorization header、原始 prompt、完整 response 或真实凭证相关文本 |

Gateway 的启动与每次调用必须执行 fail-closed 检查：当 `FAMILY_LLM_ENABLED` 未显式开启、所需配置槽位缺失、运行环境不属于允许的 DEV/TEST 范围、模型不在 allowlist，或安全配置版本不匹配时，Gateway **不得发起任何模型调用**，而必须返回可文本等价呈现的固定停止结果。密钥在任何情况下都不得进入浏览器、客户端 bundle、工具参数、Model Context、fixture、回放、日志或测试断言。

### 6.1 API Key 安全验收项

1. 代码库全文搜索不得出现真实密钥、Authorization header、`.env.local` 内容或任何凭证值；只允许出现 env var **名称**。
2. `.env.local`、`.env.*.local` 与私有密钥文件必须被 Git 忽略；提交前检查应阻止其被纳入暂存区。
3. 启动测试在 key 缺失时必须返回 `LLM_NOT_CONFIGURED`，并确认零网络模型调用、零密钥回显。
4. 运行测试在模型关闭、模型不在 allowlist、调用失败或输出验证失败时必须 fail-closed；日志与审计样本不得含认证信息。
5. 浏览器 bundle、API 响应、截图、重放文件和 Vitest 快照中不得出现任何 API key 或认证 header。
6. 用户提供真实 key 后，测试证据只能报告“配置存在且调用结果通过/失败关闭”，不得摘录、显示或推断 key 的任何特征。
