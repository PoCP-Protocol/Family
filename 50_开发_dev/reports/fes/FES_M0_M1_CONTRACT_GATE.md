# FES-M0 + FES-M1 Contract Gate

FES is a real AI Native education business operations system boundary. It is not a mock legacy database, not Family Core, and not an LR1-only reference document set.

## Scope Frozen

- Applications: `apps/fes-api`, `apps/fes-web`
- Contract packages: `packages/fes-contracts`, `packages/ai-gateway`
- First business slice: Customer -> Student -> Assessment -> AI Assessment Draft -> Human Confirm Report -> Course Enrollment -> 7-Day Tasks -> Check-in -> Advisor AI Summary -> Human Save Service Note
- Database ownership: FES owns its PostgreSQL operational schema in future implementation; Family Core does not own FES tables.
- FLM readiness: FES records `source_id`, timestamps, version, provenance, actor, synthetic marker, and business status where applicable.

## Gate Verdict

```text
APPLICATION_BOUNDARY = PASS
DOMAIN_MODEL = PASS
DATABASE_BOUNDARY = PASS
FIRST_VERTICAL_SLICE = PASS
AI_GATEWAY_CONTRACT = PASS
AI_ASSESSMENT_USE_CASE = PASS
ADVISOR_COPILOT_USE_CASE = PASS
SYNTHETIC_DATA_DESIGN = PASS
FLM_COMPATIBILITY = PASS
NO_FAMILY_ONTOLOGY_POLLUTION = PASS
BLOCKERS = 0
READY_FOR_FES_M1_IMPLEMENTATION = YES
```

## Non-Negotiable Boundaries

- `customer != Family`
- `contact != Parent`
- `student != Child`
- `score != GrowthProfile`
- `tag != Fact`
- `AI report != Diagnosis`
- `course complete != Growth`
- `check-in != Outcome`

## AI Control Pattern

`Business Context -> AI Use Case -> Model Gateway -> Structured Output -> Schema Validation -> Policy -> Human Confirmation -> Business Action`

Business modules may not call model provider SDKs directly. AI output may draft or summarize, but it may not directly mutate canonical business transactions.

## Source Truth

Bangyang real source system remains unavailable. No claim is made for `REAL_SOURCE_VERIFIED`, `REAL_SCHEMA_VERIFIED`, or `REAL_DATA_MIGRATED`. FES becomes the future runnable source system for FLM adapter, anti-corruption, and migration-readiness testing.
