# Parallel Development Playbook

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

Use this playbook for deciding whether a task or wave can run as parallel AI development.

## Decision Flow

```text
Task or Wave
-> dependency analysis
-> shared file analysis
-> contract freeze
-> role split
-> conflict matrix
-> validation ownership
-> integration owner
-> PARALLEL_BUILD = YES / NO
```

## Parallel Build Criteria

`PARALLEL_BUILD = YES` only if all are true:

- Scope is frozen.
- Public contracts are frozen or one role owns contract changes.
- Shared write files have exactly one owner.
- Integration owner is assigned.
- Tests and final gate owner are assigned.
- No role needs to reinterpret core domain decisions independently.
- Consent/safety policy is clear before implementation.
- Stop rule is explicit.

Otherwise:

```text
PARALLEL_BUILD = NO
```

## Standard Roles

| Role | Responsibility |
|---|---|
| AI-00 Integration Lead | Contract alignment, merge surface, final gate, conflict resolution. |
| AI-01 Domain | Domain service/policy for the first owned slice. |
| AI-02 Data/Contract | Schema, migrations, DTOs, shared package contracts. |
| AI-03 Frontend | Product screens, API wiring, UX states. |
| AI-04 AI | AI policy/model gateway integration when AI is in scope. |
| AI-05 Tests | Unit/integration/HTTP/browser evidence. |
| AI-06 Safety | Consent, safety, human gate review. |
| AI-07 Independent Review | Read-only final review. |

For smaller waves, roles may be collapsed, but ownership must remain explicit.

## Shared File Conflict Matrix

Every parallel execution pack must include:

| File / Path | Category | Write Owner | Other Roles | Notes |
|---|---|---|---|---|

Categories:

- `OWNER_ONLY`
- `SHARED_READ`
- `SHARED_WRITE_SINGLE_OWNER`
- `INTEGRATION_ONLY`
- `FORBIDDEN_TO_EDIT`

## Conflict Protocol

When a role needs a non-owned file:

1. Stop editing that file.
2. Write a change request or handoff note.
3. Send to write owner or AI-00.
4. Owner applies or rejects with reason.
5. Re-run narrow validation.

## Stop Rule

Parallel roles may complete their assigned task and report. They must not self-select the next task.

`READY_FOR_NEXT` remains non-authorization.
