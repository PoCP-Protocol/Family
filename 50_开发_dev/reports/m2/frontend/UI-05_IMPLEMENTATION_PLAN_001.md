# UI-05 Implementation Plan 001

> **页面：** UI-05 / 90天成长方案
>
> **当前阶段：** 代码实况审计与第一轮实施计划
>
> **计划性质：** 本文件是 UI-05 单一纵切的实施计划，不代表代码已经完成，也不授权 34 UI 全量开发。
>
> **审计结论：** `UI-05 视觉基线已具备，但代码实现必须等待 UI-05_BA_DESIGN_90_DAY_GROWTH_001.md 完成，并通过架构/业务确认。`
>
> **实施准入：** `BA_DESIGN_REQUIRED_BEFORE_IMPLEMENTATION`。UI-05 视觉基线已具备，但在 `UI-05_BA_DESIGN_90_DAY_GROWTH_001.md` 完成并通过架构/业务确认前，不进入业务代码实现。

## 1. Code Reality Audit

### 1.1 Visual baseline

| 项目 | 当前事实 | 证据 |
|---|---|---|
| UI ID / route | UI-05 映射为 `core-plan` | `apps/web/src/test-loop.js` 中 `FAMILY_UI_34_ROUTE_MANIFEST`。 |
| 原始视觉基线 | 90 天成长方案单图存在，尺寸 434×1130 | `apps/web/public/bangyang-reference/growth-plan-90day-reference-434x1130.png`。 |
| 可见结构 | 顶部返回/标题/右侧菜单；橙色当前阶段卡；3/12/36/90 统计；纵向第1~4周计划卡；底部橙色“开始执行计划”按钮。 | UI-05 reference image；与 `FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md` 和 `FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md` 对照。 |
| 视觉映射状态 | 当前仓库已有 UI-05 reference 及 route 映射；不把 UI-01~UI-12 的整体映射缺口误用于 UI-05。 | `FAMILY_34_UI_DEVELOPMENT_ADMISSION_001.md` 的 UI-05 准入行。 |
| 视觉门禁 | 必须先复刻原画面，再接动态数据；未通过截图对标不得声明 runtime 完成。 | `FAMILY_34_UI_DEVELOPMENT_ADMISSION_001.md` 的 `Visual Fidelity Gate`。 |

### 1.2 Current frontend implementation

当前 Web 入口为 `apps/web/src/test-loop.js`。UI-05 的 `corePlan()` 通过 `clearReference('growth-plan-90day-reference-434x1130.png', ...)` 渲染整张静态参考图，并在底部叠加一个 `clear-bottom-cta` hotspot。该 hotspot 的 `data-by` 值为 `core-community`，点击后直接把页面切换到 UI-06 `core-community`。

因此当前实现具有以下边界：

| 已存在 | 尚未存在 |
|---|---|
| 34 页 route manifest；UI-05 → `core-plan` 路由；原图背景复刻；底部 CTA 热点；导航/返回壳。 | plan_draft API/read projection；FamilyDecision API；UI-05 专用 action contract；版本冲突；loading/empty/permission/consent/blocked 状态；暂停/调整/拒绝；前端真实数据渲染；后端 DB projection；UI-05 audit/idempotency/correlation_id 链。 |

### 1.3 Current backend and shared infrastructure

现有 `apps/api/src/modules/orchestration/orchestration.controller.ts` 已有以下可复用模式：

| 入口 | 当前用途 | UI-05 复用结论 |
|---|---|---|
| `POST /families/:familyId/orchestration/intents` | 通过 `ConfirmGrowthIntent` 创建显式 GrowthIntent | 可作为 UI-05 上游 intent 边界参考，不直接当作 PlanDraft API。 |
| `POST /families/:familyId/orchestration/intents/:intentId/recommendations` | 生成 recommendation | 可作为 Recommendation 来源，不可直接当作 Decision/Action。 |
| `POST /families/:familyId/orchestration/decisions` | `DecideGrowthService`，需要 recommendation/version/decision_type | 可复用 FamilyServiceDecision 的 actor、scope、version、idempotency 模式，但需核对其与 UI-05 plan draft 的语义。 |
| `GET /families/:familyId/orchestration/test-loop/llm/pages` / `POST .../llm/draft` | 受 Gateway policy 约束的 DEV/TEST explanation draft | 只能提供 explanation/recommendation/draft，不能创建 Plan/Task。 |
| `GET/POST .../orchestration/test-loop/page-objects` | Page Objects projection/action | 只能作为 audit/idempotency/action envelope 参考，不能把 UI-05 CTA 直接接成 UI-09 完成动作。 |

