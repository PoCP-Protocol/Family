# FPAI Digital Human Asset Provenance V1

Date: 2026-08-11
Phase: DH0_DIGITAL_HUMAN_IP_FOUNDATION
Status: REQUIRED_FOR_ALL_DIGITAL_HUMAN_ASSETS
Formal registry: `products/famili-principal/registry/FPAI_DIGITAL_HUMAN_ASSET_PROVENANCE.csv` (Owner decision 2026-08-11: registry landed as a formal CSV table; this document is its schema and rules spec)

## Purpose

Every face reference, body reference, fashion reference, voice reference, generated image, 3D asset, LoRA, avatar checkpoint, voice model, motion asset, background, and music asset must have provenance before it can enter a production candidate.

Unknown provenance means not eligible.

## Registry Schema

```csv
asset_id,asset_type,source,owner,license,commercial_use,derivative_use,training_use,identity_similarity_risk,voice_similarity_risk,review_status,approved_by,version,notes
```

## Field Rules

asset_id: stable ID such as `fpai-dh-face-ref-0001`.

asset_type: one of `face_reference`, `body_reference`, `fashion_reference`, `voice_reference`, `generated_image`, `3d_asset`, `lora`, `avatar_checkpoint`, `voice_model`, `motion_asset`, `background`, `music`, `other`.

source: original source, generator, vendor, creator, or repository.

owner: legal owner or creator.

license: explicit license or contract reference.

commercial_use: `yes | no | unknown`.

derivative_use: `yes | no | unknown`.

training_use: `yes | no | unknown`.

identity_similarity_risk: `none | low | medium | high | unknown`.

voice_similarity_risk: `none | low | medium | high | unknown`.

review_status: `draft | needs_rights_review | approved_for_concept | approved_for_production_candidate | rejected`.

approved_by: named owner/reviewer, required for any approved status.

version: semantic version or date version.

notes: relevant restrictions and lineage.

## Eligibility Rules

Production candidate requires:

```text
commercial_use = yes
derivative_use = yes
review_status = approved_for_production_candidate
identity_similarity_risk != high
voice_similarity_risk != high
source != unknown
owner != unknown
license != unknown
```

Training use requires separate explicit approval. DH0 does not authorize training.

## Formal Registry Table

The live registry is the CSV table at `products/famili-principal/registry/FPAI_DIGITAL_HUMAN_ASSET_PROVENANCE.csv`. It is the single source of truth for digital-human asset provenance. This document defines its schema, field rules, and eligibility rules; the CSV holds the rows.

Current rows are concept placeholders only (no asset created yet):

```csv
asset_id,asset_type,source,owner,license,commercial_use,derivative_use,training_use,identity_similarity_risk,voice_similarity_risk,review_status,approved_by,version,notes
fpai-dh-concept-a-0001,generated_image,not_created,Family TBD,TBD,unknown,unknown,no,unknown,none,draft,,v0,Neighbour Sister concept placeholder only; retained fallback direction
fpai-dh-concept-b-0001,generated_image,not_created,Family TBD,TBD,unknown,unknown,no,unknown,none,draft,,v0,Modern Educator concept placeholder only; retained fallback direction
fpai-dh-concept-c-0001,generated_image,not_created,Family TBD,TBD,unknown,unknown,no,unknown,none,draft,,v0,Warm Intellectual Companion concept placeholder only; selected primary exploration direction 2026-08-11
```

## Blockers

Any asset with unclear source, unclear license, real-person resemblance risk, voice-clone implication, third-party IP risk, or training ambiguity must stay out of production candidates until reviewed.
