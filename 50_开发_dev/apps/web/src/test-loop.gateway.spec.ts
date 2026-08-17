import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAMILY_UI_34_ROUTE_MANIFEST, createTestLoopApp } from './test-loop.js';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Family 34-page visual experience and real Gateway entry', () => {
  it('maps UI-01 through UI-34 once without renaming historical asset routes', () => {
    expect(FAMILY_UI_34_ROUTE_MANIFEST).toHaveLength(34);
    expect(new Set(FAMILY_UI_34_ROUTE_MANIFEST.map(([pageId]) => pageId)).size).toBe(34);
    expect(FAMILY_UI_34_ROUTE_MANIFEST.map(([pageId]) => pageId)).toEqual(
      Array.from({ length: 34 }, (_, index) => `UI-${String(index + 1).padStart(2, '0')}`),
    );
  });

  it('renders every manifest route through the same controlled test-loop application shell', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'home' });
    for (const [, route] of FAMILY_UI_34_ROUTE_MANIFEST) {
      app.navigate(route);
      expect(root.querySelector('.by-app')).not.toBeNull();
      expect(root.querySelector('[role="img"], .by-screen')).not.toBeNull();
    }
  });

  it('calls only the Family server Gateway from an existing assessment entry and exposes blocked text-equivalent accessibly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        decision: 'BLOCK_CONFIGURATION',
        stop_code: 'LLM_DISABLED',
        draft: null,
        text_equivalent: '当前说明暂不可用。你可以返回、暂停或现在先不继续。',
        audit: { trace_id: 'trace-fixture-only' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope' });
    const action = root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]');
    expect(action).not.toBeNull();
    if (!action) throw new Error('assessment entry is required');
    action.click();
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]')?.click();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/llm/draft');
    expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(request.body)).toEqual({ page_id: 'UI-02' });
    expect(root.dataset.familyLlmDecision).toBe('BLOCK_CONFIGURATION');
    expect(root.dataset.familyLlmTrace).toBe('trace-fixture-only');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('返回、暂停或现在先不继续');
    expect(root.querySelector('.by-reference-assessment')).not.toBeNull();
    expect(root.textContent).not.toMatch(/DEV|stub|Gate|policy|contract/i);
  });

  it('preserves the original visual path when the Gateway cannot be reached and still supplies a text-equivalent fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope' });
    root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]')?.click();
    root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]')?.click();
    await tick();

    expect(root.dataset.familyLlmDecision).toBe('CLIENT_FAILURE');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('返回、暂停或现在先不继续');
    expect(root.querySelector('.by-reference-assessment')).not.toBeNull();
  });
});
