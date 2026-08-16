# Family Growth Platform：需求、功能、开发与测试主计划 V1

**文档类别：** Master Requirements / Design / Delivery / Test Plan  
**适用范围：** Family Growth Platform 的后续设计、开发、测试、评审与合并。  
**编制日期：** 2026-08-16  
**规划原则：** 本计划不另立产品、不推翻既有资产。它以 Family V3、ARCH-001、Family Core、Growth OS、Principal、Program Runtime、TENANCY-001、榜样教育课程与服务资产、未来 App 设想以及当前已推送的首条纵切为共同基座。

> **唯一使命：** 孩子是成长目标中心，家庭是持续服务与数据主权中心，平台是资源编排中心。成长需要什么，Family 就在家庭授权、安全和专业边界内组织什么；不为多卖服务，不以平台收入、停留时间或焦虑驱动替代孩子与家庭利益。

---

## 1. 文档治理与使用方式

本计划是**执行总纲**，不是新的战略 SSOT。稳定战略语义以 `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` 为准；对象链、动作与服务编排以 ARCH-001 为准；授权以 `governance/AUTHORIZATION_REGISTRY.yaml` 为准；实际 PR、合并状态及当前 Phase 以 `governance/PROGRAM_STATUS_PLATFORM_V1.md` 与 `governance/MERGE_AUTHORIZATIONS.yaml` 为准。

每个开发工作包必须先回答五个问题：它是否帮助理解成长需求、找到成长资源、组织成长服务、完成成长交付，或让下一次服务更好；它复用哪些既有事实、资产和模块；它新增什么数据/动作/事件；需要哪一项授权；由哪些测试证明其安全和价值。五项均无明确答案即为 `DO_NOT_BUILD`。

### 1.1 当前基线与必须先消除的治理冲突

| 项目 | 当前证据 | 计划处理 |
|---|---|---|
| Family V3 总蓝图 | 已冻结“Child & Family Growth；Vision Wide, Entry Narrow”；M1–M5 先验证单家庭连续服务。 | 作为本计划所有范围和排序的上位约束。 |
| ARCH-001 | 已合入 `master`；定义八对象主链、首条 Golden Journey 与内部 Gate。 | 首条纵切只实现其受限范围，不把架构契约扩成未授权 runtime。 |
| 首条纵切本地开发分支 | `family-growth-vertical-slice-001` 已推送，含运行时、迁移、权限桥接与测试。 | 先完成真实 DB/E2E、代码评审和独立 merge 授权，才考虑合入 `master`。 |
| 纵切授权登记 | `FAMILY_GROWTH_VERTICAL_SLICE_001 = INTERNAL_DEVELOPMENT_AUTHORIZED`；禁止外部模型、试点、生产、支付、ML、组织访问等。 | 当前允许代码与确定性内部验证；所有超范围能力保持 HOLD。 |
| Program Status | 仍把 Phase1 标为 `PASS_CANDIDATE`、Phase2 runtime 标为“未授权/HOLD”。 | **首个治理工作包必须做状态校准：** 由总架构师确认 ARCH-001 与纵切授权的最终关系，并更新状态/合并授权；开发团队不得自行把 HOLD 改为 PASS。 |

---

## 2. 需求分析：平台要解决什么问题

### 2.1 目标用户与价值主张

Family 服务的对象不是抽象“流量用户”，而是处在具体成长情境中的孩子、家庭与受控服务协作者。第一条场景是 12–15 岁亲子沟通冲突；这只是验证入口。平台的数据模型、资源资格、体验语言和服务网络必须覆盖完整成长生命周期，包括孕育/婴幼儿、学龄、青春期、青年早期与家庭长期关系变化。

