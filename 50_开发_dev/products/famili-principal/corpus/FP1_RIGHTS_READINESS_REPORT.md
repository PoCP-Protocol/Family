# FPAI FP1 Rights Readiness Report

Date: 2026-08-10
Phase: FP1_TEXT_INTELLIGENCE_MVP
Verdict: PASS_WITH_RESTRICTIONS

## Source Registry Snapshot

`BOBO_SOURCE_REGISTRY.csv` currently registers 8 source assets.

```text
TOTAL_SOURCES = 8
RIGHTS_STATUS_UNKNOWN = 8
REVIEW_STATUS_NEEDS_RIGHTS_REVIEW = 8
PRODUCTION_RETRIEVAL_ELIGIBLE_RAW_SOURCES = 0
TRAINING_ELIGIBLE_RAW_SOURCES = 0
```

## FP1 Usage Decision

Raw Bobo, Bole, and JoySoul source assets are not ready for production retrieval or model training.

Forbidden in FP1:

```text
raw_corpus_prompt_stuffing = NO
production_retrieval_from_unknown_rights_sources = NO
sft_or_lora_from_unknown_rights_sources = NO
voice_or_likeness_training = NO
automatic_eval_target_promotion = NO
```

Allowed in FP1:

```text
reviewed_transformed_method_cards = YES
reviewed_transformed_knowledge_cards = YES
small_deterministic_retrieval_over_reviewed_cards = YES
lineage_preserved = REQUIRED
rights_review_before_public_copy = REQUIRED
```

## Operating Boundary

FP1 Text Intelligence MVP may use only reviewed, transformed, product-owned cards as retrieval context. Any source-derived card must preserve lineage and must not contain direct quotes, personal data, minor data, or identity-mimicry content unless separately reviewed and authorized.

Training remains not authorized. File names containing `sft`, `train`, or `legalclean` do not prove rights or authorization.
