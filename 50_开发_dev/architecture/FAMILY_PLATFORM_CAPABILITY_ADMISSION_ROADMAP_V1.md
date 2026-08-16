# Family 平台全能力启动条件路线图 V1

```text
DOC_KIND       = CAPABILITY_ADMISSION_ROADMAP（非 SSOT、非 runtime 授权）
STATUS         = DRAFT_FOR_ARCHITECT_REVIEW
PRINCIPLE      = 所有目标能力都保留在平台蓝图中；实现顺序由家庭价值、依赖、可逆性、安全与授权决定，而非由技术热度决定。
```

## 1. 不是“做或不做”，而是“现在做什么、现在预留什么、何时安全启动什么”

Family 的终局包括家庭账户、课程与 Program、顾问和专家服务、组织协作、社群与发现、需求网络、进度报告、AI、商业权益、服务生态，以及相应的多租户和微服务能力。它们并未被排除；当前的差别在于：**首条 Vertical Slice 先证明家庭价值和核心真相/权限模型，其他能力立即在对象、Action、Policy、测试夹具和接口层预留，并在依赖门槛通过后接入 runtime。**

| 能力 | 终局价值 | 现在行动 | 运行时启动门槛 | 预计承接阶段 |
|---|---|---|---|---|
| V3 Orchestration / ServiceCase | 把成长需要安全组织成一次连续服务 | **立即实现** | 当前授权、可靠 IAM、确定性资源、最小迁移、E2E Gate | Phase2 |
| Program / Enrollment / Delivery | 将 21/90 天训练营、任务、打卡、暂停和交付事实归位 | 定义 Program Resource Bridge、Delivery Contract、任务夹具 | ServiceCase 可靠；内容/任务准入；completed/paused/cancelled 归属冻结；不把进度冒充成长 | Phase4 |
| Family Steward / Advisor Workbench / Recovery | 主动跟进、SLA、异常恢复、顾问协同 | 定义 Case/Attention/SLA/Recovery playbook 和角色策略 | ServiceCase 有真实过程数据；顾问资质/培训；人工队列、申诉、质检和最小运营容量 | Phase5–6 |
| Progress Projection / 成长报告 | 让家庭看见服务、帮助感、已确认观察与下一步 | 定义 Evidence-bound projection、字段分层、报告模板 | Follow-up、观察与访问权限稳定；语言/可视化不产生因果承诺；家庭可更正/撤回 | Phase3+ |
| Family Account / Entitlement | 承载会员、服务包、权益和长期关系 | 定义 asset/entitlement 领域和 Payment≠Access 不变量 | 账户、订阅、退款/争议、权益消费、审计与目的隔离设计通过 | Phase7 / Economics 前置 |
| Organization / AccessGrant / 多租户 | 支持学校、顾问、城市/机构伙伴服务家庭 | **立即冻结 TENANCY 对象、Action、purpose 和串租夹具** | TENANCY-002/003/004 分别授权；AccessGrant fail-closed、撤权传播、组织角色正交、跨租户 E2E | Phase8 前置 |
| Community / 分享 | 提供同伴支持、内容发现与活动连接 | 定义 Publish/Unpublish、内容对象和反骚扰规则 | 自愿分享、内容审核、未成年人保护、删除/撤回、社群申诉和用途隔离 | Demand/Community Gate |
| DemandCluster / 跨家庭统计 | 匿名化地反向组织供给和运营容量 | 定义匿名聚合、阈值、小样本抑制、禁止用途 | 单家庭价值已证实；DPIA、数据最小化、不可逆去标识、退出/撤回与统计隐私 Gate | Phase7 |
| Provider Network / FGCN | 协调内容、AI、顾问、专家与交付者，记录贡献 | 预留 Provider/role/task/contribution 语义 | Provider 资格、scope、availability、AccessGrant、纠纷处理、质量回路；不做佣金 | Phase8 |
| Payment / Marketplace / Commission | 商业可持续和多方结算 | 定义订单、权益、支付、服务与访问权的严格分离 | 合规、退款、争议、财务审计、利益冲突、服务质量和家庭数据不受支付影响 | Phase10 |
| AI Coach / Advisor Copilot | 提高解释、整理、建议与运营人效 | 当前只实现确定性、低风险内部 AI resource / draft；沉淀 eval 与 Human Gate | 真实 Provider、数据处理、质量、安全、偏差、人工复核、用户告知和独立授权；不同于 pilot/production | Phase2 内部 → 后续单独 Gate |
| Assessment / 画像 | 帮助澄清需求、选择资源和长期跟进 | 保留普通反思/需求澄清，不实现 Assessment Resource | 题库/解释/风险/专业责任、信效度、适龄、隐私、结果使用和人工转介明确 | 单独 Assessment Gate |
| 微服务 / Kafka / Kubernetes | 规模、独立部署、隔离与团队自治 | **现在做模块边界、DTO、Outbox、显式事件和契约测试** | 有稳定模块责任、真实独立扩缩/可用性需求、事件语义、幂等、可观测性、串租/撤权传播测试和运维能力 | 需求驱动，非固定日期 |

