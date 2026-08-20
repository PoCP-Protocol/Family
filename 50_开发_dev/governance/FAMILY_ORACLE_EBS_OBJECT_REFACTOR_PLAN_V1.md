# Family / 伐木累 Oracle EBS 风格对象重构实施方案 V1

## 1. 重构原则

本方案不一次性机械重命名现有 68 张表，也不破坏已有历史迁移。采用新增兼容列、复合约束、正式基表/投影标识和 DTO 分层的方式逐步收敛。所有改造先在 DEV/TEST 验证，保留既有 source_file、asset_id、历史 migration 和 Git 追溯。

## 2. Tenant / Family 基础对象

### 2.1 正式基表

`tenants`、`tenant_account_memberships`、`tenant_family_bindings`、`tenant_policy_profiles`、`tenant_catalog_bindings` 是多租户 Base 对象。它们需要统一 `tenant_ref`/业务 ref、`version_no`、`effective_from/to`、`source_system` 和 WHO 审计列。

### 2.2 Family 双范围

`families` 作为家庭私有权属根，增加或派生稳定 `family_ref`，并通过 `tenant_family_bindings` 证明当前 Tenant。所有家庭事实表按同一规则补齐 `tenant_id`。迁移顺序是先回填已有 Family 的 Tenant，再增加 NOT NULL 和复合外键；无法安全回填的历史行必须进入 quarantine/report，不能默默归入默认 Tenant。

### 2.3 Account 与范围

Account 仍是访问主体。客户端不得提交可信 `tenant_id`/`family_id` 作为授权依据；服务端从 ACTIVE Account→Tenant membership→TenantFamily binding→Family membership 派生范围。API DTO 可以带只读 scope 摘要，但 command DTO 不接受 scope 覆盖字段。

## 3. 目录与供给对象

### 3.1 正式 Base 对象

将以下逻辑对象作为正式目录基线：`resource_assets`、`evidence_sources`、`admission_profiles`、`providers`、`provider_qualifications`、`service_offerings`、`activities`、`availability_slots`、`product_offerings`、`price_plans`、`entitlement_policies`、`community_spaces`、`community_templates`。

每个对象都使用 `object_ref + version_no + status + effective_from/to`，并记录 evidence/provenance、资格、版权/授权、风险和租户可见性。产品页面、名师页面、沙龙页面和社区页面读取 projection，不把家庭目录 projection 误认为最终 Base 对象。

### 3.2 组合唯一性

至少建立下列组合规则：

| 组合 | 唯一性/状态规则 |
|---|---|
| Tenant + CatalogBinding + ObjectRef + Version | 同租户同版本只能有一个 ACTIVE 绑定 |
| Provider + Qualification + Version | 同资质类型同版本不能重复 ACTIVE |
| ServiceOffering + Provider + Version | 一个供给版本只有一个有效提供方关系 |
| Activity + AvailabilitySlot | 同活动时间段不能重叠占用 |
| ProductOffering + PricePlan + EffectiveFrom | 同商品生效时点只允许一个有效价格计划 |
| CommunitySpace + CommunityTemplate + Version | 模板发布必须经过状态流转 |

## 4. 交易事实

商城邀请/拼团、预约、活动报名、社区发布、服务记录和客户资产都是交易/事实对象，不是主数据。它们必须包含 `fact_ref`、`idempotency_key`、`occurred_at`、`status`、`source_system`、`correlation_id` 和 scope。

交易写入流程统一为：

```text
Command DTO
  → Trusted Tenant/Family Context
  → Reference/Eligibility/Consent/Admission validation
  → Idempotency check
  → Named Action state transition
  → Base fact write
  → Audit append
  → Read-model projection
```

页面点击不能直接写 projection；取消、暂停、NO_ACTION 和失败关闭必须产生明确回执而不产生隐性 Plan/Case/Task/Reminder。

## 5. 多模态对象

多模态控制主数据是 `MultimodalCapabilityProfile`、`MultimodalProcessingPolicy`、`MultimodalOutputSchema`；输入和处理链是事实对象：`multimodal_assets`、`multimodal_consents`、`multimodal_processing_runs`、`multimodal_derived_artifacts`、`multimodal_audit_events`。

控制面对象使用版本/生效期/租户可见性；事实对象使用 `tenant_id + family_id + purpose + retention_seconds + status`。原始媒体只在受控资产存储引用中存在；数据库和 LLM 审计只保留 hash、引用、决策摘要和 schema/policy version。任何派生结果的最高写入上限仍是私有草稿，不能写入核心成长事实、诊断、标签或公开内容。

## 6. AI 控制面

`ModelProfile`、`PromptPolicy`、`ToolDefinition`、`EvalSuite` 和多模态三个控制对象统一遵守：

| 字段组 | 要求 |
|---|---|
| 运行范围 | DEV/TEST/PROD 明确分离；模型 allowlist |
| 版本 | policy/schema/model/tool version 必填 |
| 状态 | DRAFT/ACTIVE/RETIRED 分离；ACTIVE 唯一 |
| 租户 | TenantPolicy 可收紧平台默认策略，不得放宽硬红线 |
| 输入 | 最小 Context；禁止自由文本/真实家庭数据路径越权 |
| 输出 | JSON Schema、禁词、枚举、状态上限、工具白名单 |
| 审计 | model/policy/fixture/action/decision 摘要；禁止 key/prompt/provider 原文 |

## 7. API/DTO 物理契约

### Command DTO

只接收页面动作所需的业务 ref、固定枚举、幂等键和用户明确选择。禁止接收 `tenant_id`、`family_id` 覆盖值、金额、provider、模型、密钥、自由 SQL、原始媒体内容和任意外部 URL。

### Read Model DTO

允许包含 `tenant_ref`/`family_ref` 的脱敏只读摘要、来源 ref、版本、状态、as_of、可用动作和文本等价。不可作为 command body 回传。

### LLM Context DTO

只能由服务端从 Scope、Projection 和 admitted/approved objects 组装，包含 policy/schema/version 与 allowed state upper bound。Context 不提供 Base table 的写权限。

## 8. 迁移批次建议

| 批次 | 内容 | 约束 |
|---|---|---|
| R1 | Tenant/Family 双范围兼容列与回填报告 | 先回填，后 NOT NULL/复合外键 |
| R2 | 统一 WHO、业务 ref、version/effective 列 | 主数据先行，交易事实随后 |
| R3 | 正式目录 Base 表与 projection 标识 | 不删除旧 projection，先双读校验 |
| R4 | Reference Code Set/Value/Validation | 先覆盖状态/用途/风险/模态 |
| R5 | Interface staging、视图、command/read DTO | 外部适配器必须先 staging |
| R6 | 多语言/扩展属性和并发控制 | 只允许版本化 schema 扩展 |

## 9. 退出条件

本方案的 DEV_READY_FOR_TEST 条件是：Tenant/Family 双范围负例通过；Base/Interface/Projection/Audit 分类完整；核心主数据具备业务键、状态、版本、生效期和审计；交易对象幂等和 Named Action 通过；LLM/多模态无原文、无 key、无越权写回；34 页矩阵的 API/DTO/对象来源列齐全。

PROD 仍需另行审核，不能由 DEV/TEST 证据自动解锁。
