# 07｜Family 实施方法论
## Family Growth AI Platform Implementation Methodology V1.0

---

> **本文件的性质与边界**
>
> - 这是一份**收敛文件,不是新规格**。它不发明任何新规则,只把散落在 `01`–`06`、根 `CLAUDE.md`、`20_知识_knowledge\byresearch\evidence.py` 里的方法论,串成**一条可照着执行的作业链路(SOP)**。
> - 凡本文件与 `01`–`06` 冲突,以 `01`–`06` 为准(硬规则第一条:Domain Spec 优先)。发现冲突记入 `ISSUES.md`。
> - 第六节给出对 `ISSUES.md` 全部 10 处冲突的**推荐裁决**,以及开工前的 P0 底座动作。推荐裁决**需你拍板后**方可执行;未裁决前,相关 WBS 任务不得开工。

---

# 1. 为什么需要这份文件

规格已经齐全,方法论的"零件"质量也高(证据治理已代码化、门禁/WBS/迁移矩阵俱在)。但作为"能驱动开发的方法论",它此前**散、且自身带矛盾、且无工程底座**:

- 方法论散在 6+ 份文档里,没有一条"从读规格到交付"的可执行主干;
- `06` 的 DoD 在前三阶段不可能满足(见 `ISSUES.md` A2),照它开工第一个 Story 就会卡死;
- 无版本控制、有悬空引用、权威规格存在重复副本(见第六节 P0)。

本文件解决第一件事(给出主干),并把后两件事列为**开工前置**。

---

# 2. 五条不可让渡的第一性原则

以下五条贯穿每一个 Story,任何交付违反其一即为不合格。均来自现有规格,此处只做归并:

1. **Domain Spec 优先于代码。** 语义以 `01`–`06` 为准;代码与文档不符时,以代码实况修文档并记复盘,但不得让文档描述比实际完成度高。
2. **三个"不等于"必须在数据结构上分离。**
   `Perspective != Fact`｜`Hypothesis != Fact`｜`Recommendation != Decision != Action`(`02` §3.4/§3.6)。AI 自由文本不得直接写核心 Ontology;核心状态只能走 `02` §9 的 23 个 Named Action。
3. **证据决定能否结案。** 每个重要判断挂 `Evidence`;能否用于"成立"由 `evidence.py` 的 E0–E7 等级 + Provenance 门决定。自家素材与自家产出上限 **E1,不得自证**;`inferred/simulated/unverified/unknown` 不可用于结论(`NON_DECISIVE`)。
4. **高风险必须 Human Gate,未成年人数据必须治理。** 高风险家庭信号进 Safety Gate 升级路径;服务同意 ≠ 模型训练同意;涉未成年人的采集通道要落到"通道级"同意(见 B3 裁决)。
5. **没有 Outcome 的 AI 功能不算完成;没有 Causal Episode 不训 World Model。** 每个功能必须可进入 `Profile→Priority→Intervention→Action→Outcome` 闭环(`01` §7.2)。

不做:Family Total Score、家庭 Ranking、永久人格标签(`01` §8、`02` §11)。

---

# 3. 单元工作循环(每个 Story 的 SOP)

这是方法论的主干。**任何一个 Story,从进入到关闭,必须走完这七步**;缺步即不合格。

```text
① 就绪(DoR)  →  ② 语义落位  →  ③ 契约先行  →  ④ 实现
                                                      ↓
⑦ 证据归档 & 变更闭环  ←  ⑥ 验收(DoD)  ←  ⑤ 门禁自查(Architecture Review)
```

### ① 就绪 — Definition of Ready(`06`)

进入 Sprint 前必须回答 `06` 的 12 问(LifeStage / Domain / Object / Decision / Evidence / Perspective-Hypothesis / Recommendation / Named Action / Human Gate / Outcome / Eval / Consent-Safety)。**关键项缺失不得进入 Sprint。**

### ② 语义落位

在 `02` 里把这个 Story 精确定位:改动哪些 Object、走哪个 Named Action、支持哪个 Decision、产出哪个 Outcome。**不允许**用通用 CRUD 修改关键家庭状态(`02` §9);API 围绕 Domain Action 设计,禁止 `PATCH {arbitrary_fields}`(`03` §16)。

### ③ 契约先行

先定 Domain Contract 与 Schema(输入/输出/校验),再写实现。AI 输出必须是结构化的、Schema 校验失败不得写入正式 Recommendation(`03` §10)。跨旧系统一律走 Anti-Corruption Layer + Adapter(`03` §15、§6),不把旧字段扩散进 Family Core。

### ④ 实现

按 `03` §20 的技术优先级顺序建设。模型调用一律经 Model Gateway(见 A1 裁决的"最小 Gateway");Agent 不直接持有数据库权限,走 `Context→Reasoning→Structured Recommendation→Policy Gate→Action API`(`03` §8.4)。

