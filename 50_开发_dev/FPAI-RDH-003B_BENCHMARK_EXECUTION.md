# FPAI-RDH-003B
# CONTROLLED GPU BENCHMARK EXECUTION
# 法咪莉真人数字人 GPU 统一实测执行

**Date:** 2026-08-20  
**Status:** 🚀 BENCHMARK EXECUTION (real hardware, real results)  
**Assets:** Frozen from RDH-003A (no changes)

---

## EXECUTION PRIORITIES

```
1. REAL OUTPUT FIRST
   MP4 videos saved
   Metrics recorded
   Logs captured

2. REPORT SECOND
   Analysis of results
   Comparison tables
   Conclusions

3. NO DOCUMENTATION BLOAT
   ~50-100 line final report
   Emphasize videos + metrics JSON
   Let results speak
```

---

## A. BENCHMARK ENVIRONMENT INVENTORY

### Record Exactly (Must Fill Before Benchmark Starts)

```json
{
  "gpu": {
    "model": "RTX 3060 / RTX 3090 / A100 / [exact]",
    "vram_gb": 12,
    "compute_capability": "8.6",
    "pci_id": "00:1d.0",
    "driver_version": "535.xx"
  },
  "cuda": {
    "version": "11.8 or 12.1",
    "toolkit_path": "/usr/local/cuda"
  },
  "os": {
    "name": "Ubuntu 22.04",
    "kernel": "5.15.x"
  },
  "cpu": {
    "model": "Intel Xeon / AMD EPYC / [exact]",
    "cores": 32,
    "threads": 64
  },
  "ram": {
    "total_gb": 128,
    "available_gb": 110
  },
  "python": {
    "version": "3.10.x",
    "executable": "/usr/bin/python3"
  },
  "pytorch": {
    "version": "2.0.1",
    "cuda": "11.8"
  },
  "tensorrt": {
    "version": "8.6.1",
    "available": true
  },
  "ffmpeg": {
    "version": "6.0",
    "codecs": ["h264", "h265", "vp9"]
  },
  "timestamp": "2026-08-20T10:00:00Z",
  "notes": "Clean environment, no other GPU workloads"
}
```

**File:** `experiments/rdh-benchmark/metrics/ENVIRONMENT_MANIFEST.json`

---

## B. CANDIDATE VERSION LOCK

### Ditto

**Before Installation:**

```
Repository:           https://github.com/antgroup/ditto
Commit SHA:           [exact git hash]
Branch:               [main / feature / tag]
Clone date:           [YYYY-MM-DD]

Code License:         [Apache-2.0 / other]
Weights URL:          [official source]
Weights Hash:         [md5 or sha256 if available]
Weights License:      [same as code / different]

Third-party deps:
  - face-detector:    [name, version, license]
  - audio-encoder:    [name, version, license]
  - other:            [...]

Installation method:  pip install -r requirements.txt
Requirements frozen:  YES (save requirements.txt snapshot)

Locked timestamp:     2026-08-20T10:05:00Z
```

**File:** `experiments/rdh-benchmark/candidates/ditto/VERSION_LOCK.json`

### MuseTalk 1.5

**Same format, separate file:**

```
File: experiments/rdh-benchmark/candidates/musetalk/VERSION_LOCK.json
```

### LivePortrait

**Same format, plus audio driver lock:**

```
Audio Driver:
  Repository:        [URL]
  Commit SHA:        [hash]
  License:           [...]

File: experiments/rdh-benchmark/candidates/liveportrait/VERSION_LOCK.json
```

---

## C. ENVIRONMENT ISOLATION

### Create Separate Conda/venv Per Candidate

