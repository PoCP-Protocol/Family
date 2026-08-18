# Family / 伐木累 Oracle EBS 风格物理模型差距审查 V1

## 1. 事实基线

当前隔离 `family_test` 数据库有 **68 张表**，其中包括 Family 身份、成长、编排、Principal、Tenant、多模态和测试体验表。68 张表不等于 35 个逻辑主数据对象：其中许多是交易事实、审计、会话、投影或测试承载表。

本审查依据实际 `information_schema` 盘点文件 `reports/l1/FAMILY_DB_TABLE_INVENTORY_EBS_BASELINE_001.txt`，并对照 Oracle EBS 官方建模方法研究包 `governance/FAMILY_ORACLE_EBS_DATA_MODEL_RESEARCH_PACK_001.md`。

## 2. 主要发现

### P0：租户范围还没有成为全库物理不变量

当前 Tenant 五对象已经存在，且多模态表带有 `tenant_id + family_id`。但是大量既有家庭事实只有 `family_id`，没有 `tenant_id`，包括成长事实、编排事实、Principal 事实、产品事件和服务案例。仅依靠查询层传入 Tenant scope 不能达到 Oracle 多组织式的物理隔离纪律。

必须先确定一种兼容路径：

1. 直接为所有 Family-owned 正式事实表补 `tenant_id`，并以 `tenant_id + family_id` 复合外键或可验证约束保证一致；或者
2. 在核心 `families` 上建立不可绕过的 Tenant 绑定，并让所有事实通过复合父键引用 `families(tenant_id, family_id)` 的兼容视图/约束路径。

在没有明确路径前，不能宣称多租户商业化就绪。

### P1：统一审计列不完整

当前多数表有 `created_at`，部分表有 `updated_at`，但缺少统一的 `created_by`、`updated_by`、`correlation_id/request_id`、`source_system` 和 `version_no`。Oracle EBS 的 WHO 类审计纪律应转化为 Family 的统一列模板。审计日志表不能替代业务表上的行级来源和修改主体信息。

### P1：业务唯一键不统一

当前不少对象主要依赖 UUID 主键；Tenant 和多模态控制对象已有业务引用字段，但成长、服务、事实和投影对象需要补稳定业务 ref 或幂等唯一键。UUID 应用于物理关系，`*_ref`、`version_no` 和 scope 组合应承担接口、导入、回放和环境迁移身份。

### P1：状态、生效期和版本混用或缺失

`growth_profiles`、`life_stage_assignments`、`tenant_family_bindings` 已有生效期；大量成长、服务、投影和目录对象只有 status 或只有 created_at。正式主数据必须分开 `status`、`effective_from`、`effective_to`、`version_no`、`approved_at` 和 `retired_at`。交易事实必须拥有状态机和不可覆盖的历史语义。

### P1：目录表和最终主数据基表边界不清

`family_admitted_catalog_items`、`family_service_provider_catalog`、`family_activity_catalog` 和 `family_customer_asset_projection` 更接近目录投影或 DEV/TEST 承载，不应被 UI 直接当作最终主数据真相。需要建立正式 `ResourceAsset`、`Provider`、`Qualification`、`ServiceOffering`、`Activity`、`AvailabilitySlot`、`ProductOffering`、`PricePlan`、`EntitlementPolicy` 的基表/版本表，再由目录投影按租户和家庭生成可见数据。

### P2：值集和交叉校验分散在 TypeScript 与 CHECK 中

当前状态和用途大量由 enum、varchar 和代码 union 分散维护。应建立平台级 Reference Code Set/Value/Validation Rule 方向，至少治理状态、证据等级、用途、模态、页面能力、资格状态和风险路由。数据库 CHECK 仍可作为底线，但不应成为唯一业务字典。

### P2：接口 DTO、数据库行和读模型仍有混用风险

Oracle EBS 的接口表、基表和视图分离方式提示 Family 必须明确三种 DTO：Command/Interface DTO 只接收可提交字段；Base Object DTO 表示服务端正式对象；Read Model DTO 只为 34 页投影服务。页面不能把读模型原样回传作写请求，LLM Context 也必须从只读 view/snapshot 构造。

### P2：扩展字段和多模态结构需遵守上下文 Schema

多模态 0026 已将能力、策略、输出 Schema 与事实分离，这是正确方向。但 `jsonb` 字段还需要 `schema_ref`、版本、validator 和租户策略继承；不能用自由 JSONB 替代关系型所有权、状态、Consent、保留期或准入字段。

## 3. 表级差距分类

