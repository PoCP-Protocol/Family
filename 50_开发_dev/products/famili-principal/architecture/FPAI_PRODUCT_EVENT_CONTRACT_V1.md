# FPAI Product Event Contract V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY

## Purpose

Define product analytics events for the Principal experience. These are product events, not Family canonical growth events.

## Events

```text
principal_entry_viewed
principal_question_submitted
principal_response_received
principal_response_displayed

say_it_tonight_viewed

principal_action_proposal_viewed
principal_action_proposal_accepted
principal_action_proposal_rejected

principal_feedback_submitted

principal_safety_routed
principal_human_handoff_created
```

## Critical Separation

```text
principal_action_proposal_accepted = ProductEvent
principal_action_proposal_accepted != GrowthEvent
```

Accepting a proposal in the product UI is a product signal. It does not, by itself, create Family canonical growth state. A real growth action only occurs through the Action Bridge into an existing Named Action, after explicit human confirmation.

## Field Guidance

- Events carry references (session_id, family_id_ref, response_id) not raw child text.
- `principal_safety_routed` records the risk_route; `principal_human_handoff_created` records the handoff id.
- Product events feed analytics; they are not an authorization or a canonical write path.

## Boundaries

```text
PRODUCT_EVENT_WRITES_GROWTH_STATE = NO
PRODUCT_EVENT_IS_CONSENT_AUTHORITY = NO
PROPOSAL_ACCEPTED_EQUALS_GROWTH_ACTION = NO
```