| 角色 | 核心任务 | 平台应承担的责任 | 平台不得承担的责任 |
|---|---|---|---|
| 孩子 | 表达、参与、成长、保留自己的声音 | 提供适龄、可解释、可退出的帮助与表达空间 | 给孩子贴永久标签、评分、诊断，或把其数据变成商业画像。 |
| 家长/监护人 | 判断需要、确认意图、选择服务、共同跟进 | 让其说清问题、理解选项、做出知情决定、减少重复解释 | 替代家庭决定、以操纵性提示驱动购买或留存。 |
| 家庭 | 形成连续服务上下文与主权边界 | 保护其数据、同意、成员关系、回访与服务历史 | 将家庭困境公开、跨家庭学习或用于商业排名。 |
| 顾问/专家/服务者 | 在专业边界内提供帮助 | 在未来获授权后提供最小范围、可撤回、有目的访问和贡献记录 | 自动取得家庭所有数据或成为数据所有者。 |
| Family Steward/运营 | 组织服务、发现遗漏、发起回访、处理恢复 | 对一次服务闭环负责，保留审计与升级记录 | 用后台效率替代安全、同意与专业判断。 |

### 2.2 北极星与成功度量

平台的北极星是 **Helpful Growth Service Loop Rate（HGSLR，家庭成长有效帮助闭环率）**：家庭表达真实成长需求后，获得合格帮助、家庭选择、服务交付、回访并产生“有帮助/有一点帮助/暂未有帮助”的家庭感知信号的比例。

| 指标层级 | 指标示例 | 合法解释 | 明确禁止的误读 |
|---|---|---|---|
| 平台交付 | Time to Useful Help、合格资源可得率、接受率、服务完成率、升级成功率 | 平台有没有把帮助组织起来 | 不能代表孩子已经成长或问题已解决。 |
| 家庭感知价值 | Helpfulness、回访完成率、上下文复用、重复解释减少 | 家庭觉得这次服务是否有帮助 | 不代表干预有效、因果成立或真实成长结果。 |
| 成长信号 | 经既有 Growth OS 边界记录的 Observation、Review、Next Step | 现实中后来发生了什么 | 不得由 FollowUp 自动生成，不得当作医疗/心理诊断。 |
| 安全与主权 | 授权拒绝率、撤销生效时延、跨家庭访问拦截、异常升级率 | 家庭数据和服务是否受保护 | 不得把安全 Gate 作为排名或营销指标。 |

**永久排除的优化目标：** DAU、PV、总使用时长、无限 Feed 消费、AI 消息数量、平台收入、毛利、付费转化，均不得成为首条纵切或后续资源排序的目标函数。

### 2.3 功能性需求总览

| 需求组 | 目标 | 当前状态 | 计划优先级 |
|---|---|---|---|
| RQ-01 家庭主权/IAM | Account—binding—membership—role—family scope，撤销立即生效 | 已有基础；纵切已加强 | P0 |
| RQ-02 同意与安全 | 目的限定、同意双检、风险升级、fail closed | 既有 Consent/Safety；纵切 T1/T2 已起步 | P0 |
| RQ-03 成长需求与意图 | 家庭表达需求并确认服务意图，Need 不等于事实/诊断/优先级 | 纵切已实现受限类型 | P0 |
| RQ-04 能力与资源网络 | Need→Capability→八型 ResourceOffer，资格先于排序 | 纵切 schema/策略已起步 | P0 |
| RQ-05 服务编排与家庭决定 | Recommendation≠Decision≠Plan≠ServiceCase | 纵切已实现受限链路 | P0 |
| RQ-06 Family Steward | Case、SLA、回访、服务恢复、交接 | 仅 Case/回访基础；SLA/Recovery 未实现 | P1 |
| RQ-07 连续上下文 | 最小、家庭范围、非因果的 Context Reuse | 纵切最小投影已实现 | P1 |
| RQ-08 榜样教育资源资产 | 课程、训练营、内容、顾问、社群、活动被资格化为 ResourceOffer | 有资产准入设计；无运营后台 | P1 |
| RQ-09 App 体验 | 首页、成长、服务、家庭四个入口，杏色、温暖、非操纵 | 有现有 Web 基座与路线；未接入纵切 | P1 |
| RQ-10 专业/真人服务 | 人工升级、专家边界、受控交接、回访 | Human Gate 基座存在；服务交付未授权 | P2 |
| RQ-11 组织协作/多租户 | Organization、Engagement、AccessGrant、Contribution | TENANCY-001 仅契约 | HOLD |
| RQ-12 知识学习与研究记忆 | 外部能力研究、证据卡、审批、版本、回滚 | 仅架构方案 | P2（仅受控知识库） |
| RQ-13 成长 IP | 家庭私有、可删、非商业化表达层 | 仅 DRAFT 设计 | HOLD |
| RQ-14 网络/经济 | DemandCluster、FGCN、市场、支付、分佣 | 仅未来蓝图 | HOLD，M6–M8 后 |

