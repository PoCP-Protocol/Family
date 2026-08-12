# FAMILY_SKILL_MODEL_V1 — M3-RB-003

正式采纳 **Skill 为 Family 的扩展单元**:对象世界与能力都以声明式 Skill 表达,支撑"动态可扩展 + 生成式真能力"。
**本阶段只定架构语言/声明规范,不建 Generic Skill Engine(§28)。**

## 0. 两类 Skill(必须分清:数据形状 vs 真能力)
```
Object-Skill      声明"世界长什么样"(对象 + 属性树 + 关系 + 允许的 Named Action)—— schema/registry,不做事
Capability-Skill  声明"AI/工具会做什么"(检索/理解/安全/提案…)—— 真能力住这里(生成式模型 + 工具),可编排
```
反例(禁止):把 Object-Skill 当能力、或把确定性 if/else 包成 Capability-Skill 冒充真能力。

## 1. Object-Skill 声明(示例形状)
```yaml
kind: object_skill
object_id: Child
owner: FamilyCore
extends: Person            # 可继承/组合(动态可扩展)
attributes:
  - name: birth_date
    type: date
    truth_type: FACT
    owner: FamilyCore
    mutability: named_action_only
  - name: recent_understanding
    type: PrincipalUnderstandingV1
    truth_type: AI_INFERENCE     # 视图,非 canonical
    owner: Principal
    mutability: ai_view_readonly
relations: [PARENT_OF_inverse, IN_FAMILY]
allowed_named_actions: [AddChild, AssignLifeStage]   # 谁能合法改
```
- 加对象 = 注册一个 object_skill;加属性 = 在其 attributes 增一条(带真相元数据)。热扩展,不改引擎。
- 未知属性被安全忽略(向后兼容);canonical schema 变更仍走迁移 + Named Action(不在请求路径动态改 canonical)。

## 2. Capability-Skill 声明(示例形状)
```yaml
kind: capability_skill
capability_id: principal_understanding
true_class: REAL_MODEL_INTELLIGENCE     # 必对齐 CAPABILITY_TRUTH_REGISTRY 分类
inputs: [FamilyObjectContext, KnowledgeRefs, UserMessage]
outputs: [PrincipalUnderstandingV1]      # truth_type=AI_INFERENCE
tools: [knowledge_retrieval]
safety: { layer: 2, defers_to: [hard_tripwire, human_gate] }
authorization_ref: AUTHORIZATION_REGISTRY#M3_101B_REAL_EXTERNAL_TEXT   # 运行/生产授权在别处
```
- 真能力由生成式模型承载;Capability-Skill 是"声明 + 编排接口",不是把逻辑写死。

## 3. 治理边界(冻结 —— Skill 化不得破坏 RB-003 真相)
```
Skill = 声明/能力单元,≠ 自授权。
1. Object-Skill 可声明 AI_INFERENCE/PROPOSAL 视图属性,但【不能自授 canonical FACT 写权】。
2. 改 canonical(新 FACT 字段/新 GrowthDimension)= 迁移 + Named Action;不在请求路径动态改 canonical schema。
3. 安全硬 tripwire(Layer-1)不是可插拔/可卸载 Skill —— 不可协商核心,不进 Skill 注册表的"可停用"面。
4. Capability-Skill 的 true_class 必须登记于 CAPABILITY_TRUTH_REGISTRY;运行/pilot/生产授权由 AUTHORIZATION_REGISTRY 单独管。Skill 自身不能宣称"真能力/已授权"。
5. 动态加载需治理:谁能注册、注册的是 declaration 还是 capability、truth_type/owner 为何、由谁授权。
6. AI 可提议新 Object-Skill/属性(以 PROPOSAL 呈现),但不得自增 canonical Fact 或自注册 Capability-Skill 运行权。
```

## 4. 与其它 RB-003 资产的挂钩
```
Object-Skill      ↔ FAMILY_OBJECT_UNIVERSE_V1 + ATTRIBUTE_TREE_STANDARD_V1(truth_type/owner/provenance)
Capability-Skill  ↔ CAPABILITY_TRUTH_REGISTRY(true_class)+ FPAI_INTELLIGENCE_ARCHITECTURE_V2(pipeline/编排)
关系/状态/动作     ↔ RELATION_GRAPH_V1 / STATE_ACTION_MATRIX_V1(allowed_named_actions 来自此)
授权             ↔ AUTHORIZATION_REGISTRY(运行/生产)
```

## 5. 本阶段边界
- 只产出**声明规范 + 治理**(本文件);**不建** Skill 运行引擎/注册中心/动态加载器(留 RB-003 PASS 后单独裁决)。
- 现有代码不按 Skill 重写(KEEP→RECLASSIFY→…);Skill 模型先作为"如何表达对象与能力"的架构语言落地。
