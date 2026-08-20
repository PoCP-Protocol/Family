# 34 UI Shared Research and Needs Analysis 001

## 1. Executive verdict

本报告完成了 **Phase B 的共享研究与需求分析底座**，但不等于 34 个 UI 已完成逐页 BA Design、Architect Review、API Contract 或代码开发。

```text
PHASE_B=COMPLETE_AS_SHARED_RESEARCH_BASE
PHASE_C_DOCUMENT_PREPARATION=ALLOWED
PHASE_C_API_CONTRACT=NO_GO
PHASE_C_CODE=NO_GO
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

Phase C 只能在本报告基础上逐页补齐 Research/Needs、BA Design、Visual Fidelity Brief、Architect Review、Blocking Questions 和 API Contract 前置材料；任何页面若证据、Consent、Human Gate、视觉 baseline 或对象语义未闭合，必须保持 `NEEDS_RESEARCH_REVIEW` 或 `NO_GO`。

## 2. Evidence boundary

本项目所有材料都必须按证据类型使用，而不是按材料名称或叙事强度使用。

| 类型 | 允许的含义 | 不允许的越界 |
|---|---|---|
| Fact | 可追溯、可复核的 Family SSOT、工程代码、数据库 schema、测试结果或明确来源事实 | 不把宣传语、设计稿或 AI 输出当事实。 |
| Perspective | 家长、孩子、老师、顾问或家庭成员对事件的主观视角 | 不把单方视角写成家庭事实或诊断。 |
| Hypothesis | 研究待验证的需求解释、设计假设或材料启发 | 不把自家材料、榜样教育/波波校长叙事当成立证据。 |
| Recommendation | 规则、AI 或专业人员产生的候选建议 | 不直接写入核心 Ontology。 |
| Decision | 家庭/授权人员在明确上下文下作出的选择 | 不由推荐、按钮点击或模型自由文本自动代替。 |
| Action | 经过权限、Consent、Policy 和审计的 Named Action | 不用通用 PATCH 或 UI 事件绕过动作边界。 |

`30_素材_materials` 只读，优先使用 `30_素材_materials/_extracted/逐页文本_含页码/`；本研究不使用 `all_materials.txt` 作为主证据。自家材料、榜样教育和波波校长材料最高为 **E1**，只能作为 Hypothesis/Design Input，不能自证效果、诊断、资质、因果或专业有效性。

所有 UI 还必须区分：

```text
Read Projection → Controlled Draft → Named Action → External Effect
```

前两者不等于核心事实；Named Action 才能改变受控业务状态；支付、通知、预约占座、真人联系、外发分享、视频/日历等 External Effect 必须经过 Adapter 与 Human Gate，DEV/TEST 只能 no-op 或 synthetic stub。

## 3. Shared user journey

Family 的共享主旅程不是菜单顺序，而是以下可追溯闭环：

```text
Family Context / LifeStage
→ Onboarding / Assessment
→ Child + Parent + Relationship Growth Profiles
→ Growth Priority
→ Recommendation / Intervention Draft
→ Family Decision
→ Named Action
→ Journey / Task / Reflection / Growth Event
→ Coach/Advisor Feedback
→ Family Review / Milestone / Outcome
→ Next Growth Journey
```

该旅程覆盖八类共同能力：家庭上下文；成长计划；任务执行；反馈复盘；报告与解释；家校/顾问/专家协同；会员与服务；社群陪跑。90 天成长设计被视为共同成长的 **设计假设**，而不是 90 天效果承诺。

Family 方法论明确三条成长主线：Child Growth、Parent Second Growth 和 Relationship Growth。12–15 岁 90 天设计可按 `SEE (Day 1–14) → PARENT_FIRST (Day 15–35) → CO_CREATE (Day 36–60) → STABILIZE (Day 61–90)`组织，但每个阶段需要后续 BA、教研和专业评审，不得直接从页面数字生成事实或任务。

## 4. Roles and permissions

| 角色 | 主要需要 | 允许的默认边界 |
|---|---|---|
| 家长/监护人 | 看见家庭上下文、理解建议、选择可执行的小行动、回顾成长 | 只能在 family scope 和有效 Consent 下读写；核心状态经 Named Action。 |
| 孩子 | 参与自己的成长目标、表达视角、选择适合自己的行动 | 不应被当作被改造对象；敏感场景和监护范围需 Human Gate。 |
| 老师/教练/助教 | 在授权范围内提供陪跑反馈和服务记录 | 只读/写被授权的服务对象，不得把观察直接写成家庭事实。 |
| 顾问/专家 | 依据 Profile、Journey 和 Evidence 提供专业服务 | 专业判断需来源、版本、审计和必要人工复核。 |
| 运营/管理 | 配置内容、Journey、权益、服务和质量规则 | 不得越过家庭 Consent、个体权限或审核状态。 |
| 系统/AI | 检索、解释、摘要、建议、草稿和风险提示 | 必须经 Model Gateway；不能自由文本直写 Ontology、Profile、Journey、Task 或 Outcome。 |

## 5. Shared object model candidates

| 对象 | 作用 | 事实/投影边界 |
|---|---|---|
| `FamilyContext` | family_id、成员、LifeStage、关系和当前上下文 | 服务端派生的 scope projection。 |
| `ChildGrowthProfile` | 孩子在某 LifeStage/时间窗口的动态状态 | 版本化状态；不能由 AI 直接写入。 |
| `GrowthPlan` | 阶段计划/90 天 Journey 的受控对象 | 首轮由 `PlanDraft` projection 表达，正式状态需 Decision/Named Action。 |
| `GrowthTask` | 计划下的现实行动 | 由后续受权 Action 创建/变更；展示状态不等于真实完成。 |
| `Reflection` | 家庭成员对行动/事件的视角记录 | Perspective，不自动升格 Fact。 |
| `Assessment` | 结构化入组/基线采集 | 需要 consent、版本、解释边界和复测规则。 |
| `Report` | 对 Assessment/Evidence 的解释性输出 | Recommendation/Explanation，不等于诊断事实或总分。 |
| `TeacherSupply` | 受控 Provider/Offering/Availability 供给 | 只读 projection；不表示老师优劣或推荐排名。 |
| `ServiceOrder` | 服务/会员/交易引用 | Commerce 外部系统可为真相，Family 保存必要引用；支付/退款需 Adapter。 |
| `CommunityThread` | 家庭/社群内容和互动 | 需要隐私、审核、Consent 和外发边界。 |
| `ConsentGrant` | purpose、subject、actor、scope、version、撤回状态 | 缺失或撤回必须 fail-closed。 |
| `HumanGateReview` | 高风险、儿童、敏感建议、真人服务和外部 effect 的人工复核 | 不是装饰性审批；必须留下审计和拒绝/升级路径。 |

Family Core 的 SSOT 是 `Object + Link + State + Event + Decision + Action + Outcome`，不是 Generic CRUD。核心状态禁止任意 Patch；正确的 AI 路径是：

```text
Evidence → AI Recommendation → Schema Validation → Policy/Human Gate → Named Action → New Version + Event/Audit
```

## 6. Read Projection / Named Action / Gate matrix

| UI/能力类型 | 默认实现层级 | 可读内容 | 受控 Action | 必须 Gate 的情况 |
|---|---|---|---|---|
| 首页、家庭摘要、会员/订单、服务记录 | Read Projection | FamilyContext、Entitlement、ServiceRecord 等已授权投影 | 仅导航或提出候选 | scope、Consent、敏感成员数据。 |
| Assessment、Report、Growth Insight | Read Projection + Controlled Draft | 题目、作答、证据、解释和建议草稿 | `StartAssessment`、`SaveAssessmentDraft` 等经批准动作 | 儿童数据、诊断暗示、高风险建议、复测。 |
| Growth Plan、Journey、Task | Controlled Draft → Family Decision | plan draft、阶段、任务候选和版本 | `ProposeFamilyDecision`、`ConfirmGrowthPlanDecision`、后续 `Create/Amend/Pause` | 缺 provenance、Consent、actor、版本冲突或敏感干预。 |
| Service Supply、Teacher Detail | Read Projection | Provider、Offering、Availability 摘要 | Booking draft 或 `RequestService` 候选 | 真实联系、占座、预约、支付、真人服务。 |
| Community、Publish、Dynamic | Controlled Draft | 草稿、私有回显、审核状态 | `PublishPost`、`Comment` 等 Named Action | 未成年人、公开外发、媒体、审核和 Consent。 |
| Commerce、Membership、Invite、Group Buy | Read Projection + Intent Draft | 商品、权益、订单状态 | Commerce intent / order action | 支付、库存、邀请通知、权益发放、退款。 |
| Child Assistant、Ranking、Poster/Share | Read/Controlled Draft only | 解释、个人历史、合成海报草稿 | 需另行批准的 Action | 儿童高风险、Ranking/Total Score、外发分享。 |

## 7. Model Gateway boundary

业务代码不得直接绑定模型厂商。统一路径为：

```text
Application → AI Orchestration → Model Gateway → Provider Adapter
```

Model Gateway 负责路由、Provider 抽象、重试/超时、成本、数据策略、版本和评测状态。Agent Runtime 必须经过 Context Builder、Family Ontology Context、Knowledge Retrieval、Structured Recommendation、Schema Validation、Policy/Safety Check、Human Gate、Named Action API、Event/Audit。

AI 只允许生成解释、摘要、候选建议、结构化草稿和风险提示；不能直接写 `GrowthProfile`、Family、Journey、Task、Intervention、Outcome 或其它核心 Ontology。Chat Memory 不等于 Family Truth；任何聊天内容进入正式 Growth State 都必须经过 Evidence 与 Action 流程。

## 8. 90-day growth design hypotheses

以下是待验证的设计假设，不是效果承诺。指标是后续研究/评测指标候选，不是当前事实。

| 阶段 | 设计假设 | 证据等级 | 待验证指标 |
|---|---|---|---|
| Onboarding | 先确认 Family Context、成员关系、LifeStage、使用范围和 Consent，降低过早诊断风险 | Family SSOT/规格为 E0；素材叙事为 E1 | 完成率、授权理解率、撤回/退出可用性、风险误报率。 |
| Baseline Assessment | 通过结构化题目和多成员视角建立初始 Perspective/Evidence，不产出家庭总分 | 规格对象模型 E0；素材为 E1 | 题目完成率、视角覆盖、证据可追溯率、未成年数据最小化。 |
| Weekly Plan | 将 Growth Priority 转换为可讨论的周计划草稿，而非自动执行计划 | 规格/90天设计为 E0/E1 混合；需专业确认 | 草稿可理解性、家庭确认率、撤回/调整率、建议与需求的匹配度。 |
| Daily Task | 每次只提出一件现实可执行的小行动，完成状态与 Outcome 分离 | 方法论/规格 E0 | 行动可执行率、记录完整性、未完成原因、非伤害性。 |
| Reflection | 记录家长、孩子和关系的视角，保留 Perspective 与不确定性 | 规格 E0；素材 E1 | 多视角覆盖、隐私理解、Perspective/Fact 分离率。 |
| Coach Feedback | 顾问/教练反馈作为受授权服务记录或建议，不自动写 GrowthProfile | 规格 E0；服务素材 E1 | 反馈及时性、专业复核率、升级率、错误纠正率。 |
| Family Review | Day14/35/60/90 形成阶段复盘和 Milestone 候选，不直接证明因果效果 | 规格 E0；业务材料 E1 | 复盘完成率、Evidence 引用率、家庭理解度、错误/争议修正。 |
| Report Milestone | 报告展示 evidence-linked explanation 和下一步候选，不显示 Family Total Score/Ranking | 规格 E0 | 解释可理解性、来源可追溯性、误解率、Human Gate 命中率。 |

## 9. 34 UI grouping needs matrix

| 分组 | UI | 目标 | 数据需求 | 动作需求 | 风险 | 后端依赖 |
|---|---|---|---|---|---|---|
| Core / Family Home | UI-01、UI-06、UI-07 | 家庭入口、上下文、会员/我的 | FamilyContext、Person、Consent、Entitlement | 入口导航、Assessment draft、受控设置 | scope、儿童数据、错误推荐 | Family Core、Consent、Projection Service。 |
| Assessment / Report | UI-02、UI-03、UI-04、UI-08 | 测评、解释、报告、计划草稿 | Assessment、Evidence、Perspective、Report、PlanDraft | Start/Save/Propose/Confirm 候选 | 诊断暗示、总分、Recommendation 越权 | Assessment、Model Gateway、Evidence、Human Gate。 |
| Growth / Journey | UI-05、UI-09、UI-10、UI-11、UI-12 | 90 天计划、任务、儿童助手、成长展示 | GrowthPlan、GrowthTask、Reflection、Milestone、Outcome | FamilyDecision、Task action、Reflection draft | 儿童风险、Ranking/Total Score、外发海报 | Journey/Task、Policy、Media Adapter。 |
| Commerce / Membership | UI-13–UI-18、UI-30、UI-32 | 商品、邀请、拼团、积分、会员、资产 | Product、OrderRef、Membership、Entitlement、Referral | Commerce intent、Order/Invite/Group action | 支付、库存、通知、权益和退款 | Commerce Adapter、Entitlement、Audit。 |
| Service / Human | UI-19–UI-24、UI-31、UI-34 | 供给、老师、预约、活动、服务记录 | Provider、Offering、Availability、Booking、ServiceRecord | Request/Booking/Cancel/Record candidate | 真人服务、占座、通知、视频、日历 | Service Supply、Scheduling、Human Gate、Adapters。 |
| Community / Evidence | UI-25–UI-29 | 家长社区、发布、动态、成果 | CommunityThread、PostDraft、Evidence、OutcomeCase | Publish/Comment/Share Named Action | 未成年、公开外发、审核、因果暗示 | Community、Moderation、Media/Share Adapter。 |
| Family / Admin | UI-33 | 家庭档案和授权上下文 | Family、Person、Relationship、ConsentGrant、Audit | Update profile/consent candidate | 敏感家庭数据、越权成员读取 | Family Core、Consent、Authorization、Audit。 |

## 10. 34 UI coverage matrix

| UI | 共享需求主题 | 主要对象/证据 | 当前 Needs Status | Phase C 前置项 |
|---|---|---|---|---|
| UI-01 | 家庭入口、上下文、成长旅程导航 | FamilyContext、Person、Journey、Evidence | `NEEDS_RESEARCH_REVIEW` | BA、视觉、Architect、Projection boundary。 |
| UI-02 | 测评入口与基线采集 | Assessment、Consent、Perspective | `NEEDS_RESEARCH_REVIEW` | 题目/量表来源、儿童 scope、复测规则。 |
| UI-03 | AI 诊断报告解释 | Report、Evidence、Recommendation | `NEEDS_RESEARCH_REVIEW` | 禁止诊断事实/总分、Gateway schema、Human Gate。 |
| UI-04 | 报告到计划草稿 | Report、PlanDraft、FamilyDecision candidate | `NO_GO` | BQ、provenance、Decision boundary。 |
| UI-05 | 90 天陪跑/社群计划 | GrowthPlan、Journey、Consent | `NO_GO` | Research/Needs、BQ、视觉和对象语义未完全闭合。 |
| UI-06 | 会员/我的服务关系 | Membership、Entitlement、FamilyContext | `NEEDS_RESEARCH_REVIEW` | BA、服务权益语义、视觉复核。 |
| UI-07 | 成长测评入口 | Assessment、Consent | `NEEDS_RESEARCH_REVIEW` | 入口与 UI-02 的职责分界。 |
| UI-08 | 成长报告展示 | Report、Evidence | `NEEDS_RESEARCH_REVIEW` | 报告字段、来源、误读风险。 |
| UI-09 | 今日任务/打卡 | GrowthTask、GrowthEvent | `NEEDS_RESEARCH_REVIEW` | task action、完成不等于 Outcome、撤回。 |
| UI-10 | 儿童成长助手 | ChildGrowthProfile、Reflection、Model Gateway | `HUMAN_GATE_REQUIRED` | 未成年人、自治等级、家长/孩子可见性。 |
| UI-11 | 成长排行榜视觉入口 | Personal history projection | `HOLD` | 先确认禁止 Ranking/Total Score 的替代需求。 |
| UI-12 | 成长海报/成果分享 | Milestone、OutcomeCase、Media | `EXTERNAL_EFFECT_HOLD` | 证据、隐私、外发分享和文案 allowlist。 |
| UI-13 | 商城首页 | Product、Offering、Entitlement | `NEEDS_RESEARCH_REVIEW` | 商品与成长干预边界、商业化证据。 |
| UI-14 | 商品详情 | Product、Commerce Intent | `EXTERNAL_EFFECT_HOLD` | 支付/订单 Adapter、无真实支付。 |
| UI-15 | 邀请有礼 | Referral、Reward | `EXTERNAL_EFFECT_HOLD` | 邀请通知、权益和反滥用策略。 |
| UI-16 | 拼团 | Group、OrderRef、PaymentRef | `EXTERNAL_EFFECT_HOLD` | 订单/库存/支付/通知边界。 |
| UI-17 | 积分任务 | Entitlement、GrowthTask | `NEEDS_RESEARCH_REVIEW` | 积分规则、权益事实与任务事件。 |
| UI-18 | 会员中心 | Membership、Entitlement | `EXTERNAL_EFFECT_HOLD` | 续费、退款、权益变更 Adapter。 |
| UI-19 | 名师供给列表 | TeacherSupply、Offering、Availability | `RESEARCHED_SLICE_NEEDS_VISUAL_DIFF` | 供给证据、筛选语义、只读 projection、截图。 |
| UI-20 | 名师详情 | Provider、Offering | `NEEDS_RESEARCH_REVIEW` | 资质证据、评分禁止排名、Booking draft。 |
| UI-21 | 咨询预约 | Availability、Booking、Consent | `EXTERNAL_EFFECT_HOLD` | 预约/占座/通知/支付 Human Gate。 |
| UI-22 | 沙龙列表 | Activity、Event、Availability | `NEEDS_RESEARCH_REVIEW` | 活动来源、日历/视频 Adapter。 |
| UI-23 | 活动详情 | Activity、Registration draft | `EXTERNAL_EFFECT_HOLD` | 报名、通知、视频和真人交付。 |
| UI-24 | 我的服务 | Booking、ServiceRecord | `NEEDS_RESEARCH_REVIEW` | 服务状态和过程/Outcome 区分。 |
| UI-25 | 家长社区 | CommunityThread、Consent | `NEEDS_RESEARCH_REVIEW` | 社区规则、审核、隐私和儿童风险。 |
| UI-26 | 发布动态 | PostDraft、Media、Moderation | `HUMAN_GATE_REQUIRED` | 发布 Named Action、审核、外发。 |
| UI-27 | 动态详情 | Post、Comment、Evidence | `NEEDS_RESEARCH_REVIEW` | 互动/证据/公开范围。 |
| UI-28 | 我的社区 | PrivateThread、Consent | `NEEDS_RESEARCH_REVIEW` | 私有可见性、撤回和删除。 |
| UI-29 | 成长成果 | OutcomeCase、Evidence、Milestone | `NEEDS_RESEARCH_REVIEW` | 不把成果展示写成因果效果。 |
| UI-30 | 年度会员中心 | Membership、Entitlement | `EXTERNAL_EFFECT_HOLD` | 续费、退款、会员服务关系。 |
| UI-31 | 我的服务 | ServiceCase、ServiceRecord | `NEEDS_RESEARCH_REVIEW` | 真人服务记录和支持请求。 |
| UI-32 | 订单与资产 | OrderRef、Entitlement、Asset | `EXTERNAL_EFFECT_HOLD` | 支付/退款/下载/外发 Adapter。 |
| UI-33 | 家庭档案 | Family、Person、Relationship、Consent | `HUMAN_GATE_REQUIRED` | 儿童敏感数据、成员权限、审计。 |
| UI-34 | 服务记录 | ServiceRecord、Outcome | `NEEDS_RESEARCH_REVIEW` | 过程记录不等于 Outcome，来源和纠错。 |

## 11. Phase C input checklist

每个 UI 进入 Phase C 前必须单独补齐以下材料：

| 产物 | 必须回答 |
|---|---|
| Research / Needs Analysis | 真实场景、角色、User/Business/Operational/Compliance/Data/AI Need、证据等级、待验证项。 |
| BA Design | 页面目标、对象、状态机、数据来源、读写边界、异常态和 Outcome。 |
| Visual Fidelity Brief | 原图路径、尺寸、布局、文案、组件、颜色、间距、热点和状态清单。 |
| Architect Review | Domain SSOT、对象、投影、Action、Consent、Human Gate、Model Gateway、Ontology Adapter、FE/BE 一致性。 |
| Blocking Questions | 每个未决问题、为什么阻塞、Decision Authority、选项、推荐默认值、影响和后续产物。 |
| API Contract | 仅在前置问题闭合后定义 DTO、projection、Named Action、错误态、审计、幂等、correlation_id 和 fixture。 |
| Acceptance | API/unit/contract、Web/route、DB/read model、Consent/policy、Playwright desktop/mobile screenshot diff、修复记录。 |

## 12. Blockers

当前不得进入 34 UI API/代码开发的共享阻塞项为：

1. 34 页仍没有完整、可归属、可复核的运行后截图和 pixel diff artifact。
2. 部分单页图像与 global UI ID 的映射仍需人工确认，缺失或冲突页面不能猜测。
3. 各页面的 BA Design、Architect Review、Blocking Questions 尚未全部完成；共享研究底座不能替代逐页门禁。
4. Family/Person/Child/Consent/Service/Commerce 等对象虽有 SSOT 候选，但每个 UI 的 field-level DTO、scope、版本和状态机尚未逐页闭合。
5. 90 天设计中的效果、同龄比较、排行、敏感诊断和 AI 自动干预均存在合规风险，必须保持 Hypothesis/Recommendation 或 HOLD。
6. Model Gateway、Ontology Adapter、Human Gate、Audit、idempotency、correlation_id 和 external adapters 需要在每个纵切的 Contract Plan 中落地，不能由前端自由文本或 generic CRUD 代替。
7. UI-06、UI-01 等已有文档不能自动替代后续 UI 的研究证据；每页必须回到对应 baseline、规格和逐页材料。

## 13. Final Phase B decision

```text
PHASE_B=COMPLETE_AS_SHARED_RESEARCH_BASE
TOTAL_UI_COVERED=34
EVIDENCE_BOUNDARY_INCLUDED=YES
ROLE_MODEL_INCLUDED=YES
OBJECT_MODEL_INCLUDED=YES
READ_ACTION_GATE_MATRIX_INCLUDED=YES
PHASE_C_READY=NO_FOR_API_OR_CODE
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

