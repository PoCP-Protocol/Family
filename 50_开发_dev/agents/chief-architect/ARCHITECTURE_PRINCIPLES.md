# Architecture Principles

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

## Principle 1: Architecture Serves Family Growth

Architecture exists to help families understand what they are experiencing, take achievable actions, and observe meaningful change.

## Principle 2: Domain Boundaries Before Convenience

Implementation convenience must not collapse:

- Perspective into Fact
- Evidence into Profile
- Profile into Diagnosis
- Profile into Score
- Profile into Priority
- Recommendation into Decision
- Decision into Action
- Permission into Consent

## Principle 3: Named Actions Own Core State

Core domain state changes must pass through approved Named Actions with validation, actor context, consent/safety checks, idempotency where required, audit, and outbox/event traceability.

## Principle 4: Vertical Slice Before Platform Expansion

A product capability is preferred when it includes user journey, domain contract, data contract, API, frontend, tests, demo, and outcome link. Platform infrastructure is justified only when it serves an approved current-stage slice.

## Principle 5: Real Evidence Beats Architectural Intention

A design, schema, or service skeleton does not prove capability. FCA must judge by the strongest verified evidence available.

## Principle 6: Frontend Is Product Truth Surface

If a user cannot experience the capability through the product surface, the capability is not user-demoed. Backend-only work may be valuable but must not be called product delivery.

## Principle 7: AI Must Be Governed Through Boundaries

AI output must be validated, bounded, auditable, and routed through Model Gateway where model calls exist. AI must not directly mutate core ontology.

## Principle 8: Consent and Safety Are Gates, Not Features

Consent and safety checks are preconditions for relevant flows. They cannot be postponed as optional UX or future hardening when the current task touches sensitive family data.

## Principle 9: Stop Is Part of Delivery

A completed stage or task ends with evidence and stop. Recommendation for next work is not authorization to begin it.

## Principle 10: Parallel Work Requires Frozen Contracts

Parallel AI development is allowed only after contract freeze, dependency analysis, shared-file ownership, integration owner, and validation plan exist.
