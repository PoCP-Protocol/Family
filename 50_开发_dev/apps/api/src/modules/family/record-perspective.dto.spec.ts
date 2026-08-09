import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateRecordPerspectiveRequest } from './record-perspective.dto';
import { assessStructuredSafetySignals } from './safety-assessment.policy';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const parentId = '33333333-3333-4333-8333-333333333333';
const childId = '44444444-4444-4444-8444-444444444444';

const validBody = {
  subjectPersonId: childId,
  authorPersonId: parentId,
  perspectiveType: 'PARENT_PERSPECTIVE',
  captureMode: 'DIRECT_SELF_REPORT',
  relatedDimensionIds: ['P03', 'R03'],
  content: {
    promptId: 'parent-friction-v1',
    responseText: '我觉得我们最近一说学习就容易吵起来。',
    selectedSignals: ['interrupts', 'argues'],
  },
  structuredSafetySignals: ['NONE'],
};

describe('validateRecordPerspectiveRequest', () => {
  it('accepts a parent perspective without trusted client severity', () => {
    expect(validateRecordPerspectiveRequest(familyId, onboardingId, 'idem-perspective-1', validBody)).toMatchObject({
      family_id: familyId,
      onboarding_id: onboardingId,
      subject_person_id: childId,
      author_person_id: parentId,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      related_dimension_ids: ['P03', 'R03'],
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-perspective-1',
    });
  });

  it('accepts a child perspective only with facilitated or proxy provenance in M2-102 web flow', () => {
    expect(validateRecordPerspectiveRequest(familyId, onboardingId, 'idem-perspective-2', {
      ...validBody,
      subjectPersonId: parentId,
      authorPersonId: childId,
      perspectiveType: 'CHILD_PERSPECTIVE',
      captureMode: 'FACILITATED_ENTRY',
    })).toMatchObject({
      perspective_type: 'CHILD_PERSPECTIVE',
      capture_mode: 'FACILITATED_ENTRY',
    });
  });

  it('rejects final safety severity from the client', () => {
    expect(() => validateRecordPerspectiveRequest(familyId, onboardingId, 'idem-perspective-3', {
      ...validBody,
      safetySeverity: 'LOW',
    })).toThrow(BadRequestException);
  });

  it('rejects dimensions outside the M2 first growth slice', () => {
    expect(() => validateRecordPerspectiveRequest(familyId, onboardingId, 'idem-perspective-4', {
      ...validBody,
      relatedDimensionIds: ['P03', 'SCHOOL_REFUSAL'],
    })).toThrow(BadRequestException);
  });

  it('rejects direct child self-report in guardian-entered M2-102 route', () => {
    expect(() => validateRecordPerspectiveRequest(familyId, onboardingId, 'idem-perspective-5', {
      ...validBody,
      authorPersonId: childId,
      perspectiveType: 'CHILD_PERSPECTIVE',
      captureMode: 'DIRECT_SELF_REPORT',
    })).toThrow('direct_child_self_report_requires_child_actor');
  });

  it('derives LOW safety disposition server-side for no risk signals', () => {
    expect(assessStructuredSafetySignals(['NONE'])).toEqual({
      severity: 'LOW',
      disposition: 'NORMAL',
      policy_version: 'M2_102_DETERMINISTIC_V1',
      signals: ['NONE'],
    });
  });

  it('derives safety escalation server-side from structured signals', () => {
    expect(assessStructuredSafetySignals(['ABUSE'])).toEqual({
      severity: 'HIGH',
      disposition: 'SAFETY_ESCALATION',
      policy_version: 'M2_102_DETERMINISTIC_V1',
      signals: ['ABUSE'],
    });
  });
});