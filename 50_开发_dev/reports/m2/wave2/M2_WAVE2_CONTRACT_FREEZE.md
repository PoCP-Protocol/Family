# M2 Wave 2 Contract Freeze

status: FROZEN_FOR_PHASE_B
wave: M2_WAVE_2_DECIDE_AND_ACT
date: 2026-08-10
phase: PHASE_A_CONTRACT_FREEZE
implementation_started: NO
ai_usage: NONE

## 1. Authority Chain

This document freezes the local execution contract for M2 Wave 2 before any M2-104 or M2-105 code work starts.

Authority order:

1. `10_规格_spec/` concept authority.
2. `50_开发_dev/CLAUDE.md` engineering constitution.
3. `50_开发_dev/docs/M2_VERTICAL_SLICE_DELIVERY_STANDARD.md`.
4. M2 Wave 1 closed artifacts, especially `reports/m2/task-103/M2_103_GATE.md`.
5. This Wave 2 contract freeze.

Wave 2 may proceed only inside this frozen boundary. Any implementation that needs to change consent, safety, public contract, core object meaning, or frontend scope must stop and produce an RFC/ADR instead of coding through the conflict.

## 2. Wave 2 Goal

M2 Wave 2 moves Family from understanding to action:

```text
Confirmed GrowthProfile
-> ConfirmGrowthPriority
-> StartIntervention
-> 7-day GrowthAction assignments
-> CompleteGrowthAction
-> Reflection as raw material
```

The user-facing product result is:

```text
A parent can choose one focus for the next 7 days, start INTERVENTION-001, see today's concrete practice, and mark the practice status.
```

Wave 2 is not complete until Domain Contract + API + Frontend + E2E + Demo evidence exist.

## 3. Explicit No-AI Contract

Wave 2 uses deterministic product policy only.

Forbidden in Wave 2:

- LLM call.
- Model Gateway invocation.
- AI recommendation.
- AI-generated priority.
- AI-generated intervention.
- AI-generated action text.
- Agent Memory.
- Causal Episode.
- World Model.

Because no AI wording or personalization is used, `AI_PERSONALIZATION` is not required for Wave 2 deterministic priority/action flows. `MODEL_IMPROVEMENT`, `RESEARCH`, and `CONTENT_PUBLICATION` remain out of scope.

## 4. GrowthPriority Meaning

`GrowthPriority` is a human-confirmed practice focus. It is not a fact, diagnosis, score, ranking, prediction, AI conclusion, or ontology-wide truth.

Allowed priority dimensions for Wave 2:

| Dimension | Scope | Meaning in Wave 2 |
|---|---|---|
| `P03` | Parent Growth Profile | Practice parent listening and response behavior. |
| `R03` | Relationship Growth Profile | Practice being heard in conflict communication. |
| `R04` | Relationship Growth Profile | Practice conflict regulation. |
| `R05` | Relationship Growth Profile | Practice repair after conflict. |

Wave 2 allows exactly one primary priority at a time. It must also support `NO_PRIORITY_YET` when no eligible confirmed profile exists or the guardian chooses not to confirm.

Forbidden priority behavior:

- No hidden numeric score.
- No ranking list.
- No total family score.
- No diagnosis language.
- No automatic confirmation from profile synthesis.
- No priority creation as a side effect of `BuildGrowthProfileDrafts` or `ConfirmGrowthProfile`.

## 5. Priority Proposal Structure

The backend may expose deterministic priority candidates for review, but candidates remain proposals until `ConfirmGrowthPriority` succeeds.

A priority candidate must include:

| Field | Requirement |
|---|---|
| `dimension_id` | One of `P03`, `R03`, `R04`, `R05`. |
| `profile_id` | Confirmed profile anchor, not a draft. |
| `profile_version` | Version of confirmed profile used by the proposal. |
| `state_snapshot` | Qualitative profile state, not a score. |
| `reason_codes` | Deterministic labels such as `RECENTLY_CONFIRMED_PROFILE` or `PRACTICE_READY`. |
| `evidence_summary` | Counts and limitations from current profile/evidence, without fact claims. |
| `eligibility` | `ELIGIBLE`, `REVIEW_REQUIRED`, or `NO_PRIORITY_YET`. |
| `boundary` | Must state priority is a human-confirmed practice focus. |

Candidate ordering may be stable for display, but it must not be described or persisted as ranking. The first displayed candidate is not a score winner.

## 6. ConfirmGrowthPriority Named Action

