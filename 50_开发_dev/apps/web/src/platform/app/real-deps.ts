/**
 * WEB-ARCH-001 · 平台真实依赖装配(cookie api client + OTP 登录 + 首建家庭表单 + Today 加载)。
 * 已建表单的步骤真实提交;未建表单的 onboarding 步骤诚实提示"开发中"并不假前进。
 */
import { createApiClient } from '../api/client';
import { createSessionPrefsStore } from '../session/session';
import { startPlatform, type BootstrapDeps } from './bootstrap';
import type { OnboardingScreen } from '../onboarding/onboarding-flow';
import type { PlatformApi } from './platform-app';

function el(tag: string, attrs: Record<string, string> = {}, text?: string): HTMLElement {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
}

/** OTP 登录界面:手机号 → 请求验证码 → 输入码 → 验证(cookie 下发)→ 重新启动平台。 */
function renderLogin(api: PlatformApi, root: HTMLElement, onRetry: () => void): void {
  root.innerHTML = '';
  const box = el('section', { class: 'login' });
  box.appendChild(el('h1', {}, '登录 Family'));
  const phone = el('input', { class: 'login-phone', placeholder: '手机号', inputmode: 'numeric' }) as HTMLInputElement;
  const code = el('input', { class: 'login-code', placeholder: '验证码', inputmode: 'numeric' }) as HTMLInputElement;
  const msg = el('p', { class: 'login-msg muted' });
  const reqBtn = el('button', { type: 'button', class: 'login-request' }, '获取验证码') as HTMLButtonElement;
  const verBtn = el('button', { type: 'button', class: 'login-verify' }, '登录') as HTMLButtonElement;
  reqBtn.addEventListener('click', async () => {
    const r = await api.post('/auth/otp/request', { phone: phone.value.trim() });
    msg.textContent = r.ok ? '验证码已发送' : '发送失败,请稍后再试';
  });
  verBtn.addEventListener('click', async () => {
    const r = await api.post('/auth/otp/verify', { phone: phone.value.trim(), code: code.value.trim() });
    if (r.ok) onRetry(); else msg.textContent = '验证码不正确或已过期';
  });
  box.append(phone, reqBtn, code, verBtn, msg);
  root.appendChild(box);
}

/** create_family:采集家庭名+监护人名(非 UUID),POST /auth/families。其余未建表单步骤诚实提示。 */
async function submitStep(api: PlatformApi, root: HTMLElement, screen: OnboardingScreen): Promise<boolean> {
  if (screen.step === 'create_family') {
    return await new Promise<boolean>((resolve) => {
      const form = el('div', { class: 'create-family-form' });
      const fam = el('input', { class: 'cf-family', placeholder: '家庭名称' }) as HTMLInputElement;
      const guardian = el('input', { class: 'cf-guardian', placeholder: '你的称呼(如 妈妈/爸爸)' }) as HTMLInputElement;
      const ok = el('button', { type: 'button', class: 'cf-submit' }, '创建') as HTMLButtonElement;
      ok.addEventListener('click', async () => {
        const r = await api.post('/auth/families', { display_name: fam.value.trim(), guardian_name: guardian.value.trim() });
        resolve(r.ok);
      });
      form.append(fam, guardian, ok);
      root.appendChild(form);
    });
  }
  // 其余步骤的表单为渐进后续:不假前进,提示开发中。
  const note = el('p', { class: 'step-todo muted' }, '该步骤的填写界面正在建设中。');
  root.appendChild(note);
  return false;
}

/** 装配真实依赖并启动平台。 */
export function bootPlatform(root: HTMLElement, baseUrl = ''): Promise<boolean> {
  const api = createApiClient({ baseUrl, onUnauthorized: () => { /* startPlatform 会渲染登录 */ } });
  const deps: BootstrapDeps = {
    root, api,
    prefs: createSessionPrefsStore(window.localStorage),
    submitStep: (screen) => submitStep(api, root, screen),
    loadToday: async (familyId) => {
      const r = await api.get<{ todaysAction: string | null; pendingCheckin: boolean }>(`/families/${familyId}/today`);
      return r.ok ? r.data : {};
    },
    renderLogin: (r, onRetry) => renderLogin(api, r, onRetry),
  };
  return startPlatform(deps);
}
