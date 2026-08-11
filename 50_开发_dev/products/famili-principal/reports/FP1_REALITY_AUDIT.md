# FPAI FP1 Reality Audit

Date: 2026-08-10
Phase: FP1_TEXT_INTELLIGENCE_MVP
Authority: AUTHORIZED_BY_CHIEF_ARCHITECT

## Current Head

```text
CURRENT_HEAD = 9924c85868f99ff4241a3c34812aafe44885587e
```

## FP0 Artifacts

Authoritative:

- `products/famili-principal/contracts/principal-response.schema.json`
- `products/famili-principal/contracts/principal-action-card.schema.json`
- `products/famili-principal/contracts/say-it-tonight.schema.json`
- `products/famili-principal/soul/persona.yaml`
- `products/famili-principal/soul/values.yaml`
- `products/famili-principal/soul/language-style.yaml`
- `products/famili-principal/soul/thinking-policy.yaml`
- `products/famili-principal/soul/action-policy.yaml`
- `products/famili-principal/soul/relationship-policy.yaml`
- `products/famili-principal/safety/FPAI_SAFETY_POLICY_V1.yaml`
- `products/famili-principal/scenarios/FPAI_SCENARIO_TAXONOMY_V1.yaml`
- `products/famili-principal/evals/gold-v1/cases.jsonl`

FP0 internal foundation is accepted by owner ruling. Owner decision 2026-08-11: public Bobo attribution is NOT disclosed; Bobo is one internal method source among several and FPAI absorbs strengths from multiple education IPs.

## Current Runtime Implementation

Prototype:

- `packages/principal-ai/src/index.ts` still uses deterministic hardcoded templates.
- Runtime response fields include stale `try_tonight`, `say_it_like_this`, `next_check_in`, `human_gate`, and `LOW|HUMAN_GATE`.
- Future-only concepts are still represented in active package types: `VOICE`, `AVATAR_STAGE`, `MICRO_LESSON`, and `FAMILY_DIALOGUE`.

Conflicting:

- Runtime does not match the authoritative `principal-response.schema.json` fields: `possible_pattern`, `say_it_tonight`, `one_small_action`, `boundary`, `risk_route`, and `method_refs`.

## Current Model Provider

Prototype:

- `packages/ai-gateway` currently defines the `AiGateway` interface only.
- No concrete fake gateway or OpenAI-compatible adapter exists in the gateway package.
- Principal business logic does not yet perform real structured generation through a provider-neutral adapter.

## Current Retrieval

Prototype:

- Product taxonomy exists in `knowledge/BOBO_METHOD_TAXONOMY.yaml`.
- Runtime does not yet perform reviewed method-card or knowledge-card retrieval.

Required FP1 direction:

- Deterministic retrieval over reviewed cards only.
- No vector database in FP1.
- No raw Bobo/Bole/JoySoul transcript prompt stuffing.

## Current Schema Validation

Conflicting:

- Product contracts have `additionalProperties = false`.
- Runtime exports an older inline schema and does not validate model outputs against the product SSOT contracts.

Required FP1 direction:

- Runtime must converge to product schema fields.
- Invalid model JSON must fail closed after at most one bounded repair attempt.

## Current Safety

Prototype:

- Runtime uses `LOW|HUMAN_GATE`.

Authoritative:

- `FPAI_SAFETY_POLICY_V1.yaml` defines `NORMAL|REVIEW|HIGH_RISK`.
- Safety must run before and after generation.
- Model cannot finalize the safety route alone.

## Current Eval

Authoritative:

- `products/famili-principal/evals/gold-v1/cases.jsonl` exists and is the FP1 gold set source.

Prototype:

- `packages/principal-ai` has only package-local prototype tests and older 10-item training/golden export helpers.

## Current Corpus Rights

Authoritative:

- `products/famili-principal/corpus/BOBO_SOURCE_REGISTRY.csv` registers 8 source assets.
- All current source assets have `rights_status = UNKNOWN` and `review_status = NEEDS_RIGHTS_REVIEW`.
- `corpus-usage-policy.yaml` forbids automatic promotion to retrieval, eval target, or training.

Required FP1 boundary:

- `UNKNOWN` sources must not be used for production retrieval, SFT, LoRA, or model training.
- Transformed, reviewed method cards may be used only when marked retrieval-eligible.

## Classification

```text
authoritative = product contracts, soul YAML, safety YAML, scenario taxonomy, gold eval cases, corpus policy
prototype = packages/principal-ai deterministic runtime, 10-item local training exports, avatar scene helpers
stale = try_tonight, say_it_like_this, LOW, HUMAN_GATE
conflicting = runtime schema versus principal-response.schema.json
future_only = voice, avatar, micro lesson, family dialogue, 21-day companion
```

## FP1 First Fix

```text
RUNTIME_SCHEMA_ALIGNMENT = REQUIRED_FIRST
OLD_RUNTIME_SCHEMA_DEPENDENCY = MUST_REACH_0
MODEL_TRAINING = NOT_AUTHORIZED
FAMILY_M2_RUNTIME_INTEGRATION = NO
```
