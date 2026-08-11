# LM0-LM1_LEGACY_MIGRATION_DISCOVERY_AND_MAPPING

status: DRAFT_READY_FOR_ARCHITECT_REVIEW

## Business Intent

Start the legacy migration track now, in V3.1, without waiting for Family to be fully built. The goal is to discover, profile, and semantically map existing business assets so M2 late pilot, M3 active migration, and M4 scale cutover are feasible and safe.

This task operationalizes `50_开发_dev/reports/v3.1/01_LEGACY_MIGRATION_DISCOVERY_TRACK.md`.

## User Value

- Existing families, parents, children, assessments, reports, programs, service records, and delivery history can later enter Family without becoming corrupted table-to-table copies.
- Active families can be migrated first with evidence, consent, and identity traceability.
- CRM/LMS/order/payment/community systems remain supporting systems through adapters instead of being unnecessarily rebuilt.
- Unsafe legacy artifacts such as old AI diagnosis, tags, family total score, and rankings cannot silently become canonical Family facts.

## Related Domain

- Legacy Migration Discovery Track
- Semantic Migration Layer
- External Entity References
- Adapter Contract
- Consent / Privacy / Minor Safety
- Evidence / Timeline / GrowthProfile input boundaries

## Related Specs

- `10_规格_spec/05_附件与研发规范/Family_现有业务迁移矩阵.csv`
- `50_开发_dev/reports/v3.1/01_LEGACY_MIGRATION_DISCOVERY_TRACK.md`
- `50_开发_dev/integrations/contracts/ADAPTER_CONTRACT.md`
- `50_开发_dev/integrations/dto/family-import-command.schema.json`
- `50_开发_dev/integrations/dto/DTO_MAPPING_TEMPLATE.csv`

## Dependencies

- M2 Wave2 implementation must continue independently and must not be blocked by this discovery task.
- Business owners must explain ambiguous legacy fields and workflows.
- AI-00 must own migration architecture and gate control.
- AI-03 must own data/schema/mapping shape.
- AI-06 must own consent, privacy, minor safety, and Human Gate criteria.

## Input

- Existing migration matrix entries M001-M055.
- Legacy system exports, schemas, API docs, data dictionaries, screenshots, SOPs, or sample rows when available.
- Existing `integrations/sources/**` source packages and manifests.
- Business explanation for legacy terms such as customer, contact, student, tag, score, diagnosis, check-in, service record, course, camp, advisor note, and chat record.

## Output

LM0 outputs:

- Legacy system inventory.
- Entity/table/API/export inventory.
- Legacy ID inventory.
- Data quality and duplicate-risk profile.
- Historical consent audit inventory.
- Owner map for each legacy system or data class.

LM1 outputs:

- Semantic mapping draft covering M001-M055.
- Adapter versus migrate classification map.
- `external_entity_refs` design draft.
- Human review criteria.
- Shadow import plan with no Family core writes.
- Migration priority proposal: Active First, not Historical First.

## Business Rules

1. Migration is semantic reinterpretation, not database copying.
2. Family-owned IDs must not be replaced by legacy IDs.
3. Old consent records cannot become active Family consent unless they satisfy current purpose, policy version, guardian, subject, timestamp, and proof requirements.
4. Legacy AI diagnosis, tags, scores, and reports may become legacy perspectives/classifications/records only; they must not become facts.
5. Orders, payments, CRM, LMS, live SaaS, support, and community should default to Adapter unless explicitly approved otherwise.
6. Ranking and Family Total Score are retired and must not re-enter Family.
7. Courses and programs must be decomposed into Knowledge, Method, Intervention, Action, Evidence, and contraindication before canonical import.
8. Active families and current delivery contexts are prioritized before historical bulk import.

## Out of Scope

- Production cutover.
- Direct import into Family core tables.
- Mutating old systems.
- New Family DB migrations.
- Wave3 implementation.
- Building CRM/LMS/order/payment/community replacements.
- Writing legacy data into `30_素材_materials/**`, ontology YAML, knowledge YAML, or canonical Family state.

## Files Allowed

- `50_开发_dev/reports/v3.1/**`
- `50_开发_dev/backlog/tasks/LM0-LM1_LEGACY_MIGRATION_DISCOVERY_AND_MAPPING.md`
- `50_开发_dev/integrations/dto/*MAPPING*.csv`
- `50_开发_dev/integrations/sources/**/README.md`

## Files Forbidden

- `30_素材_materials/**`
- `50_开发_dev/database/migrations/**`
- `50_开发_dev/apps/api/src/modules/family/**`
- `50_开发_dev/CURRENT_SPRINT.md`
- `50_开发_dev/PROJECT_STATUS.md`
- `10_规格_spec/04_实施计划/PLAN_SSOT_V3.0.md`
- `50_开发_dev/reports/m2/wave2/M2_WAVE2_CONTRACT_FREEZE.md`
- `50_开发_dev/reports/m2/wave2/SHARED_FILE_CONFLICT_MATRIX.md`
- ontology YAML and knowledge YAML
- production legacy systems

## Acceptance Criteria

- LM0 inventory names systems, owners, entity classes, IDs, and export/API access modes for CRM, LMS, assessment/report, course/program, order/payment, community, support, historical growth data, and AI outputs.
- LM1 draft classifies every M001-M055 item as MIGRATE, ADAPT, TRANSFORM, ARCHIVE, RETIRE, or HUMAN_REVIEW.
- All P0 assets have explicit migration priority and owner.
- `external_entity_refs` design is reviewed before implementation.
- Consent audit clearly separates legacy consent records from active Family consent.
- AI diagnosis, tags, scores, and reports are explicitly blocked from becoming canonical facts.
- Shadow import plan proves no core DB writes and no old-system mutation.
- Human Gate criteria cover minors, ambiguous identity, sensitive family context, high-risk content, and low-confidence matches.

## Tests Required

No runtime tests are required for LM0/LM1 because this is a read-only discovery and mapping task.

Required validation:

- Markdown/JSON diagnostics clean for new artifacts.
- Mapping tables must be parseable if CSV/JSON artifacts are added.
- Sample row profiling scripts, if later added, must run read-only and produce deterministic counts.

## Migration / Rollback

This task performs no migration and no production mutation.

Rollback is document-only: revert or supersede the discovery/mapping artifacts if architect or business review rejects a mapping.

## Stop Conditions

- A proposed step requires direct writes into Family core.
- A proposed step treats legacy IDs as canonical Family IDs.
- A proposed step treats old consent as active Family consent without current proof.
- A proposed step treats legacy AI diagnosis, tags, scores, rankings, or Family Total Score as canonical truth.
- A proposed step needs Wave2 implementation changes.
- Business meaning of a field cannot be verified.

## Done Definition

LM0 and LM1 are done only when the outputs are reviewed by AI-00, AI-03, AI-06, and relevant business owners, and the next approved task is either LM2 Shadow Import or a narrower discovery follow-up.
