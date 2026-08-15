/**
 * FAMILY-ONBOARDING-001 / TODAY-001 (web) · DOM 渲染层(视图模型 → 可点 DOM)。
 * 纯渲染:输入视图模型,输出 HTMLElement;无内部术语、无 UUID 输入框、无分数/排名。
 * 事件回调经参数注入(便于测试与接线到 api client),不在此直接发网络。
 */
import type { OnboardingScreen } from '../onboarding/onboarding-flow';
import type { TodayView } from '../today/today-view';

function el(tag: string, attrs: Record<string, string> = {}, text?: string): HTMLElement {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
}

/** 渲染 onboarding 当前屏:标题 + CTA 按钮(点击回调驱动下一步)。绝不渲染任何 id 输入框。 */
export function renderOnboardingScreen(screen: OnboardingScreen, onNext: (screen: OnboardingScreen) => void): HTMLElement {
  const root = el('section', { class: 'onboarding-screen', 'data-step': screen.step });
  root.appendChild(el('h1', { class: 'ob-title' }, screen.title));
  const btn = el('button', { class: 'ob-cta', type: 'button' }, screen.cta) as HTMLButtonElement;
  btn.addEventListener('click', () => onNext(screen));
  root.appendChild(btn);
  return root;
}

/** 渲染多家庭选择器。 */
export function renderFamilySelector(families: string[], onSelect: (familyId: string) => void): HTMLElement {
  const root = el('section', { class: 'family-selector' });
  root.appendChild(el('h1', {}, '选择要进入的家庭'));
  for (const fid of families) {
    const b = el('button', { class: 'family-option', type: 'button', 'data-family': fid }, fid) as HTMLButtonElement;
    b.addEventListener('click', () => onSelect(fid));
    root.appendChild(b);
  }
  return root;
}

/** 渲染 Today 首页:问候 + 卡片列表;可行动卡片带行动按钮。 */
export function renderToday(view: TodayView, onCardAction?: (key: string) => void): HTMLElement {
  const root = el('main', { class: 'today' });
  root.appendChild(el('h1', { class: 'today-greeting' }, view.greeting));
  const nav = el('nav', { class: 'primary-nav' });
  for (const item of ['today', 'growth', 'principal', 'family']) nav.appendChild(el('a', { 'data-nav': item, href: `#/${item}` }, ({ today: '今天', growth: '成长', principal: '陪练', family: '家庭' } as Record<string, string>)[item]));
  root.appendChild(nav);
  for (const c of view.cards) {
    const card = el('article', { class: 'today-card', 'data-card': c.key });
    card.appendChild(el('h2', {}, c.title));
    card.appendChild(el('p', {}, c.body));
    if (c.actionable && onCardAction) {
      const b = el('button', { type: 'button', class: 'card-action' }, '去看看') as HTMLButtonElement;
      b.addEventListener('click', () => onCardAction(c.key));
      card.appendChild(b);
    }
    root.appendChild(card);
  }
  return root;
}