### 2.4 关键非功能需求

| 编号 | 需求 | 可验证标准 |
|---|---|---|
| NFR-01 主权 | 所有家庭范围查询/写入有 `family_id`；跨家庭对象组合被 DB 与服务层拒绝。 | 跨家庭 E2E、FK/trigger/SQL 测试。 |
| NFR-02 最小权限 | 没有 ACTIVE binding、ACTIVE membership、正确角色或 Named Action 即拒绝。 | owner/guardian/non-member/child/revoked/expired matrix。 |
| NFR-03 可撤回 | 同意、binding、membership、AccessGrant（未来）撤回后，新请求立即 fail closed。 | 撤回前后 E2E 与事务边界测试。 |
| NFR-04 可追溯 | 每个可变动作有 actor、purpose/policy version、idempotency、审计和关联对象。 | 审计/幂等/事件断言。 |
| NFR-05 可解释 | 资源推荐保存资格结果、理由、局限与版本；家庭决定独立保存。 | Recommendation/Decision/Plan 读模型断言。 |
| NFR-06 可演进 | 契约、DTO、显式表、受控事件先行；模块化单体内边界清楚。 | 依赖图、契约测试、禁止跨域写入扫描。 |
| NFR-07 不伤害 | 无儿童评分、无永久画像、无诊断承诺、无自动高影响决定。 | 静态扫描、策略测试、评审 Gate。 |
| NFR-08 可运营 | 失败可见、回访可排、升级可追、恢复有记录。 | ServiceCase/SLA/Recovery 测试与运营仪表契约。 |

---

## 3. 功能与领域设计蓝图

### 3.1 核心对象、事实类型与所有权

```text
Family（数据主权根）
  ├─ Person / FamilyMembership / AccountPersonBinding
  ├─ Consent / Policy / Audit / Idempotency
  ├─ Growth OS：Perspective / Evidence / Observation / Review / NextStepDecision
  └─ Growth Service Chain：
       GrowthNeedSignal (non-canonical)
       → GrowthIntent (family-confirmed)
       → GrowthCapability (independent)
       → ResourceOffer (eight types)
       → ResourceRecommendation
       → FamilyServiceDecision
       → OrchestrationPlan
       → ServiceCase
       → FollowUpResponse
       → ContextReuseProjection (read-only, non-causal)
```

| 对象 | 所有者/真相类型 | 允许写入者 | 禁止的越界 |
|---|---|---|---|
| GrowthNeedSignal | 编排输入，非 canonical | 受信任家庭动作；未来 AI 只能提出候选，不可静默确认 | 写 Fact/Diagnosis/GrowthPriority。 |
| GrowthIntent | 家庭确认的服务需求 | 监护人明确确认 | 由模型、推荐或顾问自动确认。 |
| GrowthCapability | 平台可替换能力层 | 受控资源治理流程 | 被资源产品字段取代，或从 Need 直跳 Product。 |
| ResourceOffer | 资源网络与资格元数据 | 资源准入/运营流程 | 未通过证据、风险、隐私、适龄审查即 active。 |
| ResourceRecommendation | 合格集合内的建议 | 确定性策略；未来受控 AI 仅 proposal | 代替家庭决定或绕过 eligibility。 |
| FamilyServiceDecision | 家庭服务选择 | 被授权监护人 | 由 AI/运营/支付方自动写入。 |
| OrchestrationPlan | 声明式条件路径 | 家庭决定后的编排动作 | 充当完成/交付/成长结果真相。 |
| ServiceCase | 一次服务的状态容器 | Family Steward 受控动作 | 直接成为 Observation 或成长效果。 |
| FollowUpResponse | 家庭感知的帮助程度 | 家庭明确回访 | 自动上升为 Outcome/因果结论。 |
| GrowthIdentityExpression（未来） | 家庭私有、版本化表达层 | 孩子/监护人显式创作与确认 | 自动画像、公开人设、商业化或推荐资格输入。 |

