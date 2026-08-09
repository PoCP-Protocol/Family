# 规格问题台账

本文件记录 `10_规格_spec` 内部的自相矛盾、以及规格与仓库其他部分的对齐缺口。

**规格本身一个字未改。** 硬规则第一条是「Domain Spec 优先于代码」,改规格应走变更评审。本台账只做登记,处置需你裁决。

来源:2026-08-09 通读 7 份文档 + 与 `20_知识_knowledge` 代码逐字段核对。详见 `..\00_复盘\2026-08-09_全面复盘.md`。

---

## A. 规格内部冲突

### A1｜模型先于 Model Gateway 被使用 — 违反硬规则

- **硬规则**:模型必须经 Model Gateway(`START_HERE_FOR_CLAUDE.md`)
- **事实**:Model Gateway 是 WBS `4.1`,W13–14 才建
- **冲突**:`2.6 GrowthProfile Engine V1`(W6–8)Owner = Backend/**AI**;`3.3 Intervention Selection`(W9–10)Owner = Domain/**AI**。两项都在 W13 之前
- **影响**:若这两项用 LLM,则在 Gateway 建成前就违反硬规则;Phase 2/3 的模型调用无版本、无成本、无审计
- **可选处置**:(a) 把 `4.1` 提前到 Phase 2;(b) 明确 `2.6`/`3.3` 一期用规则而非模型;(c) 允许临时直连并登记为技术债
- **状态**:待裁决

### A2｜Definition of Done 在前三阶段不可能满足

- **要求**:`06` 的 DoD 含「Golden Set 通过」「Safety Set 通过」「Adversarial Set 通过」
- **事实**:Golden Sets 是 WBS `4.7`(W14–16)才建
- **冲突**:Phase 1–3(W1–13)的任何 story 都无法达标,DoD 形同虚设
- **可选处置**:DoD 分阶段生效 —— Phase 1–3 用「Domain Contract + Schema + Audit + Test」子集,Eval 三项自 Phase 4 起强制
- **状态**:待裁决

### A3｜推荐技术栈与仓库既有代码不同语言

- **规格**:`03` §17 推荐 NestJS / TypeScript
- **事实**:仓库现有唯一可运行代码(`20_知识_knowledge\byresearch`,五层卡片库 + 证据治理 + CrossRef 引文核验)是 Python
- **冲突**:知识/证据层与业务层跨语言。Knowledge Foundry(`4.2`)要同时用到两边
- **可选处置**:(a) 知识层保持 Python,以服务/CLI 边界对接;(b) 卡片库改写为 TS;(c) 业务层也用 Python
- **状态**:待裁决 —— 建议 (a),已有代码不重写

### A4｜Outcome 的 baseline 没有来源 —— 任务缺口

- **规格**:`3.7 Outcome` 验收标准要求「baseline/current/source 完整」
- **禁止**:`04` 迁移原则 3 明令「历史打卡可迁成 ActionCompletion,但**不能自动推导成长 Outcome**」
- **缺口**:baseline 既不能从历史推导,WBS 里又没有「Journey 起点基线测量」这项任务
- **影响**:`3.7` 的验收标准在当前 WBS 下无法达成;Pilot 家庭若无起点基线,Outcome 全部不可解释,`6.7 Intervention Effect Baseline` 连带失效
- **可选处置**:在 Phase 3 增设「Journey 起点基线测量」任务,依赖 `1.7 Outcome V1` 与 `2.5 Growth Onboarding`
- **状态**:**待补任务**(这是真实缺口,不是措辞问题)

### A5｜FAMILY 域没有维度

- **规格**:`02` §3.2 定义 `GrowthDomain` = CHILD / PARENT / RELATIONSHIP / **FAMILY**
- **事实**:`01` 的 24 个一期维度只覆盖 C01–08、P01–08、R01–08,前三个域
- **冲突**:FAMILY 域为空。`1.6 24维Growth Model确认` 的交付物无法覆盖它
- **可选处置**:(a) 一期删除 FAMILY 域,只留 3 域;(b) 明确 FAMILY 为二期,在 `02` 标注
- **状态**:待裁决

---

## B. 与知识层的对齐缺口

`20_知识_knowledge` 的五层卡片与 `02` 的 Knowledge/Intervention Ontology 是同一模型的两次独立设计,字段大部分能对上。以下是不对齐处。

### B1｜`Intervention` 缺 `risk_level` 判定依据

- **规格**:`Intervention` 有 `risk_level` 与 `human_requirement` 字段;硬规则要求「高风险家庭场景必须 Human Gate」
- **代码**:`Method` 卡片**没有**这两个字段
- **影响**:知识层产出的方法卡进不了 Gate 判定 —— Policy Gate 无字段可查,Human Gate 会退化成「AI 自己说要不要人工」
- **可选处置**:给 `Method` 增加 `risk_level` + `human_requirement`,与 `Intervention` 同名同义
- **状态**:待裁决

### B2｜`Intervention` 缺 `failure_mode` 与 Program 溯源

- **代码有、规格无**:`Method.failure_mode`(典型做坏方式)、`Method.derived_from`(源自哪个已验证 Program)
- **影响**:交付端拿不到「这个方法通常怎么被做坏」;也无法回答「这个方法出自哪个外部已验证项目」,而 `Program.licensing`(版权/认证)直接决定能不能商用
- **可选处置**:`Intervention` 增补两字段
- **状态**:待裁决

### B3｜规格缺 `Modality`(测量通道)这一层

- **代码**:`Modality` 是独立一层,强制校验 `privacy_risk` 与 `minors_handling` —— 二者缺失直接报 **error**
- **规格**:`02` 有 Consent/Safety Ontology,但只到「purpose 级」,没有「每个测量通道级」
- **影响**:涉未成年人时,粒度差别是实质的 —— 「同意做成长追踪」不等于「同意用视频通道采集」。缺这一层,`Consent.purpose` 无法落到具体采集手段
- **可选处置**:`02` 增设 `MeasurementChannel` 对象,与 `Modality` 对齐
- **状态**:待裁决 —— 建议补,这是未成年人合规相关

### B4｜`GrowthDimension` 与 `Construct` 各有对方缺的字段

- `Construct` 有、24 维没有:`measured_by`(测量通道)、`proxy_risk`(代理指标风险)、`direction`(期望改变方向)
- 24 维有、`Construct` 没有:四档状态 EMERGING / DEVELOPING / PRACTICING / STABILIZING
- **影响**:`Construct` 的校验器会把「没有任何测量通道的构念」判为 error(理由:无法验证)。24 维若直接映射为 Construct,将全部报错
- **可选处置**:合并为一套字段,在 `1.6` 交付物里一次定清
- **状态**:待裁决

### B5｜证据分级刻度只存在于代码

- **规格**:`Intervention.evidence_grade`、`Card.evidence` 都引用了「证据等级」,但**规格没有定义刻度**
- **代码**:`evidence.py` 定义了完整刻度 E0–E7,并额外定义了与等级正交的 `Provenance`(来源性质)和 `NON_DECISIVE` 门禁
- **影响**:规格是权威,但这条关键定义的唯一实现在代码里。两边会漂移
- **可选处置**:把 E0–E7 与 Provenance 门禁写入 `02`,代码作为其实现
- **状态**:待裁决 —— 建议做,这是规格空洞、代码更完整的一处

---

## C. 与研究层的接口张力

### C1｜Pilot 把待证伪的商业假设当既定前提

- **规格**:`05` Phase 5 安排「30→100 家庭 Pilot」,商业阶梯(21天 → 90天 → 年会员)被当前提
- **研究**:这条阶梯正是 `25_研究_research` BM 线的证伪对象,当前 **0 条 supported**(一手运营数据为零)
- **影响**:Pilot 跑出的商业数字,在 BM 线出裁决前无法解释归因
- **可选处置**:把「BM 线出首次裁决」设为 `G5 Pilot Gate` 前置条件
- **状态**:待裁决
