# Assessment Tool Intake Governance Matrix / 家庭支持工具引入治理矩阵（草案 001）

> **状态：`DRAFT_FOR_ASSESSMENT_APP_GATE_DECISION_INPUT`。**
>
> **范围：** 本矩阵用于判断业界既有“工具/方法”是否、如何、在什么前提下可以被 Family 研究或引入。它不授予任何工具的数字化、题项复制、计分、报告、问卷、模型、真人服务、转介、危机处置或生产使用权限。
>
> **硬边界：** PR36 与 App runtime 继续冻结。不复制任何受版权保护量表题项、计分算法、常模、cutoff、报告模板或电子化版本；不写业务代码、DTO/API/数据库；不开展外部模型、训练、自学习、真人转介、试点、生产或 master 合入。

## 1. 决策原则

Family 不把“测评”理解为儿童能力测验、家庭评分或 AI 诊断，而是分层的**家庭支持需要与服务偏好确认**。每一工具引入都必须先回答：它服务什么目的、适用于谁、是否有正版授权与数字化权、是否需要专业训练/解释、是否有转介与危机路径、家庭能否跳过/撤回，以及系统能否在任何前置不完整时安全停止。

| Family 层级 | 可处理的事 | 永远不能由该层处理的事 |
|---|---|---|
| L0 入门服务偏好/当下需要确认 | 家庭表达当前关切、支持偏好、查看候选或 NO_ACTION | 分数、诊断、儿童/家庭标签、标准化量表。 |
| L1 共同决策/支持目标确认 | 家庭选择优先事项、定义可暂停服务目标 | 把家庭选择误写为儿童客观能力或结果。 |
| L2 标准化筛查工具 | 在独立 Gate 后按原工具边界提示“是否需要进一步了解” | 自行复制/改写题项，自动诊断、自动转介、商业化再利用。 |
| L3 危机/安全筛查 | 在人工责任和本地资源已就绪时安全停止并移交 | 普通产品评分、自动处置、自动外发或营销触达。 |

## 2. 工具引入总矩阵

| 工具/方法类别 | 代表工具（仅名称） | 原始用途与适用边界 | 授权 / 版权 / 培训条件 | 证据级别与 Family 可用位置 | 是否适合自助 | 是否需要人工解释 / 转介网络 |
|---|---|---|---|---|---|---|
| 家庭需要与服务规划 | 家庭需求访谈、Family Needs Assessment、Family-Centered Care Assessment（FCCA） | 了解家庭认为哪些支持最有帮助、参与感与服务规划偏好；FCCA 本身侧重家庭对照护是否家庭中心化的感受，不用于测量儿童能力。 | 先核实具体版本的版权/使用说明；Family 自建 L0 问题不得冒充某量表。 | **L0 候选**；E1 仅可指导体验语言，外部工具的用途/适用性须以原始来源审查。 | 可采用自建、非诊断、无评分的文本化确认；具体量表电子化另审。 | L0 不需要；若出现专业/安全问题则停止。 |
| 共同决策 / 共享照护规划 | Family-Centered Shared Care Planning Assessment Tool、AAP Shared Decision-Making framework、FANS/CANS（专业服务版本） | 澄清可选支持、家庭价值与偏好、共同形成服务目标；FANS/CANS 则属于专业服务决策/家庭需要与优势工具，不是自助入口。 | 核实具体工具许可；保留“共同决策”方法原则，不复制受保护题项；FANS/CANS 另须审查版本、认证、培训和地区实施规则。 | **L1 候选**仅限共同决策方法；FANS/CANS 为 **L2 HOLD**。 | 可将共同决策方法转为家庭确认界面；不把临床框架伪装为 AI 推荐。 | 需要时由合格人员参与；FANS/CANS 或专业/医疗选择必须 Human Gate。 |
| 儿童发展筛查 | ASQ-3、Survey of Well-being of Young Children（SWYC） | 年幼儿童发展/行为筛查，提示是否可能需要进一步评估；不是诊断。SWYC 公开手册将其定位为儿童早期一级筛查，阳性结果仍须与照护者进一步讨论。 | ASQ 为商业产品；SWYC 的具体版本、许可、语言、数字化与实施要求同样须逐项核实。 | **L2 HOLD**；原始工具证据不等于 Family 使用权。 | 未满足许可、培训、转介和解释责任前不适合自助接入。 | 是；结果需与家长共同审阅，且要有进一步评估/转介路径。 |
| 社会情绪筛查 | ASQ:SE-2、Pediatric Symptom Checklist（PSC） | 幼儿或儿童社会情绪/心理社会筛查，提示是否需要进一步了解；不是诊断。各工具的年龄、信息提供者和场景不同。 | ASQ:SE-2 为商业产品；PSC 也须核实具体版本、语言、数字化与使用条件。 | **L2 HOLD**。 | 当前不适合 Family 自助接入。 | 是；需家长共同讨论、私密处理和可用转介网络。 |
| 行为/情绪筛查 | Strengths and Difficulties Questionnaire（SDQ） | 面向儿童/青少年的行为筛查；具有年龄和信息提供者版本边界。 | 官方明确 SDQ 为受版权保护文件，不得修改；电子版本/新翻译需取得授权，可能需许可费。 | **L2 HOLD**。 | 当前不可自助/不可复制；不得改写为“Family 成长测评”。 | 是；需要合格解释和进一步评估/支持路径。 |
| 家长压力 | Parenting Stress Index（PSI） | 了解亲子系统中压力相关方面的筛查/分流信息；并非家长能力评级或儿童诊断。 | 商业工具；取得正式工具、适用人群、解释资格、语言版本和数字化权均须单独审查。 | **L2 HOLD**。 | 当前不适合直接自助上线。 | 是；需解释、隐私处理、临界/安全路径与后续支持责任。 |
| 家长压力 | Parental Stress Scale（PSS） | 家长对养育角色压力和积极/消极感受的自陈工具。 | 具体版本、译本、使用权、适用人群与解释要求须核实。 | **L2 HOLD**。 | 在无明确许可、适配与专业流程前不接入。 | 原则上需要解释路径；如出现安全/心理议题转 L3。 |
| 亲子互动观察 | NCAST-PCI | 受训人员观察亲子互动/沟通行为；非自填、非 AI 视频判断。 | 深入训练、复训和观察协议要求；具体授权待审。 | **L2 HOLD**，且仅可在未来真人专业服务体系中讨论。 | 否。 | 是；专业观察者、监督与服务责任缺一不可。 |
| 亲子互动观察 | PICCOLO | 对 10–47 月儿童家长与儿童互动的观察性工具；观察支持性养育行为。 | 版权产品，表单/培训/使用边界须核实；不能把其行为域复制为 App 自动评分。 | **L2 HOLD**。 | 否；不是家长自拍/上传视频/AI 观察工具。 | 是；需合格观察、反馈与专业服务流程。 |
| 危机/安全筛查 | Home Safety Checklist、IPV/危机决策算法 | 识别家庭安全议题、推动安全讨论或转介；不用于家庭评分。 | 必须审查工具、当地法律、语言/文化适配；更重要的是建立责任与资源协议。 | **L3 HOLD**。 | 否；无本地资源和人工责任时不得呈现。 | 是；必须有人类责任人、私密路径、本地危机资源与升级规则。 |

