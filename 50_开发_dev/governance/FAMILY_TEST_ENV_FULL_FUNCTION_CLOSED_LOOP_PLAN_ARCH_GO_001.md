# Family App-first 测试环境完整功能闭环计划
## 对应裁决：`ARCH-GO-TEST-FULL-FUNCTION-001`

> **状态：`ENV_SEQUENCE_GOVERNANCE_REQUIRED`。**
>
> 本计划的强制路径为 **DEV-first → TEST-verified → PROD-gated**。DEV 使用合成 fixture、受控 seed、mock executor 与确定性 stub 完成功能开发和自测；只有 DEV 自测通过的功能才可进入 TEST/SANDBOX 做 PostgreSQL 集成、浏览器黄金路径、审计回放与风险复核；PROD 仍需独立 Gate。本文不构成生产、真实用户试用、真实家庭/儿童数据、公开发布、master 合入或任何外部模型调用的授权。

## 1. 强制环境晋级与功能闭环目标

| 环境 | 允许的工作 | 进入条件 | 退出/晋级条件 | 当前禁止 |
|---|---|---|---|---|
| **DEV** | 实现 App-first 闭环、synthetic fixture、seed、mock executor、stub/shell、确定性内部数据、单元/API 自测。 | `ARCH-GO-TEST-FULL-FUNCTION-001` 与本环境序列裁决。 | typecheck、单元测试、DEV API 自测、test-only 标识与零外呼检查通过。 | 真实家庭/儿童数据、真实模型/外发、生产配置、试点、master 合入。 |
| **TEST / SANDBOX** | 承接已 `DEV_READY_FOR_TEST` 的能力，运行真实 PostgreSQL 测试库、集成/E2E、浏览器黄金路径、审计回放、风险复核。 | DEV 证据包齐全，模块标记 `DEV_READY_FOR_TEST`。 | TEST 验证、风险登记、环境隔离、失败关闭复核通过；仅可标记 `TEST_VALIDATED`。 | 生产/真实用户试用、真实数据、外部模型、生产 schema、自动合并。 |
| **PROD** | 当前无实现或发布授权。 | 未来需独立 PROD/真实用户试用 Gate，且先有完整 TEST 证据。 | 不适用。 | 所有运行、发布、真实用户、真实家庭/儿童数据、master auto-merge。 |

每个新增或变更模块必须在源码注释、测试命名、Gate Report 与风险登记中标明以下环境状态之一：`DEV_IMPLEMENTING`、`DEV_READY_FOR_TEST`、`TEST_VALIDATED`、`PROD_HOLD`。任何 test-only schema proposal 必须先以 `DEV_PROPOSAL` 形式单列，通过后才可进入 TEST 验证，绝不直接成为生产 schema。

## 2. 功能闭环目标

完整闭环必须让内部测试身份能够从“当下想理清的支持”出发，经过 L0 Need/Intent、L1 当前可展示的**合成已准入候选**、无排序比较、明确选择或 NO_ACTION，最终看见最小审计回执与文本等价说明。该闭环不是效果验证、教育诊断或真实服务交付；它只是证明流程、边界、退出与 fail-closed 行为可被体验和测试。

```mermaid
flowchart LR
  A[测试身份进入 App] --> B[L0 当下需要\nNeed / 可跳过]
  B --> C[L0 服务偏好\nIntent / NO_ACTION]
  C --> D[L1 test-only admitted candidates\n等量、无排序]
  D --> E[候选详情与比较\n来源/边界/文本等价]
  E --> F{家庭明确动作}
  F -->|选择一项| G[Decision-only\nmock executor 回执]
  F -->|现在先不行动| H[NO_ACTION\n0 Plan / 0 Case]
  F -->|返回/暂停| I[无写入/重新门禁]
  D -->|资格、consent、版本、路由失败| J[安全停止]
  G --> K[测试审计回放]
  H --> K
  I --> K
  J --> K
  K --> L[内部演示路径\n纯文本等价]

  M[Gateway stub] -.不调用模型.-> J
  N[L2/L3 Intake stub] -.不处理题项/计分.-> J
  O[Human Gate placeholder] -.只占位/审计.-> J
```

## 3. 功能地图与状态上限

