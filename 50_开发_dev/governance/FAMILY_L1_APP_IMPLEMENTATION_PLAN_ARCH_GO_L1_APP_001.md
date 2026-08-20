# Family L1「共同决策与已准入候选」
## 最小 App 纵切实施计划
### 对应裁决：`ARCH-GO-L1-APP-001`

> **状态：`APP_CODE_AUTHORIZED_LIMITED / IMPLEMENTATION_PLAN`。**
>
> 本计划只落实总架构师批准的最小 L1 纵切：已准入候选的等量无排序展示、详情/边界说明、明确选择确认、返回、暂停、NO_ACTION 与安全停止。数据库保持 **ZERO MIGRATION**。本文不授权或包含模型、Gateway、真实家庭数据、L2/L3、商业化、真人服务、外部资源、试点、生产或 master 合入。

## 1. 代码事实核对与实施原则

当前编排纵切已有 `recommend` 与 `decide` API，但它们不可以直接作为 L1 App 的展示/选择端点：现有 `recommend` 会生成并持久化**确定性排序**（`rank` 与 `recommended_offer_refs`），而现有 `decide` 在确认后会立即创建 `orchestration_plans`、`service_cases` 并可能进入 AI/外部转介分派。该语义与本裁决的“等量无排序”“`Decision ≠ Action`”“`NO_ACTION = 0 Plan / 0 ServiceCase / 0 Task / 0 Reminder`”不一致。

因此，实施必须新增**最小隔离的 L1 read/decision 路径**：它可以复用既有可信身份、family scope、SERVICE consent、T1/T2 准入规则、`family_service_decisions` 表与幂等机制，但不得调用或改变旧 `recommend`/`decide` 的既有执行语义。这样既不另起一套，也不让 L1 重复走旧的排序/自动 Action 路径。

> **零迁移确认点：** 所有 L1 结果只读取既有 `growth_intents`、`resource_recommendations`、`eligibility_evaluations`、`family_service_decisions`、`idempotency_keys` 等既有表；不得新增迁移、表、列、索引、触发器或后台任务。如不能表达“只记录 Decision 不创建 Plan/Case”，立即停止并提交 schema Gate。

## 2. 拟改文件清单

| 层级 | 拟改/新增文件 | 变更目的 | 是否改 schema |
|---|---|---|---|
| 共享契约 | `packages/contracts/src/*` 中现有编排契约导出点（仅在确有必要时） | 新增只读 `L1AdmittedCandidate`、`L1CandidatesView`、`L1DecisionResult` 的最小 DTO 类型；不暴露 rank、recommended_offer_refs、价格或外部链接。 | 否。 |
| API DTO | `apps/api/src/modules/orchestration/l1-admitted-candidates.dto.ts`（新增） | 定义查询参数与 Decision 请求的最小输入。输入只接受 `intent_id`、`candidate_ref` 或 `DISMISS`、`recommendation_version`、幂等键；不接受 actor/family/subject、自由文本、Plan/Case 字段。 | 否。 |
| 编排策略 | `apps/api/src/modules/orchestration/l1-admitted-candidates.policy.ts`（新增） | 将既有候选快照转换成等量、无排序、无推荐的只读 L1 视图；包含版本、文本等价、允许动作和停止理由映射。 | 否。 |
| 编排服务 | `apps/api/src/modules/orchestration/orchestration.service.ts` | 新增 `getL1AdmittedCandidates` 与 `recordL1Decision`，复用 `loadOpenIntent`、资格事实、T1/T2、SERVICE consent、家庭范围、现有 idempotency 与 `family_service_decisions`；**禁止**调用旧 `recommend`/`decide` 的自动 Plan/Case 路径。 | 否。 |
| 编排控制器 | `apps/api/src/modules/orchestration/orchestration.controller.ts` | 增加严格受保护的 L1 查询与记录端点，继续使用 `OrchestrationAuthGuard`、`RequireOrchestrationAction` 与服务端派生 actor/family。 | 否。 |
| 既有策略测试 | `apps/api/src/modules/orchestration/orchestration-policy.spec.ts`（或新增同模块 spec） | 验证无排序映射、候选白名单、停止原因和文案上限。 | 否。 |
| API/真实 DB 测试 | `apps/api/src/modules/orchestration/orchestration-vertical-slice.e2e-spec.ts`（或新增 L1 e2e/integration spec） | 验证认证、family scope、consent、资格、版本、executor、风险、幂等、Decision/NO_ACTION 零 Action。 | 否。 |
| Web 页面逻辑 | `apps/web/src/platform/l1/l1-shared-decision.ts`（新增） | 纯 TypeScript L1 视图模型/状态机：列表、详情、比较、确认、暂停、NO_ACTION、安全停止；不含模型或评分。 | 否。 |
| Web 渲染 | `apps/web/src/platform/render/screens.ts` | 新增纯文本 L1 页面渲染器和等量候选卡；所有关键动作有文字与无图路径。 | 否。 |
| Web 应用编排 | `apps/web/src/platform/app/platform-app.ts` 与必要的 API 装配处 | 从 Today 或已批准入口进入 L1，并装配受保护 API 调用；不得让前端发送 family/actor/subject。 | 否。 |
| Web 测试 | `apps/web/src/platform/l1/l1-shared-decision.spec.ts`（新增）、`apps/web/src/platform/render/screens.spec.ts`、`apps/web/src/platform/app/platform-app.spec.ts` | 覆盖状态机、无排序、文案、文本等价、返回/暂停/NO_ACTION/安全停止。 | 否。 |
| 样式 | `apps/web/src/styles.css`（仅必要时） | 沿用现有杏色、温暖、克制风格；不以颜色/图形承载决策语义。 | 否。 |
| 证据与状态 | `governance/PROGRAM_STATUS_PLATFORM_V1.md`、新 Gate Report（完成后） | 只记录“内部确定性开发/验证中或完成”的过程证据；不变更任何 HOLD → GO。 | 否。 |

