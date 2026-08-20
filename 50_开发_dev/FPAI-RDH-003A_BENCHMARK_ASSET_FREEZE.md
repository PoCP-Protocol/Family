# FPAI-RDH-003A
# BENCHMARK ASSET & METRIC FREEZE
# 真人数字人实测前资产与测量口径冻结

**Date:** 2026-08-20  
**Status:** 🔒 FINAL ASSET & METRIC LOCK (GPU benchmark ready gate)  
**Next Phase:** GPU benchmark execution only

---

## EXECUTIVE SUMMARY

Before GPU benchmark begins, all assets and measurement methods must be **frozen**. This document locks:
1. Benchmark portrait identity
2. Audio suite (6 standardized Chinese clips)
3. Metric definitions (FPS, latency, A/V skew, interrupt)
4. Quality scoring criteria (with hard floors)
5. Engine role definitions
6. License review criteria
7. Ready gate checklist

**No changes after this document is approved.**

---

## A. BENCHMARK PORTRAIT: FAMILI_RDH_BENCHMARK_REFERENCE_V0

### Source

**User-provided:** 榜样科技校长真人照片 (real woman visual reference)

**NOT:** Final brand master. This is **BENCHMARK ONLY**.

**Status:** 📸 PENDING USER ASSET SUBMISSION

### Benchmark Preprocessing

**Apply once, freeze output.**

```
source-original.[jpg/png]
  ↓ preprocessing
benchmark-crop.[png]
  ↓ frozen
all-engine-reference
```

### Preprocessing Rules

```
1. Face fully visible (not occluded)
2. Eyes clear and open
3. Mouth neutral or gentle smile (not speaking)
4. Hair visible (not covering face)
5. Head & shoulders or half-body framing
6. No hand covering lower face
7. No artificial filter / cartoon conversion
8. No exaggerated beauty processing
9. Clean lighting (studio or natural window)
10. Simple background (no text, no objects)
11. Aspect ratio: square or 4:3 (portrait)
12. Dimensions: final resolution >= 512×512
13. No chromatic aberration, no jitter
14. Neutral color space (sRGB)
```

### Metadata: assets/famili-reference-v0/metadata.json

```json
{
  "source_file": "user_reference.jpg",
  "source_width": 1920,
  "source_height": 1440,
  "crop_rectangle": {
    "x": 300,
    "y": 200,
    "width": 1200,
    "height": 1200
  },
  "output_file": "benchmark-crop.png",
  "output_width": 512,
  "output_height": 512,
  "face_orientation": "front",
  "face_landmarks_valid": true,
  "mouth_state": "neutral",
  "eye_visibility": "clear_both",
  "preprocessing_date": "2026-08-20",
  "preprocessor": "manual",
  "comments": "Clean portrait, good lighting, no artifacts"
}
```

### Constraints

- **All three engines use identical preprocessed image**
- No engine-specific variants
- No rescaling per engine (adapter must handle)
- Frozen after approval

---

## B. AUDIO SUITE: RDH_AUDIO_BENCHMARK_V1

### Generation Method

**Use:** Family existing TTS system (unchanged)  
**Format:** WAV, mono, 16-bit PCM  
**Sample rate:** 16kHz (engines resample as needed)  
**One-time generation:** Freeze output

### A01_NORMAL_5S.wav

**Text:**
```
"你好，我是法咪莉。今天我们一起看看，最近这个家庭发生了哪些值得关注的变化。"
```

**Pace:** Normal conversational  
**Tone:** Warm, accessible  
**Duration target:** ~5 seconds  
**Purpose:** Baseline mouth sync, eye stability

---

### A02_EDUCATION_15S.wav

**Text:**
```
"孩子今天的表现，并不一定意味着他不愿意努力。很多时候，我们需要先理解行为背后的情绪、动力和家庭互动，再决定下一步怎样帮助他。"
```

**Pace:** Deliberate, thoughtful  
**Tone:** Wise, patient, professional  
**Duration target:** ~15 seconds  
**Purpose:** Long utterance stability, head motion, eye shifts

---

### A03_PAUSE.wav

**Text:**
```
"这件事……我们先不用急着下结论。可以先听听孩子自己怎么想。"
```

**Features:** Ellipsis pause (~1s silence in middle), then continuation  
**Pace:** Contemplative  
**Duration target:** ~6 seconds  
**Purpose:** Motion during silence, mouth closure, breath simulation

---

### A04_FAST.wav

