# TASK-002 Engineering Contract Validation

as_of: 2026-08-09 ｜ 方式:AI-00 Lead + AI-01～AI-07 并行独立验证(真并行子 Agent)｜7 份分报告见 `reports/task-002/`

## 1. Executive Result

**CONDITIONAL PASS —— 契约设计层健全且高度自洽,但存在 1 个工程 BLOCKER,修复前不得进入 TASK-101。**

- 设计/语义层(Ontology / Named Action / Consent 隔离 / Human Gate 骨架 / Provider·Ontology 抽象 / World Model 后置)纪律优秀,无战略或语义级阻断。
- 工程实现层有 1 个 BLOCKER(DB 迁移文件被机械切片,逐文件非法 SQL)+ 若干 HIGH,须先清。
- **READY_FOR_TASK_101 = NO**(见 §10)。

## 2. Contract Status Matrix

| 契约 | 状态 | 备注 |
|---|---|---|
| Database (schema_v0_1) | PASS | 单一 schema 语法/约束/索引设计良好 |
| Database (migrations) | **FAIL** | 0001–0003 机械切片,逐文件非法 SQL + FK 顺序倒置(BLOCKER-01) |
| API (OpenAPI) | WARNING | 3.1 合法、operationId 唯一、无 generic CRUD;HIGH 见下 |
| Ontology | PASS | 枚举/字段与 DB、API 逐项一致 |
| Named Action | PASS(核心6)/ WARNING | Growth 写接口在 v0.2 已暴露但缺 action/event 规格 |
| Agent | WARNING | 5 Agent 无直写核心状态(护栏成立);字段缺口见下 |
| Human Gate | WARNING | 档位/动作齐;标签未引用 trigger_id、safety_policy 悬空 |
| Model Router | WARNING | Hard Filter>Score 成立;LOCAL_PRIVATE 状态冲突 |
| Eval | PASS/WARNING | 门逻辑正确、golden 2/2 通过;样本量不足 |
| Repo / Build | PASS | build/lint/typecheck/test 实测全绿 |
| CI | WARNING | 仅 scaffold 模板(pnpm9 vs 实际11),根仓无 workflow |
| Testing | PASS(unit)/ WARNING | 集成/迁移测试 NOT_EXECUTED(Docker) |
| Consent | PASS | 8 purpose 四处一致;SERVICE≠MODEL_IMPROVEMENT、RESEARCH≠CONTENT_PUBLICATION |
| Minor Data | PASS | M0–M3 + 10 项路径全覆盖 |
| Domain Event | WARNING | ConsentGranted.event.yaml 与权威 envelope 结构不一致 |
| Integration DTO | PASS | ACL 五段链完整;外部 ID 不作 Family ID;lineage 齐 |

## 3. BLOCKERS(真正阻止 TASK-101)

- **BLOCKER-01｜DB 迁移文件非法**:`database/migrations/0001_family_core.sql`(括号 54/53 不平衡、consents 表中途截断)、`0002`(以孤立 `);` 开头,45/46)、`0003`(以 `);` 开头、末尾列未闭合);三文件**拼接后才 174/174 平衡**——系 `schema_v0_1.sql` 按行机械切片。且 `0002` 的 `milestones` 外键引用 `growth_journeys`(定义在 `0003`),apply 顺序倒置。`migrate.mjs` 逐文件独立事务执行 → `pnpm db:migrate up` 必在 0001 语法报错。**因 Docker 未启动从未真跑而被掩盖。** 阻断 Sprint 0 DoD 与 TASK-101 集成测试。

## 4. HIGH Issues

- **H1(API)** `LogGrowthEvent`/`MeasureOutcome` 等 201 写接口缺 `Idempotency-Key`。
- **H2(API↔Action/Event)** Growth 写接口在 v0.2 暴露,但 `specs/actions`、`specs/events` 无对应规格(可追溯性断裂)。
- **H3(API)** Growth 端点缺 400/403/404 错误响应定义。
- **H4(Agent)** 5 Agent 的 `safety_policy_refs` 缺失 3 个(含 CHILD 域);引用的 `MINOR_SAFETY_POLICY` 在 `policies/` 不存在(悬空)。
- **H5(Agent↔Policy)** Gate 结果 6 值枚举 / Policy `action` 词表 / routing 队列名 三套命名不互映;`human_gate` 标签只到文件级,未引用 trigger_id;HG004/005/006(低置信/空证据/冲突)无卡片引用。
- **H6(Model Router)** `LOCAL_PRIVATE` 状态为 `OPTIONAL`,而 hard_filter 只放行 `[APPROVED,CANDIDATE]` → 与 "HIGHLY_SENSITIVE 优先本地" 冲突,会致敏感场景候选空、错误 ABSTAIN。

## 5. MEDIUM Issues
- M1 `openapi-family-core-v0.1.yaml` 为空壳且与 v0.2 并存,SSOT 未声明。
- M2 `ConsentGranted.event.yaml`(snake_case + schema_version,缺 eventName/eventVersion/aggregateType)与权威 envelope(camelCase)矛盾。
- M3 多个 Agent `decisions_supported` 指向不存在的 `.decision.yaml`(悬空引用)。
- M4 `growth_profiles.subject_ref_id`(DB)与 ontology `subject_id` 命名漂移。
- M5 Agent changelog 全缺(5/5);部分 Human Gate 语义标签在 Policy 无对应触发(覆盖盲区)。

