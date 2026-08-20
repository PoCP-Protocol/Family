# UI-01 + UI-09 First Real Slice Admission and API Contract Candidate 001

## 1. Candidate status and authority boundary

```text
PHASE=FIRST_SLICE_ADMISSION_API_CONTRACT_CANDIDATE
SOURCE_RESEARCH=reports/m2/frontend/34_UI_WIDE_RESEARCH_TO_DEVELOPMENT_SLICE_001.md
UI_SCOPE=UI-01,UI-09
SLICE_NAME=Family Today and Daily Task Check-in
IMPLEMENTATION_ALLOWED=NO_UNTIL_ARCHITECT_HUMAN_APPROVAL
BUSINESS_CODE_MODIFIED=NO
OPENAPI_FILES_CREATED=0
FILES_CREATED=1
FILES_UPDATED=0
```

本文件将 Wide Research 中的首批纵切**建议**收敛为可审阅的最小准入与 API Contract 候选。它不是 Architect/Human Decision record，不是正式 OpenAPI，也不授权修改 `apps/api`、`apps/web`、`database`。所有 `PROPOSED_DECISION` 与 `PROPOSED_DEFAULT` 仅供审批；在每项获得指定 Decision owner 的可审计记录前，`IMPLEMENTATION_ALLOWED=NO_UNTIL_ARCHITECT_HUMAN_APPROVAL` 保持不变。[1]

> **不变边界。** `Fact != Perspective != Hypothesis != Recommendation != Decision != Action`，`Read Projection != Controlled Draft != Named Action != External Effect`。任务完成只记录被授权的行动状态；Reflection 是带边界的 Perspective；两者都不自动生成 Outcome、诊断、家庭总分、家庭排名或教育效果结论。

## 2. Slice purpose, in-scope flow and authority model

该切片仅打通一个最小内部闭环：经授权的家长在 UI-01 看见家庭范围内的今日任务摘要，在 UI-09 读取同一任务的详情并提交一次受控 check-in；服务端复验 family/actor/consent/task 状态，记录 audit/outbox 后返回 readback projection。它不新建任务、不创建 Plan、不发送提醒，也不调用模型或外部系统。

```text
FamilyContextProjection (UI-01)
→ TodayTaskProjection (UI-01 summary / UI-09 detail)
→ guardian check-in command
→ policy + consent + task-state validation
→ CompleteGrowthAction Named Action candidate
→ audit + idempotency + outbox event
→ TaskCheckinResultProjection / refreshed TodayTaskProjection
```

| Authority | Candidate responsibility | Not authorized in this candidate |
|---|---|---|
| Architect | Object/state semantics、DTO boundary、routing、policy/adapter/no-op design review | 不能以技术建议代替业务或隐私 Decision。 |
| Human business/policy owner | 任务状态文案、Consent purpose、guardian/child actor scope、synthetic seed policy | 不能授权未列明的外部效果。 |
| Existing service code | 作为可复用输入：`getTodayAction`、`CompleteGrowthAction`、permission/consent/idempotency/audit/outbox。 | 现有能力不等于 UI-01/UI-09 已获得接口或视觉实现准入。 |
| Web UI | 在获准后读取 projection、发起确定的 Named Action、显示受控状态。 | 不得构造 family/actor/subject、改写 core ontology 或把 click 视为完成。 |

## 3. Five bounded decisions

五项问题均保持未裁决状态。`PROPOSED_DEFAULT` 是可审阅的最小方案，并非已生效决定。

