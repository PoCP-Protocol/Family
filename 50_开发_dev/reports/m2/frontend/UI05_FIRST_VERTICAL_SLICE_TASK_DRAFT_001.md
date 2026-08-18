# UI-05 First Vertical Slice — Approved Task Draft

> **状态：** `APPROVED_TASK_DRAFT_FOR_ARCHITECT_REVIEW`
>
> **性质：** 任务草案，不是代码变更，不是开发完成声明。该草案只允许 UI-05 单一纵切进入下一步设计和实现评审；不得同时启动 34 UI 全量开发。

## 1. Task Title

**UI-05 90 天成长方案：plan_draft → FamilyDecision → Named Action 受控边界纵切**

## 2. Goal

把 UI-05 从静态方案页面转成一个**真实可验证但不触发外部 effect 的 L1/L2 受控能力**：系统能够在 tenant/family scope 下读取带版本和来源的 `plan_draft`，展示阶段/周计划/任务三态的只读投影，允许家庭表达接受、调整、拒绝或暂停意向，并把该意向记录为独立的 `FamilyDecision` 候选；只有在满足 Consent、actor、family scope、证据、版本和 Human Gate 后，才允许通过明确的 Named Action 合同进入后续受权运行态。

## 3. Scope

### In scope

| 范围 | 内容 |
|---|---|
| UI-05 read projection | 90天周期、阶段节点、周计划、任务三态、来源/版本、空态、阻断态和版本冲突态。 |
| Plan draft contract | `plan_draft_id`、`plan_version`、`source_report_id`、`family_id`、`as_of`、`evidence_refs`、`visibility`、`status`。 |
| Family Decision candidate | 查看、接受、调整、拒绝、暂停意向的受控记录；Decision 与 Recommendation、Action 分离。 |
| Named Action boundary | 仅设计/实现受控 action contract；DEV/TEST 可使用 no-op/stub，不创建真实外部效果。 |
| Policy/Gate | tenant/family scope、actor、Consent、purpose、evidence、risk、Human Gate、reversible/pause policy。 |
| Audit/idempotency | correlation_id、idempotency_key、source_page_id、source_report_id、plan_version、actor、audit event。 |
| Web evidence | UI-05 页面状态、按钮边界、loading/empty/blocked/version-conflict 和 API contract smoke。 |

### Out of scope

不得在本任务中自动创建或推进真实 `Journey`、`Task`、`Intervention`、`Booking`、`ServiceRecord`、Notification、Calendar、Video、Payment、Share 或真人服务。不得把 UI-04 的 72、同龄平均、问题标签或敏感建议当作家庭事实、诊断事实、排名或总分。不得让 AI 直接写 `Family`、`Person`、`Need`、`Capability`、`Journey`、`Task`、`Outcome` 等核心 Ontology。不得开发 UI-06、UI-09、UI-19 或其它页面的业务代码；它们只作为后续 lineage target。

## 4. Target State Machine

| state | source/projection | allowed write | transition | forbidden upgrade |
|---|---|---|---|---|
| `PLAN_DRAFT_READY` | versioned PlanDraft | 无；只读 | 家庭查看 | 不自动创建 Journey/Task |
| `PLAN_DRAFT_BLOCKED` | missing scope/consent/evidence/version | 记录 block/audit only | NO_ACTION 或补充授权 | 不匿名降级、不绕过 Gate |
| `FAMILY_DECISION_CANDIDATE` | actor 提交的家庭意向 | 写 Decision candidate | accept/amend/reject/pause | 不等于 Action，不写运行态 |
| `FAMILY_DECISION_REVIEW_REQUIRED` | policy/risk/evidence 命中 | 写 HumanReview request | approve/reject/return | AI 不自动批准 |
| `FAMILY_DECISION_CONFIRMED` | 家庭确认且 Gate 通过 | 可进入受控 Named Action | `ProposeGrowthPlanAction` | 不直接触发外部 effect |
| `ACTION_STUB_RECORDED` | DEV/TEST no-op/stub | 记录 action contract/audit | 返回 projection | 不创建生产 Journey/Task/Intervention |
| `PAUSED_OR_REVOKED` | 家庭暂停/撤回或 Consent 撤回 | 写 pause/revoke event | 停止后续动作 | 不自动提醒、推进或联系真人 |

