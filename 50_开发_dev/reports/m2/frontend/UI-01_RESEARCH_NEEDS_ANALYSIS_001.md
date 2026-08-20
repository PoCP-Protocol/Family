# UI-01 Research Needs Analysis 001

## 1. Scope

本文件只研究 UI-01 / F01 Family Home 的家庭教育场景、角色需求、平台对象和治理边界。它不是 API Contract，不是实现任务，也不授权修改 `apps/api`、`apps/web` 或 `database`。

UI-01 的研究目标不是把首页按钮逐个接 API，而是判断首页暴露的家庭成长入口如何归入共享平台子系统：Family Home Projection、Assessment、AI Explanation、Challenge/Camp、Growth Plan、Case/Evidence、Live Session、Advisor/Service Supply、Journey/Task、Consent/Auth、Model Gateway 和外部 Adapter。

## 2. Evidence and Research Method

### 2.1 Required research sequence

```text
Broad Research → Needs Analysis → BA Design → Visual Baseline → Contract Plan → FE/BE Implementation → Consistency Tests → Playwright Screenshot Diff → Fix Loop → Git Commit/Push
```

本轮只完成 Broad Research、Needs Analysis 和 BA/视觉准备，不进入 API Contract 或代码开发。

### 2.2 Source registry and evidence level

| Source | 用途 | 证据边界 |
|---|---|---|
| `apps/web/public/bangyang-reference/ui18/core-01-home.png` | UI-01 单图视觉基线，239×664 | 只证明可见画面结构、文案、图像、颜色、间距意图和热点，不证明后台能力。 |
| `FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md` | global_ui_id、业务域、PPT/单图映射 | 只证明页面映射与当前校准状态，不证明代码已实现。 |
| `UI01_FULL_EXPOSURE_SUBSYSTEM_DECOMPOSITION_001.md` | UI-01 46 个 Exposure Point、首页血缘和共享子系统方法 | 作为 UI-01 研究模板与既有血缘来源；不把内部分析当外部事实。 |
| `FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md` | UI-01 上下游、对象、API/Agent/Adapter 候选 | 作为研究候选和边界输入，不等于已实现能力。 |
| `30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt` | 家庭成长平台、父母第二成长、AI/顾问/社群/活动等业务假设 | 自家材料最高 E1，只能形成假设和设计素材，不能自证效果、诊断、资质或因果。 |
| `30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt` | 家庭关系、陪伴缺口、从课程到家庭成长和行为记录的业务假设 | 自家材料最高 E1；不能证明市场事实、教育效果或生产事实。 |
| `30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt` | 家庭教育对象、AI 边界和平台设计假设 | 自家材料最高 E1；只能作为需求假设和设计输入。 |
| `governance/FAMILY_34_UI_OBJECT_MODEL_AND_CONTRACT_DESIGN_001.md` | Family、Person、Need、Evidence、Consent、Decision、Plan 等对象边界 | 工程治理 SSOT；仍需与实际代码/契约核对。 |
| `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md` | UI-01 projection、Named Action 和动态等级候选 | 只作为治理映射，不代表已批准 API。 |
| `governance/FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md` | 前后端一致性和验收门禁 | 只作为准入规则，不代表当前页面已经一致。 |

严格遵守：`30_素材_materials` 只读；优先使用 `_extracted/逐页文本_含页码/`；不使用 `all_materials.txt`。

## 3. Broad Research Findings

### 3.1 Family education practice and growth scenario

现有材料将家庭教育场景描述为从“孩子问题”进入、由家长面对关系、陪伴、习惯、动力和长期成长问题，并希望形成可执行、可反馈、可持续的家庭成长过程。由于这些材料来自自家战略与业务讨论，它们在本文件中只能作为 **E1 需求假设**：可以帮助提出研究问题，不能证明“90 天能改善”“AI 能诊断”或某类服务有效。

UI-01 因此应被理解为一个家庭私有的起点：家长希望快速知道当前可以从哪里开始；孩子可能是关注对象，但不应被默认当作数据提供者或决定人；教师/顾问/服务者是后续供给角色，不应在首页被直接导购或自动联系。

### 3.2 Role and scenario research

