# FPAI_FAKE_CAPABILITY_RETIREMENT_MATRIX_V1 — M3-RB-003

原则:**KEEP CODE → RECLASSIFY FIRST → DEPRECATE SECOND → REMOVE LAST。** 现有"假能力"不立即删;
必须先 (1) 分类 → (2) 存在真替代 → (3) eval 通过 → (4) 消费集成通过 → (5) 才退役。

| capability | current_role | true_class | user_visible | current_default | replacement | disposition | removal_gate |
|---|---|---|---|---|---|---|---|
| `createDeterministicPrincipalResponse` + `actionForScenario` | 作为校长回应默认输出 | TEST_BASELINE + SAFE_FALLBACK | 是 | **是(问题)** | Model-first Principal(真模型) | **DEPRECATE** | W2R-102 真模型内部默认 + W2R-104 智能 eval 通过 |
| `detectScenario`(关键词) | 主场景识别 | TEST_BASELINE / LEGACY_HEURISTIC | 否 | 是 | `PrincipalUnderstandingV1`(模型理解) | **DEPRECATE** | W2R-102 模型理解契约通过 |
| `safetyPrecheck`(HIGH_RISK 关键词) | 安全路由 | **DETERMINISTIC_GUARDRAIL** | 否 | 是 | —(护栏,不替换) | **KEEP** | 永久保留为 Layer-1 硬 tripwire |
| `FakeAiGateway` | 测试替身 | TEST_BASELINE | 否 | 否 | — | **KEEP** | 仅测试 |
| `runPrincipalTextMvp` 默认注入假 soul | 编排默认走 fallback | 编排壳(混真假) | 是 | 是 | 默认注入真模型,fallback 仅降级 | **REWORK** | W2R-102 |
| `AnthropicAiGateway`/`ZhipuAiGateway` | 真模型引擎(默认关) | **REAL_MODEL_INTELLIGENCE** | 否 | 否 | —(应提升为默认) | **PROMOTE** | W2R-102 受控内部门 + AUTHORIZATION_REGISTRY |
| `AliyunSmsSender`(手写) | 真实短信 adapter | ADAPTER | 否 | 否 | 待厂商凭证+合规再接 | **REMOVED**(已撤,未并入) | — |
| `waf.js`/`principal.js` 消费页 | 消费端章节 | PROTOTYPE | 是 | 是 | 真智能 + 循证后成为产品 | **KEEP** | PRODUCT_VALUE_GATE |

## 关键翻转(RB-003 定调,W2R 执行)
```
现状:  假 soul = 默认;真模型 = 关着的旁路;关键词 = 主场景/安全引擎
目标:  真模型 = 校长默认智能;关键词 = 仅 Layer-1 硬安全 tripwire + 测试基线
       假 soul = 仅"模型不可用"时的 SAFE_FALLBACK(且不得伪装成校长继续输出)
```

## Fallback 新规则(§16)
模型不可用时**禁止**:伪装成校长继续输出"像真的一样"的模板建议。
**只允许**:`SAFE_GENERIC_GUIDANCE` / `TEMPORARILY_UNAVAILABLE` / `REVIEW` / `HUMAN_HANDOFF`。

## 门(Gate B)
```
ALL_CURRENT_CAPABILITIES_CLASSIFIED = 见 governance/CAPABILITY_TRUTH_REGISTRY.yaml
FAKE_AS_REAL_CAPABILITY = 0    # 本矩阵已把每个假能力显式标注 disposition
TEST_FIXTURE_AS_PRODUCT_CAPABILITY = 0
PROTOTYPE_AS_RUNTIME = 0
```
注:本矩阵只做"分类 + 退役计划",不在 RB-003 内删除任何代码(REMOVE LAST)。
