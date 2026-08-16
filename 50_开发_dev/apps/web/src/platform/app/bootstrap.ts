/**
 * WEB-ARCH-001 / PLATFORM-SESSION-001 · 平台入口引导(渐进替换旧 URL-参数选产品)。
 * 认证门:GET /auth/me(HttpOnly cookie)。未认证 → 登录界面;已认证 → PlatformApp(onboarding→Today)。
 * URL 不再作为 actorPersonId/familyId/childId 的信任来源。legacy 页仅经显式路由过渡挂载。
 */
import type { ApiResult } from '../api/client';
import type { SessionPrefsStore } from '../session/session';
import { PlatformApp, type PlatformApi } from './platform-app';
import type { OnboardingScreen } from '../onboarding/onboarding-flow';
import type { TodayInputs } from '../today/today-view';

export interface BootstrapDeps {
  root: HTMLElement;
  api: PlatformApi;
  prefs: SessionPrefsStore;
  submitStep: (screen: OnboardingScreen) => Promise<boolean>;
  loadToday: (familyId: string) => Promise<TodayInputs>;
  renderLogin: (root: HTMLElement, onRetry: () => void) => void; // 登录界面(宿主提供;OTP 流程)
}

/** 平台启动:检查会话 → 未认证渲染登录 / 已认证挂 PlatformApp。返回是否已认证。 */
export async function startPlatform(deps: BootstrapDeps): Promise<boolean> {
  const me: ApiResult<{ account_id: string }> = await deps.api.get('/auth/me');
  if (!me.ok) {
    deps.renderLogin(deps.root, () => { void startPlatform(deps); });
    return false;
  }
  const app = new PlatformApp({
    root: deps.root,
    api: deps.api,
    prefs: deps.prefs,
    submitStep: deps.submitStep,
    loadToday: deps.loadToday,
    onUnauthorized: () => deps.renderLogin(deps.root, () => { void startPlatform(deps); }),
  });
  await app.render();
  return true;
}