## 3. 每类工具的 Family 准入、禁止输出与失败关闭规则

| 类别 | Family 可用位置 | 明确禁止输出 | Human Gate 条件 | fail-closed 条件 |
|---|---|---|---|---|
| 家庭需要与服务规划 | L0 | 总分、儿童能力、风险/问题标签、排行榜、效果证明 | 当输入涉及专业/危机/第三方时停止 | 无可信家庭范围、无 consent、拒答、退出、资源无资格时不路由或 NO_ACTION。 |
| 共同决策 / 支持目标 | L1 | 家庭/儿童画像、强制目标、连续打卡评分、跨家庭比较 | 目标涉及专业判断、真人或第三方资源时停止 | 无明确家庭决定、T2 不合格、资源降级、PRACTICE 无 executor 时不建 Plan/Case。 |
| 儿童发展 / 社会情绪筛查 | L2 | 诊断、病名、风险预测、成长分、公开报告、营销分层 | 工具许可、适龄、培训、解释、私密回访、转介网络均需具备 | 任一许可/版本/适龄/同意/解释/转介条件缺失即不得呈现、收集或计分。 |
| 家长压力 | L2 | 家长能力评级、家庭质量分、商业定价、会员分层 | 合格解释、危机识别与后续支持责任 | 任何心理健康/安全信号没有人类处理协议时不收集。 |
| 亲子互动观察 | L2 | 自拍分析、视频 AI 打分、父母标签、儿童表现分 | 受训观察者、监督、服务合同和隐私协议 | 无受训人员、观察协议、授权或 privacy controls 时禁止观察/记录。 |
| 危机/安全 | L3 | 普通产品分数、自动报警、自动外发、公开标签、营销 | 本地资源、责任主体、人工升级、法律/隐私审查 | 无危机协议/资源/责任人时，普通流程停止且不得声称可处理危机。 |

**所有类别共同禁止：** Family Total Score、家庭 Ranking、儿童成长分、AI 诊断、心理健康结论、永久标签、公开画像、跨家庭比较、E1 自证效果、主观回访升格为效果证明、训练/自学习、商业排序、支付定价、分享裂变。

## 4. 工具 Intake 表单：每一工具必须补齐的字段

任何 L2/L3 工具在进入评审前，工具提供者或内部责任人必须提交以下信息；缺一不可。

