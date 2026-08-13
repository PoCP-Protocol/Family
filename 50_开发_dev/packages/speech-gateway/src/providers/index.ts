/**
 * MM1-B0 · Speech Gateway Providers barrel.
 *
 * 只导出 registry 契约与 Fake baseline。任何真实 provider 的 SDK 引入
 * 都必须放在独立文件下(如 `./aliyun/*` 或 `./azure/*`),并只在需要时被
 * bootstrap 显式注册。禁止在这里 side-effect import 真实 SDK。
 */

export * from './registry';
export * from './fake';

// MM1-B1 · Family-owned modality-adapter surface (see FPAI_MM1B_PROVIDER_SELECTION_V1 §11.A).
// 这些模块本身不 import 任何真实 SDK; 真实 SDK 只能出现在 provider 私有 transport 实现里。
export * from './audioNormalizer';
export * from './visemeMapper';
export * from './speechStyleMapper';
export * from './speechStyleFallback';
export * from './azure/secretReader';
export * from './azure/azureSpeechStt';
export * from './azure/azureSpeechTts';
export * from './azure/sdk';
export * from './composition/speechCompositionRoot';
export * from './devFallbackPolicy';
