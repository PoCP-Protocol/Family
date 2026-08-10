# F06-F09 Wave2 UI Notes

owner: AI-04 Frontend F01/F06/F07/F08/F09 Real Integration Owner
phase: Phase B2 Wave2
state: PRE_REAL_API_READY
contract: M2_WAVE2_CF_V1

## Scope

Implemented the static web Wave2 UI surface for:

- F06 Growth Priority: one human-confirmed practice focus, with NO_PRIORITY_YET visible as an allowed state.
- F07 Intervention Detail: INTERVENTION-001 / LISTEN_BEFORE_RESPOND / 先听后回应, 7-day duration.
- F08 Today Action: daily action status controls for COMPLETED / PARTIAL / NOT_COMPLETED.
- F09 Reflection: post-action record boundary stating that reflection is raw action record, not an outcome and not an automatic profile update.

## Integration Mode

Current mode is `pre-real-api`.

The UI uses frozen contract fixtures from `apps/web/src/wave2.js` because the visible backend API surface is not yet confirmed for Wave2 named-action routes. The adapter functions are present in the same module so the switch to real API is localized to `Wave2State.apiMode === 'real-api'` and the existing handlers.

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
- Focused web test covers named-action adapter payloads for priority confirmation, intervention start, and action completion.
