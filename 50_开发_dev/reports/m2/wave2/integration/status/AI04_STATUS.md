# AI-04 Status

role: Frontend Real Integration Owner
phase: WAVE2_INTEGRATION_CONVERGENCE

```text
STATE: REAL_API_ADAPTER_PREP_READY
FRONTEND_REAL_API_READY: NO
LAST_CHANGESET: Aligned Wave2 web adapters to AI-00 confirmed route surface while retaining dual mode.
DONE:
- Added Wave2 UI/helper module for Growth Priority, Intervention Detail, Today Action, and Reflection.
- Wired Wave2 workspace into Family Home after at least one Growth Profile is confirmed.
- Marked UI as `pre-real-api` by default while backend/runtime browser evidence remains unverified.
- Added focused Vitest coverage for Wave2 rendering and named-action adapter payloads.
- Added optional `wave2ApiMode` config hook; default remains `pre-real-api`.
- In `real-api` mode, confirmed Growth Profile flow now reads priority insight through the prepared real adapter.
- Updated future real API adapters to:
	- `GET /families/:familyId/growth/onboardings/:onboardingId/priority-insight`
	- `POST /families/:familyId/growth/onboardings/:onboardingId/priority-drafts/:draftId/confirm`
	- `POST /families/:familyId/growth/onboardings/:onboardingId/priorities/:priorityId/interventions`
	- `POST /families/:familyId/growth/actions/:actionId/complete`
- Removed duplicated path IDs from confirm/intervention/action request bodies to match backend strict DTO validation.
- Recorded frontend architecture decision as STATIC_WEB_CONTINUE.
VALIDATION:
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/web typecheck` PASS.
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/web test` PASS, 9 tests.
NEXT:
- Switch `Wave2State.apiMode` to `real-api` only after a running backend and seeded/fixture data support browser flow verification.
- Re-run browser/demo evidence with real API once AI-00 and AI-05 are ready.
BLOCKER: final real API gate still needs running backend plus browser/demo evidence; current change is adapter prep, not final real API PASS.
NEEDS_FROM:
- AI-00: runnable API environment and route/runtime evidence.
- AI-03: contract DTO confirmation.
- AI-05: browser demo assertions.
CONTRACT_VERSION: M2_WAVE2_CF_V1
```
