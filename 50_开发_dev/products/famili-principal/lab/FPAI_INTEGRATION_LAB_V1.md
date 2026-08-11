# FPAI Integration Lab V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY + CONTRACT_TESTS

## Purpose

The Integration Lab wires the M3-PRINCIPAL-000 contracts together with a `FakeAiGateway` to prove the end-to-end flow holds, without any real model, public API, or real user runtime.

## Boundaries

```text
APP_MODULE_REGISTRATION = NO
PUBLIC_API = NO
REAL_USER_RUNTIME = NO
AI_GATEWAY = FakeAiGateway
GROWTH_STATE_MUTATION = NO
```

The lab may run contract tests only. It does not mount a Principal module into the Family API and does not touch a real datastore.

## Flow Under Test

```text
Canonical Consent (AI_PERSONALIZATION)
   -> Context Broker (allowlist only)
   -> Principal (FakeAiGateway structured response)
   -> Structured Response (FP1 schema)
   -> Action Proposal (PrincipalActionProposal)
   -> Human Confirmation (explicit accept)
   -> Action Bridge (allowlisted -> existing Named Action)
   -> [asserted] zero direct Growth writes
```

## Assertions

```text
CONSENT_MISSING -> no personal context reaches the model
CONTEXT_BROKER  -> only allowlisted fields are passed
RESPONSE_SHAPE  -> matches FP1 principal-response schema
PROPOSAL        -> is a proposal, not a growth action
NO_CONFIRMATION -> no bridge fires, no growth write
CONFIRMATION    -> bridge fires an EXISTING Named Action only
HIGH_RISK       -> bridge disabled, human handoff
GROWTH_WRITES   -> 0 direct AI writes to growth state
```

## Consent Note

The lab uses the canonical `AI_PERSONALIZATION` consent as the authority. Any lab-local flag is test-scoped only and must never be promoted to a production consent authority (`fpai_lab_consent` stays lab-local).
