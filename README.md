# Family 家庭成长AI平台

把「榜样教育」现有家庭教育业务,收敛为一个统一的 **Family Growth AI Platform**:
经营对象从「一次成交的课程客户」升级为「持续成长的家庭 Family」。

> ⚠️ **本 README 是叙述性文档,处于真相权威序最低层(见 `50_开发_dev/governance/TRUTH_HIERARCHY.md`)。**
> 项目**实际**状态以高序为准:Runtime/DB → GitHub → 机器登记册(governance/*_REGISTRY.yaml)→ Gate 证据 → `50_开发_dev/PROJECT_STATUS.md`。
> 本表"状态"列可能滞后,勿据此判断完成度。当前 `PROGRAM_MODE = M3_MOS_CLOSEOUT`。

---

## 目录体系

数字前缀即阅读顺序,也是依赖方向 —— 后面的依赖前面的,反向依赖是异常。

| 目录 | 是什么 | 状态 |
|---|---|---|
| `00_复盘\` | 阶段性复盘记录 | 最新:`2026-08-09_全面复盘.md` |
| `10_规格_spec\` | **权威规格** —— 产品架构、Ontology、技术架构、迁移矩阵、180天WBS、门禁清单 | 完整,11 个文件。**写代码前先服从这里** |
| `20_知识_knowledge\` | 循证知识五层卡片库 + 证据治理 E0–E7 + 引文核验 | 代码可跑;LISTEN_BEFORE_RESPOND 链已循证落地(TinT/Coercive 真实 DOI,见 library + W2R-103B)。以 `PROJECT_STATUS.md`/registries 为准 |
| `25_研究_research\` | 商业假设证伪(BM/MKT/SCI/AI 四线 + 单位经济) | **仅设计,尚无实现** |
| `30_素材_materials\` | 原始素材,4 份内容(S1–S4)+ 抽取文本 | 只读。溯源见 `PROVENANCE.md` |
| `40_产出_derived\` | 自家生成的成品 + 生成器 | 25 页纲领与逐页解读 |
| `90_归档_archive\` | 可再生中间产物、非本项目材料 | 48 M,大部分可删,见其 README |

`.tmp\` 是纯临时目录,当前为空,可随时删。

---

## 从哪开始

1. **`00_复盘\2026-08-09_全面复盘.md`** —— 先读这个。它说清了现状、已处理的问题、以及 3 笔待你决策的债。
2. `10_规格_spec\START_HERE_FOR_CLAUDE.md` —— 阅读顺序 + 硬规则(同时收录在根 `CLAUDE.md`)
3. `10_规格_spec\00_README.md` → `01` 至 `06` 依次读完
4. `10_规格_spec\ISSUES.md` —— 规格自身有 5 处内部冲突、5 处与知识层不对齐,读规格时要知道
5. 然后先输出《实施理解报告》,**不要先编码**

---

## 规格清单(`10_规格_spec\`)

| 文件 | 内容 |
|---|---|
| `01_Family总体产品架构.md` | 三条成长主线(Child / Parent Second Growth / Relationship)、6 平台 23 模块、产品阶梯、12–15 岁 90 天首发产品、五个业务闭环、V1 范围 |
| `02_Family业务架构与Ontology.md` | 10 个一级业务域、Core Object Model、24 个成长维度、23 个 Named Action、16 个 Decision、Consent/Safety、第一条 Vertical Slice |
| `03_Family技术架构.md` | 分层架构、Build vs Buy 边界、OntologyAdapter、数据/AI 平台、Model & Prompt Registry、Agent Runtime、Knowledge Foundry、Eval、可观测、World Model WM1→WM6 |
| `04_Family现有业务迁移矩阵.md` / `.csv` | **55 条**现有资产 → Family 目标对象。策略分布:改造 31 / 集成 5 / 新建 2 / 后置 2 / 升级 2 / 淘汰 2 / 其他 11;优先级 P0 33、P1 17、P2 3、禁止 2 |
| `05_Family_180天实施WBS.md` / `.csv` | 六阶段 26 周、**53 个任务**(P0 41、P1 12),带依赖、Owner、验收标准、Gate |
| `06_FGAIM项目门禁与验收清单.md` | Definition of Ready / Done、Architecture Review、Release Gate |
| `ISSUES.md` | 规格问题台账(本次归档新增,规格原文一字未改) |

180 天六阶段与 Gate 分布:

```
Foundation(0–30)  G0×3 G1×6
Family Account & Core Domain(31–60)  G2×8
Growth Journey Vertical Slice(61–90)  G3×10   ← 第一条端到端闭环
AI & Knowledge(91–120)  G4×9
Platformization & Pilot(121–150)  G5×7
Causal Intelligence Baseline(151–180)  G6×10
```

---

## 三层之间的硬接口

不是三份并列的文档,有真实的约束关系。

### 规格 ← 知识

`10_规格_spec\02` 要求每个 `Intervention` 带 `evidence_grade`、每个判断挂 `Evidence`。
而**证据等级的刻度(E0–E7)与结论门禁,只在 `20_知识_knowledge\byresearch\evidence.py` 里定义** —— 规格引用了它却没定义它。

两边的模型是同一件事的两次独立设计(`Method` ↔ `Intervention`、`Construct` ↔ `GrowthDimension`),有 5 处不对齐,**必须对齐成一套**,否则一期会长出两个互不相认的知识模型。逐条见 `ISSUES.md` B 节。

### 规格 ← 研究

`10_规格_spec\05` Phase 5 直接安排「30→100 家庭 Pilot」,把商业阶梯(21天 → 90天 → 年会员)当既定前提 —— 而这正是 `25_研究_research` BM 线要证伪的对象,当前 **0 条 supported**(一手运营数据为零)。

**规格里的商业假设在 research 判定 `supported` 之前,只能当 Hypothesis 用**:不能写进 Ontology 的 Fact 层,也不能当 WBS 的既定前提。

### 素材 → 一切

素材本身的主张,证据等级上限为 **E1(内部材料主张)**。自家生成的解读(`40_产出_derived\`)同样是 E1,**不得用来支撑自家主张**。

提取假设只能用 `30_素材_materials\_extracted\逐页文本_含页码\`,不能用 `all_materials.txt`(第 1656 行起混入了自家生成物)。详见 `30_素材_materials\PROVENANCE.md`。

---

## 红线

详见 `CLAUDE.md`。`25_研究_research\docs\GUARDRAILS.md` 被多处引用但**尚未建立**,是当前的悬空引用。

- 不做 Family Total Score,不做家庭 Ranking,不做永久人格标签。
- AI 自由文本不得直接写核心 Ontology;核心状态必须走 Named Action。
- 高风险家庭场景必须 Human Gate。
- 涉及未成年人的数据一律脱敏入库;服务同意 ≠ 模型训练同意。
- 没有 Outcome 的 AI 功能不算完成;没有 Causal Episode 基础,不训练 World Model。

---

## 当前进度(诚实版)

- 规格:**齐全**,但有 10 处已登记的冲突/缺口待裁决。
- 知识层:**装置完好,卡片库空的**。`validate()` 返回 `issues: []` 不代表健康,代表没东西可校验。
- 研究层:**一条假设都还没登记**。
- 业务代码:**零**。按硬规则,跨 WBS 阶段开发需先出《实施理解报告》并经确认。
- 《实施理解报告》(10 问):材料已全部读完,**尚未产出**。
