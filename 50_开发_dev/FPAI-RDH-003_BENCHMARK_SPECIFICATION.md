# FPAI-RDH-003
# CONTROLLED GPU ENGINE BENCHMARK
# 法咪莉真人数字人统一 GPU 实测

**Date:** 2026-08-20  
**Status:** 📋 BENCHMARK SPECIFICATION (ready to execute on GPU node)  
**Execution Environment:** Remote GPU node (not GT 730)

---

## ARCHITECTURE: RDH INFERENCE NODE

### Conceptual Decoupling

```
Development Host (GT 730 — TIER 0):
├─ VS Code
├─ Browser
├─ Family monorepo
├─ WebSocket
├─ API development
├─ CPU-side tests
└─ Contracts

    ↓ Network / IPC

RDH Inference Node (Modern GPU — TIER 1+):
├─ Source identity
├─ Audio input
├─ Performance controls
├─ Neural digital human engine
└─ Output: video frames / stream
```

**Not bound to:** Any specific machine, cloud API, or avatar SaaS.  
**Constraint:** Self-hostable (LAN, local workstation, private GPU node acceptable).

---

## A. BENCHMARK ENVIRONMENT SPECIFICATION

### Required

```
GPU:                   Modern NVIDIA (RTX 3060+ or equivalent)
VRAM:                  >= 12 GB
Driver:                Latest (2024+)
CUDA:                  11.8 or 12.x
TensorRT:              Compatible with GPU arch
Python:                3.10+
PyTorch:               2.0+
FFmpeg:                4.x+
OS:                    Linux preferred (Ubuntu 20.04+), Windows 22H2 acceptable
```

### To Record

```
GPU Model:             [exact]
GPU Compute Cap:       [e.g., 8.6 for RTX 3060]
VRAM:                  [exact GB]
Driver Version:        [exact]
CUDA Version:          [exact]
PyTorch Version:       [exact]
TensorRT Version:      [if applicable]
CPU:                   [model, cores]
System RAM:            [total GB]
OS:                    [distro, build]
FFmpeg:                [version]
Python:                [version]
```

---

## B. BENCHMARK IDENTITY

### FAMILI_RDH_BENCHMARK_REFERENCE_V0

**Source:** User-provided visual direction (榜样科技校长真人参考)

**Specification:**
```
Subject:               Adult Chinese female
Hair:                  Black/dark brown, long (mid-back), natural texture
Hair coverage:         Not occluding face / eyes
Expression:            Neutral or gentle smile
Eyes:                  Clear, open, intelligent
Framing:               Head + shoulders / half-body
Pose:                  Front-facing or slight 3/4
Lighting:              Clean, even, natural
Background:            Simple / plain / transparent
Clothing:              Professional but approachable (sweater/blazer preferred)
Skin tone:             Natural warm undertone
Texture:               Realistic, subtle variation
Resolution:            ≥ 512×512
Format:                PNG or JPEG
Artifacts:             No text, no watermarks, no heavy filters
```

**Status:** 📸 AWAITING USER ASSET

**NOT:** Final production master (v1.0). This is benchmark asset only.  
**Use:** All three candidates benchmark against same source.

**Path:** `experiments/rdh-benchmark/assets/famili-reference-v0/portrait.png`

---

## C. UNIFIED AUDIO SUITE: RDH_AUDIO_BENCHMARK_V1

**Generated:** One-time TTS generation (Family existing TTS).  
**Format:** 16kHz, mono, WAV.  
**All engines use identical WAV files.**

### A01_NORMAL_5S.wav (Normal statement, 5s)

```
Text: "你好，我是法咪莉。今天我们一起看看，最近这个家庭发生了哪些值得关注的变化。"
Pace: Normal conversational
Tone: Warm, accessible
```

**Test Focus:** Baseline mouth sync, eye stability

---

### A02_EXPLAIN_15S.wav (Educational explanation, 15s)