### 3.2 功能模块与模块化单体边界

当前坚持模块化单体：明确 schema、DTO、API 契约、领域服务、仓储、outbox/audit 形成未来可拆边界；不因“微服务”名义提前引入 Kafka、Kubernetes、跨服务事务或独立部署。

| 模块 | 现有基础 | 本计划内责任 | 未来可拆条件 |
|---|---|---|---|
| Family Core | Family、Person、Relationship、Consent、Audit、Idempotency | 主权根、家庭成员、同意、关系、审计 | 多团队独立负责且契约/事件稳定。 |
| IAM | Account、Binding、Membership、Session、Role | 会话/作用域/撤销/Named Action | 身份提供商、组织访问和审计流成熟。 |
| Growth OS | Evidence、Perspective、Observation、Review | 成长真实行动与观察协议 | 不能被服务层直接写入。 |
| Orchestration | 纵切已建 | Need→Capability→Resource→Decision→Plan→Case→Follow-up | 多资源类型、SLA、服务恢复、队列需求稳定。 |
| Resource Network | 0020 的 ResourceOffer/Capability | 榜样教育资产准入、资格、版本、可用性 | Provider/Organization 以 AccessGrant 安全接入后。 |
| Principal/AI | Principal、AI Gateway、Human Gate | 受控 AI 资源提供者/提案，不拥有家庭核心事实 | 外部模型专门授权、DPIA、评价和试点通过。 |
| Program Runtime | 已有进度投影 | Program 资源的 schedule/位置投影 | Enrollment/Delivery 另建并获授权后。 |
| Family Steward | Case/Follow-up 起步 | SLA、运营队列、恢复、转介、人工交接 | 多服务者协作、访问授权成熟。 |
| Web App | 既有 Web | 首页/成长/服务/家庭体验，调用已有 API | 移动原生需求和体验稳定后。 |
| Capability Learning | 仅设计 | 来源登记、证据卡、审批、版本、测试夹具 | 需要持续后台研究时另选方案/授权。 |

### 3.3 首条可验证体验：青春期沟通冲突 Golden Journey

首条体验必须让一个首次到访的家长在不理解 UUID、不改 URL、不先做测评、不先建立 GrowthPriority 的前提下，从首页表达“孩子刚摔门，我今晚不知道怎么重新开口”。系统生成的是低风险、可拒绝、可解释的帮助路径，而不是诊断或必然承诺。

```text
HOME（温暖、低摩擦表达）
→ 家长输入/选择需要
→ 明示确认 GrowthIntent
→ Capability：DE_ESCALATION + COMMUNICATION_REOPENING
→ 仅展示通过 T1 Gate 的 NO_ACTION / 确定性 AI_COACH / approved PRACTICE / EXTERNAL_REFERRAL
→ 家庭选择、拒绝或 NO_ACTION
→ 仅对选择的资源生成 Plan
→ T2 Gate 仍通过才开启 Case
→ 适时回访
→ 记录 user-perceived helpfulness
→ 下次仅复用该次服务的最小上下文，不做因果断言
```

### 3.4 杏色家庭 App 体验设计

产品的视觉不是企业后台，也不是强刺激增长应用。延续现有杏色设计令牌：暖米杏为底、深棕/灰褐为文字、低饱和草木绿表示已准备/安全、克制的珊瑚色仅用于风险/待处理。页面应优先传达“被接住、看得懂、下一步清楚”，而不是制造焦虑或强制完成。

