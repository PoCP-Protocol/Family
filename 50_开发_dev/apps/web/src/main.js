import { createGrowthApp, defaultConfig } from './app.js';
import { createWafCommunityApp } from './waf.js';
import { createPrincipalApp, defaultPrincipalConfig } from './principal.js';
import { mountFamilyPlatform } from './platform/app/family-platform-host';

const root = /** @type {HTMLElement | null} */ (document.querySelector('#app'));

if (!root) {
  throw new Error('Missing #app root element.');
}

const searchParams = new URLSearchParams(window.location.search);

if (searchParams.get('product') === 'principal' || window.location.hash === '#principal') {
  // W2-101 消费端法咪莉校长(WF1-C 内部级);确定性、零外呼、x-actor-id。
  createPrincipalApp(root, {
    ...defaultPrincipalConfig,
    apiBaseUrl: searchParams.get('apiBaseUrl') ?? defaultPrincipalConfig.apiBaseUrl,
    actorPersonId: searchParams.get('actorPersonId') ?? defaultPrincipalConfig.actorPersonId,
    familyId: searchParams.get('familyId') ?? defaultPrincipalConfig.familyId,
    childId: searchParams.get('childId') ?? defaultPrincipalConfig.childId,
    onboardingId: searchParams.get('onboardingId') ?? undefined,
    priorityId: searchParams.get('priorityId') ?? undefined,
  });
} else if (searchParams.get('product') === 'waf' || window.location.hash === '#waf') {
  createWafCommunityApp(root);
} else if (searchParams.get('product') === 'legacy-growth' || window.location.hash === '#legacy-growth') {
  // 仅作为既有 M2/Wave 演示兼容入口；默认 Family 体验不再从 URL 获取 actor/family/child 标识。
  const config = {
    ...defaultConfig,
    apiBaseUrl: searchParams.get('apiBaseUrl') ?? defaultConfig.apiBaseUrl,
    actorPersonId: searchParams.get('actorPersonId') ?? defaultConfig.actorPersonId,
    familyId: searchParams.get('familyId') ?? defaultConfig.familyId,
    childId: searchParams.get('childId') ?? defaultConfig.childId,
    guardianPersonId: searchParams.get('guardianPersonId') ?? defaultConfig.guardianPersonId,
    wave2ApiMode: searchParams.get('wave2ApiMode') === 'real-api' ? 'real-api' : defaultConfig.wave2ApiMode,
  };
  createGrowthApp(root, config);
} else {
  // 默认消费者入口：HttpOnly cookie → 服务端家庭上下文 → Family Platform。
  mountFamilyPlatform(root, { apiBaseUrl: searchParams.get('apiBaseUrl') ?? defaultConfig.apiBaseUrl });
}
