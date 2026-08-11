import { FES_M1_ENTITY_KINDS, FES_M1_EVENTS, FES_SEMANTIC_BOUNDARIES } from '@family/fes-contracts';
import { AI_GATEWAY_POLICY } from '@family/ai-gateway';

export const fesApiBoundary = {
  application: 'FES',
  kind: 'AI Native education business operations system',
  deployment_model: 'modular_monolith_first',
  database_owner: 'fes-api',
  family_core_dependency: 'forbidden',
  m1_entities: FES_M1_ENTITY_KINDS,
  m1_events: FES_M1_EVENTS,
  semantic_boundaries: FES_SEMANTIC_BOUNDARIES,
  ai_gateway_policy: AI_GATEWAY_POLICY,
} as const;

export function getFesHealth() {
  return {
    status: 'ok',
    boundary: 'fes-api',
    ready_for_m1_implementation: true,
  } as const;
}

if (require.main === module) {
  console.log(JSON.stringify(getFesHealth()));
}
