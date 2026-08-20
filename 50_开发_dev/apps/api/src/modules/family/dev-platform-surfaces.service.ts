import { Injectable } from '@nestjs/common';
import {
  DEV_PLATFORM_SURFACES,
  type DevFlowReceiptSummary,
  type DevFamilySelfRecord,
  type DevFamilyGrowthActivityCatalog,
  type DevFamilyLearningExchangeFeed,
  type DevPersonalGrowthJourney,
  type DevPrivateGrowthStory,
  type DevPlatformNoopCommandResult,
  type DevPlatformSurface,
  type DevPlatformSurfaceCard,
  type DevPlatformSurfacesProjection,
  getFamilyUiArchitectureBinding,
} from '@family/contracts';

type Template = Omit<DevPlatformSurfaceCard, 'surface' | 'data_source' | 'loop' | 'business_capability' | 'primary_objects' | 'state_boundary'> & { surface: DevPlatformSurface };

/**
 * Single DEV-only adapter for the platform UI surfaces after UI-10.
 * It deliberately does not call payment, notification, sharing, booking, publication, export or a model gateway.
 * The cards preserve page/domain lineage so 24 pages remain connected to one Family Growth OS instead of isolated static pages.
 */
@Injectable()
export class DevPlatformSurfacesService {
  getProjection(familyId: string, flowEvents: readonly DevFlowReceiptSummary[] = []): DevPlatformSurfacesProjection {
    return {
      projection_version: 'DEV_PLATFORM_SURFACES_V1',
      family_id: familyId,
      generated_at: new Date().toISOString(),
      data_source: 'SYNTHETIC_DEV_ONLY',
      external_effect_adapter: 'NOOP_NOT_INVOKED',
      model_gateway: 'NOOP_NOT_INVOKED',
      cards: this.templates(flowEvents).map((item) => {
        const architecture = getFamilyUiArchitectureBinding(item.surface);
        return {
          ...item,
          data_source: 'SYNTHETIC_DEV_ONLY',
          loop: architecture.loop,
          business_capability: architecture.business_capability,
          primary_objects: architecture.primary_objects,
          state_boundary: architecture.state_boundary,
        };
      }),
    };
  }

  supportsSurface(surface: string): surface is DevPlatformSurface {
    return DEV_PLATFORM_SURFACES.includes(surface as DevPlatformSurface);
  }

  acknowledgeNoop(familyId: string, surface: DevPlatformSurface, command: string): DevPlatformNoopCommandResult {
    if (!this.supportsSurface(surface)) throw new Error('unsupported_dev_platform_surface');
    return { family_id: familyId, surface, command, status: 'NOOP_ACKNOWLEDGED', persistence: 'NONE', external_effect: false, model_gateway: 'NOOP_NOT_INVOKED' };
  }

