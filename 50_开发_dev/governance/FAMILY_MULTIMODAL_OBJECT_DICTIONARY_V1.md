# Family / 伐木累多模态对象字典 V1

## 1. 对象分层

| 层级 | 对象 | 是否主数据 | 所有权 |
|---|---|---|---|
| 能力目录 | `MultimodalCapabilityProfile` | 是 | 平台；Tenant 只能收紧 |
| 处理策略 | `MultimodalProcessingPolicy` | 是 | 平台/租户策略继承 |
| 输出契约 | `MultimodalOutputSchema` | 是 | 平台；页面策略只能收紧 |
| 输入资产 | `MultimodalAsset` | 否，事实 | Tenant + Family |
| 目的授权 | `MultimodalConsent` | 否，事实 | Family |
| 处理运行 | `MultimodalProcessingRun` | 否，事实 | Tenant + Family |
| 派生草稿 | `MultimodalDerivedArtifact` | 否，事实/临时投影 | Tenant + Family |
| 审计事件 | `MultimodalAuditEvent` | 否，治理事实 | Tenant + Family/Request |

## 2. 主数据对象

### 2.1 MultimodalCapabilityProfile

它描述系统能够做什么，而不是某个家庭上传了什么。建议字段包括 `capability_ref`、`version`、`modality`、`input_media_types`、`max_size_bytes`、`max_duration_ms`、`supported_pages`、`model_ref`、`environment_allowlist`、`status`、`risk_class` 和 `validator_ref`。它不能包含密钥，不能引用真实家庭数据，也不能由模型动态增加能力。

### 2.2 MultimodalProcessingPolicy

它描述什么时候可以处理、为什么处理、处理多久和何时必须停下。建议字段包括 `policy_ref`、`version`、`purpose`、`allowed_modalities`、`required_consent_purpose`、`retention_ref`、`human_gate_required`、`allowed_state_upper_bound`、`external_effect`、`tenant_override_mode` 和 `status`。租户策略只允许 `DISABLE`、收紧大小/时长/保留期或提高人工门槛。

### 2.3 MultimodalOutputSchema

它描述输出格式，不代表输出一定正确。建议字段包括 `schema_ref`、`version`、`allowed_fields`、`forbidden_fields`、`visibility`、`validator_ref`、`write_back_target` 和 `text_equivalent_required`。首批 `write_back_target` 只能是 `DERIVED_ARTIFACT`，禁止直接指向 Need、Intent、Decision、Plan、Case、Outcome、GrowthProfile 或公开社区。

## 3. 家庭事实对象

### 3.1 MultimodalAsset

主键为 `asset_id`，必须带 `tenant_id`、`family_id`、`created_by_account_id`、`source_kind`、`media_type`、`content_hash`、`size_bytes`、`storage_ref`、`purpose`、`consent_id`、`visibility`、`retention_until`、`status` 和时间字段。`storage_ref` 只允许服务端对象存储引用，不得是外部公开链接；原始内容不进入 LLM audit 或普通业务日志。

### 3.2 MultimodalConsent

它是用途授权事实，至少带 `tenant_id`、`family_id`、`consent_id`、`purpose`、`scope`、`granted_by`、`version`、`status`、`granted_at`、`withdrawn_at` 和 `expires_at`。`ConsentPolicy` 定义允许的目的，`MultimodalConsent` 记录家庭是否对本次目的授权。撤回后停止处理和 Context Reuse，不把撤回改写成“同意过的永久许可”。

### 3.3 MultimodalProcessingRun

它记录一次处理请求，主键为 `processing_run_id`，关联 `asset_id`、`tenant_id`、`family_id`、`capability_ref`、`policy_ref`、`model_ref`、`schema_ref`、`request_hash`、`status`、`failure_code`、`started_at`、`completed_at` 和 `external_effect='NONE'`。不保存 provider 原文、真实 prompt、认证 header 或 API key。

### 3.4 MultimodalDerivedArtifact

它是验证前的派生草稿，关联 `processing_run_id`、`asset_id`、`tenant_id`、`family_id`、`artifact_kind`、`artifact_schema_ref`、`payload_hash`、`visibility`、`state_upper_bound='DERIVED_DRAFT_PRIVATE'`、`human_review_status`、`withdrawn_at` 和 `expires_at`。允许家庭查看、编辑并通过文本等价路径重新确认；不能自动升级为业务事实。

### 3.5 MultimodalAuditEvent

它记录最小治理元数据，包括 `tenant_id`、`family_id`、`processing_run_id`、`policy_version`、`capability_ref`、`schema_ref`、`decision`、`block_reason`、`state_upper_bound`、`correlation_id`、`input_hash` 和时间字段。不得记录原始媒体、原始 prompt、模型原文或真实 key。

## 4. 关系与约束

```text
Tenant
  └── TenantPolicyProfile
        └── MultimodalProcessingPolicy
              ├── MultimodalCapabilityProfile
              └── MultimodalOutputSchema

Tenant + Family
  └── MultimodalConsent
        └── MultimodalAsset
              └── MultimodalProcessingRun
                    └── MultimodalDerivedArtifact
                          └── MultimodalAuditEvent
```

同一 `asset_id` 只能在一个活动 Tenant/Family 范围内被处理。`processing_run` 的 Tenant/Family 必须与 Asset 一致；DerivedArtifact 必须与 ProcessingRun 一致；租户策略关闭或 Consent 撤回时，任何新处理都拒绝。客户端提供的 asset/ref、tenant/family 参数必须由服务端重新解析，不能直接信任。

## 5. 与既有主数据的关系

`ResourceAsset` 是平台目录素材；`MultimodalAsset` 是家庭提交的输入，二者不能混表。`EvidenceSource` 说明来源和证据等级；多模态处理不能把“解析成功”变成教育效果证据。`ModelProfile` 说明模型能力和 allowlist；`MultimodalCapabilityProfile` 说明具体模态处理能力；`PromptPolicy` 约束语言生成；`MultimodalProcessingPolicy` 约束输入用途、保留期和人工门槛；`TenantPolicyProfile` 只能关闭或收紧上述能力。

## 6. 禁止关系

禁止 `MultimodalDerivedArtifact` 直接外键写入 `Outcome`、`GrowthProfile`、永久标签或公开画像；禁止 `MultimodalProcessingRun` 自动触发支付、预约、外发、社区公开、真人转介或跨家庭推荐；禁止把儿童影像、声纹、面部特征、情绪判断或危机推断作为普通 L0/L1 输入；禁止用多模态结果绕过 Named Action、Consent、Human Gate 或 Model Gateway。
