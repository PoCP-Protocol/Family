#!/usr/bin/env node
/**
 * MERGE AUTHORIZATION GUARD(M3-MOS-CLOSEOUT-WAVE-2 process hardening)。
 *
 * 目的:堵死"提前合入 master"这一 GOVERNANCE_PROCESS_VIOLATION(见 PR#17/#18)。
 * 规则:当 PR 的 base = master(或 main),必须在 governance/MERGE_AUTHORIZATIONS.yaml 的 authorizations[]
 *       中存在一条 { pr, head_sha, authorized_by: family-chief-architect } 且 head_sha 与本 PR head 完全一致。
 *       缺失 / SHA 不匹配 / 授权人非总架构师 → 退出码 1 = MERGE_DENIED。
 * 关键:CI green 不能覆盖授权;此 check 本身作为 required check,配合分支保护即可强制。
 *
 * 输入(CI):读取 $GITHUB_EVENT_PATH(pull_request 事件)取 base ref / head sha / PR number。
 * 本地自检:node merge-authorization-guard.mjs --base master --sha <sha> --pr <n>
 */
import fs from 'node:fs';
import path from 'node:path';

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  return { base: get('--base'), sha: get('--sha'), pr: get('--pr') };
}

function fromGithubEvent() {
  const p = process.env.GITHUB_EVENT_PATH;
  if (!p || !fs.existsSync(p)) return null;
  try {
    const ev = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pr = ev.pull_request;
    if (!pr) return null;
    return { base: pr.base?.ref, sha: pr.head?.sha, pr: String(pr.number) };
  } catch { return null; }
}

// 极简 YAML 读取(仅解析本账本已知结构:authorizations 列表的 pr/head_sha/authorized_by)。
function loadLedger(file) {
  const text = fs.readFileSync(file, 'utf8');
  const auths = [];
  const lines = text.split(/\r?\n/);
  let inAuth = false, cur = null;
  for (const raw of lines) {
    const line = raw.replace(/\t/g, '  ');
    if (/^authorizations:\s*\[\s*\]\s*$/.test(line)) return { authorizations: [] };
    if (/^authorizations:\s*$/.test(line)) { inAuth = true; continue; }
    if (inAuth) {
      if (/^\S/.test(line)) break; // 顶层新键 → authorizations 段结束
      const m = line.match(/^\s*-\s*pr:\s*(.+)$/);
      if (m) { if (cur) auths.push(cur); cur = { pr: m[1].trim() }; continue; }
      const kv = line.match(/^\s+([a-z_]+):\s*(.+)$/);
      if (kv && cur) cur[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  if (cur) auths.push(cur);
  return { authorizations: auths };
}

const args = parseArgs();
const ctx = (args.base || args.sha) ? args : (fromGithubEvent() || args);
const base = (ctx.base || '').replace(/^refs\/heads\//, '');
const headSha = ctx.sha || '';
const prNum = ctx.pr || '';

const PROTECTED = ['master', 'main'];
if (!PROTECTED.includes(base)) {
  console.log(`MERGE AUTH GUARD: base='${base || 'unknown'}' 非受保护分支 → 跳过(仅 master/main 强制)。`);
  process.exit(0);
}

const ledgerFile = path.resolve(process.cwd(), 'governance/MERGE_AUTHORIZATIONS.yaml');
if (!fs.existsSync(ledgerFile)) {
  console.error('MERGE_DENIED: 缺 governance/MERGE_AUTHORIZATIONS.yaml');
  process.exit(1);
}
const { authorizations } = loadLedger(ledgerFile);
const match = authorizations.find(
  (e) => String(e.pr) === String(prNum) && e.head_sha === headSha && e.authorized_by === 'family-chief-architect',
);

if (!match) {
  console.error('==================================================');
  console.error('MERGE_DENIED — 缺显式合并授权(base=%s, PR=#%s, head=%s)', base, prNum || '?', headSha || '?');
  console.error('需总架构师在 governance/MERGE_AUTHORIZATIONS.yaml 的 authorizations[] 登记:');
  console.error('  - pr: %s', prNum || '<n>');
  console.error('    head_sha: "%s"', headSha || '<sha>');
  console.error('    authorized_by: family-chief-architect');
  console.error('    ref: "<裁决引用>"');
  console.error('    date: "<YYYY-MM-DD>"');
  console.error('CI green 不能覆盖授权。技术追认 != 流程合规。');
  console.error('==================================================');
  process.exit(1);
}

console.log(`MERGE AUTH GUARD: PASS — PR #${prNum} head ${headSha} 已由 ${match.authorized_by} 授权(ref=${match.ref || 'n/a'})。`);
process.exit(0);
