# FCA Authorization Evidence Protocol

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

## Purpose

This protocol prevents FCA from confusing missing, unread, stale, and verified evidence when issuing `ARCHITECT EXECUTION` authorization.

FCA must use this protocol whenever it decides:

- `START_NEXT`
- `NEXT_IMPLEMENTATION_AUTHORIZED`
- `PARALLEL_BUILD`
- contract freeze validity
- phase or wave startup readiness

## Evidence Ledger

Every execution authorization must include an evidence ledger before the final authorization sentence.

Required fields:

| Evidence | Path | Status | Finding | Effect on Authorization |
| -------- | ---- | ------ | ------- | ----------------------- |

Allowed `Status` values:

| Status | Meaning |
| ------ | ------- |
| `VERIFIED` | FCA read the file or received direct tool evidence and the content supports the claim. |
| `MISSING` | The required file does not exist. |
| `UNREAD` | The file may exist, but FCA did not read or receive its content. |
| `STALE` | The content exists but contradicts newer state or expected phase. |
| `CONFLICTING` | Two or more authoritative files disagree on the same control state. |
| `NOT_REQUIRED` | The evidence is not required for this narrow authorization. |

## Authorization Rules

### START_NEXT = YES

Allowed only when all controlling evidence is `VERIFIED` and no blockers remain.

Minimum controlling evidence for a wave execution pack:

- current architect state
- sprint or project status
- contract freeze artifact, when the wave depends on frozen contracts
- conflict matrix, when parallel work is requested
- baseline/version/hash artifact, when a freeze is claimed as approved
- relevant stage or vertical slice standard

### START_NEXT = CONDITIONAL

Required when the target scope is architecturally acceptable, but at least one startup condition remains.

Examples:

- a required file is `UNREAD`
- a required file is `MISSING`
- status files are `CONFLICTING`
- freeze exists but baseline/hash is not verified
- tests or demo are not yet required for startup but must be gate conditions

### START_NEXT = NO

Required when evidence shows any hard violation:

- current stage forbids the requested scope
- contract freeze is absent and required
- consent or safety boundary is ambiguous for the proposed implementation
- proposed work includes forbidden AI, score, ranking, outcome, causal, or World Model behavior
- shared file ownership is missing for parallel work
- claimed capability level exceeds evidence and would mislead downstream implementation

## State Conflict Handling

When files disagree, FCA must identify the controlling conflict explicitly.

State conflicts must be described as:

```text
STATE_CONFLICT:
  subject:
  file_a:
  file_b:
  ruling:
  required_resolution:
```

FCA may still authorize `CONDITIONAL` work if the conflict does not affect the immediate bounded scope, but it must not authorize `YES` until the conflict is resolved.

## Freeze Verification

When a contract freeze is claimed, FCA must verify:

```text
CONTRACT_FREEZE_STATUS:
BASELINE_VERSION:
BASELINE_APPROVAL:
CONFLICT_MATRIX_APPROVAL:
CHANGE_CONTROL_RULE:
```

If hash values are present, FCA must report that hashes are recorded. FCA is not required to recompute hashes unless explicitly asked.

## Output Requirement

Every `WAVE_EXECUTION_PACK` must include:

```text
## Evidence Ledger

| Evidence | Path | Status | Finding | Effect on Authorization |
|---|---|---|---|---|
```

The final authorization sentence must be consistent with the ledger. A `MISSING`, `UNREAD`, `STALE`, or `CONFLICTING` controlling artifact blocks unconditional `YES`.
