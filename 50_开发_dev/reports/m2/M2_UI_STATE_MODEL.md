# M2 UI State Model

date: 2026-08-10
status: PROPOSED_REQUIRED_FOR_M2
implementation_started: NO

## 1. Required State Axes

Every M2 Family Web screen must model these state axes explicitly:

| Axis | Values |
|---|---|
| Data | loading, ready, empty, error |
| Permission | unauthenticated, unauthorized, allowed |
| Consent | missing_required, granted_required, ai_personalization_missing, separate_optional_missing |
| Safety | allow, needs_review, safety_escalation |
| Journey | not_started, onboarding, understanding, acting, observing, reviewing, complete |
| AI | disabled, eligible, loading, response_ready, blocked_by_consent, blocked_by_safety, unavailable |

## 2. Growth State Display

UI may display only the approved Growth State vocabulary:

```text
EMERGING
DEVELOPING
PRACTICING
STABILIZING
```

Growth State is a qualitative state with evidence. It is not a score, grade, rank, percentile, or family comparison.

## 3. Perspective State

Perspective cards must show source and boundary:

| State | UI Label |
|---|---|
| parent perspective | Parent Perspective |
| child perspective | Child Perspective |
| advisor observation | Advisor Observation |
| evidence | Evidence |
| ai hypothesis | AI Hypothesis, not Fact |
| recommendation | Recommendation, requires human decision before action |

## 4. Consent UX State

Consent state must be purpose-specific.

| Purpose | UX Rule |
|---|---|
| SERVICE | Required for core service use. |
| ASSESSMENT | Required before assessment-like onboarding/perspective processing. |
| GROWTH_TRACKING | Required before journey/action/event/outcome tracking. |
| AI_PERSONALIZATION | Required before personalized Family AI. |
| MODEL_IMPROVEMENT | Separate and optional; never implied by AI personalization. |
| RESEARCH | Separate and optional. |
| CONTENT_PUBLICATION | Separate and optional. |

## 5. AI Interaction State

Family AI entry points are journey-scoped:

```text
Today Insight
Why this Priority?
Help me do this Action
Reflect after Action
Explain this Growth Review
```

The UI must not default to a generic "ask me anything" shell. Free text may exist only inside a scoped context with consent, safety, and evidence boundaries.

## 6. Error And Review Routing

Safety escalation overrides normal UI continuation:

```text
ALLOW -> normal journey
NEEDS_REVIEW -> advisor/safety review UX
SAFETY_ESCALATION -> stop normal growth flow and show escalation route
```

No UI may invite the user to continue a normal Growth Action after `SAFETY_ESCALATION`.

## 7. Per-Wave State Acceptance

| Wave | Required State Coverage Before Done |
|---|---|
| Wave 1 Understand | F01-F05 include loading, empty, validation error, missing consent, unauthorized, and safety escalation states. |
| Wave 2 Act | F06-F09 include recommendation vs decision state, assigned vs unassigned action state, complete/partial/skipped state, and safety-routed reflection state. |
| Wave 3 Observe | F10 includes no-events, events-without-milestone, milestone-confirmed, and sensitive-event-hidden states. |
| Wave 4 Understand Change | F11-F12 include outcome-window-not-ready, review-ready, AI-consent-missing, model-unavailable, and AI-safety-blocked states. |