```bash
# Ditto
cd experiments/rdh-benchmark/candidates/ditto
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# MuseTalk
cd experiments/rdh-benchmark/candidates/musetalk
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# LivePortrait
cd experiments/rdh-benchmark/candidates/liveportrait
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Constraint:** No shared Python environment.

---

## D. EXECUTION ORDER

```
DITTO
├─ Smoke Gate 01: Install
├─ Smoke Gate 02: Model Load
├─ Smoke Gate 03: A01 Image + Audio → Output
├─ Smoke Gate 04: Human Basic Quality Check
│
├─ IF ALL SMOKE PASS:
│  ├─ Full Benchmark (A01-A06)
│  ├─ Save ALL outputs to outputs/ditto/full/
│  ├─ Record metrics.json
│  └─ REPORT FIRST VIDEO TO USER
│
└─ IF SMOKE FAIL:
   └─ Log reason, STOP Ditto
   (Do NOT retry 30 parameter tuning attempts)

↓

MUSETALK
├─ Smoke Gate 01: Install
├─ [... same protocol ...]
└─ Full Benchmark (A01-A06)

↓

LIVEPORTRAIT
├─ Verify Audio Driver availability
├─ [... same protocol ...]
└─ Full Benchmark (A01-A06)
```

---

## E. DITTO SMOKE GATE

### D-G01: INSTALL

```bash
cd experiments/rdh-benchmark/candidates/ditto
source .venv/bin/activate
pip install -r requirements.txt
```

**Success:** All packages installed without error.  
**Failure:** Dependency conflict, missing weights, network error.

**Action on Failure:** Log error, **STOP Ditto**.

---

### D-G02: MODEL LOAD

```python
import torch
import ditto  # or equivalent import

device = torch.device('cuda:0')
engine = ditto.load_model(device=device)
print(f"Model loaded. VRAM: {torch.cuda.memory_allocated() / 1e9:.2f} GB")
```

**Record:**
- Load time (seconds)
- Peak VRAM (MB)
- Idle VRAM (MB)
- No errors

**Failure Examples:**
- Out of memory even before identity prep
- Model file corrupted
- CUDA incompatibility

**Action on Failure:** Log reason, **STOP Ditto**.

---

### D-G03: IMAGE + AUDIO → OUTPUT

```python
engine.prepareIdentity('assets/famili-reference-v0/benchmark-crop.png')
engine.startUtterance('smoke-test-001')
engine.pushAudioChunk(load_wav('assets/audio-v1/A01_NORMAL_5S.wav'), 0)
engine.submitAudioComplete()

frames = engine.getFrames(all=True)
save_video(frames, 'outputs/ditto/smoke/A01_OUTPUT.mp4')
```

**Success:** MP4 file created, readable, has frames.  
**Failure:** No frames, black frames, crash.

**Action on Failure:** Log error, **STOP Ditto**.

---

### D-G04: HUMAN BASIC QUALITY CHECK

**Visual Checklist (5 minute eyeball):**

```
[ ] Still recognizably the same woman
    (not random face or default avatar)

[ ] No catastrophic face deformation
    (face geometry still vaguely human-shaped)

[ ] Mouth visibly responds to speech
    (mouth opens/closes during talking)

[ ] Eyes not catastrophically broken
    (not solid white, not all pupils, eyes in face)

[ ] Output is watchable
    (not complete garbage / pure noise / frame corruption)
```

**Verdict:** PASS / FAIL

**Action on PASS:** Continue to Full Benchmark.  
**Action on FAIL:** Log reason, **STOP Ditto**.

**If borderline (e.g., "mouth barely moves but watchable"):**
- Document borderline state
- Continue to full benchmark
- Full benchmark will clarify via lip-sync metrics

---

## F. DITTO SMOKE PASS → IMMEDIATE USER VIDEO

**CRITICAL STEP:**

After D-G04 PASS, **IMMEDIATELY:**

```bash
cp outputs/ditto/smoke/A01_OUTPUT.mp4 \
   human-review/FIRST_REAL_DITTO_A01.mp4

