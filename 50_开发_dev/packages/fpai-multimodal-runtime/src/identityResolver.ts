/**
 * IdentityResolver.ts
 *
 * Runtime identity resolution layer (FPAI-MM2 Runtime Component).
 * Validates CharacterIdentity and produces RendererProfile.
 *
 * Part of FPAI-MM2: Runtime Identity Binding.
 * Lives in @family/fpai-multimodal-runtime (runtime execution, not contracts).
 */

import { CharacterIdentity, RendererProfile } from '@family/fpai-multimodal-contracts';

/**
 * Resolves and validates CharacterIdentity at runtime.
 * Produces immutable RendererProfile for consumption by renderers.
 *
 * FAMILI-SPECIFIC: This resolver is currently hardcoded for 法咪莉校长.
 * Future: May generalize for multi-character scenarios if architecture review approves.
 */
export class IdentityResolver {
  /**
   * Resolve a CharacterIdentity into a RendererProfile.
   *
   * Validates:
   * - Identity is valid and complete
   * - Version is recognized
   * - No cloning indicators present
   * - Visual DNA is complete
   *
   * @param identity CharacterIdentity to resolve
   * @returns RendererProfile (immutable, frozen)
   * @throws Error if identity is invalid
   */
  public resolve(identity: CharacterIdentity): RendererProfile {
    this.validateIdentity(identity);

    // Produce immutable RendererProfile
    return Object.freeze({
      character_id: 'famili-principal-v1',
      character_name: identity.character_name,
      identity_version: identity.version,
      visual_identity_version: 'visual_identity_v1.0',

      // Canonical asset references (would be populated from asset registry when available)
      canonical_face_asset_id: 'famili-principal-face-v1',
      canonical_body_asset_id: 'famili-principal-body-v1',
      canonical_portrait_asset_id: 'famili-principal-portrait-v1',

      // Identity constraints (renderer must respect these)
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
   * @param identity CharacterIdentity to validate
   * @throws Error with specific violation message if invalid
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

    // Validate IP alignment (clone prohibitions)
    if (!identity.ip_alignment) {
      throw new Error('Missing ip_alignment in CharacterIdentity');
    }

    if (identity.ip_alignment.bobo_method_inheritance !== true) {
      throw new Error('Method inheritance flag must be true');
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

    // Validate visual DNA is complete (10 required attributes)
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

    // Source identity mutation check: verify passed identity wasn't modified during validation
    // (This is a defensive check; pure validation should not mutate)
    if (!identity.character_name || identity.character_name !== '法咪莉校长') {
      throw new Error('Source CharacterIdentity was mutated during resolution');
    }
  }
}

/**
 * Singleton resolver instance for Famili.
 * Can be overridden for testing via setIdentityResolver().
 *
 * NOTE: This singleton pattern is TEMPORARY and specific to Famili's current
 * single-character architecture. Future multi-character support may require
 * stateless function-based approach or dependency injection.
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
