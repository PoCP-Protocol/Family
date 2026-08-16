import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AiGateway, StructuredGenerationResult } from '@family/ai-gateway';
import type { CanonicalConsentRow } from '@family/principal-runtime';
import { PrincipalService } from './principal.service';

// M3-INT-001 §38/§39:Processing Policy 运行时强制 —— 断言"是否真的对外调用"。
// 用 spy gateway 记录 generateStructured 是否被调用 + 是否带图片,验证外呼门与图片隔离。

const VALID_OUTPUT = {
  opening: 'o', what_i_hear: 'w', possible_pattern: 'p', not_the_label: 'n',
  say_it_tonight: 's', one_small_action: '今晚先听孩子说完', look_for: 'l',
  boundary: '这是 AI 陪练建议,不写核心状态', risk_route: 'NORMAL', method_refs: ['M1'],
};

function spyGateway() {
  const state = { called: false, lastImages: undefined as unknown, lastFamilyContext: undefined as unknown };
  const gw: AiGateway = {
    async generateStructured(req: { use_case?: string; images?: unknown; input?: { family_context?: unknown } }) {
      state.called = true;
      // 仅捕获【主模型】调用的上下文/图片;W2R-104 质量 judge(FPAI_PRINCIPAL_QUALITY_EVAL)复用同一网关,不覆写。
      if (req.use_case !== 'FPAI_PRINCIPAL_QUALITY_EVAL') { state.lastImages = req.images; state.lastFamilyContext = req.input?.family_context; }
      return {
        model: 'spy', prompt_version: 'p', schema_version: 's', input_refs: [], generated_at: '',
        validation_status: 'valid', human_status: 'draft', output: { ...VALID_OUTPUT },
        metadata: { model_provider: 'anthropic-compatible', latency_ms: 1 },
      } as unknown as StructuredGenerationResult<object>;
    },
    async embed() { return { model: 'spy', generated_at: '', vectors: [] }; },
  };
  return { gw, state };
}

function fakeRepo(consents: CanonicalConsentRow[]) {
  return {
    addMessage: vi.fn(async () => {}),
    recordProductEvent: vi.fn(async () => {}),
    loadConsents: vi.fn(async () => consents),
    loadFamilyContextSlice: vi.fn(async () => ({
      familyRef: 'fam-1', subjectRef: 'child-1', lifeStage: 'EARLY_ADOLESCENCE_12_15',
      confirmedGrowthPriority: ['R03'], activeIntervention: ['LISTEN_BEFORE_RESPOND'],
      recentGrowthActionState: ['PENDING'], recentPermittedObservationSummary: [],
    })),
    countRealModelRunsToday: vi.fn(async () => 0),
    countRealAttemptsToday: vi.fn(async () => 0),
    saveModelRun: vi.fn(async () => {}),
    saveHandoff: vi.fn(async () => {}),
    saveResponse: vi.fn(async () => ({ response_id: 'r1' })),
    saveProposal: vi.fn(async () => ({ proposal_id: 'p1' })),
  } as unknown as ConstructorParameters<typeof PrincipalService>[0];
}

const row = (status: 'GRANTED' | 'WITHDRAWN'): CanonicalConsentRow =>
  ({ subject_person_id: 'child-1', guardian_person_id: 'mom-1', purpose: 'AI_PERSONALIZATION', status, policy_version: 'v1' });

async function handle(consents: CanonicalConsentRow[], profile: string | undefined, message: string, images?: Array<{ media_type: string; data: string }>, options?: { deliveryMode?: 'LEGACY' | 'ORCHESTRATION_AI_COACH' }) {
  if (profile) process.env.FPAI_RUNTIME_PROFILE = profile; else delete process.env.FPAI_RUNTIME_PROFILE;
  const { gw, state } = spyGateway();
  const repo = fakeRepo(consents);
  const svc = new PrincipalService(repo, {} as never, gw);
  const res = await svc.handleMessage('fam-1', 'sess-1', 'child-1', 'actor-1', message, 'corr-1', images, options);
  return { state, res, repo };
}