| 分类 | 代表表 | 当前问题 | 处理方向 |
|---|---|---|---|
| 家庭根 | `families`, `persons`, `family_memberships` | Tenant 双范围未全量下沉 | 先建复合 scope 规则，再兼容迁移 |
| 成长事实 | `growth_*`, `outcomes`, `milestones` | 审计/业务键/tenant 缺失不一 | 统一事实模板、不可覆盖历史 |
| 编排事实 | `growth_intents`, `orchestration_plans`, `service_cases` | 状态存在但版本/来源/命令边界不统一 | Command → state machine → read model |
| 目录投影 | `family_admitted_catalog_items`, `family_activity_catalog` | 可能被误当 master truth | 标注 projection，补正式基表 |
| Principal/AI | `principal_*`, `family_llm_gateway_audits` | AI 审计较完整，业务事实范围仍需 tenant | 复用 Gateway/审计模板并补双范围 |
| 多模态 | `multimodal_*` | 新表已带双范围，控制主数据审计仍可增强 | 作为参考模板推广到全库 |
| 平台控制 | `tenants`, `tenant_*`, `accounts`, `sessions` | Tenant 基础已建但关系尚未成为所有查询的统一入口 | Tenant context middleware/guard + DB 约束 |
| 测试承载 | `test_experience_operations` | DEV/TEST 真实工作流承载，不是生产主数据 | 保持 sandbox 标签和独立迁移/审计 |

## 4. 建议的统一物理列模板

### 4.1 主数据基表

```text
<object>_id uuid primary key
<object>_ref varchar(...) not null
version_no integer not null
status reference-code not null
effective_from timestamptz not null
effective_to timestamptz null
source_system varchar(...) not null
created_at timestamptz not null
created_by uuid not null
updated_at timestamptz not null
updated_by uuid not null
correlation_id varchar(...) null
```

带租户的主数据额外需要 `tenant_id`；家庭私有主数据额外需要 `family_id`；具有版本的对象要有 `(scope, object_ref, version_no)` 唯一键和时间范围检查。

### 4.2 交易事实表

```text
<fact>_id uuid primary key
<fact>_ref varchar(...) not null
parent_object_id uuid not null
idempotency_key varchar(...) not null
status reference-code not null
occurred_at timestamptz not null
source_system varchar(...) not null
created_at timestamptz not null
created_by uuid not null
correlation_id varchar(...) not null
```

交易事实不能通过 PATCH 任意覆盖；状态变化必须通过 Named Action，形成 append-only 或带状态转换审计。

### 4.3 读模型/视图

读模型可以使用 view 或物化投影，但必须包含 `as_of`/`projection_version`、Tenant/Family scope 和来源 ref；不能由读模型反向主张它是主数据基表。

## 5. 后续实施优先级

| 优先级 | 工作包 | 目标 |
|---|---|---|
| P0 | Tenant/Families 双范围物理策略 | 统一所有 Family-owned 表的 scope 证明和跨租户负例 |
| P1 | WHO + business ref + version 模板 | 先覆盖 35 个主数据和核心交易事实 |
| P1 | 正式目录基表与投影分离 | 明确 UI 只能读投影，写入走正式服务 |
| P1 | Command/Base/Read DTO 分离 | 防止页面和 LLM 直接回写数据库行 |
| P2 | Reference Code Set/Value | 统一状态、用途、证据、模态和风险代码 |
| P2 | Extension/translation schema | 支持租户差异和多语言，不污染核心列 |
| P2 | 接口 staging 和视图 | 为真实商业化外部适配器准备可验证边界 |

## 6. 审查结论

Family 当前已经有较好的 Family scope、Named Action、LLM Gateway 和多模态最小控制面，但距离 Oracle EBS 风格的商业化物理数据纪律仍有结构性差距。最重要的不是继续增加页面表，而是先让 Tenant 范围、业务唯一键、统一审计、版本/生效期、目录基表/投影、接口 DTO/读模型和引用完整性成为全库一致规则。

在 P0/P1 完成前，34 页可以继续做 DEV/TEST 体验，但必须将页面状态标记为 `DEV_IMPLEMENTING` 或 `DEV_READY_FOR_TEST`，不能标记为生产商业化就绪。

## References

[1]: https://docs.oracle.com/cd/E26401_01/doc.122/e22961/toc.htm "Oracle E-Business Suite Developer's Guide"
[2]: https://docs.oracle.com/cd/E18727-01/doc.121/e13423/T443823T443827.htm "Oracle E-Business Suite Multiple Organizations Implementation Guide"
[3]: https://docs.oracle.com/middleware/1221/adapters/ebusiness/T430238T430242.htm "Oracle E-Business Suite Adapter User's Guide — Using Interface Tables and Views"
[4]: https://docs.oracle.com/cd/E26401_01/doc.122/e22961/T302934T457085.htm "Oracle E-Business Suite Developer's Guide — Flexfields"
