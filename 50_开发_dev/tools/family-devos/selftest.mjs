#!/usr/bin/env node
import assert from 'node:assert/strict';
import { loadState, validateState, runnableTasks, globMatch, auditPaths, compareAcceptance } from './core.mjs';

const state = loadState();
assert.deepEqual(validateState(state), []);
const runnable = runnableTasks(state).map(t => t.task_id).sort();
assert.deepEqual(runnable, ['FLM_AC_002', 'OPS_001', 'TENANCY_001', 'W2R_103B']);
assert.equal(runnable.includes('OBJECT_TREE_P2'), false);
assert.equal(runnable.includes('OBJECT_TREE_P3_GENERATIVE'), false);
assert.equal(globMatch('50_开发_dev/packages/principal-ai/src/a.ts', '50_开发_dev/packages/principal-ai/**'), true);
assert.equal(globMatch('10_规格_spec/x.md', '10_规格_spec/**'), true);
const t = state.tasks.get('W2R_103B');
assert.deepEqual(auditPaths(t, ['20_知识_knowledge/library/methods.yaml']), []);
assert.equal(auditPaths(t, ['10_规格_spec/a.md']).length, 1);
assert.deepEqual(compareAcceptance([{key:'x',op:'gt',value:0},{key:'y',op:'eq',value:true}], {x:1,y:true}), []);
assert.equal(compareAcceptance([{key:'x',op:'gt',value:0}], {x:0}).length, 1);
console.log(JSON.stringify({ ok: true, runnable, assertions: 9 }, null, 2));
