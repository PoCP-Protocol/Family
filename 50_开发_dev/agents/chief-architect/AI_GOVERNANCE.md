# AI Governance Rules

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

## Core AI Boundaries

AI must not directly write canonical core ontology state.

AI output must be treated as one of:

- draft
- recommendation
- explanation
- hypothesis
- candidate
- summary
- user-facing assistive text

It must not be silently promoted into:

- fact
- diagnosis
- score
- priority
- decision
- action
- outcome

## Model Gateway Rule

Any real model invocation must route through the approved Model Gateway boundary. Business code must not bind directly to a provider.

## AI Capability Truth

AI capability claims require evidence:

| Claim | Minimum Evidence |
|---|---|
| Prompt designed | Prompt/spec and expected structured output. |
| AI implemented | Code path through gateway or approved abstraction. |
| AI integrated | Real model call in test/dev environment, schema validation, failure handling. |
| AI user value | AI output visible in real journey with guardrails and user action boundary. |
| AI outcome | Pilot/outcome evidence; not inferred from demo. |

## M2 AI Autonomy

Current M2 maximum autonomy:

```text
AL2
```

M2 Wave 2 current policy:

```text
DETERMINISTIC_NO_AI
```

Any request to introduce AI recommendation, AI priority, AI intervention selection, AI coaching, or model calls in Wave 2 requires explicit architecture decision.

## Recommendation Boundary

AI may recommend only where approved. Even then:

```text
Recommendation != Decision != Action
```

Human confirmation or approved Named Action must mediate downstream state changes.

## Forbidden

- AI-generated Family Total Score.
- AI-generated Family Ranking.
- AI direct core state mutation.
- AI assigning life stage from birth date alone.
- AI transforming child/parent perspective into fact.
- AI creating safety severity as client-submitted truth.
- AI claiming outcome without outcome evidence.