`apps/api/src/modules/orchestration/llm-gateway/family-llm-page-policy.ts` 当前将 UI-05 的 `allowed_state_upper_bound` 设为 `READ_ONLY_ADMITTED_CANDIDATES`，supported actions 为 `RETURN/PAUSE/NO_ACTION`。这与 UI-05 第一轮的 L1/L2 上限一致：PlanDraft 先只读，家庭意向必须另行成为 Decision candidate，不能由 LLM 直写核心对象。

数据库 `database/migrations/0020_growth_orchestration_v1.sql` 已存在可复用的共享对象：`growth_intents`、`resource_recommendations`、`family_service_decisions`、`orchestration_plans`、`service_cases`。其中 `orchestration_plans` 是声明式 steps 结构，注释明确其不是执行真相；`family_service_decisions` 记录 recommendation/version/decision_type/selected_offer_refs/actor。当前尚未发现 UI-05 专用的 `plan_draft` 读取 DTO、FamilyDecision adapter、Named Action 事件和 Web client，因此实施必须先做 contract gap closure，不得重复造 34 套页面能力。

现有 `apps/api/src/audit/audit.service.ts` 已接受 `actor`、`correlationId`、`source` 和 payload，并以结构化审计输出；测试数据库已清理 `audit_logs`、`idempotency_keys`、`orchestration_plans`、`family_service_decisions` 等共享表。第一轮应复用这些能力，并确认真实写入是否已有统一 event/audit 表，而不是另建 UI-05 私有审计机制。

## 2. Visual Baseline Checklist

UI-05 开发前必须逐项锁定以下视觉基线：

| baseline_item | UI-05 原图要求 | implementation rule |
|---|---|---|
| 顶部导航 | 返回箭头、居中“90天成长方案”、右侧菜单/系统图标 | 保留原位置、层级、字号意图；动态状态不能隐藏返回。 |
| 当前阶段卡 | 橙/浅橙背景、目标图标、当前阶段、目标、预计时长/难度 | 数据注入只能替换允许的字段，不能改变卡片结构。 |
| 统计区 | `3 大阶段 / 12 周计划 / 36 个任务 / 90 天陪伴` | 作为 plan_draft projection；不把统计变成家庭总分或效果证明。 |
| 纵向时间线 | 第1周关系破冰、第2周行为训练、第3周习惯建立、第4周情绪管理及节点线 | 状态点、任务完成态和版本提示必须在原区域内呈现。 |
| 任务卡 | 每周标题、说明、任务行、完成/未开始状态、语义图标 | 不新增通用列表替代原卡片；状态变化保持原卡片边界。 |
| 主 CTA | 底部橙色“开始执行计划” | 第一轮只能触发 FamilyDecision candidate/受控 Named Action；不能直接创建 Journey/Task。 |
| 响应式 | 手机原图为主；desktop 以居中手机画布保持比例 | 必须保留 434:1130 的视觉比例与可见结构。 |
| 异常态 | loading、空计划、无权限、consent 缺失、版本冲突、Human Gate | 不能跳出原页面 shell；异常信息应在可见状态区内表达。 |

## 3. Exact Screen Replication Acceptance Criteria

UI-05 第一轮的 static screen 必须在动态化前达到以下条件：

