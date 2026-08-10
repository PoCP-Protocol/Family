# LM0 Legacy Discovery Report

status: DRAFT_FOR_ARCHITECT_REVIEW
date: 2026-08-10
track: FAMILY_LEGACY_MIGRATION_PROGRAM
phase: LM0_LEGACY_DISCOVERY

## Scope

LM0 is a read-only discovery and classification phase that runs in parallel with M2. It does not modify M2 business semantics, Family core Ontology, GrowthProfile semantics, production data, or cutover state.

Allowed actions: READ, DISCOVER, CLASSIFY, MAP, REPORT.

Forbidden actions:

- Production data import
- Formal Migration Loader
- Family core Ontology change
- GrowthProfile semantic change
- Formal Cutover
- Old system data deletion
- Legacy label/score/AI diagnosis promotion to Fact, Growth State, Diagnosis, or active Consent

## Sources Read

- `10_规格_spec/05_附件与研发规范/Family_现有业务迁移矩阵.csv`
- `10_规格_spec/04_实施计划/Family_M0_M6_Roadmap_V3.0.md`
- `10_规格_spec/02_总体蓝图/Family_总体蓝图方案_V2.0.md`
- `10_规格_spec/02_总体蓝图/Family_整体技术架构_V2.0.md`
- `10_规格_spec/01_实施方法论/Family_FGAIM_实施方法论_V2.0.md`
- `50_开发_dev/agents/chief-architect/CURRENT_ARCHITECT_STATE.yaml`
- `50_开发_dev/agents/chief-architect/DECISION_REGISTRY.md`

## Local Findings

- The migration matrix already defines 55 legacy assets and separates them into transform, migrate, integrate, retain/reorganize, retire, and deferred routes.
- The M0-M6 Roadmap defines M3 as Family Growth Product with legacy migration, and M4 as Scale + Human + Business Integration.
- The overall blueprint defines One Family Account and maps CRM, LMS, membership, order, service, assessment, AI conversation, and content back to `family_id`.
- The technical architecture defines Integration Platform and Anti-Corruption Layer: External DTO -> Family Canonical Model.
- FGAIM requires Data Gate clarity for source, consent, permission, and migration rules.
- The architect state says M2 is running, M3/M4 are future, and next wave start remains pending approval.
- The decision registry enforces Family Ontology ownership, Perspective != Fact, no Family Total Score, AI cannot directly modify core Ontology, and Relationship != Consent.

## LM0 Artifacts Created

- `50_开发_dev/migration/README.md`
- `50_开发_dev/migration/MIGRATION_CONSTITUTION.md`
- `50_开发_dev/migration/LEGACY_SYSTEM_CATALOG.yaml`
- `50_开发_dev/migration/SOURCE_ENTITY_CATALOG.yaml`
- `50_开发_dev/migration/TARGET_ENTITY_CATALOG.yaml`
- `50_开发_dev/migration/FIELD_MAPPING_MASTER.csv`
- `50_开发_dev/migration/SEMANTIC_MAPPING_RULES.yaml`
- `50_开发_dev/migration/CONSENT_MIGRATION_RULES.yaml`
- `50_开发_dev/migration/DATA_QUALITY_RULES.yaml`
- `50_开发_dev/migration/EXTERNAL_ID_MAPPING.yaml`
- `50_开发_dev/migration/MIGRATION_WAVES.yaml`
- `50_开发_dev/migration/SYSTEM_OF_RECORD_MATRIX.yaml`
- `50_开发_dev/migration/LEGACY_DATA_INVENTORY.csv`
- `50_开发_dev/migration/LEGACY_ID_INVENTORY.csv`
- `50_开发_dev/migration/LEGACY_API_INVENTORY.csv`
- `50_开发_dev/migration/LEGACY_CONSENT_INVENTORY.csv`

## Route Summary

TRANSFORM candidates:

- Customer / Contact / Student / Relationship
- Assessment, AI diagnosis, family profile, user tags
- Task, check-in, growth report, service notes

MIGRATE candidates:

- Historical assessment evidence
- Historical growth data
- Historical action and check-in events
- Service interactions and family timeline records after review

INTEGRATE candidates:

- CRM
- LMS / teaching operations
- Order / payment
- Live SaaS
- Support / community channels

RETAIN + REORGANIZE candidates:

- Course
- Training camp
- 21-day challenge
- 90-day journey
- Advisors, assistants, experts, community, activities, SOPs

RETIRE candidates:

- Leaderboard
- Family total score

## Open Risks

Consent risks:

- Legacy registration, purchase, assessment submission, AI chat, and community membership are not sufficient Family Consent.
- Minor data and model-improvement permissions require explicit purpose-specific proof.

Identity risks:

- Phone-only matching can merge unrelated families.
- Child name plus age is not enough for automatic child matching.
- Legacy CRM customer, contact, student, and user IDs may represent different entity scopes.

Semantic risks:

- Old labels and AI reports may look like conclusions but are only historical perspective or hypothesis.
- Old completion/check-in records do not prove Outcome.
- Course completion does not prove growth improvement.

## LM0 Status

```text
LEGACY_SYSTEMS_DISCOVERED = 8 draft system groups
SOURCE_ENTITIES = 15 draft source entity groups
P0_ENTITIES = Customer, Contact, Student, FamilyLink, AssessmentRecord, AIDiagnosis, LegacyProfileOrTag, Course, ProgramOrCamp, Task, CheckIn, ServiceNote, Order, Payment, ConsentRecord
INTEGRATE_ENTITIES = Order, Payment, CRM Lead/Opportunity, LMS Class/Program, Live Session, Support Ticket, Community Channel
TRANSFORM_ENTITIES = Customer, Contact, Student, FamilyLink, AIDiagnosis, LegacyProfileOrTag, Task, ServiceNote, Course
MIGRATE_ENTITIES = AssessmentRecord, CheckIn, historical growth records, historical service interactions after review
RETAIN_ENTITIES = Course, Training Camp, 21-Day Challenge, 90-Day Journey, Advisor, Assistant, Expert, Community, Activity, SOP assets
RETIRE_ENTITIES = Leaderboard, Family Total Score
UNKNOWN_SEMANTICS = exact legacy schemas, real table counts, actual API contracts, consent proof formats, assessment instruments, course-to-dimension evidence
CONSENT_RISKS = HIGH
IDENTITY_RISKS = HIGH
BLOCKERS = source system access and real schema inventory not yet performed; business owner validation pending; architect review pending

LM0 = FAIL
READY_FOR_LM1 = NO
```

## Verdict

LM0 program structure is created, but discovery is not complete. It remains blocked pending real source system inventory, schema/API/file discovery, consent proof inspection, and business owner review.

STOP: Wait for chief architect review before LM1 Semantic Mapping execution.
