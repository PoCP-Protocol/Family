# UI-01 Architect Review and Blocking Questions 001

## 1. Review Scope

本评审针对 UI-01 / F01 Family Home 的 Broad Research、Needs Analysis、BA Design 和 Visual Fidelity Brief，判断其是否具备进入 API Contract 或代码实现的条件。本轮只做架构评审和阻塞问题登记，不创建 API Contract，不修改 `apps/api`、`apps/web`、`database`，不提交 UI-06 文件或任何截图、JSON、path tiles 资产。

评审原则是：视觉复刻不等于业务事实；`Fact != Perspective != Hypothesis != Recommendation != Decision != Action`；`Read Projection != Controlled Draft != Named Action != External Effect`。任何未决项都不能被“推荐默认值”或页面点击替代。

## 2. Reviewed Inputs

| 输入 | 评审用途 |
|---|---|
| `reports/m2/frontend/UI-01_RESEARCH_NEEDS_ANALYSIS_001.md` | 研究证据、需求分类、对象候选和当前准入结论。 |
| `reports/m2/frontend/UI-01_BA_DESIGN_AND_VISUAL_FIDELITY_BRIEF_001.md` | BA 对象、状态机、只读投影、候选动作和视觉验收。 |
| `apps/web/public/bangyang-reference/ui18/core-01-home.png` | UI-01 visual baseline；只证明可见画面和交互热点。 |
| `FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md` | global UI 映射和基线校准状态。 |
| `UI01_FULL_EXPOSURE_SUBSYSTEM_DECOMPOSITION_001.md` | UI-01 46 个暴露点及共享子系统拆解。 |
| `FAMILY_34_UI_OBJECT_MODEL_AND_CONTRACT_DESIGN_001.md` | Family、Person、Need、Evidence、Decision、Plan 等对象边界。 |
| `FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md` | UI-01 投影和动作候选的治理映射。 |
| `FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md` | DTO、fixture、policy、audit、browser 验收门禁。 |
| `30_素材_materials/_extracted/逐页文本_含页码/` | 家庭教育和业务假设研究输入；只读、优先逐页文本，不使用 `all_materials.txt`。 |

自家、榜样教育、波波校长和内部战略材料最高按 E1 使用，只能形成假设和设计素材，不能自证效果、诊断、资质、市场事实或因果关系。

