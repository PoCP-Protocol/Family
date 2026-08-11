# Family Legacy Migration Program

status: LM0_DISCOVERY
track: LEGACY_MIGRATION
date: 2026-08-10

This directory contains the read-only discovery, semantic mapping, and control artifacts for the Family Legacy Migration Program.

The required method is FLM - Family Legacy Migration Method. FLM treats Bangyang Education legacy migration as semantic migration into the Family Growth System of Record, not as table copy or post-launch data cleanup.

The program does not copy the old systems into Family. It preserves verified business assets, reinterprets family-growth meaning through Family Ontology, keeps mature transaction systems behind Adapters, and migrates historical data only with provenance, consent boundaries, and review gates.

Allowed in LM0:

- READ
- DISCOVER
- CLASSIFY
- DESIGN_MAPPING_DRAFTS
- REPORT
- DESIGN_CONTRACTS
- BUILD_READ_ONLY_TOOLING
- BUILD_VALIDATORS

Forbidden in LM0:

- Production data import
- Migration loaders
- Family core Ontology changes
- GrowthProfile semantic changes
- Production cutover
- Deleting old system data
- Promoting old labels, scores, AI reports, chat text, or old consent into canonical Fact, Growth State, Diagnosis, Outcome, or active Family Consent

LM0 does not confirm mapping. LM0 may only propose candidates for LM1 review.

Primary FLM artifacts:

- `FLM_METHOD.md`
- `MIGRATION_CONSTITUTION.md`
- `migration-contracts/`
- `MIGRATION_WAVES.yaml`
- `SYSTEM_OF_RECORD_MATRIX.yaml`
- `FIELD_MAPPING_MASTER.csv`
- `IDENTITY_MAPPING_RULES.yaml`
- `CONSENT_MIGRATION_RULES.yaml`
- `DATA_QUALITY_RULES.yaml`
- `reports/`

Primary sources:

- `10_规格_spec/05_附件与研发规范/Family_现有业务迁移矩阵.csv`
- `10_规格_spec/04_实施计划/Family_M0_M6_Roadmap_V3.0.md`
- `10_规格_spec/02_总体蓝图/Family_总体蓝图方案_V2.0.md`
- `10_规格_spec/02_总体蓝图/Family_整体技术架构_V2.0.md`
- `10_规格_spec/01_实施方法论/Family_FGAIM_实施方法论_V2.0.md`
- `50_开发_dev/agents/chief-architect/CURRENT_ARCHITECT_STATE.yaml`
- `50_开发_dev/agents/chief-architect/DECISION_REGISTRY.md`

CLI entry points are exposed from `tools/legacy-migration/` through package scripts such as `pnpm migration:discover`, `pnpm migration:profile`, `pnpm migration:identity-report`, `pnpm migration:consent-report`, and `pnpm migration:report`. LM0 commands are read-only and must not run INSERT, UPDATE, DELETE, ALTER, or TRUNCATE.
