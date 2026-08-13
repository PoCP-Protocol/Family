/**
 * MM1-B1 · Azure Speech STT Adapter tests (§6/§35)
 */
import { describe, expect, it, vi } from 'vitest';
import { AzureSpeechSttAdapter, type AzureRealtimeSttTransport } from './azureSpeechStt';
import { AZURE_CREDENTIAL_BLOCKER } from './secretReader';

function makeFakeTransport(): AzureRealtimeSttTransport & {
  fireProvider: (evt: { turnId: string; kind: 'PARTIAL' | 'FINAL' | 'ERROR'; text?: string; reason?: string }) => void;
  opened: string[];
  pcms: number[];
  finishes: string[];
  cancels: string[];
} {
  let handler: ((evt: any) => void) | null = null;
  const opened: string[] = [];
  const pcms: number[] = [];
  const finishes: string[] = [];
  const cancels: string[] = [];
  return {
    open({ turnId }) {
      opened.push(turnId);
    },
    pushPcm(_turnId, pcm) {
      pcms.push(pcm.byteLength);
    },
    finish(turnId) {
      finishes.push(turnId);
    },
    cancel(turnId) {
      cancels.push(turnId);
    },
    onProviderEvent(cb) {
      handler = cb;
    },
    fireProvider(evt) {
      handler?.(evt);
    },
    opened,
    pcms,
    finishes,
    cancels,
  };
}

const CREDENTIALED_ENV = {
  FPAI_AZURE_SPEECH_KEY: 'k',
  FPAI_AZURE_SPEECH_REGION: 'eastasia',
};

describe('mm1-b1 · AzureSpeechSttAdapter', () => {
  it('AZ-STT-01 · 缺 credential 时 startSession 立即 emit ERROR(BLOCKED_MISSING_CREDENTIAL)', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: {} });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));

    adapter.startSession('t1');
    expect(transport.opened).toEqual([]);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('ERROR');
    expect(events[0].payload.reason).toBe(AZURE_CREDENTIAL_BLOCKER);
    expect(events[0].payload.provider_id).toBe('stt.azure_speech_realtime');
  });

  it('AZ-STT-02 · 有 credential 时 startSession 发 STATE_CHANGED(TRANSCRIBING) 并 open transport', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));

    adapter.startSession('t1');
    expect(transport.opened).toEqual(['t1']);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('STATE_CHANGED');
    expect(events[0].payload.state).toBe('TRANSCRIBING');
  });

  it('AZ-STT-03 · pushAudioChunk 走 transport.pushPcm', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV });
    adapter.startSession('t1');
    adapter.pushAudioChunk('t1', new Uint8Array([1, 2, 3, 4]));
    adapter.pushAudioChunk('t1', new Uint8Array([5, 6]));
    expect(transport.pcms).toEqual([4, 2]);
  });

  it('AZ-STT-04 · Azure recognizing → TRANSCRIPT_PARTIAL 事件映射', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV, now: () => 12345 });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));
    adapter.startSession('t1');
    transport.fireProvider({ turnId: 't1', kind: 'PARTIAL', text: '我儿子' });
    const p = events.find((e) => e.type === 'TRANSCRIPT_PARTIAL');
    expect(p).toBeDefined();
    expect(p.text).toBe('我儿子');
    expect(p.turn_id).toBe('t1');
    expect(p.timestamp_ms).toBe(12345);
  });

  it('AZ-STT-05 · Azure recognized → TRANSCRIPT_FINAL 事件映射', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));
    adapter.startSession('t1');
    transport.fireProvider({ turnId: 't1', kind: 'FINAL', text: '我儿子每天回来就玩手机' });
    const f = events.find((e) => e.type === 'TRANSCRIPT_FINAL');
    expect(f).toBeDefined();
    expect(f.text).toBe('我儿子每天回来就玩手机');
  });

  it('AZ-STT-06 · FINAL 后 turn 自动关闭, 后续 PARTIAL 被 drop', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));
    adapter.startSession('t1');
    transport.fireProvider({ turnId: 't1', kind: 'FINAL', text: 'x' });
    transport.fireProvider({ turnId: 't1', kind: 'PARTIAL', text: 'stale' });
    const staleCount = events.filter((e) => e.type === 'TRANSCRIPT_PARTIAL').length;
    expect(staleCount).toBe(0);
  });

  it('AZ-STT-07 · cancel 后 transport.cancel + emit ERROR(stt-cancelled) + 后续事件被 drop', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));
    adapter.startSession('t1');
    events.length = 0;
    adapter.cancel('t1');
    expect(transport.cancels).toEqual(['t1']);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('ERROR');
    expect(events[0].payload.reason).toBe('stt-cancelled');
    transport.fireProvider({ turnId: 't1', kind: 'PARTIAL', text: 'stale' });
    expect(events).toHaveLength(1);
  });

  it('AZ-STT-08 · finishInput 触发 transport.finish', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV });
    adapter.startSession('t1');
    adapter.finishInput('t1');
    expect(transport.finishes).toEqual(['t1']);
  });

  it('AZ-STT-09 · Azure error → RealtimeServerEvent(ERROR) 带 provider_id + reason', () => {
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env: CREDENTIALED_ENV });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));
    adapter.startSession('t1');
    transport.fireProvider({ turnId: 't1', kind: 'ERROR', reason: 'auth-failed' });
    const err = events.find((e) => e.kind === 'ERROR');
    expect(err.payload.reason).toBe('auth-failed');
    expect(err.payload.provider_id).toBe('stt.azure_speech_realtime');
  });

  it('AZ-STT-10 · 事件负载不包含 subscription key / region 值', () => {
    const env = { FPAI_AZURE_SPEECH_KEY: 'SECRET-KEY-XYZ', FPAI_AZURE_SPEECH_REGION: 'zone-1' };
    const transport = makeFakeTransport();
    const adapter = new AzureSpeechSttAdapter({ transport, env });
    const events: any[] = [];
    adapter.onEvent((e) => events.push(e));
    adapter.startSession('t1');
    transport.fireProvider({ turnId: 't1', kind: 'PARTIAL', text: 'hello' });
    transport.fireProvider({ turnId: 't1', kind: 'FINAL', text: 'hello world' });
    const dump = JSON.stringify(events);
    expect(dump).not.toContain('SECRET-KEY-XYZ');
    expect(dump).not.toContain('zone-1');
  });

  it('AZ-STT-11 · credentialDiagnostic 不泄露 key / region', () => {
    const adapter = new AzureSpeechSttAdapter({
      transport: makeFakeTransport(),
      env: {
        FPAI_AZURE_SPEECH_KEY: 'ZZZ-SECRET-VALUE-01',
        FPAI_AZURE_SPEECH_REGION: 'zone-region-alpha',
      },
    });
    const d = adapter.credentialDiagnostic();
    expect(d.hasKey).toBe(true);
    expect(d.hasRegion).toBe(true);
    const dump = JSON.stringify(d);
    expect(dump).not.toContain('ZZZ-SECRET-VALUE-01');
    expect(dump).not.toContain('zone-region-alpha');
  });

  it('AZ-STT-12 · providerId 常量稳定', () => {
    expect(AzureSpeechSttAdapter.providerId).toBe('stt.azure_speech_realtime');
  });
});
