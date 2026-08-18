/**
 * CharacterIdentityContract.ts (Re-export)
 *
 * ⚠️ DEPRECATED: This file is maintained for backward compatibility only.
 * The authoritative machine contract has moved to:
 * @family/fpai-multimodal-contracts/src/characterIdentity.ts
 *
 * MACHINE CONTRACT AUTHORITY:
 * packages/fpai-multimodal-contracts/src/characterIdentity.ts
 *
 * This file re-exports the contracts from the package.
 * All new code should import directly from @family/fpai-multimodal-contracts.
 */

export {
  CharacterIdentity,
  CharacterPose,
  CharacterExpression,
  CharacterGaze,
  CharacterGesture,
  CharacterWardrobe,
  CharacterScene,
  CharacterState,
  AvatarRendererContract,
  isCharacterIdentity,
  isCharacterStateValid,
} from '@family/fpai-multimodal-contracts';