```
Text: "孩子今天的表现并不一定说明他不愿意努力。很多时候，我们需要先理解行为背后的情绪、动力和家庭互动，再决定下一步怎么帮助他。"
Pace: Deliberate, thoughtful
Tone: Wise, patient, professional
```

**Test Focus:** Long utterance stability, head motion, eye shifts

---

### A03_PAUSE.wav (Natural pause, 6s)

```
Text: "这件事……我们先不用急着下结论。可以先听听孩子自己怎么想。"
Features: Ellipsis pause (～1s silence), then continuation
Pace: Contemplative
```

**Test Focus:** Motion during silence, mouth closure, breath simulation

---

### A04_FAST.wav (Faster paced, 8s)

```
Text: [Fast recap of A02 content, ~1.5x normal speed]
Pace: 1.5x normal
Tone: Energetic but not anxious
```

**Test Focus:** Mouth tracking at higher speed, potential artifacts

---

### A05_BPM.wav (Bilabial consonants, 6s)

```
Text: "爸爸妈妈，我们一起陪伴孩子。这个变化很明白，慢慢改变。"
Keywords: 爸 / 妈 / 陪伴 / 明白 / 慢慢 / 改变
Features: Heavy on b/p/m sounds
```

**Test Focus:** Lip sync accuracy on labial sounds, teeth visibility/artifacts

---

### A06_INTERRUPT.wav (15-20s with interrupt event, 20s)

```
Text: "如果我们能够认识到，每个孩子的成长节奏都是不同的，我们就能更好地……"
Instruction: Engine starts, at ~4 seconds, issue INTERRUPT signal
Expected: Audio stops, video motion stops, clean state ready for next utterance
```

**Test Focus:**
- Interrupt-to-audio-stop latency
- Interrupt-to-video-stop latency
- Queued motion leakage
- Frame consistency after interrupt
- Identity preservation on next utterance

---

**Audio Suite Location:** `experiments/rdh-benchmark/assets/audio-v1/`

**Format:**
```
A01_NORMAL_5S.wav
A02_EXPLAIN_15S.wav
A03_PAUSE.wav
A04_FAST.wav
A05_BPM.wav
A06_INTERRUPT.wav
```

---

## D. UNIFIED ENGINE ADAPTER

### RDHEngineAdapter (Experimentation Layer)

```typescript
interface RDHEngineAdapter {
  // Identity
  prepareIdentity(portraitPath: string): Promise<void>
  
  // Audio stream
  startUtterance(turnId: string): Promise<void>
  pushAudioChunk(chunk: AudioBuffer, timestamp: number): Promise<void>
  submitAudioComplete(): Promise<void>
  
  // Control
  setPerformance(frame: PerformanceFrame): void
  interrupt(): Promise<void>
  
  // Output
  getFrames(count: number): Frame[]
  getStream(): AsyncIterable<Frame>  // if streaming capable
  
  // Metrics
  getMetrics(): BenchmarkMetrics
  
  // Capabilities
  getCapabilities(): EngineCapabilities
}

interface EngineCapabilities {
  streaming: boolean              // chunks in, frames out
  streaming_latency_ms?: number  // delay from chunk to frame
  gaze_control: boolean
  expression_control: boolean
  head_control: boolean
  interrupt: boolean
  incremental_audio: boolean     // vs. batch only
}

interface BenchmarkMetrics {
  model_load_seconds: number
  peak_vram_mb: number
  idle_vram_mb: number
  first_frame_ms: number
  average_fps: number
  p95_frame_ms: number
  audio_video_skew_ms: number    // -50ms = video ahead, +50ms = video late
  cpu_percent: number
  gpu_percent: number
  system_ram_mb: number
}
```

---

## E. SMOKE GATE SEQUENCE (Per Engine)

### Gate 1: INSTALL

**Command:**
```bash
cd experiments/rdh-benchmark/candidate-{engine}/
python -m pip install -r requirements.txt
```

**Verdict:** SUCCESS / FAILURE  
**Early Stop Criteria:**
- Dependency conflict with system Python
- Unresolvable GPU library version mismatch
- Weights download 404 / corrupted

---

