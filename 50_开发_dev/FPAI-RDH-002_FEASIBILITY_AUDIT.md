# FPAI-RDH-002
# HARDWARE & ENGINE FEASIBILITY GATE
# 真人数字人硬件与引擎可行性闸门

**Date:** 2026-08-20  
**Status:** 🔍 HARDWARE AUDIT PHASE  
**Critical Blocker:** PyTorch not installed (must resolve first)

---

## A. HARDWARE INVENTORY (ACTUAL)

### GPU

```
Device ID: 00000000:01:00.0
Model: NVIDIA GeForce GT 730
Brand: GeForce
Architecture: Maxwell (5.2)
VRAM: 2048 MB (2.0 GB total)
Free VRAM (idle): 2008 MB

Driver Version: 456.71
CUDA Version: 11.1
Mode: WDDM (Windows Display Driver Model)
Current State: P8 (Low power) / 44°C
Fan: 32%
Clock (App): 901 MHz GPU / 2505 MHz Memory
```

### System

```
OS: Windows 11 Pro
Build: 10.0.22621
Platform: x86_64 (64-bit)

CPU: Intel Core i7 (6th Gen, Model 158)
  Stepping 9
  GenuineIntel
  
Python: 3.14.3 (latest)
  Location: C:\Python314\python.exe
```

### Installed Python Packages

```
✅ numpy 2.4.6
✅ PIL 12.2.0
❌ PyTorch (NOT INSTALLED) ⚠️ CRITICAL
❌ OpenCV
❌ scipy
❌ ffmpeg-python
```

---

## B. CRITICAL BLOCKER: PyTorch Installation

### Status: BLOCKED

**PyTorch not installed.** Cannot proceed with engine evaluation without it.

### Installation Plan

**Command:**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu111
```

**Expected:**
- PyTorch 2.0+ with CUDA 11.1 support
- Compute Capability 5.2 compatible ✅
- 500MB+ download

**Risk:** CUDA 11.1 is old (released 2020). Modern PyTorch may require CUDA 11.8+.

**Mitigation:** If installation fails, fallback to CPU-only mode (benchmarking will be slow but functional).

---

## C. HARDWARE TIER CLASSIFICATION

### Current Machine (GT 730)

| Attribute | Value | Verdict |
|-----------|-------|---------|
| **VRAM** | 2 GB | Very tight |
| **Compute Capability** | 5.2 (Maxwell) | Legacy |
| **CUDA Support** | 11.1 | Old but workable |
| **System RAM** | Unknown (assumed 8-16 GB) | Adequate for CPU ops |
| **GPU Memory BW** | ~29 GB/s (estimated) | Low |
| **TensorRT Support** | Ampere+ required | ❌ NOT SUPPORTED |

**Classification:** **TIER 0 (Legacy / Diagnostic)**

**Use Case:**
- Environment setup testing
- CPU-fallback validation
- API/browser integration
- Candidate engines: CPU-only proof-of-concept

**Not Suitable For:**
- Real-time production inference
- GPU-optimized engine benchmarking
- Multi-session deployment

---

## D. CANDIDATE ENGINE SHORTLIST

### Candidate A: Ditto (Ant Group)

**Repository:** [antgroup/ditto](https://github.com/antgroup/ditto)  
**Paper:** "Ditto: A Simple and Efficient Approach to Improve Sentence Embeddings"  
**Latest Update:** Check official repo (if active)  
**License:** TBD (need to verify)

**Status:** ⏳ PENDING INSTALLATION

---

### Candidate B: LivePortrait (with audio driver)

**Repository:** [KwaiViveportrait/LivePortrait](https://github.com/KwaiViveportrait/LivePortrait)  
**Purpose:** Real-time portrait animation via motion retargeting  
**Audio Integration:** Requires external audio-to-motion encoder  
**License:** Apache 2.0

**Status:** ⏳ PENDING INSTALLATION

---

### Candidate C: MuseTalk

**Repository:** [TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk)  
**Purpose:** Real-time lip synchronization renderer  
**Audio:** Direct audio-driven mouth sync  
**License:** Apache 2.0

**Status:** ⏳ PENDING INSTALLATION

---

## E. UNIFIED TEST ASSETS

### Character Master: FAMILI_RDH_REFERENCE_V0

**Required Specification (from visual-identity.yaml):**

```
✅ East Asian female, 30-35 appearance
✅ Black/dark brown long hair
✅ Clear, expressive eyes
✅ Soft oval face shape
✅ Neutral or gentle smile
✅ Shoulders or half-body framing
✅ Professional clothing (sweater/blazer)
✅ Clean, natural lighting
✅ No heavy filters or text
✅ Simple background
```

**Status:** 📋 AWAITING USER ASSET

**Placeholder:** Once received, save to `experiments/rdh/assets/famili_ref_v0.png`

### Test Audio Suite

**Standardized Chinese test set (to be recorded):**

```
TEST_A_STATEMENT.wav
  Duration: 5 seconds
  Content: 陈述句 (statement)
  Characteristics: Normal pace, clear enunciation