describe('W2R-101 object-aware Principal context', () => {
  afterEach(() => { delete process.env.FPAI_RUNTIME_PROFILE; });

  it('consent granted → typed Family Object Context injected (allowlist fields, truth=FACT/state)', async () => {
    const { state } = await handle([row('GRANTED')], 'internal_livecheck', '孩子写作业拖拉怎么办');
    expect(state.called).toBe(true);
    const ctx = state.lastFamilyContext as Record<string, unknown> | undefined;
    expect(ctx).toBeTruthy();
    expect(ctx).toMatchObject({ contextVersion: 'v1', lifeStage: 'EARLY_ADOLESCENCE_12_15', confirmedGrowthPriority: ['R03'], activeIntervention: ['LISTEN_BEFORE_RESPOND'] });
    // 最小必要:不外露私有文本/AI_INFERENCE(仅 allowlist V1 字段)
    expect(Object.keys(ctx as object)).not.toContain('privateText');
  });

  it('no consent → NO object context injected (输出=0,不偷偷降级)', async () => {
    const { state } = await handle([], 'internal_livecheck', '孩子写作业拖拉怎么办');
    expect(state.lastFamilyContext).toBeUndefined();
  });

  it('W2R-102 model_first_internal profile → real model default ON (external called + object context)', async () => {
    const { state } = await handle([row('GRANTED')], 'model_first_internal', '孩子写作业拖拉怎么办');
    expect(state.called).toBe(true);                         // 内部默认走真实模型
    expect(state.lastFamilyContext).toBeTruthy();            // 对象化上下文注入
  });

  it('W2R-102 crisis still short-circuits under model_first_internal (no external call)', async () => {
    const { state, res } = await handle([row('GRANTED')], 'model_first_internal', '孩子说不想活了');
    expect(state.called).toBe(false);                        // 危机不外呼
    expect(res.human_handoff).toBe(true);
  });
});

describe('Principal delivery mode boundary', () => {
  afterEach(() => { delete process.env.FPAI_RUNTIME_PROFILE; });

  it('LEGACY remains the default and writes the existing Action Proposal', async () => {
    const { res, repo } = await handle([row('GRANTED')], undefined, '孩子写作业拖拉怎么办');
    expect(res.risk_route).toBe('NORMAL');
    expect(res.action_proposal_id).toBeTruthy();
    expect(repo.saveProposal).toHaveBeenCalledTimes(1);
  });

  it('ORCHESTRATION_AI_COACH reuses the same safe deterministic pipeline but proposal delta is zero', async () => {
    const { res, repo } = await handle([row('GRANTED')], undefined, '孩子写作业拖拉怎么办', undefined, { deliveryMode: 'ORCHESTRATION_AI_COACH' });
    expect(res.risk_route).toBe('NORMAL');
    expect(res.response).toBeTruthy();
    expect(res.action_proposal_id).toBeNull();
    expect(repo.saveProposal).not.toHaveBeenCalled();
    expect(repo.recordProductEvent).toHaveBeenCalledWith('principal_orchestration_ai_coach_delivered', expect.anything(), expect.anything(), expect.anything(), expect.objectContaining({ proposal_delta: 0, delivery_mode: 'ORCHESTRATION_AI_COACH' }));
  });

  it('ORCHESTRATION_AI_COACH keeps HIGH_RISK fail-closed and does not create a proposal', async () => {
    const { res, repo } = await handle([row('GRANTED')], undefined, '孩子说不想活了', undefined, { deliveryMode: 'ORCHESTRATION_AI_COACH' });
    expect(res.risk_route).toBe('HIGH_RISK');
    expect(res.human_handoff).toBe(true);
    expect(res.action_proposal_id).toBeNull();
    expect(repo.saveProposal).not.toHaveBeenCalled();
  });
});

describe('PrincipalService processing enforcement (M3-INT-001)', () => {
  afterEach(() => { delete process.env.FPAI_RUNTIME_PROFILE; });

  it('AI_PERSONALIZATION granted + internal_livecheck profile → REAL external call happens', async () => {
    const { state } = await handle([row('GRANTED')], 'internal_livecheck', '孩子写作业拖拉怎么办');
    expect(state.called).toBe(true);
  });

  it('default internal profile → NO external call (external OFF by default)', async () => {
    const { state } = await handle([row('GRANTED')], undefined, '孩子写作业拖拉怎么办');
    expect(state.called).toBe(false);
  });

  it('no AI_PERSONALIZATION consent → NO external call', async () => {
    const { state } = await handle([], 'internal_livecheck', '孩子写作业拖拉怎么办');
    expect(state.called).toBe(false);
  });

  it('AI_PERSONALIZATION withdrawn → NO external call', async () => {
    const { state } = await handle([row('WITHDRAWN')], 'internal_livecheck', '孩子写作业拖拉怎么办');
    expect(state.called).toBe(false);
  });

  it('HIGH_RISK message → NO external call (precheck short-circuit), even with consent + profile', async () => {
    const { state, res } = await handle([row('GRANTED')], 'internal_livecheck', '孩子说不想活了');
    expect(state.called).toBe(false);
    expect(res.human_handoff).toBe(true);
  });

  it('images provided → external call proceeds but images are QUARANTINED (not sent to provider)', async () => {
    const { state } = await handle([row('GRANTED')], 'internal_livecheck', '看看孩子的作业照片', [{ media_type: 'image/png', data: 'B64' }]);
    expect(state.called).toBe(true);
    expect(state.lastImages).toBeUndefined();
  });
});

