# Family / 伐木累多模态数据模型审查 V1

## 1. 结论

Family 必须考虑多模态，但不应把所有图片、语音、视频和截图塞进一张“多模态主数据表”。多模态涉及的是一组不同层次的对象：

| 层次 | 对象 | 是否主数据 |
|---|---|---|
| 能力定义 | `MultimodalCapabilityProfile` | 是，AI 控制主数据 |
| 处理规则 | `MultimodalProcessingPolicy` | 是，AI 控制主数据 |
| 输出结构 | `MultimodalOutputSchema` | 是，AI 控制主数据 |
| 家庭输入 | `MultimodalAsset` | 否，家庭输入资产事实 |
| Consent | `MultimodalConsent` | 否，授权事实；遵循 `ConsentPolicy` |
| 派生结果 | `MultimodalDerivedArtifact` | 否，派生事实/临时投影 |
| 处理记录 | `MultimodalProcessingRun` | 否，运行事实 |
| 审计 | `MultimodalAuditEvent` | 否，治理事实 |

因此，原来的 32 个逻辑主数据对象应扩展为 **35 个**：23 个业务主数据、5 个多租户主数据、7 个 AI/多模态控制主数据。多模态输入和输出本身不计入主数据数量。

## 2. 新增 3 个 AI/多模态控制主数据对象

| ID | 对象 | 作用 | 关键字段 |
|---|---|---|---|
| AI-MM-01 | `MultimodalCapabilityProfile` | 登记 OCR、ASR、图像理解、视频抽帧、文档解析等能力及适用模型/环境 | `capability_ref`, `modality`, `model_ref`, `input_limits`, `supported_pages`, `status`, `version` |
| AI-MM-02 | `MultimodalProcessingPolicy` | 规定输入目的、Consent、保留期、风险路由、人工复核、是否允许派生结果 | `policy_ref`, `purpose`, `allowed_modalities`, `consent_purpose`, `retention_ref`, `human_gate`, `state_upper_bound`, `tenant_override` |
| AI-MM-03 | `MultimodalOutputSchema` | 规定 OCR/ASR/结构化摘要/页面验证等输出结构及禁止写回字段 | `schema_ref`, `version`, `allowed_fields`, `forbidden_fields`, `visibility`, `write_back_target`, `validator_ref` |

这三个对象属于 AI 控制面，不属于家庭资料，也不能由模型或客户端修改。`TenantPolicyProfile` 可以关闭或收紧它们，但不能扩大平台允许的模态、保存期、输出字段或工具范围。

## 3. 34 页和六条闭环的多模态入口

| 入口 | 适用页面/闭环 | 输入 | 允许输出 | 当前状态 |
|---|---|---|---|---|
| 页面截图/原图验证 | 全部 UI、浏览器验收 | 原图资产、浏览器截图 | 视觉匹配、热点/文本可读性报告 | DEV 可用；不写家庭事实 |
| 家庭材料理解 | UI-03–UI-08，核心服务闭环 | Family 明确上传的文本/图片/文档 | 结构化候选摘要或“无法处理” | 需独立 Consent/Runtime Gate |
| 语音输入辅助 | UI-03–UI-05 | 监护人语音 | 文本等价草稿，待家庭确认 | 需独立 Consent；文本路径必须完整 |
| 图片/截图输入辅助 | UI-03–UI-05、UI-29–UI-34 | 家庭上传截图/材料 | 字段提取草稿、来源提示 | 不得直接写 Need/Intent/Report |
| 视频/音频材料 | 学习/互动候选，非首批纵切 | 家庭上传媒体 | 仅结构化观察候选 | 默认 HOLD；不得观察儿童并产生成长结论 |
| OCR/ASR/文档解析 | 材料理解与无障碍 | 合成/授权文件 | 可验证文本等价 | 受 Policy/Schema/Gateway 约束 |
| 多模态 LLM 合成 | 受控解释/页面辅助 | 最小 Context + 已准入资产 | 解释草稿、停止理由、文本等价 | DEV/TEST 可接真实模型；不写核心事实 |

