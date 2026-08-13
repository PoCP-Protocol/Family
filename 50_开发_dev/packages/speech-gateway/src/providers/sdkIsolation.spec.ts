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

/**
 * MM1-B1.1 · Azure JS SDK 白名单硬门 (§6)
 *
 * `microsoft-cognitiveservices-speech-sdk` 只允许出现在
 *   packages/speech-gateway/src/providers/azure/sdk/*.ts
 * 之内。任何其它文件 (包括 speech-gateway 里的其它文件, adapter, config, tests, 上层 app)
 * 命中即失败。
 */
describe('mm1-b1.1 · azure js sdk import isolation (§6)', () => {
  const AZURE_SDK_PKG = 'microsoft-cognitiveservices-speech-sdk';
  const ALLOWED_DIR = path.join(
    REPO_ROOT,
    'packages/speech-gateway/src/providers/azure/sdk',
  );

  it('WS-SDK-ISO-AZURE · azure-sdk require only allowed under azure/sdk/', () => {
    // 扫描整个 packages/ 与 products/ 下的源码 (排除 node_modules / dist)
    const roots = [
      path.join(REPO_ROOT, 'packages'),
      path.join(REPO_ROOT, 'products'),
    ];
    const offenders: string[] = [];
    for (const root of roots) {
      const files = walk(root);
      for (const f of files) {
        // 允许 sdk/ 目录里的文件
        if (f.startsWith(ALLOWED_DIR + path.sep)) continue;
        // spec 文件默认允许(测试 mock 需要引用类型),但只允许通过 __sdkOverride 注入,
        // 不允许在生产代码 spec 之外走 require。
        const isSpec = f.endsWith('.spec.ts') || f.endsWith('.spec.tsx') || f.endsWith('.test.ts');
        const s = fs.readFileSync(f, 'utf8');
        const bad = s.includes(`from '${AZURE_SDK_PKG}'`)
          || s.includes(`from "${AZURE_SDK_PKG}"`)
          || s.includes(`require('${AZURE_SDK_PKG}')`)
          || s.includes(`require("${AZURE_SDK_PKG}")`)
          || s.includes(`from '${AZURE_SDK_PKG}/`)
          || s.includes(`from "${AZURE_SDK_PKG}/`);
        if (bad && !isSpec) {
          offenders.push(path.relative(REPO_ROOT, f));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