// ---------- W2R-104 智能质量闸接线 ----------
// use_case 感知网关:主模型输出 FAMILI_PRINCIPAL_TEXT_MVP,质量 judge 输出 FPAI_PRINCIPAL_QUALITY_EVAL。
function useCaseAwareGateway(mainOutput: object, judgeVerdict: object) {
  const state = { qualityJudgeCalled: false, mainCalled: false };
  const gw: AiGateway = {
    async generateStructured(req: { use_case?: string }) {
      const isJudge = req.use_case === 'FPAI_PRINCIPAL_QUALITY_EVAL';
      if (isJudge) state.qualityJudgeCalled = true; else state.mainCalled = true;
      return {
        model: 'ucg', prompt_version: 'p', schema_version: 's', input_refs: [], generated_at: '',
        validation_status: 'valid', human_status: 'draft',
        output: isJudge ? { ...judgeVerdict } : { ...mainOutput },
        metadata: { model_provider: 'anthropic-compatible', latency_ms: 1 },
      } as unknown as StructuredGenerationResult<object>;
    },
    async embed() { return { model: 'ucg', generated_at: '', vectors: [] }; },
  };
  return { gw, state };
}

// 主模型输出:结构合法、what_i_hear 内嵌用户消息(确定性底座理解维度 PASS,隔离出 judge 的决定权)。
const reflectingOutput = (message: string) => ({ ...VALID_OUTPUT, what_i_hear: `我听到你说:${message}` });

function repoWithSpies(consents: CanonicalConsentRow[]) {
  // 合并:W2R-104 eventPayloads(judge/grounding 事件断言)+ W2R-105 lastHandoffResponseId 与内存态闭环。
  const calls = { events: [] as string[], proposalSaved: 0, handoffSaved: 0, eventPayloads: {} as Record<string, unknown>, lastHandoffResponseId: null as string | null };
  // W2R-105:极简内存态,让 REVIEW 扣留 → 人工确认 → 释放的闭环可在单测里端到端验证。
  const responses = new Map<string, unknown>();
  const handoffs = new Map<string, { family_id: string; status: string; resolution: string | null; response_id: string | null; released_at: Date | null }>();
  let hSeq = 0;
  const repo = {
    addMessage: vi.fn(async () => {}),
    recordProductEvent: vi.fn(async (name: string, _f?: unknown, _s?: unknown, _c?: unknown, payload?: unknown) => { calls.events.push(name); calls.eventPayloads[name] = payload; }),
    loadConsents: vi.fn(async () => consents),
    loadFamilyContextSlice: vi.fn(async () => ({
      familyRef: 'fam-1', subjectRef: 'child-1', lifeStage: 'EARLY_ADOLESCENCE_12_15',
      confirmedGrowthPriority: ['R03'], activeIntervention: ['LISTEN_BEFORE_RESPOND'],
      recentGrowthActionState: ['PENDING'], recentPermittedObservationSummary: [],
    })),
    countRealModelRunsToday: vi.fn(async () => 0),
    countRealAttemptsToday: vi.fn(async () => 0),
    saveModelRun: vi.fn(async () => {}),
    saveHandoff: vi.fn(async (_s: string, familyId: string, _subj: string, _route: string, _trig: string, _role: string | null = null, responseId: string | null = null) => {
      calls.handoffSaved += 1; calls.lastHandoffResponseId = responseId;
      handoffs.set(`h${++hSeq}`, { family_id: familyId, status: 'OPEN', resolution: null, response_id: responseId, released_at: null });
    }),
    saveResponse: vi.fn(async (_s: string, _f: string, _r: string, _v: boolean, output: unknown) => { responses.set('r1', output); return { response_id: 'r1' }; }),
    saveProposal: vi.fn(async () => { calls.proposalSaved += 1; return { proposal_id: 'p1' }; }),
    resolveHandoff: vi.fn(async (handoffId: string, familyId: string, _actor: string, resolution: string) => {
      const h = handoffs.get(handoffId);
      if (!h || h.family_id !== familyId || h.status !== 'OPEN') return false;
      h.status = 'RESOLVED'; h.resolution = resolution; return true;
    }),
    loadHandoff: vi.fn(async (handoffId: string, familyId: string) => {
      const h = handoffs.get(handoffId);
      return h && h.family_id === familyId ? { handoff_id: handoffId, ...h } : null;
    }),
    markHandoffReleased: vi.fn(async (handoffId: string, familyId: string, responseId: string) => {
      const h = handoffs.get(handoffId);
      if (!h || h.family_id !== familyId || h.response_id !== responseId || h.resolution !== 'APPROVED' || h.released_at) return false;
      h.released_at = new Date(); return true;
    }),
    loadResponse: vi.fn(async (responseId: string) => responses.has(responseId) ? { response_id: responseId, risk_route: 'REVIEW', output: responses.get(responseId) } : null),
  } as unknown as ConstructorParameters<typeof PrincipalService>[0];
  return { repo, calls, handoffs };
}

