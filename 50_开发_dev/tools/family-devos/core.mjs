import fs from 'node:fs';
import path from 'node:path';

export const TERMINAL_DEP_STATES = new Set(['MERGED', 'PASS_CLOSED']);
export const RUNNABLE_STATES = new Set(['READY']);

export function devRoot(cwd = process.cwd()) {
  const explicit = process.env.FAMILY_DEVOS_ROOT;
  if (explicit && fs.existsSync(path.join(explicit, 'family-os'))) return path.resolve(explicit);
  if (fs.existsSync(path.join(cwd, 'family-os'))) return cwd;
  const p = path.join(cwd, '50_开发_dev');
  if (fs.existsSync(path.join(p, 'family-os'))) return p;
  throw new Error('Cannot resolve 50_开发_dev; run from repository root or 50_开发_dev');
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadState(cwd = process.cwd()) {
  const root = devRoot(cwd);
  const os = path.join(root, 'family-os');
  const program = readJson(path.join(os, 'PROGRAM_STATE_V4.json'));
  const agentDoc = readJson(path.join(os, 'AGENTS_V1.json'));
  const taskDoc = readJson(path.join(os, 'TASK_REGISTRY_V1.json'));
  return {
    root,
    os,
    program,
    agents: new Map(agentDoc.agents.map(a => [a.agent_id, a])),
    tasks: new Map(taskDoc.tasks.map(t => [t.task_id, t])),
    taskDoc
  };
}

export function validateState(state) {
  const errors = [];
  const ids = new Set();
  for (const task of state.tasks.values()) {
    if (ids.has(task.task_id)) errors.push(`duplicate task_id: ${task.task_id}`);
    ids.add(task.task_id);
    if (!state.agents.has(task.agent_id)) errors.push(`${task.task_id}: unknown agent ${task.agent_id}`);
    if (task.status === 'READY' && task.authorization_state !== 'AUTHORIZED') errors.push(`${task.task_id}: READY but not AUTHORIZED`);
    if (task.authorization_state === 'AUTHORIZED' && !task.authorization_ref) errors.push(`${task.task_id}: authorized without authorization_ref`);
    if ((task.allowed_paths ?? []).length === 0 && task.status === 'READY') errors.push(`${task.task_id}: READY with no allowed_paths`);
    for (const dep of task.depends_on ?? []) if (!state.tasks.has(dep)) errors.push(`${task.task_id}: unknown dependency ${dep}`);
    if (task.status === 'SUPERSEDED' && task.authorization_state === 'AUTHORIZED') errors.push(`${task.task_id}: SUPERSEDED cannot remain AUTHORIZED`);
  }
  // cycle detection
  const visiting = new Set();
  const visited = new Set();
  function dfs(id) {
    if (visiting.has(id)) { errors.push(`dependency cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    const task = state.tasks.get(id);
    for (const dep of task?.depends_on ?? []) dfs(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const id of state.tasks.keys()) dfs(id);
  return errors;
}

export function dependencySatisfied(task, state) {
  return (task.depends_on ?? []).every(dep => TERMINAL_DEP_STATES.has(state.tasks.get(dep)?.status));
}

export function runnableTasks(state) {
  return [...state.tasks.values()].filter(task =>
    RUNNABLE_STATES.has(task.status) &&
    task.authorization_state === 'AUTHORIZED' &&
    dependencySatisfied(task, state) &&
    state.agents.get(task.agent_id)?.writes_product_code === true
  );
}

export function eligiblePlannedTasks(state) {
  return [...state.tasks.values()].filter(task =>
    task.status === 'PLANNED' &&
    task.authorization_state === 'AUTHORIZED' &&
    dependencySatisfied(task, state)
  );
}

function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
export function globMatch(file, pattern) {
  if (pattern === '**') return true;
  if (pattern.endsWith('/**')) return file === pattern.slice(0, -3) || file.startsWith(pattern.slice(0, -2));
  if (pattern.includes('*')) {
    const re = '^' + pattern.split('*').map(esc).join('.*') + '$';
    return new RegExp(re).test(file);
  }
  return file === pattern;
}

export function auditPaths(task, files) {
  const violations = [];
  for (const file of files) {
    if ((task.forbidden_paths ?? []).some(p => globMatch(file, p))) {
      violations.push({ file, reason: 'FORBIDDEN_PATH' });
      continue;
    }
    if (!(task.allowed_paths ?? []).some(p => globMatch(file, p))) violations.push({ file, reason: 'OUTSIDE_ALLOWED_PATHS' });
  }
  return violations;
}

export function compareAcceptance(spec, checks) {
  const failures = [];
  for (const rule of spec ?? []) {
    const actual = checks?.[rule.key];
    let ok = false;
    if (rule.op === 'eq') ok = actual === rule.value;
    else if (rule.op === 'gt') ok = typeof actual === 'number' && actual > rule.value;
    else if (rule.op === 'gte') ok = typeof actual === 'number' && actual >= rule.value;
    else if (rule.op === 'lt') ok = typeof actual === 'number' && actual < rule.value;
    else if (rule.op === 'lte') ok = typeof actual === 'number' && actual <= rule.value;
    else failures.push({ key: rule.key, reason: `unknown op ${rule.op}` });
    if (!ok) failures.push({ key: rule.key, expected: `${rule.op} ${JSON.stringify(rule.value)}`, actual });
  }
  return failures;
}

export function buildPacket(task, agent, state) {
  return `# FAMILY DEV OS TASK PACKET\n\nTASK_ID: ${task.task_id}\nTITLE: ${task.title}\nAGENT: ${agent.agent_id} (${agent.role})\nBASE_REF: ${task.base_ref}\nMERGE_CLASS: ${task.merge_class}\nAUTHORIZATION: ${task.authorization_state}\nAUTHORIZATION_REF: ${task.authorization_ref ?? 'NONE'}\n\n## Goal\nExecute only this task. Do not start any other Gate.\n\n## Allowed paths\n${(task.allowed_paths ?? []).map(x => `- ${x}`).join('\n')}\n\n## Forbidden paths\n${(task.forbidden_paths ?? []).map(x => `- ${x}`).join('\n')}\n\n## Required tests\n${(task.test_commands ?? []).map(x => `- ${x}`).join('\n') || '- none'}\n\n## Acceptance contract\n${(task.acceptance ?? []).map(x => `- ${x.key} ${x.op} ${JSON.stringify(x.value)}`).join('\n') || '- none'}\n\n## Constitutional constraints\n- No self-authorization.\n- No Gate leap.\n- No direct push to master.\n- AI_INFERENCE/HYPOTHESIS/PERSPECTIVE never become FACT by agent fiat.\n- AI cannot directly mutate canonical Family/Growth state.\n- Named Action, consent, safety, permission, idempotency, transaction and audit controls remain authoritative.\n\n## Result file\nWrite JSON to $FAMILY_AGENT_RESULT with keys: task_id, agent_id, summary, checks, tests, blockers, recommended_status.\nThen stop.\n`;
}
