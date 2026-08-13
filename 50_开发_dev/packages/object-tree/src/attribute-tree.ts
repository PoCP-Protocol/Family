/**
 * AttributeTree 投影 — M3-RB-003 运行时底座 P1。
 * 把 Object-Skill 声明投影为「对象语义视图」(多源聚合 + 分区 + truth_type 标注)。
 * 规范:architecture/rb-003/FAMILY_OBJECT_ATTRIBUTE_TREE_STANDARD_V1.md(§1/§2/§5)。
 *
 * 边界(§7):这是【投影协议】,不是存储引擎/图数据库。数据仍在既有 canonical 表;
 * 本模块只按声明把值组织成带真相元数据的语义视图。AI_INFERENCE/PROPOSAL 分区为【视图只读、非 canonical】。
 */
import type { ObjectAttributeDecl, ObjectSkill, TruthType, Mutability } from '@family/principal-runtime';

/** 属性树分区(可扩展);对应 ATTRIBUTE_TREE_STANDARD_V1 §2 模板。 */
export type Partition =
  | 'Identity' | 'Classification' | 'Core' | 'Relations' | 'State'
  | 'Growth' | 'Principal' | 'Provenance' | 'Governance';

/** 视图型 truth_type:永远非 canonical,不可回流为可写事实。 */
const VIEW_TRUTH_TYPES: ReadonlySet<TruthType> = new Set<TruthType>(['AI_INFERENCE', 'PROPOSAL']);
export function isCanonicalTruth(t: TruthType): boolean { return !VIEW_TRUTH_TYPES.has(t); }

/** 在 skill.ts 的 ObjectAttributeDecl 之上补投影所需元数据(纯附加,不改 principal-runtime)。 */
export interface TreeAttributeDecl extends ObjectAttributeDecl {
  partition: Partition;
  source: string;                                        // 哪个 canonical/AI 来源
  provenance?: string;
  sensitivity?: 'PUBLIC' | 'FAMILY_PRIVATE' | 'MINOR_PRIVATE';
}

/** 富属性版 Object-Skill(结构上仍满足 ObjectSkill,可直接喂 validateSkill/registry)。 */
export interface ObjectTreeSkill extends ObjectSkill {
  attributes: TreeAttributeDecl[];
}

export interface ResolvedAttr {
  name: string;
  value: unknown;
  truth_type: TruthType;
  source: string;
  owner: string;
  mutability: Mutability;
  canonical: boolean;                                    // false = 视图(AI_INFERENCE/PROPOSAL)
  provenance?: string;
  sensitivity?: string;
}

export interface AttributeTreeView {
  object_id: string;
  partitions: Partial<Record<Partition, ResolvedAttr[]>>;
  /** 纯视图分区(其中含非 canonical 属性),便于消费方明确"这些不是事实"。 */
  nonCanonicalPartitions: Partition[];
}

/** 每个属性如何取值(从对应 canonical/AI 来源读)。 */
export type AttrResolver = (attr: TreeAttributeDecl) => unknown;

/**
 * 投影:遍历声明,按 partition 聚合出语义视图。
 * 多源聚合体现在 resolve 可从不同 source 取值;canonical 标记由 truth_type 决定。
 */
export function projectObject(skill: ObjectTreeSkill, resolve: AttrResolver): AttributeTreeView {
  const partitions: Partial<Record<Partition, ResolvedAttr[]>> = {};
  const nonCanonical = new Set<Partition>();
  for (const a of skill.attributes) {
    const canonical = isCanonicalTruth(a.truth_type);
    const resolved: ResolvedAttr = {
      name: a.name, value: resolve(a), truth_type: a.truth_type, source: a.source,
      owner: a.owner, mutability: a.mutability, canonical,
      provenance: a.provenance, sensitivity: a.sensitivity,
    };
    (partitions[a.partition] ??= []).push(resolved);
    if (!canonical) nonCanonical.add(a.partition);
  }
  return { object_id: skill.object_id, partitions, nonCanonicalPartitions: [...nonCanonical] };
}

/** 取某属性的已解析值(便捷)。 */
export function readAttr(view: AttributeTreeView, name: string): ResolvedAttr | undefined {
  for (const attrs of Object.values(view.partitions)) {
    const hit = attrs?.find((a) => a.name === name);
    if (hit) return hit;
  }
  return undefined;
}
