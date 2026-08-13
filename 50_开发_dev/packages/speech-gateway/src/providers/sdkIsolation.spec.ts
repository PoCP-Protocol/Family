/**
 * MM1-B0 · SDK Isolation Guardrail (Risk R11)
 *
 * 保证 provider SDK 只允许出现在 gateway providers 目录,
 * 不许出现在 principal-ai / fpai-multimodal-contracts / fpai-performance-planner /
 * realtime-session / avatar-lab runtime。
 *
 * MM1-B0 阶段不引入任何真实 SDK,所以扫描应该都为 0。
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
// = 50_开发_dev

const FORBIDDEN_DIRS = [
  'packages/principal-ai/src',
  'packages/fpai-multimodal-contracts/src',
  'packages/fpai-performance-planner/src',
  'packages/realtime-session/src',
  'products/famili-principal/apps/avatar-lab/src',
];

// 已知真实 SDK 包名(用于扫描 import / require 语句)。
// MM1-B0 应全都不存在;若未来某 SDK 首次接入必须只在 speech-gateway/providers 或 avatar-gateway/providers 出现。
const KNOWN_SDK_PACKAGES = [
  '@alicloud/',
  'tencentcloud-sdk',
  'microsoft-cognitiveservices-speech-sdk',
  '@deepgram/',
  'elevenlabs',
  '@heygen/',
  'd-id',
  '@volcengine/',
];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, out);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
      out.push(p);
    }
  }
  return out;
}

describe('mm1-b0 · sdk isolation guardrail (R11)', () => {
  for (const rel of FORBIDDEN_DIRS) {
    it(`WS-SDK-ISO-${rel} · no real provider SDK imports allowed`, () => {
      const dir = path.join(REPO_ROOT, rel);
      const files = walk(dir);
      const offenders: Array<{ file: string; pkg: string }> = [];
      for (const f of files) {
        const s = fs.readFileSync(f, 'utf8');
        for (const pkg of KNOWN_SDK_PACKAGES) {
          if (s.includes(`from '${pkg}`) || s.includes(`from "${pkg}`) || s.includes(`require('${pkg}`) || s.includes(`require("${pkg}`)) {
            offenders.push({ file: path.relative(REPO_ROOT, f), pkg });
          }
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});