### Gate 2: MODEL LOAD

```python
engine = load_engine(device='cuda:0')
print(f"Model loaded: {engine}")
print(f"VRAM: {get_vram_usage()} MB")
```

**Verdict:** SUCCESS / FAILURE  
**Early Stop Criteria:**
- VRAM exceeded (> available - 500MB)
- OOM error even with empty system
- Model not compatible with GPU compute capability

---

### Gate 3: ONE IMAGE + ONE AUDIO → OUTPUT

```python
engine.prepareIdentity('assets/famili-reference-v0/portrait.png')
engine.startUtterance('test-001')
engine.pushAudioChunk(a01_audio, 0)
engine.submitAudioComplete()
frames = engine.getFrames(150)  # 150 frames at 25 FPS = 6 seconds
print(f"Output frames: {len(frames)}")
```

**Verdict:** SUCCESS / FAILURE  
**Early Stop Criteria:**
- No frames produced
- Frame dimensions wrong (not square/16:9 as expected)
- Frames all black / invalid data
- Runtime crash

---

### Gate 4: IDENTITY ACCEPTABLE

Human inspection:
```
[ ] Face is recognizable as same person across frames
[ ] Not a random face or default avatar
[ ] Hair / eyes / overall appearance consistent
[ ] No frame 1 vs frame 150 face swap
```

**Verdict:** YES / REJECT  
**Early Stop Criteria:**
- Identity drifts > 20% between first and last frame
- Face becomes unrecognizable
- Switches to different person mid-utterance

**If REJECT:** Stop this candidate, log reason.

---

## F. FULL BENCHMARK EXECUTION (If All Gates Pass)

### Phase 1: Streaming Capability Test

**Test Question:** Can engine ingest audio incrementally?

```python
engine.prepareIdentity(...)
engine.startUtterance('streaming-test')

# Simulate real-time audio chunks (100ms each)
for chunk in audio_chunks_100ms:
    engine.pushAudioChunk(chunk, timestamp)
    frames = engine.getFrames(available_count)
    # Write frames to output buffer
    
engine.submitAudioComplete()
```

**Classification:**
- **STREAMING_NATIVE:** Frames produced while audio still streaming
- **STREAMING_ADAPTABLE:** Requires full audio, but can be adapted for incremental
- **OFFLINE_ONLY:** Requires complete WAV before processing

---

### Phase 2: All Six Audio Tests

Run A01 through A06 with identical recording setup:
```
Record FPS
Record VRAM (peak, idle)
Record first frame timestamp
Record A/V sync drift
Record CPU usage
Record GPU usage
Capture output video
```

---

### Phase 3: Interrupt Test (A06 specific)

```
startUtterance('interrupt-test')
pushAudioChunk(A06_first_4s, ...)
# At 4 seconds:
interrupt()
# Measure:
AUDIO_STOP_LATENCY = time_audio_stopped - interrupt_call
VIDEO_STOP_LATENCY = time_last_motion_frame - interrupt_call
# Reset and start next utterance
startUtterance('post-interrupt-test')
pushAudioChunk(A01, ...)
# Check for queued frames leaking into new utterance
```

---

### Phase 4: 60-Second Continuous Stability

Concatenate 4 × 15s audio (A02) → 60-second continuous generation.

**Measurements:**
- Identity drift (first frame vs. last frame landmark distance)
- Teeth artifacts accumulation
- Eye glitch count
- FPS stability (variance)

**Threshold:** No catastrophic drift, < 10 minor artifacts

---

## G. HUMAN QUALITY SCORING

### Per-Output Evaluation (1-5 scale)

**Evaluate each of 6 audio tests independently.**