| 一级入口 | 用户问题 | 首期能力 | 禁止体验 |
|---|---|---|---|
| 首页 | “现在有什么需要 Family 帮忙？” | Need 表达、在途帮助、下一步、温和回访 | 无限信息流、紧迫倒计时、付费诱导。 |
| 成长 | “我们正在理解什么、积累什么？” | 既有 Growth OS 只读投影、可选生命周期上下文 | 把观察变评分、把服务完成变成长结果。 |
| 服务 | “Family 正在怎样帮助我们？” | 推荐、决定、计划、Case、回访、帮助感知 | 资源强推、跳过家庭决定。 |
| 家庭 | “谁可以参与、我们授权了什么？” | 成员、同意、关系、会话/设备、安全设置 | 复杂权限术语掩盖实际数据用途。 |

---

## 4. 分阶段开发路线、数据演进与授权 Gate

### 4.1 总体路线

| 阶段 | 目标 | 主要工作包 | 必要 Gate | 明确不做 |
|---|---|---|---|---|
| G0 治理校准 | 让状态、授权、分支和蓝图一致 | 更新 Program Status/merge authorization；审查首条分支 | 总架构师确认 | 自行合 master。 |
| G1 纵切验证 | 证明单家庭服务链安全可运行 | 0020 迁移、IAM、T1/T2、Decision、Case、Follow-up、真实 DB E2E | 内部确定性 runtime 与 E2E PASS | 外部模型、真实家庭试点。 |
| G2 资源资产运营 | 让榜样教育资产成为合格资源 | ResourceOffer 管理、Capability 映射、证据/内容准入、版本/下架 | 资源质量和内容治理 Gate | 市场、支付、分佣。 |
| G3 App 体验 | 用户可从首页走通首条链 | HOME→Intent→Recommendation→Decision→Plan→Case→Follow-up；杏色 UI | UX、可访问性、API 合约 E2E | 另建平行客户端。 |
| G4 服务连续性 | 从一次帮助变连续服务 | SLA、队列、回访、恢复、专家/转介 stub | Family Steward Gate | 组织跨家庭访问。 |
| G5 上下文复用 | 下一次更少重复解释 | 最小投影、过期/撤销、解释边界、隐私测试 | Context Reuse Gate | 跨家庭学习、画像。 |
| G6 Program/真人资源 | 将 Program/专家作为资源接入 | Program Resource Bridge；Human handoff；Delivery domain 设计 | 独立 Enrollment/Delivery 授权 | 用 Program Runtime 伪造完成事实。 |
| G7 网络与协作 | 需求与供给网络的安全基础 | 匿名 DemandCluster；Organization/Engagement/AccessGrant；Contribution | TENANCY-002/003 + 隐私/组织 Gate | 大组织多租户直接上线。 |
| G8 学习与经济 | 受控学习、协作与商业机制 | 研究记忆、L2R、FGCN、经济层 | 单家庭价值和网络 Gate 全通过 | 黑箱 L2R、以收入排序。 |

### 4.2 G1 详细工作包：先把首条纵切验证完整

| 工作包 | 具体交付 | 依赖 | 通过条件 |
|---|---|---|---|
| G1.1 状态校准 | Program Status、Merge Authorization 与 Authorization Registry 的一致裁决 | 总架构师 | 所有状态文件能解释“代码授权、内部 runtime、merge、pilot、production”的区别。 |
| G1.2 真实数据库环境 | 可复现 PostgreSQL 初始化、迁移、清理、CI 配置 | 测试基础设施 | 0001–0020 全部迁移可应用；干净 DB 可重复运行。 |
| G1.3 IAM E2E | valid owner/guardian、wrong family、non-member、revoked binding/membership、expired/revoked session、x-actor-only 拒绝 | IAM/Session | 矩阵全 PASS；无回退到 audit_log。 |
| G1.4 编排 Golden E2E | Need→Intent→Capability→Offer→T1→Recommendation→Decision→Plan→T2→Case→Follow-up→Context Reuse | 0020/资源 seed | 主链成功，所有对象 family-scoped、审计/幂等存在。 |
| G1.5 失败关闭 E2E | consent withdrawn、offer inactive、资格不符、Practice 无 approved content、T2 变化、child/adult limited 等 | 策略/权限 | 没有静默替换、没有越权开案、`NO_ACTION` 永远可选。 |
| G1.6 边界扫描 | 外部模型、训练、支付、组织访问、公开/商业化、画像、直接写 Observation 的静态/契约扫描 | 授权登记 | 扫描为零或有明确批准例外；纵切无例外。 |

