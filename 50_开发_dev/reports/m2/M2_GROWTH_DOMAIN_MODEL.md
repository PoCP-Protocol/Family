# M2 Growth Domain Model

date: 2026-08-10
status: PROPOSED_MODEL
implementation_started: NO

## 1. Domain Chain

```text
GrowthOnboarding
-> Perspective
-> EvidenceRecord
-> GrowthProfile
-> GrowthPriority
-> Intervention
-> GrowthAction
-> GrowthEvent
-> Milestone
-> Outcome
-> GrowthReview
```

## 2. Objects

| Object | Role | Existing Foundation | M2-000 Decision |
|---|---|---|---|
| GrowthOnboarding | Opens the M2 context after M1 aggregate, consent, and safety checks. | None explicit. | Proposed contract required before M2-101. |
| Perspective | Captures parent/child/advisor view. | `perspectives` table exists. | Must carry `Perspective != Fact`. |
| EvidenceRecord | Carries observable support for profile/event/outcome. | `evidence_records` table exists. | Must include source, evidence level, and payload boundary. |
| GrowthProfile | Relationship growth state across four dimensions. | `growth_profiles` and dimensions exist. | Narrow to `RELATIONSHIP` + four dimensions. |
| GrowthPriority | Human-confirmed focus dimension. | `growth_priorities` table exists. | Rank 1-2 only for M2 first slice. |
| Intervention | Approved growth intervention definition. | `interventions` table exists. | Seed only `INTERVENTION-001`. |
| GrowthAction | Assigned concrete practice. | `growth_actions` table exists. | Must be assigned by Named Action, not AI directly. |
| GrowthEvent | Logged occurrence during practice. | `growth_events` table exists. | Raw note remains non-fact material. |
| Milestone | Human-confirmed meaningful signal. | `milestones` table exists. | Requires evidence and human confirmation. |
| Outcome | Windowed measurement of change. | `outcomes` table exists. | No score aggregation or ranking. |
| GrowthReview | Human-readable review of slice outcome. | None explicit. | Proposed contract required. |

## 3. Dimension Catalog

| id | name | subject | M2 allowed states |
|---|---|---|---|
| P03 | Understanding & Empathic Listening | Parent behavior in relationship context | EMERGING, DEVELOPING, PRACTICING, STABILIZING |
| R03 | Communication Quality | Parent-child relationship | EMERGING, DEVELOPING, PRACTICING, STABILIZING |
| R04 | Conflict Regulation | Parent-child relationship | EMERGING, DEVELOPING, PRACTICING, STABILIZING |
| R05 | Repair | Parent-child relationship | EMERGING, DEVELOPING, PRACTICING, STABILIZING |

## 4. Named Action Boundary

All M2 core state mutation must follow the M1 reference pattern:

```text
HTTP -> DTO Validation -> Actor Context -> Permission/Consent/Preconditions -> Idempotency -> PostgreSQL Transaction -> Audit -> Outbox -> Response
```

Proposed M2 Named Actions are documented in `reports/m2/proposed-contracts/named-actions.yaml`.

## 5. Non-Fact Boundaries

- Perspective is not Fact.
- Hypothesis is not Fact.
- Recommendation is not Decision.
- Decision is not Action.
- Action is not Outcome.
- AI free text cannot directly write core ontology.

## 6. First Slice State Machine

```text
NOT_STARTED
-> ONBOARDING_STARTED
-> PERSPECTIVES_CAPTURED
-> INSIGHT_READY
-> PRIORITY_CONFIRMED
-> INTERVENTION_STARTED
-> ACTION_IN_PROGRESS
-> OBSERVING_EVENTS
-> REVIEW_READY
-> COMPLETED
```

Safety override:

```text
ANY_STATE -> SAFETY_ESCALATION
```

`SAFETY_ESCALATION` stops the normal growth flow and must not improve profile state, create a milestone, or count as a positive outcome.

## 7. Slice Limit Guard

M2 accepts only `P03`, `R03`, `R04`, and `R05`. Any request for 24 dimensions, learning achievement, phone addiction, school refusal, anxiety, depression, school admission, career planning, couple relationship, or sibling relationship must be recorded as `DEFER_TO_FUTURE_SLICE`.
