# Event Taxonomy V3.2

Status: ACTIVE_ARCHITECTURE_BASELINE
Date: 2026-08-10
Parent: `docs/FAMILY_TECH_ARCH_V3.2.md`

## 1. Event Ruling

```text
PRODUCT_EVENT_LEDGER = REQUIRED
PRODUCT_EVENT != GROWTH_EVENT
GROWTH_EVENT != AUDIT_EVENT
OUTBOX_EVENT != DOMAIN_EVENT
```

Family V3.2 has at least four event categories. They must not be merged for convenience.

## 2. Event Categories

| Event Type | Meaning | Primary Use | Owner |
|---|---|---|---|
| ProductEvent | User behavior, surface usage, funnel, experiment, retention | Product analytics and business learning | Analytics |
| GrowthEvent | Family growth fact/event created through Named Action | Growth OS timeline and outcome loop | Growth OS |
| AuditEvent | Governance, actor, permission, consent, safety, mutation trace | Compliance, review, accountability | Audit / Safety / Consent |
| OutboxEvent | Reliable technical delivery record | Async delivery and integration reliability | Platform |

## 3. Product Event Examples

```text
PAGE_VIEW
PRINCIPAL_QUESTION_SUBMITTED
PRINCIPAL_RESPONSE_VIEWED
ACTION_CARD_SHOWN
ACTION_CARD_ACCEPTED
CHALLENGE_VIEWED
CHALLENGE_JOINED
CHECKIN_STARTED
CHECKIN_COMPLETED
D1_RETURN
PAYWALL_VIEWED
```

These events cannot pollute GrowthEvent. If a product event leads to growth state, the bridge is a Named Action.

## 4. Minimum Product Event Envelope

```text
event_id
event_name
occurred_at

account_id
person_id
family_id nullable

session_id
anonymous_id

source
surface

experiment_id nullable

properties

consent_context
correlation_id
```

This envelope exists so Family can answer:

```text
Which user arrived from which content?
What did they ask?
What did AI answer?
Did they accept the action?
Did they return the next day?
Did they become conversion-ready?
```

## 5. Storage Ruling for 100 Families

PostgreSQL is sufficient for Family 1.0 MOS event storage and aggregation.

Forbidden for Family 1.0 MOS:

```text
Snowflake = NO
ClickHouse = NO
Kafka = NO
Flink = NO
Big Data Platform = NO
```

## 6. Bridge Rules

```text
ProductEvent ACTION_CARD_ACCEPTED
  -> ConfirmPrincipalAction
  -> Named Action
  -> GrowthAction
  -> GrowthEvent
```

```text
ProductEvent CHALLENGE_JOINED
  -> CommunityChallengeParticipation
  -> optional StartGrowthJourney confirmation
  -> Named Action
  -> GrowthJourney
```