### ⑤ 门禁自查 — Architecture Review(`06`)

按 `06` 的六面清单自查:Value / Ontology / Data / AI / Platform / Safety。这一步是"交付前的镜子",在 DoD 之前做。

### ⑥ 验收 — Definition of Done(分层,见 A2 裁决)

- **DoD-Core(Phase 1–3 强制)**:功能可运行、Domain Contract 通过、Schema 校验、权限正确、Audit 完整、Evidence 可追溯、Unit/Integration Test 通过、Observability 基础可用、Rollback 可用、Outcome 可记录。
- **DoD-AI(Phase 4 起、Golden Set 建成后强制)**:在 Core 之上追加 Golden Set / Safety Set / Adversarial Set 通过 + AI 版本可追踪。

### ⑦ 证据归档 & 变更闭环

任何"成立/有效"的主张,证据挂进对应载体(知识层卡片的 `evidence`、或研究层假设的 `evidence`),并经 `evidence.py` 的 `gate()` 判定。发现与规格不符或规格自相矛盾 → 记入 `ISSUES.md`,**不直接改规格原文**,走变更评审。

---

# 4. 贯穿全程的四个治理平面

单元循环是"纵向"的;以下四个平面是"横向"的,每个 Story 都被它们约束:

| 平面 | 唯一实现/权威 | 铁律 |
|---|---|---|
| **证据治理** | `20_知识_knowledge\byresearch\evidence.py` | E0–E7 + Provenance;别另写第二套等级(研究层复用它,见 `25_研究\BACKLOG.md`) |
| **决策语义** | `02` §3.4/§3.6 | R≠D≠A、Perspective/Hypothesis≠Fact 在结构上分离 |
| **安全与未成年人** | `02` §12、`03` §14 | 通道级 Consent、脱敏入库、服务同意≠训练同意、高风险升级 |
| **变更管理** | `ISSUES.md` + 变更评审 + git(待建,见 P0) | 规格改动可追溯、可回滚;登记必须有裁决闭环,不能只记不决 |

---

# 5. 阶段推进规则

1. **Gate 串行放行**:G0(Owner/Outcome 明确)→ G1(Ontology 评审)→ G2(Data/Consent/映射)→ G3(Vertical Slice 闭环)→ G4(Eval 达标)→ G5(Pilot 就绪)→ G6(Outcome 数据质量达标才扩量)。见 `05` §4。
2. **Vertical Slice 先行**:`02` §13 的 13 步闭环(`CreateFamily → … → MeasureOutcome → Update GrowthProfile`)跑通前,**不扩生态**。这是 Phase 3 的唯一焦点。
3. **发布分级**:DEV → TEST → EVAL → PILOT → PROD,禁止 DEV 直发 PROD(`06`)。
4. **Release Gate 前置于 Pilot**:BM 线出首次裁决是 G5 的前置(见 C1 裁决)。
5. **未经确认,不得跨 WBS 阶段开发**(`START_HERE_FOR_CLAUDE.md`)。

---

# 6. 开工前置:ISSUES 推荐裁决 + P0 底座

下列裁决**需你确认**。确认前,受影响的 WBS 任务不得开工。理由逐条见 `ISSUES.md` 对应条目。

## 6.1 规格内部冲突(A)

| # | 冲突 | **推荐裁决** |
|---|---|---|
| A1 | 模型先于 Model Gateway 被用(`2.6`/`3.3` 在 W13 前) | **组合**:①明确 `2.6`/`3.3` 一期**以规则/确定性逻辑为主**,LLM 仅限离线辅助、不进生产路径;②把 **Model Gateway 最小版**(仅需 version+cost+audit+structured output)从 `4.1` **提前到 Phase 2 起点(W5,与 `2.1` Repo/CI 同批)**,任何生产 LLM 调用一律经它。全功能路由/fallback 仍留 `4.1`。 |
| A2 | DoD 前三阶段不可能满足(Golden Set 在 W14) | **DoD 分层生效**(已写入本文件 §3⑥):Phase 1–3 用 **DoD-Core**;Eval 三集自 **Phase 4** 起强制为 **DoD-AI**。 |
| A3 | 推荐 NestJS/TS 与既有 Python 代码不同语言 | **知识/证据层保持 Python**,以服务/CLI 边界对接;业务层按 `03` §17 用 NestJS/TS。`4.2 Knowledge Foundry` 通过 Python 服务暴露 `evidence.py`。**既有代码不重写**——它是资产。 |
| A4 | Outcome 的 baseline 无来源(真实任务缺口) | **补任务**:Phase 3 增设 `3.0 Journey 起点基线测量`(依赖 `1.7`+`2.5`),在 `StartGrowthJourney` 前用 `MeasureOutcome` 记 baseline,provenance 为 `self_report`/`primary_real`,**禁止从历史打卡推导**。不补则 `3.7` 验收无法达成、Pilot Outcome 不可解释。 |
| A5 | FAMILY 域无维度 | **FAMILY 明确为二期**,在 `02` §3.2 标注;一期 GrowthDomain 只启用 CHILD/PARENT/RELATIONSHIP(与 `01` 的 24 维一致)。 |

