# Family 仓库工作约定

硬规则源自 `10_规格_spec\START_HERE_FOR_CLAUDE.md`,提升到仓库根,作用域覆盖整个 `D:\family`。

## 一、三层结构(2026-08-09 起)

仓库现在是三层,方向自上而下,后层服从前层:

1. **概念权威规格** = `10_规格_spec\`(**V2.1**,单一真相)。方法论/蓝图/详细方案/计划/附件。
2. **工程执行层** = `50_开发_dev\`(**AI Development OS V1.1 工程契约**)。实现级契约:DB schema、OpenAPI、action/event/policy、Agent 注册、Model Router、Eval 阈值、脚手架/CI、Consent 矩阵、未成年人 SOP + 冲刺 backlog。
3. **循证知识层** = `20_知识_knowledge\`(Python `evidence.py` 等)。证据 E0–E7 与门的唯一实现,以服务/CLI 边界被上面两层调用,**不重写**。

## 二、动手前的顺序

**读概念规格(理解 Family 是什么)**,按序:
1. `10_规格_spec\00_总索引与阅读说明.md`
2. `01_实施方法论\Family_FGAIM_实施方法论_V2.0.md` —— 最高上位规范
3. `02_总体蓝图\`(总体蓝图 + 整体技术架构)
4. `03_详细方案\Family_详细实施方案_V2.0.md`
5. `04_实施计划\`(180天计划 + WBS)
6. `05_附件与研发规范\`(门禁 / 技术规范 / 迁移矩阵 / START_HERE)
7. `10_规格_spec\ISSUES_对齐台账_V2.1.md` —— 10 处裁决在 V2.1 的重新核验 + A3 Python 边界 + Agent 开发缺口登记

**要写代码时**,进 `50_开发_dev\`,遵其 `00_START_HERE.md` + `CLAUDE.md`(编码宪法)+ `ENGINEERING_CONTRACT_INDEX.md`:
- **首次进入不直接编码**,先跑 `backlog\tasks\TASK-000_REPO_AUDIT.md`(只读审计,产出 `reports\REPO_AUDIT_REPORT.md`)。
- 之后按 `CURRENT_SPRINT.md`:Sprint0 = TASK-000→001→002;Sprint1 = TASK-101…107(M1 Family Core)。
- **一次只做一个 Approved Task,不自行扩范围、不跨 Sprint。** Source-of-Truth 冲突时以 `50_开发_dev\CLAUDE.md` 的优先级为准。

**未经确认,不得跨 Sprint / 跨阶段开发,不得擅自迁移技术栈。**

## 三、硬规则

- Domain Spec 优先于代码。
- `Perspective != Fact`。
- `Hypothesis != Fact`。
- `Recommendation != Decision != Action`。
- 不做 Family Total Score。
- 不做家庭 Ranking。
- AI 自由文本不得直接写核心 Ontology。
- 核心状态必须走 Named Action。
- 模型必须经 Model Gateway。
- Ontology 平台必须经 Adapter。
- 高风险家庭场景必须 Human Gate。
- 没有 Outcome 的 AI 功能不算完成。
- 没有 Causal Episode 基础,不训练 World Model。

## 四、证据规矩

这几条容易在赶进度时被抹平,单独列出:

- **素材上限 E1**。榜样教育自家材料(`30_素材_materials\`)的主张,证据等级上限为 E1,不能用来证明自己。
- **产出也是 E1**。`40_产出_derived\` 里自家生成的解读/纲领同样是 E1,**不得作为证据**。
- **提取假设只用带页码的抽取**:`30_素材_materials\_extracted\逐页文本_含页码\`。
  **不要用 `all_materials.txt`** —— 它第 1656 行起混入了自家生成物,会构成自证。
- **推算不算证据**。溯源为 `simulated` / `inferred` / `unverified` / `unknown` 的,按门禁不可用于支撑"成立",只能生成假设、设定验收门槛。
- 证据等级刻度与门禁的唯一实现:`20_知识_knowledge\byresearch\evidence.py`。别另写一套。

## 五、目录分工

| 目录 | 权限 | 说明 |
|---|---|---|
| `00_复盘\` | 追加 | 每次阶段复盘新建一份,按日期命名,不覆盖旧的 |
| `10_规格_spec\` | **改动需变更评审** | 概念权威规格(**V2.1**,单一真相)。问题/裁决记入 `ISSUES_对齐台账_V2.1.md`,不直接改规格原文 |
| `20_知识_knowledge\` | 可开发 | 卡片填进 `library\*.yaml`;改完跑 `Library.validate()` |
| `25_研究_research\` | 可开发 | 按 `BACKLOG.md` 顺序建;复用知识层的 `evidence.py` |
| `30_素材_materials\` | **只读** | 不在这里生成、编辑、追加任何文件 |
| `40_产出_derived\` | 可写 | 成品与生成器放一起,别把成品写回素材目录 |
| `50_开发_dev\` | **工程执行层** | AI Development OS V1.1 工程契约 + 代码将建于此。进入须遵其 `CLAUDE.md`(编码宪法)与 `CURRENT_SPRINT.md`;一次一个 Approved Task |
| `90_归档_archive\` | 可删 | 不参与决策。含被取代的 V1.0 规格与 V1.0 开发OS。删除清单见其 README |
| `.tmp\` | 随便 | 纯临时,不要放需要留存的东西 |

发现文档与代码不符时,**以代码实况为准修文档**,并在复盘里记一笔 —— 不要让文档描述比实际完成度更高。

## 六、交流

一律中文回复;代码、命令、专有名词保持原文。
