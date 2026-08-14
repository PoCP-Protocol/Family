#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadState, validateState, buildPacket, dependencySatisfied } from './core.mjs';

const taskId = process.argv[2];
if (!taskId) throw new Error('usage: run-agent.mjs TASK_ID');
const state = loadState();
const errors = validateState(state);
if (errors.length) throw new Error(`invalid Dev OS state: ${errors.join('; ')}`);
const task = state.tasks.get(taskId);
if (!task) throw new Error(`unknown task ${taskId}`);
if (task.status !== 'READY') throw new Error(`${taskId}: status ${task.status}, expected READY`);
if (task.authorization_state !== 'AUTHORIZED') throw new Error(`${taskId}: not authorized`);
if (!dependencySatisfied(task, state)) throw new Error(`${taskId}: dependency not terminal`);
const agent = state.agents.get(task.agent_id);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'family-agent-'));
const packetPath = process.env.FAMILY_TASK_PACKET || path.join(tmp, 'task-packet.md');
const resultPath = process.env.FAMILY_AGENT_RESULT || path.join(tmp, 'agent-result.json');
fs.writeFileSync(packetPath, buildPacket(task, agent, state));

const mode = process.env.FAMILY_AGENT_RUNNER || 'mock';
if (mode === 'mock') {
  const result = {
    task_id: taskId,
    agent_id: task.agent_id,
    summary: 'MOCK_STARTED: orchestration and task packet contract verified; no product code executed.',
    checks: { mock_started: true },
    tests: [], blockers: ['REAL_AGENT_RUNNER_NOT_CONFIGURED'], recommended_status: 'READY'
  };
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ mode, packetPath, resultPath, result }, null, 2));
  process.exit(0);
}

if (mode !== 'custom') throw new Error(`unsupported FAMILY_AGENT_RUNNER=${mode}`);
const bootstrap = process.env.FAMILY_AGENT_BOOTSTRAP_COMMAND?.trim();
if (bootstrap) {
  const r = spawnSync('bash', ['-lc', bootstrap], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const command = process.env.FAMILY_AGENT_COMMAND?.trim();
if (!command) throw new Error('FAMILY_AGENT_COMMAND required for custom runner');
const r = spawnSync('bash', ['-lc', command], {
  stdio: 'inherit',
  env: { ...process.env, FAMILY_TASK_PACKET: packetPath, FAMILY_AGENT_RESULT: resultPath, FAMILY_TASK_ID: taskId, FAMILY_AGENT_ID: task.agent_id }
});
if (r.status !== 0) process.exit(r.status ?? 1);
if (!fs.existsSync(resultPath)) throw new Error(`agent did not write result: ${resultPath}`);
console.log(JSON.stringify({ mode, packetPath, resultPath }, null, 2));
