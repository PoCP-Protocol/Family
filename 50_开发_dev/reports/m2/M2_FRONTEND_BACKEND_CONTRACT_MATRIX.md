# M2 Frontend Backend Contract Matrix

date: 2026-08-10
status: PROPOSED_REQUIRED_FOR_M2
implementation_started: NO

## 1. Contract Rule

M2 screens are not mock-only deliverables. Each screen must map to a backend API, domain object, permission rule, consent rule, and E2E demo step before its wave can close.

## 2. Matrix

| Screen | Backend API | Domain Object | Permission / Consent / Safety Contract | Primary Action | Wave |
|---|---|---|---|---|---|
| F01 Family Home | `GET /families/{familyId}` + current journey read | FamilyAggregate, GrowthJourney | family read permission; SERVICE; safety banner if current journey is blocked | Continue journey | Wave 1 |
| F02 Growth Onboarding | `StartGrowthOnboarding` | M2GrowthOnboarding | manage/growth permission; SERVICE+ASSESSMENT+GROWTH_TRACKING; safety screening required | Start onboarding | Wave 1 |
| F03 Parent Perspective | `RecordPerspective` | Perspective, EvidenceRecord | actor represents parent/guardian; ASSESSMENT+GROWTH_TRACKING; normal safety route | Submit parent view | Wave 1 |
| F04 Child Perspective | `RecordPerspective` | Perspective, EvidenceRecord, SafetySignal | child/guardian context; ASSESSMENT+GROWTH_TRACKING+minor data; safety escalation can stop flow | Submit child view | Wave 1 |
| F05 Growth Insight | GrowthProfile/Insight read | M2GrowthProfile, EvidenceRecord | family read permission; ASSESSMENT; AI_PERSONALIZATION only if AI wording is used | Review insight | Wave 1 |
| F06 Growth Priority | `ConfirmGrowthPriority` | M2GrowthPriority | parent confirmation or advisor review; GROWTH_TRACKING; AI_PERSONALIZATION for AI recommendation | Confirm priority | Wave 2 |
| F07 Intervention Detail | Intervention read + `AssignGrowthAction` | M2Intervention, M2GrowthAction | actor can start plan; GROWTH_TRACKING; LOW human gate | Start plan | Wave 2 |
| F08 Today Growth Action | GrowthAction read/update | M2GrowthAction | actor operates assigned action; GROWTH_TRACKING; safety block respected | Complete action | Wave 2 |
| F09 Action Reflection | `RecordGrowthEvent` | M2GrowthEvent, EvidenceRecord | actor owns check-in; GROWTH_TRACKING; safety signals route before normal continuation | Submit reflection | Wave 2 |
| F10 Family Timeline | Timeline read | M2GrowthEvent, M2Milestone | family read permission; GROWTH_TRACKING; sensitive safety items hidden/routed | Review events | Wave 3 |
| F11 Growth Review | `EvaluateGrowthOutcome` + review read | M2Outcome, M2GrowthReview | family read permission; GROWTH_TRACKING; AI_PERSONALIZATION for AI explanation | Understand change | Wave 4 |
| F12 Family AI | Future Model Gateway / AI Companion API | AIRecommendation, EvidenceReference | family read permission; AI_PERSONALIZATION; policy/safety route; MODEL_IMPROVEMENT not implied | Ask scoped AI help | Wave 4 |

## 3. Wave Closure Requirements

| Wave | Backend | Frontend | Demo |
|---|---|---|---|
| M2-WAVE-1 Understand | Onboarding, Perspective, Evidence, limited Profile | F01-F05 | Family completes onboarding and sees first Growth Insight. |
| M2-WAVE-2 Act | Priority, Intervention, GrowthAction, Event check-in | F06-F09 | Parent completes `LISTEN_BEFORE_RESPOND` today action. |
| M2-WAVE-3 Observe | GrowthEvent, Milestone, timeline read | F10 | Family sees events/milestones over 7 days. |
| M2-WAVE-4 Understand Change | Outcome, GrowthReview, minimal AI | F11-F12 | Family sees review and asks journey-scoped AI explanation. |

## 4. E2E Requirement

Each wave must include browser-level E2E evidence for the corresponding UI path. API tests alone do not close the wave.

## 5. Forbidden Contract Shortcuts

- Do not ship backend-first with placeholder UI as wave completion.
- Do not compute Growth State in the frontend without backend contract.
- Do not fake Consent, Perspective, Evidence, AI explanation, or Outcome locally.
- Do not treat a generic chat endpoint as Family AI completion.
- Do not ship Growth Profile as score/radar/ranking visualization.
