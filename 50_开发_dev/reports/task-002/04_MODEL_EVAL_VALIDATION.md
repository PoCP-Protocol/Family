# TASK-002 — Model Router & Evaluation Validation

**Agent:** AI-04 (Model Router & Evaluation Validator)
**Date:** 2026-08-09
**Scope:** READ + 静态校验 + golden JSONL 实测(ajv draft 2020)。未改任何契约,未跑 pnpm/git/build。

---

## VERDICT: **CONDITIONAL_PASS**

核心设计正确(Hard Filter > Weighted Score 成立,Safety 不可被 Cost 绕过),golden JSONL 全部通过 schema 实测。存在 1 个 P1 状态不一致(routing rule 与 hard_filter 对 `OPTIONAL` 模型的矛盾)会导致 HIGHLY_SENSITIVE 场景错误 ABSTAIN,需修复后转 PASS。

---

## A. Model Router 校验(10 点 + 优先级确认)

| # | 检查项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | Data Class 先于价格(硬过滤优先) | PASS | `ROUTER_PSEUDOCODE.md` L8 `allowedByDataClass` 为第一个 filter;`selection_score.hard_filters` 含 `data_class <= model.data_class_max`。Cost 仅 0.05 权重且在过滤后。 |
| 2 | Required Capability 过滤 | PASS | L9 `hasCapabilities(m, policy.requiredCapabilities)`;policy 各 profile 声明 `required_capabilities`。 |
| 3 | Safety blocking gate | PARTIAL (P2) | L10 `passesBlockingEval(m, req.evalProfile)` 为占位,无 eval-result 数据绑定;安全实际靠 routing_rules R001/R002 + RELEASE_THRESHOLDS.safety_recall≥0.98/0.99。gate 逻辑存在但未接实测结果(v0.1 可接受)。 |
| 4 | Approved model 状态 | FAIL (P1) | 见下方 ISSUE-1。registry 中无任何 `APPROVED` 模型;`LOCAL_PRIVATE` 为 `OPTIONAL`。 |
| 5 | primary / fallback | PASS | L21-23 `primary=ranked[0]`,`fallbacks=ranked.slice(1,3)`,受 `policy.fallbackAllowed` 控制。 |
| 6 | 无合格模型 → ABSTAIN | PASS | L12-13 `if(!candidates.length) return ABSTAIN`;R001 `on_no_model: ABSTAIN`。 |
| 7 | HIGH risk → Human Gate | PASS | L24 `humanGateRequired = req.taskRisk==="HIGH" || policy.humanGateRequired`;R002 `require_human_gate: true`。 |
| 8 | HIGHLY_SENSITIVE → 优先受控/本地 | FAIL (P1) | R001 `prefer:[LOCAL_PRIVATE]`,方向正确;但受 ISSUE-1 影响,LOCAL_PRIVATE 会被 hard_filter 剔除。 |
| 9 | Provider 可替换 | PASS | registry 用 `CONFIGURED_PROVIDER` / `LOCAL` 抽象占位,未硬绑具体厂商。 |
| 10 | 业务直接绑定具体模型风险 | PASS | 使用逻辑 model_id(`PRIMARY_REASONING` 等)+ profile 抽象,业务不见物理模型名。低风险。 |

### 优先级确认:Hard Filter > Weighted Score — **成立**
`route()` 顺序为 filter(dataClass)→filter(capabilities)→filter(blockingEval)→**之后**才 `weightedScore` 排序。`selection_score` 权重 quality 0.35 / safety 0.25 / grounding 0.15 / latency 0.10 / cost 0.10 / availability 0.05,cost 无法把不满足 Safety/DataClass 的模型拉入候选集。**不能因 Cost 便宜绕过 Safety — 确认。** `ROUTER_PSEUDOCODE.md` 底部优先级(数据权限 > Safety > quality > grounding > latency/cost)与实现一致。

---

## B. Eval 校验

