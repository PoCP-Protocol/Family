# FAMILY_OBJECT_RUNTIME_BLUEPRINT_V1 — M3-RB-003(运行时底座)

status: DRAFT — 架构层设计,**需 change-review 后方可据以扩展**;不改 `10_规格_spec`(只引用)。
date: 2026-08-14
purpose: 把 RB-003 已写好的对象/属性/Skill 标准**从"文档"收敛为"运行时引擎"的统一蓝图**,并定义能力层生成式化的分期路线。

> 本蓝图不新增 canonical schema、不新增外呼、不自增授权。它是"如何把既有标准跑起来"的工程契约,上位服从 FGAIM 方法论与 CLAUDE.md 硬规则。

---

## 1. 收敛:一条主链贯穿五份标准

FGAIM 主链 `Ontology × Evidence × Decision × Agent × Action × Outcome × Causality × Learning`(`10_规格_spec/01_实施方法论`)在运行时落成如下**单向数据流**:

```
Object-Skill 声明(世界长什么样)            ← FAMILY_OBJECT_UNIVERSE_V1 / FAMILY_SKILL_MODEL_V1 §1
   │  register(validateSkill)
   ▼
AttributeTree 投影(对象语义视图,多源聚合)   ← FAMILY_OBJECT_ATTRIBUTE_TREE_STANDARD_V1 §1/§2/§5
   │  每属性带 truth_type/source/owner/provenance/mutability
   │  AI_INFERENCE/PROPOSAL 分区 = 视图只读,非 canonical
   ▼
[读] 生成式能力层 Capability-Skill           ← FAMILY_SKILL_MODEL_V1 §2 / FPAI_INTELLIGENCE_ARCHITECTURE_V2
   │  SkillRuntime.dispatch(授权 FAIL CLOSED)→ 模型 handler
   │  产出 PROPOSAL / AI_INFERENCE(绝不写 canonical)
   ▼
[写] WriteGuard(mutability 声明式强制)        ← ATTRIBUTE_TREE_STANDARD_V1 §3/§6 + STATE_ACTION_MATRIX_V1
   │  named_action_only 的 FACT 仅在 allowed_named_actions 内可写;越权 FAIL CLOSED
   ▼
Named Action(唯一 canonical 写口)→ Event / Audit / Outcome
```

三支柱不变量(CAPABILITY_TRUTH principle):**MODEL UNDERSTANDS(生成式理解)· RULES CONSTRAIN(护栏约束)· HUMANS CONFIRM(人工确认)**。本底座把这三支柱变成三段可执行的运行时:投影(理解的输入)、WriteGuard(约束)、Named Action + Human Gate(确认)。

---

## 2. 现状锚点:`skill.ts` 已越过"纯文档"

`packages/principal-runtime/src/skill.ts` 已实现最小真实原语:`ObjectSkill/CapabilitySkill` 类型、`validateSkill`(声明期治理校验)、`SkillRegistry`、`SkillRuntime`(`resolveObjectView` + `dispatchCapability`,授权 FAIL CLOSED)。**但未接入任何调用方**。

> 因此 P1 不是从零造引擎,而是**把 skill.ts 提升为独立 `@family/object-tree` 包并接线**——恰好实现"从文档变运行时"。这与 `FAMILY_SKILL_MODEL_V1 §5`/`ATTRIBUTE_TREE_STANDARD_V1 §7`"本阶段不建 Generic Engine"的边界不冲突:见 §4。

---

## 3. 引擎接口契约(P1 目标)

```ts
// 1) 声明装载(复用 skill.ts)
registry.register(objectSkill)                 // validateSkill 守 FACT↔named_action_only、AI_INFERENCE↔view

// 2) 属性树投影:多源聚合 + 分区 + truth_type 标注
projectObject(objectId, sources): AttributeTreeView
//   AttributeTreeView = { object_id, partitions: { Identity|Core|Growth|Principal|Governance: ResolvedAttr[] } }
//   ResolvedAttr = { name, value, truth_type, source, owner, provenance?, mutability, sensitivity? }
//   AI_INFERENCE/PROPOSAL 分区 canonical=false,禁止回流为可写事实

// 3) 统一写护卫:声明式强制(替代零散 CHECK + 代码纪律)
assertNamedActionWrite({ objectId, attribute, namedAction, truthType }): void   // 违反 → throw(FAIL CLOSED)
//   规则:mutability=named_action_only 的属性,namedAction 必须 ∈ 该对象 allowed_named_actions
//         truth_type ∈ {AI_INFERENCE, PROPOSAL} → 永不可写 canonical

// 4) 能力分发(复用 skill.ts;生成式住 handler)
runtime.dispatchCapability(capabilityId, input)  // guardrail 恒可跑;否则须 runtime-authorized(authorization_ref)
```

**契约不变量**:引擎不持有 canonical 写权;它只**校验/投影/分发**。真正写 canonical 仍在 Named Action 服务内(事务+权限+幂等+audit),WriteGuard 作为其**新增声明式守卫**与既有命令式守卫并存互补。

---

## 4. 边界(严格守 §7 / §28)

- **不建通用图数据库 / Generic Attribute Engine**:AttributeTree 是"对象语义视图"的投影协议,不是存储引擎;数据仍在既有 canonical 表。
- **不在请求路径动态改 canonical schema**:新 FACT 字段/新 GrowthDimension 仍走迁移 + Named Action。声明式"热扩展"仅限**投影视图与 AI 视图分区**。
- **Skill 不自授权**:Capability-Skill 的运行/pilot/生产授权仍由 `AUTHORIZATION_REGISTRY` 单独管;true_class 登记于 `CAPABILITY_TRUTH_REGISTRY`。
- **Layer-1 硬 tripwire 不可插拔**:安全短路不进"可停用"Skill 面。

---

## 5. 分期路线

| 阶段 | 内容 | 授权/边界 |
|---|---|---|
| **P1(本次)** | `@family/object-tree`:AttributeTree 投影 + 统一 WriteGuard + seed Object-Skill 声明;接 3 个 Named Action + Principal 上下文投影 | 确定性基础设施,`DETERMINISTIC_GUARDRAIL`;无外呼、不写新 canonical、**不需新授权** |
| **P2** | 声明式 Skill Registry 装载器 + 全对象激活;`extends`/组合;向后兼容(未知属性安全忽略) | 仍为声明/投影层;canonical 变更走迁移 |
| **P3** | 生成式能力层:`PrincipalUnderstandingV1` 以 Capability-Skill 取代 `detectScenario`/`actionForScenario` 等 if/else 伪能力;产出 AI_INFERENCE/PROPOSAL,经 WriteGuard + Named Action + Human Gate | **需模型授权**,仅内部 dogfood;复用已获批 provider;单独 gate |

---

## 6. 与既有资产挂钩

```
Object-Skill        ↔ FAMILY_OBJECT_UNIVERSE_V1 + FAMILY_OBJECT_ATTRIBUTE_TREE_STANDARD_V1
allowed_named_actions ↔ FAMILY_OBJECT_STATE_ACTION_MATRIX_V1
relations           ↔ FAMILY_OBJECT_RELATION_GRAPH_V1
Capability-Skill    ↔ CAPABILITY_TRUTH_REGISTRY(true_class)+ FPAI_INTELLIGENCE_ARCHITECTURE_V2(pipeline)
运行/生产授权        ↔ AUTHORIZATION_REGISTRY
运行时原语           ↔ packages/principal-runtime/src/skill.ts(P1 提升为 @family/object-tree)
第一个投影消费者      ↔ principal-runtime buildPrincipalFamilyContext + principal.repository loadFamilyContextSlice
```
