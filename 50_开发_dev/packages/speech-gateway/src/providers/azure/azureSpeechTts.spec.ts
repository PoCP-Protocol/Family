/**
 * MM1-B1 · Azure TTS Adapter tests (§10/§14/§17/§35)
 */
import { describe, expect, it } from 'vitest';
import {
  AzureSpeechTtsAdapter,
  type AzureRealtimeTtsTransport,
  type TtsProviderEvent,
} from './azureSpeechTts';
import { AZURE_CREDENTIAL_BLOCKER } from './secretReader';

function makeFakeTransport(): AzureRealtimeTtsTransport & {
  fire: (evt: TtsProviderEvent) => void;
  synths: Array<{ turnId: string; ssml: string }>;
  cancels: string[];
} {
  let cb: ((evt: TtsProviderEvent) => void) | null = null;
  const synths: Array<{ turnId: string; ssml: string }> = [];
  const cancels: string[] = [];
  return {
    synthesize({ turnId, ssml }) {
      synths.push({ turnId, ssml });
    },
    cancel(t) {
      cancels.push(t);
    },
    onProviderEvent(handler) {
      cb = handler;
    },
    fire(e) {
      cb?.(e);
    },
    synths,
    cancels,
  };
}

const OK_ENV = { FPAI_AZURE_SPEECH_KEY: 'k', FPAI_AZURE_SPEECH_REGION: 'eastasia' };

