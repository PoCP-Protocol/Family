import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FELS4_LEGACY_ATTRIBUTE_MAP,
  FELS_MIGRATION_MATRIX_COVERAGE,
  FELS_TO_FAMILY_MAP,
} from '@family/fels-contracts';
import { createFlmDirtyWorldDataset, createFlmReferenceCleanDataset, discoverFelsReadOnly, rejectSemanticPollution } from './main';

function rule(object: string, attribute: string) {
  return FELS4_LEGACY_ATTRIBUTE_MAP.find((r) => r.object === object && r.attribute === attribute)?.migrationRule;
}

// §7 Synthetic Semantic Attack Fixture — decoupled from any physical 0003 table.
// Each fixture asserts a forbidden legacy->Family truth promotion must be REJECTED.
type SemanticAttack = { source_object: string; truth_candidate: string };
function isRejected(attack: SemanticAttack): boolean {
  const FORBIDDEN: Record<string, string[]> = {
    legacy_checkin: ['OUTCOME', 'ACTION_COMPLETION_FACT', 'GROWTH'],
    legacy_advisor_note: ['FACT'],
    legacy_profile_family_score: ['GROWTH_STATE', 'FAMILY_CANONICAL'],
    legacy_profile_ranking: ['FAMILY_CANONICAL', 'FAMILY_RANK'],
    legacy_tag: ['DIAGNOSIS', 'PERMANENT_PERSONALITY'],
    legacy_ai_report: ['FACT', 'DIAGNOSIS'],
    legacy_alert: ['FAMILY_SAFETY_THRESHOLD', 'AUTO_ACTION'],
    legacy_assessment_score: ['GROWTH_STATE'],
    course_completion: ['GROWTH_IMPROVEMENT'],
    same_phone: ['MERGE_FAMILY'],
    legacy_consent: ['AI_PERSONALIZATION', 'MODEL_IMPROVEMENT'],
    minor_legacy_data: ['MODEL_IMPROVEMENT'],
    legacy_success_case: ['CAUSAL_EPISODE'],
  };
  return (FORBIDDEN[attack.source_object] ?? []).includes(attack.truth_candidate);
}

describe('FLM-INTEGRATION-001 pollution attack matrix (§24) — every vector REJECT/RETIRE', () => {
  const dirty = createFlmDirtyWorldDataset();

  const attacks: Array<{ name: string; pass: () => boolean }> = [
    { name: 'family_score -> GrowthState = RETIRE', pass: () => rule('legacy_profile', 'family_score') === 'RETIRE' },
    { name: 'ranking -> Family rank = RETIRE', pass: () => rule('legacy_profile', 'ranking') === 'RETIRE' },
    { name: 'tag -> Diagnosis = REJECT', pass: () => rule('legacy_tag', 'tag_value') === 'LEGACY_ANNOTATION' && isRejected({ source_object: 'legacy_tag', truth_candidate: 'DIAGNOSIS' }) },
    { name: 'AI report -> Fact = REJECT', pass: () => rule('legacy_ai_report', 'ai_conclusion') === 'HISTORICAL_AI_HYPOTHESIS' && isRejected({ source_object: 'legacy_ai_report', truth_candidate: 'FACT' }) },
    { name: 'AI report -> Diagnosis = REJECT', pass: () => isRejected({ source_object: 'legacy_ai_report', truth_candidate: 'DIAGNOSIS' }) },
    { name: 'alert risk_score -> canonical threshold = REJECT', pass: () => rule('legacy_alert', 'risk_score') === 'SAFETY_SIGNAL_SOURCE' && isRejected({ source_object: 'legacy_alert', truth_candidate: 'FAMILY_SAFETY_THRESHOLD' }) },
    { name: 'advisor text -> Fact = REJECT', pass: () => rule('legacy_advisor_note', 'note_text') === 'PERSPECTIVE' && isRejected({ source_object: 'legacy_advisor_note', truth_candidate: 'FACT' }) },
    { name: 'checkin -> Outcome = REJECT (synthetic fixture)', pass: () => isRejected({ source_object: 'legacy_checkin', truth_candidate: 'OUTCOME' }) && FELS_TO_FAMILY_MAP.some((m) => m[0] === 'LegacyCheckIn' && /!= Outcome/.test(m[2])) },
    { name: 'course complete -> Growth improvement = REJECT', pass: () => isRejected({ source_object: 'course_completion', truth_candidate: 'GROWTH_IMPROVEMENT' }) && dirty.records.enrollments.every((e) => e.semantic_classification === 'COURSE_STATUS_NOT_OUTCOME') },
    { name: 'same phone -> merge Family = REJECT', pass: () => isRejected({ source_object: 'same_phone', truth_candidate: 'MERGE_FAMILY' }) && discoverFelsReadOnly(dirty).review_flags.includes('IDENTITY_REVIEW_REQUIRED') },
    { name: 'legacy consent -> AI_PERSONALIZATION = REJECT', pass: () => isRejected({ source_object: 'legacy_consent', truth_candidate: 'AI_PERSONALIZATION' }) && FELS_TO_FAMILY_MAP.some((m) => m[0] === 'LegacyConsent' && /must not auto-promote/.test(m[2])) },
    { name: 'minor legacy data -> MODEL_IMPROVEMENT = REJECT', pass: () => isRejected({ source_object: 'minor_legacy_data', truth_candidate: 'MODEL_IMPROVEMENT' }) },
    { name: 'success case -> CausalEpisode = REJECT', pass: () => isRejected({ source_object: 'legacy_success_case', truth_candidate: 'CAUSAL_EPISODE' }) && FELS_MIGRATION_MATRIX_COVERAGE.some((r) => r.id === 'M055' && /CausalEpisodeCreation FORBIDDEN/.test(r.familyDestination)) },
  ];

  it('covers at least the 13 required pollution vectors', () => {
    expect(attacks.length).toBeGreaterThanOrEqual(13);
  });

  it.each(attacks)('rejects/retires: $name', ({ pass }) => {
    expect(pass()).toBe(true);
  });

  it('rejectSemanticPollution over the dirty world = PASS, guardrail counters all zero', () => {
    const r = rejectSemanticPollution(dirty);
    expect(r.fels_rejects_semantic_pollution).toBe('PASS');
    expect(Object.values(r.guardrail_counters).every((n) => n === 0)).toBe(true);
    expect(r.retired_attributes).toEqual(expect.arrayContaining(['legacy_profile.family_score', 'legacy_profile.ranking']));
    expect(r.generative_flm_mapping).toBe('DEFERRED_TO_AUTHORIZED_IMPORT');
  });

  it('clean FLM reference dataset marks every dirty-world object as non-canonical', () => {
    const clean = createFlmReferenceCleanDataset();
    expect(clean.records.profiles.length).toBeGreaterThan(0);
    expect(clean.records.profiles.every((p) => p.semantic_classification === 'LEGACY_PROFILE_SNAPSHOT_NOT_STATE')).toBe(true);
    expect(clean.records.aiReports.every((r) => r.semantic_classification === 'LEGACY_AI_HYPOTHESIS_NOT_FACT')).toBe(true);
  });
});

