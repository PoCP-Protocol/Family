# FPAI-MM VISUAL IP MM6-AUDIT-001
# SOCIAL PRESENCE & GAZE ARCHITECTURE AUDIT

**Date:** 2026-08-20  
**Status:** ✅ AUDIT COMPLETE  
**Finding:** VISUAL REPRESENTATION GAP — Current implementation cannot express gaze

---

## A. CURRENT EYE MODEL

### A1. Eye Geometry (avatar2DRenderer.ts:308-325)

```typescript
// Two ellipses, fixed position relative to head
const eyeY = -headR * 0.15;        // Fixed vertical position
const eyeDx = headR * 0.35;        // Horizontal separation (symmetric)
const eyeRx = headR * 0.11;        // Horizontal radius (fixed)
const eyeRy = eyeRx * baseOpenY * (1 - blinkPhase);  // Vertical radius only changes with blink/openY

// Both eyes rendered at:
for (const sx of [-eyeDx, eyeDx]) {
  ctx.ellipse(sx, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
}
```

### A2. Pupil / Iris Support

**Current state:** NONE ❌

- Eyes are solid-colored ellipses
- No pupil
- No iris
- No inner detail that could express gaze direction

### A3. Gaze Position Support

**Current state:** NONE ❌

- `eyeY` is constant
- `eyeDx` is constant
- Only `eyeRy` varies (blink + expression open/close)
- No eye center X offset
- No eye center Y offset
- No capability to shift eye position to express "looking left" vs "looking right"

### A4. Eye Movement Mechanics

**Current state:** NOT IMPLEMENTED ❌

- Eyes cannot move independently
- No saccade (rapid eye movement)
- No smooth pursuit tracking
- Only temporal change: blink cycle (via blinkPhase)

### Files Involved:**
- `avatar2DRenderer.ts` lines 308-325 (eye rendering)
- `avatar2DRenderer.ts` lines 413-430 (blink phase calculation)
- No gaze-related code in renderer

**VERDICT:** Current eye representation **cannot visibly express gaze direction**.

---

## B. CURRENT SEMANTIC SIGNALS

### B1. PerformanceFrame Gaze Field

**Current state:** ✅ EXISTS (from @family/fpai-multimodal-contracts)

```typescript
// renderOrchestrator.ts:139-142
if (frame.gaze === 'USER' && frame.expression === 'LISTENING') {
  avatarState = 'LISTENING';
} else if (frame.gaze === 'SOFT_DOWN_THINKING' || frame.expression === 'THINKING') {
  avatarState = 'THINKING';
}
```

**Known gaze values from code:**
- `'USER'` — direct user attention
- `'SOFT_DOWN_THINKING'` — reflective thinking pose

**Currently used for:**
- Determining avatar state machine transition
- NOT used for eye geometry

### B2. Expression Semantics

| Expression | Current Gaze Implication | Eye Geometry Change |
|------------|--------------------------|-------------------|
| LISTENING | Direct attention expected | openY only |
| THINKING | Reflective/away expected | openY only |
| CALM_WARM | Comfortable direct | openY only |
| CALM_SERIOUS | Stable direct | openY only |
| SPEAKING | Mostly directed | openY only |

**Issue:** Expression semantically implies gaze behavior, but renderer cannot express it visually.

### B3. State-to-Behavior Mapping

```
LISTENING
  → semantic: user-directed attention
  → visual: only eye openness changes
  → missing: directional gaze shift

THINKING
  → semantic: reflective, looking away
  → visual: only eye openness changes
  → missing: actual gaze displacement

SPEAKING
  → semantic: user-directed speech
  → visual: only eye openness changes
  → missing: gaze maintenance signal
```

**VERDICT:** Semantic gaze signals exist but cannot be rendered visually.

---

## C. EXISTING TEMPORAL RUNTIME

### C1. rAF Loop (client.ts:182-188)

```typescript
const rafLoop = () => {
  const now = performance.now();
  renderOrchestrator?.tick(now);
  renderOrchestrator?.render();
  requestAnimationFrame(rafLoop);
};
requestAnimationFrame(rafLoop);
```