| 层级 | 测试环境功能 | 最大可写入状态 | 运行类型 | 不得误称为 |
|---|---|---|---|---|
| L0-0 | 入口与说明：为什么问、不会如何使用、如何退出。 | 无。 | 真实现（现有 App 上新增/复用文本页面）。 | 测评、诊断、评分或真实用户同意流程。 |
| L0-1 | 合成 Need：受控短文本或“跳过”。 | `Need`（仅合成测试 family）。 | test-only 数据路径。 | 孩子/家庭事实、问题标签或风险结论。 |
| L0-2 | 合成 Intent：支持偏好确认，或 `NO_ACTION`。 | `Intent` 或 `NO_ACTION`。 | test-only 数据路径。 | 系统推荐、成长画像或真实服务请求。 |
| L1-1 | 合成 admitted candidates：等量、无排序、可读边界。 | 只读 candidates。 | test-only fixture / mock executor。 | 真实资源目录、效果证据、已上线服务。 |
| L1-2 | 详情与比较：相同字段、文本等价。 | 无。 | 真实现 UI + 合成数据。 | 最佳推荐、排序、真实专业解释。 |
| L1-3 | 明确选择确认。 | `Decision`。 | test-only Decision-only 路径。 | Action、Plan、Case、预约或服务交付。 |
| L1-4 | 暂停、返回、退出。 | 无。 | 真实现 UI 状态。 | 拒绝、失败或家庭负面标签。 |
| L1-5 | `NO_ACTION`。 | `NO_ACTION`。 | test-only Decision-only 路径。 | 不需要支持、任务/提醒/营销触发器。 |
| Safety | consent/context/候选/版本/executor/风险路由失败停止。 | 无。 | 真实现门禁 + test fixture。 | 风险判断、危机诊断、转介或报警。 |
| Audit | action/result/fixture/policy/停止原因的最小回放。 | 最小审计记录。 | test-only 审计投影。 | 真实数据留存、效果证据或模型训练语料。 |
| Demo | 内部演示入口、预置状态和黄金路径。 | 无或 test-only 审计。 | test-only。 | 用户试用、生产功能或销售承诺。 |

## 4. 模块边界与拟改文件

### 4.1 API / 编排模块

| 模块 | 拟改/新增文件 | 职责 | 类型 |
|---|---|---|---|
| Test environment policy | `apps/api/src/modules/orchestration/test-env.policy.ts`（新增） | 只有显式 `FAMILY_TEST_FULL_LOOP_ENABLED=true` 且非 production profile 时才允许 test-only fixture/mock 入口；默认关闭。 | 真实现保护壳。 |
| Synthetic fixture catalog | `apps/api/src/modules/orchestration/test-fixtures/synthetic-admitted-candidates.ts`（新增） | 定义合成 candidate ID、来源说明、准入版本、边界、mock executor、合成状态；严禁混入真实资源/家庭数据。 | test-only。 |
| L0/L1 DTO | `apps/api/src/modules/orchestration/l0-l1-test-loop.dto.ts`（新增） | 最小请求/响应 DTO：Need、Intent、candidate view、Decision/NO_ACTION、stop/audit 回执；无 actor/family/subject 自报字段。 | test-only API 契约。 |
| L0/L1 policy | `apps/api/src/modules/orchestration/l0-l1-test-loop.policy.ts`（新增） | 受控文本、无排序映射、禁止文案、状态上限、文本等价、固定停止模板。 | 真实现政策 + test-only 数据映射。 |
| Orchestration service | `apps/api/src/modules/orchestration/orchestration.service.ts` | 新增 test loop 只读/Decision-only 方法；复用可信 family scope、consent、幂等与必要审计；绝不调用既有自动 Plan/Case/AI/外发路径。 | 真实现受控分支。 |
| Controller | `apps/api/src/modules/orchestration/orchestration.controller.ts` | 增加仅内测的受保护端点；明确 action、environment、fixture 与 idempotency 要求。 | 真实现受控分支。 |
| Test audit facade | `apps/api/src/modules/orchestration/test-loop-audit.ts`（新增） | 将最小审计字段组合成可回放投影；不记录完整文本、儿童数据或模型推理。优先复用现有 action/idempotency 审计；若需要持久投影，另报 TEST-ONLY schema proposal。 | test-only。 |
| Gateway stub | `apps/api/src/modules/orchestration/stubs/gateway-stub.ts`（新增） | 仅返回固定 `NOT_ENABLED`/安全停止或合成响应契约；无模型 SDK、无网络、无提示外发。 | stub。 |
| L2/L3 intake stub | `apps/api/src/modules/orchestration/stubs/assessment-intake-stub.ts`（新增） | 仅返回“当前未准入，需要独立 Gate”的静态边界；无题项、无分数、无报告。 | stub。 |
| Human Gate placeholder | `apps/api/src/modules/orchestration/stubs/human-gate-placeholder.ts`（新增） | 记录 `HUMAN_GATE_REQUIRED` 占位与退出文案；不派单、不预约、不外发。 | stub。 |

