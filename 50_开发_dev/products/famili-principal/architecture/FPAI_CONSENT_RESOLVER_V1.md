# FPAI Principal Consent Resolver V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY

## Purpose

`PrincipalConsentResolver` decides whether personal Family context may enter the Context Broker. It uses the Family canonical consent, not a new product-local consent.

## Canonical Consent Source

The only authority for personalization is the existing Family canonical consent:

```text
AI_PERSONALIZATION
```

Do not create `fpai_lab_consent`, `principal_consent`, or any parallel consent as a future authority. A lab-local flag may exist only inside the Integration Lab for test isolation and is never a production authorization source.

## Rule

```text
AI_PERSONALIZATION = GRANTED
    -> personal Family context MAY enter the Context Broker

AI_PERSONALIZATION != GRANTED
    -> no personal Family context to model
    -> Principal runs with non-personal context only
```

## No Implicit Inheritance

The following consents must NOT be auto-promoted into `AI_PERSONALIZATION`:

```text
SERVICE            != AI_PERSONALIZATION
ASSESSMENT         != AI_PERSONALIZATION
GROWTH_TRACKING    != AI_PERSONALIZATION
```

Personalization for the Principal requires an explicit `AI_PERSONALIZATION` grant.

## Resolver Interface (design)

```text
resolve(familyId, subjectId, actor) -> {
  ai_personalization: GRANTED | NOT_GRANTED | REVOKED,
  personal_context_allowed: boolean,
  consent_snapshot_ref: string
}
```

- The resolved decision and a consent snapshot reference are recorded on the ModelRun ledger.
- Revocation takes effect on the next turn; no personal context is projected once revoked.

## Boundaries

```text
NEW_CONSENT_AUTHORITY = FORBIDDEN
CONSENT_INHERITANCE = FORBIDDEN
CONSENT_DEFAULT = NOT_GRANTED
```
