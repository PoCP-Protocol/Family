# MM3 AUDIT FINDINGS
## Multimodal Performance Runtime — Semantic Intent to Embodied Performance

**Audit Date:** 2026-08-18  
**Status:** IN PROGRESS

---

## CRITICAL FINDINGS

### MM3-A01: INVALID PERFORMANCE VALUES — EXPRESSION TYPE MISMATCH

**Severity:** P1 - semantic intent cannot reliably reach active renderer

**Discovery:** PerformancePlanner test expects 'ATTENTIVE' expression, but:
- 'ATTENTIVE' does NOT exist in CharacterExpression contract
- Test file: `packages/fpai-performance-planner/src/performancePlanner.spec.ts` line 27, 37
- Test failures: U01, U02 (both expect 'ATTENTIVE', receive 'LISTENING')

**Root Cause:** Two independent expression type systems exist without alignment:

1. **Canonical CharacterExpression** (`packages/fpai-multimodal-contracts/src/characterIdentity.ts` L71-79):
   - `NEUTRAL_WARM | LISTENING | THINKING | SOFT_ENCOURAGING | WARM_FIRM | CALM_SERIOUS | CONCERNED_CALM | BOUNDARY_CLEAR`
   - This is the SSOT for character expression identity

2. **FamilyExpression** (`products/famili-principal/apps/avatar-lab/src/avatar2DRenderer.ts` L45-50):
   - `CALM_WARM | CALM_SERIOUS | GENTLE_ENCOURAGING | CALM_CAUTIOUS | WARM_FIRM`
   - Used by renderer implementation

3. **AvatarPerformancePlan.expression** (`packages/fpai-multimodal-contracts/src/index.ts` L149-154):
   - Typed as `string` (untyped)
   - No validation against CharacterExpression

**Current State:**
- PerformancePlanner emits: `'LISTENING'` (valid CharacterExpression)
- Test expects: `'ATTENTIVE'` (does NOT exist in either system)
- Renderer consumes: `FamilyExpression` values

**Required Correction:**
1. Canonicalize one expression type system (likely CharacterExpression)
2. Update PerformancePlanner to emit canonical types
3. Update tests to expect valid values
4. Type AvatarPerformancePlan.expression as CharacterExpression['expression_id']
5. Avatar2DRenderer must accept canonical types or perform validated mapping

**Files Involved:**
- `packages/fpai-multimodal-contracts/src/characterIdentity.ts` (CharacterExpression definition)
- `products/famili-principal/apps/avatar-lab/src/avatar2DRenderer.ts` (FamilyExpression usage)
- `packages/fpai-performance-planner/src/performancePlanner.ts` (emission logic)
- `packages/fpai-performance-planner/src/performancePlanner.spec.ts` (test expectations)

---

### MM3-A02: PERFORMANCE INTENT NOT FORMALLY DEFINED

**Severity:** P1 - semantic intent boundary unclear

**Discovery:** MM3 spec requires `PerformanceIntent` contract but none exists in codebase.

**Current State:**
- PrincipalAiOutput (from principal-ai) is used directly as performance input
- No intermediate PerformanceIntent type
- Planner receives: `PrincipalAiOutput + sceneMode + riskRoute`
- No semantic normalization boundary

**PerformanceIntent should answer:** "What is Famili trying to communicate through embodiment?"

**Example Semantic Intents (not yet defined):**
- `ATTEND` (listen actively)
- `PROCESS` (think about what you said)
- `ENCOURAGE` (offer warmth and support)
- `RESPOND_SERIOUSLY` (this matters, listen)
- `SET_BOUNDARY_CLEARLY` (this line cannot be crossed)

**Required Correction:**
1. Define `PerformanceIntent` in contracts package
2. Classify existing Principal output states into PerformanceIntent vocab
3. Make PerformancePlanner.plan() accept PerformanceIntent (not raw output)
4. Document semantic→intent mapping rationale

**Files to Create/Modify:**
- `packages/fpai-multimodal-contracts/src/performanceIntent.ts` (NEW)
- `packages/fpai-performance-planner/src/performancePlanner.ts` (signature change)
- `products/famili-principal/apps/avatar-lab/src/orchestrator.ts` (mapping layer)

---

### MM3-A03: PERFORMANCE FRAME NOT FORMALLY DEFINED

**Severity:** P1 - frame coherence boundary undefined

**Discovery:** No `PerformanceFrame` contract exists; planner returns anonymous object.

