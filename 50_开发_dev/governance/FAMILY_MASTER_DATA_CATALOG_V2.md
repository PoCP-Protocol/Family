# Family / 伐木累主数据目录 V2

> **规范状态：** `DESIGN_BASELINE_FOR_REVIEW`。本文件 supersede 22-object draft for new implementation. Historical files remain traceable and are not renamed.

## 1. 数量与边界

Family V2 采用 **35 个逻辑主数据对象**，其中新增 3 个多模态控制主数据；但不要求建立 35 张表。物理实现可以使用聚合根、版本表、关联表、目录投影和 SQL view；任何物理表必须在对象字典中声明自己属于主数据、事实、投影或治理审计。

| 层级 | 数量 | 逻辑范围 |
|---|---:|---|
| 业务主数据 | 23 | 家庭、成长/服务、供给/活动、社区、商业定义 |
| 多租户主数据 | 5 | Tenant 及其成员、家庭、策略、目录绑定 |
| AI/多模态控制主数据 | **7** | Model、Prompt、Tool、Eval、MultimodalCapability、MultimodalProcessingPolicy、MultimodalOutputSchema |
| **合计** | **35** | 不含 Account/Session/Audit/Outbox/MultimodalAsset 等事实对象 |

## 2. 对象字典

### 2.1 业务主数据（B-01 至 B-23）

| ID | 对象 | 聚合根/从属 | 主键 | 生命周期 | 当前实现 |
|---|---|---|---|---|---|
| B-01 | Family | 根 | `family_id` | ACTIVE → SUSPENDED → ARCHIVED | `families` |
| B-02 | Person | Family 从属 | `person_id` | ACTIVE → ARCHIVED | `persons` |
| B-03 | FamilyMembership | Family 从属 | `membership_id` | INVITED → ACTIVE → REVOKED/LEFT | `family_memberships` |
| B-04 | FamilyRelationship | Family 从属 | `relationship_id` | ACTIVE → RETIRED | `family_relationships` |
| B-05 | LifeStage | 平台定义 + Family 分配 | `life_stage_code` / `assignment_id` | ACTIVE → RETIRED | `life_stage_assignments` + enum；需拆定义 |
| B-06 | ConsentPolicy | 平台定义 + Consent 事实 | `policy_version` / `consent_id` | ACTIVE → EXPIRED | `consents`；policy registry 待补 |
| B-07 | NeedType | 平台目录 | `need_type_code` | DRAFT → ACTIVE → RETIRED | policy/代码，需目录化 |
| B-08 | AssessmentToolDefinition | 平台目录 | `tool_ref` + `version` | CANDIDATE → ADMITTED/HOLD → RETIRED |治理文档；L0/L1 优先 |
| B-09 | Capability | 平台目录 | `capability_code` | DRAFT → ACTIVE → RETIRED | 代码 registry，需统一 |
| B-10 | ResourceAsset | 平台目录 | `asset_ref` + `version` | DRAFT → ADMITTED → DEGRADED/EXPIRED | 资源资产目录；需统一 source |
| B-11 | EvidenceSource | 平台目录 | `evidence_ref` + `version` | UNVERIFIED → REVIEWED → RETIRED | `evidence_records` 是事实；目录待补 |
| B-12 | JourneyTemplate | 平台目录 | `journey_template_ref` + `version` | DRAFT → ADMITTED → RETIRED | 现有 journey 是实例；模板待补 |
| B-13 | ServiceOffering | 平台/租户目录 | `service_offering_ref` + `version` | DRAFT → ADMITTED → SUSPENDED/EXPIRED | interventions/registry；需统一 |
| B-14 | Provider | 平台/租户目录 | `provider_ref` + `version` | CANDIDATE → ADMITTED → SUSPENDED/EXPIRED | 0024 测试目录 |
| B-15 | ProviderQualification | Provider 从属 | `qualification_ref` + `version` | PENDING → ACTIVE → EXPIRED/REVOKED | 0024 字段内嵌；逻辑需分离 |
| B-16 | Activity | 平台/租户目录 | `activity_ref` + `version` | DRAFT → ADMITTED → CLOSED/EXPIRED | 0024 测试目录 |
| B-17 | AvailabilitySlot | Activity/Provider 从属 | `slot_ref` + `version` | OPEN → HELD → CLOSED | 尚未独立；预约前必须补 |
| B-18 | TaskTemplate | JourneyTemplate 从属 | `task_template_ref` + `version` | DRAFT → ACTIVE → RETIRED | 任务实例已有，模板待补 |
| B-19 | CommunitySpace | Tenant/Family 可见目录 | `space_ref` + `version` | DRAFT → ACTIVE → CLOSED | 尚未独立；社区外发继续 HOLD |
| B-20 | CommunityTemplate | CommunitySpace 从属 | `template_ref` + `version` | DRAFT → ADMITTED → RETIRED | 当前操作仅模板 fixture |
| B-21 | ProductOffering | 平台/租户目录 | `product_ref` + `version` | DRAFT → ADMITTED → SUSPENDED/EXPIRED | 0024 兼容目录 |
| B-22 | PricePlan | ProductOffering 从属 | `price_plan_ref` + `version` | DRAFT → ACTIVE → RETIRED | 当前只有 `price_ref` |
| B-23 | EntitlementPolicy | ProductOffering 从属 | `entitlement_policy_ref` + `version` | DRAFT → ACTIVE → RETIRED | 尚未独立；真实权益保持 Gate |

### 2.2 多租户主数据（T-01 至 T-05）

