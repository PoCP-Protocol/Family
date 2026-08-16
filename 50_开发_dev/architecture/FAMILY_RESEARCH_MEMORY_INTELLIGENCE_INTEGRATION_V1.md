# Family 受控研究、记忆、学习与智能融合架构 V1

```text
DOC_KIND          = INTEGRATION_ARCHITECTURE_MEMO（非 SSOT、非 runtime 授权）
STATUS            = DRAFT_FOR_ARCHITECT_REVIEW
INTEGRATION_RULE  = EXTEND_EXISTING_ASSET_ONLY
NON_GOAL          = 不新建平行 Family Core、平行知识真相、平行画像、平行权限、平行内容库或平行 AI 平台
```

## 1. 核心裁决

Family 的“自我搜集、自我研究、自我记忆、自我学习、自我智能”不是一个脱离现有平台的新系统，而是一个**受控能力层**。它只做五件事：登记合法来源、形成可审计研究条目、把已审查的发现映射为既有资源/策略/测试资产、保存其证据与版本、对当前 Family 服务提供受限的检索和提案。

它**不拥有**家庭事实、儿童画像、成长诊断、服务完成、账户权限、同意状态或课程资产的 canonical 真相。这些继续分别归 Family Core、Growth OS、Principal、Program Runtime、Content/Resource、IAM/Consent、Audit 和未来 Service/Delivery 域。

## 2. 既有资产是唯一基座

| 已有 Family 资产 | 继续拥有的 canonical 语义 | 受控研究记忆学习层的接入方式 | 明确禁止 |
|---|---|---|---|
| Family Core：families/persons/relationships | 家庭、儿童、关系、成员与基础事实 | 只读取最小 family scope；不复制家庭档案 | 新建第二套 Family/Person/Profile 表 |
| IAM + FamilyScopeGuard + role matrix | Account→binding→membership→family context、角色与 Named Action | 所有读取/写入由 trusted `FamilyAuthContext` 与 purpose 驱动 | 信任客户端 family/actor；另建账号与权限系统 |
| Consent | 服务、AI、跟踪、研究等用途授权与撤回 | 研究或模型使用必须引用既有 consent；新增用途需单独 Action/政策 | 用会员、支付、组织关系或服务同意替代研究/训练同意 |
| Growth OS + EvidenceSynthesisService | Perspective、Evidence、Observation、interpretive profile 与限制 | 将研究结果作为资源/策略证据，不把外部研究直接写成家庭事实 | 研究结论覆盖家庭观点；自动生成诊断或成长结论 |
| Principal + ai-gateway | 受控 AI provider、proposal、Human Gate、模型尝试审计、确定性默认 | 研究记忆可提供检索上下文/能力卡；Principal 仍决定 AI 运行边界 | 新建绕过 provider policy 的第二个模型网关或外部 AI 调用 |
| Program Runtime | 纯日程位置、活动投影；不拥有完成事实 | Program/课程可作为 ResourceOffer 的内容来源 | 由研究/记忆层判定 Program、服务或成长完成 |
| Content/榜样教育课程与练习 | 已有内容、训练营、SOP、IP 与批准引用 | 用 Resource Template、content ref、版本/适龄/风险/证据元数据接入 | 复制课程正文，或让公开资料替代已验证资产 |
| Audit / Outbox | 行动、操作者、版本、结果与事件留痕 | 记录来源登记、研究卡、评审、采用/回滚、检索与模型用途 | 无审计地自动修改策略、资源或核心数据 |
| 首条 Orchestration / ServiceCase | Need→Intent→Resource→Decision→Plan→Case→Follow-up | 只为 Resource eligibility、rationale、Human Gate 和最小上下文复用提供受控知识 | 直接越过家庭决定、资格门或 ServiceCase 写入执行结果 |

## 3. 新增的是“适配层”，不是平行系统

```text
Approved Sources / Authorized Bangyang Assets / Public Research
      ↓  (source registry, licence, provenance, evidence grade)
Research Card + Capability Card + Review Proposal
      ↓  (human review, policy/version, test fixture)
Existing Content / ResourceOffer / Policy / Service Playbook / Test Suite
      ↓  (existing eligibility, Family decision, ServiceCase, Audit)
Family Experience + Principal/Advisor Copilot
```

适配层仅需要以下新对象；它们都引用已有对象或外部来源，不能持有家庭 canonical：

