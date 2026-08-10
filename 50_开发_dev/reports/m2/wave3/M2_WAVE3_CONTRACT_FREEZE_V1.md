# M2 Wave3 Contract Freeze V1

Status: LOCAL_CONTRACT_GATE_BASELINE
Date: 2026-08-10
Wave: M2_WAVE_3_OBSERVE_AND_REVIEW
Authorization: AUTHORIZED_BY_CHIEF_ARCHITECT

## Purpose

Complete the first deterministic Family Growth Loop by adding:

```text
Observation -> Review -> Timeline -> Next-Step Decision
```

Wave3 completes the chain:

```text
State -> Decision -> Action -> Observation -> Review -> Learning
```

without AI runtime.

## Active Slice

```text
AGE = 12-15
SCENARIO = PARENT_CHILD_COMMUNICATION_CONFLICT
PRIMARY_REVIEW_DIMENSION = R03
SUPPORTING_CONTEXT = P03, R04, R05
INTERVENTION = LISTEN_BEFORE_RESPOND
```

P03/R04/R05 remain supporting context. Wave3 must not expand into a 24-dimension growth assessment.

## Non-Negotiable Semantics

```text
Perspective != Fact
Observation != Fact
Hypothesis != Fact
Action != Outcome
Reflection != Outcome
OutcomeObservation != CausalEffect
GrowthReview != GrowthProfile
GrowthReview != Diagnosis
NextStepDecision != NextAction
ParentObservation != ChildObservation
```

No automatic profile mutation. No total score. No ranking. No percentage improvement. No diagnosis. No AI side effect.

## Named Action Contracts

### RecordOutcomeObservation

Purpose: Record an explicitly sourced observation about what was noticed after an intervention/action period, without converting it into fact, diagnosis, profile state, or causal effect.

Required input:

```text
family_id
subject_person_id
observer_person_id
observer_role
perspective
intervention_episode_id
action_refs
reflection_refs
evidence_refs
observation_text
observed_at
limitations
boundary = OBSERVATION_IS_NOT_CAUSAL_EFFECT
idempotency_key
```

Preconditions:

```text
family_exists
subject_belongs_to_family
observer_belongs_to_family_or_authorized_role
intervention_episode_exists
required_growth_consents_active
safety_route_is_NORMAL
```

Effects:

```text
create_outcome_observation
append_audit_record
emit_OutcomeObservationRecorded
```

Forbidden effects:

```text
no_growth_profile_write
no_growth_priority_write
no_next_intervention_start
no_score_write
no_ai_runtime_call
```

### CompleteGrowthReview

Purpose: Summarize attempted actions, recorded and missing evidence, parent/child observations, agreement/divergence, limitations, and selected next-step intent without claiming efficacy or mutating GrowthProfile.

Required input:

```text
family_id
subject_person_id
intervention_episode_id
observation_ids
review_summary
evidence_limitations
agreement_divergence
next_step_decision
idempotency_key
```

Allowed next_step_decision values:

```text
CONTINUE
ADJUST
PAUSE
REVIEW_REQUIRED
```

Eligibility:

```text
planned_intervention_period_has_ended
OR all_planned_actions_terminal_check_in_state
```

Missing check-ins remain missing evidence. They must not be auto-converted from `PENDING` to `NOT_COMPLETED`.

Effects:

```text
create_growth_review
append_audit_record
emit_GrowthReviewCompleted
```

Forbidden effects:

```text
no_growth_profile_write
no_growth_profile_dimension_write
no_next_intervention_start
no_course_create
no_ai_recommendation
no_diagnosis
no_score_or_ranking
```

### CloseInterventionCycle

Purpose: Close a reviewed intervention episode after an approved GrowthReview, with explicit authorization, consent, safety, idempotency, audit, and outbox.

Required input:

```text
family_id
subject_person_id
intervention_episode_id
growth_review_id
idempotency_key
```

Preconditions:

```text
growth_review_completed
actor_authorized
required_growth_consents_active
safety_route_allows_normal_close
```

Effects:

```text
mark_intervention_episode_reviewed_or_closed
append_audit_record
emit_InterventionCycleClosed
```

Forbidden effects:

```text
no_hidden_state_mutation
no_profile_mutation
no_next_action_start
```

### RecordNextStepDecision

Purpose: Record the family selected next-step intent from a completed review without starting the next intervention or changing confirmed priority/profile state.

Required input:

```text
family_id
subject_person_id
growth_review_id
decision
decision_note
idempotency_key
```

Allowed decisions:

```text
CONTINUE
ADJUST
PAUSE
REVIEW_REQUIRED
```

Effects:

```text
record_next_step_decision
append_audit_record
emit_NextStepDecisionRecorded
```

Forbidden effects:

```text
no_next_intervention_start
no_growth_priority_confirm
no_growth_profile_write
no_course_create
no_ai_trigger
```

## FamilyTimelineReadModel

Timeline is a read model only.

Minimum entries:

```text
Growth onboarding
Perspective/evidence milestones where appropriate
Priority confirmed
Intervention started
Action check-ins
Reflection records
Outcome observations
Growth Review completion
Cycle close
```

Timeline entries must include provenance and human-readable boundaries. Timeline must not compute ranking, total score, AI claim, causal effect, or diagnosis.

## Consent

Before canonical Wave3 writes, recheck at minimum:

```text
SERVICE
GROWTH_TRACKING
minor_guardian_authorization_where_required
```

Wave3 must not infer `AI_PERSONALIZATION`, `MODEL_IMPROVEMENT`, or `CONTENT_PUBLICATION` from service consent.

## Safety

Observation/review/reflection text can surface safety signals. Server-side deterministic safety policy decides route. Client cannot author final severity.

For non-normal safety route, do not silently complete normal review flow. Create or route approved safety/human gate state without diagnosis.

## Testability

Automated tests must not wait seven calendar days. Use controlled clock or domain fixtures. Do not expose a production time-travel endpoint. Do not use direct SQL as canonical business creation path.

## Local Contract Gate

```text
CONTRACT_FREEZE = PASS_WHEN
  all above contracts are represented in action specs or implementation plan
  shared file matrix is approved
  no F12 / AI runtime / M3 runtime files are introduced
```