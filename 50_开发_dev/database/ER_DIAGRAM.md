# Family ER Diagram V0.1

```mermaid
erDiagram
    FAMILIES ||--o{ PERSONS : contains
    FAMILIES ||--o{ FAMILY_RELATIONSHIPS : contains
    PERSONS ||--o{ FAMILY_RELATIONSHIPS : person_a
    PERSONS ||--o{ FAMILY_RELATIONSHIPS : person_b

    FAMILIES ||--o{ LIFE_STAGE_ASSIGNMENTS : has
    PERSONS ||--o{ LIFE_STAGE_ASSIGNMENTS : child

    FAMILIES ||--o{ CONSENTS : owns
    PERSONS ||--o{ CONSENTS : subject
    PERSONS ||--o{ CONSENTS : guardian

    FAMILIES ||--o{ GROWTH_PROFILES : has
    GROWTH_PROFILES ||--o{ GROWTH_PROFILE_DIMENSIONS : contains

    FAMILIES ||--o{ GROWTH_PRIORITIES : has

    FAMILIES ||--o{ GROWTH_JOURNEYS : follows
    GROWTH_JOURNEYS ||--o{ GROWTH_ACTIONS : contains
    GROWTH_JOURNEYS ||--o{ MILESTONES : produces

    FAMILIES ||--o{ GROWTH_EVENTS : produces
    GROWTH_EVENTS ||--o{ PERSPECTIVES : interpreted_by
    GROWTH_EVENTS ||--o{ EVIDENCE_RECORDS : supported_by

    FAMILIES ||--o{ OUTCOMES : has

    INTERVENTIONS ||--o{ GROWTH_ACTIONS : instantiates

    FAMILIES ||--o{ AUDIT_LOGS : audited
    FAMILIES ||--o{ OUTBOX_EVENTS : emits
```

## 聚合边界

### Family Aggregate
- families
- persons
- family_relationships
- life_stage_assignments
- consents

### Growth Aggregate
- growth_profiles
- growth_profile_dimensions
- growth_priorities

### Journey Aggregate
- growth_journeys
- growth_actions
- growth_events
- milestones
- outcomes

### Cross-cutting
- audit_logs
- outbox_events
- evidence_records
- perspectives
- interventions
```
