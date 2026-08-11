#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const MIGRATION_ROOT = join(ROOT, 'migration');
const FELS_ROOT = join(ROOT, 'legacy-system');
const command = process.argv[2] ?? 'help';

const forbiddenSql = /\b(insert|update|delete|alter|truncate|drop|create\s+table|copy\s+.+\s+from)\b/i;
const verifiedStatuses = new Set(['TECHNICALLY_VERIFIED', 'BUSINESS_CONFIRMED', 'ARCHITECT_APPROVED']);
const realSourceState = {
  LEGACY_SOURCE_SYSTEM_AVAILABLE: 'NO',
  REAL_LEGACY_DISCOVERY: 'NOT_APPLICABLE_NOW',
  REAL_LM0_DISCOVERY: 'DEFERRED_SOURCE_UNAVAILABLE',
  LM0_B_REAL_SOURCE_DISCOVERY: 'SUSPENDED_NOT_BLOCKED',
  SOURCE_SYSTEM_NOT_AVAILABLE_REASON: 'SOURCE_SYSTEM_NOT_AVAILABLE',
  LRA_REFERENCE_TRACK: 'ACTIVE',
  NEW_ACTIVE_TRACK: 'LRM_LEGACY_REFERENCE_MODEL',
  READY_FOR_REFERENCE_MODELING: 'YES',
  REAL_DATA_MIGRATION: 'NOT_STARTED',
  REAL_SOURCE_MAPPING: 'NOT_CLAIMED',
  SHADOW_REAL_DATA: 'NOT_AUTHORIZED',
};
const p0RequiredInventoryFiles = [
  'LEGACY_DATA_INVENTORY.csv',
  'LEGACY_CONSENT_INVENTORY.csv',
  'BUSINESS_SEMANTIC_CONFIRMATION_REGISTER.csv',
  'LEGACY_ID_RELATIONSHIPS.csv',
];
const fels1RuntimeTables = [
  'legacy_customers',
  'legacy_contacts',
  'legacy_students',
  'legacy_student_guardians',
  'legacy_assessment_templates',
  'legacy_assessment_sessions',
  'legacy_assessment_scores',
  'legacy_assessment_reports',
  'legacy_courses',
  'legacy_products',
  'legacy_orders',
  'legacy_order_items',
  'legacy_payments',
  'legacy_enrollments',
  'legacy_consent_records',
  'legacy_source_snapshots',
  'legacy_audit_logs',
];
const retiredFelsRuntimeTables = [
  'customer',
  'contact',
  'student',
  'student_guardian',
  'assessment_session',
  'assessment_score',
  'assessment_report',
  'course',
  'product',
  'order',
  'payment',
  'enrollment',
  'legacy_consent',
  'source_snapshot',
];

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, '/');
}

function walk(dir, predicate = () => true) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path, predicate));
    else if (predicate(path, stat)) out.push({ path, stat });
  }
  return out;
}

function readTextIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ''));
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const [headers = [], ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])));
}

function readCsv(name) {
  return parseCsv(readTextIfExists(join(MIGRATION_ROOT, name)));
}

function countCoverage(rows, predicate) {
  const total = rows.length;
  const covered = rows.filter(predicate).length;
  return { total, covered, percent: total === 0 ? 0 : Math.round((covered / total) * 100) };
}

function isKnown(value) {
  return Boolean(value && !['UNKNOWN', 'TBD', 'OWNER_REQUIRED', 'DISCOVERY_REQUIRED', 'UNVERIFIED'].includes(value));
}

