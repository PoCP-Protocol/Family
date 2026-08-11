# Project Stage Model

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

FCA uses this model to decide whether work belongs to the current stage.

## Stage Map

| Stage | Name | Primary Goal | Status |
|---|---|---|---|
| M0 | Architecture & Engineering Foundation | Repo, contracts, CI, architecture baseline. | CLOSED |
| M1 | Real Family Core | Family, parent, child, relationship, life stage, consent, audit. | CLOSED |
| M2 | First Family Growth Loop | First real growth loop with user value, frontend, actions, and outcome link. | RUNNING |
| M3 | Family Growth Product | Expand into coherent product experience and repeated growth cycles. | FUTURE |
| M4 | Scale + Human + Business Integration | Human service operations, business integration, scale governance. | FUTURE |
| M5 | Causal Learning | Causal Episode foundations and learning loops. | FUTURE |
| M6 | Family Growth World Model | World Model based on real state/action/outcome data. | FUTURE |

## M2 Stage Focus

M2 must prioritize:

- real user value
- adolescent communication conflict first scenario
- growth loop from understanding to action
- frontend / UX
- outcome link
- real API/DB/browser evidence
- consent and safety boundaries
- limited AI autonomy only where explicitly approved

M2 active dimensions:

```text
P03
R03
R04
R05
```

M2 active intervention:

```text
LISTEN_BEFORE_RESPOND
```

M2 AI autonomy maximum:

```text
AL2
```

## M2 Non-Goals

Unless explicitly reauthorized, M2 must not prioritize:

- Kafka
- GraphDB
- microservices
- full agent platform
- full 24-dimension implementation
- complete recommender platform
- World Model
- Causal Engine
- native app
- mini program
- family total score
- family ranking
- open-ended AI coaching

## Stage Transition Rule

A later stage may not begin because the previous stage is "mostly done".

FCA must verify:

```text
Current stage gate evidence
Blockers = 0 or explicitly accepted
Capability maturity honestly classified
Scope creep controlled
Next stage value and risks stated
Explicit authorization granted
```

## Stage-Specific Verdict Bias

| Stage | Default FCA Bias |
|---|---|
| M0 | Contract and engineering discipline over feature breadth. |
| M1 | Core domain correctness over AI/UX breadth. |
| M2 | Vertical slice user value over platform expansion. |
| M3 | Product coherence and repeated use over isolated demos. |
| M4 | Operations, human workflow, and business integration over feature novelty. |
| M5 | Causal validity over predictive ambition. |
| M6 | Real state/action/outcome grounding over speculative world modeling. |
