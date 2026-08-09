# TASK-101H Test Environment Report

status: PASS
date: 2026-08-09

## Diagnosis

Root `pnpm test` previously called Turbo `test`, while API `test` ran `vitest run`. The integration spec selected `describe.skip` when `DATABASE_URL` was absent. Turbo did not declare DB env propagation, so aggregate test could go green while DB integration was skipped.

## Fix

- Root scripts now define `test:unit`, `test:integration`, `test:e2e`, and `test:required`.
- API scripts run separate Vitest configs for unit, integration, and e2e.
- Turbo tasks for integration/e2e/required explicitly declare `TEST_DATABASE_URL` in `env`.
- Required DB tests read `TEST_DATABASE_URL`, map it to app-local `DATABASE_URL`, and fail fast when missing.
- `pnpm test` is now unit-only and is not the DoD-L1 gate.
- DoD-L1 authoritative command is `pnpm test:required`.

## Validation

- Positive aggregate: `TEST_DATABASE_URL=postgres://family:***@localhost:55433/family_gate pnpm test:required` PASS.
- Negative no-skip check: `pnpm --filter @family/api test:integration` without `TEST_DATABASE_URL` FAILS with `TEST_DATABASE_URL is required for integration/e2e tests; required DB tests must not silently skip`.

## Secret Policy

- Reports mask DB password as `***`.
- `.env.example` contains local-only sample credentials for isolated development/test PostgreSQL.