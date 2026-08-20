# MM6-HUMAN-VISUAL-GATE-001
# REAL AVATAR LAB VISUAL ACCEPTANCE SETUP

---

## PRODUCTION RENDERER CONFIRMED

✅ **Avatar Lab Running Production Path:**

| Component | File | Line | Status |
|-----------|------|------|--------|
| **Avatar2DRenderer** | `avatar-lab/src/avatar2DRenderer.ts` | 164+ | ✅ Production |
| **RenderOrchestrator** | `avatar-lab/src/renderOrchestrator.ts` | 77+ | ✅ Production |
| **GazeRuntime** | `avatar-lab/src/gazeRuntime.ts` | 80+ | ✅ MM6 NEW |
| **Client Entry** | `avatar-lab/src/client.ts` | 176-207 | ✅ Canvas + rAF |
| **Canvas** | `avatar-lab/src/client.ts` | 172-174 | ✅ 320x320 real Canvas |

**Real Path Verified:**
```
WebSocket PERFORMANCE_PLAN
  → client.ts:303 applyPerformanceFrame()
  → RenderOrchestrator.applyPerformanceFrame()
  → GazeRuntime.updateSemanticGaze()
  → rAF loop (tick + render)
  → Avatar2DRenderer → Canvas 2D pupils
```

---

## LAUNCH INSTRUCTIONS

### 1. Start Avatar Lab Server

**Development mode:**
```bash
cd d:\Family\50_开发_dev\products\famili-principal\apps\avatar-lab
npm run dev
```

**Expected output:**
```
  VITE ... ready in XXX ms

  ➜  Local:   http://localhost:4173/
  ➜  press h to show help
```

### 2. Open Browser

Navigate to:
```
http://localhost:4173/
```

**Expected view:**
- Left panel: Avatar canvas (currently emoji, will be pupil-eyed face when MM6 QA buttons clicked)
- Bottom left: Red QA control panel (MM6-QA buttons)
- Right panel: Dev telemetry + event log

---

## MM6 VISUAL QA CONTROLS (NON-PRODUCTION)

**Location:** Bottom of user surface (red panel labeled "MM6 VISUAL QA (DEV-ONLY)")

**Buttons available:**

| Button | Effect | Purpose |
|--------|--------|---------|
| **Gaze: USER** | Sets `gaze='USER'` | Pupils center, direct eye contact |
| **Gaze: THINKING** | Sets `gaze='SOFT_DOWN_THINKING'` | Pupils down, reflective |
| **Expr: LISTENING** | Sets `expression='LISTENING'` | Open eyes |
| **Expr: THINKING** | Sets `expression='THINKING'` | Narrow eyes |
| **Expr: CALM_SERIOUS** | Sets `expression='CALM_SERIOUS'` | Very narrow eyes (geometry test) |
| **Trigger: BLINK** | Fires blink animation | 120ms blink cycle |
| **Gesture: NOD** | Fires nod animation | 400ms nod cycle |
| **Activity: SPEAKING** | Sets `speech_activity='SPEAKING'` | Triggers MM5 mouth envelope |

**How each button works:**
1. Injects PerformanceFrame through real production path
2. Calls `RenderOrchestrator.applyPerformanceFrame(frame)`
3. Updates GazeRuntime, expression interpolation, mouth envelope
4. Next rAF frame renders to Canvas

**NO direct renderer calls** — full integration test.

---

## STEP-BY-STEP VISUAL ACCEPTANCE

### Stage A: USER GAZE

1. Click **"Gaze: USER"**
2. Observe pupils in Canvas
3. Check:
   - [ ] Pupils centered
   - [ ] Eyes look natural, not dead stare
   - [ ] Pupils visible but not oversized
   - [ ] Both pupils identical direction (no cross-eye)

### Stage B: USER → THINKING TRANSITION

1. Click **"Gaze: USER"** (establish baseline)
2. **Immediately** click **"Gaze: THINKING"**
3. Observe smooth 200ms progression
4. Check:
   - [ ] Pupils gradually shift downward
   - [ ] No sudden jump or pop
   - [ ] Motion feels natural, not mechanical
   - [ ] Both pupils move together

### Stage C: THINKING GAZE STABLE

1. Click **"Gaze: THINKING"**
2. Wait 2 seconds for convergence
3. Observe final position
4. Check:
   - [ ] Pupils are visibly downward
   - [ ] Offset appears subtle (not extreme)
   - [ ] Doesn't look like looking-at-nose or rolling-eyes
   - [ ] Looks like "thinking/reflecting"

### Stage D: THINKING → USER RECONNECT

1. Click **"Gaze: THINKING"** (establish baseline)
2. Wait 1 second
3. **Click "Gaze: USER"**
4. Observe smooth return
5. Check:
   - [ ] Pupils gradually return to center
   - [ ] Smooth continuous motion
   - [ ] No pop back
   - [ ] Natural eye contact reestablished

