/**
 * MM1-B1.1 · SpeechStyle Fallback tests (§14)
 */
import { describe, it, expect } from 'vitest';
import { resolveStyleWithFallback, isStyleSupported } from './speechStyleFallback';

describe('mm1-b1.1 · speechStyleFallback (§14)', () => {
  it('STYLE-FB-01 · style 支持 → express-as 保留, STYLE_FALLBACK_USED=NO', () => {
    const r = resolveStyleWithFallback({
      voice_id: 'zh-CN-XiaoxiaoNeural',
      supportedStyles: ['gentle', 'cheerful'],
      family_style: 'CALM_WARM', // → gentle
      pace: 'MEDIUM',
      text: '你好',
    });
    expect(r.telemetry.STYLE_FALLBACK_USED).toBe('NO');
    expect(r.azure_style).toBe('gentle');
    expect(r.ssml).toContain('mstts:express-as style="gentle"');
    expect(r.ssml).toContain('<voice name="zh-CN-XiaoxiaoNeural">');
  });

  it('STYLE-FB-02 · style 不支持 → 无 express-as, 只保留 prosody rate; STYLE_FALLBACK_USED=YES', () => {
    const r = resolveStyleWithFallback({
      voice_id: 'zh-CN-XiaochenNeural',
      supportedStyles: ['general'],
      family_style: 'CALM_SERIOUS', // → serious, 不支持
      pace: 'SLOW',
      text: '请注意',
    });
    expect(r.telemetry.STYLE_FALLBACK_USED).toBe('YES');
    expect(r.azure_style).toBeNull();
    expect(r.ssml).not.toContain('mstts:express-as');
    expect(r.ssml).toContain('<prosody rate="-10%">');
  });

  it('STYLE-FB-03 · supportedStyles 空 → 保守 downgrade', () => {
    const r = resolveStyleWithFallback({
      voice_id: 'zh-CN-XiaohanNeural',
      supportedStyles: [],
      family_style: 'CALM_WARM',
      pace: 'MEDIUM',
      text: '暖一点',
    });
    expect(r.style_fallback_used).toBe(true);
    expect(r.ssml).not.toContain('mstts:express-as');
  });

  it('STYLE-FB-04 · 5 种 SpeechStyle 都不会 throw', () => {
    const styles = ['CALM_WARM', 'CALM_CAUTIOUS', 'CALM_SERIOUS', 'GENTLE_ENCOURAGING', 'WARM_FIRM'] as const;
    for (const s of styles) {
      const r = resolveStyleWithFallback({
        voice_id: 'zh-CN-XiaoxiaoNeural',
        supportedStyles: undefined,
        family_style: s,
        pace: 'MEDIUM',
        text: '一句话',
      });
      expect(r.ssml.length).toBeGreaterThan(0);
      expect(r.telemetry.STYLE_FALLBACK_USED).toBe('YES');
    }
  });

  it('STYLE-FB-05 · text 中的 XML 字符必须转义', () => {
    const r = resolveStyleWithFallback({
      voice_id: 'zh-CN-XiaoxiaoNeural',
      supportedStyles: ['gentle'],
      family_style: 'CALM_WARM',
      pace: 'MEDIUM',
      text: '<script>&"\'',
    });
    expect(r.ssml).toContain('&lt;script&gt;&amp;&quot;&apos;');
  });

  it('STYLE-FB-06 · pausesMs 生成 <break>', () => {
    const r = resolveStyleWithFallback({
      voice_id: 'zh-CN-XiaoxiaoNeural',
      supportedStyles: ['gentle'],
      family_style: 'CALM_WARM',
      pace: 'MEDIUM',
      text: '嗯',
      pausesMs: [200, 400],
    });
    expect(r.ssml).toContain('<break time="200ms"/>');
    expect(r.ssml).toContain('<break time="400ms"/>');
  });

  it('STYLE-FB-07 · isStyleSupported 大小写不敏感', () => {
    expect(isStyleSupported('Gentle', ['gentle'])).toBe(true);
    expect(isStyleSupported('serious', ['SERIOUS'])).toBe(true);
    expect(isStyleSupported('cheerful', ['gentle'])).toBe(false);
    expect(isStyleSupported('gentle', undefined)).toBe(false);
  });
});