### 4.3 G2 详细工作包：榜样教育资产进入 Resource Network

G2 的目的不是“再做课程商城”，而是把榜样教育已经形成的课程、训练营、内容、练习、顾问和服务流程，在家庭选择与资源资格的边界内变成可调用、可下架、可解释的资源。

| 子能力 | 数据/操作 | 关键规则 | 验收 |
|---|---|---|---|
| 资产目录 | `ResourceOffer` 的资源卡、版本、内容引用、证据级别、年龄/阶段、风险、可用性 | Asset 不等于自动可推荐；必须有 Capability 与准入证据。 | 无 Capability/内容引用/批准状态的资源不得进入候选。 |
| 能力词典 | GrowthCapability 分类、同义归并、Need 映射 | Capability 独立、可替代；不得绑定单一产品。 | 一个能力至少能呈现 NO_ACTION 或非商业替代路线。 |
| 内容/练习准入 | approved content reference、适龄、专业范围、版本/撤下 | PRACTICE 必须有 approved content；下架后 T1/T2 均拒绝。 | 内容下架/版本变化 E2E。 |
| 顾问/专家资源卡 | 资格、专业范围、风险边界、人工要求 | 不创建 Organization 数据访问；仅作为 ResourceOffer 元数据。 | 未达资格不能进入候选。 |
| 资源运营后台 | 受控的内部录入、审核、发布、下架 Action | 所有变更审计、双人审核（高风险资源） | 版本、审核、回滚和 audit 测试。 |

### 4.4 G3 详细工作包：从现有 Web 接入首条体验

| 页面/组件 | API 契约 | 交互原则 | 测试 |
|---|---|---|---|
| HOME Growth Gateway | Create Intent、在途 Case、最小 Context Reuse | 一句话表达即可；用户永远能跳过/取消；不要求测评。 | 浏览器 E2E、键盘/移动端、错误/网络恢复。 |
| Resource Decision Sheet | Recommendation、Eligibility 理由/局限、Decision | 展示“为什么可用/有什么限制”；`NO_ACTION` 与替代路径同等清晰。 | 排序解释、拒绝/替代/NO_ACTION E2E。 |
| 服务路径与回访 | Plan、Case、Follow-up | Plan 是建议路径；回访只问帮助感知，不问“是否已成长”。 | 状态边界、幂等、重复提交、撤回同意。 |
| 家庭主权中心 | Member、Consent、Session | 可理解谁可访问、何时撤回、撤回会发生什么。 | 撤回后体验/API 立即失效。 |

### 4.5 G4–G8 的后置条件

后续能力不是不做，而是不得抢跑。`Organization/AccessGrant` 需要 scope/purpose/expiry/revocation 数据模型与跨组织 fail-closed E2E；`Enrollment/Delivery` 需要独立交付/完成语义；真实外部模型需要 provider、处理目的、同意、评估、人工升级和试点授权；成长 IP 需要儿童保护、表达/删除/版本和公开禁令；Demand/FGCN/经济需要 M1–M5 的单家庭价值证据、匿名阈值、贡献追溯和反操纵治理。

---

## 5. 数据、API、事件和部署演进原则

### 5.1 数据迁移纪律

所有 schema 改动必须使用顺序迁移、强制外键、范围字段、唯一幂等约束、枚举/检查约束和必要索引。迁移必须可在空库和从上一 master 迁移的数据库上运行。核心对象不得通过 JSON 黑盒替代表结构；不保存未经确认的 AI 自由文本为 Fact/Observation/Outcome。

### 5.2 API 与 Action 纪律

每个写操作必须具备：可信会话、家庭范围、显式 `NamedAction`、角色策略、目的/同意（需要时）、idempotency key、policy version、审计与领域守卫。控制器检查不是唯一防线，领域服务/仓储也要对高风险写操作复检 `ACTIVE binding + ACTIVE membership + role`。

### 5.3 受控事件与未来微服务边界

