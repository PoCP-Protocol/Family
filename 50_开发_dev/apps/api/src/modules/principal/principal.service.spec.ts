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
  const state = { called: false, lastImages: undefined as unknown };
  const gw: AiGateway = {
    async generateStructured(req: { images?: unknown }) {
      state.called = true; state.lastImages = req.images;
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
    countRealModelRunsToday: vi.fn(async () => 0),
    saveModelRun: vi.fn(async () => {}),
    saveHandoff: vi.fn(async () => {}),
    saveResponse: vi.fn(async () => ({ response_id: 'r1' })),
    saveProposal: vi.fn(async () => ({ proposal_id: 'p1' })),
  } as unknown as ConstructorParameters<typeof PrincipalService>[0];
}

const row = (status: 'GRANTED' | 'WITHDRAWN'): CanonicalConsentRow =>
  ({ subject_person_id: 'child-1', guardian_person_id: 'mom-1', purpose: 'AI_PERSONALIZATION', status, policy_version: 'v1' });

async function handle(consents: CanonicalConsentRow[], profile: string | undefined, message: string, images?: Array<{ media_type: string; data: string }>) {
  if (profile) process.env.FPAI_RUNTIME_PROFILE = profile; else delete process.env.FPAI_RUNTIME_PROFILE;
  const { gw, state } = spyGateway();
  const svc = new PrincipalService(fakeRepo(consents), {} as never, gw);
  const res = await svc.handleMessage('fam-1', 'sess-1', 'child-1', 'actor-1', message, 'corr-1', images);
  return { state, res };
}

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
