#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { loadState, auditPaths } from './core.mjs';

const taskId = process.argv[2];
const baseRef = process.argv[3] || 'origin/master';
if (!taskId) throw new Error('usage: governance-audit.mjs TASK_ID [BASE_REF]');
const state = loadState();
const task = state.tasks.get(taskId);
if (!task) throw new Error(`unknown task ${taskId}`);

const out = execFileSync('git', ['-c', 'core.quotepath=false', 'diff', '--name-only', `${baseRef}...HEAD`], { encoding: 'utf8' }).trim();
const files = out ? out.split(/\r?\n/).filter(Boolean) : [];
const violations = auditPaths(task, files);
const diff = execFileSync('git', ['diff', '--unified=0', `${baseRef}...HEAD`], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const dangerous = [];
const selfAuthPatterns = [
  /authorized_by\s*:\s*family-chief-architect/i,
  /CHIEF_ARCHITECT_DECISION\s*=\s*APPROVED/i,
  /SIGNOFF\s*=\s*.*总架构师/i
];
if (!task.allow_record_architect_authorization) {
  for (const re of selfAuthPatterns) if (re.test(diff)) dangerous.push(`SELF_AUTHORIZATION_PATTERN:${re}`);
}
if (/\+.*AI_INFERENCE\s*=+\s*FACT/i.test(diff)) dangerous.push('AI_INFERENCE_TO_FACT_PATTERN');
if (/\+.*AI.*direct.*canonical.*write/i.test(diff)) dangerous.push('AI_DIRECT_CANONICAL_WRITE_PATTERN');

const ok = violations.length === 0 && dangerous.length === 0;
console.log(JSON.stringify({ ok, task_id: taskId, base_ref: baseRef, files, violations, dangerous }, null, 2));
process.exit(ok ? 0 : 3);