describe('W2R-104 intelligence quality gate', () => {
  afterEach(() => { delete process.env.FPAI_RUNTIME_PROFILE; });
  const MSG = '孩子写作业拖拉磨蹭怎么办'; // HOMEWORK,precheck=NORMAL

  it('judge 判不合格 → 安全降级 REVIEW + 入复核队列 + 不建 proposal + 记 quality_gate_failed', async () => {
    process.env.FPAI_RUNTIME_PROFILE = 'model_first_internal';
    const { repo, calls } = repoWithSpies([row('GRANTED')]);
    const { gw, state } = useCaseAwareGateway(reflectingOutput(MSG), { understanding: 'FAIL', labeling: 'PASS', risk_leak: 'NONE' });
    const res = await new PrincipalService(repo, {} as never, gw).handleMessage('fam-1', 'sess-1', 'child-1', 'actor-1', MSG, 'corr-1');
    expect(state.qualityJudgeCalled).toBe(true);
    expect(res.risk_route).toBe('REVIEW');           // NORMAL 被质量闸降级
    expect(res.action_proposal_id).toBeNull();       // 不建 proposal
    expect(calls.proposalSaved).toBe(0);
    expect(calls.handoffSaved).toBeGreaterThanOrEqual(1); // 入人工复核队列
    // W2R-105 契约(supersedes W2R-104 过渡):REVIEW 响应【扣留】,不展示给家长,human_handoff=true
    expect(res.human_handoff).toBe(true);
    expect(res.response).toBeNull();                 // 扣留:不吐 output 给家长
    expect(res.response_id).toBe('r1');              // 但候选响应已存,供人工复核
    expect(calls.lastHandoffResponseId).toBe('r1');  // response_id 挂到 handoff
    expect(calls.events).toContain('principal_quality_gate_failed');
    expect(calls.events).toContain('principal_review_queued');
  });

  it('judge 判合格 → 保持 NORMAL,建 Action Proposal', async () => {
    process.env.FPAI_RUNTIME_PROFILE = 'model_first_internal';
    const { repo, calls } = repoWithSpies([row('GRANTED')]);
    const { gw } = useCaseAwareGateway(reflectingOutput(MSG), { understanding: 'PASS', labeling: 'PASS', risk_leak: 'NONE' });
    const res = await new PrincipalService(repo, {} as never, gw).handleMessage('fam-1', 'sess-1', 'child-1', 'actor-1', MSG, 'corr-1');
    expect(res.risk_route).toBe('NORMAL');
    expect(res.action_proposal_id).toBe('p1');
    expect(calls.proposalSaved).toBe(1);
    expect(calls.events).toContain('principal_quality_gate_evaluated');
    expect(calls.events).not.toContain('principal_quality_gate_failed');
    // W2R-103B:响应发出 grounding 证据事件;加载器找到 Python 编译的真实链 → gate=PASS、grounded=true
    expect(calls.events).toContain('principal_knowledge_grounded');
    const g = calls.eventPayloads['principal_knowledge_grounded'] as { grounded: boolean; intervention_id: string; family_decision_non_decisive: boolean; knowledge_refs: string[]; evidence_gate_status: string; source_registry_gate: string; highest_grade: string };
    expect(g.grounded).toBe(true);
    expect(g.intervention_id).toBe('LISTEN_BEFORE_RESPOND');
    expect(g.family_decision_non_decisive).toBe(true);
    expect(g.evidence_gate_status).toBe('PASS');
    expect(g.source_registry_gate).toBe('PASS');   // CLOSURE-001:来源机器可核验
    expect(g.highest_grade).toBe('E7');
    expect(g.knowledge_refs.length).toBeGreaterThan(0);
  });

  it('CI/默认 profile → 无 judge 外呼(确定性底座),仍放行正常输出', async () => {
    delete process.env.FPAI_RUNTIME_PROFILE;
    const { repo, calls } = repoWithSpies([row('GRANTED')]);
    const { gw, state } = useCaseAwareGateway(reflectingOutput(MSG), { understanding: 'FAIL', labeling: 'PASS', risk_leak: 'NONE' });
    const res = await new PrincipalService(repo, {} as never, gw).handleMessage('fam-1', 'sess-1', 'child-1', 'actor-1', MSG, 'corr-1');
    expect(state.mainCalled).toBe(false);        // 默认 internal:主模型不外呼
    expect(state.qualityJudgeCalled).toBe(false); // judge 也不外呼(零外呼)
    expect(res.risk_route).toBe('NORMAL');        // 确定性输出经底座放行
    expect(calls.events).toContain('principal_quality_gate_evaluated');
  });
});

