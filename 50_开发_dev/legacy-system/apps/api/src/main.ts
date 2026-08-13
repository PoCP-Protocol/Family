import {
  FELS_DATABASE_CONTRACT,
  FELS_DOMAINS,
  FELS_ENTITY_TABLES,
  FELS_EXPORT_ENDPOINTS,
  FELS_TRUTH,
  getFels0Gate,
} from '@family/fels-contracts';
export {
  FelsReferenceRuntime,
  Fels1Runtime,
  acceptanceSurfaceForStoreKey,
  classifyMigrationMatrixForFels1,
  createCleanSmallDataset,
  createDirtyCoreDataset,
  createFlmReferenceCleanDataset,
  createFlmDirtyWorldDataset,
  discoverFelsReadOnly,
  getFels1Gate,
  rejectSemanticPollution,
  runFelsVerticalSliceE2E,
  runLegacyAmbiguityE2E,
  summarizeMigrationMatrixForFels1,
} from './fels1-core';
export { PgFelsRepository, PgFelsReadRepository, LEGACY_EXPORT_ENTITIES, getRequiredLegacyDatabaseUrl, seedDatasetToPostgres, type LegacyExportEntity } from './pg-fels-repository';

export const felsApiBoundary = {
  runtime: 'FELS_1_CORE_EDUCATION_BUSINESS',
  auth: 'DEV_ROLE_AUTH_ONLY',
  architecture: 'MODULAR_MONOLITH',
  database: FELS_DATABASE_CONTRACT,
  truth: FELS_TRUTH,
  exportEndpoints: FELS_EXPORT_ENDPOINTS,
} as const;

export function getFelsHealth() {
  return {
    status: 'ok',
    service: 'fels-api',
    referenceImplementation: FELS_TRUTH.referenceImplementation,
    realBangyangSource: FELS_TRUTH.realBangyangSource,
    domains: FELS_DOMAINS.length,
    entityTables: FELS_ENTITY_TABLES.length,
    gate: getFels0Gate(),
  } as const;
}

export function createLegacySourceSnapshot() {
  return {
    legacy_snapshot_id: 'fels-snapshot-contract',
    source_system: 'FELS',
    source_schema_version: 'fels-ref-0004',
    record_counts: Object.fromEntries(FELS_ENTITY_TABLES.map((table) => [table, 0])),
  } as const;
}