## 3. Architecture Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
VISUAL_BASELINE=LOCATED_BUT_MAPPING_AND_STATE_GAPS_REMAIN
RESEARCH_NEEDS_ANALYSIS_GATE=NOT_CLOSED
```

UI-01 已具备可定位的视觉基线和较完整的 BA 研究材料，但尚未闭合家庭上下文、首页投影字段、Consent purpose、Named Action、AI 入口语义、推荐边界、异常状态和 UI-01/UI-02 映射冲突。因此不能进入 API Contract 或代码实现。

## 4. BA Design Completeness Review

| 评审项 | 当前判断 | 结论 |
|---|---|---|
| 场景与角色 | 已覆盖家长、孩子、教师/服务者、顾问、运营角色；部分仍为 E1 假设。 | 研究基础存在，需补独立/人工确认。 |
| Demand Source Chain | 已区分家庭教育场景、成长需要、角色痛点、证据和实现切片。 | 可继续研究，不能视为事实。 |
| 六类 Need | User/Business/Operational/Compliance/Data/AI Need 均有记录。 | BA 结构完整，尚未闭合需求取舍。 |
| 子系统归并 | 已归并 Home Projection、Assessment、Report、Plan/Task、Service Supply、Community 等共享系统。 | 避免 34 页重复建设。 |
| 动态等级 | 已区分 L0/L1/L2/L3/L4。 | 首轮最多只可评估 L0/L1；L2/L3 需新门禁。 |

## 5. Domain SSOT Review

UI-01 依赖 Family、Person、Relationship、Membership、Consent、Assessment、ReportSnapshot、PlanDraft、Journey、Task、Evidence、Provider、Offering、Activity、Community 和 ServiceRecord。当前材料给出了候选对象和共享边界，但没有证明每个首页字段的正式 SSOT、版本、可见性和生命周期已经绑定完成。

评审要求：首页不能把六个入口卡片当作六套领域系统，也不能把推荐、计划草稿、案例、服务供给或模型摘要直接写成 Family/Person/Need/Outcome 的核心事实。必须由共享子系统提供受 scope、policy、provenance 和 `as_of` 约束的 projection。

## 6. Object Model Review

| 对象边界 | 评审结论 |
|---|---|
| Family/Person | 需要服务端派生 tenant/family/actor/subject；客户端不得覆盖。当前映射仍需确认。 |
| Need/Intent | 首页只能展示已确认的用户表达或入口状态；AI/推荐不能自动创建 Need。 |
| Report/Explanation | 只能作为来源和解释投影，不能作为诊断事实。 |
| Plan/Journey/Task | 首页只能读后续状态；不能因 CTA、卡片或推荐自动创建。 |
| Provider/Offering | 只能展示受控供给目录；不得自动评价、排序或联系真人。 |
| Evidence/Outcome | 案例和成果只表示过程材料；不得将其转为效果或因果证明。 |

## 7. Read Projection Review

建议的 `FamilyHomeProjection` 方向合理，但尚未达到 API Contract 准入。至少需要人工/架构确认以下字段：

```text
family_context
principal
consent_summary
entry_cards
today_summary
content_service_cards
projection_version
policy_version
source_refs
visibility
as_of
expires_at
```

投影必须 fail-closed 于缺少 scope、visibility、source、policy、consent、version 或过期状态。客户端不得提交 family、actor、subject、eligibility、ranking、price、model 或计算出的核心状态。当前不能据此创建 API。

## 8. Named Action Review

UI-01 中 `SelectHomeContext`、`StartAssessmentIntent`、`CreateGrowthPlanIntentDraft`、`CreateServiceInquiryDraft` 和 `RETURN_HOME/NO_ACTION` 都只是候选。评审不把它们视为已注册 Action。

任何未来 Named Action 必须明确 actor、family_id、subject、consent purpose、source/version、idempotency key、correlation_id、policy version、audit event、reversibility 和 no-op/external effect 标志。普通导航、卡片点击、模型输出和推荐结果不能绕过 Named Action 直接写核心状态。

## 9. Consent / Human Gate Review

UI-01 至少涉及家庭读取、儿童数据、测评、计划、服务供给、社区/媒体和外部分享等不同 purpose。当前未形成完整 purpose matrix、guardian/subject visibility 和撤回传播规则。

必须 Human Gate 或保持 HOLD 的场景包括儿童敏感数据、情绪/风险/诊断暗示、教师/顾问联系、预约、支付、通知、直播、视频、公开分享、效果承诺、排名和同龄比较。Consent 缺失、撤回、过期或 scope 不明时必须返回 `REVIEW_REQUIRED` 或 `CONSENT_REQUIRED`，不能匿名降级。

## 10. Model Gateway Review

AI 允许的候选用途仅为入口解释、已表达问题整理和家长可审阅的说明草稿。所有模型调用必须经过 Model Gateway、schema validation、policy、provenance 和审计。

以下行为禁止：AI 自由文本直写 Family、Person、Need、Plan、Task、Intervention、Outcome、Provider 资质；自动诊断；生成 Family Total Score、Family Ranking、同龄平均；自动触发 Named Action；自动产生真人服务建议或外部 effect。

## 11. Ontology Adapter Review

若首页需要消费外部模型、媒体、内容、日历、视频、通知或服务目录，必须通过明确的 adapter 将外部数据转换为受控 projection。Adapter 不得绕过 Ontology policy，也不得把外部模型自由文本直接写入核心对象。

当前尚未闭合：

1. 外部/模型输入的 source、schema、版本、可信等级和失败语义；
2. adapter 输出如何标记 `projection`、`draft`、`review_required`；
3. 外部 effect 的 Human Gate、回滚和 no-op 行为。

因此 Adapter 仅可列为研究候选，不能进入 Contract 或代码。

## 12. Evidence Boundary Review

当前 UI-01 研究正确地把 `30_素材_materials/_extracted/逐页文本_含页码/` 和自家报告作为 E1 输入，不使用 `all_materials.txt`，也没有把内部材料写成外部事实。但仍需把每个页面承诺、推荐卡、案例和 AI 解释拆成来源、证据等级、适用范围和不确定性字段。

特别禁止把“长期陪伴”“孩子改变”“家庭关系改善”“越使用越懂家庭”或原图中的推荐/数字显示当作已证明的效果、诊断或因果关系。

## 13. Visual Fidelity Review

### 13.1 Baseline

```text
apps/web/public/bangyang-reference/ui18/core-01-home.png
239 × 664 px
```

### 13.2 Check matrix

| 视觉维度 | 当前检查 | 评审结论 |
|---|---|---|
| 布局 | 顶部标题/问候、蓝色 Hero、六入口两行三列、今日任务、推荐内容/服务、底部四项导航均已识别。 | 结构已记录，但 UI-01 用户 overlay 与 repo 图的 canonical mapping 仍需确认。 |
| 组件 | Hero、入口卡、任务行、状态 chip、推荐卡、底部导航和右上热点已识别。 | 可作为 brief，不能作为代码许可。 |
| 文案 | “家庭成长平台”“免费家庭测评”“AI诊断”“21天挑战营”“90天成长计划”等已记录。 | 低清/历史版本差异需人工确认；不得动态猜测。 |
| 颜色 | 蓝色 Hero、白色卡片、浅灰背景、彩色图标、蓝色 active tab 已记录。 | 需截图 diff 验证具体色值和间距。 |
| 图片 | 家庭人物插画和内容人物卡片已定位为视觉资产。 | 不得用新设计/通用模板替代；资产授权和版本需确认。 |
| 间距 | 顶部安全区、卡片间距、列表分隔、底部导航高度已列入验收。 | 尚未运行 Playwright screenshot diff。 |
| 热点 | Hero CTA、六入口、查看全部/更多、任务行、底部导航、右上入口已列出。 | 交互状态和路由目标尚未闭合。 |
| 移动端尺寸 | 239×664 repo 基线已定位。 | 需确认用户原图是否同一 canonical 版本和目标 viewport。 |
| Screenshot diff | 已定义 desktop/mobile、DOM text、状态和热点覆盖。 | 尚未运行；不得声称视觉验收通过。 |

Visual Fidelity 目前为 `CONDITIONAL`，不是视觉 Go。

## 14. FE/BE Consistency Review

当前只能做文档层一致性检查，不能声明前后端一致：

- 页面字段尚未绑定批准的 DTO；
- projection/read model 的 source/version/visibility/as_of 仍需确认；
- policy/consent/audit 与页面动作尚未形成 approved contract；
- fixture 与真实 API 返回未对齐；
- 页面状态与后端错误码/阻断状态未闭合；
- 未运行 API contract、Web page-object、Playwright screenshot 或 DB 验收。

因此 `FE/BE Consistency=NOT_ESTABLISHED`。

## 15. Testability Review

后续至少需要覆盖：

| 测试层 | 必须证明 |
|---|---|
| Research/BA | 需求来源、证据等级和 Fact/Perspective/Hypothesis 分离。 |
| Projection | family/tenant/actor/subject scope、visibility、版本、过期和空态。 |
| Policy | Consent 缺失/撤回、儿童 scope、Human Gate 和 fail-closed。 |
| Action | Named Action 注册、幂等、correlation_id、audit、撤回/暂停和 no external effect。 |
| Web | DOM text、route、loading/empty/permission/review 状态。 |
| Browser | 移动端基线、桌面居中手机画布、热点和 screenshot diff。 |
| AI | Model Gateway schema、拒绝自由文本写 Ontology、敏感输入和人工复核。 |

当前这些测试尚未形成 Contract 或代码，因此 Testability 仅为计划状态。

## 16. Blocking Questions

状态只能使用 `CLOSED_BY_EXISTING_SSOT`、`NEEDS_HUMAN_DECISION`、`DEFERRED`。本轮没有人工裁决；`Recommended Default` 只是建议，不是决定。

| ID | Question | Why Blocking | Decision Authority | Options | Recommended Default | Impact | Required Follow-up Artifact | Status |
|---|---|---|---|---|---|---|---|---|
| BQ-UI01-01 | UI-01 repo 图片、用户原图 overlay 和 UI-02 的 canonical 映射哪个为准？ | 错误映射会导致整页复刻错误。 | 用户/架构师 | 以用户原图、repo 图或确认后的版本表为准。 | 以用户确认原图为最高视觉基线，repo 图只作辅助。 | 更新 baseline/crosswalk，冻结页面版本。 | `UI-01_VISUAL_BASELINE_CONFIRMATION` | NEEDS_HUMAN_DECISION |
| BQ-UI01-02 | 首页六入口的确切文案、热点、下游 UI 和业务域是否已确认？ | 入口会影响跨页血缘和子系统边界。 | 架构师/业务负责人 | 保持现有映射、按用户图修正或标记 HOLD。 | 保持现有映射，未经确认的入口标 `NEEDS_CONFIRMATION`。 | 更新 Page Lineage/BA Design，不创建 API。 | UI-01 linkage confirmation record | NEEDS_HUMAN_DECISION |
| BQ-UI01-03 | `FamilyHomeProjection` 的正式 SSOT、最小字段、版本和 visibility 是什么？ | 没有正式 projection 就不能设计稳定 DTO。 | 架构师/数据负责人 | 复用现有 Family Home projection、扩展共享 projection 或建立新 read model。 | 复用共享 projection，补齐 source/version/visibility/as_of/consent_ref。 | 决定后续 API/DB read model 和 fixture。 | Approved projection schema note | NEEDS_HUMAN_DECISION |
| BQ-UI01-04 | 首页家庭/孩子上下文由谁维护，哪些字段是 Fact，哪些是 Perspective/Hypothesis？ | 儿童数据和核心 Ontology 不能由页面或 AI 推断。 | 架构师/隐私与儿童保护负责人 | 仅展示已确认主数据、允许家庭修正草稿或接入人工复核。 | 只读已确认主数据；修正必须走受控 draft/action。 | 决定 Person/Need/Consent visibility 和负向测试。 | Person context and correction policy | NEEDS_HUMAN_DECISION |
| BQ-UI01-05 | `PLAN_READ`、`ASSESSMENT_READ`、`SERVICE_READ`、`CHILD_DATA` 等 purpose 如何分离？ | 一个模糊 Consent 可能越权展示儿童、计划或服务数据。 | 隐私/合规负责人 | 分 purpose；复用既有 purpose；或暂时只做静态/公共投影。 | 分 purpose、最小权限、撤回后 fail-closed。 | 决定 Consent DTO、policy 和 Human Gate。 | UI-01 Consent purpose matrix | NEEDS_HUMAN_DECISION |
| BQ-UI01-06 | 首页 AI 入口是测评入口、报告解释还是问题整理？ | 不同语义对应不同模型输入、证据和风险。 | AI 治理/业务负责人 | 仅导航、解释草稿、问题整理或暂时 HOLD。 | 首轮仅导航/解释草稿，不诊断、不写 Ontology。 | 决定 Model Gateway schema 和测试。 | AI capability and policy note | NEEDS_HUMAN_DECISION |
| BQ-UI01-07 | 首页推荐内容/服务是否只做目录 projection，如何禁止排序/画像/最佳推荐？ | 推荐可能被误读为适配、优劣或诊断判断。 | 架构师/业务负责人 | 目录投影、自选筛选、人工审核推荐或 HOLD。 | 首轮只读目录 projection，不做 ranking、score 或跨家庭比较。 | 决定 Provider/Content contract 和 UI copy。 | Recommendation boundary record | NEEDS_HUMAN_DECISION |
| BQ-UI01-08 | 首页 CTA 是否只导航，还是需要 `Named Action`？ | 普通点击不能自动创建 Assessment、Plan、Task、Booking 或 Reminder。 | 架构师/业务负责人 | 只读导航、Controlled Draft、decision-only action 或 HOLD。 | 首轮只读导航；如必须记录意向，另行注册 decision-only Action。 | 决定 action registry、audit、idempotency 和撤回。 | UI-01 Named Action registry proposal | NEEDS_HUMAN_DECISION |
| BQ-UI01-09 | loading/empty/error/permission/consent blocked/version conflict 如何在原画面内表达？ | 状态缺失会导致错误家庭数据、隐式降级或视觉破坏。 | 架构师/视觉负责人 | 原骨架内状态区、独立阻断页或暂时只做静态态。 | 保留原布局骨架，在状态区显示受控文案。 | 决定状态 DTO、DOM text 和 screenshot diff。 | UI-01 state and visual allowlist | NEEDS_HUMAN_DECISION |
| BQ-UI01-10 | 外部 Adapter、Model Gateway 和 Ontology Adapter 的边界谁负责审批？ | 外部数据/模型可能绕过核心 Ontology、Policy 和 Human Gate。 | 架构师/AI 与安全负责人 | 仅内部 projection、adapter + review、或全部 HOLD。 | adapter 只产生带 provenance 的 projection/draft，外部 effect 全部 HOLD。 | 决定 adapter contract、失败语义和审计。 | Adapter boundary and safety review | NEEDS_HUMAN_DECISION |

## 17. Required Fixes Before API Contract

在所有 `NEEDS_HUMAN_DECISION` 关闭前，必须完成以下文档产物：

1. UI-01 visual baseline confirmation，解决用户原图、repo 单图和 UI-02 映射。
2. UI-01 page linkage confirmation，确认六入口热点、目标页和共享子系统。
3. `FamilyHomeProjection` approved schema note，包含 source/version/visibility/as_of/consent_ref。
4. Person context、儿童数据和 Consent purpose matrix。
5. UI-01 Named Action registry proposal 和 NO_ACTION/External Effect boundary。
6. AI capability/policy note，明确 Model Gateway、schema、拒绝策略和 Human Gate。
7. Recommendation boundary record，禁止 ranking、score、同龄比较和效果暗示。
8. UI-01 state/visual copy allowlist，覆盖 loading、empty、permission、consent blocked、review required 和 version conflict。
9. Adapter boundary and safety review。
10. 前后端一致性与 Playwright screenshot diff 计划，经架构师确认后才可进入 API Contract 评估。

## 18. Gate Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

原因是当前仍存在 `NEEDS_HUMAN_DECISION`，并且研究门禁、visual mapping、projection SSOT、Consent purpose、Named Action、AI/Adapter 边界和状态验收尚未全部闭合。`Recommended Default` 不构成人工决定，不授权进入下一阶段。

## 19. Acceptance Checklist

| Gate | 当前结果 |
|---|---|
| Broad Research + Needs Analysis | 部分完成，仍需补证据和确认。 |
| Domain SSOT | 候选对象已列，正式首页 projection 未闭合。 |
| Object Model | 共享对象边界已列，Person/Need/Provider visibility 需确认。 |
| Read Projection | 方向已列，未批准 DTO。 |
| Named Action | 仅候选，未注册。 |
| Consent/Human Gate | 原则完整，purpose matrix 未闭合。 |
| Model Gateway | 禁止自由文本写 Ontology，具体 schema 未闭合。 |
| Ontology Adapter | 只允许带 provenance 的 projection/draft，审批边界未闭合。 |
| Evidence Boundary | E1、自家材料不自证，已遵守。 |
| Visual Fidelity | baseline 已定位，mapping 和 screenshot diff 未闭合。 |
| FE/BE Consistency | 尚未建立 contract/fixture/API/browser 证据。 |
| Testability | 测试清单已列，尚未执行。 |
| API Contract | **NO_GO**。 |
| Code | **NO_GO**。 |

## References

[1]: `reports/m2/frontend/UI-01_RESEARCH_NEEDS_ANALYSIS_001.md`
[2]: `reports/m2/frontend/UI-01_BA_DESIGN_AND_VISUAL_FIDELITY_BRIEF_001.md`
[3]: `apps/web/public/bangyang-reference/ui18/core-01-home.png`
[4]: `reports/m2/frontend/UI01_FULL_EXPOSURE_SUBSYSTEM_DECOMPOSITION_001.md`
[5]: `reports/m2/frontend/FAMILY_34_UI_GLOBAL_BASELINE_CALIBRATION_001.md`
[6]: `governance/FAMILY_34_UI_OBJECT_MODEL_AND_CONTRACT_DESIGN_001.md`
[7]: `governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md`
[8]: `governance/FAMILY_34_UI_FRONTEND_BACKEND_CONSISTENCY_MATRIX_001.md`

**UI01_ARCHITECT_REVIEW_AND_BLOCKING_QUESTIONS_READY** `reports/m2/frontend/UI-01_ARCHITECT_REVIEW_AND_BLOCKING_QUESTIONS_001.md`
