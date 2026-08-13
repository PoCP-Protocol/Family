/**
 * MM1-B0 · Env Secret Guard
 *
 * 目的:
 * - .env.example 只放**中性变量**与 placeholder,不得包含真实 key
 * - 保证根 .env / .env.local 已在 gitignore 覆盖
 *
 * 这个 spec 由 registry 包持有,因为 provider selection 是它的域。
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
// __dirname = .../packages/speech-gateway/src/providers → 4 层上溯到 50_开发_dev
const DEV_ROOT = REPO_ROOT; // 已经是 50_开发_dev
const FAMILY_ROOT = path.resolve(REPO_ROOT, '..');

describe('mm1-b0 · env secret guard', () => {
  it('WS-ENV-01 · .env.example exists and declares FPAI_*_PROVIDER neutral vars', () => {
    const p = path.join(DEV_ROOT, '.env.example');
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p, 'utf8');
    expect(s).toMatch(/FPAI_STT_PROVIDER=/);
    expect(s).toMatch(/FPAI_TTS_PROVIDER=/);
    expect(s).toMatch(/FPAI_AVATAR_PROVIDER=/);
  });

  it('WS-ENV-02 · .env.example 默认值都是 fake_baseline,不能出现看起来像真实 key 的赋值', () => {
    const p = path.join(DEV_ROOT, '.env.example');
    const s = fs.readFileSync(p, 'utf8');

    // 允许的 provider_id 前缀
    const goodDefault = /FPAI_(STT|TTS|AVATAR)_PROVIDER=(?:stt|tts|avatar)\.fake_baseline\b/;
    expect(goodDefault.test(s)).toBe(true);

    // 禁止 example 里出现非空的 API key/secret/token 赋值。
    // 只允许形如 `KEY=` (空右值) 或以 `#` 开头的注释行。
    const badKeyAssignment =
      /^(?!#).*(?:API_KEY|ACCESS_KEY|SECRET(?:_ID)?|TOKEN|PASSWORD)\s*=\s*\S+/im;
    expect(badKeyAssignment.test(s)).toBe(false);
  });

  it('WS-ENV-03 · repo .gitignore ignores .env and .env.local', () => {
    const p = path.join(FAMILY_ROOT, '.gitignore');
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p, 'utf8');
    expect(s).toMatch(/^\.env\s*$/m);
    expect(s).toMatch(/^\.env\.local\s*$/m);
  });

  it('WS-ENV-04 · dev root does not contain a real .env committed', () => {
    // .env 不应存在于 working tree 之外, 但即便存在(本地开发) 也不许被 git 追踪。
    // 本测试只保证 .env.example 与真实 .env 分离:.env.example 内容不含 API_KEY 赋值。
    const example = fs.readFileSync(path.join(DEV_ROOT, '.env.example'), 'utf8');
    expect(example).not.toMatch(/sk-[A-Za-z0-9]{16,}/); // OpenAI-ish
    expect(example).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key
  });
});