## 6. LOW Issues
- L1 `pnpm-workspace.yaml` 残留占位坏值(`allowBuilds: esbuild: set this...`)。
- L2 `packages/contracts` 的 test/lint 为 echo 桩。
- L3 scaffold CI 固定 pnpm9 vs 实际 pnpm11;根仓尚无 `.github/workflows`。
- L4 Agent memory 键不齐;Eval 阻断阈值不完全统一;golden 样本仅 2 条(<人评下限)。

## 7. Cross-Contract Conflicts
- Event:`*.event.yaml`(snake_case)↔ `event-envelope.schema.json`(camelCase)未声明 envelope/payload 边界。
- API ↔ Action/Event:Growth 写端点无对应 Named Action/Event 规格。
- Agent ↔ Policy:Gate 结果枚举/Policy action/routing 名三套不映射;trigger_id 未被引用。
- Model Router ↔ Registry:hard_filter 放行状态集合与 `LOCAL_PRIVATE=OPTIONAL` 冲突。
- DB ↔ Ontology:`subject_ref_id` vs `subject_id`。

## 8. Proposed Fixes

| FIX-ID | 问题 | 影响 | 涉及文件 | 改业务语义? | 需RFC? | 建议Owner |
|---|---|---|---|---|---|---|
| FIX-01 | 迁移机械切片非法 | BLOCKER | `database/migrations/0001-0003.sql` | 否(纯工程) | 否 | Tech Lead/DB |
| FIX-02 | 写接口缺 Idempotency-Key | HIGH | `specs/api/openapi-family-platform-v0.2.yaml` | 否 | 否 | API Owner |
| FIX-03 | Growth 写接口无 action/event 规格 | HIGH | `specs/actions`,`specs/events`,api | 是(新增契约) | **是** | Domain+Ontology |
| FIX-04 | 补错误响应 400/403/404 | HIGH | api v0.2 | 否 | 否 | API Owner |
| FIX-05 | 补 safety_policy_refs + 建 MINOR_SAFETY_POLICY | HIGH | `agents/registry/*`,`policies/` | 否(补齐) | 部分 | Safety |
| FIX-06 | Gate 命名统一 + 引用 trigger_id | HIGH | `agents/*`,`policies/HUMAN_GATE_*` | 否 | 部分 | AI Platform |
| FIX-07 | LOCAL_PRIVATE 纳入 hard_filter | HIGH | `models/MODEL_ROUTER_POLICY.yaml`,`MODEL_REGISTRY.yaml` | 否 | 否 | AI Platform |
| FIX-08 | 声明 API SSOT,归档 v0.1 | MEDIUM | `specs/api/*` | 否 | 否 | API Owner |
| FIX-09 | 统一 Event envelope/payload 边界 | MEDIUM | `events/*`,`specs/events/*` | 否 | 部分 | Ontology |
| FIX-10 | 修 decision 悬空引用 + subject 命名 | MEDIUM | `agents/*`,`database/*` | 否 | 否 | Domain/DB |

## 9. Automated Validation Evidence(实测)
- `tools/validate-contracts.mjs`:47 文件,失败 0 —— YAML 35、JSON Schema 4(Ajv **draft 2020-12**)、OpenAPI 2、Consent 矩阵、Scaffold、DDL 静态 4。
- `pnpm build / lint / typecheck / test`:**全绿**(turbo 2.10.9,2 包;vitest 1 passed;0 lint error)。
- API:`node apps/api/dist/main.js` 启动,`GET /health` → HTTP 200 `{"status":"ok",...}`。
- Golden JSONL:ajv(2020)校验 **2/2 通过**,负控被正确 REJECT。
- `event-envelope.schema.json`:ajv 编译 OK。
- **DDL 活库执行 / 迁移 up / 集成测试:NOT_EXECUTED(BLOCKED_BY_DOCKER)** —— 本机 Docker 守护未运行、psql 缺失,未伪造。

## 10. TASK-101 Readiness

**READY_FOR_TASK_101 = NO**

原因:存在 BLOCKER-01(迁移非法),且 DDL 从未对真实 PostgreSQL 执行过。按门禁规则(Database 须 PASS、迁移须实跑、无 BLOCKER),当前不满足。

**翻绿最小条件**:
1. FIX-01:按语句边界重切迁移(或改为 idempotent 顺序正确的增量),不改任何业务语义;
2. 启动 Docker → `docker compose up -d` → `pnpm db:migrate up` 实跑通过 + 基础 insert/约束/回滚验证 → Database 转 PASS;
3. HIGH 项(H1–H6)择要清理或由架构师明示"进入 M1 前可延后"的范围。

满足后可将 Database=PASS、无 BLOCKER,方可 READY=YES。

---
**END OF TASK-002。未进入 TASK-101,未改任何契约,未改 PROJECT_STATUS 的 milestone。所有修复以 FIX/RFC 提出,待人工 Gate。**