TEST_B_EXPLANATION.wav
  Duration: 15 seconds
  Content: 解释型语言 (educational explanation)
  Characteristics: Natural teaching tone

TEST_C_INTERRUPTED.wav
  Duration: 10 seconds, interrupted at 3s
  Content: 陈述被打断 (statement with interruption)
  Characteristics: Tests barge-in handling

TEST_D_FAST_SPEECH.wav
  Duration: 8 seconds
  Content: 快速语速 (faster paced)
  Characteristics: Tests mouth tracking at speed

TEST_E_LABIALS.wav
  Duration: 6 seconds
  Content: Heavy on b/p/m sounds
  Characteristics: 妈妈背背我 / 漂亮 / 皮皮虾
  Purpose: Tests lip sync on labial consonants

TEST_F_EMOTIONAL.wav
  Duration: 8 seconds
  Content: 温暖陈述 (warm, encouraging)
  Characteristics: Tests micro-expression compatibility
```

**Status:** 📋 TO BE RECORDED

---

## F. EVALUATION MATRIX SCHEMA

### Per-Engine Assessment (1-5 scale)

```
IDENTITY & APPEARANCE:
  Face Identity Consistency (across utterances)
  Eye Life (naturalness of gaze/movement)
  Mouth Naturalness (speech artifacts)
  Teeth Stability (no jittering/gaps)
  Head Motion (natural micro-movements)
  Education Persona Fit (intellectual warmth)
  Uncanny Factor (inverse: 5 = no uncanny feeling)

PERFORMANCE (Real-time):
  Model Load Time (sec)
  Peak VRAM Usage (MB)
  Avg VRAM Usage (MB)
  First-Frame Latency (ms)
  Steady-State FPS
  Audio/Video Sync Skew (ms)
  CPU Utilization (%)
  GPU Utilization (%)

FUNCTIONALITY:
  Lip Sync Accuracy (1-5)
  Expression Control (1-5)
  Gaze Controllability (1-5)
  Gesture/Head Motion (1-5)
  Streaming Support (1-5)
  Interrupt Handling (1-5)
  Chinese Audio Compatibility (1-5)

DEPLOYMENT:
  Windows Support (1-5)
  Installation Complexity (inverted: 5 = easy)
  TensorRT / ONNX (1-5)
  Browser Integration Path (1-5)
  Long-Session Stability (1-5)

LICENSING:
  Commercial Status (CLEAR / REVIEW / BLOCKED)
  Code License (Apache/MIT/etc)
  Model Weight License (proprietary/open)
  Training Data Caveat (none/restricted/unclear)
```

---

## G. BENCHMARK PLAN (Once PyTorch Installed)

### Phase 1: Environment Validation (Hours 0-1)

```python
# Verify CUDA/torch integration
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"Device: {torch.cuda.get_device_name(0)}")
print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9} GB")

# Stress test GPU memory
for size in [256, 512, 1024]:
    try:
        t = torch.randn(size, size, size, device='cuda')
        print(f"{size}^3 tensor: OK")
    except RuntimeError as e:
        print(f"{size}^3 tensor: FAILED - {e}")
        break
