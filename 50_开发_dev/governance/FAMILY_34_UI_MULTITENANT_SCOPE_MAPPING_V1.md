# Family / 伐木累 34 页多租户范围映射 V1

## 1. 统一可信上下文

所有 34 页请求的服务端上下文必须按以下顺序解析：

```text
Bearer Account
  -> ACTIVE TenantAccountMembership
  -> ACTIVE TenantFamilyBinding
  -> ACTIVE Family
  -> ACTIVE FamilyMembership + role
  -> Consent
  -> page policy + Named Action
```

客户端只提交页面动作、对象引用、幂等键和必要的受控参数。客户端不得提交或覆盖 `tenant_id`、`family_id`、`account_id`、`actor_id`、`subject_person_id`、模型名、API key、价格、资格、外部 URL 或 provider 原文。

## 2. API/DTO 通用字段

### 2.1 服务端派生 Context

```ts
interface TrustedTenantFamilyContext {
  account_id: string;
  tenant_id: string;
  family_id: string;
  actor_person_id: string;
  actor_role: 'OWNER_GUARDIAN' | 'GUARDIAN' | 'ADULT_MEMBER' | 'CHILD_SUBJECT';
  tenant_policy_version: string;
  consent_summary: ReadonlyArray<{ purpose: string; status: 'GRANTED' | 'WITHDRAWN' | 'EXPIRED' }>;
}
```

该类型只在服务端存在；前端和 LLM 不得伪造。所有家庭私有返回 DTO 必须包含 `tenant_id` 的服务端投影标识或内部 scope proof，但不把租户内部配置、成员清单和权限细节展示到 UI。

### 2.2 事实动作

```ts
interface TenantScopedActionRequest {
  page_id: string;
  action: string;
  object_ref: string;
  idempotency_key: string;
  // tenant_id / family_id / actor_id 均不由客户端提供
}
```

服务端写入必须同时记录 `tenant_id`、`family_id`、`actor_person_id`、`named_action`、`correlation_id`、`environment`、`external_effect` 和 `policy_version`。

## 3. 34 页分区映射

| UI | Tenant 级校验 | Family 级校验 | 读/写 API | Named Action |
|---|---|---|---|---|
| UI-01–UI-02 首页 | Tenant ACTIVE、策略允许首页 | Family ACTIVE、Membership 唯一 | Home Projection | `ReadFamily` |
| UI-03–UI-05 需要/报告/计划 | Tenant Policy 允许 L0/L1/LLM | SERVICE Consent、Need/Intent/Decision family scope | Need/Intent/Plan API | `RequestGrowthHelp` / `ConfirmGrowthIntent` / `DecideGrowthService` |
| UI-06–UI-12 旅程/任务/成果 | Tenant 保留策略与页面允许 | Task/Report/ServiceRecord 归属 Family | Page Object Projection/Action | `ExecuteFamilyPageObjectAction` |
| UI-13–UI-18 商城/资产 | TenantCatalogBinding active、ProductOffering 版本准入 | Commerce operation/asset 归属 Family | Catalog + Experience + Asset API | `ReadFamily` / `ExecuteTestExperienceAction` |
| UI-19–UI-24 名师/沙龙 | TenantProvider/Activity binding、Qualification active | Booking/Registration/ServiceRecord 归属 Family | Provider/Activity/Experience API | `ReadFamily` / `ExecuteTestExperienceAction` |
| UI-25–UI-28 社区 | Tenant CommunityPolicy 允许、Space binding active | Template/Publication 私有 Family scope | Community projection/experience API | `ReadFamily` / `ExecuteTestExperienceAction` |
| UI-29–UI-34 后台 | Tenant 允许报告、服务和资产模块 | Profile/Report/Task/ServiceRecord/Asset 家庭私有 | Page Object + Asset Projection | `ReadFamily` / `ExecuteFamilyPageObjectAction` |

## 4. 查询约束

所有家庭对象查询必须满足下列逻辑：

```sql
... where tenant_id = $trusted_tenant_id
      and family_id = $trusted_family_id
      and object_id = $validated_object_id
```

如果现有表暂时只有 `family_id`，服务层必须先通过唯一有效 `TenantFamilyBinding` 证明该 Family 属于当前 Tenant；生产化前应把 `tenant_id` 直接写入家庭事实表或使用可验证的复合外键。不得以客户端的 `family_id` 作为租户隔离证据。

平台目录查询必须按以下顺序：

```text
platform catalog object
  -> current version / admission / evidence / qualification
  -> TenantCatalogBinding
  -> TenantPolicyProfile
  -> Family Consent / role / page policy
  -> admitted candidate projection
```

## 5. LLM Context 约束

Context Assembler 为每次调用生成最小只读快照：

| 字段 | 来源 | 能否进入模型 |
|---|---|---|
| `tenant_policy_version` | TenantPolicyProfile | 可以，以策略摘要形式 |
| `allowed_pages/tools` | 租户策略 + 页面策略 | 可以 |
| `tenant_id` | trusted context | 仅作为不可推断的 scope ref；不展示给用户 |
| `family_id` | trusted context | 仅内部审计，不放入自然语言 |
| `Need/Intent/Decision` | 当前 Family | 仅在 Consent 有效时，按最小摘要提供 |
| 其他 Tenant 家庭、Account token、API key | 禁止 | 永远不能进入模型 |

平台全局 ModelProfile/PromptPolicy/ToolDefinition 不能被 TenantPolicyProfile 放宽。租户策略允许关闭模型、页面或工具，且关闭后 Gateway 返回固定安全停止；不得旁路 provider。

## 6. 多租户验收负例与页面覆盖

| 负例 | 覆盖页面 | 预期 |
|---|---|---|
| 无 ACTIVE TenantAccountMembership | 全部 | `403`，不解析 Family、不调用 LLM |
| Family 不属于当前 Tenant | 全部家庭私有页 | `403`，零读取/写入 |
| 同一 Family 存在两个 ACTIVE TenantFamilyBinding | 全部 | `409` 或 fail-closed，不任意选择 |
| TenantPolicy 关闭某页 | 对应页面 | 页面不可进入或安全停止 |
| TenantCatalogBinding 过期 | UI-13–UI-24 | 候选不显示，不用缓存 |
| Tenant 禁止工具但平台允许 | LLM 页面 | Gateway 阻断工具 proposal |
| 只带 Tenant 不带唯一 Family | UI-01–UI-12、UI-29–UI-34 | 只能读租户目录，不能读家庭私有对象 |
| 跨租户 object_ref | 全部写页 | `403`，零状态变更 |
| tenant_id 缺失的审计记录 | 全部动作 | 进入开发错误/补偿队列，不得宣称 production-ready |

## 7. 多租户前后端一致性状态

当前 34 页 UI 的 Family scope 已有基础，但 Tenant scope 属于 `BACKEND_GAP_P0`。在 Tenant 五对象、trusted context、双范围查询和负例测试完成前，任何页面不得标记为“多租户前后端一致”；只能标记为 `FAMILY_SCOPE_MATCHED / TENANT_SCOPE_PENDING`。