| Intake 字段 | 必填内容 |
|---|---|
| 工具身份 | 官方名称、版本、权利人、官方网站、正式语言版本。 |
| 家庭问题 | 工具要帮助回答的具体服务问题，而非宽泛“评估孩子”。 |
| 用途分类 | L0/L1 方法参考，或 L2/L3 标准化工具；不得跨层偷换。 |
| 授权状态 | 纸质/数字化/小程序/翻译/计分/报告/存储各自的使用权与费用。 |
| 证据与局限 | 适用年龄、语言/文化、场景、效度资料、已知局限；E1 不可替代。 |
| 人群范围 | 谁可填写、谁可观察、排除条件、儿童/第三方/监护人要求。 |
| 培训与解释 | 谁完成培训、谁解释结果、谁处理疑问与异议。 |
| Consent 与隐私 | 目的、字段、保存期、接收方、可见范围、跳过/撤回/删除与导出请求。 |
| 路由与转介 | 临界/异常/安全情形如何处理，本地资源是否确认，谁对升级负责。 |
| 输出契约 | 仅允许的家庭友好文本；明确禁止的诊断、分数、标签、排名和商业使用。 |
| 验证计划 | 合成测试、权限/撤回/跨家庭/无障碍/文本路径/异常场景、Human Gate。 |
| 退出计划 | 工具撤回、许可到期、版本变更、人员失效、资源不可用时如何停止。 |

## 5. 前台文案转换规则

| 禁用前台文案 | Family 合规替代文案 |
|---|---|
| 免费家庭测评 | 说说你现在希望家庭获得什么支持。 |
| 3 分钟测出孩子成长状态 | 用几分钟确认此刻想先理清的家庭需要。 |
| AI 成长诊断 | 平台只会根据你确认的需要，展示当前安全且已准入的支持方式。 |
| 成长综合评分 / 雷达图 | 本次家庭支持过程摘要（不代表成长结论）。 |
| 风险提示 / 孩子问题 | 如果你希望进一步了解，我们会说明可用的下一步与边界。 |
| 生成个性化成长方案 | 由你的家庭选择一个可暂停的下一步，或暂不行动。 |
| 完成测评即可领取权益 | 你可以跳过、暂停或退出；回答不会决定你的家庭价值或资格。 |

## 6. 独立 App Gate 必问问题

1. 该工具是 L0/L1 的自建非诊断确认，还是 L2/L3 的标准化工具？是否存在跨层偷换？
2. 若为 L2/L3，是否有逐项可核验的正版/电子化/翻译/计分/报告授权？
3. 年龄、人群、文化/语言、场景与排除条件是否适配 Family 的目标家庭？
4. 谁负责工具解释、临界/异常处理、危机升级、转介和争议处理？这些责任是否在产品上线前已可验证？
5. 家庭是否可以跳过、拒答、退出、撤回，且不因此失去基本支持？
6. 输出是否只有经过授权的最小文本，且完全排除诊断、总分、标签、排名、画像、比较与效果声称？
7. 数据是否被严格限制于当前家庭服务目的，且零训练、零自学习、零跨家庭推荐、零商业再利用？
8. 是否有文本等价路径、无障碍路径和所有关键前提缺失时的 fail-closed 行为？
9. 是否已单独取得 App Gate、数据 Gate、Human Gate，且 PR36/master/试点/生产等 HOLD 未被偷换解除？

## 7. 参考来源

[1] Minnesota Department of Health, *Family Home Visiting Screening and Assessment Recommendations*，https://www.health.state.mn.us/communities/fhv/screening.html 。
[2] Ages & Stages, *Success After Screening*，https://agesandstages.com/free-resources/articles/success-screening/ 。
[3] American Psychological Association, *Parenting Stress Index*，https://www.apa.org/pi/about/publications/caregivers/practice-settings/assessment/tools/parenting-stress 。
[4] Youthinmind, *Copyright*，https://youthinmind.com/copyright/ 。
[5] SDQinfo, *What is the SDQ?*，https://www.sdqinfo.org/a0.html 。
[6] Brookes Publishing, *PICCOLO Tool*，https://products.brookespublishing.com/Parenting-Interactions-with-Children-Checklist-of-Observations-Linked-to-Outcomes-PICCOLO-Tool-P677.aspx 。
[7] American Academy of Pediatrics, *Shared Decision Making*，https://www.aap.org/en/practice-management/providing-patient--and-family-centered-care/shared-decision-making/ 。
[8] Tufts Medicine, *SWYC User’s Manual*，https://www.tuftsmedicine.org/sites/default/files/2023-10/SWYC%20Manual%20v101%20Web%20Format%2033016.pdf 。
[9] Massachusetts General Hospital, *Pediatric Symptom Checklist*，https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist 。
[10] PAR, *PSI-4*，https://www.parinc.com/products/PSI-4 。
[11] CORC, *Parental Stress Scale (PSS)*，https://www.corc.uk.net/outcome-measures-guidance/directory-of-outcome-measures/parental-stress-scale-pss/ 。
[12] `governance/FAMILY_ASSESSMENT_APP_GATE_DECISION_PACKET_002.md`。
[13] `architecture/FAMILY_LAYERED_FAMILY_SUPPORT_ASSESSMENT_GATE_INPUT_001.md`。

---

**作者：Manus AI**
**日期：2026-08-16（GMT+8）