**Characteristics:**
- Single browser rAF loop ✓
- Runs every frame (~60fps)
- Calls orchestrator.tick(now) → render()

### C2. Temporal Runtime in RenderOrchestrator (renderOrchestrator.ts:199-236)

**MM4 Expression Interpolation:**
```typescript
// Exponential lerp for eye openY
this.transitionState.currentExpressionOpenY = expLerp(
  this.transitionState.currentExpressionOpenY,
  this.transitionState.targetExpressionOpenY,
  dt,
  EXPRESSION_TRANSITION_TAU_MS
);
this.renderer.setExpressionOpenY(this.transitionState.currentExpressionOpenY);
```

**MM4 Auto-blink:**
```typescript
if (nowMs >= this.transitionState.nextBlinkScheduleMs) {
  this.renderer.triggerBlink();
  this.transitionState.nextBlinkScheduleMs = nowMs + this.randomBlinkInterval();
}
```

**MM4 Gesture Cooldown:**
```typescript
private maybeApplyGesture(gesture: string, nowMs: number): void {
  if (nowMs < this.transitionState.gestureCooldownUntilMs) return;
  if (gesture === this.transitionState.lastGesture && nowMs < this.transitionState.gestureActiveUntilMs) return;
  this.renderer.triggerNod();
  // ...
}
```

**MM5 Speech Coordination:**
```typescript
this.transitionState.speechCoordinator.update();
this.renderer.setMouthActivity(this.transitionState.speechCoordinator.getMouthActivity());
```

### C3. Can Gaze Reuse Current Temporal Runtime?

**YES ✅** — With architectural additions.

Current runtime pattern:
1. State change (frame applied)
2. Set TARGET (gaze_target_x, gaze_target_y)
3. Each tick: interpolate CURRENT toward TARGET
4. Apply to renderer

This is exactly the MM4 expression interpolation pattern. Gaze can follow same architecture:

```typescript
currentGazeX = expLerp(currentGazeX, targetGazeX, dt, GAZE_TRANSITION_TAU_MS);
renderer.setGazeX(currentGazeX);
```

**VERDICT:** Temporal infrastructure reusable; no new rAF needed.

---

## D. GAZE AUTHORITY

### D1. Existing Gaze Authorities

| Authority | Location | Scope |
|-----------|----------|-------|
| PerformanceFrame.gaze | @family/fpai-multimodal-contracts | Semantic intent (USER, SOFT_DOWN_THINKING) |
| renderOrchestrator gaze mapping | renderOrchestrator.ts:139-142 | State machine transition |
| Avatar2DRenderer eye rendering | avatar2DRenderer.ts:308-325 | Pixel output (currently eye open/close only) |

### D2. Authority Gaps

| Decision | Who Owns? | Status |
|----------|-----------|--------|
| What gaze target should be? | PerformanceFrame semantic | ✅ Exists |
| When should gaze change? | Frame arrival + temporal runtime | ⚠️ Partially (no smooth transition) |
| Eye position X/Y for gaze | NOT OWNED | ❌ Missing |
| Pupil/iris position | NOT OWNED | ❌ Missing |
| Blink timing | Avatar2DRenderer + RenderOrchestrator | ✅ Owned |
| Nod timing | RenderOrchestrator | ✅ Owned |
| Mouth timing | SpeechPerformanceCoordinator | ✅ Owned |

### D3. Multiple Authority Risk

**Currently:** NO duplicate authorities ✅

**Future risk:** If gaze is added without clear ownership, could create conflicts with:
- Blink (could interrupt gaze transition)
- Nod (could displace gaze)
- Speech (mouth envelope separate from gaze)

**VERDICT:** Single authority pattern exists; must preserve for gaze.

---

## E. ATTENTION MODEL

### E1. Current Attention Semantics

**Explicitly captured:**
- PerformanceFrame.gaze: `'USER'` | `'SOFT_DOWN_THINKING'`

