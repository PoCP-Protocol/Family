import { ForbiddenException } from '@nestjs/common';
import type pg from 'pg';

const GROWTH_ONBOARDING_STARTED_EVENT = 'GrowthOnboardingStarted';

export async function assertNormalSafetyRoute(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<void> {
  const onboarding = await client.query<{ severity: string | null; disposition: string | null }>(
    `select payload->'safety_disposition'->>'severity' as severity,
            payload->'safety_disposition'->>'disposition' as disposition
     from growth_events
     where family_id = $1
       and event_type = $2
       and payload->>'onboarding_id' = $3
     order by occurred_at desc
     limit 1
     for share`,
    [familyId, GROWTH_ONBOARDING_STARTED_EVENT, onboardingId],
  );
  if (onboarding.rowCount !== 1 || onboarding.rows[0].severity !== 'LOW' || onboarding.rows[0].disposition !== 'NORMAL') {
    throw new ForbiddenException('normal_safety_route_not_verified');
  }

  const nonNormalPerspective = await client.query(
    `select perspective_id
     from perspectives
     where family_id = $1
       and onboarding_id = $2
       and (
         safety_disposition = '{}'::jsonb
         or safety_disposition->>'disposition' <> 'NORMAL'
         or safety_disposition->>'severity' <> 'LOW'
       )
     limit 1
     for share`,
    [familyId, onboardingId],
  );
  if (nonNormalPerspective.rowCount && nonNormalPerspective.rowCount > 0) {
    throw new ForbiddenException('normal_safety_route_not_verified');
  }
}