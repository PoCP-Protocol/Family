/**
 * MM1-B1 · VisemeMapper tests
 */
import { describe, expect, it } from 'vitest';
import {
  AZURE_VISEME_TO_FAMILY,
  mapAzureVisemeToFamily,
  DEFAULT_MOUTH_SHAPE,
  type FamilyMouthShape,
} from './visemeMapper';

describe('mm1-b1 · VisemeMapper', () => {
  it('VM-01 · 表长度恰好 22 (SAPI 0..21)', () => {
    expect(AZURE_VISEME_TO_FAMILY.length).toBe(22);
  });

  it('VM-02 · viseme 0 (silence) → REST', () => {
    const f = mapAzureVisemeToFamily(0, 0n, 't1');
    expect(f.shape).toBe('REST');
  });

  it('VM-03 · viseme 21 (p,b,m) → CLOSED', () => {
    const f = mapAzureVisemeToFamily(21, 0, 't1');
    expect(f.shape).toBe('CLOSED');
  });

  it('VM-04 · viseme 2 (aa) → OPEN_WIDE (open mouth)', () => {
    const f = mapAzureVisemeToFamily(2, 0, 't1');
    expect(f.shape).toBe('OPEN_WIDE');
  });

  it('VM-05 · audioOffset 100ns ticks → ms', () => {
    // 5_000_000 ticks = 500 ms
    const f = mapAzureVisemeToFamily(1, 5_000_000, 't1');
    expect(f.audio_offset_ms).toBe(500);
  });

  it('VM-06 · bigint audioOffset 也接受', () => {
    const f = mapAzureVisemeToFamily(1, 10_000_000n, 't1');
    expect(f.audio_offset_ms).toBe(1000);
  });

  it('VM-07 · 越界 viseme id 被 clamp,不 throw', () => {
    const low = mapAzureVisemeToFamily(-3, 0, 't1');
    const high = mapAzureVisemeToFamily(99, 0, 't1');
    expect(low.shape).toBe(AZURE_VISEME_TO_FAMILY[0]);
    expect(high.shape).toBe(AZURE_VISEME_TO_FAMILY[21]);
  });

  it('VM-08 · 每一项都是合法 FamilyMouthShape', () => {
    const allowed: FamilyMouthShape[] = [
      'REST',
      'OPEN_SMALL',
      'OPEN_MEDIUM',
      'OPEN_WIDE',
      'ROUND',
      'NARROW',
      'SMILE_SPEECH',
      'CLOSED',
    ];
    for (const s of AZURE_VISEME_TO_FAMILY) {
      expect(allowed).toContain(s);
    }
  });

  it('VM-09 · turn_id 透传', () => {
    const f = mapAzureVisemeToFamily(1, 0, 'turn-xyz-42');
    expect(f.turn_id).toBe('turn-xyz-42');
  });

  it('VM-10 · duration_ms 可选透传', () => {
    const f = mapAzureVisemeToFamily(1, 0, 't', 80);
    expect(f.duration_ms).toBe(80);
    const g = mapAzureVisemeToFamily(1, 0, 't');
    expect(g.duration_ms).toBeUndefined();
  });

  it('VM-11 · DEFAULT_MOUTH_SHAPE 为 REST', () => {
    expect(DEFAULT_MOUTH_SHAPE).toBe('REST');
  });
});
