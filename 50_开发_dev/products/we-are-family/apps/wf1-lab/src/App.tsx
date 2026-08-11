import { useState } from 'react';
import type { CommunityCheckInResult, ProductEvent, WafProductEventName } from '@family/waf-contracts';
import { featuredChallenge, stories, topics } from './waf-data';
import './styles.css';

type Screen = 'home' | 'topic' | 'challenge' | 'today' | 'participation';

interface ParticipationState {
  joined: boolean;
  actionAccepted: boolean;
  checkins: CommunityCheckInResult[];
  currentDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

const initialParticipation: ParticipationState = {
  joined: false,
  actionAccepted: false,
  checkins: ['COMPLETED', 'PARTIAL'],
  currentDay: 3,
};

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [topicSlug, setTopicSlug] = useState(topics[0].slug);
  const [participation, setParticipation] = useState(initialParticipation);
  const [events, setEvents] = useState<ProductEvent[]>([
    createEvent('waf_home_viewed', 'WAF_HOME'),
  ]);

  const selectedTopic = topics.find((topic) => topic.slug === topicSlug) ?? topics[0];
  const today = featuredChallenge.days[participation.currentDay - 1];

  function track(name: WafProductEventName, sourceSurface: ProductEvent['sourceSurface']) {
    setEvents((current) => [...current, createEvent(name, sourceSurface, selectedTopic.id, participation.currentDay)]);
  }

  function openTopic(slug: string) {
    setTopicSlug(slug);
    setScreen('topic');
    track('waf_topic_opened', 'WAF_TOPIC');
  }

  function joinChallenge() {
    setParticipation((current) => ({ ...current, joined: true }));
    track('waf_challenge_joined', 'WAF_CHALLENGE');
  }

  function acceptAction() {
    setParticipation((current) => ({ ...current, actionAccepted: true }));
    track('waf_action_accepted', 'WAF_TODAY');
  }

  function submitCheckin(result: CommunityCheckInResult) {
    setParticipation((current) => ({ ...current, checkins: [...current.checkins, result] }));
    track('waf_checkin_submitted', 'WAF_TODAY');
  }

