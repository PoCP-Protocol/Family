# Bole.AI Distillation Data Port Audit

Date: 2026-08-10
Workspace: `D:\Family`
Sources checked: Docker container `bole-postgres` / database `bole_platform`; local filesystem `D:\Bole.AI`; JoySoul/AiSoul roots `D:\AiSoul` and `D:\JoySoul_corpus_backup`
Target boundary: Family engineering layer under `50_开发_dev`

## Request

Port Bole.AI distillation data into Family.

## Governance Boundary

This request touches external-system data. Per `integrations/contracts/ADAPTER_CONTRACT.md`, any external source must pass through:

```text
External API / DB
-> Raw External DTO
-> Adapter Mapper
-> Canonical DTO
-> Validation
-> Family Named Action / Import Command
```

Therefore Bole data must not be written directly into Family core domain tables, and Bole IDs must not become Family canonical IDs. Source lineage must be preserved.

## Source Discovery Summary

The initial Bole PostgreSQL database check found no business/distillation rows. A broader local filesystem search then found real Bole JSONL data under `D:\Bole.AI`, plus a much larger JoySoul/AiSoul corpus under `D:\AiSoul` and `D:\JoySoul_corpus_backup`.

Data was copied only into Family's external integration source area:

- `50_开发_dev/integrations/sources/bole-ai/distillation/`
- `50_开发_dev/integrations/sources/bole-ai/joysoul/`

No Family core DB, ontology, knowledge YAML, or `30_素材_materials` file was modified.

## Bole Database Discovery

The following local Bole containers were found running:

- `bole-web`
- `bole-api`
- `bole-postgres`

The Bole PostgreSQL database was reachable through the container environment. Current database:

- `bole_platform`

Business tables discovered:

- `agent_run_logs`
- `analysts`
- `assessments`
- `branches`
- `clients`
- `growth_events`
- `growth_plans`
- `growth_week_tasks`
- `operation_logs`
- `plans`
- `report_records`
- `role_module_grants`
- `roles`
- `subscriptions`
- `tenants`
- `user_branches`
- `user_roles`
- `users`

No non-system views were found.

## Exact Row Counts

| Table | Rows | Port decision |
|---|---:|---|
| `clients` | 0 | No data to port |
| `assessments` | 0 | No data to port |
| `report_records` | 0 | No data to port |
| `growth_events` | 0 | No data to port |
| `growth_plans` | 0 | No data to port |
| `growth_week_tasks` | 0 | No data to port |
| `analysts` | 0 | No data to port |
| `agent_run_logs` | 0 | No data to port |
| `operation_logs` | 0 | No data to port |
| `branches` | 1 | System/organization metadata, not distillation data |
| `tenants` | 1 | System metadata, not distillation data |
| `users` | 1 | Account/auth metadata, do not port into Family growth domain |
| `roles` | 4 | Auth metadata, do not port into Family growth domain |
| `subscriptions` | 1 | Billing/plan metadata, do not port into Family growth domain |

## Filesystem Data Found And Ported

### Bole.AI distillation package

The following Bole filesystem exports were copied to `50_开发_dev/integrations/sources/bole-ai/distillation/` and recorded in `MANIFEST.json`.

| File | Lines | Bytes | Main keys |
|---|---:|---:|---|
| `corpus_11k.jsonl` | 3,589 | 3,388,629 | `id,title,text,snippet,url,kind,platform,evidenceGrade,themeIds,source,useFor,compliance,collectedAt,sourceFile,synthetic` |
| `evidence_index.jsonl` | 4,697 | 2,965,562 | `id,title,snippet,url,region,kind,evidenceGrade,themeIds,useFor,source,compliance,sourceFile,indexedAt` |
| `family_edu_sft.jsonl` | 6,322 | 22,323,893 | `instruction,input,output,rationale,kind,region,signals` |
| `family_edu_train_mix.jsonl` | 10,000 | 12,011,589 | `instruction,input,output,rationale,kind,region,signals` |
| `golden_digitize.jsonl` | 247 | 64,703,442 | `label,fingerIndex,width,height,gray8B64,expected` |
| `short_video_signals_ingested.jsonl` | 4,873 | 2,671,527 | `id,source,evidenceGrade,painId,topicIds,text,absorb,videoTitle,platform` |

### JoySoul/AiSoul transplant package

The JoySoul/AiSoul search found substantial data under:

- `D:\AiSoul\platform\datasets` - 166 JSONL files, about 1.71 GB after excluding model/third-party paths in the count command.
- `D:\AiSoul\platform\datasets\train_export` - 13 JSONL files, about 635.7 MB.
- `D:\JoySoul_corpus_backup\20260708_081106\platform\datasets` - 75 JSONL files, about 796.6 MB.

A conservative current-primary subset was copied to `50_开发_dev/integrations/sources/bole-ai/joysoul/` and recorded in `MANIFEST.json`:

| Metric | Value |
|---|---:|
| Files copied | 18 |
| JSONL rows | 585,912 |
| Bytes | 548,604,866 |

Selection included current JoySoul distillation, SFT, legal-clean, review, exemplar, scenario, fleet, and chain files. Selection excluded `_precleanup_backup`, recovered-only backups, Kaggle/third-party data, model weights, tokenizer/vocab files, node_modules, SQLite databases, and archive tarballs.

## Result

The Bole PostgreSQL database still has no distillation/business data to port, but filesystem search found and copied the requested data packages into Family's controlled engineering integration layer.

These packages are staged for later adapter-based import only. They are not canonical Family facts, knowledge cards, ontology records, or Named Actions.

## Candidate Mapping If Real Bole Data Appears Later

| Bole table | Family target concept | Required route |
|---|---|---|
| `clients` | Candidate family/person import input | `FamilyImportCommand` with lineage, then approved Named Actions |
| `assessments.growth_profile_json` | Evidence-backed profile draft input, not Fact | M2 profile draft/synthesis flow after schema validation |
| `report_records.content_json` | Derived report artifact, E1/self-generated unless backed by source evidence | Derived artifact import, not ontology fact |
| `growth_events.payload_json` | Historical event candidate | Event import command with actor/source/correlation lineage |
| `growth_plans` / `growth_week_tasks` | Journey/action candidate | Approved journey/action import contract only |

## Next Required Step

The next implementation step should be an approved import task that creates:

- raw Bole DTO schema
- canonical Family import command mapping
- validation report
- dry-run import output
- human approval gate before writing Family core state
