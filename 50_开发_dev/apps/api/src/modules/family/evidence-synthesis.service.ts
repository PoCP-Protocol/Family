import { Injectable } from '@nestjs/common';
import type {
  AgreementLevel,
  EvidenceRecordDto,
  EvidenceSnapshotDto,
  EvidenceSynthesisDto,
  GrowthProfileCandidateState,
  GrowthProfileScope,
  GrowthProfileSubjectType,
  M2GrowthDimensionId,
  PerspectiveDto,
  ProfileConfidence,
  ProfileLimitation,
} from '@family/contracts';

export const PROFILE_SYNTHESIS_POLICY_VERSION = 'M2_103_DETERMINISTIC_V1' as const;

export interface GrowthProfileSynthesisInput {
  familyId: string;
  onboardingId: string;
  parentPersonId: string;
  relationshipId: string;
  perspectives: PerspectiveDto[];
  evidence: EvidenceRecordDto[];
}

export interface GrowthProfileSynthesisResult {
  synthesis: EvidenceSynthesisDto[];
  evidenceSnapshot: EvidenceSnapshotDto;
}

const PARENT_DIMENSIONS: M2GrowthDimensionId[] = ['P03'];
const RELATIONSHIP_DIMENSIONS: M2GrowthDimensionId[] = ['R03', 'R04', 'R05'];

@Injectable()
export class EvidenceSynthesisService {
  synthesize(input: GrowthProfileSynthesisInput): GrowthProfileSynthesisResult {
    const normalPerspectives = input.perspectives.filter((perspective) => isNormalPerspective(perspective));
    const normalPerspectiveIds = new Set(normalPerspectives.map((perspective) => perspective.perspective_id));
    const usableEvidence = input.evidence.filter((record) => normalPerspectiveIds.has(record.perspective_id));
    const evidenceByPerspectiveId = new Map(usableEvidence.map((record) => [record.perspective_id, record]));
    const evidenceSnapshot: EvidenceSnapshotDto = {
      evidence_ids: usableEvidence.map((record) => record.evidence_id),
      perspective_versions: normalPerspectives.map((perspective) => ({
        perspective_id: perspective.perspective_id,
        version: perspective.version,
      })),
    };

    return {
      evidenceSnapshot,
      synthesis: [
        ...PARENT_DIMENSIONS.map((dimensionId) => synthesizeDimension({
          dimensionId,
          profileScope: 'PARENT_GROWTH_PROFILE',
          subjectType: 'PARENT',
          subjectPersonId: input.parentPersonId,
          subjectRelationshipId: null,
          perspectives: normalPerspectives,
          evidenceByPerspectiveId,
          excludedSafetyCount: input.perspectives.length - normalPerspectives.length,
        })),
        ...RELATIONSHIP_DIMENSIONS.map((dimensionId) => synthesizeDimension({
          dimensionId,
          profileScope: 'RELATIONSHIP_GROWTH_PROFILE',
          subjectType: 'RELATIONSHIP',
          subjectPersonId: null,
          subjectRelationshipId: input.relationshipId,
          perspectives: normalPerspectives,
          evidenceByPerspectiveId,
          excludedSafetyCount: input.perspectives.length - normalPerspectives.length,
        })),
      ],
    };
  }
}