| 角色 | 研究问题 | 当前可支持的假设 | 尚不能当作事实 |
|---|---|---|---|
| 家长/监护人 | 是否需要一个低负担入口来查看家庭上下文和下一步？ | 可能需要家庭私有总览和受控入口。 | 不证明所有家长都需要同一入口或同一计划。 |
| 孩子/被关注成员 | 如何保护其隐私、可见性和参与权？ | 需要最小化展示和 guardian/subject scope。 | 不允许由首页推断能力、情绪、风险或画像。 |
| 教师/服务者 | 如何成为受控供给，而不是首页直接推荐？ | 需要 Provider/Offering/Qualification 的独立子系统。 | 不证明某教师优劣、适配度或可预约事实。 |
| 家庭顾问/班主任 | 如何提供陪伴而不越过真人服务边界？ | 需要 service projection 和 Human Gate。 | 不允许首页自动联系、预约或通知。 |
| 平台运营/管理员 | 如何维护证据、权限、版本和审计？ | 需要 scope、Consent、Policy、Audit 和 projection metadata。 | 不允许以运营后台数据替代家庭事实。 |

### 3.3 Visual research findings

UI-01 原图显示：顶部为手机状态栏与“家庭成长平台”标题，右上有更多/系统入口；主体有问候文案；蓝色“免费家庭测评”Hero 横幅和家庭人物插画；下方是六个入口：AI诊断、21天挑战营、90天成长计划、成长案例、专家直播、家庭顾问；再下方为“今日成长任务”列表和“推荐内容/服务”卡片；底部为首页、计划、社群、我的四项导航。

上述内容是视觉观察，不是业务事实。原图中的按钮、数字、标签、人物图像和推荐卡必须先完整复刻，再研究如何接入动态 projection；不能用通用模板、重新设计或更现代化布局替代。

### 3.4 Platform and technical research

UI-01 的入口涉及多个共享子系统，但不应按六个卡片建设六套后端。核心共享对象候选包括 Tenant、Family、Person、Relationship、Membership、Consent、Assessment、ReportSnapshot、PlanDraft、Journey、Task、Evidence、Provider、Offering、Activity、Community 和 ServiceRecord。首页只应读取经过 scope、visibility、policy 和 provenance 过滤的 projection。

AI 相关能力只能经 Model Gateway：可以提供解释草稿、入口说明或问题整理，不能直接写 Family、Person、Need、Plan、Task、Outcome、Provider 资质或任何核心 Ontology。任何核心状态写入必须经过受控 Named Action；真正预约、支付、通知、直播、视频、分享和真人联系均属于 External Effect，当前 HOLD。

## 4. Needs Analysis

| Need Type | UI-01 初步需求理解 | 需求状态 |
|---|---|---|
| User Need | 家长/监护人需要看懂家庭当前上下文，并从一个低负担首页进入测评、解释、计划、任务或受控服务供给。 | Perspective + Hypothesis，需研究验证。 |
| Business Need | 平台希望以家庭成长旅程组织入口，而不是孤立课程/商品按钮。 | E1 业务假设，不能自证商业效果。 |
| Operational Need | 首页需要一个家庭范围、版本化、可过期、带来源和权限状态的 `FamilyHomeProjection`，并能表达 loading/empty/error/permission/consent blocked。 | 需求候选，未形成 API Contract。 |
| Compliance Need | tenant/family/actor/subject 必须服务端派生；儿童资料、AI 解释、服务供给和外部动作必须 purpose-limited Consent/Human Gate；撤回后 fail-closed。 | 治理要求，待逐项契约化。 |
| Data Need | 需要 Family、Person、Relationship、Membership、Consent、ProjectionMetadata 和各共享子系统入口状态；不应把推荐、草稿或摘要写成家庭事实。 | 数据需求候选，需 SSOT/代码核对。 |
| AI Need | AI 只做解释、摘要、问题整理或入口辅助；必须经 Model Gateway、schema validation、policy 和审计，不能自由文本写核心 Ontology。 | 治理边界已明确，具体能力待 BA/架构评审。 |

## 5. Semantic Boundary Register

| 语义层 | UI-01 允许表达 | UI-01 禁止表达 |
|---|---|---|
| Fact | 已由受控来源确认的 Family/Person/Consent/Plan/Task 状态投影，并带 source/version/visibility/as_of。 | 从图片、模型文本、业务宣传或推荐卡推断出的家庭事实。 |
| Perspective | 家长或家庭对当前问题的自我描述和页面视角。 | 把个人视角升级为平台诊断。 |
| Hypothesis | “家庭可能需要低负担入口”“某类内容可能帮助理解”等待验证设计假设。 | 把 E1 材料或自家案例写成效果证明。 |
| Recommendation | 页面可展示的内容/服务入口建议或 AI 解释草稿。 | 自动成为 Family Need、Plan、Provider 评价或行动。 |
| Decision | 由有权限的家庭监护人通过明确流程做出的受控决定。 | 点击卡片、浏览页面或 AI 输出自动成为决定。 |
| Action | 经注册、授权、幂等、审计和可撤回策略保护的 Named Action。 | 自由文本、普通导航或推荐直接写核心状态。 |

