import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const failures = [];

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const requiredFiles = [
  'README.md',
  'FPAI_MASTER_PLAN_V1.md',
  'FPAI_ROADMAP_V1.md',
  'FPAI_WBS_V1.csv',
  'FPAI_GATE_CHECKLIST_V1.md',
  'product/FPAI_BRAND_IDENTITY_V1.md',
  'product/FPAI_MVP_IA_V1.md',
  'soul/persona.yaml',
  'soul/values.yaml',
  'soul/language-style.yaml',
  'soul/thinking-policy.yaml',
  'soul/action-policy.yaml',
  'soul/relationship-policy.yaml',
  'corpus/corpus-usage-policy.yaml',
  'corpus/BOBO_SOURCE_REGISTRY.csv',
  'distillation/BOBO_TEACHER_MODEL_V1.md',
  'distillation/FAMILI_TRANSFORMATION_POLICY.md',
  'distillation/distillation-schemas.json',
  'knowledge/BOBO_METHOD_TAXONOMY.yaml',
  'scenarios/FPAI_SCENARIO_TAXONOMY_V1.yaml',
  'contracts/principal-response.schema.json',
  'contracts/say-it-tonight.schema.json',
  'contracts/principal-action-card.schema.json',
  'safety/FPAI_SAFETY_POLICY_V1.yaml',
  'evals/gold-v1/cases.jsonl',
  'architecture/FPAI_MODEL_ARCHITECTURE_V1.md',
  'architecture/FPAI_TRAINING_STRATEGY_V1.md',
  'datasets/FPAI_DATASET_CATALOG_V1.md',
  'reports/FPAI_FP0_GATE.md',
];

for (const file of requiredFiles) {
  requireFile(file);
}

if (failures.length === 0) {
  const evalLines = read('evals/gold-v1/cases.jsonl').trim().split('\n').filter(Boolean);
  if (evalLines.length < 100) {
    failures.push(`Gold eval cases < 100: ${evalLines.length}`);
  }

  const cases = evalLines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      failures.push(`Invalid JSONL at line ${index + 1}: ${error.message}`);
      return null;
    }
  }).filter(Boolean);

  const groups = new Map();
  for (const item of cases) {
    groups.set(item.group, (groups.get(item.group) ?? 0) + 1);
    const requiredCaseFields = [
      'user_input',
      'context',
      'expected_response_properties',
      'forbidden_response_properties',
      'preferred_action_type',
      'risk_route',
      'teacher_method_refs',
      'human_rating_template',
    ];
    for (const field of requiredCaseFields) {
      if (!(field in item)) {
        failures.push(`Case ${item.case_id ?? '<unknown>'} missing ${field}`);
      }
    }
  }

  const expectedGroups = {
    communication_defiance: 20,
    screen_time: 15,
    homework: 15,
    parent_blowup: 10,
    low_drive_school_concern: 10,
    sibling_family_structure: 10,
    parent_second_growth: 10,
    safety_boundary: 10,
  };

  for (const [group, expected] of Object.entries(expectedGroups)) {
    const actual = groups.get(group) ?? 0;
    if (actual !== expected) {
      failures.push(`Group ${group} expected ${expected}, got ${actual}`);
    }
  }

  const readme = read('README.md');
  const policy = read('corpus/corpus-usage-policy.yaml');
  const training = read('architecture/FPAI_TRAINING_STRATEGY_V1.md');
  const gate = read('reports/FPAI_FP0_GATE.md');

  const requiredStatements = [
    [readme, 'FP1 = NOT_AUTHORIZED'],
    [readme, 'FAMILY_M2_DEPENDENCY = NONE'],
    [readme, 'TRAINING_STARTED = NO'],
    [readme, 'START_FP1 = NO'],
    [policy, 'automatic: false'],
    [policy, 'large_scale_sft_authorized: false'],
    [training, 'LEVEL_C = NOT_AUTHORIZED'],
    [training, 'SFT_STARTED = NO'],
    [gate, 'M2_RUNTIME_DEPENDENCY = 0'],
    [gate, 'START_FP1 = NO'],
  ];

  for (const [text, statement] of requiredStatements) {
    if (!text.includes(statement)) {
      failures.push(`Missing required statement: ${statement}`);
    }
  }
}

const runtimeFiles = [
  path.join(repoRoot, 'apps', 'web', 'src', 'app.js'),
  path.join(repoRoot, 'apps', 'api', 'src'),
];

function scanForRuntimeDependency(target) {
  if (!fs.existsSync(target)) {
    return;
  }
  const stats = fs.statSync(target);
  if (stats.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      scanForRuntimeDependency(path.join(target, entry));
    }
    return;
  }
  if (!/\.(js|ts|tsx|jsx)$/.test(target)) {
    return;
  }
  const text = fs.readFileSync(target, 'utf8');
  if (text.includes('products/famili-principal') || text.includes('famili-principal')) {
    failures.push(`M2 runtime dependency found in ${path.relative(repoRoot, target)}`);
  }
}

for (const target of runtimeFiles) {
  scanForRuntimeDependency(target);
}

if (failures.length > 0) {
  console.error('FPAI FP0 validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('FPAI FP0 validation passed');
console.log(`Required files: ${requiredFiles.length}`);
console.log('Gold eval cases: 100');
console.log('M2 runtime dependency: 0');