| 新对象 | 功能 | 必须关联 | 不得持有 |
|---|---|---|---|
| `SourceRegistryEntry` | 白名单来源、许可、采集方式、抓取规则、保留期 | source owner、licence、review status | 家庭会话、儿童原始内容 |
| `ResearchArtifact` | 公开资料或授权资产的不可变引用/摘要 | source、hash、时间、证据等级 | 未授权复制的原文或第三方用户资料 |
| `CapabilityCard` | 把“行业机制”翻译为 Family 场景/对象/Action/反模式 | Evidence、现有 asset refs、risk review | 直接发布权限或 runtime 真相 |
| `AdoptionProposal` | 将能力卡提议为内容模板、ResourceOffer、Policy、Playbook、测试夹具 | reviewer、policy version、diff、rollback | 自动合并/自动部署能力 |
| `MemoryProjection` | 为 Principal/顾问/运营者提供可检索的已批准知识摘要 | approved Research/Capability/Content refs | 全量家庭数据、未经用途授权的个人记忆 |
| `LearningEvaluation` | 汇总去标识、用途受限的过程质量和人工评审 | existing audit/service facts、consent ref | 直接训练或自动改写模型/排序规则 |

## 4. 受控闭环

1. **搜集：** 只从来源登记册中的用户提供、授权或公开许可来源获取；默认人工触发，后续自动更新也只能产生待审条目。
2. **研究：** 每条研究产物附来源、哈希、时间、证据等级、适用范围、局限和版权/许可状态；企业主张不能升级为效果事实。
3. **记忆：** 研究记忆是版本化投影；家庭记忆继续由 Family Core/Growth OS/ServiceCase 以明确 purpose 管理。
4. **学习：** 只能形成 Capability Card 和 Adoption Proposal；不自动训练、重新排序、推断画像、修改资源资格或写入家庭 canonical。
5. **智能：** Principal/Advisor Copilot 只读取已批准的 Memory Projection，以 proposal 形式输出；仍需现有 provider policy、Human Gate、Family decision 与审计。
6. **采用：** 评审通过后，将能力沉淀为已有 Content Ref、ResourceOffer、Policy、Service Playbook 或 Test Fixture；每次采用有版本、diff、负责人和回滚策略。

## 5. 两类记忆严格分开

| 记忆类型 | 所属资产 | 访问边界 | 允许用途 |
|---|---|---|---|
| 平台能力记忆 | Source/Research/Capability/Policy/Content 元数据 | 内部 role + 审核状态 + licence | 提高资源质量、服务 SOP、测试与专家辅助提案 |
| 家庭服务上下文 | Family Core、Growth OS、Orchestration/ServiceCase、Audit | Family scope + purpose + consent + actor role | 支持该家庭的连续服务、回访与最小上下文复用 |

平台能力记忆不得反向识别、推断或营销家庭；家庭服务上下文不得在没有独立用途授权的情况下成为平台研究、模型训练或跨家庭推荐数据。

## 6. 逐步实现而非另起一套

| 步骤 | 在现有资产上新增什么 | 不新建什么 |
|---|---|---|
| 现在 | Capability Card、Resource Template、Policy/Test Fixture 目录；把榜样教育练习以 approved content ref 接入 Orchestration | 新知识库 SaaS、第二个 AI Gateway、第二套角色/权限 |
| 首条纵切后 | SourceRegistry、ResearchArtifact、AdoptionProposal 的内部管理域；接入 Audit 和 Principal 的受控检索 | 跨家庭记忆、自动爬虫、自动训练、自动发布 |
| 后续单独授权 | 可管理的白名单来源更新、研究评审工作台、指标评估、模型评估 | 任意网站抓取、未审自动同步、原始家庭数据训练、无人工升级的智能体 |

## 7. 不可突破的红线

平台不得以“自我成长”为名，绕过来源许可、儿童数据保护、家庭同意、专业资质、模型准入、Human Gate、架构授权或代码审查。任何能力若无法清楚说明其来源、用途、最小数据、审核者、版本和回滚方式，就不能被平台记忆、学习或采用。

## 参考

[1]: `architecture/FAMILY_CAPABILITY_LEARNING_SYSTEM_V1.md`
[2]: `architecture/BANGYANG_EDUCATION_ASSET_PRESERVATION_AND_RESOURCE_ADMISSION_V1.md`
[3]: `architecture/FAMILY_GROWTH_VERTICAL_SLICE_001_IMPLEMENTATION_PLAN.md`
[4]: `apps/api/src/modules/family/evidence-synthesis.service.ts`
[5]: `apps/api/src/modules/principal/principal.module.ts`
[6]: `packages/program-runtime/src/program-runtime.ts`