```
IDENTITY_CONSISTENCY          1-5   (Same person throughout entire video)
EYE_LIFE                      1-5   (Eyes look alive, not dead/glassy)
MOUTH_NATURALNESS             1-5   (Mouth shape matches expected phonemes)
TEETH_STABILITY               1-5   (No jittering, no gaps, no sudden flashes)
HEAD_MOTION_RESTRAINT         1-5   (Natural micro-movements, not excessive)
SKIN_FACE_STABILITY           1-5   (No jitter, no sudden warping)
EDUCATION_PERSONA_FIT         1-5   (Conveys wisdom, warmth, professionalism)
OVERALL_HUMAN_PRESENCE        1-5   (Feels like real person, not artificial)

UNCANNY_SEVERITY              1-5   (1 = very uncanny, 5 = no uncanny feeling)
```

**Aggregation:**
```
QUALITY_SCORE = (
  identity + eye_life + mouth_natural + teeth_stable + head_motion +
  skin_stability + persona_fit + human_presence
) / 8
```

**Per-Engine Final:**
```
A01_QUALITY_SCORE = avg(QUALITY_SCORE per A01 scoring)
A02_QUALITY_SCORE = avg(...)
A03_QUALITY_SCORE = avg(...)
A04_QUALITY_SCORE = avg(...)
A05_QUALITY_SCORE = avg(...)
A06_QUALITY_SCORE = avg(...)

OVERALL_QUALITY = avg(A01-A06)
```

---

## H. HARD PERFORMANCE METRICS (Real-Time Recording)

```
MODEL_LOAD_SECONDS        [time from import to first frame output]
PEAK_VRAM_MB              [max VRAM used during session]
IDLE_VRAM_MB              [VRAM after cleanup, before next test]
FIRST_FRAME_MS            [time from audio start to frame 1 visible]
AVERAGE_FPS               [frames_produced / duration]
P95_FRAME_MS              [95th percentile frame render time]
AUDIO_VIDEO_SKEW_MS       [average offset: + = video late, - = video early]
CPU_PERCENT               [peak utilization]
GPU_PERCENT               [peak utilization]
RAM_MB                    [system RAM used, not VRAM]
TOTAL_GENERATION_TIME_10S [wall-clock for 10s output]
STABLE_60S                [true/false if 60s continuous without crash]
```

---

## I. CAPABILITY MATRIX

### Per Engine: MM2-MM6 Integration

```
MM2_TEMPORAL:
  ├─ rAF-style frame loop?          [YES/NO]
  └─ Recommended rebind:             [option A/B/C]

MM3_PERFORMANCE_FRAME:
  ├─ expression param?               [native/adapter/unsupported]
  ├─ gaze param?                     [native/adapter/unsupported]
  ├─ gesture param?                  [native/adapter/unsupported]
  └─ speech_activity param?          [native/adapter/unsupported]

MM4_COHERENCE:
  ├─ Has internal interpolation?     [YES/NO]
  ├─ Interpolation time constant?    [if yes: ms]
  └─ Can disable?                    [YES/NO]

MM5_SPEECH:
  ├─ Async audio chunks?             [YES/NO]
  ├─ Viseme output?                  [YES/NO]
  ├─ Playback lifecycle API?         [YES/NO]
  └─ Interrupt support?              [native/adaptable/not supported]

MM6_GAZE:
  ├─ Gaze control?                   [YES/NO]
  ├─ Head pose control?              [YES/NO]
  ├─ Eye-independent gaze?           [YES/NO]
  └─ Semantic target support?        [native/map required/not supported]
```

---

## J. LICENSE GATE

### Per Engine Checklist

```
[ ] Repository License               [Apache/MIT/CC0/proprietary/unclear]
[ ] Model Weights License            [same]
[ ] Third-party Models License       [face detector / encoder / etc]
[ ] Training Data Source             [public / proprietary / unknown]
[ ] Commercial Deployment Allowed?   [YES / RESTRICTED / NO / UNCLEAR]
[ ] Attribution Required?            [YES/NO]
[ ] Academic Use Only?               [YES/NO]
[ ] Internal Review Needed?          [YES/NO]
```

**Hard Veto Conditions:**
- Commercial deployment explicitly prohibited
- Training data from non-consensual face dataset
- GPL/AGPL + proprietary model incompatibility

---

## K. OUTPUT DIRECTORY STRUCTURE