**Implicitly captured:**
- PerformanceFrame.expression: `LISTENING` | `THINKING` | `SPEAKING` → implies attention
- PerformanceFrame.speech_activity: `SPEAKING` | `SILENT` → implies attention focus
- State machine: `LISTENING` | `THINKING` → implies attention

**Never captured:**
- User location (always screen center assumed)
- User engagement score
- Attention priority (what to look at when multiple stimuli)

### E2. Needed for MM6

**Minimum:**
- Gaze target (semantic: USER vs REFLECTIVE vs NEUTRAL)
- Gaze naturalness (micro-break timing)
- Expression-gaze coherence rule (LISTENING→USER, THINKING→AWAY)

**NOT needed yet:**
- User face detection
- Attention priority
- Rapport calculation

**VERDICT:** Attention model sufficient for semantic gaze; no perception needed.

---

## F. VISUAL CAPABILITY

### F1. Can Current Eye Representation Express Gaze?

**ANSWER:** NO ❌

**Why:**
- No pupil / iris
- No eye center offset X/Y
- Both eyes: fixed symmetric ellipses
- Only visible variation: openY (via blink + expression)

**Result:** Cannot distinguish between:
- Looking at user
- Looking away
- Looking left
- Looking right

All three states look identical: two closed-or-open ellipses, centered.

### F2. Minimum Visual Addition Required

**Option A: Add pupils**
```
Current: empty ellipse (white/color-filled)
New: ellipse with inner pupil (black circle)
Benefit: pupil can shift X/Y within eye bounds to express gaze
Cost: small visual change, must validate against Visual Bible

Example:
- Looking user: pupil centered
- Looking left: pupil left edge of eye ellipse
- Looking down-thinking: pupil center-down
```

**Option B: Shift entire eye ellipse**
```
Current: fixed X/Y position
New: eye center can move small amount (±5% of eye radius)
Benefit: smoother, no new shape needed
Cost: affects head proportions, may look wrong

Example:
- Looking user: eye at current position
- Looking left: entire eye shifts slightly left
```

**Option C: Eye rotation**
```
Current: circular/ellipse eyes
New: eyes with eyelids or directional marking
Benefit: expressive without shape change
Cost: significant visual redesign, breaks current aesthetic

Example:
- Looking user: eyes face-forward
- Looking left: eyes angled left
```

**Recommendation:** **Option A (Add pupils)** — Minimum, non-breaking change.

---

## G. MAIN DEFECTS

### MM6-R01: No Visible Gaze Expression

**Severity:** CRITICAL ❌

**Evidence:**
- avatar2DRenderer.ts:308-325 — eyes have no pupils/iris to shift
- renderOrchestrator.ts:139-142 — gaze semantic exists but not visualized

**Risk:** Semantic gaze signals go to renderer but cannot be drawn. Users see identical eye expression for LISTENING (user-directed) and THINKING (away) states.

**Correction:** Add pupil to eye representation. Pupil can shift X/Y to express gaze direction.

---

### MM6-R02: No Gaze Interpolation

**Severity:** HIGH ⚠️

**Evidence:**
- renderOrchestrator.ts applies expression state change immediately
- No gaze target / current gaze state tracking
- No smooth transition from one gaze target to another

**Risk:** If gaze added naively, would teleport instantly instead of smooth saccade. Breaks social naturalness.

**Correction:** Add GazeState (currentGazeX, currentGazeY, targetGazeX, targetGazeY) to RenderOrchestrator.transitionState. Interpolate in tick() like MM4 expression.

---

### MM6-R03: Thinking Gaze Behavior Missing

**Severity:** MEDIUM ⚠️

**Evidence:**
- renderOrchestrator.ts:141 checks `gaze === 'SOFT_DOWN_THINKING'` but only uses for state assignment
- Avatar2D cannot render "looking away"
- THINKING and LISTENING produce identical eye output

**Risk:** Core social signal (thinking causes gaze break) lost.

**Correction:** Implement gaze-away target when THINKING. Smooth return to USER when SPEAKING/LISTENING.

---

### MM6-R04: Micro-Gaze-Break Missing

**Severity:** MEDIUM ⚠️

