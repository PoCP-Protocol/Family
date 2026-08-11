# FPAI Principal Domain Model V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY

## Purpose

Freeze the Principal domain objects. This domain is AI interaction state. It is NOT Family canonical growth state.

## Domain Objects

```text
PrincipalSession        one bounded conversation context
PrincipalMessage        one user or principal turn
PrincipalResponse       structured response (see contracts/principal-response.schema.json)
PrincipalActionProposal a proposed one-small-action, not yet confirmed
PrincipalFeedback       user feedback on a response
PrincipalModelRun       one model invocation ledger entry
PrincipalHumanHandoff   escalation record to human/safety
```

## Separation From Family Canonical State

```text
PrincipalResponse         != Fact
PrincipalPattern          != GrowthProfile
PrincipalRecommendation   != GrowthPriority
PrincipalActionProposal   != GrowthAction
PrincipalReview           != GrowthReview
```

The Principal domain describes what the AI said, proposed, and how it ran. It never redefines or overwrites Family canonical growth semantics.

## Object Notes

- `PrincipalSession`: scoped to a family + subject reference; holds no raw canonical growth records, only references and bounded summaries from the Context Broker.
- `PrincipalMessage`: user input and principal output turns; raw child text stays in the message store, not copied into the ModelRun ledger by default.
- `PrincipalResponse`: must validate against the FP1 response schema; `possible_pattern` is a hypothesis, never asserted as fact.
- `PrincipalActionProposal`: a candidate action that requires explicit human confirmation before any bridge to a real action.
- `PrincipalModelRun`: provenance/audit of the model call (see FPAI_MODEL_RUN_LEDGER).
- `PrincipalHumanHandoff`: created on HIGH_RISK routing; stops normal coaching.

## Boundaries

```text
PRINCIPAL_DOMAIN = AI_INTERACTION_STATE
PRINCIPAL_DOMAIN != FAMILY_CANONICAL_GROWTH_STATE
DIRECT_GROWTH_STATE_WRITE_FROM_PRINCIPAL = FORBIDDEN
```
