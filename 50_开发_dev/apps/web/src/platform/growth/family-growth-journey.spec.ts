import { describe, expect, it, vi } from 'vitest';
import { mountFamilyGrowthJourney } from './family-growth-journey';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('FAMILY_APP_EXPERIENCE_VERTICAL_001', () => {
  it('keeps identity server-scoped and records NO_ACTION without selecting a resource or opening a service flow', async () => {
    const root = document.createElement('div');
    const post = vi.fn()
      .mockResolvedValueOnce({ ok: true, data: { growth_intent_id: '11111111-1111-4111-8111-111111111111' } })
      .mockResolvedValueOnce({ ok: true, data: {
        resource_recommendation_id: '22222222-2222-4222-8222-222222222222',
        ranking_boundary: 'ELIGIBILITY_FIRST_NO_REVENUE_OR_ENGAGEMENT_SIGNAL',
        candidates: [{
          resource_offer_id: '33333333-3333-4333-8333-333333333333', resource_code: 'BANGYANG_PRACTICE_STABILIZE_REOPEN_DIALOGUE',
          resource_type: 'PRACTICE', title: '一次亲子沟通重新开启练习', description: '低风险练习', risk_boundary: 'LOW_RISK_NON_CLINICAL',
        }],
      } })
      .mockResolvedValueOnce({ ok: true, data: { family_service_decision_id: '44444444-4444-4444-8444-444444444444', status: 'DECLINED' } });

    mountFamilyGrowthJourney(root, {
      api: { post }, familyId: 'family-from-server', subjectPersonId: 'child-from-server', onBack: vi.fn(),
    });
    expect(root.textContent).toContain('从一件小事开始');
    expect(root.innerHTML).not.toContain('family-from-server');
    expect(root.innerHTML).not.toContain('child-from-server');

    const fields = root.querySelectorAll<HTMLTextAreaElement>('textarea');
    fields[0].value = '最近我们都觉得很难把话说完。';
    fields[1].value = '今晚先让彼此说完一句话。';
    root.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick(); await tick();

    expect(root.textContent).toContain('这一次，哪些选择可能合适？');
    const noAction = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === '这次先不行动');
    noAction?.click();
    await tick(); await tick();

    expect(post).toHaveBeenCalledTimes(3);
    expect(post.mock.calls[0][0]).toBe('/families/family-from-server/orchestration/intents');
    expect(post.mock.calls[0][1]).toMatchObject({ subject_person_id: 'child-from-server' });
    expect(post.mock.calls[2][0]).toBe('/families/family-from-server/orchestration/decisions');
    expect(post.mock.calls[2][1]).toMatchObject({ decision_type: 'NO_ACTION', selected_offer_ids: [] });
    expect(post.mock.calls.map((call) => call[0])).not.toContain('/families/family-from-server/orchestration/plans');
    expect(post.mock.calls.map((call) => call[0])).not.toContain('/families/family-from-server/orchestration/service-cases');
    expect(root.textContent).toContain('这次先不行动');
  });

  it('hides non-Practice/Content candidates and still preserves the family NO_ACTION path', async () => {
    const root = document.createElement('div');
    const post = vi.fn()
      .mockResolvedValueOnce({ ok: true, data: { growth_intent_id: '11111111-1111-4111-8111-111111111112' } })
      .mockResolvedValueOnce({ ok: true, data: {
        resource_recommendation_id: '22222222-2222-4222-8222-222222222223',
        ranking_boundary: 'ELIGIBILITY_FIRST_NO_REVENUE_OR_ENGAGEMENT_SIGNAL',
        candidates: [{
          resource_offer_id: '33333333-3333-4333-8333-333333333334', resource_code: 'INTERNAL_AI_COACH', resource_type: 'AI_COACH',
          title: '内部陪练', description: '不应由本 App 展示。', risk_boundary: 'INTERNAL_ONLY',
        }],
      } })
      .mockResolvedValueOnce({ ok: true, data: { family_service_decision_id: '44444444-4444-4444-8444-444444444445', status: 'DECLINED' } });

    mountFamilyGrowthJourney(root, { api: { post }, familyId: 'family-from-server', subjectPersonId: 'child-from-server', onBack: vi.fn() });
    const fields = root.querySelectorAll<HTMLTextAreaElement>('textarea');
    fields[0].value = '这一次我们不需要内部陪练。';
    fields[1].value = '只保留家庭自主选择。';
    root.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick(); await tick();

    expect(root.textContent).not.toContain('内部陪练');
    expect(root.textContent).toContain('目前没有适合在这里展示的已准入练习或内容');
    Array.from(root.querySelectorAll('button')).find((button) => button.textContent === '这次先不行动')?.click();
    await tick(); await tick();
    expect(post.mock.calls[2][1]).toMatchObject({ decision_type: 'NO_ACTION', selected_offer_ids: [] });
    expect(post.mock.calls.map((call) => call[0])).not.toContain('/families/family-from-server/orchestration/plans');
  });
});
