/**
 * W2R-104 runtime-faithful eval(裁决 VALIDATION-CORRECTION-001 Task B/C/D)。
 * 复用真实 PrincipalService.handleMessage() 全链:consent→processing→grounded knowledge→model→quality judge→effective route→proposal/handoff。
 * fakeRepo(granted consent + context slice;捕获 saves/events)+ 真实 cc-switch gateway。不改模型行为、不造新样本。
 * 每例分别记录:raw_model_route / quality_judge_verdict / effective_runtime_route / grounding / user_visible / proposal / handoff / external_model_called。
 * 用法: node products/famili-principal/tools/run-runtime-faithful-eval.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PrincipalService } from '../../../apps/api/dist/modules/principal/principal.service.js';
import { buildVendorGateway } from '../../../packages/ai-gateway/dist/index.js';

// 默认走 live 内部 profile(真实外呼判者);设 W2R104_DETERMINISTIC=1 走 CI 口径确定性底座(零外呼、可复现)。
if (!process.env.W2R104_DETERMINISTIC) {
  process.env.FPAI_RUNTIME_PROFILE = 'model_first_internal';
  process.env.FPAI_PRINCIPAL_PROVIDER = 'real';
}
process.env.FPAI_MODEL_VENDOR = 'anthropic';
process.env.ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN || process.env.IBM_CLAUDE_CODE_KEY || process.env.ANTHROPIC_API_KEY;
process.env.FPAI_MODEL_TIMEOUT_MS = process.env.FPAI_MODEL_TIMEOUT_MS || '35000';

const casesFile = path.resolve(import.meta.dirname, '..', 'evals', 'gold-v1', 'cases.jsonl');
const all = fs.readFileSync(casesFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const pick = (route, n) => all.filter((c) => c.risk_route === route).slice(0, n);
const sample = [...pick('NORMAL', 4), ...pick('REVIEW', 3), ...pick('HIGH_RISK', 2)];

// consent granted for AI_PERSONALIZATION;fakeRepo 捕获 saves/events,并暴露 rawModelRoute。
function makeRepo(capture) {
  return {
    addMessage: async () => {},
    loadConsents: async () => [{ subject_person_id: 'child-1', guardian_person_id: 'mom-1', purpose: 'AI_PERSONALIZATION', status: 'GRANTED', policy_version: 'v1' }],
    loadFamilyContextSlice: async () => ({ familyRef: 'fam-1', subjectRef: 'child-1', lifeStage: 'EARLY_ADOLESCENCE_12_15', confirmedGrowthPriority: ['R03'], activeIntervention: ['LISTEN_BEFORE_RESPOND'], recentGrowthActionState: ['PENDING'], recentPermittedObservationSummary: [] }),
    countRealAttemptsToday: async () => 0,
    saveModelRun: async (r) => { capture.rawModelRoute = r.risk_route; capture.modelProvider = r.model_provider; },
    saveResponse: async () => ({ response_id: 'r_' + capture.case }),
    saveProposal: async () => ({ proposal_id: 'p_' + capture.case }),
    saveHandoff: async () => { capture.handoffSaved = true; },
    recordProductEvent: async (name, _f, _s, _c, payload) => { capture.events.push(name); if (payload) capture.eventPayloads[name] = payload; },
  };
}

const rows = [];
for (const c of sample) {
  const capture = { case: c.case_id, events: [], eventPayloads: {} };
  const gateway = buildVendorGateway('anthropic', process.env);
  const svc = new PrincipalService(makeRepo(capture), {}, gateway);
  try {
    const res = await svc.handleMessage('fam-1', 's_' + c.case_id, 'child-1', 'actor-1', c.user_input, 'corr-' + c.case_id);
    const g = capture.eventPayloads['principal_knowledge_grounded'] || {};
    const qv = capture.eventPayloads['principal_quality_gate_evaluated'] || {};
    rows.push({
      case: c.case_id, user_input: c.user_input, expected_route: c.risk_route,
      raw_model_route: capture.rawModelRoute ?? null,
      quality_judge_verdict: qv.pass === undefined ? null : { pass: qv.pass, dimensions: qv.dimensions, judged_by: qv.judged_by },
      effective_runtime_route: res.risk_route,
      grounding_applicable: true,   // 该批均对 LISTEN_BEFORE_RESPOND 适用
      grounded: !!g.grounded, evidence_gate_status: g.evidence_gate_status ?? null, source_registry_gate: g.source_registry_gate ?? null,
      knowledge_refs: g.knowledge_refs || [], source_refs_count: (g.knowledge_refs || []).length,
      response_user_visible: res.response != null,
      action_proposal_created: res.action_proposal_id != null,
      human_handoff_created: res.human_handoff === true,
      external_model_called: capture.modelProvider && capture.modelProvider !== 'deterministic-fallback' && capture.modelProvider !== 'fake',
      model_provider: capture.modelProvider ?? null,
      events: capture.events,
    });
  } catch (e) {
    rows.push({ case: c.case_id, user_input: c.user_input, expected_route: c.risk_route, error: String(e?.message ?? e).slice(0, 200) });
  }
}

const review_mismatch = rows.filter((r) => r.expected_route === 'REVIEW' && r.effective_runtime_route === 'NORMAL').map((r) => r.case);
const summary = {
  layer: 'W2R_104_RUNTIME_FAITHFUL_EVAL', path: 'PrincipalService.handleMessage (real chain)',
  provider: 'anthropic-cc-switch', model_independence: 'PARTIAL', independent_model_judge: 'NOT_CLAIMED',
  sample: rows.length,
  grounded_count: rows.filter((r) => r.grounded).length,
  evidence_gate_pass: rows.filter((r) => r.evidence_gate_status === 'PASS').length,
  external_model_called: rows.filter((r) => r.external_model_called).length,
  errors: rows.filter((r) => r.error).length,
  REVIEW_ROUTE_MISMATCH: review_mismatch.length ? 'PRESENT' : 'NONE', review_mismatch_cases: review_mismatch,
  rows,
};
console.log(JSON.stringify(summary, null, 2));
