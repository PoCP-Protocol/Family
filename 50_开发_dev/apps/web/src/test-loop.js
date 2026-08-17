// @ts-nocheck
// Family / 伐木累 visual shell. Historical `bangyang-reference` paths preserve the supplied source evidence.
/**
 * @typedef {{ apiBaseUrl: string, familyId: string, initialPage?: string }} TestLoopConfig
 */
/** @type {TestLoopConfig} */
export const defaultTestLoopConfig = { apiBaseUrl: 'http://localhost:3000', familyId: '22222222-2222-4222-8222-222222222222' };

const ICONS = { assessment: '🛡', task: '✓', child: '🎮', rank: '🏆', report: '📘', assistant: '🤖', invite: '🎁', group: '👥', points: '🪙', goods: '👜', member: '👤', plan: '📋', class: '📖', activity: '🎪' };
const tap = (action, label, cls = '') => `<button class="by-btn ${cls}" data-by="${action}">${label}</button>`;
const mini = (action, icon, title, note = '') => `<button class="by-mini" data-by="${action}"><b>${icon}</b><span>${title}</span>${note ? `<small>${note}</small>` : ''}</button>`;
const card = (title, note, action, art = 'blue') => `<button class="by-content-card" data-by="${action}"><div class="by-art ${art}"></div><strong>${title}</strong><small>${note}</small></button>`;

/** Family / 伐木累 34-page visual SSOT → stable route mapping. Asset/source IDs remain legacy-traceable elsewhere. */
export const FAMILY_UI_34_ROUTE_MANIFEST = Object.freeze([
  ['UI-01', 'home'], ['UI-02', 'growth-assessment'], ['UI-03', 'assessment'], ['UI-04', 'core-report'],
  ['UI-05', 'core-plan'], ['UI-06', 'core-community'], ['UI-07', 'core-mine'], ['UI-08', 'growth-report'],
  ['UI-09', 'growth-daily-task'], ['UI-10', 'growth-child'], ['UI-11', 'growth-ranking'], ['UI-12', 'growth-poster'],
  ['UI-13', 'commerce-mall'], ['UI-14', 'commerce-product'], ['UI-15', 'commerce-invite'], ['UI-16', 'commerce-group'],
  ['UI-17', 'commerce-points'], ['UI-18', 'commerce-mine'], ['UI-19', 'teacher-zone'], ['UI-20', 'teacher-detail'],
  ['UI-21', 'consultation-booking'], ['UI-22', 'salon-list'], ['UI-23', 'activity-detail'], ['UI-24', 'service-mine'],
  ['UI-25', 'parent-community'], ['UI-26', 'publish-dynamic'], ['UI-27', 'dynamic-detail'], ['UI-28', 'my-community'],
  ['UI-29', 'growth-outcomes'], ['UI-30', 'annual-member-mine'], ['UI-31', 'my-services'], ['UI-32', 'orders-assets'],
  ['UI-33', 'family-profile'], ['UI-34', 'service-records'],
]);
const FAMILY_UI_34_ROUTE_SET = new Set(FAMILY_UI_34_ROUTE_MANIFEST.map(([, route]) => route));

