# Family / 伐木累 Oracle EBS 风格物理数据模型规范 V1

## 1. 目标与适用范围

本规范将 Oracle E-Business Suite 的企业级数据建模纪律迁移到 Family 的 PostgreSQL 模块化单体中。它不复制 Oracle 的专有 schema、FND 表或 PL/SQL，而是统一 Family 的主数据、交易事实、接口承载、查询投影、多租户、多模态和 AI 控制面结构。

规范适用于 35 个逻辑主数据对象、Tenant→Family 双范围、34 页 UI 的 API/DTO、六条业务闭环以及真实 LLM Gateway 的 Context/Audit 数据。

## 2. Family 物理对象四层

| 层 | 物理对象 | 写入方式 | UI 是否直接读写 |
|---|---|---|---|
| Base | 正式主数据和交易事实表 | Service + Named Action + 事务 | UI 只能经 API 读写 |
| Interface | 导入、外部沙箱、模型/多模态输入 staging | 受控 adapter + validator + 幂等 | 不直接展示为事实 |
| View/Projection | 页面读模型、目录投影、客户资产、LLM snapshot | Projection service/view | UI 只读；不可回写为 Base |
| Audit | 状态变迁、授权、模型决策、外部调用摘要 | append-only audit service | 仅授权角色可读 |

任何新增表必须在迁移说明中标注属于 Base、Interface、Projection 或 Audit；若无法归类，迁移不得进入主分支。

## 3. Scope 设计

### 3.1 访问层级

Family 的正式访问范围是：

```text
Tenant
  └── TenantAccountMembership
  └── TenantFamilyBinding
        └── Family
              └── Person / FamilyMembership
                    └── family-owned facts and projections
```

Account 是访问主体，不是家庭数据所有者。`tenant_id` 必须来自可信服务端上下文，不得从客户端 family_id 反推或接受客户端提交。Family 是家庭私有事实的数据所有权根，但商业化多租户系统中的每一个家庭事实必须能够验证 `tenant_id + family_id` 的一致性。

### 3.2 物理一致性规则

带家庭范围的 Base/Interface/Projection/Audit 表原则上必须包含 `tenant_id` 与 `family_id`，并通过复合外键或父键路径证明二者属于同一 ACTIVE TenantFamilyBinding。平台级对象只带 `tenant_id` 或不带家庭范围，并必须明确其共享/租户私有可见性。

## 4. 统一列模板

### 4.1 所有正式对象

```text
id uuid primary key
object_ref varchar(80) not null
status varchar(40) not null
created_at timestamptz not null default now()
created_by uuid not null
updated_at timestamptz not null default now()
updated_by uuid not null
source_system varchar(80) not null
correlation_id uuid null
version_no integer not null default 1
```

如果对象需要租户范围，增加 `tenant_id`；如果对象需要家庭范围，增加 `family_id`；如果对象是可发布主数据，增加 `effective_from`、`effective_to`、`approved_at`、`retired_at`。

### 4.2 主数据表

主数据必须具备稳定 `object_ref` 与版本唯一键。推荐唯一约束为：

```text
(tenant_id, object_ref, version_no)
(tenant_id, object_ref, effective_from)
```

对于平台共享主数据，`tenant_id` 可为空但必须通过 `visibility_scope` 明确为 PLATFORM 或 TENANT；禁止使用 NULL 语义猜测共享范围。

### 4.3 交易事实表

交易事实必须具备不可变业务 ref、来源、发生时间、幂等键、状态机和父对象关系：

```text
fact_ref varchar(80) not null
idempotency_key varchar(160) not null
occurred_at timestamptz not null
status varchar(40) not null
parent_object_id uuid not null
```

状态变化只能由 Named Action 执行，并保留状态审计；不允许页面用通用 PATCH 覆盖交易历史。

### 4.4 Projection 表

Projection 至少包含：

```text
projection_ref varchar(80) not null
source_object_ref varchar(80) not null
projection_version integer not null
as_of timestamptz not null
visibility_scope varchar(40) not null
```

Projection 只能按 Base/Fact 派生，不能成为新的业务真相。34 页 UI 的列表、卡片、客户资产和 LLM Context 都默认通过 Projection DTO 返回。

### 4.5 Audit 表

Audit 表必须为 append-only，并保留：

```text
audit_id uuid primary key
entity_type varchar(80) not null
entity_id uuid not null
action_name varchar(120) not null
actor_account_id uuid null
actor_person_id uuid null
tenant_id uuid null
family_id uuid null
before_hash varchar(128) null
after_hash varchar(128) null
policy_version varchar(80) null
correlation_id uuid not null
created_at timestamptz not null
```

