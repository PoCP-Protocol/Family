# V3.1 Legacy Migration Discovery Track

status: FORMAL_V3_1_TASK_PACK_SUPPLEMENT
date: 2026-08-10
scope: READ_ONLY_DISCOVERY_AND_SEMANTIC_MAPPING
track: LEGACY_MIGRATION_M2_TO_M4
wave2_impact: NONE

## 0. Ruling

Legacy system migration is an independent migration track that starts in V3.1 and runs through M2, M3, and M4. It must not wait until Family is fully built.

This document formally supplements the V3.1 Task Pack because no standalone `V3.1 Task Pack` file currently exists in the repository. It is placed under `reports/v3.1/` to make the migration track visible without editing active Wave2 control files.

```text
LEGACY_MIGRATION_TRACK = ACTIVE_FOR_DISCOVERY
M2_LATE = SHADOW_DISCOVERY_AND_PILOT_PREP
M3 = ACTIVE_BUSINESS_MIGRATION
M4 = SCALE_CUTOVER_AND_BUSINESS_INTEGRATION
CURRENT_ALLOWED_ACTION = READ_ONLY_DISCOVERY_AND_SEMANTIC_MAPPING
CORE_DB_IMPORT = FORBIDDEN_UNTIL_EXPLICIT_TASK_APPROVAL
OLD_SYSTEM_MUTATION = FORBIDDEN
WAVE2_SCOPE_EXPANSION = FORBIDDEN
```

## 1. Why This Starts Now

The migration risk is architectural, not only operational. If old CRM, LMS, assessment, course, community, payment, service, and historical-growth structures are not profiled during M2, Family may reach M3 with canonical models that cannot absorb real legacy semantics.

Starting now means discovering legacy meaning, identity, consent, evidence quality, and adapter boundaries while Wave2 continues. It does not authorize import, cutover, schema mutation, Wave3 work, or direct implementation against production legacy systems.

## 2. Source Anchors

- `10_规格_spec/05_附件与研发规范/Family_现有业务迁移矩阵.csv`
- `50_开发_dev/integrations/contracts/ADAPTER_CONTRACT.md`
- `50_开发_dev/integrations/dto/family-import-command.schema.json`
- `50_开发_dev/reports/v3.1/00_REPOSITORY_REALITY_AUDIT.md`
- `50_开发_dev/reports/m2/wave2/integration/PHASE_B2_INTEGRATION_CONVERGENCE_DIRECTIVE.md`
- `50_开发_dev/integrations/sources/bole-ai/README.md`

## 3. Architecture

Legacy migration must use a Semantic Migration Layer, not table-to-table ETL.

```text
Legacy API / DB / File / Export
-> Raw Migration Staging
-> Legacy Adapter
-> Field Profiling
-> Semantic Mapping / Classification
-> Validation Rules
-> FamilyImportCommand / Named Action Proposal
-> Canonical Family Model
```

Direct writes from legacy data into Family core DB, ontology YAML, knowledge YAML, or action state are forbidden. Every migrated item must retain lineage and pass through adapter validation.

Required lineage fields:

- `sourceSystem`
- `sourceEntity`
- `sourceId`
- `sourceVersion` when available
- `mappingVersion`
- `importBatchId`
- `observedAt` or `exportedAt`
- `migrationDecision`
- `evidenceLimit`

## 4. Identity Rule

Family owns canonical IDs. Old system IDs are external references only.

```text
Family-owned IDs:
- family_id
- person_id
- relationship_id
- growth_profile_id
- journey_id
- action_id

Legacy-owned IDs:
- CRM customer / lead / contact IDs
- LMS student / class / course IDs
- payment / order IDs
- community group / message IDs
- assessment / report IDs
- legacy AI diagnosis / tag IDs
```

V3.1 must design `external_entity_refs` before any active migration task.

Minimum `external_entity_refs` shape:

```text
id
family_entity_type
family_entity_id
source_system
source_entity_type
source_entity_id
source_stable_key
source_display_key
mapping_version
confidence_level
match_basis
created_at
retired_at
```

`confidence_level` is a migration match-confidence marker, not a psychological or evidence confidence. Low-confidence identity matches must route to human review.

## 5. Consent And Safety Boundary

Consent cannot be migrated as active Family consent by copying old flags or agreements.

Legacy consent records may only become:

- `LegacyConsentRecord`
- consent audit input
- re-consent requirement
- consent gap report
- import block reason

Active Family consent must be granted through approved Family Consent Named Actions and current purpose-based rules. Minor-related records, sensitive family context, high-risk observations, and ambiguous guardian identity require Human Gate before import.

## 6. AI Diagnosis, Tags, Scores, And Reports

Legacy AI outputs must not become canonical facts.

Allowed treatment:

- `LegacyPerspective`
- `LegacyClassification`
- `LegacyAssessmentRecord`
- `HumanObservation` only after review and source attribution
- `GrowthProfile` input only after evidence and consent validation

Forbidden treatment:

- Direct canonical `Fact`
- Family Total Score
- family or child ranking
- clinical diagnosis wording
- direct ontology mutation
- direct recommendation/action creation without Named Action review

Evidence limit defaults to `E1 unless independently verified`, including Bole/JoySoul derived data packages.

## 7. Adapter Versus Migration Classification

The migration matrix must be converted into a classification map before implementation.