describe('W2R-105 Human Confirmation closure', () => {
  afterEach(() => { delete process.env.FPAI_RUNTIME_PROFILE; });

  const MSG = '孩子写作业拖拉磨蹭怎么办';

  // 造一条"扣留中"的 REVIEW handoff:质量闸判不合格 → 响应扣留、response_id 挂 handoff('h1')。
  async function seedWithheldReview() {
    process.env.FPAI_RUNTIME_PROFILE = 'model_first_internal';
    const { repo, calls, handoffs } = repoWithSpies([row('GRANTED')]);
    const { gw } = useCaseAwareGateway(reflectingOutput(MSG), { understanding: 'FAIL', labeling: 'PASS', risk_leak: 'NONE' });
    const svc = new PrincipalService(repo, {} as never, gw);
    const res = await svc.handleMessage('fam-1', 'sess-1', 'child-1', 'actor-1', MSG, 'corr-1');
    expect(res.risk_route).toBe('REVIEW');
    expect(res.response).toBeNull();  // 扣留
    return { svc, repo, calls, handoffs };
  }

  it('APPROVED → 释放此前扣留的候选响应给家长 + 记 response_released 事件', async () => {
    const { svc, calls } = await seedWithheldReview();
    const out = await svc.resolveHandoff('fam-1', 'h1', 'reviewer-1', 'APPROVED', null, 'corr-2');
    expect(out.ok).toBe(true);
    expect(out.released_response).not.toBeNull();                 // 人工确认后释放
    expect(calls.events).toContain('principal_handoff_resolved');
    expect(calls.events).toContain('principal_handoff_response_released');
  });

  it('APPROVED 幂等:二次 resolve 不再释放(handoff 已非 OPEN)', async () => {
    const { svc } = await seedWithheldReview();
    await svc.resolveHandoff('fam-1', 'h1', 'reviewer-1', 'APPROVED', null, 'corr-2');
    const again = await svc.resolveHandoff('fam-1', 'h1', 'reviewer-1', 'APPROVED', null, 'corr-3');
    expect(again.ok).toBe(false);                                 // 已 RESOLVED,不可再次闭环
    expect(again.released_response).toBeNull();
  });

  it('REJECTED / ESCALATED / INFO_ONLY → 不释放(保持扣留)', async () => {
    for (const resolution of ['REJECTED', 'ESCALATED', 'INFO_ONLY']) {
      const { svc, calls } = await seedWithheldReview();
      const out = await svc.resolveHandoff('fam-1', 'h1', 'reviewer-1', resolution, null, 'corr-2');
      expect(out.ok).toBe(true);
      expect(out.released_response).toBeNull();                   // 非 APPROVED 绝不释放
      expect(calls.events).not.toContain('principal_handoff_response_released');
    }
  });

  it('不存在/非本家庭的 handoff → ok=false,不释放', async () => {
    const { svc } = await seedWithheldReview();
    const missing = await svc.resolveHandoff('fam-1', 'h-nope', 'reviewer-1', 'APPROVED', null, 'corr-2');
    expect(missing.ok).toBe(false);
    const otherFamily = await svc.resolveHandoff('fam-2', 'h1', 'reviewer-1', 'APPROVED', null, 'corr-2');
    expect(otherFamily.ok).toBe(false);
  });
});
