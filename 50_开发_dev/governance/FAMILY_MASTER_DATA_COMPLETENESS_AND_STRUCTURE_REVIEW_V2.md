# Family / 伐木累主数据完整性与结构合理性复审 V2

## 1. 复审结论

上一版“22 个主数据对象”的方向是正确的，但**不能直接冻结**。复审 34 页 UI、六条闭环、现有迁移和商业化对象后，发现三类问题：

第一，初版没有把多租户纳入主数据；第二，把几个实际不同的对象合并了，例如 `Activity/AvailabilitySlot`、`CommunitySpace/CommunityTemplate`、`PricePlan/EntitlementPolicy`；第三，0024 中的 `family_admitted_catalog_items`、`family_service_provider_catalog`、`family_activity_catalog` 是 DEV/TEST 目录投影/fixture 表，不能被误认为最终生产主数据真相。

因此，本次建议将 **32 个逻辑主数据对象**作为规范化设计基线：**23 个业务主数据 + 5 个多租户主数据 + 4 个 AI 控制主数据**。这不是说现在立即新增 32 张表，而是先固定逻辑对象、主键、关系、生命周期和所有权；物理表可以通过聚合、版本表、关联表和投影实现。

| 层级 | 初版 | V2 基线 | 说明 |
|---|---:|---:|---|
| 业务主数据 | 18 | **23** | 拆分活动/时段、社区空间/模板、测评工具、价格计划 |
| 多租户主数据 | 0 | **5** | Tenant 及四个租户边界对象 |
| AI 控制主数据 | 4 | **4** | 模型、提示、工具、评测 |
| **逻辑主数据合计** | **22** | **32** | 逻辑对象数，不等于物理表数 |

## 2. V2 的 23 个业务主数据

### 2.1 家庭与治理对象：6 个

| 编号 | 对象 | 说明 |
|---:|---|---|
| B-01 | `Family` | 家庭私有数据所有权根 |
| B-02 | `Person` | 家庭成员最小身份对象 |
| B-03 | `FamilyMembership` | Person 在 Family 内的角色和状态 |
| B-04 | `FamilyRelationship` | 家庭成员之间的关系 |
| B-05 | `LifeStage` | 生命周期阶段定义；分配是实例/事实 |
| B-06 | `ConsentPolicy` | 同意用途、版本和撤回规则；具体 Consent 是事实 |

### 2.2 需求、能力、内容和证据：6 个

| 编号 | 对象 | 说明 |
|---:|---|---|
| B-07 | `NeedType` | 家庭表达的受控服务需要分类，不是家庭标签 |
| B-08 | `AssessmentToolDefinition` | L0/L1 支持需要确认工具定义；L2/L3 只登记 HOLD，不运行 |
| B-09 | `Capability` | 平台可提供/编排的能力键 |
| B-10 | `ResourceAsset` | 内容、实践、课程材料及版本 |
| B-11 | `EvidenceSource` | 来源、证据等级、版权/授权、适用范围 |
| B-12 | `JourneyTemplate` | 服务旅程/成长路径模板 |

### 2.3 服务、供给与活动：6 个

| 编号 | 对象 | 说明 |
|---:|---|---|
| B-13 | `ServiceOffering` | 家庭可选择的服务能力定义 |
| B-14 | `Provider` | 名师、服务团队或沙龙主理人供给主体 |
| B-15 | `ProviderQualification` | 资格、培训、有效期和解释责任 |
| B-16 | `Activity` | 沙龙、课程、家庭活动定义 |
| B-17 | `AvailabilitySlot` | Activity/Provider 可被预约的时间槽；预约是事实 |
| B-18 | `TaskTemplate` | 任务模板；具体 Task 是实例 |

### 2.4 社区与商业化定义：5 个

| 编号 | 对象 | 说明 |
|---:|---|---|
| B-19 | `CommunitySpace` | 租户/家庭可见的社区空间定义与状态 |
| B-20 | `CommunityTemplate` | 受控帖子、打卡、成果展示模板；发布是事实 |
| B-21 | `ProductOffering` | 商品、课程、实践包的展示定义 |
| B-22 | `PricePlan` | 价格计划/计价引用/版本；DEV 可先存 `price_ref` |
| B-23 | `EntitlementPolicy` | 权益规则、有效期、适用条件；真实权益事实另建 |

`PricePlan` 与 `EntitlementPolicy` 必须分开：前者回答“以什么价格/版本提供”，后者回答“购买/资格后可以得到什么”。`CommunitySpace` 与 `CommunityTemplate` 必须分开：前者是空间，后者是受控内容结构。

## 3. 5 个多租户主数据

| 编号 | 对象 | 说明 |
|---:|---|---|
| T-01 | `Tenant` | 商业客户空间和隔离命名空间 |
| T-02 | `TenantAccountMembership` | Account 在 Tenant 内的角色和状态 |
| T-03 | `TenantFamilyBinding` | Family 到 Tenant 的活动归属、有效期和迁移状态 |
| T-04 | `TenantPolicyProfile` | 功能开关、数据保留、LLM/工具和外部适配器策略 |
| T-05 | `TenantCatalogBinding` | 平台目录对象在租户内的版本、准入和可见性 |

## 4. 4 个 AI 控制主数据

