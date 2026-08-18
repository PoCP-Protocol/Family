# Family / 伐木累 34 页多模态 API / Context 映射 V1

## 1. 统一请求契约

前端只提交 `page_id`、受控 `multimodal_asset_ref`、用户明确选择的 `purpose`、幂等键和动作；服务端重新解析 `Tenant → Family → Consent → Policy → Capability → Schema`。前端不得提交模型、provider、API key、tenant/family scope、Retention 或输出写回目标。

```ts
interface MultimodalAssistRequest {
  page_id: string;
  asset_ref: string;
  purpose: 'PAGE_ACCESSIBILITY' | 'MATERIAL_STRUCTURE_ASSIST' | 'GUARDIAN_VOICE_TO_TEXT';
  idempotency_key: string;
}

interface MultimodalAssistResponse {
  status: 'DERIVED_DRAFT_PRIVATE' | 'BLOCKED' | 'UNAVAILABLE';
  text_equivalent: string;
  artifact_ref?: string;
  block_code?: string;
}
```

## 2. 页面分区

| 页面 | 可用入口 | 输入对象 | 输出上限 | 当前阶段 |
|---|---|---|---|---|
| UI-01–UI-02 首页/入口 | 无障碍文本、页面截图验证 | `MultimodalAsset`（截图仅验收） | 文本等价/匹配报告 | DEV 可用 |
| UI-03–UI-05 Need/Intent | 监护人语音转文本、材料结构化辅助 | 家庭 `MultimodalAsset` + `MultimodalConsent` | 草稿；需文本确认 | DEV/TEST 受控 |
| UI-06–UI-08 报告/计划 | 报告文档结构化辅助 | 已准入材料/家庭上传文件 | `DERIVED_DRAFT_PRIVATE` | 需独立页面 Gate |
| UI-09–UI-12 旅程/任务 | 文本等价、截图验证 | 页面截图/任务素材 | 可读性/导航结果 | DEV 可用 |
| UI-13–UI-18 商城/资产 | 商品图/材料的格式辅助 | 已准入 `ResourceAsset` 或商品目录资产 | 格式/来源/可见性提示 | 不产生成交事实 |
| UI-19–UI-24 名师/沙龙 | 名片/活动资料结构化辅助 | 已准入 Provider/Activity 资料 | 只读字段草稿 | 不做资质推断、不创建预约 |
| UI-25–UI-28 社区 | 模板可读性、家庭预览 | `CommunityTemplate` + 家庭草稿 | 私有预览 | 不公开、不自动发布 |
| UI-29–UI-34 后台/档案 | 文档索引和无障碍 | 家庭已授权材料 | 私有派生草稿 | 不生成画像/效果结论 |

## 3. DTO 与状态映射

| DTO/对象 | 必要范围 | 可写字段 | 禁止字段 |
|---|---|---|---|
| `MultimodalAssetCreate` | Tenant + Family + Consent | media_type、hash、purpose、metadata | raw public URL、child label、model、key |
| `MultimodalAssistRequest` | 服务端派生 | page_id、purpose、idempotency_key | tenant_id、family_id、model、write_back_target |
| `MultimodalDerivedArtifact` | Tenant + Family | artifact_kind、payload_hash、expires_at、visibility | Need/Intent/Decision/Plan/Case/Outcome |
| `MultimodalProcessingRun` | Tenant + Family | capability_ref、policy_ref、schema_ref、decision | prompt、provider raw output、key |
| `MultimodalAuditEvent` | Tenant + Family/Request | hashes、decision、block_code | raw asset、raw prompt、raw provider response |

## 4. LLM Context

模型只接收最小结构化 Context：当前页面、租户策略摘要、处理能力摘要、输出 Schema、Consent 状态、已准入素材摘要和家庭明确输入。模型不接收原始租户成员表、Account token、API key、跨家庭内容、未准入资源、儿童生物特征或其他家庭材料。

多模态输出只能先进入 `MultimodalDerivedArtifact(status=DERIVED_DRAFT_PRIVATE)`。如果家庭要形成 Need/Intent，必须通过文本等价页面确认并使用既有 Named Action；LLM 不拥有事实写权。

## 5. TenantPolicyProfile 的收紧规则

租户可关闭语音、图片、文档或某个页面；可缩短保留期、降低文件大小/时长、要求人工复核或禁止派生草稿展示。租户不可启用平台未授权模态、放宽儿童直接作答/生物特征/危机分析、取消 Consent、扩大跨家庭范围或允许模型直接写核心事实。

## 6. Fail-closed

以下任何情形都返回 `BLOCKED` 或 `UNAVAILABLE`，同时保留纯文本路径：TenantMembership 缺失、FamilyBinding 不唯一、Consent 缺失/撤回、目的不匹配、能力/策略/Schema 版本缺失、TenantPolicy 禁止、格式/大小超限、跨租户 asset_ref、验证失败、模型未配置、输出包含禁词或禁止字段、要求诊断/危机/儿童直接作答/生物识别/真人外发。

## 7. 验收

每个允许入口都必须验证：真实数据库中的 Tenant/Family scope、Consent 撤回、幂等、对象生命周期、最小审计、无原文回放、文本等价、模型未配置阻断、输出 Schema 阻断、跨租户阻断和 UI 不展示内部术语。浏览器只验证用户可见交互与原图基线，不把截图/视觉匹配结果写入家庭成长事实。
