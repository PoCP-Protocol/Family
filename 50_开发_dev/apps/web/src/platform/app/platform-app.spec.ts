// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { PlatformApp, type PlatformApi } from './platform-app';
import { createSessionPrefsStore, memoryStorage } from '../session/session';
import type { OnboardingScreen } from '../onboarding/onboarding-flow';

/** 假后端状态机:模拟 contexts + onboarding status 随 submitStep 前进,驱动 jsdom 端到端演示。 */
function fakeBackend() {
  const state = { hasFamily: false, step: 'create_family' as string, order: ['create_family', 'add_child', 'assign_life_stage', 'grant_consent', 'growth_onboarding', 'confirm_priority', 'enter_today'] };
  const api: PlatformApi = {
    async get<T>(path: string) {
      if (path === '/auth/contexts') {
        return { ok: true, data: (state.hasFamily ? { contexts: [{ type: 'FAMILY', family_id: 'fam-1', person_id: 'p', membership_id: 'm', role: 'OWNER_GUARDIAN' }] } : { contexts: [] }) as unknown as T };
      }
      if (path.endsWith('/onboarding/status')) {
        const complete = state.step === 'enter_today';
        return { ok: true, data: { family_id: 'fam-1', complete, current_step: state.step, steps: [], child_id: state.hasFamily ? 'child-1' : null } as unknown as T };
      }
      return { ok: false, error: { status: 404, code: 'nf', message: 'nf' } };
    },
    async post<T>() { return { ok: true, data: {} as T }; },
  };
  const advance = () => { const i = state.order.indexOf(state.step); state.step = state.order[Math.min(i + 1, state.order.length - 1)]; };
  const submitStep = vi.fn(async (s: OnboardingScreen) => {
    if (s.step === 'create_family') state.hasFamily = true;
    advance();
    return true;
  });
  return { api, submitStep };
}

describe('PlatformApp 端到端演示(jsdom)', () => {
  it('零家庭 → 建家庭 → 逐步点击 → 抵达 Today', async () => {
    const root = document.createElement('div');
    const { api, submitStep } = fakeBackend();
    const app = new PlatformApp({
      root, api,
      prefs: createSessionPrefsStore(memoryStorage()),
      submitStep,
      loadToday: async () => ({ familyDisplayName: '测试家庭', currentFocus: '先听后说' }),
    });

    await app.render();
    // 首屏:创建家庭(无 UUID 输入框)
    expect(root.querySelector('.onboarding-screen')?.getAttribute('data-step')).toBe('create_family');
    expect(root.querySelectorAll('input').length).toBe(0);

    // 逐步点击 CTA,直到进入 Today(最多 order.length 次)
    for (let i = 0; i < 10; i++) {
      const cta = root.querySelector('.ob-cta') as HTMLButtonElement | null;
      if (!cta) break;
      cta.click();
      await Promise.resolve(); await new Promise((r) => setTimeout(r, 0));
    }

    // 抵达 Today 首页
    const today = root.querySelector('.today');
    expect(today).toBeTruthy();
    expect(root.querySelector('.today-greeting')?.textContent).toContain('测试家庭');
    expect(root.querySelectorAll('.primary-nav a').length).toBe(4);
    expect(submitStep).toHaveBeenCalled();
  });

  it('401 → onUnauthorized(重新登录)', async () => {
    const root = document.createElement('div');
    const onUnauthorized = vi.fn();
    const api: PlatformApi = { async get() { return { ok: false, error: { status: 401, code: 'unauthorized', message: 'x' } }; }, async post() { return { ok: false, error: { status: 401, code: 'unauthorized', message: 'x' } }; } };
    const app = new PlatformApp({ root, api, prefs: createSessionPrefsStore(memoryStorage()), submitStep: async () => true, loadToday: async () => ({}), onUnauthorized });
    await app.render();
    expect(onUnauthorized).toHaveBeenCalled();
  });
});
