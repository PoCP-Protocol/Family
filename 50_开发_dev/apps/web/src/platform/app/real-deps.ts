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

const uuid = (): string => (globalThis.crypto?.randomUUID?.() ?? `k-${Date.now()}-${Math.round(Math.random() * 1e9)}`);
/** 从 apiHint.path 提取 familyId(/families/{fid}/...)。 */
function familyIdFromPath(path: string): string | null {
  const m = path.match(/\/families\/([^/]+)/);
  return m ? m[1] : null;
}
/** 渲染一个简单表单(字段 + 提交),点击提交时用采集值调 onSubmit;resolve 提交结果。 */
function renderForm(root: HTMLElement, cls: string, fields: Array<{ key: string; placeholder: string; optional?: boolean }>, submitLabel: string, onSubmit: (values: Record<string, string>) => Promise<boolean>): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const form = el('div', { class: cls });
    const inputs: Record<string, HTMLInputElement> = {};
    for (const f of fields) {
      const i = el('input', { class: `f-${f.key}`, placeholder: f.placeholder }) as HTMLInputElement;
      inputs[f.key] = i; form.appendChild(i);
    }
    const btn = el('button', { type: 'button', class: 'form-submit' }, submitLabel) as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      const values: Record<string, string> = {};
      for (const f of fields) values[f.key] = inputs[f.key].value.trim();
      resolve(await onSubmit(values));
    });
    form.appendChild(btn);
    root.appendChild(form);
  });
}

/** onboarding 各步表单 → 调既有端点(系统填 id;用户不输 UUID)。未建表单步骤诚实提示。导出供测试。 */
export async function submitStep(api: PlatformApi, root: HTMLElement, screen: OnboardingScreen): Promise<boolean> {
  if (screen.step === 'create_family') {
    return renderForm(root, 'create-family-form',
      [{ key: 'display_name', placeholder: '家庭名称' }, { key: 'guardian_name', placeholder: '你的称呼(如 妈妈/爸爸)' }],
      '创建', (v) => api.post('/auth/families', v).then((r) => r.ok));
  }
  if (screen.step === 'add_child') {
    const fid = familyIdFromPath(screen.apiHint.path);
    if (!fid) return false;
    return renderForm(root, 'add-child-form',
      [{ key: 'display_name', placeholder: '孩子的称呼' }, { key: 'birth_date', placeholder: '出生日期 YYYY-MM-DD(可留空)', optional: true }],
      '添加孩子', (v) => {
        const body: Record<string, string> = { display_name: v.display_name, idempotency_key: uuid() };
        if (v.birth_date) body.birth_date = v.birth_date;
        return api.post(`/families/${fid}/children`, body).then((r) => r.ok);
      });
  }
  // 其余步骤(lifestage/consent/growth/priority)的表单为渐进后续:不假前进,诚实提示。
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
