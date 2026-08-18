# MM3 IMPLEMENTATION PLAN
## Multimodal Performance Runtime — Expression Alignment & Architecture Build

**Date:** 2026-08-18  
**Status:** IN PROGRESS  
**Guided by:** User MM3 Architecture Specification (26 Principles, 36 Acceptance Criteria)

---

## PHASE 1: EXPRESSION DOMAIN MODEL CLARIFICATION

### MM3-A01 RESOLUTION: Expression Type Hierarchy

**Current State:**
- `CharacterExpression` (contracts): 8 values, semantic layer
- `FamilyExpression` (avatar2DRenderer): 5 values, 2D implementation layer
- **Problem:** Test expects `ATTENTIVE` (doesn't exist in either)

**Canonical CharacterExpression** (Semantic/Renderer-Neutral):
```
NEUTRAL_WARM
LISTENING
THINKING
SOFT_ENCOURAGING
WARM_FIRM
CALM_SERIOUS
CONCERNED_CALM
BOUNDARY_CLEAR
```

**FamilyExpression** (2D Renderer Implementation):
```
CALM_WARM           // General warmth/openness
CALM_SERIOUS        // Seriousness/concern
GENTLE_ENCOURAGING  // Encouragement
CALM_CAUTIOUS       // Caution
WARM_FIRM           // Firmness with warmth
```

**Mapping Analysis** (Current Usage Context):

From performancePlanner.ts planner output:
- Line 26: Risk NORMAL → avatar.expression = 'LISTENING'
- Line 37: Risk REVIEW → avatar.expression = 'LISTENING'  
- Line 46: Risk REVIEW → avatar.expression = 'LISTENING'
- Line 66: Risk NORMAL → avatar.expression = 'LISTENING'

Current usage shows planner outputs 'LISTENING' but test expects 'ATTENTIVE'.

**Decision on ATTENTIVE:**
- 'ATTENTIVE' is NOT in CharacterExpression
- 'LISTENING' IS in CharacterExpression and is semantically equivalent to "actively listening/attending"
- Test MM3-A01-U01 incorrectly expects 'ATTENTIVE'
- **Resolution:** Update test to expect 'LISTENING' (correct canonical value)

**Proposed Exhaustive Mapping:**

| CharacterExpression | Semantic Meaning | FamilyExpression | Rationale |
|---|---|---|---|
| NEUTRAL_WARM | Base state, calm receptiveness | CALM_WARM | Default warm posture |
| LISTENING | Active listening, full attention | CALM_WARM | Open, receptive, engaged |
| THINKING | Processing/consideration | CALM_WARM | Thoughtful, open posture |
| SOFT_ENCOURAGING | Gentle positive reinforcement | GENTLE_ENCOURAGING | Direct mapping |
| WARM_FIRM | Kind but clear boundary | WARM_FIRM | Direct mapping |
| CALM_SERIOUS | Serious/important matter | CALM_SERIOUS | Direct mapping |
| CONCERNED_CALM | Empathy with concern | CALM_SERIOUS | Seriousness + empathy |
| BOUNDARY_CLEAR | Clear boundary setting | CALM_SERIOUS | Serious, authoritative |

**Implementation Notes:**
- No 1:1 mapping required (multiple CharacterExpression can map to same FamilyExpression)
- Mapping is exhaustive (every CharacterExpression has a target)
- Mapping respects semantic intent
- Adapter validates exhaustiveness at compile time (never silent fallback)

---

## PHASE 2: PERFORMANCEINTENT DEFINITION

### MM3-A02 RESOLUTION: Semantic Intent Contract

**Purpose:** Bridge Principal AI semantic understanding to renderer-neutral performance expression.

**Discovery Process:**

Analyzing current Principal + Planner behavior:

1. **Principal outputs (key semantic fields):**
   - `risk_route`: 'NORMAL' | 'REVIEW' | 'HIGH_RISK'
   - `boundary`: String describing hard limits
   - `say_it_tonight`: Core message
   - `one_small_action`: Micro-goal
   - `what_i_hear`: Active listening reflection

2. **Planner behavior (current logic):**
   - HIGH_RISK → CALM_SERIOUS tone + CALM_SERIOUS expression + SERIOUS subtitle
   - REVIEW → CALM_CAUTIOUS tone + LISTENING expression + NORMAL subtitle
   - NORMAL → CALM_WARM tone + LISTENING expression + NORMAL subtitle + emphasis from one_small_action

**Extracted PerformanceIntent Vocabulary:**

The minimum semantic intent set Famili actually uses currently:

```typescript
export type PerformanceIntent =
  | 'ATTEND'              // Actively listening (NORMAL/REVIEW default)
  | 'RESPOND_WARM'        // Responding with warmth + encouragement
  | 'RESPOND_SERIOUSLY'   // Responding to serious/concerning topic
  | 'SET_BOUNDARY'        // Establishing/maintaining boundary
  | 'PROVIDE_GUIDANCE';   // Offering one_small_action guidance
```

**Mapping from Principal States:**

```
risk_route = 'NORMAL' + say_it_tonight = guidance
  → PerformanceIntent = 'PROVIDE_GUIDANCE'

risk_route = 'NORMAL' + what_i_hear = present
  → PerformanceIntent = 'ATTEND'

risk_route = 'REVIEW'
  → PerformanceIntent = 'RESPOND_SERIOUSLY'

risk_route = 'HIGH_RISK'
  → (no performance plan generated, HUMAN_GATE instead)

risk_route = 'NORMAL' + boundary = present
  → PerformanceIntent = 'SET_BOUNDARY'
```

**File Location:** `packages/fpai-multimodal-contracts/src/performanceIntent.ts` (NEW)

```typescript
/**
 * PerformanceIntent — Semantic performance expression
 * 
 * Answers: "What does Famili intend to communicate through embodiment?"
 * 
 * Renderer-neutral semantic layer between Principal cognition and frame rendering.
 * Does NOT contain:
 * - eye geometry
 * - mouth configuration
 * - canvas colors
 * - pixel position
 * - animation frame numbers
 * - identity information
 */

export type PerformanceIntent =
  | 'ATTEND'              // Actively listen, receive, understand
  | 'RESPOND_WARM'        // Respond with warmth and encouragement
  | 'RESPOND_SERIOUSLY'   // Respond to serious/concerning situation
  | 'SET_BOUNDARY'        // Establish or maintain clear boundary
  | 'PROVIDE_GUIDANCE';   // Offer direction or micro-action

export interface PerformanceIntentContext {
  intent: PerformanceIntent;
  // Optional semantic context for future extensions
  intensity?: number; // 0.0 to 1.0
  urgency?: 'low' | 'medium' | 'high';
}

export function derivePerformanceIntent(output: PrincipalAiOutput): PerformanceIntent {
  const hasBoundary = (output.boundary ?? '').trim().length > 0;
  const hasGuidance = (output.one_small_action ?? '').trim().length > 0;

  if (output.risk_route === 'REVIEW' || output.risk_route === 'HIGH_RISK') {
    return 'RESPOND_SERIOUSLY';
  }

  if (hasBoundary) {
    return 'SET_BOUNDARY';
  }

  if (hasGuidance) {
    return 'PROVIDE_GUIDANCE';
  }

  return 'ATTEND';
}
```

---

## PHASE 3: PERFORMANCEFRAME DEFINITION

### MM3-A03 RESOLUTION: Authoritative Frame Contract

**Current State:**
- `AvatarPerformancePlan` in contracts/index.ts (untyped fields)
- Planner outputs anonymous { speech, avatar, visual }
- No immutability guarantee
- No coherence validation

**Decision:** Promote AvatarPerformancePlan → PerformanceFrame with stronger typing.

**New Contract Location:** `packages/fpai-multimodal-contracts/src/characterIdentity.ts`

Replace existing AvatarPerformancePlan with:

```typescript
/**
 * PerformanceFrame — Complete immutable performance snapshot
 * 
 * One coherent rendering target combining:
 * - Semantic expression
 * - Intended gesture
 * - Gaze direction
 * - Posture
 * - Speech activity state
 * 
 * Immutable per snapshot (but successive frames may differ).
 * Renderer-neutral (can be implemented by 2D, 3D, video, or other renderers).
 * Identity-free (identity is separate concern, determined at composition layer).
 */

export interface PerformanceFrame {
  readonly expression: CharacterExpression['expression_id'];
  readonly gesture: CharacterGesture['gesture_id'];
  readonly gaze: 'USER' | 'SOFT_DOWN_THINKING' | 'RETURN_USER' | 'AWAY' | 'STABLE';
  readonly posture: 'RELAXED' | 'STEADY' | 'FORWARD';
  readonly speech_activity: 'SILENT' | 'SPEAKING';
}

/**
 * Legacy alias for backwards compatibility during migration.
 * To be deprecated once orchestrator fully migrated to PerformanceFrame.
 * 
 * @deprecated Use PerformanceFrame directly
 */
export type AvatarPerformancePlan = PerformanceFrame;
```

**Key Changes:**
1. Renamed from AvatarPerformancePlan to PerformanceFrame (clearer semantic intent)
2. Typed `expression` as `CharacterExpression['expression_id']` (compiler enforces valid values)
3. Typed `gesture` as `CharacterGesture['gesture_id']` (compiler enforces valid values)
4. All fields readonly (immutability per instance)
5. Added `speech_activity` to replace ambiguous mouthShape (semantic only: SILENT | SPEAKING)
6. Removed identity fields, removed pixel geometry, removed animation fields
7. Added JSDoc explaining renderer-neutral contract

**Note on MouthShape:** See MM3-A08 below for classification. PerformanceFrame does NOT include detailed mouth geometry (that's viseme animation, not semantic performance).

---

## PHASE 4: FRAME COHERENCE VALIDATION

### Setup: Frame Validator

**File:** `packages/fpai-multimodal-runtime/src/performanceFrameValidator.ts` (NEW)

```typescript
import type { PerformanceFrame } from '@family/fpai-multimodal-contracts';

/**
 * MM3-A04: Validates PerformanceFrame coherence
 * 
 * Ensures semantic consistency: expression + gesture + posture + speech_activity
 * form a logically coherent performance state, not impossible combinations.
 */

export function validatePerformanceFrame(frame: PerformanceFrame): { valid: boolean; reason?: string } {
  // Basic structure check
  if (!frame || typeof frame !== 'object') {
    return { valid: false, reason: 'PerformanceFrame is not an object' };
  }

  // Required fields present
  const required: (keyof PerformanceFrame)[] = ['expression', 'gesture', 'gaze', 'posture', 'speech_activity'];
  for (const field of required) {
    if (!(field in frame)) {
      return { valid: false, reason: `Missing required field: ${field}` };
    }
  }

  // Semantic coherence rules (minimal set, based on actual Famili semantics)

  // Rule 1: LISTENING should not actively SPEAK
  if (frame.expression === 'LISTENING' && frame.speech_activity === 'SPEAKING') {
    return { valid: false, reason: 'LISTENING expression inconsistent with SPEAKING activity' };
  }

  // Rule 2: THINKING should not aggressively speak
  if (frame.expression === 'THINKING' && frame.speech_activity === 'SPEAKING') {
    // THINKING can SPEAK (thinking out loud is valid), but pair with appropriate gesture
    if (frame.gesture === 'NONE' || frame.gesture === 'SMALL_NOD') {
      // OK: thoughtful speech
    } else if (frame.gesture === 'DOUBLE_SMALL_NOD' || frame.gesture === 'SLIGHT_LEAN_IN') {
      // OK: engaged thoughtful speech
    }
  }

  // Rule 3: BOUNDARY_CLEAR requires serious posture
  if (frame.expression === 'BOUNDARY_CLEAR' && frame.posture === 'RELAXED') {
    return { valid: false, reason: 'BOUNDARY_CLEAR requires STEADY or FORWARD posture, not RELAXED' };
  }

  // Rule 4: SOFT_ENCOURAGING should not use aggressive gesture
  if (frame.expression === 'SOFT_ENCOURAGING' && frame.gesture === 'WARM_FIRM_GAZE') {
    return { valid: false, reason: 'SOFT_ENCOURAGING incompatible with WARM_FIRM_GAZE gesture' };
  }

  return { valid: true };
}

/**
 * Assert helper: throws if frame is incoherent
 */
export function assertPerformanceFrameCoherent(frame: PerformanceFrame): void {
  const result = validatePerformanceFrame(frame);
  if (!result.valid) {
    throw new Error(`PerformanceFrame coherence violation: ${result.reason}`);
  }
}
```

---

## PHASE 5: PERFORMANCEPLANNER REFACTORING

### Update PrincipalPerformancePlanner

**File:** `packages/fpai-performance-planner/src/performancePlanner.ts`

**New Signature:**
```typescript
import type { PerformanceIntent } from '@family/fpai-multimodal-contracts';

export class PrincipalPerformancePlanner {
  public plan(
    intent: PerformanceIntent,
    riskRoute: PrincipalSafetyRoute,
  ): PrincipalPerformancePlan {
    // ... implementation maps intent → frame
  }
}
```

**Key Changes:**
1. Accept `PerformanceIntent` instead of full `PrincipalAiOutput`
2. Keep riskRoute as context (some routes may modulate intensity)
3. Output remains `PrincipalPerformancePlan` (backward compat alias for PerformanceFrame)
4. Add type validation: ensure emitted expressions/gestures are canonical

**Updated Plan Logic:**

```typescript
if (intent === 'RESPOND_SERIOUSLY' || riskRoute === 'REVIEW') {
  return {
    speech: {
      pace: 'MEDIUM',
      tone: 'CALM_CAUTIOUS',
      pauses_ms: [300],
      emphasis: ['需要仔细考虑'],
    },
    avatar: {
      expression: 'CALM_SERIOUS',  // Must be CharacterExpression value
      gesture: 'SMALL_NOD',
      gaze: 'USER',
      posture: 'STEADY',
      speech_activity: 'SPEAKING',  // NEW
    },
    visual: {
      subtitle_mode: 'NORMAL',
      action_card: '...',
    },
  };
}

if (intent === 'SET_BOUNDARY') {
  return {
    speech: {
      pace: 'SLOW',
      tone: 'CALM_SERIOUS',
      pauses_ms: [400, 600],
      emphasis: ['这一点很重要'],
    },
    avatar: {
      expression: 'BOUNDARY_CLEAR',
      gesture: 'LISTENING_GAZE',  // Firm but respectful
      gaze: 'USER',
      posture: 'STEADY',
      speech_activity: 'SPEAKING',
    },
    visual: {
      subtitle_mode: 'SERIOUS',
      action_card: '...',
    },
  };
}

// Default: ATTEND / RESPOND_WARM
return {
  speech: {
    pace: 'MEDIUM',
    tone: 'CALM_WARM',
    pauses_ms: [250, 350],
    emphasis: ['...'],
  },
  avatar: {
    expression: 'LISTENING',  // Canonical not 'ATTENTIVE'
    gesture: 'SMALL_OPEN_HAND',
    gaze: 'USER',
    posture: 'RELAXED',
    speech_activity: 'SPEAKING',
  },
  visual: {
    subtitle_mode: 'NORMAL',
    action_card: '...',
  },
};
```

---

## PHASE 6: AVATAR2D EXPRESSION ADAPTER

### MM3-E: Expression Mapping with Exhaustiveness Check

**File:** `products/famili-principal/apps/avatar-lab/src/avatar2DExpressionAdapter.ts` (NEW)

```typescript
import type { CharacterExpression } from '@family/fpai-multimodal-contracts';
import type { FamilyExpression } from './avatar2DRenderer';

/**
 * Maps canonical CharacterExpression to Avatar2D FamilyExpression.
 * 
 * Exhaustiveness enforced at compile time:
 * If new CharacterExpression is added, this switch will fail to compile
 * until mapping is provided.
 */

function assertNever(x: never): never {
  throw new Error(`assertNever: unexpected value ${x}`);
}

export function mapCharacterExpressionToFamilyExpression(
  expr: CharacterExpression['expression_id'],
): FamilyExpression {
  switch (expr) {
    case 'NEUTRAL_WARM':
      return 'CALM_WARM';
    case 'LISTENING':
      return 'CALM_WARM';
    case 'THINKING':
      return 'CALM_WARM';
    case 'SOFT_ENCOURAGING':
      return 'GENTLE_ENCOURAGING';
    case 'WARM_FIRM':
      return 'WARM_FIRM';
    case 'CALM_SERIOUS':
      return 'CALM_SERIOUS';
    case 'CONCERNED_CALM':
      return 'CALM_SERIOUS';
    case 'BOUNDARY_CLEAR':
      return 'CALM_SERIOUS';
    default:
      // Compiler catches: if new expression_id is added to CharacterExpression,
      // this will fail at compile time until new case is added.
      return assertNever(expr);
  }
}

/**
 * Test helper: verify all CharacterExpression values have mapping
 */
export function verifyExpressionMappingComplete(): void {
  const allCharacterExpressions: CharacterExpression['expression_id'][] = [
    'NEUTRAL_WARM',
    'LISTENING',
    'THINKING',
    'SOFT_ENCOURAGING',
    'WARM_FIRM',
    'CALM_SERIOUS',
    'CONCERNED_CALM',
    'BOUNDARY_CLEAR',
  ];

  for (const expr of allCharacterExpressions) {
    const mapped = mapCharacterExpressionToFamilyExpression(expr);
    if (!mapped) {
      throw new Error(`Missing mapping for CharacterExpression: ${expr}`);
    }
  }
}
```

---

## PHASE 7: RENDER ORCHESTRATOR (Client-Side)

### MM3-A10: Composition Boundary

**File:** `products/famili-principal/apps/avatar-lab/src/renderOrchestrator.ts` (NEW)

```typescript
/**
 * RenderOrchestrator — Client-side composition boundary
 * 
 * Composes:
 * - ResolvedRendererProfile (WHO Famili is)
 * - PerformanceFrame (HOW Famili expresses herself)
 * → Avatar2DRenderer (pixels)
 * 
 * Responsibilities:
 * 1. Hold identity + renderer instance
 * 2. Validate and apply performance frames atomically
 * 3. Allow micro-animations (viseme, blink) as independent calls
 * 4. Preserve identity through performance changes
 * 
 * NOT responsible for:
 * - STT / TTS
 * - Principal cognition
 * - Performance planning
 * - WebSocket communication
 * - Canvas geometry
 */

import type { ResolvedRendererProfile, PerformanceFrame } from '@family/fpai-multimodal-contracts';
import { assertPerformanceFrameCoherent } from '@family/fpai-multimodal-runtime';
import { Avatar2DRenderer, type FamilyMouthShape } from './avatar2DRenderer';
import { mapCharacterExpressionToFamilyExpression } from './avatar2DExpressionAdapter';

export interface RenderOrchestratorOptions {
  canvas: CanvasLike;
  profile: ResolvedRendererProfile;
  now?: () => number;
}

export class RenderOrchestrator {
  private renderer: Avatar2DRenderer;
  private profile: ResolvedRendererProfile;

  public constructor(opts: RenderOrchestratorOptions) {
    this.profile = opts.profile;
    this.renderer = new Avatar2DRenderer({
      canvas: opts.canvas,
      profile: opts.profile,
      now: opts.now,
    });
  }

  /**
   * Apply complete performance frame atomically.
   * 
   * Validates coherence, updates ALL performance state at once,
   * prevents transient inconsistent states.
   */
  public applyPerformanceFrame(frame: PerformanceFrame): void {
    // Validate coherence first
    assertPerformanceFrameCoherent(frame);

    // Map canonical expression to renderer-specific expression
    const rendererExpression = mapCharacterExpressionToFamilyExpression(frame.expression);

    // Atomic state update (all at once, no intermediate states)
    this.renderer.setState(frame.gaze === 'USER' ? 'LISTENING' : 'THINKING'); // Simplified mapping
    this.renderer.setExpression(rendererExpression);
    this.renderer.setPosture(frame.posture);
    // speech_activity determines mouth state but doesn't directly set mouth shape
    // (mouth shape changes via viseme animation, not semantic state)
  }

  /**
   * Apply viseme mouth shape (micro-animation, independent from semantic frame)
   */
  public applyViseme(mouthShape: FamilyMouthShape): void {
    this.renderer.setMouthShape(mouthShape);
  }

  /**
   * Trigger blink (life animation, independent)
   */
  public triggerBlink(): void {
    this.renderer.triggerBlink();
  }

  /**
   * Trigger nod (semantic gesture if deliberate, or life animation if auto)
   */
  public triggerNod(): void {
    this.renderer.triggerNod();
  }

  /**
   * Render current frame to canvas
   */
  public render(): void {
    this.renderer.render();
  }

  /**
   * Get current snapshot
   */
  public snapshot(): object {
    return this.renderer.snapshot();
  }

  /**
   * Verify identity still valid (MM2 safety check)
   */
  public verifyIdentityIntegrity(): boolean {
    return this.profile === this.renderer.getProfile();
  }
}
```

---

## PHASE 8: CLIENT-SIDE WEBSOCKET INTEGRATION

### Update client.ts to Wire PerformanceFrame

**File:** `products/famili-principal/apps/avatar-lab/src/client.ts`

**Changes:**
1. Create RenderOrchestrator on LISTENING state
2. Subscribe to AVATAR_EVENT for EXPRESSION_CHANGED, GESTURE_CHANGED
3. When PERFORMANCE_PLAN arrives, construct PerformanceFrame and call renderOrch.applyPerformanceFrame()
4. When VISEME_CHANGED arrives, call renderOrch.applyViseme()

(Detailed code changes follow in implementation phase)

---

## PHASE 9: MOUTH SHAPE CLASSIFICATION (MM3-A08)

**Decision:**

```
PerformanceFrame semantic layer:
  speech_activity: 'SILENT' | 'SPEAKING'

Viseme/Phoneme layer (RENDERER-LOCAL):
  VisemeScheduler maps:
    audio offset + TTS prosody
      → viseme ID
      → FamilyMouthShape
      → renderer.setMouthShape(shape)

PerformanceFrame does NOT include:
  mouth_shape
  phoneme detail
  lip-sync timing
```

**Rationale:**
- Semantic performance ≠ phoneme animation
- Viseme is audio-driven timing detail
- PerformanceFrame is audio-agnostic
- Allows future viseme engines to plug in independently

---

## PHASE 10: BLINK/NOD CLASSIFICATION (MM3-A09)

**Decision:**

```
Blink:
  Type: RENDERER-LOCAL LIFE ANIMATION
  Reason: Auto-triggers every 3s independent of semantic intent
  Future: Can be randomized/rule-based by renderer itself
  PerformanceFrame: Does NOT include blink command

Nod:
  Type: MIXED (semantic gesture + life animation)
  Reason: Can be intentional (Principal expresses "I understand") or auto
  Current: Demo triggers nodding via setGesture/triggerNod() separately
  PerformanceFrame: Gesture field may include SMALL_NOD
  Implementation: If PerformanceFrame.gesture = SMALL_NOD, renderer executes nod
  Auto-nod: Renderer can also trigger independent "life nod" separate from semantic frame
```

---

## PHASE 11: DIRECT SETTER AUDIT (MM3-A05)

**Production Code Audit Result:**

| Location | Call | Classification | Reason |
|---|---|---|---|
| mm1b1AddonEntry.ts L106 | setState('RESTING') | DEMO-ONLY | Offline test gate initialization |
| mm1b1AddonEntry.ts L107 | setExpression('CALM_WARM') | DEMO-ONLY | Offline test gate initialization |
| mm1b1AddonEntry.ts L131 | setState('SPEAKING') | DEMO-ONLY | Fake TTS driver |
| mm1b1AddonEntry.ts L132 | triggerNod() | DEMO-ONLY | Fake TTS driver |
| mm1b1AddonEntry.ts L164 | setMouthShape('REST') | DEMO-ONLY | Fake TTS driver |
| mm1b1AddonEntry.ts L176 | setState('RESTING') | DEMO-ONLY | Interrupt demo |
| visemeScheduler.ts | setMouthShape() callback | RENDERER-LOCAL | Micro-animation, valid |

**Production Semantic Path:**
- **Before MM3:** None (orchestrator creates performance plan but doesn't wire to renderer)
- **After MM3:** ZERO direct setters; only applyPerformanceFrame()

---

## TESTS TO ADD

### MM3-P: Planner Tests
- MM3-P01: PerformanceIntent → valid PerformanceFrame
- MM3-P02: All emitted CharacterExpression values canonical
- MM3-P03: All emitted CharacterGesture values canonical
- MM3-P04: Invalid intent rejected
- MM3-P05: Deterministic mapping
- MM3-P06: No identity fields in frame
- MM3-P07: No pixel geometry in frame

### MM3-C: Coherence Tests
- MM3-C01: LISTENING intent → coherent frame
- MM3-C02: THINKING intent → coherent frame
- MM3-C03: RESPOND_WARM intent → coherent frame
- MM3-C04: RESPOND_SERIOUSLY intent → coherent frame
- MM3-C05: BOUNDARY_CLEAR intent → coherent frame

### MM3-E: Expression Mapping Tests
- MM3-E01: Every CharacterExpression has mapping
- MM3-E02: Mapping exhaustiveness verified
- MM3-E03: LISTENING → expected FamilyExpression
- MM3-E04: SOFT_ENCOURAGING → expected FamilyExpression
- MM3-E05: BOUNDARY_CLEAR → expected FamilyExpression

### MM3-O: Orchestration Tests
- MM3-O01: ResolvedRendererProfile + PerformanceFrame → renderer
- MM3-O02: Frame applied atomically
- MM3-O03: Successive frames update behavior
- MM3-O04: Identity instance preserved
- MM3-O05: WeakSet membership valid after changes
- MM3-O06: Invalid frame rejected
- MM3-O07: Identity style unchanged

### MM3-V: Render Effect Tests
- MM3-V01: Different expressions → different eye behavior
- MM3-V02: SPEAKING vs SILENT → different mouth behavior
- MM3-V03: Gesture → renderer behavior
- MM3-V04: Performance changes, identity style stable
- MM3-V05: Same identity + same frame → deterministic behavior

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Contracts & Types
- [ ] Create performanceIntent.ts with PerformanceIntent type
- [ ] Promote AvatarPerformancePlan to PerformanceFrame
- [ ] Strong-type expression and gesture fields
- [ ] Add speech_activity field
- [ ] Export all from index.ts

### Phase 2: Validation
- [ ] Create performanceFrameValidator.ts
- [ ] Implement validatePerformanceFrame()
- [ ] Implement assertPerformanceFrameCoherent()
- [ ] Write validator tests

### Phase 3: Planner Update
- [ ] Update PrincipalPerformancePlanner.plan() signature
- [ ] Refactor logic to use PerformanceIntent
- [ ] Update test expectations (LISTENING not ATTENTIVE)
- [ ] Add MM3-P tests

### Phase 4: Expression Adapter
- [ ] Create avatar2DExpressionAdapter.ts
- [ ] Implement mapCharacterExpressionToFamilyExpression()
- [ ] Use assertNever for exhaustiveness
- [ ] Write MM3-E tests

### Phase 5: Orchestrator
- [ ] Create renderOrchestrator.ts
- [ ] Implement RenderOrchestrator class
- [ ] Add applyPerformanceFrame() atomic method
- [ ] Keep micro-animation methods (viseme, blink, nod)
- [ ] Write MM3-O tests

### Phase 6: Avatar2D Updates
- [ ] Add setPosture() method (if needed)
- [ ] Verify identity preserved through all state changes
- [ ] Write MM3-V tests

### Phase 7: Client Integration
- [ ] Create RenderOrchestrator on first LISTENING
- [ ] Wire PERFORMANCE_PLAN → applyPerformanceFrame()
- [ ] Wire VISEME_CHANGED → applyViseme()
- [ ] Verify end-to-end flow

### Phase 8: MM2 Regression
- [ ] Run all existing Avatar2DRenderer tests
- [ ] Run all MM2 tests (MM2-P, MM2-R, MM2-I, MM2-V)
- [ ] Verify identity integrity tests pass

### Phase 9: Test Suite
- [ ] MM3-P01 through P07
- [ ] MM3-C01 through C05
- [ ] MM3-E01 through E05
- [ ] MM3-O01 through O07
- [ ] MM3-V01 through V05

### Phase 10: Documentation & Report
- [ ] Architecture diagram (current → final)
- [ ] Expression mapping table
- [ ] File change summary
- [ ] Commit message
- [ ] MM3 Closure Report (36-point checklist)

---

**Status:** Ready for implementation to begin with Phase 1.
