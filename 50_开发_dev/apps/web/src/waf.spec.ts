import { describe, expect, it } from 'vitest';
import { createWafCommunityApp } from './waf.js';

describe('WAF-001A community challenge prototype', () => {
  it('renders WAF home as an action community slice, not a social feed', () => {
    const root = document.createElement('main');

    createWafCommunityApp(root, { now: () => '2026-08-10T00:00:00.000Z' });

    expect(root.textContent).toContain('We are 伐木累');
    expect(root.textContent).toContain('大家正在面对');
    expect(root.textContent).toContain('问法咪莉校长');
    expect(root.textContent).toContain('7 天先听后回应');
    expect(root.textContent).toContain('社区参与单独授权');
    expect(root.textContent).toContain('孩子成长画像不公开');
    expect(root.textContent).toContain('故事发布需单独同意');
    expect(root.querySelector<HTMLAnchorElement>('a[href="./"]')?.textContent).toContain('Family');
    expect(root.querySelector('.waf-initial-entry')).not.toBeNull();
    expect(root.querySelectorAll('.waf-motion-path span')).toHaveLength(3);
    expect(root.textContent).toContain('共同练习台');
    expect(root.querySelector('[aria-label="今天家里的关系天气"]')).not.toBeNull();
    expect(root.textContent).toContain('播放语音引导');
    expect(root.textContent).toContain('不会自动播放，不使用麦克风');
    expect(root.querySelector('.waf-listening-scene')).not.toBeNull();
    expect(root.textContent).not.toContain('关注');
    expect(root.textContent).not.toContain('私信');
    expect(root.textContent).toContain('没有家庭排名');
    expect(root.querySelector('[data-waf-rank]')).toBeNull();
    expect(root.textContent).not.toContain('家庭总分');
  });

  it('keeps challenge participation in local WAF state before any Family Timeline write', () => {
    const root = document.createElement('main');
    const state = createWafCommunityApp(root, { now: () => '2026-08-10T00:00:00.000Z' });

    root.querySelector<HTMLButtonElement>('button[data-waf-join]')?.click();
    root.querySelector<HTMLButtonElement>('button[data-waf-accept]')?.click();
    root.querySelector<HTMLButtonElement>('button[data-waf-checkin]')?.click();

    expect(state.challengeJoined).toBe(true);
    expect(state.actionAccepted).toBe(true);
    expect(state.checkinSubmitted).toBe(true);
    expect(root.querySelector('.waf-complete')).not.toBeNull();
    expect(root.querySelector<HTMLElement>('.waf-progress-orbit')?.style.getPropertyValue('--waf-progress-angle')).toBe('360deg');
    expect(root.textContent).toContain('同步到 Family 成长记录前，我们会再次向你确认。');
    expect(state.productEvents.map((event) => event.name)).toEqual([
      'waf_home_viewed',
      'waf_challenge_viewed',
      'waf_challenge_joined',
      'waf_action_prompt_viewed',
      'waf_action_accepted',
      'waf_checkin_started',
      'waf_checkin_submitted',
    ]);
  });

  it('emits WAF product events for topic, principal, story, and publication consent entry', () => {
    const root = document.createElement('main');
    const state = createWafCommunityApp(root, { now: () => '2026-08-10T00:00:00.000Z' });

    root.querySelector<HTMLButtonElement>('button[data-waf-topic="phone-conflict"]')?.click();
    root.querySelector<HTMLButtonElement>('button[data-waf-principal]')?.click();
    root.querySelector<HTMLButtonElement>('button[data-waf-story]')?.click();
    root.querySelector<HTMLButtonElement>('button[data-waf-publication]')?.click();

    expect(root.textContent).toContain('手机冲突');
    expect(state.productEvents.map((event) => event.name)).toContain('waf_topic_opened');
    expect(state.productEvents.map((event) => event.name)).toContain('waf_principal_entry_clicked');
    expect(state.productEvents.map((event) => event.name)).toContain('waf_story_viewed');
    expect(state.productEvents.map((event) => event.name)).toContain('waf_story_publication_opt_in_clicked');
    expect(root.textContent).toContain('发布家庭故事需要单独确认');
  });

  it('adapts the listening practice to family readiness and keeps audio opt-in', () => {
    const root = document.createElement('main');
    let spokenText = '';
    let cancelled = 0;
    const state = createWafCommunityApp(root, {
      now: () => '2026-08-11T00:00:00.000Z',
      speak: (text) => {
        spokenText = text;
        return true;
      },
      cancelSpeech: () => {
        cancelled += 1;
      },
    });

    expect(spokenText).toBe('');
    root.querySelector<HTMLButtonElement>('button[data-waf-weather="PAUSE"]')?.click();

    expect(state.familyWeather).toBe('PAUSE');
    expect(root.textContent).toContain('尊重暂停，也保持连接');
    expect(root.textContent).toContain('暂停不是失败');

    root.querySelector<HTMLButtonElement>('button[data-waf-audio]')?.click();
    expect(state.guidePlaying).toBe(true);
    expect(spokenText).toContain('现在不想说，也是一个可以被尊重的答案');
    expect(root.querySelector<HTMLButtonElement>('button[data-waf-audio]')?.getAttribute('aria-pressed')).toBe('true');

    root.querySelector<HTMLButtonElement>('button[data-waf-audio]')?.click();
    expect(state.guidePlaying).toBe(false);
    expect(cancelled).toBe(1);
    expect(state.productEvents.map((event) => event.name)).toEqual(expect.arrayContaining([
      'waf_family_weather_selected',
      'waf_guided_practice_started',
      'waf_guided_practice_stopped',
    ]));
  });

  it('falls back to a readable transcript when speech playback is unavailable', () => {
    const root = document.createElement('main');
    const state = createWafCommunityApp(root, {
      now: () => '2026-08-11T00:00:00.000Z',
      speak: () => false,
    });

    root.querySelector<HTMLButtonElement>('button[data-waf-audio]')?.click();

    expect(state.guidePlaying).toBe(false);
    expect(root.textContent).toContain('当前浏览器暂不支持语音播放');
    expect(root.textContent).toContain('阅读完整引导词');
    expect(state.productEvents.map((event) => event.name)).toContain('waf_guided_practice_unavailable');
  });

  it('returns the UI to an offline practice state when spoken guidance ends', () => {
    const root = document.createElement('main');
    let finishSpeech = () => {};
    const state = createWafCommunityApp(root, {
      now: () => '2026-08-11T00:00:00.000Z',
      speak: (_text, onComplete) => {
        finishSpeech = onComplete;
        return true;
      },
    });

    root.querySelector<HTMLButtonElement>('button[data-waf-audio]')?.click();
    expect(state.guidePlaying).toBe(true);

    finishSpeech();

    expect(state.guidePlaying).toBe(false);
    expect(root.textContent).toContain('把这一分钟留给彼此');
    expect(state.productEvents.map((event) => event.name)).toContain('waf_guided_practice_completed');
  });
});
