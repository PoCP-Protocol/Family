/**
 * IdentityResolver.ts
 *
 * Runtime identity resolution layer.
 * Validates CharacterIdentity and produces RendererProfile.
 *
 * Part of FPAI-MM2: Runtime Identity Binding.
 */

import { CharacterIdentity, RendererProfile } from './characterIdentity';

/**
 * Resolves and validates CharacterIdentity at runtime.
 * Produces immutable RendererProfile for consumption by renderers.
 */
export class IdentityResolver {
  /**
   * Resolve a CharacterIdentity into a RendererProfile.
   *
   * Validates:
   * - Identity is valid and complete
   * - Version is recognized
   * - No cloning indicators present
   *
   * @param identity CharacterIdentity to resolve
   * @returns RendererProfile (immutable)
   * @throws Error if identity is invalid
   */
  public resolve(identity: CharacterIdentity): RendererProfile {
    this.validateIdentity(identity);

    return Object.freeze({
      character_id: 'famili-principal-v1',
      character_name: identity.character_name,
      identity_version: identity.version,
      visual_identity_version: 'visual_identity_v1.0',

      // Canonical asset references (would be populated from asset registry)
      canonical_face_asset_id: 'famili-principal-face-v1',
      canonical_body_asset_id: 'famili-principal-body-v1',
      canonical_portrait_asset_id: 'famili-principal-portrait-v1',

      // Identity constraints
      approved_visual_variants: [],
      visual_constraints: {
        age_impression_min: 30,
        age_impression_max: 35,
      },

      is_immutable: true,
    }) as RendererProfile;
  }

  /**
   * Validate that CharacterIdentity is complete and authorized.
   *
   * @throws Error with specific violation if invalid
   */
  private validateIdentity(identity: CharacterIdentity): void {
    if (!identity) {
      throw new Error('CharacterIdentity is required');
    }

    if (identity.version !== 'character_v1.0') {
      throw new Error(`Unsupported CharacterIdentity version: ${identity.version}`);
    }

    if (identity.character_name !== '法咪莉校长') {
      throw new Error(`Invalid character name: ${identity.character_name}`);
    }

    if (identity.ownership !== 'Family-owned IP') {
      throw new Error(`Invalid ownership: ${identity.ownership}`);
    }

    // Validate no cloning
    if (!identity.ip_alignment) {
      throw new Error('Missing ip_alignment in CharacterIdentity');
    }

    if (identity.ip_alignment.bobo_method_inheritance !== true) {
      throw new Error('Method inheritance flag is invalid');
    }

    if (identity.ip_alignment.bobo_identity_clone !== false) {
      throw new Error('Identity clone prohibition violated');
    }

    if (identity.ip_alignment.bobo_face_clone !== false) {
      throw new Error('Face clone prohibition violated');
    }

    if (identity.ip_alignment.bobo_voice_clone !== false) {
      throw new Error('Voice clone prohibition violated');
    }

    if (identity.ip_alignment.real_person_likeness_clone !== false) {
      throw new Error('Likeness clone prohibition violated');
    }

    // Validate visual DNA is complete
    if (!identity.visual_dna || identity.visual_dna.length !== 10) {
      throw new Error('Visual DNA must contain exactly 10 attributes');
    }

    const expectedDna: readonly string[] = [
      'INTELLECTUAL',
      'WARM',
      'TRUSTWORTHY',
      'NATURAL',
      'KIND',
      'CALM',
      'MATURE',
      'EMPATHETIC',
      'CULTURED',
      'NON_JUDGMENTAL',
    ];

    for (const attr of expectedDna) {
      if (!(identity.visual_dna as readonly string[]).includes(attr)) {
        throw new Error(`Missing visual DNA attribute: ${attr}`);
      }
    }
  }
}

/**
 * Singleton resolver instance.
 * Can be overridden for testing.
 */
let resolverInstance: IdentityResolver | null = null;

export function getIdentityResolver(): IdentityResolver {
  if (!resolverInstance) {
    resolverInstance = new IdentityResolver();
  }
  return resolverInstance;
}

export function setIdentityResolver(resolver: IdentityResolver): void {
  resolverInstance = resolver;
}

export function resetIdentityResolver(): void {
  resolverInstance = null;
}