1. 原图的顶部结构、橙色阶段卡、3/12/36/90 统计、四段时间线、任务卡和底部 CTA 均存在，顺序不变。
2. 原图可见中文文案必须有 DOM 文本覆盖；不得只用背景图片伪装交互页面。
3. desktop 与 mobile viewport 均保留手机画布比例、结构层级和 CTA 可见性。
4. screenshot baseline comparison 中不能出现主结构缺失、CTA 错位、文字改写、导航层级改变、卡片合并或颜色/间距意图丢失。
5. 静态态、loading、空态/权限态、plan_draft、待确认、确认后只读回显、暂停/调整入口态均必须保留同一视觉骨架。
6. 未通过视觉对标，不得声明 `UI-05 runtime complete`，即使 API 和单元测试通过。

## 4. API Contract Plan

### 4.1 Read projection

建议新增共享 Growth Plan projection contract，而不是在页面组件内拼接字段：

```ts
type Ui05GrowthPlanProjection = {
  page_id: 'UI-05';
  family_id: string;
  subject_person_id: string;
  plan_draft_id: string | null;
  plan_version: number | null;
  source_report_id: string | null;
  status: 'READY' | 'EMPTY' | 'BLOCKED' | 'VERSION_CONFLICT' | 'REVIEW_REQUIRED';
  current_stage: { title: string; goal: string; duration_days: number; difficulty?: string; } | null;
  metrics: { stages: number; weeks: number; tasks: number; duration_days: number; } | null;
  weeks: Array<{
    week_no: number;
    title: string;
    summary: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'UNKNOWN';
    tasks: Array<{ task_key: string; label: string; status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'UNKNOWN'; }>;
  }>;
  evidence_refs: string[];
  uncertainty: string[];
  consent: { purpose: string; status: 'GRANTED' | 'REQUIRED' | 'WITHDRAWN' | 'EXPIRED'; };
  allowed_actions: Array<'RETURN' | 'PAUSE' | 'NO_ACTION' | 'PROPOSE_FAMILY_DECISION' | 'AMEND_PLAN_DRAFT'>;
  external_effect: false;
  correlation_id: string;
};
```

### 4.2 Candidate endpoints

| method | endpoint candidate | purpose | write ceiling |
|---|---|---|---|
| `GET` | `/families/:familyId/orchestration/ui-05/growth-plan` | 读取 UI-05 projection，服务端派生 tenant/family/actor scope | L1 read projection |
| `POST` | `/families/:familyId/orchestration/ui-05/family-decisions` | 记录接受/调整/拒绝/暂停的 Decision candidate | L2/L3 boundary；需 policy/consent/audit/idempotency |
| `POST` | `/families/:familyId/orchestration/ui-05/actions/propose-decision` | 明确 Named Action envelope；DEV/TEST 可 stub/no-op | 只写 Decision/action audit，不创建 runtime objects |
| `POST` | `/families/:familyId/orchestration/ui-05/actions/pause` | 受控暂停/撤回意向 | 只写可逆状态和审计 |

UI-05 第一轮不得从浏览器直接调用 `CREATE_PLAN`、`CREATE_JOURNEY`、`CREATE_TASK`、`CREATE_INTERVENTION` 或任何外部 adapter。客户端不得提交或覆盖 tenant、family、actor、source report 和 policy identity。

## 5. DB / Read Model Plan

优先复用 `0020_growth_orchestration_v1.sql` 的 `growth_intents`、`resource_recommendations`、`family_service_decisions` 和 `orchestration_plans`。先通过只读 query 将 `orchestration_plans.steps` 投影为 UI-05 周计划；如果现有字段不足以支持 draft/version/source report/consent/evidence，则新增最小迁移前必须由架构师确认，不能把 UI-05 页面状态直接写进 `orchestration_plans` 执行真相。

最小 read model 需要能够追溯：`tenant_id`、`family_id`、`subject_person_id`、`plan_id/plan_draft_id`、`version`、`source_report_id`、`accepted_by_decision_ref`、`steps`、`status`、`evidence_refs`、`policy_version`、`consent_ref` 和 `updated_at`。若当前 schema 没有 `source_report_id` 或 evidence/consent provenance，首轮可用明确的 projection adapter 返回 `BLOCKED/REVIEW_REQUIRED`，而不是猜测补值。

## 6. Frontend Route / Component Plan

