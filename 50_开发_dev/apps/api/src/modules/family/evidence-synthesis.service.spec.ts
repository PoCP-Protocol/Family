import type { EvidenceRecordDto, PerspectiveDto } from '@family/contracts';
import { describe, expect, it } from 'vitest';
import { EvidenceSynthesisService } from './evidence-synthesis.service';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const parentPersonId = '33333333-3333-4333-8333-333333333333';
const childPersonId = '44444444-4444-4444-8444-444444444444';
const relationshipId = '55555555-5555-4555-8555-555555555555';

describe('EvidenceSynthesisService', () => {
  it('creates separate parent and relationship profile synthesis without treating evidence as fact', () => {
    const service = new EvidenceSynthesisService();
    const parentPerspective = createPerspective({
      perspectiveId: '66666666-6666-4666-8666-666666666666',
      authorPersonId: parentPersonId,
      perspectiveType: 'PARENT_PERSPECTIVE',
      dimensions: ['P03', 'R03'],
    });
    const childPerspective = createPerspective({
      perspectiveId: '77777777-7777-4777-8777-777777777777',
      authorPersonId: childPersonId,
      perspectiveType: 'CHILD_PERSPECTIVE',
      dimensions: ['R03'],
    });
    const result = service.synthesize({
      familyId,
      onboardingId,
      parentPersonId,
      relationshipId,
      perspectives: [parentPerspective, childPerspective],
      evidence: [createEvidence('evidence-parent', parentPerspective, 'PARENT'), createEvidence('evidence-child', childPerspective, 'CHILD')],
    });

    const p03 = result.synthesis.find((item) => item.dimension_id === 'P03');
    const r03 = result.synthesis.find((item) => item.dimension_id === 'R03');
    const r04 = result.synthesis.find((item) => item.dimension_id === 'R04');

    expect(result.synthesis).toHaveLength(4);
    expect(p03).toMatchObject({
      profile_scope: 'PARENT_GROWTH_PROFILE',
      subject_type: 'PARENT',
      subject_person_id: parentPersonId,
      subject_relationship_id: null,
      candidate_state: 'UNRESOLVED',
      confidence: 'LOW',
      limitations: ['SELF_REPORT_ONLY', 'NO_CHILD_PERSPECTIVE'],
    });
    expect(r03).toMatchObject({
      profile_scope: 'RELATIONSHIP_GROWTH_PROFILE',
      subject_type: 'RELATIONSHIP',
      subject_person_id: null,
      subject_relationship_id: relationshipId,
      candidate_state: 'DEVELOPING',
      confidence: 'MEDIUM',
      agreement_level: 'ALIGNED',
      evidence_grade_coverage: { E1: 2 },
    });
    expect(r04).toMatchObject({
      candidate_state: 'UNRESOLVED',
      agreement_level: 'INSUFFICIENT',
      limitations: ['INSUFFICIENT_EVIDENCE', 'NO_CHILD_PERSPECTIVE'],
    });
  });

  it('excludes non-normal safety perspectives from normal growth synthesis', () => {
    const service = new EvidenceSynthesisService();
    const escalated = createPerspective({
      perspectiveId: '88888888-8888-4888-8888-888888888888',
      authorPersonId: parentPersonId,
      perspectiveType: 'PARENT_PERSPECTIVE',
      dimensions: ['P03'],
      safetySeverity: 'MEDIUM',
      safetyDisposition: 'HUMAN_REVIEW',
    });
    const result = service.synthesize({
      familyId,
      onboardingId,
      parentPersonId,
      relationshipId,
      perspectives: [escalated],
      evidence: [createEvidence('evidence-escalated', escalated, 'PARENT')],
    });

    const p03 = result.synthesis.find((item) => item.dimension_id === 'P03');
    expect(p03).toMatchObject({
      supporting_evidence_ids: [],
      candidate_state: 'UNRESOLVED',
      limitations: ['INSUFFICIENT_EVIDENCE', 'SAFETY_ESCALATION_EXCLUDED', 'NO_CHILD_PERSPECTIVE'],
    });
    expect(result.evidenceSnapshot.evidence_ids).toEqual([]);
  });
});

function createPerspective(input: {
  perspectiveId: string;
  authorPersonId: string;
  perspectiveType: PerspectiveDto['perspective_type'];
  dimensions: PerspectiveDto['related_dimension_ids'];
  safetySeverity?: PerspectiveDto['safety_disposition']['severity'];
  safetyDisposition?: PerspectiveDto['safety_disposition']['disposition'];
}): PerspectiveDto {
  return {
    perspective_id: input.perspectiveId,
    family_id: familyId,
    onboarding_id: onboardingId,
    subject_person_id: childPersonId,
    author_person_id: input.authorPersonId,
    recorded_by_actor_id: input.authorPersonId,
    perspective_type: input.perspectiveType,
    capture_mode: input.perspectiveType === 'CHILD_PERSPECTIVE' ? 'FACILITATED_ENTRY' : 'DIRECT_SELF_REPORT',
    related_dimension_ids: input.dimensions,
    content: {
      prompt_id: 'prompt-v1',
      response_text: '目前信息仅代表表达。',
      selected_signals: [],
    },
    fact_boundary: 'PERSPECTIVE_NOT_FACT',
    safety_disposition: {
      severity: input.safetySeverity ?? 'LOW',
      disposition: input.safetyDisposition ?? 'NORMAL',
      policy_version: 'M2_102_DETERMINISTIC_V1',
      signals: ['NONE'],
    },
    expressed_at: null,
    recorded_at: '2026-08-10T00:00:00.000Z',
    created_at: '2026-08-10T00:00:00.000Z',
    version: 1,
  };
}

function createEvidence(evidenceId: string, perspective: PerspectiveDto, source: EvidenceRecordDto['source']): EvidenceRecordDto {
  return {
    evidence_id: evidenceId,
    family_id: familyId,
    perspective_id: perspective.perspective_id,
    evidence_type: 'SELF_REPORT',
    source,
    evidence_level: 'E1',
    payload: {},
    observed_at: null,
    created_at: '2026-08-10T00:00:00.000Z',
  };
}