**Text:**
```
[Recap of A02 content, approximately 1.5x normal speed]
"孩子的表现需要理解情绪背景。家庭互动决定帮助方式。"
```

**Pace:** 1.5x normal (faster but natural)  
**Tone:** Energetic but not anxious  
**Duration target:** ~8 seconds  
**Purpose:** Mouth tracking at speed, potential artifacts

---

### A05_BILABIAL.wav

**Text:**
```
"爸爸妈妈的陪伴，不是马上改变孩子，而是慢慢明白彼此，再一步一步改变。"
```

**Phoneme focus:** b / p / m / b / m / m / p / p / b  
**Pace:** Normal  
**Tone:** Warm, steady  
**Duration target:** ~6 seconds  
**Purpose:** Lip sync accuracy on labial consonants, teeth visibility

---

### A06_INTERRUPT.wav

**Text:**
```
[15-20 second natural explanation about child development]
"每个孩子都有自己的成长节奏。如果我们能认识到这一点，就能更好地……"
```

**Pace:** Natural conversation  
**Tone:** Professional, warm  
**Duration target:** ~15-20 seconds  
**Benchmark procedure:** Engine starts at 0s, interrupt signal sent at ~4s
**Purpose:** Audio stop latency, video motion stop latency, recovery quality

---

### Audio Suite Metadata: assets/audio-v1/metadata.json

```json
{
  "suite_version": "RDH_AUDIO_BENCHMARK_V1",
  "generation_date": "2026-08-20",
  "tts_engine": "family_tts",
  "tts_version": "current",
  "voice_id": "default_mandarin_female",
  "language": "zh-CN",
  "sample_rate": 16000,
  "format": "wav",
  "channels": 1,
  "bit_depth": 16,
  
  "clips": [
    {
      "id": "A01_NORMAL_5S",
      "text": "你好，我是法咪莉。...",
      "duration_seconds": 5.2,
      "rate_modifier": 1.0,
      "file": "A01_NORMAL_5S.wav"
    },
    {
      "id": "A02_EDUCATION_15S",
      "text": "孩子今天的表现，...",
      "duration_seconds": 14.8,
      "rate_modifier": 1.0,
      "file": "A02_EDUCATION_15S.wav"
    },
    {
      "id": "A03_PAUSE",
      "text": "这件事……...",
      "duration_seconds": 5.9,
      "rate_modifier": 1.0,
      "pause_seconds": 1.0,
      "file": "A03_PAUSE.wav"
    },
    {
      "id": "A04_FAST",
      "text": "孩子的表现...",
      "duration_seconds": 8.1,
      "rate_modifier": 1.5,
      "file": "A04_FAST.wav"
    },
    {
      "id": "A05_BILABIAL",
      "text": "爸爸妈妈的陪伴...",
      "duration_seconds": 6.3,
      "rate_modifier": 1.0,
      "labial_phonemes": ["爸", "妈", "明白", "慢慢", "改变"],
      "file": "A05_BILABIAL.wav"
    },
    {
      "id": "A06_INTERRUPT",
      "text": "每个孩子都有...",
      "duration_seconds": 17.5,
      "rate_modifier": 1.0,
      "interrupt_at_seconds": 4.0,
      "file": "A06_INTERRUPT.wav"
    }
  ],
  
  "comments": "All clips use identical voice model. Engines must resample if needed."
}
```

### Distribution Rule

```
All engines use identical WAV bytes
No per-engine resampling of master WAV
Resampling handled in engine adapter
Keep original 16kHz master frozen
```

---

## C. ENGINE ROLE DEFINITIONS (FROZEN)

### Candidate A: Ditto

**Official Role:** PRIMARY FULL REAL-TIME TALKING-HEAD CANDIDATE

**Strictest acceptance criteria:**
- Must support real-time or credible streaming architecture
- Must handle interruption cleanly
- Must demonstrate stable identity across long sessions
- Must support semantic control (gaze, expression, gestures)
- Must pass primary product quality thresholds

**If fails primary:** Can still contribute as fallback or specific component, but not primary.

---

### Candidate B: MuseTalk 1.5

**Official Role:** LIP-SYNC QUALITY BASELINE

**Core question answered:** "How naturally can Famili's mouth move?"

**Does NOT need to pass primary tests for:**
- Full gaze control
- Full head behavior
- Semantic expression
- Real-time streaming

**If excels at lip quality but lacks controls:** Can remain as LIP-SYNC MODULE or QUALITY REFERENCE.

---

