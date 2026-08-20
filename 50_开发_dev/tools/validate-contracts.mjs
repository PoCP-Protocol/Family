#!/usr/bin/env node
/**
 * TASK-002 工程契约静态校验(不含需活库的 DDL 执行)。
 * 校验:YAML 可解析(ontology/action/event/policy/api/agents)、JSON Schema 可编译(ajv)、
 *       OpenAPI 结构、Consent 矩阵角色完整性、scaffold 冲突。
 * 用法:node tools/validate-contracts.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as YAML from 'js-yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const loadYaml = YAML.load ?? YAML.default?.load;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const results = [];
const rec = (area, ok, detail) => results.push({ area, ok, detail });

function walk(dir, filterExt) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, filterExt));
    else if (filterExt.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

// 1) YAML 可解析
const yamlDirs = ['specs', 'agents', 'policies', 'events'];
let yamlFiles = [];
for (const d of yamlDirs) yamlFiles.push(...walk(join(ROOT, d), ['.yaml', '.yml']));
for (const f of yamlFiles) {
  try {
    loadYaml(readFileSync(f, 'utf8'));
    rec('YAML', true, rel(f));
  } catch (e) {
    rec('YAML', false, `${rel(f)} :: ${e.message.split('\n')[0]}`);
  }
}

// 2) JSON Schema 可编译(ajv)
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats.default ? addFormats.default(ajv) : addFormats(ajv);
const schemaFiles = [
  ...walk(join(ROOT, 'events'), ['.schema.json']),
  ...walk(join(ROOT, 'integrations'), ['.schema.json']),
  ...walk(join(ROOT, 'evals'), ['.json']),
];
for (const f of schemaFiles) {
  try {
    const doc = JSON.parse(readFileSync(f, 'utf8'));
    // 仅对看起来是 JSON Schema 的文件编译
    if (doc.$schema || doc.type || doc.properties || doc.$id) ajv.compile(doc);
    rec('JSONSchema', true, rel(f));
  } catch (e) {
    rec('JSONSchema', false, `${rel(f)} :: ${e.message.split('\n')[0]}`);
  }
}

// 3) OpenAPI 结构
for (const f of walk(join(ROOT, 'specs', 'api'), ['.yaml', '.yml'])) {
  try {
    const doc = loadYaml(readFileSync(f, 'utf8'));
    const ok = !!(doc && (doc.openapi || doc.swagger) && doc.paths);
    rec('OpenAPI', ok, `${rel(f)} openapi=${doc?.openapi ?? '-'} paths=${doc?.paths ? Object.keys(doc.paths).length : 0}`);
  } catch (e) {
    rec('OpenAPI', false, `${rel(f)} :: ${e.message.split('\n')[0]}`);
  }
}

// 4) Consent 矩阵角色完整性(空单元格视为未定义)
const consentCsv = join(ROOT, 'security', 'CONSENT_PERMISSION_MATRIX.csv');
if (existsSync(consentCsv)) {
  const lines = readFileSync(consentCsv, 'utf8').trim().split(/\r?\n/);
  const header = lines[0].split(',');
  let empties = 0;
  const rolesSeen = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    rolesSeen.push(cells[0]);
    for (const c of cells) if (c.trim() === '') empties++;
  }
  rec('Consent', empties === 0, `roles=${rolesSeen.length} cols=${header.length} 空单元格=${empties}`);
} else rec('Consent', false, 'CONSENT_PERMISSION_MATRIX.csv 不存在');

// 5) scaffold 冲突(与实际 root workspace 是否命名冲突)
try {
  const scaffoldPkg = JSON.parse(readFileSync(join(ROOT, 'scaffold', 'package.json'), 'utf8'));
  const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const conflict = scaffoldPkg.name === rootPkg.name;
  rec('Scaffold', true, `scaffold.name=${scaffoldPkg.name} root.name=${rootPkg.name}${conflict ? ' (同名:scaffold为模板,实际以root为准)' : ''}`);
} catch (e) {
  rec('Scaffold', false, e.message.split('\n')[0]);
}

// 6) 数据库迁移静态检查（真实执行仍需活库）。
// 迁移目录同时承载 schema DDL、enum 演进、只读视图和幂等 seed；
// 不能只把 CREATE TABLE / ALTER TABLE 当作唯一有效迁移。
const migrationStatementPattern = /\b(?:create\s+(?:or\s+replace\s+)?(?:table|type|extension|view|(?:unique\s+)?index)|alter\s+(?:table|type)|insert\s+into)\b/i;
for (const f of walk(join(ROOT, 'database'), ['.sql'])) {
  const txt = readFileSync(f, 'utf8');
  rec('DDL-static', migrationStatementPattern.test(txt), `${rel(f)} bytes=${txt.length}`);
}

// 汇总
const by = {};
for (const r of results) {
  by[r.area] ??= { ok: 0, fail: 0, fails: [] };
  if (r.ok) by[r.area].ok++;
  else { by[r.area].fail++; by[r.area].fails.push(r.detail); }
}
console.log('=== TASK-002 静态契约校验汇总 ===');
let anyFail = false;
for (const [area, s] of Object.entries(by)) {
  console.log(`${s.fail === 0 ? 'PASS' : 'FAIL'}  ${area}: ok=${s.ok} fail=${s.fail}`);
  for (const d of s.fails) { console.log(`      ✗ ${d}`); anyFail = true; }
}
console.log(`\n总文件校验:${results.length};失败:${results.filter((r) => !r.ok).length}`);
console.log('注:DDL 的真实执行(对 PostgreSQL)需 Docker 守护运行,本次未跑。');
process.exit(anyFail ? 1 : 0);
