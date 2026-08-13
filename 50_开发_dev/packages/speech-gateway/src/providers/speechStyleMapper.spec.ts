/**
 * MM1-B1 · SpeechStyleMapper tests
 */
import { describe, expect, it } from 'vitest';
import type { SpeechPlan } from '@family/fpai-multimodal-contracts';
import {
  FAMILY_TO_AZURE_STYLE,
  FAMILY_TO_AZURE_RATE,
  deriveFamilySpeechStyle,
  buildAzureSsml,
} from './speechStyleMapper';

const basePlan = (tone: SpeechPlan['tone']): SpeechPlan => ({
  pace: 'MEDIUM',
  tone,
  pauses_ms: [],
  emphasis: [],
});

describe('mm1-b1 · SpeechStyleMapper', () => {
  it('SM-01 · 全部 5 类 SpeechPlan.tone → Family style 正常派生', () => {
    expect(deriveFamilySpeechStyle(basePlan('CALM_WARM'))).toBe('CALM_WARM');
    expect(deriveFamilySpeechStyle(basePlan('CALM_CAUTIOUS'))).toBe('CALM_CAUTIOUS');
    expect(deriveFamilySpeechStyle(basePlan('CALM_SERIOUS'))).toBe('CALM_SERIOUS');
    expect(deriveFamilySpeechStyle(basePlan('WARM_FIRM'))).toBe('WARM_FIRM');
    expect(deriveFamilySpeechStyle(basePlan('CLEAR_TEACHING'))).toBe('GENTLE_ENCOURAGING');
  });

  it('SM-02 · 未知 tone 兜底 CALM_WARM(不 throw)', () => {
    // 强制越界测试兜底逻辑
    const p = { ...basePlan('CALM_WARM'), tone: 'UNKNOWN_TONE' as unknown as SpeechPlan['tone'] };
    expect(deriveFamilySpeechStyle(p)).toBe('CALM_WARM');
  });

  it('SM-03 · FAMILY_TO_AZURE_STYLE 覆盖 5 类', () => {
    expect(FAMILY_TO_AZURE_STYLE.CALM_WARM).toBe('gentle');
    expect(FAMILY_TO_AZURE_STYLE.CALM_CAUTIOUS).toBe('calm');
    expect(FAMILY_TO_AZURE_STYLE.CALM_SERIOUS).toBe('serious');
    expect(FAMILY_TO_AZURE_STYLE.GENTLE_ENCOURAGING).toBe('affectionate');
    expect(FAMILY_TO_AZURE_STYLE.WARM_FIRM).toBe('assistant');
  });

  it('SM-04 · FAMILY_TO_AZURE_RATE 覆盖 3 档', () => {
    expect(FAMILY_TO_AZURE_RATE.SLOW).toBe('-10%');
    expect(FAMILY_TO_AZURE_RATE.MEDIUM).toBe('0%');
    expect(FAMILY_TO_AZURE_RATE.FAST).toBe('+8%');
  });

  it('SM-05 · buildAzureSsml 包含 voice / style / rate / text', () => {
    const ssml = buildAzureSsml({
      text: '你好世界',
      voice: 'zh-CN-XiaoxiaoNeural',
      style: 'CALM_WARM',
      pace: 'MEDIUM',
    });
    expect(ssml).toContain('zh-CN-XiaoxiaoNeural');
    expect(ssml).toContain('style="gentle"');
    expect(ssml).toContain('rate="0%"');
    expect(ssml).toContain('你好世界');
    expect(ssml).toMatch(/^<speak /);
    expect(ssml).toMatch(/<\/speak>$/);
  });

  it('SM-06 · buildAzureSsml 转义危险字符防止 SSML 注入', () => {
    const ssml = buildAzureSsml({
      text: '<script>alert("x")</script>',
      voice: 'v',
      style: 'CALM_WARM',
      pace: 'MEDIUM',
    });
    expect(ssml).not.toContain('<script>');
    expect(ssml).toContain('&lt;script&gt;');
    expect(ssml).toContain('&quot;');
  });

  it('SM-07 · pausesMs 输出 <break time="XXms"/>', () => {
    const ssml = buildAzureSsml({
      text: 'hi',
      voice: 'v',
      style: 'CALM_WARM',
      pace: 'FAST',
      pausesMs: [200, 500],
    });
    expect(ssml).toContain('<break time="200ms"/>');
    expect(ssml).toContain('<break time="500ms"/>');
    expect(ssml).toContain('rate="+8%"');
  });

  it('SM-08 · pausesMs 负值被 clamp 到 0', () => {
    const ssml = buildAzureSsml({
      text: 'hi',
      voice: 'v',
      style: 'CALM_WARM',
      pace: 'MEDIUM',
      pausesMs: [-100],
    });
    expect(ssml).toContain('<break time="0ms"/>');
  });

  it('SM-09 · SpeechPlan (WARM_FIRM) → SSML style="assistant"', () => {
    const ssml = buildAzureSsml({
      text: 't',
      voice: 'v',
      style: deriveFamilySpeechStyle(basePlan('WARM_FIRM')),
      pace: 'MEDIUM',
    });
    expect(ssml).toContain('style="assistant"');
  });
});