当前使用模块化单体和受控 outbox/audit。每个跨域事件必须描述 event name、family scope、source action、对象 ID、版本、幂等/重放语义与消费者；未获得独立可靠性/组织权限需求前，不引入 Kafka、独立部署或跨服务最终一致性复杂度。未来可拆分顺序优先为 Resource Operations、Family Steward、Organization Access，而不是先把 Family Core 拆碎。

---

## 6. 完整测试策略与质量 Gate

### 6.1 测试金字塔

| 层级 | 范围 | 最低要求 | 阻断条件 |
|---|---|---|---|
| 静态/契约 | TypeScript、DTO、schema、NamedAction、授权登记、禁用能力扫描 | 每次 PR | 不通过不得构建。 |
| 单元 | Policy、eligibility、ranking、role matrix、生命周期资格、AI 边界 | 每个规则分支 | 安全规则无测试或默认放宽。 |
| 模块集成 | Repository transaction、FK、idempotency、T2 双检、撤销 | 每个新对象链 | 事务窗口/跨家庭写入/重复写入。 |
| HTTP E2E | Session/IAM、控制器、家庭决定、失败关闭 | Golden Journey + negative matrix | 身份回退、绕过 Action、静默资源替换。 |
| 浏览器 E2E | HOME→服务→回访、家庭同意/成员、杏色体验 | 每一 App 关键链 | 需要 UUID/手改 URL、无可读错误、无移动端支持。 |
| 安全/隐私 | 授权、撤回、scope、敏感日志、外呼/训练扫描 | 每次 release candidate | 未授权对外发送、儿童评分/画像、跨家庭读取。 |
| 运营/混沌 | 回访失败、资源下架、服务恢复、队列积压 | G4 起 | 服务状态丢失或无恢复路径。 |

### 6.2 首条纵切验收矩阵

| 验收类 | 必测情形 |
|---|---|
| 身份 | valid owner、valid guardian、adult limited、child、non-member、wrong family、revoked binding、revoked membership、expired/revoked session、x-actor-only。 |
| 同意 | 无 SERVICE consent、withdrawn/expired consent、同意在 T1/T2 间撤回、无 consent 的 `NO_ACTION`。 |
| 资源 | inactive、年龄不符、无 approved content 的 PRACTICE、需人工/外部 referral、未授权 PROGRAM。 |
| 决定与计划 | Recommendation 不能直接开案、决定只能来自同家庭推荐候选、NO_ACTION 不产生 Case、Plan 不等于执行/完成。 |
| Case/Follow-up | T2 一次事务、失败不落半条记录、FollowUp 不写 Observation、ContextReuse 仅最小范围不作因果。 |
| 数据主权 | 对象/资源/计划/Case 跨家庭组合全拒绝；撤销后拒绝；Audit/Idempotency 完整。 |
| AI 边界 | 无纵切外部调用、无训练、无 AI 写 canonical、无模型自动确认/决定/开案。 |

### 6.3 Release Gate 定义

| Gate | 适用阶段 | 必须证据 | 放行含义 |
|---|---|---|---|
| Architecture Gate | 任何新领域 | SSOT、对象/动作/状态、Do/Do-not、依赖与授权 | 允许写受限代码。 |
| Code Gate | 每个 PR | build/typecheck/unit/静态扫描/迁移审查 | 允许审查，不等于 merge。 |
| Internal Runtime Gate | G1–G5 | 真实 DB E2E、Golden/negative、安全矩阵、运营证据 | 仅内部确定性验证。 |
| Merge Gate | 每次合 master | exact SHA、CI 绿色、总架构师 per-merge authorization | 允许合入主线。 |
| Pilot Gate | 真实家庭之前 | IAM/Consent/Privacy、人工处理、事故响应、专家/运营签署 | 允许有限真实试点。 |
| Production Gate | 对外生产 | 合规、监控、弹性、备份、SLO、支持/申诉、provider/支付等专项 Gate | 允许生产开放。 |

---

## 7. 实施节奏、复位检查与工作方式

每个工作包遵循同一循环：**研究/证据 → 需求与验收 → 对象/Action/权限设计 → 小规模代码 → 单元/集成/E2E → 蓝图复位 → 架构/授权评审 → 合并/推送**。不以“功能堆积”替代验证。

