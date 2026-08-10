#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const MIGRATION_ROOT = join(ROOT, 'migration');
const command = process.argv[2] ?? 'help';

const forbiddenSql = /\b(insert|update|delete|alter|truncate|drop|create\s+table|copy\s+.+\s+from)\b/i;

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
  const missing = required.filter((name) => !existsSync(join(MIGRATION_ROOT, name)));
  const directories = ['migration-contracts', 'sources', 'discovery', 'identity', 'normalize', 'transform', 'validate', 'quarantine', 'load', 'reconcile', 'tests', 'reports'];
  const missingDirectories = directories.filter((name) => !existsSync(join(MIGRATION_ROOT, name)));
  printJson({
    command: 'discover',
    mode: 'LM0_READ_ONLY',
    migrationRoot: rel(MIGRATION_ROOT),
    requiredFiles: required.length,
    missing,
    requiredDirectories: directories.length,
    missingDirectories,
    status: missing.length || missingDirectories.length ? 'FAIL' : 'PASS',
  });
}

function discoverDb() {
  assertReadOnlyInputs();
  printJson({
    command: 'discover:db',
    mode: 'LM0_READ_ONLY_DESIGN_ONLY',
    allowedQueries: ['information_schema', 'pg_catalog', 'SELECT COUNT', 'COUNT DISTINCT', 'MIN/MAX', 'NULL statistics'],
    forbiddenQueries: ['INSERT', 'UPDATE', 'DELETE', 'ALTER', 'TRUNCATE', 'DROP'],
    status: 'NO_CONNECTION_ATTEMPTED',
    reason: 'LM0 tool skeleton only; real credentials and source-system authorization are not present.',
  });
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
  const graph = readTextIfExists(join(MIGRATION_ROOT, 'LEGACY_ID_GRAPH.md'));
  const relationships = readTextIfExists(join(MIGRATION_ROOT, 'LEGACY_ID_RELATIONSHIPS.csv')).trim().split(/\r?\n/).filter(Boolean);
  printJson({
    command: 'identity-report',
    mode: 'LM0_READ_ONLY',
    graphStatus: graph.includes('LM0_DISCOVERY_EMPTY') ? 'EMPTY' : 'DRAFT',
    relationshipRows: Math.max(relationships.length - 1, 0),
    status: 'FAIL',
    reason: 'Real legacy identity relationships have not been discovered.',
  });
}

function consentReport() {
  const inventory = readTextIfExists(join(MIGRATION_ROOT, 'LEGACY_CONSENT_INVENTORY.csv')).trim().split(/\r?\n/).filter(Boolean);
  printJson({
    command: 'consent-report',
    mode: 'LM0_READ_ONLY',
    consentInventoryRows: Math.max(inventory.length - 1, 0),
    status: 'FAIL',
    reason: 'Consent proof audit is not complete; active Family Consent creation is forbidden.',
  });
}

function report() {
  printJson({
    command: 'report',
    mode: 'LM0_READ_ONLY',
    LM0: 'FAIL',
    READY_FOR_LM1: 'NO',
    allowed: ['READ', 'DISCOVER', 'PROFILE', 'CLASSIFY', 'DOCUMENT', 'DESIGN_CONTRACTS', 'BUILD_READ_ONLY_TOOLING', 'BUILD_VALIDATORS'],
    forbidden: ['LM1_MAPPING_CONFIRMATION', 'SHADOW_IMPORT', 'PILOT', 'DUAL_RUN', 'CUTOVER', 'PRODUCTION_LOADER', 'PRODUCTION_FAMILY_WRITES'],
  });
}

function help() {
  console.log(`Family Legacy Migration LM0 CLI\n\nUsage:\n  pnpm migration:discover\n  pnpm migration:discover:db\n  pnpm migration:discover:file\n  pnpm migration:discover:api\n  pnpm migration:profile\n  pnpm migration:identity-report\n  pnpm migration:consent-report\n  pnpm migration:report\n\nAll commands are LM0 read-only. Mutating SQL-like input is rejected.`);
}

switch (command) {
  case 'discover': discover(); break;
  case 'discover:db': discoverDb(); break;
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