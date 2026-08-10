# Architecture Decision Registry

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

This registry records active architecture decisions FCA must enforce. Existing decisions are not reopened during normal task execution. Reversal or material change requires RFC or explicit architecture decision review.

## Active Decisions

| ADR | Title | Decision | Status |
|---|---|---|---|
| ADR-001 | Modular Monolith First | Family starts as a modular monolith; no premature microservices. | ACCEPTED |
| ADR-002 | Family Ontology Owned | Core Family ontology is owned by Family specs and Named Actions. | ACCEPTED |
| ADR-003 | Perspective Is Not Fact | User perspectives must not be treated as canonical facts. | ACCEPTED |
| ADR-004 | No Family Total Score | Family must not expose a total family score. | ACCEPTED |
| ADR-005 | AI Cannot Directly Modify Core Ontology | AI free text cannot directly write canonical core state. | ACCEPTED |
| ADR-006 | Relationship Is Not Consent | Relationship/permission does not imply purpose-specific consent. | ACCEPTED |
| ADR-007 | birth_date Is Not AssignLifeStage | Birth date alone does not assign canonical life stage. | ACCEPTED |
| ADR-008 | Frontend Is First-Class Delivery | Frontend/UX is required for product capability delivery. | ACCEPTED |
| ADR-009 | Vertical Slice First | Stage delivery prioritizes complete vertical slices over platform-only work. | ACCEPTED |
| ADR-010 | M2 First Scenario | M2 first scenario is adolescent parent-child communication conflict. | ACCEPTED |
| ADR-011 | M2 First Dimensions | M2 active first dimensions are P03, R03, R04, R05. | ACCEPTED |
| ADR-012 | Intervention-001 | First intervention is `LISTEN_BEFORE_RESPOND`. | ACCEPTED |
| ADR-013 | M2 AI Autonomy | M2 maximum AI autonomy is AL1-AL2 unless explicitly changed. | ACCEPTED |
| ADR-014 | Safety Severity Server-Derived | Ordinary clients cannot submit final safety severity. | ACCEPTED |
| ADR-015 | Profile Is Working Model | GrowthProfile is an interpretive working model, not truth. | ACCEPTED |
| ADR-016 | E1 Cannot Confirm Practicing/Stabilizing | E1-only evidence cannot confirm higher maturity states such as PRACTICING/STABILIZING. | ACCEPTED |
| ADR-017 | GrowthPriority Is Human-Confirmed Focus | GrowthPriority is not AI conclusion, score, or ranking. | ACCEPTED |
| ADR-018 | Wave 2 Is Deterministic No-AI | M2 Wave 2 priority/action flow is deterministic unless reauthorized. | ACCEPTED |

## ADR Enforcement Rule

When a task conflicts with an accepted ADR, FCA must return one of:

```text
FAIL - conflicts with accepted ADR
CONDITIONAL_PASS - may proceed only if scope is narrowed
RFC_REQUIRED - implementation blocked pending decision
```

## ADR Record Template

```text
ADR-XXX: Title
Status: PROPOSED | ACCEPTED | SUPERSEDED | REJECTED
Date:
Context:
Decision:
Rationale:
Allowed:
Forbidden:
Impact:
Requires RFC: YES | NO
```