**Current State:**
- `AvatarPerformancePlan` is defined in contracts (characterIdentity.ts L149-154)
- Properties: `expression`, `gesture`, `gaze`, `posture`
- But no validation that these form a coherent frame
- No immutability guarantee
- No type for "immutable snapshot at one moment"

**AvatarPerformancePlan definition:**
```ts
export interface AvatarPerformancePlan {
  expression: string;     // untyped!
  gesture: string;        // untyped!
  gaze: 'USER' | 'SOFT_DOWN_THINKING' | 'RETURN_USER' | 'AWAY' | 'STABLE';
  posture: 'RELAXED' | 'STEADY' | 'FORWARD';
}
```

**Required Corrections:**
1. Rename `AvatarPerformancePlan` → `PerformanceFrame` for clarity
2. Type `expression` as `CharacterExpression['expression_id']`
3. Type `gesture` as `CharacterGesture['gesture_id']`
4. Mark all fields `readonly`
5. Add immutability assertion in orchestrator
6. Add frame-level coherence validation

**Files to Modify:**
- `packages/fpai-multimodal-contracts/src/characterIdentity.ts` (type changes)
- `packages/fpai-multimodal-contracts/src/index.ts` (export name)
- `packages/fpai-performance-planner/src/performancePlanner.ts` (output type)
- All consumers of `AvatarPerformancePlan` (rename)

---

### MM3-A04: UNCOORDINATED PERFORMANCE APPLICATION

**Severity:** P1 - impossible performance states possible

**Discovery:** Avatar2DRenderer state can be changed independently via separate calls.

**Current Usage Pattern** (mm1b1AddonEntry.ts L106-107, L131-132, L163-164):
```ts
renderer.setState('SPEAKING');
renderer.triggerNod();
// ... later ...
renderer.setMouthShape('REST');
// ... later ...
renderer.setState('RESTING');
renderer.setExpression('CALM_WARM');
```

**Problem:** Transient impossible combinations possible:
- `SPEAKING + mouthShape='REST'` (speaking but mouth closed)
- `LISTENING + expression='BOUNDARY_CLEAR'` (impossible semantics)
- State and expression updated separately: race conditions possible

**Existing Methods:**
- `setState(state)`
- `setExpression(expression)`
- `setMouthShape(mouthShape)`
- `triggerBlink()`
- `triggerNod()`

**Required Correction:**
1. Create `applyPerformanceFrame(frame: PerformanceFrame)` atomic method
2. This method validates frame coherence ONCE
3. Updates all renderer state atomically
4. Old methods become implementation details (private or deprecated)
5. Add frame coherence validator

**Files to Modify:**
- `products/famili-principal/apps/avatar-lab/src/avatar2DRenderer.ts` (add atomic apply method)
- `products/famili-principal/apps/avatar-lab/src/orchestrator.ts` (call atomic method)
- `products/famili-principal/apps/avatar-lab/src/mm1b1AddonEntry.ts` (update test pattern)

---

### MM3-A05: DIRECT SETTER AUDIT — PRODUCTION UNCOORDINATED CALLS

**Severity:** P1 - semantic performance path not using atomic boundary

**Discovery:** Production code directly calls renderer setters without frame coherence.

**Direct Setter Usages Found:**

1. **mm1b1AddonEntry.ts** (offline demo):
   - L106: `renderer.setState('RESTING');`
   - L107: `renderer.setExpression('CALM_WARM');`
   - L131: `renderer.setState('SPEAKING');`
   - L132: `renderer.triggerNod();`
   - L164: `renderer.setMouthShape('REST');`
   - L164: (line after) `renderer.setState('RESTING');`
   - Classification: DEMO-ONLY, uncoordinated

2. **VisemeScheduler** (`visemeScheduler.ts` callback):
   - Calls `renderer.setMouthShape(shape)` per viseme event
   - Classification: RENDERER-LOCAL micro-animation, valid

**Current Semantic Path:** (from orchestrator.ts L334-335)
```ts
this.avatar.startPerformance(turnId, plan.avatar);  // Performance plan created
this.tts.synthesizeStream(turnId, output.say_it_tonight);
```

Gateway emits events but client-side orchestrator doesn't exist yet.

**Required Correction:**
1. Identify how AVATAR_EVENT from FamilyLocal2DAvatarGateway reach renderer
2. Create client-side RenderOrchestrator that:
   - Receives PerformanceFrame from server
   - Calls `renderer.applyPerformanceFrame(frame)`
   - Allows micro-animations (viseme, blink) as independent renderer calls
3. Remove uncoordinated direct setter calls from semantic path
4. Preserve viseme micro-animation path (independent)