```
experiments/rdh-benchmark/
├─ assets/
│  ├─ famili-reference-v0/
│  │  └─ portrait.png
│  └─ audio-v1/
│     ├─ A01_NORMAL_5S.wav
│     ├─ A02_EXPLAIN_15S.wav
│     ├─ A03_PAUSE.wav
│     ├─ A04_FAST.wav
│     ├─ A05_BPM.wav
│     └─ A06_INTERRUPT.wav
│
├─ ditto/
│  ├─ requirements.txt
│  ├─ benchmark.py
│  ├─ adapter.py
│  └─ outputs/
│     ├─ a01.mp4
│     ├─ a02.mp4
│     ├─ a03.mp4
│     ├─ a04.mp4
│     ├─ a05.mp4
│     ├─ a06.mp4
│     └─ metrics.json
│
├─ liveportrait/
│  ├─ requirements.txt
│  ├─ benchmark.py
│  ├─ adapter.py
│  └─ outputs/
│     ├─ a01.mp4
│     ├─ a02.mp4
│     ├─ ...
│     └─ metrics.json
│
├─ musetalk/
│  ├─ requirements.txt
│  ├─ benchmark.py
│  ├─ adapter.py
│  └─ outputs/
│     ├─ a01.mp4
│     ├─ a02.mp4
│     ├─ ...
│     └─ metrics.json
│
├─ metrics/
│  ├─ quality_scores.yaml
│  ├─ performance_metrics.yaml
│  └─ capability_matrix.yaml
│
├─ reports/
│  ├─ summary.md
│  └─ FPAI-RDH-003_BENCHMARK_REPORT.md
│
└─ .gitignore
   [models/, *.pt, *.pth, checkpoints/, large_videos/]
```

---

## L. PRODUCT PASS THRESHOLD

### Minimum Qualification for RDH-MVP Candidate

**Quality Scores:**
```
Identity consistency        ≥ 4/5
Eye life                    ≥ 3.5/5
Mouth naturalness           ≥ 3.5/5
Teeth stability             ≥ 3.5/5
Education persona fit       ≥ 4/5

OVERALL_QUALITY            ≥ 3.7/5 average
```

**Performance:**
```
FPS                        ≥ 25  (or clear real-time streaming path)
First-frame latency        ≤ 500ms (preferred < 300ms)
Audio/video skew           ≤ 80ms (preferred < 50ms)
Stable 60s continuous      YES
```

**Functionality:**
```
Streaming                  STREAMING_NATIVE or STREAMING_ADAPTABLE
Interrupt                  Native or clear implementation path
```

**License:**
```
Commercial               CLEAR (no review required)
```

**If ANY threshold not met:**
- ❌ Engine does NOT proceed to RDH-MVP
- ⚠️ Only exception: one (1) minor gap with clear mitigation path

---

## M. ENGINE DECISION MATRIX

### Final Selection Logic

```
                 QUALITY  FPS  STREAM  INTERRUPT  LICENSE  →  VERDICT
Ditto            4.2     30    native   native    CLEAR   →  PRIMARY ✅
MuseTalk         3.5     28    offline  adapter   CLEAR   →  LIP-SYNC BASELINE ⚠️
LivePortrait     3.1     25    native   unclear   REVIEW  →  REFERENCE ONLY ❌
```

**Primary:** Highest overall score that meets all thresholds.  
**Fallback:** Second candidate if primary fails mid-development.  
**Baseline:** Third option for specific capability (e.g., lip-sync comparison).

---

## N. MM2-MM6 REBINDING (Per Primary)

### Example: If Ditto Selected

```
MM2 → ditto frame loop
      (no change to contract)

MM3 → HumanAvatarAdapter
      expression → ditto_expression param (native)
      gaze → ditto_head_yaw / head_pitch (map required)
      gesture → unsupported (capability = false)
      speech_activity → ditto_audio_mode (native)

MM4 → Ditto internal interpolation (tau ≈ 100ms)
      RenderOrchestrator.tick() becomes advisory (no-op for video path)

MM5 → Ditto streaming audio
      VisemeScheduler → DIAGNOSTIC (not production)
      StreamingAudioPlayer → wired directly to ditto.pushAudioChunk()

MM6 → GazeRuntime semantic target → adapter → ditto head pose
      No independent eye gaze; approximate via head rotation
```