## 3. 受保护 API 与 DTO 契约

端点名称将在实施时以仓库现有路由风格落实；若当前模块无法以以下最小契约表达，停止而不扩展 schema。

| 端点候选 | 受保护动作 | 请求最小字段 | 返回最小字段 | 服务端强制门禁 |
|---|---|---|---|---|
| `GET /families/:familyId/orchestration/intents/:intentId/l1-admitted-candidates` | `ReadFamily` | 仅 path `familyId`、`intentId`。 | `intent_id`、`recommendation_id`、`version`、`candidates[]`（`offer_ref`、`resource_type`、等量 `source/admission/boundary` 摘要、允许动作）、`safe_stop`。 | strict consumer auth、trusted family context、family scope、SERVICE consent、intent ownership/open 状态、候选准入/T1、版本、executor/风险路由、文本等价。 |
| `POST /families/:familyId/orchestration/l1-decisions` | `DecideGrowthService`（既有 Named Action） | `intent_id`、`recommendation_id`、`recommendation_version`、`decision_type`、`selected_offer_refs`；`Idempotency-Key`。 | `decision_id`、`outcome`=`DECISION_RECORDED` 或 `NO_ACTION`、`allowed_state_upper_bound`、`action_started=false`、`plan_id=null`、`case_id=null`。 | 上述全部门禁 + 候选精确版本/白名单 + 明确选择/NO_ACTION integrity + 重新检查 T2/PRACTICE/executor/风险路由。 |

### DTO 字段来源、可见性与撤回语义

| 字段 | 来源 | 可见性 | Consent/撤回语义 |
|---|---|---|---|
| `intent_id` / `recommendation_id` / `version` | 既有编排记录。 | 仅当前可信 family scope。 | consent 无效/撤回时不返回家庭特定对象。 |
| `offer_ref` / `resource_type` | 已持久化的既有 T1 候选快照。 | 仅当前已准入候选；不暴露供应商内部资料、价格、外部 URL。 | 候选降级/撤销/版本不一致即不返回。 |
| 准入/来源/边界摘要 | 既有资源目录/候选快照的可展示字段，由服务端固定映射。 | 只读、等量、文本优先。 | 不推断效果；E1 最多说明来源/版权边界。 |
| `safe_stop` / reason code | 服务端门禁结果的受控枚举。 | 仅中性停止原因；不透露敏感安全细节。 | consent/上下文不合法时仅返回最小停止结果。 |
| `decision_id` / `outcome` | 既有 `family_service_decisions` 记录。 | 当前可信 family scope。 | 撤回停止后续复用和 Action；不承诺删除必要审计历史。 |

