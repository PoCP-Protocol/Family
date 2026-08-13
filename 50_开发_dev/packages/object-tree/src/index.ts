/**
 * @family/object-tree — M3-RB-003 运行时底座 P1。
 * 把「对象宇宙 + 属性树 + Skill」从文档变成运行时:声明装载(复用 skill.ts)+ 属性树投影 + 统一写护卫。
 * 边界(ATTRIBUTE_TREE_STANDARD_V1 §7):投影+护卫层,非通用图数据库;不写 canonical、不自增授权。
 * 蓝图:architecture/rb-003/FAMILY_OBJECT_RUNTIME_BLUEPRINT_V1.md
 */

// 复用 skill.ts 运行时原语(声明校验/注册表/能力分发)——不重造。
export {
  validateSkill, SkillRegistry, SkillRuntime, SkillValidationError,
} from '@family/principal-runtime';
export type {
  TruthType, Mutability, CapabilityClass, ObjectAttributeDecl,
  ObjectSkill, CapabilitySkill, SkillDecl,
} from '@family/principal-runtime';

export * from './attribute-tree';
export * from './write-guard';
export * from './objects';

import { SkillRegistry } from '@family/principal-runtime';
import { SEED_OBJECT_SKILLS } from './objects';
import type { ObjectTreeSkill } from './attribute-tree';

/** 建一个已装载 seed 对象声明的注册表(每条经 validateSkill 治理校验;非法声明 FAIL CLOSED)。 */
export function createSeededRegistry(extra: ObjectTreeSkill[] = []): SkillRegistry {
  const registry = new SkillRegistry();
  for (const skill of [...SEED_OBJECT_SKILLS, ...extra]) registry.register(skill);
  return registry;
}
