# M2-101 — Start Growth Onboarding

status: COMPLETED
approved_at: 2026-08-10
approved_by: user_auto_continue_request
phase: M2 Wave 1 Understand
implementation_started: YES
completed_at: 2026-08-10

## Objective

Create the M2 onboarding entry point for the fixed 12-15 parent-child communication conflict slice.

This task is the first implementation task after `M2-000_FIRST_GROWTH_SLICE_DEFINITION` passed the V3.0 Contract Gate with `BLOCKERS=0` and `READY_FOR_M2_WAVE1=YES`.

## Scenario Boundary

- LifeStage: `EARLY_ADOLESCENCE_12_15`.
- Relationship context: parent-child communication conflict.
- Dimensions: `P03`, `R03`, `R04`, `R05`.
- First frontend target: Family Web / Responsive Web only.
- M2 delivery shape: `Domain Contract + API + Frontend + E2E + Demo`.

## Must Implement

- `StartGrowthOnboarding` Named Action.
- M1 aggregate precondition checks.
- Consent gate for `SERVICE`, `ASSESSMENT`, and `GROWTH_TRACKING`.
- Safety screening result field.
- Audit, outbox, and idempotency following the M1 Family Core reference pattern.
- Family Web F01 Family Home entry surface.
- Family Web F02 Growth Onboarding start path.
- Browser E2E demo path from Family Home to onboarding start.

## Must Not Implement

- AI personalization.
- GrowthProfile generation.
- GrowthPriority confirmation.
- Intervention assignment.
- GrowthAction, GrowthEvent, Milestone, Outcome, or GrowthReview.
- Native App.
- Mini Program.
- Agent Platform.
- World Model or Causal Engine.

## Acceptance

- Backend exposes a single StartGrowthOnboarding API path for the approved slice.
- Onboarding creation fails if the M1 family aggregate prerequisites are not met.
- Onboarding creation fails unless active `SERVICE`, `ASSESSMENT`, and `GROWTH_TRACKING` consent exist for the child subject.
- Missing `AI_PERSONALIZATION` consent does not block onboarding and results in AI disabled for this step.
- The write path is idempotent and creates audit + outbox records.
- F01/F02 web path can be exercised by an automated browser test or demo check.
- No M2-102+ domain behavior is implemented in this task.

## Completion Evidence

- Backend contracts, DTO validation, controller route, service write path, audit/outbox/idempotency, and growth event persistence implemented for `StartGrowthOnboarding` only.
- Family Web / Responsive Web F01 Family Home and F02 Growth Onboarding implemented in `apps/web`.
- HTTP E2E passed for `E2E-M2-101 starts growth onboarding through real HTTP without AI consent`.
- Web typecheck and F01/F02 unit tests passed.
- Browser demo path passed: Family Home -> Start onboarding -> Started, with no AI personalization payload.

## Reference Artifacts

- `reports/m2/M2_000_VERTICAL_SLICE_DEFINITION.md`
- `reports/m2/M2_000_GATE.md`
- `reports/m2/M2_IMPLEMENTATION_BACKLOG.md`
- `reports/m2/M2_FRONTEND_BACKEND_CONTRACT_MATRIX.md`
- `reports/m2/proposed-contracts/growth-onboarding.schema.yaml`
- `reports/m2/proposed-contracts/named-actions.yaml`