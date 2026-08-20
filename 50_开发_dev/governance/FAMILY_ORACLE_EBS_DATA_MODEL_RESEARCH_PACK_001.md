# Family / 伐木累 Oracle EBS 数据建模研究包 001

## 研究范围

本研究只提炼 Oracle E-Business Suite 的建模方法，不复制 Oracle 专有表结构、命名或代码。Family 仍使用 PostgreSQL、模块化单体和自身的 Tenant → Family 数据所有权规则。

## 官方资料

| 编号 | 官方资料 | 用途 |
|---|---|---|
| [1] | [Oracle E-Business Suite Developer's Guide](https://docs.oracle.com/cd/E26401_01/doc.122/e22961/toc.htm) | 开发标准、完整性、唯一性、引用完整性、WHO 审计、组织 API、接口与扩展方法 |
| [2] | [Oracle E-Business Suite Multiple Organizations Implementation Guide](https://docs.oracle.com/cd/E18727-01/doc.121/e13423/T443823T443827.htm) | 多组织层级、组织关系、安全 profile、组织范围和实施验证 |
| [3] | [Oracle E-Business Suite Adapter User's Guide — Using Interface Tables and Views](https://docs.oracle.com/middleware/1221/adapters/ebusiness/T430238T430242.htm) | 接口表、基表、验证程序、只读视图和外部集成边界 |
| [4] | [Oracle E-Business Suite Developer's Guide — Flexfields](https://docs.oracle.com/cd/E26401_01/doc.122/e22961/T302934T457085.htm) | Key Flexfield、Descriptive Flexfield、值集、组合、上下文扩展和不改核心表的可扩展属性 |

## 提炼出的建模原则

### 1. 组织/租户层级先于业务对象

Oracle Multiple Organizations 的实施顺序先建立组织结构，再定义关系、安全 profile 和应用范围。[2] Family 应采用相同的先后纪律：先完成 `Tenant`、Tenant 账号成员、Tenant↔Family 绑定、TenantPolicyProfile 和目录绑定，再让页面、API、LLM Context 读取任何家庭或目录对象。Family 仍是家庭私有事实的数据所有权根，但所有物理对象需要能够验证 `tenant_id → family_id` 的一致性。

### 2. 主数据、交易事实、接口表和查询视图分离

Oracle 官方接口资料明确区分接口表、应用基表和只读视图：外部输入先进入接口表，经过验证和业务处理后才能进入基表；视图只用于查询。[3] Family 的对应落法是：

| Oracle EBS 方法 | Family 落法 |
|---|---|
| Base table | 正式主数据/事实表，由 Named Action 和服务层写入 |
| Interface table | DEV/TEST 导入或外部适配器 staging 表；不直接成为家庭事实 |
| View | 页面读模型、目录投影、客户资产投影、LLM Context view |
| Concurrent validation/program | 受控 service、validator、Gateway/Eval pipeline |

页面不能直接写主数据表；多模态输入、外部订单、预约请求或第三方数据都必须先经过受控入口、校验、幂等和状态转换。

### 3. 每张业务表保留一致的审计列

EBS Developer's Guide 的 `FND_GLOBAL`/`FND_STANDARD` 等基础能力体现了统一 WHO 审计思路。[1] Family 需要在正式主数据和交易表统一保留 `created_at`、`created_by`、`updated_at`、`updated_by`、`request_id/correlation_id`、`source_system` 和必要的 `version_no`。审计列不能只存在于 AI 表；家庭、目录、供给、预约、社区、资产和多模态事实都要保持一致。

### 4. 业务主键与代理主键并存

Family 继续使用 UUID 代理主键，但每个业务对象必须有稳定的业务唯一键，例如 `tenant_ref`、`family_ref`、`provider_ref`、`activity_ref`、`asset_ref`、`policy_ref + version`。自然业务键用于幂等、接口、回放和跨环境迁移；UUID 只负责物理关系，不应替代业务身份。

### 5. 生效期、状态和版本必须独立

状态不是生效期，版本也不是状态。目录、策略、供给、模型、Schema 和多模态能力应分开记录 `status`、`effective_from`、`effective_to`、`version_no`、`approved_at` 和 `retired_at`。所有读取都必须按当前时间和 ACTIVE/准入状态派生，不能只按一个布尔字段判断可见性。

### 6. 值集、编码和交叉校验集中治理

Oracle Flexfields 将 segment、value set、valid combination 和 cross-validation 作为独立能力。[4] Family 应增加平台级 `ReferenceCodeSet`/`ReferenceCodeValue`/`ReferenceValidationRule` 方向，用于状态、用途、风险级别、证据等级、服务类型、模态、页面能力等稳定枚举。代码中的 TypeScript union 仍可保留为编译期保护，但数据库与配置目录必须有可审计的值集来源，不能让用户自由提交任意状态字符串。

### 7. 可扩展属性不能污染核心字段

Oracle Descriptive Flexfields 用上下文相关的扩展段来容纳不同业务群体的额外属性，而不是持续修改核心表。[4] Family 的可扩展字段应使用版本化 JSONB/attribute table，并绑定 `object_type`、`context_code`、`schema_ref`、`tenant_id` 和 validator。核心安全、所有权、状态、金额、Consent、证据和生命周期字段不能放入自由 JSONB。

### 8. 组合对象与父子关系明确

Oracle Key Flexfield 的 combinations table 代表合法组合，并使用约束维护有效组合。[4] Family 的 `ProductOffering + PricePlan + EntitlementPolicy`、`Provider + Qualification + ServiceOffering`、`Activity + AvailabilitySlot + Booking`、`Tenant + FamilyBinding` 应视为组合/父子关系，必须有复合唯一键和父子级联规则，不允许由页面拼接临时组合。

### 9. 多语言和显示文本与业务身份分离

EBS 的产品和消息体系把业务代码、显示文本和语言支持分开管理。[1] Family 应让 `*_ref`/编码保持稳定，把用户可见名称放入可版本化的本地化文本表或结构化 display label；UI 的 Family/伐木累品牌名不应改变历史 source_file、asset_id 和内部业务 ref。

### 10. 扩展优先使用服务、视图和接口，不直接修改核心语义

Oracle 官方开发指南强调以扩展和接口方式适配应用，并把直接修改核心对象作为高维护成本路径。[1][3] Family 的新页面功能要优先复用正式对象、服务、视图和 Named Action；如果必须新增字段或表，先声明它属于主数据、事实、接口 staging、投影或审计，并增加对象字典、权限、生命周期和回归测试。

## Family 物理建模标准 V1

| 领域 | 必须具备 |
|---|---|
| 租户/家庭 | `tenant_id`、`family_id` 一致性、ACTIVE 绑定、双范围查询、跨租户负例 |
| 主数据 | 代理主键、业务唯一键、状态、生效期、版本、来源、审计列 |
| 交易事实 | 父对象引用、幂等键、状态机、Named Action、请求/关联 ID、不可随意覆盖历史 |
| 目录/供给 | 准入、证据、资格、版本、风险、版权/授权、可见性和租户绑定 |
| 多模态 | 能力/策略/Schema 主数据；资产/Consent/运行/派生/审计事实；不得保存原文/key |
| AI | Model/Prompt/Tool/Eval 主数据；Gateway 单入口；Context 最小化；输出 Schema 验证 |
| 接口 | staging 与基表分离；先校验后写入；幂等；失败不产生业务事实 |
| 查询 | 页面通过读模型/视图；不把 projection 当成 master truth；用户可见文案与内部状态分离 |
| 扩展 | schema/version/context/validator；不得用自由 JSONB 替代核心关系 |

## 不直接照搬的内容

Family 不照搬 Oracle 的 Oracle schema、FND 表、PL/SQL、Concurrent Manager、Operating Unit 或 Accounting Ledger。这里借鉴的是建模纪律：层级先行、组织范围、安全 profile、基表/接口表/视图分离、统一审计、稳定业务键、有效期/状态/版本、值集和可控扩展。

## 对现有 Family 的立即影响

1. 当前 35 个逻辑主数据对象需要补充统一审计列、业务唯一键、生效期/版本和来源字段，而不是只补 Tenant 和多模态表。
2. 0025/0026 迁移应增加对象级业务键、版本和审计规范，后续迁移不能只满足“表能插入”。
3. `family_admitted_catalog_items`、`family_service_provider_catalog`、`family_activity_catalog` 必须明确是目录投影/接口承载，不应冒充最终主数据基表。
4. 页面 DTO 应分成 command/interface DTO 与 read-model DTO，禁止把数据库行直接作为用户可写 DTO。
5. 34 页一致性矩阵需要增加 `base_object`、`interface/staging`、`read_model`、`effective_date`、`business_key`、`concurrency` 和 `audit_columns` 列。

## References

[1]: https://docs.oracle.com/cd/E26401_01/doc.122/e22961/toc.htm "Oracle E-Business Suite Developer's Guide"
[2]: https://docs.oracle.com/cd/E18727-01/doc.121/e13423/T443823T443827.htm "Oracle E-Business Suite Multiple Organizations Implementation Guide"
[3]: https://docs.oracle.com/middleware/1221/adapters/ebusiness/T430238T430242.htm "Oracle E-Business Suite Adapter User's Guide — Using Interface Tables and Views"
[4]: https://docs.oracle.com/cd/E26401_01/doc.122/e22961/T302934T457085.htm "Oracle E-Business Suite Developer's Guide — Flexfields"