/** @param {HTMLElement} root @param {TestLoopConfig} config */
export function createTestLoopApp(root, config = defaultTestLoopConfig) {
  let page = FAMILY_UI_34_ROUTE_SET.has(config.initialPage) ? config.initialPage : 'home';
  let checked = [false, false, false];
  let currentNeed = '亲子沟通';
  let llmTextEquivalent = '';
  const llmActionRoutes = {
    'llm-growth-assessment': ['UI-02', 'assessment'],
    'llm-core-report': ['UI-04', 'core-plan'],
    'llm-daily-task': ['UI-09', 'growth-child'],
    'llm-commerce-group': ['UI-16', 'commerce-group'],
    'llm-teacher-booking': ['UI-21', 'consultation-booking'],
    'llm-activity': ['UI-23', 'service-mine'],
    'llm-community-publish': ['UI-26', 'publish-dynamic'],
    'llm-my-services': ['UI-31', 'family-profile'],
  };
  const commerceActionRoutes = {
    'commerce-submit-intent': { pageId: 'UI-14', productRef: 'PRODUCT_PARENT_CHILD_CAMP', productVersion: 1, nextPage: 'orders-assets' },
    'commerce-load-customer-assets': { pageId: null, productRef: null, productVersion: null, nextPage: 'orders-assets' },
  };
  const serviceBookingActionRoutes = {
    'service-submit-booking': { pageId: 'UI-21', serviceOfferingRef: 'SERVICE_PARENT_CHILD_PRIMARY', serviceOfferingVersion: 1, availabilitySlotRef: 'SLOT_PRIMARY', nextPage: 'service-mine' },
    'service-load-customer-projection': { pageId: null, serviceOfferingRef: null, serviceOfferingVersion: null, availabilitySlotRef: null, nextPage: 'service-mine' },
  };
  async function requestPageExplanation(pageId) {
    const correlationId = `family-web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/llm/draft`, {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
        body: JSON.stringify({ page_id: pageId }),
      });
      const payload = await response.json();
      llmTextEquivalent = payload?.text_equivalent || '当前说明暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyLlmDecision = payload?.decision || 'CLIENT_FAILURE';
      root.dataset.familyLlmTrace = payload?.audit?.trace_id || correlationId;
      return payload;
    } catch (_error) {
      llmTextEquivalent = '当前说明暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyLlmDecision = 'CLIENT_FAILURE';
      root.dataset.familyLlmTrace = correlationId;
      return null;
    }
  }
  async function requestCommerceIntent(routeKey) {
    const route = commerceActionRoutes[routeKey];
    const correlationId = `family-commerce-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const isProjection = route.pageId === null;
      const response = await fetch(
        isProjection
          ? `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/commerce/customer-projection`
          : `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/commerce/order-intents`,
        {
          method: isProjection ? 'GET' : 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, ...(isProjection ? {} : { 'idempotency-key': correlationId }) },
          ...(isProjection ? {} : { body: JSON.stringify({ page_id: route.pageId, product_ref: route.productRef, product_version: route.productVersion }) }),
        },
      );
      const payload = await response.json();
      llmTextEquivalent = payload?.intent?.text_equivalent || payload?.text_equivalent || '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyCommerceAction = isProjection ? 'READ_CUSTOMER_COMMERCE_PROJECTION' : 'SUBMIT_ORDER_INTENT';
      root.dataset.familyCommerceStatus = payload?.intent?.status || (isProjection ? 'READ_ONLY' : 'CLIENT_FAILURE');
      root.dataset.familyCommerceOrderIntent = payload?.intent?.order_intent_id || '';
      return payload;
    } catch (_error) {
      llmTextEquivalent = '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyCommerceAction = route.pageId === null ? 'READ_CUSTOMER_COMMERCE_PROJECTION' : 'SUBMIT_ORDER_INTENT';
      root.dataset.familyCommerceStatus = 'CLIENT_FAILURE';
      root.dataset.familyCommerceOrderIntent = '';
      return null;
    }
  }
  const nav = () => `<nav class="by-tabbar"><button data-by="home" class="${page === 'home' ? 'on' : ''}">⌂<span>首页</span></button><button data-by="mall" class="${['mall','product','invite','group','points'].includes(page) ? 'on' : ''}">▣<span>商城</span></button><button data-by="plan" class="${['plan','task','report','child','poster'].includes(page) ? 'on' : ''}">◌<span>成长</span></button><button data-by="mine" class="${page === 'mine' ? 'on' : ''}">♙<span>我的</span></button></nav>`;
  const top = (title, action = 'back', right = '⋯') => `<header class="by-top"><button data-by="${action}" class="by-back">‹</button><strong>${title}</strong><button data-by="home" class="by-more">${right}</button></header>`;
  const shell = (title, content, noTop = false) => `<section class="by-app">${noTop ? '' : top(title)}<main class="by-screen">${content}</main>${nav()}</section>`;
  const actionBar = (left, right, la, ra) => `<div class="by-bottom-actions">${tap(la, left, 'ghost')}${tap(ra, right, 'primary')}</div>`;

  function home() { return shell('', `<header class="by-home-top"><div><small>早上好，乐乐妈妈 👋</small><strong>一起成长，一起成为更好的父母</strong></div><button data-by="mine">⋯</button></header>
    <section class="by-blue-banner"><div><b>邀请好友领成长礼包</b><span>邀请越多，奖励越多</span>${tap('invite','立即邀请','white')}</div><div class="by-family-art">👩‍👦</div></section>
    <section class="by-quick-grid">${mini('group','👥','拼团专区','多人一起成长')}${mini('assessment','🛡','家庭成长体检','了解当下需要')}${mini('points','🪙','成长积分商城','任务换奖励')}${mini('member','🛍','会员专享','专属权益')}${mini('plan','🔥','限时挑战','一起完成小目标')}${mini('invite','🎁','邀请有礼','分享成长')}</section>
    <div class="by-section-title"><strong>今日推荐</strong><button data-by="mall">更多 ›</button></div><div class="by-card-scroll">${card('21 天亲子沟通挑战营','¥199 起','product','family')}${card('家庭成长测评卡','¥39','assessment','book')}${card('亲子阅读工具包','¥69','product','yellow')}</div>
    <section class="by-growth-strip"><b>从一次家庭体检开始</b><span>看见当下 · 制定计划 · 一起成长</span>${tap('assessment','开始体检','blue-small')}</section>`, true); }
  function assessment() { const options=[['学','学习习惯','注意力不集中、作业拖拉','cyan'],['心','情绪管理','容易焦虑、暴躁脾气','orange'],['♥','亲子沟通','不愿沟通、冲突较多','rose'],['▣','手机依赖','沉迷手机、使用失控','blue'],['▥','自律能力','缺乏自律、依赖监督','green']]; return shell('家庭测评', `<section class="assessment-step-head"><b>第 2 / 5 步</b><i><em></em></i></section><section class="assessment-step-question"><h1>您孩子目前最需要改善的问题是？</h1><small>（单选）</small></section><div class="assessment-option-list">${options.map((x,i)=>`<button data-by="select-need-${i}" class="${i===2?'selected':''}"><i class="${x[3]}">${x[0]}</i><span><strong>${x[1]}</strong><small>${x[2]}</small></span>${i===2?'<b>✓</b>':''}</button>`).join('')}</div><section class="assessment-extra"><h3>补充信息 <small>（可选）</small></h3><label><span>孩子年龄/阶段</span><b>10岁（小学四年级）⌄</b></label><label><span>家庭情况</span><div><i class="selected">双亲家庭</i><i>单亲家庭</i><i>重组家庭</i></div></label><label><span>孩子性别</span><div><i class="selected">男孩</i><i>女孩</i></div></label></section>${tap('report','下一步','assessment-next')}`); }
  function report() { const chips=['亲子沟通','学习习惯','情绪管理','自律能力','手机依赖']; return shell('家庭成长报告', `<section class="by-child-info"><span>👦</span><div><b>乐乐 10 岁 / 小学四年级</b><small>测评时间：2024-05-20</small></div></section><section class="by-radar-card"><h3>成长综合评估</h3><div class="by-radar"><i>成长<br><b>回顾</b></i></div><div class="by-radar-labels">${chips.map((x,i)=>`<span>${x}<b>${72-i*3}</b></span>`).join('')}</div></section><section class="by-report-lines"><p>🟢 <b>优势</b> 亲子沟通基础不错，愿意表达想法</p><p>🟠 <b>关注</b> 自主学习仍需要更多陪伴</p><p>🟡 <b>优先建议</b> 从每天 15 分钟亲子阅读开始</p></section><section class="by-stage-path"><b>推荐成长路径</b><div><span><strong>7 天</strong>轻松启程</span><i>→</i><span><strong>30 天</strong>养成习惯</span><i>→</i><span><strong>90 天</strong>收获成长</span></div></section><div class="by-section-title"><strong>为你准备的成长路径</strong><button data-by="mall">更多 ›</button></div><div class="by-path-cards">${card('21 天沟通挑战','从每天 15 分钟开始','plan','family')}${card('亲子阅读工具包','和孩子一起读','product','book')}${card('成长活动日历','周末一起参与','plan','yellow')}</div>${tap('plan','生成我的成长计划','full-primary')}`); }
  function taskPage() { return shell('今日成长任务', `<section class="by-robot-banner"><span>🤖</span><div><b>成长管家提醒：</b><p>今天建议完成 3 个成长小任务</p></div></section><div class="by-task-list">${[['亲子沟通 15 分钟','认真倾听孩子今天的 3 件事','15 分钟'],['记录孩子情绪变化','温柔地看见孩子的感受','5 分钟'],['完成专注力小游戏','和孩子一起动动脑','10 分钟']].map((t,i)=>`<button data-by="check-${i}" class="by-task ${checked[i]?'done':''}"><b>${i+1}</b><div><strong>${t[0]}</strong><small>${t[1]}</small><em>+10 成长积分　${t[2]}</em></div><i>${checked[i]?'✓':'□'}</i></button>`).join('')}</div><section class="by-week-progress"><div><b>本周完成度</b><strong>${checked.filter(Boolean).length ? 78 : 60}%</strong></div><span><i style="width:${checked.filter(Boolean).length ? 78 : 60}%"></i></span><p>连续打卡　<b>12 天</b></p></section>${tap('poster','完成今日任务','full-primary')}`); }
  function child() { return shell('成长小助手', `<section class="by-child-hero"><div><b>Hi，乐乐小朋友！</b><p>今天又是元气满满的一天！</p></div><span>🧒</span></section><section class="by-energy"><div><b>⚡ 成长能量</b><strong>66/100 <small>Lv.3</small></strong></div><i><em></em></i></section><div class="by-kid-grid">${mini('task','🎯','专注力训练','单词学习 15 分钟')}${mini('task','📖','阅读打卡','养成阅读习惯')}${mini('poster','🌷','情绪小日记','认识我的情绪')}${mini('plan','📝','今日目标','明天再完成')}</div><section class="by-challenge"><b>🏆 今日挑战</b><p>整理书桌，阅读 20 分钟</p><span>✨ +20 能量　⭐ +10 星星　›</span></section><section class="by-rewards"><b>我的奖励</b><span>⭐ 12　🏅 3　🏆 1　🎁 2</span></section>${tap('task','开始挑战','full-primary')}`); }
  function ranking() { return shell('成长榜单', `<div class="by-segments"><b>本周</b><span>本月</span><span>同城</span><span>同班级</span></div><section class="by-podium"><article><span>🥈</span><i>👩</i><b>阳光妈妈家庭</b><small>积分 1120</small></article><article class="first"><span>👑</span><i>👩</i><b>乐乐妈妈家庭</b><small>积分 1280</small></article><article><span>🥉</span><i>👩</i><b>阳光妈妈家庭</b><small>积分 1660</small></article></section><div class="by-rank-list">${['开心爸爸家庭','小太阳妈妈家庭','聪聪妈妈家庭'].map((x,i)=>`<p><b>${i+4}</b><span>👩　${x}</span><em>连续 ${14-i} 天　 ${980-i*60}</em></p>`).join('')}</div><section class="by-my-rank"><b>我的成长旅程</b><span>和家人一起完成每一天的小行动</span></section>`); }
  function poster() { return shell('成长成果海报', `<article class="by-poster"><header><span>✦</span><b>我们一起见证孩子的成长</b></header><div class="by-poster-user">👦 乐乐　10 岁 / 小学四年级</div><h1>孩子从不愿表达，<br>到主动分享学校里的事情</h1><div class="by-poster-path"><span>成长前<br><b>很少主动分享</b></span><i>→</i><span>成长后<br><b>主动分享学校趣事</b></span></div><div class="by-poster-data"><b>连续打卡<br><strong>21 天</strong></b><b>成长收获<br><strong>+132</strong></b></div><div class="by-medals">🏅　🏆</div><footer><i>▣</i><span>扫码查看成长故事</span></footer></article><div class="by-share-row">${tap('home','分享给好友','share')}${tap('home','分享到朋友圈','share')}${tap('home','生成海报','share')}</div>`); }
  function plan() { return shell('家庭成长计划', `<section class="by-plan-header"><small>成长第 1 阶段</small><h1>21 天亲子沟通挑战营</h1><p>从认真倾听开始，让家里的每一次对话更温暖。</p><span><i></i></span><b>已完成 6 / 21 天</b></section><div class="by-section-title"><strong>今天的计划</strong><button data-by="task">查看任务 ›</button></div><div class="by-plan-list">${[['1','温柔地问候','和孩子聊聊今天的心情'],['2','亲子共读','读一个沟通小故事'],['3','晚间回顾','留下一句今天的小收获']].map(x=>`<button data-by="task"><b>${x[0]}</b><span><strong>${x[1]}</strong><small>${x[2]}</small></span><i>›</i></button>`).join('')}</div><div class="by-section-title"><strong>为你准备</strong><button data-by="mall">更多 ›</button></div><div class="by-path-cards">${card('亲子沟通微课','每天 15 分钟','product','family')}${card('家庭阅读工具包','陪孩子一起读','product','book')}</div>`); }
  function mall() { return shell('家庭成长商城', `<header class="by-home-top"><div><small>早上好，乐乐妈妈 👋</small><strong>一起成长，一起成为更好的父母</strong></div><button data-by="mine">⋯</button></header><section class="by-blue-banner"><div><b>邀请好友领成长礼包</b><span>邀请越多，奖励越多</span>${tap('invite','立即邀请','white')}</div><div class="by-family-art">👩‍👦</div></section><section class="by-quick-grid">${mini('group','👥','拼团专区','多人一起成长')}${mini('points','🪙','积分商城','任务换奖励')}${mini('product','👜','成长好物','课程·工具·服务')}${mini('invite','🎁','邀请有礼','分享成长')}</section><div class="by-section-title"><strong>今日推荐</strong><button data-by="product">更多 ›</button></div><div class="by-card-scroll">${card('21 天亲子沟通挑战营','¥199 起','product','family')}${card('家庭成长测评卡','¥39','assessment','book')}${card('亲子阅读工具包','¥69','product','yellow')}</div>`); }
  function product() { return shell('商品详情', `<section class="by-product-art"><div><h1>21 天亲子沟通挑战营</h1><p>改善亲子关系，从有效沟通开始</p></div><span>👩‍👦</span></section><section class="by-price"><strong>¥399</strong><span>原价 ¥699</span><p>拼团价 <b>¥199</b>（3 人成团）　会员价 <b>¥179</b></p></section><section class="by-benefits"><div>✓ 21 天成长训练</div><div>✓ 17 份社群陪伴</div><div>✓ 专家答疑</div><div>✓ 会员专属服务</div></section><section class="by-product-copy"><h3>你将获得</h3><p>训练营　+　打卡社群　+　顾问答疑</p></section><section class="by-share-tip">分享给 3 位家长，领取专属优惠券</section>${actionBar('立即购买','发起拼团','home','group')}`); }
  function invite() { return shell('邀请有礼', `<section class="by-invite-title"><h2>邀请 3 个家庭，解锁会员权益</h2><p>一起成长，快乐更多更长久</p></section><section class="by-invite-progress"><span>已邀请家庭</span><strong>1/3</strong><i><em></em></i><p>再邀请 <b>2</b> 个家庭即可解锁全部奖励</p></section><div class="by-reward-grid">${mini('home','📘','家庭测评 1 次','价值 ¥59')}${mini('home','🏠','成长积分 300','价值 ¥30')}${mini('home','🎟','专家答疑券','价值 ¥99')}${mini('home','🎫','会员折扣券','9 折优惠')}</div>${tap('home','立即邀请','full-primary')}<div class="by-invite-methods"><span>💬 邀请好友</span><span>◉ 朋友圈</span><span>▣ 生成海报</span></div>`); }
  function group() { return shell('拼团专区', `<div class="by-segments"><b>全部</b><span>课程服务</span><span>会员卡</span><span>工具包</span></div><div class="by-group-list">${[['90 天成长陪跑计划','¥399','还差 2 人成团'],['家庭教育会员年卡','¥499','还差 3 人成团'],['亲子习惯养成工具包','¥99','还差 1 人成团'],['专注力提升训练营','¥199','还差 2 人成团']].map(x=>`<article><h3>${x[0]}</h3><p>👩 乐乐妈妈　👩 👩　${x[2]}</p><span><s>¥799</s>　<b>拼团价 ${x[1]}</b></span>${tap('home','去拼团','orange')}</article>`).join('')}</div>`); }
  function points() { return shell('积分商城', `<section class="by-points-card"><div><small>我的成长积分</small><strong>1280</strong>${tap('home','去签到 +10','white')}</div><span>🏆</span></section><div class="by-section-title"><strong>任务中心</strong><small>做任务，赚积分</small></div><div class="by-points-tasks">${['分享测评报告','邀请好友注册','完成打卡','发布成长案例','参与直播'].map((x,i)=>`<p><b>${['▣','♙','✓','✦','◉'][i]}</b>${x}<span>+${[50,100,20,80,30][i]}</span><button data-by="home">去完成</button></p>`).join('')}</div><div class="by-section-title"><strong>积分可兑换</strong><button data-by="product">更多 ›</button></div><div class="by-exchange-grid">${[['亲子沟通书','📘'],['亲子沟通手册','📗'],['课程优惠券','🎫'],['成长阅读礼包','👜']].map(x=>`<article><b>${x[1]}</b><strong>${x[0]}</strong><small>199 积分起</small>${tap('home','立即兑换','tiny')}</article>`).join('')}</div>`); }
  function mine() { return shell('我的', `<section class="by-profile"><span>👩</span><div><b>乐乐妈妈</b><small>一起成长，一起成为更好的父母</small></div><em>成长合伙人</em></section><section class="by-stat-row">${[['已邀请家庭','12'],['拼团成交','8'],['成长积分','1280'],['可用权益','286']].map(x=>`<span><small>${x[0]}</small><b>${x[1]}</b></span>`).join('')}</section><section class="by-level"><span>我的等级　<b>LV3 成长达人</b><small>距下一等级还差 720 积分</small></span><i>👑</i></section><div class="by-menu">${[['我的订单','home'],['邀请记录','invite'],['奖励明细','points'],['专属海报','poster'],['会员权益','member'],['客服支持','home']].map(x=>`<button data-by="${x[1]}">${x[0]}<b>›</b></button>`).join('')}</div><section class="by-member-banner"><div><b>年度会员服务</b><span>有效期至 2025-05-20</span>${tap('member','会员中心','gold')}</div><i>👑</i></section>`); }
  function member() { return shell('会员中心', `<section class="by-member-banner large"><div><b>家庭成长年度会员</b><span>陪伴每一次重要的成长时刻</span>${tap('plan','查看我的计划','gold')}</div><i>👑</i></section><div class="by-benefit-list">${['90 天家庭成长计划','成长课堂精选内容','每周家庭活动','成长记录与海报','专属服务支持'].map((x,i)=>`<p><b>${['🛡','📖','🎪','📘','♡'][i]}</b><span>${x}<small>陪伴家庭持续成长</small></span><i>›</i></p>`).join('')}</div>`); }

  function home() { return shell('', `<header class="home-spec-head"><strong>家庭成长平台</strong><span><button data-by="home">···</button><button data-by="home">◉</button></span></header><section class="home-spec-welcome"><div><h1>早上好，</h1><h2>今天也一起陪孩子成长 ☀</h2></div><button data-by="home">♧</button></section><section class="home-spec-banner"><div><h1>免费家庭测评</h1><p>3 分钟了解孩子成长状况</p><small>获取更科学的成长建议</small>${tap('assessment','立即测评 →','home-spec-cta')}</div><figure aria-label="一家四口的家庭插画"><span>👨</span><span>👩</span><span>🧒</span><span>👧</span></figure></section><section class="home-spec-grid">${mini('report','⌁','AI诊断')}${mini('plan','♙','21天挑战营')}${mini('plan','▣','90天成长计划')}${mini('poster','▤','成长案例')}${mini('home','▧','专家直播')}${mini('home','♧','家庭顾问')}</section><section class="home-spec-section"><div class="home-spec-title"><strong>今日成长任务</strong><button data-by="task">查看全部 ›</button></div><div class="home-spec-tasks"><button data-by="task"><i class="task-mint">▣</i><span>亲子沟通小练习</span><b class="complete">✓</b></button><button data-by="task"><i class="task-orange">▣</i><span>完成今日阅读打卡</span><b>去完成</b></button><button data-by="task"><i class="task-orange">▣</i><span>情绪记录</span><b>去完成</b></button></div></section><section class="home-spec-section"><div class="home-spec-title"><strong>推荐内容/服务</strong><button data-by="mall">更多 ›</button></div><div class="home-spec-recommend">${card('妈妈总问我：为什么？','今天 20:00 开播','product','home-r1')}${card('高效学习习惯养成课','限时 12 课 · 1268 人学习','product','home-r2')}${card('从紧张冲突到亲子和谐','真实案例分享','product','home-r3')}</div></section>` , true); }
  function assessment() { return `<section class="by-app by-reference-assessment"><div class="by-reference-assessment-screen" role="img" aria-label="家庭测评第2步：选择孩子当前最需要改善的问题，补充孩子年龄家庭情况和性别"><button class="by-hotspot as-option-1" data-by="assessment" aria-label="学习习惯"></button><button class="by-hotspot as-option-2" data-by="assessment" aria-label="情绪管理"></button><button class="by-hotspot as-option-3" data-by="assessment" aria-label="亲子沟通，已选中"></button><button class="by-hotspot as-option-4" data-by="assessment" aria-label="手机依赖"></button><button class="by-hotspot as-option-5" data-by="assessment" aria-label="自律能力"></button><button class="by-hotspot as-next" data-by="report" aria-label="下一步"></button></div></section>`; }

  function home() { return `<section class="by-app by-reference-home"><div class="by-reference-screen" role="img" aria-label="家庭成长平台首页：免费家庭测评、六项成长服务、今日成长任务、推荐内容服务和首页计划社群我的导航"><button class="by-hotspot hs-assessment" data-by="growth-assessment" aria-label="立即开始测评"></button><button class="by-hotspot hs-ai" data-by="core-report" aria-label="AI成长诊断"></button><button class="by-hotspot hs-challenge" data-by="core-plan" aria-label="21天挑战营"></button><button class="by-hotspot hs-plan" data-by="core-plan" aria-label="90天成长计划"></button><button class="by-hotspot hs-case" data-by="poster" aria-label="成长案例"></button><button class="by-hotspot hs-live" data-by="home" aria-label="专家直播"></button><button class="by-hotspot hs-advisor" data-by="teacher-zone" aria-label="名师专区"></button><button class="by-hotspot hs-tasks" data-by="growth-daily-task" aria-label="今日成长任务"></button><button class="by-hotspot hs-card1" data-by="product" aria-label="妈妈总问我为什么"></button><button class="by-hotspot hs-card2" data-by="product" aria-label="高效学习习惯养成课"></button><button class="by-hotspot hs-card3" data-by="product" aria-label="从紧张冲突到亲子和谐"></button><button class="by-hotspot hs-nav-plan" data-by="plan" aria-label="计划"></button><button class="by-hotspot hs-nav-community" data-by="core-community" aria-label="社群"></button><button class="by-hotspot hs-nav-mine" data-by="core-mine" aria-label="我的"></button></div></section>`; }
  const visualReference = (file, label, hotspots = []) => `<section class="by-app by-ui-reference"><div class="by-ui-reference-screen" role="img" aria-label="${label}" style="background-image:url('/public/bangyang-reference/ui18/${file}.png')">${hotspots.map((x) => `<button class="by-hotspot ${x[0]}" data-by="${x[1]}" aria-label="${x[2]}"></button>`).join('')}</div></section>`;
  const clearReference = (file, label, hotspots = [], ratio = '434/1124') => `<section class="by-app by-clear-reference"><div class="by-clear-reference-screen" role="img" aria-label="${label}" style="background-image:url('/public/bangyang-reference/${file}');aspect-ratio:${ratio}">${hotspots.map((x) => `<button class="by-hotspot ${x[0]}" data-by="${x[1]}" aria-label="${x[2]}"></button>`).join('')}</div></section>`;
  function coreReport() { return clearReference('ai-growth-diagnosis-reference-436x1118.png', '家庭成长说明：儿童信息蓝卡、五维成长评估、核心问题、成长建议和生成个性化方案', [['clear-bottom-cta', 'llm-core-report', '生成个性化方案']], '436/1118'); }
  function corePlan() { return clearReference('growth-plan-90day-reference-434x1130.png', '90天成长方案：阶段信息、3/12/36/90统计、四周时间线、任务状态和开始执行计划', [['clear-bottom-cta', 'core-community', '开始执行计划']], '434/1130'); }
  function coreCommunity() { return clearReference('delivery-community-reference-458x1128.png', '陪跑服务：四张服务卡、本周完成度、成长打卡、家长交流、直播和社群导航', [['clear-fab', 'growth-daily-task', '打卡']], '458/1128'); }
  function coreMine() { return clearReference('mine-member-reference-434x1124.png', '我的会员中心：深蓝会员信息、邀请权益、功能列表、年度会员服务和四栏导航', [['clear-bottom-nav-home', 'home', '首页']], '434/1124'); }
  function growthAssessment() { return clearReference('family-assessment-entry-reference-428x952.png', '家庭成长体检第1步：三分钟了解孩子成长状态、五大维度和示例问题', [['clear-entry-cta', 'llm-growth-assessment', '立即开始测评']], '428/952'); }
  function growthReport() { return visualReference('growth-02-ai-report', '家庭成长报告：综合评估、优势风险建议和推荐成长路径', [['ref-bottom-cta', 'core-plan', '生成个性化方案']]); }
  function growthDailyTask() { return clearReference('daily-growth-task-reference-448x916.png', '今日成长任务：机器人提醒、三项任务、积分时长、本周完成度、连续打卡和完成今日任务', [['clear-bottom-cta', 'llm-daily-task', '完成今日任务']], '448/916'); }
  function growthChild() { return clearReference('growth-child-assistant-reference-448x920.png', '成长小助手：欢迎 Banner、成长能量、四色活动卡、今日挑战、奖励和开始挑战', [['clear-bottom-cta', 'growth-daily-task', '开始挑战']], '448/920'); }
  function growthRanking() { return clearReference('growth-ranking-reference-450x918.png', '成长排行榜：筛选栏、领奖台、排名列表、个人排名与成长行动家称号，仅作原图静态视觉展示', [], '450/918'); }
  function growthPoster() { return clearReference('growth-poster-reference-444x970.png', '成长成果海报：成长故事、成长前后、连续打卡、成长值、勋章、二维码与分享方式，仅作原图静态视觉展示', [['clear-poster-share', 'home', '返回首页']], '444/970'); }
  async function requestServiceBooking(routeKey) {
    const route = serviceBookingActionRoutes[routeKey];
    const correlationId = `family-service-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const isProjection = route.pageId === null;
      const response = await fetch(
        isProjection
          ? `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/customer-projection`
          : `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/booking-requests`,
        {
          method: isProjection ? 'GET' : 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, ...(isProjection ? {} : { 'idempotency-key': correlationId }) },
          ...(isProjection ? {} : { body: JSON.stringify({ page_id: route.pageId, service_offering_ref: route.serviceOfferingRef, service_offering_version: route.serviceOfferingVersion, availability_slot_ref: route.availabilitySlotRef }) }),
        },
      );
      const payload = await response.json();
      llmTextEquivalent = payload?.booking?.text_equivalent || payload?.text_equivalent || '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyServiceBookingAction = isProjection ? 'READ_SERVICE_BOOKING_PROJECTION' : 'SUBMIT_SERVICE_BOOKING';
      root.dataset.familyServiceBookingStatus = payload?.booking?.status || (isProjection ? 'READ_ONLY' : 'CLIENT_FAILURE');
      root.dataset.familyServiceBookingRequest = payload?.booking?.booking_request_id || '';
      return payload;
    } catch (_error) {
      llmTextEquivalent = '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyServiceBookingAction = route.pageId === null ? 'READ_SERVICE_BOOKING_PROJECTION' : 'SUBMIT_SERVICE_BOOKING';
      root.dataset.familyServiceBookingStatus = 'CLIENT_FAILURE';
      root.dataset.familyServiceBookingRequest = '';
      return null;
    }
  }
  function commerceMall() { return clearReference('family-growth-mall-reference-424x978.png', '家庭成长商城：首页问候、邀请成长礼包、六宫格入口、今日推荐和商城底部导航', [['clear-mall-invite', 'commerce-invite', '立即邀请'], ['clear-mall-product-1', 'commerce-product', '21天亲子沟通挑战营'], ['clear-mall-product-2', 'commerce-product', '家庭成长测评卡'], ['clear-mall-product-3', 'commerce-product', '亲子阅读工具包']], '424/978'); }
  function commerceProduct() { return clearReference('product-detail-reference-418x970.png', '商品详情：21天亲子沟通挑战营、价格、服务权益、邀请优惠券和购买拼团操作区', [['clear-product-buy', 'commerce-submit-intent', '立即购买'], ['clear-product-group', 'llm-commerce-group', '发起拼团']], '418/970'); }
  function commerceInvite() { return clearReference('invite-rewards-reference-432x992.png', '邀请有礼：邀请3个家庭、1/3进度、奖励卡、立即邀请、邀请方式和二维码横幅', [['clear-invite-cta', 'commerce-mine', '立即邀请']], '432/992'); }
  function commerceGroup() { return clearReference('group-buy-reference-440x960.png', '拼团专区：分类Tab、四张拼团卡、团长、倒计时、参与头像、原价拼团价和去拼团按钮', [], '440/960'); }
  function commercePoints() { return clearReference('points-mall-reference-472x982.png', '积分商城：成长积分、签到、五项任务奖励、四项兑换礼和立即兑换按钮', [], '472/982'); }
  function commerceMine() { return clearReference('partner-mine-reference-440x994.png', '我的：成长合伙人、邀请成交积分可提现数据、等级进度、功能菜单与年度会员服务', [['clear-bottom-nav-home', 'home', '首页']], '440/994'); }
  function teacherZone() { return clearReference('teacher-zone-reference-458x1008.png', '名师专区：搜索、咨询 Banner、热门领域、推荐名师与底部导航，仅作静态视觉展示', [['clear-bottom-nav-home', 'home', '首页'], ['clear-teacher-detail', 'teacher-detail', '查看名师详情']], '458/1008'); }
  function teacherDetail() { return clearReference('teacher-detail-reference-426x1002.png', '名师详情：名师资料、擅长领域、可预约时间、家长评价与咨询预约操作区', [['clear-teacher-book', 'llm-teacher-booking', '预约一对一']], '426/1002'); }
  function consultationBooking() { return clearReference('consultation-booking-reference-492x1008.png', '在线咨询预约：咨询方式、时间、问题描述与确认预约', [['clear-booking-back', 'teacher-detail', '返回名师详情'], ['clear-booking-confirm', 'service-submit-booking', '确认预约']], '492/1008'); }
  function salonList() { return clearReference('salon-list-reference-466x1008.png', '线下沙龙：城市主题筛选、活动列表与活动详情入口', [['clear-salon-detail', 'llm-activity', '查看活动详情']], '466/1008'); }
  function activityDetail() { return clearReference('activity-detail-reference-470x1016.png', '活动详情：活动亮点、流程、适合人群、参与收获与报名操作区，仅作静态视觉展示', [['clear-activity-mine', 'service-mine', '我的预约和活动']], '470/1016'); }
  function serviceMine() { return clearReference('service-mine-reference-472x1018.png', '我的咨询和活动：用户资料、咨询、活动与会员信息', [['clear-service-mine-home', 'home', '首页'], ['clear-service-mine-projection', 'service-load-customer-projection', '查看我的预约和服务记录']], '472/1018'); }
  function parentCommunity() { return clearReference('parent-community-reference-552x1034.png', '家长社区：搜索、话题、内容流与互动入口', [['clear-community-detail', 'dynamic-detail', '查看动态详情'], ['clear-community-publish', 'llm-community-publish', '发布动态'], ['clear-community-mine', 'my-community', '我的社区']], '552/1034'); }
  function publishDynamic() { return clearReference('publish-dynamic-reference-548x1028.png', '发布动态：发布类型、素材、话题、挑战与发布打卡操作区，仅作静态视觉展示', [['clear-publish-back', 'parent-community', '返回家长社区']], '548/1028'); }
  function dynamicDetail() { return clearReference('dynamic-detail-reference-524x1022.png', '动态详情：内容、图片、评论、顾问回复与互动操作区，仅作静态视觉展示', [['clear-dynamic-back', 'parent-community', '返回家长社区']], '524/1022'); }
  function myCommunity() { return clearReference('my-community-reference-560x1030.png', '我的社区：资料、动态、挑战与社区等级，仅作静态视觉展示', [['clear-my-community-back', 'parent-community', '返回家长社区']], '560/1030'); }
  function growthOutcomes() { return clearReference('growth-outcomes-reference-522x1110.png', '成长成果：本周成长数据、荣誉勋章、成果案例对比与成长海报入口，仅作静态视觉展示', [['clear-outcomes-poster', 'growth-poster', '生成成长海报']], '522/1110'); }
  function annualMemberMine() { return clearReference('annual-member-mine-reference-532x994.png', '我的年度会员服务：成长积分、家庭等级、累计服务、邀请奖励、快捷入口和服务进度', [['clear-annual-services', 'llm-my-services', '查看我的服务']], '532/994'); }
  function myServices() { return clearReference('my-services-reference-532x1000.png', '我的服务：90天成长计划、任务进度、服务入口和继续打卡，仅作静态视觉展示', [['clear-services-profile', 'family-profile', '查看家庭档案']], '532/1000'); }
  function ordersAssets() { return clearReference('orders-assets-reference-552x1010.png', '订单与资产：订单、优惠券、积分、奖励与权益中心', [['clear-orders-mine', 'commerce-load-customer-assets', '查看订单与资产']], '552/1010'); }
  function familyProfile() { return clearReference('family-profile-reference-542x1002.png', '家庭档案：孩子资料、关注问题、诊断方案、记录与时间线，仅作静态视觉展示', [['clear-profile-services', 'my-services', '查看服务']], '542/1002'); }
  function serviceRecords() { return clearReference('service-records-reference-566x1008.png', '服务记录：咨询、活动和客服支持，仅作静态视觉展示', [['clear-records-mine', 'service-mine', '我的预约和活动']], '566/1008'); }
  function render() { const views = { home, assessment, report, task:taskPage, child, ranking, poster, plan, mall, product, invite, group, points, mine, member, 'core-report':coreReport, 'core-plan':corePlan, 'core-community':coreCommunity, 'core-mine':coreMine, 'growth-assessment':growthAssessment, 'growth-report':growthReport, 'growth-daily-task':growthDailyTask, 'growth-child':growthChild, 'growth-ranking':growthRanking, 'growth-poster':growthPoster, 'commerce-mall':commerceMall, 'commerce-product':commerceProduct, 'commerce-invite':commerceInvite, 'commerce-group':commerceGroup, 'commerce-points':commercePoints, 'commerce-mine':commerceMine, 'teacher-zone':teacherZone, 'teacher-detail':teacherDetail, 'consultation-booking':consultationBooking, 'salon-list':salonList, 'activity-detail':activityDetail, 'service-mine':serviceMine, 'parent-community':parentCommunity, 'publish-dynamic':publishDynamic, 'dynamic-detail':dynamicDetail, 'my-community':myCommunity, 'growth-outcomes':growthOutcomes, 'annual-member-mine':annualMemberMine, 'my-services':myServices, 'orders-assets':ordersAssets, 'family-profile':familyProfile, 'service-records':serviceRecords }; root.innerHTML = `${(views[page] || home)()}<p class="by-assistive-status" aria-live="polite">${llmTextEquivalent}</p>`; bind(); }
  function bind() { root.querySelectorAll('[data-by]').forEach(el => el.addEventListener('click', async () => { const a = el.dataset.by; if (a in serviceBookingActionRoutes) { root.setAttribute('aria-busy', 'true'); const route = serviceBookingActionRoutes[a]; await requestServiceBooking(a); root.removeAttribute('aria-busy'); page = route.nextPage; render(); return; } if (a in commerceActionRoutes) { root.setAttribute('aria-busy', 'true'); const route = commerceActionRoutes[a]; await requestCommerceIntent(a); root.removeAttribute('aria-busy'); page = route.nextPage; render(); return; } if (a in llmActionRoutes) { const [pageId, nextPage] = llmActionRoutes[a]; root.setAttribute('aria-busy', 'true'); await requestPageExplanation(pageId); root.removeAttribute('aria-busy'); page = nextPage; render(); return; } if (a === 'back') { page = 'home'; } else if (a === 'assessment-form') { page = 'report'; } else if (a.startsWith('check-')) { checked[Number(a.slice(6))] = !checked[Number(a.slice(6))]; } else if (a === 'home' || a in { assessment:1, report:1, task:1, child:1, ranking:1, poster:1, plan:1, mall:1, product:1, invite:1, group:1, points:1, mine:1, member:1, 'core-report':1, 'core-plan':1, 'core-community':1, 'core-mine':1, 'growth-assessment':1, 'growth-report':1, 'growth-daily-task':1, 'growth-child':1, 'growth-ranking':1, 'growth-poster':1, 'commerce-mall':1, 'commerce-product':1, 'commerce-invite':1, 'commerce-group':1, 'commerce-points':1, 'commerce-mine':1, 'teacher-zone':1, 'teacher-detail':1, 'consultation-booking':1, 'salon-list':1, 'activity-detail':1, 'service-mine':1, 'parent-community':1, 'publish-dynamic':1, 'dynamic-detail':1, 'my-community':1, 'growth-outcomes':1, 'annual-member-mine':1, 'my-services':1, 'orders-assets':1, 'family-profile':1, 'service-records':1 }) { page = a; } render(); })); }
  render();
  return {
    navigate: (nextPage) => {
      page = FAMILY_UI_34_ROUTE_SET.has(nextPage) ? nextPage : 'home';
      render();
    },
  };
}
