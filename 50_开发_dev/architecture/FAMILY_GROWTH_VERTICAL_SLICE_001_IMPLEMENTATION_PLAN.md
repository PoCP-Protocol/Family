# FAMILY-GROWTH-VERTICAL-SLICE-001 实现设计

```text
STATUS              = IMPLEMENTATION_PLAN_DRAFT
AUTHORIZATION        = FAMILY_GROWTH_VERTICAL_SLICE_001 (internal development only)
RUNTIME              = deterministic internal verification only
EXTERNAL_MODEL       = OFF
PILOT / PRODUCTION   = OFF / OFF
SCENARIO             = 12–15 岁亲子沟通冲突
```

## 1. 纵切边界

本实现只证明一次可信服务闭环：家长在 Home 表达“孩子刚摔门，我今晚不知道怎么重新开口”后，确认一个沟通需求，获得确定性、低风险的 `AI_COACH`/`PRACTICE`/`NO_ACTION`/`EXTERNAL_REFERRAL` 候选，作出家庭决定，形成声明式计划，创建 ServiceCase，在执行前再次校验资格，记录一次回访和非因果的上下文复用。

不做 Organization、AccessGrant、Community、DemandCluster、跨家庭统计、Payment、Entitlement、Enrollment/Delivery、真实外部模型、测评、市场撮合、Kafka、Kubernetes 或独立微服务部署。所有新增代码留在模块化单体内，采用显式表、明确 DTO 与受控事件，作为未来安全拆分的边界。

## 2. 模块与依赖

```text
AppModule
 ├─ AuthModule                (trusted FamilyAuthContext / role matrix / sessions)
 ├─ FamilyModule              (Family / Person / Consent / Growth canonical only)
 ├─ PrincipalModule           (existing deterministic AI capability; adapter only)
 └─ OrchestrationModule       (new; owns V3 service truth)
      ├─ OrchestrationController
      ├─ OrchestrationService
      ├─ OrchestrationRepository
      ├─ OrchestrationPolicy   (need/capability/eligibility/ranking; deterministic)
      └─ Orchestration DTOs
```

`OrchestrationModule` imports `AuthModule` only. 它不得导入 `FamilyModule`，以免 Principal→Family 已有依赖产生反向环；对 Family/Person/Consent 只使用数据库只读查询和明确的 Named Action 适配边界。Principal 只被视为 `AI_COACH` provider，不调用其 legacy `acceptProposal()` 路径。

## 3. 最小表与真相边界

迁移号为 `0020_growth_orchestration_v1.sql`，仅建立下列显式表。每一张表都以 `family_id` 为强制外键、索引维度和查询约束；所有写入同时校验 `subject_person_id` 属于同一家庭。

| 表 | 归属真相 | 最小字段 | 关键不变量 |
|---|---|---|---|
| `growth_need_signals` | 非 canonical 推断/人工提交 | signal、family、subject、source、need_type、confidence、raw_ref | `canonical_family_fact=false`；只允许固定场景 need type |
| `growth_intents` | 家长显式服务请求 | intent、family、subject、goal_text、status、confirmed_by/at | `OPEN/CLOSED/CANCELLED/SUPERSEDED`；无确认不创建后续对象 |
| `resource_offers` | 原子资源目录 | offer、type、capability、age/need scope、risk boundary、content ref、availability、qualification mode | V1 类型封闭；Practice 必须 approved content ref；NO_ACTION 无 provider |
| `resource_recommendations` + `resource_recommendation_candidates` | 推荐，不是决定 | version、candidate、rank、coverage、why/limitations、status | 仅 T1 eligible；rank 非执行顺序；无收入信号 |
| `family_service_decisions` + `decision_offers` | 家庭决定边界 | decision、recommendation version、decision type、selected offers、actor | selected offer 必须是同 recommendation 的候选/推荐集合 |
| `orchestration_plans` + `orchestration_plan_steps` | 声明式期望路径 | plan、accepted decision、step、offer、trigger、capabilities、status | 不含 active/completed；计划不能代表执行 |
| `service_cases` | 实际执行 | case、plan、status、owner、next_action、SLA、escalation | 只能在 FamilyServiceDecision 后创建；completed 不等于成长结果 |
| `service_eligibility_evaluations` | T1/T2 资格证据 | phase、offer、result、reason、policy version、evaluated_at | T2 失败则拒绝执行且不静默替换 |
| `follow_up_responses` | 服务回访 | response、case、helpfulness、truth class、response ref | 不写 Observation；只能成为后续 Named Action 的候选 |

`ContextReuseProjection` 不建 canonical 表；由受控的只读查询根据同一 `family_id + subject_person_id + need_type` 生成，并明确返回“此前选择/服务/自述帮助感”，不输出因果或“已证明有效”的语言。

## 4. API 与显式 Action

所有 `/families/:familyId/orchestration/*` 端点使用 `FamilyPlatformAuthGuard`、`@RequireFamilyAction`、`@ActorId`，从 Guard 注入的 `familyContext` 读取可信身份；禁止相信请求中的 actor、family 或 subject 所属断言。