**Evidence:**
- No temporal gaze relaxation rules
- Current blink is only eye animation unrelated to gaze

**Risk:** Infinite user-directed staring unnatural. Real humans break eye contact occasionally.

**Correction:** Add light-touch gaze micro-breaks during LISTENING. Timing: ~5-10s intervals, small offset, <500ms duration. Via RenderOrchestrator temporal runtime.

---

### MM6-R05: Gaze/Blink Interaction Undefined

**Severity:** MEDIUM ⚠️

**Evidence:**
- avatar2DRenderer.ts:313 — blink only affects eyeRy (vertical radius)
- No gaze logic exists yet
- Avatar2DRenderer.triggerBlink() is independent

**Risk:** When MM6 adds gaze, blink could interfere. Example: blink during gaze transition could jump gaze to wrong position.

**Correction:** Ensure blink is purely local (eye open/close). Gaze interpolation orthogonal. Blink should not reset gaze state.

---

### MM6-R06: Gaze/Nod Interaction Undefined

**Severity:** LOW ✓

**Evidence:**
- renderOrchestrator.ts:204-208 — nod triggers gesture, affects head position via nodOffset
- No gaze logic yet
- Avatar2D: nod only adds Y displacement to head

**Risk:** Low — nod is head motion, not eye motion. Orthogonal unless gaze tied to head pose (not planned).

**Correction:** No action needed for MM6 V1. Document that nod does not affect gaze.

---

### MM6-R07: Gaze / Speech Interaction Undefined

**Severity:** MEDIUM ⚠️

**Evidence:**
- MM5 controls mouth via speech_activity + playback lifecycle
- SPEAKING state can change gaze (renderOrchestrator.ts:144)
- No explicit rule for gaze behavior during speech

**Risk:** Speaking might cause inappropriate gaze change (e.g., looking away mid-sentence).

**Correction:** Policy: during SPEAKING, maintain or strengthen user-directed gaze. Allow natural return-to-user reconnection but no large gaze breaks mid-speech.

---

### MM6-R08: User Location Unknown

**Severity:** MEDIUM ⚠️ (acceptable for V1)

**Evidence:**
- No camera / face tracking in MM6 brief
- User position assumed screen center (default target)
- renderOrchestrator.ts line 135: "gaze/expression" comment but no user input

**Risk:** Gaze always points screen center. Cannot track actual user.

**Correction:** V1 limitation accepted. Default target = screen center. MM7+ adds user detection if needed.

---

## H. PROPOSED MINIMAL ARCHITECTURE

### H1. Semantic Gaze (PerformanceFrame.gaze)

Already exists:
```
PerformanceFrame { gaze: 'USER' | 'SOFT_DOWN_THINKING' | ... }
```

**Action:** Define minimal enum:
```typescript
type GazeIntent = 'USER' | 'REFLECTIVE' | 'NEUTRAL';
```

### H2. GazeIntentResolver

New component (lightweight):
```typescript
function resolveGazeTarget(
  frame: PerformanceFrame,
  state: FamilyAvatarState
): GazeTarget {
  // USER + (LISTENING | SPEAKING) → screen center
  // THINKING → soft down
  // REFLECTIVE → soft away
  // otherwise → neutral
}
```

### H3. GazeRuntime (in RenderOrchestrator.transitionState)

Minimal state addition:
```typescript
interface GazeState {
  currentX: number;  // Screen coords or relative [0..1]
  currentY: number;
  targetX: number;
  targetY: number;
}
```

Per tick:
```typescript
gaze.currentX = expLerp(gaze.currentX, gaze.targetX, dt, GAZE_TRANSITION_TAU_MS);
gaze.currentY = expLerp(gaze.currentY, gaze.targetY, dt, GAZE_TRANSITION_TAU_MS);
renderer.setGazeOffset(gaze.currentX, gaze.currentY);
```

### H4. Avatar2DRenderer Enhancement

New method:
```typescript
public setGazeOffset(offsetX: number, offsetY: number): void {
  this.pupilOffsetX = offsetX;  // Relative to eye center [-1..1]
  this.pupilOffsetY = offsetY;
}
```

