# M3-000 — Famili Principal Intelligence Integration Contract Freeze

stage: `M3-000_FPAI_INTELLIGENCE_INTEGRATION_CONTRACT_GATE = AUTHORIZED`
baseline: `600c08e`（origin/wave/m2-wave2-integration,fetch 确认)
isolation: branch `m3/fpai-intelligence-contract-gate` @ worktree `D:\Family-m3-fpai`
authorization (unchanged): `M3_RUNTIME / M3-101_RUNTIME / REAL_MODEL_RUNTIME / AGENT_RUNTIME / WORLD_MODEL / CAUSAL_ENGINE / MODEL_TRAINING / DH1 / VOICE_RUNTIME / AVATAR_RUNTIME = NOT_AUTHORIZED`

> 本阶段只回答一个问题:**法咪莉校长如何读取 Family 合法上下文 → 生成 AI 建议 → 用户明确确认后,经既有 Named Action 安全进入确定性 Family Growth Loop?** 只冻结边界与契约,不写 runtime。

---

## 一、既有资产复用审计（真实,不重造)

**唯一智能核心 = `@family/principal-ai`(已存在,禁止造第二套 Principal Engine)。** 实测导出:
- Soul:`PRINCIPAL_SOUL_PROFILE` / `PRINCIPAL_SOUL_VERSION` / `PrincipalSoulProfile` / `PrincipalSoulCompiled` / `getPrincipalSoulProfile`
- 结构化输出:`PRINCIPAL_AI_OUTPUT_SCHEMA` / `PRINCIPAL_AI_SCHEMA_VERSION` / `PRINCIPAL_AI_PROMPT_VERSION` / `PrincipalAiInput` / `PrincipalAiOutput` / `PrincipalAiRunResult` / `validatePrincipalOutput` / `evaluatePrincipalOutput`
- 行动卡:`PRINCIPAL_ACTION_CARD_SCHEMA` / `PrincipalActionCard` / `createActionCard`
- 今晚说:`SAY_IT_TONIGHT_SCHEMA` / `SayItTonightOutput`
- 检索:`REVIEWED_METHOD_CARDS` / `REVIEWED_KNOWLEDGE_CARDS` / `PrincipalMethodCard` / `PrincipalKnowledgeCard` / `retrievePrincipalAssets` / `PrincipalRetrievalResult`
- 安全:`safetyPrecheck` / `safetyPostcheck` / `PrincipalRiskRoute`
- 模型执行:`PrincipalModelRun` / `PrincipalTokenUsage` / `buildPrincipalAiGatewayRequest` / `askPrincipal`
- 同意/场景:`PrincipalConsentContext` / `detectScenario` / `PrincipalScenarioId` / `PrincipalAiEntryPoint` / `FUTURE_ONLY_CAPABILITIES`

**唯一 Provider Gateway = `@family/ai-gateway`(已存在,禁止造第二个 Gateway)。** 导出:`AiGateway`(接口)/ `FakeAiGateway` / `OpenAICompatibleAiGateway` / `AI_GATEWAY_POLICY` / `StructuredGenerationRequest|Result|Metadata`。

**结论:M3 智能核心与 Provider 抽象已具备。M3-000 只需冻结"产品级集成层"的边界契约(Context Broker / Action Bridge / Safety Handoff / ModelRun Ledger / ProductEvent),不新建 persona/prompt/safety/memory,不在 `apps/api` 造第二套 Principal Engine。**

## 二、五层所有权矩阵（Architecture Ownership Matrix）

| Layer | 拥有的对象 | 对 AI 的规则 |
|---|---|---|
| **L1 Family Core** | Family / Parent / Child / Relationship / Consent / LifeStage | AI `READ_ONLY_WHEN_AUTHORIZED`;只经 Named Action 改 |
| **L2 Growth OS** | Evidence / GrowthProfile / GrowthPriority / Intervention / GrowthAction / Reflection / OutcomeObservation / GrowthReview / Timeline / NextStepDecision | **只有 Named Action 能改 canonical state** |
| **L3 Famili Principal** | PrincipalSession / PrincipalMessage / PrincipalResponse / PrincipalActionProposal / PrincipalFeedback / PrincipalModelRun / PrincipalHumanHandoff | 这些 `!= Family canonical truth` 且 `!= Growth canonical state` |
| **L4 AI Gateway** | Provider Abstraction / Structured Generation / Model Invocation Metadata / Timeout / Provider Failure | **禁止** Gateway→Family Repo、→Growth Repo、→Named Action |
| **L5 Action Bridge** | 唯一允许 AI→Growth OS 的桥 | `AI Proposal → Human Confirmation → Approved Application Command → 既有 Named Action → Growth OS`;**禁止** `AI Proposal → Growth DB` |

## 三、冻结:Principal Output 永远不是事实

```
PrincipalResponse        != Fact
PrincipalPattern         != GrowthProfile
PrincipalHypothesis      != Diagnosis
PrincipalActionProposal  != GrowthAction
PrincipalRecommendation  != GrowthPriority
PrincipalReview          != GrowthReview
```
**禁止未来代码出现**(forbidden surface,由契约测试守):
```
model.output.growthProfile → saveGrowthProfile()
model.output.priority      → confirmGrowthPriority()
model.output.action        → insert growth_actions
AiGateway → familyRepository / growthRepository / NamedAction
```

## 四、第一版 Action Bridge 的架构裁决

M3 第一版**不做**"LLM 自由生成 GrowthAction"。改为:
```
PrincipalActionProposal → user accepts → Proposal-to-Intervention Bridge
→ 既有已批准 Intervention → 既有确定性 GrowthAction
```
第一条 bridge 围绕已验证的确定性干预 **`LISTEN_BEFORE_RESPOND`** 设计。法咪莉校长可以说"今晚先听完再回应",但**不能自行插入 `growth_actions`**;用户明确接受后,系统再调用既有 Family Named Action(StartIntervention → Today GrowthAction → CompleteGrowthAction …)。

## 五、M3-000 产出清单(全部为契约/文档/测试,无 runtime)
- 本文件 + `M3_000_SHARED_FILE_CONFLICT_MATRIX.md`
- `FPAI_CONTEXT_BROKER_CONTRACT_V1.md`(含 consent gap analysis)
- `FPAI_ACTION_BRIDGE_CONTRACT_V1.md`
- `FPAI_SAFETY_HUMAN_HANDOFF_CONTRACT_V1.md`
- `FPAI_MODEL_GATEWAY_BOUNDARY_V1.md`
- `FPAI_MODEL_RUN_LEDGER_V1.md`
- `FPAI_PRODUCT_EVENT_CONTRACT_V1.md`
- `FPAI_MOS_TEXT_RUNTIME_SLICE_V1.md`(仅设计)
- `architecture/tests/*`(forbidden-surface / static)+ `tools/m3-dangerous-authorization-scan.mjs`
- `M3_000_GATE.md`
