# F06-F09 Wave2 UI Notes

owner: AI-04 Frontend F01/F06/F07/F08/F09 Real Integration Owner
phase: Phase B2 Wave2
state: REAL_API_BROWSER_GATE_PASS
frontend_real_api_ready: YES
contract: M2_WAVE2_CF_V1

## Scope

Implemented the static web Wave2 UI surface for:

- F06 Growth Priority: one human-confirmed practice focus, with NO_PRIORITY_YET visible as an allowed state.
- F07 Intervention Detail: INTERVENTION-001 / LISTEN_BEFORE_RESPOND / 先听后回应, 7-day duration.
- F08 Today Action: daily action status controls for COMPLETED / PARTIAL / NOT_COMPLETED.
- F09 Reflection: post-action record boundary stating that reflection is raw action record, not an outcome and not an automatic profile update.

## Integration Mode

Current mode is `pre-real-api` by default, with an explicit and browser-verified `real-api` runtime mode aligned to the AI-00 confirmed Wave2 route surface.

The UI uses frozen contract fixtures from `apps/web/src/wave2.js` unless `Wave2State.apiMode === 'real-api'`. The switch remains localized to the adapter boundary. A real browser completed the end-to-end flow against the live API and PostgreSQL, including confirmed-profile reload hydration.

The app config now accepts optional `wave2ApiMode`. Default remains `pre-real-api`; setting `real-api` makes the confirmed Growth Profile flow fetch `priority-insight` from the prepared route before rendering Wave2 priority state.

Prepared route surface:

- `GET /families/:familyId/growth/onboardings/:onboardingId/priority-insight`
- `POST /families/:familyId/growth/onboardings/:onboardingId/priority-drafts/:draftId/confirm`
- `POST /families/:familyId/growth/onboardings/:onboardingId/priorities/:priorityId/interventions`
- `POST /families/:familyId/growth/actions/:actionId/complete`

Request body boundary: IDs carried by route path are not duplicated in POST bodies. Bodies contain only action inputs accepted by backend DTO validation: `decision`, `intervention_code`, and `completion_status/reflection/occurred_at`.

## Guardrails

- No Family Total Score.
- No family ranking.
- No diagnosis wording.
- No outcome or milestone presentation in the Wave2 UI.
- No automatic profile mutation from reflection.
- Action completion is treated as action status only.

## Validation

- Focused web test covers rendering of F06-F09 after confirmed profile flow.
- Focused web test covers `pre-real-api` marker.
- Focused web test covers named-action adapter routes and payloads for priority insight, priority confirmation, intervention start, and action completion.
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/web typecheck` PASS.
- `pnpm --dir "d:\Family\50_开发_dev" --filter @family/web test` PASS, 10 tests.
- Real browser + HTTP + PostgreSQL flow PASS; console warnings/errors: 0.
- 390x844 mobile layout PASS with no horizontal overflow.
