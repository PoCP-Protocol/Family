import { createDirtyCoreDataset, discoverFelsReadOnly } from './fels1-core';

const runtime = createDirtyCoreDataset();
console.log(JSON.stringify({ dataset: 'dirty-core', discovery: discoverFelsReadOnly(runtime) }, null, 2));