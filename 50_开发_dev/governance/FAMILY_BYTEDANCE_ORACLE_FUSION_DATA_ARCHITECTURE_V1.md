# Family 字节/抖音式产品数据循环 + Oracle EBS 式治理架构 V1

## 1. 定位

Family 采用两种方法的互补组合：用字节/抖音式产品数据循环支持快速体验迭代、内容与服务编排、实时反馈和多场景上下文；用 Oracle EBS 式企业数据治理保证多租户边界、主数据稳定性、版本、生效期、审计、业务键、接口校验和交易事实可追溯。

这不是复制抖音的推荐系统，也不是把 Family 变成短视频平台。Family 的核心是“家庭表达需要，平台整理能力和候选，家庭自主决定下一步”，因此动态数据只能辅助当前体验，不得成为儿童或家庭的永久画像。

## 2. 两种方法各自解决什么问题

| 方法 | Family 借鉴 | Family 不复制 |
|---|---|---|
| 字节/抖音式产品数据循环 | 供给目录、事件事实、实时投影、多场景统一上下文、冷启动与新内容发现、反馈闭环、实验迭代、在线服务与计算分离 | 跨家庭画像、公开人设、自动最佳推荐、儿童行为评分、无边界在线训练 |
| Oracle EBS 式治理 | 主数据/交易/接口/投影分层、代理主键+业务键、状态/生效期/版本、统一审计、值集、组织范围、接口先校验后入基表 | 机械复制 Oracle 表名、复杂度和组织模型 |

## 3. Family 五层数据循环

### 3.1 供给主数据层

供给主数据包括 ResourceAsset、ServiceOffering、Provider、ProviderQualification、Activity、AvailabilitySlot、ProductOffering、PricePlan、EntitlementPolicy、EvidenceSource、NeedType、Capability、CommunitySpace、CommunityTemplate 等。它们描述“平台有什么”，不描述某个家庭已经发生了什么。供给目录必须具备来源、版本、生效期、准入、资格、证据等级、风险路由、版权/授权状态和 tenant visibility。

### 3.2 家庭事实层

家庭事实包括 Need、Intent、Decision、NO_ACTION、Plan、Case、TaskInstance、ServiceRecord、Booking、Registration、CommerceOperation、Publication、Consent 和多模态输入/处理事实。它们描述“这个租户内的这个家庭发生了什么”，必须绑定 `tenant_id + family_id`，由 Named Action 驱动，支持幂等、撤回、取消和审计。

### 3.3 产品事件层

事件是受控的事实记录，不是主数据。事件至少包含 `event_id`、`tenant_id`、可用时的 `family_id`、`actor_id`、`event_type`、`object_type`、`object_id`、`occurred_at`、`source_page_id`、`purpose`、`consent_ref`、`correlation_id` 和 `schema_version`。事件只记录必要的产品行为，例如页面打开、候选详情查看、解释请求、候选选择、NO_ACTION、任务完成、服务记录取消。禁止记录不必要的原始对话、真实 key、儿童敏感原文或未经许可的第三方数据。

### 3.4 实时投影与上下文层

Projection Builder 将基表事实和受控事件转换为页面 Read Model、客户资产视图和最小 LLM Context Snapshot。投影必须标注 `as_of`、`source_refs`、`expires_at`、`visibility` 和 `policy_version`。Projection 可以快速更新和过期，但不能反向成为核心事实；LLM Context 只能读取租户策略允许的、家庭范围内的最小快照。

### 3.5 AI 服务层

AI Gateway 接收受控 Context，经过 ModelProfile、PromptPolicy、ToolDefinition、MultimodalProcessingPolicy、OutputSchema 和 TenantPolicyProfile 校验，输出解释草稿、下一步说明或安全停止。模型不能直接写主数据或交易事实；工具提案必须经过服务端校验和 Named Action。训练、微调、自学习和跨家庭参数更新仍不在当前产品范围内。

## 4. 与 34 页 UI 的统一执行链

所有页面统一采用：

> 页面输入 → 服务端派生 Tenant/Family scope → 读取主数据/投影 → 记录受控事件 → 可选 Gateway Context → 输出验证 → 家庭决定 → Named Action → 交易事实 → 审计 → 投影刷新。

页面不能自行决定模型、候选排序、租户、家庭范围或状态变更。页面只提交受控 page ID、动作 ID、版本和幂等键；任何未知 scope、Consent、准入、资格、版本、Policy 或 Schema 都 fail-closed。

## 5. 三类动态数据的区别

| 数据 | 是否主数据 | 是否可进入 LLM Context | 是否可永久保留 |
|---|---:|---:|---:|
| ResourceAsset/ServiceOffering/Activity | 是 | 只读摘要 | 按版本/生效期治理 |
| PageView/CandidateOpened/Decision/TaskCompleted | 否，事件/事实 | 仅在目的和租户策略允许时 | 按 purpose/retention 过期 |
| 兴趣向量、Embedding、行为标签 | 不是 Family 永久主数据 | DEV 可用短期派生草稿，须脱敏 | 默认不永久保存，不公开，不用于儿童标签 |

## 6. 多租户和家庭权属

Tenant 是商业化产品的租户隔离根，Family 是家庭私有事实的所有权根，Account 只是访问主体。所有家庭数据必须通过 `tenant_id + family_id` 双范围查询；公共平台目录必须通过 `tenant visibility + admission + version/effective` 派生。不得接受客户端传入的 tenant scope；租户从可信会话派生，Family 从 ACTIVE binding 和 membership 派生。

## 7. 当前 DEV/TEST 实现顺序

第一步保持 PostgreSQL 模块化单体，不引入独立推荐平台或在线训练平台；先实现事件 schema、受控事件写入服务、基于事件的页面投影刷新和 LLM Context freshness/expiry。第二步把 34 页现有动作逐页绑定到事件和投影。第三步补多模态事件、资产链和 Gateway 解释。每一步都用合成/测试数据和沙箱适配器验证，真实 key 只能通过测试时的环境变量、未提交 `.env.local` 或受控 secret 注入。

## 8. 研究依据

本架构的字节/抖音式启发来自 ByteDance Monolith、TTGL 和 GraphScale 的公开资料；这些资料说明了实时反馈、稀疏动态特征、多场景图关系、存储与计算分离及在线服务的工程思路，但不构成 Family 教育效果证据，也不授权 Family 使用真实家庭数据训练模型。

参考资料：

[1]: https://github.com/bytedance/monolith "ByteDance Monolith official repository"
[2]: https://arxiv.org/abs/2209.07663 "Monolith: Real Time Recommendation System With Collisionless Embedding Table"
[3]: https://dl.acm.org/doi/10.1145/3711896.3737269 "TTGL: Large-scale Multi-scenario Universal Graph Learning at TikTok"
[4]: https://dl.acm.org/doi/10.1145/3627673.3680021 "GraphScale: A Framework to Enable Machine Learning over Billion-node Graphs"
