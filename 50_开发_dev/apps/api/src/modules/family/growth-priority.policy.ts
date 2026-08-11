import { createHash } from 'node:crypto';
import type {
  AgreementLevel,
  GrowthPriorityCandidateDto,
  GrowthPriorityDecision,
  GrowthPriorityDraftDto,
  GrowthPriorityEligibility,
  GrowthPriorityLimitation,
  GrowthPriorityReasonCode,
  GrowthState,
  M2GrowthDimensionId,
  ProfileConfidence,
  ProfileLimitation,
} from '@family/contracts';

export const GROWTH_PRIORITY_POLICY_VERSION = 'M2_104_DETERMINISTIC_V2' as const;
export const GROWTH_PRIORITY_BOUNDARY = 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS' as const;
export const GROWTH_PRIORITY_DIMENSIONS: M2GrowthDimensionId[] = ['P03', 'R03', 'R04', 'R05'];
const PRIMARY_GROWTH_PRIORITY_DIMENSION: M2GrowthDimensionId = 'R03';

export interface ConfirmedProfileForPriority {
  profile_id: string;
  family_id: string;
  dimension_id: M2GrowthDimensionId;
  state: GrowthState;
  confidence: ProfileConfidence;
  version: number;
  basis: {
    supporting_evidence_ids?: string[];
    limitations?: ProfileLimitation[];
    agreement_level?: AgreementLevel;
    confidence?: ProfileConfidence;
    candidate_state?: GrowthState | 'UNRESOLVED';
  };
  evidence_snapshot: {
    evidence_ids?: string[];
  };
  confirmed_at: string;
}

export interface BuildGrowthPriorityDraftInput {
  familyId: string;
  onboardingId: string;
  profiles: ConfirmedProfileForPriority[];
  createdAt: string;
}

export function buildGrowthPriorityDraft(input: BuildGrowthPriorityDraftInput): GrowthPriorityDraftDto {
  const candidates = input.profiles
    .filter((profile) => GROWTH_PRIORITY_DIMENSIONS.includes(profile.dimension_id))
    .map((profile) => buildCandidate(profile, input.createdAt));
  const selected = candidates.find((candidate) => candidate.dimension_id === PRIMARY_GROWTH_PRIORITY_DIMENSION && candidate.eligibility === 'ELIGIBLE') ?? null;
  const eligibleCandidates = candidates.filter((candidate) => candidate.dimension_id === PRIMARY_GROWTH_PRIORITY_DIMENSION && candidate.eligibility === 'ELIGIBLE');
  const allEvidenceRefs = Array.from(new Set(candidates.flatMap((candidate) => candidate.evidence_summary.supporting_evidence_count > 0
    ? getEvidenceRefsForCandidate(candidate, input.profiles)
    : [])));
  const profileRefs = candidates.map((candidate) => ({
    profile_id: candidate.profile_id,
    version: candidate.profile_version,
    dimension_id: candidate.dimension_id,
  }));
  const decision: GrowthPriorityDecision = selected?.dimension_id ?? 'NO_PRIORITY_YET';

  return {
    draft_id: createDraftId(input.familyId, input.onboardingId, profileRefs, decision),
    family_id: input.familyId,
    onboarding_id: input.onboardingId,
    decision,
    candidate: selected,
    profile_refs: profileRefs,
    evidence_refs: selected ? getEvidenceRefsForCandidate(selected, input.profiles) : allEvidenceRefs,
    confidence: selected?.evidence_summary.confidence ?? 'LOW',
    policy_version: GROWTH_PRIORITY_POLICY_VERSION,
    profile_snapshot: {
      profile_refs: profileRefs,
      candidate_count: candidates.length,
      eligible_candidate_count: eligibleCandidates.length,
      boundary: GROWTH_PRIORITY_BOUNDARY,
    },
    created_at: input.createdAt,
  };
}

export function assertDecisionMatchesDraft(draft: GrowthPriorityDraftDto, decision: GrowthPriorityDecision): void {
  if (decision === 'NO_PRIORITY_YET') {
    // A guardian may explicitly defer even when a deterministic candidate exists.
    // This writes no hidden priority state and keeps human confirmation authoritative.
    return;
  }

  if (!draft.candidate || draft.candidate.dimension_id !== decision || draft.candidate.eligibility !== 'ELIGIBLE') {
    throw new Error('growth_priority_decision_not_eligible');
  }
}