  private templates(flowEvents: readonly DevFlowReceiptSummary[]): Template[] {
    const personalGrowthJourney = buildPersonalGrowthJourney(flowEvents);
    const privateGrowthStory = buildPrivateGrowthStory(flowEvents);
    const familySelfRecord = buildFamilySelfRecord(flowEvents);
    const familyGrowthActivityCatalog = buildFamilyGrowthActivityCatalog();
    const familyLearningExchangeFeed = buildFamilyLearningExchangeFeed();
    return [
      ['UI-11','PERSONAL_HISTORY','我的成长轨迹','READ_ONLY','TIMELINE_IS_PROVENANCE_NOT_SCORE_OR_RANKING','DEV 用个人历史轨迹替代跨家庭排行；无家庭总分或同龄比较。','可查看自己的行动时间线。','READ_PERSONAL_HISTORY','READ_ONLY'],
      ['UI-12','EVIDENCE','成长故事海报','NOOP','EVIDENCE_STORY_IS_NOT_OUTCOME_OR_SHARE','DEV 展示成果故事占位；不生成海报、不外发分享。','分享适配器保持 no-op。','PREVIEW_SYNTHETIC_EVIDENCE_STORY','NOOP_NOT_PERSISTED'],
      ['UI-13','COMMERCE','家庭成长商城','READ_ONLY','CATALOG_IS_ADMITTED_FIXTURE_NOT_PURCHASE','DEV 读取准入目录 fixture；不创建购买或支付。','可查看模拟目录与权益说明。','READ_SYNTHETIC_CATALOG','READ_ONLY'],
      ['UI-14','COMMERCE','商品详情','DRAFT','PURCHASE_INTENT_IS_NOT_ORDER_OR_PAYMENT','DEV 只形成购买意向草稿；不下单、不扣款。','订单/支付 adapter 仍为 no-op。','PREVIEW_SYNTHETIC_PURCHASE_INTENT','CONTROLLED_DRAFT'],
      ['UI-15','ENTITLEMENT','邀请有礼','NOOP','INVITE_IS_NOT_EXTERNAL_SEND_OR_REWARD_GRANT','DEV 回执不发送邀请、不授予奖励。','外部邀请与通知保持 no-op。','ACK_SYNTHETIC_INVITE','NOOP_NOT_PERSISTED'],
      ['UI-16','COMMERCE','拼团专区','NOOP','GROUP_INTENT_IS_NOT_ORDER_OR_PAYMENT','DEV 展示拼团意向，不锁库存、不创建订单。','支付、库存、通知 adapter 保持 no-op。','ACK_SYNTHETIC_GROUP_INTENT','NOOP_NOT_PERSISTED'],
      ['UI-17','ENTITLEMENT','积分任务','READ_ONLY','POINTS_PROJECTION_IS_NOT_ENTITLEMENT_GRANT','DEV 只读积分规则/示例；不发积分、不兑换权益。','权益发放保持 no-op。','READ_SYNTHETIC_POINTS','READ_ONLY'],
      ['UI-18','ENTITLEMENT','会员中心','READ_ONLY','MEMBERSHIP_PROJECTION_IS_NOT_RENEWAL_OR_REFUND','DEV 只读会员权益；不续费、不退款。','支付与客服 adapter 保持 no-op。','READ_SYNTHETIC_MEMBERSHIP','READ_ONLY'],
      ['UI-19','SERVICE','名师专区','READ_ONLY','PROVIDER_CATALOG_IS_FIXTURE_NOT_QUALIFICATION_FACT','DEV 读取服务供给目录 fixture；不做推荐排序或真人联系。','可进入服务详情的受控展示。','READ_SYNTHETIC_PROVIDER_CATALOG','READ_ONLY'],
      ['UI-20','SERVICE','名师详情','DRAFT','BOOKING_DRAFT_IS_NOT_CONFIRMED_SERVICE','DEV 仅形成咨询意向草稿；不创建真人预约。','服务联系 adapter 保持 no-op。','PREVIEW_SYNTHETIC_BOOKING_DRAFT','CONTROLLED_DRAFT'],
      ['UI-21','SERVICE','在线咨询预约','DRAFT','BOOKING_DRAFT_IS_NOT_SLOT_RESERVATION','DEV 预约表单只产生草稿回执；不占座、不通知、不支付。','预约 adapter 保持 no-op。','PREVIEW_SYNTHETIC_BOOKING','CONTROLLED_DRAFT'],
      ['UI-22','ACTIVITY','沙龙活动','READ_ONLY','ACTIVITY_CATALOG_IS_FIXTURE_NOT_REGISTRATION','DEV 读取活动目录 fixture；不写日历或视频。','可查看活动详情。','READ_SYNTHETIC_ACTIVITY_CATALOG','READ_ONLY'],
      ['UI-23','ACTIVITY','活动详情','DRAFT','REGISTRATION_DRAFT_IS_NOT_ATTENDANCE','DEV 报名只形成草稿；不报名、不通知、不写日历。','活动 adapter 保持 no-op。','PREVIEW_SYNTHETIC_REGISTRATION','CONTROLLED_DRAFT'],
      ['UI-24','SERVICE','我的咨询与活动','READ_ONLY','SERVICE_RECORD_IS_NOT_SERVICE_OUTCOME','DEV 展示私有服务记录 fixture；不伪造真人服务结果。','可回看受控草稿状态。','READ_SYNTHETIC_SERVICE_RECORDS','READ_ONLY'],
      ['UI-25','COMMUNITY','家长社区','READ_ONLY','COMMUNITY_FEED_IS_MODERATED_FIXTURE_NOT_PUBLICATION','DEV 展示已审核 fixture 内容；不加载真实社区或互动。','发布/评论保持 no-op。','READ_SYNTHETIC_COMMUNITY_FEED','READ_ONLY'],
      ['UI-26','COMMUNITY','发布动态','NOOP','POST_DRAFT_IS_NOT_PUBLICATION','DEV 只确认发布草稿；不上传媒体、不公开发布。','审核/发布 adapter 保持 no-op。','ACK_SYNTHETIC_POST_DRAFT','NOOP_NOT_PERSISTED'],
      ['UI-27','COMMUNITY','动态详情','READ_ONLY','COMMUNITY_EVIDENCE_IS_NOT_FACT_OR_PUBLIC_INTERACTION','DEV 展示审核后的私有内容 fixture；不点赞/评论/举报。','互动 adapter 保持 no-op。','READ_SYNTHETIC_POST_DETAIL','READ_ONLY'],
      ['UI-28','COMMUNITY','我的社区','READ_ONLY','PRIVATE_COMMUNITY_PROJECTION_REQUIRES_VISIBILITY_BOUNDARY','DEV 只读私有内容和可见性标记；不改变权限。','删除/撤回保持 no-op。','READ_SYNTHETIC_MY_COMMUNITY','READ_ONLY'],
      ['UI-29','EVIDENCE','成长成果','READ_ONLY','OBSERVATION_IS_NOT_FACT_OR_CAUSAL_EFFECT','DEV 展示行动/观察故事与限制；不宣称效果、因果或诊断。','可回到个人成长轨迹。','READ_SYNTHETIC_OUTCOME_EVIDENCE','READ_ONLY'],
      ['UI-30','ENTITLEMENT','年度会员中心','READ_ONLY','ENTITLEMENT_IS_NOT_PAYMENT_RENEWAL_OR_REFUND','DEV 只读年度服务权益；不续费、不退款。','支付 adapter 保持 no-op。','READ_SYNTHETIC_ANNUAL_MEMBERSHIP','READ_ONLY'],
      ['UI-31','SERVICE','我的服务','READ_ONLY','SERVICE_CASE_IS_NOT_REAL_WORLD_DELIVERY','DEV 展示服务 case fixture；不创建真人服务或通知。','可查看相关计划与任务。','READ_SYNTHETIC_SERVICE_CASES','READ_ONLY'],
      ['UI-32','ENTITLEMENT','订单与资产','READ_ONLY','ORDER_ASSET_PROJECTION_IS_NOT_PAYMENT_OR_DOWNLOAD','DEV 展示私有资产 fixture；不支付、不退款、不导出。','资产 adapter 保持 no-op。','READ_SYNTHETIC_ORDERS_ASSETS','READ_ONLY'],
      ['UI-33','PROFILE','家庭档案','READ_ONLY','PROFILE_IS_INTERPRETIVE_NOT_FACT','DEV 展示最小家庭档案结构；不写儿童敏感数据或诊断。','Consent/身份变更保持 no-op。','READ_SYNTHETIC_FAMILY_PROFILE','READ_ONLY'],
      ['UI-34','RECORD','服务记录','READ_ONLY','RECORD_IS_PROVENANCE_NOT_OUTCOME','DEV 展示服务记录 fixture；过程记录不代表教育或服务效果。','导出与分享 adapter 保持 no-op。','READ_SYNTHETIC_SERVICE_RECORD_HISTORY','READ_ONLY'],
    ].map(([surface, domain, title, state, boundary, summary, next_hint, command, mode]) => ({
      surface: surface as DevPlatformSurface, domain: domain as DevPlatformSurfaceCard['domain'], title, state: state as DevPlatformSurfaceCard['state'], boundary, summary, next_hint, command: { name: command, mode: mode as DevPlatformSurfaceCard['command']['mode'] },
      ...(surface === 'UI-11' ? { personal_growth_journey: personalGrowthJourney } : {}),
      ...(surface === 'UI-12' ? { private_growth_story: privateGrowthStory } : {}),
      ...(surface === 'UI-17' ? { family_self_record: familySelfRecord } : {}),
      ...(surface === 'UI-22' ? { family_growth_activity_catalog: familyGrowthActivityCatalog } : {}),
      ...(surface === 'UI-25' ? { family_learning_exchange_feed: familyLearningExchangeFeed } : {}),
    }));
  }
}

