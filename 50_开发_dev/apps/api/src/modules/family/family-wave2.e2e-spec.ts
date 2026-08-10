import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerSource = readFileSync(join(__dirname, 'family.controller.ts'), 'utf8');

const requiredWave2HttpRoutes = [
  ':familyId/growth/onboardings/:onboardingId/priority',
  ':familyId/growth/onboardings/:onboardingId/priority/confirm',
  ':familyId/growth/interventions/LISTEN_BEFORE_RESPOND',
  ':familyId/growth/onboardings/:onboardingId/interventions/start',
  ':familyId/growth/onboardings/:onboardingId/interventions/active',
  ':familyId/growth/actions/today',
  ':familyId/growth/actions/:actionId/complete',
] as const;

const missingWave2HttpRoutes = requiredWave2HttpRoutes.filter((route) => !controllerSource.includes(route));

describe('M2 Wave2 HTTP E2E readiness', () => {
  it('PENDING_API_INTEGRATION: Wave2 HTTP routes are not fully integrated yet', () => {
    expect(missingWave2HttpRoutes, [
      'PENDING_API_INTEGRATION',
      'AI-05 cannot execute final Wave2 HTTP E2E until AI-00 wires controller routes to Named Actions.',
      `missing_routes=${missingWave2HttpRoutes.join(',')}`,
    ].join('\n')).not.toHaveLength(0);
  });

  it.todo('E2E-W2-01 profile -> priority draft through real HTTP and PostgreSQL');
  it.todo('E2E-W2-02 ConfirmGrowthPriority creates active priority only through Named Action');
  it.todo('E2E-W2-03 NO_PRIORITY_YET path does not create hidden priority state');
  it.todo('E2E-W2-04 stale priority confirmation is rejected');
  it.todo('E2E-W2-05 StartIntervention starts LISTEN_BEFORE_RESPOND only through Named Action');
  it.todo('E2E-W2-06 StartIntervention creates exactly seven GrowthAction assignments');
  it.todo('E2E-W2-07 get today action returns one pending daily assignment');
  it.todo('E2E-W2-08 CompleteGrowthAction updates status without outcome or milestone');
  it.todo('E2E-W2-09 reflection is persisted as raw material with boundary language');
  it.todo('E2E-W2-10 idempotency replay returns the original Named Action response');
  it.todo('E2E-W2-11 idempotency conflict rejects changed payload');
  it.todo('E2E-W2-12 revoked or missing consent blocks priority/intervention/action flow');
  it.todo('E2E-W2-13 safety escalation blocks normal Wave2 continuation');
  it.todo('E2E-W2-14 Wave2 flow creates no Outcome side effect');
  it.todo('E2E-W2-15 Wave2 flow creates no AI, LLM, Model Gateway, Agent, Causal, or World Model side effect');
});