## 6. Dynamic Level and Object Boundary

| Level | UI-01 可研究的能力 | 当前结论 |
|---|---|---|
| L0 | 完整静态画面、文案、路由、可见状态 | 可进入视觉复刻准备。 |
| L1 | `FamilyHomeProjection` 只读：家庭摘要、入口状态、来源/版本/权限/空态 | 需要 BA/架构确认 projection 字段。 |
| L2 | 受控解释草稿、入口意向或受限 draft | 需要 Model Gateway/Consent/Policy；不写核心事实。 |
| L3 | 未来 `SelectHomeContext` 等 Named Action | 仅作为候选，需 action registry、权限、幂等、审计和人工确认。 |
| L4 | 预约、通知、支付、直播、视频、分享、真人联系 | 当前全部 HOLD，不属于 UI-01 准备范围。 |

## 7. Current Admission Conclusion

UI-01 当前结论：

```text
RESEARCH_GATE=IN_PROGRESS
BA_DESIGN=CONDITIONAL_PREPARATION_ONLY
API_CONTRACT=NO_GO
CODE_IMPLEMENTATION=NO_GO
API_CONTRACT_GATE=NO_GO
CODE_GATE=NO_GO
```

UI-01 可以继续整理 BA Design 和 Visual Fidelity Brief，但尚不能声明研究完成或进入 API Contract。原因是：UI-01/UI-02 图片映射仍有历史冲突；首页下半屏、推荐内容、家庭/孩子切换、空态/权限态和具体文案需要逐项确认；家庭教育和业务材料主要是 E1 假设，尚未形成足够外部/独立证据；入口共享子系统、Consent purpose、Named Action 和前后端 projection 尚未完成架构确认。

## 8. Required Next Research Questions

1. 用户原图与 repo `core-01-home.png` 是否为同一 UI-01 canonical version？若不是，哪个版本为当前 visual baseline？
2. 首页六入口的确切文案、点击区域、下游 UI 和业务域是否已经由人工确认？
3. 首页需要展示的家庭/孩子上下文由谁维护，哪些字段是 Fact，哪些只能是 Perspective 或 Hypothesis？
4. `FamilyHomeProjection` 的最小字段、source/version/visibility/as_of/consent_ref 是否已有 SSOT？
5. 首页入口是否只读，还是需要任何 Named Action？每个动作的 actor、scope、idempotency、audit 和撤回策略是什么？
6. AI 入口是解释草稿、测评入口，还是报告查询？Model Gateway、Human Gate 和敏感数据规则如何绑定？
7. 推荐内容/服务是否只做目录 projection？不得以排序、家庭画像或儿童数据自动推荐。
8. loading、empty、error、permission、consent blocked、version conflict 等状态如何在不破坏原画面结构的前提下表达？

## 9. Next Gate

UI-01 下一阶段不是 API Contract 或代码，而是：

```text
Architect Review
→ Blocking Questions
→ Visual Baseline Check
→ BA Design closure
```

只有完成 Broad Research + Needs Analysis、解决视觉映射冲突、闭合对象/Consent/Named Action/Human Gate 问题，才可重新评估是否进入 API Contract。

## References

[1]: `apps/web/public/bangyang-reference/ui18/core-01-home.png`
[2]: `reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`
[3]: `reports/m2/frontend/UI01_FULL_EXPOSURE_SUBSYSTEM_DECOMPOSITION_001.md`
[4]: `reports/m2/frontend/FAMILY_34_UI_FUNCTION_LINEAGE_AUDIT_001.md`
[5]: `30_素材_materials/_extracted/逐页文本_含页码/01_新商业模式对外宣发.txt`
[6]: `30_素材_materials/_extracted/逐页文本_含页码/02_战略白皮书30页.txt`
[7]: `30_素材_materials/_extracted/逐页文本_含页码/03_家庭教育大模型平台合作方案.txt`
[8]: `governance/FAMILY_34_UI_OBJECT_MODEL_AND_CONTRACT_DESIGN_001.md`
[9]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`

**UI01_RESEARCH_NEEDS_ANALYSIS_READY** `reports/m2/frontend/UI-01_RESEARCH_NEEDS_ANALYSIS_001.md`