function buildFamilyGrowthActivityCatalog(): DevFamilyGrowthActivityCatalog {
  return {
    state: 'READY',
    headline: '可以慢慢了解的家庭成长活动',
    introduction: '先看看活动主题和适龄参考，再决定是否想进一步了解。',
    activities: [
      { activity_ref: 'ACTIVITY_PARENT_CHILD_DIALOGUE', title: '亲子沟通小练习', summary: '围绕一次日常对话，交换彼此的想法。', age_hint: '适龄参考：学龄儿童家庭', detail_route: 'activity-detail' },
      { activity_ref: 'ACTIVITY_FAMILY_READING', title: '家庭阅读时光', summary: '用一本喜欢的书，留出一段轻松的共读时间。', age_hint: '适龄参考：亲子共读家庭', detail_route: 'activity-detail' },
    ],
    support_topics_route: 'teacher-zone',
    fact_boundary: 'ACTIVITY_BROWSING_NOT_REGISTRATION_ATTENDANCE_OR_OUTCOME',
  };
}

function buildFamilyLearningExchangeFeed(): DevFamilyLearningExchangeFeed {
  return {
    state: 'READY',
    headline: '看看其他家庭的日常小经验',
    introduction: '先读一读别人怎么把小行动放进日常，再决定哪些想法适合自己的家庭。',
    entries: [
      {
        exchange_ref: 'EXCHANGE_DIALOGUE_PAUSE',
        title: '给一次对话留一点停顿',
        summary: '有家长会在情绪上来时先停一停，等彼此都愿意再继续说。',
        topic: '亲子沟通',
        detail_route: 'dynamic-detail',
      },
      {
        exchange_ref: 'EXCHANGE_READING_ROUTINE',
        title: '把共读放进睡前的十分钟',
        summary: '有家庭从一小段喜欢的故事开始，不追求读完多少，只留一点相处时间。',
        topic: '家庭阅读',
        detail_route: 'dynamic-detail',
      },
    ],
    activity_catalog_route: 'salon-list',
    fact_boundary: 'READING_EXPERIENCE_SUMMARIES_NOT_PUBLICATION_INTERACTION_OR_OUTCOME',
  };
}