| ID | Decision required | Decision owner | Candidate options | Proposed default | Implementation consequence | Status |
|---|---|---|---|---|---|---|
| D-01 | **UI-01/UI-09 baseline + route binding。**确定 UI-01 Home 与 UI-09 Daily Task 的 canonical baseline、固定 viewport、route 及状态插入区。 | Product/Visual owner + Architect | A. 采用当前 repo baseline；B. 以用户确认原图覆盖；C. 标记 HOLD 并先冻结。 | `PROPOSED_DECISION`: 对 UI-01 使用 `core-01-home.png`，对 UI-09 使用 `growth-03-daily-task.png`；route 和 viewport 另行冻结在验收表。 | 决定组件树、文本 allowlist、截图对与 Playwright diff 基准。 | DECISION_REQUIRED |
| D-02 | **Task status copy/state semantics。**确定服务端 `PENDING/COMPLETED` 与 UI 中文案、可见状态和可否重试之间的对应。 | Domain architect + Business owner | A. “待完成/已完成”；B. “待打卡/已记录”；C. 仅展示状态代码。 | `PROPOSED_DECISION`: UI 展示“今日行动/已记录”，避免将 `COMPLETED` 误读为 Outcome；服务端状态保留原枚举。 | 决定 DTO 映射、按钮禁用、成功/冲突/replay 文案和测试断言。 | DECISION_REQUIRED |
| D-03 | **Consent + role matrix。**确定 guardian、child、coach 的读写范围，以及此次 Action 所需 purpose。 | Privacy/child-safety owner + Architect | A. 仅 guardian 可读写；B. guardian read/write、child read；C. child 在单独 consent 下可写。 | `PROPOSED_DECISION`: 首轮 synthetic fixture 仅 ACTIVE OWNER/GUARDIAN 可读写，child 不直接提交；复用且逐项复验 `SERVICE`、`ASSESSMENT`、`GROWTH_TRACKING` consent。 | 决定 policy guard、403/`CONSENT_REQUIRED`/`HUMAN_GATE_REQUIRED` 分支和 seed 数据。 | DECISION_REQUIRED |
| D-04 | **Reflection safety/escalation rule。**确定 reflection 的最大长度、允许内容、敏感/风险触发以及是否保存。 | Safety owner + Architect | A. 只允许固定选项；B. 有长度上限的短文本；C. 禁止 text，仅状态。 | `PROPOSED_DECISION`: 短文本上限和安全策略先由 owner 批准；未获批准或命中敏感规则时返回 `REVIEW_REQUIRED`，不得把自由文本升级为 Evidence/Outcome。 | 决定 request schema、policy、审计 metadata、错误态和负向测试。 | DECISION_REQUIRED |
| D-05 | **DEV synthetic seed policy。**确定 fixture family、成员、consent、pending task、版本与清理策略。 | Test-data owner + Architect/Privacy owner | A. 可重复创建的 isolated fixture；B. 共享固定 family；C. 全部 mock。 | `PROPOSED_DECISION`: 建立可重复、隔离、无真实 PII 的 fixture family；只含一名 guardian、一名 child、所需 granted consent 和一个 pending task；每次测试可 reset。 | 决定 migration/seed 是否需要、e2e 非并发数据和截图测试稳定性。 | DECISION_REQUIRED |

```text
ARCHITECT_HUMAN_APPROVAL=NOT_GRANTED
UNRESOLVED_DECISION_COUNT=5
API_CONTRACT_ADMISSION=NO
CODE_IMPLEMENTATION_ADMISSION=NO
```

## 4. Bounded object model

| Object | Candidate role | Required fields / links | Write boundary |
|---|---|---|---|
| `Family` | aggregate/scope root | `family_id`, active membership, family policy context | server-derived; UI cannot supply alternative family. |
| `Person` | actor/subject identity | `person_id`, family role, subject relation, visibility scope | server-derived; no client-supplied role/subject override. |
| `ConsentGrant` | purpose and revocation guard | `family_id`, `subject_person_id`, purpose, status, version, as-of | read by policy; UI cannot grant/revoke in this slice. |
| `GrowthTask` | task state source | `action_id`, `family_id`, onboarding/priority/episode references, `day_index`, status, assignment text, due date, version/boundary | completion only through approved Named Action; no create/pause/amend in slice. |
| `GrowthActionCompletion` | controlled state transition record | task/action ref, completion status, occurred-at, idempotency key, correlation id | created only by `CompleteGrowthAction` after policy/consent/state validation. |
| `ReflectionDraft` | optional client-local or server-controlled pending text | task ref, actor ref, bounded text, draft state, created-at | not Fact/Evidence/Outcome; formal persistence requires D-04 approval. |
| `Reflection` | bounded Perspective returned on readback | task ref, submitted text/flag, `reflection_boundary`, created-at | no automatic profile/task/outcome inference. |
| `AuditEvent` | immutable trace | actor, action name, resource reference, policy result, correlation/idempotency, response summary | must be written with successful action; no silent mutation. |
| `OutboxEvent` | downstream internal event candidate | aggregate type/id, event name/version, correlation, payload reference, occurred-at | event is not notification, recommendation, outcome or external effect. |

### Object relationship candidate

```text
Family --has--> Person(actor/guardian)
Family --protects--> Person(subject/child)
Family --grants/revokes--> ConsentGrant
Family --scopes--> GrowthTask
GrowthTask --is checked in by--> GrowthActionCompletion
GrowthActionCompletion --may include--> Reflection
GrowthActionCompletion --writes--> AuditEvent + OutboxEvent
```

## 5. Read projection candidates

### 5.1 `FamilyTodayProjection`

