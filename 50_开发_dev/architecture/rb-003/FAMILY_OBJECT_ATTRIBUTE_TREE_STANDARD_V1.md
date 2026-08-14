# FAMILY_OBJECT_ATTRIBUTE_TREE_STANDARD_V1 — M3-RB-003

## 0. 头号原则:对象与属性树【动态可扩展】(开放集,非固定枚举)
```
Object Universe 与 Attribute Tree 都是 OPEN / EXTENSIBLE 的,不是写死的 enum。
新对象、新属性、新维度、新关系 通过【声明】加入(metadata/schema-driven),不需重写引擎。
每个属性自带 truth_type/source/owner/provenance,所以新属性能自洽地"插进来"而不破坏语义。
版本化 + 向后兼容:扩展只增不改既有语义;未知属性被安全忽略,不使流程失败。
```
推论:
- `GrowthDimension`、`Object 分类`、`truth_type` 集合等都是**可增长**的(V1 是种子,不是封顶)。
- 禁止把"当前列出的对象/属性"当成世界的全集去硬编码分支(否则又回到假能力/if-else)。
- 扩展点必须声明式:加对象 = 注册一条对象声明;加属性 = 在该对象的 attribute schema 增一条,带真相元数据。

## 1. Attribute Tree ≠ Database Table
```
ATTRIBUTE TREE = OBJECT SEMANTIC VIEW(对象语义视图)
```
允许来自**多个 canonical source** 聚合;可含 AI_INFERENCE 视图字段(但标注清楚、不落 canonical)。

## 2. 统一模板(每对象)
```
Object
├── Identity          (稳定标识)
├── Classification    (类型/分类,可扩展)
├── Core Attributes   (核心属性,可扩展)
├── Relations         (关系,见 RELATION_GRAPH)
├── State             (当前状态,见 STATE_ACTION_MATRIX)
├── Provenance        (来源/证据)
├── Security/Privacy  (敏感度/consent)
├── Effective Time    (生效时间)
├── Events            (发生过什么)
└── Allowed Actions   (谁能合法改变 → Named Action)
```

## 3. 每个 Attribute 的必备元数据(不止 name/type/value)
```
name / type / value
truth_type      # 见 §4
source          # 哪个 canonical/AI 来源
owner           # 谁拥有(FamilyCore/GrowthOS/Principal/Identity/Product)
confidence      # AI 类必备
provenance      # 为什么相信
effective_time  # 何时起有效
sensitivity     # 敏感级/是否未成年人私有
mutability      # 谁/如何可变(只经 Named Action?)
```

## 4. Attribute Truth Type(可扩展集合,V1 种子)
```
FACT           客观事实(如 birth_date;owner=FamilyCore)
SELF_REPORT    自述(perspective 内容)
OBSERVATION    观察(OutcomeObservation)
DERIVED        规则派生
HYPOTHESIS     假设
AI_INFERENCE   模型推断(如"孩子可能用拖延保护胜任感")—— 绝不可成为 Child.attribute 的 canonical Fact
PROPOSAL       建议(PrincipalActionProposal;canonical=false)
```
冻结:`AI_INFERENCE != FACT`、`AI_PROPOSAL != GROWTH_ACTION`。

## 5. 示例:Child(语义视图,多源聚合)
```
Child
├── Identity        : person_id                         [FACT/FamilyCore]
├── Basic           : display_name, birth_date          [FACT/FamilyCore]
├── Lifecycle       : life_stage                        [FACT or DERIVED/FamilyCore]  (不由 birth_date 自动推)
├── Relations       : family, parent, guardian          [FACT/FamilyCore]
├── Growth View     : confirmed_priority, active_intervention, recent_action [FACT/GrowthOS]
├── Principal View  : recent_understanding              [AI_INFERENCE/Principal]  (视图,不落 canonical)
└── Governance      : consent, sensitivity, provenance  [FACT/FamilyCore]
```
`Growth View`/`Principal View` 等**分区可动态新增**(声明式),不改 Child 的 canonical 拥有权。

## 6. 扩展治理(避免动态扩展变失控)
```
扩展是声明式的,但仍受治理:
- 新对象/属性声明须带 owner + truth_type;canonical Fact 的 owner 只能是对应 canonical 模块。
- AI 可提议新属性(PROPOSAL/AI_INFERENCE 视图),但不能自增 canonical Fact 属性。
- 扩展进 canonical(新 FACT 字段/新 GrowthDimension)仍走既有变更流程 + Named Action + 迁移;不在请求路径动态改 canonical schema。
```

## 7. 边界(§28)
不建 Generic Attribute Engine / 通用图数据库;本标准是**架构语言 + 声明规范**,指导既有 canonical + Principal 视图如何被一致、可扩展地表示。