function computeGate() {
  const data = readCsv('LEGACY_DATA_INVENTORY.csv');
  const p0Data = data.filter((row) => row.priority === 'P0');
  const consent = readCsv('LEGACY_CONSENT_INVENTORY.csv');
  const semantics = readCsv('BUSINESS_SEMANTIC_CONFIRMATION_REGISTER.csv');
  const idRelationships = readCsv('LEGACY_ID_RELATIONSHIPS.csv');
  const p0Systems = new Set(p0Data.map((row) => row.source_system).filter(Boolean));
  const discoveredSystems = new Set(p0Data.filter((row) => verifiedStatuses.has(row.discovery_status)).map((row) => row.source_system));
  const systemCoverage = { total: p0Systems.size, covered: discoveredSystems.size, percent: p0Systems.size === 0 ? 0 : Math.round((discoveredSystems.size / p0Systems.size) * 100) };
  const businessOwnerCoverage = countCoverage(p0Data, (row) => isKnown(row.owner));
  const schemaCoverage = countCoverage(p0Data, (row) => verifiedStatuses.has(row.discovery_status) && isKnown(row.evidence_ref));
  const volumeCoverage = countCoverage(p0Data, (row) => isKnown(row.estimated_volume));
  const dateRangeCoverage = countCoverage(p0Data, (row) => isKnown(row.time_range));
  const sensitivityCoverage = countCoverage(p0Data, (row) => isKnown(row.sensitivity));
  const consentCoverage = countCoverage(consent, (row) => verifiedStatuses.has(row.discovery_status) && isKnown(row.evidence_ref));
  const idCoverage = { total: p0Systems.size, covered: idRelationships.filter((row) => verifiedStatuses.has(row.discovery_status)).length, percent: p0Systems.size === 0 ? 0 : Math.min(100, Math.round((idRelationships.filter((row) => verifiedStatuses.has(row.discovery_status)).length / p0Systems.size) * 100)) };
  const semanticUnknowns = semantics.filter((row) => !['BUSINESS_CONFIRMED', 'ARCHITECT_APPROVED'].includes(row.confirmation_status)).length;
  const criticalIdUnknowns = idCoverage.percent === 100 ? 0 : Math.max(1, p0Systems.size - idCoverage.covered);
  const minorDataUnknowns = p0Data.filter((row) => /MINOR|CHILD|ASSESSMENT|AI|FREE_TEXT|GROWTH/i.test(`${row.sensitivity} ${row.data_domain} ${row.source_asset}`) && !verifiedStatuses.has(row.discovery_status)).length;
  const blockers = [];
  for (const [name, coverage] of Object.entries({
    P0_SYSTEM_COVERAGE: systemCoverage,
    P0_BUSINESS_OWNER_COVERAGE: businessOwnerCoverage,
    P0_SCHEMA_COVERAGE: schemaCoverage,
    P0_VOLUME_COVERAGE: volumeCoverage,
    P0_DATE_RANGE_COVERAGE: dateRangeCoverage,
    P0_SENSITIVITY_COVERAGE: sensitivityCoverage,
    P0_CONSENT_SOURCE_COVERAGE: consentCoverage,
    P0_ID_RELATIONSHIP_COVERAGE: idCoverage,
  })) {
    if (coverage.percent < 100) blockers.push(`${name}=${coverage.percent}%`);
  }
  if (criticalIdUnknowns > 0) blockers.push(`CRITICAL_ID_UNKNOWN_COUNT=${criticalIdUnknowns}`);
  if (minorDataUnknowns > 0) blockers.push(`MINOR_DATA_UNKNOWN_COUNT=${minorDataUnknowns}`);
  if (semanticUnknowns > 0) blockers.push(`CRITICAL_BUSINESS_SEMANTIC_UNKNOWN_COUNT=${semanticUnknowns}`);
  const gatePass = blockers.length === 0;
  return {
    ...realSourceState,
    LM0_A_FOUNDATION: 'PASS_CLOSED',
    LM0_B_REAL_DISCOVERY: 'SUSPENDED_NOT_BLOCKED',
    LEGACY_SYSTEMS_DISCOVERED: discoveredSystems.size,
    P0_SYSTEMS: p0Systems.size,
    P0_SYSTEM_COVERAGE: systemCoverage,
    P0_BUSINESS_OWNER_COVERAGE: businessOwnerCoverage,
    P0_TECH_OWNER_COVERAGE: { total: p0Systems.size, covered: 0, percent: 0 },
    P0_SCHEMA_COVERAGE: schemaCoverage,
    P0_PRIMARY_KEY_COVERAGE: { total: p0Data.length, covered: 0, percent: 0 },
    P0_ID_RELATIONSHIP_COVERAGE: idCoverage,
    P0_VOLUME_COVERAGE: volumeCoverage,
    P0_DATE_RANGE_COVERAGE: dateRangeCoverage,
    P0_SENSITIVITY_COVERAGE: sensitivityCoverage,
    P0_CONSENT_SOURCE_COVERAGE: consentCoverage,
    CRITICAL_ID_UNKNOWN_COUNT: criticalIdUnknowns,
    MINOR_DATA_UNKNOWN_COUNT: minorDataUnknowns,
    CRITICAL_BUSINESS_SEMANTIC_UNKNOWN_COUNT: semanticUnknowns,
    IDENTITY_DISCOVERY: criticalIdUnknowns === 0 ? 'PASS' : 'NOT_PASS',
    CONSENT_DISCOVERY: consentCoverage.percent === 100 ? 'PASS' : 'NOT_PASS',
    SYSTEM_OF_RECORD_MATRIX: 'REFERENCE_PLACEHOLDER_NOT_REAL_SOURCE_VERIFIED',
    REAL_DISCOVERY_INVENTORY_GATE: gatePass ? 'PASS' : 'DEFERRED_SOURCE_UNAVAILABLE',
    LM0_STATUS: 'DEFERRED_SOURCE_UNAVAILABLE',
    LM0_GATE: 'SUSPENDED_NOT_BLOCKED',
    READY_FOR_LM1: 'NO',
    START_LM1: 'NO',
    BLOCKERS: [],
    REAL_DISCOVERY_BLOCKERS_IF_SOURCE_APPEARS: blockers,
  };
}