```

**Outcome:** Determine realistic VRAM headroom for models.

### Phase 2: Candidate A - Ditto (Hours 1-4)

1. **Installation**
   - Clone repo
   - Install dependencies
   - Verify imports

2. **Model Loading**
   - Load pretrained weights
   - Measure VRAM footprint
   - Measure load time

3. **Inference**
   - Input: FAMILI_RDH_REFERENCE_V0 + TEST_A_STATEMENT.wav
   - Output: Video file / frame sequence
   - Measure: FPS, latency, quality

4. **Quality Scoring** (human eyes)
   - Use evaluation matrix
   - Compare output across test audio suite
   - Identity stability check (rerun TEST_A multiple times)

5. **Early Stop Criteria**
   - If VRAM > 1.5 GB → LOG and CONTINUE (but note constraint)
   - If installation fails → SKIP to Candidate B
   - If first frame > 2s latency → LOG (feasibility concern)

### Phase 3: Candidate B - LivePortrait (Hours 4-7)

Same as Phase 2, but note:
- If standalone audio-driven not available, test with external audio encoder
- Measure combined pipeline latency

### Phase 4: Candidate C - MuseTalk (Hours 7-9)

Same as Phase 2, focused on lip-sync accuracy.

### Phase 5: Synthesis & Decision (Hours 9-10)

```
Fill evaluation matrix
Compare scores
Select PRIMARY engine
Select FALLBACK engine
Decide: Can proceed with RDH-MVP or hardware upgrade needed?
```

---

## H. HARDWARE TIER RECOMMENDATION (FUTURE)

**To be populated after candidate benchmarking.**

Current anticipation:

| Tier | GPU | VRAM | Use Case |
|------|-----|------|----------|
| **TIER 0** | GT 730 | 2GB | CPU fallback, testing only |
| **TIER 1** | RTX 3060 | 12GB | Minimum real-time (estimated) |
| **TIER 2** | RTX 3070 / 4070 | 8-12GB | Recommended development |
| **TIER 3** | RTX 3090 / 4090 | 24GB | Production + multi-session |

**Status:** 📋 TO BE REFINED AFTER BENCHMARKING

---

## I. MM2-MM6 REBINDING MAP (PRELIMINARY)

### MM2: Temporal Continuity

**Current:** rAF loop (60 FPS Canvas)  
**Target:** Engine frame callback (25-30 FPS video)

**Rebinding:** Replace `requestAnimationFrame()` with `engine.on_frame(callback)` or polling video frame queue.

**No schema change.**

### MM3: Performance Intent

**Current:** PerformanceFrame (expression, gaze, gesture, speech_activity)  
**Target:** Same schema, but routed through HumanAvatarAdapter

```typescript
interface HumanAvatarAdapter {
  translatePerformanceFrame(frame: PerformanceFrame): EngineInputParams
}
```

**Adapter responsibility:** Map semantic intent to engine-native parameters.

### MM4: Temporal Coherence

**Decision pending:** Interpolation at RenderOrchestrator level or engine level?

**Preliminary:** Engine interpolates (reduce latency, less CPU overhead).

### MM5: Speech Coordination

**Current:** VisemeScheduler → mouth_activity envelope → Canvas  
**Target:** If engine audio-native, bypass VisemeScheduler; else condition on capability.

```typescript
if (engine.capabilities.audio_driven_mouth) {
  // Engine handles audio directly
} else {
  // Use VisemeScheduler output
}
```

### MM6: Semantic Gaze

**Current:** GazeRuntime → pupil offset (x, y)  
**Target:** GazeRuntime → semantic gaze target → adapter → engine params

```typescript
// GazeRuntime still outputs semantic target
gaze_target: "USER" | "SOFT_DOWN_THINKING"

// Adapter translates to engine format
if (engine.capabilities.independent_gaze) {
  engine_params.eye_gaze = [compute_gaze_vector(target)]
} else {
  engine_params.head_pose = [approximate_via_head_rotation(target)]
}
```

---

## J. NEXT ACTIONS (Ordered)

### ⏹️ BLOCKER: Install PyTorch

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu111
```

**If successful:** Continue to Phase 1 validation.  
**If fails (CUDA 11.1 incompatible):** Install CPU-only torch, benchmark will be slow.

### 1️⃣ Environment Validation (1 hour)

```bash
python pytorch_check.py  # Verify GPU access and VRAM limits
```

### 2️⃣ Asset Preparation (parallel)

- Await Famili master portrait from user
- Record standardized test audio suite (6 clips)
- Save to `experiments/rdh/assets/`