**Files to Create/Modify:**
- `products/famili-principal/apps/avatar-lab/src/renderOrchestrator.ts` (NEW - client-side composition)
- `products/famili-principal/apps/avatar-lab/src/client.ts` (connect RenderOrchestrator to WebSocket)
- `products/famili-principal/apps/avatar-lab/src/mm1b1AddonEntry.ts` (update demo pattern)

---

### MM3-A06: IDENTITY IMMUTABILITY NOT TESTED ACROSS PERFORMANCE CHANGES

**Severity:** P2 - MM2 regression risk

**Discovery:** No tests verify identity remains constant through performance state changes.

**MM2 Guarantee:** ResolvedRendererProfile instance must:
1. Remain same instance through performance changes
2. Maintain WeakSet membership validity
3. NOT mutate when performance changes

**Current State:**
- mm1b1AddonEntry creates profile once (correct)
- Renderer stores profile (correct)
- No tests verify identity after setState/setExpression/etc

**Required Tests:**
1. MM3-O04: Same ResolvedRendererProfile instance after performance changes
2. MM3-O05: WeakSet membership valid after performance changes
3. MM3-V04: Identity visual style unchanged across performance changes

**Files to Create/Modify:**
- `products/famili-principal/apps/avatar-lab/src/avatar2DRenderer.spec.ts` (add identity persistence tests)

---

### MM3-A07: PERFORMANCE AFFECTS RENDERING — PARTIAL IMPLEMENTATION

**Severity:** P2 - visual derivation needs verification

**Discovery:** Renderer already uses identity-driven visual style (MM2-PATCH-004), but performance-driven rendering incomplete.

**Current State:**
- Identity → visual style config (IMPLEMENTED in PATCH-004)
- Performance state → renderer state (PARTIALLY - state colors but not expression/gesture)
- Performance expression/gesture → no visual rendering yet

**What's Working:**
- `state` affects `visualStyle.stateColors[this.state]` (lines 269, 301)
- This produces visible color changes

**What's Missing:**
- Expression (eye geometry based on EXPRESSION_EYE) is hardcoded, not performance-driven
- Gesture should affect rendering but currently only stored
- Posture not rendered
- Gaze not rendered

**Current Expression Eye Mapping** (avatar2DRenderer.ts L145-151):
```ts
const EXPRESSION_EYE: Record<FamilyExpression, { openY: number }> = {
  CALM_WARM: { openY: 0.55 },
  ...
};
```

This is **not** connected to performance state; uses hardcoded expression.

**Required Correction:**
1. Make eye geometry performance-driven (use performance.expression)
2. Map CharacterExpression to eye/gesture geometry
3. Verify performance changes produce observable render behavior
4. Add test MM3-V01 through MM3-V05

**Files to Modify:**
- `products/famili-principal/apps/avatar-lab/src/avatar2DRenderer.ts` (wire expression/gesture to render)
- Tests (add MM3-V01-V05)

---

### MM3-A08: MOUTH SHAPE CLASSIFICATION UNCLEAR

**Severity:** P2 - future viseme architecture blocking

**Discovery:** MouthShape is currently semantic (REST/OPEN_SMALL) but may need phoneme granularity.

**Current Implementation:**
- Avatar2DRenderer.mouthShape: `FamilyMouthShape` with 8 enum values
- VisemeScheduler applies mouth shapes per TTS viseme event
- CharacterExpression also has mouth_shape field

**Questions:**
1. Is `mouthShape` semantic performance (REST vs SPEAKING)?
   - OR phoneme-level (different open shapes per sound)?
2. Should PerformanceFrame include mouth_shape?
3. Is lip-sync a separate concern?

**Current Usage:**
- VisemeScheduler treats mouth_shape as **phoneme-level** (L148-152 in mm1b1AddonEntry shows 15 different shapes)
- This conflicts with semantic performance model

**Required Clarification:**
1. Separate semantic mouth state (REST / SPEAKING_ACTIVE) from phoneme detail
2. Keep PerformanceFrame mouth state semantic only
3. Viseme scheduling remains independent micro-animation
4. Document boundary

**Files to Review:**
- `products/famili-principal/apps/avatar-lab/src/avatar2DRenderer.ts` (mouthShape definition)
- `products/famili-principal/apps/avatar-lab/src/visemeScheduler.ts` (viseme→mouthShape mapping)
- `products/famili-principal/apps/avatar-lab/src/mm1b1AddonEntry.ts` (usage pattern)

---

### MM3-A09: BLINK/NOD CLASSIFICATION INCOMPLETE

**Severity:** P2 - temporal performance boundary unclear

