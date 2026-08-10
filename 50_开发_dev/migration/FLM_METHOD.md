# FLM - Family Legacy Migration Method

status: ACTIVE_METHOD_REAL_SOURCE_DEFERRED_FELS_REFERENCE_ENABLED
version: 1.0
date: 2026-08-10

## Definition

FLM is the Family legacy semantic migration method. It is the required method for moving an education business source system into Family through semantic review, adapter contracts, anti-corruption boundaries, and gated migration actions.

FLM is not database copy, table cloning, or post-launch cleanup. FLM is a controlled path from old business reality to the Family Growth System of Record.

Current ruling: no real Bangyang Education source code, database, API, schema export, or runnable environment is available. Real Bangyang discovery is therefore suspended, not failed. FELS - Family Education Legacy System - is the approved runnable reference legacy implementation for FLM anti-corruption and migration validation. FES - Family Education System - is the future AI Native education business operations system; it is not Legacy, not FELS, and not Bangyang substitute evidence.

Taxonomy:

```text
Bangyang Legacy = real historical old system = currently UNAVAILABLE
FELS = reference legacy implementation = REFERENCE_IMPLEMENTATION / RUNNABLE_LEGACY_SOURCE
FES = future AI Native education operations system = not legacy evidence
FLM = semantic translation method from old-world source to Family
Family = New World / Canonical Growth System of Record
```

## Method Flow

```text
教育业务源系统
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

- LM0 Discover, suspended when no real external source is available
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

UNKNOWN is allowed only during LM0 discovery and must not pass LM0 final gate for a real P0 external source. When no real external source exists, the real-discovery gate is `SUSPENDED_NOT_BLOCKED`; it must not be converted into fabricated schemas, fake tables, or claimed migration evidence.

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

## Source And Four Managed Migration Data Zones

```text
SOURCE (external origin, outside Family management)
-> RAW
-> STAGING
-> QUARANTINE when uncertain
-> CANONICAL after gate approval
```

SOURCE is the external origin and is not one of the managed Family migration zones.

RAW is immutable, original, and traceable.

STAGING normalizes, dedupes, resolves identity, classifies semantics, checks consent, and validates quality.

QUARANTINE receives AMBIGUOUS_FAMILY, UNKNOWN_CHILD, UNKNOWN_GUARDIAN, INVALID_CONSENT, UNKNOWN_LABEL, UNVERIFIED_AI_DIAGNOSIS, ORPHAN_ASSESSMENT, and ORPHAN_CHECKIN.

CANONICAL receives only gated Family, Person, Relationship, Evidence, Journey, Action, Event, and Timeline objects.

## Current Authorization

Current authorization is source-unavailable FLM preparation plus FELS reference-source hardening. FLM may build read-only discovery controls for FELS as a reference implementation, but this does not authorize canonical import, shadow import, pilot, dual run, cutover, or real Bangyang migration.

Forbidden now: fabricated Bangyang database/schema/API claims, LM1 mapping confirmation against a nonexistent real source, Shadow Import, Pilot, Dual Run, Cutover, production loader, and production Family writes.