function synthesizeDimension(input: {
  dimensionId: M2GrowthDimensionId;
  profileScope: GrowthProfileScope;
  subjectType: GrowthProfileSubjectType;
  subjectPersonId: string | null;
  subjectRelationshipId: string | null;
  perspectives: PerspectiveDto[];
  evidenceByPerspectiveId: Map<string, EvidenceRecordDto>;
  excludedSafetyCount: number;
}): EvidenceSynthesisDto {
  const relatedPerspectives = input.perspectives.filter((perspective) => perspective.related_dimension_ids.includes(input.dimensionId));
  const parentPerspectives = relatedPerspectives.filter((perspective) => perspective.perspective_type === 'PARENT_PERSPECTIVE');
  const childPerspectives = relatedPerspectives.filter((perspective) => perspective.perspective_type === 'CHILD_PERSPECTIVE');
  const proxyChildPerspectives = childPerspectives.filter((perspective) => perspective.capture_mode === 'PROXY_REPORTED');
  const supportingEvidenceIds = relatedPerspectives
    .map((perspective) => input.evidenceByPerspectiveId.get(perspective.perspective_id)?.evidence_id)
    .filter((evidenceId): evidenceId is string => typeof evidenceId === 'string');
  const agreementLevel = determineAgreementLevel(parentPerspectives.length, childPerspectives.length, proxyChildPerspectives.length);
  const limitations = determineLimitations({
    supportingEvidenceCount: supportingEvidenceIds.length,
    parentPerspectiveCount: parentPerspectives.length,
    childPerspectiveCount: childPerspectives.length,
    proxyChildPerspectiveCount: proxyChildPerspectives.length,
    agreementLevel,
    excludedSafetyCount: input.excludedSafetyCount,
  });
  const confidence = determineConfidence(agreementLevel, supportingEvidenceIds.length, proxyChildPerspectives.length);
  const hasDirectParentAndChild = parentPerspectives.length > 0 && childPerspectives.length > proxyChildPerspectives.length;
  const isSufficient = supportingEvidenceIds.length >= 2 && hasDirectParentAndChild;

  return {
    dimension_id: input.dimensionId,
    fact_boundary: 'PROFILE_IS_INTERPRETIVE_NOT_FACT',
    profile_scope: input.profileScope,
    subject_type: input.subjectType,
    subject_person_id: input.subjectPersonId,
    subject_relationship_id: input.subjectRelationshipId,
    supporting_evidence_ids: supportingEvidenceIds,
    contradicting_evidence_ids: agreementLevel === 'DIVERGENT' ? supportingEvidenceIds : [],
    perspective_coverage: {
      parent_perspective_count: parentPerspectives.length,
      child_perspective_count: childPerspectives.length,
      proxy_child_perspective_count: proxyChildPerspectives.length,
    },
    evidence_grade_coverage: { E1: supportingEvidenceIds.length },
    agreement_level: agreementLevel,
    confidence,
    candidate_state: determineCandidateState(supportingEvidenceIds.length, agreementLevel, isSufficient),
    limitations,
    policy_version: PROFILE_SYNTHESIS_POLICY_VERSION,
  };
}

function isNormalPerspective(perspective: PerspectiveDto): boolean {
  return perspective.safety_disposition.severity === 'LOW' && perspective.safety_disposition.disposition === 'NORMAL';
}

function determineAgreementLevel(parentCount: number, childCount: number, proxyChildCount: number): AgreementLevel {
  if (parentCount === 0 && childCount === 0) {
    return 'INSUFFICIENT';
  }
  if (parentCount > 0 && childCount === 0) {
    return 'PARTIAL';
  }
  if (parentCount === 0 && childCount > 0) {
    return proxyChildCount === childCount ? 'PARTIAL' : 'INSUFFICIENT';
  }
  if (proxyChildCount > 0 && proxyChildCount === childCount) {
    return 'PARTIAL';
  }
  return 'ALIGNED';
}

function determineCandidateState(evidenceCount: number, agreementLevel: AgreementLevel, isSufficient: boolean): GrowthProfileCandidateState {
  if (!isSufficient || evidenceCount === 0 || agreementLevel === 'INSUFFICIENT' || agreementLevel === 'DIVERGENT') {
    return 'UNRESOLVED';
  }
  if (agreementLevel === 'ALIGNED' && evidenceCount >= 2) {
    return 'DEVELOPING';
  }
  return 'EMERGING';
}

function determineConfidence(agreementLevel: AgreementLevel, evidenceCount: number, proxyChildCount: number): ProfileConfidence {
  if (agreementLevel === 'ALIGNED' && evidenceCount >= 2 && proxyChildCount === 0) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function determineLimitations(input: {
  supportingEvidenceCount: number;
  parentPerspectiveCount: number;
  childPerspectiveCount: number;
  proxyChildPerspectiveCount: number;
  agreementLevel: AgreementLevel;
  excludedSafetyCount: number;
}): ProfileLimitation[] {
  const limitations = new Set<ProfileLimitation>();
  if (input.supportingEvidenceCount === 0 || input.agreementLevel === 'INSUFFICIENT') {
    limitations.add('INSUFFICIENT_EVIDENCE');
  }
  if (input.supportingEvidenceCount > 0) {
    limitations.add('SELF_REPORT_ONLY');
  }
  if (input.agreementLevel === 'DIVERGENT') {
    limitations.add('PERSPECTIVE_DIVERGENCE');
  }
  if (input.excludedSafetyCount > 0) {
    limitations.add('SAFETY_ESCALATION_EXCLUDED');
  }
  if (input.proxyChildPerspectiveCount > 0) {
    limitations.add('PROXY_CHILD_PERSPECTIVE');
  }
  if (input.childPerspectiveCount === 0) {
    limitations.add('NO_CHILD_PERSPECTIVE');
  }
  return Array.from(limitations);
}