### 4.2 Web / App-first 模块

| 模块 | 拟改/新增文件 | 职责 | 类型 |
|---|---|---|---|
| L0/L1 状态机 | `apps/web/src/platform/l0l1/test-loop-flow.ts`（新增） | 纯 TypeScript 状态机：入口 → Need → Intent → candidates → detail/compare → confirm/NO_ACTION/pause/safe stop/audit。 | 真实现 UI 状态 + test-only 数据。 |
| API client facade | `apps/web/src/platform/l0l1/test-loop-api.ts`（新增） | 调用受保护的 test-loop API；不保留 family/actor/subject 于前端状态。 | 真实现受控分支。 |
| 页面渲染 | `apps/web/src/platform/render/screens.ts` | 增加 L0/L1 文本优先渲染函数、候选等量卡、详情、比较、Decision 回执、NO_ACTION、安全停止、审计面板。 | 真实现 UI。 |
| Platform app | `apps/web/src/platform/app/platform-app.ts` | 增加仅当 server test-env capability 返回可用时出现的内部演示入口；生产入口默认不可见。 | 真实现受控分支。 |
| Web style | `apps/web/src/styles.css` | 延用杏色、温暖、克制；关键状态只用文字而非颜色/图形表达。 | 真实现 UI。 |
| Demo seed controls | `apps/web/src/platform/l0l1/test-loop-demo.ts`（新增） | 内部演示状态切换，不接受敏感输入；只使用 server fixture aliases。 | test-only。 |

### 4.3 测试与证据模块

| 资产 | 拟改/新增文件 | 作用 |
|---|---|---|
| API unit | `apps/api/src/modules/orchestration/l0-l1-test-loop.policy.spec.ts`（新增） | 无排序、状态上限、禁止文案、固定停止、fixture 隔离。 |
| API integration/E2E | `apps/api/src/modules/orchestration/l0-l1-test-loop.integration.spec.ts`、`l0-l1-test-loop.e2e-spec.ts`（新增） | strict auth、family scope、consent、候选/版本/executor/风险 fail-closed、Decision-only、NO_ACTION 零 Action、审计回放。 |
| Web unit | `apps/web/src/platform/l0l1/test-loop-flow.spec.ts`（新增） | 页面状态、文本等价、返回/暂停/NO_ACTION、禁止排序与文案。 |
| Web rendering | `apps/web/src/platform/render/screens.spec.ts` | DOM/ARIA/文字路径、候选卡等量字段、无图无模型可用。 |
| Browser notes | `reports/l1/ARCH_GO_TEST_FULL_FUNCTION_BROWSER_GOLDEN_PATH_001.md`（新增，完成后） | 内部沙箱路径、截图/日志引用、停止路径和限制说明。 |
| Gate report | `reports/l1/ARCH_GO_TEST_FULL_FUNCTION_GATE_REPORT_001.md`（新增，完成后） | 命令、结果、审计、test-only 明示、持续 HOLD。 |

## 5. API / DTO 清单