In render():
```typescript
// Add pupil at offset
const pupilX = sx + (offsetX * eyeRx * 0.5);
const pupilY = eyeY + (offsetY * eyeRy * 0.5);
ctx.fillStyle = 'black';
ctx.beginPath();
ctx.arc(pupilX, pupilY, eyeRx * 0.3, 0, Math.PI * 2);  // Pupil radius
ctx.fill();
```

### H5. Signal Chain

```
PerformanceFrame { gaze: 'USER' | 'THINKING', expression, ... }
        ↓
RenderOrchestrator.applyPerformanceFrame()
        ↓
resolveGazeTarget() → targetX, targetY
        ↓
Set transitionState.gaze.target*
        ↓
Each rAF tick():
  expLerp currentGaze toward targetGaze
  call renderer.setGazeOffset(currentX, currentY)
        ↓
Avatar2DRenderer.render():
  Draw eye ellipse at fixed position
  Draw pupil at (eye_center + offset)
        ↓
Canvas output
```

---

## I. CAMERA REQUIREMENT

**Required for MM6 V1:** NO ✅

MM6 uses only semantic gaze (PerformanceFrame input), not perception.

**When camera might be needed:** MM7+ for:
- User face detection
- Gaze following (eyes track user head position)
- Attention priority (what to look at when multiple stimuli)

---

## J. TEST PLAN

### J1. Semantic Gaze Tests

```
MM6-S01: LISTENING → gaze target = USER
MM6-S02: THINKING → gaze target = REFLECTIVE
MM6-S03: SPEAKING → gaze target = USER (maintained)
MM6-S04: CALM_SERIOUS + USER gaze → stable direct gaze
MM6-S05: BOUNDARY_CLEAR + gaze → appropriate target
MM6-S06: Unknown semantic state → safe default (USER)
```

### J2. Gaze Transition Tests

```
MM6-T01: Direct → Reflective → smooth interpolation (not instant)
MM6-T02: Mid-transition gaze observable (intermediate positions)
MM6-T03: Transition converges to target within tolerance
MM6-T04: Same target repeated → reuse, no restart
MM6-T05: New target during transition → continue from current
MM6-T06: Transition time deterministic (same clock → same path)
```

### J3. Social Sequence Tests

```
MM6-N01: LISTENING → THINKING → SPEAKING
  Expected: user gaze → gaze-away → user gaze

MM6-N02: THINKING → SPEAKING (no LISTENING break)
  Expected: smooth reconnect during speech onset

MM6-N03: Speech interruption → gaze follows state change
```

### J4. Blink Interaction Tests

```
MM6-B01: Blink during gaze-away → gaze unchanged
MM6-B02: Blink during gaze transition → transition continues
MM6-B03: Deterministic blink + gaze combination (fake clock)
MM6-B04: Identity preserved (WeakSet, character_id unchanged)
```

### J5. Nod Interaction Tests

```
MM6-G01: Semantic nod + USER gaze → coexist naturally
MM6-G02: Nod does not reset gaze state
MM6-G03: Head offset (from nod) does not affect eye gaze
```

### J6. Speech Interaction Tests

```
MM6-A01: Speech playback starts → mouth animates (MM5 intact)
MM6-A02: Speech playback → gaze unaffected by viseme
MM6-A03: Viseme A/O/M changes → gaze unchanged
MM6-A04: Speech interruption → gaze follows state, MM5 intact
```

### J7. Canvas Proof (Pixel-Level)

```
Direct gaze state:
  - Eye ellipses centered
  - Pupils at (eye_center_x, eye_center_y - small offset)
  - Visible difference from reflective gaze

Reflective gaze state:
  - Eye ellipses centered
  - Pupils at (eye_center_x - offset, eye_center_y + offset)
  - Visible difference from direct gaze

Mid-transition (50%):
  - Pupils at intermediate position
  - Observable smooth movement
```

Report:
- eye_center_x, eye_center_y (fixed)
- pupil_x, pupil_y (actual Canvas calls)
- Three states documented with pixel coords

