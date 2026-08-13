#!/usr/bin/env node
/**
 * MM1-B1.1 · fpai:mm1b1:live 启动器
 *
 * 契约 (硬):
 *   1. 只读 50_开发_dev/.env (Family 项目内),不读任何其他 .env / secret 位置。
 *   2. 不发起任何网络调用。仅做 preflight 检查,输出下一步指令。
 *   3. FPAI_REAL_SPEECH_ENABLED != YES → BLOCKED_DISABLED, 建议先改 .env。
 *   4. FPAI_AZURE_SPEECH_KEY / FPAI_AZURE_SPEECH_REGION 任一缺失 → BLOCKED_MISSING_CREDENTIAL。
 *   5. 全部齐 → PRINTS_RUN_INSTRUCTION (不 spawn dev server, 由 human gate 决定何时启动)。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..'); // 50_开发_dev
const envPath = path.join(repoRoot, '.env');

function parseEnv(text) {
  const map = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    map[k] = v;
  }
  return map;
}

function main() {
  console.log('[fpai:mm1b1:live] preflight — 只读 50_开发_dev/.env, 不发起网络调用');
  console.log(`[fpai:mm1b1:live] env path = ${envPath}`);

  if (!fs.existsSync(envPath)) {
    console.error('[fpai:mm1b1:live] BLOCKED_MISSING_ENV_FILE — 请从 .env.example 复制并填入 credential');
    console.error('    Copy-Item .env.example .env  # 然后编辑填入 FPAI_AZURE_SPEECH_KEY 与 FPAI_AZURE_SPEECH_REGION');
    process.exit(2);
  }

  const env = parseEnv(fs.readFileSync(envPath, 'utf-8'));
  const flag = (env['FPAI_REAL_SPEECH_ENABLED'] ?? 'NO').toUpperCase();
  const key = env['FPAI_AZURE_SPEECH_KEY'] ?? '';
  const region = env['FPAI_AZURE_SPEECH_REGION'] ?? '';
  const avatarMode = (env['FPAI_AVATAR_PROVIDER'] ?? 'FAMILY_LOCAL_2D').toUpperCase();

  console.log(`[fpai:mm1b1:live] FPAI_REAL_SPEECH_ENABLED = ${flag}`);
  console.log(`[fpai:mm1b1:live] FPAI_AVATAR_PROVIDER    = ${avatarMode}`);
  console.log(`[fpai:mm1b1:live] FPAI_AZURE_SPEECH_KEY   = ${key ? '<redacted, len=' + key.length + '>' : '<EMPTY>'}`);
  console.log(`[fpai:mm1b1:live] FPAI_AZURE_SPEECH_REGION= ${region || '<EMPTY>'}`);

  if (flag !== 'YES') {
    console.error('[fpai:mm1b1:live] BLOCKED_DISABLED — 需要在 .env 里将 FPAI_REAL_SPEECH_ENABLED=YES');
    process.exit(3);
  }
  if (!key || !region) {
    console.error('[fpai:mm1b1:live] BLOCKED_MISSING_CREDENTIAL — 需要在 .env 里填 FPAI_AZURE_SPEECH_KEY 与 FPAI_AZURE_SPEECH_REGION');
    process.exit(4);
  }

  console.log('[fpai:mm1b1:live] READY — 请按 B1_LIVE_GATE_RUNBOOK.md 手动执行以下步骤:');
  console.log('    1) 打开两个终端');
  console.log('    2) 终端 A: pnpm --filter @family/avatar-lab dev:server   # 启动 fpai-realtime-server');
  console.log('    3) 终端 B: pnpm --filter @family/avatar-lab dev          # 启动 vite');
  console.log('    4) 浏览器访问 http://127.0.0.1:4173/mm1b1.html?real_speech=YES');
  console.log('    5) 按 B1_LIVE_GATE_RUNBOOK.md 里 L1..L10 逐项 human gate 验证');
  console.log('[fpai:mm1b1:live] 本命令不 spawn 任何进程, 不发起任何网络调用');
  process.exit(0);
}

main();
