#!/usr/bin/env node
/**
 * W2R-103 知识编译/校验(RB-003 §18):Knowledge YAML → validate(Evidence gate)→ Compiled JSON bundle。
 * 不建 Python 微服务、不建 Knowledge 平台;每请求由 TS 读已编译 bundle,不 spawn。
 * 校验:每节点须 evidence_level(E0-E7)+ non_decisive:true;关系必须可解析(grounded_in/targets/uses)。
 * 用法:node tools/compile-knowledge.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const yaml = createRequire(import.meta.url)('js-yaml'); // js-yaml v5 = CJS

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'knowledge', 'interventions');
const OUT = join(ROOT, 'knowledge', 'compiled');
const E_LEVELS = new Set(['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E0_UNREVIEWED', 'E1_REVIEWED_METHOD_ASSET']);

const errors = [];
function checkNode(kind, n, ids) {
  if (!n.id) errors.push(`${kind} missing id`);
  if (!n.evidence_level || ![...E_LEVELS].some((e) => String(n.evidence_level).startsWith(e.slice(0, 2)))) {
    errors.push(`${kind} ${n.id}: invalid/missing evidence_level`);
  }
  if (n.non_decisive !== true) errors.push(`${kind} ${n.id}: ResearchEvidence must be non_decisive:true`);
}
function checkRef(kind, id, ref, ids) { if (ref && !ids.has(ref)) errors.push(`${kind} ${id}: unresolved ref ${ref}`); }

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter((f) => f.endsWith('.knowledge.yaml'));
let compiled = 0;
for (const f of files) {
  const doc = yaml.load(readFileSync(join(SRC, f), 'utf8'));
  const ids = new Set([
    ...(doc.theories ?? []).map((x) => x.id),
    ...(doc.constructs ?? []).map((x) => x.id),
    ...(doc.methods ?? []).map((x) => x.id),
    ...(doc.modalities ?? []).map((x) => x.id),
  ]);
  (doc.theories ?? []).forEach((t) => checkNode('theory', t, ids));
  (doc.constructs ?? []).forEach((c) => { checkNode('construct', c, ids); checkRef('construct', c.id, c.grounded_in, ids); });
  (doc.methods ?? []).forEach((m) => {
    checkNode('method', m, ids);
    checkRef('method', m.id, m.grounded_in, ids);            // Method GROUNDED_IN Theory
    (m.targets ?? []).forEach((t) => checkRef('method', m.id, t, ids)); // TARGETS Construct
    (m.uses ?? []).forEach((u) => checkRef('method', m.id, u, ids));    // USES Modality
    if (!m.grounded_in) errors.push(`method ${m.id}: must be GROUNDED_IN a theory`);
    if (!(m.targets ?? []).length) errors.push(`method ${m.id}: must TARGET at least one construct`);
  });
  (doc.modalities ?? []).forEach((m) => checkNode('modality', m, ids));

  if (errors.length === 0) {
    const bundle = { schema_version: 'KNOWLEDGE_BUNDLE_V1', intervention_id: doc.intervention_id, ...doc, compiled_from: f };
    writeFileSync(join(OUT, basename(f, '.knowledge.yaml') + '.json'), JSON.stringify(bundle, null, 2));
    compiled += 1;
  }
}

if (errors.length) {
  console.log(`KNOWLEDGE COMPILE: FAIL (${errors.length})`);
  errors.forEach((e) => console.log('  ' + e));
  process.exit(1);
}
console.log(`KNOWLEDGE COMPILE: PASS — compiled ${compiled} chain(s) → knowledge/compiled/`);
