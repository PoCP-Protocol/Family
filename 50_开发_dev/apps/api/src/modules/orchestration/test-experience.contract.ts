export const TEST_EXPERIENCE_FIXTURE_VERSION = 'family-34-page-test-experience.v1' as const;

export const TEST_EXPERIENCE_ACTIONS = [
  'CREATE_INVITE',
  'CREATE_GROUP',
  'CREATE_BOOKING',
  'CREATE_EVENT',
  'PUBLISH_TEMPLATE',
  'CREATE_RENEWAL_INTEREST',
  'ENTER_EXPERT_LIVE',
] as const;
export type TestExperienceAction = (typeof TEST_EXPERIENCE_ACTIONS)[number];

export interface ExecuteTestExperienceDto {
  page_id?: string;
  action?: TestExperienceAction;
  fixture_ref?: string;
  fixture_version?: string;
  channel?: 'VIDEO' | 'TEXT' | 'OFFLINE';
}

export interface TestExperienceOperationResult {
  operation_id: string;
  page_id: string;
  action: TestExperienceAction;
  operation_kind: 'COMMERCE_INVITE' | 'COMMERCE_GROUP' | 'SERVICE_BOOKING' | 'EVENT_REGISTRATION' | 'COMMUNITY_TEMPLATE_PUBLICATION' | 'MEMBERSHIP_RENEWAL_DRAFT' | 'EXPERT_LIVE_SESSION';
  fixture_ref: string;
  fixture_version: typeof TEST_EXPERIENCE_FIXTURE_VERSION;
  status: 'CONFIRMED';
  environment: 'DEV' | 'TEST';
  source: 'TEST_FIXTURE';
  external_effect: false;
  text_equivalent: string;
}

export interface TestExperienceCustomerProjection {
  environment: 'DEV' | 'TEST';
  source: 'TEST_FIXTURE';
  operations: Array<{
    operation_id: string;
    operation_kind: TestExperienceOperationResult['operation_kind'];
    fixture_ref: string;
    status: 'CREATED' | 'CONFIRMED' | 'CANCELLED';
    created_at: string;
  }>;
  text_equivalent: string;
}

const FIXTURE_RULES: Record<TestExperienceAction, readonly string[]> = {
  CREATE_INVITE: ['CAMPAIGN_FAMILY_MOMENTS'],
  CREATE_GROUP: ['GROUP_PARENT_CHILD_CAMP'],
  CREATE_BOOKING: ['TEACHER_LI_SLOT_2025_05_21_1000'],
  CREATE_EVENT: ['EVENT_PARENT_CHILD_SALON_2025_05_25'],
  PUBLISH_TEMPLATE: ['POST_TEMPLATE_GROWTH_CARD'],
  CREATE_RENEWAL_INTEREST: ['RENEWAL_INTENT_FAMILY_GROWTH'],
  ENTER_EXPERT_LIVE: ['EXPERT_LIVE_SESSION_FAMILY_GUIDANCE'],
};

const ACTION_PAGE: Record<TestExperienceAction, string> = {
  CREATE_INVITE: 'UI-15',
  CREATE_GROUP: 'UI-16',
  CREATE_BOOKING: 'UI-21',
  CREATE_EVENT: 'UI-23',
  PUBLISH_TEMPLATE: 'UI-26',
  CREATE_RENEWAL_INTEREST: 'UI-30',
  ENTER_EXPERT_LIVE: 'UI-01',
};

export function isTestExperienceAction(value: unknown): value is TestExperienceAction {
  return typeof value === 'string' && (TEST_EXPERIENCE_ACTIONS as readonly string[]).includes(value);
}

export function fixtureAllowedForTestExperienceAction(action: TestExperienceAction, fixtureRef: unknown): fixtureRef is string {
  return typeof fixtureRef === 'string' && FIXTURE_RULES[action].includes(fixtureRef);
}

export function pageAllowedForTestExperienceAction(action: TestExperienceAction, pageId: unknown): pageId is string {
  return typeof pageId === 'string' && ACTION_PAGE[action] === pageId;
}

export function operationKindForTestExperienceAction(action: TestExperienceAction): TestExperienceOperationResult['operation_kind'] {
  switch (action) {
    case 'CREATE_INVITE': return 'COMMERCE_INVITE';
    case 'CREATE_GROUP': return 'COMMERCE_GROUP';
    case 'CREATE_BOOKING': return 'SERVICE_BOOKING';
    case 'CREATE_EVENT': return 'EVENT_REGISTRATION';
    case 'PUBLISH_TEMPLATE': return 'COMMUNITY_TEMPLATE_PUBLICATION';
    case 'CREATE_RENEWAL_INTEREST': return 'MEMBERSHIP_RENEWAL_DRAFT';
    case 'ENTER_EXPERT_LIVE': return 'EXPERT_LIVE_SESSION';
  }
}

export function testExperienceTextEquivalent(action: TestExperienceAction): string {
  switch (action) {
    case 'CREATE_INVITE': return '已生成邀请回执。本次不会发送链接、消息或营销通知，也不会产生外部奖励。';
    case 'CREATE_GROUP': return '已生成拼团回执。本次不会扣款、占用库存、通知他人或生成外部订单。';
    case 'CREATE_BOOKING': return '已确认预约回执。本次不会联系真人、创建外部日程或发送电话、视频或短信通知。';
    case 'CREATE_EVENT': return '已确认活动报名回执。本次不会收费、保留外部席位或发送活动通知。';
    case 'PUBLISH_TEMPLATE': return '已记录发布回执。本次不会向任何家庭、社区或外部服务发布内容。';
    case 'CREATE_RENEWAL_INTEREST': return '已记下续费了解意向。本次不会扣款、续费、变更权益或发送通知。';
    case 'ENTER_EXPERT_LIVE': return '已记下家庭查看专家直播场次。本次不会建立音视频连接、联系专家或发送通知。';
  }
}
