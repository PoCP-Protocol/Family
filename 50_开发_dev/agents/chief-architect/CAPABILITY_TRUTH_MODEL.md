# Capability Truth Model

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

FCA uses this model to prevent fake capability claims.

## Maturity Levels

| Level | Name | Meaning | Minimum Evidence |
|---:|---|---|---|
| L0 | IDEA | The capability is only an idea or intent. | Notes, proposal, or discussion. |
| L1 | DESIGNED | The behavior is designed. | Product/design/spec document with boundaries. |
| L2 | CONTRACTED | Contracts exist. | Schema, API, DB contract, event/action contract, policy contract. |
| L3 | IMPLEMENTED | Code exists. | Implementation and unit tests, but not necessarily real integration. |
| L4 | INTEGRATION_TESTED | Real integration is verified. | Real DB/API/HTTP/queue/model chain where applicable; executable tests pass. |
| L5 | USER_DEMOED | A real user journey can be demonstrated. | Browser or product demo with real backend/API, no mocked core path. |
| L6 | PILOT_VALIDATED | Real users used it and produced observable outcome data. | Pilot evidence, outcome records, safety/consent compliant usage. |

## Downgrade Rules

A capability must be downgraded when evidence is weaker than the claim.

Examples:

| Claim | Actual Evidence | FCA Level |
|---|---|---:|
| "Agent system exists" | Agent registry schema only | L2 |
| "Model Gateway works" | Code exists but no real model call | L3 |
| "AI profile generation works" | Prompt document only | L1 |
| "AI profile generation works" | mocked model response test only | L3 or lower |
| "Growth loop works" | backend API only, no frontend journey | L4 max if real integration passes; not L5 |
| "User value delivered" | UI mock only | L1/L2, not delivered |
| "Pilot outcome" | internal demo only | L5 max, not L6 |

## Fake Capability Check

For every claimed completed capability, FCA must ask:

```text
Does it have only documents?
Does it have only schemas?
Does it have only mocked APIs?
Does it have only unit tests?
Does it have real PostgreSQL or approved persistence?
Does it have real HTTP/API behavior?
Does it have real frontend behavior?
Does browser use the real API?
Does it use fake UUID/data in the claimed path?
Does AI really call a model, if AI is claimed?
Does AI output affect a real user journey, if AI value is claimed?
Does the user see value?
Does an Outcome or outcome link exist at the required maturity level?
```

## Evidence Requirements By Claim Type

| Claim Type | Minimum Honest Level | Required Evidence |
|---|---:|---|
| Design approved | L1 | Approved design/spec and scope. |
| Contract ready | L2 | Schema/API/action/event/policy contract. |
| Backend implemented | L3 | Code and unit tests. |
| Backend integrated | L4 | Real DB/API integration tests. |
| Product slice delivered | L5 | Real frontend + backend + data + demo. |
| AI capability implemented | L4 | Real Model Gateway/model call plus validation and tests. |
| AI user value delivered | L5 | AI output is visible in a real user journey with guardrails. |
| Business outcome validated | L6 | Pilot use and outcome evidence. |

## Review Output Requirement

Every FCA review must include:

```text
Claimed capability:
Claimed level:
Verified level:
Evidence:
Downgrade reason, if any:
```
