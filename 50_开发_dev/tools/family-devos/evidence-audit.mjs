#!/usr/bin/env node
import fs from 'node:fs';
import { loadState, compareAcceptance } from './core.mjs';

const taskId = process.argv[2];
const resultPath = process.argv[3] || process.env.FAMILY_AGENT_RESULT;
if (!taskId || !resultPath) throw new Error('usage: evidence-audit.mjs TASK_ID RESULT_JSON');
const state = loadState();
const task = state.tasks.get(taskId);
if (!task) throw new Error(`unknown task ${taskId}`);
const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
const failures = [];
if (result.task_id !== taskId) failures.push({ key: 'task_id', expected: taskId, actual: result.task_id });
if (result.agent_id !== task.agent_id) failures.push({ key: 'agent_id', expected: task.agent_id, actual: result.agent_id });
failures.push(...compareAcceptance(task.acceptance, result.checks));
if ((result.blockers ?? []).length) failures.push({ key: 'blockers', actual: result.blockers });
const ok = failures.length === 0;
console.log(JSON.stringify({ ok, task_id: taskId, failures, result_summary: result.summary }, null, 2));
process.exit(ok ? 0 : 4);
