/**
 * W2R-104 Final · L3 Model Judge(cc-switch 内部 eval,synthetic gold)。
 * 对有界 gold 样本:真实模型出响应 → 生成式 judge 评 understanding/labeling/risk_leak。
 * 授权:anthropic-cc-switch INTERNAL_EVAL_ONLY(gold/synthetic,不涉真实家庭数据)。
 * 语义:Principal 与 Judge 同族 → SEPARATE_MODEL_JUDGE_RUN;MODEL_INDEPENDENCE=PARTIAL;CORRELATED_MODEL_RISK=PRESENT。
 * 用法: node products/famili-principal/tools/run-model-judge-eval.mjs [sampleN]
 */
import fs from 'node:fs';
import path from 'node:path';
import { runPrincipalTextMvp, assessResponseQuality, safetyPrecheck } from '../../../packages/principal-ai/dist/index.js';
import { buildVendorGateway } from '../../../packages/ai-gateway/dist/index.js';

const env = {
  ...process.env,
  FPAI_PRINCIPAL_PROVIDER: 'real',
  FPAI_MODEL_VENDOR: 'anthropic',
  FPAI_RUNTIME_PROFILE: 'model_first_internal',
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.IBM_CLAUDE_CODE_KEY ?? process.env.ANTHROPIC_API_KEY,
  FPAI_MODEL_TIMEOUT_MS: process.env.FPAI_MODEL_TIMEOUT_MS ?? '35000',
};

const casesFile = path.resolve(import.meta.dirname, '..', 'evals', 'gold-v1', 'cases.jsonl');
const all = fs.readFileSync(casesFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
// 有界样本:每类取前 N(NORMAL 4 / REVIEW 3 / HIGH_RISK 2)
const pick = (route, n) => all.filter((c) => c.risk_route === route).slice(0, n);
const sample = [...pick('NORMAL', 4), ...pick('REVIEW', 3), ...pick('HIGH_RISK', 2)];

function inputOf(c) {
  return {
    request_id: `l3_${c.case_id}`, session_id: `s_${c.case_id}`, entry_point: 'ASK_FAMILI_PRINCIPAL',
    user_message: c.user_input, consent_context: { fpai_lab_consent: true, family_context_read_allowed: true },
  };
}

const agg = { sample: sample.length, model_called: 0, judged_generative: 0, judged_floor: 0, judge_pass: 0, judge_fail: 0,
  high_risk_shortcircuit: 0, errors: [], dims: { understanding: {}, labeling: {}, risk_leak: {} }, rows: [] };
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

for (const c of sample) {
  const input = inputOf(c);
  const precheck = safetyPrecheck(input);
  try {
    // HIGH_RISK 也跑(内部短路,不外呼)以捕获真实"用户可见安全卡"输出,供 L4 专家看。
    const run = await runPrincipalTextMvp(input, buildVendorGateway('anthropic', env));
    const g = run.grounded_knowledge || {};
    if (precheck === 'HIGH_RISK') {
      agg.high_risk_shortcircuit += 1;
      agg.rows.push({ case: c.case_id, user_input: c.user_input, expected_route: c.risk_route, actual_route: run.output.risk_route,
        model_called: false, short_circuit: true, user_facing_safety_response: run.output,
        method_refs: run.output.method_refs || [], source_refs: run.output.source_refs || [] });
      continue;
    }
    if (run.model_run.model_provider !== 'deterministic-fallback') agg.model_called += 1;
    const verdict = await assessResponseQuality(
      { user_message: input.user_message, output: run.output, scenario_id: run.model_run.scenario_id, precheck_route: precheck },
      buildVendorGateway('anthropic', env),
    );
    if (verdict.judged_by === 'generative') agg.judged_generative += 1; else agg.judged_floor += 1;
    verdict.pass ? (agg.judge_pass += 1) : (agg.judge_fail += 1);
    bump(agg.dims.understanding, verdict.dimensions.understanding);
    bump(agg.dims.labeling, verdict.dimensions.labeling);
    bump(agg.dims.risk_leak, verdict.dimensions.risk_leak);
    const isReview = run.output.risk_route === 'REVIEW';
    agg.rows.push({ case: c.case_id, user_input: c.user_input, expected_route: c.risk_route, actual_route: run.output.risk_route,
      model_called: true, model_provider: run.model_run.model_provider,
      actual_principal_output: run.output, method_refs: run.output.method_refs || [], source_refs: run.output.source_refs || [],
      grounded: !!g.grounded, evidence_gate_status: g.evidence_gate_status, knowledge_refs: g.knowledge_refs || [],
      review_candidate: isReview, user_visible: !isReview, human_handoff: isReview,
      judged_by: verdict.judged_by, judge_pass: verdict.pass, judge_dimensions: verdict.dimensions });
  } catch (e) {
    agg.errors.push({ case: c.case_id, err: String(e?.message ?? e).slice(0, 160) });
  }
}

const summary = {
  layer: 'L3_MODEL_JUDGE', provider: 'anthropic-cc-switch',
  model_independence: 'PARTIAL', correlated_model_risk: 'PRESENT', independent_model_judge: 'NOT_CLAIMED',
  sample: agg.sample, model_called: agg.model_called, high_risk_shortcircuit: agg.high_risk_shortcircuit,
  judged_generative: agg.judged_generative, judged_floor: agg.judged_floor,
  judge_pass: agg.judge_pass, judge_fail: agg.judge_fail, dims: agg.dims,
  errors: agg.errors.length, error_detail: agg.errors, rows: agg.rows,
};
console.log(JSON.stringify(summary, null, 2));
