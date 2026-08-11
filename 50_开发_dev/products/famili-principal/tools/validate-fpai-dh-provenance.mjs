import fs from 'node:fs';
import path from 'node:path';

// Validates the FPAI digital-human asset provenance CSV against the schema and
// rules in product/FPAI_DIGITAL_HUMAN_ASSET_PROVENANCE_V1.md.
// DH0.5 authorization is review-only: training_use=yes and unknown/high risk on
// production candidates are hard gate failures.

const root = path.resolve(import.meta.dirname, '..');
const csvPath = path.join(root, 'registry', 'FPAI_DIGITAL_HUMAN_ASSET_PROVENANCE.csv');
const failures = [];

const COLUMNS = [
  'asset_id',
  'asset_type',
  'source',
  'owner',
  'license',
  'commercial_use',
  'derivative_use',
  'training_use',
  'identity_similarity_risk',
  'voice_similarity_risk',
  'review_status',
  'approved_by',
  'version',
  'notes',
];

const ENUMS = {
  asset_type: [
    'face_reference',
    'body_reference',
    'fashion_reference',
    'voice_reference',
    'generated_image',
    '3d_asset',
    'lora',
    'avatar_checkpoint',
    'voice_model',
    'motion_asset',
    'background',
    'music',
    'other',
  ],
  commercial_use: ['yes', 'no', 'unknown'],
  derivative_use: ['yes', 'no', 'unknown'],
  training_use: ['yes', 'no', 'unknown'],
  identity_similarity_risk: ['none', 'low', 'medium', 'high', 'unknown'],
  voice_similarity_risk: ['none', 'low', 'medium', 'high', 'unknown'],
  review_status: [
    'draft',
    'needs_rights_review',
    'approved_for_concept',
    'approved_for_production_candidate',
    'rejected',
  ],
};

const APPROVED_STATUSES = ['approved_for_concept', 'approved_for_production_candidate'];

// Minimal RFC4180-ish CSV parser (supports quoted fields with embedded commas).
function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

if (!fs.existsSync(csvPath)) {
  console.error(`FPAI provenance validation failed: missing ${path.relative(root, csvPath)}`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
if (rows.length === 0) {
  failures.push('CSV is empty.');
}

const header = rows[0] ?? [];
if (header.length !== COLUMNS.length || COLUMNS.some((col, idx) => header[idx] !== col)) {
  failures.push(`Header must be exactly: ${COLUMNS.join(',')}`);
}

const seenIds = new Set();
const dataRows = rows.slice(1);

dataRows.forEach((cells, index) => {
  const line = index + 2;
  if (cells.length !== COLUMNS.length) {
    failures.push(`Row ${line}: expected ${COLUMNS.length} columns, got ${cells.length}`);
    return;
  }
  const rec = Object.fromEntries(COLUMNS.map((col, i) => [col, cells[i].trim()]));

  if (!rec.asset_id) {
    failures.push(`Row ${line}: empty asset_id`);
  } else if (seenIds.has(rec.asset_id)) {
    failures.push(`Row ${line}: duplicate asset_id ${rec.asset_id}`);
  } else {
    seenIds.add(rec.asset_id);
  }

  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (!allowed.includes(rec[field])) {
      failures.push(`Row ${line} (${rec.asset_id}): ${field}='${rec[field]}' not in [${allowed.join(', ')}]`);
    }
  }

  // Approval rule: any approved status requires a named approver.
  if (APPROVED_STATUSES.includes(rec.review_status) && !rec.approved_by) {
    failures.push(`Row ${line} (${rec.asset_id}): review_status=${rec.review_status} requires approved_by`);
  }

  // Production rule: strict gate for production candidates.
  if (rec.review_status === 'approved_for_production_candidate') {
    const req = [
      ['commercial_use', rec.commercial_use === 'yes'],
      ['derivative_use', rec.derivative_use === 'yes'],
      ['source', rec.source && rec.source !== 'unknown'],
      ['owner', rec.owner && rec.owner !== 'unknown'],
      ['license', rec.license && rec.license !== 'unknown'],
      ['identity_similarity_risk', rec.identity_similarity_risk !== 'high' && rec.identity_similarity_risk !== 'unknown'],
      ['voice_similarity_risk', rec.voice_similarity_risk !== 'high' && rec.voice_similarity_risk !== 'unknown'],
    ];
    for (const [field, ok] of req) {
      if (!ok) {
        failures.push(`Row ${line} (${rec.asset_id}): production candidate fails ${field} rule`);
      }
    }
  }

  // Training gate: MODEL_TRAINING = NO for this stage.
  if (rec.training_use === 'yes') {
    failures.push(`Row ${line} (${rec.asset_id}): training_use=yes is forbidden (MODEL_TRAINING = NO)`);
  }
});

if (failures.length > 0) {
  console.error('FPAI provenance validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('FPAI digital-human provenance validation passed');
console.log(`Rows: ${dataRows.length}`);
console.log(`Unique asset_id: ${seenIds.size}`);
console.log('training_use=yes: 0');
console.log('production candidates without full rights: 0');
