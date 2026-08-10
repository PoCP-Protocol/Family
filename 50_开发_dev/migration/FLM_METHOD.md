# FLM - Family Legacy Migration Method

status: ACTIVE_LM0_METHOD
version: 1.0
date: 2026-08-10

## Definition

FLM is the Family legacy semantic migration method. It is the required method for migrating the Bangyang Education legacy business world into Family.

FLM is not database copy, table cloning, or post-launch cleanup. FLM is a controlled path from old business reality to the Family Growth System of Record.

## Method Flow

```text
旧业务世界
-> 系统发现 Discovery
-> 业务语义识别
-> Identity / Consent / Provenance
-> Semantic Mapping
-> Transform / Integrate / Retain / Retire
-> Shadow Validation
-> Pilot
-> Dual Run
-> Domain Cutover
-> Family Growth System of Record
```

## Waves

- LM0 Discover
- LM1 Map
- LM2 Shadow
- LM3 Pilot
- LM4 Dual Run
- LM5 Cutover

## Object Strategy

Every legacy object must be classified as exactly one of:

- TRANSFORM
- MIGRATE
- INTEGRATE
- RETAIN
- RETIRE

UNKNOWN is allowed only during LM0 discovery and must not pass LM0 final gate for P0 systems.

## Non-Negotiable Principles

### Family Defines The New World

Family Ontology defines the target model. Legacy fields may map to Family targets only after semantic review. Legacy fields must not force Family Ontology changes.

Forbidden examples:

- legacy `family_score` -> Family field
- legacy `customer_level` -> GrowthProfile state
- legacy `student_level` -> Child canonical status
- legacy `risk_score` -> Fact
- legacy `family_type` -> Family canonical type

### Identity Before Business

Migration order is:

```text
External ID
-> Family
-> Parent
-> Child
-> Relationship
-> Consent
-> Growth History
-> Journey
-> Action/Event
-> Service
-> Content
```

No course, check-in, assessment, or service record may be promoted to canonical before identity and guardian boundaries are known.

### Legacy Conclusions Drop One Level

- Legacy rebellion label -> Legacy Annotation / Perspective
- Legacy assessment score -> Historical Evidence
- Legacy AI diagnosis -> Historical AI Hypothesis
- Legacy check-in completion -> Historical Action Check-in

Forbidden mappings:

- legacy score -> GrowthProfile
- legacy AI judgment -> Fact
- legacy check-in -> Outcome

### Consent Is Rebuilt

Registration, purchase, assessment, group membership, or course enrollment does not equal Family consent for SERVICE, ASSESSMENT, GROWTH_TRACKING, AI_PERSONALIZATION, or MODEL_IMPROVEMENT.

### Mature External Systems Stay External

- CRM -> CRM Adapter
- Order -> Commerce Adapter
- Payment -> Commerce Adapter
- LMS -> LMS Adapter
- WeCom -> Community Adapter
- Live -> Learning Adapter
- Support -> Support Adapter

Family consumes only external_ref, business_event, journey_signal, and service_signal until domain cutover is explicitly approved.

## Four Migration Data Zones

```text
SOURCE
-> RAW
-> STAGING
-> QUARANTINE when uncertain
-> CANONICAL after gate approval
```

RAW is immutable, original, and traceable.

STAGING normalizes, dedupes, resolves identity, classifies semantics, checks consent, and validates quality.

QUARANTINE receives AMBIGUOUS_FAMILY, UNKNOWN_CHILD, UNKNOWN_GUARDIAN, INVALID_CONSENT, UNKNOWN_LABEL, UNVERIFIED_AI_DIAGNOSIS, ORPHAN_ASSESSMENT, and ORPHAN_CHECKIN.

CANONICAL receives only gated Family, Person, Relationship, Evidence, Journey, Action, Event, and Timeline objects.

## Current Authorization

Current authorization is LM0 only: READ, DISCOVER, PROFILE, CLASSIFY, DOCUMENT, DESIGN CONTRACTS, BUILD READ-ONLY TOOLING, BUILD VALIDATORS, and BUILD LOCAL/ISOLATED STAGING MODELS.

Forbidden now: LM1 mapping confirmation, Shadow Import, Pilot, Dual Run, Cutover, production loader, and production Family writes.
