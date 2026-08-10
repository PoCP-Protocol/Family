import { createGrowthApp, defaultConfig } from './app.js';

const root = /** @type {HTMLElement | null} */ (document.querySelector('#app'));

if (!root) {
  throw new Error('Missing #app root element.');
}

const searchParams = new URLSearchParams(window.location.search);
const config = {
  ...defaultConfig,
  apiBaseUrl: searchParams.get('apiBaseUrl') ?? defaultConfig.apiBaseUrl,
  actorPersonId: searchParams.get('actorPersonId') ?? defaultConfig.actorPersonId,
  familyId: searchParams.get('familyId') ?? defaultConfig.familyId,
  childId: searchParams.get('childId') ?? defaultConfig.childId,
  guardianPersonId: searchParams.get('guardianPersonId') ?? defaultConfig.guardianPersonId,
};

createGrowthApp(root, config);
