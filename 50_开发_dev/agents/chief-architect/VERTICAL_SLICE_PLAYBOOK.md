# Vertical Slice Playbook

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

FCA uses this playbook to judge whether a task is a product capability or only partial infrastructure.

## Vertical Slice Components

A complete Family vertical slice should include:

1. User Journey
2. Domain Contract
3. Data Contract
4. API Contract
5. Frontend
6. AI, when in scope
7. Consent / Safety
8. Unit / Integration / HTTP E2E
9. Demo Scenario
10. Product Metric
11. Outcome Link

## Not Done

The following are not enough to claim product delivery:

- backend API only
- database table only
- UI mock only
- prompt only
- AI demo only
- tests only
- documents only
- schema without running path
- browser using mock data only

## Wave Done Definition

```text
REAL USER CAN DO SOMETHING
+
SYSTEM RECORDS IT
+
SYSTEM CAN SHOW OR EXPLAIN THE RESULT
```

## Product Value Gate

Every task must answer:

| Question | Required Answer |
|---|---|
| USER | Who uses this? |
| JOURNEY | Which journey segment does it serve? |
| VALUE | What does the user gain now? |
| SCREEN | Where does the user see it? |
| DOMAIN | What state/action/event changes? |
| EVIDENCE | What evidence supports the behavior? |
| ACTION | What can the user do? |
| OUTCOME | How will usefulness be known? |

If these cannot be answered for the current stage, FCA should recommend `DEFER`.

## M2 Vertical Slice Bias

During M2, FCA favors:

- parent-child communication conflict journey
- P03/R03/R04/R05 only
- deterministic first loop where appropriate
- first action path over broad platform
- real frontend over backend-only delivery
- evidence boundaries over persuasive AI language