## 5. Recommendation / Decision / Action Boundary

| 层级 | 代表对象 | 允许内容 | 禁止内容 |
|---|---|---|---|
| Recommendation | UI-04 explanation、建议列表、PlanDraft 内的候选步骤 | 解释、候选、证据引用、不确定性、问题说明 | 不能成为 Family Fact、Plan Fact 或 Task Fact |
| Decision | FamilyDecision | actor、family_id、consent、source_report_id、plan_version、接受/调整/拒绝/暂停意向、可逆策略 | 不能由模型或 CTA 自动伪造；不能缺审计和版本 |
| Action | Named Action | 受权、幂等、可审计的状态变更合同；DEV/TEST 可 no-op/stub | 不能将 UI 点击直接变成真实 Journey/Task/Intervention 或外部 effect |

建议的受控 Named Action 候选如下：

```text
ReadPlanDraft
ProposeFamilyDecision
ConfirmGrowthPlan
AmendOrRejectPlanDraft
PauseGrowthPlanDecision
RevokeGrowthPlanDecision
```

其中 `ConfirmGrowthPlan` 在本任务中最多记录受权动作合同或 DEV/TEST stub；是否允许其创建真实 Journey/Task/Intervention，必须作为后续独立 slice，不在本任务内隐式升级。

## 6. Predicted Touched Files（仅预测，不代表已修改）

| 层 | 预测文件/目录 | 预计职责 | 当前任务状态 |
|---|---|---|---|
| API contract | `apps/api/src/.../growth-plan*.contract.ts` 或现有 contracts 目录 | PlanDraft DTO、FamilyDecision DTO、Named Action request/result、错误码 | 待架构师确认实际入口 |
| Web client/view | `apps/web/src/...` 或现有 34 UI shell/route 文件 | UI-05 route、projection render、decision intent、blocked/empty/version-conflict 状态 | 不在本草案中直接修改 |
| Service | `apps/api/src/.../growth-plan*.service.ts` | tenant/family scope、projection、Decision candidate、policy调用 | 仅设计边界 |
| DB/migration | `migrations/` 或 PostgreSQL migration 目录 | 如现有表不足，补 PlanDraft/PlanVersion/FamilyDecision/AuditEvent 最小结构 | 先查现有对象，禁止重复建表 |
| Policy | `.../policy`、Consent/Model Gateway policy 目录 | scope、purpose、risk、evidence、Human Gate、external_effect=false | 复用共享规则，不按页面复制 |
| Audit/event | `.../audit`、`EventEnvelope`、Page Objects/Named Actions | correlation_id、source_page_id、source_report_id、actor、version、idempotency | 必须与动作一致提交 |
| Tests | focused API/unit/integration/Web/negative tests | scope、consent、version、idempotency、state transitions、no external effect | 必须与实现同一 slice |

## 7. Consent / Human Gate / Audit / Idempotency

### Consent and scope

客户端不得提交或覆盖 `tenant_id`、`family_id`、`actor_id`、角色、source report 或模型身份。服务端从认证主体和 Membership 派生 tenant/family scope。缺少有效 `GROWTH_PLAN` purpose consent、家庭关系授权、过期授权或目标 Person 可见性时，必须返回 `CONSENT_REQUIRED` 或 `CONTEXT_BLOCKED`，不得匿名降级。

### Human Gate

以下任一条件命中即进入 `HUMAN_REVIEW_REQUIRED` 或 `NO_ACTION`：报告含敏感诊断/风险或未验证结论；计划建议涉及未成年人高风险、敏感干预或真人服务；证据等级不足；家庭决策主体不明确；版本冲突；需要创建真实 Journey/Task/Intervention；任何通知、预约、支付、日历、视频或外发动作。

### Audit fields

至少记录：`tenant_id`、`family_id`、`actor_id`、`source_page_id=UI-05`、`source_report_id`、`plan_draft_id`、`plan_version`、`decision_id`、`named_action`、`policy_version`、`consent_ref`、`correlation_id`、`idempotency_key`、`before_state`、`after_state`、`external_effect=false`、`created_at`、`reason` 和 `reversible_or_pause_policy`。

