# 榜样教育资产保留与 Family 资源准入 V1

```text
DOC_KIND       = ASSET_PRESERVATION_AND_RESOURCE_ADMISSION_MEMO（非 SSOT、非 runtime 授权）
STATUS         = DRAFT_FOR_ARCHITECT_REVIEW
PARENT         = architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md
PURPOSE        = 保留榜样教育已有有效资产，并将其安全地接入“成长需要什么，Family 就组织什么”的资源网络
DB_CHANGE      = 0
RUNTIME_CHANGE = 0
```

## 1. 核心裁决

榜样教育不应被 Family V3 “替换”。Family 的作用是将已有的课程、21 天挑战、90 天陪跑、家长顾问、助教 SOP、内容/IP、社群活动、专家咨询、成长档案和服务流程，从一次性产品或分散工具，重构为可被家庭授权、可资格审查、可按需组织、可追踪交付、可谨慎复用的资源和服务网络。

> **平台使命：以孩子最佳利益和家庭长期成长为中心。成长需要什么，Family 就在家庭授权、安全、专业边界内识别需要、组织资源、编排服务、完成交付、持续跟进，并让下一次服务不必从零开始。**

该使命不等于“平台一定提供所有东西”，而是：当平台自身不适合或不具资质时，`NO_ACTION` 和 `EXTERNAL_REFERRAL` 与课程、AI、真人服务一样是合格的服务结果。

## 2. 资产保留清单与 Family 归位

| 榜样教育已有资产 | 现有价值 | Family 中的资源/领域归位 | 首次准入条件 | 当前阶段 |
|---|---|---|---|---|
| 家长课程、直播、内容/IP、案例 | 形成信任、普及家庭教育知识、提供低风险方法 | `CONTENT` ResourceOffer；必要时作为 `PRACTICE` 的 approved content ref | 来源、作者/版本、适用年龄/情境、证据等级、风险边界、隐私与版权状态明确 | 可从 Phase2 逐步使用；不自动等于专业建议 |
| 21 天挑战、每日任务、打卡、陪练 | 将抽象方法转成短周期可执行练习 | `PRACTICE` 或条件化 `PROGRAM` ResourceOffer | 每个练习必须有 approved content ref、停止条件、风险升级规则；完成只表示交付事实 | Phase2 先用低风险 Practice；Program Delivery 归 Phase4 |
| 90 天家庭成长计划、长期陪跑 | 为重复需求提供长期服务结构 | `PROGRAM` ResourceOffer + 未来 Enrollment/Delivery Domain | 不得将 schedule projection 当 completion；需独立拥有开始、暂停、完成、取消与任务事实 | Phase4 之后；当前仅注册/条件化，不建 runtime |
| 家长顾问、班主任、助教 | 提供解释、提醒、反馈、服务恢复与人工兜底 | `HUMAN_COACH` / `Delivery Assistant` / `STEWARD` | 资质、范围、培训、角色权限、可见数据范围、Human Gate、SLA、申诉与审计明确 | Phase5–6；当前只保留角色与接口语义 |
| 专家咨询、研学、沙龙、活动 | 覆盖高价值/外部专业供给和线下支持 | `QUALIFIED_EXPERT` / `EXTERNAL_REFERRAL` / 未来 Provider Network | 专业资格、风险边界、Availability、外部服务免责声明、家庭显式选择 | 先 External Referral；Provider/预约在网络阶段授权后实现 |
| 亲子共同任务、家庭互动练习 | 连接孩子成长与父母成长，避免只改造一方 | `PRACTICE` + `FamilyServiceDecision` + Follow-up | 由家庭自愿选择；不强制儿童暴露隐私；不同成员可不同意或退出 | Phase2 可做低风险练习 |
| 顾问 SOP、质检、服务案例 | 将个人经验转为可复制交付质量 | 未来 `Family Steward` 的 policy、case template、recovery playbook | SOP 分为安全不变量、可配置参数、人工例外；案例去标识、经审核 | Phase6；当前可形成策略文件/测试夹具 |
| 成长档案、报告、反馈记录 | 支撑连续服务、复盘和家庭对过程的理解 | `ContextReuseProjection` + 未来 `Evidence-bound Progress Projection` | 服务事实、家庭主观帮助感、观察和结果假设分开；可见性、保留期、撤回/删除明确 | Phase2 最小 reuse；报告在后续独立投影实现 |
| 内容社群、城市活动、分享 | 形成支持网络、发现资源、扩大触达 | `Discovery/Community Resource`；未来 Community/Engagement | 仅发布经家庭明确同意的内容对象；不得让社区读取家庭 canonical | 后续独立 Community/tenancy Gate |
| 会员、服务包、订单权益 | 保留长期服务关系与未来商业模型 | 未来 `Family Account Asset` / `ServiceEntitlement` | Payment 不等于数据所有权或访问权；权益只参与资格判断，不参与资源排序 | 架构预留；支付/订单不进当前范围 |

