# CCR-V31-PRIORITY-001

Status: APPROVED
Date: 2026-08-10
Phase: V3_1_PHASE1R_RUNTIME_TRUTH_AND_REAL_SYSTEM_CLOSURE

## Context

M2 Wave2 previously selected a GrowthPriority candidate by sorting eligible P03/R03/R04/R05 candidates. Even when rank or score was not exposed to clients, this created hidden ordinal priority selection.

## Decision

Replace the hidden ordinal priority policy with `M2_104_DETERMINISTIC_V2`.

For the first adolescent parent-child communication product slice, the primary practice candidate is R03 Communication Quality only.

The server may propose R03 only when all conditions hold:

- R03 current-context confirmed profile exists.
- Evidence is sufficient.
- Perspective divergence does not require review.
- Required consent is active.
- Safety route is normal.

Otherwise the draft decision is `NO_PRIORITY_YET` or requires review.

P03, R04, and R05 remain supporting context and may remain Intervention-001 target dimensions, but they do not compete for primary priority selection.

## Required Runtime Rules

- Remove `stateOrder`.
- Remove `compareCandidates`.
- Remove implicit dimension-order fallback ranking.
- Do not compute or expose hidden score.
- Do not compute or expose hidden rank.
- Guardian may still choose `NO_PRIORITY_YET`.
- Family Total Score remains forbidden.

## Impact

Update machine spec, TypeScript contracts, runtime policy, API/OpenAPI references, tests, and reports that describe the active policy.