### Idempotency and concurrency

相同 `idempotency_key`、相同 family、相同 action 和相同 plan version 必须返回同一结果，不能重复创建 Decision 或 Action event。服务端必须校验 `row_version`/`plan_version`，版本过期时返回 `PLAN_VERSION_CONFLICT`，不覆盖新版本。暂停、撤回和拒绝必须可追溯，不得删除历史审计。

## 8. Test Plan

| Test layer | Required evidence |
|---|---|
| Contract/unit | PlanDraft、FamilyDecision、Named Action request/result schema；禁止客户端覆盖 tenant/family/actor/source IDs；错误码和状态枚举稳定。 |
| Service/policy | wrong tenant/family、无 membership、consent 缺失/撤回/过期、evidence 缺失、敏感风险、版本冲突均 fail-closed。 |
| PostgreSQL integration | PlanDraft 版本读取、Decision candidate 写入、audit/event、idempotency replay、pause/revoke、row version conflict。 |
| Web route/smoke | UI-05 route 显示 plan_draft；loading/empty/blocked/version-conflict；“开始执行”只发 Decision candidate，不发真实 runtime action。 |
| Named Action | `ProposeFamilyDecision`、`ConfirmGrowthPlan` stub、`AmendOrRejectPlanDraft`、`PauseGrowthPlanDecision`；确认 external_effect=false。 |
| AI safety | 模型输出只能是 explanation/recommendation/draft；schema validation；不能写核心 Ontology；敏感输出进入 Human Gate。 |
| Audit evidence | 每个受控写入均有 correlation_id、idempotency_key、source_page_id、source_report_id、actor、consent 和 policy version。 |

## 9. 验收命令草案

以下命令是后续实现完成后的最窄验证草案；当前不执行，因为本文件只做任务设计：

```bash
# 进入仓库
cd /home/ubuntu/family-repo-review/50_开发_dev

# 预计的 focused API / service / integration tests
pnpm test --filter family-api -- growth-plan
pnpm test --filter family-api -- family-decision
pnpm test --filter family-api -- named-action

# 预计的 Web focused test/typecheck
pnpm --dir apps/web typecheck
pnpm --dir apps/web test -- ui05

# 只读安全检查
rg -n "external_effect|HUMAN_REVIEW_REQUIRED|CONSENT_REQUIRED|PLAN_VERSION_CONFLICT|idempotency_key|correlation_id" apps/api apps/web
```

最终验收必须同时证明：可以读取真实或 synthetic 的 PlanDraft projection；可以在家庭授权下记录 Decision candidate；可以幂等重放；可以在版本冲突/撤回/暂停时 fail-closed；不能自动创建真实 Journey/Task/Intervention；没有外部 effect；前端页面不是静态 mock。

## 10. 架构师/用户确认问题

| confirmation_id | 问题 | 阻塞项 |
|---|---|---|
| U05-C-001 | UI-04 报告中的 72、同龄平均、标签和敏感建议是否在 UI-05 只作为 explanation/recommendation 展示，并加 evidence/uncertainty 标签？ | Report→Plan source contract |
| U05-C-002 | 计划草稿是否允许展示“未开始/进行中/已完成”三态，还是首版只能展示阶段/任务模板？ | PlanDraft projection semantics |
| U05-C-003 | `ConfirmGrowthPlan` 在 DEV/TEST 是否只记录 stub action，不创建任何真实 Journey/Task/Intervention？ | Named Action ceiling |
| U05-C-004 | FamilyDecision 的 actor 是家长 principal、家庭共同决策人，还是由现有 Membership policy 派生？ | actor/authorization |
| U05-C-005 | `GROWTH_PLAN` purpose consent 的标准名称、过期策略、撤回语义和 UI 呈现是什么？ | Consent Gate |
| U05-C-006 | UI-05 是否需要支持“拒绝/调整/暂停/撤回”四类意向，还是首版只支持查看和确认候选？ | state machine scope |
| U05-C-007 | 现有 Journey/Task/FamilyDecision/Page Objects 表和 migration 是否可复用？禁止重复建表。 | DB/API file scope |