**Discovery:** Blink and Nod are renderer-local micro-animations but classification incomplete.

**Current State:**
- `triggerBlink()`: Causes blinking animation (renderer-local state machine)
- `triggerNod()`: Causes nodding animation (renderer-local state machine)
- Both have internal phase tracking

**Questions:**
1. Should PerformanceFrame include blink/nod commands?
2. Or are these always renderer-local?
3. Can Principal request specific nod/blink at specific times?

**Current Implementation:**
- Blink: Auto-triggers every 3s (line 239)
- Nod: Triggered explicitly from mm1b1AddonEntry (line 132)

**Required Classification:**
- **Blink:** Renderer-local life animation (NOT in PerformanceFrame)
- **Nod:** Semantic gesture (possibly in PerformanceFrame via gesture field)

**Files to Review:**
- `products/famili-principal/apps/avatar-lab/src/avatar2DRenderer.ts` (L186-195)

---

### MM3-A10: RENDER ORCHESTRATOR COMPOSITION BOUNDARY NOT CLEAR

**Severity:** P1 - identity + performance composition path undefined

**Discovery:** No code implements the composition of ResolvedRendererProfile + PerformanceFrame → Avatar2DRenderer.

**Current State:**
- mm1b1AddonEntry: Direct renderer instantiation (L82)
- orchestrator.ts: Creates performance plan but doesn't wire to renderer
- client.ts: Handles WebSocket but no renderer connection
- FamilyLocal2DAvatarGateway: Only emits events, doesn't render

**Missing:** Client-side RenderOrchestrator that:
```
ResolvedRendererProfile ────┐
                             ├──→ RenderOrchestrator ──→ Avatar2DRenderer ──→ pixels
PerformanceFrame ───────────┘
```

**Should Be:**
```ts
interface RenderOrchestrator {
  applyPerformance(frame: PerformanceFrame): void;
  applyViseme(shape: FamilyMouthShape): void;
  triggerBlink(): void;
  triggerNod(): void;
}

// Usage:
renderOrch.applyPerformance(frame);  // atomic, identity-preserving
renderOrch.applyViseme('OPEN_SMALL');  // micro-animation
```

**Files to Create:**
- `products/famili-principal/apps/avatar-lab/src/renderOrchestrator.ts` (NEW)

**Files to Modify:**
- `products/famili-principal/apps/avatar-lab/src/client.ts` (wire WebSocket → orchestrator)
- `products/famili-principal/apps/avatar-lab/src/mm1b1AddonEntry.ts` (update demo)

---

## SUMMARY TABLE

| Finding | Severity | Status | Files | Est. Effort |
|---------|----------|--------|-------|------------|
| MM3-A01: Invalid Expression Values | P1 | BLOCKING | 4 files | 2h |
| MM3-A02: PerformanceIntent undefined | P1 | BLOCKING | 3 files | 3h |
| MM3-A03: PerformanceFrame undefined | P1 | BLOCKING | 4 files | 2h |
| MM3-A04: Uncoordinated Performance | P1 | BLOCKING | 3 files | 2h |
| MM3-A05: Direct Setter Audit | P1 | BLOCKING | 3 files | 1h |
| MM3-A06: Identity Immutability Test | P2 | LOW | 1 file | 1h |
| MM3-A07: Performance Rendering | P2 | PARTIAL | 1 file | 2h |
| MM3-A08: Mouth Shape Classification | P2 | UNCLEAR | 3 files | 1h |
| MM3-A09: Blink/Nod Classification | P2 | UNCLEAR | 1 file | 0.5h |
| MM3-A10: Orchestrator Boundary | P1 | MISSING | 3 files | 4h |

**Total Blocking Issues:** 6 P1 (must resolve before implementation)  
**Total Non-Blocking:** 4 P2 (clarify before tests)  
**Estimated Implementation Time:** 16-18h

---

## NEXT STEPS

1. **User Decision Required:** Fix MM3-A01-A05 first (expression types, intent, frame, atomic apply, direct setters)
2. **Architecture Alignment:** Confirm PerformanceIntent vocabulary with Principal team
3. **Implementation Order:**
   - Fix expression types canonically (MM3-A01)
   - Define PerformanceIntent (MM3-A02)
   - Refine PerformanceFrame type (MM3-A03)
   - Add atomic apply method (MM3-A04)
   - Audit and classify direct setters (MM3-A05)
   - Create RenderOrchestrator (MM3-A10)
   - Add tests (MM3-A06, A07)
   - Clarify classifications (MM3-A08, A09)

