# UI-19 名师专区：动态能力卡与 Static UI → Dynamic Capability System Notes

> **适用范围。** 本文是 UI-19 的轻量工程沉淀，并作为后续 34 页 UI 的固定交付模板。它不将原图解释为业务完成；原图是视觉和场景证据，动态能力必须通过受控对象、状态机、投影、权限和测试证据闭环。[1] [2]

## UI-19 动态能力卡

| 维度 | 本页定义 |
|---|---|
| 家庭教育理论/实践依据 | 场景是监护人在“需要支持”之后理解可见、合格服务供给；目标是帮助其基于服务类型、适龄范围、准入和可用时间**自行选择是否继续**。教师/服务者只作为经准入的供给主体出现；本页不做自动匹配、儿童评价或替代家庭决策。[1] |
| 参与对象 | **Perspective**：监护人看到的 UI-19 列表与筛选状态。**Hypothesis**：尚未被证实的“某服务可能适合”仅能作为后续解释草稿，不能成为事实。**Fact**：`Family`、`Person`、`Consent(SERVICE)`、`ServiceProvider`、`ServiceOffering`、`AvailabilitySlot`、tenant policy，以及其 `ADMITTED/ACTIVE/AVAILABLE` 状态。[2] [3] |
| 动态流程 | `进入 UI-19 → ReadFamily 鉴权 → 派生 tenant/family → SERVICE consent 校验 → 仅查询 TEACHER + ACTIVE + ADMITTED + 有效期内供给 → 可选服务类型/适龄/可用时间筛选 → 返回家庭范围 projection → 前端显示列表/空状态/阻断文本`。本页没有 Booking 写入；取消、暂停、详情和预约都属于后续独立页面切片。 |
| 多模态边界 | 本页当前输入为筛选文本/选择；输出为原图、结构化文本和时间摘要。若未来增加图片、语音、视频或文件，只能先进入 Model Gateway 进行解释、摘要或草稿，且不得直接写入 Provider、Offering、Booking 或 ServiceRecord 核心事实。对资质证明、儿童内容或真人服务意图，必须经过政策校验和 Human Gate。 |
| 数据/API | 主数据：`family_service_providers`、`family_service_offerings`、`family_service_availability_slots`。投影：`FamilyServiceSupplyProjection`。入口：`GET /families/:familyId/orchestration/test-loop/services/offerings?page_id=UI-19`。查询参数仅允许 `service_type`、`age_band`、`available_only`；服务端派生 tenant/family，强制 `provider_kind=TEACHER`。没有 Named Action 写入；`ReadFamily` 是唯一授权门。 |
| IT/外部副作用 | 本页 `external_effect=false`。生产同构适配器边界留给日历、通知、视频/电话、支付和真人联系；本切片不调用这些适配器。真实预约占座、通知、支付、外发分享均 HOLD。 |
| 测试证据 | PostgreSQL/Nest focused integration 验证准入、筛选、下一可用时间、tenant/family 隔离、无 SERVICE consent、无登录和零 Booking/Event 写入；Web client/route smoke 验证 UI-19 原图、GET 契约、筛选、空/阻断文本，以及不存在 POST/幂等/预约调用。 |

## Static UI → Dynamic Capability System Notes

| 步骤 | 固定方法 | UI-19 样板落点 |
|---|---|---|
| 1. 静态页面识别 | 逐项标识角色、入口、列表、筛选、按钮、状态文案、空状态、风险提示；不把视觉词直接当领域事实。 | 角色是监护人；入口是名师专区；列表是推荐服务者；筛选是服务类型/适龄/可用时间；“查看详情/预约”只识别为后续入口，未在此页执行。 |
| 2. 领域拆解 | 每个元素映射到 Perspective/Hypothesis/Fact、主数据、过程数据、状态机、事件和 Named Action。 | 供给列表读取 `Provider→Offering→Slot` 的已准入事实；无假设落库、无 Booking、无产品事件；授权为 `ReadFamily`。 |
| 3. 动态化路径 | 先落地家庭范围只读 projection；待 consent、状态机和 adapter 就绪后才增加受控 action；未具备人审/外部边界的功能明确 HOLD。 | 先完成可筛选 projection；UI-20 详情、UI-21 预约、UI-24 记录待独立切片；真人联系/支付/通知/占座 HOLD。 |
| 4. 多模态路径 | 明确本页允许的输入输出；AI/VLM/LLM 必经 Gateway，只能生成解释、摘要、草稿或辅助判断，不能写核心 ontology。 | 当前无模型调用；未来只能解释已准入的供给摘要。资格材料、儿童材料、真人服务意图进入 Gateway + policy + Human Gate。 |
| 5. 系统闭环 | 以 `view/client → API contract → application service → DB projection/action → audit/event → test evidence` 设计；所有 scope、consent、审计和失败关闭由服务端执行。 | `teacher-supply-view/client → ServiceSupplyListQueryDto → FamilyServiceBookingService.offerings → 0032 tables → no write/event → focused integration + Web smoke`。 |
| 6. 验收经验 | 证明“不是静态演示”的最小证据是：真实 PostgreSQL 读投影、范围/授权负例、前端真实请求契约、状态/空态/阻断态和无副作用断言。 | 列表不是写死卡片；数据来自 tenant-scoped DB。仍为 DEV/TEST fixture-only、外部 effect=no-op；不表示生产真人服务已启用。 |

