import { describe, expect, it } from 'vitest';

import {
  InMemorySpeechProviderRegistry,
  STT_SHORTLIST_SEED_IDS,
  TTS_SHORTLIST_SEED_IDS,
  assertUnknownIfNoEvidence,
  emptySttDescriptor,
  emptyTtsDescriptor,
  fakeSttRegistration,
  fakeTtsRegistration,
} from './index';
import type { ProviderCommercialContract } from '@family/fpai-multimodal-contracts';

describe('speech-gateway · provider registry', () => {
  it('WS-PROV-STT-01 · registers Fake STT baseline and lists it', () => {
    const registry = new InMemorySpeechProviderRegistry();
    registry.registerStt(fakeSttRegistration);
    const list = registry.listStt();
    expect(list).toHaveLength(1);
    expect(list[0].provider_id).toBe('stt.fake_baseline');
    expect(list[0].provider_class).toBe('FAKE_BASELINE');
  });

  it('WS-PROV-STT-02 · registers Fake TTS baseline and lists it', () => {
    const registry = new InMemorySpeechProviderRegistry();
    registry.registerTts(fakeTtsRegistration);
    const list = registry.listTts();
    expect(list).toHaveLength(1);
    expect(list[0].provider_id).toBe('tts.fake_baseline');
    expect(list[0].provider_class).toBe('FAKE_BASELINE');
  });

  it('WS-PROV-STT-03 · lookupStt returns registration and factory produces gateway', () => {
    const registry = new InMemorySpeechProviderRegistry();
    registry.registerStt(fakeSttRegistration);
    const found = registry.lookupStt('stt.fake_baseline');
    expect(found).toBeDefined();
    const gateway = found!.factory({});
    expect(typeof gateway.startSession).toBe('function');
    expect(typeof gateway.pushAudioChunk).toBe('function');
    expect(typeof gateway.finishInput).toBe('function');
    expect(typeof gateway.cancel).toBe('function');
  });

  it('WS-PROV-STT-04 · double register throws', () => {
    const registry = new InMemorySpeechProviderRegistry();
    registry.registerStt(fakeSttRegistration);
    expect(() => registry.registerStt(fakeSttRegistration)).toThrow(/already registered/);
  });

  it('WS-PROV-STT-05 · Fake TTS health = READY', async () => {
    const health = await fakeTtsRegistration.health();
    expect(health.status).toBe('READY');
  });
});

describe('speech-gateway · capability guardrails', () => {
  it('WS-PROV-CAP-01 · empty descriptors default all fields to UNKNOWN', () => {
    const stt = emptySttDescriptor('stt.test_candidate', 'v0');
    expect(stt.capabilities.streaming).toBe('UNKNOWN');
    expect(stt.capabilities.mandarin_quality).toBe('UNKNOWN');
    expect(stt.capabilities.audio_formats).toEqual([]);
    expect(stt.commercial.commercial_terms_reviewed).toBe('UNKNOWN');
    expect(stt.commercial.evidence.evidence_refs).toEqual([]);

    const tts = emptyTtsDescriptor('tts.test_candidate', 'v0');
    expect(tts.capabilities.viseme).toBe('UNKNOWN');
    expect(tts.capabilities.word_timing).toBe('UNKNOWN');
    expect(tts.capabilities.voice_rights_ownership).toBe('UNKNOWN');
  });

  it('WS-PROV-CAP-02 · REAL provider without evidence but claiming TRUE → throws', () => {
    const registry = new InMemorySpeechProviderRegistry();
    const bad = emptySttDescriptor('stt.malicious_real', 'v0', 'REAL');
    bad.commercial.commercial_terms_reviewed = 'TRUE'; // 撒谎:无证据却声称已审阅
    expect(() =>
      registry.registerStt({
        descriptor: bad,
        factory: () => fakeSttRegistration.factory({}),
        health: fakeSttRegistration.health,
      }),
    ).toThrow(/no evidence_refs/);
  });

  it('WS-PROV-CAP-03 · REAL provider with evidence_refs may claim TRUE', () => {
    const registry = new InMemorySpeechProviderRegistry();
    const good = emptySttDescriptor('stt.valid_real', 'v0', 'REAL');
    const c: ProviderCommercialContract = {
      ...good.commercial,
      commercial_terms_reviewed: 'TRUE',
      evidence: {
        evidence_refs: ['https://official.example.com/api-doc'],
        verified_at: '2026-08-13',
        verified_by: 'engineer-A',
      },
    };
    good.commercial = c;
    expect(() =>
      registry.registerStt({
        descriptor: good,
        factory: () => fakeSttRegistration.factory({}),
        health: fakeSttRegistration.health,
      }),
    ).not.toThrow();
  });

  it('WS-PROV-CAP-04 · assertUnknownIfNoEvidence is idempotent for all-UNKNOWN', () => {
    const desc = emptySttDescriptor('stt.pending', 'v0', 'REAL');
    expect(() => assertUnknownIfNoEvidence(desc.provider_id, desc.commercial)).not.toThrow();
  });
});

describe('speech-gateway · shortlist seed', () => {
  it('WS-PROV-SL-01 · STT shortlist is frozen and non-empty', () => {
    expect(Object.isFrozen(STT_SHORTLIST_SEED_IDS)).toBe(true);
    expect(STT_SHORTLIST_SEED_IDS.length).toBeGreaterThanOrEqual(3);
    for (const id of STT_SHORTLIST_SEED_IDS) {
      expect(id).toMatch(/^stt\./);
    }
  });

  it('WS-PROV-SL-02 · TTS shortlist is frozen and non-empty', () => {
    expect(Object.isFrozen(TTS_SHORTLIST_SEED_IDS)).toBe(true);
    expect(TTS_SHORTLIST_SEED_IDS.length).toBeGreaterThanOrEqual(3);
    for (const id of TTS_SHORTLIST_SEED_IDS) {
      expect(id).toMatch(/^tts\./);
    }
  });
});
