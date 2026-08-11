import type { CompleteGrowthActionRequest, GrowthActionStatus, ReflectionBoundary } from '@family/contracts';

export const REFLECTION_BOUNDARY: ReflectionBoundary = 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME';
export const COMPLETABLE_GROWTH_ACTION_STATUSES: ReadonlyArray<Exclude<GrowthActionStatus, 'PENDING'>> = [
  'COMPLETED',
  'PARTIAL',
  'NOT_COMPLETED',
];

export function assertCompletableGrowthActionStatus(status: CompleteGrowthActionRequest['completion_status']): void {
  if (!COMPLETABLE_GROWTH_ACTION_STATUSES.includes(status)) {
    throw new Error('growth_action_completion_status_invalid');
  }
}