### Candidate C: LivePortrait

**Official Role:** PORTRAIT MOTION / CONTROL BASELINE

**Core question answered:** "How well can we control head pose, eye gaze, and expression on a real portrait?"

**If using audio driver:** Must name specific driver and repository.

**Not to be misrepresented as:** Full audio-to-avatar pipeline without explicit audio adapter.

**If strong on control but weak on lip-sync:** Can remain as MOTION MODULE.

---

## D. FINAL ENGINE DECISION ARCHITECTURE

### Allowed Outcomes

**Option 1: Single Engine**
```
Ditto alone is sufficient
→ PRIMARY = Ditto
→ FALLBACK = MuseTalk or LivePortrait component
```

**Option 2: Composite Architecture**
```
Audio Driver (e.g., Whisper/custom)
  +
LivePortrait (portrait rendering)
  +
MuseTalk-style mouth module
  =
Full Famili pipeline

Only if:
- Improves quality materially
- Latency acceptable
- Complexity justified
- All components clear licensing
```

**Option 3: No Suitable Primary**
```
If all fail primary thresholds:
→ Escalation to new engine search
→ Or GPU upgrade + retry
→ Or architecture rethink
```

---

## E. QUALITY SCORING: TWO-LAYER PASS CRITERIA

### Layer 1: Engine Role-Specific PASS

**Ditto (Full):**
```
Identity consistency        >= 4.0/5
Education persona fit       >= 4.0/5
Mouth naturalness           >= 3.5/5
Eye life                    >= 3.5/5
Teeth stability             >= 3.5/5
Head motion restraint       >= 3.0/5
FPS                         >= 25 or streaming_credible
Long-session (60s)          NO catastrophic drift
Interrupt support           NATIVE or implementable
License                     CLEAR
```

**MuseTalk (Lip baseline):**
```
Mouth naturalness           >= 4.0/5
Teeth stability             >= 4.0/5
Identity preservation       >= 3.5/5
Temporal mouth stability    >= 3.5/5
FPS                         >= 25
License                     CLEAR
```

**LivePortrait (Motion baseline):**
```
Head motion quality         >= 3.5/5
Eye motion (if supported)   >= 3.0/5 (or N/A if not native)
Expression quality          >= 3.0/5
Identity consistency        >= 3.5/5
License                     CLEAR
```

### Layer 2: PRIMARY PRODUCT PASS

**Only Ditto (or composite with Ditto core) can qualify:**

```
Identity consistency        >= 4.0/5  [HARD FLOOR]
Education persona fit       >= 4.0/5  [HARD FLOOR]
Mouth naturalness           >= 3.5/5  [HARD FLOOR]
Eye life                    >= 3.5/5  [HARD FLOOR]
Teeth stability             >= 3.5/5  [HARD FLOOR]
Head motion restraint       >= 3.0/5  [SOFT FLOOR]
Skin/face stability         >= 3.0/5  [SOFT FLOOR]
Human presence              >= 3.5/5  [SOFT FLOOR]

Realtime:
  FPS >= 25 sustainable
  OR credible streaming path <= 200ms visible latency

A/V Sync:
  |onset_skew| <= 80ms (preferred < 40ms)

Interrupt:
  Support native OR clear < 1 day implementation

License:
  CLEAR (no review needed)

Long-session 60s:
  NO catastrophic identity drift
  NO accumulating major artifacts
```

**If ANY hard floor missed:** Primary selection blocked.

---

## F. METRIC DEFINITIONS (FROZEN)

### FPS Distinction

**Generation FPS:**
```
Frames produced per second by model
Measured: model forward passes / wall-clock time
```

**Delivered/Display FPS:**
```
Frames successfully output from engine to consumer
Measured: valid output frames / wall-clock time
May be lower than generation FPS if there's encoding/streaming overhead
```

**Report BOTH.**

**Primary Product Judge: Delivered FPS**

---

### First Frame Latency

**Definition:**
```
IDENTITY_PREP_START = when prepareIdentity() called
IDENTITY_PREP_END = when prepareIdentity() returns
IDENTITY_PREP_TIME_MS = IDENTITY_PREP_END - IDENTITY_PREP_START
  [Report separately, one-time cost]

AUDIO_AVAILABLE_START = when audio first available to engine
FIRST_FRAME_OUTPUT_END = when first valid talking video frame produced
FIRST_FRAME_LATENCY_MS = FIRST_FRAME_OUTPUT_END - AUDIO_AVAILABLE_START
  [Per-utterance cost, does NOT include identity prep]
```