function buildCandidate(profile: ConfirmedProfileForPriority, createdAt: string): GrowthPriorityCandidateDto {
  const evidenceIds = getEvidenceRefs(profile);
  const limitations = mapLimitations(profile);
  const reasonCodes = mapReasonCodes(profile, evidenceIds.length);
  const eligibility = determineEligibility(profile, evidenceIds.length);

  return {
    dimension_id: profile.dimension_id,
    profile_id: profile.profile_id,
    profile_version: profile.version,
    state_snapshot: profile.state,
    reason_codes: reasonCodes,
    evidence_summary: {
      supporting_evidence_count: evidenceIds.length,
      limitations: profile.basis.limitations ?? [],
      agreement_level: profile.basis.agreement_level ?? 'INSUFFICIENT',
      confidence: profile.basis.confidence ?? profile.confidence,
    },
    eligibility,
    boundary: GROWTH_PRIORITY_BOUNDARY,
    why: buildWhy(profile.dimension_id, profile.state, eligibility),
    expected_change: '未来七天只作为练习焦点观察沟通过程变化，不承诺结果改善。',
    limitations,
    policy_version: GROWTH_PRIORITY_POLICY_VERSION,
    created_at: createdAt,
  };
}

function determineEligibility(profile: ConfirmedProfileForPriority, evidenceCount: number): GrowthPriorityEligibility {
  if (profile.dimension_id !== PRIMARY_GROWTH_PRIORITY_DIMENSION) {
    return 'NO_PRIORITY_YET';
  }
  if (evidenceCount < 1) {
    return 'NO_PRIORITY_YET';
  }
  if ((profile.basis.limitations ?? []).includes('PERSPECTIVE_DIVERGENCE')) {
    return 'REVIEW_REQUIRED';
  }
  if (profile.state === 'STABILIZING') {
    return 'REVIEW_REQUIRED';
  }
  return 'ELIGIBLE';
}

function mapReasonCodes(profile: ConfirmedProfileForPriority, evidenceCount: number): GrowthPriorityReasonCode[] {
  const reasonCodes: GrowthPriorityReasonCode[] = ['RECENTLY_CONFIRMED_PROFILE'];
  if (profile.state === 'DEVELOPING' || profile.state === 'EMERGING' || profile.state === 'PRACTICING') {
    reasonCodes.push('PRACTICE_READY');
  }
  if (profile.state === 'STABILIZING') {
    reasonCodes.push('PROFILE_UNRESOLVED');
  }
  if (evidenceCount < 1) {
    reasonCodes.push('INSUFFICIENT_EVIDENCE');
  }
  if ((profile.basis.limitations ?? []).includes('PERSPECTIVE_DIVERGENCE')) {
    reasonCodes.push('PERSPECTIVE_DIVERGENCE');
  }
  return reasonCodes;
}

function mapLimitations(profile: ConfirmedProfileForPriority): GrowthPriorityLimitation[] {
  const limitations = new Set<GrowthPriorityLimitation>();
  const profileLimitations = profile.basis.limitations ?? [];
  if (getEvidenceRefs(profile).length < 1 || profileLimitations.includes('INSUFFICIENT_EVIDENCE')) {
    limitations.add('INSUFFICIENT_EVIDENCE');
  }
  if (profileLimitations.includes('PERSPECTIVE_DIVERGENCE')) {
    limitations.add('PERSPECTIVE_DIVERGENCE');
  }
  return Array.from(limitations);
}

function getEvidenceRefsForCandidate(candidate: GrowthPriorityCandidateDto, profiles: ConfirmedProfileForPriority[]): string[] {
  const profile = profiles.find((item) => item.profile_id === candidate.profile_id);
  return profile ? getEvidenceRefs(profile) : [];
}

function getEvidenceRefs(profile: ConfirmedProfileForPriority): string[] {
  return profile.evidence_snapshot.evidence_ids ?? profile.basis.supporting_evidence_ids ?? [];
}

function createDraftId(
  familyId: string,
  onboardingId: string,
  profileRefs: GrowthPriorityDraftDto['profile_refs'],
  decision: GrowthPriorityDecision,
): string {
  const hex = createHash('sha256')
    .update(JSON.stringify({ familyId, onboardingId, profileRefs, decision, policy: GROWTH_PRIORITY_POLICY_VERSION }))
    .digest('hex')
    .slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function buildWhy(dimensionId: M2GrowthDimensionId, state: GrowthState, eligibility: GrowthPriorityEligibility): string {
  if (eligibility !== 'ELIGIBLE') {
    return '当前资料还不足以形成下一步练习焦点。';
  }
  const labels: Record<M2GrowthDimensionId, string> = {
    P03: '家长先听见孩子表达，再回应。',
    R03: '亲子沟通先确认理解，再进入建议。',
    R04: '冲突时先降低对抗，再处理问题。',
    R05: '共同约定一个可以执行的小行动。',
  };
  return `${labels[dimensionId]}当前状态为 ${state}，适合作为七天练习焦点。`;
}