# Email / notify user with video path
# Indicate: "This is first real Famili talking video from Ditto"
```

**Why:** This is the first valuable real-world result. Show it before continuing.

---

## G. DITTO FULL BENCHMARK

### Per Audio Clip (A01-A06)

```
FOR each clip in [A01, A02, A03, A04, A05, A06]:
  
  1. Run engine
     engine.prepareIdentity(portrait)
     engine.startUtterance(clip_id)
     push_audio(clip_wav)
     submitComplete()
  
  2. Extract output
     frames = engine.getFrames()
  
  3. Record metrics
     FPS, latency, VRAM, GPU util, A/V skew, etc.
  
  4. Save outputs
     outputs/ditto/full/{CLIP_ID}_video.mp4
     outputs/ditto/full/{CLIP_ID}_metrics.json
     outputs/ditto/full/{CLIP_ID}_runtime.log
  
  5. A06 special: test interrupt
     At 4 seconds: engine.interrupt()
     Record interrupt latencies
```

### Output Structure

```
outputs/ditto/full/
├─ A01_NORMAL_5S/
│  ├─ video.mp4
│  ├─ metrics.json
│  └─ runtime.log
├─ A02_EDUCATION_15S/
├─ A03_PAUSE/
├─ A04_FAST/
├─ A05_BILABIAL/
└─ A06_INTERRUPT/
   ├─ video.mp4
   ├─ metrics.json
   ├─ runtime.log
   └─ interrupt_test.json
```

---

## H. METRICS COLLECTION (ALL ENGINES)

### Template: metrics.json

```json
{
  "engine": "ditto",
  "commit": "abc123def456",
  "audio_clip": "A01_NORMAL_5S",
  
  "environment": {
    "gpu": "RTX 3060",
    "cuda": "11.8"
  },
  
  "timing": {
    "identity_prepare_seconds": 0.5,
    "first_frame_ms": 145,
    "generation_fps": 28.5,
    "delivered_fps": 25.0,
    "total_generation_seconds": 5.2,
    "p95_frame_ms": 45.0
  },
  
  "av_sync": {
    "onset_skew_ms": -35.0,
    "end_skew_ms": 12.0,
    "method": "waveform_analysis"
  },
  
  "resources": {
    "peak_vram_mb": 1240,
    "idle_vram_mb": 800,
    "gpu_util_avg_percent": 78,
    "cpu_util_avg_percent": 35,
    "system_ram_mb": 4200
  },
  
  "interrupt": {
    "audio_stop_latency_ms": 52.0,
    "visual_stop_latency_ms": 68.0,
    "stale_frames": 2,
    "next_utterance_clean": true
  },
  
  "quality_observations": {
    "identity_drift_notes": "minimal",
    "artifacts_observed": "minor teeth jitter at 3.2s",
    "mouth_coverage": "good"
  }
}
```

---

## I. HUMAN BLIND REVIEW PROTOCOL

### Step 1: Anonymize Videos

```
Create mapping (kept separate from review videos):

mapping.json:
{
  "Engine_X": "ditto",
  "Engine_Y": "musetalk",
  "Engine_Z": "liveportrait"
}