**Report both separately.**

---

### A/V Skew Measurement

**Precise definition:**

```
AUDIO_ONSET_TS:
  Timestamp in benchmark audio when first speech consonant/vowel becomes audible
  [Use waveform analysis or manual measurement]

VISUAL_MOUTH_ONSET_TS:
  Timestamp in output video when mouth first deviates from neutral position
  [First frame where mouth_opening > 5% or similar threshold]

ONSET_SKEW_MS:
  VISUAL_MOUTH_ONSET_TS - AUDIO_ONSET_TS
  (positive = video leads audio, negative = audio leads video)

AUDIO_END_TS:
  Timestamp when speech actually stops (audio amplitude < threshold)

MOUTH_CLOSE_TS:
  First frame after speech where mouth returns to neutral (opening < 5%)

END_SKEW_MS:
  MOUTH_CLOSE_TS - AUDIO_END_TS
```

**Report:**
```
onset_skew_ms: [+/- number]
end_skew_ms: [+/- number]
(preserve sign, don't absolute value)

Bins:
  <= 40ms: excellent
  40-80ms: good
  80-150ms: visible risk
  > 150ms: fail for primary
```

---

### Interrupt Latency

**Definition:**

```
INTERRUPT_COMMAND_TS:
  Timestamp when interrupt() method called

OLD_UTTERANCE_LAST_FRAME_TS:
  Timestamp of last video frame from old utterance

NEW_UTTERANCE_FIRST_FRAME_TS:
  Timestamp of first frame from next utterance

INTERRUPT_VISUAL_LATENCY_MS:
  OLD_UTTERANCE_LAST_FRAME_TS - INTERRUPT_COMMAND_TS

STALE_FRAMES_AFTER_INTERRUPT:
  Count of frames delivered after interrupt_call but before last frame

NEXT_UTTERANCE_IDENTITY_CLEAN:
  YES if identity stable, NO if residual motion from old utterance
```

**Report:**
```
interrupt_visual_latency_ms: [number]
stale_frames_count: [number]
next_utterance_clean: [YES/NO]
recovery_time_to_neutral_ms: [number or N/A]
```

---

### VRAM Measurement

```
PEAK_VRAM_MB:
  Maximum GPU memory used during entire session
  [Query at 100Hz with torch.cuda.memory_allocated()]

IDLE_VRAM_MB:
  VRAM immediately after all inference complete + cleanup
  [torch.cuda.memory_allocated() after engine.cleanup()]

MODEL_LOAD_VRAM_MB:
  Peak VRAM during model loading (before identity prep)
```

**Report all three.**

---

### 60-Second Stability Test

**Protocol:**
```
NOT: Same sentence repeated 4x
USE: Natural conversation sequence:

  A02 (explain)
  → 2 second pause
  → A01 (statement)
  → 1 second pause
  → A03 (with pause)
  → 2 second pause
  → Interrupt at 1s into A02 repeat
  → Recover with A04 (fast)
  
Total: ~60 seconds of varied content
```

**Measurements:**
```
Identity drift frame 1 vs. frame 1800 (60s later):
  Landmark distance delta < 10% OK
  > 20% FAIL

Artifact count (teeth jitter, face warping):
  Per 10-second window
  < 2 OK
  > 5 FAIL

Memory growth:
  Peak VRAM at start vs. end
  Acceptable: < 10% growth
  Unacceptable: > 30% growth

Frame time variance (jitter):
  Std dev of frame times
  Acceptable: < 5ms
  Unacceptable: > 15ms
```

---

## G. HUMAN QUALITY REVIEW (MANDATORY)

### Template: human-review/scoring-form.json

