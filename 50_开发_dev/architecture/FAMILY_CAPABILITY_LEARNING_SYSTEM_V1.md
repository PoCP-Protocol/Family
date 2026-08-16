# FAMILY 能力学习与安全吸收机制 V1

```text
DOC_KIND       = CAPABILITY_LEARNING_GOVERNANCE_MEMO（非 SSOT、非 runtime 授权）
STATUS         = DRAFT_FOR_ARCHITECT_REVIEW
PURPOSE        = 将业界成熟平台、公共服务与榜样教育资产的可证实机制，转化为 Family 可审查、可测试、可撤回的能力
DATA_BOUNDARY  = 不采集/复制第三方私有数据、用户数据、源代码、课程内容或受版权保护的材料；仅使用合法公开资料、授权内容与 Family 自有数据
```

## 1. 原则：学习机制，不复制业务外壳

Family 学习的单位不是“某家公司”或“一个功能截图”，而是一个可以被验证的**能力机制**。例如，学习海底捞不是复制即时补偿，而是学习“基础红线不可突破、服务过程有人负责、异常可恢复、经验可复盘”；学习字节不是复制无限 Feed，而是学习“反馈可记录、实验可回滚、推荐能解释”；学习贝壳不是复制佣金，而是学习“角色—任务—贡献—标准—争议处理”的协作结构。

任何能力必须通过 Family 的三重过滤：**孩子最佳利益、家庭主权与数据最小化；服务安全和专业范围；V3 真相/权限/阶段纪律。** 不通过则只记录为反模式，禁止进入产品或运营策略。

## 2. 能力学习闭环

```text
外部证据/榜样教育资产
→ Capability Card（主张、场景、机制、证据、反模式）
→ Family Fit Review（儿童/家庭/专业/数据/商业/架构六维审查）
→ Capability Contract（对象、Action、Policy、指标、Human Gate）
→ Sandbox Fixture（合成数据、确定性规则、失败案例）
→ Internal Verification（单元/API/E2E/审计/人工评审）
→ Controlled Adoption（内部开关、版本、回滚、观察）
→ Service Learning（只用已授权最小过程信号）
→ Retain / Adapt / Retire
```

## 3. Capability Card 标准

每张能力卡必须完整回答以下问题；未填写即不得进入实现排期。

| 字段 | 必填内容 |
|---|---|
| capability_id / version | 稳定标识、版本与变更原因 |
| 来源与证据等级 | 原始公开材料、研究/规范、授权资产；区分已证实事实、企业主张和待验证假设 |
| 原始机制 | 该平台/实践真正解决的任务、对象、流程与约束，不使用营销词替代 |
| Family 场景 | 哪一个孩子/家长/家庭成长需要或服务问题被改善 |
| Family 翻译 | 映射到 Resource、Policy、Action、ServiceCase、Projection、指标或运营 SOP |
| 不可迁移部分 | 侵犯家庭主权、操纵增长、诊断越界、专业资格不足、商业利益冲突或阶段不符的部分 |
| 数据与隐私 | 最小字段、用途、保留期、访问者、儿童权利、撤回/删除和禁止二次用途 |
| 人工责任 | 谁批准、谁执行、谁复核、何时升级、何时停止自动化 |
| 测试夹具 | 正常、拒绝、跨家庭、撤权、低置信、高风险、回滚、可解释性测试 |
| 指标 | 过程质量、家庭主观帮助感、风险与信任、业务连续性；不得将参与/留存伪装为成长结果 |
| 授权状态 | RESEARCH / DESIGN_APPROVED / INTERNAL_ONLY / PILOT / PRODUCTION / RETIRED |

## 4. 能力证据等级

| 等级 | 证据 | 可用于什么 | 不可用于什么 |
|---|---|---|---|
| E0 | 宣传、案例、未核验媒体叙事 | 启发研究问题 | 产品效果或安全结论 |
| E1 | 企业官网、年报、公开产品文档 | 识别实际产品机制与公开边界 | 推断因果效果或所有生产细节 |
| E2 | 公共机构指南、标准、专业协会规则 | 定义安全、隐私、专业边界 | 替代本地法规或个案判断 |
| E3 | 同行评议研究、系统综述、独立评估 | 支持适用范围内的产品假设 | 向不同人群/文化/场景无限外推 |
| E4 | Family 自己经过授权、预注册且独立复核的验证 | 内部能力决策与持续改进 | 对外承诺孩子/家庭因果结果，除非研究设计足够支持 |

## 5. 行业能力库的初始条目