### RELEASE_THRESHOLDS blocking 逻辑
- `release_rule.all_blocking_metrics_must_pass: true` — 任一 blocking 失败 => RELEASE FAIL,逻辑正确。
- `FAMILY_COMPANION_PROD` blocking:safety_recall≥0.98、structured_output_validity≥0.995、unsupported_claim_rate≤0.03、professional_accuracy≥0.85、grounding_rate≥0.90。方向(min/max)与 `EVAL_METRICS.yaml` 的 `higher_is_better` 全部一致。
- `HUMAN_COPILOT_PROD` 阈值更严(safety_recall≥0.99、accuracy≥0.90、grounding≥0.92、unsupported≤0.02),符合"人机协同更高门槛"预期。
- 指标覆盖:professional_accuracy / grounding_rate / unsupported_claim_rate / safety_recall / human_overturn_rate / abstention_quality / structured_output_validity / latency / cost —— **9 项全部在 EVAL_METRICS.yaml 定义**。
- `regression_tolerance_absolute: 0.02` + `require_human_eval_sample_min: 30` 存在,合理。

### 观察(非阻断)
- P3:`human_overturn_rate` 与 `abstention_quality` 在两个 profile 中均未列为 blocking 或 advisory(FAMILY_COMPANION_PROD 只把 human_overturn_rate 放 advisory,abstention_quality 完全未用)。指标已定义但未接入发布门,建议后续补 advisory。
- P3:`HUMAN_COPILOT_PROD` 无 advisory 段(缺 latency_p95_ms 上限),与 FAMILY_COMPANION_PROD 不对称。

### Golden JSONL 实测(ajv draft 2020,`ajv/dist/2020.js`)
- 文件:`evals/golden_jsonl/sample_golden_cases.jsonl`
- **实测结果:2 行,PASS=2,FAIL=0(100% 符合 GOLDEN_CASE_SCHEMA.json)**
  - Line 1 `FC-001` PASS,Line 2 `SAFE-001` PASS。
- 负控验证(确认校验器非假绿):坏 enum、缺 `suite_id`、rubric 缺 `weight` 三个畸形样本均被正确 REJECT。校验有效。
- 覆盖度观察(P3):golden_jsonl 仅 2 条(1 LOW + 1 CRITICAL),缺 MEDIUM/HIGH 风险样本;CSV 套件(golden/safety/adversarial)尚未转为受 schema 约束的 JSONL。样本量远低于 `require_human_eval_sample_min: 30`,v0.1 种子阶段可接受,量产前需扩量。

---

## 问题清单(标级 + 文件 + 建议)

**[P1] ISSUE-1 — routing rule 与 hard_filter 对模型状态的矛盾**
- 文件:`models/MODEL_REGISTRY.yaml` (L16 `LOCAL_PRIVATE status: OPTIONAL`) × `models/MODEL_ROUTER_POLICY.yaml` (L62 `hard_filters: model.status in [APPROVED, CANDIDATE]`) × R001 (L26-30)。
- 现象:R001 规定 HIGHLY_SENSITIVE 优先 `LOCAL_PRIVATE`,但 hard_filter 只放行 `APPROVED/CANDIDATE`,`OPTIONAL` 会被过滤 → 候选集为空 → 错误 ABSTAIN,HIGHLY_SENSITIVE 私有数据场景无可用模型。
- 建议:二选一 —(a)把 `LOCAL_PRIVATE` 状态改为 `CANDIDATE`(或新增 `APPROVED_LOCAL`);(b)hard_filter 允许清单加入 `OPTIONAL`(仅当 routing rule 显式 prefer 时)。推荐 (a)。

**[P2] ISSUE-2 — Safety blocking gate 未接实测结果**
- 文件:`models/ROUTER_PSEUDOCODE.md` L10 `passesBlockingEval`。
- 现象:函数为占位,无 eval-result → model 的数据绑定;当前安全实际依赖 routing_rules 与 RELEASE_THRESHOLDS,router 运行时 gate 是空壳。
- 建议:定义 eval-result 数据源契约(model × evalProfile → blocking pass/fail),或在 v0.1 明确注释"gate 由发布门离线保证,运行时暂不拦截"。

**[P3] 次要:golden_jsonl 样本量/风险覆盖不足;human_overturn_rate/abstention_quality 未接发布门;HUMAN_COPILOT_PROD 缺 advisory 段。** 均为 v0.1 种子阶段可接受,量产前补齐。

---

## 结论
契约整体设计健全,优先级(数据权限>Safety>Quality>Grounding>Latency/Cost)在伪代码与 selection_score 中一致落地,Cost 无法绕过 Safety。golden JSONL 2/2 通过 schema 实测且校验器经负控验证有效。唯 ISSUE-1(P1)为真实功能缺陷,会使 HIGHLY_SENSITIVE 场景错误弃权,须修复后升为 PASS。故 **CONDITIONAL_PASS**。
