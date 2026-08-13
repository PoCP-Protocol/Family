/**
 * MM1-B1.1 · Speech Composition Root tests (§J)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';
import { buildSpeechComposition } from './speechCompositionRoot';

function fakeSttTransport() {
  return {
    open: () => {},
    pushPcm: () => {},
    finish: () => {},
    cancel: () => {},
    onProviderEvent: () => {},
  };
}
function fakeTtsTransport() {
  return {
    synthesize: () => {},
    cancel: () => {},
    onProviderEvent: () => {},
  };
}

describe('mm1-b1.1 · speechCompositionRoot (§J)', () => {
  it('COMP-01 · real=NO → FAKE, providers=Fake', () => {
    const r = buildSpeechComposition({ env: { FPAI_REAL_SPEECH_ENABLED: 'NO' } as any });
    expect(r.mode).toBe('FAKE');
    expect(r.provider_id?.stt).toBe('stt.fake');
    expect(r.provider_id?.tts).toBe('tts.fake');
    expect(r.telemetry.FALLBACK_PROVIDER_USED).toBe('NO');
    expect(r.stt).toBeTruthy();
    expect(r.tts).toBeTruthy();
  });

  it('COMP-02 · real=YES + no credential + fallback=NO → BLOCKED_MISSING_CREDENTIAL, no adapters', () => {
    const r = buildSpeechComposition({ env: { FPAI_REAL_SPEECH_ENABLED: 'YES' } as any });
    expect(r.mode).toBe('BLOCKED_MISSING_CREDENTIAL');
    expect(r.stt).toBeNull();
    expect(r.tts).toBeNull();
    expect(r.telemetry.FALLBACK_PROVIDER_USED).toBe('NO');
  });

  it('COMP-03 · real=YES + no credential + fallback=YES → FAKE_FALLBACK + FALLBACK_PROVIDER_USED=YES', () => {
    const r = buildSpeechComposition({
      env: { FPAI_REAL_SPEECH_ENABLED: 'YES', FPAI_ALLOW_DEV_FAKE_FALLBACK: 'YES' } as any,
    });
    expect(r.mode).toBe('FAKE_FALLBACK');
    expect(r.telemetry.FALLBACK_PROVIDER_USED).toBe('YES');
    expect(r.stt).toBeTruthy();
    expect(r.tts).toBeTruthy();
  });

  it('COMP-04 · real=YES + credential 到位 + 注入 fake SDK transport → AZURE_SDK mode, provider_id=azure', () => {
    const r = buildSpeechComposition({
      env: {
        FPAI_REAL_SPEECH_ENABLED: 'YES',
        FPAI_AZURE_SPEECH_KEY: 'k',
        FPAI_AZURE_SPEECH_REGION: 'r',
      } as any,
      __sttTransportFactory: fakeSttTransport as any,
      __ttsTransportFactory: fakeTtsTransport as any,
    });
    expect(r.mode).toBe('AZURE_SDK');
    expect(r.provider_id?.stt).toBe('stt.azure_speech_realtime');
    expect(r.provider_id?.tts).toBe('tts.azure_tts_neural');
    expect(r.telemetry.AZURE_CREDENTIAL_PRESENT).toBe('YES');
    expect(r.telemetry.AZURE_SDK_INSTALLED).toBe('YES');
    expect(r.telemetry.FALLBACK_PROVIDER_USED).toBe('NO');
  });

  it('COMP-05 · real=YES + credential 到位 + transport factory 抛错 → BLOCKED_SDK_MISSING', () => {
    const r = buildSpeechComposition({
      env: {
        FPAI_REAL_SPEECH_ENABLED: 'YES',
        FPAI_AZURE_SPEECH_KEY: 'k',
        FPAI_AZURE_SPEECH_REGION: 'r',
      } as any,
      __sttTransportFactory: () => { throw new Error('AZURE_SDK_NOT_INSTALLED'); },
      __ttsTransportFactory: fakeTtsTransport as any,
    });
    expect(r.mode).toBe('BLOCKED_SDK_MISSING');
    expect(r.telemetry.AZURE_SDK_INSTALLED).toBe('NO');
    expect(r.stt).toBeNull();
  });
});