### J8. Identity Safety Tests

```
MM6-I01: Entire LISTENING→THINKING→SPEAKING sequence
  - ResolvedRendererProfile instance = same
  - WeakSet provenance = pass
  - character_id unchanged
  - identity_version unchanged

MM6-I02: Gaze runtime does not mutate profile

MM6-I03: gaze data not stored in CharacterIdentity
```

### J9. Determinism Tests

```
MM6-D01: Same PerformanceFrame sequence + clock + random source
  → Same gaze state sequence
  → Same Canvas output

MM6-D02: Stochastic micro-breaks (future):
  If added, deterministic under fake randomness
```

---

## K. IMPLEMENTATION SCOPE

### K1. New Files

```
src/gazeRuntime.ts
  - GazeState interface
  - GazeTarget interface
  - GazeIntentResolver function
  - Constants (GAZE_TRANSITION_TAU_MS, gaze bounds, etc.)

src/gazeRuntime.spec.ts
  - Tests MM6-S, MM6-T, MM6-D categories
```

### K2. Modified Files

```
src/renderOrchestrator.ts
  - Add GazeState to PerformanceTransitionState
  - Add gaze interpolation logic to tick()
  - Add gaze target resolution in applyPerformanceFrame()

src/avatar2DRenderer.ts
  - Add pupilOffsetX, pupilOffsetY fields
  - Add setGazeOffset() method
  - Modify eye rendering to draw pupil at offset
  - Update snapshot() to include gaze info

src/mm6*Integration.spec.ts (NEW)
  - Tests MM6-N, MM6-B, MM6-G, MM6-A, MM6-I categories
```

### K3. DO NOT Modify

```
- MM2 identity authority: CharacterIdentity, IdentityResolver
- MM3 semantic authority: PerformanceIntent, PerformancePlanner
- MM4 temporal authority: MM4 expression transition (orthogonal)
- MM5 speech authority: SpeechPerformanceCoordinator, mouth timing
- PerformanceFrame contract (read gaze field, don't add new fields)
```

---

## L. RECOMMENDATION

### MM6 Implementation Ready?

**Answer: YES, with visual caveat ✅**

**Precondition:** Verify that adding pupils to eyes matches Visual Bible and IP guidelines.

**Implementation Plan:**
1. Add pupils (small black circles) to current eye ellipses
2. Implement GazeRuntime + GazeIntentResolver
3. Wire gaze into RenderOrchestrator temporal loop
4. Add comprehensive tests (MM6-S through MM6-I)
5. Verify blink/nod/speech orthogonality
6. Ensure identity safety (MM2 unchanged)

**Expected Outcome:** Users see natural eye movement expressing attention, gaze smooth transitions between targets, thinking causes reflective gaze break, core social presence established.

**Blocking Issue:** ONLY if Visual Bible forbids pupils or if current eye design cannot support gaze expression. Otherwise, ready to proceed.

---

## M. FINAL VERDICT

| Criterion | Status | Notes |
|-----------|--------|-------|
| Semantic gaze signals exist | ✅ YES | PerformanceFrame.gaze |
| Temporal runtime reusable | ✅ YES | MM4 pattern fits gaze |
| Single authority | ✅ YES | No conflicts |
| Visual representation gap | ⚠️ CRITICAL | Needs pupils |
| Blink/nod/speech conflicts | ⚠️ LOW | Orthogonal, manageable |
| Camera needed | ✅ NO | V1 uses semantic only |
| MM2/MM3/MM4/MM5 safe | ✅ YES | No modification needed |
| Ready for implementation | ✅ YES | After visual confirmation |

---

## N. NEXT STEP

**Before MM6 implementation:**
1. Confirm with design/brand team that adding pupils to eye representation is acceptable
2. Define gaze coordinate system (eye-local offset vs screen coords)
3. Finalize GazeIntent enum values
4. Confirm micro-gaze-break timing parameters

**Then:** Proceed with MM6-IMPLEMENTATION-001.

---

**🔒 MM6-AUDIT-001 COMPLETE**

