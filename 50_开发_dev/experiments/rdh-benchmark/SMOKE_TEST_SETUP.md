# RDH-003B SMOKE TEST SETUP

**Status:** ⏹️ AWAITING USER ASSETS

---

## What's Ready

✅ Benchmark directory structure created
✅ Ditto environment isolation ready
✅ Smoke gate protocol documented
✅ Metrics templates prepared

## What's Needed (User Action)

### 1. Smoke Reference Portrait

**File:** `FAMILI_RDH_SMOKE_REFERENCE_V0.png`

**Requirements:**
- Black long hair, clear eyes, frontal face
- Head + shoulders framing
- Natural expression (smile or neutral)
- No modifications, no beauty filters
- 512×512 or larger

**Action:**
Place file at:
```
experiments/rdh-benchmark/assets/famili-reference-v0/FAMILI_RDH_SMOKE_REFERENCE_V0.png
```

### 2. A01 Audio (First Only)

**Text:**
```
"你好，我是法咪莉。今天我们一起看看，最近这个家庭发生了哪些值得关注的变化。"
```

**Format:** WAV, 16kHz, mono

**Action:**
Generate using Family TTS, save at:
```
experiments/rdh-benchmark/assets/audio-v1/A01_NORMAL_5S.wav
```

### 3. GPU Node

**Minimum:** RTX 3060 12GB (or RTX 3090 / A5000 / A100, etc.)

**Do NOT use:** GT 730 (TIER 0 diagnostic only)

---

## Once Assets Provided

```
→ Place FAMILI_RDH_SMOKE_REFERENCE_V0.png
→ Generate + place A01_NORMAL_5S.wav
→ Provision GPU node
→ Run: Ditto smoke gates
  1. Install
  2. Model load
  3. Portrait + A01 → MP4
  4. Human inspection
→ Show first video to user
→ Wait for user judgment
→ Proceed to full benchmark (if approved)
```

---

## Success Condition

**Valid smoke PASS = Real MP4 file exists:**

```
outputs/ditto/smoke/
└─ DITTO_A01_SMOKE.mp4
```

Not: repo cloned, model loaded, sample demo passed
**Must be:** Our portrait + Our audio → Our video

---

## Current Blockers

```
❌ FAMILI_RDH_SMOKE_REFERENCE_V0.png — NOT PROVIDED
❌ A01_NORMAL_5S.wav — NOT GENERATED
❌ GPU node — NOT PROVISIONED
```

**Cannot execute Ditto smoke until ALL three provided.**

---

## Timeline

```
Assets provided → GPU ready → 30 minutes: Ditto smoke gates → First video
```

