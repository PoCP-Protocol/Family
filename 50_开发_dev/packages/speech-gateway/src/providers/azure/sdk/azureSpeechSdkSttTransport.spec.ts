/**
 * MM1-B1.1 · AzureSpeechSdkSttTransport unit tests (§24 SDK-STT-01..06)
 *
 * 全部通过 __sdkOverride 注入 fake SDK, 不触达真实 Azure。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import { AzureSpeechSdkSttTransport } from './azureSpeechSdkSttTransport';
import type { AzureSpeechCredential } from '../secretReader';

// ---------- Fake SDK ----------
function makeFakeSdk() {
  const created: any[] = [];
  const streams: any[] = [];

  class FakeSpeechConfig {
    static fromSubscription = vi.fn((key: string, region: string) => new FakeSpeechConfig(key, region));
    public speechRecognitionLanguage = '';
    public constructor(public key: string, public region: string) {}
  }
  class FakeAudioStreamFormat {
    static getWaveFormatPCM = vi.fn((sr: number, bits: number, ch: number) => ({ sr, bits, ch }));
  }
  class FakePushStream {
    public writes: number[] = [];
    public wasClosed = false;
    public write(ab: ArrayBuffer): void {
      this.writes.push(ab.byteLength);
    }
    public close(): void {
      this.wasClosed = true;
    }
  }
  class FakeAudioInputStream {
    static createPushStream = vi.fn((_fmt: any) => {
      const s = new FakePushStream();
      streams.push(s);
      return s;
    });
  }
  class FakeAudioConfig {
    static fromStreamInput = vi.fn((ps: any) => ({ ps }));
  }
  class FakeRecognizer {
    public recognizing?: (s: any, e: any) => void;
    public recognized?: (s: any, e: any) => void;
    public canceled?: (s: any, e: any) => void;
    public sessionStopped?: (s: any, e: any) => void;
    public started = false;
    public stopped = false;
    public closed = false;
    public constructor(public sc: any, public ac: any) {
      created.push(this);
    }
    public startContinuousRecognitionAsync(ok: () => void, _err: (e: any) => void): void {
      this.started = true;
      setImmediate(ok);
    }
    public stopContinuousRecognitionAsync(ok: () => void, _err: (e: any) => void): void {
      this.stopped = true;
      setImmediate(ok);
    }
    public close(): void {
      this.closed = true;
    }
  }
  const sdk = {
    SpeechConfig: FakeSpeechConfig,
    AudioStreamFormat: FakeAudioStreamFormat,
    AudioInputStream: FakeAudioInputStream,
    AudioConfig: FakeAudioConfig,
    SpeechRecognizer: FakeRecognizer,
    ResultReason: { RecognizedSpeech: 3, NoMatch: 0 },
    CancellationReason: { Error: 1 },
  };
  return { sdk, created, streams };
}

function credOk(): AzureSpeechCredential {
  return {
    hasKey: true,
    hasRegion: true,
    subscriptionKey: 'fake-key',
    region: 'eastus',
    endpoint: undefined,
  } as any;
}

// ---------- Tests ----------
describe('mm1-b1.1 · AzureSpeechSdkSttTransport (§24 SDK-STT-01..06)', () => {
  it('SDK-STT-01 · open → recognizing → PARTIAL', async () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkSttTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.open({ turnId: 't1', credential: credOk() });
    // 等 startContinuousRecognitionAsync 完成
    await new Promise((r) => setImmediate(r));
    const rec = created[0];
    rec.recognizing?.(rec, { result: { text: '你好' } });
    expect(events).toEqual([{ turnId: 't1', kind: 'PARTIAL', text: '你好' }]);
  });

  it('SDK-STT-02 · recognized (RecognizedSpeech) → FINAL', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkSttTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.open({ turnId: 't2', credential: credOk() });
    const rec = created[0];
    rec.recognized?.(rec, { result: { reason: 3, text: '完整句子' } });
    expect(events).toContainEqual({ turnId: 't2', kind: 'FINAL', text: '完整句子' });
  });

  it('SDK-STT-03 · recognized (NoMatch) does NOT emit FINAL', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkSttTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.open({ turnId: 't3', credential: credOk() });
    const rec = created[0];
    rec.recognized?.(rec, { result: { reason: 0, text: '' } });
    expect(events.filter((e) => e.kind === 'FINAL')).toEqual([]);
  });

  it('SDK-STT-04 · canceled → ERROR + closes recognizer', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkSttTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.open({ turnId: 't4', credential: credOk() });
    const rec = created[0];
    rec.canceled?.(rec, { reason: 1, errorDetails: 'boom' });
    expect(events).toContainEqual({ turnId: 't4', kind: 'ERROR', reason: 'azure-canceled:boom' });
    // dispose 走 close()
    expect(rec.closed).toBe(true);
  });

  it('SDK-STT-05 · pushPcm forwards bytes; cancel drops stale callbacks', () => {
    const { sdk, created, streams } = makeFakeSdk();
    const t = new AzureSpeechSdkSttTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.open({ turnId: 't5', credential: credOk() });
    const rec = created[0];
    const stream = streams[0];
    t.pushPcm('t5', new Uint8Array([1, 2, 3, 4]));
    expect(stream.writes).toEqual([4]);
    t.cancel('t5');
    // stale callback 到达 → 应被静默 drop
    rec.recognizing?.(rec, { result: { text: '不应上抛' } });
    rec.recognized?.(rec, { result: { reason: 3, text: 'stale-final' } });
    expect(events.some((e) => e.text === '不应上抛')).toBe(false);
    expect(events.some((e) => e.text === 'stale-final')).toBe(false);
  });

  it('SDK-STT-06 · finish stops recognizer and closes stream', () => {
    const { sdk, created, streams } = makeFakeSdk();
    const t = new AzureSpeechSdkSttTransport({ __sdkOverride: sdk as any });
    t.onProviderEvent(() => {});
    t.open({ turnId: 't6', credential: credOk() });
    const rec = created[0];
    const stream = streams[0];
    t.finish('t6');
    expect(stream.wasClosed).toBe(true);
    expect(rec.stopped).toBe(true);
  });
});
