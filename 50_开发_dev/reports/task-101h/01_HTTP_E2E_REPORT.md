# TASK-101H HTTP E2E Report

status: PASS
date: 2026-08-09
scope: CreateFamily HTTP reference harness only

## Coverage

- E2E-01 valid `POST /families` returns 201 and `family` response.
- E2E-02 client-supplied `family_id` returns 400 and creates no family.
- E2E-03 missing/invalid `display_name` returns 400.
- E2E-04 missing `x-actor-id` returns 401.
- E2E-05 same idempotency key + same payload replays same result and creates one family.
- E2E-06 same idempotency key + different payload returns 409.
- E2E-07 `x-correlation-id` propagates to `audit_logs` and `outbox_events`.
- E2E-08 side effects are exactly one family, one audit, one outbox event, one idempotency record, and no growth profile/journey.

## Contract Basis

- HTTP shape is locked to current TASK-101 implementation: snake_case `display_name`, `idempotency_key`, generated `family_id`.
- OpenAPI was hardened to define request, response, required headers, and Nest-style error envelope for CreateFamily.

## Validation

- `TEST_DATABASE_URL=postgres://family:***@localhost:55433/family_gate pnpm --filter @family/api test:e2e`
- Result: 1 file, 8 tests PASS.

## Notes

- HTTP E2E exposed missing explicit Nest DI metadata in Vitest runtime. Fixed by explicit `@Inject(...)` tokens in controller/service constructors, with no CreateFamily business semantic change.