`ConfirmGrowthPriority` is the only Wave 2 action that creates or changes the active priority.

Required preconditions:

- Actor is authorized guardian/parent for the family and selected child relationship.
- Active M2 onboarding exists for the same family/relationship context.
- Required consents are active: `SERVICE`, `ASSESSMENT`, `GROWTH_TRACKING`.
- Safety route permits normal growth flow: only LOW/NORMAL material may proceed.
- Selected dimension is one of `P03`, `R03`, `R04`, `R05`, or explicit `NO_PRIORITY_YET`.
- Selected profile is canonical confirmed GrowthProfile, not `GrowthProfileDraft`.
- Profile version and evidence snapshot are still current enough for the deterministic policy.
- No active intervention is already running unless the policy explicitly blocks or supersedes through a future approved task.

Required write behavior:

- PostgreSQL transaction.
- Idempotency key.
- Audit log.
- Outbox event.
- Previous active priority is superseded, not deleted, if replacing a priority.
- `NO_PRIORITY_YET` records an explicit non-decision or returns a non-mutating response according to implementation design, but must not create hidden priority state.

## 7. Intervention-001 Contract

Wave 2 includes exactly one intervention.

| Field | Frozen value |
|---|---|
| `intervention_code` | `LISTEN_BEFORE_RESPOND` |
| `intervention_id` | `INTERVENTION-001` or stable seeded equivalent. |
| Chinese name | `先听后回应` |
| Duration | 7 days |
| Target | Parent behavior in parent-child communication. |
| Product form | Behavioral practice plan, not course content. |
| AI source | None. |

Intervention-001 may be eligible for `P03`, `R03`, `R04`, and `R05` when the deterministic eligibility policy allows it.

Forbidden intervention behavior:

- No content-course module.
- No personalized AI coaching.
- No diagnosis treatment plan.
- No automatic start as a side effect of confirming priority.
- No outcome claim.

## 8. StartIntervention Named Action

`StartIntervention` is the only action that starts the 7-day plan and generates the initial action assignments.

Required preconditions:

- Active confirmed `GrowthPriority` exists and is not `NO_PRIORITY_YET`.
- Priority still points to an eligible confirmed profile version.
- Required consents are active: `SERVICE`, `ASSESSMENT`, `GROWTH_TRACKING`.
- Safety route permits normal growth flow.
- Actor is authorized to start the plan.
- No conflicting active intervention exists for the same family/onboarding/priority.
- Requested intervention is exactly `LISTEN_BEFORE_RESPOND`.

Required write behavior:

- PostgreSQL transaction.
- Idempotency key.
- Audit log.
- Outbox event.
- Create active intervention instance.
- Generate seven Day 1-7 `GrowthAction` assignments.
- Do not create milestones, outcomes, growth reviews, AI insights, or causal episodes.

## 9. GrowthAction Contract

Each `GrowthAction` is a concrete daily behavior assignment under an intervention instance.

Required fields:

| Field | Requirement |
|---|---|
| `action_id` | Stable UUID. |
| `family_id` | Owning family. |
| `onboarding_id` | M2 context. |
| `priority_id` | Confirmed priority anchor. |
| `intervention_instance_id` | Running intervention. |
| `day_index` | Integer 1-7. |
| `status` | One of `PENDING`, `COMPLETED`, `PARTIAL`, `NOT_COMPLETED`. |
| `assignment_text` | Deterministic Chinese behavior instruction. |
| `due_date` | Day-specific target date. |
| `created_by_action` | `StartIntervention`. |

Allowed statuses only:

```text
PENDING
COMPLETED
PARTIAL
NOT_COMPLETED
```

No status may imply outcome, improvement, milestone, score, or success.

## 10. Daily Assignment Semantics

Day 1-7 assignments must be generated deterministically from `LISTEN_BEFORE_RESPOND`.

Minimum behavioral arc:

| Day | Product intent |
|---:|---|
| 1 | Pause before responding and invite the child to finish. |
| 2 | Reflect back what was heard before giving an opinion. |
| 3 | Ask one clarifying question before proposing a solution. |
| 4 | Name the child's feeling without judging it. |
| 5 | Separate listening from correction. |
| 6 | Repair a moment where listening failed. |
| 7 | Review the practice experience without claiming outcome. |

These are behavior assignments, not curriculum lessons.

## 11. CompleteGrowthAction Named Action

`CompleteGrowthAction` is the only Wave 2 action that changes daily action completion status.

Required preconditions:

