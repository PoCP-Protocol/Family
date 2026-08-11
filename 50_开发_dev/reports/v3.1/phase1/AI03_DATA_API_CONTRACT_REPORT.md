# V3.1 Phase 1B AI-03 Data / API / Contract Report

date: 2026-08-10
owner: AI-03 Data / Migration / OpenAPI / TS Contracts
depends_on: BARRIER-1, AI-01 semantic contracts

## Verdict

AI03_DATA_API_CONTRACT = PASS_PENDING_REAL_MIGRATION_RUN
OPENAPI_RUNTIME_ROUTE_ALIGNMENT = PASS
TS_CONTRACT_RUNTIME_ALIGNMENT = PASS
DATABASE_M2_SCHEMA_PRESENT = PASS_PENDING_CHAIN_RUN
BUSINESS_CODE_MODIFIED = NO
WAVE3_STARTED = NO

## Changes

Updated `specs/api/openapi-family-platform-v0.2.yaml` to align with the runtime Wave2 controller surface:

- `GET /families/{familyId}/growth/onboardings/{onboardingId}/priority`
- `POST /families/{familyId}/growth/onboardings/{onboardingId}/priority/confirm`
- `GET /families/{familyId}/growth/interventions/LISTEN_BEFORE_RESPOND`
- `POST /families/{familyId}/growth/onboardings/{onboardingId}/interventions/start`
- `GET /families/{familyId}/growth/onboardings/{onboardingId}/interventions/active`
- `GET /families/{familyId}/growth/actions/today`
- `POST /families/{familyId}/growth/actions/{actionId}/complete`

Replaced the stale non-runtime `/families/{familyId}/growth-priorities/confirm` path and stale request schema.

## Contract Boundaries

- `ConfirmGrowthPriorityRequest` now uses `draft_id` and `decision`, not legacy profile/rank payloads.
- `StartInterventionRequest` only accepts `priority_id` and `intervention_code`.
- `CompleteGrowthActionRequest` only accepts `completion_status`, `reflection`, and `occurred_at`.
- M2 response schemas preserve boundaries: priority is not profile/score, action is not outcome, reflection is raw material.

## Database Evidence

Migration `database/migrations/0008_m2_wave2_priority_intervention_action.sql` contains the M2 Wave2 additive schema for:

- `growth_priorities` onboarding/status/version/boundary fields and active priority uniqueness;
- `intervention_episodes` with exactly seven planned days;
- `INTERVENTION-001` seed;
- `growth_actions` Wave2 priority/episode/day/check-in/boundary fields.

AI-03 does not claim real migration-chain PASS. AI-05 must still run the full PostgreSQL migration chain and HTTP E2E.

## Validation

- `node -e` with `js-yaml`: PASS, OpenAPI parsed and Wave2 operationIds found.
- `pnpm --filter @family/contracts typecheck`: PASS.
- `git diff --check -- 50_开发_dev/specs/api/openapi-family-platform-v0.2.yaml 50_开发_dev/reports/v3.1/phase1/AI03_DATA_API_CONTRACT_REPORT.md`: PASS, only existing Windows LF-to-CRLF warning.

## Gate Statement

BARRIER-4 REAL SYSTEM = NOT_STARTED

AI-03 contract alignment is ready for AI-05 runtime validation.