# M2 Implementation Backlog

date: 2026-08-10
status: READY_FOR_M2_WAVE1_EXECUTION
implementation_started: M2_101_STARTING

## Execution Decision

The V3.0 `M2-000_FIRST_GROWTH_SLICE_DEFINITION` Contract Gate has passed with `BLOCKERS=0` and `READY_FOR_M2_WAVE1=YES`. User approval to auto-review and continue development was recorded on 2026-08-10. Execution is limited to one active task at a time, starting with `M2-101_START_GROWTH_ONBOARDING`.

## M2 Dual-Mainline Rule

Every M2 wave must ship both backend/domain capability and Family Web / Responsive Web UI. A wave cannot close with backend tests only.

Required delivery shape:

```text
Domain Contract + API + Frontend + E2E + Demo
```

## AI Cells Added For M2

| Cell | Responsibility |
|---|---|
| AI-07 UX / Product Design | User journey, IA, interaction, emotional tone, parent/child experience, Growth visualization, Consent UX, AI interaction UX. |
| AI-08 Frontend Architecture Engineer | Family Web architecture, responsive implementation plan, frontend-backend contracts, browser E2E/demo evidence. |
| AI-09 Independent Product Reviewer | Product/UX review that Family is not reduced to backend capability or generic chatbot UI. |

## Main Tasks

The implementation backlog is intentionally capped to 10 main tasks.

| Task | Wave | Scope |
|---|---|---|
| M2-101 | Wave 1 | StartGrowthOnboarding + F01/F02 |
| M2-102 | Wave 1 | Record parent/child Perspective + Evidence + F03/F04 |
| M2-103 | Wave 1 | Limited GrowthProfile/Growth Insight + F05 |
| M2-104 | Wave 2 | Confirm GrowthPriority + F06 |
| M2-105 | Wave 2 | Seed Intervention-001, assign GrowthAction, F07/F08/F09 |
| M2-106 | Wave 3 | Record GrowthEvent, Milestone, Timeline + F10 |
| M2-107 | Wave 4 | Outcome, GrowthReview, journey-scoped Family AI + F11/F12 |
| GOV-001 | Governance | WithdrawConsent before external pilot |
| GOV-002 | Governance | IAM hardening before external pilot |
| GOV-003 | Governance | Safety escalation operational SOP before real safety handling |

## M2-WAVE-1 Understand

Backend:

- GrowthOnboarding.
- Perspective.
- Evidence.
- Limited relationship GrowthProfile.

Frontend:

- F01 Family Home.
- F02 Growth Onboarding.
- F03 Parent Perspective.
- F04 Child Perspective.
- F05 Growth Insight.

Demo: A family opens Family Web, completes onboarding, records parent/child perspectives, and sees the first Growth Insight.

## M2-WAVE-2 Act

Backend:

- Priority.
- Intervention.
- GrowthAction.
- Action check-in event.

Frontend:

- F06 Growth Priority.
- F07 Intervention Detail.
- F08 Today Growth Action.
- F09 Action Reflection.

Demo: A parent completes the `LISTEN_BEFORE_RESPOND` Today Action.

## M2-WAVE-3 Observe

Backend:

- GrowthEvent.
- Milestone.
- Timeline read model.

Frontend:

- F10 Family Timeline.

Demo: A family sees what happened across the 7-day journey.

## M2-WAVE-4 Understand Change

Backend:

- Outcome.
- GrowthReview.
- Minimal AI / knowledge explanation.

Frontend:

- F11 Growth Review.
- F12 Family AI.

Demo: A family understands change and asks a journey-scoped AI explanation.

## M2-101 Start Growth Onboarding

Objective: Create the M2 onboarding entry point for the fixed 12-15 parent-child communication conflict slice.

Status: COMPLETED on 2026-08-10 after V3.0 M2-000 PASS with BLOCKERS=0, READY_FOR_M2_WAVE1=YES, and user approval to auto-review and continue development on 2026-08-10.

Must implement:

- `StartGrowthOnboarding` Named Action.
- M1 aggregate precondition checks.
- Consent gate for `SERVICE`, `ASSESSMENT`, and `GROWTH_TRACKING`.
- Safety screening result field.
- Audit/outbox/idempotency following M1 reference pattern.
- Family Web route and UI for F01/F02 entry path.
- Browser E2E demo path from Family Home to onboarding start.

Must not implement:

- AI personalization.
- GrowthProfile generation.
- Intervention assignment.
- Native App or Mini Program.

Completion evidence:

- Backend `StartGrowthOnboarding` contract, DTO, route, service, audit, outbox, idempotency, and growth event path implemented.
- Family Web F01/F02 path implemented in `apps/web`.
- API HTTP E2E and browser demo path passed.

## M2-102 Record Perspective And Evidence

Objective: Record parent/child/advisor perspective and evidence while preserving `Perspective != Fact`.

Must implement:

- `RecordPerspective` Named Action.
- EvidenceRecord creation.
- Safety signal routing before normal persistence when needed.
- F03 Parent Perspective UI.
- F04 Child Perspective UI.
- Explicit Parent Perspective != Child Perspective display treatment.

## M2-103 Create Relationship GrowthProfile

Objective: Create a relationship GrowthProfile limited to `P03`, `R03`, `R04`, `R05`.

Must implement:

- `CreateGrowthProfile` Named Action.
- State enum validation.
- Evidence linking.
- MEDIUM Human Gate.
- F05 Growth Insight UI.
- Growth visualization without scores, radar charts, rankings, or percentiles.

## M2-104 Confirm GrowthPriority

Objective: Confirm one or two priority dimensions for the family.

Must implement:

- `ConfirmGrowthPriority` Named Action.
- Rank 1-2 validation.
- Parent confirmation or Growth Advisor Review.
- F06 Growth Priority UI.
- Evidence-backed priority explanation.

## M2-105 Seed And Assign Intervention-001

Objective: Seed `INTERVENTION-001 / LISTEN_BEFORE_RESPOND` and assign first GrowthAction.

Must implement:

- Intervention seed data.
- `AssignGrowthAction` Named Action.
- LOW Human Gate.
- No direct AI action assignment.
- F07 Intervention Detail UI.
- F08 Today Growth Action UI.
- F09 Action Reflection UI.

## M2-106 Record GrowthEvent And Milestone

Objective: Record action outcomes, skipped actions, conflict/repair events, and milestones.

Must implement:

- `RecordGrowthEvent` Named Action.
- Milestone confirmation.
- Raw note boundary.
- F10 Family Timeline UI.

## M2-107 Evaluate Outcome And GrowthReview

Objective: Evaluate 7-14 day outcome and produce review.

Must implement:

- `EvaluateGrowthOutcome` Named Action.
- Window validation.
- GrowthReview.
- No total score/ranking.
- F11 Growth Review UI.
- F12 Family AI as journey-embedded interaction, not generic chat shell.

## Governance Workstream

| id | item | required before |
|---|---|---|
| GOV-001 | WithdrawConsent | External pilot |
| GOV-002 | IAM hardening | External pilot |
| GOV-003 | Safety escalation operational SOP | Any real user safety handling |
| GOV-004 | AI Model Gateway production policy | Any personalized AI feature |
