#!/usr/bin/env node
/**
 * W2R-103B(裁决 M3-W2R-CONV-001 §9/§10):本脚本降级为 **build wrapper + output verifier**。
 * 证据权威 = Python SSOT(20_知识_knowledge/byresearch:Library.validate + Evidence.gate)。
 * 本脚本不再自行判定 E0-E7 / Evidence Gate,只:
 *   1) build 时 spawn Python 编译器 compile_principal_bundle.py;
 *   2) 校验其产物(evidence_summary.python_evidence_gate=PASS 且 external_verified_count>0 且有 knowledge_refs)。
 * 用法:node tools/compile-knowledge.mjs
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');            // 50_开发_dev
const KNOWLEDGE_PY_DIR = join(ROOT, '..', '20_知识_knowledge');             // Python SSOT 根
const OUT = join(ROOT, 'knowledge', 'compiled');

function runPython() {
  for (const py of ['python', 'python3', 'py']) {
    const r = spawnSync(py, ['-m', 'byresearch.compile_principal_bundle'], { cwd: KNOWLEDGE_PY_DIR, encoding: 'utf8' });
    if (r.error && r.error.code === 'ENOENT') continue;   // 该解释器不存在,换下一个
    return { py, ...r };
  }
  return { py: null, status: 127, stderr: 'no python interpreter found (python/python3/py)' };
}

const res = runPython();
if (res.py === null) { console.log('KNOWLEDGE COMPILE: FAIL — ' + res.stderr); process.exit(1); }
if (res.stdout) process.stdout.write(res.stdout);
if (res.status !== 0) {
  console.log(`KNOWLEDGE COMPILE: FAIL — Python compiler exit ${res.status}`);
  if (res.stderr) process.stderr.write(res.stderr);
  process.exit(1);
}

// ---- output verifier(不判等级,只核 Python 已裁定的 gate 结果)----
const errors = [];
const files = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith('.json')) : [];
if (!files.length) errors.push('no compiled bundle produced');
for (const f of files) {
  let b;
  try { b = JSON.parse(readFileSync(join(OUT, f), 'utf8')); }
  catch { errors.push(`${f}: invalid JSON`); continue; }
  const s = b.evidence_summary;
  if (!s) { errors.push(`${f}: missing evidence_summary (Python authority)`); continue; }
  if (s.python_evidence_gate !== 'PASS') errors.push(`${f}: python_evidence_gate=${s.python_evidence_gate}`);
  if (!(s.external_verified_count > 0)) errors.push(`${f}: external_verified_count=${s.external_verified_count}`);
  const refs = [...(b.theories ?? []), ...(b.constructs ?? []), ...(b.methods ?? []), ...(b.modalities ?? [])]
    .flatMap((n) => n.source_refs ?? []);
  if (!refs.length) errors.push(`${f}: no knowledge_refs`);
}

if (errors.length) {
  console.log(`KNOWLEDGE COMPILE: FAIL (${errors.length})`);
  errors.forEach((e) => console.log('  ' + e));
  process.exit(1);
}
console.log(`KNOWLEDGE COMPILE: PASS — verified ${files.length} Python-compiled bundle(s) in knowledge/compiled/`);
