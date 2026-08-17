/**
 * TODAY-001 (web) · Today 首页视图模型(只读投影;登录后主页)。
 * 只呈现家长当下要看的:今天关注什么 / 今天做什么 / 待 Check-in / Principal 跟进 / 专家回复。
 * 不是复杂仪表盘;不含任何分数/排名。纯视图模型,数据由 API 只读提供。
 */
export interface TodayInputs {
  familyDisplayName?: string;
  currentFocus?: string | null;          // 当前 Growth Priority 的家长可读描述
  todaysAction?: string | null;          // 今天的 One Small Action
  pendingCheckin?: boolean;              // 是否有待完成 Check-in
  principalFollowup?: string | null;     // Principal 最近建议/跟进
  expertReplyPending?: boolean;          // 是否有专家回复待查看(Human Gate)
}

export interface TodayCard { key: string; title: string; body: string; actionable: boolean; }
export interface TodayView { greeting: string; cards: TodayCard[]; }

/** 构建 Today 视图:按"关注→做什么→Check-in→Principal→专家"顺序;缺省项以温和空态呈现,不制造焦虑。 */
export function buildTodayView(i: TodayInputs): TodayView {
  const cards: TodayCard[] = [];
  cards.push({
    key: 'focus', title: '这一阶段我们关注什么',
    body: i.currentFocus?.trim() ? i.currentFocus : '还没有设定成长重点,可以先从一次对话开始。',
    actionable: !i.currentFocus,
  });
  cards.push({
    key: 'today_action', title: '今天试一个小行动',
    body: i.todaysAction?.trim() ? i.todaysAction : '今天先不安排任务也没关系。',
    actionable: !!i.todaysAction,
  });
  if (i.pendingCheckin) {
    cards.push({ key: 'checkin', title: '有一个待完成的 Check-in', body: '花一分钟记录一下刚才发生了什么。', actionable: true });
  }
  if (i.principalFollowup?.trim()) {
    cards.push({ key: 'principal', title: 'Principal 的跟进', body: i.principalFollowup, actionable: true });
  }
  if (i.expertReplyPending) {
    cards.push({ key: 'expert', title: '专家有回复', body: '一位真人顾问复核了你的情况,点开查看。', actionable: true });
  }
  return {
    greeting: i.familyDisplayName?.trim() ? `${i.familyDisplayName},今天好` : '今天好',
    cards,
  };
}

/** 主导航(消费者视角,无 Wave/M3/WAF 等工程术语)。 */
export const PRIMARY_NAV = ['today', 'growth', 'principal', 'family'] as const;
