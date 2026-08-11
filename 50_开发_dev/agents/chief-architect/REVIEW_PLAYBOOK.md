# Architect Review Playbook

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

Use this playbook for `ARCHITECT REVIEW`.

## Review Algorithm

FCA must execute the following sequence:

1. Read `CURRENT_ARCHITECT_STATE.yaml`.
2. Read the submitted report or stage evidence.
3. Identify the claimed stage/task/wave and claimed completion.
4. Read the smallest relevant SSOT files referenced by the report.
5. Classify each claimed capability using `CAPABILITY_TRUTH_MODEL.md`.
6. Check architecture invariants from `ARCHITECT_CONSTITUTION.md`.
7. Check accepted decisions in `DECISION_REGISTRY.md`.
8. Check whether the work belongs to the current stage in `PROJECT_STAGE_MODEL.md`.
9. Run Fake Capability Check.
10. Check backend/frontend/data/API/test/demo alignment.
11. Check consent and safety boundaries.
12. Check product value.
13. Check technical debt and deferred risks.
14. Issue exactly one verdict: `PASS`, `CONDITIONAL_PASS`, or `FAIL`.
15. Explicitly state whether next work is authorized.

## Verdict Definitions

| Verdict | Meaning |
|---|---|
| PASS | Claimed scope is honestly complete at the verified maturity level; no blocker prevents stage/wave closure. |
| CONDITIONAL_PASS | Core scope may be accepted, but listed conditions must be met before next gate, pilot, or release. |
| FAIL | Claimed completion is false, unsafe, out of scope, or blocked by unresolved architecture/product/safety issues. |

## Mandatory Checks

### Completion Truth

```text
Claimed capability:
Claimed level:
Verified level:
Evidence:
Downgrade reason:
```

### Fake Capability

```text
Documents only: YES/NO
Schemas only: YES/NO
Mocked path only: YES/NO
Real DB: YES/NO
Real HTTP/API: YES/NO
Real frontend: YES/NO
Browser uses real API: YES/NO
Real AI call if AI claimed: YES/NO/N/A
Outcome link: YES/NO
```

### Architecture Boundary

Check:

- Perspective / Fact boundary
- Evidence / Profile boundary
- Profile / Diagnosis boundary
- Profile / Score boundary
- Profile / Priority boundary
- Recommendation / Decision / Action boundary
- Named Action boundary
- Consent boundary
- Safety boundary
- AI mutation boundary

### Product Value

Every accepted user-facing task must answer:

```text
USER: who uses it?
JOURNEY: where does it sit?
VALUE: what does the user gain?
SCREEN: where does the user see it?
DOMAIN: what state changes?
EVIDENCE: what evidence supports the change?
ACTION: what can the user do?
OUTCOME: how will usefulness eventually be known?
```

If the answer is only "future use", default recommendation is `DEFER` unless current-stage infrastructure need is explicit.

## Required Output

Use the `ARCHITECTURE_VERDICT` template in `OUTPUT_TEMPLATES.md`.

## Authorization Rule

The review must end with one of:

```text
NEXT_IMPLEMENTATION_AUTHORIZED: YES
NEXT_IMPLEMENTATION_AUTHORIZED: NO
NEXT_IMPLEMENTATION_AUTHORIZED: CONDITIONAL
```

If authorization is not `YES`, coding agents must stop.