## 4. L1 状态与服务端行为

| 家庭动作 | L1 最多写入 | 服务端行为 | 严格禁止 |
|---|---|---|---|
| 查看候选/详情/比较 | 无。 | 只读合格候选；无排序；每次输出文本等价字段。 | 写 Decision/Plan/Case、生成推荐排序或效果结论。 |
| 返回 | 无。 | 仅前端状态切换。 | 自动转为 NO_ACTION 或添加提醒。 |
| 暂停 | 无。 | 仅前端状态切换；后续重新查看必须重新门禁。 | 持久化负面状态、任务、提醒、画像。 |
| 明确选择一个候选 | `Decision`。 | 在写入前重新核验精确 T1 快照、T2/PRACTICE、executor、consent、风险路由、版本、白名单、幂等。返回 `action_started=false`、`plan_id=null`、`case_id=null`。 | 创建 Plan/Case、启动 AI、外发、预约、支付或执行资源。 |
| 明确 `NO_ACTION` / `DISMISS` | `NO_ACTION`。 | 记录显式 Dismiss，返回零执行结果。 | Intent/Plan/Case/Task/Reminder、营销或跨家庭再利用。 |
| 门禁失败 | 无。 | 返回固定中性 `safe_stop`；不显示不合格候选。 | 兜底展示历史/外部/未准入资源，或要求敏感补充。 |

## 5. 实施顺序与零迁移确认点

| 顺序 | 工作项 | 完成判据 | 失败停止点 |
|---|---|---|---|
| 1 | 建立 L1 只读 DTO/策略与单元测试。 | 输出不含 rank、recommended_offer_refs、效果/商业字段；候选等量。 | 若必须暴露排序或无法从既有快照得到可展示摘要，停止。 |
| 2 | 增加受保护的 L1 查询端点。 | family/context/consent/候选/版本失败均只返回安全停止或拒绝。 | 若需新增查询表/索引/缓存表，停止并提交 schema Gate。 |
| 3 | 增加仅记录 Decision/NO_ACTION 的服务端路径。 | 写入复用既有决策与幂等；返回 `plan_id=null`、`case_id=null`、`action_started=false`。 | 若现有 `family_service_decisions` 无法表达该语义且必须改 schema，停止。 |
| 4 | 追加 API/真实 PostgreSQL 负例与回归。 | 通过所有保护、门禁、幂等、零 Action 测试；旧路径回归不受损。 | 任何调用触发 Plan/Case/AI/外发，立即回滚该路径并修订。 |
| 5 | 开发纯文本 Web L1 状态机与渲染。 | 列表、详情、比较、确认、返回、暂停、NO_ACTION、安全停止都可在无图/无模型路径完成。 | 若 UI 需要新数据采集、模型或跨家庭数据，停止。 |
| 6 | 沙箱浏览器黄金路径与回归。 | 内部测试身份 + `family_test` 数据库完成授权路径与 fail-closed 路径。 | 需真实家庭数据、移动端 runtime、生产配置或外部服务时停止。 |
| 7 | 整理证据与状态。 | typecheck、Vitest、API、PG、浏览器、日志索引齐全。 | 未完成所有证据不得宣称 Gate 关闭、不得合 master。 |

## 6. 测试计划

### 6.1 单元测试

| 测试组 | 关键断言 |
|---|---|
| L1 view policy | 不输出 `rank`、`recommended_offer_refs`、价格、外链或效果断言；候选按稳定展示序列但不向用户披露排序语义。 |
| 候选白名单 | 只读视图仅含持久化 recommendation candidates 与仍然合格的 T1/T2 结果；未准入、过期、无 executor 或版本不一致即剔除/停止。 |
| 文案与文本等价 | 每个状态都有返回/暂停/NO_ACTION/退出文字；禁止“最佳、最适合、系统建议、必须、保证、评分、诊断、会员”等。 |
| Decision integrity | 选择必须属于当前候选精确版本；`DISMISS` 必须空选择；重复幂等键重放、冲突 409。 |
| 零 Action | `recordL1Decision` 永远不调用 Plan/Case/AI/external referral 代码路径；返回 `action_started=false`。 |

### 6.2 API 与真实 PostgreSQL 集成测试

