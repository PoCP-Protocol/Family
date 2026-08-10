import { describe, expect, it } from 'vitest';
import { FakeSpeechToTextGateway, FakeTextToSpeechGateway } from './index';

describe('fake speech gateways', () => {
  it('emits partial and final transcript events', () => {
    const stt = new FakeSpeechToTextGateway();
    const events: Array<{ type?: string; kind?: string }> = [];
    stt.onEvent((event) => events.push(event));

    stt.startSession('turn-1');
    stt.pushAudioChunk('turn-1', new Uint8Array([1, 2, 3]));
    stt.finishInput('turn-1');

    expect(events.some((event) => event.type === 'TRANSCRIPT_PARTIAL')).toBe(true);
    expect(events.some((event) => event.type === 'TRANSCRIPT_FINAL')).toBe(true);
  });

  it('streams tts chunks and supports cancellation', () => {
    const tts = new FakeTextToSpeechGateway();
    const events: Array<{ type?: string; kind?: string }> = [];
    tts.onEvent((event) => events.push(event));

    tts.synthesizeStream('turn-2', '今晚先别解决手机');
    tts.cancel('turn-2');

    expect(events.some((event) => event.type === 'AUDIO_CHUNK')).toBe(true);
    expect(events.some((event) => event.kind === 'ERROR')).toBe(true);
  });
});
