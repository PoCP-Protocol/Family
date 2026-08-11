#!/usr/bin/env node
/**
 * M3-000 Dangerous Authorization Scan + Forbidden-Surface / Static Contract Test.
 * 只读扫描,不执行任何 runtime。要求:0 unauthorized hits + 0 forbidden-surface hits + 所有必需契约文件存在。
 * 用法:node tools/m3-dangerous-authorization-scan.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); // 50_开发_dev
const SELF = 'm3-dangerous-authorization-scan.mjs';
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.turbo', 'coverage', '.tmp']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|js|mjs|cjs|md|json|yaml|yml|sql)$/.test(name) && name !== SELF) out.push(p);
  }
  return out;
}

// 危险授权肯定式(只匹配"= AUTHORIZED / = YES",不匹配 NOT_AUTHORIZED / = NO)
const DANGER = [
  /M3_RUNTIME\s*=\s*AUTHORIZED/,
  /START_M3_RUNTIME\s*=\s*YES/,
  /REAL_MODEL_RUNTIME\s*=\s*YES/,
  /AGENT_RUNTIME\s*=\s*YES/,
  /WORLD_MODEL\s*=\s*YES/,
  /CAUSAL_ENGINE\s*=\s*YES/,
  /DH1\s*=\s*AUTHORIZED/,
  /VOICE_RUNTIME\s*=\s*YES/,
  /AVATAR_RUNTIME\s*=\s*YES/,
  /AUTO_GROWTH_PROFILE\s*=\s*YES/,
  /AUTO_GROWTH_PRIORITY\s*=\s*YES/,
  /AUTO_INTERVENTION\s*=\s*YES/,
  /AI_DIRECT_FAMILY_WRITE\s*=\s*YES/,
];

// 禁止的代码调用面(AI 直写 canonical / Gateway 触碰仓储或 Named Action)
const FORBIDDEN_SURFACE = [
  /model\.output\.growthProfile\s*[\).]/,
  /model\.output\.priority\s*[\).]/,
  /model\.output\.action\s*[\).]/,
];

const files = walk(ROOT);
const dangerHits = [];
const surfaceHits = [];
for (const f of files) {
  const txt = readFileSync(f, 'utf8');
  for (const re of DANGER) if (re.test(txt)) dangerHits.push(`${f} :: ${re}`);
  // forbidden surface 只查真实代码
  if (/\.(ts|tsx|js|mjs|cjs)$/.test(f)) {
    for (const re of FORBIDDEN_SURFACE) if (re.test(txt)) surfaceHits.push(`${f} :: ${re}`);
  }
}

// ai-gateway 不得引用 family/growth 仓储或 named action
const gwDir = join(ROOT, 'packages', 'ai-gateway', 'src');
if (existsSync(gwDir)) {
  for (const f of walk(gwDir)) {
    const t = readFileSync(f, 'utf8');
    if (/familyRepository|growthRepository|NamedAction|apps\/api/.test(t)) surfaceHits.push(`${f} :: ai-gateway 触碰业务仓储/NamedAction`);
  }
}

// ---------- M3-INT-001 §8:授权以 AUTHORIZATION_REGISTRY 为唯一来源(Gate 文档不再是授权来源) ----------
// 原则:代码中存在某 runtime capability,但 registry 未登记其 runtime_authorized=true → FAIL。
// 这样 Agent 无法靠自己改 Gate 报告完成自授权。
const govHits = [];
const REGISTRY = join(ROOT, 'governance', 'AUTHORIZATION_REGISTRY.yaml');
function registryCapabilityFlag(txt, capId, flag) {
  // 轻量解析:定位 capability_id 块,读其后到下一个 capability_id 之间的 flag: true/false
  const re = new RegExp(`capability_id:\\s*${capId}\\b([\\s\\S]*?)(?=\\n\\s*-\\s*capability_id:|$)`);
  const m = txt.match(re);
  if (!m) return undefined;
  const fm = m[1].match(new RegExp(`${flag}:\\s*(true|false)`));
  return fm ? fm[1] === 'true' : undefined;
}
const principalRuntimePresent = existsSync(join(ROOT, 'apps', 'api', 'src', 'modules', 'principal'));
if (principalRuntimePresent) {
  if (!existsSync(REGISTRY)) {
    govHits.push('principal runtime 存在,但 governance/AUTHORIZATION_REGISTRY.yaml 缺失(授权 SSOT 缺失)');
  } else {
    const rtxt = readFileSync(REGISTRY, 'utf8');
    const rtAuth = registryCapabilityFlag(rtxt, 'M3_101A_RUNTIME_FOUNDATION', 'runtime_authorized');
    if (rtAuth !== true) {
      govHits.push('principal runtime 存在,但 registry 未授权 M3_101A_RUNTIME_FOUNDATION.runtime_authorized=true');
    }
  }
}
// 纯 M3-000 契约分支可强制"无 runtime"
if (process.env.M3_FORBID_PRINCIPAL_RUNTIME === '1' && principalRuntimePresent) {
  surfaceHits.push('apps/api/src/modules/principal 存在(M3_FORBID_PRINCIPAL_RUNTIME=1)');
}

// 必需契约文件存在
const REQUIRED = [
  'reports/m3/M3_000_FPAI_INTELLIGENCE_CONTRACT_FREEZE.md',
  'reports/m3/M3_000_SHARED_FILE_CONFLICT_MATRIX.md',
  'products/famili-principal/architecture/FPAI_CONTEXT_BROKER_CONTRACT_V1.md',
  'products/famili-principal/architecture/FPAI_ACTION_BRIDGE_CONTRACT_V1.md',
  'products/famili-principal/architecture/FPAI_SAFETY_HUMAN_HANDOFF_CONTRACT_V1.md',
  'products/famili-principal/architecture/FPAI_MODEL_GATEWAY_BOUNDARY_V1.md',
  'products/famili-principal/architecture/FPAI_MODEL_RUN_LEDGER_V1.md',
  'products/famili-principal/architecture/FPAI_PRODUCT_EVENT_CONTRACT_V1.md',
  'products/famili-principal/architecture/FPAI_MOS_TEXT_RUNTIME_SLICE_V1.md',
];
const missing = REQUIRED.filter((r) => !existsSync(join(ROOT, r)));

console.log(`扫描文件数: ${files.length}`);
console.log(`危险授权命中 (要求0): ${dangerHits.length}`);
dangerHits.forEach((h) => console.log('  DANGER ' + h));
console.log(`禁止调用面命中 (要求0): ${surfaceHits.length}`);
surfaceHits.forEach((h) => console.log('  SURFACE ' + h));
console.log(`缺失必需契约 (要求0): ${missing.length}`);
missing.forEach((m) => console.log('  MISSING ' + m));
console.log(`授权治理命中 (要求0): ${govHits.length}`);
govHits.forEach((h) => console.log('  GOV ' + h));

const fail = dangerHits.length + surfaceHits.length + missing.length + govHits.length;
console.log(fail === 0 ? '\nM3 STATIC + GOVERNANCE SCAN: PASS (0 hits)' : `\nM3 STATIC + GOVERNANCE SCAN: FAIL (${fail})`);
process.exit(fail ? 1 : 0);