Randomize actual order:
review_videos/
├─ Engine_X_A01.mp4  (actually: musetalk)
├─ Engine_Y_A01.mp4  (actually: liveportrait)
├─ Engine_Z_A01.mp4  (actually: ditto)
├─ Engine_X_A02.mp4
├─ Engine_Y_A02.mp4
├─ Engine_Z_A02.mp4
... (etc, all 18 videos)
```

**DO NOT SHOW:** mapping.json to reviewer until scoring complete.

---

### Step 2: Human Review Session

**Reviewer:**
- Watch all 6 clips from one Engine
- Before moving to next Engine, fill score form
- Then move to next Engine

**Form Template:** `human-review/REVIEW_FORM_ENGINE_X.json`

```json
{
  "reviewer_id": "[anonymous or name if permitted]",
  "engine_code": "Engine_X",
  "review_date": "2026-08-20",
  "review_duration_minutes": 25,
  
  "clips": [
    {
      "clip_id": "A01_NORMAL_5S",
      "scores": {
        "identity_consistency": 4,
        "eye_life": 3,
        "mouth_naturalness": 4,
        "teeth_stability": 4,
        "head_motion_restraint": 3,
        "skin_face_stability": 3,
        "education_persona_fit": 4,
        "overall_human_presence": 3,
        "uncanny_severity": 4
      },
      "section_focus": {
        "eyes": "Natural eye movement, slightly glassy at start",
        "mouth": "Good mouth shape, accurate lip sync",
        "teeth": "Visible teeth, no jittering",
        "hair_face_boundary": "Hair stable, no artifacts",
        "head_motion": "Subtle nod at 2.5s, natural"
      },
      "pass_fail": "PASS",
      "notes": "Strong performance on this clip"
    },
    {
      "clip_id": "A02_EDUCATION_15S",
      ...
    },
    ... (A03-A06)
  ],
  
  "overall": {
    "recommendation": "VIABLE_PRIMARY / VIABLE_FALLBACK / BASELINE_ONLY / FAIL",
    "critical_issues": "None observed",
    "standout_strengths": "Consistent mouth sync",
    "concerns": "Eye life slightly mechanical"
  }
}
```

---

### Step 3: Reveal Mapping, Consolidate Scores

After all reviewers done:

```
mapping.json revealed

Human Review Summary:

Engine_X (ditto):         avg_quality = 3.78/5
Engine_Y (musetalk):      avg_quality = 3.45/5
Engine_Z (liveportrait):  avg_quality = 3.12/5

(These are example numbers)
```

---

## J. SPECIAL TEST FOCUS: 5 BODY PARTS

### During Human Review, Emphasize

#### EYES

```
Watch for:
- Is there life in the eyes?
- Do pupils track naturally?
- Any sudden jitter / focus loss?
- Uncanny stare?
- Blinking realistic?
- White of eye properly proportioned?

Rate: 1=dead/glassy, 5=alive/engaging
```

#### MOUTH

```
Watch for:
- Does mouth shape match phoneme?
- Lips naturally close/open?
- Jaw movement realistic?
- Corners of mouth natural?
- Smile looks sincere?

Rate: 1=wrong/artificial, 5=natural sync
```

#### TEETH

```
Watch for:
- Do teeth jitter / flash?
- Appear/disappear suddenly?
- Overlap incorrectly?
- Gum line artifacts?
- Only visible when appropriate?

Rate: 1=severe artifacts, 5=stable/invisible
```

#### HAIR / FACE BOUNDARY

```
Watch for:
- Does hair stay in place?
- Edges flip in/out?
- Blending smooth?
- Volume realistic?
- No floating strands?

Rate: 1=unstable/glitchy, 5=stable/realistic
```

#### HEAD MOTION

```
Watch for:
- Is head locked?
- Does head move too much (robot)?
- Natural micro-movements?
- Follows speech emphasis naturally?
- Nod/shake believable?

Rate: 1=locked/robotic, 5=natural/subtle
```

---

## K. SPECIAL TEST PROTOCOLS

### A03: Pause Mouth Test

**During pause (~1s silence):**

```
Observe:
[ ] Mouth naturally relaxes
[ ] Doesn't continue random movement
[ ] Eyes don't still move
[ ] Looks like person thinking

Report:
PAUSE_MOUTH_BEHAVIOR:
NATURAL / LEAKAGE / FREEZING / OTHER
```

---

### A05: Bilabial Consonant Focus

**Keywords: 爸 妈 陪伴 明白 慢慢 改变**

```
Per b/p/m sound:
[ ] Lips close together fully
[ ] Not just "m" sound visual
[ ] Mouth shape matches expected phoneme
[ ] No teeth visible inappropriately
[ ] Transitions smooth