### Stage E: USER + BLINK

1. Click **"Gaze: USER"**
2. Wait 0.5 seconds
3. Click **"Trigger: BLINK"**
4. Observe 120ms blink cycle
5. Check:
   - [ ] Eyes close and open smoothly
   - [ ] **Pupils don't float/pop during blink**
   - [ ] After blink, pupils return to USER position
   - [ ] No blinking-away artifacts

### Stage F: THINKING + BLINK

1. Click **"Gaze: THINKING"**
2. Wait 0.5 seconds
3. Click **"Trigger: BLINK"**
4. Observe blink with THINKING offset
5. Check:
   - [ ] Eyes close while offset downward
   - [ ] Pupils don't visibly escape eye bounds
   - [ ] No artifacts

### Stage G: CALM_SERIOUS + USER (Geometry Test)

1. Click **"Expr: CALM_SERIOUS"** (eyes very narrow)
2. Click **"Gaze: USER"**
3. Observe rendering with narrow expression
4. Check:
   - [ ] Pupils still visible
   - [ ] Pupils don't appear oversized for narrow eye
   - [ ] No visual clipping or overflow
   - [ ] Looks proportional

### Stage H: CALM_SERIOUS + THINKING (Geometry Test)

1. Click **"Expr: CALM_SERIOUS"**
2. Click **"Gaze: THINKING"**
3. Observe maximum offset in narrow eyes
4. Check:
   - [ ] Pupils contained within narrow eye bounds
   - [ ] Offset visible but safe
   - [ ] No escape

### Stage I: SPEAKING + USER

1. Click **"Activity: SPEAKING"**
2. Click **"Gaze: USER"**
3. Observe mouth + gaze together
4. Check:
   - [ ] Pupils stable while mouth is active
   - [ ] Gaze doesn't change with speech
   - [ ] Eyes maintain USER position
   - [ ] Speech + gaze coexist naturally

### Stage J: NOD + USER

1. Click **"Gaze: USER"**
2. Click **"Gesture: NOD"**
3. Observe 400ms nod cycle
4. Check:
   - [ ] Head bobs while pupils stay in USER gaze
   - [ ] Eyes and nod don't interfere
   - [ ] Natural combined motion

---

## FINAL HUMAN VISUAL ACCEPTANCE CHECKLIST

After completing stages A-J, answer these 6 questions:

```
[ ] 1. USER gaze looks natural, not like a dead/frozen stare
      (Not too small, not too large, feels like eye contact)

[ ] 2. THINKING gaze is subtle and classy
      (Not exaggerated, not looking-at-nose, feels thoughtful)

[ ] 3. USER ↔ THINKING transitions are smooth
      (No sudden jumps, no pop effects, feels like real eye movement)

[ ] 4. Pupils don't float/pop during blinks
      (Pupils contained safely, no visual artifacts)

[ ] 5. CALM_SERIOUS narrow eyes don't show oversized pupils
      (Pupils geometrically safe even with narrow expression)

[ ] 6. New pupils don't break 法咪莉's visual IP feel
      (Pupils integrate naturally, not cartoony or cheap-looking)
```

---

## IF YOU FIND ISSUES

**Pupil too large?**
- Close browser
- Edit `avatar2DRenderer.ts` line 348: change `headR * 0.04` to `headR * 0.03`
- Restart dev server
- Test again

**Pupil color not good?**
- Edit `avatar2DRenderer.ts` line 356: change `'#000000'` to preferred color
- Restart

**Gaze offset too extreme?**
- Edit `gazeRuntime.ts` line 30: change `y: 0.4` to `y: 0.25` or `y: 0.3`
- Restart

**All other issues:**
- Do NOT modify PerformanceFrame
- Do NOT modify semantic gaze enum
- Only adjust renderer-local constants

---

## IF ALL CHECKS PASS

Return to me with answer to 6-point checklist.

I will then set:
```
MM6 HUMAN VISUAL ACCEPTANCE: YES
MM6 FINAL LOCK: YES
READY FOR MM7: YES
```

---

## TECHNICAL NOTES

- **Real production chain:** Yes, through PerformanceFrame + RenderOrchestrator
- **Mock avoided:** All buttons inject real frames
- **Canvas direct:** 320x320 real 2D Canvas with pupils
- **Deterministic:** Gaze interpolation uses real expLerp (tau=200ms)
- **Safe geometry:** Dynamic radius clamping prevents pupil overflow
- **Tested:** 177/177 regression tests passing

---

**READY TO VIEW REAL PUPILS IN BROWSER**

Server: `http://localhost:4173/`

QA Panel: Bottom of user surface (red panel)

6 checks: Complete on browser, report results.