当前 route 保持 `core-plan`，不新建第二个 UI-05 route。实现应把当前 `corePlan()` 从整图背景热点逐步升级为保留原视觉结构的组件树：

```text
Ui05Route
├── Ui05TopBar
├── Ui05CurrentStageCard
├── Ui05MetricsRow
├── Ui05WeekTimeline
│   └── Ui05WeekCard × N
├── Ui05DecisionFooter
└── Ui05StatusOverlay / Ui05GateNotice
```

前端状态必须至少包括 `loading`、`empty`、`blocked/permission`、`plan_draft_ready`、`family_decision_pending`、`confirmed_readback`、`paused_or_amended`、`version_conflict` 和 `client_failure`。所有可写按钮必须通过统一 client 发出带 `correlation_id`、`idempotency-key` 的 contract request，并根据服务端 `allowed_actions` 决定是否显示或禁用；按钮不能凭页面本地状态越权。

第一轮视觉实现原则是“结构先不变，内容再接线”：先用原图建立 DOM 等价骨架和 overlay/hotspot 对照，再把 plan_draft 字段填入对应节点。不要把当前参考图直接替换成无结构的 generic cards。

## 7. Backend Service / Controller Plan

建议新增共享 `GrowthPlanProjectionService` 和 `FamilyDecisionBoundaryService`，挂到现有 `OrchestrationController` 或共享 orchestration module；不要按 UI-05 单独复制一套数据库/权限策略。

服务端职责为：

1. 从认证主体派生 family/tenant/actor scope，校验 membership 和目标 subject。
2. 读取 plan draft/projection 与 report provenance；缺少 source/evidence/consent 时 fail-closed。
3. 将 `Recommendation`、`PlanDraft`、`FamilyDecision`、`Named Action` 分层，不允许 LLM 输出直接创建 plan 或 task。
4. 对 Decision candidate 记录 actor、family_id、source_report_id、plan_version、consent_ref、policy_version、correlation_id 和 idempotency_key。
5. 在 DEV/TEST 中将 action 适配器固定为 `external_effect=false` 的 stub；不触发通知、预约、支付、日历、视频、分享或真人服务。
6. 通过统一 audit/event service 记录 before/after、reason、reversible/pause policy 和拒绝原因。

## 8. Data Lineage Plan

```text
UI-04 explanation/recommendation
  → source_report_id + evidence_refs + uncertainty
  → PlanDraft / OrchestrationPlan projection
  → UI-05 read projection
  → FamilyDecision candidate
  → Named Action contract (DEV/TEST stub only)
  → audit/event + correlation/idempotency
  → UI-05 confirmed/paused readback
  → future UI-06/UI-09/UI-31 projections
```

UI-05 首轮只读取受控 projection，并最多写 Decision candidate 或可逆 pause/revoke 记录。不得把 recommendation 当成事实，不得把 plan draft 当成 execution truth，不得由 UI-05 自动创建 Journey、Task、Intervention 或 ServiceCase。

## 9. Tests and Browser Screenshot Plan

| 层级 | 计划证据 |
|---|---|
| Contract | DTO schema、错误码、allowed_actions、external_effect=false、客户端不可覆盖 scope/source。 |
| Service | tenant/family mismatch、无 membership、无 consent、withdrawn/expired consent、无 evidence/source report、敏感风险、版本冲突均 fail-closed。 |
| DB integration | PlanDraft/OrchestrationPlan projection、FamilyDecision candidate、audit、idempotency replay、pause/revoke、row-version conflict。 |
| Web | UI-05 route、DOM text coverage、loading/empty/permission/draft/pending/readback/paused/version-conflict 状态。 |
| Browser | Playwright 截图：原图尺寸/手机 viewport、desktop viewport、mobile viewport；对照 `growth-plan-90day-reference-434x1130.png`。 |
| Consistency | fixture 字段与 API DTO 一致；页面显示字段必须来自 DTO 或标明 projection fixture；禁止仅用静态 mock 宣称完成。 |

候选最窄命令：

