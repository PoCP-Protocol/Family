#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { loadState } from './core.mjs';
const taskId = process.argv[2];
if (!taskId) throw new Error('usage: run-task-checks.mjs TASK_ID');
const task = loadState().tasks.get(taskId);
if (!task) throw new Error(`unknown task ${taskId}`);
for (const command of task.test_commands ?? []) {
  console.log(`\n[family-devos] test: ${command}`);
  const r = spawnSync('bash', ['-lc', command], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
