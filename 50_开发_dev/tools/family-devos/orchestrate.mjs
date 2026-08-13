#!/usr/bin/env node
import fs from 'node:fs';
import { loadState, validateState, runnableTasks, eligiblePlannedTasks, buildPacket } from './core.mjs';

const [cmd = 'plan', arg] = process.argv.slice(2);
const state = loadState();
const errors = validateState(state);
if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(2);
}

if (cmd === 'validate') {
  console.log(JSON.stringify({ ok: true, tasks: state.tasks.size, agents: state.agents.size }, null, 2));
  process.exit(0);
}

if (cmd === 'plan') {
  const runnable = runnableTasks(state);
  const eligible = eligiblePlannedTasks(state);
  const matrix = { include: runnable.map(t => ({ task_id: t.task_id, agent_id: t.agent_id, base_ref: t.base_ref, merge_class: t.merge_class })) };
  if (process.argv.includes('--github-output')) {
    const out = process.env.GITHUB_OUTPUT;
    if (!out) throw new Error('GITHUB_OUTPUT missing');
    fs.appendFileSync(out, `matrix=${JSON.stringify(matrix)}\ncount=${runnable.length}\n`);
  }
  console.log(JSON.stringify({ ok: true, runnable: runnable.map(t => t.task_id), eligible_planned: eligible.map(t => t.task_id), matrix }, null, 2));
  process.exit(0);
}

if (cmd === 'packet') {
  const task = state.tasks.get(arg);
  if (!task) throw new Error(`Unknown task ${arg}`);
  const agent = state.agents.get(task.agent_id);
  process.stdout.write(buildPacket(task, agent, state));
  process.exit(0);
}

throw new Error(`Unknown command ${cmd}`);
