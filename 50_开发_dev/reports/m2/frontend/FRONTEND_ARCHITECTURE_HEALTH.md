# Frontend Architecture Health

owner: AI-04 Frontend F01/F06/F07/F08/F09 Real Integration Owner
phase: Phase B2 Wave2
verdict: STATIC_WEB_CONTINUE

## Decision

`STATIC_WEB_CONTINUE`

No frontend framework migration is required for Wave2. The current static ES module app remains sufficient for F01/F06/F07/F08/F09 because:

- The app already has deterministic state transitions for F01-F05.
- Wave2 can be integrated through a small module boundary in `apps/web/src/wave2.js`.
- The fixture-to-real-API switch is isolated behind explicit adapter functions.
- Vitest + jsdom can cover the user-visible gates and named-action payloads without introducing framework churn.

## Current Health

- Build/typecheck path remains `pnpm --filter @family/web typecheck`.
- Test path remains `pnpm --filter @family/web test -- app.spec.ts`.
- `pre-real-api` remains the safe default; explicit runtime query configuration enables verified `real-api` mode.
- No migration RFC is requested at this time.

## Real API Boundary

The following functions are the intended real API boundary:

- `fetchGrowthPriorityInsight`
- `submitConfirmGrowthPriority`
- `submitStartIntervention`
- `submitCompleteGrowthAction`

The app uses frozen fixtures unless `Wave2State.apiMode` is switched to `real-api`. The real mode has been verified in a live Browser + HTTP + PostgreSQL flow, including reload/resume and a 390x844 mobile viewport.
