# M2 Outcome Evaluation Plan

date: 2026-08-10
status: PROPOSED_PLAN
implementation_started: NO

## 1. Outcome Rule

M2 outcome is a windowed observation of change for a specific dimension. It is not a score, not a family ranking, and not proof of causality.

## 2. Measurement Window

First slice target window:

```text
7-14 days
```

Minimum fields:

- family_id
- dimension_id
- baseline
- current
- measurement_window.start
- measurement_window.end
- source
- evidence_ids
- confidence
- possible_confounders

Outcome levels in first slice:

| Level | Meaning | M2 Use |
|---|---|---|
| L1 Behavioral | A directly observable or self-reported behavior changed within the window. | Parent paused, reflected understanding, asked before advising, completed/skipped daily action. |
| L3 Relationship | A relationship pattern showed observable movement within the window. | Communication quality, conflict regulation, or repair signals changed across events/milestones. |

## 3. Candidate Indicators

| Dimension | Baseline Signal | Current Signal | Evidence |
|---|---|---|---|
| P03 | Parent responds before understanding. | Parent reflects child concern before advice. | Perspective + action/event log. |
| R03 | Frequent interruptive/accusatory exchanges. | More complete turn-taking or clearer agreement. | GrowthEvent + self report. |
| R04 | Conflict escalates without pause. | Parent/child pauses and resumes. | `PARENT_PAUSED`, `CONFLICT_OCCURRED`. |
| R05 | Conflict ends without repair. | Repair signal appears after rupture. | `REPAIR_OCCURRED`, milestone. |

## 4. Success Criteria For First Slice

The first slice succeeds if later implementation can show all of these without overclaiming:

1. At least one completed or skipped GrowthAction is recorded.
2. At least one GrowthEvent is linked to the action or dimension.
3. At least one Milestone or explicit no-milestone review is generated.
4. At least one Outcome is measured over a valid window.
5. The GrowthReview separates evidence, interpretation, and recommendation.
6. No Family Total Score or ranking is produced.

## 5. Causal Boundary

M2 outcome may state:

```text
Observed signals changed during the intervention window.
```

M2 outcome must not state:

```text
The intervention caused the family to improve.
```

without a later causal episode foundation.

## 6. Growth Review Display Contract

F11 must display outcome in this order:

1. Baseline.
2. Observed change.
3. Evidence refs.
4. Confidence and uncertainty.
5. Possible confounders.
6. What the family can try next.

It must not display total score, ranking, clinical conclusion, therapy effect, or causal claim.
