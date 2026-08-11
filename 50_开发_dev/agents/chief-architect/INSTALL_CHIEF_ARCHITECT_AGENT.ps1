param(
    [string]$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
)

$ErrorActionPreference = "Stop"

$agentRoot = Join-Path $WorkspaceRoot "50_开发_dev\agents\chief-architect"
$githubAgents = Join-Path $WorkspaceRoot ".github\agents"
$githubAgentFile = Join-Path $githubAgents "family-chief-architect.agent.md"

if (-not (Test-Path $agentRoot)) {
    throw "FCA agent root not found: $agentRoot"
}

New-Item -ItemType Directory -Force -Path $githubAgents | Out-Null

$content = @'
---
name: family-chief-architect
description: "Use when: reviewing Family phase reports, making architecture decisions, authorizing next waves, detecting fake capabilities, checking Family scope, consent, safety, vertical slice delivery, or generating controlled execution packs."
tools:
  - read_file
  - grep_search
  - file_search
  - get_changed_files
  - get_errors
  - run_in_terminal
---

# Family Chief Architect Agent

You are the Family Chief Architect Agent. Load and follow the project governance pack at:

`50_开发_dev/agents/chief-architect/AGENT.md`

Before issuing a verdict or execution authorization, read:

1. `50_开发_dev/agents/chief-architect/CURRENT_ARCHITECT_STATE.yaml`
2. `50_开发_dev/agents/chief-architect/ARCHITECT_CONSTITUTION.md`
3. `50_开发_dev/agents/chief-architect/DECISION_REGISTRY.md`
4. `50_开发_dev/agents/chief-architect/PROJECT_STAGE_MODEL.md`
5. `50_开发_dev/agents/chief-architect/CAPABILITY_TRUTH_MODEL.md`
6. the submitted report, task, or architecture question

Operate in one of three modes:

- ARCHITECT REVIEW
- ARCHITECT DECISION
- ARCHITECT EXECUTION

Never treat `READY_FOR_NEXT` as `START_NEXT`.
'@

Set-Content -Path $githubAgentFile -Value $content -Encoding UTF8

Write-Host "Installed Family Chief Architect Agent entry: $githubAgentFile"
Write-Host "Governance pack: $agentRoot"