| Field | Candidate source | Read-only rule |
|---|---|---|
| `projection_version` | server projection contract version | client must not supply or alter. |
| `family_id` | authenticated/authorized route scope | route must match server actor membership. |
| `as_of` / `expires_at` | server projection assembly time/policy | stale projection must not be silently treated as current. |
| `family_display` | authorized `Family`/principal projection | no hidden Person or contact fields. |
| `consent_state` | `ConsentGrant` policy result | display only minimal state/reason code; no grant UI in this slice. |
| `today_task_summary` | `TodayTaskProjection` or null | null must produce baseline-compatible empty state. |
| `entry_state` | `READY`, `EMPTY`, `CONSENT_REQUIRED`, `REVIEW_REQUIRED`, `FORBIDDEN`, `ERROR` | UI maps state to allowlisted visual/text state. |
| `provenance` | source refs, policy version, boundary | not user-editable; no model-generated claim. |

### 5.2 `TodayTaskProjection`

| Field | Candidate source | Read-only rule |
|---|---|---|
| `action_id` | `growth_actions.action_id` | identifier only; client cannot use an arbitrary family/action pair. |
| `day_index`, `due_date`, `assignment_text` | task row / active episode | shown as task assignment, not education prescription or outcome promise. |
| `task_status` | controlled task state | display mapping is contingent on D-02. |
| `checkin_allowed` / `blocking_state` | permission + consent + safety policy | client cannot override. |
| `reflection_boundary` | existing task action boundary | UI must label reflection as Perspective. |
| `task_version` / `as_of` | task/projection contract | used for conflict/stale handling; no direct update. |

### 5.3 `TaskCheckinResultProjection`

| Field | Candidate source | Read-only rule |
|---|---|---|
| `action` | post-action `GrowthTask` readback | maps only the approved response object. |
| `result_state` | action policy/idempotency result | `SUCCESS`, `REPLAYED`, `CONFLICT`, `CONSENT_REQUIRED`, `REVIEW_REQUIRED`, `FORBIDDEN`, `ERROR`. |
| `reflection_boundary` | policy/response boundary | explains Perspective status; no Outcome field. |
| `correlation_id`, `idempotency_key_ref` | audit/action metadata | partial or masked display only; no client-generated trust. |
| `audit_status` | successful internal audit write | audit absence must fail closed for core state transition. |

**Non-writable projection fields:** `family_id`, actor/subject identity, consent result, task ownership, due-date policy, task status, outcome, profile, plan, intervention state, audit result, source/provenance, model/provider data, ranking, score, price and external effect state.

## 6. Named Action candidate — `CompleteGrowthAction`

This action is a **candidate binding** to an existing engineering action, not a newly approved Action registry entry. It becomes usable by the UI only after D-02 through D-05 and action/route review are approved.

| Dimension | Candidate contract |
|---|---|
| Command | `CompleteGrowthAction` |
| Candidate input | route-derived `family_id`, route `action_id`, `completion_status`, optional bounded `reflection`, `occurred_at`, header `Idempotency-Key`, header `X-Correlation-Id`, `X-Source`. Actor derives from authentication. |
| Preconditions | authenticated actor; active family membership/management permission; target task belongs to family; task is active/pending; D-03 consent matrix passes; D-04 reflection policy passes; normal safety route passes. |
| Idempotency | key + action-name + request hash are locked server-side; same input returns replay result; different input with same key produces conflict. |
| Audit/outbox | write `AuditEvent` with actor, resource, action, policy outcome, correlation/idempotency and bounded response metadata; emit `GrowthActionCompleted` internal outbox event only after successful transaction. |
| State effect | records check-in/completion state only. It does **not** create Outcome, Evidence, Plan, intervention, notification, Booking, Order, entitlement or profile update. |
| Failure modes | `401 actor_is_authenticated`, `403 family/consent forbidden`, `404 family/task missing`, `409 already checked-in` or idempotency conflict, `422 invalid completion/reflection`, `REVIEW_REQUIRED` / `HUMAN_GATE_REQUIRED` after approved policy mapping, `500` safe error with correlation reference. |
| Prohibited uses | no free-text task creation; no AI invocation; no changing task ownership, subject, due date or plan; no external call; no ranking/score; no diagnosis/causal claim. |

## 7. Minimal API candidate — not a formal OpenAPI

The following paths are **draft bindings to current engineering endpoints**. They are neither a new `openapi/*.yaml` nor a formal API contract. Exact route/version/DTO names must be confirmed by Architect/Human approval and the source of truth of the existing controller.

