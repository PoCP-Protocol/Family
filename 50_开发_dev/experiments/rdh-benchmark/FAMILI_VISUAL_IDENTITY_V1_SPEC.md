# FAMILI VISUAL IDENTITY V1 SPECIFICATION

**Lock Date:** 2026-08-20  
**Status:** 🔒 LOCKED (brand identity for RDH)

---

## Visual Identity V1: Semi-Realistic 3D Stylized Digital Human

### NOT:
- ❌ Photo-realistic human photo
- ❌ 2D cartoon
- ❌ Anime
- ❌ Ancient style character
- ❌ Generic AI avatar

### IS:
- ✅ Semi-realistic 3D stylized digital human
- ✅ Combines real adult woman credibility + AI brand character recognition
- ✅ Long-term brand representative for Family Growth OS

---

## Visual Features (LOCKED)

### Face
- Adult Chinese woman
- Soft oval face shape
- Natural warm skin tone
- Gentle, intelligent expression

### Hair
- Black or dark brown
- Mid-length to long (shoulder to mid-back)
- Soft texture, natural layering
- Living volume, not flat
- **CRITICAL:** Color and length stable (no stylization artifacts)

### Eyes
- **HIGHEST PRIORITY FEATURE**
- Large, clear, expressive
- Full of life, not dead/glassy
- Natural eye distance and proportion
- **CRITICAL:** Preserve size and shape across all utterances
- No compression to "realistic" size
- Blinking natural and appropriate

### Expression
- Warm, gentle smile (natural, not forced)
- Intelligent, thoughtful
- Trustworthy, accessible
- Knowledgeable, calm, mature

### Wardrobe (LOCKED for RDH)

**Outer:**
- Lavender / purple soft blazer
- Professional but warm tone

**Inner:**
- White V-neck blouse
- Clean, approachable

---

## Prohibited Changes

- ❌ Face identity (no "real person" swaps)
- ❌ Hair baseline (length, color, texture)
- ❌ Eye identity (size, shape, distance)
- ❌ Age impression (must stay 30-35)
- ❌ Overall persona (must stay intellectual + warm + trustworthy)
- ❌ Clothing (blazer + blouse locked)

---

## Files

### FAMILI_VISUAL_DIRECTION_V1.png
**Status:** AWAITING USER SUBMISSION

**Purpose:** Brand visual guideline reference  
**Format:** PNG, high resolution  
**Expected SHA256:** `486660d5238e6a6dd102b170018871f01ca2be24d483d08dcbc92d090149eda3`

### FAMILI_RDH_SMOKE_REFERENCE_V1.png
**Status:** AWAITING USER SUBMISSION

**Purpose:** Ditto smoke test input  
**Format:** PNG, head + shoulders  
**Expected SHA256:** `486660d5238e6a6dd102b170018871f01ca2be24d483d08dcbc92d090149eda3`

---

## Style Preservation (NEW Hard Floor)

### Benchmark Requirement

Primary candidate must preserve:

```
STYLE_PRESERVATION >= 4.0 / 5.0
```

### Scale

| Score | Definition |
|-------|-----------|
| 5 | Nearly complete style preservation, clearly same Famili V1 |
| 4 | Minor changes, still obviously same person (acceptable) |
| 3 | Clear style drift, different appearance |
| 2 | Character heavily reconstructed by model |
| 1 | Different person / severely distorted |

### Specific Checks

1. **Face shape:** Preserved?
2. **Eye size:** Large eyes maintained? Not compressed to realistic?
3. **Hair identity:** Black, length, texture stable?
4. **Clothing:** Purple blazer + white blouse visible + stable?
5. **Skin rendering:** Semi-realistic 3D style maintained? Not photorealistic? Not cartoony?
6. **Persona:** Still intellectual + warm + knowledgeable?
7. **Identity drift:** Consistent across multiple utterances (A01, A02, etc.)?

**FAIL condition:** Any single item failing = STYLE_PRESERVATION < 4.0

---

## Eye Identity Preservation (CRITICAL)

### Extra Focus

Eyes are Famili V1's highest recognition feature.

### Human Review: Eye Section

```
EYE IDENTITY PRESERVATION:
1-5

Specific checks:
[ ] Eye size maintained (large, not compressed)
[ ] Eye distance appropriate
[ ] Eye shape / tilt preserved
[ ] Pupil stable, no excessive jitter
[ ] Blinking natural and timed
[ ] Eye life present (not dead/glassy)
[ ] No distortion or artifacts
[ ] Same eyes across all clips
```

**Fail if engine distorts eyes = production rejection**

---

## Smoke Test Output Naming

**Expected first video:**

```
experiments/rdh-benchmark/outputs/ditto/smoke/
DITTO_FAMILI_V1_A01_SMOKE.mp4
```

**NOT:**
```
DITTO_HUMAN_A01_SMOKE.mp4  (old reference)
DITTO_GENERIC_A01_SMOKE.mp4
```

---

## First Video Human Gate

User visual inspection checklist (AFTER first MP4 generated):

```
[ ] IDENTITY: Still recognizably Famili V1?
[ ] STYLE: Still semi-realistic 3D stylized?
[ ] EYES: Have life, no distortion?
[ ] MOUTH: Natural, no artifacts?
[ ] TEETH: Stable, no jitter?
[ ] HAIR: Color + texture preserved?
[ ] HEAD: Natural motion, not robotic?
[ ] PERSONA: Intelligent + warm + trustworthy?
[ ] OVERALL: Would accept as long-term brand character?

PASS: All boxes checked + style >= 4.0
FAIL: Any major concern + style < 4.0
```

---

## Product Context

This identity must support:

- Parent counseling sessions
- Child coaching
- Growth plan explanations
- Growth report presentations
- Daily companion interactions
- Course learning support
- Live streaming
- Long-term member service

**Therefore:** No single-demo hacks. Identity must be extensible and consistent.

---

## V0 Status

**FAMILI_RDH_SMOKE_REFERENCE_V0.png**

- **Role:** HISTORICAL HUMAN REFERENCE / DIAGNOSTIC
- **Status:** Keep (do not delete)
- **Use:** Not in active benchmark
- **Purpose:** Trace audit trail

---

## Architecture Integration

Identity versioning does NOT break existing MM2-MM6:

```
CharacterIdentity
  ↓
Resolver
  ↓
RendererProfile
  + visual_identity_version: "famili-visual-v1"
  ↓
Engine adapter
  ↓
Real-time output
```

No breaking changes to core contracts.

---

## LOCKED Status

✅ Visual features frozen  
✅ Wardrobe locked  
✅ Identity constraints defined  
✅ Style preservation floor set (≥4.0)  
✅ Eye preservation emphasized  
✅ File structure ready

**Awaiting:** V1 image files from user