| Class | Meaning | Examples |
|---|---|---|
| MIGRATE | Historical state becomes Family canonical event/object after validation | Family, Parent, Child, Relationship, Historical Growth Data |
| ADAPT | External mature system remains source; Family stores refs/events/views | CRM, LMS, Order, Payment, Community, Support |
| TRANSFORM | Legacy material becomes a new Family semantic object | Assessment, GrowthProfile input, Course to KnowledgeCard/Intervention |
| ARCHIVE | Kept for audit or historical lookup only | old exports, stale reports, superseded diagnosis text |
| RETIRE | Not migrated because it violates Family principles | Ranking, Family Total Score |
| HUMAN_REVIEW | Cannot auto-map safely | ambiguous identity, minor consent, sensitive chat records, AI labels |

## 8. M2 To M4 Timeline

### M2 Late / Pilot Preparation

Objective: discover, profile, and shadow-map legacy data without mutating Family core or old systems.

Deliverables:

- system inventory
- entity and table inventory
- API/export inventory
- ID inventory
- field profiling report
- data quality report
- consent audit report
- semantic mapping draft
- adapter versus migration classification
- pilot candidate list
- no-import shadow staging plan

### M3 Active Business Migration

Objective: run approved migration tasks through staging, validation, FamilyImportCommand, and Named Actions.

Deliverables:

- approved migration batches
- `external_entity_refs` implementation
- validation rules
- duplicate and merge workflow
- re-consent workflow
- adapter event backfill
- business review queue
- rollback and quarantine plan

### M4 Scale Cutover / Business Integration

Objective: dual-run, reconcile, cut over safe domains, and retire or archive old capabilities.

Deliverables:

- dual-run reconciliation reports
- cutover readiness gates
- old-system retirement map
- operational handover
- audit trail export
- post-cutover data quality review

## 9. LM Gates

| Gate | Name | Exit Criteria |
|---|---|---|
| LM0 | Legacy Discovery | All in-scope systems, owners, exports, APIs, IDs, and data classes inventoried. |
| LM1 | Semantic Mapping | Each legacy entity is classified as MIGRATE, ADAPT, TRANSFORM, ARCHIVE, RETIRE, or HUMAN_REVIEW. |
| LM2 | Shadow Import | Sample batches run through staging and validation with no Family core writes. |
| LM3 | Pilot Migration | Approved pilot batch writes only through FamilyImportCommand or Named Actions with rollback. |
| LM4 | Dual Run | Family and legacy systems reconcile for selected domains with documented mismatches. |
| LM5 | Cutover / Retirement | Cutover has business sign-off, audit trail, rollback plan, and retirement archive. |

No later LM gate may start before the previous gate has explicit evidence and business sign-off.

## 10. Role Ownership

| Role | Responsibility |
|---|---|
| AI-00 | Migration architecture, gate ownership, scope control, V3.1 task-pack alignment. |
| AI-03 | data model, `external_entity_refs`, staging schema, mapping matrices, validation contracts. |
| AI-06 | consent, privacy, minor safety, evidence boundary, Human Gate rules. |
| Business Owners | legacy field meaning, historical workflow interpretation, migration priority, sign-off. |
| Data / Ops | exports, data quality profiling, duplicate review, reconciliation evidence. |

AI roles must not infer business meaning for ambiguous legacy fields without business owner confirmation.

## 11. Files Allowed In This Track

Until LM0/LM1 are approved, allowed changes are limited to discovery and planning artifacts:

- `50_开发_dev/reports/v3.1/**`
- `50_开发_dev/integrations/sources/**/README.md`
- `50_开发_dev/integrations/dto/*MAPPING*.csv`
- future V3.1 migration planning documents explicitly approved by AI-00

## 12. Files Forbidden In This Track

This track does not authorize edits to:

- `30_素材_materials/**`
- Family core DB migrations
- Family domain services
- active Wave2 contract freeze files
- `50_开发_dev/CURRENT_SPRINT.md`
- `50_开发_dev/PROJECT_STATUS.md`
- `10_规格_spec/04_实施计划/PLAN_SSOT_V3.0.md`
- ontology YAML
- knowledge YAML
- production legacy systems

## 13. Acceptance Criteria For V3.1

V3.1 may claim Legacy Migration Discovery Track readiness only when all are true:

1. LM0 system inventory exists and names owners for CRM, LMS, assessment, course/content, order/payment, community, support, historical growth data, and AI outputs.
2. LM1 semantic mapping draft covers M001-M055 from the existing migration matrix.
3. `external_entity_refs` design is reviewed before any import implementation.
4. Consent audit distinguishes legacy records from active Family consent.
5. AI diagnosis, tags, scores, and reports are classified as perspectives/classifications/records, not facts.
6. Adapter versus migration decisions are explicit for every P0 asset.
7. Shadow import plan proves no core DB write, no old-system mutation, and no Wave2 scope expansion.
8. Human Gate criteria exist for minors, ambiguous identity, high-risk family context, and low-confidence matches.

## 14. Stop Conditions

Stop and request architect/business review if any of these occur:

- A proposed migration would write directly into Family core without Named Action or import command.
- A legacy ID is proposed as a Family canonical ID.
- Old consent is treated as active Family consent.
- A legacy AI diagnosis or score is treated as canonical fact.
- Ranking or Family Total Score re-enters the target model.
- Migration requires changing active Wave2 implementation files.
- Business meaning of a field cannot be verified.
