# AI-03 Contract / Data Handoff

status: CONTRACT_DATA_LOCAL_GATE_PASS
contract_version: M2_WAVE2_CF_V1
date: 2026-08-10

## Changed Files

- `packages/contracts/src/index.ts`
- `database/migrations/0008_m2_wave2_priority_intervention_action.sql`
- `apps/api/src/modules/family/confirm-growth-priority.dto.ts`
- `apps/api/src/modules/family/start-intervention.dto.ts`
- `apps/api/src/modules/family/complete-growth-action.dto.ts`

## Implemented

- Wave 2 shared contracts for GrowthPriority, priority draft, intervention card, intervention episode, growth action, and reflection boundary.
- DTO validators for `ConfirmGrowthPriority`, `StartIntervention`, and `CompleteGrowthAction`.
- Additive PostgreSQL migration for active primary priority, intervention episodes, seeded `INTERVENTION-001`, action status/reflection constraints, and required indexes.

## Not Implemented

- Priority business policy.
- Intervention eligibility policy.
- Controller/module/service wiring.
- Frontend.
- Integration/E2E tests.

## Tests

- PASS: `pnpm --dir "d:\Family\50_开发_dev" --filter @family/contracts build`
- PASS: `pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck`
- PASS: `pnpm --dir "d:\Family\50_开发_dev" db:migrate:status` recognized `0008_m2_wave2_priority_intervention_action.sql` as pending.
- NOT RUN: `db:migrate up`; AI-03 did not mutate the local database during contract/data skeleton handoff.

## Known Risks

- Existing `growth_actions.status` historically allowed `ASSIGNED`; migration allows both `ASSIGNED` and Wave 2 statuses for backward compatibility. Wave 2 service must create new actions as `PENDING`.
- Existing `growth_priorities.rank` is retained for compatibility but constrained to `1` for Wave 2 one-primary-priority semantics.

## Integration Hooks

- AI-00 must wire controller/module once AI-01/AI-02 services are ready.
- AI-01 consumes priority contracts and migration columns.
- AI-02 consumes intervention/action contracts and migration columns.

## Shared File Requests

- None.