## 后续 34 页复用检查单

每个页面完成时必须随代码留下本页 Capability Card 与上述六步 Notes，并至少回答：**场景与行为依据是什么、对象事实与假设如何分开、何种状态可以改变、AI 能做什么/不能做什么、外部 effect 如何隔离、哪些测试证明闭环成立。** 不能回答这些问题的页面，只能保留为视觉参考，不能宣称已动态化。

## 参考证据

[1]: `../../governance/BANGYANG_34_UI_SCENARIO_FLOWS_AND_RULES_001.md` — UI-19 名师专区的角色、流程与边界。

[2]: `../../governance/FAMILY_34_UI_MASTER_DATA_API_NAMED_ACTION_MAPPING_V1.md` — 34 页对象、API、Named Action 映射。

[3]: `../../database/migrations/0032_family_service_booking_objects.sql` — Provider、Offering、Slot、Booking 与 ServiceRecord 数据结构及 no-op 边界。

## Skill Escalation Gate

> **固定门禁。** 每个页面切片在编码、验证、提交或推送前，先判断问题是否应升级为专业 skill、工具或独立审查；未升级时必须说明问题为何局部、确定且可由现有工程规则安全处理。

| 问题类别 | 本切片检索/调用 | 采用判断 | 后续升级能力 |
|---|---|---|---|
| 前端交互、运行时与原图一致性 | 已读取 `webdev-readme-static` 工程规范；复用 Vitest + JSDOM route smoke；保留 UI-19 原图并在其下显示受控供给读模型。 | 当前交互只有筛选和只读加载，无复杂响应式布局、浏览器兼容或多模态渲染问题，因此先以 JSDOM/构建验证；不新增视觉生成能力。 | 引入浏览器端视觉回归与移动端截图比对；复杂交互或响应式问题出现时再升级到 Playwright 类浏览器验证。 |
| TypeScript、依赖、测试与运行时 | 已检索 Vitest 类型/运行时验证与 Playwright 等专业工具；本仓库已有 `pnpm`、Vitest、Nest 与真实 PostgreSQL 集成环境。 | 采用现有 typecheck、focused Vitest 和 PostgreSQL 集成测试；列表 read-model 引入新契约时先依赖静态编译和运行时响应校验。 | 如出现类型漂移，增加 Vitest type tests；如跨浏览器黄金路径不稳定，增加 Playwright E2E。 |
| Python/Pylance/数据事实 | 未调用 Python/Pylance：本页只查询 PostgreSQL 的既有受控供给表，不涉及批量数据处理、Python 计算或从非结构化材料抽取事实。 | 通过 SQL schema、fixture 和 DB 集成测试建立事实依据，避免引入不必要的数据处理链。 | 当后续页面需要证据文件解析、批量回放、统计/特征处理或 Python 事实校验时，先升级到相应 Python/Pylance 能力。 |
| 安全、权限、consent、未成年人 | 已复用 `OrchestrationAuthGuard`、`ReadFamily`、tenant/family 派生、`assertServiceConsent`、fail-closed 和负向 HTTP 集成测试。 | 此页只读，但仍将 SERVICE consent 与授权作为读取前置条件；不显示儿童材料、不写核心事实、不调用外部真人服务。 | 涉及资质文件、儿童多模态、真人匹配、预约/支付/外发时，先进行独立安全/隐私/Human Gate 审查。 |
| GitHub/CI/拆分与持续看护 | 已采用 Git 状态预检、范围隔离、独立 focused tests、暂存审查和验证后提交推送的流程。 | 当前仓库含历史 dirty hunk，因此最终将以精确 staged candidate 审查隔离 UI-19；不得将无关候选推送。 | 如果出现多个并行切片、CI 波动或 PR 需要长期看护，先检索/启用 autopilot、babysit、split/review 类能力或等价持续检查流程。 |

**本页结论。** UI-19 当前问题足够局部：既有供给表和预约服务已存在，新增的是只读投影、范围/consent 收紧、独立 client/view 和 focused evidence；因此在完成专业工具检索后可继续使用现有 Nest、Vitest、PostgreSQL 与 Git 隔离流程。任何扩展到详情、预约、真人服务或多模态材料的请求，均需重新触发本门禁。

[4]: https://vitest.dev/guide/testing-types — Vitest 类型测试与运行时测试指南。