```bash
cd /home/ubuntu/family-repo-review/50_开发_dev
pnpm run typecheck
pnpm --filter @family/web test -- ui05
pnpm --filter @family/api exec vitest run --config vitest.unit.config.ts
# 完成 Web server 后再执行 UI-05 Playwright/browser smoke 与截图差异审计
```

## 10. Risk / HOLD List

| 风险/阻塞 | 当前状态 | 处理 |
|---|---|---|
| UI-05 原图 | 已定位 | 以 repo reference image 作为当前 visual baseline；不得改版。 |
| UI-05 动态 API | 未发现专用 contract/endpoint | 需要新增共享 projection/Decision boundary 设计。 |
| PlanDraft provenance | `orchestration_plans` 具备 plan/version/steps，但 source_report/evidence/consent 字段需确认 | 缺口时返回 BLOCKED/REVIEW_REQUIRED，不猜测填充。 |
| FamilyDecision 语义 | 已有 `family_service_decisions`，但需确认其与成长方案确认是否同一事实边界 | 需要架构师确认复用或扩展；不重复造表。 |
| Named Action | 现有 `RequireOrchestrationAction` 和 Page Objects action 可复用模式，但没有 UI-05 专用动作 | 先定义 contract；DEV/TEST 只 stub。 |
| LLM | UI-05 policy 目前为 `READ_ONLY_ADMITTED_CANDIDATES` | 只能解释/草稿，不允许模型写核心 Ontology。 |
| Visual baseline image-to-UI | UI-05 单图已定位；UI-01~UI-12 全体映射仍有人工缺口 | 不阻塞 UI-05 单页，但不得据此开放全量 UI。 |
| 外部 effect | 未授权 | 永久保持本轮 L4 HOLD。 |

## 11. Implementation Decision

当前 **UI-05 视觉基线已具备**，但代码实现必须等待 `UI-05_BA_DESIGN_90_DAY_GROWTH_001.md` 完成，并通过架构/业务确认；在编写业务代码前，必须完成以下架构确认：

1. `family_service_decisions` 是否正式承载 UI-05 的 FamilyDecision，还是仅用于 service recommendation。
2. `orchestration_plans` 的 `DRAFT/PROPOSED` 是否可作为 UI-05 plan_draft projection，且如何补 provenance 而不改变执行真相边界。
3. `GROWTH_PLAN` consent purpose 和目标 subject/person visibility 的正式规则。
4. `ConfirmGrowthPlan` 是否在 DEV/TEST 只记录 Named Action stub，绝不创建真实 Journey/Task/Intervention。
5. UI-05 原图中的阶段/任务文案哪些是静态 visual copy，哪些可由受控 projection 替换。

在上述 5 项没有确认前，允许继续做**不写业务代码的 BA、契约和视觉对标准备**；不应直接进行 DB migration 或状态写入实现。`UI-05_BA_DESIGN_90_DAY_GROWTH_001.md` 完成且通过架构/业务确认后，才进入 UI-05 前后端同一纵切实现。

**BA_DESIGN_REQUIRED_BEFORE_IMPLEMENTATION**

**UI05_IMPLEMENTATION_PLAN_READY** `reports/m2/frontend/UI-05_IMPLEMENTATION_PLAN_001.md`

## References

[1]: `apps/web/src/test-loop.js` — UI-05 `core-plan` route、visual reference 和 CTA 绑定。
[2]: `apps/web/public/bangyang-reference/growth-plan-90day-reference-434x1130.png` — UI-05 visual baseline。
[3]: `apps/api/src/modules/orchestration/orchestration.controller.ts` — 现有 orchestration、decision、LLM、Page Objects API 入口。
[4]: `apps/api/src/modules/orchestration/llm-gateway/family-llm-page-policy.ts` — UI-05 LLM state ceiling。
[5]: `database/migrations/0020_growth_orchestration_v1.sql` — GrowthIntent、Recommendation、FamilyServiceDecision、OrchestrationPlan 和 ServiceCase 定义。
[6]: `FAMILY_34_UI_DEVELOPMENT_ADMISSION_001.md` — UI-05 准入与 Visual Fidelity Gate。
