# FAMILY DEV OS V1

A repository-native multi-agent development control plane.

It automates **planning, task eligibility, agent packets, isolated execution, scope audit, evidence audit, CI, branch push and draft PR creation** while keeping authorization and protected merges outside agent control.

## Commands
From `50_开发_dev`:

```bash
node tools/family-devos/orchestrate.mjs validate
node tools/family-devos/orchestrate.mjs plan
node tools/family-devos/orchestrate.mjs packet W2R_103B
node tools/family-devos/selftest.mjs
```

## Real agent runner
The GitHub workflow is fail-closed by default. To allow coding agents to execute, configure repository variables/secrets:

- `FAMILY_DEVOS_AUTO_EXECUTE=true`
- `FAMILY_AGENT_RUNNER=custom`
- secret `FAMILY_AGENT_COMMAND` containing a command that reads `$FAMILY_TASK_PACKET` and writes `$FAMILY_AGENT_RESULT`.
- optional secret/variable `FAMILY_AGENT_BOOTSTRAP_COMMAND` to install/login an agent CLI in the runner.

Example adapter contract (the exact CLI is intentionally not hard-coded):

```bash
$FAMILY_AGENT_COMMAND
# input:  FAMILY_TASK_PACKET=/tmp/family-task-packet.md
# output: FAMILY_AGENT_RESULT=/tmp/family-agent-result.json
```

If no real runner is configured, the system automatically plans READY tasks and validates governance but **does not pretend that product development happened**.