| API 候选 | 目的 | 输入 | 输出 | 类型 |
|---|---|---|---|---|
| `GET /families/:familyId/orchestration/test-loop/capability` | 告知当前是否 TEST 环境可用。 | 无。 | `enabled`、`mode=TEST_SANDBOX_ONLY`、`policy_version`。 | 真实现保护壳。 |
| `POST /families/:familyId/orchestration/test-loop/need` | 受控保存合成 Need 或跳过。 | `intent_seed`/受控 need choice；幂等键。 | `need_ref`、下一状态、文本等价。 | test-only。 |
| `POST /families/:familyId/orchestration/test-loop/intent` | 合成 Intent 或 NO_ACTION。 | 受控 intent choice / `DISMISS`；幂等键。 | `intent_ref` 或 NO_ACTION 回执。 | test-only。 |
| `GET /families/:familyId/orchestration/test-loop/intents/:intentId/candidates` | 返回合成 admitted candidates 或安全停止。 | `intentId`。 | 无排序 candidates、版本、固定边界、allowed actions、safe stop。 | test-only fixture + 真实现门禁。 |
| `POST /families/:familyId/orchestration/test-loop/decisions` | 仅记录 Decision 或 NO_ACTION。 | `intent_id`、`candidate_ref`/`DISMISS`、候选版本、幂等键。 | `decision_id`、`action_started=false`、`plan_id=null`、`case_id=null`、mock executor 回执。 | test-only。 |
| `GET /families/:familyId/orchestration/test-loop/audit/:correlationId` | 内部演示审计回放。 | correlation ID。 | 环节、政策版本、fixture alias、动作结果、停止原因；零原文。 | test-only。 |
| `POST /families/:familyId/orchestration/test-loop/stubs/gateway` | 验证 Gateway 默认关闭或固定合成契约。 | 受控 synthetic scenario ID。 | `NOT_ENABLED`/固定合成草稿。 | stub。 |
| `POST /families/:familyId/orchestration/test-loop/stubs/intake` | 验证 L2/L3 未准入停止。 | 受控 category ID。 | `HOLD`、Human Gate placeholder、退出文案。 | stub。 |

## 6. Seed、mock 与审计约束

| 类别 | 允许 | 禁止 |
|---|---|---|
| Test family | 测试库内新建/复用明确标注的 synthetic family、account、membership、consent、intent。 | 真实家庭、真实儿童、从生产拷贝的数据。 |
| Candidates | 合成 alias 与描述，例如 `synthetic:practice:communication-reset`；固定来源为 `TEST_ONLY_SYNTHETIC_FIXTURE`。 | 冒充真实资源、效果证明、商业链接、专业工具内容。 |
| Mock executor | 返回 `MOCK_EXECUTOR_ACKNOWLEDGED`，永远不执行外部操作。 | 发邮件、HTTP 外呼、预约、派单、任务、支付或真人联系。 |
| Audit | `policy_version`、`fixture_version`、`correlation_id`、`input_category`、`decision_type`、`allowed_state_upper_bound`、`safe_stop_reason`、`template_id`。 | Need 原文、儿童信息、完整对话、模型提示/推理、可用于画像的数据。 |
| Demo state | 仅使用服务端返回的 fixture ID 和已签发内部测试身份。 | 前端伪造 family/actor/subject 或任意 candidate。 |

## 7. 真实现、test-only、stub 与 HOLD 对照

| 能力 | 分类 | 说明 |
|---|---|---|
| strict consumer auth、Trusted Family Context、family scope、SERVICE consent、幂等 | **真实现** | 继承现有服务端控制；测试身份仅用于内部验证。 |
| L0/L1 页面、文本等价、返回/暂停/NO_ACTION、安全停止 | **真实现 UI** | 可在测试环境体验；不得宣称生产就绪。 |
| admitted candidates、Need/Intent、Decision-only、mock executor、审计回放 | **test-only** | 仅合成 fixture、内部 DB、显式 feature gate；不能混入真实数据。 |
| Gateway、AI assistant、L2/L3 Intake、Human Gate | **stub / shell** | 不调模型、不收题、不计分、不执行服务；仅展示政策边界与退出。 |
| schema 变化 | **HOLD，除非独立 TEST-ONLY schema proposal 获批** | 默认先采用 fixture/既有表/内存或测试目录；不得默默迁移。 |
| 外部模型、训练、真实数据、真实专业工具、真人服务、商业化、生产/试点/master | **继续 HOLD** | 不因完整闭环计划而改变。 |

## 8. 分环境验证与晋级命令计划

