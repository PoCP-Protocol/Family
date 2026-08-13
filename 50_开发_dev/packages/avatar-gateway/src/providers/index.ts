/**
 * MM1-B0 · Avatar Gateway Providers barrel.
 * 只导出 registry 契约与 Fake baseline。禁止在此 side-effect import 真实 SDK。
 */

export * from './registry';
export * from './fake';

// MM1-B1 · Family-owned local 2D avatar (§15/§25/§33/§34)
export * from './familyLocal2d';