Count:
BILABIAL_FAILURES: [number]
```

---

### A06: Interrupt Test (Primary Only)

**Real-time protocol:**

```
Time 0s: engine.startUtterance('interrupt-test')
Time 0s: engine.pushAudioChunk(A06_wav)

Time 4s: engine.interrupt()
  Record interrupt_command_timestamp = T_interrupt

Measure:
- audio stops at T_audio_stop
- last old video frame at T_frame_old
- stale frames count
- first new utterance frame clean?

INTERRUPT_AUDIO_LATENCY_MS = T_audio_stop - T_interrupt
INTERRUPT_VISUAL_LATENCY_MS = T_frame_old - T_interrupt
STALE_FRAMES = count after interrupt
RECOVERY_CLEAN = YES/NO

Report all four.
```

---

## L. 60-SECOND STABILITY TEST (Primary Only)

### Protocol

**Content sequence (60 seconds total):**

```
0s:    Start A02 (education)
15s:   Finish A02
15s:   2s pause
17s:   Start A01 (statement)
22s:   Finish A01
22s:   1s pause
23s:   Start A03 (pause)
29s:   Finish A03
29s:   2s pause
31s:   Start A02 again
46s:   At 4s mark (50s total time): INTERRUPT
50s:   Start A04 (fast)
58s:   Finish A04
```

### Sampling

**Every 10 seconds, capture snapshot:**

```
snapshots/
├─ T0000s_start.jpg
├─ T0010s.jpg
├─ T0020s.jpg
├─ T0030s.jpg
├─ T0040s.jpg
├─ T0050s.jpg
├─ T0060s_end.jpg
```

### Measurements

```
Landmark Drift:
  Distance from T0000s landmarks to T0060s landmarks
  < 10% PASS
  > 20% FAIL

Artifact Count (per 10s window):
  Teeth jitter, face warping, eye glitch
  < 2 PASS
  > 5 FAIL

Memory Growth:
  VRAM at start vs. end
  < 10% growth OK
  > 30% growth FAIL

FPS Stability:
  Std dev of frame times
  < 5ms OK
  > 15ms unstable
```

---

## M. MUSETALK & LIVEPORTRAIT

### Execution

Same smoke gate protocol as Ditto.

If smoke PASS:
- Full benchmark (A01-A06)
- Record all metrics
- Human blind review same protocol

### Role-Specific Notes

**MuseTalk:**
- Primary focus: lip accuracy
- Don't penalize for lacking gaze control
- Key question: "How natural is the mouth?"

**LivePortrait:**
- If no audio driver: test portrait motion only (not talking)
- Record explicit: "AUDIO DRIVEN: NOT TESTED"
- Primary focus: head/eye motion quality
- Key question: "How controllable is the pose/expression?"

---

## N. FINAL VIDEO OUTPUT DIRECTORY

### For User Visual Inspection

```
human-review/final-comparison/

├─ A01_Clip_X.mp4   (Engine X, A01)
├─ A01_Clip_Y.mp4   (Engine Y, A01)
├─ A01_Clip_Z.mp4   (Engine Z, A01)

├─ A02_Clip_X.mp4
├─ A02_Clip_Y.mp4
├─ A02_Clip_Z.mp4

├─ A05_Clip_X.mp4   (bilabial focus)
├─ A05_Clip_Y.mp4
├─ A05_Clip_Z.mp4

├─ mapping.json      (reveal after review)
└─ comparison_summary.txt
```

---

## O. FINAL REPORT (SHORT)

### FPAI-RDH-003_BENCHMARK_REPORT.md

```markdown
# FPAI-RDH-003: CONTROLLED GPU BENCHMARK REPORT

## Environment

GPU: RTX 3060 12GB
OS: Ubuntu 22.04
CUDA: 11.8
PyTorch: 2.0.1

## Ditto

Smoke: PASS
Full Benchmark: A01-A06 complete

Quality (avg 6 clips): 3.78/5
Hard Floors:
  Identity: 4.0 ✓
  Persona: 4.2 ✓
  Mouth: 3.8 ✓
  Eyes: 3.6 ✓
  Teeth: 3.9 ✓

