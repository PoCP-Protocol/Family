# Wave Execution Pack Example

Input:

```text
Authorize M2 Wave 2: Decide and Act.
```

Expected FCA shape:

```text
# WAVE EXECUTION PACK

Wave: M2_WAVE_2_DECIDE_AND_ACT
Date: 2026-08-10
Mode: ARCHITECT EXECUTION

## Authorization

START_NEXT: CONDITIONAL
Authorized scope: ConfirmGrowthPriority, StartIntervention, 7-day GrowthAction, CompleteGrowthAction, F06-F09 frontend, tests, demo.
Non-goals: AI recommendation, outcome, milestone, GrowthReview, World Model, causal engine, total score, ranking.

## Contract Freeze

Frozen contracts:
- GrowthPriority is human-confirmed focus
- Intervention-001 = LISTEN_BEFORE_RESPOND
- Wave 2 is deterministic no-AI
- consent: SERVICE, ASSESSMENT, GROWTH_TRACKING

## Parallel Decision

PARALLEL_BUILD: YES
Reason: scope and file ownership are frozen by contract and conflict matrix.

## Gate

PASS requires real DB/API/frontend/E2E/demo evidence.

## Ending Rule

STOP after Wave 2 gate. Do not begin M2 Wave 3 without explicit FCA authorization.
```
