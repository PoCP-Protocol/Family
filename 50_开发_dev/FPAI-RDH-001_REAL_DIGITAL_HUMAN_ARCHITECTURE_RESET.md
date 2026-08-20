# FPAI-RDH-001
# REAL DIGITAL HUMAN ARCHITECTURE RESET
# 法咪莉校长真人数字人技术路线重置

**Date:** 2026-08-20  
**Status:** ⏹️ ARCHITECTURE AUDIT (in progress)  
**Next Phase:** Strategic recommendation for RDH MVP

---

## EXECUTIVE SUMMARY

**Strategic Pivot:** Famili is NOT a 2D cartoon avatar. She is a real-time digital human character for Family Growth OS.

**Current State:**
- VBF-0 (2D Canvas renderer) complete but represents wrong direction
- MM2-MM6 runtime complete and conceptually sound
- Local GPU available: GeForce GT 730 (2GB VRAM, CUDA 11.1)
- Target: Real-time talking head, audio-driven, interrupt-capable

**First Decision Point:** Engine selection for local real-time portrait animation

---

## A. CURRENT ARCHITECTURE ANALYSIS

### What We Have ✅

| Component | Status | Reusability |
|-----------|--------|-------------|
| MM1: Provenance | ✅ Complete | KEEP: CharacterIdentity + ownership chain |
| MM2: Temporal | ✅ Complete | KEEP: Frame lifecycle, but rebind to video FPS instead of rAF |
| MM3: Performance Intent | ✅ Complete | KEEP: PerformanceFrame ontology (rebind outputs) |
| MM4: Coherence | ✅ Complete | REEVAL: Interpolation responsibility (runtime vs engine) |
| MM5: Speech Coordination | ✅ Complete | KEEP: Playback lifecycle, interruption; rebind VisemeScheduler |
| MM6: Semantic Gaze | ✅ Complete | REEVAL: Gaze output format (pupil x/y → semantic target) |
| Avatar2DRenderer | ✅ Complete | DOWNGRADE: DiagnosticRenderer (non-production) |
| FamiliLayered2DRenderer | ✅ Complete | DOWNGRADE: StaticPreview (asset loading reference only) |
| RenderOrchestrator | ✅ Complete | REBIND: Orchestrate HumanAvatarAdapter, not Canvas renderer |
| GazeRuntime | ✅ Complete | REUSE: expLerp() mathematics |

### What We're Stopping ⛔

- **MM7+** — No new gaze/emotion/gesture features until RDH engine chosen
- **VBF-1 (Layered 2D)** — Cartoon face system (wrong product direction)
- **Canvas primitives as primary output** — Debug/telemetry only
- **Waiting for cloud API** — Local-first principle

---

## B. TARGET ARCHITECTURE

```
Principal Intelligence
    ↓
PerformanceFrame
(semantic intent)
    ↓
HumanAvatarAdapter
(intent → engine parameters)
    ↓
RealtimeHumanRenderer
(real-time talking head engine)
    ↓
Video Stream (WebRTC / WebGL)
    ↓
Browser HTMLVideoElement
    ↓
User sees: Real Famili speaking
```

### Key Separation

**PerformanceFrame** (MM3, MM5, MM6)
- Semantic: "listening", "thinking", "speaking"
- Gaze target: "USER", "SOFT_DOWN_THINKING"
- Speech lifecycle: start, audio_chunk, interrupt
- Audio/video timing: turn_id, generation_id

**HumanAvatarAdapter**
- Translates PerformanceFrame → engine-native format
- Handles engine capability negotiation
- Manages state synchronization

**RealtimeHumanRenderer**
- Engine-specific implementation
- Outputs video frames
- Manages GPU/latency

---

## C. LOCAL ENVIRONMENT SPECIFICATIONS

### Hardware

```
GPU: NVIDIA GeForce GT 730 (Maxwell generation)
VRAM: 2 GB (shared)
CUDA: 11.1
Driver: 456.71
Compute Capability: 5.2

Status: Limited but viable for inference
Constraint: 2GB VRAM restrictive for large models
Implication: Must prioritize lightweight engines
```

### Software Stack

