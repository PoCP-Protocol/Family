# Family 仓库工作约定

硬规则源自 `10_规格_spec\START_HERE_FOR_CLAUDE.md`,提升到仓库根,作用域覆盖整个 `D:\family`。

## 一、动手前的顺序

写任何代码之前,按顺序读:

1. `00_复盘\2026-08-09_全面复盘.md` —— 现状、已处理问题、待决债
2. `10_规格_spec\00_README.md`
3. `10_规格_spec\01_Family总体产品架构.md`
4. `10_规格_spec\02_Family业务架构与Ontology.md`
5. `10_规格_spec\03_Family技术架构.md`
6. `10_规格_spec\04_Family现有业务迁移矩阵.md`
7. `10_规格_spec\05_Family_180天实施WBS.md`
8. `10_规格_spec\06_FGAIM项目门禁与验收清单.md`
9. `10_规格_spec\ISSUES.md` —— 规格自身的 10 处冲突与缺口

然后先输出一份《实施理解报告》,**不要编码**。报告必须回答:

1. Family 为什么不是"另一个 AI App"?
2. 哪些现有能力必须保留并迁入?
3. 哪些能力应 Buy/Integrate,哪些必须 Family 自己 Build?
4. 第一条 Vertical Slice 是什么?
5. 为什么不能先做大量 Agent?
6. Recommendation / Decision / Action 如何分离?
7. 90 天内最重要的代码模块是什么?
8. 现有业务迁移有哪些高风险数据问题?
9. 哪些功能必须 Human Gate?
10. 当前项目从 WBS 哪一项开始?

**未经确认,不得跨 WBS 阶段开发。**

## 二、硬规则

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

## 三、证据规矩

这几条容易在赶进度时被抹平,单独列出:

- **素材上限 E1**。榜样教育自家材料(`30_素材_materials\`)的主张,证据等级上限为 E1,不能用来证明自己。
- **产出也是 E1**。`40_产出_derived\` 里自家生成的解读/纲领同样是 E1,**不得作为证据**。
- **提取假设只用带页码的抽取**:`30_素材_materials\_extracted\逐页文本_含页码\`。
  **不要用 `all_materials.txt`** —— 它第 1656 行起混入了自家生成物,会构成自证。
- **推算不算证据**。溯源为 `simulated` / `inferred` / `unverified` / `unknown` 的,按门禁不可用于支撑"成立",只能生成假设、设定验收门槛。
- 证据等级刻度与门禁的唯一实现:`20_知识_knowledge\byresearch\evidence.py`。别另写一套。

## 四、目录分工

| 目录 | 权限 | 说明 |
|---|---|---|
| `00_复盘\` | 追加 | 每次阶段复盘新建一份,按日期命名,不覆盖旧的 |
| `10_规格_spec\` | **改动需变更评审** | 权威规格。发现问题记入 `ISSUES.md`,不要直接改规格原文 |
| `20_知识_knowledge\` | 可开发 | 卡片填进 `library\*.yaml`;改完跑 `Library.validate()` |
| `25_研究_research\` | 可开发 | 按 `BACKLOG.md` 顺序建;复用知识层的 `evidence.py` |
| `30_素材_materials\` | **只读** | 不在这里生成、编辑、追加任何文件 |
| `40_产出_derived\` | 可写 | 成品与生成器放一起,别把成品写回素材目录 |
| `90_归档_archive\` | 可删 | 不参与决策。删除清单见其 README |
| `.tmp\` | 随便 | 纯临时,不要放需要留存的东西 |

发现文档与代码不符时,**以代码实况为准修文档**,并在复盘里记一笔 —— 不要让文档描述比实际完成度更高。

## 五、交流

一律中文回复;代码、命令、专有名词保持原文。