下一步只能是按队列逐页补齐 Research/Needs、BA Design 和 Visual Fidelity，再由 Architect Review/Blocking Questions 决定是否进入 API Contract；本报告不构成任何人工裁决、不授权任何 API 或代码实现。

## References

1. `10_规格_spec/01_实施方法论/Family_FGAIM_实施方法论_V2.0.md`：Family 最高实施方法论，规定三条成长主线、证据、决策、动作和研发门禁。
2. `10_规格_spec/02_总体蓝图/Family_总体蓝图方案_V2.0.md`：Family Growth OS、六个平台、12–15 岁 90 天共同成长和产品边界。
3. `10_规格_spec/02_总体蓝图/Family_整体技术架构_V2.0.md`：Ontology、Model Gateway、Agent Runtime、Chat Memory/Family Truth、Consent 与安全边界。
4. `10_规格_spec/03_详细方案/Family_详细实施方案_V2.0.md`：业务架构、对象模型、服务/商业/AI平台和 90 天阶段设计。
5. `10_规格_spec/05_附件与研发规范/FGAIM_项目门禁与验收清单.md`：Definition of Ready/Done、架构评审、AI、安全和发布门禁。
6. `30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt`：E1 业务假设和设计素材，未作为成立证据。
7. `30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt`：E1 战略/产品设计素材，未作为效果或因果证据。
8. `30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt`：E1 平台构想素材，未作为业务有效性证据。
9. `reports/m2/frontend/FAMILY_34_UI_DEVELOPMENT_LEDGER_001.md`：Phase A 34 UI baseline、route、实现和截图台账。
10. `reports/m2/frontend/FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md`：34 UI 逐页研究需求前置队列。

[1]: ../../10_规格_spec/01_实施方法论/Family_FGAIM_实施方法论_V2.0.md
[2]: ../../10_规格_spec/02_总体蓝图/Family_总体蓝图方案_V2.0.md
[3]: ../../10_规格_spec/02_总体蓝图/Family_整体技术架构_V2.0.md
[4]: ../../10_规格_spec/03_详细方案/Family_详细实施方案_V2.0.md
[5]: ../../10_规格_spec/05_附件与研发规范/FGAIM_项目门禁与验收清单.md
[6]: ../../../30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt
[7]: ../../../30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt
[8]: ../../../30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt
[9]: ./FAMILY_34_UI_DEVELOPMENT_LEDGER_001.md
[10]: ./FAMILY_34_UI_RESEARCH_NEEDS_ANALYSIS_QUEUE_001.md
