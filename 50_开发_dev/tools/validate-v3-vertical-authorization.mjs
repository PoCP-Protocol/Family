import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const root = process.cwd();
const registryPath = path.join(root, 'governance', 'AUTHORIZATION_REGISTRY.yaml');
const contractPath = path.join(root, 'governance', 'FAMILY_GROWTH_VERTICAL_SLICE_001_TASK_CONTRACT.md');
const registry = yaml.load(fs.readFileSync(registryPath, 'utf8'));
const cap = registry.capabilities.find((x) => x.capability_id === 'FAMILY_GROWTH_VERTICAL_SLICE_001');
if (!cap) throw new Error('missing FAMILY_GROWTH_VERTICAL_SLICE_001 authorization');
const expected = {
  architecture_authorized: true,
  code_authorized: true,
  runtime_authorized: true,
  live_external_call_authorized: false,
  pilot_authorized: false,
  production_authorized: false,
};
for (const [key, value] of Object.entries(expected)) {
  if (cap[key] !== value) throw new Error(`authorization mismatch: ${key}=${cap[key]}`);
}
const contract = fs.readFileSync(contractPath, 'utf8');
for (const token of ['GrowthNeedSignal', 'FamilyServiceDecision', 'ServiceCase', 'x-actor-id', '试点']) {
  if (!contract.includes(token)) throw new Error(`task contract missing token: ${token}`);
}
console.log('V3 vertical authorization and task contract: PASS');