```json
{
  "benchmark_session": "ditto-run-001",
  "audio_clip": "A01_NORMAL_5S",
  "reviewer": "[human name]",
  "review_date": "2026-08-20",
  "review_time_minutes": 5,
  
  "scores": {
    "identity_consistency": {
      "score": 4,
      "comment": "Same person throughout, good hair continuity"
    },
    "eye_life": {
      "score": 3,
      "comment": "Eyes move naturally but slightly glassy in places"
    },
    "mouth_naturalness": {
      "score": 4,
      "comment": "Mouth shapes match phonemes well, no obvious artifacts"
    },
    "teeth_stability": {
      "score": 4,
      "comment": "No jittering, teeth visible but not distracting"
    },
    "head_motion_restraint": {
      "score": 3,
      "comment": "Subtle head movements, occasionally slightly exaggerated"
    },
    "skin_face_stability": {
      "score": 3,
      "comment": "Minor face jitter at 8-9 second mark"
    },
    "education_persona_fit": {
      "score": 4,
      "comment": "Conveys wisdom and warmth, professional bearing"
    },
    "overall_human_presence": {
      "score": 3,
      "comment": "Feels mostly human, occasional uncanny moments"
    },
    "uncanny_severity": {
      "score": 4,
      "comment": "Mild uncanny effect around eyes, acceptable for product"
    }
  },
  
  "quality_score_mean": 3.67,
  "overall_assessment": "PASS_ROLE",
  "notes": "Strong on mouth sync and identity. Eyes need slight improvement.",
  "would_recommend_primary": true
}
```

### Rules