## 2. 三条并行轨道

```text
轨道 A：家庭价值纵切
HOME → Need → Intent → Resource → Decision → Plan → Case → Follow-up → Context Reuse

轨道 B：平台能力契约
Tenancy / Account Asset / Delivery / Steward / Report / Provider / Community / Demand / Economics
每项先冻结对象、Action、权限、数据用途、失败关闭与测试夹具

轨道 C：运营与治理能力
内容/资源准入、Provider qualification、Human Gate、数据用途/删除、质量评估、审计、申诉、服务恢复
```

轨道 A 不被轨道 B/C 的大范围 runtime 阻塞；轨道 B/C 也不因首条纵切而被遗忘。每项后续 runtime 都需独立授权，并继承轨道 A 已验证的家庭主权、可信身份、对象级权限、幂等、审计与真相隔离。

## 3. 当前首条 Vertical Slice 的最小可扩展设计

即使当前不启用所有能力，首条纵切也必须留下六个不返工的接口：

1. **Family scope：** 每张新表、每个 DTO、每个事件以受控 `family_id`、actor、purpose、policy version 和审计引用作为基础。
2. **Resource abstraction：** Program、内容、AI、真人、外部转介均以原子 ResourceOffer 表达；不把课程产品写死进编排逻辑。
3. **Decision boundary：** FamilyServiceDecision 独立于 Recommendation，未来权益、支付、外部协作不能绕过家庭决定。
4. **Execution boundary：** ServiceCase 独立于 Plan，未来 Delivery、SLA、专家参与和服务恢复都有正确的执行宿主。
5. **Evidence boundary：** Follow-up、Helpfulness、Observation、Progress Projection 分层，未来报告/AI 学习不会把服务过程错误变成成长结果。
6. **Controlled events：** 使用最小 Outbox 事件和显式 DTO，未来 Notification、Reporting、Steward、Demand Aggregation 或拆分服务可订阅受控事件，而不复制原始儿童数据。

## 4. 必须保持的否决规则

以下规则在所有阶段保持有效：家庭数据所有权不因组织、付款、会员或运营效率转移；儿童和家庭敏感数据不用于广告、裂变、商业排序或未授权训练；资源资格在排序前 fail-closed；收入不参与成长资源排序；AI 不能自动诊断、处罚、授予资格、执行高风险决定或直写 canonical；任何跨家庭或跨组织访问都必须有显式、可撤回、用途限定的授权。

## 参考

[1]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` §§3–10
[2]: `architecture/tenancy/TENANCY_001_OWNERSHIP_TENANCY_CONTRACT_V1.md`
[3]: `architecture/FAMILY_GROWTH_VERTICAL_SLICE_001_IMPLEMENTATION_PLAN.md`
[4]: `architecture/FAMILY_CAPABILITY_LEARNING_SYSTEM_V1.md`
[5]: `governance/FAMILY_GROWTH_VERTICAL_SLICE_001_TASK_CONTRACT.md`
