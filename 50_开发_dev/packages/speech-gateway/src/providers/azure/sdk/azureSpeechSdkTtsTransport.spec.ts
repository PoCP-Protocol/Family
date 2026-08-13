/**
 * MM1-B1.1 · AzureSpeechSdkTtsTransport unit tests (§24 SDK-TTS-01..07)
 *
 * 全部使用 fake SDK。cancel 相关只验证契约 (dispose + 事件静默),
 * 不断言 PROVIDER_NATIVE_CANCEL 的语义 —— 那属于 live gate。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import {
  AzureSpeechSdkTtsTransport,
  AZURE_JS_TTS_NATIVE_CANCEL_EVIDENCE,
} from './azureSpeechSdkTtsTransport';
import type { AzureSpeechCredential } from '../secretReader';

function makeFakeSdk(opts: { hasStopSpeaking?: boolean } = {}) {
  const created: any[] = [];
  class FakeSpeechConfig {
    static fromSubscription = vi.fn((k: string, r: string) => new FakeSpeechConfig(k, r));
    public speechSynthesisOutputFormat: any;
    public constructor(public k: string, public r: string) {}
  }
  class FakeSynthesizer {
    public synthesisStarted?: (s: any, e: any) => void;
    public synthesizing?: (s: any, e: any) => void;
    public visemeReceived?: (s: any, e: any) => void;
    public wordBoundary?: (s: any, e: any) => void;
    public synthesisCompleted?: (s: any, e: any) => void;
    public SynthesisCanceled?: (s: any, e: any) => void;
    public spoke: string | null = null;
    public closed = false;
    public stopSpeakingCalled = false;
    public constructor(public sc: any) {
      created.push(this);
      if (opts.hasStopSpeaking) {
        (this as any).stopSpeakingAsync = (ok: () => void, _err: (e: any) => void) => {
          this.stopSpeakingCalled = true;
          setImmediate(ok);
        };
      }
    }
    public speakSsmlAsync(ssml: string, ok: (r: any) => void, _err: (e: any) => void): void {
      this.spoke = ssml;
      setImmediate(() => ok({}));
    }
    public close(): void {
      this.closed = true;
    }
  }
  const sdk = {
    SpeechConfig: FakeSpeechConfig,
    SpeechSynthesizer: FakeSynthesizer,
    SpeechSynthesisOutputFormat: { Raw16Khz16BitMonoPcm: 42 },
    CancellationReason: { Error: 1 },
  };
  return { sdk, created };
}

function cred(): AzureSpeechCredential {
  return { hasKey: true, hasRegion: true, subscriptionKey: 'k', region: 'r', endpoint: undefined } as any;
}

describe('mm1-b1.1 · AzureSpeechSdkTtsTransport (§24 SDK-TTS-01..07)', () => {
  it('SDK-TTS-01 · synthesize → STARTED', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkTtsTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.synthesize({ turnId: 'a', ssml: '<speak/>', credential: cred() });
    created[0].synthesisStarted?.(created[0], {});
    expect(events[0]).toEqual({ kind: 'STARTED', turnId: 'a' });
  });

  it('SDK-TTS-02 · synthesizing chunk → AUDIO_CHUNK with incrementing chunkIndex', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkTtsTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.synthesize({ turnId: 'b', ssml: '<speak/>', credential: cred() });
    const s = created[0];
    s.synthesizing?.(s, { result: { audioData: new Uint8Array([1, 2]).buffer } });
    s.synthesizing?.(s, { result: { audioData: new Uint8Array([3, 4, 5]).buffer } });
    const chunks = events.filter((e) => e.kind === 'AUDIO_CHUNK');
    expect(chunks.map((c) => c.chunkIndex)).toEqual([0, 1]);
    expect(chunks[0].pcmBytes.byteLength).toBe(2);
    expect(chunks[1].pcmBytes.byteLength).toBe(3);
  });

  it('SDK-TTS-03 · visemeReceived → VISEME with azureVisemeId + ticks', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkTtsTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.synthesize({ turnId: 'c', ssml: '<speak/>', credential: cred() });
    const s = created[0];
    s.visemeReceived?.(s, { visemeId: 5, audioOffset: 1500000 });
    expect(events).toContainEqual({
      kind: 'VISEME',
      turnId: 'c',
      azureVisemeId: 5,
      audioOffsetTicks: 1500000,
    });
  });

  it('SDK-TTS-04 · wordBoundary → WORD_BOUNDARY', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkTtsTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.synthesize({ turnId: 'd', ssml: '<speak/>', credential: cred() });
    const s = created[0];
    s.wordBoundary?.(s, { text: '你好', audioOffset: 200000 });
    expect(events).toContainEqual({
      kind: 'WORD_BOUNDARY',
      turnId: 'd',
      wordText: '你好',
      audioOffsetTicks: 200000,
    });
  });

  it('SDK-TTS-05 · synthesisCompleted → COMPLETE + close()', () => {
    const { sdk, created } = makeFakeSdk();
    const t = new AzureSpeechSdkTtsTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.synthesize({ turnId: 'e', ssml: '<speak/>', credential: cred() });
    const s = created[0];
    s.synthesisCompleted?.(s, {});
    expect(events).toContainEqual({ kind: 'COMPLETE', turnId: 'e' });
    expect(s.closed).toBe(true);
  });

  it('SDK-TTS-06 · cancel WITH stopSpeakingAsync → best-effort native + close + drop stale', () => {
    const { sdk, created } = makeFakeSdk({ hasStopSpeaking: true });
    const t = new AzureSpeechSdkTtsTransport({ __sdkOverride: sdk as any });
    const events: any[] = [];
    t.onProviderEvent((e) => events.push(e));
    t.synthesize({ turnId: 'f', ssml: '<speak/>', credential: cred() });
    const s = created[0];
    t.cancel('f');
    expect(s.stopSpeakingCalled).toBe(true);
    expect(s.closed).toBe(true);
    // stale event 静默
    s.synthesizing?.(s, { result: { audioData: new Uint8Array([9]).buffer } });
    expect(events.filter((e) => e.kind === 'AUDIO_CHUNK')).toEqual([]);
    // cancel mode 至少要落到我们已知的三档之一
    const mode = t.getLastCancelMode();
    expect(mode === 'UNKNOWN_PENDING_LIVE_TEST' || mode === 'PROVIDER_NATIVE_CANCEL' || mode === 'TRANSPORT_DISPOSE_CANCEL').toBe(true);
    // 与常量声明保持一致 (未 live 时应为 UNKNOWN_PENDING_LIVE_TEST)
    expect(AZURE_JS_TTS_NATIVE_CANCEL_EVIDENCE).toBe('UNKNOWN_PENDING_LIVE_TEST');
  });

  it('SDK-TTS-07 · cancel WITHOUT stopSpeakingAsync → TRANSPORT_DISPOSE_CANCEL', () => {
    const { sdk, created } = makeFakeSdk({ hasStopSpeaking: false });
    const t = new AzureSpeechSdkTtsTransport({ __sdkOverride: sdk as any });
    t.onProviderEvent(() => {});
    t.synthesize({ turnId: 'g', ssml: '<speak/>', credential: cred() });
    const s = created[0];
    t.cancel('g');
    expect(s.closed).toBe(true);
    expect(t.getLastCancelMode()).toBe('TRANSPORT_DISPOSE_CANCEL');
  });
});
