/**
 * MM1-B1.1 · Avatar Composition Root tests (§J)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';
import { buildAvatarComposition } from './avatarCompositionRoot';

describe('mm1-b1.1 · avatarCompositionRoot (§J)', () => {
  it('AVATAR-COMP-01 · 默认 → FAMILY_LOCAL_2D', () => {
    const r = buildAvatarComposition({ env: {} as any });
    expect(r.mode).toBe('FAMILY_LOCAL_2D');
    expect(r.provider_id).toBe('avatar.family_local_2d');
    expect(r.telemetry.IDENTITY_LOCK).toBe('TRUE');
    expect(r.avatar).toBeTruthy();
  });

  it('AVATAR-COMP-02 · FPAI_AVATAR_PROVIDER=FAKE → Fake', () => {
    const r = buildAvatarComposition({ env: { FPAI_AVATAR_PROVIDER: 'FAKE' } as any });
    expect(r.mode).toBe('FAKE');
    expect(r.provider_id).toBe('avatar.fake');
    expect(r.telemetry.IDENTITY_LOCK).toBe('FALSE');
  });

  it('AVATAR-COMP-03 · 未知 provider → BLOCKED_UNSUPPORTED', () => {
    const r = buildAvatarComposition({ env: { FPAI_AVATAR_PROVIDER: 'HEYGEN_HQ' } as any });
    expect(r.mode).toBe('BLOCKED_UNSUPPORTED');
    expect(r.avatar).toBeNull();
  });

  it('AVATAR-COMP-04 · registry 命名 avatar.fake_baseline → FAKE (兼容)', () => {
    const r = buildAvatarComposition({ env: { FPAI_AVATAR_PROVIDER: 'avatar.fake_baseline' } as any });
    expect(r.mode).toBe('FAKE');
  });

  it('AVATAR-COMP-05 · registry 命名 avatar.family_local_2d → FAMILY_LOCAL_2D (兼容)', () => {
    const r = buildAvatarComposition({ env: { FPAI_AVATAR_PROVIDER: 'avatar.family_local_2d' } as any });
    expect(r.mode).toBe('FAMILY_LOCAL_2D');
  });
});
