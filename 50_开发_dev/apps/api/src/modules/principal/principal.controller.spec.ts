import { describe, expect, it } from 'vitest';
import { PrincipalController } from './principal.controller';

describe('PrincipalController consumer identity bridge', () => {
  function createController(resolveActor: (token: string) => Promise<unknown>) {
    return new PrincipalController({} as any, { resolveActor } as any);
  }

  it('rejects x-actor-id-only consumer access even when the caller supplies an actor string', async () => {
    const controller = createController(async () => null);
    await expect((controller as any).resolveConsumerActor('family-1', undefined, 'legacy-actor')).rejects.toThrow('bearer_token_required');
  });

  it('rejects an invalid or expired bearer session', async () => {
    const controller = createController(async () => null);
    await expect((controller as any).resolveConsumerActor('family-1', 'Bearer expired-token')).rejects.toThrow('invalid_or_expired_token');
  });

  it('rejects a valid account session scoped to a different family', async () => {
    const controller = createController(async () => ({ personId: 'person-1', familyId: 'family-other' }));
    await expect((controller as any).resolveConsumerActor('family-1', 'Bearer valid-token')).rejects.toThrow('actor_family_mismatch');
  });

  it('accepts only the resolved person from the bearer session in the requested family scope', async () => {
    const controller = createController(async () => ({ personId: 'person-1', familyId: 'family-1' }));
    await expect((controller as any).resolveConsumerActor('family-1', 'Bearer valid-token')).resolves.toBe('person-1');
  });
});
