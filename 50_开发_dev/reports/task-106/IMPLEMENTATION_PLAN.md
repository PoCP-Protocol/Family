# TASK-106 GrantConsent Implementation Plan

status: PLANNING_ONLY
depends_on: TASK-105 PASS
action: GrantConsent
implementation_started: NO

## Scope

Plan only for `GrantConsent` Named Action. Do not implement code, migrations, controller routes, service methods, OpenAPI changes, tests, or consent side effects until TASK-106 is explicitly authorized.

## Contract Basis

- Action spec: `specs/actions/GrantConsent.action.yaml`.
- Ontology: `specs/ontology/consent.schema.yaml`.
- Event: `specs/events/ConsentGranted.event.yaml`.
- Policy: `specs/policies/consent.policy.yaml`.
- Existing DB table: `consents` in `database/migrations/0001_family_identity.sql`.

## HTTP Contract To Confirm During Implementation

- Route should follow existing Family Core write style, likely `POST /families/{familyId}/consents` unless OpenAPI/action specs prescribe a different existing path.
- Required header: `x-actor-id`.
- Optional headers: `x-correlation-id`, `x-source`.
- Request body fields from action contract: `subject_person_id`, `guardian_person_id`, `purpose`, `policy_version`, `idempotency_key`.
- Response should return the created/versioned `Consent` DTO.

## Domain Preconditions

- Family must exist.
- Subject must belong to the route family.
- Guardian must belong to the route family.
- Guardian authorization must be validated for the subject.
- `purpose` must be one of the purpose-specific consent enum values.
- `policy_version` is mandatory and non-empty.
- Actor identity alone is not enough; authorization logic must be explicit and tested.

## Purpose-Specific Consent Rules

- Consent is purpose-specific.
- `SERVICE` does not imply `MODEL_IMPROVEMENT`.
- `RESEARCH` does not imply `CONTENT_PUBLICATION`.
- A grant for one purpose must not create records for other purposes.
- Withdrawal behavior is not implemented by GrantConsent unless a separate approved action requires it.

## State Mutation

- Create or version a consent record for exactly one `purpose`.
- New successful grant should have `status = GRANTED`, `policy_version`, and `granted_at`.
- Do not delete audit history.
- Do not create LifeStage, GrowthProfile, Journey, Intervention, recommendation, ranking, or AI processing state.

## Idempotency

- Use `idempotency_keys` with `action_name = GrantConsent`.
- Request hash should include `family_id`, `subject_person_id`, `guardian_person_id`, `purpose`, and `policy_version`.
- Same key + same request replays the stored response.
- Same key + different request returns conflict.
- Replay must not duplicate consent, audit, or outbox rows.

## Transaction Boundary

One PostgreSQL transaction should cover:

- idempotency lock
- family existence check
- subject/guardian lookup
- guardian authorization check
- consent create/version logic
- audit insert
- outbox insert
- idempotency response storage
- commit

Controlled failures must roll back all writes.

## Audit And Event

- Audit action: `GrantConsent`.
- Resource type: `Consent`.
- Event name: `ConsentGranted`.
- Required event fields: `event_id`, `family_id`, `consent_id`, `purpose`, `occurred_at`, `actor_id`, `correlation_id`.
- Event metadata requires `source` and `schema_version`.

## Tests To Write After Authorization

- DTO/unit: valid request, invalid UUIDs, invalid purpose, missing policy_version, unknown fields, empty idempotency key.
- Integration: success, missing family, subject outside family, guardian outside family, unauthorized guardian, idempotency replay/conflict, audit/event assertions.
- Policy tests: `SERVICE` grant does not create `MODEL_IMPROVEMENT`; `RESEARCH` does not create `CONTENT_PUBLICATION`.
- Side-effect tests: no LifeStage, relationship, growth profile, journey, intervention, recommendation, score, or ranking records.
- HTTP E2E: success and controlled 400/401/403/404/409 failures.

## Open Questions For TASK-106 Start

- Exact guardian authorization rule source: relationship records, parent role, or a dedicated policy helper.
- Whether an existing active consent for the same subject/purpose should be superseded, reused, or versioned with an explicit historical status.
- Exact OpenAPI path if a placeholder already exists.

## Stop Condition

This is a planning artifact only. TASK-106 implementation remains not started.