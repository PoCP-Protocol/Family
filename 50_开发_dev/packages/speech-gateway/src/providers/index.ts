/**
 * MM1-B0 · Speech Gateway Providers barrel.
 *
 * 只导出 registry 契约与 Fake baseline。任何真实 provider 的 SDK 引入
 * 都必须放在独立文件下(如 `./aliyun/*` 或 `./azure/*`),并只在需要时被
 * bootstrap 显式注册。禁止在这里 side-effect import 真实 SDK。
 */

export * from './registry';
export * from './fake';
