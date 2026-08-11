import { describe, expect, it } from 'vitest';
import { WAF_CONSENT_PURPOSES, WAF_PRODUCT_EVENT_NAMES, type ProductEvent } from './index';

describe('@family/waf-contracts', () => {
  it('keeps WAF analytics as ProductEvent names, not GrowthEvent names', () => {
    expect(WAF_PRODUCT_EVENT_NAMES).toContain('waf_challenge_joined');
    expect(WAF_PRODUCT_EVENT_NAMES).toContain('waf_d7_completed');
    expect(WAF_PRODUCT_EVENT_NAMES.some((name) => name.toLowerCase().includes('growth'))).toBe(false);
  });

  it('uses central consent purposes without a COMMUNITY purpose', () => {
    expect(Object.values(WAF_CONSENT_PURPOSES)).toEqual([
      'SERVICE',
      'GROWTH_TRACKING',
      'AI_PERSONALIZATION',
      'CONTENT_PUBLICATION',
      'MODEL_IMPROVEMENT',
    ]);
    expect(Object.values(WAF_CONSENT_PURPOSES)).not.toContain('COMMUNITY');
  });

  it('limits FPAI event context to WAF topic and challenge fields', () => {
    const event: ProductEvent = {
      id: 'event-1',
      name: 'waf_principal_entry_clicked',
      sourceSurface: 'WAF_TOPIC',
      occurredAt: new Date(0).toISOString(),
      topicId: 'SCREEN_TIME',
      challengeId: 'LISTEN_BEFORE_RESPOND_7D',
      challengeDay: 1,
    };

    expect(event).not.toHaveProperty('growthProfileId');
    expect(event).not.toHaveProperty('childHistory');
  });
});