## 3. 资源准入流程

任何已有榜样教育资产进入 Family，不因“既有产品”“名师”“高转化”而自动取得推荐或执行资格。它应通过同一条透明流程：

```text
资产盘点
→ ResourceOffer 描述（资源类型、能力、适用范围、风险、时长、成本级别）
→ Provider/内容来源与版本确认
→ 证据与质量说明（可为公开经验、专业指南或研究；明确等级和局限）
→ 儿童安全、隐私、专业范围、年龄与同意审查
→ Resource Eligibility Gate（按家庭、当下、用途）
→ Growth Fiduciary Ranking（仅在 eligible 集内）
→ 家庭决定
→ ServiceCase / Delivery
→ Follow-up 与可撤销的服务反馈
```

`Platform Revenue`、课程价格、历史转化、观看时长、裂变能力、顾问个人业绩均不得成为 Growth Fiduciary Ranking 信号。它们可以在经授权的经营分析中作为独立过程数据，但不可决定一个家庭“最应该得到什么帮助”。

## 4. 需要改写而非抛弃的既有能力

| 既有表述或资产方向 | Family 的改写方式 |
|---|---|
| AI 诊断、父母/孩子/家庭画像 | 改为 `GrowthNeedSignal`、家长显式 `GrowthIntent`、Perspective、Evidence 与经既有边界确认的 Observation；禁止疾病、人格、能力或未来预测诊断 |
| 测评作为低价入口 | Assessment Resource 继续 HOLD；可使用普通自我反思/需求澄清，不将分数当作资源资格或家庭价值判断 |
| 成长报告/结果交付 | 改为 Evidence-bound Progress Projection；分别展示服务事实、家庭帮助感、确认观察、不确定性和可选下一步，不承诺因果改善 |
| 任务完成率、续费、转介绍 | 作为 Delivery Quality/Business Continuity 指标，与 Growth Signals 分开；不包装成儿童成长结果 |
| 游戏化、积分、邀请奖励 | 仅未来在儿童权益、非操纵、透明选择和隐私隔离的独立 Gate 下审查；不得以焦虑、比较或公开家庭问题拉动参与 |
| 自动获客、自动成交、自动服务 | 改为可审计的内容触达、服务承接、低风险自动化与 Human Gate；不得绕过同意、资格、安全、专业边界或人工责任 |

## 5. 孩子中心与家庭中心的具体约束

孩子中心不是把孩子变成被持续测量和优化的对象；家庭中心也不是把监护人默认赋予无限的数据知情和决定权。平台应在每次服务中回答：

1. 这项资源是否在此刻符合孩子的安全、尊严、发展与最佳利益？
2. 家庭是否明确理解并选择了服务目标、可见范围和替代方案？
3. 是否存在更低风险、免费、无行动或外部专业转介的更合适选择？
4. 记录的是服务事实、家庭体验还是可确认的观察？系统是否错误地把它写成成长因果结论？
5. 服务完成后，家庭是否可以轻松暂停、撤回、解释、导出、更正或删除其数据？

## 6. 当前首条纵切的资产使用范围

首条纵切只使用**低风险、可解释、可撤销**的榜样教育资产：一份已审核的亲子沟通稳定/重新开启对话的 Practice 内容、确定性内部 AI Coach 的结构化反思提示，以及家庭可选择的后续回访。它不接入测评、长期计划、会员、支付、社群、积分、裂变、顾问市场、机构协作或外部真实模型。

## 参考

[1]: `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md` §§0–10
[2]: `architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md` §§1–18
[3]: `/home/ubuntu/upload/榜样教育战略白皮书_30页演讲汇报版.pptx`
[4]: `/home/ubuntu/upload/榜样教育新商业模式对外宣发PPT_原图版(2).pptx`
[5]: `/home/ubuntu/upload/家庭教育大模型平台科技公司项目合作方案.pptx`
[6]: `/home/ubuntu/analyze_education_materials.json`
[7]: `/home/ubuntu/family-platform-research/FAMILY_循证服务与儿童AI产品原则_V1.md`