| 来源 | 要沉淀的能力 | Family 翻译 | 反模式 |
|---|---|---|---|
| 榜样教育 | 训练营、家长/家庭练习、顾问 SOP、内容/IP、长期陪伴 | ResourceOffer、approved Practice、Program Resource、Steward playbook、Evidence-bound report | 课程成交/打卡/续费自动等于成长结果 |
| Good Inside / ParentText | 家长问题入口、短内容、脚本、提醒、分层人工支持 | Parent-first Intent、低风险 Practice、Follow-up、Human Gate | AI/教练替代医疗、心理或危机服务 |
| Kinedu / Lovevery | 分龄场景化活动、多照护者参与、进度可视化 | age/scope、共享家庭任务、服务/练习投影 | 里程碑/完成率变成诊断、比较或儿童排名 |
| Brightline | 专业分层、照护协调、健康数据权利 | QUALIFIED_EXPERT/EXTERNAL_REFERRAL、purpose-scoped access、人工责任 | 将一般教育平台医疗化或跨越资质边界 |
| Palantir | Object—Logic—Action—feedback、proposal、人机协作、审计 | V3 七种真相、Named Action、Human Gate、可追溯决策 | 通用对象引擎、无限数据连接、AI 直接写入 |
| 拼多多 | 需求聚合反向组织供给 | 匿名且同意受限的未来 DemandCluster、Resource Capacity | 砍价裂变、公开家庭困境、以商业热度决定帮助 |
| 字节 | 反馈、实验、可解释分发 | 低风险反馈、版本化 Policy、受控实验、可关闭个性化 | 无限 Feed、时长优化、儿童脆弱性驱动推荐 |
| 海底捞 | 服务标准、有限授权、服务恢复 | ServiceCase、SLA、Recovery、role-bound action | 未经同意的主动触达、操纵性补偿、情绪劳动竞赛 |
| 贝壳 | 跨角色协作、任务贡献、服务标准 | FGCN role/task/contribution、未来 AccessGrant | 佣金抢单、组织成员默认读家庭数据、黑箱评分 |

## 6. 从能力卡到平台资产

通过审查的能力必须进入以下至少一个可版本化资产，而不是留在研究报告中：

1. **Resource Template：** 内容、练习、Program、真人服务或外部转介的准入模板。
2. **Policy Template：** eligibility、风险、同意、专业资格、数据用途、推荐解释和停止条件。
3. **Action Template：** actor、family scope、purpose、precondition、idempotency、side effect、audit event、reversal。
4. **Service Playbook：** Steward、顾问或助教的分流、跟进、恢复、升级与复盘 SOP。
5. **Test Fixture：** 合成家庭、正常/拒绝/撤权/跨家庭/高风险/低置信场景及预期输出。
6. **Metric Contract：** Delivery Quality、Family Perceived Value、Risk & Trust、Business Continuity 分域指标。
7. **Module Boundary：** 模块责任、输入输出 DTO、最小事件和未来可拆服务边界。

## 7. 数据与模型学习的红线

- 不从第三方平台抓取、复制或训练其私有课程、用户档案、社区内容、代码或受版权保护材料。
- Family 自身会话、儿童信息、服务过程、帮助感与观察只能按明确用途、最小字段、保留期限和可撤回授权使用。
- `MODEL_IMPROVEMENT` 需要独立同意；服务同意、付款、订阅或组织服务关系均不等于模型训练授权。
- 不将家庭困难、高风险、儿童行为或关系冲突用于广告、裂变、商业排序或跨家庭画像。
- 任何学习型/个性化模型在当前阶段只能生成低风险 proposal；不得自动作出诊断、处罚、资格、转介、支付或高影响家庭决定。

## 8. 治理与节奏

每一个新能力采用：**研究卡 → 设计审查 → 内部合成夹具 → Internal-only 验证 → 单独授权的受控采用**。不允许以“竞品已有”“增长机会大”“业务紧急”跳过儿童安全、家庭同意、专业资格、数据保护、可解释性、人工责任或测试门禁。

首条 V3 Vertical Slice 将首先把该机制落为四项资产：亲子沟通 Practice 的 Resource Template、确定性 Eligibility/Ranking Policy、ServiceCase/Follow-up Action Template，以及正常—撤权—跨家庭—风险升级的 Test Fixture。其余能力按 V3 Phase 和独立授权进入。

## 参考

[1]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md`
[2]: `architecture/BANGYANG_EDUCATION_ASSET_PRESERVATION_AND_RESOURCE_ADMISSION_V1.md`
[3]: `/home/ubuntu/family-platform-research/全球儿童与家庭成长平台对标研究_2026-08-16.md`
[4]: `/home/ubuntu/family-platform-research/Palantir方法对Family的适配原则_2026-08-16.md`
[5]: `/home/ubuntu/research_operating_models_for_family.json`
[6]: https://www.unicef.org/innocenti/reports/policy-guidance-ai-children "UNICEF Guidance on AI and children"
