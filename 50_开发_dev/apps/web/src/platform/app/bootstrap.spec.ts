// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { startPlatform } from './bootstrap';
import { createSessionPrefsStore, memoryStorage } from '../session/session';
import type { PlatformApi } from './platform-app';

const okMe: PlatformApi = {
  async get<T>(path: string) {
    if (path === '/auth/me') return { ok: true, data: { account_id: 'acc-1' } as unknown as T };
    if (path === '/auth/contexts') return { ok: true, data: { contexts: [] } as unknown as T }; // 零家庭 → onboarding
    return { ok: false, error: { status: 404, code: 'nf', message: 'nf' } };
  },
  async post<T>() { return { ok: true, data: {} as T }; },
};
const unauthed: PlatformApi = {
  async get() { return { ok: false, error: { status: 401, code: 'unauthorized', message: 'x' } }; },
  async post() { return { ok: false, error: { status: 401, code: 'unauthorized', message: 'x' } }; },
};

describe('startPlatform 认证门', () => {
  it('未认证(/auth/me 401)→ 渲染登录,不挂 PlatformApp', async () => {
    const root = document.createElement('div');
    const renderLogin = vi.fn((r: HTMLElement) => { r.innerHTML = '<div class="login">请登录</div>'; });
    const authed = await startPlatform({ root, api: unauthed, prefs: createSessionPrefsStore(memoryStorage()), submitStep: async () => true, loadToday: async () => ({}), renderLogin });
    expect(authed).toBe(false);
    expect(renderLogin).toHaveBeenCalled();
    expect(root.querySelector('.login')).toBeTruthy();
    expect(root.querySelector('.onboarding-screen')).toBeNull();
  });

  it('已认证 + 零家庭 → 挂 PlatformApp 进入首建家庭引导', async () => {
    const root = document.createElement('div');
    const renderLogin = vi.fn();
    const authed = await startPlatform({ root, api: okMe, prefs: createSessionPrefsStore(memoryStorage()), submitStep: async () => true, loadToday: async () => ({}), renderLogin });
    expect(authed).toBe(true);
    expect(renderLogin).not.toHaveBeenCalled();
    expect(root.querySelector('.onboarding-screen')?.getAttribute('data-step')).toBe('create_family');
    expect(root.querySelectorAll('input').length).toBe(0); // 不要求用户输 UUID
  });
});
