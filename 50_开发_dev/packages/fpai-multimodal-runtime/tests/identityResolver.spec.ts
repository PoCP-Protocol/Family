/**
 * IdentityResolver Tests — MM2 Identity Runtime Validation
 *
 * Tests cover:
 * - Valid identity resolution (MM2-I01)
 * - Invalid identity rejection (MM2-I02)
 * - Runtime immutability enforcement (MM2-I03)
 * - Determinism (MM2-I04)
 * - Version validation (MM2-I05)
 * - Clone prohibition validation (MM2-I06)
 * - Source identity non-mutation (MM2-I07)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IdentityResolver, resetIdentityResolver } from '../src/identityResolver';
import type { CharacterIdentity } from '@family/fpai-multimodal-contracts';

describe('MM2: Identity Runtime Validation', () => {
  beforeEach(() => {
    resetIdentityResolver();
  });

  // MM2-I01: valid identity → valid RendererProfile
  it('MM2-I01 · valid CharacterIdentity → valid RendererProfile', () => {
    const resolver = new IdentityResolver();
    const identity: CharacterIdentity = {
      version: 'character_v1.0',
      frozen_date: '2026-08-17',
      character_name: '法咪莉校长',
      persona: '知性邻家姐姐',
      ownership: 'Family-owned IP',
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: false,
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    const profile = resolver.resolve(identity);

    expect(profile).toBeDefined();
    expect(profile.character_name).toBe('法咪莉校长');
    expect(profile.identity_version).toBe('character_v1.0');
    expect(profile.is_immutable).toBe(true);
    expect(profile.character_id).toBe('famili-principal-v1');
  });

  // MM2-I02: invalid identity → explicit rejection
  it('MM2-I02 · invalid CharacterIdentity version → explicit rejection', () => {
    const resolver = new IdentityResolver();

    const invalidIdentity = {
      version: 'character_v2.0', // Wrong version
      character_name: '法咪莉校长',
      ownership: 'Family-owned IP',
    } as any;

    expect(() => resolver.resolve(invalidIdentity)).toThrow(/Unsupported CharacterIdentity version/);
  });

  // MM2-I03: runtime immutability
  it('MM2-I03 · RendererProfile is immutable after resolution', () => {
    const resolver = new IdentityResolver();
    const identity: CharacterIdentity = {
      version: 'character_v1.0',
      frozen_date: '2026-08-17',
      character_name: '法咪莉校长',
      persona: '知性邻家姐姐',
      ownership: 'Family-owned IP',
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: false,
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    const profile = resolver.resolve(identity);

    // Attempt to mutate each critical field
    expect(() => {
      (profile as any).character_name = 'Different';
    }).toThrow();

    expect(() => {
      (profile as any).character_id = 'other-id';
    }).toThrow();

    expect(() => {
      (profile as any).identity_version = 'v2.0';
    }).toThrow();

    expect(() => {
      (profile as any).is_immutable = false;
    }).toThrow();

    // Verify immutability marker is set
    expect(Object.isFrozen(profile)).toBe(true);
  });

  // MM2-I04: determinism (same input → same output)
  it('MM2-I04 · same CharacterIdentity → deterministic RendererProfile', () => {
    const resolver = new IdentityResolver();
    const identity: CharacterIdentity = {
      version: 'character_v1.0',
      frozen_date: '2026-08-17',
      character_name: '法咪莉校长',
      persona: '知性邻家姐姐',
      ownership: 'Family-owned IP',
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: false,
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    const profile1 = resolver.resolve(identity);
    const profile2 = resolver.resolve(identity);

    // Critical fields must be identical
    expect(profile1.character_id).toBe(profile2.character_id);
    expect(profile1.identity_version).toBe(profile2.identity_version);
    expect(profile1.visual_identity_version).toBe(profile2.visual_identity_version);
    expect(profile1.character_name).toBe(profile2.character_name);
  });

  // MM2-I05: version validation
  it('MM2-I05 · unsupported identity version → explicit rejection', () => {
    const resolver = new IdentityResolver();

    const v2Identity = {
      version: 'character_v2.0',
      character_name: '法咪莉校长',
      ownership: 'Family-owned IP',
    } as any;

    expect(() => resolver.resolve(v2Identity)).toThrow(/Unsupported CharacterIdentity version/);
  });

  it('MM2-I05 · invalid character name → rejection', () => {
    const resolver = new IdentityResolver();

    const wrongNameIdentity = {
      version: 'character_v1.0',
      character_name: 'WrongName', // Not 法咪莉校长
      ownership: 'Family-owned IP',
    } as any;

    expect(() => resolver.resolve(wrongNameIdentity)).toThrow(/Invalid character name/);
  });

  // MM2-I06: clone prohibition validation
  it('MM2-I06 · clone prohibition violation → rejection', () => {
    const resolver = new IdentityResolver();

    const cloneViolationIdentity: any = {
      version: 'character_v1.0',
      frozen_date: '2026-08-17',
      character_name: '法咪莉校长',
      persona: '知性邻家姐姐',
      ownership: 'Family-owned IP',
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: true, // ❌ VIOLATION
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    expect(() => resolver.resolve(cloneViolationIdentity)).toThrow(/Face clone prohibition violated/);
  });

  it('MM2-I06 · identity clone violation → rejection', () => {
    const resolver = new IdentityResolver();

    const identity: any = {
      version: 'character_v1.0',
      character_name: '法咪莉校长',
      ownership: 'Family-owned IP',
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: true, // ❌ VIOLATION
        bobo_face_clone: false,
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    expect(() => resolver.resolve(identity)).toThrow(/Identity clone prohibition violated/);
  });

  it('MM2-I06 · voice clone violation → rejection', () => {
    const resolver = new IdentityResolver();

    const identity: any = {
      version: 'character_v1.0',
      character_name: '法咪莉校长',
      ownership: 'Family-owned IP',
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: false,
        bobo_voice_clone: true, // ❌ VIOLATION
        real_person_likeness_clone: false,
      },
    };

    expect(() => resolver.resolve(identity)).toThrow(/Voice clone prohibition violated/);
  });

  // MM2-I07: source identity non-mutation
  it('MM2-I07 · source CharacterIdentity not mutated by resolution', () => {
    const resolver = new IdentityResolver();
    const identity: CharacterIdentity = {
      version: 'character_v1.0',
      frozen_date: '2026-08-17',
      character_name: '法咪莉校长',
      persona: '知性邻家姐姐',
      ownership: 'Family-owned IP',
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: false,
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    const originalName = identity.character_name;
    const originalVersion = identity.version;

    resolver.resolve(identity);

    // Source must remain unchanged
    expect(identity.character_name).toBe(originalName);
    expect(identity.version).toBe(originalVersion);
  });

  // Additional: missing visual DNA
  it('MM2-I06 · incomplete visual DNA → rejection', () => {
    const resolver = new IdentityResolver();

    const incompleteIdentity: any = {
      version: 'character_v1.0',
      character_name: '法咪莉校长',
      ownership: 'Family-owned IP',
      visual_dna: ['INTELLECTUAL', 'WARM'], // Only 2, need 10
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: false,
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    expect(() => resolver.resolve(incompleteIdentity)).toThrow(/Visual DNA must contain exactly 10 attributes/);
  });

  // Additional: missing required fields
  it('MM2-I02 · missing ownership → rejection', () => {
    const resolver = new IdentityResolver();

    const identity: any = {
      version: 'character_v1.0',
      character_name: '法咪莉校长',
      // ownership: missing
      visual_dna: [
        'INTELLECTUAL', 'WARM', 'TRUSTWORTHY', 'NATURAL', 'KIND',
        'CALM', 'MATURE', 'EMPATHETIC', 'CULTURED', 'NON_JUDGMENTAL',
      ],
      ip_alignment: {
        bobo_method_inheritance: true,
        bobo_identity_clone: false,
        bobo_face_clone: false,
        bobo_voice_clone: false,
        real_person_likeness_clone: false,
      },
    };

    expect(() => resolver.resolve(identity)).toThrow(/Invalid ownership/);
  });
});
