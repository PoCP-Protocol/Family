import { describe, expect, it } from 'vitest';

import {
  AVATAR_SHORTLIST_SEED_IDS,
  InMemoryAvatarProviderRegistry,
  assertAvatarUnknownIfNoEvidence,
  emptyAvatarDescriptor,
  fakeAvatarRegistration,
} from './index';

describe('avatar-gateway · provider registry', () => {
  it('WS-PROV-AV-01 · registers Fake Avatar baseline and lists it', () => {
    const reg = new InMemoryAvatarProviderRegistry();
    reg.registerAvatar(fakeAvatarRegistration);
    const list = reg.listAvatar();
    expect(list).toHaveLength(1);
    expect(list[0].provider_id).toBe('avatar.fake_baseline');
    expect(list[0].provider_class).toBe('FAKE_BASELINE');
    expect(list[0].capabilities.identity_lock).toBe('TRUE');
  });

  it('WS-PROV-AV-02 · lookup + factory produces AvatarGateway', () => {
    const reg = new InMemoryAvatarProviderRegistry();
    reg.registerAvatar(fakeAvatarRegistration);
    const found = reg.lookupAvatar('avatar.fake_baseline');
    expect(found).toBeDefined();
    const gateway = found!.factory({});
    expect(typeof gateway.startPerformance).toBe('function');
    expect(typeof gateway.cancel).toBe('function');
    expect(typeof gateway.complete).toBe('function');
  });

  it('WS-PROV-AV-03 · double register throws', () => {
    const reg = new InMemoryAvatarProviderRegistry();
    reg.registerAvatar(fakeAvatarRegistration);
    expect(() => reg.registerAvatar(fakeAvatarRegistration)).toThrow(/already registered/);
  });

  it('WS-PROV-AV-04 · Fake Avatar health = READY', async () => {
    const health = await fakeAvatarRegistration.health();
    expect(health.status).toBe('READY');
  });
});

describe('avatar-gateway · capability guardrails', () => {
  it('WS-PROV-AV-05 · empty descriptor defaults to UNKNOWN', () => {
    const d = emptyAvatarDescriptor('avatar.test_candidate', 'v0');
    expect(d.capabilities.renderer_type).toBe('UNKNOWN');
    expect(d.capabilities.realtime).toBe('UNKNOWN');
    expect(d.capabilities.identity_lock).toBe('UNKNOWN');
    expect(d.capabilities.supported_lipsync_strategies).toEqual([]);
    expect(d.commercial.evidence.evidence_refs).toEqual([]);
  });

  it('WS-PROV-AV-06 · REAL provider without evidence but claiming TRUE → throws', () => {
    const reg = new InMemoryAvatarProviderRegistry();
    const bad = emptyAvatarDescriptor('avatar.malicious_real', 'v0', 'REAL');
    bad.commercial.commercial_terms_reviewed = 'TRUE';
    expect(() =>
      reg.registerAvatar({
        descriptor: bad,
        factory: () => fakeAvatarRegistration.factory({}),
        health: fakeAvatarRegistration.health,
      }),
    ).toThrow(/no evidence_refs/);
  });

  it('WS-PROV-AV-07 · REAL provider with evidence_refs may claim TRUE', () => {
    const reg = new InMemoryAvatarProviderRegistry();
    const good = emptyAvatarDescriptor('avatar.valid_real', 'v0', 'REAL');
    good.commercial.commercial_terms_reviewed = 'TRUE';
    good.commercial.evidence.evidence_refs = ['https://official.example.com/avatar-doc'];
    expect(() =>
      reg.registerAvatar({
        descriptor: good,
        factory: () => fakeAvatarRegistration.factory({}),
        health: fakeAvatarRegistration.health,
      }),
    ).not.toThrow();
  });

  it('WS-PROV-AV-08 · assertAvatarUnknownIfNoEvidence idempotent', () => {
    const d = emptyAvatarDescriptor('avatar.pending', 'v0', 'REAL');
    expect(() => assertAvatarUnknownIfNoEvidence(d.provider_id, d.commercial)).not.toThrow();
  });
});

describe('avatar-gateway · shortlist seed', () => {
  it('WS-PROV-AV-09 · shortlist frozen and covers local + cloud', () => {
    expect(Object.isFrozen(AVATAR_SHORTLIST_SEED_IDS)).toBe(true);
    expect(AVATAR_SHORTLIST_SEED_IDS.length).toBeGreaterThanOrEqual(3);
    // 至少保留 1 条本地路线,避免完全云锁死
    expect(AVATAR_SHORTLIST_SEED_IDS.some((id) => id.includes('local'))).toBe(true);
    for (const id of AVATAR_SHORTLIST_SEED_IDS) {
      expect(id).toMatch(/^avatar\./);
    }
  });
});
