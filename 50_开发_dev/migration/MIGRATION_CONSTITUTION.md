# Family Legacy Migration Constitution V1.1

status: SOURCE_UNAVAILABLE_FELS_REFERENCE_TRACK
date: 2026-08-10

## Mission

Family owns family-growth semantics. Education business systems retain professional transaction capabilities where they are already mature. The migration program links them through Adapter contracts and moves only bounded, provenance-rich, reviewed data into Family canonical objects.

Current ruling: the real Bangyang source system is not available. No real source code, database, API, table structure, export, or runtime may be claimed as verified. FELS - Family Education Legacy System - is the approved runnable reference legacy implementation for FLM validation. FES - Family Education System - is the future AI Native education business operations system; it is not Legacy, not FELS, and not evidence of Bangyang production data.

Taxonomy:

```text
Bangyang Legacy = real historical old system = currently UNAVAILABLE
FELS = Family Education Legacy System = runnable Reference Legacy Implementation
FES = Family Education System = future AI Native education business operations system
FLM = Family Legacy Migration Method = semantic migration method
Family = New World / Family Growth Canonical System of Record
```

## Core Principle

Legacy migration is Semantic Migration, not ETL.

```text
Legacy Systems
-> Raw Landing Zone
-> Migration Staging
-> Identity Resolution
-> Semantic Mapping
-> Data Quality / Consent / Safety Validation
-> Quarantine / Human Review when needed
-> Migration Named Actions after approval
-> Family Canonical Ontology
```

The governing method is FLM - Family Legacy Migration Method:

```text
LM0 Discover
LM1 Map
LM2 Shadow
LM3 Pilot
LM4 Dual Run
LM5 Cutover
```

Every real external-source object must be classified as TRANSFORM, MIGRATE, INTEGRATE, RETAIN, or RETIRE. UNKNOWN is allowed only during LM0 discovery and cannot pass LM0 final gate for a real P0 source. When the real source is unavailable, `LM0_B_REAL_SOURCE_DISCOVERY = SUSPENDED_NOT_BLOCKED` and no fabricated schema may be promoted to evidence.

## Red Lines

- Legacy label must not become Fact.
- Legacy score must not become Growth State.
- Legacy AI report must not become Diagnosis.
- Legacy check-in must not become Outcome.
- Course completion must not imply growth improvement.
- Historical customer relationship must not become Consent.
- Legacy WeChat or WeCom group membership must not become FamilyRelationship.
- Same phone number must not automatically merge families.
- Legacy minor data must not become AI training permission.
- Legacy table shape must not force Family Ontology shape.
- Legacy customer ID must not become Family ID.
- Legacy student ID must not become Person ID.
- Production Family writes are forbidden during LM0.
- Shadow, Pilot, Dual Run, and Cutover are forbidden during LM0.

## Semantic Rules

- Perspective != Fact.
- Hypothesis != Fact.
- Recommendation != Decision != Action.
- Relationship != Consent.
- GrowthProfile is a working model, not truth.
- Evidence must retain source, source entity, source timestamp, migration batch, rule version, and original payload reference.

## System Boundaries

Family is the system of record for:

- Family identity
- Parent / Child / Relationship
- Consent
- Growth Profile / Priority / Journey
- Intervention / Action / Event / Outcome
- Family Timeline

External systems remain systems of record for:

- CRM lead and opportunity
- Order and payment transactions
- LMS class and teaching operations
- Live delivery technology
- Support channel operations

FES is the future owned source system for education business operations:

- Customer / Contact / Student
- Assessment / Course / Enrollment / Task / CheckIn
- Advisor / ServiceNote / business service workflow
- AI-assisted assessment draft and advisor summary with human confirmation

FELS is the approved reference legacy source for FLM hardening only. FELS rows, tags, scores, reports, and AI conclusions are not Bangyang production facts and must not become Family canonical truth.

## LM0 Scope

LM0 may create catalogs, inventories, mapping drafts, control rules, read-only discovery tooling, validators, local or isolated staging models, and discovery reports when a real source exists. In the current source-unavailable state, work shifts to FELS reference-source hardening and FLM compatibility design. It must not create production import code, mutate core database schema, confirm mappings against a nonexistent source, run Shadow import, or claim production migration readiness.

## Source And Migration Data Zones

- SOURCE: observed external origin outside Family management, FELS when explicitly used as a reference legacy implementation, or the future FES source boundary when FES is implemented and run as a separate education business system.
- RAW: immutable original data reference; full sensitive payload must not be copied into audit tables.
- STAGING: normalized, deduped, identity-resolved, classified, and validated candidates.
- QUARANTINE: unresolved, ambiguous, invalid, or unsafe records requiring review.
- CANONICAL: Family domain objects written only through approved migration actions after gate approval.

The four managed migration zones are RAW, STAGING, QUARANTINE, and CANONICAL.

## Migration Control Model

Future imports must be batch-scoped, idempotent, auditable, provenance-rich, and reversible by batch where domain rules permit. Direct SQL writes into Family core tables are forbidden. Production migration must go through Migration Command, Validation, Named Migration Action, and Family Domain.
