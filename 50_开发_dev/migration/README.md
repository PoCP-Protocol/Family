# Family Legacy Migration Program

status: LM0_DISCOVERY
track: LEGACY_MIGRATION
date: 2026-08-10

This directory contains the read-only discovery, semantic mapping, and control artifacts for the Family Legacy Migration Program.

The program does not copy the old systems into Family. It preserves verified business assets, reinterprets family-growth meaning through Family Ontology, keeps mature transaction systems behind Adapters, and migrates historical data only with provenance, consent boundaries, and review gates.

Allowed in LM0:

- READ
- DISCOVER
- CLASSIFY
- MAP
- REPORT

Forbidden in LM0:

- Production data import
- Migration loaders
- Family core Ontology changes
- GrowthProfile semantic changes
- Production cutover
- Deleting old system data
- Promoting old labels, scores, AI reports, chat text, or old consent into canonical Fact, Growth State, Diagnosis, Outcome, or active Family Consent

Primary sources:

- `10_规格_spec/05_附件与研发规范/Family_现有业务迁移矩阵.csv`
- `10_规格_spec/04_实施计划/Family_M0_M6_Roadmap_V3.0.md`
- `10_规格_spec/02_总体蓝图/Family_总体蓝图方案_V2.0.md`
- `10_规格_spec/02_总体蓝图/Family_整体技术架构_V2.0.md`
- `10_规格_spec/01_实施方法论/Family_FGAIM_实施方法论_V2.0.md`
- `50_开发_dev/agents/chief-architect/CURRENT_ARCHITECT_STATE.yaml`
- `50_开发_dev/agents/chief-architect/DECISION_REGISTRY.md`
