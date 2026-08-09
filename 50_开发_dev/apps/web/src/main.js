import { createGrowthApp } from './app.js';

const root = /** @type {HTMLElement | null} */ (document.querySelector('#app'));

if (!root) {
  throw new Error('Missing #app root element.');
}

createGrowthApp(root);
