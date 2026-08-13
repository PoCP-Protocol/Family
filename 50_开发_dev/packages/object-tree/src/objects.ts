/**
 * Seed Object-Skill 声明 — M3-RB-003 运行时底座 P1。
 * 忠实映射既有 canonical schema(database/migrations 0001/0003/0008/0011)与
 * FAMILY_OBJECT_STATE_ACTION_MATRIX_V1 的 allowed_named_actions;不臆造属性。
 *
 * 注:这是"种子",非世界全集(ATTRIBUTE_TREE_STANDARD_V1 §0:开放可扩展)。
 * canonical FACT 的 owner 只能是对应 canonical 模块;AI 视图属性 owner=Principal 且 ai_view_readonly。
 */
import type { ObjectTreeSkill } from './attribute-tree';

/** Child(Person)——多源:FamilyCore 事实 + GrowthOS 视图 + Principal AI 视图。 */
export const CHILD_SKILL: ObjectTreeSkill = {
  kind: 'object_skill',
  object_id: 'Child',
  owner: 'FamilyCore',
  allowed_named_actions: ['AddChild', 'AssignLifeStage'],
  attributes: [
    { name: 'person_id', type: 'uuid', truth_type: 'FACT', owner: 'FamilyCore', mutability: 'named_action_only', partition: 'Identity', source: 'persons' },
    { name: 'display_name', type: 'string', truth_type: 'FACT', owner: 'FamilyCore', mutability: 'named_action_only', partition: 'Core', source: 'persons', sensitivity: 'FAMILY_PRIVATE' },
    { name: 'life_stage', type: 'string', truth_type: 'FACT', owner: 'FamilyCore', mutability: 'named_action_only', partition: 'State', source: 'life_stage_assignments', provenance: 'assigned_by_named_action_not_derived_from_birth_date' },
    // Growth 视图(GrowthOS 事实,读投影用;写仍由 GrowthOS 各自对象的 Named Action)
    { name: 'confirmed_priority', type: 'string[]', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Growth', source: 'growth_priorities' },
    { name: 'active_intervention', type: 'string[]', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Growth', source: 'intervention_episodes' },
    { name: 'recent_action_state', type: 'string[]', truth_type: 'OBSERVATION', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Growth', source: 'growth_actions' },
    // Principal AI 视图(非 canonical,只读)
    { name: 'recent_understanding', type: 'PrincipalUnderstandingV1', truth_type: 'AI_INFERENCE', owner: 'Principal', mutability: 'ai_view_readonly', partition: 'Principal', source: 'principal_responses', provenance: 'model_inference_not_fact' },
    // Governance
    { name: 'consent', type: 'ConsentState', truth_type: 'FACT', owner: 'FamilyCore', mutability: 'named_action_only', partition: 'Governance', source: 'consents' },
  ],
};

/** GrowthPriority(GrowthOS)。 */
export const GROWTH_PRIORITY_SKILL: ObjectTreeSkill = {
  kind: 'object_skill',
  object_id: 'GrowthPriority',
  owner: 'GrowthOS',
  allowed_named_actions: ['ConfirmGrowthPriority'],
  attributes: [
    { name: 'priority_id', type: 'uuid', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Identity', source: 'growth_priorities' },
    { name: 'dimension_id', type: 'string', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Core', source: 'growth_priorities' },
    { name: 'status', type: 'string', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'State', source: 'growth_priorities', provenance: 'ACTIVE|SUPERSEDED; rank=1 unique ACTIVE' },
  ],
};

/** InterventionEpisode(GrowthOS)。 */
export const INTERVENTION_EPISODE_SKILL: ObjectTreeSkill = {
  kind: 'object_skill',
  object_id: 'InterventionEpisode',
  owner: 'GrowthOS',
  allowed_named_actions: ['StartIntervention'],
  attributes: [
    { name: 'episode_id', type: 'uuid', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Identity', source: 'intervention_episodes' },
    { name: 'intervention_code', type: 'string', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Core', source: 'intervention_episodes' },
    { name: 'status', type: 'string', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'State', source: 'intervention_episodes', provenance: 'ACTIVE|COMPLETED|CANCELLED' },
  ],
};

/** GrowthAction(GrowthOS)。ACTION_IS_NOT_OUTCOME. */
export const GROWTH_ACTION_SKILL: ObjectTreeSkill = {
  kind: 'object_skill',
  object_id: 'GrowthAction',
  owner: 'GrowthOS',
  allowed_named_actions: ['CompleteGrowthAction'],
  attributes: [
    { name: 'action_id', type: 'uuid', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Identity', source: 'growth_actions' },
    { name: 'status', type: 'string', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'State', source: 'growth_actions', provenance: 'ASSIGNED|PENDING|COMPLETED|PARTIAL|NOT_COMPLETED' },
    // reflection 是原始质料,非 outcome —— 声明为 SELF_REPORT,不可当事实/结果
    { name: 'reflection', type: 'string', truth_type: 'SELF_REPORT', owner: 'GrowthOS', mutability: 'named_action_only', partition: 'Core', source: 'growth_actions', provenance: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME', sensitivity: 'FAMILY_PRIVATE' },
  ],
};

/** PrincipalActionProposal(Principal,canonical=false)——PROPOSAL 视图。 */
export const PRINCIPAL_PROPOSAL_SKILL: ObjectTreeSkill = {
  kind: 'object_skill',
  object_id: 'PrincipalActionProposal',
  owner: 'Principal',
  allowed_named_actions: [], // 无 canonical 写;accept 走 StartIntervention
  attributes: [
    { name: 'proposal_id', type: 'uuid', truth_type: 'DERIVED', owner: 'Principal', mutability: 'system', partition: 'Identity', source: 'principal_action_proposals' },
    { name: 'recommended_intervention_id', type: 'string', truth_type: 'PROPOSAL', owner: 'Principal', mutability: 'ai_view_readonly', partition: 'Principal', source: 'principal_action_proposals', provenance: 'canonical=false; AI_PROPOSAL!=GROWTH_ACTION' },
  ],
};

export const SEED_OBJECT_SKILLS: ObjectTreeSkill[] = [
  CHILD_SKILL, GROWTH_PRIORITY_SKILL, INTERVENTION_EPISODE_SKILL, GROWTH_ACTION_SKILL, PRINCIPAL_PROPOSAL_SKILL,
];