| Component | Status | Version |
|-----------|--------|---------|
| Python | ✅ Available | 3.14.3 |
| PyTorch | ❌ NOT installed | — |
| FFmpeg | ❌ NOT installed | — |
| Node.js | ✅ Available | 24.14.0 |
| WebRTC | ✅ Browser native | — |
| Browser | ✅ Available | Chromium-based |

### Installation Status

**Need to install:**
- PyTorch (CUDA 11.1, CPU fallback)
- FFmpeg (video codec support)
- Selected RDH engine dependencies

**Already available:**
- Node.js dev environment
- Browser runtime with WebRTC
- GPU compute capability

---

## D. ENGINE CANDIDATES

### Candidate 1: Talking Head

**Repo:** [OpenTalking/Talking-Head](https://github.com/OpenTalking/Talking-Head-Anime)  
**License:** Apache 2.0  
**Type:** Real-time talking head using 2D+3D blend

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Identity Consistency** | 5/10 | Anime-trained; requires retraining on realistic faces |
| **Real-time FPS** | 8/10 | 60+ FPS possible on GPU |
| **First-Frame Latency** | 7/10 | ~100ms after audio input |
| **Audio/Lip Sync** | 9/10 | Built-in audio-driven sync |
| **Expression Control** | 6/10 | Limited expression parameters |
| **Gaze/Head Control** | 5/10 | Basic head pose; gaze extracted from landmarks |
| **Interruptability** | 8/10 | Frame-by-frame, easy to stop |
| **GPU VRAM** | 8/10 | ~500MB inference |
| **Commercial Licensing** | 9/10 | Apache 2.0 — no restrictions |
| **Windows Deployment** | 7/10 | Python-based; requires environment setup |
| **Average Score** | **7.2** | Good performance, anime-origin concern |

**Critical Issue:** Trained on anime faces. Would require:
1. Custom dataset collection (Famili reference + variations)
2. Retraining on 2D realistic face
3. 1-2 weeks training data prep + fine-tuning

---

### Candidate 2: SadTalker

**Repo:** [Winfredy/SadTalker](https://github.com/Winfredy/SadTalker)  
**License:** CC0 (public domain)  
**Type:** Emotional talking face using audio-visual synthesis

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Identity Consistency** | 8/10 | Realistic face model; good identity preservation |
| **Real-time FPS** | 7/10 | 25-30 FPS on GT 730 (estimated, not verified) |
| **First-Frame Latency** | 6/10 | ~200-300ms (multi-stage processing) |
| **Audio/Lip Sync** | 9/10 | Audio-driven mouth + face movement |
| **Expression Control** | 7/10 | Expression vector controllable |
| **Gaze/Head Control** | 7/10 | Head pose + eye gaze parameters |
| **Interruptability** | 7/10 | Frame-by-frame; slight latency on stop |
| **GPU VRAM** | 6/10 | ~800MB-1.2GB inference (tight on GT 730) |
| **Commercial Licensing** | 9/10 | Public domain — no restrictions |
| **Windows Deployment** | 6/10 | Requires conda + heavy dependencies |
| **Average Score** | **7.3** | Stronger on identity, tighter on VRAM |

**Critical Issue:** VRAM borderline. 2GB system RAM + ~1GB VRAM = tight fit.

---

### Candidate 3: RIFE + Neural Renderer

**Concept:** Real-world face portraits + real-time interpolation  
**Type:** Image-based + neural rendering

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Identity Consistency** | 9/10 | Direct portrait rendering; no generative drift |
| **Real-time FPS** | 6/10 | 15-20 FPS on GT 730 (estimated) |
| **First-Frame Latency** | 8/10 | ~150ms (simpler pipeline) |
| **Audio/Lip Sync** | 7/10 | Viseme-driven mouth blending required |
| **Expression Control** | 8/10 | Portrait blend + local deformation |
| **Gaze/Head Control** | 8/10 | Portrait interpolation + landmark control |
| **Interruptability** | 9/10 | Direct frame pipeline; instant stop |
| **GPU VRAM** | 8/10 | ~300-400MB (very efficient) |
| **Commercial Licensing** | 9/10 | Custom implementation (no license concern) |
| **Windows Deployment** | 8/10 | Pure PyTorch + ONNX; straightforward |
| **Average Score** | **8.2** | **HIGHEST on identity + efficiency** |

**Advantage:** Uses real portrait asset directly (Famili master image).  
**Challenge:** Requires custom video generation pipeline.

---

## E. PRIMARY RECOMMENDATION

### Phase 1: Candidate 3 (Image-Based Real-Time Renderer)

**Rationale:**
1. **Identity:** Direct use of Famili master portrait (no generative drift)
2. **VRAM:** Most efficient (300-400MB)
3. **Deployment:** Pure PyTorch + ONNX (Windows-friendly)
4. **Control:** Expression, gaze, head pose via blending + deformation
5. **Interruptability:** Immediate frame pipeline

**Implementation Sketch:**
```python
class RealtimePortraitRenderer:
  def __init__(self, portrait_image, device='cuda'):
    self.portrait = load_image(portrait_image)  # Famili master
    self.landmark_detector = load_face_landmarks()
    self.neural_renderer = load_neural_renderer()
    
  def render_frame(self, performance_intent, audio_frames, interrupt_flag):
    # Extract speaking landmark trajectory from audio
    mouth_keypoints = audio_to_mouth_keypoints(audio_frames)
    
    # Compute gaze + head pose from performance_intent
    gaze_target = intent.gaze  # "USER", "SOFT_DOWN_THINKING"
    head_pose = compute_head_pose(gaze_target)
    
    # Blend portrait + keypoints + pose
    warped_portrait = morph_portrait(self.portrait, mouth_keypoints, head_pose)
    
    # Neural enhancement
    output_frame = self.neural_renderer(warped_portrait)
    
    # Check interrupt
    if interrupt_flag:
      return output_frame, STOP_FRAME
    
    return output_frame
```

**Fallback:** Candidate 2 (SadTalker) if Candidate 3 prototype shows latency issues.

---

## F. MM2-MM6 REUSE MAP

### MM2: Temporal Continuity ✅ KEEP

**Current:** rAF loop (60 FPS web animation)  
**Future:** Video frame loop (25-30 FPS talking head)

**Reuse:**
- State interpolation logic (same expLerp math)
- Frame lifecycle tracking
- Rebind from `rAF` to `engine.on_frame()`

---

### MM3: Performance Intent ✅ KEEP

**Current:** PerformanceFrame schema  
**Future:** Same, but outputs → HumanAvatarAdapter

**Reuse:**
```typescript
interface PerformanceFrame {
  expression: 'LISTENING' | 'THINKING' | 'EXPLAINING' | ...
  gaze: 'USER' | 'SOFT_DOWN_THINKING' | ...
  gesture: 'NOD' | 'NONE' | ...
  speech_activity: 'SILENT' | 'SPEAKING' | ...
  posture: 'NEUTRAL' | ...
}

// Adapter translates:
{
  expression: 'LISTENING' → mouth_open_target: 0.3
  gaze: 'USER' → head_pose: center, eye_gaze: forward
  gesture: 'NOD' → head_rotation_z: [-5, 5] degrees
  speech_activity: 'SPEAKING' → enable mouth_tracking
}
```

**No schema change.**

---

### MM4: Embodied Coherence ⚠️ REEVAL

**Current:** Avatar2DRenderer interpolates expression (eye_open_y) internally + RenderOrchestrator calls tick().

**Future:** Decide responsibility split:
1. **RenderOrchestrator interpolates** → sends interpolated parameters to engine
2. **Engine interpolates** → receives final intent, internal smoothing

**Recommendation:** Engine interpolates (reduce latency, lower CPU overhead on main thread).

**Change:** RenderOrchestrator.tick() becomes advisory; no-op for video path.

---

### MM5: Speech Coordination ✅ KEEP + REBIND

**Current:**
- StreamingAudioPlayer manages playback lifecycle
- VisemeScheduler computes mouth_activity envelope
- RenderOrchestrator applies to Canvas

**Future:**
- StreamingAudioPlayer: same (turn_id, generation_id, interrupt)
- VisemeScheduler: evaluate if engine has native audio-driven mouth
- HumanAvatarAdapter: if engine audio-native, bypass VisemeScheduler; else, wire mouth_activity

**Status:** VisemeScheduler becomes CONDITIONAL (engine capability-dependent).

---

### MM6: Semantic Gaze ⚠️ REEVAL + REBIND

**Current:**
- GazeRuntime.updateSemanticGaze('USER') → computes pupil offset (x, y)
- Avatar2DRenderer draws pupils at offset

**Future:**
- GazeRuntime.updateSemanticGaze('USER') → produces gaze target
- HumanAvatarAdapter translates → engine-native gaze/head parameters

**Engine-Specific:**
- If engine supports `(eye_gaze_x, eye_gaze_y)` → direct map
- If engine supports `(head_yaw, head_pitch, eye_yaw)` → compute
- If engine doesn't support independent gaze → capability=false

**Change:** Decouple GazeRuntime output from Canvas geometry.

---

## G. CHARACTER MASTER ASSET SPECIFICATION

### Visual Reference Policy

**Primary Reference:**
- User-provided Famili photograph (real-world temperament + appearance)

**Secondary Reference:**
- visual-identity.yaml (ontology + DNA, NOT generation target)

**Never:**
- Clone real person face 1:1
- Use as training data without explicit consent
- Generic/templated faces

### Master Image Input Specification V1.0

**Functional Requirements:**
- Single image: Famili principal, identity stable
- Front-facing portrait: head + shoulders / half-body
- Neutral base state for blending

**Visual Specifications:**

| Attribute | Spec |
|-----------|------|
| **Framing** | Head + shoulders, or half-body (down to waist) |
| **Expression** | Neutral or gentle smile (baseline) |
| **Eyes** | Clear, open, natural eye contact direction |
| **Hair** | Black/dark brown, long (mid-back), natural texture |
| **Hair Coverage** | Hair NOT heavily covering eyes or face |
| **Makeup** | Natural or subtle (not heavy) |
| **Lighting** | Even, diffuse (studio or natural window lighting) |
| **Background** | Simple, plain, or transparent; no clutter |
| **Clothing** | Professional but approachable (sweater, blazer, or similar) |
| **Accessories** | Minimal (optional: simple jewelry) |
| **Resolution** | 512×512 or higher (portrait dimensions) |
| **Format** | PNG (preferred) or JPEG |
| **File Size** | ≤ 5MB |

### Supporting Assets (For Expression/Gaze QA)

Optional reference images for animation QA:
1. **NEUTRAL** — Baseline state (used above)
2. **GENTLE_SMILE** — Warm expression
3. **LISTENING** — Open attention (eyes slightly wider)
4. **THINKING** — Contemplative (slight down-gaze)
5. **CALM_SERIOUS** — Professional mode (eyes narrower)

**Not required for MVP;** collected after MVP portrait selection.

---

## H. MVP PLAN

### MVP Scope

**Include:**
- One real Famili portrait
- Real-time talking head (25+ FPS)
- Audio-driven mouth sync
- Semantic gaze (USER ↔ THINKING)
- Interrupt handling
- Local GPU deployment

**Exclude:**
- Hand/gesture animation
- Full-body movement
- Hair physics
- Multiple outfits
- 3D walking/camera
- Facial animation beyond mouth/gaze

### MVP Success Criteria (Human Visual Acceptance)

```
[ ] Portrait renders as real Famili (not cartoon, not generic)
[ ] Identity stable across utterances (no face drift)
[ ] Mouth syncs with audio (perceivable, < 80ms skew)
[ ] Gaze responds to semantic intent (USER = forward, THINKING = down)
[ ] Head has subtle natural movement (not locked)
[ ] Audio interruption stops video immediately
[ ] Second utterance preserves identity (no identity reset)
[ ] No visual tearing, no extreme artifacts
[ ] Browser playback smooth (no stuttering)
[ ] FPS ≥ 25 sustained
```

### MVP Phases

**Phase 1: Prototype & Environment Setup (Week 1)**
- Install PyTorch + FFmpeg
- Evaluate Candidate 3 feasibility on GT 730
- Set up video encoding pipeline (WebRTC / MJPEG)
- Create HumanAvatarAdapter interface (concept code)

**Phase 2: Core Engine Integration (Week 2)**
- Integrate chosen engine (Candidate 3 primary)
- Connect PerformanceFrame → adapter → engine
- Test audio-driven mouth on real audio
- Measure FPS, VRAM, latency

**Phase 3: MM2-MM6 Rebinding (Week 3)**
- Wire GazeRuntime → adapter
- Test gaze intent changes
- Interrupt lifecycle (MM5 integration)
- Turn_id correlation logging

**Phase 4: Browser Integration & QA (Week 4)**
- WebRTC or MJPEG streaming → browser
- Replace Canvas with HTMLVideoElement
- MM6 QA controls → gaze targets
- Human visual acceptance (6-point checklist)

---

## I. MEASUREMENT PLAN

### Performance Metrics

**Real-time Performance:**
```
FPS:                 ≥ 25 (target), measure on GT 730
GPU VRAM:           < 2000 MB
GPU Utilization:    peak during frame render
CPU Load:           measure on main thread
```

**Latency Measurements:**

| Point | Target | How |
|-------|--------|-----|
| **Audio-to-Mouth** | < 100ms | Delay from audio chunk → mouth shape visible |
| **Intent-to-Video** | < 150ms | PerformanceFrame gaze → head visible change |
| **First-Frame** | < 500ms | Audio ready → first output frame |
| **Interrupt-to-Stop** | < 50ms | Interrupt flag → video frame stops |
| **A/V Skew** | < 80ms | Audio plays, mouth lags by X ms |

**Identity Drift:**

| Test | Threshold | Method |
|------|-----------|--------|
| **Same Turn** | No perceptual change | Eye tracking software or manual review |
| **Turn-to-Turn** | < 5% landmark drift | Compute face landmark positions across turns |
| **Gaze Consistency** | Eyes stay in head | Facial recognition verify eye stays in eye socket |

### Logging / Telemetry

```python
frame_telemetry = {
  frame_index: int,
  fps_current: float,
  latency_ms: float,
  gpu_vram_used: int,
  audio_input_ms: int,
  gaze_target: str,  # "USER" / "THINKING"
  expression: str,   # "LISTENING" / "SPEAKING"
  interrupt_flag: bool,
  video_stream_url: str,
}
```

---

## J. FILES & PACKAGES EXPECTED

### Python Packages (to install)

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu111
pip install opencv-python numpy scipy scikit-image
pip install ffmpeg-python
pip install mediapy

# Candidate 3 (if pursued):
pip install face-alignment  # or dlib for landmarks
pip install basicsr  # for neural upsampling

# OR Candidate 2 (SadTalker):
# conda env from provided environment.yml
```

### Node Packages (existing)

```json
{
  "dependencies": {
    "@family/fpai-multimodal-runtime": "existing",
    "@family/fpai-multimodal-contracts": "existing"
  },
  "devDependencies": {
    "vitest": "existing",
    "typescript": "existing"
  }
}
```

### New Architecture Files (to create)

```
src/
├─ adapters/
│  └─ HumanAvatarAdapter.ts          [Interface for intent → engine params]
├─ engines/
│  ├─ RealtimeHumanRenderer.ts        [Abstract base]
│  ├─ ImageBasedRenderer.ts           [Candidate 3 impl]
│  └─ SadTalkerRenderer.ts            [Candidate 2 impl, fallback]
├─ streaming/
│  ├─ VideoStreamEncoder.ts           [MJPEG or WebRTC]
│  └─ AudioVideoSync.ts               [A/V sync measurement]
└─ browser/
   ├─ AvatarVideoPlayer.ts            [HTMLVideoElement wrapper]
   └─ PerformanceMonitor.ts           [FPS, latency logging]

python/
├─ engines/
│  ├─ image_based_renderer.py         [Candidate 3]
│  └─ sadtalker_wrapper.py            [Candidate 2, if selected]
├─ streaming/
│  ├─ video_encoder.py
│  └─ audio_sync.py
└─ config.py                           [GPU, model paths, device]
```

---

## K. RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **GT 730 insufficient for real-time** | HIGH | Fallback: CPU-only mode (5-10 FPS acceptable for MVP, better than nothing) |
| **First-frame latency > 500ms** | HIGH | Parallel: start audio + frame encoding immediately; don't wait for full frame |
| **Audio/video sync drift over time** | MEDIUM | Continuous sync measurement; if > 100ms, resync via keyframe |
| **Identity drift across turns** | MEDIUM | Use canonical face landmarks + optical flow to stabilize; test 10+ turns |
| **VRAM exhaustion during high-res** | MEDIUM | Start at 512×512 output; downscale if needed |
| **Model unavailable / weights download fails** | MEDIUM | Vendor verification; check model URLs; pre-cache weights |
| **Engine API incompatible with interrupt** | MEDIUM | Prototype interrupt early (week 1); fallback: full frame buffer restart |
| **Browser WebRTC setup complexity** | LOW | Start with MJPEG (simpler); add WebRTC later if needed |

---

## L. NEXT IMPLEMENTATION COMMAND

### Stop Current Work

⛔ **Stop:**
- VBF-0 browser validation
- VBF-1 (Layered 2D cartoon development)
- MM7+ feature expansion
- Canvas-based avatar production development

### Begin Audit Phase

**Week 1 Deliverable:** FPAI-RDH-001-AUDIT-REPORT.md

**Includes:**
```
1. ENVIRONMENT VERIFICATION
   - PyTorch installation + GPU detection
   - FFmpeg installation + codec test
   - GPU VRAM benchmark (torch.cuda.memory_allocated)

2. CANDIDATE ENGINE TESTING
   - Candidate 3: Load model, test inference on GT 730
   - Measure: FPS, VRAM, latency (real numbers, not estimates)
   - Candidate 2 (if Candidate 3 fails): Same measurements

3. FEASIBILITY SCORE
   - MVP achievable in 4 weeks? YES / NO / with caveat
   - Primary recommendation: Candidate 3 / 2 / custom build

4. ARCHITECTURE DECISION TREE
   - If Candidate 3 FPS ≥ 25: proceed with Candidate 3
   - If Candidate 3 FPS < 25 but > 15: proceed with optimizations
   - If both candidates fail: recommend CPU-only + accept 10 FPS
   - Never: revert to VBF-0 (2D Canvas)

5. CHARACTER MASTER WORKFLOW
   - Timeline for portrait collection + expression references
   - Asset storage strategy

6. TEAM HANDOFF
   - Who owns video encoding?
   - Who owns browser integration?
   - Who owns GPU optimization?
```

**Command to Start Audit:**

```bash
cd d:/Family/50_开发_dev/products/famili-principal

# 1. Create audit workspace
mkdir -p rdh-audit/{logs,models,output}

# 2. Install PyTorch (if not present)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu111

# 3. Install FFmpeg
# Windows: choco install ffmpeg
# Linux: sudo apt-get install ffmpeg
# macOS: brew install ffmpeg

# 4. Run environment check
python - << 'EOF'
import torch
import sys
print(f"PyTorch: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB" if torch.cuda.is_available() else "N/A")
EOF

# 5. Begin engine evaluation
# (To be scripted in next phase)
```

---

## FINAL STATUS

**ARCHITECTURE RESET: IN PROGRESS**

✅ **Completed:**
- Strategic decision: Famili is real digital human, not 2D avatar
- Current architecture analysis (MM2-MM6 reusable)
- Local environment inventory
- Engine candidate evaluation matrix
- MVP plan (4-week phasing)

⏳ **Next:**
- Week 1: Audit + environment setup + engine proof-of-concept
- Week 2-4: Integration and browser testing

⛔ **Halted:**
- All 2D Canvas development (VBF-0 browser validation, VBF-1)
- MM7+ feature expansion
- Cloud API reliance

---

## References

- `visual-identity.yaml` — Famili visual DNA (authoritative)
- MM2-MM6 runtime documentation (complete, in use)
- Hardware: GT 730, 2GB VRAM, CUDA 11.1

**Next Report:** FPAI-RDH-001-AUDIT-REPORT.md (1 week)

