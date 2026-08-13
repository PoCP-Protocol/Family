/**
 * MM1-B1.1 · Azure Speech SDK loader (isolated)
 *
 * 只此文件允许 `require('microsoft-cognitiveservices-speech-sdk')`。
 * 其它 speech-gateway 文件通过本 loader 得到强类型 handle。
 *
 * 目的:
 *   1. 单点集中管理 SDK 版本 / API 表面依赖,便于 R11 SDK 隔离扫描。
 *   2. 允许惰性加载 (test / no-cred 场景可完全不 require SDK)。
 *   3. 提供 provider-neutral 类型别名,业务代码不直接指向 SDK 类型。
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */

// 明确使用 typeof import 的方式,只在编译时看到类型;运行时通过 require 惰性加载。
// 若 monorepo 里未安装 SDK, 类型解析也不会挂 (因为 typescript "moduleResolution: node"
// 允许 typeof import 失败 fallback 到 any,不阻止 typecheck)。
export type AzureSdk = typeof import('microsoft-cognitiveservices-speech-sdk');

let cached: AzureSdk | null = null;

/**
 * 惰性加载 Azure SDK。
 *
 * 契约:
 *   - 只在 server-side 调用。
 *   - 若模块不存在, 抛出 `AZURE_SDK_NOT_INSTALLED`。调用方(transport 构造)必须捕获
 *     并把它翻译为 `BLOCKED_MISSING_CREDENTIAL` 或专门的 BLOCKER 状态,不让 orchestrator
 *     直接看到 raw Error。
 */
export function loadAzureSdk(): AzureSdk {
  if (cached) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: AzureSdk = require('microsoft-cognitiveservices-speech-sdk');
    cached = mod;
    return mod;
  } catch (err: any) {
    const e = new Error('AZURE_SDK_NOT_INSTALLED');
    (e as any).cause = err;
    throw e;
  }
}

/** 仅测试环境使用,允许注入 fake SDK 或清除缓存。 */
export function __resetAzureSdkForTest(nextSdk?: AzureSdk | null): void {
  cached = nextSdk ?? null;
}