| ID | 对象 | 主键 | 关键关系 | 当前实现 |
|---|---|---|---|---|
| T-01 | Tenant | `tenant_id` | 1:N FamilyBinding、AccountMembership、Policy | **缺失** |
| T-02 | TenantAccountMembership | `tenant_membership_id` | Tenant ↔ Account | **缺失** |
| T-03 | TenantFamilyBinding | `tenant_family_binding_id` | Tenant ↔ Family；唯一 ACTIVE | **缺失** |
| T-04 | TenantPolicyProfile | `tenant_policy_profile_id` + version | Tenant → page/tool/retention/adapter policy | **缺失** |
| T-05 | TenantCatalogBinding | `tenant_catalog_binding_id` | Tenant ↔ platform catalog/version | **缺失** |

### 2.3 AI/多模态控制主数据（AI-01 至 AI-MM-03）

| ID | 对象 | 主键 | 关键边界 | 当前实现 |
|---|---|---|---|---|
| AI-01 | ModelProfile | `model_ref` + version | allowlist、能力、环境；不含 key | config/live catalog |
| AI-02 | PromptPolicy | `policy_ref` + version | 页面、禁词、状态上限、输入边界 | page policy/Gateway docs |
| AI-03 | ToolDefinition | `tool_ref` + version | Named Action、schema、side effect class | tool registry |
| AI-04 | EvalSuite | `eval_suite_ref` + version | 合成正负例、阈值、回放 | Eval docs/specs |
| AI-MM-01 | MultimodalCapabilityProfile | `capability_ref` + version | 模态、输入限制、模型和页面范围 | `FAMILY_MULTIMODAL_OBJECT_DICTIONARY_V1.md` |
| AI-MM-02 | MultimodalProcessingPolicy | `policy_ref` + version | 目的、Consent、保留期、Human Gate、状态上限 | `FAMILY_MULTIMODAL_OBJECT_DICTIONARY_V1.md` |
| AI-MM-03 | MultimodalOutputSchema | `schema_ref` + version | 输出字段、验证器、禁止写回目标 | `FAMILY_MULTIMODAL_OBJECT_DICTIONARY_V1.md` |

## 3. 关系约束

`Tenant → TenantFamilyBinding → Family → Person/Membership/Consent` 是所有家庭访问的可信链。`TenantAccountMembership` 必须先于 FamilyContext；Account 不是 Family owner。平台目录先由 `TenantCatalogBinding` 限定租户，再按 Family 的 Consent、角色、资源准入和版本生成投影。Provider 必须有有效 Qualification；Activity 必须有独立 Slot 才能产生 Booking 事实；ProductOffering 必须分别引用 PricePlan 与 EntitlementPolicy；CommunityPublication 只能从 CommunityTemplate 实例化，并默认保持家庭私有或沙箱状态。

家庭私有对象的最小范围是 `(tenant_id, family_id)`。Tenant 策略对象只需 `tenant_id`；平台全局 ModelProfile/PromptPolicy/ToolDefinition/EvalSuite 可以不带租户，但租户策略只能收紧平台安全边界。任何跨租户外键或查询必须 fail-closed。

## 4. 统一字段规范

| 类型 | 必须字段 |
|---|---|
| 平台/租户主数据 | `id`, `ref/code`, `version`, `status`, `source_ref`, `valid_from`, `valid_to`, `created_at`, `updated_at` |
| 目录对象 | 上述字段 + `evidence_level`, `risk_flags`, `qualification_ref`, `admission_status`, `copyright_status` |
| 家庭私有对象 | 上述字段 + `tenant_id`, `family_id`, `visibility`, `consent_ref`, `created_by`, `withdrawn_at` |
| 事实对象 | 上述字段 + `actor`, `named_action`, `correlation_id`, `idempotency_key`, `environment`, `external_effect` |
| AI 控制对象 | 上述字段 + `allowed_pages`, `allowed_tools`, `state_upper_bound`, `eval_ref`；绝不放 API key |

## 5. 物理落地顺序

### P0：多租户可信根

建立 `tenants`、`tenant_account_memberships`、`tenant_family_bindings`，补齐唯一 ACTIVE 约束和 trusted context。没有这一步，不能声称多租户隔离完成。

### P1：租户策略和目录绑定

建立 `tenant_policy_profiles`、`tenant_catalog_bindings`，把页面策略、LLM allowlist、工具上限、数据保留和目录准入接入上下文。租户策略不得扩大平台安全边界。

### P1：目录规范化

把 `family_admitted_catalog_items`、`family_service_provider_catalog`、`family_activity_catalog` 定义为 DEV/TEST projection/compatibility layer；后续分别落 ResourceAsset/ProductOffering/Provider/Qualification/Activity/Slot/CommunityTemplate/PricePlan/EntitlementPolicy 的逻辑契约。

### P2：双范围补齐

所有家庭事实、对象投影、LLM audit、outbox 和 page actions 增加 `tenant_id` 或通过强制 binding 证明 tenant scope；所有 repository 查询使用 `(tenant_id, family_id, object_id)`，不能只用 object_id 或 family_id。

## 6. 结构审查判定

当前 `families/persons/memberships/consents` 的家庭根结构合理；`growth` 和 `orchestration` 事实结构基本合理；0023/0024 适合作为 DEV/TEST 体验承载，但不能直接成为生产目录/商业化真相；多租户结构目前缺失，是 P0；Provider/Activity/Community/Commerce 的逻辑对象存在合并过度，是 P1；AI 控制面方向合理，但必须增加 TenantPolicyProfile 继承层。

因此，V2 设计基线固定为 **35 个逻辑主数据对象**，而不是 22 个；其中 MultimodalAsset、Consent、ProcessingRun、DerivedArtifact 和 AuditEvent 都是事实/投影，不计入主数据数量。当前实施状态为 `DESIGN_BASELINE_FOR_REVIEW`，不自动解除任何生产、支付、真实咨询、真实社区外发或跨家庭能力 HOLD。