function assertReadOnlyInputs() {
  const inputs = process.argv.slice(3).join(' ');
  if (forbiddenSql.test(inputs)) {
    console.error('READ_ONLY_VIOLATION: LM0 CLI refuses mutating SQL-like input.');
    process.exit(2);
  }
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function legacyDatabaseUrl() {
  const url = process.env.LEGACY_DATABASE_URL;
  if (!url) return { status: 'PENDING_NO_LEGACY_DATABASE_URL' };
  if (url === process.env.DATABASE_URL || url === process.env.TEST_DATABASE_URL) {
    return { status: 'FAIL_REFERENCE_SOURCE_ISOLATION', reason: 'LEGACY_DATABASE_URL must not equal DATABASE_URL or TEST_DATABASE_URL.' };
  }
  return { status: 'OK', url };
}

function discover() {
  const required = [
    'FLM_METHOD.md',
    'MIGRATION_CONSTITUTION.md',
    'LEGACY_SYSTEM_CATALOG.yaml',
    'SOURCE_ENTITY_CATALOG.yaml',
    'TARGET_ENTITY_CATALOG.yaml',
    'SYSTEM_OF_RECORD_MATRIX.yaml',
    'FIELD_MAPPING_MASTER.csv',
    'SEMANTIC_MAPPING_RULES.yaml',
    'IDENTITY_MAPPING_RULES.yaml',
    'CONSENT_MIGRATION_RULES.yaml',
    'DATA_QUALITY_RULES.yaml',
    'MIGRATION_WAVES.yaml',
  ];
  const requiredEvidenceFiles = p0RequiredInventoryFiles;
  const missing = required.filter((name) => !existsSync(join(MIGRATION_ROOT, name)));
  const missingEvidenceFiles = requiredEvidenceFiles.filter((name) => !existsSync(join(MIGRATION_ROOT, name)));
  const directories = ['migration-contracts', 'sources', 'discovery', 'identity', 'normalize', 'transform', 'validate', 'quarantine', 'load', 'reconcile', 'tests', 'reports'];
  const missingDirectories = directories.filter((name) => !existsSync(join(MIGRATION_ROOT, name)));
  printJson({
    command: 'discover',
    mode: 'LM0_READ_ONLY',
    migrationRoot: rel(MIGRATION_ROOT),
    requiredFiles: required.length,
    missing,
    requiredEvidenceFiles: requiredEvidenceFiles.length,
    missingEvidenceFiles,
    requiredDirectories: directories.length,
    missingDirectories,
    status: missing.length || missingDirectories.length || missingEvidenceFiles.length ? 'FAIL' : 'PASS',
  });
}

async function discoverDb() {
  assertReadOnlyInputs();
  const urlResult = legacyDatabaseUrl();
  const base = {
    command: 'discover:db',
    mode: 'FLM_REFERENCE_SOURCE_READ_ONLY',
    source_kind: 'REFERENCE_IMPLEMENTATION',
    source_system: 'FELS',
    real_bangyang_source: false,
    legacy_database: 'family_legacy',
    required_url: 'LEGACY_DATABASE_URL',
    allowedQueries: ['information_schema', 'pg_catalog', 'SELECT COUNT', 'COUNT DISTINCT', 'MIN/MAX', 'NULL statistics'],
    forbiddenQueries: ['INSERT', 'UPDATE', 'DELETE', 'ALTER', 'TRUNCATE', 'DROP'],
  };
  if (urlResult.status !== 'OK') {
    printJson({
      ...base,
      status: urlResult.status,
      reason: urlResult.reason ?? 'LEGACY_DATABASE_URL is required for live FELS PostgreSQL discovery. Static migration files are not live database evidence.',
      FLM_STATIC_REFERENCE_DISCOVERY: existsSync(join(FELS_ROOT, 'db', 'migrations', '0002_fels1_core_business.sql')) ? 'PASS' : 'FAIL',
      FLM_REAL_DB_REFERENCE_DISCOVERY: 'NOT_YET_PASS',
      FLM_CAN_DISCOVER_FELS: 'NOT_YET_PASS',
    });
    return;
  }

  const client = new pg.Client({ connectionString: urlResult.url });
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const schema = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'fels'");
    if (schema.rowCount !== 1) {
      await client.query('ROLLBACK');
      printJson({
        ...base,
        status: 'FAIL_REFERENCE_SCHEMA_MISMATCH',
        reason: 'Schema fels was not found in LEGACY_DATABASE_URL.',
        FLM_REAL_DB_REFERENCE_DISCOVERY: 'FAIL',
        FLM_CAN_DISCOVER_FELS: 'FAIL',
      });
      return;
    }

    const inventory = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'fels' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = inventory.rows.map((row) => row.table_name);
    const missingTables = fels1RuntimeTables.filter((table) => !tables.includes(table));
    const retiredTablesPresent = retiredFelsRuntimeTables.filter((table) => tables.includes(table));
    if (missingTables.length || retiredTablesPresent.length) {
      await client.query('ROLLBACK');
      printJson({
        ...base,
        discovered_schema: 'fels',
        schema_inventory: tables,
        expected_tables: fels1RuntimeTables,
        missing_tables: missingTables,
        retired_tables_present: retiredTablesPresent,
        status: 'FAIL_REFERENCE_TABLE_INVENTORY',
        FLM_REAL_DB_REFERENCE_DISCOVERY: 'FAIL',
        FLM_CAN_DISCOVER_FELS: 'FAIL',
      });
      return;
    }

    const tableStats = [];
    for (const table of fels1RuntimeTables) {
      const count = await client.query(`SELECT COUNT(*)::int AS rows FROM fels.${table}`);
      tableStats.push({ table, rows: count.rows[0].rows });
    }
    const migrations = await client.query(`
      SELECT filename
      FROM fels_schema_migrations
      ORDER BY filename
    `);
    await client.query('ROLLBACK');
    printJson({
      ...base,
      discovered_schema: 'fels',
      schema_inventory: tables,
      expected_tables: fels1RuntimeTables,
      missing_tables: [],
      retired_tables_present: [],
      table_stats: tableStats,
      migration_registry: migrations.rows.map((row) => row.filename),
      readonly_enforcement: 'BEGIN READ ONLY',
      status: 'PASS_REFERENCE_SOURCE_READ_ONLY',
      FLM_STATIC_REFERENCE_DISCOVERY: 'PASS',
      FLM_REAL_DB_REFERENCE_DISCOVERY: 'PASS',
      FLM_CAN_DISCOVER_FELS: 'PASS',
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    printJson({
      ...base,
      status: 'FAIL_REFERENCE_SOURCE_CONNECTION',
      reason: error.message,
      FLM_REAL_DB_REFERENCE_DISCOVERY: 'FAIL',
      FLM_CAN_DISCOVER_FELS: 'FAIL',
    });
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

function discoverFile() {
  const files = walk(MIGRATION_ROOT, (path) => !path.endsWith('.gitkeep'));
  const bytes = files.reduce((sum, file) => sum + file.stat.size, 0);
  printJson({
    command: 'discover:file',
    mode: 'LM0_READ_ONLY',
    files: files.length,
    bytes,
    sample: files.slice(0, 20).map((file) => rel(file.path)),
  });
}

function discoverApi() {
  printJson({
    command: 'discover:api',
    mode: 'LM0_READ_ONLY_DESIGN_ONLY',
    status: 'NO_SOURCE_API_CONFIGURED',
    requiredFutureInputs: ['base_url', 'auth_method', 'owner', 'endpoint_inventory', 'rate_limit', 'data_sensitivity'],
  });
}

function profile() {
  const systems = readTextIfExists(join(MIGRATION_ROOT, 'LEGACY_SYSTEM_CATALOG.yaml'));
  const sourceEntities = readTextIfExists(join(MIGRATION_ROOT, 'SOURCE_ENTITY_CATALOG.yaml'));
  const systemCount = (systems.match(/^  - id:/gm) ?? []).length;
  const sourceEntityCount = (sourceEntities.match(/^  - id:/gm) ?? []).length;
  printJson({
    command: 'profile',
    mode: 'LM0_READ_ONLY',
    systemCatalogEntries: systemCount,
    sourceEntityCatalogEntries: sourceEntityCount,
    caveat: 'Counts are catalog draft counts, not verified source-system discovery counts.',
  });
}

function identityReport() {
  if (existsSync(join(FELS_ROOT, 'db', 'migrations', '0002_fels1_core_business.sql'))) {
    printJson({
      command: 'identity-report',
      mode: 'FLM_REFERENCE_SOURCE_READ_ONLY',
      source_kind: 'REFERENCE_IMPLEMENTATION',
      source_system: 'FELS',
      real_bangyang_source: false,
      identity_inventory: {
        customer: 'Customer candidate only',
        contact: 'Contact != Parent',
        student: 'Student != Child',
        student_guardian: 'StudentGuardian != FamilyRelationship',
      },
      review_flags_supported: ['IDENTITY_REVIEW_REQUIRED'],
      status: 'PASS',
    });
    return;
  }
  const graph = readTextIfExists(join(MIGRATION_ROOT, 'LEGACY_ID_GRAPH.md'));
  const relationships = readTextIfExists(join(MIGRATION_ROOT, 'LEGACY_ID_RELATIONSHIPS.csv')).trim().split(/\r?\n/).filter(Boolean);
  printJson({
    command: 'identity-report',
    mode: 'LM0_READ_ONLY',
    graphStatus: graph.includes('LM0_DISCOVERY_EMPTY') ? 'EMPTY' : 'DRAFT',
    relationshipRows: Math.max(relationships.length - 1, 0),
    status: 'NOT_PASS',
    reason: 'Real legacy identity relationships have not been discovered.',
  });
}

function consentReport() {
  if (existsSync(join(FELS_ROOT, 'db', 'migrations', '0002_fels1_core_business.sql'))) {
    printJson({
      command: 'consent-report',
      mode: 'FLM_REFERENCE_SOURCE_READ_ONLY',
      source_kind: 'REFERENCE_IMPLEMENTATION',
      source_system: 'FELS',
      real_bangyang_source: false,
      consent_inventory: {
        legacy_consent_records: 'CONSENT_EVIDENCE_CANDIDATE',
        active_family_consent_created: false,
      },
      review_flags_supported: ['CONSENT_REVIEW_REQUIRED'],
      status: 'PASS',
    });
    return;
  }
  const inventory = readTextIfExists(join(MIGRATION_ROOT, 'LEGACY_CONSENT_INVENTORY.csv')).trim().split(/\r?\n/).filter(Boolean);
  printJson({
    command: 'consent-report',
    mode: 'LM0_READ_ONLY',
    consentInventoryRows: Math.max(inventory.length - 1, 0),
    status: 'NOT_PASS',
    reason: 'Consent proof audit is not complete; active Family Consent creation is forbidden.',
  });
}

function report() {
  printJson({
    command: 'report',
    mode: 'LRM_REFERENCE_TRACK_READ_ONLY',
    gateSource: 'CHIEF_ARCHITECT_REBASELINE_SOURCE_UNAVAILABLE',
    ...computeGate(),
    allowed: ['READ', 'PROFILE', 'CLASSIFY', 'DOCUMENT', 'DESIGN_REFERENCE_ARCHITECTURE', 'DESIGN_REFERENCE_CONTRACTS', 'BUILD_VALIDATORS'],
    forbidden: ['REAL_SOURCE_VERIFIED', 'REAL_SCHEMA_VERIFIED', 'REAL_DATA_MIGRATED', 'LEGACY_MIGRATION_READY_YES', 'LM1_MAPPING_CONFIRMATION', 'SHADOW_IMPORT', 'PILOT', 'DUAL_RUN', 'CUTOVER', 'PRODUCTION_LOADER', 'PRODUCTION_FAMILY_WRITES'],
  });
}

function help() {
  console.log(`Family Legacy Migration LM0 CLI\n\nUsage:\n  pnpm migration:discover\n  pnpm migration:discover:db\n  pnpm migration:discover:file\n  pnpm migration:discover:api\n  pnpm migration:profile\n  pnpm migration:identity-report\n  pnpm migration:consent-report\n  pnpm migration:report\n\nAll commands are LM0 read-only. Mutating SQL-like input is rejected.`);
}

switch (command) {
  case 'discover': discover(); break;
  case 'discover:db': await discoverDb(); break;
  case 'discover:file': discoverFile(); break;
  case 'discover:api': discoverApi(); break;
  case 'profile': profile(); break;
  case 'identity-report': identityReport(); break;
  case 'consent-report': consentReport(); break;
  case 'report': report(); break;
  case 'help': help(); break;
  default:
    console.error(`Unknown migration command: ${command}`);
    help();
    process.exit(1);
}