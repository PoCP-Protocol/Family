# 向总架构师阶段开发总结

date: 2026-08-10
recipient: 总架构师
scope: Sprint 0 + Sprint 1 / M1 Family Core Running
status: M1_PASS_AND_CLOSED

## 一、结论

本阶段工程执行已完成从工程底座到 M1 Family Core Running 的闭环验证。

当前结论如下：

- Sprint 0 已关闭：工程仓库、API 基础、迁移机制、审计基础、真实 PostgreSQL Gate 已通过。
- Sprint 1 已关闭：TASK-101 至 TASK-107 全部 PASS。
- M1 Family Core Running 已完成：从空数据库经 HTTP 完成完整家庭核心链路，并可读取 Family Aggregate。
- M2 仅形成规划文档，没有启动任何 M2 代码、Schema、API、Agent、Model Gateway 或 Growth 实现。

一句话判断：M1 已经从“规格与脚手架”进入“真实 PostgreSQL + HTTP + Audit/Event/Idempotency 可运行闭环”。

## 二、本阶段完成范围

### 1. 工程底座

完成并验证：

- monorepo / package 基础结构。
- NestJS API 基础服务与健康检查。
- PostgreSQL migration runner。
- 真实 PostgreSQL 迁移验证。
- OpenAPI / contract validation。
- lint / typecheck / build / test gate。
- required test gate：unit + integration + e2e 不允许静默跳过数据库测试。

关键修复：早期 migration 文件是机械切片导致的非法 SQL，已按语句边界和依赖顺序重切，且不改变业务语义。

### 2. M1 六个写入 Named Actions

已完成并通过 Gate：

- `CreateFamily`
- `AddParent`
- `AddChild`
- `CreateFamilyRelationship`
- `AssignLifeStage`
- `GrantConsent`

这些 Action 共同确立了 M1 的写入参考模式：

```text
HTTP -> DTO Validation -> Actor Context -> Permission / Preconditions -> Idempotency -> PostgreSQL Transaction -> Audit -> Outbox -> Response
```

核心状态写入均通过 Named Action，不允许 AI 自由文本、隐式推断或旁路接口直接写核心 Ontology。

### 3. TASK-107 / Family Aggregate

TASK-107 增加了只读聚合能力：

- `GET /families/{familyId}`
- 读取 canonical PostgreSQL tables：`families`、`persons`、`family_relationships`、`life_stage_assignments`、`consents`
- 返回：family、members、relationships、active LifeStage、active Consent
- 不引入 read DB、materialized view、Graph DB、Search index 或 Kafka projection

TASK-107 不是新的写入 Action；它是 M1 完整纵向链路的最终读模型证明。

## 三、最终验证结果

最终 Gate 已通过：

```powershell
node tools/validate-contracts.mjs
pnpm lint
pnpm typecheck
pnpm build
$env:TEST_DATABASE_URL='postgres://family:***@localhost:55433/family_gate'; pnpm test:required
```

结果：

- Contract validation：PASS，49 files checked，0 failures。
- Lint：PASS。
- Typecheck：PASS。
- Build：PASS。
- TASK-107 focused E2E：PASS，8 tests。
- Required tests：PASS。
- Unit：8 files / 25 tests PASS。
- Integration：6 files / 29 tests PASS。
- E2E：7 files / 43 tests PASS。

测试数据库为真实 PostgreSQL：`postgres://family:***@localhost:55433/family_gate`。

## 四、M1 完整业务链路

最终 E2E 从空数据库执行：

```text
CreateFamily
-> AddParent
-> AddChild
-> CreateFamilyRelationship(PARENT_CHILD)
-> AssignLifeStage(EARLY_ADOLESCENCE_12_15)
-> GrantConsent(SERVICE)
-> GetFamilyAggregate
```

验证内容包括：

- Family 创建成功。
- Parent / Child 成员写入成功。
- Parent-Child 关系方向严格成立。
- LifeStage 只通过 `AssignLifeStage` 显式赋值。
- Consent 只通过 `GrantConsent` 显式授权。
- Aggregate 能读取完整 M1 状态。
- 未授权读取返回 403。
- 未知 Family 返回 404。
- 所有写操作均有 Audit。
- 所有写操作均有 Outbox Event。
- correlation id 可贯穿审计与事件链路。
- 关键请求具备幂等 replay 与 conflict 行为。

