/**
 * M3-RB-003 最小真实 Skill 运行时(不是通用引擎)。
 * 让 Object-Skill / Capability-Skill 声明【真的能跑 + 被治理】,而非死文档。
 * 规范见 architecture/rb-003/FAMILY_SKILL_MODEL_V1.md。
 * 冻结不变量:Skill≠自授权;canonical FACT 只经 Named Action;guardrail 不可停用;
 *   REAL/MODEL 能力非 guardrail 时必须带 authorization_ref,运行由外部授权判定(FAIL CLOSED)。
 */

export type TruthType = 'FACT' | 'SELF_REPORT' | 'OBSERVATION' | 'DERIVED' | 'HYPOTHESIS' | 'AI_INFERENCE' | 'PROPOSAL';
export type CapabilityClass =
  | 'REAL_DOMAIN_CAPABILITY' | 'REAL_MODEL_INTELLIGENCE' | 'DETERMINISTIC_GUARDRAIL'
  | 'DETERMINISTIC_TEST_BASELINE' | 'SAFE_FALLBACK' | 'PROTOTYPE' | 'ADAPTER'
  | 'INTEGRATION_CANDIDATE' | 'NOT_IMPLEMENTED' | 'FUTURE';
export type Mutability = 'named_action_only' | 'ai_view_readonly' | 'system';

const CAPABILITY_CLASSES: ReadonlySet<CapabilityClass> = new Set([
  'REAL_DOMAIN_CAPABILITY', 'REAL_MODEL_INTELLIGENCE', 'DETERMINISTIC_GUARDRAIL', 'DETERMINISTIC_TEST_BASELINE',
  'SAFE_FALLBACK', 'PROTOTYPE', 'ADAPTER', 'INTEGRATION_CANDIDATE', 'NOT_IMPLEMENTED', 'FUTURE',
]);

export interface ObjectAttributeDecl { name: string; type: string; truth_type: TruthType; owner: string; mutability: Mutability; }
export interface ObjectSkill {
  kind: 'object_skill'; object_id: string; owner: string;
  attributes: ObjectAttributeDecl[]; relations?: string[]; allowed_named_actions?: string[];
}
export interface CapabilitySkill {
  kind: 'capability_skill'; capability_id: string; true_class: CapabilityClass;
  authorization_ref?: string; guardrail?: boolean;
}
export type SkillDecl = ObjectSkill | CapabilitySkill;

export class SkillValidationError extends Error { constructor(m: string) { super(m); this.name = 'SkillValidationError'; } }

/** 声明期治理校验(§3 边界)。 */
export function validateSkill(decl: SkillDecl): void {
  if (decl.kind === 'object_skill') {
    if (!decl.object_id || !decl.owner) throw new SkillValidationError('object_skill requires object_id + owner');
    for (const a of decl.attributes) {
      if (!a.truth_type || !a.owner) throw new SkillValidationError(`attribute ${a.name} requires truth_type + owner`);
      if (a.truth_type === 'FACT' && a.mutability !== 'named_action_only') {
        throw new SkillValidationError(`canonical FACT ${a.name} must be mutability=named_action_only (no direct/AI write)`);
      }
      if ((a.truth_type === 'AI_INFERENCE' || a.truth_type === 'PROPOSAL') && a.mutability === 'named_action_only') {
        throw new SkillValidationError(`${a.truth_type} ${a.name} is a view, cannot be named_action canonical`);
      }
    }
    return;
  }
  if (decl.kind === 'capability_skill') {
    if (!decl.capability_id) throw new SkillValidationError('capability_skill requires capability_id');
    if (!CAPABILITY_CLASSES.has(decl.true_class)) throw new SkillValidationError(`unknown true_class ${decl.true_class}`);
    const needsAuth = !decl.guardrail && (decl.true_class === 'REAL_MODEL_INTELLIGENCE' || decl.true_class === 'REAL_DOMAIN_CAPABILITY');
    if (needsAuth && !decl.authorization_ref) {
      throw new SkillValidationError(`${decl.true_class} ${decl.capability_id} must declare authorization_ref (no self-authorization)`);
    }
    return;
  }
  throw new SkillValidationError('unknown skill kind');
}

export class SkillRegistry {
  private readonly objects = new Map<string, ObjectSkill>();
  private readonly caps = new Map<string, CapabilitySkill>();
  register(decl: SkillDecl): void {
    validateSkill(decl);
    if (decl.kind === 'object_skill') this.objects.set(decl.object_id, decl);
    else this.caps.set(decl.capability_id, decl);
  }
  getObject(id: string): ObjectSkill | undefined { return this.objects.get(id); }
  getCapability(id: string): CapabilitySkill | undefined { return this.caps.get(id); }
  listObjects(): string[] { return [...this.objects.keys()]; }
  listCapabilities(): string[] { return [...this.caps.keys()]; }
}

export interface ResolvedAttr { name: string; value: unknown; truth_type: TruthType; owner: string; }

/** 授权判定(注入;真实实现读 AUTHORIZATION_REGISTRY)。 */
export type RuntimeAuthorized = (authorizationRef: string | undefined) => boolean;
/** 能力执行 handler(真能力住这里;可为生成式模型调用/护栏)。 */
export type CapabilityHandler = (input: unknown) => Promise<unknown> | unknown;

export class SkillRuntime {
  constructor(
    private readonly registry: SkillRegistry,
    private readonly authorized: RuntimeAuthorized,
    private readonly handlers: Map<string, CapabilityHandler> = new Map(),
  ) {}

  /** Object-Skill → 语义视图(属性带 truth_type);AI_INFERENCE/PROPOSAL 视图只读,不可作为可写事实返回。 */
  resolveObjectView(objectId: string, resolve: (attr: ObjectAttributeDecl) => unknown): { object_id: string; attributes: ResolvedAttr[] } {
    const skill = this.registry.getObject(objectId);
    if (!skill) throw new SkillValidationError(`object_skill not registered: ${objectId}`);
    return {
      object_id: objectId,
      attributes: skill.attributes.map((a) => ({ name: a.name, value: resolve(a), truth_type: a.truth_type, owner: a.owner })),
    };
  }

  /** 分发能力:guardrail 恒可运行;否则必须 runtime-authorized(authorization_ref),否则 FAIL CLOSED。 */
  async dispatchCapability(capabilityId: string, input: unknown): Promise<unknown> {
    const cap = this.registry.getCapability(capabilityId);
    if (!cap) throw new SkillValidationError(`capability_skill not registered: ${capabilityId}`);
    if (!cap.guardrail && !this.authorized(cap.authorization_ref)) {
      throw new SkillValidationError(`capability ${capabilityId} not runtime-authorized (FAIL CLOSED; ref=${cap.authorization_ref ?? 'none'})`);
    }
    const handler = this.handlers.get(capabilityId);
    if (!handler) throw new SkillValidationError(`capability ${capabilityId} has no handler (NOT_IMPLEMENTED)`);
    return handler(input);
  }
}
