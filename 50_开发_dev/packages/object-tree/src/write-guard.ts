/**
 * 统一 WriteGuard — M3-RB-003 运行时底座 P1 的核心新增价值。
 * 把「零散 DB CHECK + 代码纪律」收敛成一处【声明式强制】:依据 Object-Skill 声明判定某次写入是否合法。
 * 规范:ATTRIBUTE_TREE_STANDARD_V1 §3/§6 + STATE_ACTION_MATRIX_V1(allowed_named_actions 来源)。
 *
 * 冻结不变量(FAIL CLOSED):
 *   1. AI_INFERENCE / PROPOSAL 声明属性 = 视图,永不可写 canonical。
 *   2. mutability=named_action_only 的属性,只能在其对象 allowed_named_actions 内被写;
 *      无 Named Action 上下文(如 AI/自由文本直写)一律拒绝。
 *   3. 未声明属性拒绝(不认识就不放行)。
 */
import type { ObjectSkill } from '@family/principal-runtime';

export class WriteGuardError extends Error {
  constructor(message: string) { super(message); this.name = 'WriteGuardError'; }
}

export interface WriteAttempt {
  attribute: string;
  /** 触发写入的 Named Action;null = 非 Named Action 上下文(AI/直写)。 */
  namedAction: string | null;
}

/**
 * 断言一次对 canonical 属性的写入合法,否则抛 WriteGuardError。
 * 与 Named Action 服务里既有的命令式守卫(权限/幂等/consent)【互补】,不替代。
 */
export function assertNamedActionWrite(skill: ObjectSkill, attempt: WriteAttempt): void {
  const decl = skill.attributes.find((a) => a.name === attempt.attribute);
  if (!decl) {
    throw new WriteGuardError(`unknown attribute ${skill.object_id}.${attempt.attribute} (not declared in Object-Skill)`);
  }
  if (decl.truth_type === 'AI_INFERENCE' || decl.truth_type === 'PROPOSAL') {
    throw new WriteGuardError(`${decl.truth_type} ${skill.object_id}.${attempt.attribute} is a view; cannot write canonical (AI_INFERENCE!=FACT, PROPOSAL!=ACTION)`);
  }
  if (decl.mutability === 'named_action_only') {
    if (!attempt.namedAction) {
      throw new WriteGuardError(`${skill.object_id}.${attempt.attribute} is named_action_only; direct/AI write forbidden (no Named Action)`);
    }
    const allowed = skill.allowed_named_actions ?? [];
    if (!allowed.includes(attempt.namedAction)) {
      throw new WriteGuardError(`Named Action '${attempt.namedAction}' not allowed to write ${skill.object_id}.${attempt.attribute} (allowed: ${allowed.join(', ') || 'none'})`);
    }
  }
  // mutability='system' → 系统可写(如时间戳),不要求 Named Action。
}

/** 便捷:注册表版本——从 registry 取对象声明再断言。 */
export function assertWriteWithRegistry(
  getObject: (id: string) => ObjectSkill | undefined,
  objectId: string,
  attempt: WriteAttempt,
): void {
  const skill = getObject(objectId);
  if (!skill) throw new WriteGuardError(`object_skill not registered: ${objectId} (FAIL CLOSED)`);
  assertNamedActionWrite(skill, attempt);
}