## 6.2 与知识层的对齐(B)——目标:一期只长出一套知识模型

| # | 缺口 | **推荐裁决** |
|---|---|---|
| B1 | `Method` 缺 `risk_level`/`human_requirement` | 给知识层 `schema.Method` **增这两字段**,与 `02` Intervention 同名同义。否则 Policy Gate 无字段可查,Human Gate 退化成"AI 自己说要不要人工"。(改代码,不动 spec 权威定义) |
| B2 | `Intervention` 缺 `failure_mode`/`derived_from` | `02` §3.5 Intervention **增补**这两字段(典型做坏方式 + Program 溯源)。`derived_from` 关联的 `Program.licensing` 直接决定能否商用。 |
| B3 | 规格缺 Modality(测量通道)层 | `02` **增设 `MeasurementChannel` 对象**,与知识层 `Modality` 对齐,强制 `privacy_risk`+`minors_handling`。"同意成长追踪"≠"同意视频采集"——未成年人合规,建议补。 |
| B4 | `GrowthDimension` 与 `Construct` 字段互缺 | 在 `1.6 24维Growth Model确认` 交付物里**一次合并定清**:24 维补 `measured_by`/`proxy_risk`/`direction`;Construct 采纳 `02` §11 的四档状态(EMERGING/DEVELOPING/PRACTICING/STABILIZING)。否则 24 维映射 Construct 会全报 error。 |
| B5 | 证据分级刻度只在代码 | 把 `evidence.py` 的 **E0–E7 + Provenance + `NON_DECISIVE` 门写入 `02`**,作为规格权威定义,代码为其实现。规格是权威,关键定义不能只活在代码里。 |

## 6.3 与研究层的接口(C)

| # | 张力 | **推荐裁决** |
|---|---|---|
| C1 | Pilot 把待证伪的商业阶梯当既定前提 | 把 **「BM 线出首次裁决」设为 `G5 Pilot Gate` 前置条件**。Pilot 前,商业阶梯(21→90→年会员)只作 Hypothesis,不写入 Ontology 的 Fact 层、不作 WBS 既定前提。当前 BM 线 **0 条 supported**。 |

## 6.4 P0 工程底座(低成本、非跨 WBS,建议先做)

这三件事不属于业务开发,是让上面方法论"有载体"的前提:

1. **`git init` + 基线提交 + `.gitignore`**(忽略 `90_归档_archive\`、`__pycache__\`)。等于把 WBS `2.1` 的版本控制提前到现在——没有它,"规格一字未改""搬移可逆""变更评审"全无机制托底。
2. **处置权威规格重复副本**:`docs\impl-v1.0\` 是 `10_规格_spec\` 的逐文件副本(仅少 `ISSUES.md`)。**删除**,或移入 `90_归档_archive\` 并标"历史快照、不作权威"。确保权威唯一。
3. **补 `25_研究_research\docs\GUARDRAILS.md`**:它被三处引用为红线出处却不存在,是当前唯一零成本可消除的悬空引用(`BACKLOG.md` 已列为建设第 1 步)。

---

# 7. 方法论是否被遵守 —— 自检清单

任何时点想判断"我们有没有在按方法论走",查这七条即可:

- [ ] 每个进行中的 Story 都能回答 `06` 的 DoR 12 问?
- [ ] 核心状态改动都走了 Named Action,没有裸 CRUD?
- [ ] 每个"成立"主张都挂了证据,并过了 `evidence.py` 的 `gate()`?自家材料没被拿来自证?
- [ ] R≠D≠A、Perspective/Hypothesis≠Fact 在数据结构上真的分离了?
- [ ] 高风险路径有 Human Gate?未成年人采集通道有通道级 Consent?
- [ ] 当前阶段的 Gate(G0–G6)真的放行了才进下一阶段?Vertical Slice 未通前没扩生态?
- [ ] 规格冲突都进了 `ISSUES.md` 且有裁决,没有人偷偷改规格原文?

---

## 附:本方法论引用的权威出处

`01`(产品架构/闭环/V1范围)｜`02`(Ontology/Named Action/Vertical Slice/Consent)｜`03`(分层/Adapter/Model Gateway/Eval/Observability)｜`04`(迁移原则/ACL)｜`05`(六阶段/WBS/Gate/里程碑)｜`06`(DoR/DoD/Architecture Review/Release Gate)｜`CLAUDE.md`(硬规则)｜`evidence.py`(证据等级与门)。