### 3️⃣ Candidate A Evaluation (3 hours)

```bash
cd experiments/rdh/candidate-ditto/
python benchmark.py --portrait ../assets/famili_ref_v0.png \
                    --audio ../assets/test_suite/ \
                    --output ./results/
```

### 4️⃣ Candidate B & C Evaluation (parallel, 3-4 hours each)

### 5️⃣ Report Compilation (2 hours)

Generate `FPAI-RDH-002_FINAL_REPORT.md` with:
- Hardware verdict
- Candidate scores (matrix)
- Primary engine selection
- Target hardware recommendation
- MM2-MM6 rebinding specifics
- RDH-MVP go/no-go decision

---

## K. KNOWN CONSTRAINTS & GOTCHAS

### GPU Constraint: 2GB VRAM

- Modern LLMs: 7B+ models typically need 4-6 GB
- RDH portrait engines: typically 500MB-1.5GB (smaller than LLMs)
- Inference buffer overhead: +200-300MB for tensors
- **Estimated headroom: 300-500 MB** after engine + OS

**Implication:** Only lean models viable. Cannot run full-size foundation models alongside engine.

### CUDA 11.1 Age

- Released 2020
- PyTorch 2.0+ may not support it
- Fallback: CPU-only inference (5-10x slower)

### Maxwell Compute Capability 5.2

- Not supported by TensorRT (requires Ampere+)
- Supported by standard PyTorch inference ✅
- ONNX inference possible ✅

---

## L. BLOCKERS & EARLY STOPS

### STOP Conditions (will not proceed further)

1. **PyTorch installation fails AND CPU-only too slow** (< 5 FPS)
   → Verdict: HARDWARE INSUFFICIENT

2. **All three candidates VRAM > 1.5 GB**
   → Verdict: HARDWARE INSUFFICIENT

3. **First-frame latency > 1.5s on any candidate**
   → Verdict: FEASIBILITY QUESTIONABLE (continue but note)

4. **Identity drift visible after 3-5 utterances**
   → Verdict: Engine not suitable for Famili

5. **Audio/video sync skew > 200ms sustained**
   → Verdict: Lip sync unacceptable

---

## M. CURRENT STATUS

```
✅ Hardware inventory: COMPLETE
✅ PyTorch check: NOT INSTALLED ⚠️
⏳ Candidate installation: BLOCKED on PyTorch
⏳ Asset preparation: AWAITING USER PORTRAIT
⏳ Benchmarking: READY TO BEGIN
⏳ Final report: PENDING
```

---

## N. DECISION TREE

```
START
  ↓
Install PyTorch?
  ├─ YES (works)
  │   ↓
  │   Validate GPU access
  │   ├─ YES
  │   │   ↓
  │   │   Benchmark Candidates A, B, C
  │   │   ├─ All viable (FPS ≥ 25, VRAM < 1.5GB)
  │   │   │   → PRIMARY ENGINE SELECTED ✅
  │   │   │
  │   │   ├─ One viable
  │   │   │   → USE PRIMARY, others fallback ⚠️
  │   │   │
  │   │   └─ None viable
  │   │       → Recommend TIER 1 GPU upgrade ❌
  │   │
  │   └─ NO (device not detected)
  │       → GPU not accessible, CPU-only
  │       → Run CPU benchmarks (slow)
  │       → If all < 5 FPS → hardware insufficient
  │
  └─ NO (install fails)
      └─ Try CPU-only
          → If too slow → hardware insufficient
```

---

## O. DELIVERABLE

**Target:** `FPAI-RDH-002_FINAL_REPORT.md`

**Contents:**
1. Hardware audit (actual vs. tier classification)
2. Candidate evaluation matrix (scores + rationale)
3. Quality samples (screenshot/video examples per candidate)
4. Performance metrics (FPS, latency, VRAM)
5. Primary engine decision + reasoning
6. Target hardware tiers (minimum, recommended, production)
7. MM2-MM6 rebinding details
8. Go/No-Go for RDH-MVP
9. Next steps

---

## ⏹️ DO NOT PROCEED WITHOUT THIS REPORT

**MM7 is blocked.** No product integration until hardware + engine feasibility confirmed.

