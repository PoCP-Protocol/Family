# STARTUP_INTEGRATION_AUDIT

Date: 2026-08-10

Phase: FAMILY_STARTUP_INTEGRATION_CLOSEOUT

Current Head: 9d213ac544e8f76d08c074051e5bbd642e531096

## Scope

- Included: `apps/web`, `apps/api`, `packages/contracts`, `database/migrations`
- Excluded by task rule: `famili-principal multimodal`, `avatar`, `speech`, `vision`, `realtime-session`

## Runtime Baseline

- REAL_API_AVAILABLE = YES
- REAL_POSTGRESQL_AVAILABLE = YES
- DB_MIGRATIONS = 7 applied
- AUTH_MODE = DEVELOPMENT_TEST_ACTOR

## Current API Routes

- `GET /health`
- `GET /families/:familyId`
- `POST /families`
- `POST /families/:familyId/parents`
- `POST /families/:familyId/children`
- `POST /families/:familyId/relationships`
- `POST /families/:familyId/life-stages`
- `POST /families/:familyId/consents`
- `POST /families/:familyId/growth/onboarding`
- `POST /families/:familyId/growth/onboardings/:onboardingId/perspectives`
- `GET /families/:familyId/growth/onboardings/:onboardingId/perspectives`
- `POST /families/:familyId/growth/onboardings/:onboardingId/profile-drafts`
- `GET /families/:familyId/growth/onboardings/:onboardingId/insight`
- `POST /families/:familyId/growth/profile-drafts/:draftId/confirm`

## F01/F02 Frontend Adapters

- Entry: `apps/web/src/main.js` calls `createGrowthApp(root)` with no runtime-loaded family context.
- Main adapter surface: `apps/web/src/app.js`
- F02 write path uses `fetch(...)` against real API endpoints.
- F01 display path currently renders from local config values, not from `GET /families/:familyId`.

## Current Data Source Assessment

- F01_CURRENT_DATA_SOURCE = STATIC_FRONTEND_CONFIG
- F02_CURRENT_DATA_SOURCE = REAL_HTTP_API_WITH_STATIC_FRONTEND_IDENTIFIERS

Details:

- `apps/web/src/app.js` defines `defaultConfig` with hardcoded `familyId`, `childId`, `guardianPersonId`, and `actorPersonId`.
- `createGrowthApp()` renders F01 directly from `config.familyId`, `config.guardianPersonId`, `config.childId`, and fixed text `12-15 岁早期青春期`.
- No frontend code currently calls `GET /families/:familyId`.
- F02 `submitStartGrowthOnboarding()` posts to real API and later readbacks use real API (`GET perspectives`, `GET insight`).

## Fake Data And Fallback Audit

- FAKE_DATA_PATHS =
  - `apps/web/src/app.js` `defaultConfig`
  - F01 shell rendering using config literals instead of server data
  - fixed life-stage copy in F01 (`12-15 岁早期青春期`)
- FALLBACK_PATHS = NONE_FOUND_FOR_HTTP_FAILURE

Observed behavior:

- Current web code does not silently fallback to fake server responses after failed fetch.
- On fetch failure, UI moves to `error` status and displays error text.
- However, static boot config acts as a pre-real-data placeholder for F01, so F01 is not yet real-api mode.

## Contract And Backend Audit

- `packages/contracts` exposes `FamilyAggregateResponse` with:
  - `family`
  - `members`
  - `relationships`
  - `lifeStages`
  - `consents`
- `apps/api/src/modules/family/family-aggregate.repository.ts` reads all of the above from PostgreSQL.
- `apps/api/src/modules/family/family.controller.ts` exposes real HTTP routes for F01 aggregate read and F02 onboarding flow.

## MISSING_API

- No dedicated `current journey read` endpoint found for F01, although the contract matrix calls out `GET /families/{familyId} + current journey read`.
- Existing `GET /families/:familyId` does not include current growth journey in `FamilyAggregateResponse`.

## CONTRACT_DRIFT

- F01 contract matrix expects real family read plus current journey read.
- Current frontend F01 renders static config and does not call the existing family aggregate API.
- `FamilyAggregateResponse` currently has no current-journey field, so frontend cannot render approved current journey context from the aggregate alone.
- Browser runtime requires cross-origin access from `http://localhost:5173` to `http://localhost:3000`, but API currently returns no `Access-Control-Allow-Origin` header and no successful preflight headers for onboarding POST.

## Browser Gate Readiness

- REAL_API_MODE = NOT_YET
- Reason 1: F01 is still static bootstrap context, not real aggregate read.
- Reason 2: Browser cross-origin requests are currently blocked at the API boundary because CORS is not enabled.
- Reason 3: F02 depends on custom headers (`X-Actor-Id`, `Idempotency-Key`), which trigger browser preflight for POST; current API response does not expose preflight allow headers.

## Test Surface Present Today

- API integration tests present
- API HTTP E2E tests present
- Web unit tests present
- No browser-level automated E2E found in current workspace for F01/F02 real browser flow

## Blockers

- BLOCKERS = 3

1. F01 does not use real API data yet.
2. Browser CORS/preflight support is missing for `localhost:5173 -> localhost:3000`.
3. F01 contract expects current family context including current journey, but current aggregate contract does not expose journey state.

## Conclusion

- REAL_POSTGRESQL_AVAILABLE = YES
- REAL_HTTP_API_AVAILABLE = YES
- F02 backend path is real and persists to PostgreSQL.
- F01 frontend path is not yet real-api integrated.
- REAL_BROWSER_CLOSEOUT = NOT_READY

## Next Repair Slice

1. Put web runtime into explicit `real-api` mode with runtime config, not hardcoded canonical family context.
2. Wire F01 to `GET /families/:familyId` and show explicit empty/error state instead of static family.
3. Enable API CORS for current development origin and required headers.
4. Re-run browser-path validation and real HTTP E2E after F01/F02 web integration fixes.

---

## Closeout Delta (2026-08-10)

Status after implementing the repair slice:

- F01_CURRENT_DATA_SOURCE = `GET /families/:familyId` real aggregate read
- F02_CURRENT_DATA_SOURCE = real HTTP named actions (`StartGrowthOnboarding`, `RecordPerspective`, insight/profile reads)
- REAL_API_MODE = explicit runtime mode with URL/state-backed context
- REAL_POSTGRESQL_AVAILABLE = YES
- REAL_HTTP_E2E = PASS (54/54)
- REAL_BROWSER = PASS
- RELOAD_PERSISTS = PASS
- CONSOLE_ERRORS = 0 (measured in browser run)
- FAILED_NETWORK_REQUESTS = 0 (measured in browser run)
- FAKE_FALLBACK_USED = NO

Implemented deltas:

- API CORS enabled for `http://localhost:5173` with required headers.
- Family aggregate response now includes `currentOnboarding` read model for reload recovery.
- Web F01 switched from static IDs to real aggregate context load/create flow.
- Web F02 uses selected real members and reloads onboarding from server state.
- Added startup closeout E2E suite: `startup-integration.e2e-spec.ts` (E2E-START-01..08).