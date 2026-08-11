# Bole.AI External Source Data

This directory contains external data packages copied into Family's engineering integration layer for audit and later adapter-based import.

No file in this directory is canonical Family domain state. These files must not be written directly into ontology, knowledge-library YAML, or core application tables.

## Packages

| Package | Source | Files | Purpose |
|---|---|---:|---|
| `distillation/` | `D:\Bole.AI` | 6 | Bole Family education distillation, evidence index, corpus, digitization, and short-video signal exports. |
| `joysoul/` | `D:\AiSoul` and `D:\JoySoul_corpus_backup` discovery | 18 | JoySoul/AiSoul distillation, SFT, exemplar, scenario, fleet, and chain datasets found while tracing Bole.ai JoySoul transplant data. |

## Import Rule

Use `integrations/contracts/ADAPTER_CONTRACT.md` before any import:

```text
External file
-> Raw External DTO
-> Adapter Mapper
-> Canonical DTO
-> Validation
-> Family Named Action / Import Command
```

All imported rows must preserve source lineage (`sourceSystem`, `sourceId`, `mappingVersion`) and pass human approval before affecting Family core state.