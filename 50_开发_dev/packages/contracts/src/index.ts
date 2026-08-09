/**
 * @family/contracts — 共享类型与枚举(实现级契约的 TS 落地起点)。
 * 权威来源:../../specs/ontology/*.schema.yaml 与 ../../database/schema_v0_1.sql。
 * 后续可由 specs 自动生成;此处先手工承载 M1 Family Core 所需最小集合。
 */

export type FamilyStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type PersonType = 'PARENT' | 'CHILD';
export type ParentRole = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER_GUARDIAN';
export type RelationshipType =
  | 'PARENT_CHILD'
  | 'SPOUSE'
  | 'SIBLING'
  | 'GUARDIAN_CHILD'
  | 'OTHER';
export type LifeStageCode = 'EARLY_ADOLESCENCE_12_15';
export type ConsentPurpose =
  | 'SERVICE'
  | 'ASSESSMENT'
  | 'AI_PERSONALIZATION'
  | 'GROWTH_TRACKING'
  | 'EXPERT_SERVICE'
  | 'RESEARCH'
  | 'MODEL_IMPROVEMENT'
  | 'CONTENT_PUBLICATION';
export type ConsentStatus = 'GRANTED' | 'WITHDRAWN' | 'EXPIRED';
export type GrowthDomain = 'CHILD' | 'PARENT' | 'RELATIONSHIP';

/** 审计元数据:每个关键写 Action 必带(CLAUDE C06)。 */
export interface AuditMeta {
  actor: string;
  correlationId: string;
  source: string;
  occurredAt: string;
}

export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
  time: string;
}
