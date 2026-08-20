import { createGrowthApp, defaultConfig } from './app.js';
import { createWafCommunityApp } from './waf.js';
import { createPrincipalApp, defaultPrincipalConfig } from './principal.js';
import { createTestLoopApp, defaultTestLoopConfig } from './test-loop.js';

const root = /** @type {HTMLElement | null} */ (document.querySelector('#app'));

if (!root) {
  throw new Error('Missing #app root element.');
}

const searchParams = new URLSearchParams(window.location.search);

if (searchParams.get('product') === 'test-loop' || window.location.hash === '#test-loop') {
  // ARCH-GO-TEST-FULL-FUNCTION-001: DEV synthetic internal demo only; server capability gate remains authoritative.
  createTestLoopApp(root, {
    ...defaultTestLoopConfig,
    apiBaseUrl: searchParams.get('apiBaseUrl') ?? defaultTestLoopConfig.apiBaseUrl,
    familyId: searchParams.get('familyId') ?? defaultTestLoopConfig.familyId,
    initialPage: searchParams.get('page') ?? undefined,
    onboardingId: searchParams.get('onboardingId') ?? undefined,
    // Internal synthetic/dev demo only. The value is intentionally opt-in and
    // the Bearer is read from sessionStorage rather than embedded in a page.
    firstSliceApiMode: searchParams.get('firstSliceApi') === 'synthetic-api' ? 'synthetic-api' : 'disabled',
    coreGrowthApiMode: searchParams.get('coreGrowthApi') === 'synthetic-api' ? 'synthetic-api' : 'disabled',
    platformSurfacesApiMode: searchParams.get('platformSurfacesApi') === 'synthetic-api' ? 'synthetic-api' : 'disabled',
    commerceCatalogApiMode: searchParams.get('commerceCatalogApi') === 'synthetic-api' ? 'synthetic-api' : 'disabled',
    membershipProjectionApiMode: searchParams.get('membershipProjectionApi') === 'synthetic-api' ? 'synthetic-api' : 'disabled',
    serviceRecordsApiMode: searchParams.get('serviceRecordsApi') === 'synthetic-api' ? 'synthetic-api' : 'disabled',
    authToken: window.sessionStorage.getItem('family-ui01-ui09-synthetic-bearer') ?? undefined,
    // Local DEV browser harness may provide an existing test actor; it is not embedded in the page.
    authActorId: searchParams.get('actorPersonId') ?? undefined,
  });
} else if (searchParams.get('product') === 'principal' || window.location.hash === '#principal') {
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
} else {
  const config = {
    ...defaultConfig,
    apiBaseUrl: searchParams.get('apiBaseUrl') ?? defaultConfig.apiBaseUrl,
    actorPersonId: searchParams.get('actorPersonId') ?? defaultConfig.actorPersonId,
    familyId: searchParams.get('familyId') ?? defaultConfig.familyId,
    childId: searchParams.get('childId') ?? defaultConfig.childId,
    guardianPersonId: searchParams.get('guardianPersonId') ?? defaultConfig.guardianPersonId,
    authToken: window.sessionStorage.getItem('family-ui01-ui09-synthetic-bearer') ?? undefined,
    wave2ApiMode: searchParams.get('wave2ApiMode') === 'real-api' ? 'real-api' : defaultConfig.wave2ApiMode,
  };

  createGrowthApp(root, config);
}
