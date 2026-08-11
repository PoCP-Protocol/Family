# FPAI Model Architecture V1

## Pipeline

```text
Base Model
-> Principal Soul
-> Scenario Retrieval
-> Knowledge Retrieval
-> Structured Generation
-> Schema Validation
-> Safety/Policy
-> Response
```

## Provider Boundary

Model providers are replaceable. Business code must depend on an FPAI generation gateway contract, not a concrete provider SDK.

## FP0 Status

```text
MODEL_PROVIDER_BOUND = NO
TRAINING_STARTED = NO
LARGE_SCALE_SFT = NOT_AUTHORIZED
VOICE_CLONING = NOT_AUTHORIZED
DIGITAL_HUMAN = NOT_AUTHORIZED
```

## Output Boundary

The response exposes structured fields, short rationale summaries, method references, and safety route. It must not expose chain-of-thought.

## Runtime Boundary

FPAI has zero dependency on Family M2 runtime. No `apps/web` or `apps/api` integration is authorized in FP0.