每完成一个可运行增量，执行蓝图复位检查：它是否仍服务 Need→Capability→Resource→Service；是否仍把家庭放在决定点；是否把服务、成长、表达和商业信号混淆；是否新增未授权的组织/模型/支付/网络能力；是否复用了既有 Family/榜样教育资产，而非另起平行系统；是否仍保持杏色、温暖、非操纵的家庭体验。

---

## 8. 当前建议启动顺序

1. **G0.1：治理状态校准。** 提请总架构师处理 Program Status 与已登记纵切授权的冲突，并决定是否允许该开发分支进入审查/合并候选。
2. **G1.2：真实 PostgreSQL 迁移验证。** 已在隔离本地 PostgreSQL 上应用 0001–0020；继续修复既有测试夹具的可信 binding/membership bootstrap，避免用 audit 退化授权规则。
3. **G1.3–G1.5：首条纵切 E2E。** 建立一套独立于旧 Onboarding/GrowthPriority 的真实 DB Golden Journey 与 negative matrix。
4. **G2：榜样教育资源准入。** 用已验证的 ResourceOffer/Capability 模型接纳现有课程、训练营、内容、顾问等资产；先资源治理，后服务网络扩张。
5. **G3：现有 Web 的 HOME 体验接线。** 不新建平行客户端；从当前 App 的 HOME、服务和家庭入口实现第一条完整体验。
6. **G4–G5：Family Steward 和连续上下文。** 服务 SLA/Recovery、最小上下文复用、解释与撤回。

---

## 9. 明确暂停与不得越界清单

在本计划被逐项解锁前，以下保持暂停：Organization/AccessGrant runtime、跨组织/跨家庭统计、DemandCluster runtime、FGCN/Contribution/Allocation runtime、支付/订单/会员/分佣/市场撮合、ML/Learning-to-rank、真实外部模型进入纵切、SFT/LoRA/Distillation、儿童成长 IP runtime、公开儿童表达、数字人、健康/心理/医学诊断、Assessment runtime、通用 workflow DSL、Kafka/Kubernetes/独立微服务部署。

暂停不是否定长期目标，而是为了保证每项能力在进入家庭服务之前，已有明确的数据主权、专业责任、同意、测试、运营与可撤回边界。

---

## 参考资料

[1] `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` — 平台使命、核心引擎、对象链、成熟度与 Do-Not-Build。  
[2] `architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md` — ARCH-001 编排契约。  
[3] `governance/AUTHORIZATION_REGISTRY.yaml` — 能力授权登记。  
[4] `governance/PROGRAM_STATUS_PLATFORM_V1.md` — 可变执行状态。  
[5] `governance/FAMILY_GROWTH_VERTICAL_SLICE_001_TASK_CONTRACT.md` — 首条纵切范围和通过条件。  
[6] `architecture/BANGYANG_EDUCATION_ASSET_PRESERVATION_AND_RESOURCE_ADMISSION_V1.md` — 榜样教育资产保留/资源准入。  
[7] `architecture/FAMILY_APP_EXPERIENCE_INTEGRATION_V1.md` 与 `FAMILY_APP_VISUAL_LANGUAGE_V1.md` — App 体验与视觉原则。  
[8] `architecture/tenancy/TENANCY_001_OWNERSHIP_TENANCY_CONTRACT_V1.md` — Family 数据所有权和未来组织访问契约。  
[9] `architecture/FAMILY_OBJECT_ACTION_CONTEXT_MODEL_V1.md` 与 `FAMILY_CHILD_GROWTH_IP_V1.md` — 对象/Action/上下文与儿童成长 IP 边界。  
[10] `architecture/FAMILY_CAPABILITY_LEARNING_SYSTEM_V1.md`、`FAMILY_RESEARCH_MEMORY_INTELLIGENCE_INTEGRATION_V1.md`、`FAMILY_PLATFORM_CAPABILITY_ADMISSION_ROADMAP_V1.md` — 能力学习、受控研究记忆和能力准入。  
