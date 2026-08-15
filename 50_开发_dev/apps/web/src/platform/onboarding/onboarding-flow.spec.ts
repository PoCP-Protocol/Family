import { describe, expect, it } from 'vitest';
import { resolveEntry, screenFor, type FamilyContextSummary, type OnboardingStatusView } from './onboarding-flow';
import { buildTodayView } from '../today/today-view';

const ctx = (fid: string): FamilyContextSummary => ({ type: 'FAMILY', family_id: fid, person_id: 'p', membership_id: 'm', role: 'OWNER_GUARDIAN' });
const status = (step: OnboardingStatusView['current_step'], complete = false): OnboardingStatusView =>
  ({ family_id: 'fam-1', complete, current_step: step, steps: [], child_id: null });

describe('onboarding resolveEntry', () => {
  it('零家庭 → FIRST_FAMILY_ONBOARDING', () => {
    expect(resolveEntry([]).kind).toBe('FIRST_FAMILY_ONBOARDING');
  });
  it('单家庭 → ENTER_FAMILY', () => {
    const d = resolveEntry([ctx('A')]);
    expect(d).toEqual({ kind: 'ENTER_FAMILY', familyId: 'A' });
  });
  it('多家庭无偏好 → FAMILY_SELECTOR', () => {
    const d = resolveEntry([ctx('A'), ctx('B')]);
    expect(d.kind).toBe('FAMILY_SELECTOR');
  });
  it('多家庭 + 有效上次偏好 → 直接进入该家庭', () => {
    const d = resolveEntry([ctx('A'), ctx('B')], 'B');
    expect(d).toEqual({ kind: 'ENTER_FAMILY', familyId: 'B' });
  });
  it('多家庭 + 偏好已失效 → 回到选择器', () => {
    expect(resolveEntry([ctx('A'), ctx('B')], 'GONE').kind).toBe('FAMILY_SELECTOR');
  });
});

describe('onboarding screenFor', () => {
  it('create_family → POST /auth/families(系统填 id,用户不输 UUID)', () => {
    const s = screenFor(status('create_family'));
    expect(s.apiHint).toEqual({ method: 'POST', path: '/auth/families' });
    expect(s.title).not.toContain('uuid');
  });
  it('add_child/grant_consent 路径含 familyId(系统提供)', () => {
    expect(screenFor(status('add_child')).apiHint.path).toBe('/families/fam-1/children');
    expect(screenFor(status('grant_consent')).apiHint.path).toBe('/families/fam-1/consents');
  });
  it('enter_today → 完成', () => {
    expect(screenFor(status('enter_today', true)).done).toBe(true);
  });
});

describe('Today view', () => {
  it('空态温和、不制造焦虑、无分数', () => {
    const v = buildTodayView({});
    expect(v.cards.find((c) => c.key === 'focus')).toBeTruthy();
    expect(JSON.stringify(v).toLowerCase()).not.toMatch(/score|分数|排名|percent|%/);
  });
  it('有 Principal 跟进/待 Check-in/专家回复时出现对应卡片', () => {
    const v = buildTodayView({ familyDisplayName: '王家', currentFocus: '先听后说', todaysAction: '先听完再回应', pendingCheckin: true, principalFollowup: '今晚试试', expertReplyPending: true });
    const keys = v.cards.map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(['focus', 'today_action', 'checkin', 'principal', 'expert']));
    expect(v.greeting).toContain('王家');
  });
});