## 4. 多租户和家庭边界

`MultimodalAsset` 必须同时具备 `tenant_id`、`family_id`、`asset_id`、`source`、`content_hash`、`media_type`、`size_bytes`、`created_by`、`consent_ref`、`purpose`、`retention_until`、`visibility` 和 `deletion_status`。文件本体如果进入对象存储，必须使用租户/家庭分区前缀，不能使用可猜测的公开 URL。

处理请求的上下文解析必须是：

```text
TenantMembership
  -> TenantFamilyBinding
  -> FamilyMembership
  -> MultimodalConsent(purpose)
  -> MultimodalProcessingPolicy
  -> ModelProfile/CapabilityProfile
  -> OutputSchema + Validator
```

平台目录素材可以是全局 `ResourceAsset`，但家庭上传材料一定是家庭输入事实，不能混入平台目录，也不能跨租户复用。租户策略只能关闭某种模态、缩短保留期、提高 Human Gate，不得放宽平台禁用项。

## 5. 状态上限和禁止写回

多模态处理的默认状态上限为 `DERIVED_DRAFT_PRIVATE`。允许的输出包括文本转写草稿、页面可读性说明、候选字段提取、来源/格式提示和安全停止理由。以下对象禁止由多模态输出直接写入：

`Need`、`Intent`、`Decision`、`Plan`、`Case`、`GrowthProfile`、`Outcome`、永久标签、家庭评分、儿童能力结论、风险等级、诊断结论、公开画像、跨家庭统计和社区公开内容。

如果家庭要把草稿变成 Need/Intent，必须走文本等价确认页面和既有 Named Action；如果要进入专业筛查、危机、安全、儿童直接作答或真人服务，必须停止并进入独立 Gate。

## 6. 安全与生命周期

| 阶段 | 允许状态 | 失败关闭 |
|---|---|---|
| 上传前 | 说明目的、格式、大小、保留期和撤回 | 无 Consent/目的不明确：不接收 |
| 接收后 | `RECEIVED`、hash、租户/家庭范围 | 文件类型、大小、病毒/解析不合格：隔离删除 |
| 处理中 | `PROCESSING`，无核心事实写入 | 模型/策略/Schema/租户上下文缺失：停止 |
| 派生后 | `DERIVED_DRAFT_PRIVATE` | 验证失败：只返回无法处理，不显示猜测 |
| 家庭确认 | 仅通过文本等价/Named Action 写家庭事实 | 未确认：不写 Need/Intent/Decision |
| 撤回/删除 | `WITHDRAWN`/`DELETED`，审计保留最小摘要 | 禁止继续 Context Reuse、训练、营销或跨租户复用 |

## 7. 首批可实现范围

DEV/TEST 第一批只实现三种真实能力：页面截图/原图验证、合成材料的 OCR/结构化辅助、监护人语音到文本的可选辅助；每种都有文本等价路径和固定测试 fixture。视频理解、儿童行为观察、情绪/心理推断、生物特征、面部识别、声音识别、自动测评报告和跨家庭多模态推荐继续 HOLD。

## 8. 需要补充的事实/运行对象

后续物理实现需要补齐但不增加主数据数量的对象包括：`multimodal_assets`、`multimodal_consents`、`multimodal_processing_runs`、`multimodal_derived_artifacts`、`multimodal_audit_events`。它们必须全部带 Tenant/Family scope 或可验证绑定，保留 hash/元数据/判定摘要，不保存真实 key、provider 原文或不必要的原始敏感材料。

## 9. 复审判断

多模态不是 UI 装饰，也不是“上传后让模型自由判断”的旁路能力。它是由**能力主数据 + 处理策略主数据 + 输出 Schema 主数据 + 家庭输入事实 + Consent + 验证器 + 审计**组成的受控控制面。将其纳入 35 个逻辑主数据对象后，Family 才能同时做到真实多模态能力、前后端一致、租户隔离和数据最小化。
