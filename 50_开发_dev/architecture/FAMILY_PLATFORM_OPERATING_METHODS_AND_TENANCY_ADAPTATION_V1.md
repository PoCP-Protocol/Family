# Family 平台运营方法、微服务与多租户适配备忘录 V1

```text
DOC_KIND       = RESEARCH_ADAPTATION_MEMO（非 SSOT、非 runtime 授权、非迁移设计）
STATUS         = DRAFT_FOR_ARCHITECT_REVIEW
PARENT         = architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md
TENANCY_PARENT = architecture/tenancy/TENANCY_001_OWNERSHIP_TENANCY_CONTRACT_V1.md
SCOPE          = 解释四类运营方法、模块边界与多租户的 Family 适配；不变更 V3 阶段顺序
DB_CHANGE      = 0
RUNTIME_CHANGE = 0
```

## 1. 裁决

Family **应吸收方法机制，不复制商业手段**。既有 V3 蓝图已将拼多多、字节、海底捞、贝壳分别映射为 Growth Demand、Growth Distribution、Family Steward 与 FGCN Collaboration，且明确它们是同一服务编排系统的机制来源，而不是四个独立产品模块。[1]

当前 Phase2 首条 Vertical Slice 仍只证明单家庭的连续服务价值。需求网络、跨组织协作、支付/佣金、市场撮合、ML 排序与大组织多租户仍属后续阶段；微服务采用“先模块化单体和显式契约、后按独立风险与责任拆分”的路径，禁止为了技术形态而提前分布式化。[1] [2]

## 2. 四类运营机制的 Family 翻译

| 来源机制 | Family 的安全翻译 | 进入阶段 | 明确禁止 |
|---|---|---|---|
| 拼多多：需求聚合、C2S 反向供给 | `DemandCluster` 仅以去标识、聚合且达到阈值的需求模式指导资源供给/排班；分享的是价值与资源，不是家庭问题 | Phase7 Demand Aggregation | 砍价、强制裂变、公开家庭困境、用儿童/家庭敏感数据做营销画像或跨租户定向 |
| 字节：反馈闭环、实验迭代、Next Best Resource | 记录显式反馈、跳过、撤回、家庭决定、帮助感和安全事件；使用确定性且可解释的 Resource Ranking | Phase2–3 仅低风险规则与可回滚实验；Phase9 才评估 Learning-to-rank | 无限 feed、以时长/点击为目标、黑箱排序、儿童脆弱状态驱动参与、无人工兜底的在线学习 |
| 海底捞：主动服务、服务恢复、有限授权 | `Family Steward` 用 Case/SLA/Follow-up/Recovery 保障服务不断线；策略版本化、基础红线不可覆盖、有限角色授权 | Phase6 Service Steward | 未经同意的高频触达、餐饮式即时补偿/操控、用员工竞赛影响家庭决定、跨模块不可逆自动行动 |
| 贝壳：协作角色、过程标准、贡献追溯 | FGCN 将一次服务拆为 Discoverer/Router/Content/AI Coach/Delivery/Growth Coach/Expert/Reviewer/Steward；记录任务与贡献，不等同于经济分账 | Phase8 FGCN Collaboration | 佣金分账/抢单、复杂角色一次性落地、组织成员身份自动取得家庭权限、非专业人群裁决儿童安全或临床问题 |

## 3. Family Ontology 与 Action 目录

借鉴“对象—逻辑—行动—反馈”的运营方法，Family 应把领域对象、规则、受控写入和服务反馈分开，但不得构建通用对象引擎或 EAV。

| 层 | Family 对象或机制 | 写入规则 |
|---|---|---|
| 所有权根 | `Family`、`Person`、`Account`、`FamilyMembership`、`Consent` | Family 是家庭成长数据唯一 owner 根；Account 不等于 Person；家庭角色仅在 FamilyMembership 有效 |
| 服务编排 | `GrowthNeedSignal`、`GrowthIntent`、`GrowthCapability`、`ResourceOffer`、`ResourceRecommendation`、`FamilyServiceDecision`、`OrchestrationPlan`、`ServiceCase` | 七种真相分开；Recommendation/Decision/Plan/Execution/Follow-up/Observation/ContextReuse 不得越层写入 |
| 跨组织边界（未来） | `Organization`、`OrganizationMembership`、`FamilyServiceEngagement`、`AccessGrant`、`ServiceContribution` | Organization 永不拥有家庭数据；跨边界读取只能有 purpose-scoped、未过期、未撤销 AccessGrant |
| 受控 Action | `ConfirmGrowthIntent`、`AcceptRecommendation`、`SelectAlternative`、`OpenServiceCase`、`RecordFollowUpResponse`、`GrantAccess`、`RevokeAccess` 等 | 每个 Action 显式声明 actor、family scope、对象、用途、同意、资格、安全、时效、幂等与审计；AI 只产出 proposal/draft |
| 反馈与质量 | `HelpfulnessSignal`、`ServiceAttentionSignal`、`RecoveryEvent`、`PolicyDecision`、`AuditEvent` | 过程、主观帮助感、观察与成长结果严格分域；不可将完成率/续费/停留时长当成长因果 |

## 4. 多租户硬边界

多租户不是“表上多一个 tenant_id”。对 Family 而言，**Family 是家庭数据的所有权和访问边界，但不是未来 Organization Tenant 的替代物**。跨组织服务必须同时满足 Family 主权和租户隔离。

