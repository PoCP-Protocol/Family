/**
 * @family/principal-runtime — M3-101A Runtime Foundation（DB-free 纯逻辑)
 * A2 PrincipalConsentResolver / A3 PrincipalAiProcessingPolicy / A4 Typed Context Broker(含最小化)。
 * 不含 DB / HTTP / 模型调用;供未来 PrincipalModule(101A-B)复用。
 * 权威来源:Family Core canonical consents(consent_purpose / status)。不虚构字段。
 */

// ---------- 类型(来自 Family Core canonical consent 真实结构) ----------
export type ConsentPurpose =
  | 'SERVICE' | 'ASSESSMENT' | 'AI_PERSONALIZATION' | 'GROWTH_TRACKING'
  | 'EXPERT_SERVICE' | 'RESEARCH' | 'MODEL_IMPROVEMENT' | 'CONTENT_PUBLICATION';
export type ConsentStatus = 'GRANTED' | 'WITHDRAWN' | 'EXPIRED';

export interface CanonicalConsentRow {
  subject_person_id: string;
  guardian_person_id: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  policy_version: string;
}

export type ProviderClass = 'FAKE' | 'EXTERNAL_PROVIDER';

// ---------- A2 PrincipalConsentResolver ----------
export interface ConsentDecision {
  allowed: boolean;
  reason: string;
  matched?: CanonicalConsentRow;
}

/**
 * 个性化 Family Context 的唯一合法前置:purpose=AI_PERSONALIZATION 且 status=GRANTED。
 * 禁止把 SERVICE / GROWTH_TRACKING / ASSESSMENT 静默解释为 AI 授权。
 */
export function resolvePrincipalConsent(
  rows: readonly CanonicalConsentRow[],
  subjectPersonId: string,
): ConsentDecision {
  const forSubject = rows.filter((r) => r.subject_person_id === subjectPersonId);
  const match = forSubject.find(
    (r) => r.purpose === 'AI_PERSONALIZATION' && r.status === 'GRANTED',
  );
  if (match) return { allowed: true, reason: 'AI_PERSONALIZATION GRANTED', matched: match };
  const hasWithdrawnOrExpired = forSubject.some(
    (r) => r.purpose === 'AI_PERSONALIZATION' && (r.status === 'WITHDRAWN' || r.status === 'EXPIRED'),
  );
  if (hasWithdrawnOrExpired) {
    return { allowed: false, reason: 'AI_PERSONALIZATION not GRANTED (withdrawn/expired)' };
  }
  return { allowed: false, reason: 'no AI_PERSONALIZATION consent; 禁止由 SERVICE/GROWTH_TRACKING/ASSESSMENT 推导' };
}

// ---------- A3 PrincipalAiProcessingPolicy (M3-INT-001 §9-14 强化) ----------
// 数据类别:userMessage 本身即家庭私有文本,不得再当成"非 Family data"。
export type ProcessingDataCategory =
  | 'MINIMAL_GROWTH_CONTEXT'
  | 'USER_PROVIDED_TEXT'
  | 'FAMILY_PRIVATE_TEXT'
  | 'MINOR_PRIVATE_TEXT'
  | 'USER_PROVIDED_IMAGE'
  | 'FAMILY_AGGREGATE';

export type ProcessingOutcome = 'ALLOW' | 'DENY' | 'REVIEW';

export interface ProcessingRequest {
  consent: ConsentDecision;
  policyVersion: string;
  policyVersionApproved: boolean;      // 该 policy_version 是否已被治理批准
  subjectPersonId: string;
  guardianPersonId: string;
  dataCategory: ProcessingDataCategory;
  minorData: boolean;
  providerClass: ProviderClass;
  providerApproved: boolean;           // Provider Registry:目标环境下该 provider 是否获批
  externalProcessingEnabled: boolean;  // Runtime Profile:是否总体允许对外处理(默认 false)
  authorizedExternalCategories: readonly ProcessingDataCategory[]; // 允许对外的类别白名单
}

export interface ProcessingDecision {
  decision: ProcessingOutcome;
  allowed: boolean;                    // === (decision === 'ALLOW')
  reason: string;
}

const deny = (reason: string): ProcessingDecision => ({ decision: 'DENY', allowed: false, reason });
const allow = (reason: string): ProcessingDecision => ({ decision: 'ALLOW', allowed: true, reason });

