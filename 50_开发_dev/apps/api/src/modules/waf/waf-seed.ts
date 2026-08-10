import type { ChallengeDay, CommunityChallenge, FamilyStoryCard, Topic } from '@family/waf-contracts';

export const WAF_TOPICS: Topic[] = [
  {
    id: 'ADOLESCENT_COMMUNICATION',
    slug: 'adolescent-communication',
    title: '青春期沟通',
    familyFeels: '孩子开始有自己的边界，父母常觉得被推开。',
    doNotRush: '先不要急着纠正态度，也不要把一次沉默解释成关系失败。',
    principalPrompt: '帮我把一次青春期冲突变成可说出口的问题。',
    relatedChallengeId: 'LISTEN_BEFORE_RESPOND_7D',
  },
  {
    id: 'SCREEN_TIME',
    slug: 'screen-time',
    title: '手机冲突',
    familyFeels: '规则一谈就炸，双方都觉得对方不理解自己。',
    doNotRush: '先不要把手机问题直接升级成自控力或品格问题。',
    principalPrompt: '帮我从手机冲突里找到今晚能先做的一件小事。',
    relatedChallengeId: 'LISTEN_BEFORE_RESPOND_7D',
  },
  {
    id: 'HOMEWORK',
    slug: 'homework',
    title: '作业拉扯',
    familyFeels: '每天都像在催促、解释、发火和后悔之间循环。',
    doNotRush: '先不要把完成作业等同于家庭关系的全部表现。',
    principalPrompt: '帮我把作业拉扯拆成一个今晚可练习的互动。',
    relatedChallengeId: 'LISTEN_BEFORE_RESPOND_7D',
  },
  {
    id: 'DEFIANCE_EMOTION',
    slug: 'defiance-emotion',
    title: '顶嘴与情绪',
    familyFeels: '一句话很快变成互相伤害，事后又不知道怎么修复。',
    doNotRush: '先不要立刻判定谁不尊重谁，先看见情绪升级点。',
    principalPrompt: '帮我准备一句不升级冲突的回应。',
    relatedChallengeId: 'LISTEN_BEFORE_RESPOND_7D',
  },
];

export const WAF_CHALLENGE_DAYS: ChallengeDay[] = [
  { id: 'listen-day-1', challengeId: 'LISTEN_BEFORE_RESPOND_7D', dayNumber: 1, title: '先听完', action: '孩子说完以后，先停三秒再回应。', avoid: ['打断', '立刻评价', '马上解决'] },
  { id: 'listen-day-2', challengeId: 'LISTEN_BEFORE_RESPOND_7D', dayNumber: 2, title: '少评价', action: '把一句评价改成一句观察。', avoid: ['贴标签', '翻旧账', '扩大问题'] },
  { id: 'listen-day-3', challengeId: 'LISTEN_BEFORE_RESPOND_7D', dayNumber: 3, title: '先复述', action: '先说：“你的意思是……”再表达自己的想法。', avoid: ['抢结论', '讲大道理', '用反问压人'] },
  { id: 'listen-day-4', challengeId: 'LISTEN_BEFORE_RESPOND_7D', dayNumber: 4, title: '少解释', action: '少解释自己的苦心，多确认对方听到什么。', avoid: ['连续解释', '证明自己', '追着说服'] },
  { id: 'listen-day-5', challengeId: 'LISTEN_BEFORE_RESPOND_7D', dayNumber: 5, title: '先问再说', action: '先问一个开放问题，再给建议。', avoid: ['命令', '盘问', '替孩子下定义'] },
  { id: 'listen-day-6', challengeId: 'LISTEN_BEFORE_RESPOND_7D', dayNumber: 6, title: '修复一次', action: '为一次语气不好做一次简短修复。', avoid: ['冷处理', '算总账', '要求立刻原谅'] },
  { id: 'listen-day-7', challengeId: 'LISTEN_BEFORE_RESPOND_7D', dayNumber: 7, title: '家庭复盘', action: '一起说出这 7 天最有用的一次改变。', avoid: ['评比谁做得好', '打分排名', '否定没完成的天数'] },
];

export const WAF_FEATURED_CHALLENGE: CommunityChallenge = {
  id: 'LISTEN_BEFORE_RESPOND_7D',
  slug: 'listen-before-respond-7d',
  title: '7天先听后回应',
  description: '不是7天改变孩子，而是7天先改变互动方式。',
  days: WAF_CHALLENGE_DAYS,
};

export const WAF_STORIES: FamilyStoryCard[] = [
  {
    id: 'story-1',
    title: '那天我第一次没急着讲道理',
    anonymizedExcerpt: '匿名家庭 A：先把追问改成复述，晚饭后冲突少了一次。',
    reviewed: true,
    consentPurpose: 'CONTENT_PUBLICATION',
  },
];
