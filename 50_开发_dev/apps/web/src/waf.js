/**
 * @typedef {'waf_home_viewed' | 'waf_topic_opened' | 'waf_principal_entry_clicked' | 'waf_challenge_viewed' | 'waf_challenge_joined' | 'waf_action_prompt_viewed' | 'waf_action_accepted' | 'waf_checkin_started' | 'waf_checkin_submitted' | 'waf_story_viewed' | 'waf_story_publication_opt_in_clicked'} WafProductEventName
 */

/** @typedef {{ name: WafProductEventName, at: string }} WafProductEvent */

/**
 * @typedef {object} WafCommunityState
 * @property {string} selectedTopic
 * @property {boolean} challengeViewed
 * @property {boolean} challengeJoined
 * @property {boolean} actionAccepted
 * @property {boolean} checkinStarted
 * @property {boolean} checkinSubmitted
 * @property {boolean} storyViewed
 * @property {string} notice
 * @property {WafProductEvent[]} productEvents
 */

/**
 * @typedef {object} WafAppOptions
 * @property {() => string} [now]
 */

const topics = [
  { id: 'teen-communication', label: '青春期', title: '青春期亲子沟通', note: '先确认孩子是否感觉被听见，再讨论规则。' },
  { id: 'phone-conflict', label: '手机', title: '手机冲突', note: '把争夺屏幕时间，改成一起约定可执行的边界。' },
  { id: 'homework-friction', label: '作业', title: '作业拉扯', note: '先分清卡住的是能力、情绪，还是关系。' },
  { id: 'emotion-reply', label: '顶嘴', title: '顶嘴与情绪', note: '先听完一句，再回应一句，不急着纠正态度。' },
];

const selectedStories = [
  { label: '一次少了火药味的晚饭', note: '匿名家庭 A · 先把追问改成复述，晚饭后少了一次争执。' },
  { label: '没完成，也值得被记录', note: '匿名家庭 B · 第 3 天没有完成行动，但一家人完成了复盘。' },
];

/** @returns {WafCommunityState} */
export function createWafInitialState() {
  return {
    selectedTopic: topics[0].id,
    challengeViewed: false,
    challengeJoined: false,
    actionAccepted: false,
    checkinStarted: false,
    checkinSubmitted: false,
    storyViewed: false,
    notice: '',
    productEvents: [],
  };
}

/**
 * @param {HTMLElement} root
 * @param {WafAppOptions} [options]
 * @returns {WafCommunityState}
 */
