# FPAI Dataset Catalog V1

## Dataset Layers

- SOURCE: immutable source references and manifests.
- EXTRACTED: source excerpts with span/ref and evidence level.
- TRANSFORMED: identity-mimicry removed, FPAI value-aligned transformations.
- GOLD: human-reviewed response candidates.
- EVAL: evaluation cases and rubrics.
- SFT_CANDIDATE: candidates only; not training data until rights and owner approval.
- REJECTED: unsuitable, unsafe, unclear-rights, or privacy-risk items.

## Transition Rule

Every transition preserves lineage. No silent overwrite is allowed.

## FP0 Training State

No dataset in this catalog is authorized for model training in FP0.
