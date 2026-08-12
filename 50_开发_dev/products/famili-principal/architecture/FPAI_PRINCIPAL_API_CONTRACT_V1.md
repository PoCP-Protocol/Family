# FPAI Principal API Contract V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY (NOT REGISTERED AS PRODUCTION RUNTIME)

## Purpose

Design the Principal HTTP surface so it aligns with the existing Family API conventions. This stage designs the contract only. It does not register a production API module or open a public API.

## Candidate Endpoints

```text
POST /families/:familyId/principal/sessions
POST /families/:familyId/principal/sessions/:sessionId/messages
GET  /families/:familyId/principal/sessions/:sessionId
POST /families/:familyId/principal/action-proposals/:proposalId/accept
POST /families/:familyId/principal/responses/:responseId/feedback
```

## Reuse Existing Family API Conventions

Do not invent a new HTTP style. The Principal API must reuse the Family API's existing conventions for:

```text
actor            existing actor identification convention
correlation_id   existing request correlation convention
idempotency_key  existing idempotency convention for write endpoints
audit            existing audit emission convention
consent          existing canonical consent enforcement (AI_PERSONALIZATION)
```

Every write endpoint (`sessions`, `messages`, `accept`, `feedback`) follows the same actor + correlation + idempotency + audit rules as existing Family write endpoints. The exact header/field names are inherited from the Family API contract; this document does not redefine them.

## Endpoint Notes

- `accept` on an action proposal is the explicit human confirmation event. It is a product/product-state action; it triggers the Action Bridge only for allowlisted Named Actions and never writes `growth_actions` directly.
- `GET session` returns the interaction state (messages, responses, proposals, risk route), not Family canonical growth records.
- Consent is enforced per request via `PrincipalConsentResolver`; personal context requires `AI_PERSONALIZATION = GRANTED`.

## Boundaries

```text
APP_MODULE_REGISTRATION = NO
PUBLIC_API = NO
REAL_USER_RUNTIME = NO
NEW_HTTP_STYLE = FORBIDDEN
```

This contract is validated only against contract tests and the Integration Lab (FakeAiGateway). It is not mounted into the running Family API in this stage.
