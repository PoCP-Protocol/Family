# FAMILY_ARCHITECTURE_TRUTH_GATE — M3-RB-003

date: 2026-08-12 · branch: `m3/rb-003`(off master `f062ace`)· status: **PASS_PROPOSED,待总架构师终裁**

## 阶段产出(8 资产 + 审计 + 最小 Skill 运行时)
```
1 architecture/rb-003/FAMILY_OBJECT_UNIVERSE_V1.md              ✓(五类+身份对象;动态可扩展)
2 architecture/rb-003/FAMILY_OBJECT_ATTRIBUTE_TREE_STANDARD_V1.md ✓(动态可扩展 + Attribute Truth Type)
3 architecture/rb-003/FAMILY_OBJECT_RELATION_GRAPH_V1.md        ✓(含 GROUNDED_IN 解 B4)
4 architecture/rb-003/FAMILY_OBJECT_STATE_ACTION_MATRIX_V1.md   ✓(AI 直改 canonical = NO)
5 governance/CAPABILITY_TRUTH_REGISTRY.yaml                     ✓(每能力分类;FAKE_AS_REAL=0)
6 architecture/rb-003/FPAI_INTELLIGENCE_ARCHITECTURE_V2.md      ✓(模型优先 pipeline + 三层安全)
7 architecture/rb-003/FPAI_FAKE_CAPABILITY_RETIREMENT_MATRIX_V1.md ✓(KEEP→DEPRECATE→REMOVE)
8 (本文件)FAMILY_ARCHITECTURE_TRUTH_GATE.md
+ architecture/rb-003/CURRENT_STATE_TRUTH_AUDIT.md              ✓(SSOT 漂移已校正)
+ architecture/rb-003/FAMILY_SKILL_MODEL_V1.md                  ✓(Skill 为扩展单元)
+ packages/principal-runtime/src/skill.ts (+ skill.spec.ts)     ✓(最小真实 Skill 运行时,非通用引擎;30 测试绿)
```

## 门判定
```
## Gate A — Object Truth
OBJECT_INVENTORY = PASS            # 五类 + 身份对象,反向抽象自真实迁移/模块
ATTRIBUTE_TREE_STANDARD = PASS     # 统一模板 + truth_type;动态可扩展为一等约束
RELATION_GRAPH = PASS
CANONICAL_OWNER = PASS             # 见 STATE_ACTION_MATRIX Owner 列
NAMED_ACTION_MAPPING = PASS

## Gate B — Capability Truth
ALL_CURRENT_CAPABILITIES_CLASSIFIED = PASS   # CAPABILITY_TRUTH_REGISTRY 逐条
FAKE_AS_REAL_CAPABILITY = 0                  # 确定性 soul/关键词已标 TEST_BASELINE/GUARDRAIL,不再冒充智能
TEST_FIXTURE_AS_PRODUCT_CAPABILITY = 0
PROTOTYPE_AS_RUNTIME = 0

## Gate C — Intelligence Truth
MODEL_FIRST_ARCHITECTURE = PASS(定义)        # V2 pipeline 冻结;实现翻转在 W2R-102
DETERMINISTIC_PRINCIPAL_AS_INTELLIGENCE = NO # 已降级为 fallback/test baseline
HARD_SAFETY_RULES = RETAIN                   # Layer-1 tripwire 保留
MODEL_UNDERSTANDING_CONTRACT = PASS(定义)    # PrincipalUnderstandingV1
SAFE_FALLBACK = PASS                         # 不再伪装校长

## Gate D — Knowledge Truth
KNOWLEDGE_VS_FAMILY_EVIDENCE = SEPARATED     # ResearchEvidence(E0-E7,NON_DECISIVE) vs FamilyEvidenceRecord
B4_RECONCILIATION = PASS                     # GrowthDimension GROUNDED_IN Construct(不复制字段)
B5_RECONCILIATION = PASS(方向)               # Method/Modality/Program grounding 关系已定
MINIMUM_EVIDENCE_GROUNDING_PLAN = PASS(计划)  # 首链 LISTEN_BEFORE_RESPOND(Theory→Construct→Method→Modality),W2R-103 实作

## Gate E — Execution Truth
PROJECT_STATUS_DRIFT = 0          # 已校正(见 CURRENT_STATE_TRUTH_AUDIT)
AUTHORIZATION_TRUTH = PASS        # 真实外部模型默认/ pilot 仍 NOT_AUTHORIZED,明确保留
CURRENT_BRANCH_TRUTH = PASS       # master=f062ace;RB-003 于 m3/rb-003
CURRENT_GATE_TRUTH = PASS         # CURRENT_EXECUTION_GATE=M3_RB_003
```

## 边界与未决
```
本阶段不做(§28):Generic Object/Attribute/Skill Engine · 图数据库 · Knowledge Graph 平台 · World Model · Causal · SFT/LoRA · 新 provider/intervention/dimension。
已建的 Skill 运行时是【最小真实】(注册+校验+授权门控 FAIL CLOSED+guardrail 恒跑),非通用引擎(应架构师"B"裁决)。
Gate C/D 的 PASS 多为【定义/计划】层;真正实现(模型优先默认、循证检索)在下一阶段 M3-W2R,且真实模型默认仍 NO_CHANGE 直到 W2R-102 受控内部门。
```

## 结论
```
M3_RB_003 = PASS_CLOSED(总架构师终裁 2026-08-12;Gate A-E 均达标;BLOCKERS=0)
下一阶段 = M3-W2R:W2R-101 对象化 Principal 上下文 → W2R-102 受控模型优先内部门(真实模型内部默认打开,需 registry 授权 + 单一获批模型 + 内部 dogfood + 真实 consent + 获批 provider + 真实 ModelRun/Attempt 账本;仍非 100-family pilot)→ W2R-103 循证检索 → W2R-104 智能 eval → W2R-105 Human Confirmation 闭环 → W2R-106 Check-in/Timeline/Return → W2R-107 Golden Family 浏览器 E2E。
边界:真实模型内部默认的翻转在 W2R-102 单独门 + AUTHORIZATION_REGISTRY 落记;pilot 仍未授权。
```