```text
Account --binds--> Person --member_of--> Family
Person  --member_of--> Organization        （未来组织角色，正交）
Family  --engages--> Organization          （服务关系，不授予读取）
Family  --grants--> Organization/Person    （AccessGrant：唯一跨边界可见性）
```

| 不变量 | 具体要求 |
|---|---|
| 请求租户上下文 | 从已认证会话和可信绑定推导；不得信任客户端提交 `tenant_id` / `family_id` 作为授权依据 |
| 对象级二次授权 | 网关只做粗粒度拦截；每个服务在对象写入/读取时复核 Family scope、角色、purpose、Consent、AccessGrant、有效期与撤销状态 |
| 数据分层隔离 | 儿童安全、原始交流和高敏档案优先独立 schema/数据库或同等强度隔离；低敏元数据方可采用行级隔离；所有查询、缓存、队列、文件与日志必须带受控 Family context |
| 事件隔离 | 跨服务事件只传最小字段、用途、保留期限、策略版本和可追溯引用；禁止将儿童原始文本写入普通日志、分析仓或未授权训练集 |
| 跨组织默认拒绝 | 无有效 AccessGrant 的 Organization/Member 一律拒绝；Payment、Subscription、OrganizationMembership 和 Community 不能隐含家庭访问权 |
| 租户质量门 | 串租读/写、缓存键泄露、事件错投、对象存储路径、撤权传播、导出与删除均必须自动化测试；拒绝、越权尝试和撤权时延进入审计指标 |

## 5. 微服务的渐进拆分

Phase2 不拆微服务。当前技术形态为 **模块化单体 + PostgreSQL + Redis + Outbox**；这符合 V3 先证明单家庭价值、后建设网络与经济层的阶段纪律。现在必须做的是“可拆分设计”：模块拥有清晰 schema、契约、事件和 Named Action；将来按独立风险、伸缩、可用性与团队责任提取服务。[1] [3]

| 阶段 | 运行形态 | 可拆分边界 | 暂不拆分理由 |
|---|---|---|---|
| Phase2–3 | 模块化单体 | Family Core、IAM/Policy、Growth OS、Orchestration、Principal Adapter、Content Ref、Audit/Outbox | 单家庭纵切需要事务一致性与快速迭代；过早 RPC/事件编排会放大授权和真相漂移风险 |
| Phase4–6 | 模块化单体或少量独立 Worker | Program Delivery、Notification、Service Steward/Follow-up、Reporting Projection | 异步、可独立伸缩的低敏任务先外置；核心家庭授权与 canonical 写入仍收敛 |
| Phase7–8 | 受控服务化 | Demand Aggregation（匿名）、Provider Qualification、Organization/AccessGrant、FGCN Collaboration | 先完成 TENANCY-002/003/004、Data Product 和跨组织安全 Gate，再开放网络协作 |
| Phase9+ | 受控学习与平台能力 | Ranking/Eval、Economic Ledger（若获授权） | 仅在足够的合规过程数据、人工监督和反偏差评估建立后，才评估 ML 或经济机制 |

## 6. 当前首条纵切必须吸收的最小机制

1. 采用 **Palantir 式对象—规则—Action—反馈**结构，但在 Family 语义和 Named Action 下落地。
2. 使用 **字节式反馈闭环的安全版本**：显式的接受/跳过/撤回/帮助感/人工改判可记录、可解释、可回滚；不做模型实时学习、无限 feed 或增长优化。
3. 预留 **海底捞式服务恢复**接口：ServiceCase 需要 `next_action_at`、SLA class、escalation 与 recovery reason，但 V1 只做最小状态与人工升级，不做大规模运营自动化。
4. 预留 **贝壳式贡献可追溯**接口：ServiceContribution 可记录 provider role/task/quality state，不做佣金、分账或市场撮合。
5. 保持 **拼多多式需求反向组织**为匿名的未来 DemandCluster；当前仅记录单家庭 Need/Intent，绝不跨家庭聚合或分享。
6. 所有新模块从一开始携带受控 `family_id`、actor、purpose、policy version、idempotency key 和审计引用，以便未来多租户安全拆分。

## 7. 对当前 Vertical Slice 的禁止性裁决

以下能力虽然属于长期平台设计，但不进入当前代码范围：Organization schema、OrganizationMembership、AccessGrant runtime、跨组织服务、Community、DemandCluster runtime、跨家庭实验、推荐学习、Provider Marketplace、支付/分佣、通用 workflow engine、微服务部署、Kafka、Kubernetes。

## 参考

[1]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` §§3–10
[2]: `architecture/tenancy/TENANCY_001_OWNERSHIP_TENANCY_CONTRACT_V1.md` §§0–9
[3]: `docs/FAMILY_1_0_MOS_SYSTEM_INTEGRATION_PROGRAM.md` 与既有技术复盘：当前为模块化单体、PostgreSQL、Redis、Outbox
[4]: https://palantir.com/docs/foundry/platform-overview/overview/ "Object + Logic + Action + feedback"
[5]: https://csrc.nist.gov/pubs/sp/800/207/final "NIST Zero Trust Architecture"
[6]: https://cheatsheetseries.owasp.org/cheatsheets/Microservices_Security_Cheat_Sheet.html "OWASP Microservices Security"
[7]: https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html "OWASP Multi-tenant Security"
[8]: /home/ubuntu/research_operating_models_for_family.json "四类运营方法与高敏感家庭数据架构研究"