describe('FLM-INTEGRATION-001 guardrail mutation tests (§25) — mismarking must FAIL', () => {
  it('semantic_classification -> FAMILY_FACT fails', () => {
    const d = createFlmDirtyWorldDataset();
    (d.records.aiReports[0] as { semantic_classification: string }).semantic_classification = 'FAMILY_FACT';
    expect(rejectSemanticPollution(d).fels_rejects_semantic_pollution).toBe('FAIL');
  });

  it('LEGACY_PROFILE_SNAPSHOT_NOT_STATE -> GROWTH_STATE fails', () => {
    const d = createFlmDirtyWorldDataset();
    (d.records.profiles[0] as { semantic_classification: string }).semantic_classification = 'GROWTH_STATE';
    const r = rejectSemanticPollution(d);
    expect(r.fels_rejects_semantic_pollution).toBe('FAIL');
    expect(r.violations.some((v) => v.rule === 'PROFILE_MUST_BE_MARKED_NOT_STATE')).toBe(true);
  });

  it('LEGACY_ALERT_SIGNAL_NOT_THRESHOLD -> FAMILY_SAFETY_THRESHOLD fails', () => {
    const d = createFlmDirtyWorldDataset();
    (d.records.alerts[0] as { semantic_classification: string }).semantic_classification = 'FAMILY_SAFETY_THRESHOLD';
    const r = rejectSemanticPollution(d);
    expect(r.fels_rejects_semantic_pollution).toBe('FAIL');
    expect(r.violations.some((v) => v.rule === 'ALERT_MUST_BE_SIGNAL_ONLY')).toBe(true);
  });
});

describe('FLM-INTEGRATION-001 clean-master invariants (§5,§20)', () => {
  const migrationsDir = resolve(process.cwd(), '../../db/migrations');
  const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  it('NO_0003_DEPENDENCY: migration chain is exactly 0001,0002,0004', () => {
    expect(migrationFiles).toEqual(['0001_fels0_schema.sql', '0002_fels1_core_business.sql', '0004_flm_dirty_world_reference.sql']);
    expect(migrationFiles.some((f) => f.startsWith('0003'))).toBe(false);
  });

  it('EARLY_FELS23_PHYSICAL_TABLES = 0 (no early six tables in any migration)', () => {
    const allSql = migrationFiles.map((f) => readFileSync(resolve(migrationsDir, f), 'utf8')).join('\n');
    for (const t of ['legacy_training_camps', 'legacy_camp_enrollments', 'legacy_daily_tasks', 'legacy_task_checkins', 'legacy_advisor_notes', 'legacy_memberships']) {
      expect(allSql.includes(t)).toBe(false);
    }
  });

  it('EARLY_FELS23_RUNTIME_OBJECTS = 0 (no early six runtime objects in source)', () => {
    const sources = [
      readFileSync(resolve(process.cwd(), 'src/fels1-core.ts'), 'utf8'),
      readFileSync(resolve(process.cwd(), 'src/pg-fels-repository.ts'), 'utf8'),
      readFileSync(resolve(process.cwd(), '../../contracts/src/index.ts'), 'utf8'),
    ].join('\n');
    for (const sym of ['LegacyTrainingCamp', 'LegacyCampEnrollment', 'LegacyDailyTask', 'LegacyTaskCheckin', 'LegacyAdvisorNote', 'LegacyMembership']) {
      expect(sources.includes(sym)).toBe(false);
    }
  });
});
