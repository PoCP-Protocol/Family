# M2-105 Implementation Plan — Intervention-001 + GrowthAction

status: LOCAL_GATE_PASS
owner: AI-02
contract_baseline: M2_WAVE2_CF_V1
phase: M2_WAVE_2_DECIDE_AND_ACT / PHASE_B_PARALLEL_IMPLEMENTATION

## 1. Scope

M2-105 implements the deterministic backend domain slice for `StartIntervention` and `CompleteGrowthAction`.

Intervention-001 is a seven-day behavioral practice plan. It is not course content, AI coaching, diagnosis, treatment, outcome, milestone, score, or growth review.

This task owns only:

- `apps/api/src/modules/family/intervention.policy.ts`
- `apps/api/src/modules/family/intervention.service.ts`
- `apps/api/src/modules/family/intervention.service.spec.ts`
- `apps/api/src/modules/family/growth-action.policy.ts`
- `apps/api/src/modules/family/growth-action.service.ts`
- `apps/api/src/modules/family/growth-action.service.spec.ts`
- `reports/m2/task-105/M2_105_IMPLEMENTATION_PLAN.md`

This task does not edit frozen contract files, DTO validators, database migrations, `family.controller.ts`, `family.module.ts`, or `family.service.ts`. AI-00 owns route/module integration.

## 2. Contract Rules

The implementation must preserve these rules:

- The only allowed intervention is `LISTEN_BEFORE_RESPOND` / `INTERVENTION-001`.
- `StartIntervention` requires an active confirmed GrowthPriority; `NO_PRIORITY_YET` cannot start an intervention.
- Starting an intervention must create one active intervention episode and exactly seven Day 1-7 `GrowthAction` assignments.
- New actions use `PENDING`, not legacy `ASSIGNED`.
- `CompleteGrowthAction` allows only `COMPLETED`, `PARTIAL`, or `NOT_COMPLETED`.
- Reflection is raw material only and must carry `REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME` when stored.
- Action completion must not update GrowthProfile, GrowthPriority state, Outcome, Milestone, GrowthReview, AI recommendation, causal episode, or world model.

## 3. Preconditions

`StartIntervention` must recheck at action time:

- idempotency key and request hash
- family exists
- actor has family access
- active onboarding matches request
- required growth consents are still granted
- requested intervention code is exactly `LISTEN_BEFORE_RESPOND`
- active priority exists for family/onboarding/priority id
- priority points to an eligible confirmed profile dimension `P03/R03/R04/R05`
- no active intervention episode already exists for the same family/onboarding

`CompleteGrowthAction` must recheck at action time:

- idempotency key and request hash
- family exists
- actor has family access
- action belongs to family
- action belongs to an active intervention episode
- required growth consents are still granted for the onboarding child
- requested completion status is `COMPLETED`, `PARTIAL`, or `NOT_COMPLETED`

## 4. Deterministic Action Arc

`LISTEN_BEFORE_RESPOND` generates exactly these seven Chinese assignments:

1. 停顿三秒,让孩子把话说完,今天不急着给建议。
2. 先复述你听到的意思,再表达自己的看法。
3. 在提出解决办法前,先问一个澄清问题。
4. 先说出你观察到的感受,不评价对错。
5. 把倾听和纠正分开,今天先完成倾听。
6. 选一个没听好的时刻,补一句“我刚才没有听完,你愿意再说一遍吗?”
7. 回看这七天的练习感受,不判断有没有改善。

These are behavior assignments only.

## 5. Validation Plan

Local AI-02 gates:

1. `get_errors` on this plan after creation.
2. `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck` after TypeScript implementation.
3. `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- intervention.service.spec.ts growth-action.service.spec.ts` after unit tests.

Integration route/API validation is AI-00/AI-05 work after wiring.

## 6. Local Gate Result

PASS on 2026-08-10.

- `get_errors` on this plan: PASS
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- intervention.service.spec.ts growth-action.service.spec.ts`: PASS, 2 files / 5 tests
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck`: PASS

Implemented files:

- `apps/api/src/modules/family/intervention.policy.ts`
- `apps/api/src/modules/family/intervention.service.ts`
- `apps/api/src/modules/family/intervention.service.spec.ts`
- `apps/api/src/modules/family/growth-action.policy.ts`
- `apps/api/src/modules/family/growth-action.service.ts`
- `apps/api/src/modules/family/growth-action.service.spec.ts`

## 7. Handoff Notes

For AI-00 integration:

- Wire `InterventionService` and `GrowthActionService` through `family.module.ts` / `family.controller.ts` only in AI-00 scope.
- Keep DTO validation owned by AI-03 validators before calling these services.
- These services derive consent subject from the active priority's confirmed profile, not from `growth_journeys.subject_person_id`, because the current `growth_journeys` table does not define that column.

For AI-05 validation:

- Verify `StartIntervention` creates exactly one `intervention_episodes` row and exactly seven Wave2 `growth_actions` rows with `PENDING` status.
- Verify `CompleteGrowthAction` updates only action completion/reflection fields and does not write GrowthProfile, Outcome, Milestone, GrowthReview, AI, or causal state.
