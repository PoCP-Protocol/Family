# AI Family Integration Contract V3.2

Status: ACTIVE_ARCHITECTURE_BASELINE
Date: 2026-08-10
Parent: `docs/FAMILY_TECH_ARCH_V3.2.md`

## 1. Core Ruling

```text
LLM_DIRECT_DB_ACCESS = FORBIDDEN
PRINCIPAL_CONTEXT_BROKER = REQUIRED
AI_RESPONSE_IS_FAMILY_STATE = NO
PRINCIPAL_ACTION_PROPOSAL_REQUIRES_HUMAN_CONFIRMATION = YES
MODEL_GATEWAY_REQUIRED = YES
```

## 2. Principal Runtime Chain

```text
User
  -> Principal API
  -> Safety Pre-check
  -> Intent / Scenario
  -> Family Context Broker
  -> Knowledge Retrieval
  -> Bobo Method Retrieval
  -> Famili Principal Soul
  -> Model Gateway
  -> Structured Response
  -> Schema Validation
  -> Safety Post-check
  -> Principal Response
```

## 3. Family Context Broker

The Context Broker is the only approved path from Principal AI to Family context.

It must enforce:

```text
Consent
Permission
Purpose
Minimum Necessary
Retention Policy
Correlation / Audit
```

The broker may provide a minimum context package such as:

```text
child life stage
current growth topic
latest accepted action
latest reflection or check-in summary
relevant consent context
```

It must not send full household history, all child data, or all assessments unless explicitly authorized and necessary.

## 4. Principal Action Bridge

```text
PrincipalResponse
  -> PrincipalActionProposal
  -> user clicks "try tonight"
  -> ConfirmPrincipalAction
  -> Named Action
  -> GrowthAction
```

The bridge is permanent. AI text is never a canonical growth mutation.

## 5. Principal Model Run Ledger

Family V3.2 requires an AI interaction ledger:

```text
PrincipalModelRun
```

Minimum fields:

```text
model_run_id

model_provider
model_name
model_version

prompt_version
soul_version

knowledge_refs
method_refs

input_hash
output_hash

safety_route

latency
token_usage

user_feedback
human_rating
```

Sensitive original text retention is governed by Consent and Retention Policy, not by product convenience.

## 6. Evaluation Boundary

No AI capability is complete without Outcome or evaluation evidence.

Famili Principal quality must be evaluated against:

```text
schema validity
safety route correctness
minimum necessary context compliance
action proposal clarity
human confirmation path integrity
user feedback
downstream action acceptance / completion
```