| 编号 | 场景 | 必须结果 |
|---|---|---|
| L1-API-01 | 有效 strict consumer auth、唯一 family scope、有效 consent、当前合格候选。 | 返回无排序等量候选；只读，无写入。 |
| L1-API-02 | 无 bearer/x-actor-only、account disabled、binding/membership 无效或 context ambiguous。 | 401/403 或中性安全停止；零候选/零写入。 |
| L1-API-03 | consent 缺失/撤回。 | 零个性化候选、零 Decision/Plan/Case。 |
| L1-API-04 | 未准入、降级、过期、版权/证据/版本不完整候选。 | 不展示/不选择；不以缓存兜底。 |
| L1-API-05 | T2/PRACTICE/executor 缺失或风险路由不清。 | 不允许记录可执行选择；零 Plan/Case/AI/外发。 |
| L1-API-06 | 浏览/详情/比较后未确认。 | 零 Decision/Plan/Case。 |
| L1-API-07 | 明确选择一个合格候选。 | 只新增 Decision；`action_started=false`、`plan_id=null`、`case_id=null`。 |
| L1-API-08 | 明确 NO_ACTION。 | 只新增 NO_ACTION；`0 Plan / 0 Case / 0 Task / 0 Reminder`。 |
| L1-API-09 | `Idempotency-Key` 同请求重放 / 同键内容冲突。 | 前者不重复写，后者明确拒绝。 |
| L1-API-10 | ADT/生物特征/儿童直接作答/诊断/危机/第三方外发/商业动作。 | 不处理自动路径；不收集、不外发、不执行。 |

### 6.3 沙箱浏览器黄金路径

| 路径 | 验证点 |
|---|---|
| 合格候选 | 登录后的内部测试身份进入 L1 → 等量列表 → 详情/比较 → 返回 → 选择确认 → 仅 Decision 已记录。 |
| 暂停 | 列表/详情点击暂停 → 回到可退出状态 → 无服务事实新增。 |
| NO_ACTION | 候选页选择“现在先不行动” → 中性确认 → 无 Plan/Case/Task/Reminder。 |
| 无候选/资格失效 | 显示安全停止；无外部资源、无真人承诺、无敏感补充要求。 |
| 文本等价 | 禁用/不加载图片、动效、模型后，关键说明和全部动作仍可达。 |

## 7. 仍然 HOLD 的范围

严格保持：模型调用、Gateway、AI 助手 UI、训练/微调/自学习、真实家庭/儿童数据、L2/L3、标准化工具、ADT/生物特征、儿童直接作答、诊断、风险判断、危机处置、自动报警/转介、未准入/外部资源、真人服务、组织访问、第三方外发、Enrollment/Delivery、支付/会员/权益/增长、成长分/排名/标签/画像/效果断言、跨家庭能力、公开成长 IP、移动端 runtime、真实试点、生产、公开发布、master 合入与 AUTO_MERGE。

## 8. 实施前核对结论

本计划与 `ARCH-GO-L1-APP-001` 对齐：采用**零迁移**、最小 API/DTO、既有认证/Trusted Context/family scope、既有 Named Action 与内部确定性测试方式；同时通过隔离新的 L1 只读/只 Decision 路径，避免复用旧的“排序推荐 + Decision 即 Plan/Case/执行”语义。

若总架构师没有额外修改，本计划满足“计划符合裁决后继续实现”的前置要求。实施期间一旦遇到需要 schema 变更、自动 Action、模型、真实数据、专业工具、外部服务或任何未列出的能力，立即 `HOLD` 并提交新的 Gate 输入。

## 参考

[1] `governance/FAMILY_L1_SHARED_DECISION_APP_DEVELOPMENT_TASK_CONTRACT_DRAFT_001.md`。
[2] `architecture/FAMILY_L1_SHARED_DECISION_ADMITTED_CANDIDATES_UX_GATE_DRAFT_001.md`。
[3] `governance/AUTHORIZATION_REGISTRY.yaml`。
[4] `apps/api/src/modules/orchestration/orchestration.controller.ts`。
[5] `apps/api/src/modules/orchestration/orchestration.service.ts`。
[6] `apps/api/src/modules/orchestration/recommendation.policy.ts`。
[7] `apps/api/src/modules/orchestration/decision-integrity.policy.ts`。

---

**作者：Manus AI**
**日期：2026-08-17（GMT+8）
