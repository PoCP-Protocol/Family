# 规格问题与裁决台账（V2.1 对齐版）

本文件是 V2.1 规格的**问题台账 + 裁决落地记录 + Agent 开发缺口登记**。

- V2.1(`Family_..._完整实施资料_V2.1`)已于 2026-08-09 成为 `10_规格_spec` 的唯一权威;V1.0(含 07 方法论、旧 ISSUES 裁决表、02/05 编辑)整包移入 `..\90_归档_archive\规格_V1.0_含V1.1裁决\`,仅作历史比对,不作权威。
- **关键结论(实测):V2.1 是 V1.0 的结构性升级(新增整体技术架构/详细方案/技术规范),但它没有解决 V1.0 阶段识别出的 10 处冲突/缺口 —— 一条都没有。** 因此这些裁决**原样搬到 V2.1 上重新核验**,状态见下。
- 硬规则:Domain Spec 优先于代码;规格改动走变更评审。本台账登记 + 给出推荐处置,重大改动需用户裁决。所有改动已 git 追踪、可 diff/回滚。

V2.1 文件定位(本台账引用用):
`M=01_实施方法论\Family_FGAIM_实施方法论_V2.0.md`｜`BP=02_总体蓝图\Family_总体蓝图方案_V2.0.md`｜`TA=02_总体蓝图\Family_整体技术架构_V2.0.md`｜`DS=03_详细方案\Family_详细实施方案_V2.0.md`｜`WBS=04_实施计划\Family_180天WBS.csv`｜`PLAN=04_实施计划\Family_180天实施计划_V2.0.md`｜`TSPEC=05_附件与研发规范\Family_技术架构实施规范.md`｜`GATE=05_附件与研发规范\FGAIM_项目门禁与验收清单.md`

---

## 一、10 处裁决在 V2.1 上的重新核验(全部仍成立,需落地)

| # | 问题 | V2.1 实测现状 | 推荐裁决(沿用 V1.1,已按 V2.1 校准) | 落点 |
|---|---|---|---|---|
| A1 | 模型先于 Model Gateway 被用 | `WBS`/`PLAN`:Model Gateway 仍 Phase4(W13–14);`2.6 GrowthProfile`/`3.1 Priority`/`3.3 Intervention` Owner 含 AI、在 W13 前 | ①`2.6/3.1/3.3` 一期规则/确定性为主,LLM 仅离线辅助不进生产;②**Model Gateway 最小版(version+cost+audit+structured output)提前到 W5**(与 `2.1` 同批),生产 LLM 一律经它 | `M`§9/§A7、`TSPEC`§8、`WBS` |
| A2 | DoD 前三阶段不可能满足 | `M`§11 DoD 是**平铺清单**(含 Evaluated),而 Golden Set 在 Phase4 才建 | **DoD 分层**:Phase1–3 用 DoD-Core(去掉 Eval 三集);Eval 三集自 Phase4 起强制为 DoD-AI | `M`§11、`GATE` |
| A3 | 技术栈与既有代码不同语言 | `TSPEC`§17 纯 NestJS/TS;`TA`/`TSPEC` **完全未提**既有 Python 知识层(`..\20_知识_knowledge\byresearch`,evidence.py) | **知识/证据层保持 Python**,以服务/CLI 边界对接(`TA`§10 Knowledge Foundry 调它);业务层 TS。**既有代码不重写,是资产。** 见下方 §二 | `TA`§10、`TSPEC`§17 |
| A4 | Outcome 的 baseline 无显式来源 | `DS`/`WBS`:`3.7 Outcome` 验收要"baseline 完整",baseline 来自 `2.5 Onboarding`/`2.6 Profile`,但**无显式"起点基线测量"任务**,`DS` 迁移原则明令禁止从历史打卡推导 | 增设 `3.0 Journey起点基线测量`(依赖 1.7/2.5),在 StartGrowthJourney 前用 MeasureOutcome 记 baseline,provenance=self_report/primary_real | `WBS`、`DS` |
| A5 | FAMILY 域无维度 | `DS`§3.2:GrowthDomain 仍 4 域,FAMILY 一期维度"待定" | FAMILY 明确为二期,一期只启用 CHILD/PARENT/RELATIONSHIP | `DS`§3.2 |
| B1 | 知识层 `Method` 缺 risk_level/human_requirement | 已在 V1.0 阶段落地(代码)。V2.1 的 `Intervention` 本就有这两字段 | **保持**:`schema.Method` 已增两字段 + 校验(高风险无人工=error) | `..\20_知识_knowledge\byresearch\schema.py`(已改) |
| B2 | Intervention 缺 failure_mode/derived_from | `DS`§3.5 Intervention **无**这两字段 | `DS` Intervention 增补(典型做坏方式 + Program 溯源;licensing 决定能否商用) | `DS`§3.5 |
| B3 | 缺 MeasurementChannel(测量通道)层 | `DS` **无**测量通道层;Consent 只到 purpose 级 | `DS` 增设 `MeasurementChannel`,强制 privacy_risk+minors_handling;Consent.purpose 落到通道级 | `DS`(Ontology 节) |
| B4 | GrowthDimension 与 Construct 字段互缺 | `DS` 维度状态四档已有;**无** measured_by/proxy_risk/direction | 在 `1.6 24维确认` 交付物里合并成一套字段 | `DS`、`WBS`1.6 |
| B5 | 证据分级刻度只在代码 | `DS` Evidence 定义简略,**未定义 E0–E7**;因果关系有 5 级 | 把 evidence.py 的 E0–E7 + Provenance + NON_DECISIVE 门写入 `DS` Evidence 节,代码为其实现 | `DS`、`..\20_知识_knowledge\byresearch\evidence.py` |
| C1 | Pilot 把待证伪商业假设当前提 | `WBS`:Pilot(5.5–5.8)前置只有 Vertical Slice+Safety Gate,**无商业假设验证前置** | 「`..\25_研究` BM 线出首次裁决」设为 G5 Pilot Gate 前置;Pilot 前商业阶梯只作 Hypothesis | `WBS`G5、`PLAN` |

> 落地方式:上述裁决**先集中在本台账登记 + 重新核验**(避免直接改写 V2.1 四份大文档致漂移)。逐条写入 V2.1 原文须走变更评审,建议按"进入对应 WBS 阶段前"分批落。V1.0 阶段已就 A2/A4 等给出的详细方案(七步 SOP、DoD-Core 清单)保留在归档的旧 `07_Family实施方法论.md` §3/§6,可直接取用。

---

## 二、A3 专项:Python 知识层与 V2.1 的边界(必须明确,否则冲突)

V2.1 技术规范是纯 TypeScript/NestJS,**通篇没有提及**仓库里已存在且可运行的 Python 循证知识层(`..\20_知识_knowledge\byresearch`:`evidence.py` 证据 E0–E7 + Provenance 门、`schema.py` 五层卡片、`library.py` 校验、`citations.py` Crossref 核验)。这是一处**实质冲突**,不处置会导致要么重写(浪费资产)、要么两套证据模型并存(违反单一真相)。

**裁决**:
1. 知识/证据层**保持 Python,不重写**。它是 `TA`§10 Knowledge Foundry 与 B5 证据刻度的**唯一实现**。
2. 业务层(TS)通过**服务/CLI 边界**调用它(如 Knowledge Foundry 服务内嵌 Python 进程或以内部 API 暴露 `Evidence.gate()`/`Library.validate()`)。
3. B5 的 E0–E7 刻度须写进 V2.1 的 `DS` Evidence 节作为权威定义,evidence.py 作为其实现,防漂移。

---

## 三、Agent 开发缺口登记(V2.1 已到架构级,缺实现级)

实测:V2.1 把**架构/业务讲到 ★★★★★,但"怎么写代码"是 ★★★☆☆**。要让 AI Agent 或工程团队真正动手,以下文档缺失(按阻塞程度排序),建议作为"进入 Engineering Phase 的前置产出":

**P0 直接阻塞开发**
1. **数据库 Schema**:ER 图 + 建表 DDL + Profile 版本管理 + Event 表结构(现无法建表)。
2. **Agent 规格模板 + Registry**:`M`§A5 列了 Agent 该有 Purpose/Object/Decision/Evidence/Tool/Memory/Allowed/Forbidden/HumanGate/Eval,但**没有落成可填的模板与登记表**。
3. **完整 API 契约**:OpenAPI/JSON Schema(现仅 REST pattern 示例,无参数/错误码)。
4. **Policy / Human Gate 规则定义**:何时触发人工(现仅流程图,无规则引擎/触发条件)。
5. **Model Router 逻辑 + Eval 门**:路由/fallback 决策树、成本约束;Eval 评分函数 + pass/fail 阈值 + Golden Set 格式。

**P1 加速开发**
6. 仓库脚手架 / Monorepo 配置(tsconfig/package.json/构建)、CI/CD 脚本。
7. 测试规范(Contract Test 用例、Golden Eval 集、覆盖率目标)、编码约定(eslint/prettier/命名)。
8. Consent/Privacy 权限矩阵 + **未成年人数据处理 SOP**(标记/隔离/删除流程 —— 合规风险)。
9. 事件 schema/命名/版本管理;集成适配器 DTO 范例(ACL 落地)。

> 这批"实现级规格"正是 V2.1 与"可被 Agent 开发"之间的差距。建议在 WBS `1.5 Ontology 冻结`/`2.1 工程Repo` 前后,优先补 P0 的 1–5。