---

## O. HARDWARE TIERS (Post-Benchmark)

**Based on:** Primary engine real performance.

Example (if RTX 3060 used for benchmark):
```
MINIMUM DEV:       RTX 3060 12GB
                   Reason: Minimal headroom, 25-30 FPS, not for production use

RECOMMENDED DEV:   RTX 3070 8GB or RTX 3070 Ti 8GB
                   Reason: 40+ FPS, room for optimization, development cache

PRODUCTION (1):    RTX 4070 12GB
                   Reason: Sustained 60+ FPS, long session stability, some headroom

PRODUCTION (N):    RTX 3090 24GB or A100
                   Reason: Multi-session, larger queuing, no interference
```

(Exact tiers determined after real benchmark data)

---

## P. GO / NO-GO DECISION

### If PRIMARY Engine Qualifies ✅

```
READY FOR RDH-MVP: YES

Next phase:
  FPAI-RDH-004
  REAL FAMILI BROWSER MVP

Do NOT start MM7.
Do NOT continue Canvas-based development.
Do NOT proceed without explicit approval.
```

### If NO Candidate Qualifies ❌

```
READY FOR RDH-MVP: NO

Decision Point:

Option A:
  Acquire higher-tier GPU
  Re-benchmark with more VRAM
  Expect higher FPS / better quality

Option B:
  Wait for new engine release
  Re-evaluate in 2-4 weeks

Option C:
  Research alternative engine categories
  (e.g., proprietary API if local solution fails)

But:
  Do NOT compromise on product thresholds
  Do NOT force "barely qualified" into production
  Do NOT start MM7 with uncertain foundation
```

---

## Q. EXECUTION READINESS

### Prerequisites

- [ ] GPU node provisioned (RTX 3060+ minimum)
- [ ] FAMILI_RDH_BENCHMARK_REFERENCE_V0 asset provided by user
- [ ] RDH_AUDIO_BENCHMARK_V1 suite TTS-generated
- [ ] Candidates A, B, C repos cloned and smoke gates drafted
- [ ] Benchmark directory structure created
- [ ] Human quality scorer (eyes + evaluation form)
- [ ] Metrics recording setup (GPU monitoring tools)

### Estimated Duration

```
Setup:                    2 hours
Ditto benchmark:          4 hours (1h gate + 3h full benchmark)
MuseTalk benchmark:       3 hours
LivePortrait benchmark:   3 hours
Quality scoring:          2 hours
Metrics compilation:      1 hour
Report generation:        2 hours

TOTAL:                    ~17 hours
                          (1.5 days if 10-12h work day)
```

---

## R. COMMUNICATION GATE

**When complete, report:**

```
FPAI-RDH-003
CONTROLLED GPU ENGINE BENCHMARK REPORT

PRIMARY ENGINE:            [Ditto / MuseTalk / LivePortrait / NONE]
FALLBACK ENGINE:           [backup]
LIP-SYNC BASELINE:         [MuseTalk or other]

QUALITY AVERAGE:           [X.X / 5.0]
FPS:                       [XX fps]
LATENCY:                   [XXX ms]

READY FOR MVP:             YES / NO

If YES → Proceed to FPAI-RDH-004
If NO → [Decision Point A/B/C]
```

---

## FINAL STATUS

⏹️ **SPECIFICATION COMPLETE**

Ready to execute on GPU node.

**NOT YET:**
- No engines installed
- No benchmarks run
- No products selected

**AWAITING:**
- GPU access (not GT 730)
- User portrait asset (FAMILI_RDH_BENCHMARK_REFERENCE_V0)
- Audio suite generation

**DO NOT:**
- Modify GT 730 environment further
- Start MM7
- Integrate browser before benchmark complete