AI/多模态审计不能保存真实 key、认证 header、原始 prompt、provider 原文或原始家庭媒体。

## 5. 业务键、值集与扩展

### 5.1 代理键与业务键

UUID 作为代理主键；`*_ref` 作为稳定业务键，用于幂等、导入、回放和跨环境迁移。所有对外 API command 必须使用业务 ref 或服务端生成的 idempotency key，不能要求前端拼装数据库 UUID 关系。

### 5.2 Reference Code Set

Family 应新增平台级参考编码能力：

```text
reference_code_sets
reference_code_values
reference_validation_rules
```

状态、用途、证据等级、模态、服务类型、风险路由和准入状态必须有统一 code set；TypeScript union 作为编译保护，数据库 reference values 作为运行期治理来源。任意未知编码必须 fail-closed。

### 5.3 可扩展属性

租户特有业务属性可以使用版本化 extension 表或 JSONB，但必须包含：

```text
object_type
object_id
context_code
schema_ref
schema_version
tenant_id
```

安全范围、所有权、Consent、金额、状态、准入、生效期和保留期不得放在自由 JSONB 中。

## 6. 35 个逻辑主数据的物理重构分组

| 分组 | 逻辑对象 | 物理要求 |
|---|---|---|
| Tenant | Tenant、TenantAccountMembership、TenantFamilyBinding、TenantPolicyProfile、TenantCatalogBinding | Base；ACTIVE 唯一约束；策略/目录生效期 |
| Family | Family、Person、FamilyMembership、Relationship、LifeStage | Base；Tenant+Family 双范围；家庭私有权属 |
| Need/Service | NeedType、Capability、ServiceOffering、Provider、Qualification | Base；准入、证据、资格、版本、有效期 |
| Resource | ResourceAsset、EvidenceSource、AdmissionProfile | Base；证据等级、来源、版权、风险和版本 |
| Commerce | ProductOffering、PricePlan、EntitlementPolicy、Activity、AvailabilitySlot | Base；父子/组合唯一键；交易事实不混入目录 |
| Community | CommunitySpace、CommunityTemplate、ModerationPolicy | Base；租户可见性、发布策略、审核状态 |
| Journey | JourneyTemplate、TaskTemplate、ReportTemplate、ContentOffering | Base；版本化；由交易实例派生 |
| AI | ModelProfile、PromptPolicy、ToolDefinition、EvalSuite、MultimodalCapabilityProfile、MultimodalProcessingPolicy、MultimodalOutputSchema | Base；环境/租户策略、允许模型、Schema、Human Gate |

## 7. DTO 分层

| DTO | 作用 | 允许写入 |
|---|---|---|
| Command DTO | 用户/服务端动作意图 | 仅受控字段、业务 ref、幂等键 |
| Base Object DTO | 正式对象内部/服务间表达 | 服务端生成，含版本与范围 |
| Read Model DTO | 34 页 UI 投影 | 只读；包含 as_of/source_ref |
| Interface DTO | 外部/多模态/导入 staging | 必须校验、隔离和过期清理 |
| LLM Context DTO | 最小只读快照 | 不可写回核心事实 |

## 8. 迁移规则

旧表不机械重命名。每个结构改造必须新增迁移、回填/兼容策略、唯一约束、索引、外键和失败负例。历史 source_file、asset_id、Git 路径和 evidence 引用保持可追溯。

在 DEV/TEST 先验证：

1. 跨 Tenant 读取和写入均被阻断。
2. 同一对象的重复业务 ref/版本被阻断。
3. 生效期重叠被阻断或按明确策略拒绝。
4. 缺失审计主体、来源、Consent、准入或资格时 fail-closed。
5. Interface 输入失败不生成 Base 事实。
6. Projection 不能通过 API 回写 Base。
7. LLM/多模态输出不能写入成长结论、评分、诊断、永久标签或公开内容。

## 9. 当前实施优先级

第一优先级是 Tenant+Family 复合范围和统一审计模板；第二优先级是正式目录基表与 projection 分离；第三优先级是 reference code sets、业务键/版本/生效期；第四优先级是接口 staging、扩展属性和多语言；第五优先级是根据 34 页矩阵逐页把 Read Model DTO 与 Command DTO 接上。

## 10. 结论

Family 的数据结构可以借鉴 Oracle EBS 的方法，但不应复制 Oracle EBS 的复杂表数量。真正需要复制的是“对象分层、组织范围、稳定业务键、完整审计、基表/接口表/视图分离、状态/版本/生效期分离和可控扩展”。以此为基线，Family 才能在保持 AI-native 的同时具备商业化产品需要的可维护性、可审计性和多租户隔离能力。
