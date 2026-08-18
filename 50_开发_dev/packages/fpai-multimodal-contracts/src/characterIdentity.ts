/**
 * CharacterIdentity Contracts V1.0
 *
 * Provider-neutral contract for character identity layer.
 * Avatar renderer only responsible for PRESENTATION.
 * Cannot mutate Principal advice or Family ontology.
 *
 * MACHINE CONTRACT AUTHORITY for all FPAI-MM multimodal rendering.
 * Single source of truth: packages/fpai-multimodal-contracts/src/characterIdentity.ts
 */

/**
 * Character Identity Layer — immutable, provider-independent
 * Used by Avatar2DRenderer and any future avatar provider.
 */
export interface CharacterIdentity {
  readonly version: 'character_v1.0';
  readonly frozen_date: string; // ISO8601
  readonly character_name: '法咪莉校长';
  readonly persona: '知性邻家姐姐';
  readonly ownership: 'Family-owned IP';

  // Visual DNA (10 core attributes)
  readonly visual_dna: readonly [
    'INTELLECTUAL',
    'WARM',
    'TRUSTWORTHY',
    'NATURAL',
    'KIND',
    'CALM',
    'MATURE',
    'EMPATHETIC',
    'CULTURED',
    'NON_JUDGMENTAL'
  ];

  // Real-person alignment (zero cloning risk)
  readonly ip_alignment: {
    readonly bobo_method_inheritance: true;
    readonly bobo_identity_clone: false;
    readonly bobo_face_clone: false;
    readonly bobo_voice_clone: false;
    readonly real_person_likeness_clone: false;
  };
}

/**
 * Character Pose — immutable position/frame state
 * Avatar renderer reads pose and renders accordingly.
 */
export interface CharacterPose {
  readonly body_position: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  };
  readonly head_rotation: {
    readonly pitch: number; // -30 to +30 degrees
    readonly yaw: number;   // -45 to +45 degrees
    readonly roll: number;  // -10 to +10 degrees
  };
  readonly posture: 'SEATED' | 'STANDING' | 'LEANED_IN';
  readonly frame_index: number;
}

/**
 * Character Expression — selected from frozen expression identity map
 * Cannot be mutated by avatar renderer or arbitrary sources.
 */
export interface CharacterExpression {
  readonly expression_id:
    | 'NEUTRAL_WARM'
    | 'LISTENING'
    | 'THINKING'
    | 'SOFT_ENCOURAGING'
    | 'WARM_FIRM'
    | 'CALM_SERIOUS'
    | 'CONCERNED_CALM'
    | 'BOUNDARY_CLEAR';
  readonly transition_duration_ms: number;
  readonly intensity: number; // 0.0 to 1.0
  readonly mouth_shape:
    | 'REST'
    | 'OPEN_SMALL'
    | 'OPEN_MEDIUM'
    | 'OPEN_WIDE'
    | 'ROUND'
    | 'NARROW'
    | 'SMILE_SPEECH'
    | 'CLOSED';
}

/**
 * Character Gaze — where avatar is looking
 * Must respect gaze-policy.yaml rules
 */
export interface CharacterGaze {
  readonly gaze_policy:
    | 'LISTENING'
    | 'THINKING'
    | 'EXPLAINING'
    | 'BOUNDARY'
    | 'ENCOURAGING'
    | 'CURIOUS';
  readonly gaze_direction: {
    readonly x: number;  // -1 to +1 (lateral)
    readonly y: number;  // -1 to +1 (vertical)
    readonly z: number;  // forward
  };
  readonly intensity: number; // 0.0 (soft) to 1.0 (direct)
  readonly blink_phase: number; // 0.0 to 1.0 (1.0 = fully closed)
}

/**
 * Character Gesture — selected from frozen motion identity map
 * Avatar renderer plays animation, does not create new gestures.
 */
export interface CharacterGesture {
  readonly gesture_id:
    | 'NONE'
    | 'SMALL_NOD'
    | 'DOUBLE_SMALL_NOD'
    | 'SLIGHT_LEAN_IN'
    | 'THINKING_PAUSE'
    | 'SOFT_SMILE'
    | 'CALM_SERIOUS'
    | 'WARM_FIRM_GAZE'
    | 'LISTENING_GAZE'
    | 'GENTLE_HEAD_TILT'
    | 'RETURN_TO_NEUTRAL';
  readonly duration_ms: number;
  readonly phase: number; // 0.0 to 1.0 (animation progress)
}

/**
 * Character Wardrobe — selected from frozen wardrobe policy
 * Avatar renderer applies textures, does not design clothing.
 */
