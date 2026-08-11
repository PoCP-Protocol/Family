import { describe, expect, it } from 'vitest';
import { WAF_CONSENT_PURPOSES } from '@family/waf-contracts';
import { WAF_FEATURED_CHALLENGE } from './waf-seed';
import { WafDomainService } from './waf-domain.service';

describe('WafDomainService', () => {
  it('defines exactly seven challenge days for the first WF1 challenge', () => {
    expect(WAF_FEATURED_CHALLENGE.id).toBe('LISTEN_BEFORE_RESPOND_7D');
    expect(WAF_FEATURED_CHALLENGE.days).toHaveLength(7);
    expect(WAF_FEATURED_CHALLENGE.days.map((day) => day.dayNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('creates CommunityParticipation without GrowthJourney fields', () => {
    const service = new WafDomainService();
    const participation = service.joinChallenge('account-1');

    expect(participation.status).toBe('ACTIVE');
    expect(participation.challengeId).toBe('LISTEN_BEFORE_RESPOND_7D');
    expect(participation).not.toHaveProperty('growthJourneyId');
    expect(participation).not.toHaveProperty('growthProfileId');
  });

  it('records action acceptance and check-in as community state, not outcomes', () => {
    const service = new WafDomainService();
    const participation = service.joinChallenge('account-2');
    const acceptance = service.acceptTodayAction(participation.id);
    const checkin = service.submitCheckIn(participation.id, 'PARTIAL', '做了一部分。');

    expect(acceptance.participationId).toBe(participation.id);
    expect(checkin.result).toBe('PARTIAL');
    expect(checkin).not.toHaveProperty('outcomeId');
    expect(checkin).not.toHaveProperty('growthActionId');
  });

  it('emits ProductEvent names and never GrowthEvent names', () => {
    const service = new WafDomainService();
    const participation = service.joinChallenge('account-3');
    service.acceptTodayAction(participation.id);
    service.submitCheckIn(participation.id, 'COMPLETED');

    const names = service.listProductEvents().map((event) => event.name);
    expect(names).toEqual(['waf_challenge_joined', 'waf_action_accepted', 'waf_checkin_submitted']);
    expect(names.some((name) => name.toLowerCase().includes('growth'))).toBe(false);
  });

  it('limits FPAI entry context and does not expose family database context', () => {
    const service = new WafDomainService();
    const context = service.createPrincipalEntry('SCREEN_TIME', 'WAF_TOPIC', 3);

    expect(context).toEqual({
      topic_id: 'SCREEN_TIME',
      challenge_id: 'LISTEN_BEFORE_RESPOND_7D',
      challenge_day: 3,
      source_surface: 'WAF_TOPIC',
    });
    expect(context).not.toHaveProperty('familyId');
    expect(context).not.toHaveProperty('growthProfile');
    expect(context).not.toHaveProperty('childHistory');
  });

  it('maps WAF consent boundaries to central vocabulary without COMMUNITY', () => {
    expect(WAF_CONSENT_PURPOSES.challengeParticipation).toBe('SERVICE');
    expect(WAF_CONSENT_PURPOSES.recordToFamily).toBe('GROWTH_TRACKING');
    expect(WAF_CONSENT_PURPOSES.fpaiFamilyContext).toBe('AI_PERSONALIZATION');
    expect(WAF_CONSENT_PURPOSES.publicFamilyStory).toBe('CONTENT_PUBLICATION');
    expect(Object.values(WAF_CONSENT_PURPOSES)).not.toContain('COMMUNITY');
  });
});