### 7.1 Read candidate

```http
GET /families/:familyId/growth/actions/today
Authorization: authenticated actor context
```

| Response candidate | Required fields | Notes |
|---|---|---|
| `200 TodayTaskProjection` | `action_id`, `family_id`, `day_index`, `status`, `assignment_text`, `due_date`, `completed_at?`, `completion_status?`, `reflection?`, `reflection_boundary`, `boundary`, `created_at` | Existing action DTO is an engineering input. A UI-specific `FamilyTodayProjection` wrapper remains a candidate and must not fabricate hidden fields. |
| `200 null` | no pending task | UI-01/09 must render planned empty state. |
| `401/403/404/500` | safe code + correlation reference where available | Exact external error DTO needs admission review. |

### 7.2 Check-in candidate

```http
POST /families/:familyId/growth/actions/:actionId/complete
Idempotency-Key: <required>
X-Correlation-Id: <required or server generated>
X-Source: ui-01-ui-09-first-slice
Content-Type: application/json

{
  "completion_status": "<approved enum>",
  "reflection": "<optional; only if D-04 approved>",
  "occurred_at": "<ISO-8601>"
}
```

| Response candidate | Required fields | Notes |
|---|---|---|
| `200 TaskCheckinResultProjection` | `action`, `reflection_boundary`, action status/readback, correlation/idempotency reference | `action` is the controlled readback, not UI optimism. |
| `409 Conflict` | code for duplicate task status or idempotency conflict | UI shows replayed/conflict state; does not retry with changed payload under same key. |
| `403 Consent/permission` | allowlisted code/reason | UI preserves layout and displays `CONSENT_REQUIRED`, `REVIEW_REQUIRED` or `FORBIDDEN` as approved. |
| `422 Validation/safety` | safe code/reason | no sensitive reflection echo by default. |
| `500 Internal` | safe code + correlation reference | no success fallback. |

## 8. Frontend implementation plan — contingent only

| Area | UI-01 Family Home plan | UI-09 Daily Task plan |
|---|---|---|
| Route binding | Bind canonical Home route to `FamilyTodayProjection`; task card is an authorized summary/link only. | Bind canonical Daily Task route to the same `TodayTaskProjection` by server-derived task ID; no client-controlled cross-family query. |
| Visual fidelity | Reproduce only approved UI-01 baseline hierarchy: hero, grid, task summary, navigation; insert loading/empty/blocked status only in approved state region. | Reproduce only approved UI-09 baseline: header/date/stage/task card/status/action region; state overlays preserve baseline geometry. |
| Data states | `loading`, `ready`, `empty`, `consent_required`, `review_required`, `forbidden`, `error`, `stale`. | `loading`, `pending`, `submitting`, `replayed`, `completed`, `conflict`, `consent_required`, `review_required`, `forbidden`, `error`. |
| Action handling | UI-01 may navigate to UI-09; it does not complete task itself unless explicit route/hotspot decision says otherwise. | Generates client request UUID/idempotency key, disables duplicate submit, renders only server readback. |
| Mock/synthetic | Before real admitted backend bind, use fixture shape identical to the candidate projection, marked `synthetic=true`; never display as live family data. | Synthetic task/action receipt only from D-05 fixture policy; no fake success animation without server/policy readback. |
| Accessibility/test hooks | Stable page-object selectors, status aria-live region, no hidden duplicated text. | Stable action/status selectors, focus return after submission, screen-reader explanation of blocked/replay state. |

## 9. Backend implementation plan — contingent only

| Layer | Candidate minimal change after approval | Existing input / guard |
|---|---|---|
| Controller | Confirm or add a narrow UI-facing facade that maps existing today/action DTO to approved projection; preserve authenticated actor derivation. | `FamilyController` today/complete routes are current engineering facts. |
| Service | Reuse `GrowthActionService.getTodayAction` and `completeGrowthAction`; add projection mapping only if needed. | Existing permission, consent, safety and transaction implementation. |
| Policy | Freeze D-03 consent/role matrix, D-04 reflection rule and D-02 copy/state mapping; return fail-closed code. | family permission, consent, reflection safety, normal safety route policies. |
| Audit/outbox | Preserve transaction order: state change + audit + outbox + idempotency response. | Existing idempotency/audit/outbox code path. |
| Seed | Build D-05 isolated synthetic family only after approval; do not load real PII. | existing test DB/fixture tools, subject to test-data policy. |
| Model/adapter | No model/adapter call in this slice. | Model Gateway and external adapters remain excluded. |

## 10. DB and migration plan — candidates only