- Actor is authorized for this family/action.
- Action belongs to an active intervention instance.
- Required consents are active: `SERVICE`, `ASSESSMENT`, `GROWTH_TRACKING`.
- Safety route permits normal check-in, or safety material is routed before normal continuation.
- Requested status is one of `COMPLETED`, `PARTIAL`, `NOT_COMPLETED`; clients cannot set any outcome or milestone status.

Required write behavior:

- PostgreSQL transaction.
- Idempotency key.
- Audit log.
- Outbox event.
- Update action status.
- Optionally record reflection as raw material/evidence candidate with explicit boundary.
- Do not update GrowthProfile state.
- Do not create Outcome or GrowthReview.

## 12. Reflection Semantics

Reflection is raw user-provided material. It is not an outcome, fact, milestone, proof of improvement, or profile update.

Reflection may support later evidence processing only through an approved future task. In Wave 2, reflection may be stored for traceability and display, but must carry boundary language equivalent to:

```text
这是一段行动后的记录，不代表已经产生结果，也不自动改变成长画像。
```

Safety-sensitive reflection must route through server-side safety policy. Ordinary Family Web clients must not submit final safety severity.

## 13. Event Contract

Wave 2 events are operational events for audit/outbox/product progression.

Required event families:

- `growth_priority.confirmed` or equivalent for successful `ConfirmGrowthPriority`.
- `intervention.started` or equivalent for successful `StartIntervention`.
- `growth_action.assigned` or equivalent for generated actions.
- `growth_action.completed` or equivalent for status updates.

Events must include family/onboarding/action identifiers, actor/correlation context, and policy version where relevant. Events must not assert outcome or improvement.

## 14. Frontend API Contract

Wave 2 frontend screens:

| Screen | Required product behavior |
|---|---|
| F01 Family Home | Must visibly shift from understanding to action after Wave 2 starts: show current priority/intervention/today action when available. |
| F06 Growth Priority | Show one human-confirmable focus, allow `NO_PRIORITY_YET`, no score/ranking. |
| F07 Intervention Detail | Present `先听后回应` 7-day plan and start action. |
| F08 Today Growth Action | Show today's deterministic practice and status. |
| F09 Action Reflection | Submit action status/reflection with raw-material boundary. |

UI language must be Chinese for user-facing copy. UI must not display total score, ranking, diagnosis, AI recommendation, or outcome claim.

Static Web may continue only if it can satisfy F06-F09 real API flow, state handling, and demo requirements. If not, implementation must produce an RFC before changing frontend architecture.

## 15. Consent Requirements

Wave 2 deterministic flows require:

- `SERVICE`
- `ASSESSMENT`
- `GROWTH_TRACKING`

`AI_PERSONALIZATION` is not required because Wave 2 has no AI. Consent inheritance remains forbidden.

Consent must be rechecked at each named action, not only when the UI renders or when onboarding started.

## 16. Safety Requirements

Server-side safety policy is authoritative.

Rules:

- Clients may submit raw/reflection/survey material only.
- Clients must not submit final safety severity.
- Medium/high/critical risk material must not proceed through normal action completion as if it were low-risk growth data.
- Safety escalation is not a growth milestone, outcome, success signal, or profile improvement.
- Wave 2 normal flow must respect any active safety block from Wave 1 context.

## 17. Transaction Boundaries

Every state-changing Named Action must follow the established pattern:

```text
HTTP
-> DTO validation
-> actor/permission checks
-> consent/safety/precondition checks
-> idempotency
-> PostgreSQL transaction
-> domain write
-> audit log
-> outbox event
-> response DTO
```

No generic update endpoint may mutate GrowthPriority, Intervention, or GrowthAction core state.

## 18. Explicit Non-Goals

Wave 2 must not implement:

- Milestone Detection.
- Outcome Measurement.
- GrowthReview.
- AI Insight.
- AI Recommendation.
- Model Gateway.
- Agent Memory.
- Causal Episode.
- World Model.
- Family Total Score.
- Family Ranking.
- 90-day Journey.
- Native App.
- Mini Program.
- Content-course system.
- Multi-intervention marketplace.

## 19. Phase B Entry Gate

Phase B implementation may start only after:

1. This contract exists.
2. Shared file conflict matrix exists.
3. Role owners agree to file ownership boundaries.
4. Each implementation role maps changes to this contract.

CONTRACT_FREEZE = PASS
READY_FOR_PHASE_B_IMPLEMENTATION = YES, subject to user approval and conflict matrix acceptance.