命令以仓库现有 `pnpm` / Turborepo 脚本为准；实施完成后须把实际执行命令、环境变量、通过数与日志路径写入 Gate Report。

| 验证层 | 计划命令 | 验证内容 |
|---|---|---|
| 类型检查 | `pnpm turbo typecheck --filter=@family/api --filter=@family/web`（按实际 package 名修正） | API DTO、服务、Web 状态机和 fixture 类型完整性。 |
| API 单元 | `pnpm --filter @family/api test -- l0-l1-test-loop.policy.spec.ts` | 无排序、限制文案、fixture 隔离、状态上限、stub 行为。 |
| API 集成 | `DATABASE_URL=postgresql://family_test:family_test@localhost:5432/family_test pnpm --filter @family/api test -- l0-l1-test-loop.integration.spec.ts` | 真实 PostgreSQL 测试库上的 auth/consent/Decision/NO_ACTION/audit。 |
| API E2E | 同测试数据库下运行 `l0-l1-test-loop.e2e-spec.ts`。 | 受保护 API 端到端、fail-closed、无 Plan/Case/模型/外发。 |
| Web 单元 | `pnpm --filter @family/web test -- test-loop-flow.spec.ts screens.spec.ts`（按实际 package 名修正） | 状态机、文本等价和受控按钮路径。 |
| 全仓回归 | `pnpm test` / 现有 required CI 目标。 | 不回归既有 P0、资源准入、生命周期与安全能力。 |
| 浏览器沙箱 | 启动本地 TEST profile，使用内部测试身份完成黄金路径与安全停止路径。 | L0→L1→Decision/NO_ACTION→audit 的可体验闭环。 |

## 9. 风险登记：不得误认为生产或用户试用就绪

| 风险 ID | 误解风险 | 强制标记与控制 |
|---|---|---|
| R-TEST-01 | 合成 candidate 被误当真实已准入服务。 | UI/API/audit 明示 `TEST_ONLY_SYNTHETIC_FIXTURE`；禁止生产配置启用。 |
| R-TEST-02 | Mock executor 被误当服务已交付。 | 回执只写 `MOCK_EXECUTOR_ACKNOWLEDGED`，永不写“已完成/有效/改善”。 |
| R-TEST-03 | Decision-only 被误当已创建 Plan/Case。 | 返回和 UI 显式 `action_started=false`、`plan_id=null`、`case_id=null`。 |
| R-TEST-04 | Gateway stub 被误认为 AI 可用。 | 固定 `NOT_ENABLED`，无 SDK/HTTP/模型依赖；feature gate 默认关闭。 |
| R-TEST-05 | L2/L3 Intake stub 被误认为标准化工具或危机方案。 | 无题项、无计分、无报告、无风险/诊断结论、无自动外发。 |
| R-TEST-06 | 内部测试数据泄漏到生产或真实用户环境。 | profile 强隔离、fixture 命名、构建/启动检查、test-only capability 默认关闭。 |
| R-TEST-07 | 演示闭环被误用为效果证据或用户试用资格。 | Gate Report 与 UI 均标注：仅证明内部流程可运行，不证明教育效果、专业有效性或生产就绪。 |
| R-TEST-08 | 新 schema 被误认为可直接进入生产。 | 默认零迁移；任何 schema 方案必须独立 `TEST_ONLY_SCHEMA_PROPOSAL` 与未来生产 Gate。 |

## 10. 阶段性证据提交

| 阶段 | 必交证据 |
|---|---|
| Phase A：test-only 数据与策略 | fixture 源码、隔离开关、unit test、禁止模型/外发扫描结果。 |
| Phase B：L0/L1 闭环 | API/DTO 变更、Web 截图/DOM 文本、Decision/NO_ACTION 和安全停止单测。 |
| Phase C：stub | Gateway/Intake/Human stub 源码、固定响应测试、零网络验证。 |
| Phase D：验证 | typecheck、unit、API integration、真实 PostgreSQL、浏览器黄金路径的命令和结果。 |
| Phase E：收口 | Gate Report、风险登记、持续 HOLD、提交/PR 状态；不合 master。 |

## 11. 立即执行顺序