export interface CharacterWardrobe {
  readonly look_id: 'LOOK_A_COMPANION' | 'LOOK_B_PRINCIPAL' | 'LOOK_C_WARM_EVENING';
  readonly primary_color: string; // Hex color from palette
  readonly secondary_color?: string;
  readonly material_hint: 'KNIT' | 'BLAZER' | 'SHIRT' | 'SWEATER';
}

/**
 * Character Scene — context for rendering (camera, lighting, background)
 * Avatar renderer applies scene grammar rules.
 */
export interface CharacterScene {
  readonly scene_id: 'SCENE_A_COMPANION' | 'SCENE_B_PRINCIPAL_EXPLAIN' | 'SCENE_C_TONIGHT_ACTION';
  readonly camera: {
    readonly distance: number; // meters equivalent
    readonly angle: number; // degrees above horizontal
    readonly framing: 'INTIMATE' | 'CONVERSATIONAL' | 'WIDE';
  };
  readonly lighting: {
    readonly key_temperature_k: number; // 3000-4000
    readonly fill_intensity: number; // 0.0 to 1.0
    readonly back_intensity: number; // 0.0 to 1.0
  };
  readonly background_style: 'HOME_LIKE' | 'EDUCATIONAL' | 'EVENING_WARM';
}

/**
 * Character State — complete snapshot at one moment
 * Immutable record, used for audit trail and reproducibility.
 */
export interface CharacterState {
  readonly timestamp_ms: number;
  readonly turn_id: string;
  readonly session_id: string;
  readonly identity: CharacterIdentity;
  readonly pose: CharacterPose;
  readonly expression: CharacterExpression;
  readonly gaze: CharacterGaze;
  readonly gesture: CharacterGesture;
  readonly wardrobe: CharacterWardrobe;
  readonly scene: CharacterScene;

  // Versioning for reproducibility
  readonly versions: {
    readonly visual_identity_version: string;
    readonly motion_identity_version: string;
    readonly expression_identity_version: string;
    readonly gaze_policy_version: string;
    readonly scene_grammar_version: string;
  };

  // Safety markers
  readonly principal_semantic_mutation: false; // Must always be false
  readonly family_direct_write_count: 0; // Must always be zero
  readonly avatar_originated_content: false; // Must always be false
}

/**
 * Avatar Renderer Contract
 *
 * WHAT AVATAR RENDERER MAY DO:
 * - Read CharacterState
 * - Render 2D mouth shapes based on viseme
 * - Apply expression blending
 * - Draw eyes, blinks, gaze
 * - Apply gesture animations
 * - Render wardrobe textures
 * - Apply scene lighting/camera
 *
 * WHAT AVATAR RENDERER MAY NOT DO:
 * ❌ Mutate Principal output
 * ❌ Generate new content
 * ❌ Write to Family ontology
 * ❌ Override Safety Gate
 * ❌ Invent new expressions/gestures
 * ❌ Modify CharacterState directly
 */
export interface AvatarRendererContract {
  readonly render: (state: CharacterState) => void;
  readonly state_mutation_forbidden: true;
  readonly principal_semantic_mutation_forbidden: true;
  readonly family_write_forbidden: true;
}

/**
 * RendererProfile — Immutable Renderer-Safe Identity Projection
 *
 * Derived from ResolvedCharacterIdentity.
 * NOT a separate SSOT — only a renderer-safe view.
 * Contains ONLY information needed for rendering canonical identity.
 * Does NOT contain performance state (expression, gesture, mouth shape).
 */
export interface RendererProfile {
  readonly character_id: string;
  readonly character_name: '法咪莉校长';
  readonly identity_version: string;
  readonly visual_identity_version: string;

  // Canonical asset references
  readonly canonical_face_asset_id?: string;
  readonly canonical_body_asset_id?: string;
  readonly canonical_portrait_asset_id?: string;

  // Identity constraints
  readonly approved_visual_variants?: readonly string[];
  readonly visual_constraints?: {
    readonly age_impression_min: number;
    readonly age_impression_max: number;
  };

  // Immutability marker
  readonly is_immutable: true;
}

/**
 * Type Guards
 */

export function isCharacterIdentity(obj: any): obj is CharacterIdentity {
  return (
    obj?.version === 'character_v1.0' &&
    obj?.character_name === '法咪莉校长' &&
    obj?.ip_alignment?.bobo_method_inheritance === true &&
    obj?.ip_alignment?.bobo_identity_clone === false &&
    obj?.ip_alignment?.bobo_face_clone === false &&
    obj?.ip_alignment?.bobo_voice_clone === false &&
    obj?.ip_alignment?.real_person_likeness_clone === false
  );
}

export function isCharacterStateValid(state: CharacterState): boolean {
  return (
    state.principal_semantic_mutation === false &&
    state.family_direct_write_count === 0 &&
    state.avatar_originated_content === false &&
    isCharacterIdentity(state.identity)
  );
}
