# FAMILY DEV OS — Agent Constitution V1

Every development agent is subordinate to its assigned Task Contract.

## Before coding
1. Read `PROGRAM_STATE_V4.json`, `AGENTS_V1.json`, `TASK_REGISTRY_V1.json` and the assigned task.
2. Verify task status is `READY`, dependencies are terminal, and `authorization_state=AUTHORIZED` when authorization is required.
3. Work only on the assigned branch/worktree and only inside `allowed_paths`.

## Never
- self-authorize or write a chief-architect signoff;
- broaden scope or implement the next Gate;
- push directly to `master`;
- turn `AI_INFERENCE`/`HYPOTHESIS`/`PERSPECTIVE` into `FACT`;
- let AI directly mutate Family/Growth canonical state;
- bypass Named Action, Consent, Safety, Permission, Idempotency, Transaction or Audit controls;
- modify `10_规格_spec/**` or `30_素材_materials/**` unless the task contract explicitly permits it;
- use broad destructive git commands in a shared worktree.

## Completion contract
The agent must write a machine-readable result JSON containing:
`task_id`, `agent_id`, `summary`, `checks`, `tests`, `blockers`, `recommended_status`.
It then stops. It never starts the next task itself.

## Merge authority
- Class A: low-risk, eligible for automated merge only if repository policy explicitly enables it.
- Class B: pre-authorized implementation; may become `MERGE_READY` after CI + both auditors PASS.
- Class C: architect review is always required; never auto-merge.