  return (
    <main className="family-shell waf-integrated-shell">
      <header className="app-header" aria-label="Family header">
        <div className="brand" aria-label="Family 家庭成长陪伴">
          <div className="brand-mark">F</div>
          <div className="brand-name">
            Family
            <small>家庭成长陪伴</small>
          </div>
        </div>
        <div className="header-meta">
          <div className="privacy-chip"><span>●</span> 共享家庭账户</div>
          <div className="avatar" aria-label="监护人账户">家</div>
        </div>
      </header>

      <section className="topbar waf-topbar" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">We are 伐木累</p>
          <h1 id="home-title">We are 伐木累</h1>
          <p className="hero-lead">选择一个家庭议题，加入 7 天行动，晚上回来记录今天是否完成。</p>
          <div className="hero-meta" aria-label="WAF 边界">
            <span className="slice-badge">家庭行动</span>
            <span className="gentle-badge">不写入成长档案</span>
          </div>
        </div>
        <div className="waf-hero-card" aria-label="记录范围">
          <strong>当前记录范围</strong>
          <span>只记录本页操作；保存到成长档案前需要再次确认。</span>
        </div>
      </section>

      <section className="workspace" aria-label="WAF community workspace">
        <aside className="family-panel waf-family-panel" aria-label="家庭上下文">
          <p className="eyebrow">WAF 社区行动</p>
          <h2>行动社区</h2>
          <div className="stage-card">
            <span className="stage-icon">行</span>
            <div>
              <small>当前社区挑战</small>
              <strong>7天先听后回应</strong>
            </div>
          </div>
          <nav className="journey-nav" aria-label="WF1 screens">
            <ol>
              {[
                ['home', 'W01 发现', '主题与故事'],
                ['topic', 'W02 主题', '看见共同问题'],
                ['challenge', 'W03 挑战', '加入行动挑战'],
                ['today', 'W04 今日', '接受今晚行动'],
                ['participation', 'W05 我的参与', '查看社区进度'],
              ].map(([id, label, description], index) => (
                <li key={id} className={screen === id ? 'active' : ''}>
                  <span>{index + 1}</span>
                  <button type="button" aria-label={label} onClick={() => setScreen(id as Screen)}>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <p className="privacy-note">◇ 当前只记录本页操作：{events.length}。不会自动写入成长档案。</p>
        </aside>

        <div className="flow-panel">
        {screen === 'home' && (
          <section aria-labelledby="community-entry-title" className="onboarding-panel waf-community-entry">
            <div className="panel-heading">
              <div>
                <p className="eyebrow"><span className="step-number">01</span> WAF 社区发现</p>
                <h2 id="community-entry-title">选择今天的议题</h2>
                <p className="section-description">先选择议题，再决定是否加入今天的家庭行动。</p>
              </div>
              <span className="status-pill" data-status="started">可体验</span>
            </div>
            <div className="waf-topic-block">
              <h3>今天大家都在聊</h3>
              <div className="topic-row" aria-label="今天大家都在聊">
                {topics.map((topic) => (
                  <button key={topic.id} onClick={() => openTopic(topic.slug)}>{topic.title}</button>
                ))}
              </div>
            </div>
            <section className="summary-item principal-card" aria-label="Famili Principal entry">
              <h2>有件事不知道怎么开口？</h2>
              <p>把问题带给法咪莉校长，只传最小上下文。</p>
              <button onClick={() => track('waf_principal_entry_clicked', 'WAF_HOME')}>问法咪莉校长</button>
              <small>只传 topic_id / challenge_id / source_surface。</small>
            </section>
            <div className="summary-list waf-home-grid">
            <ChallengeCard joined={participation.joined} onJoin={joinChallenge} onOpen={() => { setScreen('challenge'); track('waf_challenge_viewed', 'WAF_CHALLENGE'); }} />
            <ParticipationCard participation={participation} onContinue={() => setScreen('today')} />
            </div>
            <StoryList onView={() => track('waf_story_viewed', 'WAF_HOME')} />
          </section>
        )}

        {screen === 'topic' && (
          <section aria-labelledby="topic-title" className="onboarding-panel content-panel">
            <p className="eyebrow">很多家庭都会卡在这里</p>
            <h1 id="topic-title">{selectedTopic.title}</h1>
            <p>{selectedTopic.familyFeels}</p>
            <h2>先别急着做什么</h2>
            <p>{selectedTopic.doNotRush}</p>
            <h2>法咪莉校长怎么看</h2>
            <p>{selectedTopic.principalPrompt}</p>
            <button onClick={() => track('waf_principal_entry_clicked', 'WAF_TOPIC')}>问法咪莉校长</button>
            <h2>今晚能做的一件事</h2>
            <p>加入「7天先听后回应」，今天先练：听完再回应。</p>
            <button onClick={() => setScreen('challenge')}>查看相关挑战</button>
          </section>
        )}

        {screen === 'challenge' && (
          <section aria-labelledby="challenge-title" className="onboarding-panel content-panel">
            <p className="eyebrow">CommunityChallenge != GrowthJourney</p>
            <h1 id="challenge-title">{featuredChallenge.title}</h1>
            <p>{featuredChallenge.description}</p>
            <ol className="day-list">
              {featuredChallenge.days.map((day) => (
                <li key={day.id}>DAY {day.dayNumber} {day.title}</li>
              ))}
            </ol>
            <button onClick={joinChallenge}>{participation.joined ? '已加入挑战' : '加入挑战'}</button>
          </section>
        )}

        {screen === 'today' && (
          <section aria-labelledby="today-title" className="onboarding-panel content-panel today-panel">
            <p className="eyebrow">DAY {today.dayNumber}</p>
            <h1 id="today-title">今天的一件事</h1>
            <p>{today.action}</p>
            <h2>今天不要</h2>
            <ul>{today.avoid.map((item) => <li key={item}>{item}</li>)}</ul>
            <button onClick={acceptAction}>{participation.actionAccepted ? '今晚试试：已接受' : '今晚试试'}</button>
            <button onClick={() => track('waf_principal_entry_clicked', 'WAF_TODAY')}>问法咪莉校长</button>
            <div className="checkin-row" aria-label="晚上回来">
              <button onClick={() => submitCheckin('COMPLETED')}>完成了</button>
              <button onClick={() => submitCheckin('PARTIAL')}>做了一部分</button>
              <button onClick={() => submitCheckin('NOT_DONE')}>今天没做</button>
            </div>
          </section>
        )}

        {screen === 'participation' && (
          <section aria-labelledby="participation-title" className="onboarding-panel content-panel">
            <p className="eyebrow">我的挑战</p>
            <h1 id="participation-title">{featuredChallenge.title}</h1>
            <p>Day {participation.currentDay} / 7</p>
            <ul className="progress-list">
              {featuredChallenge.days.map((day) => (
                <li key={day.id}>{participation.checkins[day.dayNumber - 1] ? '✓' : '○'} Day {day.dayNumber}</li>
              ))}
            </ul>
            <button>查看成长旅程 →</button>
            <h2>下一个建议</h2>
            <p>暂不推荐</p>
          </section>
        )}
        </div>
      </section>
    </main>
  );
}

function ChallengeCard(props: { joined: boolean; onJoin: () => void; onOpen: () => void }) {
  return (
    <section className="tile challenge-tile" aria-label="今天一起做">
      <p className="eyebrow">今天一起做</p>
      <h2>{featuredChallenge.title}</h2>
      <p>Day 1 今天只练：听完再回应。</p>
      <button onClick={props.onJoin}>{props.joined ? '已加入挑战' : '加入挑战'}</button>
      <button className="secondary" onClick={props.onOpen}>查看 7 天</button>
    </section>
  );
}

function ParticipationCard(props: { participation: ParticipationState; onContinue: () => void }) {
  return (
    <section className="tile" aria-label="我的Family">
      <p className="eyebrow">我的Family</p>
      <h2>第{props.participation.currentDay}天</h2>
      <p>完成 {props.participation.checkins.length}/{props.participation.currentDay} 个行动</p>
      <button onClick={props.onContinue}>继续</button>
    </section>
  );
}

function StoryList(props: { onView: () => void }) {
  return (
    <section className="tile story-tile" aria-label="真实家庭故事">
      <p className="eyebrow">真实家庭故事</p>
      {stories.map((story) => (
        <article key={story.id}>
          <h2>{story.title}</h2>
          <p>{story.anonymizedExcerpt}</p>
          <button onClick={props.onView}>查看故事</button>
        </article>
      ))}
      <small>运营精选 + 明确授权 + 匿名化 + 人工审核。</small>
    </section>
  );
}

function createEvent(
  name: WafProductEventName,
  sourceSurface: ProductEvent['sourceSurface'],
  topicId?: ProductEvent['topicId'],
  challengeDay?: number,
): ProductEvent {
  return {
    id: `${name}-${Date.now()}`,
    name,
    sourceSurface,
    occurredAt: new Date().toISOString(),
    topicId,
    challengeId: 'LISTEN_BEFORE_RESPOND_7D',
    challengeDay,
  };
}
