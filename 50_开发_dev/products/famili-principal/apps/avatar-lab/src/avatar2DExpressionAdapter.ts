/**
 * Avatar2D Expression Adapter (MM3)
 *
 * Maps canonical CharacterExpression to Avatar2D FamilyExpression.
 *
 * Adapter ensures:
 * 1. Exhaustiveness: every CharacterExpression has a mapping (compiler enforces)
 * 2. No silent fallback: unknown expression causes compile error
 * 3. Semantic preservation: mapping respects intent
 *
 * Example: LISTENING → CALM_WARM (active reception, open posture)
 */

import type { CharacterExpression } from '@family/fpai-multimodal-contracts';
import type { FamilyExpression } from './avatar2DRenderer';

/**
 * Exhaustiveness helper: compiler catches missing cases.
 */
function assertNever(x: never): never {
  throw new Error(`assertNever: unexpected value ${JSON.stringify(x)}`);
}

/**
 * Map canonical semantic expression to 2D renderer vocabulary.
 *
 * This is the ONLY place CharacterExpression converts to FamilyExpression.
 * All other code uses CharacterExpression and delegates mapping to this function.
 */
export function mapCharacterExpressionToFamilyExpression(
  expr: CharacterExpression['expression_id'],
): FamilyExpression {
  switch (expr) {
    // Warm, receptive, open posture
    case 'NEUTRAL_WARM':
      return 'CALM_WARM';

    // Active listening: fully present, engaged
    case 'LISTENING':
      return 'LISTENING';

    // Thoughtful, processing: open but reflective
    case 'THINKING':
      return 'THINKING';

    // Gentle positive reinforcement
    case 'SOFT_ENCOURAGING':
      return 'GENTLE_ENCOURAGING';

    // Kind but clear and firm
    case 'WARM_FIRM':
      return 'WARM_FIRM';

    // Serious/important matter
    case 'CALM_SERIOUS':
      return 'CALM_SERIOUS';

    // Empathy with concern (maps to seriousness + empathy signals)
    case 'CONCERNED_CALM':
      return 'CALM_SERIOUS';

    // Clear boundary setting (serious, authoritative)
    case 'BOUNDARY_CLEAR':
      return 'CALM_SERIOUS';

    default:
      // Compiler catches: if new expression_id is added to CharacterExpression,
      // this will fail at compile time until new case is added.
      return assertNever(expr);
  }
}

/**
 * Verify at runtime that all CharacterExpression values have mapping.
 *
 * Used in tests and initialization to catch accidental omissions.
 */
export function verifyExpressionMappingComplete(): void {
  const allCharacterExpressions: CharacterExpression['expression_id'][] = [
    'NEUTRAL_WARM',
    'LISTENING',
    'THINKING',
    'SOFT_ENCOURAGING',
    'WARM_FIRM',
    'CALM_SERIOUS',
    'CONCERNED_CALM',
    'BOUNDARY_CLEAR',
  ];

  for (const expr of allCharacterExpressions) {
    const mapped = mapCharacterExpressionToFamilyExpression(expr);
    if (!mapped) {
      throw new Error(`Missing mapping for CharacterExpression: ${expr}`);
    }
  }
}
