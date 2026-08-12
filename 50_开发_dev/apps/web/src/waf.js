/**
 * @typedef {'waf_home_viewed' | 'waf_topic_opened' | 'waf_principal_entry_clicked' | 'waf_challenge_viewed' | 'waf_challenge_joined' | 'waf_action_prompt_viewed' | 'waf_action_accepted' | 'waf_checkin_started' | 'waf_checkin_submitted' | 'waf_story_viewed' | 'waf_story_publication_opt_in_clicked' | 'waf_family_weather_selected' | 'waf_guided_practice_started' | 'waf_guided_practice_stopped' | 'waf_guided_practice_completed' | 'waf_guided_practice_unavailable'} WafProductEventName
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
 * @property {'CALM' | 'TENSE' | 'PAUSE'} familyWeather
 * @property {boolean} guidePlaying
 * @property {string} notice
 * @property {WafProductEvent[]} productEvents
 */

/**
 * @typedef {object} WafAppOptions
 * @property {() => string} [now]
 * @property {(text: string, onComplete: () => void) => boolean} [speak]
 * @property {() => void} [cancelSpeech]
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

const familyWeatherOptions = [
  {
    id: 'CALM',
    symbol: '晴',
    label: '现在比较平静',
    duration: '约 5 分钟',
    title: '完成一个完整倾听回合',
    prompt: '一人说完一件小事，另一人先复述，再一起商量下一步。',
    script: '先把手机放到一边。请一位家人说一件今天在意的小事。另一位先不解释，也不纠正。等对方说完，用一句话回应：我听见你在意的是。最后问一句：我理解得对吗？',
  },
  {
    id: 'TENSE',
    symbol: '云',
    label: '有一点紧绷',
    duration: '约 2 分钟',
    title: '只做一句复述就够了',
    prompt: '先放慢语速，不讨论对错，只确认彼此刚才听见了什么。',
    script: '如果现在有一点紧绷，先一起慢慢呼一口气。今天不急着解决问题。请一位家人说一句感受，另一位只复述这一句。你可以说：我听见你现在有一点。停在这里，也算完成。',
  },
  {
    id: 'PAUSE',
    symbol: '歇',
    label: '暂时不想说',
    duration: '约 1 分钟',
    title: '尊重暂停，也保持连接',
    prompt: '不用立刻表达。一起约定一个更舒服的时间，再回来聊。',
    script: '现在不想说，也是一个可以被尊重的答案。请告诉彼此：我不是拒绝你，我只是需要一点时间。然后一起约定，什么时候再回来聊。到这里就可以结束今天的练习。',
  },
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
    familyWeather: 'CALM',
    guidePlaying: false,
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
  const speak = options.speak ?? ((text, onComplete) => {
    if (typeof window === 'undefined' || typeof window.SpeechSynthesisUtterance !== 'function' || !window.speechSynthesis) {
      return false;
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.88;
    utterance.pitch = 0.96;
    utterance.onend = onComplete;
    utterance.onerror = onComplete;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  });
  const cancelSpeech = options.cancelSpeech ?? (() => window.speechSynthesis?.cancel());

  /** @param {WafProductEventName} name */
  const emit = (name) => {
    state.productEvents.push({ name, at: now() });
  };

  const render = () => {
    const topic = topics.find((item) => item.id === state.selectedTopic) ?? topics[0];
    const completedSteps = [state.challengeJoined, state.actionAccepted, state.checkinSubmitted].filter(Boolean).length;
    const isInitialRender = state.productEvents.length === 1 && state.productEvents[0]?.name === 'waf_home_viewed';
    const familyWeather = familyWeatherOptions.find((item) => item.id === state.familyWeather) ?? familyWeatherOptions[0];

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

          <section class="waf-panel waf-studio-panel" aria-labelledby="waf-studio-title">
            <div class="waf-studio-heading">
              <div>
                <p class="eyebrow">共同练习台 · 多模态引导</p>
                <h2 id="waf-studio-title">先感受现在，再决定怎么聊</h2>
              </div>
              <p>不分析谁对谁错，也不要求立刻表达。先选择此刻最接近家里的状态。</p>
            </div>

            <div class="waf-weather-group" role="radiogroup" aria-label="今天家里的关系天气">
              ${familyWeatherOptions.map((item) => `
                <button type="button" role="radio" aria-checked="${item.id === state.familyWeather}" class="waf-weather-button ${item.id === state.familyWeather ? 'active' : ''}" data-waf-weather="${item.id}">
                  <span aria-hidden="true">${item.symbol}</span>
                  <span><strong>${item.label}</strong><small>${item.duration}</small></span>
                </button>
              `).join('')}
            </div>

            <div class="waf-studio-grid">
              <div class="waf-listening-scene" role="img" aria-label="家长和青少年平等坐在桌边进行双向倾听练习">
                <div class="waf-dialogue-loop" aria-hidden="true">
                  <span class="waf-dialogue-dot dot-one"></span>
                  <span class="waf-dialogue-dot dot-two"></span>
                  <span class="waf-dialogue-dot dot-three"></span>
                  <span class="waf-dialogue-line"></span>
                </div>
                <div class="waf-turn-card">
                  <small>${familyWeather.duration} · 此刻练习</small>
                  <strong>${familyWeather.title}</strong>
                  <p>${familyWeather.prompt}</p>
                </div>
              </div>

              <div class="waf-guide-card ${state.guidePlaying ? 'is-playing' : ''}">
                <div class="waf-guide-label"><span aria-hidden="true">声</span><p><small>可选语音引导</small><strong>先听 · 再复述 · 一起决定</strong></p></div>
                <ol class="waf-listening-turns" aria-label="倾听练习三个回合">
                  <li><span>1</span><div><strong>让对方说完</strong><small>不插话，也不急着给建议</small></div></li>
                  <li><span>2</span><div><strong>复述你听见的</strong><small>用“我听见你在意……”开头</small></div></li>
                  <li><span>3</span><div><strong>把选择权还回来</strong><small>问“你希望我怎么陪你？”</small></div></li>
                </ol>
                <div class="waf-audio-row">
                  <div class="waf-waveform" aria-hidden="true">${Array.from({ length: 14 }, (_, index) => `<i style="--bar:${index}"></i>`).join('')}</div>
                  <button type="button" class="waf-audio-button" data-waf-audio aria-pressed="${state.guidePlaying}">
                    <span aria-hidden="true">${state.guidePlaying ? 'Ⅱ' : '▶'}</span>
                    ${state.guidePlaying ? '暂停语音引导' : '播放语音引导'}
                  </button>
                </div>
                <details class="waf-transcript">
                  <summary>阅读完整引导词</summary>
                  <p>${familyWeather.script}</p>
                </details>
                <p class="waf-audio-boundary">不会自动播放，不使用麦克风，也不分析任何人的声音或情绪。</p>
              </div>
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

    root.querySelectorAll('button[data-waf-weather]').forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.getAttribute('data-waf-weather');
        if (!familyWeatherOptions.some((item) => item.id === value)) return;
        if (state.guidePlaying) cancelSpeech();
        state.familyWeather = /** @type {'CALM' | 'TENSE' | 'PAUSE'} */ (value);
        state.guidePlaying = false;
        state.notice = value === 'PAUSE'
          ? '已选择“暂时不想说”。暂停不是失败，约好稍后再聊就够了。'
          : '练习方式已按此刻的关系天气调整。';
        emit('waf_family_weather_selected');
        render();
      });
    });

    root.querySelector('button[data-waf-audio]')?.addEventListener('click', () => {
      if (state.guidePlaying) {
        cancelSpeech();
        state.guidePlaying = false;
        state.notice = '语音引导已暂停，你可以继续阅读引导词。';
        emit('waf_guided_practice_stopped');
        render();
        return;
      }

      state.guidePlaying = true;
      state.notice = '语音引导已开始。请把屏幕放到一边，把注意力留给彼此。';
      emit('waf_guided_practice_started');
      render();

      const playbackStarted = speak(familyWeather.script, () => {
        if (!state.guidePlaying) return;
        state.guidePlaying = false;
        state.notice = '语音引导结束了。接下来请放下屏幕，把这一分钟留给彼此。';
        emit('waf_guided_practice_completed');
        render();
      });

      if (!playbackStarted) {
        state.guidePlaying = false;
        state.notice = '当前浏览器暂不支持语音播放，你仍可以展开并阅读完整引导词。';
        emit('waf_guided_practice_unavailable');
        render();
      }
    });

    root.querySelectorAll('button[data-waf-principal]').forEach((button) => {
      button.addEventListener('click', () => {
        emit('waf_principal_entry_clicked');
        state.notice = '正在打开法咪莉校长陪练…';
        render();
        try { if (typeof window !== 'undefined') window.location.assign('?product=principal'); } catch { /* jsdom/test 环境忽略导航 */ }
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
