# Family 字节式产品数据分层与对象边界 V1

## 1. 结论

Family 现有数据库已经具备一部分事件与事实基础，但对象层级分散在 Growth、Principal/Product、Orchestration、Commerce、Multimodal 和 LLM Gateway 多个迁移中。下一步不应再新建一套“推荐数据库”，而应在现有模块化单体上形成统一数据分层：稳定供给主数据、家庭私有事实、产品事件、实时读模型、AI/多模态上下文和治理审计。

## 2. 现有事实基线

| 分层 | 已有结构 | 角色判断 |
|---|---|---|
| 平台审计/事件 | `audit_logs`、`outbox_events`、`product_events` | 受控审计或产品事件；不是成长结果 |
| Growth canonical | `growth_profiles`、`growth_journeys`、`growth_actions`、`growth_events`、`outcomes`、`outcome_observations` | 家庭成长事实/过程对象；Observation 明确不等于事实或因果效果 |
| 编排事实 | `growth_onboardings`、`growth_priorities`、`intervention_episodes`、任务/回访对象 | 家庭支持编排事实和服务过程 |
| 体验工作流 | 0022 的 commerce/booking/registration/publication 操作 | DEV/TEST 交易事实；必须有幂等、取消、scope |
| 页面投影 | `family_support_report_snapshots`、`family_page_task_items`、`family_customer_asset_projection` 等 | 页面 Read Model/Projection，不是事实根 |
| AI 审计 | `family_llm_gateway_audits`、`multimodal_audit_events` | append-only 治理审计；禁止原文、真实 prompt、provider 原文和 key |
| 多租户 | `tenants`、`tenant_account_memberships`、`tenant_family_bindings`、policy/catalog binding | Tenant→Family 访问范围与目录策略 |

## 3. 统一分层

### L0：Reference / Code Sets

状态码、用途、模态、风险路由、证据等级、对象层、可见性和生命周期状态进入参考值集。值集不是业务事实，不能由页面自由创建。

### L1：Supply Master Data

供给主数据描述平台有什么：资源、服务、活动、供给者、资格、证据来源、产品、价格、权益策略、社区空间/模板、NeedType、Capability、ModelProfile、ToolDefinition、PromptPolicy、MultimodalCapabilityProfile、ProcessingPolicy 和 OutputSchema。每个对象必须有代理主键、业务 ref、版本、生效/失效时间、来源、准入、租户可见性和审计列。

### L2：Family-owned Canonical Facts

家庭私有事实描述“这个租户内这个家庭发生了什么”：Need、Intent、Decision、NO_ACTION、Plan、Case、TaskInstance、ServiceRecord、Consent、Booking、Registration、CommerceOperation、Publication、多模态 Asset/Consent/ProcessingRun。核心写入必须来自 Named Action，所有查询必须由可信上下文派生 `tenant_id + family_id`。

### L3：Product Interaction Events

产品事件是 append-only 事实，用于解释产品运行和刷新投影：`page_view`、`candidate_opened`、`explanation_requested`、`decision_submitted`、`no_action_selected`、`task_completed`、`booking_cancelled`、`asset_revoked` 等。事件字段统一为：`event_id`、`tenant_id`、可用时 `family_id`、`actor_id`、`event_type`、`object_type`、`object_id`、`occurred_at`、`source_page_id`、`purpose`、`consent_ref`、`correlation_id`、`schema_version`。事件不直接改写主数据，不生成儿童标签，不用于跨家庭排名。

现有 `product_events` 可作为产品事件兼容基表；`outbox_events` 负责受控事务外发/投影触发；`growth_events` 仍保持 Growth domain 语义，不与产品事件混名。需要新增统一事件 envelope 或兼容视图，而不是直接合并语义不同的表。

### L4：Read Models / Projections

投影由 Base Facts + Product Events 计算，供 34 页 UI、客户后台和受控 LLM Context 使用：Family Home、Growth Journey、Admitted Catalog、Task Board、Service Timeline、Customer Assets、Report Snapshot、Multimodal Derived Draft。每个投影必须携带 `as_of`、`source_refs`、`policy_version`、`expires_at`、`visibility` 和 `projection_version`，不能反向成为事实。

### L5：AI Context / Serving

LLM Gateway 读取最小 Context Snapshot。Context 包含租户策略、家庭范围、页面 use case、已准入候选摘要、当前用户明确表达的 Need/Intent、必要的服务状态和文本等价约束。它不包含原始媒体、自由对话全文、跨家庭统计、永久标签或未授权行为向量。模型输出只生成经 Schema 验证的解释草稿、停止理由或下一步说明。

## 4. 反馈循环

```text
Supply Master
    ↓ admitted/version/effective
Family Need/Intent/Decision/NO_ACTION
    ↓ Named Action transaction
Canonical Fact + Product Event
    ↓ projection builder / read query
Page Read Model + bounded LLM Context
    ↓ family explicit decision
New Named Action + audit + projection refresh
```

反馈循环是“家庭明确决定驱动的服务编排循环”，不是自动学习循环。DEV/TEST 可以执行真实 LLM inference，但不能把交互事实用于真实训练、微调、自学习或跨家庭参数更新。

## 5. 多租户规则

所有 L2 家庭事实、L3 家庭事件、L4 家庭投影和 L5 家庭 Context 必须满足 `tenant_id + family_id` 双范围。平台级供给主数据可以没有 family_id，但必须有 tenant visibility、版本、生效期和 admission；租户级目录必须通过 `TenantCatalogBinding` 派生。客户端不能提交或覆盖 tenant scope；Account 只提供访问主体，Family 是家庭事实所有权根。

## 6. Family 与抖音式系统的差异

Family 借鉴“供给—互动—实时投影—服务反馈”的产品循环，但不借鉴自动给儿童/家庭建立兴趣画像、跨家庭图关系或长期 embedding。所有动态 context 必须目的限定、可撤回、可过期、可解释；所有家庭下一步都必须由家庭明确决定或 NO_ACTION。

## 7. 实施优先级

第一优先级是统一事件 envelope 和投影元数据，不新增推荐/训练平台。第二优先级是把 34 页页面动作挂到已有 Product Event、Growth Event 或 Test Experience operation 的明确语义上。第三优先级是为 LLM Context 增加 `as_of/policy_version/expires_at/source_refs` 并由 TenantPolicy 收紧。第四优先级才是 DEV/TEST 的多模态输入和短期动态上下文体验。

## References

[1]: https://github.com/bytedance/monolith "ByteDance Monolith official repository"
[2]: https://arxiv.org/abs/2209.07663 "Monolith: Real Time Recommendation System With Collisionless Embedding Table"
[3]: https://dl.acm.org/doi/10.1145/3711896.3737269 "TTGL: Large-scale Multi-scenario Universal Graph Learning at TikTok"
[4]: https://dl.acm.org/doi/10.1145/3627673.3680021 "GraphScale: A Framework to Enable Machine Learning over Billion-node Graphs"
