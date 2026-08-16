import { createApiClient } from '../api/client';
import { mountFamilyGrowthJourney } from '../growth/family-growth-journey';
import { createSessionPrefsStore } from '../session/session';
import { PlatformApp } from './platform-app';

/**
 * FAMILY_APP_EXPERIENCE_VERTICAL_001 的浏览器宿主。
 * 身份、家庭范围和 child_id 全部由服务端 cookie + /auth/contexts/onboarding status 解析；
 * 本文件不从 query/storage 读取 actor、family 或 child UUID。
 */
export function mountFamilyPlatform(root: HTMLElement, options: { apiBaseUrl: string; onUnauthorized?: () => void }): void {
  const api = createApiClient({
    baseUrl: options.apiBaseUrl,
    onUnauthorized: () => renderSessionExpired(root, options.onUnauthorized),
  });
  const prefs = createSessionPrefsStore(window.localStorage);
  let platform: PlatformApp;

  platform = new PlatformApp({
    root,
    api,
    prefs,
    // G3 仅覆盖完成基础 onboarding 后的成长体验；未完成家庭仍显示服务端引导状态，不伪造表单数据或身份。
    submitStep: async () => {
      renderOnboardingBoundary(root);
      return false;
    },
    loadToday: async () => ({
      familyDisplayName: undefined,
      currentFocus: '从一件想被更好理解的亲子沟通小事开始。',
      todaysAction: '确认家庭需要，看看已经准入的低风险练习。',
      pendingCheckin: false,
      principalFollowup: null,
      expertReplyPending: false,
    }),
    canOpenGrowthJourney: async (familyId, subjectPersonId) => {
      // 只读取现有受保护 Family 聚合；不由前端补写生命周期、同意或主体数据。
      const aggregate = await api.get<{
        lifeStages?: Array<{ child_id: string; effective_to?: string | null }>;
        consents?: Array<{ subject_person_id: string; purpose: string; status: string; withdrawn_at?: string | null }>;
      }>(`/families/${familyId}`);
      if (!aggregate.ok) return false;
      const activeStage = (aggregate.data.lifeStages ?? []).some((item) => item.child_id === subjectPersonId && !item.effective_to);
      const serviceConsent = (aggregate.data.consents ?? []).some((item) => item.subject_person_id === subjectPersonId
        && item.purpose === 'SERVICE' && item.status === 'GRANTED' && !item.withdrawn_at);
      return activeStage && serviceConsent;
    },
    openGrowthJourney: async (familyId, subjectPersonId) => {
      prefs.setSelectedSubject(subjectPersonId);
      mountFamilyGrowthJourney(root, {
        api,
        familyId,
        subjectPersonId,
        onBack: () => { void platform.render().catch((error) => renderFailure(root, error)); },
      });
    },
    onUnauthorized: () => renderSessionExpired(root, options.onUnauthorized),
  });

  void platform.render().catch((error) => renderFailure(root, error));
}

function renderOnboardingBoundary(root: HTMLElement): void {
  root.innerHTML = '';
  const main = document.createElement('main'); main.className = 'family-boundary-screen';
  const title = document.createElement('h1'); title.textContent = '先完成家庭基础设置';
  const copy = document.createElement('p'); copy.textContent = '孩子、生命周期阶段与服务同意尚未准备好。为保护家庭边界，成长旅程不会代为创建或猜测这些信息。';
  main.append(title, copy); root.appendChild(main);
}

function renderSessionExpired(root: HTMLElement, onUnauthorized?: () => void): void {
  root.innerHTML = '';
  const main = document.createElement('main'); main.className = 'family-boundary-screen';
  const title = document.createElement('h1'); title.textContent = '需要重新登录';
  const copy = document.createElement('p'); copy.textContent = '你的会话已失效。登录后，系统会重新确认你可进入的家庭范围。';
  main.append(title, copy); root.appendChild(main); onUnauthorized?.();
}

function renderFailure(root: HTMLElement, error: unknown): void {
  root.innerHTML = '';
  const main = document.createElement('main'); main.className = 'family-boundary-screen';
  const title = document.createElement('h1'); title.textContent = '暂时无法打开家庭成长旅程';
  const copy = document.createElement('p'); copy.textContent = error instanceof Error ? error.message : '请稍后重试。';
  main.append(title, copy); root.appendChild(main);
}