/**
 * 顺序:Consent → Processing Policy → Provider Policy。任一不满足 → FAIL CLOSED(DENY)。
 * FAKE(无对外出口)允许文本类内部处理;FAMILY_AGGREGATE 永不外发且不做整体处理。
 * EXTERNAL_PROVIDER 需同时满足:总开关开、provider 获批、policy 版本获批、类别在白名单、未成年人/图片单独授权。
 */
export function evaluateProcessing(req: ProcessingRequest): ProcessingDecision {
  if (!req.consent.allowed) return deny('consent not allowed');
  if (req.dataCategory === 'FAMILY_AGGREGATE') return deny('FAMILY_AGGREGATE 不做处理/外发');

  if (req.providerClass === 'FAKE') {
    // 无对外出口:文本类内部确定性处理允许;图片仍需显式授权(避免误判"已支持图片")。
    if (req.dataCategory === 'USER_PROVIDED_IMAGE') return deny('image 需显式授权(即使 FAKE)');
    return allow('FAKE provider(无对外出口)+ consent 允许');
  }

  // EXTERNAL_PROVIDER:逐门 FAIL CLOSED
  if (!req.externalProcessingEnabled) return deny('external processing 默认关闭(runtime profile)');
  if (!req.providerApproved) return deny('provider 未在目标环境获批(Provider Registry)');
  if (!req.policyVersionApproved) return deny(`policy_version ${req.policyVersion} 未获批`);
  if (!req.authorizedExternalCategories.includes(req.dataCategory)) {
    return deny(`dataCategory ${req.dataCategory} 未授权对外处理`);
  }
  if (req.minorData && !req.authorizedExternalCategories.includes('MINOR_PRIVATE_TEXT')) {
    return deny('未成年人数据未授权对外处理');
  }
  if (req.dataCategory === 'USER_PROVIDED_IMAGE') return deny('图片对外处理未授权(M3-102 隔离)');
  return allow('external provider 全部治理门通过');
}

// ---------- A4 Typed Context Broker（禁止 Record<string, unknown>) ----------
export interface PrincipalFamilyContextV1 {
  contextVersion: 'v1';
  familyRef: string;
  subjectRef: string;
  lifeStage: string;
  confirmedGrowthPriority: readonly string[];
  activeIntervention: readonly string[];
  recentGrowthActionState: readonly string[];
  recentPermittedObservationSummary: readonly string[];
}

/** 构造 broker 的原始只读输入(须来自真实 Family/Growth read model;字段名以真实为准) */
export interface FamilyReadModelSlice {
  familyRef: string;
  subjectRef: string;
  lifeStage: string;
  confirmedGrowthPriority: readonly string[];
  activeIntervention: readonly string[];
  recentGrowthActionState: readonly string[];
  recentPermittedObservationSummary: readonly string[];
}

export const EMPTY_PRINCIPAL_CONTEXT: null = null;

/**
 * 最小必要 + allowlist:consent 允许 → 仅暴露 V1 白名单字段;否则返回 null(输出=0,不偷偷降级)。
 * 绝不暴露 FamilyAggregate 全量 / 私有文本 / 全部 perspectives / timeline / raw audit/consent。
 */
export function buildPrincipalFamilyContext(
  slice: FamilyReadModelSlice,
  consent: ConsentDecision,
): PrincipalFamilyContextV1 | null {
  if (!consent.allowed) return EMPTY_PRINCIPAL_CONTEXT;
  return {
    contextVersion: 'v1',
    familyRef: slice.familyRef,
    subjectRef: slice.subjectRef,
    lifeStage: slice.lifeStage,
    confirmedGrowthPriority: [...slice.confirmedGrowthPriority],
    activeIntervention: [...slice.activeIntervention],
    recentGrowthActionState: [...slice.recentGrowthActionState],
    recentPermittedObservationSummary: [...slice.recentPermittedObservationSummary],
  };
}

// M3-RB-003 最小真实 Skill 运行时(声明规范见 architecture/rb-003/FAMILY_SKILL_MODEL_V1.md)
export * from './skill';
// PROVIDER_POLICY_RUNTIME_001:Provider Registry → runtime policy(behind flag;设计见 reports/m3/PROVIDER_POLICY_RUNTIME_001_DESIGN.md)
export * from './provider-policy';
