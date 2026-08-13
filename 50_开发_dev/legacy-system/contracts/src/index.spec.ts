import {
  FELS_ALLOWED_LEGACY_DERIVED_FIELDS,
  FELS_DATABASE_CONTRACT,
  FELS_DIRTY_SCENARIOS,
  FELS_DOMAINS,
  FELS_ENTITY_TABLES,
  FELS_EXPORT_ENDPOINTS,
  FELS_FORBIDDEN_FAMILY_CANONICAL_OBJECTS,
  FELS_MIGRATION_MATRIX_COVERAGE,
  FELS_TO_FAMILY_MAP,
  FELS_TRUTH,
  getFels0Gate,
} from './index';

describe('FELS-0 executable architecture contract', () => {
  it('declares FELS as a reference implementation, not the real Bangyang source', () => {
    expect(FELS_TRUTH.referenceImplementation).toBe(true);
    expect(FELS_TRUTH.realBangyangSource).toBe(false);
    expect(FELS_TRUTH.sourceSystem).toBe('FELS_REFERENCE_IMPLEMENTATION');
  });

  it('keeps the legacy database physically separate from Family', () => {
    expect(FELS_DATABASE_CONTRACT.databaseName).toBe('family_legacy');
    expect(FELS_DATABASE_CONTRACT.urlEnvironmentVariable).toBe('LEGACY_DATABASE_URL');
    expect(FELS_DATABASE_CONTRACT.forbiddenSilentFallback).toBe('DATABASE_URL');
  });

  it('covers the approved 12 old-world education domains', () => {
    expect(FELS_DOMAINS).toHaveLength(12);
    expect(FELS_DOMAINS).toContain('LEGACY_AI_ANALYTICS');
    expect(FELS_DOMAINS).toContain('LEGACY_GOVERNANCE');
  });

  it('models legacy friction without canonical Family ontology pollution', () => {
    expect(FELS_ENTITY_TABLES).toContain('customer');
    expect(FELS_ENTITY_TABLES).toContain('student_guardian');
    expect(FELS_ENTITY_TABLES).toContain('legacy_ai_report');
    expect(FELS_ENTITY_TABLES).not.toContain('family');
    expect(FELS_ENTITY_TABLES).not.toContain('growth_profile');
    expect(FELS_FORBIDDEN_FAMILY_CANONICAL_OBJECTS).toContain('GrowthProfile');
  });

  it('allows legacy derived fields only as explicitly marked old-world fields', () => {
    expect(FELS_ALLOWED_LEGACY_DERIVED_FIELDS).toContain('family_score');
    expect(FELS_ALLOWED_LEGACY_DERIVED_FIELDS).toContain('ranking');
  });

  it('has read-only export surfaces for FLM source snapshots', () => {
    expect(FELS_EXPORT_ENDPOINTS).toContain('/legacy-export/customers');
    expect(FELS_EXPORT_ENDPOINTS).toContain('/legacy-export/consents');
  });

  it('defines at least 50 dirty migration scenarios (FLM dirty-world requirement)', () => {
    expect(FELS_DIRTY_SCENARIOS.length).toBeGreaterThanOrEqual(50);
    expect(FELS_DIRTY_SCENARIOS).toContain('D011 legacy family score');
    expect(FELS_DIRTY_SCENARIOS).toContain('D013 AI diagnosis without evidence');
    expect(FELS_DIRTY_SCENARIOS).toContain('D021 legacy profile family_score present');
    expect(FELS_DIRTY_SCENARIOS).toContain('D025 legacy ai_report without supporting evidence');
  });

  it('maps all M001-M055 migration matrix rows exactly once', () => {
    const ids = FELS_MIGRATION_MATRIX_COVERAGE.map((row) => row.id);
    expect(ids).toHaveLength(55);
    expect(new Set(ids).size).toBe(55);
    expect(ids[0]).toBe('M001');
    expect(ids[54]).toBe('M055');
  });

  it('retires legacy ranking and family score instead of migrating them as Family truth', () => {
    const retiredRows = FELS_MIGRATION_MATRIX_COVERAGE.filter((row) => row.migrationStrategy === 'RETIRE');
    expect(retiredRows.map((row) => row.id)).toEqual(['M035', 'M036']);
    expect(FELS_TO_FAMILY_MAP).toContainEqual(['family_score', 'RETIRE', 'forbidden in Family']);
    expect(FELS_TO_FAMILY_MAP).toContainEqual(['ranking', 'RETIRE', 'forbidden in Family']);
  });

  it('summarizes the FELS-0 gate as ready for review but not started for FELS-1', () => {
    expect(getFels0Gate()).toMatchObject({
      referenceImplementation: true,
      realBangyangSource: false,
      domains: 12,
      migrationMatrixClassified: 55,
      migrationMatrixCoverage: 55,
      readyForFels1: true,
      startFels1: false,
    });
    expect(getFels0Gate().dirtyScenarios).toBeGreaterThanOrEqual(50);
  });
});