Performance:
  FPS: 28.5 (delivered)
  First frame: 145ms
  A/V onset skew: -35ms ✓
  Interrupt latency: 68ms ✓

Streaming: native
Interrupt: native
60s: PASS (minimal identity drift)

License: CLEAR

---

## MuseTalk

Smoke: PASS
Full Benchmark: A01-A06 complete

Quality (avg 6 clips): 3.45/5
Mouth naturalness: 4.1 (strong)
Teeth stability: 4.0 (excellent)
Identity: 3.5

Performance:
  FPS: 32.0
  First frame: 120ms

Role: LIP-SYNC BASELINE
Recommendation: Valuable for lip quality reference

License: CLEAR

---

## LivePortrait

Smoke: PASS
Audio Driver: [NAME] (not tested in full benchmark)

Quality (portrait motion): 3.12/5
Head control: 3.8
Eye control: 3.2
Expression: 2.8

Role: MOTION BASELINE (audio not tested)

License: REVIEW_REQUIRED

---

## Hard Floor Results

| Engine | Identity | Persona | Mouth | Eyes | Teeth | PASS |
|--------|----------|---------|-------|------|-------|------|
| Ditto | 4.0 | 4.2 | 3.8 | 3.6 | 3.9 | YES |
| MuseTalk | 3.5 | 3.2 | 4.1 | 3.0 | 4.0 | NO (persona floor) |
| LivePortrait | 3.8 | 3.4 | N/A | 3.2 | N/A | NO (audio untested) |

---

## Primary Decision

**TECHNICAL PRIMARY: Ditto**
- Meets all hard floors
- 28.5 FPS sustainable
- Native streaming
- Native interrupt
- Strong identity stability

**FALLBACK: MuseTalk (component)**
- Exceptional lip quality
- Could augment as lip-sync module
- Separate integration path

**PRODUCTION AUTHORIZATION: Ditto**
- License: CLEAR
- Quality: acceptable for MVP
- Performance: adequate
- Architecture: straightforward

---

## Hardware Implication

Benchmark: RTX 3060 12GB

Ditto headroom: ~500MB VRAM
Observed FPS: 28.5 (headroom for optimization)

**NOT yet recommending production GPU tier.** Requires:
- Multi-session scaling analysis
- Long-session stress test
- Browser integration latency impact

---

## GO / NO-GO

**READY FOR RDH-004 (Browser MVP): YES**

Next phase: Browser integration + real-time WebRTC streaming
```

---

## P. CRITICAL REMINDERS DURING EXECUTION

```
[ ] NO MODIFICATIONS to frozen portrait
[ ] NO MODIFICATIONS to frozen audio
[ ] NO NEW BENCHMARK SPECIFICATIONS WRITTEN
[ ] NO PARAMETER TUNING BEYOND ONE DOCUMENTED FIX
[ ] SMOKE GATES MANDATORY (no skipping)
[ ] HUMAN REVIEW BLIND (don't show engine names)
[ ] METRICS FROM REAL RUNS ONLY
[ ] STOP AFTER BENCHMARK COMPLETE (no browser work yet)
[ ] REPORT USER-VISIBLE VIDEOS IMMEDIATELY
[ ] FINAL REPORT: SHORT (~50 lines), not documentation project
```

---

## Q. EXECUTION TIMELINE

```
0-2h:    Ditto smoke gates
2h:      User: First real Ditto video
2-5h:    Ditto full benchmark
5-8h:    MuseTalk smoke + full
8-11h:   LivePortrait smoke + full
11-12h:  Human blind review
12-13h:  Metrics consolidation
13-13.5h: Final report + videos
```

**Total: ~13.5 hours**

---

**STOP AFTER BENCHMARK.**

No browser integration code.  
No MM7 feature development.  
No product decisions beyond engine selection.  
Wait for user review of videos + report.

