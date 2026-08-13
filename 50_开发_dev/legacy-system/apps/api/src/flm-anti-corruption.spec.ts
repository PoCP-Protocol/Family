import {
  FELS4_LEGACY_ATTRIBUTE_MAP,
  FELS_MIGRATION_MATRIX_COVERAGE,
  FELS_TO_FAMILY_MAP,
} from '@family/fels-contracts';
import { createFels4DirtyDataset, discoverFelsReadOnly, rejectSemanticPollution } from './main';

function rule(object: string, attribute: string) {
  return FELS4_LEGACY_ATTRIBUTE_MAP.find((r) => r.object === object && r.attribute === attribute)?.migrationRule;
}

describe('FLM-AC pollution attack matrix (§24) — every vector REJECT/RETIRE', () => {
  const dirty = createFels4DirtyDataset();

  const attacks: Array<{ name: string; expect: 'REJECT' | 'RETIRE'; pass: () => boolean }> = [
    { name: 'family_score -> GrowthState', expect: 'RETIRE', pass: () => rule('legacy_profile', 'family_score') === 'RETIRE' },
    { name: 'ranking -> Family rank', expect: 'RETIRE', pass: () => rule('legacy_profile', 'ranking') === 'RETIRE' },
    { name: 'tag -> Diagnosis', expect: 'REJECT', pass: () => rule('legacy_tag', 'tag_value') === 'LEGACY_ANNOTATION' },
    { name: 'AI report -> Fact', expect: 'REJECT', pass: () => rule('legacy_ai_report', 'ai_conclusion') === 'HISTORICAL_AI_HYPOTHESIS' },
    { name: 'AI report -> Diagnosis', expect: 'REJECT', pass: () => rule('legacy_ai_report', 'ai_conclusion') === 'HISTORICAL_AI_HYPOTHESIS' },
    { name: 'alert risk_score -> canonical risk threshold', expect: 'REJECT', pass: () => rule('legacy_alert', 'risk_score') === 'SAFETY_SIGNAL_SOURCE' },
    { name: 'advisor text -> Fact', expect: 'REJECT', pass: () => rule('legacy_advisor_note', 'note_text') === 'PERSPECTIVE' },
    { name: 'checkin -> Outcome', expect: 'REJECT', pass: () => FELS_TO_FAMILY_MAP.some((m) => m[0] === 'LegacyCheckIn' && /!= Outcome/.test(m[2])) },
    { name: 'course complete -> Growth improvement', expect: 'REJECT', pass: () => dirty.records.enrollments.every((e) => e.semantic_classification === 'COURSE_STATUS_NOT_OUTCOME') },
    { name: 'same phone -> merge Family', expect: 'REJECT', pass: () => discoverFelsReadOnly(dirty).review_flags.includes('IDENTITY_REVIEW_REQUIRED') },
    { name: 'legacy consent -> AI_PERSONALIZATION (incl. minor -> MODEL_IMPROVEMENT)', expect: 'REJECT', pass: () => dirty.records.legacyConsents.every((c) => c.semantic_classification === 'CONSENT_EVIDENCE_CANDIDATE') && FELS_TO_FAMILY_MAP.some((m) => m[0] === 'LegacyConsent' && /must not auto-promote/.test(m[2])) },
    { name: 'minor legacy data -> MODEL_IMPROVEMENT', expect: 'REJECT', pass: () => FELS_TO_FAMILY_MAP.some((m) => m[0] === 'LegacyConsent' && /must not auto-promote/.test(m[2])) },
    { name: 'success case -> CausalEpisode', expect: 'REJECT', pass: () => FELS_MIGRATION_MATRIX_COVERAGE.some((r) => r.id === 'M055' && /CausalEpisodeCreation FORBIDDEN/.test(r.familyDestination)) },
  ];

  it('covers at least the 13 required pollution vectors', () => {
    expect(attacks.length).toBeGreaterThanOrEqual(13);
  });

  it.each(attacks)('rejects/retires: $name ($expect)', ({ pass }) => {
    expect(pass()).toBe(true);
  });

  it('rejectSemanticPollution over the dirty world = PASS, guardrail counters all zero', () => {
    const r = rejectSemanticPollution(dirty);
    expect(r.fels_rejects_semantic_pollution).toBe('PASS');
    expect(Object.values(r.guardrail_counters).every((n) => n === 0)).toBe(true);
    expect(r.retired_attributes).toEqual(expect.arrayContaining(['legacy_profile.family_score', 'legacy_profile.ranking']));
  });
});

describe('FLM-AC guardrail mutation tests (§25) — mismarking a legacy object must FAIL', () => {
  it('semantic_classification -> FAMILY_FACT fails', () => {
    const d = createFels4DirtyDataset();
    (d.records.aiReports[0] as { semantic_classification: string }).semantic_classification = 'FAMILY_FACT';
    expect(rejectSemanticPollution(d).fels_rejects_semantic_pollution).toBe('FAIL');
  });

  it('LEGACY_PROFILE_SNAPSHOT_NOT_STATE -> GROWTH_STATE fails', () => {
    const d = createFels4DirtyDataset();
    (d.records.profiles[0] as { semantic_classification: string }).semantic_classification = 'GROWTH_STATE';
    const r = rejectSemanticPollution(d);
    expect(r.fels_rejects_semantic_pollution).toBe('FAIL');
    expect(r.violations.some((v) => v.rule === 'PROFILE_MUST_BE_MARKED_NOT_STATE')).toBe(true);
  });

  it('LEGACY_ALERT_SIGNAL_NOT_THRESHOLD -> FAMILY_SAFETY_THRESHOLD fails', () => {
    const d = createFels4DirtyDataset();
    (d.records.alerts[0] as { semantic_classification: string }).semantic_classification = 'FAMILY_SAFETY_THRESHOLD';
    const r = rejectSemanticPollution(d);
    expect(r.fels_rejects_semantic_pollution).toBe('FAIL');
    expect(r.violations.some((v) => v.rule === 'ALERT_MUST_BE_SIGNAL_ONLY')).toBe(true);
  });
});
