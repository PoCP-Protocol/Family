export type WafTopicId =
  | 'ADOLESCENT_COMMUNICATION'
  | 'SCREEN_TIME'
  | 'HOMEWORK'
  | 'DEFIANCE_EMOTION';

export type WafSourceSurface = 'WAF_HOME' | 'WAF_TOPIC' | 'WAF_CHALLENGE' | 'WAF_TODAY' | 'WAF_PARTICIPATION';
export type CommunityParticipationStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';
export type CommunityCheckInResult = 'COMPLETED' | 'PARTIAL' | 'NOT_DONE';

export type WafProductEventName =
  | 'waf_home_viewed'
  | 'waf_topic_opened'
  | 'waf_principal_entry_clicked'
  | 'waf_challenge_viewed'
  | 'waf_challenge_joined'
  | 'waf_action_prompt_viewed'
  | 'waf_action_accepted'
  | 'waf_checkin_started'
  | 'waf_checkin_submitted'
  | 'waf_story_viewed'
  | 'waf_d1_return'
  | 'waf_d7_completed';

export interface Topic {
  id: WafTopicId;
  slug: string;
  title: string;
  familyFeels: string;
  doNotRush: string;
  principalPrompt: string;
  relatedChallengeId: string;
}

export interface ChallengeDay {
  id: string;
  challengeId: string;
  dayNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  action: string;
  avoid: string[];
}

export interface CommunityChallenge {
  id: 'LISTEN_BEFORE_RESPOND_7D';
  slug: 'listen-before-respond-7d';
  title: '7天先听后回应';
  description: string;
  days: ChallengeDay[];
}

export interface CommunityParticipation {
  id: string;
  accountId: string;
  challengeId: string;
  status: CommunityParticipationStatus;
  currentDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  joinedAt: string;
}

export interface CommunityActionAcceptance {
  id: string;
  participationId: string;
  challengeDayId: string;
  acceptedAt: string;
}

export interface CommunityCheckIn {
  id: string;
  participationId: string;
  challengeDayId: string;
  result: CommunityCheckInResult;
  note?: string;
  checkedInAt: string;
}

export interface FamilyStoryCard {
  id: string;
  title: string;
  anonymizedExcerpt: string;
  reviewed: true;
  consentPurpose: 'CONTENT_PUBLICATION';
}

export interface ProductEvent {
  id: string;
  name: WafProductEventName;
  sourceSurface: WafSourceSurface;
  occurredAt: string;
  accountId?: string;
  topicId?: WafTopicId;
  challengeId?: string;
  challengeDay?: number;
}

export interface WafPrincipalEntryContext {
  topic_id: WafTopicId;
  challenge_id?: string;
  challenge_day?: number;
  source_surface: WafSourceSurface;
}

export interface WafHomeReadModel {
  topics: Topic[];
  featuredChallenge: CommunityChallenge;
  currentParticipation: CommunityParticipation | null;
  principalEntry: WafPrincipalEntryContext;
  familySummary: {
    label: string;
    currentDay: number | null;
    completedActions: number;
    totalActions: number;
  };
  stories: FamilyStoryCard[];
}

export const WAF_PRODUCT_EVENT_NAMES: readonly WafProductEventName[] = [
  'waf_home_viewed',
  'waf_topic_opened',
  'waf_principal_entry_clicked',
  'waf_challenge_viewed',
  'waf_challenge_joined',
  'waf_action_prompt_viewed',
  'waf_action_accepted',
  'waf_checkin_started',
  'waf_checkin_submitted',
  'waf_story_viewed',
  'waf_d1_return',
  'waf_d7_completed',
];

export const WAF_CONSENT_PURPOSES = {
  challengeParticipation: 'SERVICE',
  recordToFamily: 'GROWTH_TRACKING',
  fpaiFamilyContext: 'AI_PERSONALIZATION',
  publicFamilyStory: 'CONTENT_PUBLICATION',
  modelTraining: 'MODEL_IMPROVEMENT',
} as const;