## 11. Approved Task 边界

在架构师/用户确认 U05-C-001 至 U05-C-007 前，本任务只能保持为 approved draft，不得进入业务代码实现。确认后也只允许按本文件的 UI-05 单一纵切推进，UI-09、UI-19 和其它 UI 不得混入同一 commit 或同一验收范围。

**UI05_FIRST_VERTICAL_SLICE_TASK_DRAFT_READY** `reports/m2/frontend/UI05_FIRST_VERTICAL_SLICE_TASK_DRAFT_001.md`

## References

[1]: `FAMILY_34_UI_FEATURE_REVIEW_001.md` — UI-05 暴露点、遗漏、血缘和工程边界复核。
[2]: `FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md` — PlanDraft、FamilyDecision、Named Action 与全局血缘台账。
[3]: `FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md` — UI-05 单图/PPT L4 视觉锚点。


## UI-05 Visual Replication Acceptance Criteria

UI-05 首个纵切必须先完整复刻用户提供的 UI-05 原始静态画面，再接入动态数据、plan_draft projection、FamilyDecision 和受控 Named Action。动态化不能成为先做一个通用计划页、再事后补视觉的理由；视觉复刻是本纵切的前置验收门，不是可选的 UI polish。

验收至少包括以下四类证据：

| 验收维度 | 必须证明的内容 |
|---|---|
| Screenshot baseline comparison | 在固定的 desktop/mobile viewport 下，将实现截图与 UI-05 原始截图或经人工确认的 visual baseline 进行对比，核对页面结构、布局层级、文案、卡片、按钮、图标位置、状态区、颜色和间距意图。 |
| Desktop/mobile viewport | 至少验证设计基准桌面视口和移动视口；不能因为响应式改写而丢失阶段线、周计划、任务卡、CTA 或返回/暂停入口。 |
| DOM text coverage | 对原画面中可见的标题、阶段文案、任务文案、按钮、状态标签、风险/权限提示进行 DOM 文本覆盖核验；不能以图片占位或不可访问文本替代。 |
| Interaction state coverage | 对静态和动态交互状态逐项截图/记录，证明视觉结构在加载、阻断、草稿和家庭决策回显过程中保持一致。 |

必须覆盖以下 UI-05 状态：

| 状态 | 视觉复刻要求 | 动态边界 |
|---|---|---|
| 静态态 | 完整复刻原始 90 天页面、3/12/36/90 阶段线、周计划、任务卡和主 CTA。 | 仅 visual baseline，不写状态。 |
| 加载态 | 保持页面主骨架、标题层级和卡片占位意图，不出现通用模板替换。 | 只读请求中；不触发 Action。 |
| 空态/权限态 | 明确显示无计划、无权限、scope 不匹配或 consent 缺失的可理解提示，保持原页面导航和返回层级。 | `NO_ACTION` 或 `CONSENT_REQUIRED`；fail-closed。 |
| 计划草稿态 | 复刻阶段、周计划、任务三态和来源/版本提示。 | `plan_draft/read_projection`，不创建真实 Journey/Task。 |
| 待确认态 | 保持原 CTA 和家庭确认入口的视觉位置，同时明确待确认/证据不足/人工审核提示。 | `FamilyDecision candidate` 或 `HUMAN_REVIEW_REQUIRED`。 |
| 确认后只读回显态 | 在不重排原画面的情况下显示已确认的决策摘要、版本和审计可追溯信息。 | 只读回显；不得把回显伪装成真实运行态。 |
| 暂停/调整入口态 | 保持返回、调整、暂停和撤回入口的原位置及文案意图。 | 只能发起受控 Decision/Named Action；不自动推进 Journey/Task/Intervention。 |

未通过 screenshot baseline comparison、desktop/mobile viewport、DOM text coverage 或 interaction state coverage 的 UI-05，不得声明 `UI-05 runtime complete`，即使 API、数据库、测试或 Named Action contract 已通过。视觉复刻验收必须与功能验收同时通过，才可以将该纵切从 task draft 推进到 completed runtime slice。