No migration is executed in this document. The decision table below avoids speculative schema work.

| Candidate | Trigger for considering it | Proposed constraint | Current disposition |
|---|---|---|---|
| No schema change | Existing `growth_actions`, consent, audit, idempotency and outbox support the approved read/check-in semantics. | Reuse only after schema/source review. | Preferred candidate. |
| `growth_action_projection_version` read metadata | Architect requires UI projection version/`as_of` not derivable at facade. | read-model metadata only; not client-writable. | DECISION_REQUIRED. |
| `reflection_drafts` | D-04 permits save-before-submit rather than client-local text. | family/task/actor scope, TTL, encrypted/limited content, deletion policy; no Outcome inference. | DECISION_REQUIRED. |
| synthetic fixture seed only | D-05 approves isolation/reset policy. | no production PII; repeatable reset; consent expiry/test isolation. | DECISION_REQUIRED. |

## 11. Test and visual validation plan

| Test level | Required proof | Negative cases |
|---|---|---|
| Unit | projection mapper, status mapping, reflection boundary, idempotency response mapping. | no Outcome/Plan/Profile write; no client actor/family override. |
| Policy/unit | membership, guardian role, consent purpose/revocation, safety escalation. | missing/revoked consent, child direct submission if not approved, sensitive reflection, stale task. |
| Contract | fixture shape equals candidate DTO; error codes/states map to Web state allowlist. | absent task, wrong family/task, invalid enum, version/conflict. |
| Integration/e2e | synthetic pending task → check-in → audit/outbox → refreshed projection; replay same key. | cross-family read/write, duplicate changed payload same key, audit failure fail-closed, no external adapter invocation. |
| Web/page-object | UI-01 task summary navigation; UI-09 submit/disable/readback/blocked states. | empty, loading, forbidden, consent required, review required, conflict, safe error. |
| Playwright visual diff | capture UI-01 and UI-09 at canonical mobile viewport plus agreed desktop canvas; compare baseline, record difference/exception. | no baseline substitution with static shell/PPT/reference image; no pass without runtime screenshot pair. |

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
FE_BE_CONSISTENCY=NOT_ESTABLISHED
```

## 12. Non-goals and prohibited effects

This candidate explicitly excludes the following:

1. Payment, refund, membership renewal, entitlement grant, order creation or inventory update.
2. Community publication, comment, media upload, moderation decision, external share or referral.
3. Human service contact, real booking, calendar/video meeting, provider message or service completion record.
4. AI/LLM model call, AI diagnosis, recommendation-generated action, model direct ontology write or AI-created task.
5. Family ranking, family total score, child diagnostic label, causal/effect claim or peer comparison.
6. External notification, email/SMS/push, export, download, contact sync, external calendar or social share.
7. Creation/amendment/pause/withdrawal of a GrowthPlan or GrowthTask; the slice only reads one existing task and records the approved check-in action.

## 13. Admission verdict and required follow-up

```text
ARCHITECT_HUMAN_APPROVAL=NOT_GRANTED
IMPLEMENTATION_ALLOWED=NO_UNTIL_ARCHITECT_HUMAN_APPROVAL
FORMAL_OPENAPI_STATUS=NOT_CREATED
BUSINESS_CODE_STATUS=NOT_MODIFIED
```

The exact next step is not implementation. First, the named Architect/Human owners must record Decisions for D-01 through D-05, confirm that the existing route/action/consent/audit semantics are approved for the synthetic first slice, and update this candidate’s verdict. Only then may a bounded implementation task create the formal UI-specific API Contract and modify the approved API/Web/DB locations.

## 14. References

[1] `reports/m2/frontend/34_UI_WIDE_RESEARCH_TO_DEVELOPMENT_SLICE_001.md` (commit `d055c703c56eb2e79543990230dd83214b4f5e70`).

[2] `reports/m2/frontend/UI-01_ARCHITECT_REVIEW_AND_BLOCKING_QUESTIONS_001.md` (existing UI-01 NO_GO and baseline/consent/action blockers).

[3] `reports/m2/frontend/UI-09_PHASE_C_PRE_API_GATE_001.md` (existing UI-09 NO_GO_WITH_BLOCKERS and task boundaries).

[4] `apps/api/src/modules/family/family.controller.ts`, lines 408–435; `apps/api/src/modules/family/growth-action.service.ts` (existing route/action inputs only).

[5] `reports/m2/frontend/PHASE_D_API_CONTRACT_ENTRY_CRITERIA_AND_BLOCKERS_001.md` (Phase D entry conditions remain draft and not admitted).
