# M2-104 Implementation Plan — GrowthPriority

status: LOCAL_GATE_PASS
owner: AI-01
contract_baseline: M2_WAVE2_CF_V1
phase: M2_WAVE_2_DECIDE_AND_ACT / PHASE_B_PARALLEL_IMPLEMENTATION

## 1. Scope

M2-104 implements deterministic GrowthPriority proposal and confirmation as a focused backend slice.

GrowthPriority is a human-confirmed practice focus for the next growth step. It is not a fact, diagnosis, score, ranking, AI recommendation, milestone, outcome, or profile update.

This task owns only:

- `apps/api/src/modules/family/growth-priority.policy.ts`
- `apps/api/src/modules/family/growth-priority.service.ts`
- `apps/api/src/modules/family/growth-priority.service.spec.ts`
- `reports/m2/task-104/M2_104_IMPLEMENTATION_PLAN.md`

This task does not edit frozen contract files, `family.controller.ts`, `family.module.ts`, or `family.service.ts`. Route/module wiring remains AI-00 integration work.

## 2. Contract Rules

The implementation must preserve these rules from the frozen baseline:

- Allowed dimensions only: `P03`, `R03`, `R04`, `R05`.
- Policy version: `M2_104_DETERMINISTIC_V1`.
- A proposal may return `NO_PRIORITY_YET` when confirmed profile evidence is insufficient or stale.
- Confirmation writes at most one active primary priority per family/onboarding.
- Confirmation of a concrete dimension supersedes any previous active priority for the same family/onboarding.
- Confirmation of `NO_PRIORITY_YET` records the decision without creating a hidden active practice target.
- Priority selection must not compute or expose score, rank, percentile, diagnosis, or family comparison.
- Evidence can support a priority decision, but evidence is not the priority and not a profile.
- Profile can support a priority decision, but profile is not the priority.

## 3. Data Anchors

GrowthPriority must anchor to confirmed `growth_profiles`, not `growth_profile_drafts`.

The service will read:

- active M2 onboarding from `growth_journeys`
- confirmed/current `growth_profiles`
- profile dimensions from `growth_profile_dimensions`
- active priority state from `growth_priorities`
- intervention conflict state from `intervention_episodes`
- consent state from `consents`
- family membership/relationship state as needed for actor and guardian checks

The service will write:

- `growth_priorities`
- `audit_logs`
- `outbox_events`
- `idempotency_keys`

## 4. Deterministic Proposal Policy

The policy will produce a limited proposal object:

- `status`: `READY` or `NO_PRIORITY_YET`
- `policy_version`: `M2_104_DETERMINISTIC_V1`
- candidate dimensions drawn only from confirmed profile dimensions in `P03/R03/R04/R05`
- reason codes and limitations that explain why a dimension is eligible or why no priority is available

The deterministic tie-break order is fixed and non-ranking:

1. prefer dimensions with `candidate_state = DEVELOPING`
2. then `EMERGING`
3. then `PRACTICING`
4. then `UNRESOLVED`
5. then stable dimension order `P03`, `R03`, `R04`, `R05`

The tie-break order is an implementation rule for stable deterministic selection. It must not be exposed as a score or ranking.

## 5. Confirmation Preconditions

`ConfirmGrowthPriority` must recheck at action time:

- idempotency key and request hash
- family exists
- actor has family access
- required growth consents are still granted
- active onboarding exists for the provided onboarding id
- confirmed profile exists and is current enough for the onboarding context
- requested decision is `NO_PRIORITY_YET` or an eligible candidate dimension from the deterministic proposal
- no active intervention episode conflicts with changing the active priority

If any precondition fails, the service must fail before writing priority state.

## 6. Output Boundary

Responses must return only bounded decision support data:

- priority id when an active priority is created
- selected decision or `NO_PRIORITY_YET`
- policy version
- eligibility/reason/limitation fields
- audit metadata

Responses must not include hidden score fields, family ranking, diagnosis, outcome claims, or AI-generated recommendation text.

## 7. Validation Plan

Local AI-01 gates:

1. `get_errors` on the implementation plan after creation.
2. `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck` after TypeScript implementation.
3. `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- growth-priority.service.spec.ts` after unit tests.

Integration route/API validation is AI-00/AI-05 work after wiring.

## 8. AI-01 Local Result

Implemented files:

- `apps/api/src/modules/family/growth-priority.policy.ts`
- `apps/api/src/modules/family/growth-priority.service.ts`
- `apps/api/src/modules/family/growth-priority.service.spec.ts`

Validation results:

- `get_errors` on this plan: PASS
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- growth-priority.service.spec.ts`: PASS, 5 tests
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck`: PASS

Handoff to AI-00:

- Wire `GrowthPriorityService` into `family.module.ts`.
- Expose read insight and `ConfirmGrowthPriority` route from controller/service integration layer.
- Keep DTO validator ownership from AI-03 and route wiring ownership from AI-00.

Handoff to AI-02:

- `StartIntervention` may depend on active priority from `growth_priorities` where `status = 'ACTIVE'`.
- Do not treat priority as outcome, diagnosis, score, or recommendation.