1. **DEV：** 实现并自测合成 fixture、mock executor、stub、L0/L1 页面和 API；每个模块从 `DEV_IMPLEMENTING` 变更为 `DEV_READY_FOR_TEST` 前，必须有 typecheck、单元/API 自测和零外呼证据。
2. **TEST/SANDBOX：** 仅接收 `DEV_READY_FOR_TEST` 模块，在真实 PostgreSQL 测试库、浏览器黄金路径和审计回放中验证；通过后可标为 `TEST_VALIDATED`。
3. **PROD：** 所有模块持续 `PROD_HOLD`，不得因 DEV 或 TEST 通过而自动晋级。

### DEV 实施顺序

1. 在 DEV 不改 schema 的前提下实现 `test-env.policy`、synthetic fixture catalog、L0/L1 test-loop DTO/policy 与最小审计契约。
2. 在 DEV 添加 API 受保护端点与 Decision-only mock executor 路径，确保零 Plan/Case/AI/外发，并完成单元/API 自测。
3. 在 DEV 添加 Web L0/L1 文本优先状态机、候选页面、比较、确认、NO_ACTION、安全停止与审计面板，并完成无图/无模型路径自测。
4. 在 DEV 添加 Gateway/L2-L3/Human Gate stub，全部默认关闭、零网络；完成代码级零外呼检查。
5. 将已通过 DEV 自测的模块标记为 `DEV_READY_FOR_TEST`，并形成模块级证据包。
6. 在 TEST/SANDBOX 仅对上述模块运行真实 PostgreSQL、浏览器黄金路径、审计回放与风险复核；通过后标记 `TEST_VALIDATED`。
7. 整理证据，明确所有 test-only/stub 标签和 `PROD_HOLD`；不得申请或实施生产晋级。

## 12. 环境状态清单（初始）

| 模块 | 当前状态 | DEV 晋级要求 | TEST 晋级要求 | PROD 状态 |
|---|---|---|---|---|
| 环境政策与 feature gate | `DEV_IMPLEMENTING` | 默认关闭、拒绝 production profile、单元测试。 | 集成测试验证 test/sandbox 仅可用。 | `PROD_HOLD` |
| Synthetic fixture / seed | `DEV_IMPLEMENTING` | 无真实数据证明、fixture 命名和来源标记、单元测试。 | 测试库隔离与清理验证。 | `PROD_HOLD` |
| L0/L1 API 与 Decision-only | `DEV_IMPLEMENTING` | typecheck、单元/API 自测、零 Plan/Case/外呼。 | PostgreSQL/E2E/审计回放。 | `PROD_HOLD` |
| L0/L1 Web | `DEV_IMPLEMENTING` | 状态机/DOM/文本等价测试。 | 浏览器黄金路径与失败关闭复核。 | `PROD_HOLD` |
| Mock executor / audit | `DEV_IMPLEMENTING` | 固定 mock 回执、零网络、零效果断言。 | 审计回放和保留边界复核。 | `PROD_HOLD` |
| Gateway / L2-L3 / Human stub | `DEV_IMPLEMENTING` | 固定 HOLD/NOT_ENABLED 输出、零题项/零模型。 | API/浏览器停止路径验证。 | `PROD_HOLD` |
| Test-only schema proposal | `DEV_PROPOSAL_IF_NEEDED` | 独立提案，不得执行迁移。 | 需独立 TEST schema Gate 才可验证。 | `PROD_HOLD` |

## 参考

[1] 总架构师裁决 `ARCH-GO-TEST-FULL-FUNCTION-001`。
[2] `architecture/FAMILY_L0_CURRENT_NEED_SERVICE_PREFERENCE_UX_GATE_DRAFT_001.md`。
[3] `architecture/FAMILY_L1_SHARED_DECISION_ADMITTED_CANDIDATES_UX_GATE_DRAFT_001.md`。
[4] `architecture/FAMILY_SUPPORT_ASSISTANT_AI_MODEL_GATE_ASSET_INDEX_001.md`。
[5] `governance/FAMILY_L1_APP_IMPLEMENTATION_PLAN_ARCH_GO_L1_APP_001.md`。
[6] `apps/api/src/modules/orchestration/` 现有认证、编排、资源与资格策略实现。

---

**作者：Manus AI**
**日期：2026-08-17（GMT+8）
