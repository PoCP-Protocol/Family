import { describe, expect, it, vi } from 'vitest';
import { createSessionStore, memoryStorage, type StoredSession } from './session/session';
import { createApiClient } from './api/client';
import { deriveFamilyContext } from './family-context/family-context';
import { ROUTES, PRIMARY_NAV } from './router/routes';

const future = new Date(Date.now() + 3600_000).toISOString();
const past = new Date(Date.now() - 1000).toISOString();
const sess = (expiresAt: string): StoredSession => ({ token: 't', personId: 'p1', familyId: 'f1', expiresAt });

describe('platform/session', () => {
  it('set/get/clear + expiry', () => {
    const s = createSessionStore(memoryStorage());
    expect(s.get()).toBeNull();
    s.set(sess(future));
    expect(s.get()?.personId).toBe('p1');
    expect(s.isExpired()).toBe(false);
    s.set(sess(past));
    expect(s.isExpired()).toBe(true);
    s.clear();
    expect(s.get()).toBeNull();
  });
});

describe('platform/api client', () => {
  it('attaches Bearer and returns data on ok', async () => {
    const store = createSessionStore(memoryStorage());
    store.set(sess(future));
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ hello: 'world' }), { status: 200 })) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: 'http://x', session: store, fetchImpl });
    const r = await api.get<{ hello: string }>('/ping');
    expect(r.ok && r.data.hello).toBe('world');
    const call = (fetchImpl as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    const init = call[1] as { headers: Record<string, string> };
    expect(init.headers.authorization).toBe('Bearer t');
  });

  it('no session → onUnauthorized + 401 (no network)', async () => {
    const store = createSessionStore(memoryStorage());
    const onUnauthorized = vi.fn();
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: 'http://x', session: store, fetchImpl, onUnauthorized });
    const r = await api.get('/ping');
    expect(r.ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('401 response clears session and triggers onUnauthorized', async () => {
    const store = createSessionStore(memoryStorage());
    store.set(sess(future));
    const onUnauthorized = vi.fn();
    const fetchImpl = vi.fn(async () => new Response('', { status: 401 })) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: 'http://x', session: store, fetchImpl, onUnauthorized });
    const r = await api.get('/secure');
    expect(r.ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalled();
    expect(store.get()).toBeNull();
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
