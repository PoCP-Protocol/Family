# LEGACY-001-024 Legacy Migration Program

status: DRAFT_FOR_ARCHITECT_REVIEW
track: LEGACY_MIGRATION
phase_scope: LM0_TO_LM5
created_at: 2026-08-10

## Boundary

This task pack registers the Legacy Migration Program backlog. It does not authorize production import, migration loaders, core Ontology changes, GrowthProfile semantic changes, cutover, or legacy data deletion.

LM0 remains read-only: READ, DISCOVER, CLASSIFY, MAP, REPORT.

## Tasks

| ID | Title | Phase | Scope | Gate |
| --- | --- | --- | --- | --- |
| LEGACY-001 | Legacy System Inventory | LM0 | Identify legacy CRM, assessment, learning, service, commerce, LMS, live, community systems. | Architect review |
| LEGACY-002 | Legacy Database/Data Inventory | LM0 | Inventory databases, exports, files, data ranges, sensitivity, and owner. | Data owner review |
| LEGACY-003 | Legacy Identity Inventory | LM0 | Inventory customer, contact, student, user, class, order, payment IDs. | Identity review |
| LEGACY-004 | Family Identity Mapping | LM1 | Draft Family, Parent, Child, Relationship matching rules. | No auto-merge without review |
| LEGACY-005 | External Entity Reference Design | LM1 | Design `external_entity_refs` without polluting Family IDs. | Schema review |
| LEGACY-006 | Migration Batch Model | LM1 | Design batch metadata, status, counts, and idempotency fields. | Data platform review |
| LEGACY-007 | Migration Audit Model | LM1 | Design migration record and issue audit model. | Audit review |
| LEGACY-008 | Field Mapping Master | LM1 | Complete field-level semantic mapping and route classification. | Mapping review |
| LEGACY-009 | Consent Migration Rules | LM1 | Define purpose-specific proof rules and re-consent paths. | Safety/legal review |
| LEGACY-010 | Assessment Semantic Mapping | LM1 | Map legacy assessment instruments to evidence-only targets. | Product + teaching review |
| LEGACY-011 | Profile/Label Migration Rules | LM1 | Ensure labels become Perspective/Evidence, not Fact or Growth State. | ADR compliance review |
| LEGACY-012 | Historical Action Mapping | LM1 | Map tasks/check-ins to historical Action/Event without Outcome inference. | Journey review |
| LEGACY-013 | Timeline/Event Mapping | LM1 | Define timeline event types and provenance requirements. | Event review |
| LEGACY-014 | Course/Knowledge Mapping | LM1 | Map first content slice to P03/R03/R04/R05 KnowledgeCard/Intervention candidates. | Knowledge review |
| LEGACY-015 | CRM Adapter Contract | LM1/LM2 | Define CRM Customer/Lead/Opportunity references and event sync. | Adapter review |
| LEGACY-016 | LMS Adapter Contract | LM1/LM2 | Define class/program/session references and timeline sync. | Adapter review |
| LEGACY-017 | Commerce Adapter Contract | LM1/LM2 | Define OrderRef/PaymentRef only; no payment ledger rebuild. | Adapter review |
| LEGACY-018 | Migration CLI | LM2 | Build CLI after approval for discover/extract/validate/shadow/reconcile. | Shadow-only approval |
| LEGACY-019 | Shadow Import | LM2 | Run 100-500 family shadow import after Wave2 pass. | Shadow gate |
| LEGACY-020 | Reconciliation Engine | LM2 | Count, identity, relationship, consent, evidence, timeline reconciliation. | Reconciliation pass |
| LEGACY-021 | Pilot Migration | LM3 | Pilot 30-50 active families with dual-system operation. | Pilot gate |
| LEGACY-022 | Dual Run | LM4 | Run CRM/LMS/commerce externally while Family owns growth domains. | System-of-record gate |
| LEGACY-023 | Cutover | LM5 | Domain-by-domain cutover with rollback and owner signoff. | Go/No-Go gate |
| LEGACY-024 | Legacy Retirement | LM5 | Retire only after migration, reconciliation, support, and rollback-window pass. | Business owner signoff |

## Current Authorization

Only LEGACY-001 to LEGACY-003 are eligible for LM0 discovery execution after chief architect approval. All later tasks are registered but not authorized.
