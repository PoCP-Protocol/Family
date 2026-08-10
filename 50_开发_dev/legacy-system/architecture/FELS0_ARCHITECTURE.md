# FELS-0 Architecture

```text
REFERENCE_IMPLEMENTATION = TRUE
REAL_BANGYANG_SOURCE = FALSE
```

FELS models the old-world education business system that FLM will migrate from. It intentionally keeps legacy semantics instead of reusing Family ontology names.

## System Boundary

```text
FELS legacy API / export / DB snapshot
  -> FLM semantic migration layer
  -> Family system of record
```

FELS owns only `family_legacy` and uses only `LEGACY_DATABASE_URL`. It must never silently reuse Family `DATABASE_URL` or place FELS tables in the Family canonical schema.

## Architecture Style

- Backend: TypeScript/NestJS-compatible modular monolith.
- Frontend: simple internal operations admin.
- Database: PostgreSQL, FELS-only schema.
- API: REST plus read-only legacy export endpoints.
- Auth: dev/simple role auth in early phases.
- Excluded: microservices, Kafka, GraphDB, Agent Runtime, World Model, complex IAM, real payment integration.

## Primary Journey

Lead -> Customer -> Student registration -> Assessment -> Assessment Report -> Course / Program purchase -> Enrollment -> Advisor onboarding -> 21-Day / 90-Day Program -> Daily Task -> Check-in -> Advisor Feedback -> Stage Report -> Membership / Renewal.

## Boundary Rules

- Customer != Family.
- Contact != Parent.
- Student != Child.
- StudentGuardian != FamilyRelationship.
- AssessmentScore != GrowthState.
- LegacyCheckIn != Outcome.
- Purchase != Consent.
- CommunityMember != FamilyRelationship.
- LegacyAIReport != Fact.
- family_score and ranking are allowed in FELS only as `LEGACY_DERIVED` and are retired before Family.

## FELS-0 Executable Assets

- `legacy-system/contracts`: executable architecture contract and 55/55 coverage tests.
- `legacy-system/apps/api`: minimal API health and source snapshot contract.
- `legacy-system/apps/web`: minimal internal admin shell contract.
- `legacy-system/db/migrations`: FELS-only DB schema contract.
- `legacy-system/synthetic`: synthetic data specification.