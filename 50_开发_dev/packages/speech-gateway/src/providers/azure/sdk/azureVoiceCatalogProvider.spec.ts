/**
 * MM1-B1.1 · AzureVoiceCatalogProvider (§12/§13) unit tests.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import {
  AzureVoiceCatalogProvider,
  DEFAULT_CONFIGURATION_CANDIDATES,
} from './azureVoiceCatalogProvider';

describe('mm1-b1.1 · AzureVoiceCatalogProvider (§12, §13)', () => {
  it('VOICE-CATALOG-01 · missing credential → BLOCKED_MISSING_CREDENTIAL, no SDK call', async () => {
    const p = new AzureVoiceCatalogProvider({ env: {} as any });
    const r = await p.fetchLive('zh-CN');
    expect(r.status).toBe('BLOCKED_MISSING_CREDENTIAL');
    expect(r.voices).toEqual([]);
  });

  it('VOICE-CATALOG-02 · DEFAULT_CONFIGURATION_CANDIDATES has region_available=UNKNOWN', () => {
    const p = new AzureVoiceCatalogProvider({ env: {} as any });
    const list = p.listDefaultConfigurationCandidates();
    expect(list.length).toBe(DEFAULT_CONFIGURATION_CANDIDATES.length);
    for (const v of list) {
      expect(v.region_available).toBe('UNKNOWN');
      expect(v.locale).toBe('zh-CN');
    }
    // 硬编码 default 里必须包含 Xiaoxiao
    expect(list.map((v) => v.voice_id)).toContain('zh-CN-XiaoxiaoNeural');
  });

  it('VOICE-CATALOG-03 · fetchLive with fake SDK returns provider-neutral list', async () => {
    const voices = [
      { shortName: 'zh-CN-XiaoxiaoNeural', locale: 'zh-CN', gender: 1, voiceType: 1, styleList: ['cheerful', 'sad'], rolePlayList: [] },
      { shortName: 'zh-CN-YunxiNeural', locale: 'zh-CN', gender: 2, voiceType: 1, styleList: [], rolePlayList: ['Boy'] },
    ];
    const fakeSynth = {
      getVoicesAsync: (locale: string, ok: (r: any) => void, _err: (e: any) => void) => {
        expect(locale).toBe('zh-CN');
        setImmediate(() => ok({ voices }));
      },
      close: vi.fn(),
    };
    const fakeSdk = {
      SpeechConfig: { fromSubscription: vi.fn(() => ({})) },
      SpeechSynthesizer: vi.fn(() => fakeSynth),
    };
    const p = new AzureVoiceCatalogProvider({
      env: {
        FPAI_AZURE_SPEECH_KEY: 'k',
        FPAI_AZURE_SPEECH_REGION: 'r',
      } as any,
      __sdkOverride: fakeSdk as any,
    });
    const r = await p.fetchLive('zh-CN');
    expect(r.status).toBe('READY');
    expect(r.voices.length).toBe(2);
    const xiao = r.voices.find((v) => v.voice_id === 'zh-CN-XiaoxiaoNeural');
    expect(xiao?.gender).toBe('FEMALE');
    expect(xiao?.voice_type).toBe('NEURAL');
    expect(xiao?.styles).toEqual(['cheerful', 'sad']);
    expect(xiao?.region_available).toBe('TRUE');
    const yunxi = r.voices.find((v) => v.voice_id === 'zh-CN-YunxiNeural');
    expect(yunxi?.gender).toBe('MALE');
    expect(yunxi?.roles).toEqual(['Boy']);
    expect(fakeSynth.close).toHaveBeenCalled();
  });

  it('VOICE-CATALOG-04 · SDK throws → ERROR result, no leak', async () => {
    const fakeSynth = {
      getVoicesAsync: (_l: string, _ok: any, err: (e: any) => void) => {
        setImmediate(() => err('boom'));
      },
      close: vi.fn(),
    };
    const fakeSdk = {
      SpeechConfig: { fromSubscription: vi.fn(() => ({})) },
      SpeechSynthesizer: vi.fn(() => fakeSynth),
    };
    const p = new AzureVoiceCatalogProvider({
      env: { FPAI_AZURE_SPEECH_KEY: 'k', FPAI_AZURE_SPEECH_REGION: 'r' } as any,
      __sdkOverride: fakeSdk as any,
    });
    const r = await p.fetchLive('zh-CN');
    expect(r.status).toBe('ERROR');
    expect(r.voices).toEqual([]);
    expect(String(r.reason)).toContain('azure-getVoices-failed');
  });
});
