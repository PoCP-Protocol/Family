import type {
  CommunityActionAcceptance,
  CommunityCheckIn,
  CommunityCheckInResult,
  CommunityParticipation,
  ProductEvent,
  WafHomeReadModel,
  WafPrincipalEntryContext,
  WafProductEventName,
  WafSourceSurface,
  WafTopicId,
} from '@family/waf-contracts';
import { WAF_FEATURED_CHALLENGE, WAF_STORIES, WAF_TOPICS } from './waf-seed';

export class WafDomainService {
  private readonly productEvents: ProductEvent[] = [];
  private readonly participations = new Map<string, CommunityParticipation>();
  private readonly acceptances = new Map<string, CommunityActionAcceptance>();
  private readonly checkins = new Map<string, CommunityCheckIn>();

  getHome(accountId: string): WafHomeReadModel {
    this.recordProductEvent('waf_home_viewed', 'WAF_HOME', { accountId });
    const currentParticipation = [...this.participations.values()].find((item) => item.accountId === accountId) ?? null;
    return {
      topics: WAF_TOPICS,
      featuredChallenge: WAF_FEATURED_CHALLENGE,
      currentParticipation,
      principalEntry: this.createPrincipalEntry('ADOLESCENT_COMMUNICATION', 'WAF_HOME'),
      familySummary: {
        label: '我的Family',
        currentDay: currentParticipation?.currentDay ?? null,
        completedActions: [...this.checkins.values()].filter((item) => item.result === 'COMPLETED').length,
        totalActions: currentParticipation?.currentDay ?? 0,
      },
      stories: WAF_STORIES,
    };
  }

  joinChallenge(accountId: string, challengeId: 'LISTEN_BEFORE_RESPOND_7D' = 'LISTEN_BEFORE_RESPOND_7D'): CommunityParticipation {
    const participation: CommunityParticipation = {
      id: `waf-participation-${accountId}-${challengeId}`,
      accountId,
      challengeId,
      status: 'ACTIVE',
      currentDay: 1,
      joinedAt: new Date(0).toISOString(),
    };
    this.participations.set(participation.id, participation);
    this.recordProductEvent('waf_challenge_joined', 'WAF_CHALLENGE', { accountId, challengeId });
    return participation;
  }

  acceptTodayAction(participationId: string): CommunityActionAcceptance {
    const participation = this.requireParticipation(participationId);
    const day = WAF_FEATURED_CHALLENGE.days[participation.currentDay - 1];
    const acceptance: CommunityActionAcceptance = {
      id: `waf-acceptance-${participationId}-${day.id}`,
      participationId,
      challengeDayId: day.id,
      acceptedAt: new Date(0).toISOString(),
    };
    this.acceptances.set(acceptance.id, acceptance);
    this.recordProductEvent('waf_action_accepted', 'WAF_TODAY', {
      accountId: participation.accountId,
      challengeId: participation.challengeId,
      challengeDay: participation.currentDay,
    });
    return acceptance;
  }

  submitCheckIn(participationId: string, result: CommunityCheckInResult, note?: string): CommunityCheckIn {
    const participation = this.requireParticipation(participationId);
    const day = WAF_FEATURED_CHALLENGE.days[participation.currentDay - 1];
    const checkin: CommunityCheckIn = {
      id: `waf-checkin-${participationId}-${day.id}`,
      participationId,
      challengeDayId: day.id,
      result,
      note,
      checkedInAt: new Date(0).toISOString(),
    };
    this.checkins.set(checkin.id, checkin);
    this.recordProductEvent('waf_checkin_submitted', 'WAF_TODAY', {
      accountId: participation.accountId,
      challengeId: participation.challengeId,
      challengeDay: participation.currentDay,
    });
    return checkin;
  }

  createPrincipalEntry(topicId: WafTopicId, sourceSurface: WafSourceSurface, challengeDay?: number): WafPrincipalEntryContext {
    return {
      topic_id: topicId,
      challenge_id: 'LISTEN_BEFORE_RESPOND_7D',
      challenge_day: challengeDay,
      source_surface: sourceSurface,
    };
  }

  listProductEvents(): ProductEvent[] {
    return [...this.productEvents];
  }

  private recordProductEvent(
    name: WafProductEventName,
    sourceSurface: WafSourceSurface,
    details: { accountId?: string; topicId?: WafTopicId; challengeId?: string; challengeDay?: number } = {},
  ): void {
    this.productEvents.push({
      id: `event-${this.productEvents.length + 1}`,
      name,
      sourceSurface,
      occurredAt: new Date(0).toISOString(),
      ...details,
    });
  }

  private requireParticipation(participationId: string): CommunityParticipation {
    const participation = this.participations.get(participationId);
    if (!participation) {
      throw new Error('community_participation_not_found');
    }
    return participation;
  }
}
