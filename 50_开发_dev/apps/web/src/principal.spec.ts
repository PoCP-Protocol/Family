import { describe, expect, it, vi, beforeEach } from 'vitest';
import { askFamiliPrincipal, confirmProposal, createPrincipalApp, defaultPrincipalConfig } from './principal.js';

const cfg = { ...defaultPrincipalConfig, apiBaseUrl: 'http://api.test' };
const json = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

/** route mock: session -> message -> accept */
function mockFetch(routes: { message?: unknown; accept?: { status: number; body: unknown } }) {
  return vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.endsWith('/principal/sessions')) return json(201, { session_id: 'sess-1' });
    if (url.includes('/messages')) return json(201, routes.message ?? {});
    if (url.includes('/accept')) return json(routes.accept?.status ?? 201, routes.accept?.body ?? {});
    throw new Error(`unexpected url ${url}`);
  });
}

const NORMAL = { risk_route: 'NORMAL', human_handoff: false, response_id: 'r1', action_proposal_id: 'p1', response: { opening: '我听见了', what_i_hear: '作业拖拉', possible_pattern: '启动困难', one_small_action: '今晚只做第一个15分钟' } };
const HIGH_RISK = { risk_route: 'HIGH_RISK', human_handoff: true, response_id: null, action_proposal_id: null, response: null };

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('W2-101 法咪莉校长 consumer chapter', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('askFamiliPrincipal creates session then posts message with x-actor-id + subject_ref', async () => {
    const f = mockFetch({ message: NORMAL }); global.fetch = f as unknown as typeof fetch;
    const r = await askFamiliPrincipal(cfg, '孩子作业拖拉');
    expect(r.risk_route).toBe('NORMAL');
    expect(r.action_proposal_id).toBe('p1');
    const msgCall = f.mock.calls.find((c) => String(c[0]).includes('/messages'));
    expect((msgCall![1] as RequestInit).headers).toMatchObject({ 'X-Actor-Id': cfg.actorPersonId });
    expect(JSON.parse((msgCall![1] as RequestInit).body as string)).toMatchObject({ subject_ref: cfg.childId, message: '孩子作业拖拉' });
  });

  it('NORMAL: renders response + proposal + human-gate confirm button', async () => {
    global.fetch = mockFetch({ message: NORMAL }) as unknown as typeof fetch;
    const root = document.createElement('main');
    createPrincipalApp(root, cfg);
    root.querySelector('textarea')!.value = '孩子作业拖拉';
    root.querySelector<HTMLTextAreaElement>('textarea')!.dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[data-fp-ask]')!.click();
    await tick();
    expect(root.textContent).toContain('今晚只做第一个15分钟');
    expect(root.querySelector('button[data-fp-confirm]')).not.toBeNull();
    expect(root.textContent).toContain('不会写入孩子的成长记录');
  });

  it('HIGH_RISK: shows safety handoff, NO proposal, NO confirm button', async () => {
    global.fetch = mockFetch({ message: HIGH_RISK }) as unknown as typeof fetch;
    const root = document.createElement('main');
    const state = createPrincipalApp(root, cfg);
    root.querySelector<HTMLTextAreaElement>('textarea')!.value = '孩子说不想活了';
    root.querySelector<HTMLTextAreaElement>('textarea')!.dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[data-fp-ask]')!.click();
    await tick();
    expect(state.phase).toBe('safety');
    expect(root.textContent).toContain('先暂停普通陪练');
    expect(root.textContent).toContain('转人工');
    expect(root.querySelector('button[data-fp-confirm]')).toBeNull();
  });

  it('confirm success (accept 201) -> Growth practice created, next-day return', async () => {
    global.fetch = mockFetch({ message: NORMAL, accept: { status: 201, body: { episode: { status: 'ACTIVE' }, actions: Array.from({ length: 7 }, (_, i) => ({ day_index: i + 1 })) } } }) as unknown as typeof fetch;
    const res = await confirmProposal({ ...cfg, onboardingId: 'o1', priorityId: 'pr1' }, { proposalId: 'p1' });
    expect(res.ok).toBe(true);
    expect(res.body.actions).toHaveLength(7);
  });

  it('confirm without active priority (accept 404) -> honest guidance, no false success', async () => {
    global.fetch = mockFetch({ message: NORMAL, accept: { status: 404, body: { message: 'active_growth_priority_not_found' } } }) as unknown as typeof fetch;
    const root = document.createElement('main');
    const state = createPrincipalApp(root, cfg);
    // 直接驱动到 answered 后点确认
    root.querySelector<HTMLTextAreaElement>('textarea')!.value = '孩子作业拖拉';
    root.querySelector<HTMLTextAreaElement>('textarea')!.dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[data-fp-ask]')!.click();
    await tick();
    root.querySelector<HTMLButtonElement>('button[data-fp-confirm]')!.click();
    await tick();
    expect(state.phase).toBe('confirmed');
    expect(state.growth?.ok).toBe(false);
    expect(root.textContent).toContain('还差一步');
    expect(root.textContent).toContain('确认权始终在你手里');
  });

  it('initial render is the ask phase with AI-chaperone boundary', () => {
    global.fetch = mockFetch({}) as unknown as typeof fetch;
    const root = document.createElement('main');
    createPrincipalApp(root, cfg);
    expect(root.querySelector('textarea')).not.toBeNull();
    expect(root.textContent).toContain('AI 陪练');
    expect(root.textContent).not.toContain('诊断为');
  });
});