## 五、关键架构边界守住情况

本阶段特别验证并守住以下边界：

- `birth_date` 不推断 LifeStage。
- `PARENT_CHILD` / `GUARDIAN_CHILD` 关系不推断 Consent。
- `SERVICE` consent 不推断 `MODEL_IMPROVEMENT` consent。
- GrantConsent 是 purpose-specific，不存在 `GENERAL` / `ALL` / broad consent。
- 未创建 GrowthProfile、GrowthPriority、Journey、Intervention。
- 未启动 Agent Runtime、Model Gateway、World Model、Causal Platform。
- 未做 Family Total Score。
- 未做家庭 Ranking。
- 未将 AI 自由文本写入核心 Ontology。

这意味着 M1 当前是一个可审计、可追踪、边界清楚的 Family Core，而不是提前膨胀成增长系统或 AI 平台。

## 六、主要工程修复与决策

本阶段暴露并解决的关键问题：

1. Migration 文件非法切片
   - 原迁移文件按行机械切割，逐文件无法执行。
   - 已重切为按语句边界和 FK 顺序组织的迁移。
   - 业务语义零变化。

2. 数据库测试静默跳过风险
   - 早期 aggregate test 可能因环境变量未传递而跳过 DB integration。
   - 已建立 `TEST_DATABASE_URL` required gate，缺失时 fail fast。

3. 共享 PostgreSQL 测试并发干扰
   - 多个 DB spec 并行会互相清理数据。
   - 已将 integration/e2e Vitest file execution 串行化。

4. NestJS runtime DI 问题
   - TASK-107 聚合仓库初次 E2E 发现 repository 注入为 undefined。
   - 已使用显式 `@Inject(FamilyRepository)` 修复。

5. 同一 PostgreSQL client 并发 query 警告
   - 聚合读取初版在一个 transaction client 内 `Promise.all` 并发查询。
   - 已改为顺序读取，避免 pg deprecated warning。

## 七、当前已知技术债

以下内容不阻断 M1，但必须在 Pilot 或 M2 关键节点前处理：

- IAM / RBAC / ABAC 仍为 M1 minimal policy：当前读写权限主要基于同一 actor/family 的成功 `CreateFamily` audit 事实。
- `GrantConsent` 的 actor-to-guardian binding 使用 `persons.account_id === x-actor-id`，属于 M1 最小可用策略。
- `WithdrawConsent` 未实现，完整 consent lifecycle 尚未完成。
- 部分 same-family、person type invariant 仍由 service 层守护，未来如要增强 DB 级约束需要更完整的 composite FK / schema 设计。
- M1 只支持 `EARLY_ADOLESCENCE_12_15`，未覆盖完整 0-18 LifeStage。

## 八、M2 准备状态

M2 当前状态：READY_FOR_PLANNING / NOT_IMPLEMENTED。

已形成计划文档：`reports/m2/M2_FIRST_GROWTH_VERTICAL_SLICE_PLAN.md`。

建议 M2 第一条垂直切片聚焦：

```text
12-15岁家庭 / 亲子沟通冲突
```

但在编码前必须先完成：

- 人工批准 M2 implementation。
- 场景级 Implementation Plan。
- GrowthProfile / GrowthPriority / GrowthAction / GrowthEvent / Outcome 数据契约。
- 高风险家庭场景 Human Gate。
- 以 Outcome 为核心的评估标准，而不是只评估自由文本质量。

## 九、请求总架构师确认的事项

建议总架构师确认以下四点：

1. 是否接受 M1 Family Core Running 关闭结论。
2. 是否将 IAM hardening 与 WithdrawConsent 列为 M2 前置治理债，还是并入 M2 第一切片同步处理。
3. 是否确认 M2 第一场景为“12-15岁亲子沟通冲突”。
4. 是否授权进入 M2 implementation planning，但暂不直接进入代码实现。

## 十、最终状态

- TASK-107：PASS。
- M1 Family Core Running：PASS / CLOSED。
- Sprint 1：CLOSED。
- M2：planning artifact exists, implementation not started。

工程团队当前应停止在 M1 之后，不得自动扩展到 M2 代码实现，除非总架构师明确授权。