# Architect Decision Example

Question:

```text
Should GrowthPriority be decided by AI?
```

Expected FCA shape:

```text
# ARCHITECTURE DECISION

ADR: ADR-017
Status: ACCEPTED
Date: 2026-08-10
Mode: ARCHITECT DECISION

## Context

M2 moves from understanding to action. A priority determines what the family practices next, so it sits between profile interpretation and concrete action.

## Decision

GrowthPriority is a human-confirmed practice focus. It may be proposed deterministically where approved, but it must not be decided by AI in M2.

## Rationale

Profile != Priority and Recommendation != Decision != Action. In M2, AI autonomy is limited and Wave 2 is deterministic no-AI. Priority selection affects downstream action and must remain explicit.

## Allowed

- show eligible priority candidates
- explain why a candidate is available
- allow NO_PRIORITY_YET
- confirm through Named Action

## Forbidden

- AI-generated priority as canonical state
- hidden ranking
- score-based priority
- automatic action start after profile confirmation

## Requires RFC?

YES, if a future stage wants AI-assisted priority recommendation.
```
