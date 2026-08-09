# 07 — Architecture Independent Review (AI-07)

- Reviewer: AI-07 Independent Architecture Reviewer
- Scope: Family TASK-002 静态契约评审(只读,独立判断,不参考其他子 Agent 报告)
- Date: 2026-08-09
- Root: `D:\Family\50_开发_dev\`
- Method: 独立通读 CLAUDE.md / docs / ENGINEERING_CONTRACT_INDEX / specs(ontology, actions, events, policies, api, decisions) / database / agents / models / security / events / integrations / evals / CURRENT_SPRINT / PROJECT_STATUS

---

## 总体 Verdict: **CONDITIONAL_PASS**

契约体系在语义设计层面高度自洽、纪律严明(Named Action、Perspective≠Fact、Consent purpose-specific、Human Gate、Provider/Ontology Abstraction、World Model 明确后置)。设计契约本身没有 BLOCKER。

但**交付物层面存在 1 个 BLOCKER**:`database/migrations/0001-0003` 是把 `schema_v0_1.sql` 按行机械切成三段的产物,**每个迁移文件单独都不是合法 SQL**(0001 结尾 `consents` 表 CREATE 语句被截断、无结束 `;`;0002、0003 均以孤立 `);` 开头),且编号顺序破坏依赖(0002 的 `milestones` 外键引用 `growth_journeys`,而后者定义在 0003)。因 Docker 未起、迁移从未对活库实跑,该缺陷在 TASK-001 未被发现。

**这不阻断 TASK-101 的契约正确性,但阻断 CURRENT_SPRINT 的 Sprint 0 DoD("DB migration 机制存在"且可跑通)**。TASK-101 依赖可运行的 schema。因此:进入 TASK-101 前必须先修复迁移分片。修复后即具备 TASK-101 条件。

---

## 12 问逐条判断

### Q1 Engineering Contract 内部是否一致 — PASS(1 处 LOW)
- CLAUDE.md 编码原则(C01–C10)、API_CONTRACT_RULES、core-state-write.policy、ADAPTER_CONTRACT 相互印证,无矛盾。
- ENGINEERING_CONTRACT_INDEX 第 4 项指向 `policies/HUMAN_GATE_POLICY.yaml` 与 `policies/HUMAN_GATE_MATRIX.md` — 文件确实存在于 `policies/`,引用成立(非孤儿)。
- **[LOW]** INDEX 第 3 项只列 `openapi-family-platform-v0.2.yaml`,但仓库同时存在 `openapi-family-core-v0.1.yaml`。后者是 v0.2 的严格子集(路径/operationId 一致,无请求体/组件),属过时草稿。未在 INDEX 声明哪个是 SSOT,可能误导实现者。建议标注 v0.1 为 superseded 或删除。

### Q2 Ontology → DB 是否有语义损失 — PASS(2 处 LOW/MEDIUM)
- 枚举全量对齐:family_status / parent_role / relationship_type / life_stage_code / consent_purpose(8 值)/ consent_status / growth_domain / growth_state 在 enums.yaml 与 schema_v0_1.sql 完全一致。
- 约束落地良好:`parent_role_only_for_parent`、`uq_active_life_stage`(部分唯一索引实现 close-previous 语义)、`relationship_not_self`、consent 撤回一致性 CHECK、profile/outcome 时间窗 CHECK。GrowthProfile 版本化(C07)由 version 列 + effective_from/to 落地,历史不覆盖。
- **[MEDIUM]** `growth_profiles.subject_ref_id varchar(128)` 对应 ontology 的 `subject_id: string`,但 ontology 字段名为 `subject_id`,DB 列名为 `subject_ref_id` — 命名漂移(非语义损失,但映射层需显式记录,否则易生成错列名)。
- **[LOW]** `dimension_id` 在 ontology 为无约束 `string`,在 DB 多表为 `varchar(16)`。16 字符上限是 ontology 未表达的隐含约束,属技术侧收窄;建议在 ontology 或 glossary 固化 dimension_id 命名规范。

### Q3 Ontology → API 是否一致 — PASS(1 处 LOW)
- 请求体字段与 ontology 一致,camelCase↔snake_case 转换规则清晰;server 生成 canonical id(family.schema 明确 "Never supplied by client",CreateFamily.action forbidden client_supplies_family_id,API CreateFamilyRequest 无 familyId 字段)——三方一致。
- Consent purpose 8 值、relationshipType 5 值、lifeStageCode 单值在 API 与 ontology 完全一致。
- **[LOW]** `LogGrowthEventRequest.eventType: string`(自由字符串)而 ontology `growth_event.schema.event_type` 是 10 值封闭 enum,DB `growth_events.event_type varchar(64)` 也不约束。API 未在此处 enum 化,校验只能靠应用层——但这属 Growth 域(Sprint 明确 out of scope),对 M1 无影响。记为 LOW。

### Q4 Action → API 是否一一对应 — PASS
- 6 个 Named Action 全部有对应 API operationId,且方法/路径/幂等头一致:
  - CreateFamily → POST /families
  - AddParent → POST /families/{id}/parents
  - AddChild → POST /families/{id}/children
  - CreateFamilyRelationship → POST /families/{id}/relationships
  - AssignLifeStage → POST /families/{id}/life-stages
  - GrantConsent → POST /families/{id}/consents
- 核心写接口全部走 Named Action,无 generic PATCH(符合 C03 / core-state-write.policy / API rule 3)。GetFamilyAggregate 为只读,合规。
- 观察(非缺陷):API 另有 ConfirmGrowthPriority / LogGrowthEvent / MeasureOutcome / ListGrowthProfiles 属 Growth 域,无对应 M1 Action,但这是 M2 前瞻契约,Sprint 已声明 out of scope,不算 orphan。

### Q5 Action → Event 是否完整 — PASS(1 处 LOW)
- 每个产生状态变更的 Action 的 `emit_*` 都有对应 event 契约:FamilyCreated / FamilyMemberAdded(AddParent+AddChild 共用)/ FamilyRelationshipCreated / LifeStageAssigned / ConsentGranted。5 事件 required_fields 均含 event_id/family_id/occurred_at/actor_id/correlation_id + metadata(source/schema_version),与 event-envelope.schema.json 及 EVENT_STANDARD 一致(PascalCase 过去式,append-only)。
- **[LOW]** event-envelope.schema.json 的 actor.type enum 含 CHILD,与 enums.yaml ActorType 一致;但各 `.event.yaml` 只声明 `actor_id`,未声明 actor_type 字段名映射到 envelope 的 `actor.{type,id}`。字段名不完全对齐(actor_id vs actor.id),需实现层桥接,建议在 event 契约里显式指明映射。

### Q6 Consent → DB → API → Policy 是否一致 — PASS
- 四方链路自洽:purpose 8 值全对齐;consent.policy(purpose-specific,SERVICE≠MODEL_IMPROVEMENT)与 GrantConsent.action 的 `service_consent_does_not_imply_model_improvement_consent: true` 一致;DB 有 `idx_consents_subject_purpose` 支持按 purpose 查;撤回不删审计(MINOR_DATA_SOP §8 + consent.policy + DB withdrawn CHECK)一致。
- CONSENT_PERMISSION_MATRIX.csv 的 actor×purpose 矩阵与 ActorType/ConsentPurpose 枚举一致,SEPARATE_CONSENT/CONSENT_REQUIRED 语义与 policy 呼应。
- guardian 授权校验在 action preconditions、policy、SOP §4 三处一致要求。

### Q7 Agent → Decision → Human Gate 是否一致 — PASS(1 处 MEDIUM)
- 5 个 Agent 全部 `objects_write_via_actions: []` 且 `allowed_actions: []` + forbidden 含 DirectProfileMutation 类——严格贯彻 C02/C03(AI 不直接改核心态)。
- Agent human_gate.required_for 与 HUMAN_GATE_POLICY triggers 语义对齐:PROFILE_CHANGE↔HG002、HIGH_RISK/安全信号↔HG001、中高风险 Intervention↔HG003。autonomy_level(AL0–AL2)与 HUMAN_GATE_POLICY.risk_levels.autonomy_max 一致。
- **[MEDIUM]** 各 Agent 引用 `policy_refs: [HUMAN_GATE_POLICY]` 与 `safety_policy_refs: [MINOR_SAFETY_POLICY]`,但仓库无 `MINOR_SAFETY_POLICY` 文件(仅有 `security/MINOR_DATA_SOP.md`)。这是**未定义引用(dangling policy ref)**。同理 Agent 的 `decisions_supported`(如 RecommendNextLowRiskAction、PrioritizeCases)除 DetermineLifeStage 外无对应 `*.decision.yaml`——decision 契约仅 1 个,其余为隐式。M1 不触发 Agent,故记 MEDIUM 而非 HIGH,但进入 AI Sprint 前必须补齐。

### Q8 Model Router → Eval → Release Gate 是否闭环 — PASS(1 处 LOW)
- 闭环成立:MODEL_ROUTER_POLICY 的 selection_score.hard_filters 含 "model.status in [APPROVED,CANDIDATE]" 且 ROUTER_PSEUDOCODE `passesBlockingEval` 显式把 eval 作为路由前置过滤;EVAL_METRICS 定义指标 → RELEASE_THRESHOLDS 定义 blocking 阈值(safety_recall≥0.98 等)→ Agent eval.blocking_metrics 引用同名指标。三段咬合。
- 数据权限优先级(R001 HIGHLY_SENSITIVE→LOCAL_PRIVATE/ABSTAIN)与 MINOR_DATA_SOP §5 一致;C08 Provider Abstraction 由 MODEL_REGISTRY 的 `provider: CONFIGURED_PROVIDER`(无硬编码厂商)落地——**无 DIRECT PROVIDER DEPENDENCY**。
- **[LOW]** RELEASE_THRESHOLDS 只定义了 FAMILY_COMPANION_PROD / HUMAN_COPILOT_PROD 两个 profile,而注册表有 5 个 Agent(GROWTH_PLANNER / PARENT_GROWTH_COMPANION / RELATIONSHIP_COMPANION 无对应 release profile);Agent 内 eval.suite_ids 引用的 golden suite(如 GROWTH_PLANNER_VALIDITY)在 evals/ 下无对应 case 文件(仅有 seed)。属 M2 待补,非 M1 阻断。

### Q9 External Adapter 是否污染 Family Domain — PASS
- ADAPTER_CONTRACT 明确 ACL:External DTO → Mapper → Canonical DTO → Validation → Named Action/Import Command;三条禁止(外部字段直入 Domain、外部 ID 作 canonical ID、无 lineage)清晰。
- family-import-command.schema.json 强制 `lineage{sourceSystem,sourceId,mappingVersion}`,与 external-customer.dto 分离;DTO_MAPPING_TEMPLATE 带 pii_class(PII_MINOR 等)。与 API rule 8(DTO≠DB Entity)一致。**无 Family Domain 污染**。

### Q10 是否有技术设计提前侵入 World Model — PASS
- World Model 在架构总链最底层且 PROJECT_STATUS 明确 "Not Started" + "Explicitly Deferred(World Model training)";CURRENT_SPRINT 明确 out of scope。
- Outcome 契约含 `possible_confounders` / `context` 字段——这是**因果诚实性设计**(承认混杂),不是提前实现 Causal/World Model,属正确的"为未来留接口而不实现"。无侵入。

### Q11 是否过度微服务化 — PASS
- C10 + 架构 baseline 明确 Modular Monolith First;无 per-service 部署契约、无服务网格/RPC 契约。Outbox 表为单体内可靠事件投递,不等于微服务拆分。**无过度微服务化**。

### Q12 是否已具备 TASK-101 条件 — **CONDITIONAL(修迁移后 YES)**
- 契约侧就绪:CreateFamily 的 action/ontology/api/event/DB(families 表)四位一体齐备,幂等(idempotency_keys 表 + Idempotency-Key 头 required)、审计(audit_logs 表 + C06 字段齐)、correlation 全部到位。DoD 流程链(Create→...→Read Aggregate)每一步契约均存在。
- **阻断点**:Sprint 0 DoD 要求 "DB migration 机制存在" 且可运行。当前 migrations 分片非法(见 BLOCKER),schema 无法按 0001→0002→0003 顺序跑通。TASK-101 集成测试需要活库。**必须先修迁移**。修复后无其他阻断项。

---

## 关键问题清单(按严重度)

| # | 严重度 | 位置 | 问题 |
|---|---|---|---|
| 1 | **BLOCKER** | `database/migrations/0001-0003_*.sql` | 迁移是 schema_v0_1.sql 的机械行切分,每个文件单独非法 SQL(0001 截断于 consents CREATE 无结束`;`;0002/0003 以孤立`);`开头),且 0002 milestones FK 引用的 growth_journeys 定义在 0003,顺序倒置。Docker 未起故从未实跑暴露。阻断 Sprint 0 DoD 与 TASK-101 集成测试。**修法**:改为每个 migration 是自洽完整的 DDL 段(按依赖排序:core→growth→audit/outbox),或直接以 schema_v0_1.sql 作单一 baseline migration。 |
| 2 | MEDIUM | `agents/registry/*.yaml` | 引用 `MINOR_SAFETY_POLICY` 无对应文件(仅有 MINOR_DATA_SOP.md);多数 `decisions_supported` 无 `*.decision.yaml`(dangling ref)。M1 不触发 Agent,进入 AI Sprint 前须补。 |
| 3 | MEDIUM | `growth_profiles.subject_ref_id` vs ontology `subject_id` | 命名漂移,映射层须显式记录以防生成错列名。 |
| 4 | LOW | `ENGINEERING_CONTRACT_INDEX` / `openapi-family-core-v0.1.yaml` | 存在过时 v0.1 OpenAPI 与 v0.2 并存,未声明 SSOT,建议标 superseded。 |
| 5 | LOW | events / dimension_id / release profiles / event_type API enum | 若干 M2 前瞻契约留白(actor 字段映射、dimension_id 约束、3 个 Agent 无 release profile、GrowthEvent API 未 enum 化)。均 out-of-scope,不阻断 M1。 |

---

## 结论

设计契约体系纪律优秀、跨契约语义自洽,无战略/语义级 BLOCKER。唯一硬阻断是 DB 迁移文件的机械分片错误(交付缺陷,非设计缺陷)。**修复迁移分片后即具备 TASK-101 条件**。建议同步补齐 MINOR_SAFETY_POLICY 与 decision 契约引用(MEDIUM,可在 AI Sprint 前)。