function buildPersonalGrowthJourney(flowEvents: readonly DevFlowReceiptSummary[]): DevPersonalGrowthJourney {
  const labels: Partial<Record<DevFlowReceiptSummary['ui_id'], { label: string; detail: string }>> = {
    'UI-02': { label: '选择了一个家庭关注方向', detail: '从最想照顾的一件事开始。' },
    'UI-04': { label: '查看了 90 天成长计划', detail: '把长期想法拆成更容易开始的步骤。' },
    'UI-05': { label: '打开了本周行动', detail: '为今天留出一个可以尝试的小行动。' },
    'UI-09': { label: '打开了家庭回顾', detail: '回看一次陪伴，不急着判断效果。' },
    'UI-35': { label: '记录了一次成长营小行动', detail: '把一次愿意尝试的家庭行动留在过程里。' },
  };
  const entries = flowEvents
    .filter((event) => labels[event.ui_id])
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .slice(-4)
    .map((event) => ({ event_id: event.event_id, ...labels[event.ui_id]! }));
  return {
    state: entries.length > 0 ? 'IN_PROGRESS' : 'STARTING',
    headline: entries.length > 0 ? '我们已经走过的几步' : '从一件想关注的小事开始',
    entries,
    plan_route: 'core-plan',
    review_route: 'growth-report',
    fact_boundary: 'PROCESS_EVENTS_NOT_OUTCOME_OR_RANKING',
  };
}

function buildFamilySelfRecord(flowEvents: readonly DevFlowReceiptSummary[]): DevFamilySelfRecord {
  const hasRecordedAction = flowEvents.some((event) => event.ui_id === 'UI-09' && event.command === 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW');
  return {
    state: hasRecordedAction ? 'READY' : 'WAITING_FOR_ACTION',
    headline: hasRecordedAction ? '我们已经为今天留下一条小记录' : '从一次愿意开始的小行动出发',
    confirmation: hasRecordedAction
      ? '这次行动已经被家庭记下。不急着证明什么，也可以慢慢回看。'
      : '当我们完成一次今天的小行动，这里会留下属于家庭自己的过程小记。',
    pause_hint: hasRecordedAction
      ? '如果今天不想继续，也可以先停在这里；下一次从更容易的一步开始。'
      : '可以先选一件你们觉得做得到的小事，再慢慢调整。',
    review_route: 'growth-report',
    action_route: 'growth-daily-task',
    fact_boundary: 'RECORDED_ACTION_NOT_POINTS_REWARD_OR_OUTCOME',
  };
}

function buildPrivateGrowthStory(flowEvents: readonly DevFlowReceiptSummary[]): DevPrivateGrowthStory {
  const moments = flowEvents
    .filter((event) => ['UI-02', 'UI-04', 'UI-05', 'UI-09', 'UI-35'].includes(event.ui_id))
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .slice(-4)
    .map((event) => {
      switch (event.ui_id) {
        case 'UI-02': return '我们选择了一个想一起关注的方向。';
        case 'UI-04': return '我们查看了可以慢慢练习的 90 天计划。';
        case 'UI-05': return '我们为今天留出了一个小行动。';
        case 'UI-09': return '我们打开了家庭回顾，愿意再听听彼此的感受。';
        case 'UI-35': return '我们记录了一次成长营的小行动。';
        default: return '我们留下一段家庭自己的过程片段。';
      }
    });
  return {
    state: moments.length > 0 ? 'READY' : 'WAITING_FOR_MOMENT',
    title: moments.length > 0 ? '我们一起走过的片段' : '从一段愿意回看的经历开始',
    summary: moments.length > 0
      ? '这些是我们已经尝试过的过程，不急着下结论，只是留给家庭慢慢回看的片段。'
      : '当我们开始关注一件小事，这里会留下家庭自己的过程片段。',
    moments,
    journey_route: 'growth-ranking',
    fact_boundary: 'PROCESS_EVENTS_NOT_OUTCOME_OR_SHARE',
  };
}