| 编号 | 对象 | 说明 |
|---:|---|---|
| AI-01 | `ModelProfile` | 模型 allowlist、能力和环境 |
| AI-02 | `PromptPolicy` | 页面/用例输入边界、禁词和状态上限 |
| AI-03 | `ToolDefinition` | 受控工具、Named Action 和参数 schema |
| AI-04 | `EvalSuite` | 合成正负例、判定阈值和回放版本 |

真实 API key 是 secret，不是对象；模型运行审计是事实，不是主数据；模型不能创建或修改上述控制主数据。

## 5. 初版对象的重复与降级问题

| 当前实现 | 正确分类 | 复审结论 |
|---|---|---|
| `family_admitted_catalog_items` | DEV/TEST `AdmittedCatalogProjection` | 不能同时冒充 ProductOffering、ResourceAsset、CommunityTemplate 三个真相对象 |
| `family_service_provider_catalog` | DEV/TEST Provider/Qualification projection | 资格字段可先共表，但逻辑上必须拆分，缺资格时 fail-closed |
| `family_activity_catalog` | DEV/TEST Activity projection | Activity 与 AvailabilitySlot 需要逻辑拆分；当前表只表示目录活动 |
| `test_experience_operations` | 交易事实/沙箱适配器 | 不能叫真实订单、预约、报名、社区发布或会员权益 |
| `family_customer_asset_projection` | 读模型 | 由事实派生，不拥有独立业务真相 |
| `family_profile_snapshots` | 家庭私有读/快照对象 | 不是 Family 主数据，不能产生画像结论 |
| `family_support_report_snapshots` | 家庭私有报告事实/投影 | 不是教育效果、诊断或成长评分主数据 |
| `family_page_task_items` | TaskInstance 事实 | 不能与 TaskTemplate 混为一体 |

## 6. 关系合理性检查

### 6.1 应保留的主关系

`Tenant 1:N TenantFamilyBinding N:1 Family`；`Tenant 1:N TenantAccountMembership N:1 Account`；`Family 1:N Person`；`Family 1:N FamilyMembership`；`Person N:M FamilyRelationship`；`Family 1:N Consent`；`NeedType 1:N NeedInput`；`NeedType/Capability N:M ResourceAsset`；`ResourceAsset N:1 EvidenceSource`；`ServiceOffering N:M Capability`；`Provider 1:N ProviderQualification`；`Provider 1:N AvailabilitySlot`；`Activity 1:N AvailabilitySlot`；`JourneyTemplate 1:N TaskTemplate`；`ProductOffering N:1 PricePlan`；`ProductOffering N:1 EntitlementPolicy`；`CommunitySpace 1:N CommunityTemplate`。

### 6.2 不应建立的关系

不能让模型直接拥有 `Family`、`Person`、`Need`、`Intent`、`Decision`、`Plan` 或 `Case` 的写外键；不能让 `CommunityPublication` 反向成为公开画像；不能让 `Outcome` 反向修改 `GrowthProfile`；不能让 `TenantCatalogBinding` 直接修改平台目录准入；不能让任何 Family 引用另一个 Tenant 的 Provider、Activity 或 Asset；不能把 `Account` 作为 Family 数据所有者。

## 7. 完整性缺口

| 缺口 | 严重性 | 处理结论 |
|---|---|---|
| Tenant 五对象未落库 | P0 | 多租户商业化前必须实现 |
| `families` 和家庭事实没有统一 tenant scope | P0 | 所有家庭事实查询和审计需双范围校验 |
| NeedType/AssessmentToolDefinition 未成目录 | P1 | L0/L1 先建，L2/L3 只登记不运行 |
| ResourceAsset/ServiceOffering/EvidenceSource 有多处 registry | P1 | 统一目录 source of truth，现有表降为兼容投影 |
| Provider/Qualification 共表 | P1 | DEV 可兼容，正式化时拆分或明确聚合边界 |
| Activity/AvailabilitySlot 未拆分 | P1 | 预约前必须区分活动定义和时段事实 |
| CommunitySpace/Template 缺失 | P1 | 社区页面先用私有模板投影，真实外发仍需 Gate |
| PricePlan/EntitlementPolicy 未分离 | P1 | 真实商业化前必须分开；当前只允许 price_ref |
| Tenant Policy 未进入 LLM Context | P0 | Gateway 必须继承租户策略且只能收紧 |
| 读模型与主数据命名混用 | P1 | 所有 UI 投影标注 `Projection`，不能当主数据写回 |

## 8. 最终判断

**当前主数据设计还没有完全齐全，结构方向合理但需要规范化。** 初版 22 个对象可作为历史草案，不能作为最终冻结数量；多租户和页面实际对象补齐后，以 **32 个逻辑主数据对象**作为 V2 设计基线更合理。

但这 32 个对象不是 32 张表。推荐的物理落地是：租户根表与绑定表、家庭身份表、目录聚合表/版本表、Provider/Qualification 聚合、Activity/Slot 聚合、Community 聚合、商业化定义聚合、AI 策略 registry，以及由交易事实派生的读模型。每新增一个物理表都必须说明它属于主数据、事实、投影还是治理审计。

在 Tenant 五对象、双范围查询、目录统一和上述缺口没有通过对象模型 Gate 前，继续开发 34 页只能标记为 `UI_READY_BACKEND_GAP` 或 `GATE_BOUNDARY`，不能宣称前后端一致或多租户商业化就绪。
