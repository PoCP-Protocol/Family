import { describe, expect, it, vi } from 'vitest';
import { createSessionPrefsStore, memoryStorage } from './session/session';
import { createApiClient } from './api/client';
import { deriveFamilyContext } from './family-context/family-context';
import { ROUTES, PRIMARY_NAV } from './router/routes';

describe('platform/session prefs (cookie mode — NO raw token in WebStorage)', () => {
  it('stores only non-secret UI prefs; never a token', () => {
    const storage = memoryStorage();
    const s = createSessionPrefsStore(storage);
    expect(s.get()).toEqual({});
    s.setSelectedFamily('fam-1');
    s.setSelectedSubject('child-1');
    expect(s.get()).toEqual({ selectedFamilyId: 'fam-1', selectedSubjectRef: 'child-1' });
    // RAW_BROWSER_TOKEN_WEBSTORAGE=0:存储里绝不出现 token 字样/会话密钥
    const dump = JSON.stringify(s.get());
    expect(dump.toLowerCase()).not.toContain('token');
    expect(dump).not.toContain('fam_'); // 会话令牌前缀
    s.clear();
    expect(s.get()).toEqual({});
  });
});

describe('platform/api client (cookie credentials:include, no Authorization from storage)', () => {
  it('sends credentials:include and NO Authorization header', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 })) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: 'http://x', fetchImpl });
    const r = await api.get<{ ok: number }>('/auth/contexts');
    expect(r.ok && r.data.ok).toBe(1);
    const init = (fetchImpl as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as { credentials?: string; headers: Record<string, string> };
    expect(init.credentials).toBe('include');
    expect(init.headers.authorization).toBeUndefined();
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('401 → onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = vi.fn(async () => new Response('', { status: 401 })) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: 'http://x', fetchImpl, onUnauthorized });
    const r = await api.get('/secure');
    expect(r.ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalled();
  });
});

describe('platform/family-context', () => {
  it('derives context from whoami; no subjects → null subject', () => {
    expect(deriveFamilyContext({ person_id: 'p1', family_id: 'f1' }).currentSubjectRef).toBeNull();
    const c = deriveFamilyContext({ person_id: 'p1', family_id: 'f1', subjects: [{ subject_ref: 'child-1' }] });
    expect(c.currentSubjectRef).toBe('child-1');
    expect(c.familyId).toBe('f1');
  });
});

describe('platform/router', () => {
  it('consumer nav is Today/Growth/Principal/Family; auth routes gated', () => {
    expect(PRIMARY_NAV).toEqual(['today', 'growth', 'principal', 'family']);
    expect(ROUTES.today.requiresAuth && ROUTES.today.requiresOnboarding).toBe(true);
    expect(ROUTES.login.requiresAuth).toBe(false);
  });
});