| Endpoint | Named Action | 角色起点 | 领域二次校验 |
|---|---|---|---|
| `POST /need-signals` | `CreateGrowthIntent`（先扩展权限矩阵） | OWNER/GUARDIAN | subject 同家庭、儿童年龄阶段、Intent 显式确认/幂等 |
| `POST /recommendations` | `RequestResourceRecommendation` | OWNER/GUARDIAN/限定成人 | Intent OPEN、T1 eligibility、确定性规则 |
| `POST /decisions` | `DecideFamilyService` | OWNER/GUARDIAN | recommendation version、selected offers 完整性 |
| `POST /plans` | `CreateOrchestrationPlan` | OWNER/GUARDIAN | decision 已接受、step 引用 selected offer |
| `POST /cases` | `OpenServiceCase` | OWNER/GUARDIAN | T2 eligibility、计划与决定同家庭、幂等 |
| `POST /cases/:id/follow-up` | `RecordServiceFollowUp` | OWNER/GUARDIAN/限定成人 | case 同家庭、仅服务回访字段 |
| `GET /context-reuse` | `ReadFamily` | 现有矩阵 | 同家庭、最小字段、无因果文字 |

角色矩阵采用 fail-closed 默认；`CHILD_SUBJECT` 不允许创建 Intent、决定、计划或 Case；若后续支持儿童表达，应使用单独的 `RecordPerspective` 和年龄/监护规则，而不是绕过家庭决定。

## 5. 确定性策略

唯一 `need_type = PARENT_CHILD_COMMUNICATION_CONFLICT`。必需能力固定为 `DE_ESCALATION` 与 `COMMUNICATION_REOPENING`。候选 Offer 为：

1. `NO_ACTION`：当家庭明确不希望继续或当没有合格帮助时，可作为一等结果。
2. `AI_COACH`：只提供结构化稳定—复述—开放问题—可逆小行动提示；内部确定性适配，不发起外部模型请求。
3. `PRACTICE`：仅在存在 approved content ref 时可候选；否则在 T1/T2 直接 `INELIGIBLE`。
4. `EXTERNAL_REFERRAL`：风险/专业范围不匹配时可出现，但 V1 只给出受控转介信息，不自动联系第三方。

Eligibility 必须依次检查：有效服务/AI 同意（按 Offer）、家庭/subject 范围、年龄阶段、风险路由、offer availability、approved content、provider qualification（V1 internal provider 固定 ACTIVE）。排名固定为：优先 `NO_ACTION`（家庭主动拒绝时）→ low-risk `AI_COACH` + `PRACTICE` → `EXTERNAL_REFERRAL`（范围外/风险提示）。所有排序理由、限制和政策版本需可返回和审计。

## 6. 安全与多租户准备

- 数据库查询必须以 `family_id` + 主键组合约束，所有 mutation 使用事务和 `idempotency_key`。
- Repository API 统一传入 `FamilyAuthContext`（或其不可伪造的子集）、purpose、policy version；不得接受裸 `actor_id` 作为授权来源。
- Outbox 仅记录最小服务事件，避免原始儿童文本；未来服务间事件必须带 family scope、purpose、retention 和政策版本。
- 不在本 phase 建 Organization、多租户 schema 或网关；但每个新表/事件/缓存 key 以 `family_id` 为隔离维度并提供串租回归测试。

## 7. 测试矩阵

1. 单元：need→capability、T1/T2 eligibility、确定性排序、decision 完整性、plan≠execution、context reuse 非因果措辞。
2. IAM/权限：valid owner/guardian、x-actor-only required mode、invalid/expired/revoked session、revoked binding、left/revoked membership、wrong family、adult limited、child denied。
3. 数据：subject 跨家庭、offer 跨 family、decision/recommendation version 篡改、idempotency replay/conflict、T2 availability/consent/approved content 变化。
4. 真相：FollowUpResponse 不生成 `outcome_observations`；不调用 legacy priority/intervention/Principal proposal bridge；ServiceCase completed 不被显示为成长结果。
5. 安全：无外部模型调用、无未授权 capability、无跨家庭 read/write、无未经审批 Practice 内容。

## 8. 开发顺序

1. 扩展权限矩阵与 Guard 接线测试。
2. 添加契约类型和 `0020` migration。
3. 新建 Repository/Policy/Service/Controller/Module，先以单元和 API 契约覆盖。
4. 接入确定性内部 AI_COACH、approved Practice ref 和 Follow-up/Context reuse。
5. 将模块导入 AppModule；运行 build/typecheck/unit/HTTP E2E/授权扫描。
6. 只在所有 Gate 通过后更新 PROGRAM_STATUS；不自动合并或发布。

## 参考

- `architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md`
- `governance/FAMILY_GROWTH_VERTICAL_SLICE_001_TASK_CONTRACT.md`
- `architecture/FAMILY_PLATFORM_OPERATING_METHODS_AND_TENANCY_ADAPTATION_V1.md`
- `architecture/BANGYANG_EDUCATION_ASSET_PRESERVATION_AND_RESOURCE_ADMISSION_V1.md`