[5]: https://playwright.dev/ — 浏览器自动化与端到端验证能力。

## Demand Source Chain

> **原则。** UI-19 的需求来自家庭教育实践、家庭成长需要与可追溯证据；原图只承载入口、视觉和场景，不单独产生需求。以下链条把可证实事实、实践假设和工程实现分开。

| Demand Source Chain | UI-19 结论与边界 |
|---|---|
| **Family Education Practice** | 家长在涉及孩子支持服务时需要理解可选项、服务边界、资格与可用性，并保留对是否继续的决定权。家庭中心实践与共同决策资料强调：在存在多个合理选项、且没有一个明显优于家庭偏好的选项时，应以可理解的方式说明选择及风险/收益，而不是替家庭作决定。[6] [7] 这为“展示经准入供给、但不自动推荐/导购/代决策”提供**方向性依据**；它不证明任一教师或服务对任一家庭有效。 |
| **Family Growth Need** | 本页主要服务 **Parent Second Growth**（家长理解、比较与选择支持资源）和 **Relationship Growth** 的支持条件（家庭可在不被替代的前提下协商下一步）；它不对 Child Growth 作评分、诊断或效果承诺。当前仅实现“只读理解与筛选”，不进入详情、预约或服务实施。 |
| **Role / Scenario / Pain Point** | 角色是已授权的监护人；场景是已识别支持需要后查看可见的服务供给；痛点是信息不透明、资格/准入状态不可见、可用时间不明，以及被强推或被系统替代选择的风险。教师/服务者是供给主体，不是对家庭作出自动判断的代理。 |
| **Evidence / Research / Example Practice** | AAP 共同决策指南明确家庭价值与偏好是决策环节，并警示证据有限时需谨慎；该证据来自儿科共同决策语境，**不能外推为平台服务效果证明**。[6] 2024 系统综述总结的家庭中心照护成分包括共同决策、家庭教育、家庭参与和对家庭需要的识别，但其适用对象是有智力障碍儿童的医疗/支持服务，故对 Family 平台仅作设计原则参考，不能成为一般教育效果结论。[7] “榜样教育/服务供给”自家材料只可作为**E1 实践素材或 Hypothesis**，不能自行证明优质、有效或适配；当前没有直接研究证据时标记为**待补证据**。 |
| **Requirement Understanding** | 因此，系统只应返回家庭范围内、`TEACHER`、`ACTIVE`、`ADMITTED`、资格有效且在有效期内的供给事实，并把服务类型、适龄、可用时间摘要作为可见信息；不得按“优劣/最适合”排序，不得以模型或教师字段替代家长决定。 |
| **Requirement Split** | **本切片：** UI-19 供给读取与筛选。**后续独立切片：** UI-20 教师详情、UI-21 预约、UI-24 家庭私有记录。**明确 HOLD：** 真实通知、支付、日历占座、真人联系、推荐排序、教师优劣判断、教师自注册与人工审核。 |
| **Implementation Slice** | `ServiceSupplyListQueryDto` 限定 `page_id='UI-19'` 与服务类型/适龄/可用性筛选；`FamilyServiceBookingService.offerings` 先校验 `ReadFamily` 路径、家庭→tenant、SERVICE consent，再查询 Provider→Offering→Slot 并返回 `FamilyServiceSupplyProjection`；`teacher-supply-client/view` 只发 GET，显示原图、列表、空态或阻断态。 |
| **Validation Evidence** | 后端 focused PostgreSQL/Nest 测试证明教师过滤、准入、时段摘要、tenant/family 隔离、无 SERVICE consent 和无登录 fail-closed，且零 Booking/ServiceRecord/ProductEvent 写入；Web client/route smoke 证明 UI-19 原图、GET 契约、筛选与阻断态，且没有 POST、幂等键或预约动作。 |

**待补证据清单。** 后续若要支持“家长选择结果改善亲子关系/儿童成长”“某教师或服务优于其他供给”“榜样教育实践对某类家庭有效”等命题，必须先建立可复核的外部研究证据等级、适用人群、反例、局限和 Human Gate；在此之前，这些均为 Hypothesis，不可写入成长 Fact、推荐排序或自动行动。

[6]: https://www.aap.org/en/practice-management/providing-patient--and-family-centered-care/shared-decision-making/ — American Academy of Pediatrics, *Shared Decision Making*；家庭价值、偏好与证据有限时的谨慎原则。

[7]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10981057/ — Mestre et al. (2024), *Impact of family-centered care in families with children with intellectual disability: A systematic review*；研究适用范围为医疗/支持服务，不能直接外推为普通家庭教育效果。

[8]: https://link.springer.com/article/10.1007/s10643-007-0191-6 — Murray et al. (2007), *Supporting Family Choice*；早期儿童与特殊教育服务中的家庭选择实践讨论。
