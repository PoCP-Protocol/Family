# M2 User Journey

date: 2026-08-10
status: PROPOSED_REQUIRED_FOR_M2
implementation_started: NO

## 1. Decision

M2 is no longer a backend-only Growth implementation. The first Growth vertical slice must deliver a real Family Web user journey together with Domain, API, AI, tests, and demo flow.

M2 first user experience is:

```text
Family Home -> Growth Onboarding -> Parent Perspective -> Child Perspective -> Growth Insight -> Growth Priority -> Intervention Detail -> Today Action -> Action Reflection -> Family Timeline -> Growth Review -> Family AI
```

## 2. Primary Users

| User | Role In Slice | Boundary |
|---|---|---|
| Parent / Guardian | Starts onboarding, records parent perspective, confirms priority, performs action, reflects. | Must not see score/ranking framing. |
| Child | Records child perspective in child-appropriate language. | Must be separated from parent perspective and protected by consent/minor-data rules. |
| Family Advisor | Reviews safety/medium-risk cases and can help confirm profile/priority. | Not required in first public UI unless M2 wave explicitly includes staff workflow. |
| Family AI | Embedded companion inside the journey. | Cannot be a generic chat shell or direct core-state writer. |

## 3. Journey Narrative

1. Parent opens Family Home and sees the current family journey, not courses, marketplace, or expert upsell.
2. Parent starts Growth Onboarding for the 12-15 parent-child communication conflict slice.
3. Parent records their view of recent communication friction.
4. Child records a separate perspective with different wording and tone.
5. Family sees Growth Insight that explicitly separates Perspective, Evidence, and AI Hypothesis.
6. Family confirms a 7-day Growth Priority.
7. Family views `INTERVENTION-001 / LISTEN_BEFORE_RESPOND`.
8. Parent performs Today Action.
9. Parent checks in and reflects after action.
10. Family sees Timeline events and milestones.
11. Family sees Growth Review after the outcome window.
12. Family AI helps explain insight, priority, action, reflection, and review in context.

## 4. Demo Flow

The M2 demo must show a family using the responsive web UI end to end:

```text
Open Family Home
-> complete onboarding
-> submit parent perspective
-> submit child perspective
-> view first Growth Insight
-> confirm priority
-> start LISTEN_BEFORE_RESPOND
-> complete today action
-> check in
-> view timeline
-> view review
-> ask Family AI a journey-scoped question
```

## 5. Non-Negotiable UX Principles

- Family is not a course mall, activity portal, expert marketplace, or membership storefront.
- Home prioritizes current family state, current journey, and today's action.
- Growth visualization uses states and evidence, not scores, rankings, or percentile comparisons.
- Parent Perspective and Child Perspective must remain visually and semantically distinct.
- AI Hypothesis must not be styled as Fact.
- AI Recommendation must explain evidence sources.
- Child data must follow Consent and Minor Data rules.
- AI is embedded into the Growth Journey, not presented as an isolated generic chatbot.