- **One human per clip** (no averaging model scores)
- **Independent reviewers** for different engines if possible
- **Standardized form** for all engines and clips
- **No model self-scoring** of visual quality
- **Blind review** (don't know which engine produces output, if possible)

---

## H. LICENSE REVIEW CHECKLIST

### Template: metrics/license-review.yaml

```yaml
candidate: ditto

code_repository:
  url: https://github.com/antgroup/ditto
  license: [Apache-2.0 / MIT / proprietary / unclear]
  last_update: [date]

model_weights:
  source: [huggingface / proprietary / other]
  license: [same as above]
  training_data_source: [public / proprietary / mixed]
  commercial_deployment: [allowed / restricted / prohibited]

third_party_components:
  face_detector:
    name: [e.g., RetinaFace]
    license: [Apache-2.0]
  audio_encoder:
    name: [e.g., wav2vec]
    license: [MIT]
  other:
    - name: [...]
      license: [...]

commercial_deployment_status: [CLEAR / REVIEW_REQUIRED / BLOCKED]

blocking_factors:
  - "None"

review_notes: "All dependencies permissive licenses. Commercial deployment OK."

final_verdict: CLEAR
```

### Verdict Definitions

```
CLEAR:
  Code + weights + all dependencies permit commercial deployment.
  No review needed. Can use directly.

REVIEW_REQUIRED:
  One or more dependencies have unclear commercial terms.
  Legal team must review before production commitment.
  Technical benchmarking can proceed (mark with caveat).

BLOCKED:
  Commercial deployment explicitly prohibited.
  Candidate cannot be used in production.
  Technical benchmark skipped.
```

---

## I. BENCHMARK READY GATE

### Checklist

```
[ ] Portrait frozen
      ├─ asset: assets/famili-reference-v0/benchmark-crop.png
      ├─ metadata: assets/famili-reference-v0/metadata.json
      └─ all engines use identical image

[ ] Audio suite frozen
      ├─ A01 through A06 generated
      ├─ metadata: assets/audio-v1/metadata.json
      ├─ all engines use identical WAV
      └─ no per-engine resampling of master

[ ] Candidate roles frozen
      ├─ Ditto = full primary candidate
      ├─ MuseTalk = lip-sync baseline
      └─ LivePortrait = motion baseline

[ ] Quality scoring criteria frozen
      ├─ Hard floors defined (identity >= 4.0, persona >= 4.0)
      ├─ Role-specific pass criteria
      └─ Primary product pass criteria

[ ] Metric definitions frozen
      ├─ FPS (generation vs. delivered)
      ├─ First frame latency (excl. identity prep)
      ├─ A/V skew (onset, end, with sign)
      ├─ Interrupt latency
      ├─ VRAM (peak, idle, model load)
      └─ 60-second protocol (varied content)

[ ] Human review form ready
      ├─ Standardized JSON template
      ├─ 9-point scoring scale
      └─ Comment field required

[ ] License checklist ready
      ├─ CLEAR / REVIEW_REQUIRED / BLOCKED logic
      └─ All three candidates filled out

[ ] Directory structure ready
      ├─ experiments/rdh-benchmark/assets/
      ├─ candidates/ditto/ (ready)
      ├─ candidates/musetalk/ (ready)
      ├─ candidates/liveportrait/ (ready)
      ├─ outputs/ (empty)
      ├─ metrics/ (empty)
      ├─ human-review/ (empty)
      ├─ reports/ (empty)
      └─ .gitignore (configured)

[ ] GPU environment frozen
      └─ Benchmark Floor = RTX 3060 12GB
         (not production minimum)

[ ] Smoke gate protocol documented
      ├─ Gate 1: Install
      ├─ Gate 2: Model load
      ├─ Gate 3: Image + audio → output
      └─ Gate 4: Identity acceptable

[ ] Ready gate sign-off
      └─ Approved: YES / NO
```

---

## J. BENCHMARK FLOOR GPU (NOT Production Minimum)

### Classification

```
RTX 3060 12GB / Ampere architecture
CUDA 11.8+
PyTorch 2.0+
Linux preferred (Ubuntu 20.04+)

Role: BENCHMARK FLOOR
      Baseline environment for controlled testing

NOT: Production minimum GPU
NOT: Development GPU recommendation
NOT: Multi-session GPU target

Final hardware tiers (Minimum Dev, Recommended Dev, Production) 
derived AFTER benchmark results.
```

---

## K. FINAL FREEZE APPROVAL GATE

### Readiness Matrix

```
Portrait:               FROZEN / PENDING
Audio:                  FROZEN / PENDING
Metrics:                FROZEN / PENDING
Quality criteria:       FROZEN / PENDING
Human review form:      FROZEN / PENDING
License template:       FROZEN / PENDING
GPU classification:     FROZEN / PENDING
All checkboxes:         [ PASS ] / [ FAIL ]
```

### Signature

```
FPAI-RDH-003A STATUS:

[ ] READY FOR GPU BENCHMARK
    All prerequisites met.
    Execute controlled benchmark.
    GPU node provision and run trials.

[ ] BLOCKED - PENDING RESOLUTION
    Reason: [portrait / audio / legal / other]
    Blocker: [specific issue]
    Timeline to unblock: [days]
```

---

## L. OUTPUT REPORT: FPAI-RDH-003A_BENCHMARK_ASSET_FREEZE

### Sections

```
A. PORTRAIT FREEZE
   Source: [user asset]
   Preprocessing: [complete]
   Frozen image: [path]
   Metadata: [JSON]

B. AUDIO SUITE FREEZE
   Generation: [complete]
   Six clips: [A01-A06 paths]
   Metadata: [JSON]
   All engines: [identical WAV]

C. ENGINE ROLES CONFIRMED
   Ditto: [primary full]
   MuseTalk: [lip baseline]
   LivePortrait: [motion baseline]

D. QUALITY CRITERIA FROZEN
   Hard floors: [defined]
   Role-specific: [defined]
   Primary product: [defined]

E. METRICS LOCKED
   FPS: [definition]
   Latency: [definition]
   A/V skew: [definition]
   Interrupt: [definition]
   VRAM: [definition]
   60s protocol: [defined]

F. HUMAN REVIEW FORM READY
   Template: [JSON]
   Blind review: [yes/no]

G. LICENSE REVIEW READY
   CLEAR / REVIEW / BLOCKED
   Candidates: [status]

H. BENCHMARK FLOOR
   GPU: RTX 3060 12GB
   Role: BENCHMARK FLOOR (not production)

I. READY GATE
   All prerequisites: [ PASS / FAIL ]

J. NEXT STEP
   Provision GPU node
   Execute benchmark
   Measure all metrics
   Human review outputs
   Generate RDH-003_BENCHMARK_REPORT
```

---

## ⏹️ CRITICAL FREEZE STATEMENT

**After this document is approved with all checkboxes PASS:**

```
NO FURTHER CHANGES to:
- Portrait crop
- Audio clips
- Metric definitions
- Quality scoring criteria
- Human review form

GPU benchmark proceeds with frozen assets.
```

**If changes needed after approval:**
1. Document rationale
2. Create AMENDMENT section
3. Re-freeze
4. Re-approve
5. Note benchmark affected clips

**Do not run benchmark with partially-frozen assets.**

---

## NEXT: RDH-003 GPU BENCHMARK EXECUTION

Once all gates PASS:

```
[ ] Provision GPU node (RTX 3060 12GB+)
[ ] Clone candidate repos
[ ] Execute smoke gates (per candidate)
[ ] Run full benchmark (all 6 clips)
[ ] Record all metrics
[ ] Human quality review
[ ] Compile FPAI-RDH-003_BENCHMARK_REPORT
[ ] Make primary engine decision
[ ] GO/NO-GO for RDH-MVP
```

---

**STATUS: AWAITING FINAL FREEZE APPROVAL**

Asset folder: `experiments/rdh-benchmark/`  
Ready gate: Checklist above  
Next document: `FPAI-RDH-003_BENCHMARK_REPORT.md` (post-benchmark)

