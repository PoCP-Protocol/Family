import { describe, expect, it } from 'vitest';
import { FakeSpeechToTextGateway, FakeTextToSpeechGateway } from './index';

describe('fake speech gateways', () => {
  it('U04 STT pushes injected user text as partial then final', () => {
    const stt = new FakeSpeechToTextGateway();
    const events: Array<{ type?: string; kind?: string; text?: string }> = [];
    stt.onEvent((event) => events.push(event as { type?: string; kind?: string; text?: string }));

    stt.setPendingTranscript('turn-1', '我儿子每天回来就玩手机。');
    stt.startSession('turn-1');
    stt.pushAudioChunk('turn-1', new Uint8Array([1, 2, 3]));
    stt.pushAudioChunk('turn-1', new Uint8Array([1, 2, 3]));
    stt.pushAudioChunk('turn-1', new Uint8Array([1, 2, 3]));
    stt.pushAudioChunk('turn-1', new Uint8Array([1, 2, 3]));
    stt.finishInput('turn-1');

    const partials = events.filter((e) => e.type === 'TRANSCRIPT_PARTIAL');
    const finals = events.filter((e) => e.type === 'TRANSCRIPT_FINAL');
    expect(partials.length).toBeGreaterThan(0);
    expect(finals.length).toBe(1);
    expect(finals[0]?.text).toBe('我儿子每天回来就玩手机。');
  });

  it('U05 TTS streams TTS_STARTED / AUDIO_CHUNK / VISEME / TTS_COMPLETE for authoritative say_it_tonight', async () => {
    const tts = new FakeTextToSpeechGateway();
    const events: Array<{ type?: string; kind?: string }> = [];
    tts.onEvent((event) => events.push(event as { type?: string; kind?: string }));

    tts.synthesizeStream('turn-2', '今晚先别解决手机。把今晚目标降到10分钟对话。');

    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(events.some((e) => e.type === 'TTS_STARTED')).toBe(true);
    expect(events.some((e) => e.type === 'AUDIO_CHUNK')).toBe(true);
    expect(events.some((e) => e.type === 'VISEME')).toBe(true);
    expect(events.some((e) => e.type === 'TTS_COMPLETE')).toBe(true);
  });

  it('U06 TTS cancel emits TTS_ERROR(cancelled) and drops queued chunks', async () => {
    const tts = new FakeTextToSpeechGateway();
    const events: Array<{ type?: string }> = [];
    tts.onEvent((event) => events.push(event as { type?: string }));

    tts.synthesizeStream('turn-3', '第一句。第二句。第三句。第四句。');
    tts.cancel('turn-3');
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(events.some((e) => e.type === 'TTS_ERROR')).toBe(true);
    expect(events.some((e) => e.type === 'TTS_COMPLETE')).toBe(false);
  });
});