describe('mm1-b1 · AzureSpeechTtsAdapter', () => {
  it('AZ-TTS-01 · 缺 credential 时 synthesizeStream 立即 TTS_ERROR(BLOCKED)', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: {} });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));
    a.synthesizeStream('t1', '你好');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('TTS_ERROR');
    expect(events[0].text).toBe(AZURE_CREDENTIAL_BLOCKER);
    expect(transport.synths).toEqual([]);
  });

  it('AZ-TTS-02 · 有 credential 时 synthesizeStream 构造 SSML 交给 transport', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    a.synthesizeStream('t1', '你好世界');
    expect(transport.synths).toHaveLength(1);
    expect(transport.synths[0].turnId).toBe('t1');
    expect(transport.synths[0].ssml).toContain('你好世界');
    expect(transport.synths[0].ssml).toContain('zh-CN-XiaoxiaoNeural');
  });

  it('AZ-TTS-03 · voiceName 可通过 opts / env 覆盖', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({
      transport,
      env: { ...OK_ENV, FPAI_AZURE_TTS_VOICE: 'zh-CN-XiaochenNeural' },
    });
    a.synthesizeStream('t1', 'hi');
    expect(transport.synths[0].ssml).toContain('zh-CN-XiaochenNeural');
  });

  it('AZ-TTS-04 · 如果 text 已经是 SSML(<speak ...>), 直接透传', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    const ssml = '<speak version="1.0" xml:lang="zh-CN"><voice name="v"><mstts:express-as style="gentle">hi</mstts:express-as></voice></speak>';
    a.synthesizeStream('t1', ssml);
    expect(transport.synths[0].ssml).toBe(ssml);
  });

  it('AZ-TTS-05 · STARTED / AUDIO_CHUNK / VISEME / COMPLETE 事件映射', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));

    a.synthesizeStream('t1', 'hi');
    transport.fire({ kind: 'STARTED', turnId: 't1' });
    transport.fire({ kind: 'AUDIO_CHUNK', turnId: 't1', chunkIndex: 0, pcmBytes: new Uint8Array([0, 0]) });
    transport.fire({ kind: 'VISEME', turnId: 't1', azureVisemeId: 2 /* aa */, audioOffsetTicks: 0 });
    transport.fire({ kind: 'AUDIO_CHUNK', turnId: 't1', chunkIndex: 1, pcmBytes: new Uint8Array([0, 0]) });
    transport.fire({ kind: 'VISEME', turnId: 't1', azureVisemeId: 21 /* p,b,m */, audioOffsetTicks: 100 });
    transport.fire({ kind: 'COMPLETE', turnId: 't1' });

    const types = events.map((e) => e.type);
    expect(types).toContain('TTS_STARTED');
    expect(types.filter((t) => t === 'AUDIO_CHUNK').length).toBe(2);
    expect(types.filter((t) => t === 'VISEME').length).toBe(2);
    expect(types).toContain('TTS_COMPLETE');
  });

  it('AZ-TTS-06 · VISEME event 携带 Family MouthShape, 不是 azure id', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));
    a.synthesizeStream('t1', 'hi');
    transport.fire({ kind: 'VISEME', turnId: 't1', azureVisemeId: 21, audioOffsetTicks: 0 });
    const v = events.find((e) => e.type === 'VISEME');
    expect(v.viseme).toBe('CLOSED'); // Family MouthShape
    expect(v.viseme).not.toBe(21);
    expect(v.viseme).not.toBe('21');
  });

  it('AZ-TTS-07 · COMPLETE 时无 viseme → LIPSYNC_MODE = L1_AMPLITUDE_FALLBACK', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));
    a.synthesizeStream('t1', 'hi');
    transport.fire({ kind: 'AUDIO_CHUNK', turnId: 't1', chunkIndex: 0, pcmBytes: new Uint8Array([0]) });
    transport.fire({ kind: 'COMPLETE', turnId: 't1' });
    const c = events.find((e) => e.type === 'TTS_COMPLETE');
    expect(c.text).toBe('L1_AMPLITUDE_FALLBACK');
  });

  it('AZ-TTS-08 · COMPLETE 时有 viseme → LIPSYNC_MODE = L4_VISEME', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));
    a.synthesizeStream('t1', 'hi');
    transport.fire({ kind: 'VISEME', turnId: 't1', azureVisemeId: 6, audioOffsetTicks: 0 });
    transport.fire({ kind: 'COMPLETE', turnId: 't1' });
    const c = events.find((e) => e.type === 'TTS_COMPLETE');
    expect(c.text).toBe('L4_VISEME');
  });

  it('AZ-TTS-09 · cancel 后 transport.cancel + emit TTS_ERROR(tts-cancelled) + stale event drop', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));
    a.synthesizeStream('t1', 'hi');
    a.cancel('t1');
    expect(transport.cancels).toEqual(['t1']);
    const err = events.filter((e) => e.type === 'TTS_ERROR');
    expect(err).toHaveLength(1);
    expect(err[0].text).toBe('tts-cancelled');

    // stale after cancel
    const before = events.length;
    transport.fire({ kind: 'AUDIO_CHUNK', turnId: 't1', chunkIndex: 0, pcmBytes: new Uint8Array([0]) });
    transport.fire({ kind: 'VISEME', turnId: 't1', azureVisemeId: 1, audioOffsetTicks: 0 });
    transport.fire({ kind: 'COMPLETE', turnId: 't1' });
    expect(events.length).toBe(before);
  });

  it('AZ-TTS-10 · Provider ERROR → TTS_ERROR 带 reason, 不含 provider secret', () => {
    const env = { FPAI_AZURE_SPEECH_KEY: 'SECRET-K', FPAI_AZURE_SPEECH_REGION: 'REG-X' };
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));
    a.synthesizeStream('t1', 'hi');
    transport.fire({ kind: 'ERROR', turnId: 't1', reason: 'quota-exceeded' });
    const err = events.find((e) => e.type === 'TTS_ERROR');
    expect(err.text).toBe('quota-exceeded');
    const dump = JSON.stringify(events);
    expect(dump).not.toContain('SECRET-K');
    expect(dump).not.toContain('REG-X');
  });

  it('AZ-TTS-11 · SSML 中不出现 subscription key / region', () => {
    const env = { FPAI_AZURE_SPEECH_KEY: 'SECRET-K', FPAI_AZURE_SPEECH_REGION: 'REG-X' };
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env });
    a.synthesizeStream('t1', '你好');
    const ssml = transport.synths[0].ssml;
    expect(ssml).not.toContain('SECRET-K');
    expect(ssml).not.toContain('REG-X');
  });

  it('AZ-TTS-12 · WORD_BOUNDARY → AUDIO_CHUNK with text', () => {
    const transport = makeFakeTransport();
    const a = new AzureSpeechTtsAdapter({ transport, env: OK_ENV });
    const events: any[] = [];
    a.onEvent((e) => events.push(e));
    a.synthesizeStream('t1', 'hi');
    transport.fire({ kind: 'WORD_BOUNDARY', turnId: 't1', wordText: '你好', audioOffsetTicks: 0 });
    const c = events.find((e) => e.type === 'AUDIO_CHUNK' && e.text === '你好');
    expect(c).toBeDefined();
  });

  it('AZ-TTS-13 · providerId 常量稳定', () => {
    expect(AzureSpeechTtsAdapter.providerId).toBe('tts.azure_tts_neural');
  });
});
