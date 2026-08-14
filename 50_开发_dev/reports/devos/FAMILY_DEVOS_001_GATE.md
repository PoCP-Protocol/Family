# FAMILY-DEVOS-001 Gate

Status: `LOCAL_CODE_VALIDATED / GITHUB_PUBLISH_BLOCKED_BY_CONNECTOR_WRITE_SCOPE`

## Implemented
- Program state and no-gate-leap policy.
- 9 agent roles: conductor, 6 specialist agents, governance auditor, evidence auditor.
- Machine-readable task registry and dependency gates.
- Four current READY tasks: `W2R_103B`, `TENANCY_001`, `FLM_AC_002`, `OPS_001`.
- Fail-closed generic agent runner (`mock` / `custom`).
- Governance path/scope/self-authorization audit.
- Evidence acceptance audit.
- GitHub Actions planner, mock-agent smoke test, optional parallel real-agent dispatch, task tests, push and draft PR.

## Local validation
- Dev OS config validation: PASS (8 tasks / 9 agents).
- DAG planning: PASS; exactly 4 READY tasks dispatched.
- P2 HOLD and P3 SUPERSEDED not dispatched: PASS.
- Mock agent auto-start: PASS; correctly reports `REAL_AGENT_RUNNER_NOT_CONFIGURED` rather than fake completion.
- Unicode path governance audit: PASS after fixing Git `core.quotepath` handling.
- Forbidden `10_规格_spec/**` change: correctly FAILS governance audit.
- Insufficient evidence result: correctly FAILS evidence audit.
- Workflow YAML parse: PASS.

## External blocker
The connected GitHub App can read the repository but branch creation returned HTTP 403 `Resource not accessible by integration`. Therefore this environment cannot publish the implementation until the GitHub connection has repository contents/ref write permission (or an authenticated local `gh`/git publisher is available).