export function createWafCommunityApp(root, options = {}) {
  const state = createWafInitialState();
  const now = options.now ?? (() => new Date().toISOString());

  /** @param {WafProductEventName} name */
  const emit = (name) => {
    state.productEvents.push({ name, at: now() });
  };

  const render = () => {
    const topic = topics.find((item) => item.id === state.selectedTopic) ?? topics[0];
    const completedSteps = [state.challengeJoined, state.actionAccepted, state.checkinSubmitted].filter(Boolean).length;
    const isInitialRender = state.productEvents.length === 1 && state.productEvents[0]?.name === 'waf_home_viewed';

    root.innerHTML = `
      <section class="waf-shell ${isInitialRender ? 'waf-initial-entry' : ''} ${state.checkinSubmitted ? 'waf-complete' : ''}" aria-labelledby="waf-home-title">
        <nav class="waf-nav" aria-label="产品导航">
          <a class="waf-brand" href="./" aria-label="返回 Family 家庭空间">
            <span class="waf-brand-mark" aria-hidden="true">F</span>
            <span><strong>Family</strong><small>家庭成长陪伴</small></span>
          </a>
          <div class="waf-nav-links">
            <a href="./">Family 空间</a>
            <a class="active" href="?product=waf" aria-current="page">We are 伐木累</a>
          </div>
          <span class="waf-private-chip"><span aria-hidden="true">●</span> 家庭隐私受保护</span>
        </nav>

        <header class="waf-hero">
          <div class="waf-hero-copy">
            <p class="eyebrow">家庭共同成长社区</p>
            <h1 id="waf-home-title">不只是住在一起，<br><span>而是一起成长。</span></h1>
            <p class="waf-lead">从一个真实的小困扰出发，和家人完成一件今天就能做到的小事。</p>
            <div class="waf-hero-actions">
              <a class="primary-action waf-primary-link" href="#waf-today">看看今天的挑战</a>
              <button type="button" class="waf-text-action" data-waf-principal>问法咪莉校长 <span aria-hidden="true">→</span></button>
            </div>
            <ul class="waf-trust-list" aria-label="隐私承诺">
              <li>社区参与单独授权</li>
              <li>孩子成长画像不公开</li>
            </ul>
          </div>
          <div class="waf-hero-art" role="img" aria-label="一家人围坐倾听、共同成长的温暖场景">
            <div class="waf-motion-path" aria-hidden="true"><span></span><span></span><span></span></div>
            <p>“先听见彼此，<br>再一起向前。”</p>
          </div>
        </header>

        ${state.notice ? `<p class="waf-notice" role="status"><span aria-hidden="true">✓</span>${state.notice}</p>` : ''}

        <main class="waf-content">
          <section class="waf-panel waf-challenge-panel" id="waf-today" aria-labelledby="waf-challenge-title">
            <div class="waf-challenge-copy">
              <div class="waf-section-heading">
                <p class="eyebrow">今天我们一起做</p>
                <span class="waf-day-badge">第 1 天</span>
              </div>
              <h2 id="waf-challenge-title">7 天先听后回应</h2>
              <p>不要求立刻改变孩子。今天只练习一件事：当对方说完后，先用一句话复述你听见了什么。</p>
              <div class="waf-practice-card">
                <span aria-hidden="true">今</span>
                <div><small>今日行动 · 约 5 分钟</small><strong>先复述，再表达自己的想法</strong></div>
              </div>
              <div class="waf-actions">
                <button type="button" class="primary-action" data-waf-join>${state.challengeJoined ? '已加入挑战' : '和家人一起参加'}</button>
                <button type="button" class="secondary-action" data-waf-accept ${state.challengeJoined ? '' : 'disabled'}>${state.actionAccepted ? '已接受今日行动' : '接受今日行动'}</button>
                <button type="button" class="secondary-action" data-waf-checkin ${state.actionAccepted ? '' : 'disabled'}>${state.checkinSubmitted ? '今天完成了' : '完成后打卡'}</button>
              </div>
            </div>
            <div class="waf-progress" aria-label="挑战进度">
              <div class="waf-progress-orbit" style="--waf-progress-angle: ${completedSteps * 120}deg">
                <span class="waf-progress-count">${completedSteps}<small>/ 3</small></span>
              </div>
              <p>今天的同行进度</p>
              <ol class="waf-steps">
                <li class="${state.challengeJoined ? 'done' : ''}"><span>1</span>加入挑战</li>
                <li class="${state.actionAccepted ? 'done' : ''}"><span>2</span>接受行动</li>
                <li class="${state.checkinSubmitted ? 'done' : ''}"><span>3</span>完成打卡</li>
              </ol>
              <p class="privacy-note">这次参与只保留在本页；同步到 Family 成长记录前，我们会再次向你确认。</p>
            </div>
          </section>

          <section class="waf-panel waf-topic-panel" aria-labelledby="waf-topic-title">
            <p class="eyebrow">大家正在面对</p>
            <h2 id="waf-topic-title">从你家最近的小困扰开始</h2>
            <div class="waf-topic-list" role="list" aria-label="家庭议题">
              ${topics.map((item) => `
                <button type="button" class="waf-topic-chip ${item.id === state.selectedTopic ? 'active' : ''}" data-waf-topic="${item.id}">
                  ${item.label}
                </button>
              `).join('')}
            </div>
            <article class="waf-topic-card">
              <small>法咪莉校长的一个提醒</small>
              <h3>${topic.title}</h3>
              <p>${topic.note}</p>
              <button type="button" class="waf-text-action" data-waf-principal>继续问问法咪莉 <span aria-hidden="true">→</span></button>
            </article>
          </section>

          <section class="waf-panel waf-family-panel" aria-labelledby="waf-family-title">
            <p class="eyebrow">我的家庭</p>
            <h2 id="waf-family-title">每一步都算数</h2>
            <p class="waf-panel-intro">不比较，不排名。只看我们今天是否比昨天多理解彼此一点。</p>
            <dl class="waf-status-list">
              <div><dt>一起参加</dt><dd>${state.challengeJoined ? '已经开始' : '等待家人'}</dd></div>
              <div><dt>今日行动</dt><dd>${state.actionAccepted ? '已经确认' : '还未确认'}</dd></div>
              <div><dt>温柔打卡</dt><dd>${state.checkinSubmitted ? '今天完成' : '随时可以'}</dd></div>
            </dl>
            <a class="waf-family-link" href="./">回到 Family 家庭空间 <span aria-hidden="true">→</span></a>
          </section>

          <section class="waf-panel waf-story-panel" aria-labelledby="waf-story-title">
            <div class="waf-section-heading">
              <div><p class="eyebrow">家庭故事</p><h2 id="waf-story-title">真实，但不暴露谁</h2></div>
              <span class="waf-anonymous-badge">已匿名</span>
            </div>
            <div class="waf-story-list">
              ${selectedStories.map((story) => `
                <article><span aria-hidden="true">“</span><div><h3>${story.label}</h3><p>${story.note}</p></div></article>
              `).join('')}
            </div>
            <div class="waf-story-actions">
              <button type="button" class="waf-text-action" data-waf-story>故事如何保护隐私</button>
              <button type="button" class="waf-text-action" data-waf-publication>了解发布同意</button>
            </div>
          </section>
        </main>

        <footer class="waf-footer">
          <strong>We are 伐木累</strong>
          <span>让每个家庭，在自己的节奏里一起成长。</span>
          <ul><li>没有家庭排名</li><li>故事发布需单独同意</li><li>成长记录由你确认</li></ul>
        </footer>
      </section>
    `;

    root.querySelectorAll('button[data-waf-topic]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedTopic = button.getAttribute('data-waf-topic') ?? topics[0].id;
        state.notice = '';
        emit('waf_topic_opened');
        render();
      });
    });

    root.querySelectorAll('button[data-waf-principal]').forEach((button) => {
      button.addEventListener('click', () => {
        state.notice = '法咪莉校长入口已为 WF1 保留；正式咨询会在单独授权后开启。';
        emit('waf_principal_entry_clicked');
        render();
      });
    });

    root.querySelector('button[data-waf-join]')?.addEventListener('click', () => {
      state.challengeViewed = true;
      state.challengeJoined = true;
      state.notice = '欢迎加入。先和家人约定一个都舒服的练习时间吧。';
      emit('waf_challenge_viewed');
      emit('waf_challenge_joined');
      render();
    });

    root.querySelector('button[data-waf-accept]')?.addEventListener('click', () => {
      if (!state.challengeJoined) return;
      state.actionAccepted = true;
      state.notice = '今日行动已确认：先复述，再表达自己的想法。';
      emit('waf_action_prompt_viewed');
      emit('waf_action_accepted');
      render();
    });

    root.querySelector('button[data-waf-checkin]')?.addEventListener('click', () => {
      if (!state.actionAccepted) return;
      state.checkinStarted = true;
      state.checkinSubmitted = true;
      state.notice = '今天的练习完成了。做得不完美，也依然值得被看见。';
      emit('waf_checkin_started');
      emit('waf_checkin_submitted');
      render();
    });

    root.querySelector('button[data-waf-story]')?.addEventListener('click', () => {
      state.storyViewed = true;
      state.notice = '故事只展示获得同意后的匿名片段，不公开孩子画像，也不用于家庭排名。';
      emit('waf_story_viewed');
      render();
    });

    root.querySelector('button[data-waf-publication]')?.addEventListener('click', () => {
      state.notice = '发布家庭故事需要单独确认；不同意不会影响任何家庭功能。';
      emit('waf_story_publication_opt_in_clicked');
      render();
    });
  };

  emit('waf_home_viewed');
  render();
  return state;
}
