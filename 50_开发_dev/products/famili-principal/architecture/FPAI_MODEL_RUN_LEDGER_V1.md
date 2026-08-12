# FPAI Model Run Ledger V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY

## Purpose

The ModelRun ledger records the provenance of every Principal model invocation for audit, reproducibility, and safety review, without duplicating raw private family text.

## Ledger Fields

```text
model_run_id        stable id for this run
request_id          product request correlation
session_id          PrincipalSession reference
family_id_ref       reference only, not raw identifiers
provider            model provider (via gateway)
model               model name
model_version       model version
prompt_version      prompt template version
soul_version        Principal soul version
soul_hash           hash of the soul config used
scenario_id         scenario taxonomy id
method_refs         approved method card refs used
source_refs         approved source refs used
input_hash          hash of the composed input (not raw text)
output_hash         hash of the structured output
risk_route          NORMAL | REVIEW | HIGH_RISK
schema_validation   PASS | FAIL
latency_ms          model latency
token_usage         token counts
created_at          timestamp
```

## Privacy Rule

```text
RAW_CHILD_TEXT_IN_LEDGER = NO (default)
```

Do not copy full child private text into the ledger by default. Store hashes and bounded references. Raw content, if ever needed, lives in the message store under its own consent and retention rules, not the ledger.

## Store Separation

Keep these as distinct stores with distinct purposes and retention:

```text
PrincipalMessage    conversation turns (user/principal text)
PrincipalResponse   structured response objects
PrincipalModelRun   model provenance ledger (hashes/refs)
AuditEvent          Family canonical audit
GrowthEvent         Family canonical growth events
```

`PrincipalModelRun` and `AuditEvent`/`GrowthEvent` are not the same log. Principal interaction provenance must not be written into Family canonical growth/audit streams.

## Boundaries

```text
LEDGER_WRITES_GROWTH_STATE = NO
LEDGER_STORES_RAW_CHILD_TEXT = NO_BY_DEFAULT
LEDGER_REQUIRED_FOR_EVERY_RUN = YES
```
