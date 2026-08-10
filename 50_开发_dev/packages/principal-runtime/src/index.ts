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

// ---------- A3 PrincipalAiProcessingPolicy ----------
export interface ProcessingRequest {
  consent: ConsentDecision;
  policyVersion: string;
  subjectPersonId: string;
  guardianPersonId: string;
  dataCategory: 'MINIMAL_GROWTH_CONTEXT' | 'PRIVATE_TEXT' | 'FAMILY_AGGREGATE';
  minorData: boolean;
  providerClass: ProviderClass;
}
export interface ProcessingDecision {
  allowed: boolean;
  reason: string;
}

/**
 * FakeAiGateway + consent 允许 + 最小必要数据 → 允许(受控内部测试)。
 * EXTERNAL_PROVIDER → FAIL_CLOSED,直到其 processing scope 被明确授权。
 * 私有文本 / 整体 FamilyAggregate → 本阶段一律拒绝(最小必要,非最大可用)。
 */
export function evaluateProcessing(req: ProcessingRequest): ProcessingDecision {
  if (!req.consent.allowed) return { allowed: false, reason: 'consent not allowed' };
  if (req.providerClass === 'EXTERNAL_PROVIDER') {
    return { allowed: false, reason: 'EXTERNAL_PROVIDER FAIL_CLOSED (scope 未授权)' };
  }
  if (req.dataCategory !== 'MINIMAL_GROWTH_CONTEXT') {
    return { allowed: false, reason: `dataCategory ${req.dataCategory} 超出最小必要` };
  }
  return { allowed: true, reason: 'FAKE provider + AI_PERSONALIZATION + 最小必要' };
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
