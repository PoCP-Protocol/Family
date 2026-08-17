// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderOnboardingScreen, renderFamilySelector, renderToday } from './screens';
import { screenFor } from '../onboarding/onboarding-flow';
import { buildTodayView } from '../today/today-view';

describe('render onboarding screen', () => {
  it('渲染标题+CTA;点击触发 onNext;无 UUID 输入框', () => {
    const screen = screenFor({ family_id: 'fam-1', complete: false, current_step: 'add_child', steps: [], child_id: null });
    const onNext = vi.fn();
    const node = renderOnboardingScreen(screen, onNext);
    expect(node.querySelector('.ob-title')?.textContent).toContain('孩子');
    // 绝不出现要求用户输入 id 的输入框
    expect(node.querySelectorAll('input').length).toBe(0);
    (node.querySelector('.ob-cta') as HTMLButtonElement).click();
    expect(onNext).toHaveBeenCalledWith(screen);
  });
});

describe('render family selector', () => {
  it('每个家庭一个按钮;点击回传 familyId', () => {
    const onSelect = vi.fn();
    const node = renderFamilySelector(['A', 'B'], onSelect);
    const opts = node.querySelectorAll('.family-option');
    expect(opts.length).toBe(2);
    (opts[1] as HTMLButtonElement).click();
    expect(onSelect).toHaveBeenCalledWith('B');
  });
});

describe('render Today', () => {
  it('问候+主导航(今天/成长/陪练/家庭)+卡片;无分数/排名;可行动卡片有按钮', () => {
    const view = buildTodayView({ familyDisplayName: '王家', currentFocus: '先听后说', todaysAction: '先听完再回应', pendingCheckin: true });
    const onAction = vi.fn();
    const node = renderToday(view, onAction);
    expect(node.querySelector('.today-greeting')?.textContent).toContain('王家');
    expect(node.querySelectorAll('.primary-nav a').length).toBe(4);
    expect(node.querySelectorAll('.today-card').length).toBeGreaterThanOrEqual(3);
    expect(node.textContent?.toLowerCase()).not.toMatch(/score|分数|排名|%/);
    const checkinBtn = node.querySelector('[data-card="checkin"] .card-action') as HTMLButtonElement;
    checkinBtn.click();
    expect(onAction).toHaveBeenCalledWith('checkin');
  });
});
